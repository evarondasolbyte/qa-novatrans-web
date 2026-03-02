// CARGO VARIABLES DE ENTORNO DESDE .env
// Motivo: no quiero hardcodear secretos (private key de la SA, spreadsheet ID, etc.)
// En CI uso variables de entorno del runner (GitHub Actions, GitLab, Azure DevOps...).
require('dotenv').config();

const { defineConfig } = require('cypress');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { execFileSync } = require('child_process');

// ==== GOOGLE SHEETS POR REST CON SERVICE ACCOUNT ====
// Uso GoogleAuth para obtener un Bearer token (OAuth2) a partir de credenciales de Service Account.
// Ventaja: no necesito cliente oficial de Sheets (googleapis); la llamada es 100% REST.
const { GoogleAuth } = require('google-auth-library');

// fetchCompat(hacer peticiones HTTP): usa fetch nativo si está disponible; si no, hace import dinámico de node-fetch.
// Así evito añadir node-fetch si el runtime ya trae fetch (Node 18+ lo trae).
const fetchCompat = (...args) =>
  (global.fetch ? global.fetch(...args) : import('node-fetch').then(({ default: f }) => f(...args)));

module.exports = defineConfig({
  // Variables útiles para los tests (sin hardcodear usuario/rutas).
  // En Windows, USERPROFILE suele ser: C:\Users\<usuario>
  // OJO: no meter DOCUMENTO_PRUEBA_PATH aquí con valor vacío, porque pisaría cypress.env.json.
  env: {
    DESKTOP_DIR: process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Desktop') : '',
    // Muchos equipos redirigen Escritorio a OneDrive
    DESKTOP_DIR_ONEDRIVE: (
      process.env.OneDrive
        ? path.join(process.env.OneDrive, 'Desktop')
        : (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'OneDrive', 'Desktop') : '')
    ),
    DOCUMENTO_PRUEBA_FILENAME: 'documento prueba.txt',
    // Si se define por variable de entorno del sistema, sobreescribe lo de cypress.env.json
    ...(process.env.DOCUMENTO_PRUEBA_PATH ? { DOCUMENTO_PRUEBA_PATH: process.env.DOCUMENTO_PRUEBA_PATH } : {})
  },
  e2e: {
    // URL base de la app que estoy probando (Novatrans). Evito repetir en los tests.
    baseUrl: 'https://novatrans-web-2mhoc.ondigitalocean.app',
    // Entornos lentos: a veces el evento `load` tarda mucho (scripts/estilos).
    pageLoadTimeout: 180000,
    // Configurar carpeta de descargas para que los archivos se guarden en cypress/downloads
    downloadsFolder: path.resolve(__dirname, 'cypress/downloads'),

    setupNodeEvents(on, config) {
      // Carpeta local para reportes Excel cuando RESULT_SINK=excel (fallback o offline).
      // Importante en local: aseguro que la ruta exista para no fallar al escribir.
      const carpetaResultados = path.resolve(__dirname, 'cypress/resultados');
      if (!fs.existsSync(carpetaResultados)) fs.mkdirSync(carpetaResultados, { recursive: true });

      // Asegurar que la carpeta de descargas existe
      const carpetaDownloads = path.resolve(__dirname, 'cypress/downloads');
      if (!fs.existsSync(carpetaDownloads)) fs.mkdirSync(carpetaDownloads, { recursive: true });

      on('task', {
        /**
         * leerArchivoBase64
         * Lee un archivo local (ruta absoluta) y devuelve base64 + nombre.
         * Útil para simular selección de archivo via showOpenFilePicker (sin diálogo nativo).
         */
        leerArchivoBase64({ filePath } = {}) {
          try {
            if (!filePath) return null;
            const p = String(filePath);
            if (!fs.existsSync(p)) return null;
            const buf = fs.readFileSync(p);
            const name = path.basename(p);
            // mime simple por extensión
            const ext = (path.extname(name) || '').toLowerCase();
            const mime =
              ext === '.txt' ? 'text/plain' :
                ext === '.pdf' ? 'application/pdf' :
                  ext === '.png' ? 'image/png' :
                    ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                      'application/octet-stream';
            return { base64: buf.toString('base64'), name, mime };
          } catch (e) {
            return null;
          }
        },
        /**
         * seleccionarArchivoDialogoWindows
         * Automatiza el diálogo nativo "Abrir/Open" en Windows (NO DOM) para seleccionar archivo.
         * Nota: esto es frágil y depende de foco/idioma del sistema, pero es la única forma de pulsar "Abrir".
         */
        seleccionarArchivoDialogoWindows({ filePath, timeoutMs = 20000 } = {}) {
          if (!filePath) return false;

          const fp = String(filePath).replace(/'/g, "''");
          const to = Number(timeoutMs) || 20000;

          const ps = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class Win32 {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern int GetClassName(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@

function Get-TopDialogs {
  $dialogs = @()
  [Win32]::EnumWindows({ param($h,$l)
    if(-not [Win32]::IsWindowVisible($h)) { return $true }
    $cls = New-Object System.Text.StringBuilder 256
    [void][Win32]::GetClassName($h, $cls, $cls.Capacity)
    if($cls.ToString() -ne '#32770') { return $true } # common dialog class
    $txt = New-Object System.Text.StringBuilder 512
    [void][Win32]::GetWindowText($h, $txt, $txt.Capacity)
    $dialogs += [PSCustomObject]@{ Handle = $h; Title = $txt.ToString() }
    return $true
  }, [IntPtr]::Zero) | Out-Null
  return $dialogs
}

$end = (Get-Date).AddMilliseconds(${to})
$target = $null
while((Get-Date) -lt $end -and -not $target){
  $ds = Get-TopDialogs
  $target = $ds | Where-Object { $_.Title -match 'Abrir|Open' } | Select-Object -First 1
  if(-not $target){ Start-Sleep -Milliseconds 200 }
}
if(-not $target){
  # Último fallback: si hay algún #32770 visible, usamos el primero
  $ds = Get-TopDialogs
  $target = $ds | Select-Object -First 1
}
if(-not $target){ exit 2 }

[void][Win32]::SetForegroundWindow($target.Handle)
Start-Sleep -Milliseconds 200

# Alt+D -> barra de dirección, pegar ruta completa, Enter (abre/selecciona)
[System.Windows.Forms.SendKeys]::SendWait('%d')
Start-Sleep -Milliseconds 150
[System.Windows.Forms.SendKeys]::SendWait('${fp}')
Start-Sleep -Milliseconds 150
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
Start-Sleep -Milliseconds 200
# A veces hace falta un segundo Enter para confirmar "Abrir"
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
`;

          try {
            execFileSync('powershell.exe', [
              '-NoProfile',
              '-ExecutionPolicy', 'Bypass',
              '-Command', ps
            ], {
              stdio: 'ignore',
              // Evita que el runner se quede colgado si el diálogo no aparece o SendKeys no funciona
              timeout: to + 3000,
              windowsHide: true,
            });
            return true;
          } catch (e) {
            return false;
          }
        },
        /**
         * guardarEnExcel
         * - Registra cada test (fila granular) en Google Sheets o Excel local.
         * - Se selecciona el "sink" por variable de entorno RESULT_SINK:
         *    - 'sheets' => escribe vía REST en Google Sheets (hoja "Log")
         *    - 'excel'  => escribe en cypress/resultados/reportes_pruebas_novatrans.xlsx
         *
         * Campos esperados:
         *   numero: ID del caso (TCxxx)
         *   nombre: nombre descriptivo del caso
         *   esperado / obtenido: textos de comparación
         *   resultado: 'OK' o 'ERROR'
         *   fechaHora: opcional (si no viene, pongo timestamp ISO friendly)
         *   archivo: permite elegir nombre de Excel local (opcional)
         *   pantalla: módulo/pantalla a la que pertenece el caso
         *   observacion: notas adicionales (stacktrace resumido, causa, etc.)
         *   ok/warning/error: solo para "Resultados Pruebas"
         */
        async guardarEnExcel({ numero, nombre, esperado, obtenido, resultado, fechaHora, archivo, pantalla, observacion, ok, warning, error }) {
          // Default a sheets para usar Google Sheets
          const sink = process.env.RESULT_SINK || 'sheets';

          // ============== SINK: GOOGLE SHEETS ==============
          if (sink === 'sheets') {
            // 1) Autenticación OAuth2 con Service Account
            const auth = new GoogleAuth({
              credentials: {
                client_email: process.env.GS_CLIENT_EMAIL,
                private_key: (process.env.GS_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
              },
              scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            const client = await auth.getClient();
            const { token } = await client.getAccessToken();
            if (!token) throw new Error('No se pudo obtener access token');

            // Helper: escribe en la siguiente fila REAL (debajo del último registro)
            const appendExactRow = async ({ sheetName, endColLetter, rowValues }) => {
              // Leo la columna A para contar filas reales (incluye cabecera si existe)
              const getUrl =
                `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GS_SPREADSHEET_ID}/values/` +
                `${encodeURIComponent(`${sheetName}!A:A`)}?majorDimension=COLUMNS`;
              const getRes = await fetchCompat(getUrl, { headers: { Authorization: `Bearer ${token}` } });
              const getJson = await getRes.json();
              const colA = (getJson.values && getJson.values[0]) ? getJson.values[0] : [];
              const currentRows = colA.length;       // nº de filas actualmente ocupadas en A
              const nextRow = currentRows + 1;       // siguiente fila exacta

              // PUT en el rango exacto (RAW)
              const range = `${sheetName}!A${nextRow}:${endColLetter}${nextRow}`;
              const putUrl =
                `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GS_SPREADSHEET_ID}/values/` +
                `${encodeURIComponent(range)}?valueInputOption=RAW`;
              const putRes = await fetchCompat(putUrl, {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ values: [rowValues] }),
              });
              const putTxt = await putRes.text();
              if (!putRes.ok) throw new Error(`Sheets REST error (update ${range}): ${putRes.status} ${putTxt}`);
            };

            // 2) Construir fila y escribir en hoja exacta
            if (pantalla === 'Resultados Pruebas') {
              // Formato especial Resumen
              const row = [
                numero ?? '',                                                   // A: Test-ID
                (fechaHora || new Date().toISOString().replace('T', ' ').substring(0, 19)), // B: Fecha y Hora
                esperado ?? '',                                                 // C: Test
                obtenido ?? '',                                                 // D: Nombre
                resultado ?? '',                                                // E: Resultado
                (ok ?? '').toString(),                                          // F: OK
                (warning ?? '').toString(),                                     // G: WARNING
                (error ?? '').toString(),                                       // H: ERROR
              ];
              await appendExactRow({ sheetName: 'Resultados Pruebas', endColLetter: 'H', rowValues: row });
            } else {
              // Formato estándar para "Log"
              const row = [
                numero ?? '',                                                   // A: Nº
                nombre ?? '',                                                   // B: Nombre
                esperado ?? '',                                                 // C: Resultado Esperado
                obtenido ?? '',                                                 // D: Resultado Obtenido
                resultado ?? '',                                                // E: Resultado
                (fechaHora || new Date().toISOString().replace('T', ' ').substring(0, 19)), // F: Fecha y Hora
                pantalla || '',                                                 // G: Test (pantalla)
                observacion || ''                                               // H: Observaciones
              ];
              await appendExactRow({ sheetName: 'Log', endColLetter: 'H', rowValues: row });
            }
            return 'OK';
          }

          // ============== SINK: EXCEL LOCAL ==============
          // Nombre de archivo por defecto (permite override con 'archivo').
          const nombreArchivo = archivo || 'reportes_pruebas_novatrans.xlsx';
          const rutaExcel = path.join(carpetaResultados, nombreArchivo);

          let workbook, worksheet;
          if (fs.existsSync(rutaExcel)) {
            workbook = xlsx.readFile(rutaExcel);
          } else {
            workbook = xlsx.utils.book_new();
          }

          // Determinar qué hoja usar basado en el parámetro 'pantalla'
          if (pantalla === 'Resultados Pruebas') {
            console.log(`Guardando en "Resultados Pruebas": numero=${numero}, nombre=${nombre}, esperado=${esperado}, obtenido=${obtenido}, resultado=${resultado}, ok=${ok}, warning=${warning}, error=${error}`);

            if (workbook.SheetNames.includes('Resultados Pruebas')) {
              worksheet = workbook.Sheets['Resultados Pruebas'];
            } else {
              worksheet = xlsx.utils.aoa_to_sheet([[
                'Test-ID', 'Fecha y Hora', 'Test', 'Nombre', 'Resultado', 'OK', 'WARNING', 'ERROR'
              ]]);
              xlsx.utils.book_append_sheet(workbook, worksheet, 'Resultados Pruebas');
            }

            const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
            data.push([numero, fechaHora || new Date().toISOString().replace('T', ' ').substring(0, 19), esperado, obtenido, resultado, ok || '', warning || '', error || '']);
            const nuevaHoja = xlsx.utils.aoa_to_sheet(data);
            workbook.Sheets['Resultados Pruebas'] = nuevaHoja;
          } else {
            if (workbook.SheetNames.includes('Log')) {
              worksheet = workbook.Sheets['Log'];
            } else {
              worksheet = xlsx.utils.aoa_to_sheet([[
                'Nº', 'Nombre', 'Resultado Esperado', 'Resultado Obtenido', 'Resultado', 'Fecha y Hora', 'Test', 'Observaciones'
              ]]);
              xlsx.utils.book_append_sheet(workbook, worksheet, 'Log');
            }

            const fechaHoraFinal = fechaHora || new Date().toISOString().replace('T', ' ').substring(0, 19);
            const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
            data.push([numero, nombre, esperado, obtenido, resultado, fechaHoraFinal, pantalla || '', observacion || '']);
            const nuevaHoja = xlsx.utils.aoa_to_sheet(data);
            workbook.Sheets['Log'] = nuevaHoja;
          }

          xlsx.writeFile(workbook, rutaExcel);
          return 'OK';
        },

        /**
         * guardarEnLog
         * - Inserta un registro individual en la hoja "Log" con el formato correcto.
         * - En Sheets escribe en el nuevo Google Sheets separado para Log (A:I).
         * - En Excel local crea/usa una hoja llamada "Log".
         *
         * Campos:
         *   testId: ID único del test
         *   test: nombre de la pantalla
         *   paso: número del paso (TC001, TC002, etc.)
         *   fechaHora: fecha y hora de ejecución
         *   resultado: OK/ERROR/WARNING
         *   nombre: nombre del test
         *   esperado: resultado esperado
         *   obtenido: resultado obtenido
         *   observacion: observaciones
         */
        async guardarEnLog({ testId, test, paso, fechaHora, resultado, nombre, esperado, obtenido, observacion }) {
          const sink = process.env.RESULT_SINK || 'sheets';

          // ============== SINK: GOOGLE SHEETS ==============
          if (sink === 'sheets') {
            const auth = new GoogleAuth({
              credentials: {
                client_email: process.env.GS_CLIENT_EMAIL,
                private_key: (process.env.GS_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
              },
              scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            const client = await auth.getClient();
            const { token } = await client.getAccessToken();
            if (!token) throw new Error('No se pudo obtener access token');

            // Helper común: escribe en la fila exacta debajo del último registro
            const appendExactRow = async ({ sheetName, endColLetter, rowValues, spreadsheetId }) => {
              const getUrl =
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/` +
                `${encodeURIComponent(`${sheetName}!A:A`)}?majorDimension=COLUMNS`;
              const getRes = await fetchCompat(getUrl, { headers: { Authorization: `Bearer ${token}` } });
              const getJson = await getRes.json();
              const colA = (getJson.values && getJson.values[0]) ? getJson.values[0] : [];
              const currentRows = colA.length;
              const nextRow = currentRows + 1;

              const range = `${sheetName}!A${nextRow}:${endColLetter}${nextRow}`;
              const putUrl =
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/` +
                `${encodeURIComponent(range)}?valueInputOption=RAW`;
              const putRes = await fetchCompat(putUrl, {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ values: [rowValues] }),
              });
              const putTxt = await putRes.text();
              if (!putRes.ok) throw new Error(`Sheets REST error (update ${range}): ${putRes.status} ${putTxt}`);
            };

            // A: Test-ID, B: Test, C: Paso, D: Fecha y Hora, E: Resultado, F: Nombre, G: Esperado, H: Obtenido, I: Observaciones
            const row = [
              testId ?? '',
              test ?? '',
              paso ?? '',
              fechaHora ?? '',
              resultado ?? '',
              nombre ?? '',
              esperado ?? '',
              obtenido ?? '',
              observacion ?? ''
            ];

            // Usar el nuevo Google Sheets ID para el Log
            const logSpreadsheetId = '1WbRsyBxk-soCln1A7K_vh5VlBNJ-RYAphzLxe-EseE8';
            await appendExactRow({ sheetName: 'Log', endColLetter: 'I', rowValues: row, spreadsheetId: logSpreadsheetId });
            return 'OK';
          }

          // ============== SINK: EXCEL LOCAL ==============
          const nombreArchivo = 'reportes_pruebas_novatrans.xlsx';
          const rutaExcel = path.join(carpetaResultados, nombreArchivo);

          let workbook, worksheet;
          if (fs.existsSync(rutaExcel)) {
            workbook = xlsx.readFile(rutaExcel);
            if (workbook.SheetNames.includes('Log')) {
              worksheet = workbook.Sheets['Log'];
            } else {
              worksheet = xlsx.utils.aoa_to_sheet([[
                'Test-ID', 'Test', 'Paso', 'Fecha y Hora', 'Resultado', 'Nombre', 'Resultado Esperado', 'Resultado Obtenido', 'Observaciones'
              ]]);
              xlsx.utils.book_append_sheet(workbook, worksheet, 'Log');
            }
          } else {
            workbook = xlsx.utils.book_new();
            worksheet = xlsx.utils.aoa_to_sheet([[
              'Test-ID', 'Test', 'Paso', 'Fecha y Hora', 'Resultado', 'Nombre', 'Resultado Esperado', 'Resultado Obtenido', 'Observaciones'
            ]]);
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Log');
          }

          const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
          data.push([testId, test, paso, fechaHora, resultado, nombre, esperado, obtenido, observacion]);
          const nuevaHoja = xlsx.utils.aoa_to_sheet(data);
          workbook.Sheets['Log'] = nuevaHoja;

          xlsx.writeFile(workbook, rutaExcel);
          return 'OK';
        },

        /**
         * leerDatosGoogleSheetsAPI
         * Lee datos de Google Sheets usando la API directamente (más confiable que CSV export)
         */
        async leerDatosGoogleSheetsAPI({ hoja = 'Datos' }) {
          try {
            const spreadsheetId = process.env.GS_SPREADSHEET_ID || '1m3B_HFT8fJduBxloh8Kj36bVr0hwnj5TioUHAq5O7Zs';

            // Mapa de GIDs por hoja (mismo que en excelReader.js)
            const SHEET_GIDS = {
              'LOGIN': '1766248160',
              'CONFIGURACIÓN-PERFILES': '1896958952',
              'FICHEROS-CLIENTES': '520599147',
              'FICHEROS-PROVEEDORES': '1258242411',
              'PROCESOS-PRESUPUESTOS': '1905879024',
              'PROCESOS-PLANIFICACION': '357769061',
              'TALLER Y GASTOS-REPOSTAJES': '431734268',
              'FICHEROS-TIPOS DE VEHÍCULO': '299624855',
              'FICHEROS-CATEGORIAS DE CONDUCTORES': '137760382',
              'FICHEROS-MULTAS': '523458683',
              'FICHEROS-SINIESTROS': '1011892651',
              'FICHEROS-TARJETAS': '1774716711',
              'FICHEROS-TELEFONOS': '77961009',
              'FICHEROS-CATEGORIAS': '1927208168',
              'FICHEROS-ALQUILERES VEHÍCULOS': '1440227046',
              'FICHEROS-FORMAS DE PAGO': '756254621',
              'ALMACEN-FAMILIAS SUBFAMILIAS ALMACENES': '96321178',
              'ALMACEN-ARTICULOS': '934160481',
              'ALMACEN-PEDIDOS': '1704715399',
              'PROCESOS-ORDENES DE CARGA': '817274383',
              'PROCESOS-RUTAS': '433035856',
              'FICHEROS-PERSONAL': '316490626',
              'FICHEROS-VEHÍCULOS': '107875668',
              'Datos': '0'
            };

            // Obtener token de autenticación
            const auth = new GoogleAuth({
              credentials: {
                client_email: process.env.GS_CLIENT_EMAIL,
                private_key: (process.env.GS_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
              },
              scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
            const client = await auth.getClient();
            const { token } = await client.getAccessToken();
            if (!token) throw new Error('No se pudo obtener access token');

            // Obtener el GID de la hoja
            const gid = SHEET_GIDS[hoja] || '0';

            // Leer datos usando la API de Google Sheets
            // Usamos un rango amplio para asegurar que leemos todas las columnas
            const range = `${hoja}!A1:CV1000`;
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?majorDimension=ROWS`;

            const res = await fetchCompat(url, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!res.ok) {
              const errorText = await res.text();
              throw new Error(`Error leyendo Google Sheets (${res.status}): ${errorText}`);
            }

            const json = await res.json();
            const rows = json.values || [];

            // Normalizar el ancho de todas las filas
            const maxCols = rows.reduce((max, row) => Math.max(max, row ? row.length : 0), 0);
            const normalized = rows.map(row => {
              const normalizedRow = Array.from(row || []);
              while (normalizedRow.length < maxCols) normalizedRow.push('');
              return normalizedRow;
            });

            return normalized;
          } catch (error) {
            console.error('[leerDatosGoogleSheetsAPI] Error:', error);
            throw error;
          }
        },

        /**
         * limpiarArchivosDescargados
         * Limpia todos los archivos .xlsx y .csv de la carpeta downloads (útil antes de una descarga nueva)
         */
        limpiarArchivosDescargados() {
          try {
            const downloadsDir = path.resolve(__dirname, 'cypress/downloads');
            if (!fs.existsSync(downloadsDir)) {
              fs.mkdirSync(downloadsDir, { recursive: true });
              return { deleted: 0 };
            }

            const files = fs.readdirSync(downloadsDir)
              .filter(f => {
                const lower = f.toLowerCase();
                return lower.endsWith('.xlsx') || lower.endsWith('.csv');
              });

            let deleted = 0;
            files.forEach(file => {
              try {
                fs.unlinkSync(path.join(downloadsDir, file));
                deleted++;
              } catch (e) {
                console.log(`[limpiarArchivosDescargados] No se pudo eliminar ${file}: ${e.message}`);
              }
            });

            console.log(`[limpiarArchivosDescargados] Eliminados ${deleted} archivos .xlsx/.csv`);
            return { deleted };
          } catch (error) {
            console.error('[limpiarArchivosDescargados] Error:', error);
            return { deleted: 0, error: error.message };
          }
        },

        /**
         * listarArchivosDescargados
         * Lista todos los archivos .xlsx y .csv en la carpeta downloads
         * Retorna: array de nombres de archivos
         */
        listarArchivosDescargados() {
          try {
            const downloadsDir = path.resolve(__dirname, 'cypress/downloads');
            console.log(`[listarArchivosDescargados] Buscando en: ${downloadsDir}`);
            
            if (!fs.existsSync(downloadsDir)) {
              fs.mkdirSync(downloadsDir, { recursive: true });
              console.log(`[listarArchivosDescargados] Carpeta creada: ${downloadsDir}`);
              return [];
            }

            const allFiles = fs.readdirSync(downloadsDir);
            console.log(`[listarArchivosDescargados] Todos los archivos en carpeta: ${allFiles.join(', ')}`);
            
            // Buscar tanto .xlsx como .csv
            const files = allFiles.filter(f => {
              const lower = f.toLowerCase();
              return lower.endsWith('.xlsx') || lower.endsWith('.csv');
            });
            console.log(`[listarArchivosDescargados] Archivos .xlsx/.csv encontrados: ${files.length} - ${files.join(', ')}`);
            
            return files;
          } catch (error) {
            console.error('[listarArchivosDescargados] Error:', error);
            return [];
          }
        },

        /**
         * leerUltimoExcelDescargado
         * Lee el último archivo Excel (.xlsx) o CSV (.csv) descargado en la carpeta downloads de Cypress
         * y devuelve las filas de datos (sin la cabecera si existe).
         * Retorna: { rows: [...], totalRows: N, fileName: '...' } o null si no hay archivos
         */
        leerUltimoExcelDescargado({ filePath = null } = {}) {
          try {
            // Helper para parsear CSV
            const parseCsvRespectingQuotes = (csv) => {
              if (csv && csv.charCodeAt(0) === 0xFEFF) csv = csv.slice(1); // quita BOM
              const lines = (csv || '').split(/\r?\n/).filter(l => l.trim() !== '');
              const rows = lines.map(line => {
                const cells = [];
                let cur = '', inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                  const ch = line[i];
                  if (ch === '"') {
                    if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
                    else { inQuotes = !inQuotes; }
                  } else if (ch === ',' && !inQuotes) {
                    cells.push(cur);
                    cur = '';
                  } else {
                    cur += ch;
                  }
                }
                cells.push(cur);
                return cells.map(c => c.trim());
              });
              return rows;
            };

            const downloadsDir = path.resolve(__dirname, 'cypress/downloads');
            // Crear la carpeta si no existe
            if (!fs.existsSync(downloadsDir)) {
              fs.mkdirSync(downloadsDir, { recursive: true });
              console.log('[leerUltimoExcelDescargado] Carpeta downloads creada');
            }

            let archivoPath;

            // Si se proporciona una ruta específica, usarla
            if (filePath) {
              archivoPath = filePath;
            } else {
              // Buscar todos los archivos .xlsx y .csv, ordenarlos por fecha de modificación (más reciente primero)
              // Priorizar archivos que empiecen con "clientes_" (para exportaciones de clientes)
              const files = fs.readdirSync(downloadsDir)
                .filter(f => {
                  const lower = f.toLowerCase();
                  return lower.endsWith('.xlsx') || lower.endsWith('.csv');
                })
                .map(name => {
                  const filePath = path.join(downloadsDir, name);
                  const stats = fs.statSync(filePath);
                  const lowerName = name.toLowerCase();
                  // Priorizar archivos que empiecen con "clientes_" (para exportaciones de clientes)
                  const isClientesFile = lowerName.startsWith('clientes_');
                  return {
                    name,
                    path: filePath,
                    time: stats.mtimeMs,
                    isClientesFile: isClientesFile
                  };
                })
                .sort((a, b) => {
                  // Primero ordenar por si es archivo de clientes (prioridad)
                  if (a.isClientesFile && !b.isClientesFile) return -1;
                  if (!a.isClientesFile && b.isClientesFile) return 1;
                  // Si ambos son del mismo tipo, ordenar por fecha (más reciente primero)
                  return b.time - a.time;
                });

              if (!files.length) {
                console.log('[leerUltimoExcelDescargado] No se encontraron archivos .xlsx o .csv');
                return null;
              }

              archivoPath = files[0].path;
              console.log(`[leerUltimoExcelDescargado] Archivo seleccionado: ${files[0].name} (modificado: ${new Date(files[0].time).toISOString()})`);
            }

            const fileName = path.basename(archivoPath);
            const isCsv = fileName.toLowerCase().endsWith('.csv');
            
            console.log(`[leerUltimoExcelDescargado] Leyendo: ${fileName} (${isCsv ? 'CSV' : 'Excel'})`);

            let rows = [];
            let sheetName = '';

            if (isCsv) {
              // Leer CSV
              const csvContent = fs.readFileSync(archivoPath, 'utf-8');
              const csvRows = parseCsvRespectingQuotes(csvContent);
              
              // Convertir array de arrays a array de objetos (usando primera fila como headers)
              if (csvRows.length > 0) {
                const headers = csvRows[0];
                rows = csvRows.slice(1).map(row => {
                  const obj = {};
                  headers.forEach((header, idx) => {
                    obj[header] = row[idx] || '';
                  });
                  return obj;
                });
              }
              sheetName = 'CSV';
            } else {
              // Leer Excel
              const workbook = xlsx.readFile(archivoPath);
              sheetName = workbook.SheetNames[0] || ''; // Primera hoja
              const worksheet = workbook.Sheets[sheetName];
              
              // Convertir a JSON (array de objetos)
              rows = xlsx.utils.sheet_to_json(worksheet, { defval: '', raw: false });
            }

            return {
              rows,
              totalRows: rows.length,
              fileName: fileName,
              sheetName: sheetName
            };
          } catch (error) {
            console.error('[leerUltimoExcelDescargado] Error:', error);
            return null;
          }
        },


      });
    },
  },
});