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
Cypress.Commands.add('leerDatosGoogleSheets', (hoja = 'Datos') => {
  cy.log('NUEVO PARSER CSV - Intentando leer datos desde Google Sheets (CSV público)...');

  const spreadsheetId = '1m3B_HFT8fJduBxloh8Kj36bVr0hwnj5TioUHAq5O7Zs';
  const range = `${hoja}!A:R`; // Leer todas las columnas hasta R
  const sheetName = range.split('!')[0]; // Nombre de la hoja
  
  // Determinar el gid correcto según la hoja
  let gid = '0'; // Por defecto para la primera hoja
  if (hoja === 'LOGIN') {
    gid = '1766248160'; // GID específico para la hoja LOGIN
  } else if (hoja === 'CONFIGURACIÓN-PERFILES') {
    gid = '1896958952'; // GID específico para la hoja CONFIGURACIÓN-PERFILES
  } else if (hoja === 'FICHEROS-CLIENTES') {
    gid = '520599147'; // GID específico para la hoja FICHEROS-CLIENTES
  }
  
  // Construyo la URL de exportación en formato CSV
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}&range=${encodeURIComponent(range)}`;

  cy.log(`Spreadsheet ID: ${spreadsheetId}`);
  cy.log(`Range: ${range}`);
  cy.log(`GID: ${gid}`);
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
      if (lineas.length > 1) {
        cy.log(`CSV RAW - Segunda línea: "${lineas[1]}"`);
      }

      let filasExcel = parseCsvRespectingQuotes(csvData);

      // Normalizo todas las filas para que tengan el número correcto de columnas
      const COLS = filasExcel[0] ? filasExcel[0].length : 18; // Usar el número real de columnas
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
  
  // Determinar la hoja correcta según la pantalla
  let hoja = 'Datos'; // Por defecto
  if (pantallaSafe === 'login') {
    hoja = 'LOGIN';
  } else if (pantallaSafe === 'configuración (perfiles)' || pantallaSafe === 'configuracion (perfiles)') {
    hoja = 'CONFIGURACIÓN-PERFILES';
  } else if (pantallaSafe === 'ficheros (clientes)' || pantallaSafe === 'ficheros-clientes') {
    hoja = 'FICHEROS-CLIENTES';
  }

  return cy.leerDatosGoogleSheets(hoja).then((filasExcel) => {
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

      // Para la hoja LOGIN, usar la estructura específica
      if (hoja === 'LOGIN') {
        const datoFiltro = {
          pantalla: safe(fila[0]),          // A: Pantalla
          funcionalidad: safe(fila[1]),     // B: Funcionalidad
          caso: safe(fila[2]),              // C: N°Caso
          nombre: safe(fila[3]),             // D: Nombre
          prioridad: safe(fila[4]),         // E: Prioridad
          funcion: safe(fila[5]),           // F: Función
          etiqueta_1: safe(fila[6]),        // G: etiqueta_1
          valor_etiqueta_1: safe(fila[7]),  // H: valor_etiqueta_1
          dato_1: safe(fila[8]),            // I: dato_1
          etiqueta_2: safe(fila[9]),        // J: etiqueta_2
          valor_etiqueta_2: safe(fila[10]), // K: valor_etiqueta_2
          dato_2: safe(fila[11]),           // L: dato_2
          etiqueta_3: safe(fila[12]),       // M: etiqueta_3
          valor_etiqueta_3: safe(fila[13]), // N: valor_etiqueta_3
          dato_3: safe(fila[14]),           // O: dato_3
          etiqueta_4: safe(fila[15]),       // P: etiqueta_4
          valor_etiqueta_4: safe(fila[16]), // Q: valor_etiqueta_4
          dato_4: safe(fila[17])            // R: dato_4
        };

        // Si el caso es un TC, hago debugging adicional
        if (datoFiltro.caso && datoFiltro.caso.toUpperCase().startsWith('TC')) {
          cy.log(`ENCONTRADO ${datoFiltro.caso}: ${datoFiltro.nombre}`);
          cy.log(`DEBUG ${datoFiltro.caso}: dato_1="${datoFiltro.dato_1}", dato_2="${datoFiltro.dato_2}", dato_3="${datoFiltro.dato_3}", dato_4="${datoFiltro.dato_4}"`);
        }

        datosFiltrados.push(datoFiltro);
      } else if (hoja === 'CONFIGURACIÓN-PERFILES') {
        // Para la hoja CONFIGURACIÓN-PERFILES, usar estructura específica
        const caso = safe(fila[2]);
        
        // Solo procesar filas que tengan un caso válido (TC001, TC002, etc.)
        if (caso && caso.toUpperCase().match(/^TC\d+$/)) {
          const datoFiltro = {
            pantalla: safe(fila[0]),          // A: Pantalla
            funcionalidad: safe(fila[1]),     // B: Funcionalidad
            caso: caso,                       // C: N°Caso
            nombre: safe(fila[3]),           // D: Nombre
            prioridad: safe(fila[4]),         // E: Prioridad
            funcion: safe(fila[5]),           // F: Función
            etiqueta_1: safe(fila[6]),        // G: etiqueta_1
            valor_etiqueta_1: safe(fila[7]),  // H: valor_etiqueta_1
            dato_1: safe(fila[8]),            // I: dato_1
            etiqueta_2: safe(fila[9]),        // J: etiqueta_2
            valor_etiqueta_2: safe(fila[10]), // K: valor_etiqueta_2
            dato_2: safe(fila[11]),           // L: dato_2
            etiqueta_3: safe(fila[12]),       // M: etiqueta_3
            valor_etiqueta_3: safe(fila[13]), // N: valor_etiqueta_3
            dato_3: safe(fila[14]),           // O: dato_3
            etiqueta_4: safe(fila[15]),       // P: etiqueta_4
            valor_etiqueta_4: safe(fila[16]), // Q: valor_etiqueta_4
            dato_4: safe(fila[17])            // R: dato_4
          };

          cy.log(`ENCONTRADO ${datoFiltro.caso}: ${datoFiltro.nombre}`);
          cy.log(`DEBUG ${datoFiltro.caso}: función="${datoFiltro.funcion}", dato_1="${datoFiltro.dato_1}"`);

          datosFiltrados.push(datoFiltro);
        } else {
          cy.log(`FILA ${i} IGNORADA: caso="${caso}" no es válido`);
        }
      } else if (hoja === 'FICHEROS-CLIENTES') {
        // Para la hoja FICHEROS-CLIENTES, usar estructura específica
        const caso = safe(fila[2]);
        
        // Solo procesar filas que tengan un caso válido (TC001, TC002, etc.)
        if (caso && caso.toUpperCase().match(/^TC\d+$/)) {
          const datoFiltro = {
            pantalla: safe(fila[0]),          // A: Pantalla
            funcionalidad: safe(fila[1]),     // B: Funcionalidad
            caso: caso,                       // C: N°Caso
            nombre: safe(fila[3]),           // D: Nombre
            prioridad: safe(fila[4]),         // E: Prioridad
            funcion: safe(fila[5]),           // F: Función
            etiqueta_1: safe(fila[6]),        // G: etiqueta_1
            valor_etiqueta_1: safe(fila[7]),  // H: valor_etiqueta_1
            dato_1: safe(fila[8]),            // I: dato_1
            etiqueta_2: safe(fila[9]),        // J: etiqueta_2
            valor_etiqueta_2: safe(fila[10]), // K: valor_etiqueta_2
            dato_2: safe(fila[11]),           // L: dato_2
            etiqueta_3: safe(fila[12]),       // M: etiqueta_3
            valor_etiqueta_3: safe(fila[13]), // N: valor_etiqueta_3
            dato_3: safe(fila[14]),           // O: dato_3
            etiqueta_4: safe(fila[15]),       // P: etiqueta_4
            valor_etiqueta_4: safe(fila[16]), // Q: valor_etiqueta_4
            dato_4: safe(fila[17])            // R: dato_4
          };

          cy.log(`ENCONTRADO ${datoFiltro.caso}: ${datoFiltro.nombre}`);
          cy.log(`DEBUG ${datoFiltro.caso}: función="${datoFiltro.funcion}", dato_1="${datoFiltro.dato_1}"`);

          datosFiltrados.push(datoFiltro);
        } else {
          cy.log(`FILA ${i} IGNORADA: caso="${caso}" no es válido`);
        }
      } else {
        // Para otras hojas, usar la lógica original
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

          datosFiltrados.push(datoFiltro);
        }
      }
    }

    cy.log(`DEBUGGING COMPLETO - Encontrados ${datosFiltrados.length} casos para pantalla "${pantalla}"`);

    // Resumen de todos los casos encontrados
    datosFiltrados.forEach(dato => {
      if (dato.caso && dato.caso.toUpperCase().startsWith('TC')) {
        cy.log(`RESUMEN ${dato.caso}: ${dato.nombre || 'Sin nombre'}`);
      }
    });

    return cy.wrap(datosFiltrados);
  });
});