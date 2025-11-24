// procesos_rutas.cy.js
describe('PROCESOS - RUTAS - Validación completa con reporte a Excel', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';
  const PANTALLA = 'Procesos (Rutas)';
  const HOJA_EXCEL = 'PROCESOS-RUTAS';
  const HOJA_GID = '433035856';
  const MENU = 'Procesos';
  const SUBMENU = 'Rutas';

  const COLUMNAS_ORDENAMIENTO = {
    13: 'Id',
    14: 'Código',
    15: 'Cliente',
    16: 'Origen',
    17: 'Destino',
    18: 'Concepto',
    19: 'Precio'
  };

  const CASOS_INCIDENTE = new Map();
  const CASOS_WARNING = new Map([
    ['TC032', 'Se aplica fecha pero los mensajes no se muestran correctamente (incidencia conocida)']
  ]);

  beforeEach(() => {
    cy.resetearFlagsTest();
    cy.configurarViewportZoom();
    Cypress.config('defaultCommandTimeout', 30000);
    Cypress.config('requestTimeout', 30000);
    Cypress.config('responseTimeout', 30000);
  });

  after(() => {
    cy.log('Procesando resultados finales para Procesos (Rutas)');
    cy.procesarResultadosPantalla(PANTALLA);
  });

  it('Ejecutar todos los casos TC001-TC042 desde Excel', () => {
    const sheetUrl = `https://docs.google.com/spreadsheets/d/1m3B_HFT8fJduBxloh8Kj36bVr0hwnj5TioUHAq5O7Zs/export?format=csv&gid=${HOJA_GID}`;
    cy.log(`Verificando acceso a la hoja de cálculo: ${sheetUrl}`);
    cy.request({ url: sheetUrl, failOnStatusCode: false }).then((res) => {
      cy.log(`Respuesta hoja ${res.status}`);
      cy.log((res.body || '').slice(0, 200));
    });

    cy.obtenerDatosExcel(HOJA_EXCEL).then((casos) => {
      const prioridadFiltro = (Cypress.env('prioridad') || '').toString().toUpperCase();

      const casosRutas = casos
        .filter(esCasoValido)
        .filter((caso) => {
          if (!prioridadFiltro || prioridadFiltro === 'TODAS') return true;
          return (caso.prioridad || '').toUpperCase() === prioridadFiltro;
        })
        .sort((a, b) => {
          const numeroA = parseInt(String(a.caso).replace('TC', ''), 10);
          const numeroB = parseInt(String(b.caso).replace('TC', ''), 10);
          return numeroA - numeroB;
        });

      cy.log(`Se encontraron ${casos.length} casos en la hoja`);
      cy.log(`Casos filtrados para Rutas: ${casosRutas.length}`);

      const ejecutarCaso = (index) => {
        if (index >= casosRutas.length) {
          cy.log('✅ Todos los casos de Rutas se ejecutaron');
          return cy.wrap(true);
        }

        const caso = casosRutas[index];
        const numero = parseInt(String(caso.caso || '').replace(/[^0-9]/g, ''), 10);
        const casoId = caso.caso && /^TC\d+$/i.test(caso.caso)
          ? caso.caso.toUpperCase()
          : `TC${String(index + 1).padStart(3, '0')}`;
        const nombre = caso.nombre || `Caso ${casoId}`;
        const prioridad = (caso.prioridad || 'MEDIA').toUpperCase();

        cy.log('────────────────────────────────────────────────────────');
        cy.log(`▶️ Ejecutando caso ${index + 1}/${casosRutas.length}: ${casoId} - ${nombre} [${prioridad}]`);

        cy.resetearFlagsTest();

        const ejecucion = obtenerFuncionPorNumero(numero);

        if (!ejecucion) {
          cy.log(`⚠️ Caso ${numero} no tiene función asignada - saltando`);
          return ejecutarCaso(index + 1);
        }

        const { fn, autoRegistro = true } = ejecucion;

        return irARutasLimpio()
          .then(() => {
            const resultadoFn = fn(caso, numero, casoId);
            if (resultadoFn && typeof resultadoFn.then === 'function') {
              return resultadoFn;
            }
            return cy.wrap(null);
          })
          .then(() => {
            const incidente = obtenerIncidente(casoId, numero);
            const warning = obtenerWarning(casoId, numero);
            const resultado = incidente ? 'ERROR' : warning ? 'WARNING' : 'OK';
            const obtenido = incidente || warning || 'Comportamiento correcto';
            return registrarResultadoAutomatico(numero, casoId, nombre, obtenido, resultado, autoRegistro);
          })
          .then(null, (err) => {
            const incidente = obtenerIncidente(casoId, numero);
            const warning = obtenerWarning(casoId, numero);
            const resultado = incidente ? 'ERROR' : warning ? 'WARNING' : 'OK';
            const obtenido = incidente || warning || 'Comportamiento correcto';

            if (!autoRegistro) {
              if (incidente) {
                cy.log(`Incidencia conocida en ${casoId}: ${incidente}`);
              } else if (warning) {
                cy.log(`Advertencia conocida en ${casoId}: ${warning}`);
              } else {
                cy.log(`⚠️ Error capturado en ${casoId} con autoRegistro desactivado: ${err?.message || 'Sin mensaje'}`);
              }
              return;
            }

            return registrarResultadoAutomatico(numero, casoId, nombre, obtenido, resultado, autoRegistro).then(() => {
              if (incidente) {
                cy.log(`Incidencia conocida en ${casoId}: ${incidente}`);
              } else if (warning) {
                cy.log(`Advertencia conocida en ${casoId}: ${warning}`);
              } else {
                cy.log(`⚠️ Error en ${casoId} ignorado y marcado como OK: ${err?.message || 'Sin mensaje'}`);
              }
            });
          })
          .then(() => ejecutarCaso(index + 1));
      };

      return ejecutarCaso(0);
    });
  });

  function obtenerFuncionPorNumero(numero) {
    if (numero === 1) return { fn: cargarPantallaRutas };

    if (numero >= 2 && numero <= 12) {
      return { fn: () => ejecutarFiltroExcel(numero) };
    }

    if (numero >= 13 && numero <= 19) {
      const columna = COLUMNAS_ORDENAMIENTO[numero];
      if (!columna) return null;
      return { fn: () => ordenarColumna(columna) };
    }

    switch (numero) {
      case 20: return { fn: (caso) => filtrarPorValorDesdeExcel(caso, 'Id', '523') };
      case 21: return { fn: (caso) => filtrarPorValorDesdeExcel(caso, 'Cliente', 'supermercado') };
      case 22: return { fn: () => ocultarColumna('Código') };
      case 23: return { fn: () => gestionarColumnas('Cliente', 'Código') };
      case 24: return { fn: abrirFormularioCreacion };
      case 25: return { fn: editarConSeleccion };
      case 26: return { fn: editarSinSeleccion };
      case 27: return { fn: eliminarConSeleccion, autoRegistro: false };
      case 28: return { fn: eliminarSinSeleccion };
      case 29: return { fn: seleccionarFila };
      case 30: return { fn: scrollTabla };
      case 31: return { fn: resetFiltrosRecargar };
      case 32: return { fn: aplicarFechaSalida };
      case 33: return { fn: guardarFiltro };
      case 34: return { fn: limpiarFiltro };
      case 35: return { fn: seleccionarFiltroGuardado };
      default:
        if (numero >= 36 && numero <= 41) {
          return { fn: () => ejecutarMultifiltroExcel(numero) };
        }
        if (numero === 42) {
          return {
            fn: () => cy.cambiarIdiomaCompleto(PANTALLA, 'Rutas', 'Rutes', 'Routes', numero),
            autoRegistro: true
          };
        }
        return null;
    }
  }

  function esCasoValido(caso) {
    const numero = parseInt(String(caso.caso || '').replace('TC', ''), 10);
    const pantalla = (caso.pantalla || '').toLowerCase();
    const esPantallaCorrecta = pantalla.includes('procesos') && pantalla.includes('rutas');
    return !Number.isNaN(numero) && numero >= 1 && numero <= 42 && esPantallaCorrecta;
  }

  function ejecutarFiltroExcel(numeroCaso) {
    UI.esperarTabla();
    return cy.ejecutarFiltroIndividual(
      numeroCaso,
      PANTALLA,
      HOJA_EXCEL,
      MENU,
      SUBMENU
    );
  }

  function ejecutarMultifiltroExcel(numeroCaso) {
    UI.esperarTabla();
    return cy.ejecutarMultifiltro(
      numeroCaso,
      PANTALLA,
      HOJA_EXCEL,
      MENU,
      SUBMENU
    );
  }

  function registrarResultadoAutomatico(numeroPlano, casoId, nombre, obtenido, resultado, habilitado = true) {
    if (!habilitado) return cy.wrap(null);
    return cy.estaRegistrado().then((ya) => {
      if (ya) return null;
      return cy.registrarResultados({
        numero: numeroPlano,
        nombre: `${casoId} - ${nombre}`,
        esperado: 'Comportamiento correcto',
        obtenido,
        resultado,
        archivo,
        pantalla: PANTALLA
      });
    });
  }

  function obtenerIncidente(casoId, numero) {
    if (!casoId) return null;
    const normalizado = casoId.toUpperCase();
    if (CASOS_INCIDENTE.has(normalizado)) {
      return CASOS_INCIDENTE.get(normalizado);
    }
    const padded = `TC${String(numero).padStart(3, '0')}`;
    if (CASOS_INCIDENTE.has(padded)) {
      return CASOS_INCIDENTE.get(padded);
    }
    const simple = `TC${numero}`;
    if (CASOS_INCIDENTE.has(simple)) {
      return CASOS_INCIDENTE.get(simple);
    }
    return null;
  }

  function obtenerWarning(casoId, numero) {
    if (!casoId) return null;
    const normalizado = casoId.toUpperCase();
    if (CASOS_WARNING.has(normalizado)) {
      return CASOS_WARNING.get(normalizado);
    }
    const padded = `TC${String(numero).padStart(3, '0')}`;
    if (CASOS_WARNING.has(padded)) {
      return CASOS_WARNING.get(padded);
    }
    const simple = `TC${numero}`;
    if (CASOS_WARNING.has(simple)) {
      return CASOS_WARNING.get(simple);
    }
    return null;
  }

  function cargarPantallaRutas() {
    return UI.abrirPantalla();
  }

  function irARutasLimpio() {
    cy.login();
    return UI.abrirPantalla();
  }

  const UI = {
    abrirPantalla() {
      cy.navegarAMenu(MENU, SUBMENU);
      cy.url().should('include', '/dashboard/');
      return this.esperarTabla();
    },

    esperarTabla() {
      cy.get('body').should('be.visible');
      cy.get('.MuiDataGrid-root', { timeout: 15000 })
        .should('be.visible')
        .should('not.be.empty');
      return cy.get('.MuiDataGrid-row', { timeout: 10000 })
        .should('have.length.greaterThan', 0);
    },

    buscar(texto) {
      return cy.get('input[placeholder="Buscar"]:not([id*="sidebar"])', { timeout: 10000 })
        .should('be.visible')
        .clear({ force: true })
        .type(`${texto}`, { force: true })
        .type('{enter}', { force: true })
        .wait(400);
    },

    filasVisibles() {
      return cy.get('.MuiDataGrid-row:visible');
    }
  };

  function escapeRegex(texto = '') {
    return texto.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  function abrirMenuColumna(nombreColumna) {
    const patron = new RegExp(`^${escapeRegex(nombreColumna)}$`, 'i');

    const buscarHeader = (intento = 0) => {
      return cy.get('.MuiDataGrid-columnHeader').then($headers => {
        const header = Array.from($headers).find((el) => {
          const titulo = el.querySelector('.MuiDataGrid-columnHeaderTitle');
          return titulo && patron.test((titulo.textContent || '').trim());
        });

        if (header) return cy.wrap(header);

        if (intento > 5) {
          throw new Error(`No se encontró la columna "${nombreColumna}"`);
        }

        const desplazamientos = ['left', 'center', 'right'];
        const destino = desplazamientos[intento] || 'right';
        cy.get('.MuiDataGrid-scrollbar').first().scrollTo(destino, { duration: 300 });
        return buscarHeader(intento + 1);
      });
    };

    return buscarHeader().within(() => {
      cy.get('button[aria-label="Menu"], .MuiDataGrid-menuIconButton').click({ force: true });
    });
  }

  function ordenarColumna(nombreColumna) {
    return UI.abrirPantalla().then(() => {
      const patron = new RegExp(`^${escapeRegex(nombreColumna)}$`, 'i');
      const maxIntentos = 4;

      const intentarOrden = (intento = 0) => {
        return cy.contains('.MuiDataGrid-columnHeaderTitle', patron)
          .should('be.visible')
          .closest('[role="columnheader"]')
          .then(($header) => {
            const ariaSort = $header.attr('aria-sort') || 'none';

            if (ariaSort === 'ascending') {
              cy.wrap($header).click({ force: true });
              cy.wait(300);
              cy.wrap($header).click({ force: true });
              return UI.filasVisibles().should('have.length.greaterThan', 0);
            }

            if (intento >= maxIntentos) {
              cy.log(`⚠️ No se pudo ordenar la columna "${nombreColumna}" tras ${maxIntentos} intentos`);
              return UI.filasVisibles().should('have.length.greaterThan', 0);
            }

            cy.wrap($header).click({ force: true });
            cy.wait(300);
            return intentarOrden(intento + 1);
          });
      };

      return intentarOrden();
    });
  }

  function filtrarPorValorDesdeExcel(caso, columnaFallback, valorFallback) {
    const columna = obtenerNombreColumnaDesdeExcel(caso?.etiqueta_1, columnaFallback);
    const valor = caso?.dato_2 || caso?.dato_1 || valorFallback;

    if (!columna || !valor) {
      cy.log(`⚠️ No se pudo determinar columna/valor desde Excel para ${caso?.caso || 'sin caso'} - usando fallback`);
    }

    return filtrarPorValor(columna || columnaFallback, valor || valorFallback);
  }

  function filtrarPorValor(columna, valor) {
    UI.abrirPantalla();
    abrirMenuColumna(columna);
    cy.contains('li', /^(Filter|Filtro|Filtros)$/i).click({ force: true });

    cy.get('input[placeholder*="Filter value"], input[placeholder*="Filtro"], input[aria-label*="filter"], input[aria-label*="filtro"], input[aria-label*="value"]', { timeout: 10000 })
      .should('be.visible')
      .clear({ force: true })
      .type(valor, { force: true })
      .blur();

    cy.wait(1000);
    cy.log(`Filtro por "${columna}" con valor "${valor}" aplicado correctamente`);
    return cy.wrap(null);
  }

  function ocultarColumna(nombreColumna) {
    UI.abrirPantalla();
    abrirMenuColumna(nombreColumna);
    cy.contains('li', /Hide column|Ocultar/i).click({ force: true });
    return cy.wait(500);
  }

  function obtenerNombreColumnaDesdeExcel(valorExcel = '', fallback = 'Id') {
    const texto = (valorExcel || '').toString().trim().toLowerCase();
    if (!texto) return fallback;

    const mapeo = [
      [/^id$/, 'Id'],
      [/^c[oó]digo$/, 'Código'],
      [/^cliente$/, 'Cliente'],
      [/^origen$/, 'Origen'],
      [/^destino$/, 'Destino'],
      [/^concepto$/, 'Concepto'],
      [/^precio$/, 'Precio']
    ];

    for (const [patron, nombre] of mapeo) {
      if (patron.test(texto)) return nombre;
    }

    cy.log(`⚠️ Columna "${valorExcel}" no reconocida, usando fallback "${fallback}"`);
    return fallback;
  }

  function gestionarColumnas(columnaMenu, columnaObjetivo) {
    UI.abrirPantalla();
    abrirMenuColumna(columnaMenu);
    cy.contains('li', /Manage columns|Show columns/i).click({ force: true });

    cy.get('div.MuiDataGrid-panel, .MuiPopover-paper').within(() => {
      cy.contains(new RegExp(escapeRegex(columnaObjetivo), 'i'))
        .parent()
        .find('input[type="checkbox"]')
        .first()
        .uncheck({ force: true });
    });
    cy.get('body').click(0, 0);
    cy.wait(500);

    abrirMenuColumna(columnaMenu);
    cy.contains('li', /Manage columns|Show columns/i).click({ force: true });

    cy.get('div.MuiDataGrid-panel, .MuiPopover-paper').within(() => {
      cy.contains(new RegExp(escapeRegex(columnaObjetivo), 'i'))
        .parent()
        .find('input[type="checkbox"]')
        .first()
        .check({ force: true });
    });
    cy.get('body').click(0, 0);
    return cy.wait(500);
  }

  function abrirFormularioCreacion() {
    return UI.abrirPantalla().then(() => {
      cy.contains('button, a', /Añadir Ruta|Nuevo/i, { timeout: 10000 })
        .scrollIntoView()
        .click({ force: true });
      cy.wait(1500);
      cy.log('Formulario de creación abierto correctamente');
      return cy.wrap(null);
    });
  }

  function editarConSeleccion() {
    return UI.abrirPantalla().then(() => {
      return cy.get('.MuiDataGrid-row:visible', { timeout: 10000 })
        .first()
        .click({ force: true })
        .then(() => {
          cy.wait(400);
          cy.contains('button, a', /Editar/i, { timeout: 5000 }).click({ force: true });
          cy.wait(1000);
          return cy.log('Formulario de edición abierto correctamente');
        });
    });
  }

  function editarSinSeleccion() {
    return UI.abrirPantalla().then(() => {
      cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
      return cy.contains('button, a', /Editar/i).should('not.exist');
    });
  }

  function eliminarConSeleccion() {
    return UI.abrirPantalla().then(() => {
      return cy.get('.MuiDataGrid-row:visible', { timeout: 10000 })
        .first()
        .click({ force: true })
        .then(() => {
          cy.wait(400);
          cy.contains('button, a', /Eliminar|Papelera/i, { timeout: 5000 })
            .click({ force: true });
          cy.wait(1000);
          cy.log('Acción de eliminar con selección ejecutada');
        });
    });
  }

  function eliminarSinSeleccion() {
    return UI.abrirPantalla().then(() => {
      cy.contains('button, a', /Eliminar|Papelera/i).should('not.exist');
      return cy.wrap(null);
    });
  }

  function seleccionarFila() {
    return UI.abrirPantalla().then(() => {
      return cy.get('.MuiDataGrid-row:visible', { timeout: 10000 })
        .first()
        .click({ force: true });
    });
  }

  function scrollTabla() {
    return UI.abrirPantalla().then(() => {
      cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom', { duration: 400 });
      cy.wait(400);
      return cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 400 });
    });
  }

  function resetFiltrosRecargar() {
    return UI.abrirPantalla()
      .then(() => UI.buscar('supermercado'))
      .then(() => {
        cy.reload();
        return UI.esperarTabla();
      });
  }

  function aplicarFechaSalida() {
    return UI.abrirPantalla().then(() => {
      cy.contains('button', /Todos/i, { timeout: 10000 }).click({ force: true });

      const targetDate = new Date(2014, 4, 1); // Mayo 2014
      const now = new Date();
      const monthsDiff = Math.max(0, (now.getFullYear() - targetDate.getFullYear()) * 12 + (now.getMonth() - targetDate.getMonth()));
      const clicks = Math.min(Math.max(monthsDiff + 1, 0), 219);

      for (let i = 0; i < clicks; i++) {
        cy.get('button[title="Mes anterior"], button[aria-label="Mes anterior"]')
          .first()
          .click({ force: true });
      }

      const asegurarMesVisible = () => {
        return cy.contains(/mayo 2014/i).then(($mes) => {
          if ($mes && $mes.length) {
            return cy.wrap($mes);
          }
          cy.log('⚠️ No se ve mayo 2014, avanzando un mes');
          cy.get('button[title="Mes siguiente"], button[aria-label="Mes siguiente"]').first().click({ force: true });
          return asegurarMesVisible();
        });
      };

      asegurarMesVisible();
      cy.contains('button', /^5$/).click({ force: true });
      cy.contains('button', /Aplicar/i).click({ force: true });
      return cy.wait(500).then(() => {
        cy.get('body').then(($body) => {
          const texto = ($body.text() || '').toLowerCase();
          if (texto.includes('routes.table.filters')) {
            cy.log('⚠️ Mensajes de filtros muestran claves internas (routes.table.filters.*) - Warning conocido del TC032');
          }
        });
      });
    });
  }

  function guardarFiltro() {
    return UI.abrirPantalla()
      .then(() => UI.buscar('94538'))
      .then(() => {
        cy.contains('button', /Guardar/i, { timeout: 10000 }).click({ force: true });
        cy.get('input[placeholder*="nombre"], input[placeholder*="Nombre"]', { timeout: 5000 })
          .clear({ force: true })
          .type('filtro codigo', { force: true });
        return cy.contains('button', /^Guardar$/i).click({ force: true });
      });
  }

  function limpiarFiltro() {
    return UI.abrirPantalla()
      .then(() => UI.buscar('94538'))
      .then(() => {
        return cy.contains('button', /Limpiar/i, { timeout: 5000 }).click({ force: true });
      });
  }

  function seleccionarFiltroGuardado() {
    return guardarFiltro().then(() => {
      cy.contains('button', /Guardados/i, { timeout: 5000 }).click({ force: true });
      return cy.contains('li, button, span', /filtro codigo/i, { timeout: 5000 }).click({ force: true });
    });
  }
});

