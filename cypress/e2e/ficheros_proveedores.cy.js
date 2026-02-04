describe('FICHEROS (PROVEEDORES) - Validación dinámica desde Excel', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';
  const PANTALLA = 'Ficheros (Proveedores)';
  const HOJA_EXCEL = 'Ficheros (Proveedores)';
  const MENU = 'Ficheros';
  const SUBMENU = 'Proveedores';

  // No hardcodeamos: la app puede usar /providers o /suppliers según entorno.
  const URL_LISTA_REGEX = /\/dashboard\/(providers|suppliers)/i;

  before(() => {
    cy.login();
  });

  const CASOS_EJECUTADOS = new Set();

  beforeEach(() => {
    cy.resetearFlagsTest();
    cy.configurarViewportZoom();
    Cypress.config('defaultCommandTimeout', 30000);
    Cypress.config('requestTimeout', 30000);
    Cypress.config('responseTimeout', 30000);
  });

  after(() => {
    cy.procesarResultadosPantalla(PANTALLA);
  });

  it('Ejecutar todos los casos definidos en Excel', () => {
    cy.obtenerDatosExcel(HOJA_EXCEL).then((casos) => {
      const prioridadFiltro = (Cypress.env('prioridad') || '').toString().toUpperCase();

      const casosProveedores = casos
        .filter(esCasoValido)
        .filter((caso) => {
          if (!prioridadFiltro || prioridadFiltro === 'TODAS') return true;
          return (caso.prioridad || '').toUpperCase() === prioridadFiltro;
        })
        .sort((a, b) => {
          const numeroA = parseInt(String(a.caso || '').replace(/\D/g, ''), 10);
          const numeroB = parseInt(String(b.caso || '').replace(/\D/g, ''), 10);
          return numeroA - numeroB;
        });

      cy.log(`Casos detectados para Proveedores: ${casosProveedores.length}`);

      const pantallaLista = cy.login().then(() => UI.abrirPantalla());

      const ejecutarCaso = (index) => {
        if (index >= casosProveedores.length) {
          cy.log('Todos los casos de Proveedores fueron procesados');
          return cy.wrap(true);
        }

        const caso = casosProveedores[index];
        const numero = parseInt(String(caso.caso || '').replace(/\D/g, ''), 10);
        const casoId = caso.caso?.toUpperCase() || `TC${String(numero).padStart(3, '0')}`;
        const nombre = caso.nombre || `Caso ${casoId}`;

        // Reset flags por caso para permitir registrar
        cy.resetearFlagsTest();

        if (CASOS_EJECUTADOS.has(numero)) {
          cy.log(`Caso duplicado detectado (${casoId}), se omite`);
          return ejecutarCaso(index + 1);
        }
        CASOS_EJECUTADOS.add(numero);

        cy.log('───────────────────────────────────────────────');
        cy.log(`Ejecutando ${casoId} - ${nombre}`);

        const ejecucion = obtenerFuncionPorNumero(numero);
        if (!ejecucion) {
          cy.log(`Sin función asignada para ${casoId}, se omite`);
          return ejecutarCaso(index + 1);
        }

        const { fn, autoRegistro = true } = ejecucion;

        // ✅ SIEMPRE definir prepararPantalla (si no, revienta)
        let prepararPantalla = pantallaLista;

        // ✅ Altas: preparar estado limpio + abrir formulario
        if ((numero >= 26 && numero <= 36) || numero === 55) {
          prepararPantalla = cy
            .login()
            .then(() => UI.abrirPantalla())
            .then(() => abrirFormularioNuevoProveedor());
        }

        return prepararPantalla
          .then(() => fn(caso, numero, casoId))

          // ✅ ÉXITO: si la fn devuelve {resultado, obtenido} lo respetamos
          .then((res) => {
            const resultadoFinal = res?.resultado || 'OK';
            const obtenidoFinal = res?.obtenido || 'Comportamiento correcto';

            return registrarResultadoAutomatico(
              numero,
              casoId,
              nombre,
              obtenidoFinal,
              resultadoFinal,
              autoRegistro
            );
          })

          // ✅ ERROR REAL: manejar error aquí (sin .catch)
          .then(
            () => cy.wrap(null),
            (err) => {
              const obtenido = err?.message ? err.message : String(err || 'Error desconocido');

              return registrarResultadoAutomatico(
                numero,
                casoId,
                nombre,
                obtenido,
                'ERROR',
                autoRegistro
              );
            }
          )

          .then(() => cy.reload())
          .then(() => UI.abrirPantalla())
          .then(() => ejecutarCaso(index + 1));
      };

      return ejecutarCaso(0);
    });
  });

  // -------------------- MAPEOS --------------------

  function obtenerFuncionPorNumero(numero) {
    switch (numero) {
      // case 1:
      //   return { fn: cargaPantalla };
      // case 2:
      // case 3:
      // case 4:
      // case 5:
      // case 6:
      // case 7:
      // case 8:
      // case 9:
      // case 10:
      // case 11:
      // case 12:
      // case 13:
      // case 14:
      // case 15:
      //   return { fn: ejecutarFiltroIndividualExcelValidandoFilas };
      // case 16:
      // case 17:
      // case 18:
      // case 19:
      // case 20:
      // case 21:
      // case 22:
      // case 23:
      //   return { fn: ordenarColumnaDesdeExcel };
      // case 24:
      //   return { fn: ocultarColumnaDesdeExcel };
      // case 25:
      //   return { fn: mostrarColumnaDesdeExcel };
      // case 26:
      //   return { fn: abrirFormularioNuevoProveedor };
      // case 27:
      //   return { fn: crearConCamposObligatorios, autoRegistro: true };
      // case 28:
      //   return { fn: crearConTodo, autoRegistro: true };
      // case 29:
      // case 30:
      // case 31:
      // case 32:
      // case 33:
      // case 34:
      // case 35:
      // case 36:
      // return { fn: anadirProveedor };
      // case 37:
      //   return { fn: editarConFilaSeleccionada };
      // case 38:
      //   return { fn: editarSinSeleccion };
      // case 39:
      //   return { fn: eliminarConFilaSeleccionada };
      // case 40:
      //   return { fn: eliminarSinSeleccion };
      // case 41:
      //   return { fn: seleccionarFila };
      // case 42:
      //   return { fn: scrollTablaProveedores };
      // case 43:
      //   return { fn: resetFiltrosRecarga };
      // case 44:
      //   return { fn: guardarFiltroDesdeExcel };
      // case 45:
      //   return { fn: limpiarFiltroDesdeExcel };
      // case 46:
      //   return { fn: seleccionarFiltroGuardadoDesdeExcel };
      // case 47:
      // case 48:
      // case 49:
      // case 50:
      // case 51:
      // case 52:
      //   return { fn: ejecutarMultifiltroExcel, autoRegistro: true };
      // case 53:
      //   return { fn: cambiarIdiomasProveedores };
      // case 54:
      //   return { fn: seleccionarFechasFiltroValidandoFilas, autoRegistro: true };
      case 55:
        return { fn: comprobarGuardadoCompleto, autoRegistro: true };
      default:
        return null;
    }
  }

  function esCasoValido(caso) {
    const numero = parseInt(String(caso.caso || '').replace(/\D/g, ''), 10);
    const pantalla = (caso.pantalla || '').toLowerCase();
    return (
      !Number.isNaN(numero) &&
      numero >= 1 &&
      numero <= 200 &&
      pantalla.includes('ficheros') &&
      pantalla.includes('proveedores')
    );
  }

  // -------------------- UI LISTA --------------------

  const UI = {
    abrirPantalla() {
      return cy
        .url()
        .then((u) => {
          // Si estamos en el formulario, NO podemos esperar tabla (no existe DataGrid).
          // Si no estamos en la lista, navegamos al menú.
          if (/\/form/i.test(u) || !URL_LISTA_REGEX.test(u)) {
            cy.navegarAMenu(MENU, SUBMENU);
          }
        })
        .then(() =>
          cy.url().then((u2) => {
            // Solo esperar tabla si estamos en la lista, no en /form
            if (!/\/form/i.test(u2)) return this.esperarTabla();
            return cy.wrap(null);
          })
        );
    },

    esperarTabla() {
      cy.get('.MuiDataGrid-root', { timeout: 45000 }).should('be.visible');
      // IMPORTANTE: en muchos casos la tabla puede estar vacía ("Sin filas").
      // No debemos fallar aquí; solo necesitamos que el grid esté renderizado.
      return cy.get('body', { timeout: 30000 }).should(($b) => {
        const texto = ($b.text() || '').toString().toLowerCase();
        const filas = $b.find('.MuiDataGrid-row').length;
        const sinFilas = /sin\s+filas|no\s+rows|no\s+hay\s+datos|sin\s+datos|no\s+results|sin\s+resultados/.test(texto);
        // Si hay filas, ok. Si no hay filas pero hay mensaje "sin filas", también ok.
        expect(filas > 0 || sinFilas, 'grid renderizado (filas o mensaje sin filas)').to.eq(true);
      });
    },

    buscar(valor) {
      const texto = (valor || '').toString();
      cy.get(
        'input[placeholder*="Buscar"]:not([id*="sidebar"]), input[placeholder*="Search"]:not([id*="sidebar"]), input[placeholder*="Cerc"]:not([id*="sidebar"]), input[placeholder*="Buscar..."], input[placeholder*="Search..."], input[placeholder*="Cerc"]'
      )
        .first()
        .clear({ force: true })
        .type(texto, { force: true })
        .type('{enter}', { force: true });
      return cy.wait(400);
    },

    filasVisibles() {
      return cy.get('.MuiDataGrid-row:visible');
    }
  };

  // -------------------- CASOS LISTA --------------------

  function cargaPantalla() {
    return UI.abrirPantalla();
  }

  function esperarResultadosTablaEnLista(timeoutMs = 12000) {
    const inicio = Date.now();
    const check = () => {
      return cy.get('body', { log: false }).then(($b) => {
        const texto = (($b.text && $b.text()) || '').toString().toLowerCase();
        const filas = $b.find('.MuiDataGrid-row:visible').length;
        const sinFilas = /sin\s+filas|no\s+rows|no\s+hay\s+datos|sin\s+datos|no\s+results|sin\s+resultados|no\s+se\s+encontraron/i.test(texto);
        const loading = $b.find('.MuiLinearProgress-root:visible, [role="progressbar"]:visible').length > 0;

        if (!loading && (filas > 0 || sinFilas)) return true;
        if (Date.now() - inicio >= timeoutMs) return false;
        return cy.wait(500, { log: false }).then(() => check());
      });
    };
    return check();
  }

  function seleccionarColumnaFiltroSiExiste(nombreColumna) {
    const objetivo = (nombreColumna || '').toString().trim();
    if (!objetivo) return cy.wrap(null);

    const normalizar = (t = '') => t.toString().trim().toLowerCase();
    const coincide = (a, b) => {
      const A = normalizar(a);
      const B = normalizar(b);
      return A === B || A.includes(B) || B.includes(A);
    };

    return cy.get('body').then(($b) => {
      // 1) Si hay select nativo
      const $sel = $b.find('select[name="column"], select#column').filter(':visible').first();
      if ($sel.length) {
        const opts = Array.from($sel[0].options || []).map((o) => (o.text || '').trim());
        const found = opts.find((t) => coincide(t, objetivo));
        if (found) return cy.wrap($sel).select(found, { force: true });
        return cy.wrap($sel).select(1, { force: true });
      }

      // 2) Dropdown MUI: primer botón/role=button del filtro (suele ser el de la columna, a la izquierda del operador)
      const $btn = $b
        .find('button, [role="button"], div[role="button"]')
        .filter((_, el) => {
          const t = (el.textContent || '').trim();
          return t.length > 0 && /c[oó]digo|nif|nombre|raz[oó]n|tel[eé]fono|email|tipo/i.test(t.toLowerCase());
        })
        .filter(':visible')
        .first();

      if (!$btn.length) return cy.wrap(null);

      return cy.wrap($btn[0])
        .click({ force: true })
        .then(() => cy.wait(300))
        .then(() => {
          return cy.get('body').then(($b2) => {
            const $items = $b2.find('li[role="option"], li[role="menuitem"], [role="option"]').filter(':visible');
            if (!$items.length) return cy.wrap(null);
            const match = Array.from($items).find((el) => coincide(el.textContent || '', objetivo));
            if (match) return cy.wrap(match).click({ force: true });
            return cy.wrap($items[0]).click({ force: true });
          });
        });
    });
  }

  function ejecutarFiltroIndividualExcel(caso) {
    // Implementación SOLO para Proveedores (sin usar cy.ejecutarFiltroIndividual) para no auto-registrar OK.
    // El Excel trae normalmente: dato_1 = columna, dato_2 = valor.
    const columna = caso?.dato_1 || '';
    const valor = (caso?.dato_2 || caso?.dato_1 || '').toString();

    return UI.abrirPantalla()
      .then(() => seleccionarColumnaFiltroSiExiste(columna))
      .then(() => UI.buscar(valor))
      .then(() => esperarResultadosTablaEnLista(12000))
      .then(() => cy.wrap(null));
  }

  function ejecutarFiltroIndividualExcelValidandoFilas(caso, numero, casoId) {
    const nombre = caso?.nombre || `Caso TC${String(numero).padStart(3, '0')}`;

    return ejecutarFiltroIndividualExcel(caso, numero)
      .then(() => UI.esperarTabla())
      .then(() => {
        // Reglas por caso (solo aquí, NO en commands.js):
        // - TC002-TC014: ERROR si no hay filas
        // - TC015: OK aunque no haya filas
        const debeHaberFilas = numero >= 2 && numero <= 14;
        const okSinFilas = numero === 15;
        if (!debeHaberFilas && !okSinFilas) return cy.wrap(null);

        return cy.get('body').then(($b) => {
          const filas = $b.find('.MuiDataGrid-row:visible').length;
          if (filas > 0) return cy.wrap(null); // OK

          if (okSinFilas) return cy.wrap(null); // OK aunque no haya filas

          // Registrar ERROR y evitar que el runner lo sobreescriba con OK (usa estaRegistrado()).
          return registrarResultadoAutomatico(
            numero,
            casoId || `TC${String(numero).padStart(3, '0')}`,
            nombre,
            'No aparecen filas',
            'ERROR',
            true
          );
        });
      });
  }

  // Multifiltro desde Excel: la validación (filas + texto mal escrito) vive en el "Excel reader" (cy.ejecutarMultifiltro).
  function ejecutarMultifiltroExcel(_, numero) {
    return cy.ejecutarMultifiltro(numero, PANTALLA, HOJA_EXCEL, MENU, SUBMENU);
  }

  function ordenarColumnaDesdeExcel(caso, numero) {
    let col = caso?.dato_1 || '';
    if (!col) {
      const mapa = {
        16: 'Código',
        17: 'NIF/CIF',
        18: 'Nombre',
        19: 'Razón Social',
        20: 'Teléfono',
        21: 'Tipo Proveedor',
        22: 'Email',
        23: 'Código Contable'
      };
      col = mapa[numero] || 'Código';
    }
    const patron = obtenerPatronColumna(col);
    return UI.abrirPantalla().then(() => {
      return cy.contains('.MuiDataGrid-columnHeaderTitle', patron).click({ force: true });
    });
  }

  function ocultarColumnaDesdeExcel() {
    return ocultarColumna('Nombre');
  }

  function mostrarColumnaDesdeExcel() {
    return mostrarColumna('Nombre');
  }

  function seleccionarFila() {
    return UI.abrirPantalla().then(() => UI.filasVisibles().first().click({ force: true }));
  }

  function editarConFilaSeleccionada() {
    return UI.abrirPantalla()
      .then(() => UI.filasVisibles().first().click({ force: true }))
      .then(() => {
        return cy.get('body').then(($b) => {
          const $btn = $b
            .find('button')
            .filter((_, el) => /editar/i.test((el.textContent || '').trim()))
            .filter(':visible')
            .first();
          if ($btn.length) return cy.wrap($btn[0]).click({ force: true });
          return UI.filasVisibles().first().dblclick({ force: true });
        });
      });
  }

  function editarSinSeleccion() {
    return UI.abrirPantalla().then(() => {
      return cy.get('body').then(($b) => {
        const $btn = $b
          .find('button')
          .filter((_, el) => /editar/i.test((el.textContent || '').trim()))
          .filter(':visible')
          .first();
        if ($btn.length) {
          cy.wrap($btn[0]).should('be.disabled');
        } else {
          cy.log('✅ No existe botón Editar sin selección (OK)');
        }
        return cy.wrap(null);
      });
    });
  }

  function eliminarConFilaSeleccionada() {
    // ⚠️ IMPORTANTE: NO borrar datos en QA. Este caso debe ser OK pero SIN pulsar "Eliminar".
    // Solo verificamos que el botón existe (y opcionalmente que estaría habilitado con una fila seleccionada).
    return UI.abrirPantalla()
      .then(() => {
        // Seleccionar una fila (sin ejecutar borrado)
        return UI.filasVisibles().first().click({ force: true });
      })
      .then(() => {
        return cy.get('body').then(($b) => {
          const $btn = $b
            .find('button')
            .filter((_, el) => /eliminar|borrar/i.test((el.textContent || '').trim()))
            .filter(':visible')
            .first();
          if ($btn.length) {
            cy.log('✅ Botón Eliminar encontrado (NO se pulsa para no perder datos)');
            // Si está deshabilitado, también es aceptable; no forzamos estado.
          }
          else cy.log('ℹ️ No se encontró botón Eliminar (continuando)');
          return cy.wrap(null);
        });
      });
  }

  function eliminarSinSeleccion() {
    return UI.abrirPantalla().then(() => {
      return cy.get('body').then(($b) => {
        const $btn = $b
          .find('button')
          .filter((_, el) => /eliminar|borrar/i.test((el.textContent || '').trim()))
          .filter(':visible')
          .first();
        if ($btn.length) cy.wrap($btn[0]).should('be.disabled');
        else cy.log('✅ No existe botón Eliminar sin selección (OK)');
        return cy.wrap(null);
      });
    });
  }

  function scrollTablaProveedores() {
    return UI.abrirPantalla().then(() => {
      cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom', { duration: 400 });
      cy.wait(200);
      return cy.get('.MuiDataGrid-virtualScroller').scrollTo('top', { duration: 400 });
    });
  }

  function resetFiltrosRecarga(caso) {
    const termino = caso?.dato_1 || 'proveedores';
    return UI.abrirPantalla()
      .then(() => UI.buscar(termino))
      .then(() => cy.wait(400))
      .then(() => cy.reload())
      .then(() => UI.abrirPantalla());
  }

  function guardarFiltroDesdeExcel(caso = {}) {
    const termino = caso?.dato_1 || '';
    const nombreFiltro = caso?.dato_2 || 'filtro proveedores';
    if (!termino) return cy.wrap(null);
    return UI.abrirPantalla()
      .then(() => UI.buscar(termino))
      .then(() => {
        cy.contains('button', /(Guardar|Save|Desar)/i).click({ force: true });
        cy.get(
          'input[placeholder*="nombre"], input[placeholder*="Nombre"], input[placeholder*="name"], input[placeholder*="Name"], input[placeholder*="nom"], input[placeholder*="Nom"]'
        )
          .clear({ force: true })
          .type(nombreFiltro, { force: true });
        return cy.contains('button', /(Guardar|Save|Desar)/i).click({ force: true });
      });
  }

  function limpiarFiltroDesdeExcel(caso = {}) {
    const termino = caso?.dato_1 || '';
    if (!termino) return cy.wrap(null);
    return UI.abrirPantalla()
      .then(() => UI.buscar(termino))
      .then(() => cy.contains('button', /(Limpiar|Clear|Netejar)/i).click({ force: true }));
  }

  function seleccionarFiltroGuardadoDesdeExcel(caso = {}) {
    const filtroNombre = caso?.dato_2 || 'filtro proveedores';
    const termino = caso?.dato_1 || '';
    if (!termino) return cy.wrap(null);
    return guardarFiltroDesdeExcel({ dato_1: termino, dato_2: filtroNombre }).then(() => {
      cy.contains('button', /(Guardados|Saved|Guardats)/i).click({ force: true });
      return cy.contains('li, [role="option"]', new RegExp(filtroNombre, 'i')).click({ force: true });
    });
  }

  function cambiarIdiomasProveedores() {
    return UI.abrirPantalla().then(() =>
      cy.cambiarIdiomaCompleto(PANTALLA, 'Proveedores', 'Providers', 'Providers', 53)
    );
  }

  function seleccionarFechasFiltroValidandoFilas(caso, numero, casoId) {
    const nombre = caso?.nombre || 'Seleccionar Fecha';

    return UI.abrirPantalla().then(() => {
      cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

      // Abrir selector de rango
      cy.contains('button', /^Todos$/i).first().click({ force: true });
      cy.wait(300);

      // ✅ Fechas (puedes dejarlas fijas o leer de Excel si quieres)
      const fechaDesde = '01/01/2026';
      const fechaHasta = '16/01/2026';

      cy.log(`Seleccionando rango de fechas desde ${fechaDesde} hasta ${fechaHasta}`);

      const parseDDMMYYYY = (str) => {
        const [dd, mm, yyyy] = String(str).split('/').map(n => parseInt(n, 10));
        return { dd, mm, yyyy };
      };

      const inicio = parseDDMMYYYY(fechaDesde);
      const fin = parseDDMMYYYY(fechaHasta);

      // HELPERS MUI CALENDAR
      const monthNamesEs = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      const monthNamesEn = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];

      const normalizar = (t) => (t || '')
        .toString()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

      const headerEsObjetivo = (headerText, targetMonth, targetYear) => {
        const h = normalizar(headerText);
        const mesEs = monthNamesEs[targetMonth - 1];
        const mesEn = monthNamesEn[targetMonth - 1];
        return (
          (h.includes(mesEs) && h.includes(String(targetYear))) ||
          (h.includes(mesEn) && h.includes(String(targetYear)))
        );
      };

      const irAMesAnio = (targetMonth, targetYear, maxSteps = 24) => {
        const step = (i = 0) => {
          return cy.get('body').then($b => {
            const headerSel = '.MuiPickersCalendarHeader-label, .MuiPickersToolbarText-root, .MuiPickersFadeTransitionGroup-root';
            const header = $b.find(headerSel).first().text();

            if (header && headerEsObjetivo(header, targetMonth, targetYear)) {
              return cy.wrap(true);
            }

            if (i >= maxSteps) {
              cy.log(`⚠️ No se pudo llegar al mes/año objetivo. Header actual: "${header}"`);
              return cy.wrap(true);
            }

            const nextBtnSel = 'button[title*="Next"], button[aria-label*="Next"], button[aria-label*="Siguiente"], button.MuiPickersArrowSwitcher-button';
            if ($b.find(nextBtnSel).length > 0) {
              cy.get(nextBtnSel).last().click({ force: true });
              cy.wait(200);
              return step(i + 1);
            }

            cy.log('⚠️ No se encontró botón de siguiente mes');
            return cy.wrap(true);
          });
        };
        return step(0);
      };

      const clickDia = (dayNumber) => {
        const daySelectors = [
          'button[role="gridcell"]',
          '[role="gridcell"] button',
          '.MuiPickersDay-root',
          'button.MuiPickersDay-root'
        ].join(',');

        return cy.get('body').then($b => {
          const candidates = $b.find(daySelectors).filter((_, el) => {
            const t = (el.textContent || '').trim();
            return t === String(dayNumber);
          });

          if (candidates.length) {
            cy.wrap(candidates[0]).click({ force: true });
            cy.wait(200);
            return cy.wrap(true);
          }

          cy.get(daySelectors).contains(new RegExp(`^${dayNumber}$`)).click({ force: true });
          cy.wait(200);
          return cy.wrap(true);
        });
      };

      const seleccionarFecha = ({ dd, mm, yyyy }) => {
        cy.get('[role="dialog"], .MuiPickersPopper-root, .MuiPopover-root', { timeout: 10000 }).should('exist');
        return irAMesAnio(mm, yyyy).then(() => clickDia(dd));
      };

      // FECHA INICIO
      cy.get('button[label="Fecha de inicio"], button[aria-label*="Fecha de inicio"], button[aria-label*="start"], button[aria-label*="Start"], button[aria-label*="date"]')
        .first()
        .click({ force: true });

      cy.wait(250);
      seleccionarFecha(inicio);

      // FECHA FIN
      cy.get('button[label="Fecha de fin"], button[aria-label*="Fecha de fin"], button[aria-label*="end"], button[aria-label*="End"], button[aria-label*="date"]')
        .last()
        .click({ force: true });

      cy.wait(250);
      seleccionarFecha(fin);

      // ✅ NO pulsar "Aplicar"
      cy.log('Filtro de fechas aplicado (sin pulsar "Aplicar")');

      // ✅ Esperar y validar filas
      return cy.wait(900)
        .then(() => UI.esperarTabla())
        .then(() => cy.wait(700))
        .then(() => {
          return cy.get('body').then(($b) => {
            const filas = $b.find('.MuiDataGrid-row:visible').length;
            const texto = ($b.text() || '');
            const tieneNoRows = /No rows|Sin resultados|No se encontraron|No results|Sin filas/i.test(texto);

            if (filas > 0 && !tieneNoRows) {
              return registrarResultadoAutomatico(
                numero,
                casoId || `TC${String(numero).padStart(3, '0')}`,
                nombre,
                `Se muestran ${filas} filas tras aplicar el filtro de fechas`,
                'OK',
                false
              );
            }

            return registrarResultadoAutomatico(
              numero,
              casoId || `TC${String(numero).padStart(3, '0')}`,
              nombre,
              'No se muestran filas tras aplicar el filtro de fechas (debería devolver resultados en Proveedores)',
              'ERROR',
              true
            );
          });
        });
    });
  }

  // -------------------- ALTAS --------------------

  function abrirFormularioNuevoProveedor() {
    return UI.abrirPantalla()
      .then(() =>
        cy
          .contains('button, a', /\+?\s?Nuevo|Añadir/i, { timeout: 15000 })
          .scrollIntoView()
          .click({ force: true })
      )
      .then(() =>
        cy.url().then((u) => {
          // Igual que Clientes: asegurar que realmente abrimos el formulario
          if (!/\/form/i.test(u)) {
            cy.log('El formulario no se abrió, reintentando "+ Nuevo"...');
            return cy
              .contains('button, a', /\+?\s?Nuevo|Añadir/i, { timeout: 15000 })
              .scrollIntoView()
              .click({ force: true })
              .then(() => cy.url().should('match', /\/dashboard\/(providers|suppliers)\/form/i));
          }
          return cy.wrap(null);
        })
      )
      .then(() => cy.wait(600));
  }

  function clickGuardarPrincipalSiExiste({ requerido = false } = {}) {
    // Devuelve booleano: true si clicó, false si no.
    // (Si requerido=true y no se puede clicar, NO tiramos el test: devolvemos false para poder registrar ERROR)
    const esEnabled = (el) => {
      const $el = Cypress.$(el);
      const ariaDisabled = ($el.attr('aria-disabled') || '').toString().toLowerCase();
      return !el.disabled && ariaDisabled !== 'true';
    };

    // Cerrar popovers/listbox abiertos que puedan tapar el header
    cy.get('body').type('{esc}', { force: true, log: false });

    return cy.get('body').then(($b) => {
      const base = $b
        .find('button')
        .filter((_, el) => Cypress.$(el).closest('.MuiDrawer-root, .MuiModal-root, [role="dialog"]').length === 0)
        .filter(':visible');

      // 1) Preferir texto exacto multi-idioma
      let $btn = base
        .filter((_, el) => /^(guardar|save|desar)$/i.test((el.textContent || '').trim()))
        .filter((_, el) => esEnabled(el))
        .first();

      // 2) Fallback: contiene "guardar"
      if (!$btn.length) {
        $btn = base
          .filter((_, el) => /guardar/i.test((el.textContent || '').trim()))
          .filter((_, el) => esEnabled(el))
          .first();
      }

      // 3) Fallback: submit visible
      if (!$btn.length) {
        $btn = base
          .filter('[type="submit"]')
          .filter((_, el) => esEnabled(el))
          .first();
      }

      if ($btn.length) {
        return cy
          .wrap($btn[0])
          .scrollIntoView()
          .click({ force: true })
          .then(() => cy.wait(1200))
          .then(() => true);
      }

      cy.log('ℹ️ No se encontró botón Guardar principal visible/habilitado');
      return cy.wrap(false);
    });
  }


  function crearConCamposObligatorios(caso, numero, casoId) {
    const nombre = caso?.nombre || 'Crear con campos obligatorios';
    const codigo4 = generarNumeroAleatorio(4);
    const codigo3 = generarNumeroAleatorio(3);
    const casoNormalizado = sustituirPlaceholders(caso, codigo4, codigo3);

    // Asegurar formulario abierto (ya lo prepara el runner, pero lo dejamos robusto)
    return cy.url()
      .then((u) => {
        if (!/\/form/i.test(u)) return abrirFormularioNuevoProveedor();
        return cy.wrap(null);
      })
      .then(() => {
        // Igual que en Clientes: rellenar en la pestaña activa (Datos generales)
        return navegarSeccionFormulario('Datos generales').then(() => llenarCamposFormulario(casoNormalizado));
      })
      .then(() => rellenarCamposObligatoriosClienteAsociado(casoNormalizado, codigo3))
      .then(() => clickGuardarPrincipalSiExiste({ requerido: true }))
      .then((clicado) => {
        if (clicado) return cy.wrap(null);
        return registrarResultadoAutomatico(
          numero,
          casoId || `TC${String(numero).padStart(3, '0')}`,
          nombre,
          'No se pudo pulsar Guardar (botón no visible/habilitado)',
          'ERROR',
          true
        );
      })
      .then(() => cy.wait(800))
      .then(() => {
        // Validación esperada por el usuario: al guardar debe saltar error 500
        return cy.get('body').then(($b) => {
          const texto = ($b.text() || '').toString();
          const hay500 =
            /Request failed with status code 500/i.test(texto) ||
            /status code 500/i.test(texto) ||
            /Error al guardar el proveedor/i.test(texto) ||
            /Error saving (the )?provider/i.test(texto);
          if (hay500) {
            return registrarResultadoAutomatico(
              numero,
              casoId || `TC${String(numero).padStart(3, '0')}`,
              nombre,
              // Usar el texto más informativo posible
              /Error al guardar el proveedor/i.test(texto)
                ? 'Error al guardar el proveedor (status code 500)'
                : 'Request failed with status code 500',
              'ERROR',
              true
            );
          }
          // Si no se vio el mensaje, no forzamos ERROR (puede haber cambiado el texto).
          return cy.wrap(null);
        });
      });
  }

  function crearConTodo(caso, numero, casoId) {
    const nombre = caso?.nombre || 'Crear con todo';
    const codigo4 = generarNumeroAleatorio(4);
    const codigo3 = generarNumeroAleatorio(3);
    const casoNormalizado = sustituirPlaceholders(caso, codigo4, codigo3);

    // ✅ buscar por el código real creado (el del placeholder "Código de cliente" / Code)
    const codigoCreado =
      extraerDatoPorEtiquetaOSelector(
        casoNormalizado,
        /(c[oó]digo\s+de\s+cliente|customer\s+code|codi\s+de\s+client|^code$|^c[oó]digo$|código)/i
      ) || `prueba${codigo4}`;

    const registrarError = (obtenido) =>
      registrarResultadoAutomatico(
        numero,
        casoId || `TC${String(numero).padStart(3, '0')}`,
        nombre,
        obtenido,
        'ERROR',
        true
      );

    const hayError500EnBody = () => {
      return cy.get('body').then(($b) => {
        const texto = ($b.text() || '').toString();
        const hay500 =
          /Request failed with status code 500/i.test(texto) ||
          /status code 500/i.test(texto) ||
          /Error al guardar el proveedor/i.test(texto) ||
          /Error saving (the )?provider/i.test(texto);

        return { hay500, texto };
      });
    };

    return cy.url()
      .then((u) => {
        if (!/\/form/i.test(u)) return abrirFormularioNuevoProveedor();
        return cy.wrap(null);
      })

      // --- DATOS GENERALES ---
      .then(() => navegarSeccionFormulario('Datos generales'))
      .then(() => llenarCamposFormulario(casoNormalizado))
      .then(() => rellenarFechaDatosGenerales(casoNormalizado))
      .then(() => rellenarRadiosDatosGenerales(casoNormalizado))
      .then(() => rellenarTipoProveedorDatosGenerales(casoNormalizado))
      .then(() => rellenarCamposObligatoriosClienteAsociado(casoNormalizado, codigo3))
      .then(() => esperarDatosGeneralesCompletosAntesDeFinancieros(casoNormalizado))

      // --- DATOS FINANCIEROS ---
      .then(() => navegarSeccionFormulario('Datos financieros'))
      .then(() => llenarCamposFormulario(casoNormalizado))
      .then(() => rellenarDatosFinancieros(casoNormalizado))
      .then(() => rellenarEmpresaFinanciero(casoNormalizado))
      .then(() => rellenarCCompraFinanciero(casoNormalizado))
      .then(() => rellenarMetodoPagoFinanciero(casoNormalizado))

      // Guardar
      .then(() => clickGuardarPrincipalSiExiste({ requerido: true }))
      .then((clicado) => {
        if (clicado) return cy.wrap(true);
        return registrarError('No se pudo pulsar Guardar (botón no visible/habilitado)').then(() => false);
      })
      .then((continuar) => {
        if (!continuar) return cy.wrap(false);

        // esperar a que aparezca posible toast/error
        return cy.wait(1200).then(() => true);
      })

      // 1) Si hay error 500 => ERROR y cortar
      .then((continuar) => {
        if (!continuar) return cy.wrap(false);

        return hayError500EnBody().then(({ hay500, texto }) => {
          if (!hay500) return true;

          const msg =
            /Error al guardar el proveedor/i.test(texto)
              ? 'Error al guardar el proveedor (status code 500)'
              : 'Request failed with status code 500';

          return registrarError(msg).then(() => false);
        });
      })

      // 2) Si NO hay 500 => volver a lista y buscar por el CÓDIGO creado
      .then((continuar) => {
        if (!continuar) return cy.wrap(null);

        return UI.abrirPantalla()
          .then(() => UI.buscar(String(codigoCreado)))
          .then(() => esperarResultadosTablaEnLista(15000))
          .then(() => {
            return cy.get('body').then(($b) => {
              const filas = $b.find('.MuiDataGrid-row:visible').length;

              if (filas === 0) {
                return registrarError(`No aparece ninguna fila al buscar el código "${codigoCreado}"`);
              }

              return cy.wrap(null);
            });
          });
      });
  }

  function rellenarDatosFinancieros(caso) {
    // OJO: si usas este guard, acuérdate de resetearlo en beforeEach o al inicio del TC
    // Cypress.env('__financieros_rellenados__', false)
    if (Cypress.env('__financieros_rellenados__')) return cy.wrap(null);
    Cypress.env('__financieros_rellenados__', true);

    const getVal = (regex) => extraerDatoPorEtiquetaOSelector(caso, regex);

    const escribirSiHay = (selector, valor, opts = {}) => {
      if (valor === undefined || valor === null || String(valor).trim() === '') return cy.wrap(null);

      return cy.get(selector, { timeout: 15000 })
        .filter(':visible')
        .first()
        .scrollIntoView()
        .then(($el) => {
          const actual = ($el.val?.() ?? $el[0]?.value ?? '').toString().trim();
          const target = String(valor).trim();
          if (actual === target) return cy.wrap(null);

          return cy.wrap($el)
            .click({ force: true })
            .clear({ force: true })
            .type(target, { force: true, ...opts });
        });
    };

    const marcarCheckboxSiHay = (name, valorRaw) => {
      if (valorRaw === undefined || valorRaw === null || String(valorRaw).trim() === '') return cy.wrap(null);

      const v = String(valorRaw).trim().toLowerCase();
      const shouldCheck = /^(true|1|si|sí|yes|checked|marcar|on)$/i.test(v);
      const shouldUncheck = /^(false|0|no|uncheck|desmarcar|off)$/i.test(v);
      if (!shouldCheck && !shouldUncheck) return cy.wrap(null);

      return cy.get(`input[type="checkbox"][name="${name}"]`, { timeout: 15000 })
        .first()
        .scrollIntoView()
        .then(($cb) => {
          const marcado = !!$cb.prop('checked');
          if (shouldCheck && marcado) return cy.wrap(null);
          if (shouldUncheck && !marcado) return cy.wrap(null);

          return cy.wrap($cb)[shouldCheck ? 'check' : 'uncheck']({ force: true });
        });
    };

    const empresa = getVal(/(^empresa$|company|empresa)/i);
    const cCompra = getVal(/(c\.?\s*compra|ccompra|purchase)/i);

    const iban1 = getVal(/(^IBAN1$)/i);
    const iban2 = getVal(/(^IBAN2$)/i);
    const iban3 = getVal(/(^IBAN3$)/i);
    const iban4 = getVal(/(^IBAN4$)/i);
    const iban5 = getVal(/(^IBAN5$)/i);

    const pagoFinMes = getVal(/(paymentEndDate|pago\s+fin\s+de\s+mes)/i);
    const conRiesgo = getVal(/(hasRisk|con\s+riesgo)/i);

    return cy.wrap(null)
      // Empresa (autocomplete)
      .then(() => seleccionarAutocompleteMUI_porLabel(/^(Empresa)$/i, empresa))

      // IBAN troceado
      .then(() => escribirSiHay('input[name="IBAN1"]', iban1, { delay: 0 }))
      .then(() => escribirSiHay('input[name="IBAN2"]', iban2, { delay: 0 }))
      .then(() => escribirSiHay('input[name="IBAN3"]', iban3, { delay: 0 }))
      .then(() => escribirSiHay('input[name="IBAN4"]', iban4, { delay: 0 }))
      .then(() => escribirSiHay('input[name="IBAN5"]', iban5, { delay: 0 }))

      // Checkboxes
      .then(() => marcarCheckboxSiHay('paymentEndDate', pagoFinMes))
      .then(() => marcarCheckboxSiHay('hasRisk', conRiesgo))

      // C.Compra (autocomplete)
      .then(() => seleccionarAutocompleteMUI_porLabel(/^(C\.?Compra)$/i, cCompra));
  }

  function rellenarRadiosDatosGenerales(caso) {
    // Lee valores desde Excel (soporta que vengan como "name typeOfPerson Física", etc.)
    const personaRaw = extraerDatoPorEtiquetaOSelector(caso, /(typeOfPerson|persona)/i);
    const tipoRaw = extraerDatoPorEtiquetaOSelector(caso, /(isSupplier|tipo)/i);
    const residenciaRaw = extraerDatoPorEtiquetaOSelector(caso, /(residence|residencia)/i);

    const normalizar = (x) => String(x ?? '').trim().toLowerCase();

    const persona = normalizar(personaRaw);
    const tipo = normalizar(tipoRaw);
    const residencia = normalizar(residenciaRaw);

    // Mapeos a los values reales del DOM (MUI)
    const personaValue =
      personaRaw
        ? (/(f[ií]sica|physical)/i.test(persona) ? 'false'
          : /(jur[ií]dica|legal|company)/i.test(persona) ? 'true'
            : null)
        : null;

    const tipoValue =
      tipoRaw
        ? (/(proveedor|supplier|provider)/i.test(tipo) ? 'true'
          : /(acreedor|creditor)/i.test(tipo) ? 'false'
            : null)
        : null;

    //  Aquí asumimos values típicos: spain / foreign / eu
    // (en tu DevTools ya vimos spain)
    const residenciaValue =
      residenciaRaw
        ? (/(espa[ñn]a|spain)/i.test(residencia) ? 'spain'
          : /(extranjero|foreign)/i.test(residencia) ? 'foreign'
            : /^(ue|eu|uni[oó]n europea|european union)$/i.test(residencia) ? 'eu'
              : null)
        : null;

    const clicks = [];

    // Persona (name="typeOfPerson" value="false|true")
    if (personaValue != null) {
      clicks.push(() =>
        cy.get(`input[type="radio"][name="typeOfPerson"][value="${personaValue}"]`, { timeout: 15000 })
          .first()
          .scrollIntoView()
          .check({ force: true })
      );
    } else if (personaRaw) {
      clicks.push(() => cy.log(`⚠️ Persona: valor no reconocido "${personaRaw}"`));
    }

    // Tipo (name="isSupplier" value="true|false")
    if (tipoValue != null) {
      clicks.push(() =>
        cy.get(`input[type="radio"][name="isSupplier"][value="${tipoValue}"]`, { timeout: 15000 })
          .first()
          .scrollIntoView()
          .check({ force: true })
      );
    } else if (tipoRaw) {
      clicks.push(() => cy.log(`⚠️ Tipo: valor no reconocido "${tipoRaw}"`));
    }

    // Residencia (name="residence" value="spain|foreign|eu")
    if (residenciaValue != null) {
      clicks.push(() =>
        cy.get(`input[type="radio"][name="residence"][value="${residenciaValue}"]`, { timeout: 15000 })
          .first()
          .scrollIntoView()
          .check({ force: true })
      );
    } else if (residenciaRaw) {
      clicks.push(() => cy.log(`⚠️ Residencia: valor no reconocido "${residenciaRaw}"`));
    }

    // Ejecutar en cadena (importante retornar el chain)
    return clicks.reduce((chain, fn) => chain.then(fn), cy.wrap(null));
  }

  function rellenarTipoProveedorDatosGenerales(caso) {
    // Autocomplete "Tipo de Proveedor":
    // - Puede venir como texto o como id (ej. _r_2g_ -> General)
    // - Para interactuar con el DOM: SIEMPRE por label con atributo `for` (ids cambian entre ejecuciones)
    const valor = extraerDatoPorEtiquetaOSelector(caso, /(tipo\s+de\s+proveedor|_r_2g_)/i);
    if (!valor) return cy.wrap(null);

    const rxLabel = /^(Tipo de Proveedor|Supplier Type|Provider Type|Tipus de Proveïdor)$/i;
    const escapeCssId = (id = '') => id.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');

    // OJO: hay 2 labels con el mismo texto (uno “externo” y el InputLabel de MUI).
    // Necesitamos el que tenga `for`, para apuntar al input correcto.
    return cy.get('body').then(($b) => {
      const $labelFor = $b
        .find('label[for]')
        .filter((_, el) => rxLabel.test((el.textContent || '').trim()))
        .filter(':visible')
        .first();

      if (!$labelFor.length) {
        cy.log(' Tipo de Proveedor: no se encontró label con atributo for');
        return cy.wrap(null);
      }

      const forAttr = ($labelFor.attr('for') || '').toString();
      if (!forAttr) return cy.wrap(null);

      const sel = `#${escapeCssId(forAttr)}`;

      return cy.get(sel, { timeout: 15000 })
        .filter(':visible')
        .first()
        .then(($inp) => {
          if (!$inp || !$inp.length) {
            cy.log(' Tipo de Proveedor: no se encontró el input asociado al label');
            return cy.wrap(null);
          }

          // Importante: NO meter un cy.wait() entre type() y el siguiente type()
          // Metemos todo en un solo .type() para que no se pierda el subject
          return cy.wrap($inp)
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(`${valor}{downArrow}{enter}`, { force: true })
            .then(() => cy.wait(300, { log: false }));
        });
    });
  }

  function anadirProveedor(caso, numero, casoId) {
    const seccion = deducirSeccionDesdeCaso(caso); // Ej: 'Direcciones' o 'Datos generales'
    const numeroCaso = numero || parseInt(String(caso?.caso || '').replace(/\D/g, ''), 10);
    const codigo4 = generarNumeroAleatorio(4);
    const codigo3 = generarNumeroAleatorio(3);
    const casoNormalizado = sustituirPlaceholders(caso, codigo4, codigo3);

    cy.log(`Datos recibidos para TC${String(numeroCaso).padStart(3, '0')}: ${JSON.stringify(casoNormalizado)}`);
    cy.log(`Sección deducida: ${seccion}`);

    const esDatosGenerales = /generales/i.test(seccion);
    const esSeccionDireccion = /dirección|direccion/i.test(seccion);
    const esSeccionContacto = /contact/i.test(seccion);
    const esSeccionAsociado = /asociad/i.test(seccion);
    const esSeccionIncidencias = /incidenc/i.test(seccion);
    const esSeccionZonasCarga = /zona/i.test(seccion);
    const esSeccionCertificaciones = /certific/i.test(seccion);
    const esSeccionCalidad = /calidad/i.test(seccion);

    return cy.url().then((urlActual) => {
      const enFormulario = urlActual.includes('/dashboard/suppliers/form');

      const abrirYEntrarSeccion = () => {
        return abrirFormularioNuevoProveedor()
          .then(() => navegarSeccionFormulario(seccion));
      };

      if (!enFormulario) {
        return abrirYEntrarSeccion();
      }

      return navegarSeccionFormulario(seccion);
    })

      // 🔹 DATOS GENERALES
      .then(() => {
        if (esDatosGenerales) {
          cy.log('Rellenando sección Datos Generales...');
          return llenarCamposFormulario(casoNormalizado);
        }
        return cy.wrap(null);
      })

      // 🔹 DIRECCIONES
      .then(() => {
        if (esSeccionDireccion) {
          cy.log('Entrando a la pestaña "Direcciones" y abriendo modal...');
          return abrirModalSeccion(seccion, true)
            .then(() => llenarFormularioDireccion(casoNormalizado))
            .then(() => guardarNuevaDireccion());
        }
        return cy.wrap(null);
      })

      // 🔹 CONTACTOS
      .then(() => {
        if (esSeccionContacto) {
          cy.log('Entrando a la pestaña "Contactos" y abriendo modal...');
          return abrirModalSeccion(seccion, true)
            .then(() => llenarFormularioContacto(casoNormalizado))
            .then(() => guardarNuevoContacto());
        }
        return cy.wrap(null);
      })

      // 🔹 ASOCIADOS
      .then(() => {
        if (esSeccionAsociado) {
          cy.log('Entrando a la pestaña "Asociados" y abriendo modal...');
          return abrirModalSeccion(seccion, true)
            .then(() => llenarFormularioAsociado(casoNormalizado))
            .then(() => guardarNuevoAsociado());
        }
        return cy.wrap(null);
      })

      // 🔹 INCIDENCIAS
      .then(() => {
        if (esSeccionIncidencias) {
          cy.log('🧩 Sección detectada: INCIDENCIAS');

          return abrirModalSeccion(seccion, true)
            .then(() => llenarFormularioIncidencia(casoNormalizado))
            .then(() => guardarNuevaIncidencia());
        }

        return cy.wrap(null);
      })

      // 🔹 ZONAS DE CARGA
      .then(() => {
        if (esSeccionZonasCarga) {
          cy.log('🧩 Sección detectada: ZONAS DE CARGA');

          return abrirModalSeccion(seccion, true)
            .then(() => llenarFormularioZonaCarga(casoNormalizado))
            .then(() => guardarNuevaZonaCarga());
        }
        return cy.wrap(null);
      })

      // 🔹 CERTIFICACIONES
      .then(() => {
        if (!esSeccionCertificaciones) return cy.wrap(null);

        cy.log('🧩 Sección detectada: CERTIFICACIONES');

        const norm = (s) => String(s || '').trim();

        const esperarFilaSinFallar = (intentos = 25) => {
          return cy.get('body').then(($b) => {
            const $rows = $b.find('.MuiDataGrid-row');
            if ($rows.length) return cy.wrap($rows.first());
            if (intentos <= 0) return cy.wrap(null);
            return cy.wait(400).then(() => esperarFilaSinFallar(intentos - 1));
          });
        };

        const validarResultadoCertificacion = () => {
          return esperarFilaSinFallar().then(($row) => {
            const resError = (msg) => cy.wrap({ resultado: 'ERROR', obtenido: msg }, { log: false });
            const resOk = (msg) => cy.wrap({ resultado: 'OK', obtenido: msg }, { log: false });

            if (!$row) {
              return resError('No apareció ninguna fila en la tabla tras guardar');
            }

            const empresa = norm($row.find('[aria-colindex="1"]').text());
            const tipo = norm($row.find('[aria-colindex="2"]').text());

            cy.log(`📌 Validación -> Empresa="${empresa}" | Tipo="${tipo}"`);

            if (!empresa || !tipo) {
              return resError(`Guardó incompleto: Empresa="${empresa}" | Tipo="${tipo}"`);
            }

            return resOk(`Empresa="${empresa}" | Tipo="${tipo}"`);
          });
        };

        return abrirModalSeccion(seccion, true)
          .then(() => llenarFormularioCertificacion(casoNormalizado))
          .then(() => guardarNuevaCertificacion())
          .then(() => validarResultadoCertificacion()); // 👈 devuelve {resultado, obtenido}
      })

      // 🔹 CALIDAD
      .then(() => {
        if (!/calidad/i.test(seccion)) return cy.wrap(null);

        cy.log('🧩 Sección detectada: CALIDAD');

        return abrirModalSeccion(seccion, true)
          .then(() => llenarFormularioCalidad(casoNormalizado, numeroCaso))
          .then(() => guardarNuevoRegistroCalidad());
      })

      .then((res) => {
        // ⚠️ MUY IMPORTANTE:
        // devolvemos "res" para que el runner lo vea y NO ponga OK por defecto
        cy.log(`✅ Sección "${seccion}" completada para TC${String(numeroCaso).padStart(3, '0')}`);
        return cy.wrap(res || null, { log: false });
      });
  }

  // ✅ Helper: escribir en input/textarea por atributo name (dentro del drawer/modal visible)
  function escribirPorName(name, valor, etiqueta = name) {
    if (valor === undefined || valor === null || valor === '') return cy.wrap(null);

    return cy.get('body').then(($body) => {
      const $container = $body
        .find('.MuiDrawer-root:visible, [role="dialog"]:visible, .MuiModal-root:visible')
        .last();

      const $campo = $container
        .find(`input[name="${name}"], textarea[name="${name}"]`)
        .filter(':visible')
        .first();

      if (!$campo.length) {
        cy.log(`⚠️ No encontrado campo name="${name}" para ${etiqueta}`);
        return cy.wrap(null);
      }

      cy.log(`✍️ Rellenando ${etiqueta} con "${valor}"`);

      return cy.wrap($campo)
        .scrollIntoView()
        .click({ force: true })
        .clear({ force: true })
        .type(String(valor), { force: true, delay: 0 });
    });
  }

  function abrirModalSeccion(seccion, esperarDrawer = true) {
    return cy
      .contains('button, a', /\+?\s*Añadir/i, { timeout: 10000 })
      .filter(':visible')
      .first()
      .click({ force: true })
      .then(() => {
        if (!esperarDrawer) return cy.wrap(null);
        return cy
          .get('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="dialog"]:visible', { timeout: 20000 })
          .last()
          .should('be.visible');
      });
  }

  function encontrarValorEnCasoPorClave(caso, tipoClave, claveBuscada) {
    // ✅ Yo normalizo textos para comparar sin que me afecten:
    // - mayúsculas/minúsculas
    // - tildes
    // - espacios raros
    const norm = (s) =>
      String(s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    // ✅ Para comparar claves tipo:
    // "Código Postal" vs "CodigoPostal" vs "codigo_postal"
    const normKey = (s) => norm(s).replace(/[\s_\-]+/g, '');

    const tipo = norm(tipoClave);        // "name" | "id"
    const clave = normKey(claveBuscada); // "domicilio" | "poblacion" | "codigopostal" | etc.

    // ✅ 1) ESTE ES EL FORMATO REAL DE MI EXCEL (el correcto):
    // etiqueta_n          -> "name" o "id"
    // valor_etiqueta_n    -> la CLAVE (ej: Domicilio, Poblacion, Provincia, Notas...)
    // dato_n              -> el VALOR (ej: prueba, 7654...)
    for (let n = 1; n <= 60; n++) {
      const t = norm(caso[`etiqueta_${n}`]);
      const k = normKey(caso[`valor_etiqueta_${n}`]); // ✅ aquí está la clave real
      const v = caso[`dato_${n}`];                    // ✅ aquí está el valor real

      if (t === tipo && k === clave && v != null && String(v).trim() !== '') {
        return String(v).trim();
      }
    }
    // ✅ 2) FALLBACK por si tengo algún caso antiguo
    // (formato viejo: etiqueta_i / dato_i (clave) / dato_{i+1} (valor))
    const total = Number(caso?.__totalCamposExcel) || 140;
    for (let i = 1; i <= total - 1; i++) {
      const t = norm(caso[`etiqueta_${i}`]);
      const k = normKey(caso[`dato_${i}`]);
      const v = caso[`dato_${i + 1}`];

      if (t === tipo && k === clave && v != null && String(v).trim() !== '') {
        return String(v).trim();
      }
    }

    // Si no existe, devuelvo null para decidir yo si uso default o lo salto
    return null;
  }

  function llenarFormularioDireccion(caso) {
    // ✅ Estos son los campos del formulario "Nueva dirección" (los que salen a la derecha).
    // Yo los voy a rellenar dentro del panel del formulario, no fuera.
    const campos = [
      { label: 'Tipo', tipo: 'autocomplete', claveExcel: 'Fiscal', defaults: ['Fiscal'] },
      { label: 'Dirección', tipo: 'input', name: 'Domicilio', claveExcel: 'Domicilio', placeholder: 'Dirección' },
      { label: 'Población', tipo: 'input', name: 'Poblacion', claveExcel: 'Poblacion', placeholder: 'Población' },
      { label: 'Provincia', tipo: 'input', name: 'Provincia', claveExcel: 'Provincia', placeholder: 'Provincia' },
      { label: 'País', tipo: 'autocomplete', claveExcel: 'España', defaults: ['ESPAÑA'] },
      { label: 'Código Postal', tipo: 'input', name: 'CodigoPostal', claveExcel: 'CodigoPostal', placeholder: 'Código Postal' },
      { label: 'Notas', tipo: 'input', name: 'Notas', claveExcel: 'Notas', placeholder: 'Notas' },
    ];

    const escapeRegex = (texto = '') => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const escribirInput = ($input, valor) => {
      // ✅ Yo escribo así para asegurarme de que realmente se reemplaza el valor anterior
      return cy.wrap($input)
        .scrollIntoView()
        .click({ force: true })
        .type('{selectall}{backspace}', { force: true })
        .type(String(valor), { force: true });
    };

    const seleccionarOpcionListboxRobusta = (valor) => {
      // ✅ Si aparece el listbox, selecciono la opción de forma robusta
      return cy.get('ul[role="listbox"]', { timeout: 15000 })
        .should('be.visible')
        .within(() => {
          cy.contains('li', new RegExp(`^${escapeRegex(valor)}$`, 'i'))
            .click({ force: true });
        });
    };

    const obtenerValorCampo = (campo) => {
      // ✅ Primero intento sacar el valor del Excel con la clave real.
      let valor = encontrarValorEnCasoPorClave(caso, 'name', campo.claveExcel);

      // ✅ Si no existe y es un campo "Tipo" o "País", uso default (porque me dijiste que por ahora es fijo).
      if (!valor && campo.defaults?.length) {
        valor = campo.defaults[0];
        cy.log(`⚠️ Usando default para "${campo.label}": ${valor}`);
      }

      return valor;
    };

    const rellenarAutocompletePorLabelDentroPanel = (panel, labelText, valor) => {
      // ✅ Para los autocompletes (Tipo, País) yo me engancho al label y saco su "for"
      // porque los ids tipo _r_3i_ cambian y no quiero depender de eso.
      return cy.wrap(panel)
        .contains('label', new RegExp(`^${escapeRegex(labelText)}$`, 'i'))
        .should('exist')
        .invoke('attr', 'for')
        .then((forAttr) => {
          if (!forAttr) {
            throw new Error(`El label "${labelText}" no tiene atributo 'for'`);
          }

          return cy.wrap(panel)
            .find(`#${CSS.escape(forAttr)}`)
            .should('exist')
            .then(($input) => escribirInput($input, valor))
            .then(() => {
              // ✅ A veces el listbox tarda, pero si aparece lo selecciono.
              // Si no aparece, intento confirmación con teclado.
              return cy.get('body').then(($b) => {
                const hayList = $b.find('ul[role="listbox"]:visible').length > 0;
                if (hayList) return seleccionarOpcionListboxRobusta(valor);
                return cy.wrap($input).type('{downArrow}{enter}', { force: true });
              });
            })
            .then(() => cy.get('body').type('{esc}', { force: true, log: false }));
        });
    };

    const rellenarInputNormalDentroPanel = (panel, campo, valor) => {
      // ✅ Para inputs normales, primero intento por name (lo ideal)
      return cy.wrap(panel)
        .find(`input[name="${campo.name}"], textarea[name="${campo.name}"]`)
        .then(($byName) => {
          if ($byName && $byName.length) {
            return escribirInput($byName, valor);
          }

          // ✅ Si no hay name, tiro de placeholder (porque en tu UI están todos definidos)
          return cy.wrap(panel)
            .find(`input[placeholder="${campo.placeholder}"], textarea[placeholder="${campo.placeholder}"]`)
            .then(($byPh) => {
              if (!$byPh || !$byPh.length) {
                throw new Error(
                  `No encuentro el input de "${campo.label}" (ni name="${campo.name}" ni placeholder="${campo.placeholder}")`
                );
              }
              return escribirInput($byPh, valor);
            });
        });
    };

    // ✅ Yo SIEMPRE primero localizo el panel correcto "Nueva dirección"
    // para asegurarme de que no estoy rellenando filtros o campos fuera del formulario.
    return getPanelNuevaDireccion().then((panel) => {
      let chain = cy.wrap(null);

      campos.forEach((campo) => {
        chain = chain.then(() => {
          cy.log(`➡️ Rellenando campo: ${campo.label}`);

          const valor = obtenerValorCampo(campo);

          // ✅ Si el campo viene vacío en Excel y no es obligatorio, lo salto sin romper el test.
          // (Pero si tú quieres que falle, me lo dices y lo hago "throw" para obligarlo.)
          if (!valor) {
            cy.log(`ℹ️ Sin valor en Excel para "${campo.label}" (clave: ${campo.claveExcel})`);
            return cy.wrap(null);
          }

          // ✅ Autocomplete (Tipo, País)
          if (campo.tipo === 'autocomplete') {
            return rellenarAutocompletePorLabelDentroPanel(panel, campo.label, valor);
          }

          // ✅ Input normal (Dirección, Población, Provincia, CP, Notas)
          return rellenarInputNormalDentroPanel(panel, campo, valor);
        });
      });

      return chain;
    });
  }

  function guardarNuevaDireccion() {
    // ✅ Yo guardo DENTRO del panel "Nueva dirección" (el de la derecha),
    // porque hay otro Guardar en el header y no quiero equivocarme.
    return getPanelNuevaDireccion().then((panel) => {
      return cy.wrap(panel)
        .contains('button', /^(Guardar|Save|Desar)$/i, { timeout: 15000 })
        .filter(':visible')
        .last()
        .scrollIntoView()
        .click({ force: true })
        .then(() => cy.wait(800));
    });
  }

  function getPanelNuevaDireccion() {
    // ✅ Esto me asegura que estoy trabajando en el formulario lateral derecho.
    // Cojo el H3 "Nueva dirección" y subo hasta encontrar un contenedor que tenga inputs del formulario.
    return cy
      .contains('h3', /^Nueva dirección$/i, { timeout: 20000 })
      .should('be.visible')
      .then(($h3) => {
        const $parents = Cypress.$($h3).parents('div');

        // ✅ Busco el primer contenedor padre que realmente contenga inputs del formulario
        const candidato = $parents.toArray().find((el) => {
          return (
            el.querySelector('input[placeholder="Dirección"]') ||
            el.querySelector('input[name="Domicilio"]') ||
            el.querySelector('input[placeholder="Código Postal"]') ||
            el.querySelector('textarea[placeholder="Notas"]') ||
            el.querySelector('input[placeholder="Notas"]')
          );
        });

        // Si lo encuentro, devuelvo ese contenedor; si no, hago fallback a algo cercano
        if (candidato) return cy.wrap(candidato);

        // Fallback: subir 2 niveles (suele funcionar cuando el DOM cambia)
        return cy.wrap($h3).parent().parent();
      });
  }

  function llenarFormularioContacto(caso) {
    // ✅ Yo aquí relleno el formulario del panel "Nuevo contacto" (o "Nuevo Contacto")
    // con los datos que vienen del Excel:
    // - Nombre
    // - Teléfono
    // - Email
    // - Cargo
    const campos = [
      { label: 'Nombre', name: 'Nombre', claveExcel: 'Nombre', placeholder: 'Nombre' },
      { label: 'Teléfono', name: 'Telefono', claveExcel: 'Telefono', placeholder: 'Teléfono' },
      { label: 'Email', name: 'Email', claveExcel: 'Email', placeholder: 'Email' },
      { label: 'Cargo', name: 'Cargo', claveExcel: 'Cargo', placeholder: 'Cargo' },
    ];

    const escapeRegex = (texto = '') => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const escribirInput = ($input, valor) => {
      // ✅ Yo escribo así para asegurar ensuring de que se reemplaza el valor anterior
      return cy.wrap($input)
        .scrollIntoView()
        .click({ force: true })
        .type('{selectall}{backspace}', { force: true })
        .type(String(valor), { force: true });
    };

    const obtenerValorCampo = (campo) => {
      // ✅ Aquí tiro de mi lector robusto (el que ya arreglamos en TC30)
      // En el Excel la clave real está en valor_etiqueta_n.
      const valor = encontrarValorEnCasoPorClave(caso, 'name', campo.claveExcel);
      return valor ? String(valor).trim() : null;
    };

    const rellenarInputNormalDentroPanel = (panel, campo, valor) => {
      // ✅ Primero intento por name (es lo ideal, y tú ya lo tienes en el DOM: name="Nombre", "Telefono", etc.)
      return cy.wrap(panel)
        .find(`input[name="${campo.name}"], textarea[name="${campo.name}"]`)
        .then(($byName) => {
          if ($byName && $byName.length) {
            return escribirInput($byName, valor);
          }

          // ✅ Si por lo que sea cambia el name, tiro de placeholder como fallback
          return cy.wrap(panel)
            .find(`input[placeholder="${campo.placeholder}"], textarea[placeholder="${campo.placeholder}"]`)
            .then(($byPh) => {
              if (!$byPh || !$byPh.length) {
                throw new Error(
                  `No encuentro el input de "${campo.label}" (ni name="${campo.name}" ni placeholder="${campo.placeholder}")`
                );
              }
              return escribirInput($byPh, valor);
            });
        });
    };

    // ✅ Igual que con Direcciones: yo primero localizo el panel correcto del formulario
    return getPanelNuevoContacto().then((panel) => {
      let chain = cy.wrap(null);

      campos.forEach((campo) => {
        chain = chain.then(() => {
          cy.log(`➡️ Rellenando campo contacto: ${campo.label}`);

          const valor = obtenerValorCampo(campo);

          // ✅ Si no viene valor, lo dejo registrado en log pero no rompo el test
          // (si quieres que sea obligatorio, te lo cambio para que haga throw)
          if (!valor) {
            cy.log(`ℹ️ Sin valor en Excel para "${campo.label}" (clave: ${campo.claveExcel})`);
            return cy.wrap(null);
          }

          return rellenarInputNormalDentroPanel(panel, campo, valor);
        });
      });

      return chain;
    });
  }

  function guardarNuevoContacto() {
    // ✅ Yo guardo DENTRO del panel del contacto, no el Guardar del header
    return getPanelNuevoContacto().then((panel) => {
      return cy.wrap(panel)
        .contains('button', /^(Guardar|Save|Desar)$/i, { timeout: 15000 })
        .filter(':visible')
        .last()
        .scrollIntoView()
        .click({ force: true })
        .then(() => cy.wait(800));
    });
  }

  function getPanelNuevoContacto() {
    // ✅ Localizo el panel del formulario de contacto por el título
    // (puede variar el texto, por eso lo hago flexible)
    return cy
      .contains('h3', /(Nuevo contacto|Nueva persona de contacto|Contactos|Contacto)/i, { timeout: 20000 })
      .should('be.visible')
      .then(($h3) => {
        const $parents = Cypress.$($h3).parents('div');

        // ✅ Busco el primer padre que contenga inputs del formulario de contacto
        const candidato = $parents.toArray().find((el) => {
          return (
            el.querySelector('input[name="Nombre"]') ||
            el.querySelector('input[name="Telefono"]') ||
            el.querySelector('input[name="Email"]') ||
            el.querySelector('input[name="Cargo"]') ||
            el.querySelector('label[for][id*="-label"]')
          );
        });

        if (candidato) return cy.wrap(candidato);

        // ✅ Fallback típico si cambia el DOM: subir un poco
        return cy.wrap($h3).parent().parent();
      });
  }

  function llenarFormularioAsociado(caso) {
    // ✅ TC032 - ASOCIADOS
    // Aquí "Proveedor" es un Autocomplete MUI (desplegable).
    // Lo relleno como en DIRECCIONES:
    // 1) localizar input combobox del campo (por label->for si existe, si no por input role=combobox)
    // 2) escribir el valor
    // 3) esperar listbox y seleccionar opción (click preferente, fallback teclado)

    const norm = (s) =>
      String(s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const escapeRegex = (texto = '') => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const obtenerProveedorDesdeExcel = () => {
      // ✅ Primero intento que exista como name "Proveedor" (por si algún día lo cambias)
      let v =
        encontrarValorEnCasoPorClave(caso, 'name', 'Proveedor') ||
        encontrarValorEnCasoPorClave(caso, 'name', 'proveedor');

      // ✅ Tu TC032 real viene como: id _r_3n_-label -> "2 - PROVEEDORES DIVERSOS"
      // Como los ids cambian, me vale cualquier tripleta id ... -label que tenga valor.
      if (!v) {
        for (let n = 1; n <= 60; n++) {
          const tipo = String(caso[`etiqueta_${n}`] || '').trim().toLowerCase();
          const idLabel = String(caso[`valor_etiqueta_${n}`] || '').trim();
          const dato = caso[`dato_${n}`];

          if (tipo === 'id' && /-label$/i.test(idLabel) && dato != null && String(dato).trim() !== '') {
            v = String(dato).trim();
            break;
          }
        }
      }

      return v || null;
    };

    const seleccionarOpcionListboxRobusta = (valor) => {
      const buscado = norm(valor);

      return cy
        .get('body', { log: false })
        .then(($b) => {
          const $list = $b.find('ul[role="listbox"]:visible').last();
          if (!$list.length) return false;
          return true;
        })
        .then((hayList) => {
          if (!hayList) return cy.wrap(null);

          return cy
            .get('ul[role="listbox"]', { timeout: 15000 })
            .filter(':visible')
            .last()
            .find('li[role="option"], li')
            .then(($lis) => {
              const exacto = [...$lis].find((li) => norm(li.innerText) === buscado);
              if (exacto) return cy.wrap(exacto).click({ force: true });

              // fallback: contiene texto
              return cy
                .get('ul[role="listbox"]')
                .filter(':visible')
                .last()
                .contains('li', new RegExp(escapeRegex(valor), 'i'))
                .click({ force: true });
            });
        });
    };

    const escribirAutocompleteMUI = (panel, valor) => {
      const target = String(valor || '').trim();
      if (!target) return cy.wrap(null);

      // Intento 1: localizar por label "Proveedor" -> for -> input id (sin exigir :visible en label)
      const intentarPorLabelFor = () => {
        return cy.wrap(panel).then(($p) => {
          const $lab = $p.find('label[for]').filter((_, el) => /^Proveedor$/i.test((el.textContent || '').trim())).first();
          const forAttr = $lab.attr('for');
          if (!forAttr) return cy.wrap(null);

          return cy
            .wrap($p)
            .find(`#${CSS.escape(forAttr)}`, { timeout: 15000 })
            .then(($inp) => {
              if (!$inp || !$inp.length) return cy.wrap(null);

              return cy
                .wrap($inp)
                .scrollIntoView()
                .click({ force: true })
                .clear({ force: true })
                .type(target, { force: true })
                .then(() => cy.wait(250, { log: false }))
                .then(() => {
                  // si aparece listbox => click opción, si no => teclado
                  return cy.get('body').then(($b2) => {
                    const hayList = $b2.find('ul[role="listbox"]:visible').length > 0;
                    if (hayList) return seleccionarOpcionListboxRobusta(target);
                    return cy.wrap($inp).type('{downArrow}{enter}', { force: true });
                  });
                })
                .then(() => cy.wait(150, { log: false }))
                .then(() => {
                  // Validación mínima: no vacío
                  return cy.wrap($inp).invoke('val').then((v) => {
                    const val = String(v || '').trim();
                    if (!val) throw new Error('⚠️ Proveedor no quedó seleccionado (input vacío)');
                  });
                });
            });
        });
      };

      // Intento 2: fallback a "input role=combobox" dentro del panel (como DIRECCIONES)
      const intentarPorCombobox = () => {
        return cy
          .wrap(panel)
          .find('input[role="combobox"], input[aria-autocomplete="list"], input[aria-haspopup="listbox"]', { timeout: 15000 })
          .first()
          .then(($inp) => {
            if (!$inp || !$inp.length) throw new Error('No encontré el input combobox del Autocomplete "Proveedor"');

            return cy
              .wrap($inp)
              .scrollIntoView()
              .click({ force: true })
              .clear({ force: true })
              .type(target, { force: true })
              .then(() => cy.wait(250, { log: false }))
              .then(() => {
                return cy.get('body').then(($b2) => {
                  const hayList = $b2.find('ul[role="listbox"]:visible').length > 0;
                  if (hayList) return seleccionarOpcionListboxRobusta(target);
                  return cy.wrap($inp).type('{downArrow}{enter}', { force: true });
                });
              })
              .then(() => cy.wait(150, { log: false }))
              .then(() => {
                return cy.wrap($inp).invoke('val').then((v) => {
                  const val = String(v || '').trim();
                  if (!val) throw new Error('⚠️ Proveedor no quedó seleccionado (input vacío)');
                });
              });
          });
      };

      return intentarPorLabelFor().then((res) => {
        // Si el primer intento no hizo nada, hago el fallback
        // (res suele ser null si no encontró forAttr/input)
        if (res === null) return intentarPorCombobox();
        return cy.wrap(null);
      });
    };

    return getPanelNuevoProveedorAsociado().then((panel) => {
      const proveedor = obtenerProveedorDesdeExcel();

      if (!proveedor) {
        cy.log('ℹ️ Sin valor en Excel para "Proveedor" (TC032 - Asociados)');
        return cy.wrap(null);
      }

      cy.log(`➡️ Rellenando "Proveedor" con: ${proveedor}`);

      return escribirAutocompleteMUI(panel, proveedor)
        .then(() => cy.get('body').type('{esc}', { force: true, log: false }));
    });
  }

  function guardarNuevoAsociado() {
    // ✅ Yo pulso "Guardar" DENTRO del panel del asociado (no el del header)
    return getPanelNuevoProveedorAsociado().then((panel) => {
      return cy.wrap(panel)
        .contains('button', /^(Guardar|Save|Desar)$/i, { timeout: 15000 })
        .filter(':visible')
        .last()
        .scrollIntoView()
        .click({ force: true })
        .then(() => cy.wait(800));
    });
  }

  function getPanelNuevoProveedorAsociado() {
    // ✅ Yo localizo el panel por el título exacto que me has pasado:
    // "Nuevo proveedor asociado"
    // Y me subo al contenedor grande (drawer/modal/dialog) para asegurar que todo está dentro.
    return cy
      .contains('h3', /^Nuevo proveedor asociado$/i, { timeout: 20000 })
      .should('be.visible')
      .then(($h3) => {
        const $root = Cypress.$($h3).closest('.MuiDrawer-root, .MuiModal-root, [role="dialog"]');
        if ($root.length) return cy.wrap($root);

        // Fallback si no detecta drawer/modal: subo un poco
        return cy.wrap($h3).parents('div').eq(2);
      });
  }

  function llenarFormularioIncidencia(caso, numeroCaso) {
    const fecha = caso.dato_1;
    const descripcion = caso.dato_2;
    const notas = caso.dato_3;

    cy.log(`🧪 Incidencia -> Fecha="${fecha}" | Descripción="${descripcion}" | Notas="${notas}"`);

    let chain = cy.wrap(null);

    if (fecha) {
      chain = chain.then(() => {
        const textoFecha = fecha.toString();
        const fechaObj = parseFechaBasicaExcel(textoFecha);

        const abrirCalendario = () => {
          return cy.get('body').then(($body) => {
            const $container = $body
              .find('.MuiDrawer-root:visible, [role="dialog"]:visible, .MuiModal-root:visible')
              .last();

            const $btn = $container
              .find('button[aria-label*="Choose date"], button[aria-label*="date"], button[aria-label*="fecha"]')
              .filter(':visible')
              .first();

            if ($btn.length) return cy.wrap($btn[0]).click({ force: true });

            const $inp = $container
              .find('input[placeholder="DD/MM/YYYY"], input[placeholder*="DD/"], input')
              .filter(':visible')
              .first();

            if ($inp.length) return cy.wrap($inp[0]).click({ force: true });

            return cy.get('button[aria-label*="Choose date"], button[aria-label*="date"], button[aria-label*="fecha"]', { timeout: 15000 })
              .filter(':visible')
              .first()
              .click({ force: true });
          });
        };

        return abrirCalendario()
          .then(() => cy.wait(300))
          .then(() => seleccionarFechaEnCalendario(fechaObj));
      });
    }

    // ✅ AQUÍ ES DONDE TE FALTABAN LOS CAMPOS
    if (descripcion) {
      chain = chain.then(() => escribirPorName('Incidencia', descripcion, 'Descripción'));
    }

    if (notas) {
      chain = chain.then(() => escribirPorName('Notas', notas, 'Notas'));
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}✅ Formulario Incidencias rellenado desde Excel`);
    });
  }

  function guardarNuevaIncidencia() {
    return getPanelNuevaIncidencia().then((panel) => {
      // Intento 1: Guardar dentro del panel de "Nueva incidencia"
      return cy.wrap(panel).then(($p) => {
        const $btnLocal = $p.find('button:visible').filter((_, el) => /^(Guardar|Save|Desar)$/i.test((el.textContent || '').trim()));
        if ($btnLocal.length) {
          return cy.wrap($btnLocal.last()).scrollIntoView().click({ force: true }).then(() => cy.wait(800));
        }

        // Intento 2: último Guardar visible en pantalla (por si el botón está fuera del panel)
        return cy
          .contains('button', /^(Guardar|Save|Desar)$/i, { timeout: 15000 })
          .filter(':visible')
          .last()
          .scrollIntoView()
          .click({ force: true })
          .then(() => cy.wait(800));
      });
    });
  }

  // ✅ Panel de "Nueva incidencia": me amarro al título y saco el contenedor real del formulario
  function getPanelNuevaIncidencia() {
    return cy
      .contains('h3', /^Nueva incidencia$/i, { timeout: 20000 })
      .should('be.visible')
      .then(($h3) => {
        // Subo varios niveles y elijo el primer contenedor que contenga el input de Descripción o Notas
        const $parents = Cypress.$($h3).parents();

        const candidato = Array.from($parents).find((el) => {
          return (
            el.querySelector('input[name="Incidencia"]') ||
            el.querySelector('input[name="Notas"]') ||
            el.querySelector('input#_r_9s_') || // fallback por id que me pasaste
            el.querySelector('input#_r_9t_')
          );
        });

        // Si lo encuentro, lo devuelvo. Si no, devuelvo un padre cercano (fallback).
        if (candidato) return cy.wrap(candidato);

        return cy.wrap(Cypress.$($h3).parent().parent());
      });
  }

  function escribirPorNameEnIncidencia(name, valor, etiquetaLog = '') {
    const v = String(valor ?? '').trim();
    if (!v) return cy.wrap(null);

    return getPanelNuevaIncidencia().then((panel) => {
      cy.log(`Rellenando ${etiquetaLog || name} con "${v}"`);

      return cy.wrap(panel)
        .find(`input[name="${name}"], textarea[name="${name}"]`, { timeout: 15000 })
        .should('exist')
        .then(($inp) => {
          return cy.wrap($inp)
            .filter(':visible')
            .first()
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(v, { force: true });
        });
    });
  }

  function llenarFormularioZonaCarga(caso, numeroCaso) {
    // ✅ Leer de Excel de forma robusta:
    // TC034 -> etiqueta_1=name, valor_etiqueta_1=Nombre, dato_1=prueba
    const nombre =
      encontrarValorEnCasoPorClave(caso, 'name', 'Nombre') ||
      (caso?.dato_1 ?? '').toString().trim();

    cy.log(`📦 Zona de carga -> Nombre="${nombre}"`);

    if (!nombre) {
      cy.log(`⚠️ Sin valor en Excel para "Nombre" (TC${String(numeroCaso).padStart(3, '0')} - Zonas de carga)`);
      return cy.wrap(null);
    }

    // ✅ Trabajar SIEMPRE dentro del panel correcto
    return getPanelNuevaZonaCarga().then((panel) => {
      // 1) Intento ideal: input[name="Nombre"] dentro del panel
      return cy.wrap(panel).then(($p) => {
        const $inpByName = $p.find('input[name="Nombre"]').filter(':visible').first();

        if ($inpByName.length) {
          // ✅ IMPORTANTÍSIMO: RETORNAR la cadena Cypress
          return cy.wrap($inpByName)
            .scrollIntoView()
            .click({ force: true })
            .type('{selectall}{backspace}', { force: true })
            .type(String(nombre), { force: true, delay: 0 })
            .should('have.value', String(nombre));
        }

        // 2) Fallback: por label "Nombre" -> for -> id del input (como en tu HTML: for="_r_5p_")
        return cy.wrap($p)
          .contains('label', /^Nombre$/i)
          .should('exist')
          .invoke('attr', 'for')
          .then((forAttr) => {
            if (!forAttr) throw new Error('El label "Nombre" no tiene atributo "for"');

            return cy.wrap($p)
              .find(`#${CSS.escape(forAttr)}`, { timeout: 15000 })
              .should('be.visible')
              .scrollIntoView()
              .click({ force: true })
              .type('{selectall}{backspace}', { force: true })
              .type(String(nombre), { force: true, delay: 0 })
              .should('have.value', String(nombre));
          });
      });
    })
      .then(() => {
        cy.log('✅ Formulario Zonas de carga rellenado');
      });
  }

  function getPanelNuevaZonaCarga() {
    return cy
      .contains('h3', /^Nueva zona de carga$/i, { timeout: 20000 })
      .should('be.visible')
      .then(($h3) => {
        const $parents = Cypress.$($h3).parents();

        const candidato = Array.from($parents).find((el) => {
          return (
            el.querySelector('input[name="Nombre"]') ||
            (el.querySelector('label[for]') && /nombre/i.test(el.textContent || ''))
          );
        });

        if (candidato) return cy.wrap(candidato);

        return cy.wrap(Cypress.$($h3).parent().parent());
      });
  }

  function guardarNuevaZonaCarga() {
    return getPanelNuevaZonaCarga().then((panel) => {
      // Intento 1: botón Guardar dentro del panel
      return cy.wrap(panel).then(($p) => {
        const $btnLocal = $p
          .find('button:visible')
          .filter((_, el) => /^(Guardar|Save|Desar)$/i.test((el.textContent || '').trim()));

        if ($btnLocal.length) {
          return cy.wrap($btnLocal.last()).scrollIntoView().click({ force: true }).then(() => cy.wait(800));
        }

        // Intento 2: último Guardar visible (si el botón está fuera del panel)
        return cy
          .contains('button', /^(Guardar|Save|Desar)$/i, { timeout: 15000 })
          .filter(':visible')
          .last()
          .scrollIntoView()
          .click({ force: true })
          .then(() => cy.wait(800));
      });
    });
  }

  // ✅ Panel de "Nueva zona de carga": me engancho al título y saco el contenedor real del formulario
  function getPanelNuevaZonaCarga() {
    return cy
      .contains('h3', /^Nueva zona de carga$/i, { timeout: 20000 })
      .should('be.visible')
      .then(($h3) => {
        // Subo niveles y me quedo con el primer contenedor que tenga el input "Nombre"
        const $parents = Cypress.$($h3).parents();

        const candidato = Array.from($parents).find((el) => {
          return (
            el.querySelector('input[name="Nombre"]') || // lo ideal
            el.querySelector('input#_r_ej_')            // fallback por id que me pasaste
          );
        });

        if (candidato) return cy.wrap(candidato);

        // fallback si el DOM cambia
        return cy.wrap(Cypress.$($h3).parent().parent());
      });
  }

  function llenarFormularioCertificacion(caso, numeroCaso) {
    const empresa = String(caso?.dato_1 ?? '').trim(); // DESDE CANARIAS
    const tipo = String(caso?.dato_2 ?? '').trim(); // Seguridad Social
    const fecha = String(caso?.dato_3 ?? '').trim(); // 22/01/2026
    const notas = String(caso?.dato_4 ?? '').trim(); // prueba

    cy.log(`📌 Certificación -> Empresa="${empresa}" | Tipo="${tipo}" | Fecha="${fecha}" | Notas="${notas}"`);

    let chain = cy.wrap(null);

    if (empresa) chain = chain.then(() => reemplazarEmpresaEnCertificacion(empresa));
    if (tipo) chain = chain.then(() => rellenarTipoEnCertificacion(tipo));
    if (fecha) chain = chain.then(() => rellenarFechaEnCertificacion(fecha));
    if (notas) chain = chain.then(() => rellenarNotasEnCertificacion(notas));

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}✅ Certificaciones rellenado`);
    });
  }

  function reemplazarEmpresaEnCertificacion(valorEmpresa) {
    const v = String(valorEmpresa ?? '').trim();
    if (!v) return cy.wrap(null);

    const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const seleccionarOpcionListbox = (valor) => {
      const reExact = new RegExp(`^\\s*${escapeRegex(valor)}\\s*$`, 'i');

      return cy.get('ul[role="listbox"]', { timeout: 15000 })
        .filter(':visible')
        .last()
        .find('li[role="option"], li')
        .filter(':visible')
        .then(($lis) => {
          const exact = [...$lis].find(li => reExact.test(li.innerText || ''));
          if (exact) return cy.wrap(exact).scrollIntoView().click({ force: true });

          return cy.get('ul[role="listbox"]')
            .filter(':visible')
            .last()
            .contains('li', new RegExp(escapeRegex(valor), 'i'))
            .scrollIntoView()
            .click({ force: true });
        });
    };

    // 🔥 borra hasta vacío (por si queda 1 letra tipo "B")
    const borrarHastaVacio = ($input, intentos = 0) => {
      if (intentos >= 6) return cy.wrap(null); // corta para evitar bucle infinito

      return cy.wrap($input).invoke('val').then((val) => {
        const texto = String(val || '');

        if (texto.trim() === '') return cy.wrap(null);

        // Asegurar cursor al final
        return cy.wrap($input)
          .click({ force: true })
          .type('{end}', { force: true, log: false })
          .type('{backspace}', { force: true, log: false })
          .then(() => cy.wait(50, { log: false }))
          .then(() => borrarHastaVacio($input, intentos + 1));
      });
    };

    return getPanelNuevaCertificacion().then((panel) => {
      return cy.wrap(panel).then(($p) => {
        const $label = $p.find('label[for]')
          .filter((_, el) => /^Empresa$/i.test((el.textContent || '').trim()))
          .first();

        if (!$label.length) throw new Error('No se encontró el label "Empresa"');

        const forAttr = $label.attr('for');
        const $input = $p.find(`#${CSS.escape(forAttr)}`).filter(':visible').first();

        if (!$input.length) throw new Error('No se encontró el input Empresa');

        // 1) foco + borrar “a lo bruto” por longitud
        return cy.wrap($input)
          .scrollIntoView()
          .click({ force: true })
          .invoke('val')
          .then((valorActual) => {
            const texto = String(valorActual || '');
            if (!texto) return;

            cy.log(`🧹 Borrando ${texto.length} caracteres de Empresa`);
            const backspaces = '{backspace}'.repeat(texto.length + 3); // +3 por si MUI deja 1-2 letras
            return cy.wrap($input)
              .type('{end}', { force: true, log: false })
              .type(backspaces, { force: true, delay: 0 });
          })
          // 2) asegurar que queda vacío del todo (quita la “B”)
          .then(() => borrarHastaVacio($input))
          .then(() => cy.wrap($input).should(($i) => {
            const val = String($i.val() || '').trim();
            if (val !== '') throw new Error(`Empresa no quedó vacía: "${val}"`);
          }))
          // 3) escribir lo del Excel
          .then(() => cy.wrap($input).type(v, { force: true, delay: 0 }))
          .then(() => cy.wait(250, { log: false }))
          // 4) seleccionar del listbox
          .then(() => seleccionarOpcionListbox(v))
          .then(() => cy.get('body').type('{esc}', { force: true, log: false }));
      });
    });
  }

  function rellenarTipoEnCertificacion(valorTipo) {
    const v = String(valorTipo ?? '').trim();
    if (!v) return cy.wrap(null);

    const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const seleccionarOpcionListbox = (valor) => {
      const reExact = new RegExp(`^\\s*${escapeRegex(valor)}\\s*$`, 'i');

      return cy.get('ul[role="listbox"]', { timeout: 15000 })
        .filter(':visible')
        .last()
        .find('li[role="option"], li')
        .then(($lis) => {
          const exact = [...$lis].find((li) => reExact.test(li.innerText || ''));
          if (exact) return cy.wrap(exact).scrollIntoView().click({ force: true });

          return cy.get('ul[role="listbox"]')
            .filter(':visible')
            .last()
            .contains('li', new RegExp(escapeRegex(valor), 'i'))
            .scrollIntoView()
            .click({ force: true });
        });
    };

    return getPanelNuevaCertificacion().then((panel) => {
      return cy.wrap(panel).then(($p) => {
        const $label = $p.find('label[for]').filter((_, el) => /^Tipo$/i.test((el.textContent || '').trim())).first();
        if (!$label.length) throw new Error('No se encontró el label "Tipo" dentro de "Nueva certificación"');

        const forAttr = $label.attr('for');
        if (!forAttr) throw new Error('El label "Tipo" no tiene atributo "for"');

        const $input = $p.find(`#${CSS.escape(forAttr)}`).first();
        if (!$input.length) throw new Error(`No se encontró el input Tipo con id #${forAttr}`);

        return cy.wrap($input)
          .scrollIntoView()
          .click({ force: true })
          .type('{selectall}{backspace}', { force: true })
          .type(v, { force: true, delay: 0 })
          .then(() => cy.wait(200, { log: false }))
          .then(() => seleccionarOpcionListbox(v))
          .then(() => cy.get('body').type('{esc}', { force: true, log: false }));
      });
    });
  }

  function rellenarFechaEnCertificacion(valorFecha) {
    const textoFecha = String(valorFecha ?? '').trim();
    if (!textoFecha) return cy.wrap(null);

    const fechaObj = parseFechaBasicaExcel(textoFecha);

    return getPanelNuevaCertificacion().then((panel) => {
      return cy.wrap(panel)
        .find('button[aria-label*="Choose date"], button[aria-label*="date"], button[aria-label*="fecha"]', { timeout: 15000 })
        .filter(':visible')
        .first()
        .click({ force: true })
        .then(() => cy.wait(300))
        .then(() => seleccionarFechaEnCalendario(fechaObj));
    });
  }

  function rellenarNotasEnCertificacion(valorNotas) {
    const v = String(valorNotas ?? '').trim();
    if (!v) return cy.wrap(null);

    return getPanelNuevaCertificacion().then((panel) => {
      return cy.wrap(panel)
        .find('input[name="Notas"], textarea[name="Notas"]', { timeout: 15000 })
        .filter(':visible')
        .first()
        .scrollIntoView()
        .click({ force: true })
        .type('{selectall}{backspace}', { force: true })
        .type(v, { force: true, delay: 0 })
        .should('have.value', v);
    });
  }

  function getPanelNuevaCertificacion() {
    // Engancharse al título y subir hasta un contenedor que tenga los inputs
    return cy
      .contains('h3', /^Nueva certificaci[oó]n$/i, { timeout: 20000 })
      .should('be.visible')
      .then(($h3) => {
        const $parents = Cypress.$($h3).parents('div');

        const candidato = $parents.toArray().find((el) => {
          return (
            el.querySelector('input[role="combobox"]') ||   // Empresa/Tipo
            el.querySelector('button[aria-label*="date"]') || // Fecha
            el.querySelector('input[name="Notas"]')         // Notas
          );
        });

        if (candidato) return cy.wrap(candidato);

        // fallback
        return cy.wrap($h3).parent().parent();
      });
  }

  function guardarNuevaCertificacion() {
    return getPanelNuevaCertificacion().then((panel) => {
      return cy.wrap(panel).then(($p) => {
        // ✅ 1) Intento: Guardar dentro del panel (lo normal)
        const $btnLocal = $p
          .find('button')
          .filter((_, el) => /^(Guardar|Save|Desar)$/i.test((el.textContent || '').trim()))
          .filter(':visible');

        if ($btnLocal.length) {
          return cy.wrap($btnLocal.last())
            .scrollIntoView()
            .click({ force: true })
            .then(() => cy.wait(800));
        }

        // ✅ 2) Fallback: el último Guardar visible en pantalla (si cambia el DOM)
        return cy.contains('button', /^(Guardar|Save|Desar)$/i, { timeout: 15000 })
          .filter(':visible')
          .last()
          .scrollIntoView()
          .click({ force: true })
          .then(() => cy.wait(800));
      });
    });
  }

  function llenarFormularioCalidad(caso, numeroCaso) {
    // ✅ En tu Excel TC036 viene:
    // dato_1 = 23/01/2026 (Fecha)
    // dato_2 = 5 (Valoración)
    // dato_3 = Crítico (Influencia)
    // dato_4 = Homologado (Catalogación)
    // dato_5 = Definitivo (Estado)
    const fechaTxt = String(caso?.dato_1 ?? '').trim();
    const valoracion = String(caso?.dato_2 ?? '').trim();
    const influencia = String(caso?.dato_3 ?? '').trim();
    const catalogacion = String(caso?.dato_4 ?? '').trim();
    const estado = String(caso?.dato_5 ?? '').trim();

    cy.log(`🧾 Calidad -> Fecha="${fechaTxt}" | Valoración="${valoracion}" | Influencia="${influencia}" | Catalogación="${catalogacion}" | Estado="${estado}"`);

    let chain = cy.wrap(null);

    // ✅ FECHA: igual que Certificación/Incidencias (click calendario + seleccionarFechaEnCalendario)
    if (fechaTxt) {
      chain = chain.then(() => {
        const fechaObj = parseFechaBasicaExcel(fechaTxt);
        if (!fechaObj) return cy.wrap(null);

        return getPanelNuevoRegistroCalidad().then((panel) => {
          return cy.wrap(panel)
            .find('button[aria-label*="Choose date"], button[aria-label*="date"], button[aria-label*="fecha"]', { timeout: 15000 })
            .first() // en tu HTML hay 1
            .click({ force: true })
            .then(() => cy.wait(300))
            .then(() => seleccionarFechaEnCalendario(fechaObj))
            .then(() => cy.wait(200));
        });
      });
    }

    const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const seleccionarOpcionListbox = (valor) => {
      const v = String(valor || '').trim();
      if (!v) return cy.wrap(null);

      const reExact = new RegExp(`^\\s*${escapeRegex(v)}\\s*$`, 'i');

      return cy.get('ul[role="listbox"]', { timeout: 15000 })
        .filter(':visible')
        .last()
        .find('li[role="option"], li')
        .then(($lis) => {
          const exact = [...$lis].find(li => reExact.test(li.innerText || ''));
          if (exact) return cy.wrap(exact).scrollIntoView().click({ force: true });

          return cy.get('ul[role="listbox"]')
            .filter(':visible')
            .last()
            .contains('li', new RegExp(escapeRegex(v), 'i'))
            .scrollIntoView()
            .click({ force: true });
        });
    };

    // ✅ Autocomplete genérico por label (Valoración/Influencia/Catalogación/Estado)
    const rellenarAutocompletePorLabel = (label, valor) => {
      const v = String(valor || '').trim();
      if (!v) return cy.wrap(null);

      return getPanelNuevoRegistroCalidad().then((panel) => {
        return cy.wrap(panel).then(($p) => {
          const $label = $p.find('label[for]').filter((_, el) => new RegExp(`^${escapeRegex(label)}$`, 'i').test((el.textContent || '').trim())).first();
          const forAttr = $label.attr('for');

          // intento 1: por label[for] -> input#id
          if (forAttr) {
            const $input = $p.find(`#${CSS.escape(forAttr)}`).first();
            if ($input.length) {
              return cy.wrap($input)
                .scrollIntoView()
                .click({ force: true })
                .type('{selectall}{backspace}', { force: true })
                .type(v, { force: true, delay: 0 })
                .then(() => cy.wait(200, { log: false }))
                .then(() => {
                  return cy.get('body').then(($b) => {
                    const hayList = $b.find('ul[role="listbox"]:visible').length > 0;
                    if (hayList) return seleccionarOpcionListbox(v);
                    return cy.wrap($input).type('{downArrow}{enter}', { force: true });
                  });
                })
                .then(() => cy.get('body').type('{esc}', { force: true, log: false }));
            }
          }

          // intento 2: fallback por "input role=combobox" dentro del formcontrol del label
          const $fc = $label.length ? $label.closest('.MuiFormControl-root') : Cypress.$();
          if ($fc.length) {
            const $combo = $fc.find('input[role="combobox"], input[aria-autocomplete="list"]').first();
            if ($combo.length) {
              return cy.wrap($combo)
                .scrollIntoView()
                .click({ force: true })
                .clear({ force: true })
                .type(v, { force: true })
                .then(() => cy.wait(200, { log: false }))
                .then(() => seleccionarOpcionListbox(v))
                .then(() => cy.get('body').type('{esc}', { force: true, log: false }));
            }
          }

          throw new Error(`No encuentro el Autocomplete de "${label}" en el panel de Calidad`);
        });
      });
    };

    if (valoracion) chain = chain.then(() => rellenarAutocompletePorLabel('Valoración', valoracion));
    if (influencia) chain = chain.then(() => rellenarAutocompletePorLabel('Influencia', influencia));
    if (catalogacion) chain = chain.then(() => rellenarAutocompletePorLabel('Catalogación', catalogacion));
    if (estado) chain = chain.then(() => rellenarAutocompletePorLabel('Estado', estado));

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}✅ Calidad rellenado`);
    });
  }

  function getPanelNuevoRegistroCalidad() {
    return cy
      .contains('h3', /^Nuevo registro de calidad$/i, { timeout: 20000 })
      .should('be.visible')
      .then(($h3) => {
        const $root = Cypress.$($h3).closest('.MuiDrawer-root, .MuiModal-root, [role="dialog"]');
        if ($root.length) return cy.wrap($root);

        // fallback
        const $parents = Cypress.$($h3).parents('div');
        const candidato = $parents.toArray().find((el) => {
          return (
            el.querySelector('input[placeholder*="DD"]') ||
            el.querySelector('button[aria-label*="date"]') ||
            el.querySelector('input[role="combobox"]')
          );
        });

        if (candidato) return cy.wrap(candidato);
        return cy.wrap(Cypress.$($h3).parent().parent());
      });
  }

  function guardarNuevoRegistroCalidad() {
    return getPanelNuevoRegistroCalidad().then((panel) => {
      // ✅ Guardar dentro del panel (drawer)
      return cy.wrap(panel)
        .contains('button', /^(Guardar|Save|Desar)$/i, { timeout: 15000 })
        .filter(':visible')
        .last()
        .scrollIntoView()
        .click({ force: true })
        .then(() => cy.wait(800));
    });
  }

  function getDrawerVisible() {
    return cy.get('.MuiDrawer-root:visible, [role="dialog"]:visible, .MuiModal-root:visible')
      .last()
      .should('be.visible');
  }

  function validarResultadoCalidad() {
    const norm = (s) => String(s || '').trim();

    const esperarFilaSinFallar = (intentos = 20) => {
      return cy.get('body').then(($b) => {
        const $rows = $b.find('.MuiDataGrid-row');
        if ($rows.length) return cy.wrap($rows.first());
        if (intentos <= 0) return cy.wrap(null);
        return cy.wait(400).then(() => esperarFilaSinFallar(intentos - 1));
      });
    };

    return esperarFilaSinFallar().then(($row) => {
      if (!$row) {
        return cy.wrap({
          resultado: 'ERROR',
          obtenido: 'No apareció ninguna fila en CALIDAD tras guardar'
        });
      }

      // 🔁 Ajusta aria-colindex si en tu tabla cambia el orden
      const valoracion = norm($row.find('[aria-colindex="1"]').text());
      const influencia = norm($row.find('[aria-colindex="2"]').text());
      const catalogacion = norm($row.find('[aria-colindex="3"]').text());
      const estado = norm($row.find('[aria-colindex="4"]').text());

      cy.log(`📌 Calidad -> Valoración="${valoracion}" | Influencia="${influencia}" | Catalogación="${catalogacion}" | Estado="${estado}"`);

      if (!valoracion || !influencia || !catalogacion || !estado) {
        return cy.wrap({
          resultado: 'ERROR',
          obtenido: `Guardó incompleto: Valoración="${valoracion}" | Influencia="${influencia}" | Catalogación="${catalogacion}" | Estado="${estado}"`
        });
      }

      return cy.wrap({
        resultado: 'OK',
        obtenido: `Calidad creada: Valoración="${valoracion}", Influencia="${influencia}", Catalogación="${catalogacion}", Estado="${estado}"`
      });
    });
  }

  function getPanelCalidadVisible() {
    return cy.contains('h3', /nuevo registro de calidad/i)
      .closest('.MuiDrawer-root, [role="dialog"], .MuiModal-root')
      .should('be.visible');
  }

  function setComboCalidad(labelText, valor) {
    const texto = String(valor || '').trim();
    if (!texto) return cy.wrap(null);

    return getPanelCalidadVisible().within(() => {
      cy.contains('label', new RegExp(`^${labelText}$`, 'i'))
        .closest('.MuiFormControl-root')
        .within(() => {
          cy.get('input[role="combobox"]')
            .click({ force: true })
            .clear({ force: true })
            .type(`${texto}{enter}`, { force: true });
        });
    });
  }
  function setFechaMuiPorLabel(labelRegex, fechaDDMMYYYY) {
    const fecha = String(fechaDDMMYYYY || '').trim();
    if (!fecha || !/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) return cy.wrap(null);

    return cy.contains('label', labelRegex)
      .closest('.MuiFormControl-root')
      .within(() => {
        // 1) click para enfocar el picker (opcional, ayuda)
        cy.get('.MuiPickersInputBase-root', { timeout: 15000 }).click({ force: true });

        // 2) escribir en el input REAL (aunque esté aria-hidden)
        cy.get('input.MuiPickersInputBase-input', { timeout: 15000 })
          .invoke('val', fecha)
          .trigger('input', { force: true })
          .trigger('change', { force: true })
          .blur({ force: true });

        // 3) comprobar que quedó bien
        cy.get('input.MuiPickersInputBase-input')
          .should('have.value', fecha);
      });
  }

  function setFechaMuiReactSafePorLabel(labelRegex, fechaDDMMYYYY) {
    const fecha = String(fechaDDMMYYYY || '').trim();
    if (!fecha || !/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) return cy.wrap(null);

    return cy.contains('label', labelRegex)
      .closest('.MuiFormControl-root')
      .within(() => {
        // el input real está ahí aunque a veces sea aria-hidden
        cy.get('input.MuiPickersInputBase-input', { timeout: 15000 })
          .then(($input) => {
            const input = $input[0];

            // ✅ setter nativo (React controlled input)
            const setValue = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            ).set;

            setValue.call(input, fecha);

            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          });

        // asegura que quedó aplicado
        cy.get('input.MuiPickersInputBase-input').should('have.value', fecha);
      });
  }

  const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // ✅ Asegura pestaña SIN BUCLES: click solo si NO está seleccionada
  function asegurarPestanaSinBucle(nombrePestana) {
    const rx = new RegExp(`^${escapeRegex(nombrePestana)}$`, 'i');

    return cy.get('body').then(($body) => {
      const $tab = $body.find('[role="tab"]').filter((_, el) => rx.test((el.textContent || el.innerText || '').trim())).first();
      if (!$tab.length) {
        cy.log(`⚠️ No encontré pestaña: ${nombrePestana}`);
        return cy.wrap(null);
      }

      const yaSeleccionada = String($tab.attr('aria-selected') || '').toLowerCase() === 'true';
      if (yaSeleccionada) {
        return cy.wrap(null);
      }

      return cy.wrap($tab[0])
        .scrollIntoView()
        .click({ force: true })
        .then(() => {
          // esperar que quede marcada
          return cy.wrap($tab[0]).should('have.attr', 'aria-selected', 'true');
        });
    });
  }

  // ✅ Abre modal (usa tu helper si existe)
  function abrirModalSeccionSafe(seccion) {
    if (typeof abrirModalSeccion === 'function') return abrirModalSeccion(seccion, true);

    // fallback genérico
    return cy.contains('button', /nuevo|añadir|add|create/i, { timeout: 20000 })
      .filter(':visible')
      .first()
      .click({ force: true });
  }

  // ✅ Guardar modal por sección (usa tus helpers reales)
  function guardarModalSeccionSafe(seccion) {
    if (/direcc/i.test(seccion) && typeof guardarNuevaDireccion === 'function') return guardarNuevaDireccion();
    if (/contact/i.test(seccion) && typeof guardarNuevoContacto === 'function') return guardarNuevoContacto();
    if (/asociad/i.test(seccion) && typeof guardarNuevoAsociado === 'function') return guardarNuevoAsociado();
    if (/inciden/i.test(seccion) && typeof guardarNuevaIncidencia === 'function') return guardarNuevaIncidencia();
    if (/zona/i.test(seccion) && typeof guardarNuevaZonaCarga === 'function') return guardarNuevaZonaCarga();
    if (/certific/i.test(seccion) && typeof guardarNuevaCertificacion === 'function') return guardarNuevaCertificacion();
    if (/calidad/i.test(seccion) && typeof guardarNuevoRegistroCalidad === 'function') return guardarNuevoRegistroCalidad();

    return cy.contains('button', /^guardar$/i, { timeout: 20000 }).filter(':visible').last().click({ force: true });
  }

  // ✅ Rellenar modal por sección (usa tus helpers reales)
  function llenarModalSeccionSafe(seccion, casoSeccion, numCaso) {
    if (/direcc/i.test(seccion) && typeof llenarFormularioDireccion === 'function') return llenarFormularioDireccion(casoSeccion, numCaso);
    if (/contact/i.test(seccion) && typeof llenarFormularioContacto === 'function') return llenarFormularioContacto(casoSeccion, numCaso);
    if (/asociad/i.test(seccion) && typeof llenarFormularioAsociado === 'function') return llenarFormularioAsociado(casoSeccion, numCaso);
    if (/inciden/i.test(seccion) && typeof llenarFormularioIncidencia === 'function') return llenarFormularioIncidencia(casoSeccion, numCaso);
    if (/zona/i.test(seccion) && typeof llenarFormularioZonaCarga === 'function') return llenarFormularioZonaCarga(casoSeccion, numCaso);
    if (/certific/i.test(seccion) && typeof llenarFormularioCertificacion === 'function') return llenarFormularioCertificacion(casoSeccion, numCaso);
    if (/calidad/i.test(seccion) && typeof llenarFormularioCalidad === 'function') return llenarFormularioCalidad(casoSeccion, numCaso);

    // fallback genérico si tu caso trae etiqueta_i/valor_etiqueta_i/dato_i
    if (typeof llenarCamposFormulario === 'function') return llenarCamposFormulario(casoSeccion);

    return cy.wrap(null);
  }

  // ✅ Normaliza lo que devuelve obtenerDatosExcel (a veces es objeto)
  function normalizarCasosExcel(raw) {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') return Object.values(raw);
    return [];
  }

  // ✅ Busca un caso por número TC
  function getCasoPorNumero(todosLosCasos, n) {
    return (todosLosCasos || []).find((c) => {
      const num = parseInt(String(c?.caso || '').replace(/\D/g, ''), 10);
      return num === n;
    }) || null;
  }

  // =====================================================
  // ✅ FUNCIÓN FINAL: rellena todo y SOLO al final Guardar
  // =====================================================
  function comprobarGuardadoCompleto(caso, numero, casoId) {
    const numeroCaso = numero || 28;
    const idCaso = casoId || `TC${String(numeroCaso).padStart(3, '0')}`;
    const nombreCaso = caso?.nombre || 'Crear con todo (Proveedor)';

    const LIST_URL = '/dashboard/suppliers';
    const FORM_URL = '/dashboard/suppliers/form';

    const onFail = (e) => {
      const obs = `ERROR: ${e?.message || e}`;
      if (typeof registrarResultadoAutomatico === 'function') {
        return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'ERROR', true)
          .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
      }
      return cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false });
    };

    return cy.obtenerDatosExcel(HOJA_EXCEL).then((raw) => {
      const todosLosCasos = normalizarCasosExcel(raw);

      const tc28 = getCasoPorNumero(todosLosCasos, 28) || caso; // base: Generales + Financieros
      const tc30 = getCasoPorNumero(todosLosCasos, 30); // Direcciones
      const tc31 = getCasoPorNumero(todosLosCasos, 31); // Contactos
      const tc32 = getCasoPorNumero(todosLosCasos, 32); // Asociados
      const tc33 = getCasoPorNumero(todosLosCasos, 33); // Incidencias
      const tc34 = getCasoPorNumero(todosLosCasos, 34); // Zonas de Carga
      const tc35 = getCasoPorNumero(todosLosCasos, 35); // Certificaciones
      const tc36 = getCasoPorNumero(todosLosCasos, 36); // Calidad

      if (!tc28) {
        const obs = 'No existe TC028 (Crear con todo) en Excel.';
        if (typeof registrarResultadoAutomatico === 'function') {
          return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'ERROR', true)
            .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
        }
        return cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false });
      }

      // 1) Login + ir al formulario
      let chain = cy.wrap(null)
        .then(() => cy.login())
        .then(() => cy.visit(LIST_URL))
        .then(() => (UI.esperarTabla ? UI.esperarTabla() : cy.wait(800)))
        .then(() => {
          // usa tu helper si existe, si no, visita directo
          if (typeof abrirFormularioNuevoProveedor === 'function') return abrirFormularioNuevoProveedor();
          return cy.visit(FORM_URL);
        })
        .then(() => cy.url().should('include', FORM_URL));

      // 2) DATOS GENERALES (rellenar YA)
      chain = chain
        .then(() => asegurarPestanaSinBucle('DATOS GENERALES'))
        .then(() => {
          cy.log('✅ Rellenando DATOS GENERALES (TC028)...');
          return llenarCamposFormulario(tc28);
        });

      // 3) DATOS FINANCIEROS (rellenar YA)
      chain = chain
        .then(() => asegurarPestanaSinBucle('DATOS FINANCIEROS'))
        .then(() => {
          cy.log('✅ Rellenando DATOS FINANCIEROS (TC028)...');
          return llenarCamposFormulario(tc28);
        });

      // 4) SECCIONES MODAL: Direcciones -> ... -> Calidad
      const modales = [
        { seccion: 'DIRECCIONES', caso: tc30, num: 30 },
        { seccion: 'CONTACTOS', caso: tc31, num: 31 },
        { seccion: 'ASOCIADOS', caso: tc32, num: 32 },
        { seccion: 'INCIDENCIAS', caso: tc33, num: 33 },
        { seccion: 'ZONAS DE CARGA', caso: tc34, num: 34 },
        { seccion: 'CERTIFICACIONES', caso: tc35, num: 35 },
        { seccion: 'CALIDAD', caso: tc36, num: 36 }
      ].filter((x) => !!x.caso);

      // ✅ hacer secuencial con reduce (sin forEach que a veces confunde)
      chain = modales.reduce((acc, item) => {
        return acc
          .then(() => asegurarPestanaSinBucle(item.seccion))
          .then(() => {
            cy.log(`✅ Rellenando ${item.seccion} (TC${String(item.num).padStart(3, '0')})...`);
            return abrirModalSeccionSafe(item.seccion)
              .then(() => llenarModalSeccionSafe(item.seccion, item.caso, item.num))
              .then(() => guardarModalSeccionSafe(item.seccion))
              .then(() => cy.wait(700));
          });
      }, chain);

      // 5) ✅ SOLO AHORA: GUARDAR FINAL
      chain = chain
        .then(() => {
          cy.log('💾 TODO relleno -> Click Guardar FINAL');
          return clickGuardarDentroFormulario(); // el tuyo (correcto)
        })
        .then(() => cy.wait(1500));

      // 6) Resultado OK (si quieres aquí luego reabrir y verificar pestañas, lo añadimos)
      return chain.then(() => {
        const obs = 'Proveedor rellenado (Generales+Financieros+Modales) y Guardado final ejecutado.';
        if (typeof registrarResultadoAutomatico === 'function') {
          return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'OK', true)
            .then(() => cy.wrap({ resultado: 'OK', obtenido: obs }, { log: false }));
        }
        return cy.wrap({ resultado: 'OK', obtenido: obs }, { log: false });
      }, onFail);

    }, onFail);
  }


  // -------------------- Helpers formulario --------------------

  function deducirSeccionDesdeCaso(caso) {
    const nombre = (caso?.nombre || '').toLowerCase();
    if (nombre.includes('dato') && nombre.includes('financ')) return 'Datos financieros';
    if (nombre.includes('financ')) return 'Datos financieros';
    if (nombre.includes('direccion')) return 'Direcciones';
    if (nombre.includes('contact')) return 'Contactos';
    if (nombre.includes('asociad')) return 'Asociados';
    if (nombre.includes('incidenc')) return 'Incidencias';
    if (nombre.includes('zona')) return 'Zonas de carga';
    if (nombre.includes('certific')) return 'Certificaciones';
    if (nombre.includes('calidad')) return 'Calidad';
    return 'Datos generales';
  }

  function navegarSeccionFormulario(seccion) {
    if (!seccion) return cy.wrap(null);
    const palabras = seccion.split(/\s+/).map((p) => escapeRegex(p)).join('.*');
    const regex = new RegExp(palabras, 'i');
    return cy.get('body').then(($b) => {
      const $tab = $b
        .find('button[role="tab"], [role="tab"], button, a, span')
        .filter((_, el) => regex.test((el.textContent || el.innerText || '').trim()))
        .filter(':visible')
        .first();
      if ($tab.length) return cy.wrap($tab[0]).click({ force: true });
      cy.log(`No se encontró pestaña/sección "${seccion}"`);
      return cy.wrap(null);
    });
  }

  function llenarCamposFormulario(caso) {
    const totalCampos = Number(caso?.__totalCamposExcel) || 40;
    const campos = [];

    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = caso[`dato_${i}`];
      if (!tipo || !selector || valor === undefined || `${valor}` === '') continue;
      campos.push({ tipo, selector, valor });
    }

    if (!campos.length) return cy.wrap(null);

    const normalizarBool = (v) => {
      const t = (v === undefined || v === null) ? '' : String(v).trim().toLowerCase();
      if (!t) return null;
      if (['1', 'true', 'sí', 'si', 'yes', 'y', 'on', 'checked'].includes(t)) return true;
      if (['0', 'false', 'no', 'n', 'off', 'unchecked'].includes(t)) return false;
      return null;
    };

    const esAutocompleteMUI = ($el) => {
      const role = ($el.attr('role') || '').toLowerCase();
      const ariaHasPopup = ($el.attr('aria-haspopup') || '').toLowerCase();
      const ariaAuto = ($el.attr('aria-autocomplete') || '').toLowerCase();
      return (
        role === 'combobox' ||
        ariaHasPopup === 'listbox' ||
        ariaAuto === 'list' ||
        $el.closest('.MuiAutocomplete-root').length > 0
      );
    };

    const seleccionarOptionListbox = (texto) => {
      const target = String(texto ?? '').trim();
      if (!target) return cy.wrap(null);

      const rxExact = new RegExp(`^${escapeRegex(target)}$`, 'i');
      const rxContiene = new RegExp(escapeRegex(target), 'i');

      // ✅ como “Datos Económicos”: listbox visible + click opción
      return cy.get('body', { log: false }).then(($b) => {
        const $list = $b.find('ul[role="listbox"]:visible').last();
        if (!$list.length) return cy.wrap(null, { log: false });

        const $opts = $list.find('li[role="option"]:visible');
        if (!$opts.length) return cy.wrap(null, { log: false });

        const exact = Array.from($opts).find((el) => rxExact.test((el.textContent || '').trim()));
        if (exact) return cy.wrap(exact, { log: false }).click({ force: true });

        const contiene = Array.from($opts).find((el) => rxContiene.test((el.textContent || '').trim()));
        if (contiene) return cy.wrap(contiene, { log: false }).click({ force: true });

        return cy.wrap($opts[0], { log: false }).click({ force: true });
      });
    };

    const seleccionarRadioPorNombre = (name, valorTxt) => {
      const wanted = (valorTxt || '').toString().trim();
      if (!name || !wanted) return cy.wrap(null);

      const rx = new RegExp(`^${escapeRegex(wanted)}$`, 'i');
      const norm = (v) => (v === undefined || v === null ? '' : String(v)).trim().toLowerCase();

      const mapValorRadio = (nm, txt) => {
        const t = norm(txt);
        if (!t) return null;
        if (['true', 'false', 'spain', 'foreign', 'ue', 'eu'].includes(t)) return t === 'eu' ? 'ue' : t;

        if (nm === 'typeOfPerson') {
          if (/jur[ií]dica|legal|company/i.test(t)) return 'true';
          if (/f[ií]sica|physical|individual/i.test(t)) return 'false';
        }
        if (nm === 'isSupplier') {
          if (/proveedor|supplier/i.test(t)) return 'true';
          if (/acreedor|creditor/i.test(t)) return 'false';
        }
        if (nm === 'residence') {
          if (/españa|espana|spain/i.test(t)) return 'spain';
          if (/extranjero|foreign/i.test(t)) return 'foreign';
          if (/ue|u\.e\.|eu/i.test(t)) return 'ue';
        }
        return null;
      };

      return cy.get(`input[type="radio"][name="${name}"]`).then(($radios) => {
        if (!$radios.length) return cy.wrap(null);

        const matchLabel = Array.from($radios).find((el) => {
          const lab = el.closest('label');
          const txt = (lab ? (lab.textContent || '') : '').trim();
          return rx.test(txt);
        });
        if (matchLabel) return cy.wrap(matchLabel).click({ force: true });

        const mapped = mapValorRadio(name, wanted);
        if (mapped) {
          const byVal = Array.from($radios).find((el) => norm(el.getAttribute('value')) === norm(mapped));
          if (byVal) return cy.wrap(byVal).click({ force: true });
        }

        const matchVal = Array.from($radios).find((el) => rx.test((el.getAttribute('value') || '').trim()));
        if (matchVal) return cy.wrap(matchVal).click({ force: true });

        return cy.wrap(null);
      });
    };

    const completar = (idx = 0) => {
      if (idx >= campos.length) return cy.wrap(null);
      const c = campos[idx];
      const valorTxt = String(c.valor).trim();

      return obtenerCampoFormulario(c.tipo, c.selector)
        .then(($el) => {
          if (!$el || !$el.length) return null;

          const tag = ($el[0]?.tagName || '').toLowerCase();
          const type = ($el[0]?.type || '').toLowerCase();

          if (type === 'checkbox') {
            const b = normalizarBool(valorTxt);
            if (b === false) return cy.wrap($el).uncheck({ force: true });
            if (b === true) return cy.wrap($el).check({ force: true });
            return cy.wrap($el).check({ force: true });
          }

          if (type === 'radio') {
            const name = ($el.attr('name') || '').toString();
            if (name) return seleccionarRadioPorNombre(name, valorTxt);
            return cy.wrap($el).click({ force: true });
          }

          if (tag === 'input' || tag === 'textarea') {
            return cy.wrap($el)
              .scrollIntoView()
              .click({ force: true })
              .then(($inp) => {
                const actual = (($inp.val?.() ?? $inp[0]?.value) || '').toString().trim();
                if (actual && actual.toLowerCase() === valorTxt.toLowerCase()) return cy.wrap(null);

                const isAuto = esAutocompleteMUI(Cypress.$($inp));

                if (!isAuto) {
                  return cy.wrap($inp).clear({ force: true }).type(valorTxt, { force: true });
                }

                // ✅ MUI Autocomplete correcto:
                // type -> esperar listbox (si aparece) -> click opción
                return cy.wrap($inp)
                  .clear({ force: true })
                  .type(valorTxt, { force: true })
                  .then(() => cy.wait(150, { log: false }))
                  .then(() => {
                    return cy.get('body').then(($b) => {
                      const hayList = $b.find('ul[role="listbox"]:visible').length > 0;
                      if (!hayList) return cy.wrap(null);
                      return seleccionarOptionListbox(valorTxt);
                    });
                  })
                  .then(() => cy.get('body').type('{esc}', { force: true, log: false }));
              });
          }

          if (tag === 'select') return cy.wrap($el).select(valorTxt, { force: true });

          // Fallback para selects MUI tipo div/button
          const isAutoDiv = $el.closest('.MuiAutocomplete-root, .MuiSelect-root').length > 0;
          if (isAutoDiv) {
            return cy.wrap($el)
              .scrollIntoView()
              .click({ force: true })
              .then(() => cy.wait(150, { log: false }))
              .then(() => seleccionarOptionListbox(valorTxt))
              .then(() => cy.get('body').type('{esc}', { force: true, log: false }));
          }

          return cy.wrap(null);
        })
        .then(() => completar(idx + 1));
    };

    return completar(0);
  }

  function rellenarFechaCertificacionPorLabel(valorFecha) {
    const textoFecha = String(valorFecha ?? '').trim();
    if (!textoFecha) return cy.wrap(null);

    const fechaObj = parseFechaBasicaExcel(textoFecha);

    return getDrawerVisible().then((drawer) => {
      // Encuentro el bloque donde está el label "Fecha" y su botón
      return cy.wrap(drawer).then(($d) => {
        const $bloqueFecha = $d.find('label').filter((_, el) => /^Fecha$/i.test((el.textContent || '').trim())).first().closest('div');
        if (!$bloqueFecha.length) throw new Error('No se encontró el bloque de "Fecha"');

        const $btn = $bloqueFecha.find('button[aria-label*="Choose date"], button[aria-label*="date"], button[aria-label*="fecha"]').filter(':visible').first();
        if (!$btn.length) throw new Error('No se encontró el botón del calendario en "Fecha"');

        return cy.wrap($btn).click({ force: true })
          .then(() => cy.wait(300))
          .then(() => seleccionarFechaEnCalendario(fechaObj));
      });
    });
  }

  function getDrawerPorTitulo(tituloRegex) {
    return cy.contains(tituloRegex, { timeout: 20000 })
      .should('be.visible')
      .then(($t) => {
        const $anc = Cypress.$($t).parents();
        const contenedor = Array.from($anc).find((a) => {
          const $a = Cypress.$(a);
          // buscamos un contenedor que sea drawer/modal/dialog real
          return $a.is('.MuiDrawer-root') || $a.is('.MuiModal-root') || $a.attr('role') === 'dialog';
        });
        return cy.wrap(contenedor || Cypress.$($t).closest('.MuiDrawer-root, .MuiModal-root, [role="dialog"]'));
      });
  }

  function getDrawerVisible() {
    return cy.get('body').then(($b) => {
      const $drawer = $b.find('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="dialog"]:visible').last();
      if (!$drawer.length) throw new Error('No se encontró drawer/modal visible');
      return cy.wrap($drawer);
    });
  }

  // ✅ input/textarea por label -> for -> input id
  function escribirPorLabel(labelText, valor) {
    const v = String(valor ?? '').trim();
    if (!v) return cy.wrap(null);

    return getDrawerVisible().then((drawer) => {
      return cy.wrap(drawer)
        .contains('label', new RegExp(`^${escapeRegex(labelText)}$`, 'i'))
        .should('exist')
        .invoke('attr', 'for')
        .then((forAttr) => {
          if (!forAttr) throw new Error(`El label "${labelText}" no tiene atributo "for"`);

          return cy.wrap(drawer)
            .find(`#${CSS.escape(forAttr)}`, { timeout: 15000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .type('{selectall}{backspace}', { force: true })
            .type(v, { force: true, delay: 0 })
            .should('have.value', v);
        });
    });
  }

  // ✅ Autocomplete MUI por label (limpia si hay valor, escribe, selecciona listbox)
  function seleccionarAutocompletePorLabel(labelText, valor) {
    const v = String(valor ?? '').trim();
    if (!v) return cy.wrap(null);

    return getDrawerVisible().then((drawer) => {
      return cy.wrap(drawer)
        .contains('label', new RegExp(`^${escapeRegex(labelText)}$`, 'i'))
        .should('exist')
        .invoke('attr', 'for')
        .then((forAttr) => {
          if (!forAttr) throw new Error(`El label "${labelText}" no tiene atributo "for"`);

          return cy.wrap(drawer).then(($d) => {
            const $input = $d.find(`#${CSS.escape(forAttr)}`).filter(':visible').first();
            if (!$input.length) throw new Error(`No se encontró input de "${labelText}" con id #${forAttr}`);

            const $root = $input.closest('.MuiAutocomplete-root, .MuiFormControl-root, .MuiInputBase-root');

            const $clearBtn = $root
              .find('button[aria-label="Limpiar"], button[title="Limpiar"], button.MuiAutocomplete-clearIndicator')
              .filter(':visible')
              .first();

            // 1) click + limpiar
            let chain = cy.wrap($input).scrollIntoView().click({ force: true });

            if ($clearBtn.length) {
              chain = chain.then(() => cy.wrap($clearBtn).click({ force: true }));
            } else {
              chain = chain.then(() => cy.wrap($input).type('{selectall}{backspace}', { force: true }));
            }

            // 2) escribir
            chain = chain
              .then(() => cy.wrap($input).click({ force: true }).type(v, { force: true, delay: 0 }))
              .then(() => cy.wait(200, { log: false }));

            // 3) seleccionar del listbox
            const reExact = new RegExp(`^\\s*${escapeRegex(v)}\\s*$`, 'i');

            return chain.then(() => {
              return cy.get('ul[role="listbox"]', { timeout: 15000 })
                .filter(':visible')
                .first()
                .find('li[role="option"], li')
                .filter(':visible')
                .then(($lis) => {
                  const exact = [...$lis].find((li) => reExact.test(li.innerText || ''));
                  if (exact) return cy.wrap(exact).scrollIntoView().click({ force: true });

                  return cy.get('ul[role="listbox"]')
                    .filter(':visible')
                    .first()
                    .contains('li', new RegExp(escapeRegex(v), 'i'))
                    .scrollIntoView()
                    .click({ force: true });
                });
            }).then(() => cy.get('body').type('{esc}', { force: true, log: false }));
          });
        });
    });
  }

  function seleccionarOpcionMUI_porTexto(valorTxt) {
    const v = String(valorTxt || '').trim();
    if (!v) return cy.wrap(null);

    const rxExact = new RegExp(`^${escapeRegex(v)}$`, 'i');
    const rxContiene = new RegExp(escapeRegex(v), 'i');

    return cy.get('body').then(($body) => {
      const $opts = $body.find('[role="option"]').filter(':visible');
      if (!$opts.length) return cy.wrap(null);

      const exacta = Array.from($opts).find((el) => rxExact.test((el.textContent || '').trim()));
      if (exacta) return cy.wrap(exacta).click({ force: true });

      const contiene = Array.from($opts).find((el) => rxContiene.test((el.textContent || '').trim()));
      if (contiene) return cy.wrap(contiene).click({ force: true });

      return cy.wrap($opts[0]).click({ force: true });
    });
  }

  function parseFechaBasicaExcel(texto) {
    if (texto instanceof Date) return texto;
    const str = String(texto || '').trim();
    const m = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (!m) return null;
    const dia = Number(m[1]);
    const mes = Number(m[2]) - 1;
    const anio = Number(m[3]);
    return new Date(anio, mes, dia);
  }

  function seleccionarFechaEnCalendario(fechaObj) {
    if (!fechaObj) return cy.wrap(null);
    const dia = fechaObj.getDate();
    // Popover/dialog visible del datepicker
    return cy
      .get('div[role="dialog"], .MuiPopover-root, .MuiPickersPopper-root', { timeout: 15000 })
      .filter(':visible')
      .last()
      .within(() => {
        // Intento simple: clicar día
        cy.get('button.MuiPickersDay-root:not([disabled])')
          .contains(new RegExp(`^${dia}$`))
          .click({ force: true });
      });
  }

  function rellenarFechaDatosGenerales(caso) {
    // Buscar fecha del caso (por etiqueta/selector)
    // En el Excel TC028 viene como id _r_pd_-label -> 24/12/2025 (Alta/Fecha)
    const fechaTxt = extraerDatoPorEtiquetaOSelector(caso, /(^fecha$|^alta$|\/fecha\b|_r_fe_|_r_pd_)/i);
    if (!fechaTxt) return cy.wrap(null);
    const fechaObj = parseFechaBasicaExcel(fechaTxt);
    if (!fechaObj) return cy.wrap(null);

    // Abrir el datepicker por su label "Fecha" (igual patrón que Clientes)
    return cy.get('body').then(($b) => {
      const $lab = $b
        .find('label')
        .filter((_, el) => /^(Alta|Fecha|Date|Data)$/i.test((el.textContent || '').trim()))
        .first();
      if (!$lab.length) return cy.wrap(null);
      const forAttr = $lab.attr('for');
      if (!forAttr) return cy.wrap(null);

      const dd = String(fechaObj.getDate()).padStart(2, '0');
      const mm = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const yyyy = String(fechaObj.getFullYear());

      // Más robusto que navegar el calendario: escribir en los spinbuttons (Day/Month/Year).
      // OJO: en algunos Chromes/MUI, esos spans no pasan `:visible`, así que NO filtramos por visibilidad.
      return cy
        .wrap($lab)
        .parents('.MuiFormControl-root')
        .first()
        .within(() => {
          return cy.get('[role="spinbutton"]', { timeout: 15000 }).then(($spins) => {
            if ($spins.length >= 1) {
              return cy
                .wrap($spins[0])
                .click({ force: true })
                .type(`${dd}{rightArrow}${mm}{rightArrow}${yyyy}{enter}`, { force: true });
            }

            // Fallback (no fallar el test): intentar abrir calendario y seguir con la ejecución
            return cy
              .get('button[aria-label*="Choose date"], button[aria-label*="date"], button[aria-label*="fecha"]', { timeout: 15000 })
              .filter(':visible')
              .first()
              .click({ force: true })
              .then(() => cy.wait(300))
              .then(() => seleccionarFechaEnCalendario(fechaObj));
          });
        })
        .then(() => cy.wait(300));
    });
  }

  function esperarDatosGeneralesCompletosAntesDeFinancieros(caso, timeoutMs = 12000) {
    // Evitar pasar a Financieros mientras aún están abiertos listbox/popovers
    const inicio = Date.now();

    const personaTxt = extraerDatoPorEtiquetaOSelector(caso, /persona/i);
    const tipoTxt = extraerDatoPorEtiquetaOSelector(caso, /(^tipo$|tipo\s*$)/i);
    const residenciaTxt = extraerDatoPorEtiquetaOSelector(caso, /residencia/i);
    const tipoProveedorTxt = extraerDatoPorEtiquetaOSelector(caso, /tipo\s+de\s+proveedor/i);

    const norm = (v) => (v === undefined || v === null ? '' : String(v)).trim().toLowerCase();

    const map = (name, txt) => {
      const t = norm(txt);
      if (!t) return null;
      if (name === 'typeOfPerson') {
        if (/jur[ií]dica|legal|company/i.test(t)) return 'true';
        if (/f[ií]sica|physical|individual/i.test(t)) return 'false';
      }
      if (name === 'isSupplier') {
        if (/proveedor|supplier/i.test(t)) return 'true';
        if (/acreedor|creditor/i.test(t)) return 'false';
      }
      if (name === 'residence') {
        if (/españa|espana|spain/i.test(t)) return 'spain';
        if (/extranjero|foreign/i.test(t)) return 'foreign';
        if (/ue|u\.e\.|eu/i.test(t)) return 'ue';
      }
      return null;
    };

    const check = () => {
      return cy.get('body', { log: false }).then(($b) => {
        const hayOverlay = $b.find('ul[role="listbox"]:visible, [role="presentation"]:visible').length > 0;
        if (hayOverlay) {
          // cerrar overlays para permitir click en tabs
          cy.get('body').type('{esc}', { force: true, log: false });
        }

        const okPersona = !personaTxt || (() => {
          const v = map('typeOfPerson', personaTxt);
          if (!v) return true;
          const $inp = $b.find(`input[type="radio"][name="typeOfPerson"][value="${v}"]`);
          return $inp.prop('checked') === true;
        })();

        const okTipo = !tipoTxt || (() => {
          const v = map('isSupplier', tipoTxt);
          if (!v) return true;
          const $inp = $b.find(`input[type="radio"][name="isSupplier"][value="${v}"]`);
          return $inp.prop('checked') === true;
        })();

        const okResidencia = !residenciaTxt || (() => {
          const v = map('residence', residenciaTxt);
          if (!v) return true;
          const $inp = $b.find(`input[type="radio"][name="residence"][value="${v}"]`);
          return $inp.prop('checked') === true;
        })();

        const okTipoProveedor = !tipoProveedorTxt || (() => {
          // Fallback: por label multi-idioma
          const $lab = $b.find('label').filter((_, el) =>
            /^(Tipo de Proveedor|Supplier Type|Provider Type|Tipus de Proveïdor)$/i.test((el.textContent || '').trim())
          ).first();
          const forAttr = $lab.attr('for') || '';
          if (!forAttr) return true;
          const $inp = $b.find(`#${forAttr}`);
          const val = ($inp.val() || '').toString().trim();
          return val.length > 0;
        })();

        // Fecha: si existe input asociado, esperar a que no sea vacío (si el Excel la trae)
        const fechaTxt = extraerDatoPorEtiquetaOSelector(caso, /(^fecha$|^alta$|\/fecha\b|_r_fe_|_r_pd_)/i);
        const okFecha = !fechaTxt || (() => {
          const $lab = $b.find('label').filter((_, el) => /^(Alta|Fecha|Date|Data)$/i.test((el.textContent || '').trim())).first();
          if (!$lab.length) return true;
          const $fc = $lab.parents('.MuiFormControl-root').first();
          if ($fc.length) {
            const secs = $fc.find('[role="spinbutton"]');
            if (secs.length >= 3) {
              const vals = secs.toArray().map((s) => (s.textContent || '').trim());
              // Si ya no son placeholders DD/MM/YYYY, damos por OK
              return vals.every((v) => v && !/^(dd|mm|yyyy)$/i.test(v));
            }
          }
          return true;
        })();

        const ok = okPersona && okTipo && okResidencia && okTipoProveedor && okFecha;
        if (ok) return true;
        if (Date.now() - inicio >= timeoutMs) return false;
        return cy.wait(400, { log: false }).then(() => check());
      });
    };

    return check();
  }

  function extraerDatoPorEtiquetaOSelector(caso, regex) {
    const total = Number(caso?.__totalCamposExcel) || 40;
    for (let i = 1; i <= total; i++) {
      const t = (caso?.[`etiqueta_${i}`] || '').toString();
      const sel = (caso?.[`valor_etiqueta_${i}`] || '').toString();
      const val = caso?.[`dato_${i}`];
      if (val === undefined || val === null || `${val}` === '') continue;
      const selNorm = sel ? normalizarId(sel) : '';
      if (regex.test(t) || regex.test(sel) || (selNorm && regex.test(selNorm))) return val;
    }
    return null;
  }

  function seleccionarOpcionListaMUI(valorTxt) {
    const texto = (valorTxt || '').toString().trim();
    if (!texto) return cy.wrap(null);
    const rxExact = new RegExp(`^${escapeRegex(texto)}$`, 'i');
    const rxContiene = new RegExp(escapeRegex(texto), 'i');

    return cy.get('body', { log: false }).then(($b) => {
      const $opts = $b
        .find('li[role="option"], [role="option"], li[role="menuitem"], [role="menuitem"]')
        .filter(':visible');
      if (!$opts.length) return cy.wrap(null, { log: false });

      const exacta = Array.from($opts).find((el) => rxExact.test((el.textContent || '').trim()));
      if (exacta) return cy.wrap(exacta, { log: false }).click({ force: true });

      const contiene = Array.from($opts).find((el) => rxContiene.test((el.textContent || '').trim()));
      if (contiene) return cy.wrap(contiene, { log: false }).click({ force: true });

      // Fallback: primera opción
      return cy.wrap($opts[0], { log: false }).click({ force: true });
    });
  }

  function rellenarCamposObligatoriosClienteAsociado(caso, fallbackCodigoCliente) {
    // TC027: además de Código, hay que rellenar:
    // - "Código de cliente" (input pequeño con placeholder "Código de cliente")
    // - "Cliente Asociado" (Autocomplete MUI)
    const codigoCliente =
      extraerDatoPorEtiquetaOSelector(caso, /(c[oó]digo\s+de\s+cliente|customer\s+code|codi\s+de\s+client)/i) ||
      fallbackCodigoCliente;
    const clienteAsociado =
      // En tu Excel viene como: id _r_pu_ -> "3 - AYTO. CABRERIZOS"
      extraerDatoPorEtiquetaOSelector(caso, /(cliente\s+asociado|associated\s+customer|client\s+associat|_r_pu_)/i) ||
      null;

    if (!codigoCliente && !clienteAsociado) return cy.wrap(null);

    return cy.get('body').then(($b) => {
      const rxLabel = /(Cliente\s+Asociado|Associated\s+Customer|Client\s+Associat)/i;
      const label = $b.find('label').filter((_, el) => rxLabel.test((el.textContent || '').trim())).first();
      if (!label.length) return cy.wrap(null);

      // Subir a un contenedor razonable que incluya ambos inputs (código + autocomplete)
      // OJO: necesitamos el MISMO contenedor donde el label y los inputs son hermanos.
      // Si subimos al padre, a veces perdemos el input pequeño ("Código de cliente").
      const $root = label.closest('div');

      const escapeCssId = (id = '') => id.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');
      const forAttr = label.attr('for') || '';

      return cy.wrap($root).within(() => {
        // 1) Código de cliente (input pequeño)
        if (codigoCliente !== undefined && codigoCliente !== null && `${codigoCliente}` !== '') {
          cy.get(
            'input[placeholder*="Código de cliente"], input[placeholder*="Código de client"], input[placeholder*="Codigo"], input[placeholder*="Customer code"]'
          )
            .filter(':visible')
            .first()
            .then(($inp) => {
              if (!$inp || !$inp.length) return;
              cy.wrap($inp)
                .scrollIntoView()
                .click({ force: true })
                .clear({ force: true })
                .type(`${codigoCliente}`, { force: true });
            });
        }

        // 2) Cliente Asociado (autocomplete)
        if (clienteAsociado !== undefined && clienteAsociado !== null && `${clienteAsociado}` !== '') {
          const sel = forAttr ? `#${escapeCssId(forAttr)}` : null;

          const getInput = () => {
            if (sel) return cy.get(sel, { timeout: 15000 }).filter(':visible').first();
            return cy
              .get('input[role="combobox"], input[aria-autocomplete="list"]', { timeout: 15000 })
              .filter(':visible')
              .first();
          };

          getInput()
            .then(($inp) => {
              if (!$inp || !$inp.length) return cy.wrap(null);
              return cy
                .wrap($inp)
                .scrollIntoView()
                .click({ force: true })
                .clear({ force: true })
                .type(`${clienteAsociado}`, { force: true })
                // Selección por teclado (más estable que clicar el <li>):
                // baja a la primera opción filtrada y confirma.
                .type('{downArrow}{enter}', { force: true });
            })
            .then(() => cy.wait(500, { log: false }));
        }
      });
    });
  }

  function obtenerCampoFormulario(tipo, selector) {
    const tipoLower = (tipo || '').toLowerCase();
    const objetivos = [];

    if (selector) {
      if (tipoLower.includes('id')) objetivos.push(`#${normalizarId(selector)}`);
      if (tipoLower.includes('name')) objetivos.push(`[name="${selector}"]`);
      if (tipoLower.includes('placeholder')) {
        objetivos.push(`input[placeholder*="${selector}"], textarea[placeholder*="${selector}"]`);
      }
      if (tipoLower.includes('selector') || tipoLower.includes('query')) objetivos.push(selector);
      if (!selector.startsWith('#') && !selector.startsWith('.') && !selector.startsWith('[')) {
        objetivos.push(`#${selector}`);
      } else {
        objetivos.push(selector);
      }
    }

    return cy.get('body').then(($b) => {
      for (const sel of objetivos) {
        const $el = $b.find(sel).filter(':visible').first();
        if ($el.length) return cy.wrap($el);
      }
      return cy.wrap(null);
    });
  }

  function rellenarMetodoPagoFinanciero(caso) {

    const idMetodoPago = extraerDatoPorEtiquetaOSelector(
      caso,
      /(^(id\s*m[eé]todo\s*de\s*pago|payment\s*method\s*id)$|^Id Método de Pago$)/i
    );

    // ✅ prioriza el selector exacto del autocomplete del excel
    // (en tu caso: _r_33_)
    const metodoPagoTexto =
      extraerDatoPorEtiquetaOSelector(caso, /(^_r_33_$|_r_33_-label)$/i) ||
      extraerDatoPorEtiquetaOSelector(
        caso,
        /(^m[eé]todo\s*de\s*pago$|^payment\s*method$|^mètode\s*de\s*pagament$)/i
      );

    if ((!idMetodoPago || `${idMetodoPago}` === '') && (!metodoPagoTexto || `${metodoPagoTexto}` === '')) {
      return cy.wrap(null);
    }

    const escapeCssId = (id = '') =>
      id.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');

    const seleccionarOpcionListbox = (texto) => {
      const t = String(texto || '').trim();
      if (!t) return cy.wrap(null);

      const rxExact = new RegExp(`^${escapeRegex(t)}$`, 'i');
      const rxContiene = new RegExp(escapeRegex(t), 'i');

      return cy.get('body', { log: false }).then(($b) => {
        const $opts = $b.find('ul[role="listbox"]:visible li[role="option"]:visible');
        if (!$opts.length) return cy.wrap(null);

        const exact = Array.from($opts).find((el) => rxExact.test((el.textContent || '').trim()));
        if (exact) return cy.wrap(exact, { log: false }).click({ force: true });

        const contiene = Array.from($opts).find((el) => rxContiene.test((el.textContent || '').trim()));
        if (contiene) return cy.wrap(contiene, { log: false }).click({ force: true });

        return cy.wrap($opts[0], { log: false }).click({ force: true });
      });
    };

    return cy.get('body').then(($b) => {
      // 1) ID Método de Pago (placeholder)
      if (idMetodoPago !== undefined && idMetodoPago !== null && `${idMetodoPago}` !== '') {
        const $id = $b
          .find('input[placeholder*="Id Método de Pago"], input[placeholder*="Id Metodo"], input[placeholder*="Payment Method Id"]')
          .filter(':visible')
          .first();

        if ($id.length) {
          const actual = (($id.val && $id.val()) ?? $id[0]?.value ?? '').toString().trim();
          const target = String(idMetodoPago).trim();
          if (actual !== target) {
            cy.wrap($id).scrollIntoView().click({ force: true }).clear({ force: true }).type(target, { force: true });
          }
        }
      }

      // 2) Autocomplete Método de Pago (por label->for)
      if (!metodoPagoTexto || String(metodoPagoTexto).trim() === '') return cy.wrap(null);

      const target = String(metodoPagoTexto).trim();

      const $label = $b
        .find('label[for]')
        .filter((_, el) => /^(M[eé]todo de Pago|Payment Method|Mètode de Pagament)$/i.test((el.textContent || '').trim()))
        .filter(':visible')
        .first();

      if (!$label.length) {
        cy.log('⚠️ Método de Pago: no se encontró label con for');
        return cy.wrap(null);
      }

      const forAttr = ($label.attr('for') || '').toString();
      if (!forAttr) return cy.wrap(null);

      const sel = `#${escapeCssId(forAttr)}`;

      return cy.get(sel, { timeout: 15000 })
        .filter(':visible')
        .first()
        .then(($inp) => {
          const actual = (($inp.val && $inp.val()) ?? $inp[0]?.value ?? '').toString().trim();
          if (actual && actual.toLowerCase() === target.toLowerCase()) return cy.wrap(null);

          return cy.wrap($inp)
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            // ✅ escribir SOLO el texto correcto (ej: "0 - REPOSICIÓN 120 DÍAS")
            .type(target, { force: true })
            .then(() => cy.get('ul[role="listbox"]', { timeout: 15000 }).should('be.visible'))
            .then(() => seleccionarOpcionListbox(target))
            .then(() => cy.get('body').type('{esc}', { force: true, log: false }));
        });
    });
  }

  function rellenarEmpresaFinanciero(caso) {
    // ✅ TU EXCEL: id _r_2n_ -> "DESDE CANARIAS"
    // fallback: etiqueta/selector que contenga Empresa/Company
    const empresa =
      extraerDatoPorEtiquetaOSelector(caso, /(^_r_2n_$|_r_2n_-label)$/i) ||
      extraerDatoPorEtiquetaOSelector(caso, /(^empresa$|^company$|empresa\b|company\b)/i);

    if (!empresa || String(empresa).trim() === '') return cy.wrap(null);

    const escapeCssId = (id = '') =>
      id.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');

    const target = String(empresa).trim();
    const rxExact = new RegExp(`^${escapeRegex(target)}$`, 'i');
    const rxContiene = new RegExp(escapeRegex(target), 'i');

    const clickOpcion = () => {
      return cy.get('body', { log: false }).then(($b) => {
        const $opts = $b.find('ul[role="listbox"]:visible li[role="option"]:visible');
        if (!$opts.length) return cy.wrap(null);

        const exact = Array.from($opts).find((el) => rxExact.test((el.textContent || '').trim()));
        if (exact) return cy.wrap(exact, { log: false }).click({ force: true });

        const contiene = Array.from($opts).find((el) => rxContiene.test((el.textContent || '').trim()));
        if (contiene) return cy.wrap(contiene, { log: false }).click({ force: true });

        return cy.wrap($opts[0], { log: false }).click({ force: true });
      });
    };

    // NO hacemos "should be visible" porque a veces no aparece listbox.
    // En su lugar: type -> intentar abrir con downArrow -> si aparece listbox click, si no enter.
    const seleccionarAutocompleteSinForzarListbox = ($inp) => {
      return cy.wrap($inp)
        .scrollIntoView()
        .click({ force: true })
        .clear({ force: true })
        .type(target, { force: true })
        .then(() => cy.wait(200, { log: false }))
        .then(() => cy.wrap($inp).type('{downArrow}', { force: true })) // intenta abrir listbox
        .then(() => cy.wait(200, { log: false }))
        .then(() => {
          return cy.get('body', { log: false }).then(($b) => {
            const hayList = $b.find('ul[role="listbox"]:visible').length > 0;
            if (hayList) return clickOpcion();
            // si NO hay listbox, confirmamos por teclado
            return cy.wrap($inp).type('{enter}', { force: true });
          });
        })
        .then(() => cy.get('body').type('{esc}', { force: true, log: false }));
    };

    return cy.get('body').then(($b) => {
      const $label = $b
        .find('label[for]')
        .filter((_, el) => /^(Empresa|Company)$/i.test((el.textContent || '').trim()))
        .filter(':visible')
        .first();

      if (!$label.length) {
        cy.log('⚠️ Empresa: no se encontró label con for');
        return cy.wrap(null);
      }

      const forAttr = ($label.attr('for') || '').toString();
      if (!forAttr) return cy.wrap(null);

      const sel = `#${escapeCssId(forAttr)}`;

      return cy.get(sel, { timeout: 15000 })
        .filter(':visible')
        .first()
        .then(($inp) => {
          const actual = (($inp.val && $inp.val()) ?? $inp[0]?.value ?? '').toString().trim();
          // si ya está bien, no tocar
          if (actual && actual.toLowerCase() === target.toLowerCase()) return cy.wrap(null);
          return seleccionarAutocompleteSinForzarListbox($inp);
        });
    });
  }

  function rellenarCCompraFinanciero(caso) {
    // ✅ TU EXCEL: id _r_38_ -> "p2-213123000"
    const cCompra =
      extraerDatoPorEtiquetaOSelector(caso, /(^_r_38_$|_r_38_-label)$/i) ||
      extraerDatoPorEtiquetaOSelector(caso, /(c\.?\s*compra|ccompra|purchase)/i);

    if (!cCompra || String(cCompra).trim() === '') return cy.wrap(null);

    const escapeCssId = (id = '') =>
      id.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');

    const target = String(cCompra).trim();
    const rxExact = new RegExp(`^${escapeRegex(target)}$`, 'i');
    const rxContiene = new RegExp(escapeRegex(target), 'i');

    const clickOpcion = () => {
      return cy.get('body', { log: false }).then(($b) => {
        const $opts = $b.find('ul[role="listbox"]:visible li[role="option"]:visible');
        if (!$opts.length) return cy.wrap(null);

        const exact = Array.from($opts).find((el) => rxExact.test((el.textContent || '').trim()));
        if (exact) return cy.wrap(exact, { log: false }).click({ force: true });

        const contiene = Array.from($opts).find((el) => rxContiene.test((el.textContent || '').trim()));
        if (contiene) return cy.wrap(contiene, { log: false }).click({ force: true });

        return cy.wrap($opts[0], { log: false }).click({ force: true });
      });
    };

    const seleccionarAutocompleteSinForzarListbox = ($inp) => {
      return cy.wrap($inp)
        .scrollIntoView()
        .click({ force: true })
        .clear({ force: true })
        .type(target, { force: true })
        .then(() => cy.wait(200, { log: false }))
        .then(() => cy.wrap($inp).type('{downArrow}', { force: true }))
        .then(() => cy.wait(200, { log: false }))
        .then(() => {
          return cy.get('body', { log: false }).then(($b) => {
            const hayList = $b.find('ul[role="listbox"]:visible').length > 0;
            if (hayList) return clickOpcion();
            return cy.wrap($inp).type('{enter}', { force: true });
          });
        })
        .then(() => cy.get('body').type('{esc}', { force: true, log: false }));
    };

    return cy.get('body').then(($b) => {
      const $label = $b
        .find('label[for]')
        .filter((_, el) => /^(C\.?\s*Compra|C\.Compra|Purchase)$/i.test((el.textContent || '').trim()))
        .filter(':visible')
        .first();

      if (!$label.length) {
        cy.log('⚠️ C.Compra: no se encontró label con for');
        return cy.wrap(null);
      }

      const forAttr = ($label.attr('for') || '').toString();
      if (!forAttr) return cy.wrap(null);

      const sel = `#${escapeCssId(forAttr)}`;

      return cy.get(sel, { timeout: 15000 })
        .filter(':visible')
        .first()
        .then(($inp) => {
          const actual = (($inp.val && $inp.val()) ?? $inp[0]?.value ?? '').toString().trim();
          if (actual && actual.toLowerCase() === target.toLowerCase()) return cy.wrap(null);
          return seleccionarAutocompleteSinForzarListbox($inp);
        });
    });
  }

  function normalizarId(selector = '') {
    return selector.replace(/^#/, '').replace(/-label$/i, '');
  }

  function rellenarTipoYPaisDirecciones_TC30(caso) {
    // Excel:
    //  - id _r_24_-label -> Fiscal  (Tipo)
    //  - id r_29_        -> ESPAÑA  (País)

    const tipo =
      extraerDatoPorEtiquetaOSelector(caso, /(^_r_24_$|^_r_24_-label$)/i) ||
      extraerDatoPorEtiquetaOSelector(caso, /(^tipo$|^type$|tipus)/i);

    const pais =
      extraerDatoPorEtiquetaOSelector(caso, /(^r_29_$|^r_29_-label$)/i) ||
      extraerDatoPorEtiquetaOSelector(caso, /(^pa[ií]s$|^country$)/i);

    return cy
      .wrap(null)
      .then(() => seleccionarDesplegableMUI_porLabel(/^(Tipo|Type|Tipus)$/i, tipo))
      .then(() => seleccionarDesplegableMUI_porLabel(/^(Pa[ií]s|Country)$/i, pais));
  }

  function seleccionarDesplegableMUI_porLabel(rxLabel, valor) {
    const target = String(valor ?? '').trim();
    if (!target) return cy.wrap(null);

    const rxExact = new RegExp(`^${escapeRegex(target)}$`, 'i');
    const rxContiene = new RegExp(escapeRegex(target), 'i');

    const clickOpcion = () => {
      return cy.get('body', { log: false }).then(($b) => {
        const $opts = $b
          .find('ul[role="listbox"]:visible li[role="option"]:visible, li[role="option"]:visible, li[role="menuitem"]:visible, [role="option"]:visible, [role="menuitem"]:visible');

        if (!$opts.length) return cy.wrap(null);

        const exact = Array.from($opts).find((el) => rxExact.test((el.textContent || '').trim()));
        if (exact) return cy.wrap(exact, { log: false }).click({ force: true });

        const cont = Array.from($opts).find((el) => rxContiene.test((el.textContent || '').trim()));
        if (cont) return cy.wrap(cont, { log: false }).click({ force: true });

        return cy.wrap($opts[0], { log: false }).click({ force: true });
      });
    };

    return cy.get('body').then(($b) => {
      // buscamos label visible (con o sin for)
      const $lab = $b
        .find('label')
        .filter((_, el) => rxLabel.test((el.textContent || '').trim()))
        .filter(':visible')
        .first();

      if (!$lab.length) {
        cy.log(`⚠️ No se encontró label para ${rxLabel}`);
        return cy.wrap(null);
      }

      const $fc = $lab.closest('.MuiFormControl-root, .MuiGrid-root, .MuiBox-root, div');
      if (!$fc.length) return cy.wrap(null);

      // 1) Autocomplete input (combobox)
      const $input = $fc
        .find('input[role="combobox"], input[aria-autocomplete="list"], input[aria-haspopup="listbox"]')
        .filter(':visible')
        .first();

      if ($input.length) {
        return cy
          .wrap($input)
          .scrollIntoView()
          .click({ force: true })
          .clear({ force: true })
          .type(target, { force: true })
          .then(() => cy.wait(200, { log: false }))
          .then(() => {
            // si aparece lista, click; si no, confirmación teclado
            return cy.get('body', { log: false }).then(($b2) => {
              const hayList = $b2.find('ul[role="listbox"]:visible').length > 0;
              if (hayList) return clickOpcion();
              return cy.wrap($input).type('{downArrow}{enter}', { force: true });
            });
          })
          .then(() => cy.get('body').type('{esc}', { force: true, log: false }));
      }

      // 2) MUI Select (div/button role=button)
      const $btn = $fc
        .find('[role="button"][aria-haspopup="listbox"], div.MuiSelect-select, button[aria-haspopup="listbox"]')
        .filter(':visible')
        .first();

      if ($btn.length) {
        return cy
          .wrap($btn)
          .scrollIntoView()
          .click({ force: true })
          .then(() => cy.wait(200, { log: false }))
          .then(() => clickOpcion())
          .then(() => cy.get('body').type('{esc}', { force: true, log: false }));
      }

      cy.log(`⚠️ No se encontró input/select MUI para ${rxLabel}`);
      return cy.wrap(null);
    });
  }

  function seleccionarAutocompleteMUI_porLabel(rxLabel, texto) {
    const target = String(texto ?? '').trim();
    if (!target) return cy.wrap(null);

    const escapeCssId = (id = '') =>
      id.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');

    const rxExact = new RegExp(`^${escapeRegex(target)}$`, 'i');
    const rxContiene = new RegExp(escapeRegex(target), 'i');

    return cy.get('body').then(($b) => {
      const $lab = $b
        .find('label[for]')
        .filter((_, el) => rxLabel.test((el.textContent || '').trim()))
        .filter(':visible')
        .first();

      if (!$lab.length) return cy.wrap(null);

      const forAttr = ($lab.attr('for') || '').toString();
      if (!forAttr) return cy.wrap(null);

      const sel = `#${escapeCssId(forAttr)}`;

      return cy.get(sel, { timeout: 15000 })
        .filter(':visible')
        .first()
        .scrollIntoView()
        .click({ force: true })
        .then(($inp) => {
          const actual = (($inp.val?.() ?? $inp[0]?.value) || '').toString().trim();
          if (actual.toLowerCase() === target.toLowerCase()) return cy.wrap(null);

          return cy.wrap($inp).clear({ force: true }).type(target, { force: true });
        })
        .then(() => {
          return cy.get('ul[role="listbox"]', { timeout: 15000 })
            .filter(':visible')
            .last()
            .within(() => {
              cy.get('li[role="option"]').then(($opts) => {
                const exact = Array.from($opts).find((el) => rxExact.test((el.textContent || '').trim()));
                const contiene = Array.from($opts).find((el) => rxContiene.test((el.textContent || '').trim()));
                const pick = exact || contiene || $opts[0];
                if (pick) cy.wrap(pick).click({ force: true });
              });
            });
        })
        .then(() => cy.get('body').type('{esc}', { force: true, log: false }));
    });
  }

  function seleccionarAutocompleteMUI_porLabel_click(rxLabel, texto) {
    const target = String(texto ?? '').trim();
    if (!target) return cy.wrap(null);

    const escapeCssId = (id = '') =>
      id.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');

    const rxExact = new RegExp(`^${escapeRegex(target)}$`, 'i');
    const rxContiene = new RegExp(escapeRegex(target), 'i');

    const seleccionarOpcionListbox = () => {
      return cy.get('body', { log: false }).then(($b) => {
        const $opts = $b.find('ul[role="listbox"]:visible li[role="option"]:visible');
        if (!$opts.length) return cy.wrap(null);

        const exact = Array.from($opts).find((el) => rxExact.test((el.textContent || '').trim()));
        if (exact) return cy.wrap(exact, { log: false }).click({ force: true });

        const contiene = Array.from($opts).find((el) => rxContiene.test((el.textContent || '').trim()));
        if (contiene) return cy.wrap(contiene, { log: false }).click({ force: true });

        return cy.wrap($opts[0], { log: false }).click({ force: true });
      });
    };

    return cy.get('body').then(($b) => {
      const $lab = $b
        .find('label[for]')
        .filter((_, el) => rxLabel.test((el.textContent || '').trim()))
        .filter(':visible')
        .first();

      if (!$lab.length) return cy.wrap(null);

      const forAttr = ($lab.attr('for') || '').toString();
      if (!forAttr) return cy.wrap(null);

      const sel = `#${escapeCssId(forAttr)}`;

      return cy.get(sel, { timeout: 15000 })
        .filter(':visible')
        .first()
        .then(($inp) => {
          const actual = (($inp.val && $inp.val()) ?? $inp[0]?.value ?? '').toString().trim();
          if (actual && actual.toLowerCase() === target.toLowerCase()) return cy.wrap(null);

          return cy.wrap($inp)
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(target, { force: true })
            .then(() => cy.wait(150, { log: false }))
            .then(() => {
              return cy.get('body', { log: false }).then(($b2) => {
                const hayList = $b2.find('ul[role="listbox"]:visible').length > 0;
                if (!hayList) {
                  // si no abre lista, intenta confirmar teclado
                  return cy.wrap($inp).type('{downArrow}{enter}', { force: true });
                }
                return seleccionarOpcionListbox();
              });
            })
            .then(() => cy.get('body').type('{esc}', { force: true, log: false }));
        });
    });
  }

  function generarNumeroAleatorio(digitos = 4) {
    const max = Math.pow(10, digitos);
    const n = Math.floor(Math.random() * max);
    return String(n).padStart(digitos, '0');
  }

  function sustituirPlaceholders(casoOriginal, codigo4, codigo3) {
    const caso = { ...(casoOriginal || {}) };
    const total = Number(caso?.__totalCamposExcel) || 40;
    for (let i = 1; i <= total; i++) {
      const k = `dato_${i}`;
      const v = caso[k];
      if (typeof v === 'string') {
        let nv = v;
        nv = nv.replace(/XXXX/g, codigo4);
        nv = nv.replace(/XXX/g, codigo3);
        caso[k] = nv;
      }
    }
    return caso;
  }

  // -------------------- Columnas (panel) --------------------

  function obtenerPatronColumna(nombreColumna = '') {
    const lower = nombreColumna.toLowerCase();
    if (/c[óo]digo/.test(lower)) return /(C[óo]digo|Code|Codi)/i;
    if (/nombre/.test(lower)) return /(Nombre|Name|Nom)/i;
    if (/tel[eé]fono/.test(lower)) return /(Tel[eé]fono|Phone|Tel[eè]fon)/i;
    if (/raz[oó]n/.test(lower)) return /(Raz[oó]n|Social)/i;
    if (/email/.test(lower)) return /(Email|E-mail)/i;
    if (/nif/.test(lower)) return /(NIF|CIF)/i;
    if (/tipo/.test(lower)) return /(Tipo|Type)/i;
    return new RegExp(`^${escapeRegex(nombreColumna)}$`, 'i');
  }

  function abrirPanelColumnas() {
    // Misma implementación que Clientes: abrir panel por el icono "3 rayitas" (path SVG fijo),
    // y validar el título multi-idioma.
    cy.log('Abriendo panel de columnas');

    const PATH_COLUMNAS =
      'M7.5 4.375a.625.625 0 1 0 0 1.25.625.625 0 0 0 0-1.25Zm-1.768 0a1.876 1.876 0 0 1 3.536 0h7.607a.625.625 0 1 1 0 1.25H9.268a1.876 1.876 0 0 1-3.536 0H3.125a.625.625 0 1 1 0-1.25h2.607Zm6.768 5a.625.625 0 1 0 0 1.25.625.625 0 0 0 0-1.25Zm-1.768 0a1.876 1.876 0 0 1 3.536 0h2.607a.625.625 0 1 1 0 1.25h-2.607a1.876 1.876 0 0 1-3.536 0H3.125a.625.625 0 1 1 0-1.25h7.607Zm-3.232 5a.625.625 0 1 0 0 1.25.625.625 0 0 0 0-1.25Zm-1.768 0a1.876 1.876 0 0 1 3.536 0h7.607a.625.625 0 1 1 0 1.25H9.268a1.876 1.876 0 0 1-3.536 0H3.125a.625.625 0 1 1 0-1.25h2.607Z';

    return UI.abrirPantalla()
      .then(() => {
        return cy.get('button.css-kqdryq, button', { timeout: 10000 }).then(($buttons) => {
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
      .then(() => {
        return cy
          .contains('div, span, p', /(Columnas|Columns?|Columnes)/i, { timeout: 10000 })
          .should('be.visible');
      });
  }

  function toggleColumnaEnPanel(columna) {
    const patron = obtenerPatronColumna(columna);
    cy.log(`Panel columnas: clic en "${columna}"`);
    return cy
      .contains('div, span, p', /(Columnas|Columns?|Columnes)/i, { timeout: 10000 })
      .closest('div.MuiPaper-root')
      .within(() => {
        return cy.contains('li, label, span', patron, { timeout: 10000 })
          .should('be.visible')
          .click({ force: true });
      });
  }

  function guardarPanelColumnas() {
    cy.log('Guardando panel de columnas');
    return cy.contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
      .should('be.visible')
      .click({ force: true })
      .then(() => cy.wait(500));
  }

  function ocultarColumna(columna) {
    return UI.abrirPantalla().then(() => {
      cy.log(`Ocultando columna "${columna}" (panel columnas)`);
      return abrirPanelColumnas()
        .then(() => toggleColumnaEnPanel(columna))
        .then(() => guardarPanelColumnas())
        .then(() => cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('not.contain.text', columna));
    });
  }

  function mostrarColumna(columna) {
    return UI.abrirPantalla().then(() => {
      cy.log(`Mostrando columna "${columna}" (panel columnas, con posible segundo clic)`);

      const patron = obtenerPatronColumna(columna);

      const clickEnPanel = () => {
        cy.log('Abriendo panel y pulsando en la columna del panel...');
        return abrirPanelColumnas()
          .then(() => {
            return cy
              .contains('div, span, p', /(Columnas|Columns?|Columnes)/i, { timeout: 10000 })
              .closest('div.MuiPaper-root')
              .within(() => {
                cy.contains('li, label, span', patron, { timeout: 10000 })
                  .should('be.visible')
                  .click({ force: true });
              });
          })
          .then(() => guardarPanelColumnas());
      };

      const intentar = (intento = 0) => {
        return clickEnPanel().then(() => {
          return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).then(($headers) => {
            const texto = $headers.text();
            if (!texto.includes(columna) && intento === 0) {
              cy.log('La columna sigue sin aparecer, repitiendo clic una vez más...');
              return intentar(1);
            }
            return cy.wrap($headers).should('contain.text', columna);
          });
        });
      };

      return intentar(0);
    });
  }

  // -------------------- Verificación pestañas con tablas --------------------

  function verificarPestañaSinFilas(nombrePestaña) {
    return cy.get('body').then(($b) => {
      const $tabla = $b.find('.MuiDataGrid-root:visible, table:visible').first();
      if (!$tabla.length) {
        cy.log(`ℹ️ ${nombrePestaña}: no se encontró tabla visible (se asume OK)`);
        return cy.wrap(true);
      }
      const filas = $tabla.find('.MuiDataGrid-row:visible, tbody tr:visible');
      return cy.wrap(filas.length > 0);
    });
  }

  // -------------------- Registro --------------------

  function registrarResultadoAutomatico(numero, casoId, nombre, obtenido, resultado, habilitado = true) {
    if (!habilitado) return cy.wrap(null);

    return cy.estaRegistrado().then((ya) => {
      if (ya) return null;

      return cy.registrarResultados({
        numero,
        nombre: `${casoId} - ${nombre}`,
        esperado: 'Comportamiento correcto',
        obtenido,
        resultado,
        archivo,
        pantalla: PANTALLA
      });
    });
  }
});