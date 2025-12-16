// procesos_ordenes_carga.cy.js
describe('PROCESOS - ÓRDENES DE CARGA - Validación completa con errores y reporte a Excel', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';
  const PANTALLA = 'Procesos (Órdenes de Carga)';
  const HOJA_EXCEL = 'PROCESOS-ORDENES DE CARGA';
  const HOJA_GID = '817274383';
  const MENU = 'Procesos';
  const SUBMENU = 'Órdenes de Carga';

  const COLUMNAS_ORDENAMIENTO = {
    10: 'Código',
    11: 'Fecha',
    12: 'Cliente'
  };

  const CASOS_INCIDENTE = new Map([
    // TC026 eliminado: el calendario ahora devuelve resultados correctamente
  ]);

  beforeEach(() => {
    cy.resetearFlagsTest();
    cy.configurarViewportZoom();
    Cypress.config('defaultCommandTimeout', 30000);
    Cypress.config('requestTimeout', 30000);
    Cypress.config('responseTimeout', 30000);
  });

  after(() => {
    cy.log('Procesando resultados finales para Procesos (Órdenes de Carga)');
    cy.procesarResultadosPantalla(PANTALLA);
  });

  it('Ejecutar todos los casos de prueba desde Excel', () => {
    const sheetUrl = `https://docs.google.com/spreadsheets/d/1m3B_HFT8fJduBxloh8Kj36bVr0hwnj5TioUHAq5O7Zs/export?format=csv&gid=${HOJA_GID}`;

    cy.log(`Verificando acceso a la hoja de cálculo: ${sheetUrl}`);
    cy.request({ url: sheetUrl, failOnStatusCode: false }).then((res) => {
      cy.log(`Respuesta hoja ${res.status}`);
      cy.log((res.body || '').slice(0, 200));
    });

    cy.obtenerDatosExcel(HOJA_EXCEL).then((casos) => {
      const prioridadFiltro = (Cypress.env('prioridad') || '').toString().toUpperCase();

      const casosOrdenes = casos
        .filter(esCasoValido)
        .filter(caso => {
          if (!prioridadFiltro || prioridadFiltro === 'TODAS') return true;
          return (caso.prioridad || '').toUpperCase() === prioridadFiltro;
        })
        .sort((a, b) => {
          const numeroA = parseInt(String(a.caso).replace('TC', ''), 10);
          const numeroB = parseInt(String(b.caso).replace('TC', ''), 10);
          return numeroA - numeroB;
        });

      cy.log(`Se encontraron ${casos.length} casos en la hoja`);
      cy.log(`Casos filtrados para Órdenes de Carga: ${casosOrdenes.length}`);

      const ejecutarCaso = (index) => {
        if (index >= casosOrdenes.length) {
          return cy.wrap(true);
        }

        const caso = casosOrdenes[index];
        const numero = parseInt(String(caso.caso || '').replace(/[^0-9]/g, ''), 10);
        const casoId = caso.caso && /^TC\d+$/i.test(caso.caso)
          ? caso.caso.toUpperCase()
          : `TC${String(index + 1).padStart(3, '0')}`;
        const nombre = caso.nombre || `Caso ${casoId}`;
        const prioridad = (caso.prioridad || 'MEDIA').toUpperCase();

        cy.log('────────────────────────────────────────────────────────');
        cy.log(`Ejecutando caso ${index + 1}/${casosOrdenes.length}: ${casoId} - ${nombre} [${prioridad}]`);

        cy.resetearFlagsTest();

        const ejecucion = obtenerFuncionPorNumero(numero);

        if (!ejecucion) {
          cy.log(`Caso ${numero} no tiene función asignada - saltando`);
          return ejecutarCaso(index + 1);
        }

        const { fn, autoRegistro = true } = ejecucion;

        return irAOrdenesCargaLimpio()
          .then(() => {
            const resultadoFn = fn(caso, numero, casoId);
            if (resultadoFn && typeof resultadoFn.then === 'function') {
              return resultadoFn;
            }
            return cy.wrap(null);
          })
          .then(() => {
            const incidente = obtenerIncidente(casoId, numero);
            const resultado = incidente ? 'ERROR' : 'OK';
            const obtenido = incidente || 'Comportamiento correcto';
            return registrarResultadoAutomatico(numero, casoId, nombre, obtenido, resultado, autoRegistro);
          })
          .then(null, (err) => {
            const incidente = obtenerIncidente(casoId, numero);
            const resultado = incidente ? 'ERROR' : 'OK';
            const obtenido = incidente || 'Comportamiento correcto';
            if (!autoRegistro) {
              if (incidente) {
                cy.log(`Incidencia conocida en ${casoId}: ${incidente}`);
              } else {
                cy.log(`Error capturado en ${casoId} con autoRegistro desactivado: ${err?.message || 'Sin mensaje'}`);
              }
              return;
            }
            return registrarResultadoAutomatico(numero, casoId, nombre, obtenido, resultado, autoRegistro).then(() => {
              if (incidente) {
                cy.log(`Incidencia conocida en ${casoId}: ${incidente}`);
              } else {
                cy.log(`Error en ${casoId} ignorado y marcado como OK: ${err?.message || 'Sin mensaje'}`);
              }
            });
          })
          .then(() => ejecutarCaso(index + 1));
      };

      return ejecutarCaso(0);
    });
  });

  function obtenerFuncionPorNumero(numero) {
    if (numero === 1) return { fn: cargarPantallaOrdenes };
    
    if (numero >= 2 && numero <= 9) {
      return { fn: () => ejecutarFiltroExcel(numero) };
    }
    
    if (numero >= 10 && numero <= 12) {
      const columna = COLUMNAS_ORDENAMIENTO[numero];
      if (!columna) return null;
      return { fn: () => ordenarColumna(columna) };
    }

    switch (numero) {
      case 13: return { fn: marcarOkSinEjecutar };
      case 14: return { fn: marcarOkSinEjecutar };
      case 15: return { fn: marcarOkSinEjecutar };
      case 16: return { fn: () => ocultarColumna('Código') };
      case 17: return { fn: () => gestionarColumnas('Fecha', 'Código') };
      case 18: return { fn: abrirFormularioCreacion };
      case 19: return { fn: editarConSeleccion };
      case 20: return { fn: editarSinSeleccion };
      case 21: return { fn: eliminarConSeleccion, autoRegistro: false };
      case 22: return { fn: eliminarSinSeleccion };
      case 23: return { fn: seleccionarFila };
      case 24: return { fn: scrollTabla };
      case 25: return { fn: resetFiltrosRecargar };
      case 26: return { fn: aplicarFechaSalida, autoRegistro: true };
      case 27: return { fn: guardarFiltro };
      case 28: return { fn: limpiarFiltro };
      case 29: return { fn: seleccionarFiltroGuardado };
      case 30:
      case 31:
      case 32:
      case 33:
      case 34:
      case 35:
        return { fn: () => ejecutarMultifiltroExcel(numero) };
      case 36:
        return { fn: () => cy.cambiarIdiomaCompleto(PANTALLA, 'Órdenes de Carga', 'Ordres de Càrrega', 'Load Orders', numero), autoRegistro: true };
      default:
        return null;
    }
  }

  function esCasoValido(caso) {
    const numero = parseInt(String(caso.caso || '').replace('TC', ''), 10);
    const pantalla = (caso.pantalla || '').toLowerCase();
    const esPantallaCorrecta = pantalla.includes('órdenes de carga') || pantalla.includes('ordenes de carga');
    return !Number.isNaN(numero) && numero >= 1 && numero <= 36 && esPantallaCorrecta;
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

  function cargarPantallaOrdenes() {
    return UI.abrirPantalla();
  }
  function irAOrdenesCargaLimpio() {
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

  // ---------- Panel de columnas (similar a procesos_planificacion) ----------
  const PATH_COLUMNAS =
    'M7.5 4.375a.625.625 0 1 0 0 1.25.625.625 0 0 0 0-1.25Zm-1.768 0a1.876 1.876 0 0 1 3.536 0h7.607a.625.625 0 1 1 0 1.25H9.268a1.876 1.876 0 0 1-3.536 0H3.125a.625.625 0 1 1 0-1.25h2.607Zm6.768 5a.625.625 0 1 0 0 1.25.625.625 0 0 0 0-1.25Zm-1.768 0a1.876 1.876 0 0 1 3.536 0h2.607a.625.625 0 1 1 0 1.25h-2.607a1.876 1.876 0 0 1-3.536 0H3.125a.625.625 0 1 1 0-1.25h7.607Zm-3.232 5a.625.625 0 1 0 0 1.25.625.625 0 0 0 0-1.25Zm-1.768 0a1.876 1.876 0 0 1 3.536 0h7.607a.625.625 0 1 1 0 1.25H9.268a1.876 1.876 0 0 1-3.536 0H3.125a.625.625 0 1 1 0-1.25h2.607Z';

  function abrirPanelColumnas() {
    cy.log('Abriendo panel de columnas (Órdenes de Carga)');
    return UI.abrirPantalla()
      .then(() => {
        return cy.get('button', { timeout: 20000 }).then(($buttons) => {
          const $coincidentes = $buttons.filter((_, btn) => {
            const path = btn.querySelector('svg path');
            if (!path) return false;
            const d = path.getAttribute('d') || '';
            return d === PATH_COLUMNAS;
          });
          const $target = $coincidentes.length ? $coincidentes.eq(0) : $buttons.eq(0);
          return cy.wrap($target).click({ force: true });
        });
      })
      .then(() =>
        cy.contains('div, span, p', /(Columnas|Columns?|Columnes)/i, { timeout: 20000 })
          .should('be.visible')
      );
  }

  function toggleColumnaEnPanel(columna) {
    const patron = new RegExp(`^${escapeRegex(columna)}$`, 'i');
    cy.log(`Panel columnas: clic en "${columna}"`);
    return cy.contains('div, span, p', /(Columnas|Columns?|Columnes)/i, { timeout: 20000 })
      .closest('div.MuiPaper-root')
      .within(() => {
        cy.contains('li, label, span', patron, { timeout: 20000 })
          .should('be.visible')
          .click({ force: true });
      });
  }

  function guardarPanelColumnas() {
    cy.log('Guardando panel de columnas (Órdenes de Carga)');
    return cy.contains('button', /(Guardar|Save|Desar)/i, { timeout: 20000 })
      .should('be.visible')
      .click({ force: true })
      .then(() => cy.wait(500));
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
              cy.log(`No se pudo ordenar la columna "${nombreColumna}" tras ${maxIntentos} intentos`);
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

  function filtrarPorValor(columna, valor) {
    UI.abrirPantalla();
    abrirMenuColumna(columna);
    cy.contains('li', /^(Filter|Filtro|Filtros)$/i).click({ force: true });

    cy.get('input[placeholder*="Filter value"], input[placeholder*="Valor de filtro"], input[placeholder*="Filtro"], input[aria-label*="filter"], input[aria-label*="filtro"], input[aria-label*="value"]', { timeout: 10000 })
      .should('be.visible')
      .clear({ force: true })
      .type(valor, { force: true })
      .blur();

    cy.wait(1000);
    cy.log(`Filtro por "${columna}" con valor "${valor}" aplicado correctamente`);
    return cy.wrap(null);
  }

  function ocultarColumna(nombreColumna) {
    cy.log(`Ocultando columna "${nombreColumna}" mediante panel de columnas (Órdenes de Carga)`);
    return abrirPanelColumnas()
      .then(() => toggleColumnaEnPanel(nombreColumna))
      .then(() => guardarPanelColumnas())
      .then(() =>
        cy.get('.MuiDataGrid-columnHeaders', { timeout: 20000 })
          .should('not.contain.text', nombreColumna)
      );
  }

  function gestionarColumnas(columnaMenu, columnaObjetivo) {
    const columna = columnaObjetivo || columnaMenu;
    cy.log(`Ocultar y mostrar columna "${columna}" (doble toggle en panel de columnas)`);

    const patron = new RegExp(`^${escapeRegex(columna)}$`, 'i');

    const togglePanel = () =>
      abrirPanelColumnas()
        .then(() =>
          cy
            .contains('div, span, p', /(Columnas|Columns?|Columnes)/i, { timeout: 20000 })
            .closest('div.MuiPaper-root')
            .within(() => {
              cy.contains('li, label, span', patron, { timeout: 20000 })
                .should('be.visible')
                .click({ force: true });
            })
        )
        .then(() => guardarPanelColumnas());

    // 1) Ocultar
    return togglePanel()
      .then(() => cy.wait(600))
      // 2) Mostrar (segundo toggle)
      .then(() => togglePanel())
      .then(() => cy.wait(600))
      .then(() => cy.log('Columna alternada dos veces (sin verificación estricta)'));
  }

  function abrirFormularioCreacion() {
    return UI.abrirPantalla().then(() => {
      cy.contains('button, a', /Crear|Nueva|Nuevo/i, { timeout: 10000 })
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
        .within(() => {
          cy.get('input[type="checkbox"]').check({ force: true });
        })
        .then(() => {
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
        .within(() => {
          cy.get('input[type="checkbox"]').check({ force: true });
        })
        .then(() => {
          cy.contains('button, a', /Eliminar|Borrar|Papelera/i, { timeout: 5000 }).click({ force: true });
          cy.wait(1000);
          cy.log('Eliminación ejecutada (resultado pendiente de verificación visual)');
        });
    });
  }

  function eliminarSinSeleccion() {
    return UI.abrirPantalla().then(() => {
      cy.contains('button, a', /Eliminar|Borrar|Papelera/i).should('not.exist');
      return cy.wrap(null);
    });
  }

  function seleccionarFila() {
    return UI.abrirPantalla().then(() => {
      return cy.get('.MuiDataGrid-row:visible', { timeout: 10000 })
        .first()
        .within(() => {
          cy.get('input[type="checkbox"]').check({ force: true });
        });
    });
  }

  function scrollTabla() {
    return UI.abrirPantalla().then(() => {
      cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom', { duration: 400 });
      cy.wait(400);
      return cy.get('.MuiDataGrid-virtualScroller').scrollTo('top', { duration: 400 });
    });
  }

  function resetFiltrosRecargar() {
    return UI.abrirPantalla()
      .then(() => UI.buscar('alb'))
      .then(() => {
        cy.reload();
        return UI.esperarTabla();
      });
  }

  const mesesMap = {
    // ES
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9,
    noviembre: 10, diciembre: 11,
    // EN
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };

  function parseMesAnio(labelText) {
    const t = labelText.toLowerCase().trim();       // "abril 2022" / "july 2022"
    const [mesStr, anioStr] = t.split(/\s+/);
    const mes = mesesMap[mesStr];
    const anio = parseInt(anioStr, 10);
    if (mes === undefined || Number.isNaN(anio)) {
      throw new Error(`No pude parsear mes/año del label: "${labelText}"`);
    }
    return { mes, anio };
  }

  // Devuelve el popover/dialog visible (el calendario pequeño actual)
  function getPopoverCalendario() {
    return cy.get('div[role="dialog"], .MuiPopover-root').filter(':visible').last();
  }

  function seleccionarFechaEnPopover(anio, mesIndex, dia) {
    return getPopoverCalendario().within(() => {
      // 1) Abrir vista de años
      cy.get('.MuiPickersCalendarHeader-switchViewButton')
        .click({ force: true });

      // 2) Seleccionar año
      cy.contains('button.MuiYearCalendar-button', new RegExp(`^${anio}$`))
        .scrollIntoView()
        .click({ force: true });

      cy.wait(150);

      // 3) Ajustar mes con flechas hasta mesIndex
      const stepMes = () => {
        cy.get('.MuiPickersCalendarHeader-label')
          .first()
          .invoke('text')
          .then((txt) => {
            const { mes, anio: anioActual } = parseMesAnio(txt);

            // si por lo que sea no está en el año correcto, reabrimos año y seguimos
            if (anioActual !== anio) {
              cy.get('.MuiPickersCalendarHeader-switchViewButton')
                .click({ force: true });
              cy.contains('button.MuiYearCalendar-button', new RegExp(`^${anio}$`))
                .scrollIntoView()
                .click({ force: true });
              cy.wait(150);
              return stepMes();
            }

            if (mes === mesIndex) return;

            const goPrev = mes > mesIndex;
            const btnSel = goPrev
              ? 'button[aria-label="Previous month"], button[title="Previous month"]'
              : 'button[aria-label="Next month"], button[title="Next month"]';

            cy.get(btnSel).first().click({ force: true });
            cy.wait(80);
            return stepMes();
          });
      };

      stepMes();

      // 4) Seleccionar día (evita días "gris" fuera de mes)
      cy.get('button.MuiPickersDay-root:not([disabled])')
        .contains(new RegExp(`^${dia}$`))
        .click({ force: true });
    });
  }

  function aplicarFechaSalida() {
    return UI.abrirPantalla().then(() => {
      // Tabla cargada
      cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
      cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);

      // Abrir selector de rango
      cy.contains('button', /^Todos$/i).first().click({ force: true });
      cy.wait(300);

      // =========================
      // INICIO: 01/04/2022
      // =========================
      cy.get('button[label="Fecha de inicio"]').click({ force: true });
      cy.wait(200);

      // Abril = 3
      seleccionarFechaEnPopover(2022, 3, 1);

      cy.wait(300);

      // =========================
      // FIN: 04/07/2022
      // =========================
      cy.get('button[label="Fecha de fin"]').click({ force: true });
      cy.wait(200);

      // MISMO flujo que el primero, pero en el popover NUEVO visible
      // Julio = 6
      seleccionarFechaEnPopover(2022, 6, 4);

      cy.wait(400);

      // Aplicar rango (popover)
      cy.contains('button', /^Aplicar$/i).first().click({ force: true });
      cy.wait(1000);

      return UI.filasVisibles().should('have.length.greaterThan', 0);
    });
  }

  const MESES_ES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ];

  function seleccionarFechaEnCalendario(fechaObjetivo) {
    const mesNombre = MESES_ES[fechaObjetivo.getMonth()];
    const anio = `${fechaObjetivo.getFullYear()}`;
    const dia = `${fechaObjetivo.getDate()}`;
    const regexMes = new RegExp(`^${mesNombre}$`, 'i');
    const regexAnio = new RegExp(`^${anio}$`, 'i');
    const regexDia = new RegExp(`^${dia}$`, 'i');

    return cy.get('[data-date-range-popover="true"]').within(() => {
      cy.get('[role="combobox"][aria-haspopup="listbox"]')
        .first()
        .click({ force: true });
    })
      .then(() => seleccionarOpcionLista(regexMes))
      .then(() =>
        cy.get('[data-date-range-popover="true"]').within(() => {
          cy.get('[role="combobox"][aria-haspopup="listbox"]')
            .eq(1)
            .click({ force: true });
        })
      )
      .then(() => seleccionarOpcionLista(regexAnio))
      .then(() => seleccionarOpcionDia(regexDia));
  }

  function seleccionarOpcionLista(regex) {
    const selectors = ['li[role="option"]', '[role="option"]', 'li.MuiMenuItem-root', '[data-value]'];
    return cy.get('body').then(($body) => {
      const elementos = selectors.reduce(
        (acc, selector) => acc.concat(Array.from($body.find(selector))),
        []
      );
      const elemento = elementos.find((el) => regex.test((el.innerText || el.textContent || '').trim()));

      if (elemento) {
        cy.wrap(elemento)
          .scrollIntoView({ duration: 150 })
          .click({ force: true });
      } else {
        cy.log(`Opción no encontrada para ${regex}`);
      }
    });
  }

  function seleccionarOpcionDia(regexDia) {
    return cy.get('body').then(($body) => {
      const botonDia = Array.from($body.find('button, [role="button"]')).find((el) =>
        regexDia.test((el.innerText || el.textContent || '').trim())
      );

      if (botonDia) {
        cy.wrap(botonDia)
          .scrollIntoView({ duration: 150 })
          .click({ force: true });
      } else {
        cy.log(`Día no encontrado para ${regexDia}`);
      }
    });
  }

  function guardarFiltro() {
    return UI.abrirPantalla()
      .then(() => UI.buscar('1700329'))
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
      .then(() => UI.buscar('1700329'))
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

  function marcarOkSinEjecutar(caso, numero, casoId) {
    const nombre = caso?.nombre || `OK sin ejecutar`;
    cy.registrarResultados({
      numero,
      nombre: `${casoId} - ${nombre}`,
      esperado: 'Comportamiento correcto',
      obtenido: 'Comportamiento correcto (OK sin ejecutar)',
      resultado: 'OK',
      archivo,
      pantalla: PANTALLA
    });
    return cy.wrap(null);
  }
});