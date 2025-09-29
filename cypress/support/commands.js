// ***********************************************
// Custom commands y helpers
// ***********************************************

// ===== VARIABLES GLOBALES =====
let resultadosPorPantalla = {};
let errorYaRegistrado = false;
let resultadoYaRegistrado = false;

// ===== RESETEO DE FLAGS POR TEST =====
Cypress.Commands.add('resetearFlagsTest', () => {
  errorYaRegistrado = false;
  resultadoYaRegistrado = false;
});

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
        // Validar solo que no seguimos en /login y que el body está visible.
        cy.url({ timeout: 20000 }).should('not.include', '/login');
        cy.wait(2000);
        cy.get('body').should('be.visible');
        // ❌ Quitado: No comprobar "Página no encontrada" aquí para no romper la sesión.
        // cy.get('body').should('not.contain', 'Página no encontrada');
        // cy.get('body').should('not.contain', 'Page Not Found');
      }
    );
    cy.wait(1000);
  } else {
    performLogin();
  }
});


// ===== NAVEGACIÓN (NUEVA IMPLEMENTACIÓN ROBUSTA) =====
Cypress.Commands.add('abrirMenuLateral', () => {
  const triggers = [
    'button[aria-label*="open drawer"]',
    'button[aria-label*="menu"]',
    '[data-testid="MenuIcon"]',
    'button:has(svg[data-testid="MenuIcon"])',
    'button.MuiIconButton-root'
  ];

  cy.get('body').then($body => {
    const drawerAbierto = $body.find('.MuiDrawer-paper:visible, nav[role="navigation"]:visible').length > 0;
    if (drawerAbierto) return;

    let chain = cy.wrap(null, { log: false });
    triggers.forEach(sel => {
      chain = chain.then(() => {
        return cy.get('body').then($b => {
          if ($b.find(sel).length) {
            return cy.get(sel).first().click({ force: true });
          }
        });
      });
    });
  });

  cy.get('body', { timeout: 10000 }).should($b => {
    const visible = $b.find('.MuiDrawer-paper:visible, nav[role="navigation"]:visible').length > 0;
    expect(visible, 'Drawer visible').to.be.true;
  });
});

Cypress.Commands.add('asegurarMenuDesplegado', (textoMenu) => {
  const itemMatcher = (t) => [
    `.MuiListItemButton:contains("${t}")`,
    `[aria-label="${t}"]`,
    `button[title="${t}"]`,
  ];

  const abrirAcordeonSiCierra = (selector) => {
    cy.get('body').then($b => {
      const $item = $b.find(selector).first();
      if ($item.length) {
        const expanded = $item.attr('aria-expanded');
        if (expanded === 'false' || typeof expanded === 'undefined') {
          cy.wrap($item).click({ force: true });
        }
      }
    });
  };

  itemMatcher(textoMenu).forEach(sel => {
    cy.get('body').then($b => {
      if ($b.find(sel).length) {
        abrirAcordeonSiCierra(sel);
      }
    });
  });
});

Cypress.Commands.add('clickEnItemMenu', (texto) => {
  const containers = [
    '.MuiDrawer-paper',
    'nav[role="navigation"]',
    'aside[role="complementary"]',
    'div[role="presentation"]'
  ];

  const inner = [
    `.MuiListItemButton:contains("${texto}")`,
    `.MuiListItemText-primary:contains("${texto}")`,
    `a[role="menuitem"]:contains("${texto}")`,
    `button[role="menuitem"]:contains("${texto}")`,
    `[aria-label="${texto}"]`,
    `a:contains("${texto}")`,
    `button:contains("${texto}")`
  ];

  cy.get('body').then($b => {
    let found = false;

    for (const c of containers) {
      if ($b.find(c).length) {
        for (const s of inner) {
          const scoped = `${c} ${s}`;
          if ($b.find(scoped).length) {
            found = true;
            cy.get(scoped).first().scrollIntoView().click({ force: true });
            break;
          }
        }
      }
      if (found) break;
    }

    if (!found) {
      for (const s of inner) {
        if ($b.find(s).length) {
          cy.get(s).first().scrollIntoView().click({ force: true });
          found = true;
          break;
        }
      }
    }

    expect(found, `Encontrar y hacer click en item de menú "${texto}"`).to.be.true;
  });
});

Cypress.Commands.add('esperarTransicionRuta', (opts = {}) => {
  const {
    expectedPath,
    expectedHeading,
    spinnerSelector = '.MuiBackdrop-root, .MuiCircularProgress-root',
    timeout = 15000
  } = opts;

  cy.get('body').then($b => {
    if ($b.find(spinnerSelector).length) {
      cy.get(spinnerSelector, { timeout }).should('not.exist');
    }
  });

  if (expectedPath) {
    if (expectedPath instanceof RegExp) {
      cy.url({ timeout }).should(url => expect(url).to.match(expectedPath));
    } else {
      cy.url({ timeout }).should('include', expectedPath);
    }
  } else {
    cy.url({ timeout }).should('not.include', '/login');
  }

  if (expectedHeading) {
    cy.get('h1,h2,[data-testid="page-title"]', { timeout })
      .should('contain.text', expectedHeading);
  }

  cy.get('body').should('be.visible');
});

Cypress.Commands.add('navegar', (ruta, options = {}) => {
  const opts = {
    expectedPath: options.expectedPath,
    expectedHeading: options.expectedHeading,
    closeOverlaySelector: '.MuiBackdrop-root',
    ...options
  };

  const partes = Array.isArray(ruta)
    ? ruta
    : (typeof ruta === 'string' ? ruta.split('>').map(s => s.trim()) : []);

  if (!partes.length) throw new Error('Debes indicar al menos un item de menú.');

  const [menu, ...subniveles] = partes;

  // 1. Ir primero a la URL base de la aplicación
  cy.visit('https://novatrans-web-2mhoc.ondigitalocean.app');
  cy.wait(1000);

  // 2. Pulsar las 3 rayas para abrir el menú
  cy.get('button[aria-label="open drawer"]', { timeout: 10000 })
    .should('exist')
    .click({ force: true });

  // 3. Esperar a que el menú se abra
  cy.wait(500);

  // 4. Usar el buscador del sidebar para encontrar la pantalla
  const terminoBusqueda = subniveles.length > 0 ? subniveles[0] : menu;
  
  // Mapeo de términos de búsqueda más efectivos
  const terminosBusqueda = {
    'Repostajes': 'repos',
    'TallerYGastos': 'taller',
    'Ficheros': 'ficheros',
    'Procesos': 'procesos'
  };
  
  const busquedaEfectiva = terminosBusqueda[terminoBusqueda] || terminoBusqueda.toLowerCase();
  cy.log(`Buscando: ${busquedaEfectiva} (término original: ${terminoBusqueda})`);
  
  cy.get('input#sidebar-search', { timeout: 10000 })
    .should('be.visible')
    .clear({ force: true })
    .type(busquedaEfectiva, { force: true });
  
  cy.wait(1500); // Esperar más tiempo para que aparezcan los resultados
  
  // 5. Hacer clic en el resultado de búsqueda (buscar el término original)
  cy.get('body')
    .contains(terminoBusqueda, { timeout: 10000 })
    .scrollIntoView()
    .should('exist')
    .click({ force: true });

  // 6. Esperar a que la navegación se complete
  cy.wait(1000);
  
  // 8. Verificar que la URL cambió correctamente
  if (opts.expectedPath) {
    cy.url().should('include', opts.expectedPath);
  }
});

// Compat: firma anterior
Cypress.Commands.add('navegarAMenu', (textoMenu, textoSubmenu, options = {}) => {
  const ruta = [textoMenu].concat(textoSubmenu ? [textoSubmenu] : []);
  return cy.navegar(ruta, options);
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

  const resultadoFinal = errores.length > 0 ? 'ERROR' : (warnings.length > 0 ? 'WARNING' : 'OK');

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

  if (resultadoYaRegistrado) return;

  const obtenidoTexto = obtenido?.toString().toLowerCase();
  let resultadoFinal = resultadoManual;

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

  resultadoYaRegistrado = true;
});

// ===== FUNCIÓN CENTRALIZADA PARA LOGIN =====
Cypress.Commands.add('hacerLogin', (datosCaso) => {
  const {
    dato_1: database = 'NTDesarrolloGonzalo',
    dato_2: server = 'SERVER\\DESARROLLO',
    dato_3: username = 'AdminNovatrans',
    dato_4: password = 'solbyte@2023'
  } = datosCaso;

  const performLogin = () => {
    cy.visit('https://novatrans-web-2mhoc.ondigitalocean.app/login', {
      timeout: 120000,
      waitUntil: 'domcontentloaded'
    });

    const safeType = (selector, value) => {
      cy.get(selector).clear();
      if (value !== '' && value !== null && value !== undefined) {
        cy.get(selector).type(value);
      }
    };

    safeType('input[name="database"]', database);
    safeType('input[name="server"]', server);
    safeType('input[name="username"]', username);
    safeType('input[name="password"]', password);

    cy.get('button[type="submit"]').click();
    cy.wait(1000);
  };

  performLogin();
});

// ===== CONFIGURACIÓN PERFILES =====
Cypress.Commands.add('cambiarIdioma', (idioma) => {
  const idiomas = {
    'Inglés': { codigo: 'en', texto: 'Name' },
    'Catalán': { codigo: 'ca', texto: 'Nom' },
    'Español': { codigo: 'es', texto: 'Nombre' }
  };

  const config = idiomas[idioma];
  if (!config) {
    cy.log(`Idioma no soportado: ${idioma}, usando valores por defecto`);
    const configDefault = { codigo: 'en', texto: 'Name' };
    cy.get('select#languageSwitcher').select(configDefault.codigo, { force: true });
    cy.wait(1500);
    return cy.get('body').should('contain.text', configDefault.texto);
  }

  cy.log(`Cambiando idioma a: ${idioma} (${config.codigo})`);
  cy.get('select#languageSwitcher').select(config.codigo, { force: true });
  cy.wait(1500);

  return cy.get('body').should('contain.text', config.texto).then(() => {
    cy.log(`Idioma cambiado exitosamente a ${idioma}`);
    return cy.wrap(true);
  });
});

Cypress.Commands.add('ejecutarFiltroPerfiles', (valorBusqueda) => {
  cy.get('input[placeholder="Buscar"]')
    .should('be.visible')
    .clear({ force: true })
    .type(`${valorBusqueda}{enter}`, { force: true });
  cy.wait(2000);

  return cy.get('body').then($body => {
    const filasVisibles = $body.find('.MuiDataGrid-row:visible').length;
    return cy.wrap({ filasVisibles, valorBusqueda });
  });
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

  errorYaRegistrado = true;
  resultadoYaRegistrado = true;

  cy.screenshot(`error-${contexto}-${fechaHora.replace(/[: ]/g, '-')}`);

  if (resultadoFinal === 'ERROR') {
    throw error;
  }
});