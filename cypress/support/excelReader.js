// === Parser CSV que funciona con formato vertical de Google Sheets ===
function parseCsvRespectingQuotes(csv) {
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
}

// Helpers
const safe = (v) => (v ?? '').toString().trim();
const lower = (v) => safe(v).toLowerCase();

// --- Mapa de GIDs por hoja (puedes sobreescribir con env si quieres) ---
const SHEET_GIDS = {
  'LOGIN': '1766248160',
  'CONFIGURACIÓN-PERFILES': '1896958952',
  'FICHEROS-CLIENTES': '520599147',
  'PROCESOS-PRESUPUESTOS': '1905879024',
  'PROCESOS-ÓRDENES DE CARGA-CARGAS/DESCARGAS': '1000000000', // GID temporal, necesita el real
  'Datos': '0'
};

// Normaliza "TC001" → "tc001"
const normalizeTc = (s) => {
  const v = safe(s);
  const m = v.match(/^tc(\d{1,})$/i);
  return m ? `tc${m[1].padStart(3, '0')}` : v.toLowerCase();
};

// Lee CSV público de Google Sheets con reintentos básicos
Cypress.Commands.add('leerDatosGoogleSheets', (hoja = 'Datos') => {
  const spreadsheetId = '1m3B_HFT8fJduBxloh8Kj36bVr0hwnj5TioUHAq5O7Zs';
  const range = `${hoja}!A:R`;
  const gidEnvKey = `GID_${hoja.replace(/[^A-Z0-9]/gi, '_')}`;
  const gid = Cypress.env(gidEnvKey) || SHEET_GIDS[hoja] || '0';
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}&range=${encodeURIComponent(range)}`;

  const tryRequest = (attempt = 1) => {
    return cy.request({ method: 'GET', url, failOnStatusCode: false }).then((res) => {
      if ((res.status >= 500 || res.status === 429) && attempt < 3) {
        cy.wait(800 * attempt);
        return tryRequest(attempt + 1);
      }
      if (res.status === 200 && res.body) {
        const rows = parseCsvRespectingQuotes(res.body);
        // normaliza ancho por cabeceras
        const COLS = rows[0] ? rows[0].length : 18;
        const fixed = rows.map(r => {
          const row = Array.from(r);
          while (row.length < COLS) row.push('');
          return row.slice(0, COLS);
        });
        return fixed.length > 1 ? cy.wrap(fixed) : cy.wrap([]);
      }
      cy.log(`Error leyendo CSV (${res.status}) -> ${url}`);
      return cy.wrap([]);
    });
  };

  return tryRequest();
});

// Selecciona la hoja por nombre de pantalla
function seleccionarHojaPorPantalla(pantallaSafe) {
  if (pantallaSafe === 'login') return 'LOGIN';
  if (/(configuración|configuracion).*\(perfiles\)/.test(pantallaSafe) || pantallaSafe === 'configuración-perfiles') return 'CONFIGURACIÓN-PERFILES';
  if (pantallaSafe.includes('ficheros') && (pantallaSafe.includes('clientes') || pantallaSafe === 'ficheros-clientes')) return 'FICHEROS-CLIENTES';
  if (pantallaSafe.includes('procesos') && (pantallaSafe.includes('presupuestos') || pantallaSafe === 'procesos-presupuestos')) return 'PROCESOS-PRESUPUESTOS';
  return 'Datos';
}

// Mapea cabeceras -> índice (independiente del orden)
function mapHeaderIndexes(headers) {
  const idx = {};
  const find = (regexArr) =>
    headers.findIndex(h => regexArr.some(r => r.test(h)));

  idx.pantalla      = find([/^\s*pantalla\s*$/i]);
  idx.funcionalidad = find([/^\s*funcionalidad\s*$/i]);
  idx.caso          = find([/^\s*n.?°?\s*caso\s*$/i, /^\s*caso\s*$/i]);
  idx.nombre        = find([/^\s*nombre\s*$/i]);
  idx.prioridad     = find([/^\s*prioridad\s*$/i]);
  idx.funcion       = find([/^\s*funci[oó]n\s*$/i, /^\s*function\s*$/i]);

  // etiquetas/valores/datos 1..4 - mapeo directo por posición
  idx.etiqueta_1 = 6;      // G
  idx.valor_etiqueta_1 = 7; // H  
  idx.dato_1 = 8;          // I
  idx.etiqueta_2 = 9;       // J
  idx.valor_etiqueta_2 = 10; // K
  idx.dato_2 = 11;         // L
  idx.etiqueta_3 = 12;     // M
  idx.valor_etiqueta_3 = 13; // N
  idx.dato_3 = 14;         // O
  idx.etiqueta_4 = 15;     // P
  idx.valor_etiqueta_4 = 16; // Q
  idx.dato_4 = 17;         // R
  return idx;
}

// Construye objeto caso a partir de una fila + mapeo
function buildCaso(fila, idx) {
  const get = (k) => idx[k] >= 0 ? safe(fila[idx[k]]) : '';
  const casoRaw = safe(get('caso')).toUpperCase();
  
  
  if (!/^TC\d+(\.\d+)?$/i.test(casoRaw)) return null;

  return {
    pantalla:      get('pantalla'),
    funcionalidad: get('funcionalidad'),
    caso:          casoRaw,                        // "TC001"
    nombre:        get('nombre'),
    prioridad:     get('prioridad'),
    funcion:       normalizeTc(get('funcion')),    // "tc001", "tc010", etc.
    etiqueta_1:    get('etiqueta_1'),
    valor_etiqueta_1: get('valor_etiqueta_1'),
    dato_1:        get('dato_1'),
    etiqueta_2:    get('etiqueta_2'),
    valor_etiqueta_2: get('valor_etiqueta_2'),
    dato_2:        get('dato_2'),
    etiqueta_3:    get('etiqueta_3'),
    valor_etiqueta_3: get('valor_etiqueta_3'),
    dato_3:        get('dato_3'),
    etiqueta_4:    get('etiqueta_4'),
    valor_etiqueta_4: get('valor_etiqueta_4'),
    dato_4:        get('dato_4'),
  };
}

// Función que filtra los datos del Excel en base a la pantalla
Cypress.Commands.add('obtenerDatosExcel', (pantalla) => {
  const pantallaSafe = lower(pantalla);
  const hoja = seleccionarHojaPorPantalla(pantallaSafe);

  return cy.leerDatosGoogleSheets(hoja).then((filas) => {
    if (!filas || filas.length === 0) return cy.wrap([]);

    const headers = (filas[0] || []).map(safe);
    cy.log(`Headers del Excel: ${JSON.stringify(headers)}`);
    const idx = mapHeaderIndexes(headers);
    cy.log(`Mapeo de índices: ${JSON.stringify(idx)}`);

    const out = [];
    for (let i = 1; i < filas.length; i++) {
      const fila = (filas[i] || []).map(safe);
      if (fila.every(c => c === '')) continue;
      
      const caso = buildCaso(fila, idx);
      if (caso) out.push(caso);
    }

    // Eliminar duplicados basado en caso + nombre
    const casosUnicos = [];
    const casosVistos = new Set();
    
    for (const caso of out) {
      const clave = `${caso.caso}-${caso.nombre}`;
      if (!casosVistos.has(clave)) {
        casosVistos.add(clave);
        casosUnicos.push(caso);
      }
    }

    // Ordena por número de TC
    casosUnicos.sort((a, b) => {
      const na = parseInt(a.caso.replace(/\D/g, ''), 10);
      const nb = parseInt(b.caso.replace(/\D/g, ''), 10);
      return na - nb;
    });

    // Log resumen
    cy.log(`Leídos ${out.length} casos de "${hoja}" (${casosUnicos.length} únicos después de eliminar duplicados)`);
    const casosTC008 = casosUnicos.filter(c => c.caso === 'TC008');
    cy.log(`Casos TC008 encontrados: ${casosTC008.length}`);
    casosTC008.forEach(c => cy.log(`TC008: ${c.dato_1} = ${c.dato_2}`));

    return cy.wrap(casosUnicos);
  });
});