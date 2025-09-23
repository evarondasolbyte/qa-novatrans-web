// === Parser CSV que funciona con formato vertical de Google Sheets ===
function parseCsvRespectingQuotes(csv) {
  // Si el CSV viene con un BOM al inicio, lo elimino
  if (csv.charCodeAt(0) === 0xFEFF) csv = csv.slice(1);

  cy.log(`CSV raw length: ${csv.length} caracteres`);

  // Divido el contenido en líneas y elimino las vacías
  const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
  cy.log(`Número de líneas: ${lines.length}`);

  // Recorro cada línea para parsearla respetando comillas
  const rows = lines.map(line => {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Manejo de comillas escapadas (dobles)
          current += '"';
          i++;
        } else {
          // Cambio el estado de dentro/fuera de comillas
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Si encuentro coma fuera de comillas, cierro celda
        cells.push(current.trim());
        current = '';
      } else {
        // Voy acumulando el carácter en la celda actual
        current += char;
      }
    }

    // Al final agrego la última celda
    cells.push(current.trim());

    return cells;
  });

  cy.log(`Filas parseadas: ${rows.length}`);
  return rows;
}

// Helper para limpiar valores nulos o con espacios
const safe = (v) => (v ?? '').toString().trim();

// Función para leer datos de Google Sheets publicado como CSV
Cypress.Commands.add('leerDatosGoogleSheets', () => {
  cy.log('NUEVO PARSER CSV - Intentando leer datos desde Google Sheets (CSV público)...');

  const spreadsheetId = '1m3B_HFT8fJduBxloh8Kj36bVr0hwnj5TioUHAq5O7Zs';
  const range = 'Datos!A:I';
  const sheetName = range.split('!')[0]; // "Datos"
  // Construyo la URL de exportación en formato CSV
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0&range=${encodeURIComponent(range)}`;

  cy.log(`Spreadsheet ID: ${spreadsheetId}`);
  cy.log(`Range: ${range}`);
  cy.log(`Intentando leer desde: ${csvUrl}`);

  return cy.request({
    method: 'GET',
    url: csvUrl,
    failOnStatusCode: false,
  }).then((response) => {
    cy.log(`Respuesta del servidor: ${response.status}`);

    if (response.status === 200 && response.body) {
      const csvData = response.body;
      cy.log(`Datos CSV recibidos: ${csvData.length} caracteres`);

      // Debug inicial: muestro algunas líneas crudas del CSV
      const lineas = csvData.split('\n');
      cy.log(`CSV RAW - Primera línea: "${lineas[0]}"`);
      cy.log(`CSV RAW - Línea 24 (TC003): "${lineas[23]}"`);
      cy.log(`CSV RAW - Línea 25 (TC004): "${lineas[24]}"`);

      let filasExcel = parseCsvRespectingQuotes(csvData);

      // Normalizo todas las filas para que tengan 9 columnas (A..I)
      const COLS = 9;
      filasExcel = filasExcel.map(f => {
        const row = Array.from(f);
        while (row.length < COLS) row.push('');
        return row.slice(0, COLS);
      });

      // Valido que tenga cabecera + al menos una fila de datos
      if (filasExcel.length > 1) {
        cy.log(`Leídas ${filasExcel.length} filas desde Google Sheets CSV (parser robusto)`);
        return cy.wrap(filasExcel);
      }
    }

    // Si hubo error al leer
    cy.log('Error al leer Google Sheets CSV');
    cy.log(`Status: ${response.status}`);
    cy.log(`URL: ${csvUrl}`);
    return cy.wrap([]);
  });
});

// Función que filtra los datos del Excel en base a la pantalla
Cypress.Commands.add('obtenerDatosExcel', (pantalla) => {
  const pantallaSafe = safe(pantalla).toLowerCase();

  return cy.leerDatosGoogleSheets().then((filasExcel) => {
    if (!filasExcel || filasExcel.length === 0) {
      cy.log('No se pudieron leer datos del Excel');
      return cy.wrap([]);
    }

    // Obtengo los headers
    const headers = (filasExcel[0] || []).map(safe);
    cy.log(`Headers del Excel: [${headers.map(h => `"${h}"`).join(', ')}]`);
    cy.log(`Número de columnas: ${headers.length}`);

    const datosFiltrados = [];

    // Recorro todas las filas de datos
    for (let i = 1; i < filasExcel.length; i++) {
      const fila = (filasExcel[i] || []).map(safe);

      // Ignoro filas completamente vacías
      if (fila.every(c => c === '')) continue;

      // La columna A corresponde a la pantalla
      const pantallaFila = (fila[0] || '').toLowerCase();
      if (pantallaFila === pantallaSafe) {
        cy.log(`PROCESANDO FILA ${i}: pantalla="${pantallaFila}" === "${pantallaSafe}"`);
        const datoFiltro = {
          pantalla: safe(fila[0]),          // A
          funcionalidad: safe(fila[1]),     // B
          caso: safe(fila[2]),              // C
          etiqueta_1: safe(fila[3]),        // D
          valor_etiqueta_1: safe(fila[4]),  // E
          dato_1: safe(fila[5]),            // F
          etiqueta_2: safe(fila[6]),        // G
          valor_etiqueta_2: safe(fila[7]),  // H
          dato_2: safe(fila[8])             // I
        };

        // Si el caso es un TC, hago debugging adicional
        if (datoFiltro.caso && datoFiltro.caso.toUpperCase().startsWith('TC')) {
          cy.log(`ENCONTRADO ${datoFiltro.caso}`);
          cy.log(`DEBUG ${datoFiltro.caso}: fila completa = [${fila.map(cell => `"${cell}"`).join(', ')}]`);
          cy.log(`DEBUG ${datoFiltro.caso}: longitud fila=${fila.length}`);

          const rawDato2 = fila[8];
          const cleanDato2 = safe(rawDato2);
          cy.log(`DEBUG ${datoFiltro.caso}: RAW indice_8 = "${rawDato2}" (tipo: ${typeof rawDato2})`);
          cy.log(`DEBUG ${datoFiltro.caso}: CLEAN indice_8 = "${cleanDato2}" (longitud: ${cleanDato2.length})`);
          cy.log(`DEBUG ${datoFiltro.caso}: CÓDIGOS CARACTERES = [${cleanDato2.split('').map(c => c.charCodeAt(0)).join(', ')}]`);
          cy.log(`DEBUG ${datoFiltro.caso}: resultado final dato_1="${datoFiltro.dato_1}", dato_2="${datoFiltro.dato_2}"`);
        }

        datosFiltrados.push(datoFiltro);
      }
    }

    cy.log(`DEBUGGING COMPLETO - Encontrados ${datosFiltrados.length} casos para pantalla "${pantalla}"`);

    // Resumen de todos los casos encontrados
    datosFiltrados.forEach(dato => {
      if (dato.caso && dato.caso.toUpperCase().startsWith('TC')) {
        cy.log(`RESUMEN ${dato.caso}: columna="${dato.dato_1}", valor="${dato.dato_2}" (longitud: ${dato.dato_2.length})`);
      }
    });

    return cy.wrap(datosFiltrados);
  });
});