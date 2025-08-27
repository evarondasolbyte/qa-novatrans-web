// ***********************************************
// Custom commands y helpers
// ***********************************************

// ===== VARIABLES GLOBALES =====
let resultadosPorPantalla = {};   // Acumulador por pantalla (para resumen)
let errorYaRegistrado = false;    // Flag histórico que ya tenías
let resultadoYaRegistrado = false; // <-- NUEVO: evita registrar 2 veces en el mismo test

// ===== RESETEO DE FLAGS POR TEST =====
Cypress.Commands.add('resetearFlagsTest', () => {
  errorYaRegistrado = false;
  resultadoYaRegistrado = false; // <-- importante resetear esto en cada test
});

// Saber si en este test ya se registró un resultado (OK/ERROR/WARNING)
Cypress.Commands.add('estaRegistrado', () => {
  return cy.wrap(resultadoYaRegistrado);
});

// ===== LOGIN =====
Cypress.Commands.add('login', ({
  database = 'NTDesarrolloGonzalo',
  server = 'SERVER\\DESARROLLO',
  username = 'AdminNovatrans',
  password = 'solbyte@2023',
  useSession = true
} = {}) => {

  const performLogin = () => {
    cy.visit('https://novatrans-web-2mhoc.ondigitalocean.app/login', {
      timeout: 120000,
      waitUntil: 'domcontentloaded'
    });

    const safeType = (selector, value) => {
      cy.get(selector).clear();
      if (value !== '') {
        cy.get(selector).type(value);
      }
    };

    safeType('input[name="database"]', database);
    safeType('input[name="server"]', server);
    safeType('input[name="username"]', username);
    safeType('input[name="password"]', password);

    cy.get('button[type="submit"]').click();
  };

  if (useSession) {
    cy.session(
      ['usuario-activo', database, server, username, password],
      () => {
        performLogin();
        cy.url({ timeout: 20000 }).should('include', '/dashboard');
        cy.get('header').should('exist');
      }
    );
    cy.visit('/dashboard'); // siempre
  } else {
    performLogin();
  }
});

// ===== NAVEGACIÓN MENÚ =====
Cypress.Commands.add('navegarAMenu', (textoMenu, textoSubmenu) => {
  cy.get('button[aria-label="open drawer"]', { timeout: 10000 }).should('exist').click();
  cy.get('.MuiDrawer-root', { timeout: 10000 }).should('exist');

  cy.get('.MuiDrawer-root')
    .contains('span', textoMenu, { timeout: 10000 })
    .scrollIntoView()
    .should('exist')
    .closest('div[role="button"]')
    .click();

  cy.get('.MuiDrawer-root')
    .contains('span', textoSubmenu, { timeout: 10000 })
    .scrollIntoView()
    .should('exist')
    .click();
});

// ===== ACUMULADOR POR PANTALLA =====
Cypress.Commands.add('agregarResultadoPantalla', (params) => {
  const {
    numero, nombre, esperado, obtenido, resultado, pantalla,
    fechaHora = new Date().toLocaleString('sv-SE').replace('T', ' '),
    observacion
  } = params;

  if (!resultadosPorPantalla[pantalla]) {
    resultadosPorPantalla[pantalla] = { resultados: [], fechaHora };
  }

  resultadosPorPantalla[pantalla].resultados.push({
    numero, nombre, esperado, obtenido, resultado, fechaHora, observacion
  });
});

// ===== PROCESAR RESUMEN DE UNA PANTALLA =====
Cypress.Commands.add('procesarResultadosPantalla', (pantalla) => {
  if (!resultadosPorPantalla[pantalla] || resultadosPorPantalla[pantalla].resultados.length === 0) return;

  const { resultados } = resultadosPorPantalla[pantalla];
  const errores = resultados.filter(r => r.resultado === 'ERROR');
  const warnings = resultados.filter(r => r.resultado === 'WARNING');
  const oks = resultados.filter(r => r.resultado === 'OK');

  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0') +
    now.getMilliseconds().toString().padStart(3, '0');

  const slugifyAscii = (str) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/ñ/gi, 'n').replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-').replace(/-$/g, '').replace(/^-/, '');

  const testId = `${slugifyAscii(pantalla)}_${timestamp}`;

  const fechaHoraFormateada =
    now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0');

  // LOG detallado: OK, ERROR y WARNING
  const enviarLog = (resultado) => {
    cy.task('guardarEnLog', {
      testId: testId,
      test: pantalla,
      paso: `TC${String(resultado.numero).padStart(3, '0')}`,
      fechaHora: fechaHoraFormateada,
      resultado: resultado.resultado,
      nombre: resultado.nombre,
      esperado: resultado.esperado,
      obtenido: resultado.obtenido,
      observacion: resultado.observacion || ''
    });
  };
  oks.forEach(enviarLog);
  errores.forEach(enviarLog);
  warnings.forEach(enviarLog);

  // Resultado final
  const resultadoFinal = errores.length > 0 ? 'ERROR' : (warnings.length > 0 ? 'WARNING' : 'OK');

  // Resumen en hoja "Resultados Pruebas"
  cy.task('guardarEnExcel', {
    numero: testId,
    nombre: fechaHoraFormateada,
    esperado: pantalla,
    obtenido: `Pruebas de ${pantalla}`,
    resultado: resultadoFinal,
    fechaHora: fechaHoraFormateada,
    archivo: 'reportes_pruebas_novatrans.xlsx',
    pantalla: 'Resultados Pruebas',
    ok: oks.length.toString(),
    warning: warnings.length.toString(),
    error: errores.length.toString()
  });

  delete resultadosPorPantalla[pantalla];
});

// ===== REGISTRAR RESULTADOS (único por test) =====
Cypress.Commands.add('registrarResultados', (params) => {
  const {
    numero, nombre, esperado, obtenido, resultado: resultadoManual,
    archivo = 'reportes_pruebas_novatrans.xlsx',
    fechaHora = new Date().toLocaleString('sv-SE').replace('T', ' '),
    pantalla, observacion
  } = params;

  // Si ya registré algo en este test, no vuelvo a escribir
  if (resultadoYaRegistrado) return;

  const obtenidoTexto = obtenido?.toString().toLowerCase();
  let resultadoFinal = resultadoManual;

  // Inferencia si no viene forzado
  if (!resultadoFinal) {
    if (esperado === obtenido) {
      resultadoFinal = 'OK';
    } else if (
      obtenidoTexto?.includes('no hay datos') ||
      obtenidoTexto?.includes('tabla vacía') ||
      obtenidoTexto?.includes('sin resultados') ||
      obtenidoTexto?.includes('no se encontraron') ||
      obtenidoTexto?.includes('no existen') ||
      obtenidoTexto?.includes('vacío') ||
      obtenidoTexto?.includes('sin coincidencias')
    ) {
      resultadoFinal = 'WARNING';
    } else {
      resultadoFinal = 'ERROR';
    }
  }

  if (pantalla) {
    cy.agregarResultadoPantalla({
      numero, nombre, esperado, obtenido, resultado: resultadoFinal,
      pantalla, fechaHora, observacion
    });
  } else {
    cy.task('guardarEnExcel', {
      numero, nombre, esperado, obtenido, resultado: resultadoFinal,
      fechaHora, archivo, pantalla, observacion
    });
  }

  // Bloquear nuevos registros en este test
  resultadoYaRegistrado = true;
});

// ===== CAPTURA DE ERRORES =====
Cypress.Commands.add('capturarError', (contexto, error, data = {}) => {
  const fechaHora = data.fechaHora || new Date().toLocaleString('sv-SE').replace('T', ' ');
  const mensaje = error.message || error;
  const obtenidoTexto = mensaje?.toString().toLowerCase();

  const resultadoFinal = (
    obtenidoTexto?.includes('no hay datos') ||
    obtenidoTexto?.includes('tabla vacía') ||
    obtenidoTexto?.includes('sin resultados') ||
    obtenidoTexto?.includes('no se encontraron') ||
    obtenidoTexto?.includes('no existen') ||
    obtenidoTexto?.includes('vacío') ||
    obtenidoTexto?.includes('sin coincidencias')
  ) ? 'WARNING' : 'ERROR';

  const registro = {
    numero: data.numero || '',
    nombre: data.nombre || contexto,
    esperado: data.esperado || '',
    obtenido: data.obtenido || mensaje,
    resultado: resultadoFinal,
    fechaHora,
    archivo: data.archivo || 'reportes_pruebas_novatrans.xlsx',
    pantalla: data.pantalla || '',
    observacion: data.observacion || ''
  };

  if (data.pantalla) {
    cy.agregarResultadoPantalla(registro);
  } else {
    cy.task('guardarEnExcel', registro);
  }

  // Marcar flags para que no se auto-registre OK al final
  errorYaRegistrado = true;
  resultadoYaRegistrado = true;

  cy.screenshot(`error-${contexto}-${fechaHora.replace(/[: ]/g, '-')}`);

  if (resultadoFinal === 'ERROR') {
    throw error;
  }
});