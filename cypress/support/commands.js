// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
// cypress/support/helpers.js

// Variable global para almacenar resultados por pantalla
let resultadosPorPantalla = {};
// Variable para controlar si ya se registró un error
let errorYaRegistrado = false;

// Comando para resetear el flag de error al inicio de cada test
Cypress.Commands.add('resetearErrorFlag', () => {
  errorYaRegistrado = false;
});

// Comando personalizado de Cypress para hacer login en la app de NovaTrans.
// Me permite usarlo tanto en casos positivos (con sesión) como en negativos (sin sesión) según necesidad.
// Recibe las credenciales como parámetros opcionales, con valores por defecto para el login válido.

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
      ['usuario-activo', database, server, username, password], // Para que cambie si cambian los datos
      () => {
        performLogin();
        cy.url({ timeout: 20000 }).should('include', '/dashboard');
        cy.get('header').should('exist');
      }
    );

    //Esto se ejecuta siempre, incluso si la sesión ya existía
    cy.visit('/dashboard');
  } else {
    performLogin();
  }
});

Cypress.Commands.add('navegarAMenu', (textoMenu, textoSubmenu) => {
  //Abre el menú. El selector es case-insensitive con aria-label
  cy.get('button[aria-label="open drawer"]', { timeout: 10000 })
    .should('exist')
    .click();

  //Espero a que el drawer se cargue correctamente
  cy.get('.MuiDrawer-root', { timeout: 10000 }).should('exist');

  //Hago clic en el menú principal (ej. "Configuracion", "Procesos", etc.)
  cy.get('.MuiDrawer-root')
    .contains('span', textoMenu, { timeout: 10000 }) //Busca por texto exacto
    .scrollIntoView()
    .should('exist')
    .closest('div[role="button"]') //Va al contenedor clickeable
    .click();

  //Hago clic en el submenú indicado (ej. "Perfiles", "Órdenes de Carga", etc.)
  cy.get('.MuiDrawer-root')
    .contains('span', textoSubmenu, { timeout: 10000 })
    .scrollIntoView()
    .should('exist')
    .click();
});

// Este comando lo uso para acumular resultados temporalmente según la pantalla que se está testeando.
// Así puedo hacer un resumen al final (OK o con errores).
// También guardo la fecha y la hora juntas en formato local (ej: 2025-08-08 10:21:00).
Cypress.Commands.add('agregarResultadoPantalla', (params) => {
  const {
    numero,
    nombre,
    esperado,
    obtenido,
    resultado,
    pantalla,
    // Si no se pasa fechaHora, la genero en formato local yyyy-mm-dd hh:mm:ss
    fechaHora = new Date().toLocaleString('sv-SE').replace('T', ' '),
    observacion
  } = params;

  // Si es la primera vez que se registra esta pantalla, la inicializo con su array
  if (!resultadosPorPantalla[pantalla]) {
    resultadosPorPantalla[pantalla] = { resultados: [], fechaHora };
  }

  // Agrego este resultado a la lista de esa pantalla
  resultadosPorPantalla[pantalla].resultados.push({
    numero,
    nombre,
    esperado,
    obtenido,
    resultado,
    fechaHora,
    observacion
  });
});

// Este lo llamo al final de cada suite de pruebas para una pantalla concreta.
// Recorre todos los resultados guardados de esa pantalla:
// - Guarda todos los OK en Log
// - Guarda todos los ERROR en Log (por separado)
// - Genera un resumen en Resultados Pruebas
Cypress.Commands.add('procesarResultadosPantalla', (pantalla) => {
  if (!resultadosPorPantalla[pantalla] || resultadosPorPantalla[pantalla].resultados.length === 0) return;

  const { resultados, fechaHora } = resultadosPorPantalla[pantalla];
  const errores = resultados.filter(r => r.resultado === 'ERROR');
  const warnings = resultados.filter(r => r.resultado === 'WARNING');
  const oks = resultados.filter(r => r.resultado === 'OK');

  // Generar timestamp para el Test-ID
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0') +
    now.getMilliseconds().toString().padStart(3, '0');

  // Función auxiliar para normalizar nombres de pantallas en el Test-ID
  const slugifyAscii = (str) =>
    str
      .normalize('NFD')                    // separa letra + acento
      .replace(/[\u0300-\u036f]/g, '')     // elimina diacríticos (áéíóúü…)
      .replace(/ñ/gi, 'n')                 // ñ -> n
      .replace(/[^a-zA-Z0-9]/g, '-')       // resto a guiones
      .replace(/-+/g, '-')                 // colapsa guiones seguidos
      .replace(/^-|-$/g, '');              // quita guiones extremos

  // Crear Test-ID con el formato: NombrePantalla_Timestamp
  const testId = `${slugifyAscii(pantalla)}_${timestamp}`;

  // Formatear fecha y hora para la columna "Fecha y Hora" (hora local)
  const fechaHoraFormateada = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0');

  // Guardar TODOS los tests individuales (OK, ERROR, WARNING) en el log
  // Primero los tests OK
  oks.forEach(resultado => {
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
  });

  // Luego los tests ERROR
  errores.forEach(resultado => {
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
  });

  // Luego los tests WARNING
  warnings.forEach(resultado => {
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
  });

  // Determino el resultado final de la pantalla
  let resultadoFinal;
  if (errores.length === 0 && warnings.length === 0) {
    resultadoFinal = 'OK';
  } else if (errores.length > 0) {
    resultadoFinal = 'ERROR';
  } else {
    resultadoFinal = 'WARNING';
  }

  // Guardo el resumen SOLO en la hoja "Resultados Pruebas" (NO en Log)
  cy.log(`Guardando resumen en "Resultados Pruebas": Test-ID=${testId}, Fecha=${fechaHoraFormateada}, Test=${pantalla}, OK=${oks.length}, WARNING=${warnings.length}, ERROR=${errores.length}`);

  // Usar directamente cy.task para "Resultados Pruebas" sin pasar por guardarEnLog
  cy.task('guardarEnExcel', {
    numero: testId,           // Test-ID
    nombre: fechaHoraFormateada, // Fecha y Hora
    esperado: pantalla,       // Test (nombre de la plantilla)
    obtenido: `Pruebas de ${pantalla}`, // Nombre
    resultado: resultadoFinal, // Resultado (OK/ERROR/WARNING)
    fechaHora: fechaHoraFormateada,
    archivo: 'reportes_pruebas_novatrans.xlsx',
    pantalla: 'Resultados Pruebas',
    ok: oks.length.toString(),        // OK
    warning: warnings.length.toString(), // WARNING
    error: errores.length.toString()   // ERROR
  });

  // Limpio los resultados en memoria para que no se mezclen en otras suites
  delete resultadosPorPantalla[pantalla];
});

// Este lo llamo dentro de cada test para registrar el resultado.
// Si no paso un resultado manual (OK/ERROR/WARNING), lo infiere comparando el esperado y el obtenido.
Cypress.Commands.add('registrarResultados', (params) => {
  const {
    numero,
    nombre,
    esperado,
    obtenido,
    resultado: resultadoManual,
    archivo = 'reportes_pruebas_novatrans.xlsx',
    fechaHora = new Date().toLocaleString('sv-SE').replace('T', ' '),
    pantalla,
    observacion
  } = params;

  const obtenidoTexto = obtenido?.toString().toLowerCase();

  let resultadoFinal = resultadoManual;

  // Si no lo forzo manualmente, lo detecto por comparación
  if (!resultadoFinal) {
    if (esperado === obtenido) {
      resultadoFinal = 'OK';
    } else if (
      obtenidoTexto.includes('no hay datos') ||
      obtenidoTexto.includes('tabla vacía') ||
      obtenidoTexto.includes('sin resultados') ||
      obtenidoTexto.includes('no se encontraron') ||
      obtenidoTexto.includes('no existen') ||
      obtenidoTexto.includes('vacío') ||
      obtenidoTexto.includes('sin coincidencias')
    ) {
      resultadoFinal = 'WARNING';
    } else {
      resultadoFinal = 'ERROR';
    }
  }

  // Si estoy agrupando por pantalla, lo acumulo ahí
  if (pantalla) {
    // Solo registrar si no se registró ya un error para este test
    if (!errorYaRegistrado) {
      cy.agregarResultadoPantalla({
        numero,
        nombre,
        esperado,
        obtenido,
        resultado: resultadoFinal,
        pantalla,
        fechaHora,
        observacion
      });
    }
  } else {
    // Si no, lo escribo directo al Excel
    cy.task('guardarEnExcel', {
      numero,
      nombre,
      esperado,
      obtenido,
      resultado: resultadoFinal,
      fechaHora,
      archivo,
      pantalla,
      observacion
    });
  }
});

// Este lo uso dentro de un `cy.on('fail')` para capturar errores automáticos.
// Guarda el error en Excel y además saca screenshot.
Cypress.Commands.add('capturarError', (contexto, error, data = {}) => {
  const fechaHora = data.fechaHora || new Date().toLocaleString('sv-SE').replace('T', ' ');
  const mensaje = error.message || error;
  const obtenidoTexto = mensaje?.toString().toLowerCase();

  // Intento clasificar el error como ERROR real o solo WARNING
  let resultadoFinal;
  if (
    obtenidoTexto.includes('no hay datos') ||
    obtenidoTexto.includes('tabla vacía') ||
    obtenidoTexto.includes('sin resultados') ||
    obtenidoTexto.includes('no se encontraron') ||
    obtenidoTexto.includes('no existen') ||
    obtenidoTexto.includes('vacío') ||
    obtenidoTexto.includes('sin coincidencias')
  ) {
    resultadoFinal = 'WARNING';
  } else {
    resultadoFinal = 'ERROR';
  }

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

  // Si estoy agrupando por pantalla, lo acumulo ahí
  if (data.pantalla) {
    cy.agregarResultadoPantalla(registro);
    // Marcar que ya se registró un error para este test
    errorYaRegistrado = true;
  } else {
    cy.task('guardarEnExcel', registro);
  }

  // Screenshot con nombre basado en el contexto y la hora
  cy.screenshot(`error-${contexto}-${fechaHora.replace(/[: ]/g, '-')}`);

  // Si es un error real, lo relanzo para que falle el test
  if (resultadoFinal === 'ERROR') {
    throw error;
  }
});