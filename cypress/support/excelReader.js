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
const safe  = (v) => (v ?? '').toString().trim();
const lower = (v) => safe(v).toLowerCase();

// --- Mapa de GIDs por hoja ---
const SHEET_GIDS = {
  'LOGIN': '1766248160',
  'CONFIGURACIÓN-PERFILES': '1896958952',
  'FICHEROS-CLIENTES': '520599147',
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
  'Datos': '0'
};

// Normaliza "TC001" → "tc001" **sólo si** tiene ese patrón; si no, devuelve tal cual
const normalizeMaybeTc = (s) => {
  const v = safe(s);
  const m = v.match(/^tc(\d{1,})$/i);
  return m ? `tc${m[1].padStart(3, '0')}` : v;   //  no forzamos a lower, conservamos nombres de función reales
};

// Lee CSV público de Google Sheets con reintentos básicos
Cypress.Commands.add('leerDatosGoogleSheets', (hoja = 'Datos') => {
  const spreadsheetId = '1m3B_HFT8fJduBxloh8Kj36bVr0hwnj5TioUHAq5O7Zs';
  const range = `${hoja}!A:R`;
  const gidEnvKey = `GID_${hoja.replace(/[^A-Z0-9]/gi, '_')}`;
  const gid = Cypress.env(gidEnvKey) || SHEET_GIDS[hoja] || '0';
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

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
      cy.log(`Response body: ${res.body ? res.body.substring(0, 200) : 'No body'}`);
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
  if (pantallaSafe.includes('procesos') && (pantallaSafe.includes('planificación') || pantallaSafe.includes('planificacion') || pantallaSafe === 'procesos-planificacion')) return 'PROCESOS-PLANIFICACION';
  if (
    pantallaSafe.includes('procesos') &&
    (pantallaSafe.includes('órdenes de carga') || pantallaSafe.includes('ordenes de carga') || pantallaSafe === 'procesos-ordenes de carga')
  ) return 'PROCESOS-ORDENES DE CARGA';
  if (
    pantallaSafe.includes('procesos') &&
    (pantallaSafe.includes('rutas') || pantallaSafe === 'procesos-rutas')
  ) return 'PROCESOS-RUTAS';

  // 👇 NUEVO: detectar Taller y Gastos (Repostajes)
  if (
    /taller/.test(pantallaSafe) &&
    /gastos/.test(pantallaSafe) &&
    /(repostaje|repostajes)/.test(pantallaSafe)
  ) return 'TALLER Y GASTOS-REPOSTAJES';

  // 👇 NUEVO: detectar Ficheros (Tipos de Vehículo)
  if (
    /ficheros/.test(pantallaSafe) &&
    /(tipos.*veh[íi]culo|tipos.*veh[íi]culos)/.test(pantallaSafe)
  ) return 'FICHEROS-TIPOS DE VEHÍCULO';

  // 👇 NUEVO: detectar Ficheros (Categorías de Conductores)
  if (
    /ficheros/.test(pantallaSafe) &&
    /(categor[íi]as.*conductores|categor[íi]as.*conductor)/.test(pantallaSafe)
  ) return 'FICHEROS-CATEGORIAS DE CONDUCTORES';

  // 👇 NUEVO: detectar Ficheros (Multas)
  if (
    /ficheros/.test(pantallaSafe) &&
    /(multas|multa)/.test(pantallaSafe)
  ) return 'FICHEROS-MULTAS';

  // 👇 NUEVO: detectar Ficheros (Siniestros)
  if (
    /ficheros/.test(pantallaSafe) &&
    /(siniestros|siniestro)/.test(pantallaSafe)
  ) return 'FICHEROS-SINIESTROS';

  // 👇 NUEVO: detectar Ficheros (Tarjetas)
  if (
    /ficheros/.test(pantallaSafe) &&
    /(tarjetas|tarjeta)/.test(pantallaSafe)
  ) return 'FICHEROS-TARJETAS';

  // 👇 NUEVO: detectar Ficheros (Teléfonos)
  if (
    /ficheros/.test(pantallaSafe) &&
    /(tel[eé]fonos|tel[eé]fono)/.test(pantallaSafe)
  ) return 'FICHEROS-TELEFONOS';

  // 👇 NUEVO: detectar Ficheros (Categorías)
  if (
    /ficheros/.test(pantallaSafe) &&
    /(categor[íi]as|categor[íi]a)/.test(pantallaSafe)
  ) return 'FICHEROS-CATEGORIAS';

  // 👇 NUEVO: detectar Ficheros (Alquileres Vehículos)
  if (
    /ficheros/.test(pantallaSafe) &&
    /(alquileres.*veh[íi]culos|alquiler.*veh[íi]culos)/.test(pantallaSafe)
  ) return 'FICHEROS-ALQUILERES VEHÍCULOS';

  // 👇 NUEVO: detectar Ficheros (Formas de Pago)
  if (
    /ficheros/.test(pantallaSafe) &&
    /(formas.*pago|formas.*payment|pago|payment)/.test(pantallaSafe)
  ) return 'FICHEROS-FORMAS DE PAGO';

  // 👇 NUEVO: detectar Almacen (Familias, Subfamilias y Almacenes)
  if (
    /almacen/.test(pantallaSafe) &&
    /(familias|subfamilias|almacenes)/.test(pantallaSafe)
  ) return 'ALMACEN-FAMILIAS SUBFAMILIAS ALMACENES';

  // 👇 NUEVO: detectar Almacen (Artículos)
  if (
    /almacen/.test(pantallaSafe) &&
    /(articulos|artículos)/.test(pantallaSafe)
  ) return 'ALMACEN-ARTICULOS';

  // 👇 NUEVO: detectar Almacen (Pedidos)
  if (
    /almacen/.test(pantallaSafe) &&
    /(pedidos|pedido)/.test(pantallaSafe)
  ) return 'ALMACEN-PEDIDOS';

  return 'Datos';
}

// Mapea cabeceras -> índice (independiente del orden)
function detectarMaxCampos(headers = []) {
  let max = 0;
  headers.forEach((header) => {
    const match = header.match(/(etiqueta|valor[_\s-]?etiqueta|dato)[_\s-]?(\d+)/i);
    if (match) {
      const numero = parseInt(match[2], 10);
      if (!Number.isNaN(numero)) {
        max = Math.max(max, numero);
      }
    }
  });
  return max || 4;
}

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

  const maxCampos = detectarMaxCampos(headers);
  idx.maxCampos = Math.max(maxCampos, 4);

  // etiquetas/valores/datos dinámicos
  for (let n = 1; n <= idx.maxCampos; n++) {
    idx[`etiqueta_${n}`]       = find([new RegExp(`^\\s*etiqueta[_\\s-]?${n}\\s*$`, 'i')]);
    idx[`valor_etiqueta_${n}`] = find([new RegExp(`^\\s*valor[_\\s-]?etiqueta[_\\s-]?${n}\\s*$`, 'i')]);
    idx[`dato_${n}`]           = find([new RegExp(`^\\s*dato[_\\s-]?${n}\\s*$`, 'i')]);
  }
  return idx;
}

// Construye objeto caso a partir de una fila + mapeo
function buildCaso(fila, idx) {
  const get = (k) => idx[k] >= 0 ? safe(fila[idx[k]]) : '';
  const casoRaw = safe(get('caso')).toUpperCase();
  if (!/^TC\d+$/i.test(casoRaw)) return null;

  const caso = {
    pantalla:      get('pantalla'),
    funcionalidad: get('funcionalidad'),
    caso:          casoRaw,                       // "TC001"
    nombre:        get('nombre'),
    prioridad:     get('prioridad'),
    // 👇 IMPORTANTE: ya no forzamos "tc###" si no toca.
    funcion:       normalizeMaybeTc(get('funcion'))
  };

  const totalCampos = idx.maxCampos || 4;
  caso.__totalCamposExcel = totalCampos;

  for (let n = 1; n <= totalCampos; n++) {
    caso[`etiqueta_${n}`] = get(`etiqueta_${n}`);
    caso[`valor_etiqueta_${n}`] = get(`valor_etiqueta_${n}`);
    caso[`dato_${n}`] = get(`dato_${n}`);
  }

  return caso;
}

// Función que filtra los datos del Excel en base a la pantalla
Cypress.Commands.add('obtenerDatosExcel', (pantalla) => {
  const pantallaSafe = lower(pantalla);
  const hoja = seleccionarHojaPorPantalla(pantallaSafe);

  return cy.leerDatosGoogleSheets(hoja).then((filas) => {
    if (!filas || filas.length === 0) return cy.wrap([]);

    const headers = (filas[0] || []).map(safe);
    const idx = mapHeaderIndexes(headers);

    // Log de depuración para ver qué cabeceras y índices se detectan
    cy.log(`🔍 DEBUG Excel Reader - Cabeceras detectadas (${headers.length} columnas):`);
    headers.forEach((h, i) => {
      if (h && h.trim() !== '') {
        cy.log(`   Columna ${i}: "${h}"`);
      }
    });
    cy.log(`🔍 DEBUG Excel Reader - Índices mapeados:`);
    cy.log(`   dato_1: índice ${idx.dato_1} (${idx.dato_1 >= 0 ? `"${headers[idx.dato_1]}"` : 'NO ENCONTRADO'})`);
    cy.log(`   etiqueta_1: índice ${idx.etiqueta_1} (${idx.etiqueta_1 >= 0 ? `"${headers[idx.etiqueta_1]}"` : 'NO ENCONTRADO'})`);
    cy.log(`   valor_etiqueta_1: índice ${idx.valor_etiqueta_1} (${idx.valor_etiqueta_1 >= 0 ? `"${headers[idx.valor_etiqueta_1]}"` : 'NO ENCONTRADO'})`);

    const out = [];
    for (let i = 1; i < filas.length; i++) {
      const fila = (filas[i] || []).map(safe);
      if (fila.every(c => c === '')) continue;
      const caso = buildCaso(fila, idx);
      if (caso) {
        // Log específico para casos 32 y 33 antes de construir el objeto
        if (caso.caso === 'TC032' || caso.caso === 'TC033') {
          cy.log(`🔍 DEBUG Excel Reader - Fila ${i} (${caso.caso}):`);
          cy.log(`   Fila completa: [${fila.map((c, idx) => `col${idx}:"${c}"`).join(', ')}]`);
          cy.log(`   dato_1 desde fila[${idx.dato_1}]: "${fila[idx.dato_1] || '(vacío)'}"`);
          cy.log(`   etiqueta_1 desde fila[${idx.etiqueta_1}]: "${fila[idx.etiqueta_1] || '(vacío)'}"`);
          cy.log(`   valor_etiqueta_1 desde fila[${idx.valor_etiqueta_1}]: "${fila[idx.valor_etiqueta_1] || '(vacío)'}"`);
        }
        out.push(caso);
      }
    }

    // Ordena por número de TC
    out.sort((a, b) => {
      const na = parseInt(a.caso.replace(/\D/g, ''), 10);
      const nb = parseInt(b.caso.replace(/\D/g, ''), 10);
      return na - nb;
    });

    // Log resumen
    cy.log(`Leídos ${out.length} casos de "${hoja}"`);
    out.forEach(c => {
      cy.log(`${c.caso} | ${c.funcion} | ${c.nombre}`);
      // Log específico para casos 32 y 33 para depuración
      if (c.caso === 'TC032' || c.caso === 'TC033') {
        cy.log(`   🔍 DEBUG ${c.caso}: dato_1="${c.dato_1}", dato_2="${c.dato_2}", valor_etiqueta_1="${c.valor_etiqueta_1}"`);
      }
    });

    return cy.wrap(out);
  });
});