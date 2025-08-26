// CARGO VARIABLES DE ENTORNO DESDE .env
// Motivo: no quiero hardcodear secretos (private key de la SA, spreadsheet ID, etc.)
// En CI uso variables de entorno del runner (GitHub Actions, GitLab, Azure DevOps...).
require('dotenv').config();

const { defineConfig } = require('cypress');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// ==== GOOGLE SHEETS POR REST CON SERVICE ACCOUNT ====
// Uso GoogleAuth para obtener un Bearer token (OAuth2) a partir de credenciales de Service Account.
// Ventaja: no necesito cliente oficial de Sheets (googleapis); la llamada es 100% REST.
const { GoogleAuth } = require('google-auth-library');

// fetchCompat(hacer peticiones HTTP): usa fetch nativo si está disponible; si no, hace import dinámico de node-fetch.
// Así evito añadir node-fetch si el runtime ya trae fetch (Node 18+ lo trae).
const fetchCompat = (...args) =>
  (global.fetch ? global.fetch(...args) : import('node-fetch').then(({ default: f }) => f(...args)));

module.exports = defineConfig({
  e2e: {
    // URL base de la app que estoy probando (Novatrans). Evito repetir en los tests.
    baseUrl: 'https://novatrans-web-2mhoc.ondigitalocean.app',

    setupNodeEvents(on, config) {
      // Carpeta local para reportes Excel cuando RESULT_SINK=excel (fallback o offline).
      // Importante en local: aseguro que la ruta exista para no fallar al escribir.
      const carpetaResultados = path.resolve(__dirname, 'cypress/resultados');
      if (!fs.existsSync(carpetaResultados)) fs.mkdirSync(carpetaResultados, { recursive: true });

      on('task', {
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
         */
        async guardarEnExcel({ numero, nombre, esperado, obtenido, resultado, fechaHora, archivo, pantalla, observacion, ok, warning, error }) {
          // Default a excel para entornos sin credenciales o cuando quiero “modo offline”
          const sink = process.env.RESULT_SINK || 'excel';

          // ============== SINK: GOOGLE SHEETS ==============
          if (sink === 'sheets') {
            // 1) Autenticación OAuth2 con Service Account
            // IMPORTANTE:
            // - GS_CLIENT_EMAIL y GS_PRIVATE_KEY deben estar definidos en el entorno/secretos del CI.
            // - La PRIVATE_KEY suele venir con '\n' escapados; los convierto a saltos de línea reales.
            // - La SA debe tener permiso de edición sobre el Spreadsheet (compartir por email).
            const auth = new GoogleAuth({
              credentials: {
                client_email: process.env.GS_CLIENT_EMAIL,
                private_key: (process.env.GS_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
              },
              // Scope mínimo necesario para escribir en Sheets
              scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            const client = await auth.getClient();
            const { token } = await client.getAccessToken();
            if (!token) throw new Error('No se pudo obtener access token');

            // 2) Determinar qué hoja usar y construir la fila según el tipo
            let fila, encodedRange;
            
            if (pantalla === 'Resultados Pruebas') {
              // Para "Resultados Pruebas" usar formato especial con columnas adicionales
              fila = [
                numero ?? '',                                 // Test-ID
                (fechaHora || new Date().toISOString().replace('T', ' ').substring(0, 19)), // Fecha y Hora
                esperado ?? '',                               // Test
                obtenido ?? '',                               // Nombre
                resultado ?? '',                              // Resultado
                (ok ?? '').toString(),                        // OK
                (warning ?? '').toString(),                   // WARNING
                (error ?? '').toString()                      // ERROR
              ];
              encodedRange = encodeURIComponent('Resultados Pruebas!A:H');
            } else {
              // Para otras hojas usar el formato estándar
              fila = [
                numero ?? '',
                nombre ?? '',
                esperado ?? '',
                obtenido ?? '',
                resultado ?? '',
                (fechaHora || new Date().toISOString().replace('T', ' ').substring(0, 19)),
                pantalla || '',
                observacion || ''
              ];
              encodedRange = encodeURIComponent('Log!A:H');
            }

            // 3) Llamada REST: append al rango correspondiente
            //    valueInputOption=RAW => lo mete tal cual (sin interpretación de fórmulas).
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GS_SPREADSHEET_ID}/values/${encodedRange}:append?valueInputOption=RAW`;

            const res = await fetchCompat(url, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ values: [fila] }),
            });

            // Leo el texto para informes de error más ricos
            const txt = await res.text();
            if (!res.ok) {
              // Errores comunes:
              // - 403/404: la SA no tiene acceso al Spreadsheet o ID incorrecto.
              // - 400: hoja o rango no existe ("Log"), revisar nombre y mayúsculas.
              // - 401: token inválido (credenciales mal o scope).
              throw new Error(`Sheets REST error: ${res.status} ${txt}`);
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
            
            // Para "Resultados Pruebas" usar formato especial con columnas adicionales
            if (workbook.SheetNames.includes('Resultados Pruebas')) {
              worksheet = workbook.Sheets['Resultados Pruebas'];
            } else {
              worksheet = xlsx.utils.aoa_to_sheet([[
                'Test-ID', 'Fecha y Hora', 'Test', 'Nombre', 'Resultado', 'OK', 'WARNING', 'ERROR'
              ]]);
              xlsx.utils.book_append_sheet(workbook, worksheet, 'Resultados Pruebas');
            }
            
            // Para "Resultados Pruebas" usar el formato correcto
            const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
            data.push([numero, nombre, esperado, obtenido, resultado, ok || '', warning || '', error || '']);
            
            const nuevaHoja = xlsx.utils.aoa_to_sheet(data);
            workbook.Sheets['Resultados Pruebas'] = nuevaHoja;
          } else {
            // Para otras hojas usar el formato estándar
            if (workbook.SheetNames.includes(pantalla)) {
              worksheet = workbook.Sheets[pantalla];
            } else {
              worksheet = xlsx.utils.aoa_to_sheet([[
                'Nº', 'Nombre', 'Resultado Esperado', 'Resultado Obtenido', 'Resultado', 'Fecha y Hora', 'Test', 'Observaciones'
              ]]);
              xlsx.utils.book_append_sheet(workbook, worksheet, pantalla);
            }
            
            // Timestamp coherente (ISO friendly sin zona T)
            const fechaHoraFinal = fechaHora || new Date().toISOString().replace('T', ' ').substring(0, 19);
            
            // Convierto la hoja a matriz de filas, pusheo y reescribo
            const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
            data.push([numero, nombre, esperado, obtenido, resultado, fechaHoraFinal, pantalla || '', observacion || '']);
            
            const nuevaHoja = xlsx.utils.aoa_to_sheet(data);
            workbook.Sheets[pantalla] = nuevaHoja;
          }

          // IMPORTANTE en Windows/CI: asegurar permisos de escritura en cypress/resultados
          xlsx.writeFile(workbook, rutaExcel);
          return 'OK';
        },

        /**
         * guardarEnLog
         * - Inserta un registro individual en la hoja "Log" con el formato correcto.
         * - En Sheets escribe en la hoja "Log" (A:I).
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
          const sink = process.env.RESULT_SINK || 'excel';

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

            // Construyo la fila con 9 columnas (A:I) para la hoja "Log"
            // A: Test-ID, B: Test, C: Paso, D: Fecha y Hora, E: Resultado, F: Nombre, G: Resultado Esperado, H: Resultado Obtenido, I: Observaciones
            const fila = [
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

            // Llamada REST: append al rango Log!A:I del Spreadsheet
            const encodedRange = encodeURIComponent('Log!A:I');
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GS_SPREADSHEET_ID}/values/${encodedRange}:append?valueInputOption=RAW`;

            const res = await fetchCompat(url, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ values: [fila] }),
            });

            const txt = await res.text();
            if (!res.ok) {
              throw new Error(`Sheets REST error: ${res.status} ${txt}`);
            }
            return 'OK';
          }

          // ============== SINK: EXCEL LOCAL ==============
          const nombreArchivo = 'reportes_pruebas_novatrans.xlsx';
          const rutaExcel = path.join(carpetaResultados, nombreArchivo);

          let workbook, worksheet;
          if (fs.existsSync(rutaExcel)) {
            workbook = xlsx.readFile(rutaExcel);
            // Buscar la hoja "Log" o crear una nueva
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

          // Convierto la hoja a matriz de filas, pusheo y reescribo
          const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
          data.push([testId, test, paso, fechaHora, resultado, nombre, esperado, obtenido, observacion]);

          const nuevaHoja = xlsx.utils.aoa_to_sheet(data);
          workbook.Sheets['Log'] = nuevaHoja;

          xlsx.writeFile(workbook, rutaExcel);
          return 'OK';
        },


      });
    },
  },
});