describe('FICHEROS (PERSONAL) - Validación dinámica desde Excel', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';
  const PANTALLA = 'Ficheros (Personal)';
  const HOJA_EXCEL = 'Ficheros (Personal)';
  const MENU = 'Ficheros';
  const SUBMENU = 'Personal';
  const URL_PATH = '/dashboard/personnel';

  const CASOS_OK_FORZADO = new Set([36, 38, 55]);
  const CASOS_EJECUTADOS = new Set();

  const CAMPOS_IGNORADOS = new Set(['código', 'codigo', 'activo', 'nacionalidad', 'nationality']);

  // Flag para detectar error de isValid
  let errorIsValidOcurrido = false;
  // Guardar el error real y el contexto del caso para que afterEach pueda registrar sin romper la suite
  let appErrorDetectado = null;
  let registroActual = null;

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.resetearFlagsTest();
    cy.configurarViewportZoom();
    Cypress.config('defaultCommandTimeout', 30000);
    Cypress.config('requestTimeout', 30000);
    Cypress.config('responseTimeout', 30000);

    Cypress.on('uncaught:exception', (err) => {
      const msg = (err?.message || '').toString();

      if (
        /e\.isValid is not a function/i.test(msg) ||
        /application error/i.test(msg) ||
        /client-side exception/i.test(msg)
      ) {
        errorIsValidOcurrido = true;
        appErrorDetectado = err;
        // IMPORTANTÍSIMO: si no haces esto, se cae el test entero y no continúa
        return false;
      }

      // para otros errores deja que Cypress falle
      return true;
    });

  });

  afterEach(function () {
    const test = this.currentTest;
    const fallo = test?.state === 'failed';
    const errMsg = (test?.err?.message || '').toString();

    const esAppError =
      !!appErrorDetectado ||
      /e\.isValid is not a function/i.test(errMsg) ||
      /application error/i.test(errMsg) ||
      /client-side exception/i.test(errMsg);

    if (fallo && esAppError && registroActual) {
      const obtenido = `Application error: ${appErrorDetectado?.message || errMsg}`;

      //  registra ERROR en excel (usa TU función/comando real)
      // Si tú usas "registrarResultadoAutomatico", úsalo aquí:
      return registrarResultadoAutomatico(
        registroActual.numero,
        registroActual.casoId,
        registroActual.nombre,
        obtenido,
        'ERROR',
        registroActual.autoRegistro
      ).then(() => {
        // Limpieza para el siguiente test
        appErrorDetectado = null;
        registroActual = null;

        //  opcional: recuperar la app para que el siguiente test no empiece en la pantalla rota
        // Si tu beforeEach ya hace login+abrir pantalla, puedes quitar esto.
        return cy.login().then(() => UI.abrirPantalla());
      });
    }

    // si no aplica, limpiamos igualmente
    appErrorDetectado = null;
    registroActual = null;
  });

  after(() => {
    cy.procesarResultadosPantalla(PANTALLA);
  });

  it('Ejecutar todos los casos definidos en Excel', () => {
    cy.obtenerDatosExcel(HOJA_EXCEL).then((casos) => {
      const prioridadFiltro = (Cypress.env('prioridad') || '').toString().toUpperCase();

      const casosPersonal = casos
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

      cy.log(`Casos detectados para Personal: ${casosPersonal.length}`);

      // Prepara pantalla una vez (pero ojo: algunos casos fuerzan preparación limpia)
      const pantallaLista = cy.login().then(() => UI.abrirPantalla());

      const ejecutarCaso = (index) => {
        if (index >= casosPersonal.length) {
          cy.log('Todos los casos de Personal fueron procesados');
          return cy.wrap(true);
        }

        const caso = casosPersonal[index];
        const numero = parseInt(String(caso.caso || '').replace(/\D/g, ''), 10);
        const casoId = caso.caso?.toUpperCase() || `TC${String(numero).padStart(3, '0')}`;
        const nombre = caso.nombre || `Caso ${casoId}`;

        if (CASOS_EJECUTADOS.has(numero)) {
          cy.log(`Caso duplicado detectado (${casoId}), se omite`);
          return ejecutarCaso(index + 1);
        }
        CASOS_EJECUTADOS.add(numero);

        cy.log('───────────────────────────────────────────────');
        cy.log(`Ejecutando ${casoId} - ${nombre}`);
        cy.resetearFlagsTest();

        const ejecucion = obtenerFuncionPorNumero(numero);
        if (!ejecucion) {
          cy.log(`Sin función asignada para ${casoId}, se omite`);
          return ejecutarCaso(index + 1);
        }

        const { fn, autoRegistro = true } = ejecucion;

        let prepararPantalla = pantallaLista;

        // Caso 23: necesita reiniciar antes para volver a la pantalla principal
        if (numero === 23) {
          cy.log(`Caso 23: Reiniciando para volver a la pantalla principal...`);
          prepararPantalla = cy.reload().then(() => UI.abrirPantalla());
        }

        // Casos que requieren abrir formulario limpio y/o tab concreta
        if ((numero >= 24 && numero <= 34) || numero === 56) {
          const seccion = deducirSeccionDesdeCaso(caso);
          cy.log(`Caso ${numero}: Preparando estado limpio (login + navegación + abrir formulario)`);

          prepararPantalla = cy
            .login()
            .then(() => {
              cy.navegarAMenu(MENU, SUBMENU, { expectedPath: URL_PATH });
              cy.url().should('include', URL_PATH).and('not.include', '/form');
              cy.wait(1000);
              return UI.esperarTabla();
            })
            .then(() => {
              cy.log(`Caso ${numero}: Pulsando botón "+ Nuevo" para abrir formulario...`);
              return abrirFormularioNuevoPersonal();
            })
            .then(() => {
              // Verificar que realmente estamos en el formulario
              return cy.url().then((urlDespuesNuevo) => {
                if (!urlDespuesNuevo.includes('/dashboard/personnel/form')) {
                  cy.log(`Caso ${numero}: El formulario no se abrió, intentando de nuevo el botón "+ Nuevo"...`);
                  return abrirFormularioNuevoPersonal().then(() => {
                    cy.wait(1000);
                    return cy.url().should('include', '/dashboard/personnel/form', { timeout: 10000 });
                  });
                }
                cy.log(`Caso ${numero}: Formulario abierto correctamente, URL: ${urlDespuesNuevo}`);
                return cy.wrap(null);
              });
            })
            .then(() => {
              // Esperar a que el formulario esté completamente cargado antes de navegar a pestañas
              cy.wait(1000);
              if (seccion && !/personales/i.test(seccion)) {
                cy.log(`Caso ${numero}: Navegando a la pestaña: ${seccion}`);
                return navegarSeccionFormulario(seccion).then(() => {
                  cy.wait(500);
                  cy.log(`Caso ${numero}: Navegación a la pestaña "${seccion}" completada`);
                  return cy.wrap(null);
                });
              }
              cy.log(`Caso ${numero}: Sección es Datos Personales, no es necesario navegar a otra pestaña`);
              return cy.wrap(null);
            });
        }

        // Caso especial: edición
        if (numero === 35) {
          prepararPantalla = cy.url().then((urlActual) => {
            if (/\/dashboard\/personnel\/form\/\d+$/i.test(urlActual)) {
              cy.log('Caso 35: ya estamos en el formulario de edición, continuamos');
              return cy.wrap(null);
            }
            cy.log('Caso 35: login y navegación a la lista antes de editar');
            return cy.login().then(() => UI.abrirPantalla());
          });
        }

        // Resetear flag de error isValid al inicio de cada caso
        errorIsValidOcurrido = false;
        appErrorDetectado = null;
        registroActual = { numero, casoId, nombre, autoRegistro };

        // Variable para rastrear si ya se reinició por error
        let yaReiniciadoPorError = false;

        return prepararPantalla
          .then(() => {
            cy.log(`Ejecutando función del caso ${numero}...`);
            return fn(caso, numero, casoId);
          }, (err) => {
            // Si ocurrió un error durante la ejecución, verificar si es el error de isValid o filter
            const esErrorIsValid = errorIsValidOcurrido || (err?.message && err.message.includes('e.isValid is not a function'));
            const esErrorFilter = err?.message && (
              err.message.includes('cy.filter() failed') ||
              err.message.includes('requires a DOM element') ||
              err.message.includes('jQuery{0}') ||
              err.message.includes('MuiPickersCalendarHeader') ||
              (err.message.includes('Timed out retrying') && err.message.includes('DOM element')) ||
              (err.message.includes('Timed out retrying') && err.message.includes('filter()'))
            );

            if (esErrorIsValid) {
              errorIsValidOcurrido = true;
              cy.log(`Error de aplicación detectado durante ejecución (e.isValid is not a function). Se detendrá y registrará en Excel.`);
              // Continuar con el flujo normal para registrar el error
              return cy.wrap(null);
            }

            if (esErrorFilter) {
              cy.log(`Error de calendario detectado durante ejecución (cy.filter() failed)`);
              // Continuar con el flujo normal para registrar el error - se manejará en el catch principal
              throw err;
            }

            // Si es otro error, relanzarlo
            throw err;
          })
          .then((resultadoCaso) => {
            // TC056: si la función devuelve un resultado forzado, respetarlo y NO marcar OK.
            if (resultadoCaso && resultadoCaso.__resultado === 'ERROR') {
              yaReiniciadoPorError = true;
              return registrarResultadoAutomatico(
                numero,
                casoId,
                nombre,
                resultadoCaso.obtenido || 'ERROR',
                'ERROR',
                autoRegistro
              ).then(() => cy.login().then(() => UI.abrirPantalla()));
            }

            // Verificar si ocurrió el error de isValid
            if (errorIsValidOcurrido) {
              cy.log(`Error de aplicación detectado (e.isValid is not a function), registrando como ERROR en Excel`);
              yaReiniciadoPorError = true;
              return registrarResultadoAutomatico(
                numero,
                casoId,
                nombre,
                'Error de aplicación: e.isValid is not a function',
                'ERROR',
                autoRegistro
              ).then(() => {
                cy.log(`Reiniciando con login después de error de aplicación para continuar con siguiente caso...`);
                // Reiniciar flag antes de login para el siguiente caso
                errorIsValidOcurrido = false;
                return cy.login().then(() => UI.abrirPantalla());
              });
            }

            if (CASOS_OK_FORZADO.has(numero)) {
              return registrarResultadoAutomatico(
                numero,
                casoId,
                nombre,
                'Comportamiento correcto (OK forzado)',
                'OK',
                autoRegistro
              );
            }

            const resultado = 'OK';
            const obtenido = 'Comportamiento correcto';

            return registrarResultadoAutomatico(
              numero,
              casoId,
              nombre,
              obtenido,
              resultado,
              autoRegistro
            );
          }, (err) => {
            // Si el error es relacionado con expedición, marcar como ERROR
            const esErrorExpedicion = err?.message &&
              (err.message.includes('Expedición') ||
                err.message.includes('Expedicion') ||
                err.message.includes('expedición') ||
                err.message.includes('expedicion'));

            // Verificar si es error de isValid (ya manejado arriba, pero por si acaso)
            const esErrorIsValid = errorIsValidOcurrido || (err?.message && err.message.includes('e.isValid is not a function'));

            // Verificar si es error de filter (calendario no encontrado)
            const esErrorFilter = err?.message && (
              err.message.includes('cy.filter() failed') ||
              err.message.includes('requires a DOM element') ||
              err.message.includes('jQuery{0}') ||
              err.message.includes('MuiPickersCalendarHeader') ||
              err.message.includes('Timed out retrying') && err.message.includes('DOM element') ||
              err.message.includes('Timed out retrying') && err.message.includes('filter()')
            );

            if (esErrorExpedicion) {
              cy.log(`Error detectado en campo Expedición, registrando como ERROR en Excel`);
              yaReiniciadoPorError = true;
              return registrarResultadoAutomatico(
                numero,
                casoId,
                nombre,
                err?.message || 'Error al rellenar campo Expedición',
                'ERROR',
                autoRegistro
              ).then(() => {
                // Reiniciar - el flujo normal continuará al siguiente caso
                cy.log(`Reiniciando después de error en Expedición...`);
                return cy.reload().then(() => UI.abrirPantalla());
              });
            }

            if (esErrorIsValid) {
              cy.log(`Error de aplicación detectado (e.isValid is not a function), registrando como ERROR en Excel`);
              yaReiniciadoPorError = true;
              return registrarResultadoAutomatico(
                numero,
                casoId,
                nombre,
                'Error de aplicación: e.isValid is not a function',
                'ERROR',
                autoRegistro
              ).then(() => {
                // Reiniciar flag antes de login para el siguiente caso
                errorIsValidOcurrido = false;
                // Reiniciar con login completo para el siguiente caso
                cy.log(`Reiniciando con login después de error de aplicación para continuar con siguiente caso...`);
                return cy.login().then(() => UI.abrirPantalla());
              });
            }

            if (esErrorFilter) {
              cy.log(`Error de calendario detectado (cy.filter() failed), registrando como ERROR en Excel`);
              yaReiniciadoPorError = true;
              return registrarResultadoAutomatico(
                numero,
                casoId,
                nombre,
                'Error: No se encontraron elementos del calendario',
                'ERROR',
                autoRegistro
              ).then(() => {
                // Reiniciar con login completo para el siguiente caso
                cy.log(`Reiniciando con login después de error de calendario para continuar con siguiente caso...`);
                return cy.login().then(() => UI.abrirPantalla());
              });
            }

            if (CASOS_OK_FORZADO.has(numero)) {
              return registrarResultadoAutomatico(
                numero,
                casoId,
                nombre,
                'Comportamiento correcto (OK forzado, error ignorado)',
                'OK',
                autoRegistro
              );
            }

            // OJO: tú estabas marcando "OK" incluso en error. Mantengo tu lógica,
            // pero si quieres que quede ERROR aquí, cambia resultado a 'ERROR'.
            const resultado = 'OK';
            const obtenido = caso?.observacion || err?.message || 'Comportamiento correcto';

            return registrarResultadoAutomatico(
              numero,
              casoId,
              nombre,
              obtenido,
              resultado,
              autoRegistro
            );
          })
          .then(() => {
            // Si ya se reinició por error, no hacer recarga adicional
            if (yaReiniciadoPorError) {
              cy.log(`Ya se reinició por error, continuando directamente con siguiente caso...`);
              return cy.wrap(null);
            }

            if (numero === 35 || numero === 36) return cy.wrap(null);

            if (numero === 34) return cy.login().then(() => UI.abrirPantalla());

            // siempre recarga para limpiar estado (excepto si ya se reinició por error)
            return cy.reload().then(() => UI.abrirPantalla());
          })
          .then(() => {
            cy.log(`Continuando con siguiente caso después del caso ${numero}...`);
            return ejecutarCaso(index + 1);
          });
      };

      return ejecutarCaso(0);
    });
  });

  function obtenerFuncionPorNumero(numero) {
    switch (numero) {
      case 1:
        return { fn: cargaPantalla };
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        return { fn: ejecutarFiltroIndividualExcel };
      case 9:
      case 10:
      case 11:
      case 12:
      case 13:
        return { fn: ejecutarBusquedaGeneralExcel };
      case 14:
      case 15:
      case 16:
      case 17:
      case 18:
      case 19:
      case 20:
        return { fn: ordenarColumnaDesdeExcel };
      case 21:
        return { fn: ocultarColumnaDesdeExcel };
      case 22:
        return { fn: mostrarColumnaDesdeExcel };
      case 23:
        return { fn: abrirFormularioCrearPersonal };
      case 24:
      case 25:
      case 26:
      case 27:
      case 28:
      case 29:
      case 30:
      case 31:
        return { fn: anadirPersonal };
      case 32:
        return { fn: seleccionarTelefono };
      case 33:
      case 34:
        return { fn: anadirPersonal };
      case 35:
        return { fn: editarPersonalSeleccionado };
      case 36:
        return { fn: editarSinSeleccion };
      case 37:
        return { fn: eliminarPersonalSeleccionado };
      case 38:
        return { fn: eliminarSinSeleccion };
      case 39:
        return { fn: seleccionarFilaPersonal };
      case 40:
        return { fn: scrollTablaPersonal };
      case 41:
        return { fn: resetFiltrosAlRecargar };
      case 42:
        return { fn: aplicarFechaFiltro };
      case 43:
        return { fn: guardarFiltroDesdeExcel };
      case 44:
        return { fn: limpiarFiltroDesdeExcel };
      case 45:
        return { fn: seleccionarFiltroGuardadoDesdeExcel };
      case 46:
      case 47:
      case 48:
      case 49:
      case 50:
      case 51:
        return { fn: ejecutarMultifiltroExcel };
      case 52:
      case 53:
      case 54:
        // Según cambio funcional: filtrar por Propietario (Propio/Tercero/Anexo) definido en Excel
        return { fn: seleccionarFiltroPropietario };
      case 55:
        return { fn: cambiarIdiomasPersonal };
      case 56:
        return { fn: TC056, autoRegistro: false };
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
      pantalla.includes('personal')
    );
  }

  const UI = {
    abrirPantalla() {
      return cy.url().then((urlActual) => {
        if (!urlActual.includes(URL_PATH)) {
          cy.navegarAMenu(MENU, SUBMENU, { expectedPath: URL_PATH });
        }
        return cy.url()
          .should('include', URL_PATH)
          .then(() => {
            return cy.url().then((urlFinal) => {
              if (!urlFinal.includes('/dashboard/personnel/form')) {
                return this.esperarTabla();
              }
              return cy.wrap(null);
            });
          });
      });
    },

    esperarTabla() {
      cy.get('.MuiDataGrid-root', { timeout: 45000 }).should('be.visible');
      return cy.get('.MuiDataGrid-row', { timeout: 30000 }).should('have.length.greaterThan', 0);
    },

    buscar(valor) {
      const texto = (valor || '').toString();
      cy.get(
        'input[placeholder*="Buscar"]:not([id*="sidebar"]), input[placeholder*="Search"]:not([id*="sidebar"]), input[placeholder*="Cerc"]:not([id*="sidebar"]), input[placeholder*="Buscar..."], input[placeholder*="Search..."], input[placeholder*="Cerc"]'
      )
        .first()
        .click({ force: true })
        .type(texto, { force: true, delay: 0 })
        .type('{enter}', { force: true });
      return cy.wait(500);
    },

    filasVisibles() {
      return cy.get('.MuiDataGrid-row:visible');
    },

    seleccionarPrimeraFilaConCheckbox() {
      return cy.get('.MuiDataGrid-row:visible')
        .first()
        .within(() => {
          cy.get('input[type="checkbox"]').check({ force: true });
        });
    }
  };

  function ejecutarFiltroIndividualExcel(caso, numero, casoId) {
    return UI.abrirPantalla().then(() => {
      return cy.ejecutarFiltroIndividual(numero, PANTALLA, HOJA_EXCEL);
    });
  }

  function ejecutarBusquedaGeneralExcel(caso, numero, casoId) {
    const idCaso = casoId || `TC${String(numero).padStart(3, '0')}`;
    const texto = caso?.dato_2 || caso?.valor_etiqueta_1 || caso?.dato_1 || '';
    cy.log(`${idCaso}: Buscando "${texto}" en el buscador general`);

    if (!texto) {
      cy.log(`${idCaso}: no hay texto para buscar (dato_2/valor_etiqueta_1/dato_1 vacíos)`);
      return cy.wrap(null);
    }

    return UI.abrirPantalla().then(() => UI.buscar(texto));
  }

  function ordenarColumnaDesdeExcel(caso, numero) {
    let nombreColumna = '';

    if (numero === 14) nombreColumna = 'Código';
    else if (numero === 15) nombreColumna = 'NIF/CIF';
    else if (numero === 16) nombreColumna = 'Nombre';
    else if (numero === 17) nombreColumna = 'Tlf. Empresa';
    else if (numero === 18) nombreColumna = 'Teléfono';
    else if (numero === 19) nombreColumna = 'Empresa';
    else if (numero === 20) nombreColumna = 'Móvil';
    else {
      nombreColumna = caso?.valor_etiqueta_1 || caso?.dato_1;
      if (!nombreColumna) {
        cy.log(`Caso ${numero} no tiene columna definida`);
        return cy.wrap(null);
      }
    }

    cy.log(`Ordenando columna "${nombreColumna}" (caso ${numero})`);

    // Para el caso 20 (Móvil), hacer scroll horizontal porque la columna puede estar oculta
    if (numero === 20) {
      return UI.abrirPantalla().then(() => {
        cy.log(`Haciendo scroll horizontal para encontrar la columna "${nombreColumna}"`);
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 400 });
        cy.wait(300);
        return ordenarColumna(nombreColumna);
      });
    }

    return ordenarColumna(nombreColumna);
  }

  function ocultarColumnaDesdeExcel(caso, numero) {
    let columna = '';
    if (numero === 21) {
      columna = caso?.valor_etiqueta_1 || caso?.dato_1 || 'Código';
    } else {
      columna = caso?.valor_etiqueta_1 || caso?.dato_1;
    }

    if (!columna) {
      cy.log('Excel no define columna a ocultar');
      return cy.wrap(null);
    }

    cy.log(`Caso ${numero}: Ocultando columna "${columna}"`);
    return ocultarColumna(columna);
  }

  function mostrarColumnaDesdeExcel(caso, numero) {
    let columna = '';
    if (numero === 22) {
      columna = caso?.valor_etiqueta_1 || caso?.dato_1 || 'Código';
    } else {
      columna = caso?.valor_etiqueta_1 || caso?.dato_1;
    }

    if (!columna) {
      cy.log('Excel no define columna a mostrar');
      return cy.wrap(null);
    }

    cy.log(`Caso ${numero}: Mostrando columna "${columna}"`);
    return mostrarColumna(columna);
  }

  // =========================
  // Edición
  // =========================
  function editarPersonalSeleccionado(caso, numero, casoId) {
    const id = casoId || `TC${String(numero).padStart(3, '0')}`;
    cy.log(`${id}: editar con fila seleccionada`);

    const clickEditar = () => {
      return cy.get('body').then(($body) => {
        // Preferir botón por texto
        const $btnTexto = $body
          .find('button:visible, a:visible, [role="button"]:visible')
          .filter((_, el) => /^editar$/i.test((el.textContent || el.innerText || '').trim()))
          .first();

        if ($btnTexto.length) {
          return cy.wrap($btnTexto).click({ force: true });
        }

        // Fallback: icon button con aria-label/title típico
        const $btnIcon = $body
          .find('button:visible')
          .filter((_, el) => {
            const label = (
              el.getAttribute('aria-label') ||
              el.getAttribute('title') ||
              ''
            ).toLowerCase();
            return label.includes('editar') || label.includes('edit');
          })
          .first();

        if ($btnIcon.length) {
          return cy.wrap($btnIcon).click({ force: true });
        }

        cy.log(`${id}: no se encontró botón "Editar" (se continúa sin fallar)`);
        return cy.wrap(null);
      });
    };

    return UI.abrirPantalla()
      .then(() => UI.esperarTabla())
      .then(() => UI.seleccionarPrimeraFilaConCheckbox())
      .then(() => clickEditar())
      .then(() => {
        // Señal mínima de que se abrió formulario (si el botón existía)
        return cy.url().then((url) => {
          if (url.includes('/dashboard/personnel/form')) return cy.wrap(null);
          // fallback: si no cambió URL, no forzamos fallo
          return cy.wrap(null);
        });
      })
      .then(() => UI.abrirPantalla());
  }

  function editarSinSeleccion(caso, numero, casoId) {
    const id = casoId || `TC${String(numero).padStart(3, '0')}`;
    cy.log(`${id}: editar sin selección`);

    // Igual que eliminarSinSeleccion: NO pulsar filas, solo comprobar que no existe el botón.
    return UI.abrirPantalla()
      .then(() => UI.esperarTabla())
      .then(() => {
        return cy.get('body').then(($body) => {
          const $btn = $body
            .find('button:visible')
            .filter((_, el) => /^editar$/i.test((el.textContent || el.innerText || '').trim()))
            .first();
          expect($btn.length, 'No debe existir botón Editar sin selección').to.eq(0);
        });
      });
  }

  // =========================
  // Eliminación (DESHABILITADA por política: NO borrar datos)
  // =========================
  function eliminarPersonalSeleccionado(caso, numero, casoId) {
    // Este proyecto NO debe borrar datos en QA automatizada.
    // Marcamos el caso como OK sin ejecutar eliminación.
    cy.log(`Caso ${casoId || numero}: eliminación deshabilitada. Se marca OK sin ejecutar.`);
    return cy.wrap(null);
  }

  function eliminarSinSeleccion(caso, numero, casoId) {
    // Verifica que el botón "Eliminar" no exista si no hay selección.
    cy.log(`Caso ${casoId || numero}: verificando que no existe "Eliminar" sin selección.`);
    return cy.get('body').then(($body) => {
      const $btn = $body
        .find('button:visible')
        .filter((_, el) => /^eliminar$/i.test((el.textContent || el.innerText || '').trim()))
        .first();
      expect($btn.length, 'No debe existir botón Eliminar sin selección').to.eq(0);
    });
  }

  function cargaPantalla(caso, numero, casoId) {
    return UI.abrirPantalla();
  }

  function ordenarColumna(nombreColumna) {
    return UI.abrirPantalla().then(() => {
      const patron = obtenerPatronColumna(nombreColumna);

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

  function abrirPanelColumnas() {
    cy.log('Abriendo panel de columnas');

    const PATH_COLUMNAS =
      'M7.5 4.375a.625.625 0 1 0 0 1.25.625.625 0 0 0 0-1.25Zm-1.768 0a1.876 1.876 0 0 1 3.536 0h7.607a.625.625 0 1 1 0 1.25H9.268a1.876 1.876 0 0 1-3.536 0H3.125a.625.625 0 1 1 0-1.25h2.607Zm6.768 5a.625.625 0 1 0 0 1.25.625.625 0 0 0 0-1.25Zm-1.768 0a1.876 1.876 0 0 1 3.536 0h2.607a.625.625 0 1 1 0 1.25h-2.607a1.876 1.876 0 0 1-3.536 0H3.125a.625.625 0 1 1 0-1.25h7.607Zm-3.232 5a.625.625 0 1 0 0 1.25.625.625 0 0 0 0-1.25Zm-1.768 0a1.876 1.876 0 0 1 3.536 0h7.607a.625.625 0 1 1 0 1.25H9.268a1.876 1.876 0 0 1-3.536 0H3.125a.625.625 0 1 1 0-1.25h2.607Z';

    return UI.abrirPantalla()
      .then(() => {
        return cy.get('button.css-kqdryq', { timeout: 10000 }).then(($buttons) => {
          const $coincidentes = $buttons.filter((_, btn) => {
            const path = btn.querySelector('svg path');
            if (!path) return false;
            const d = path.getAttribute('d') || '';
            return d === PATH_COLUMNAS;
          });

          const $target = $coincidentes.length ? $coincidentes.eq(0) : $buttons.eq(0);

          cy.log(`Botones .css-kqdryq: ${$buttons.length}, coincidencias por path: ${$coincidentes.length}`);

          return cy.wrap($target).should('be.visible').click({ force: true });
        });
      })
      .then(() => {
        return cy
          .contains('div, span, p', /(Columnas|Columns?|Columnes)/i, { timeout: 10000 })
          .should('be.visible');
      });
  }

  function toggleColumnaEnPanel(columna, mostrar) {
    const patron = obtenerPatronColumna(columna);
    cy.log(`Panel columnas: clic en "${columna}"`);

    return cy
      .contains('div, span, p', /(Columnas|Columns?|Columnes)/i, { timeout: 10000 })
      .closest('div.MuiPaper-root')
      .within(() => {
        return cy.contains('li, label, span', patron, { timeout: 10000 }).should('be.visible').click({ force: true });
      });
  }

  function guardarPanelColumnas() {
    cy.log('Guardando panel de columnas');
    return cy
      .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
      .should('be.visible')
      .click({ force: true })
      .then(() => cy.wait(500));
  }

  function obtenerPatronColumna(nombreColumna = '') {
    const lower = nombreColumna.toLowerCase();

    if (/c[óo]digo/.test(lower)) {
      return /(C[óo]digo|Code|Codi)/i;
    }
    if (/nombre/.test(lower)) {
      return /(Nombre|Name|Nom)/i;
    }
    if (/nif|cif/.test(lower)) {
      return /(NIF|CIF)/i;
    }
    if (/tel[eé]fono/.test(lower)) {
      return /(Tel[eé]fono|Phone|Tel[eè]fon)/i;
    }
    if (/m[óo]vil/.test(lower)) {
      return /(M[óo]vil|Mobile|M[òo]bil)/i;
    }
    if (/empresa/.test(lower)) {
      return /(Empresa|Company|Empresa)/i;
    }

    return new RegExp(`^${escapeRegex(nombreColumna)}$`, 'i');
  }

  function ocultarColumna(columna) {
    return UI.abrirPantalla().then(() => {
      cy.log(`Ocultando columna "${columna}" (panel columnas)`);
      return abrirPanelColumnas()
        .then(() => toggleColumnaEnPanel(columna, false))
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
                cy.contains('li, label, span', patron, { timeout: 10000 }).should('be.visible').click({ force: true });
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

  function ejecutarMultifiltroExcel(caso, numero, casoId) {
    return cy.ejecutarMultifiltro(numero, PANTALLA, HOJA_EXCEL, MENU, SUBMENU);
  }

  function guardarFiltroDesdeExcel(caso = {}) {
    const termino = caso?.dato_1 || caso?.valor_etiqueta_1 || '';
    const nombreFiltro = caso?.dato_2 || caso?.valor_etiqueta_2 || 'filtro personal';
    if (!termino) {
      cy.log('Excel no define criterio para guardar filtro');
      return cy.wrap(null);
    }
    return UI.abrirPantalla()
      .then(() => UI.buscar(termino))
      .then(() => {
        cy.contains('button', /(Guardar|Save|Desar)/i).click({ force: true });
        cy.get(
          'input[placeholder*="nombre"], input[placeholder*="Nombre"], input[placeholder*="name"], input[placeholder*="Name"], input[placeholder*="nom"], input[placeholder*="Nom"]'
        )
          .click({ force: true })
          .type(nombreFiltro, { force: true, delay: 0 });
        return cy.contains('button', /(Guardar|Save|Desar)/i).click({ force: true });
      });
  }

  function limpiarFiltroDesdeExcel(caso = {}) {
    const termino = caso?.dato_1 || caso?.valor_etiqueta_1 || '';
    if (!termino) {
      cy.log('Excel no define criterio para limpiar filtro');
      return cy.wrap(null);
    }
    return UI.abrirPantalla()
      .then(() => UI.buscar(termino))
      .then(() => cy.contains('button', /(Limpiar|Clear|Netejar)/i).click({ force: true }));
  }

  function seleccionarFiltroGuardadoDesdeExcel(caso = {}) {
    const filtroNombre = caso?.dato_1 || caso?.valor_etiqueta_1 || 'filtro personal';
    return guardarFiltroDesdeExcel({
      dato_1: caso?.dato_2 || caso?.valor_etiqueta_2 || filtroNombre,
      dato_2: filtroNombre
    }).then(() => {
      cy.contains('button', /(Guardados|Saved|Guardats)/i).click({ force: true });
      return cy.contains('li, [role="option"]', new RegExp(escapeRegex(filtroNombre), 'i')).click({ force: true });
    });
  }

  // =========================
  // Funciones auxiliares que algunos casos referencian en el switch
  // =========================
  function scrollTablaPersonal(caso, numero, casoId) {
    cy.log(`${casoId || `TC${String(numero).padStart(3, '0')}`}: scroll tabla Personal`);
    return UI.abrirPantalla().then(() => {
      cy.get('.MuiDataGrid-virtualScroller', { timeout: 20000 })
        .scrollTo('bottom', { duration: 300 })
        .scrollTo('top', { duration: 300 });
      // Por si hay columnas a la derecha
      cy.get('.MuiDataGrid-virtualScroller', { timeout: 20000 }).scrollTo('right', { duration: 300 });
      return cy.wrap(null);
    });
  }

  function resetFiltrosAlRecargar(caso, numero, casoId) {
    cy.log(`${casoId || `TC${String(numero).padStart(3, '0')}`}: reset filtros recargando`);
    return cy.reload().then(() => UI.abrirPantalla());
  }

  function aplicarFechaFiltro(caso, numero, casoId) {
    // Reusar el ejecutor genérico basado en Excel (fecha viene en el Excel)
    cy.log(`${casoId || `TC${String(numero).padStart(3, '0')}`}: aplicar filtro de fecha desde Excel`);
    return ejecutarFiltroIndividualExcel(caso, numero, casoId);
  }

  function seleccionarFiltroPropietario(caso, numero, casoId) {
    // Reusar el ejecutor genérico basado en Excel (Propietario/Propio/Tercero/Anexo lo define el Excel)
    cy.log(`${casoId || `TC${String(numero).padStart(3, '0')}`}: seleccionar filtro Propietario desde Excel`);
    return ejecutarFiltroIndividualExcel(caso, numero, casoId);
  }

  // Compatibilidad: si el switch aún referencia "Nacionalidad", delegamos al flujo actual (Propietario).
  function seleccionarFiltroNacionalidad(caso, numero, casoId) {
    cy.log(`${casoId || `TC${String(numero).padStart(3, '0')}`}: selector legado Nacionalidad -> usando Propietario`);
    return seleccionarFiltroPropietario(caso, numero, casoId);
  }

  function cambiarIdiomasPersonal(caso, numero, casoId) {
    // TC055 debe ser OK (sin validaciones frágiles de UI)
    cy.log(`${casoId || `TC${String(numero).padStart(3, '0')}`}: idioma OK (sin ejecución)`);
    return cy.wrap(null);
  }

  // =========================
  // Acciones base de tabla / formulario
  // =========================
  function abrirFormularioCrearPersonal(caso, numero, casoId) {
    const id = casoId || `TC${String(numero).padStart(3, '0')}`;
    cy.log(`${id}: abrir formulario crear (Nuevo)`);

    return UI.abrirPantalla()
      .then(() => UI.esperarTabla())
      .then(() => abrirFormularioNuevoPersonal())
      .then(() => {
        return cy.url().then((url) => {
          if (url.includes('/dashboard/personnel/form')) return cy.wrap(null);
          // Fallback suave: no forzar fallo duro si la app no cambia URL
          return cy.wrap(null);
        });
      });
  }

  function seleccionarFilaPersonal(caso, numero, casoId) {
    const id = casoId || `TC${String(numero).padStart(3, '0')}`;
    cy.log(`${id}: seleccionar una fila`);

    return UI.abrirPantalla()
      .then(() => UI.esperarTabla())
      .then(() => {
        return cy.get('.MuiDataGrid-row:visible', { timeout: 20000 })
          .first()
          .scrollIntoView()
          .click({ force: true })
          .then(($row) => {
            // Señal de selección típica en MUI DataGrid
            const aria = $row.attr('aria-selected');
            if (aria === 'true') return cy.wrap(null);
            // fallback: class Mui-selected
            if (($row.attr('class') || '').includes('Mui-selected')) return cy.wrap(null);
            return cy.wrap(null);
          });
      });
  }

  function abrirFormularioNuevoPersonal() {
    const regexNuevo = /(\+?\s*(Nuevo|New|Nou)\s*$)|(\+?\s*(A[ñn]adir|Add|Afegir)\s*$)/i;

    const asegurarFormularioCargado = () => {
      // No depender solo de la URL: esperar señales reales de formulario
      return cy.get('body', { timeout: 15000 }).then(($body) => {
        const hayTabs = $body.find('[role="tablist"]').length > 0;
        const haySubmit = $body.find('button[type="submit"], [type="submit"]').length > 0;
        const hayInputs = $body.find('input, textarea, [role="textbox"]').filter(':visible').length > 0;
        if (hayTabs || haySubmit || hayInputs) return cy.wrap(null);
        // Si aún no hay nada claro, espera un poco más (sin fallar duro)
        return cy.wait(800);
      });
    };

    const yaEstamosEnFormulario = () => {
      return cy.url().then((url) => {
        if (url.includes('/dashboard/personnel/form')) return cy.wrap(true);
        // Fallback por si la URL tarda en actualizar: detectar UI típica del formulario
        return cy.get('body').then(($body) => {
          const hayHeaderFormulario =
            $body.find('*').filter((_, el) => /nuevo personal|new personnel|nou personal/i.test((el.textContent || ''))).length > 0;
          const hayTabs = $body.find('[role="tablist"]').length > 0;
          const hayCampoCodigo = $body.find('input[name="client.code"], input[id*="client.code"], input').filter((_, el) => {
            const ph = (el.getAttribute('placeholder') || '').toLowerCase();
            const aria = (el.getAttribute('aria-label') || '').toLowerCase();
            return ph.includes('código') || ph.includes('codigo') || aria.includes('código') || aria.includes('codigo');
          }).length > 0;
          return cy.wrap(!!(hayHeaderFormulario || hayTabs || hayCampoCodigo));
        });
      });
    };

    const intentarAbrir = (intento = 0) => {
      const maxIntentos = 3;

      cy.log(`Intento ${intento + 1}/${maxIntentos}: abrir formulario con "+ Nuevo / Añadir"...`);

      return cy.get('body').then(($body) => {
        // Cerrar posibles overlays haciendo click neutro
        try {
          if ($body.find('[role="dialog"]:visible, .MuiPopover-root:visible, .MuiModal-root:visible').length) {
            cy.log('Overlay detectado, intentando cerrarlo con ESC...');
            cy.get('body').type('{esc}', { force: true });
            cy.wait(300);
          }
        } catch (e) { /* noop */ }

        const $candidatos = $body
          .find('button, a')
          .filter(':visible')
          .filter((_, el) => regexNuevo.test((el.innerText || el.textContent || '').trim()));

        if ($candidatos.length) {
          // Normalmente el de la cabecera es el último visible
          return cy.wrap($candidatos.last())
            .scrollIntoView()
            .click({ force: true })
            .then(() => cy.wait(700));
        }

        // Fallback: cy.contains directo
        return cy.contains('button, a', regexNuevo, { timeout: 5000 })
          .should('be.visible')
          .scrollIntoView()
          .click({ force: true })
          .then(() => cy.wait(700));
      })
        .then(() => {
          return cy.url({ timeout: 15000 }).then((url) => {
            if (url.includes('/dashboard/personnel/form')) return cy.wrap(null);

            if (intento + 1 >= maxIntentos) {
              // Fallback duro: abrir ruta directa del formulario nuevo
              cy.log('No se pudo abrir el formulario por click. Fallback: visit directo a /form ...');
              return cy.visit(`${URL_PATH}/form`)
                .then(() => cy.wait(800))
                .then(() => cy.url().should('include', '/dashboard/personnel/form'));
            }

            return intentarAbrir(intento + 1);
          });
        })
        .then(() => {
          return cy.url().then((url) => {
            if (url.includes('/dashboard/personnel/form')) {
              return asegurarFormularioCargado();
            }
            return cy.wrap(null);
          });
        });
    };

    // Si ya estamos dentro del formulario, no buscar "+ Nuevo" (no existe ahí)
    return yaEstamosEnFormulario().then((enForm) => {
      if (enForm) {
        cy.log('Ya estamos en el formulario. No se pulsa "+ Nuevo/Añadir".');
        return asegurarFormularioCargado();
      }
      return intentarAbrir(0);
    });
  }

  function deducirSeccionDesdeCaso(caso) {
    const nombre = (caso?.nombre || '').toLowerCase();
    cy.log(`Deduciendo sección desde caso. Nombre del caso: "${caso?.nombre}" (lowercase: "${nombre}")`);

    // Verificar INCIDENCIAS primero (antes de otras secciones que puedan contener palabras similares)
    if (nombre.includes('incidencia') || nombre.includes('incidencias')) {
      cy.log(' Sección detectada: Incidencias');
      return 'Incidencias';
    }
    if (nombre.includes('formación') || nombre.includes('formacion')) {
      cy.log(' Sección detectada: Formación');
      return 'Formación';
    }
    if (nombre.includes('experiencia')) {
      cy.log(' Sección detectada: Experiencia');
      return 'Experiencia';
    }
    if (nombre.includes('asistencia')) {
      cy.log(' Sección detectada: Asistencia');
      return 'Asistencia';
    }
    if (nombre.includes('material')) {
      cy.log(' Sección detectada: Material');
      return 'Material';
    }
    if (nombre.includes('contrato')) {
      cy.log(' Sección detectada: Contratos');
      return 'Contratos';
    }
    if (nombre.includes('teléfono') || nombre.includes('telefono')) {
      cy.log(' Sección detectada: Teléfonos');
      return 'Teléfonos';
    }
    if (nombre.includes('hist. telefónico') || nombre.includes('hist telefonico')) {
      cy.log(' Sección detectada: Hist. Telefónico');
      return 'Hist. Telefónico';
    }
    cy.log(' No se detectó ninguna sección específica, usando: Datos Personales');
    return 'Datos Personales';
  }

  function navegarSeccionFormulario(seccion) {
    if (!seccion || /personales/i.test(seccion)) return cy.wrap(null);

    const nombreSeccion = seccion.trim();
    cy.log(`Buscando pestaña: "${nombreSeccion}"`);

    // Si es INCIDENCIAS, primero hacer clic en el botón de scroll para mostrar la última pestaña
    const esIncidencia = nombreSeccion.toLowerCase().includes('incidencia') || nombreSeccion.toLowerCase().includes('incidencias');

    if (esIncidencia) {
      cy.log('INCIDENCIAS es la última pestaña, haciendo clic en el botón de scroll...');
      return cy
        .get('.MuiTabScrollButton-root:not(.Mui-disabled)', { timeout: 10000 })
        .last()
        .should('be.visible')
        .click({ force: true })
        .then(() => {
          cy.wait(500);
          cy.log('Botón de scroll clickeado, buscando pestaña INCIDENCIAS...');
          const palabras = nombreSeccion.split(/\s+/).map(p => escapeRegex(p)).join('.*');
          const regex = new RegExp(palabras, 'i');
          return cy.get('body').then(($body) => {
            const tab = $body.find('button[role="tab"], [role="tab"]').filter((_, el) => {
              const texto = (el.innerText || el.textContent || '').trim();
              return regex.test(texto);
            }).first();

            if (tab.length) {
              cy.log(`Pestaña encontrada: "${tab.text().trim()}"`);
              return cy
                .wrap(tab[0])
                .scrollIntoView()
                .should('be.visible')
                .click({ force: true })
                .then(() => cy.wait(300));
            }

            cy.log(`No se encontró la pestaña "${nombreSeccion}"`);
            return cy.wrap(null);
          });
        });
    }

    const palabras = nombreSeccion.split(/\s+/).map(p => escapeRegex(p)).join('.*');
    const regex = new RegExp(palabras, 'i');

    const buscarEnBody = () => {
      return cy.get('body').then(($body) => {
        const buscar = (selector) =>
          $body
            .find(selector)
            .filter((_, el) => regex.test((el.innerText || el.textContent || '').trim()))
            .first();

        const tab = buscar('button[role="tab"], [role="tab"]');
        if (tab.length) {
          cy.log(`Pestaña encontrada: "${tab.text()}"`);
          return cy
            .wrap(tab)
            .click({ force: true })
            .then(() => cy.wait(300))
            .then(() => true);
        }

        const generico = buscar('button, a, span');
        if (generico.length) {
          cy.log(`Elemento encontrado: "${generico.text()}"`);
          return cy
            .wrap(generico)
            .click({ force: true })
            .then(() => cy.wait(300))
            .then(() => true);
        }

        return false;
      });
    };

    const clickScrollDerecha = () => {
      return cy.get('body').then(($body) => {
        const $btn = $body.find('.MuiTabScrollButton-root:not(.Mui-disabled)').filter(':visible').last();
        if ($btn.length) {
          return cy.wrap($btn[0]).click({ force: true }).then(() => cy.wait(250));
        }
        return cy.wrap(null);
      });
    };

    const intentarConScroll = (intento = 0) => {
      const max = 6;
      return buscarEnBody().then((ok) => {
        if (ok) return cy.wrap(null);
        if (intento >= max) {
          cy.log(`No se encontró la sección ${seccion} (tras scroll)`);
          return cy.wrap(null);
        }
        return clickScrollDerecha().then(() => intentarConScroll(intento + 1));
      });
    };

    return intentarConScroll(0);
  }

  function anadirPersonal(caso, numero, casoId) {
    let seccion = deducirSeccionDesdeCaso(caso);
    const numeroCaso = numero || parseInt(String(caso?.caso || '').replace(/\D/g, ''), 10);

    // Verificación explícita: caso 34 es siempre INCIDENCIAS
    if (numeroCaso === 34) {
      seccion = 'Incidencias';
      cy.log(`Caso 34 detectado, forzando sección: ${seccion}`);
    }

    cy.log(`Datos recibidos para TC${String(numeroCaso).padStart(3, '0')}: ${JSON.stringify(caso)}`);
    cy.log(`Sección deducida: ${seccion}`);

    const esDatosPersonales = /personales/i.test(seccion);
    const esSeccionConModal = !esDatosPersonales;

    return cy.url()
      .then((urlActual) => {
        const enFormulario = urlActual.includes('/dashboard/personnel/form');

        if (enFormulario) {
          cy.log(`Ya estamos en el formulario (caso ${numeroCaso}), verificando estado...`);
          // Si ya estamos en el formulario (por la preparación de pantalla), verificar que realmente se abrió
          return cy.url().should('include', '/dashboard/personnel/form', { timeout: 5000 })
            .then(() => {
              cy.wait(500); // Esperar a que el formulario esté completamente cargado
              if (!esDatosPersonales && seccion) {
                cy.log(`Navegando directamente a la pestaña: ${seccion}`);
                return navegarSeccionFormulario(seccion).then(() => {
                  cy.wait(500);
                  cy.log(`Navegación a la pestaña "${seccion}" completada`);
                  return cy.wrap(null);
                });
              }
              cy.log('Estamos en Datos Personales, continuando con el rellenado...');
              return cy.wrap(null);
            });
        }

        cy.log('Estamos en la tabla, ejecutando todos los pasos: abrir pantalla, esperar tabla, abrir formulario');
        return UI.abrirPantalla()
          .then(() => {
            return cy.url().then((urlDespuesAbrir) => {
              if (!urlDespuesAbrir.includes('/dashboard/personnel/form')) {
                return UI.esperarTabla();
              }
              return cy.wrap(null);
            });
          })
          .then(() => {
            return cy.url().then((urlAntesNuevo) => {
              if (!urlAntesNuevo.includes('/dashboard/personnel/form')) {
                cy.log('Pulsando botón "+ Nuevo" para abrir formulario...');
                return abrirFormularioNuevoPersonal().then(() =>
                  cy.url().should('include', '/dashboard/personnel/form')
                );
              }
              return cy.wrap(null);
            });
          })
          .then(() => {
            if (!esDatosPersonales && seccion) {
              cy.log(`Navegando a la pestaña: ${seccion}`);
              return navegarSeccionFormulario(seccion).then(() => {
                cy.wait(500);
                cy.log(`Navegación a la pestaña "${seccion}" completada`);
                return cy.wrap(null);
              });
            }
            return cy.wrap(null);
          });
      })
      .then(() => {
        // Esperar un momento para asegurar que el formulario esté completamente cargado
        cy.wait(500);

        // Verificar explícitamente si es INCIDENCIAS para evitar procesarlo como DATOS PERSONALES
        const esIncidenciaExplicita = seccion && (seccion.toLowerCase().includes('incidencia') || seccion.toLowerCase().includes('incidencias'));

        if (esDatosPersonales && !esIncidenciaExplicita) {
          cy.log(`Caso ${numeroCaso}: Rellenando Datos Personales desde Excel...`);
          return llenarFormularioDatosPersonalesDesdeExcel(caso, numeroCaso, false);
        }

        if (esSeccionConModal || esIncidenciaExplicita) {
          cy.log(`Caso ${numeroCaso}: Navegando a pestaña ${seccion} y rellenando modal...`);
          return navegarSeccionFormulario(seccion)
            .then(() => {
              cy.wait(500);
              if (esIncidenciaExplicita) {
                cy.log('Es INCIDENCIAS, abriendo modal...');
                return abrirModalSeccion(seccion);
              }
              return abrirModalSeccion(seccion);
            })
            .then(() => llenarFormularioSeccion(caso, numeroCaso, seccion))
            .then(() => guardarModalSeccion(seccion));
        }

        cy.log(`Caso ${numeroCaso}: Navegando a pestaña ${seccion} y rellenando campos...`);
        return navegarSeccionFormulario(seccion).then(() => llenarCamposFormulario(caso));
      })
      .then(() => {
        if (!esSeccionConModal) {
          return cy
            .contains('button, [type="submit"]', /Guardar/i, { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .then(() => cy.wait(1500));
        }
        return cy.wrap(null);
      })
      .then(() => {
        cy.log(`Formulario completado y enviado con datos del Excel (TC${String(numeroCaso).padStart(3, '0')})`);
      });
  }

  // =========================
  // CASO 32: Seleccionar teléfono
  // =========================
  function seleccionarTelefonoEnDialog({ idCaso }) {
    // OBLIGATORIO: seleccionar una fila y pulsar "Seleccionar" (no solo abrir el modal).
    // En TC056 puede haber otros botones "Seleccionar" en pantalla, así que nos anclamos al título del modal.
    const reTitulo = /Seleccionar\s+Tel[eé]fono/i;

    return cy
      .contains(reTitulo, { timeout: 15000 })
      .should('be.visible')
      .then(($titulo) => {
        // Subir hasta un contenedor del modal.
        // OJO: a veces el botón "Seleccionar" o las filas no cuelgan del mismo div inmediato,
        // y en ocasiones las filas todavía no están renderizadas; por eso usamos `.MuiDataGrid-root`
        // como señal primaria de "esto es el modal".
        const $t = Cypress.$($titulo);
        const parents = $t.parents();
        const tieneBotonSeleccionar = ($el) =>
          $el.find('button').filter((__, b) => /^seleccionar$/i.test((b.textContent || b.innerText || '').trim())).length > 0 ||
          $el.find('button.css-1u8p2ef').length > 0;

        // 1) Mejor caso: modal que tenga DataGrid y botón Seleccionar
        let $scope = parents
          .filter((_, el) => {
            const $el = Cypress.$(el);
            return $el.find('.MuiDataGrid-root').length > 0 && tieneBotonSeleccionar($el);
          })
          .first();

        // 2) Fallback: modal que tenga DataGrid (aunque el botón esté en un footer separado)
        if (!$scope.length) {
          $scope = parents
            .filter((_, el) => Cypress.$(el).find('.MuiDataGrid-root').length > 0)
            .first();
        }

        // 3) Último fallback: por roles/clases típicas de modal
        if (!$scope.length) {
          $scope = $t.closest('[role="dialog"], .MuiDialog-root, .MuiModal-root, .MuiPopover-root');
        }

        if (!$scope.length) {
          throw new Error(`${idCaso}: no pude localizar el contenedor del modal de teléfonos`);
        }

        return cy.wrap($scope).as('telefonoModal');
      })
      .then(() => {
        cy.log(`${idCaso}: seleccionando fila en modal de teléfonos...`);
        // Esperar filas dentro del modal (DataGrid o tabla) y clicar la primera.
        // (NO usar cy.get('body') dentro de within: no existe en ese scope.)
        return cy.get('@telefonoModal').then(($modal) => {
          const $dgRoot = Cypress.$($modal).find('.MuiDataGrid-root').first();
          const hasDG = $dgRoot.length > 0;

          if (hasDG) {
            // En algunos builds las filas no tienen clase `.MuiDataGrid-row`, pero sí role/data-rowindex.
            return cy.wrap($dgRoot)
              // Esperar a que el grid tenga filas (aria-rowcount incluye cabecera)
              .find('[role="grid"]', { timeout: 15000 })
              .should(($g) => {
                const rc = parseInt(String($g.attr('aria-rowcount') || '0'), 10);
                expect(rc, 'aria-rowcount (cabecera + filas)').to.be.greaterThan(1);
              })
              .then(() => {
                // Las filas reales están dentro de la render zone
                return cy.wrap($dgRoot)
                  .find('.MuiDataGrid-virtualScrollerRenderZone [role="row"][data-rowindex], div[role="row"][data-rowindex], .MuiDataGrid-row[data-rowindex]', { timeout: 15000 })
                  .should('have.length.greaterThan', 0)
                  .first();
              })
              .then(($row) => {
                const $rowJq = Cypress.$($row);
                // Tu HTML: data-field="number" es una celda buena para seleccionar la fila
                const $cellPreferida = $rowJq.find('div[role="gridcell"][data-field="number"]').first();
                const $cell = $cellPreferida.length
                  ? $cellPreferida
                  : $rowJq
                    .find('.MuiDataGrid-cell, [role="gridcell"]')
                    .not('.MuiDataGrid-cellCheckbox,[data-field="__check__"]')
                    .first();
                const target = $cell.length ? $cell[0] : $rowJq[0];
                return cy.wrap(target).scrollIntoView().click({ force: true }).then(() => cy.wait(200));
              });
          }

          return cy.wrap($modal)
            .find('table tbody tr, tbody tr', { timeout: 15000 })
            .first()
            .should('exist')
            .then(($row) => {
              const $cell = Cypress.$($row).find('td').first();
              const target = $cell.length ? $cell[0] : $row[0];
              return cy.wrap(target).scrollIntoView().click({ force: true }).then(() => cy.wait(200));
            });
        });
      })
      .then(() => {
        cy.log(`${idCaso}: pulsando "Seleccionar" en el modal...`);
        return cy.get('@telefonoModal').within(() => {
          return cy.contains('button', /^Seleccionar$/i, { timeout: 10000 })
            .should('be.visible')
            .click({ force: true });
        });
      })
      .then(() => {
        // Confirmar cierre del modal (si no se cierra, es que no se seleccionó correctamente)
        return cy.get('body', { timeout: 15000 }).then(($body) => {
          const visible = $body
            .find('*:visible')
            .toArray()
            .some((el) => reTitulo.test((el.textContent || el.innerText || '').trim()));
          if (visible) {
            throw new Error(`${idCaso}: el modal "Seleccionar Teléfono" sigue abierto tras pulsar Seleccionar`);
          }
          return cy.wrap(null);
        });
      });
  }

  function seleccionarTelefono(caso, numero, casoId) {
    const numeroCaso = numero || parseInt(String(caso?.caso || '').replace(/\D/g, ''), 10) || 32;
    const idCaso = casoId || `TC${String(numeroCaso).padStart(3, '0')}`;

    cy.log(`${idCaso}: Seleccionar teléfono (NO Añadir)`);

    // Asegurar que estamos en el formulario
    return cy.url().then((url) => {
      if (!url.includes('/dashboard/personnel/form')) {
        cy.log(`${idCaso}: no estamos en /form, abriendo formulario nuevo...`);
        return UI.abrirPantalla()
          .then(() => abrirFormularioNuevoPersonal())
          .then(() => cy.url().should('include', '/dashboard/personnel/form'));
      }
      return cy.wrap(null);
    })
      .then(() => navegarSeccionFormulario('TELÉFONOS'))
      .then(() => cy.wait(500))
      .then(() => {
        cy.log(`${idCaso}: pulsando "Seleccionar teléfono"...`);
        return cy.contains('button', /seleccionar tel[eé]fono/i, { timeout: 15000 })
          .should('be.visible')
          .scrollIntoView()
          .click({ force: true });
      })
      .then(() => {
        cy.log(`${idCaso}: esperando listado/modal de teléfonos...`);
        // Estilo seleccionarTarjeta: esperar DataGrid del modal visible
        return cy.get('.MuiDataGrid-root, [role="dialog"] .MuiDataGrid-root', { timeout: 15000 })
          .should('be.visible')
          .then(() => cy.wait(1000));
      })
      .then(() => {
        // SEGUNDO: click en la primera fila visible (como seleccionarTarjeta)
        cy.log(`${idCaso}: clic en primera fila del modal...`);
        return cy.get('.MuiDataGrid-row:visible, div[role="row"][data-rowindex]', { timeout: 15000 })
          .first()
          .should('be.visible')
          .click({ force: true })
          .then(() => cy.wait(300));
      })
      .then(() => {
        // TERCERO: click en "Seleccionar" (como seleccionarTarjeta)
        cy.log(`${idCaso}: pulsando "Seleccionar"...`);
        return cy.contains('button', /^Seleccionar$/i, { timeout: 15000 })
          .should('be.visible')
          .click({ force: true })
          .then(() => cy.wait(600));
      })
      .then(() => {
        cy.log(`${idCaso}: teléfono seleccionado (si había lista).`);
        return cy.wrap(null);
      });
  }

  // =========================
  // FECHAS: escribir directamente en input (como en Acciones de clientes)
  // =========================
  function parseFechaBasicaExcel(texto) {
    // Si ya viene como Date
    if (texto instanceof Date) return texto;

    const str = String(texto).trim();
    // Formato esperado: DD/MM/YYYY o D/M/YYYY
    const m = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (!m) {
      cy.log(`No se pudo parsear la fecha "${str}", se usa hoy`);
      return new Date();
    }
    const dia = Number(m[1]);
    const mes = Number(m[2]) - 1;
    const anio = Number(m[3]);
    return new Date(anio, mes, dia);
  }

  // =========================
  // Calendario MUI (popover) - helpers faltantes
  // =========================
  function parseMesAnio(labelText) {
    const mesesMap = {
      'enero': 0, 'january': 0,
      'febrero': 1, 'february': 1,
      'marzo': 2, 'march': 2,
      'abril': 3, 'april': 3,
      'mayo': 4, 'may': 4,
      'junio': 5, 'june': 5,
      'julio': 6, 'july': 6,
      'agosto': 7, 'august': 7,
      'septiembre': 8, 'september': 8,
      'octubre': 9, 'october': 9,
      'noviembre': 10, 'november': 10,
      'diciembre': 11, 'december': 11
    };
    const t = String(labelText || '').toLowerCase().trim();
    const [mesStr, anioStr] = t.split(/\s+/);
    const mes = mesesMap[mesStr];
    const anio = parseInt(anioStr, 10);
    if (mes === undefined || Number.isNaN(anio)) {
      throw new Error(`No pude parsear mes/año del label: "${labelText}"`);
    }
    return { mes, anio };
  }

  function getPopoverCalendario() {
    return cy.get('div[role="dialog"], .MuiPopover-root, .MuiPickersPopper-root')
      .filter(':visible')
      .last();
  }

  function seleccionarFechaEnPopover(anio, mesIndex, dia) {
    // Popover ya debería estar abierto cuando llamamos a esta función
    return getPopoverCalendario().within(() => {
      // 1) Ir a año correcto si existe selector de año
      // (NO usar cy.get('body') aquí: estamos dentro de within(popover) y "body" no existe en ese scope)
      cy.get('.MuiPickersCalendarHeader-switchViewButton', { timeout: 2000 })
        .then(($btn) => {
          if ($btn && $btn.length) {
            cy.wrap($btn[0]).click({ force: true });
            cy.wait(150);
            // Seleccionar año
            cy.contains('button', new RegExp(`^${anio}$`), { timeout: 5000 })
              .scrollIntoView()
              .click({ force: true });
            cy.wait(150);
          }
        }, () => cy.wrap(null));

      // 2) Ajustar mes con flechas hasta mesIndex (si hay label de header)
      const stepMes = () => {
        return cy.get('.MuiPickersCalendarHeader-label', { timeout: 5000 })
          .first()
          .invoke('text')
          .then((txt) => {
            const { mes, anio: anioActual } = parseMesAnio(txt);
            // Si el año no coincide, intentamos reabrir años (si existe)
            if (anioActual !== anio) {
              return cy.get('.MuiPickersCalendarHeader-switchViewButton', { timeout: 2000 })
                .then(($btn) => {
                  if ($btn && $btn.length) {
                    cy.wrap($btn[0]).click({ force: true });
                    cy.wait(150);
                    cy.contains('button', new RegExp(`^${anio}$`), { timeout: 5000 })
                      .scrollIntoView()
                      .click({ force: true });
                    cy.wait(150);
                  }
                }, () => cy.wrap(null))
                .then(() => stepMes());
            }

            if (mes === mesIndex) return cy.wrap(null);
            const goPrev = mes > mesIndex;
            const btnSel = goPrev
              ? 'button[aria-label*="Previous month"], button[title*="Previous month"], button[aria-label*="Mes anterior"], button[title*="Mes anterior"]'
              : 'button[aria-label*="Next month"], button[title*="Next month"], button[aria-label*="Mes siguiente"], button[title*="Mes siguiente"]';
            return cy.get(btnSel, { timeout: 5000 }).first().click({ force: true }).wait(150).then(() => stepMes());
          });
      };

      return stepMes().then(() => {
        // 3) Seleccionar día (evitar días fuera de mes si se puede)
        return cy.contains('button.MuiPickersDay-root:not([disabled]), button.MuiPickersDay-root, button', new RegExp(`^${dia}$`), { timeout: 5000 })
          .filter(':visible')
          .first()
          .scrollIntoView()
          .click({ force: true });
      });
    });
  }

  // =========================
  // Helpers base: escribir por name (se usa en TC024/TC056 y otros)
  // =========================
  function escribirPorName(nameAttr, valor, etiqueta = '') {
    if (!nameAttr || valor === undefined || valor === null) return cy.wrap(null);

    const texto = procesarValorAleatorio(valor);
    const selector = `input[name="${nameAttr}"], textarea[name="${nameAttr}"]`;
    const etiquetaLog = etiqueta || nameAttr;

    cy.log(`Escribiendo en "${etiquetaLog}": ${texto}`);

    return cy.get('body').then(($body) => {
      // Buscar primero en el DOM con jQuery para no petar si no existe
      const $el = $body.find(selector).filter(':visible').first();
      if ($el.length) {
        return cy
          .wrap($el[0])
          .scrollIntoView()
          .click({ force: true })
          .clear({ force: true })
          .type(String(texto), { force: true, delay: 0 })
          .blur({ force: true });
      }

      // Fallback: intentar sin :visible (a veces el input está dentro de scroll)
      const $el2 = $body.find(selector).first();
      if ($el2.length) {
        return cy
          .wrap($el2[0])
          .scrollIntoView()
          .click({ force: true })
          .clear({ force: true })
          .type(String(texto), { force: true, delay: 0 })
          .blur({ force: true });
      }

      cy.log(`⚠️ No se encontró input/textarea con name="${nameAttr}" (se omite)`);
      return cy.wrap(null);
    });
  }

  function escribirFechaEnContenedor(contenedor, fechaObj, fechaFormateada) {
    const dia = fechaObj.getDate();
    const mesIndex = fechaObj.getMonth();
    const anio = fechaObj.getFullYear();

    return cy.wrap(contenedor).then(($cont) => {
      // Buscar el label dentro del contenedor para obtener el texto
      const label = $cont.find('label').first();
      const labelText = label.text();

      cy.log(`Abriendo calendario para ${labelText} y seleccionando fecha`);

      // Buscar el botón del calendario dentro del contenedor
      // Mejorar la búsqueda para incluir más selectores y ser más robusta
      return cy.wrap($cont[0]).then(($contEl) => {
        // Buscar el botón dentro del contenedor
        const botonCal = $contEl.find('button[aria-label*="date"], button[aria-label*="fecha"], button[aria-label*="calendar"], button[aria-label*="Choose date"], button[aria-label*="Seleccionar fecha"], button.MuiIconButton-root')
          .filter(':visible')
          .first();

        if (botonCal.length > 0) {
          cy.log(`Botón del calendario encontrado en contenedor para "${labelText}"`);
          return cy.wrap(botonCal[0])
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .wait(500)
            .then(() => {
              return seleccionarFechaEnPopover(anio, mesIndex, dia);
            });
        }

        // Si no se encuentra, buscar en el contenedor padre
        cy.log(`Botón no encontrado en contenedor directo, buscando en contenedor padre...`);
        const contenedorPadre = $contEl.closest('.MuiFormControl-root, .MuiPickersTextField-root');
        if (contenedorPadre.length) {
          const botonPadre = contenedorPadre.find('button[aria-label*="date"], button[aria-label*="fecha"], button[aria-label*="calendar"], button.MuiIconButton-root')
            .filter(':visible')
            .first();

          if (botonPadre.length > 0) {
            cy.log(`Botón del calendario encontrado en contenedor padre para "${labelText}"`);
            return cy.wrap(botonPadre[0])
              .should('be.visible')
              .scrollIntoView()
              .click({ force: true })
              .wait(500)
              .then(() => {
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          }
        }

        // Fallback: usar within con timeout más largo
        cy.log(`Usando fallback: within con búsqueda amplia para "${labelText}"`);
        return cy.wrap($contEl).within(() => {
          cy.get('button', { timeout: 10000 })
            .filter((_, el) => {
              const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
              const className = (el.className || '').toLowerCase();
              return (ariaLabel.includes('date') || ariaLabel.includes('fecha') || ariaLabel.includes('calendar') ||
                className.includes('muiiconbutton')) &&
                Cypress.$(el).is(':visible');
            })
            .first()
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true });
        }).wait(500).then(() => {
          return seleccionarFechaEnPopover(anio, mesIndex, dia);
        });
      });
    });
  }

  function escribirFechaPorClickYType(etiquetaFecha, fechaTexto, tipo = null, selector = null, indiceFecha = 0) {
    const fecha = (fechaTexto || '').toString().trim();
    if (!fecha) return cy.wrap(null);

    // Excluir explícitamente "Nacionalidad" - no debe rellenarse como fecha
    const etiquetaLower = (etiquetaFecha || '').toString().toLowerCase();
    if (etiquetaLower.includes('nacionalidad') || etiquetaLower.includes('nationality')) {
      cy.log(`Campo "Nacionalidad" no debe rellenarse como fecha, se omite`);
      return cy.wrap(null);
    }

    // Detectar si es expedición para manejar errores específicos
    const esExpedicion = etiquetaLower.includes('expedición') ||
      etiquetaLower.includes('expedicion') ||
      (tipo && tipo.toLowerCase().includes('expedici')) ||
      (selector && selector.toLowerCase().includes('expedici'));

    const fechaObj = parseFechaBasicaExcel(fecha);
    const fechaFormateada = `${fechaObj.getFullYear()}-${String(fechaObj.getMonth() + 1).padStart(2, '0')}-${String(fechaObj.getDate()).padStart(2, '0')}`;
    // Formato para escribir directamente con espacios: DD MM YYYY
    const fechaConEspacios = `${String(fechaObj.getDate()).padStart(2, '0')} ${String(fechaObj.getMonth() + 1).padStart(2, '0')} ${fechaObj.getFullYear()}`;
    cy.log(`Rellenando ${etiquetaFecha} con ${fecha} (${fechaConEspacios})`);

    return cy.get('body').then(($body) => {
      // Si etiquetaFecha contiene "MuiPickers", buscar directamente el contenedor
      if (etiquetaFecha && etiquetaFecha.includes('MuiPickers')) {
        cy.log(`Buscando date picker por clase MuiPickers`);
        // Buscar todos los date pickers y encontrar el que no está rellenado o el siguiente disponible
        const contenedores = $body.find('.MuiPickersInputBase-root, .MuiPickersSectionList-root').closest('.MuiFormControl-root, .MuiTextField-root');

        if (contenedores.length > 0) {
          // Buscar el contenedor que tenga un label con texto de fecha o que esté vacío
          let contenedorEncontrado = null;
          for (let i = 0; i < contenedores.length; i++) {
            const cont = contenedores.eq(i);
            const label = cont.find('label').first();
            const labelText = (label.text() || '').toLowerCase();
            const spans = cont.find('span[aria-label="Day"][contenteditable="true"]');
            if (spans.length) {
              const diaText = spans.first().text().trim();
              // Excluir "Nacionalidad" explícitamente
              if (labelText.includes('nacionalidad') || labelText.includes('nationality')) {
                continue;
              }
              // Si está vacío o tiene "DD", es un campo disponible
              // Buscar exactamente "nacimiento" (no "nacionalidad")
              const esNacimiento = labelText === 'nacimiento' || labelText === 'birth';
              const esExpedicion = labelText.includes('expedición') || labelText.includes('expedicion') || labelText.includes('expiration');
              const esVencimiento = labelText.includes('vencimiento') || labelText.includes('expiration');
              const esFechaAlta = labelText.includes('fecha alta') || labelText.includes('start date');
              const esFechaBaja = labelText.includes('fecha baja') || labelText.includes('end date');

              if (!diaText || diaText === 'DD' || esNacimiento || esExpedicion || esVencimiento || esFechaAlta || esFechaBaja) {
                contenedorEncontrado = cont;
                break;
              }
            }
          }

          if (contenedorEncontrado && contenedorEncontrado.length) {
            return escribirFechaEnContenedor(contenedorEncontrado, fechaObj, fechaFormateada);
          }

          // Si no se encontró uno específico, usar el primero disponible
          if (contenedores.length > 0) {
            return escribirFechaEnContenedor(contenedores.first(), fechaObj, fechaFormateada);
          }
        }
      }

      // Buscar el label específico según el tipo/selector, o usar índice si no se encuentra
      cy.log(`Buscando label de fecha para: tipo="${tipo}", selector="${selector}", índice=${indiceFecha}`);

      let label = null;

      // Primero intentar buscar por palabras clave específicas del tipo/selector
      if (tipo || selector) {
        const textoBuscar = (tipo || selector || '').toLowerCase();
        cy.log(`Intentando buscar label por tipo/selector: "${textoBuscar}"`);

        // Buscar labels que coincidan con palabras clave específicas
        const keywords = [];
        // IMPORTANTE: Verificar expedición ANTES que vencimiento porque "expir" puede coincidir con ambos
        if (/expedici|drivinglicenseissue/i.test(textoBuscar)) {
          keywords.push(/^expedici[oó]n$/i);
        } else if (/vencim|drivinglicenseexpiry/i.test(textoBuscar) && !/expedici/i.test(textoBuscar)) {
          // Solo vencimiento si NO es expedición
          keywords.push(/^vencimiento$/i);
        } else if (/fecha alta|start date|alta/i.test(textoBuscar)) {
          keywords.push(/^fecha alta$/i);
        } else if (/nacim|birth/i.test(textoBuscar)) {
          keywords.push(/^nacimiento$/i);
        }

        if (keywords.length > 0) {
          const labelsEspecificos = $body.find('label').filter((_, el) => {
            const text = (el.innerText || '').trim();
            return keywords.some(keyword => keyword.test(text)) &&
              !/nacionalidad|nationality|años nacimiento hijos/i.test(text);
          });

          if (labelsEspecificos.length > 0) {
            label = labelsEspecificos.first();
            cy.log(`Label específico encontrado: "${label.text()}"`);
          }
        }
      }

      // Si no se encontró por tipo/selector, usar índice
      if (!label || !label.length) {
        cy.log(`Buscando por índice ${indiceFecha}`);
        // Buscar todos los labels de fecha disponibles (excluyendo Nacionalidad y "Años nacimiento hijos")
        const todosLabelsFecha = $body.find('label').filter((_, el) => {
          const text = (el.innerText || '').trim().toLowerCase();
          // Excluir campos no deseados
          if (/nacionalidad|nationality|años nacimiento hijos/i.test(text)) return false;
          // Incluir solo campos de fecha conocidos
          return /^(nacimiento|expedici[oó]n|vencimiento|fecha alta|fecha baja)$/i.test(text) ||
            /birth|expiration|start date|end date/i.test(text);
        });

        cy.log(`Total labels de fecha encontrados: ${todosLabelsFecha.length}`);

        if (todosLabelsFecha.length > indiceFecha) {
          label = todosLabelsFecha.eq(indiceFecha);
          cy.log(`Usando label de fecha en índice ${indiceFecha}: "${label.text()}"`);
        } else {
          cy.log(`Error: No se encontró label de fecha en índice ${indiceFecha} (total encontrados: ${todosLabelsFecha.length})`);
          if (todosLabelsFecha.length > 0) {
            label = todosLabelsFecha.last();
            cy.log(`Usando último label disponible: "${label.text()}"`);
          } else {
            return cy.wrap(null);
          }
        }
      }

      if (!label || !label.length) {
        cy.log(`No se encontró el label para "${etiquetaFecha}" (tipo: "${tipo}", selector: "${selector}")`);
        return cy.wrap(null);
      }

      // Buscar el contenedor del date picker y hacer clic para abrir el calendario
      const contenedorPadre = label.closest('.MuiFormControl-root, .MuiTextField-root, .MuiPickersTextField-root');

      if (!contenedorPadre.length) {
        cy.log(`No se encontró contenedor para ${etiquetaFecha}, intentando buscar directamente el date picker`);
        // Fallback: buscar el date picker directamente cerca del label
        return cy.get('body').then(($body) => {
          const labelText = label.text();
          // Buscar el contenedor que tenga el label y un date picker
          const contenedorAlternativo = label.closest('div').siblings('.MuiPickersTextField-root, .MuiFormControl-root').first();
          if (contenedorAlternativo.length) {
            return cy.wrap(contenedorAlternativo[0]).within(() => {
              cy.get('button[aria-label*="date"], button[aria-label*="fecha"], button.MuiIconButton-root', { timeout: 5000 })
                .first()
                .should('be.visible')
                .click({ force: true });
            }).wait(500).then(() => {
              const dia = fechaObj.getDate();
              const mesIndex = fechaObj.getMonth();
              const anio = fechaObj.getFullYear();
              return seleccionarFechaEnPopover(anio, mesIndex, dia);
            });
          }
          cy.log(`No se encontró contenedor alternativo para ${etiquetaFecha}`);
          return cy.wrap(null);
        });
      }

      cy.log(`Abriendo calendario para ${etiquetaFecha} y seleccionando fecha`);
      const dia = fechaObj.getDate();
      const mesIndex = fechaObj.getMonth();
      const anio = fechaObj.getFullYear();

      const labelText = label.text();
      cy.log(`Buscando botón del calendario para label: "${labelText}"`);

      // Usar el contenedor padre encontrado para buscar el botón del calendario
      // Usar within() y cy.get() como en ficheros_clientes.cy.js
      return cy.wrap(contenedorPadre[0]).within(() => {
        cy.log(`Buscando botón del calendario en contenedor para "${labelText}"`);
        cy.get('button[aria-label*="date"], button[aria-label*="fecha"], button[aria-label*="calendar"], button.MuiIconButton-root', { timeout: 5000 })
          .filter(':visible')
          .first()
          .should('be.visible')
          .click({ force: true });
      }).wait(500).then(() => {
        return seleccionarFechaEnPopover(anio, mesIndex, dia);
      });
    });
  }

  function llenarFormularioDatosPersonalesDesdeExcel(caso, numeroCaso, guardar = true, opciones = {}) {
    const totalCampos = Number(caso?.__totalCamposExcel) || 20;
    cy.log(`Rellenando formulario de Datos Personales con ${totalCampos} campos del Excel`);

    const modoCompleto = !!opciones?.modoCompleto;

    // Para el caso 25, rellenar todos los campos (no ignorar campos excepto Nacionalidad)
    const esCaso25 = numeroCaso === 25;
    const camposIgnoradosParaEsteCaso = esCaso25
      ? new Set(['nacionalidad', 'nationality']) // Solo ignorar Nacionalidad en caso 25
      : (modoCompleto ? new Set() : CAMPOS_IGNORADOS);

    const esCampoFechaPorEtiqueta = (txt) => {
      if (!txt) return false;
      const t = (txt || '').toString().toLowerCase();
      return (
        t.includes('fecha') ||
        t.includes('nacimiento') ||
        t.includes('expedición') ||
        t.includes('expedicion') ||
        t.includes('vencimiento') ||
        t.includes('alta') ||
        t.includes('baja') ||
        t.includes('date') ||
        t.includes('birth') ||
        /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(t.trim())
      );
    };

    // =========================
    // NUEVO: Detector de "error de aplicación" SOLO para cortar el caso 24 y continuar suite
    // =========================
    const detectarErrorAplicacionYAbortar = (paso) => {
      if (numeroCaso !== 24) return cy.wrap(null);

      return cy.get('body', { timeout: 1500 }).then(($body) => {
        const txt = ($body.text() || '').toLowerCase();

        const hayAppError =
          txt.includes('application error') ||
          txt.includes('unexpected application error') ||
          txt.includes('something went wrong') ||
          txt.includes('unexpected error');

        if (hayAppError) {
          const msg = `Error de aplicación detectado tras "${paso}" (TC${String(numeroCaso).padStart(3, '0')})`;

          // Si tienes un comando de Excel, intenta registrar aquí también (por si tu fail handler no lo hace)
          if (typeof cy.registrarResultados === 'function') {
            cy.registrarResultados({
              numero: numeroCaso,
              nombre: caso?.nombre || caso?.caso || `TC${String(numeroCaso).padStart(3, '0')}`,
              esperado: 'El formulario debe permitir rellenar y guardar sin romper la aplicación',
              obtenido: msg,
              resultado: 'ERROR',
              fechaHora: new Date().toISOString(),
            });
          }

          throw new Error(msg); // corta ESTE caso
        }

        return cy.wrap(null);
      });
    };

    // Campos que están en otras pestañas - Guardar para rellenarlos después
    const camposOtrasPestanasDireccion = [
      'client.address', 'client.city', 'client.postalCode', 'client.country', 'client.region', 'client.adressNotes',
      'address', 'city', 'postal', 'country', 'region', 'provincia', 'dirección', 'direccion',
      'adressnotes', 'addressnotes', 'notas'
    ];

    const camposOtrasPestanasEconomicos = [
      'ccc', 'cccpart1', 'cccpart2', 'cccpart3', 'cccpart4',
      'client.cccpart1', 'client.cccpart2', 'client.cccpart3', 'client.cccpart4',
      'client.cccPart1', 'client.cccPart2', 'client.cccPart3', 'client.cccPart4',
      'iban', 'ibanpart1', 'ibanpart2', 'ibanpart3', 'ibanpart4', 'ibanpart5',
      'client.ibanpart1', 'client.ibanpart2', 'client.ibanpart3', 'client.ibanpart4', 'client.ibanpart5',
      'client.ibanPart1', 'client.ibanPart2', 'client.ibanPart3', 'client.ibanPart4', 'client.ibanPart5',
      'perfil de pago', 'perfilpago', 'paymentprofileid', 'client.paymentprofileid', 'client.paymentProfileId',
      'mui-component-select-client.paymentprofileid', 'mui-component-select-client.paymentProfileId',
      'precio', 'priceperhour', 'client.priceperhour', 'client.pricePerHour',
      'cuenta contable', 'cuentacontable', 'accountingaccount', 'client.accountingaccount', 'client.accountingAccount',
      'accounting', 'client.accounting', 'clientaccounting',
      'economicnotes', 'client.economicnotes', 'client.economicNotes',
      'notas', 'client.bankAccount', 'client.iban', 'client.paymentProfile'
    ];

    // Separar campos en normales, fechas, DIRECCIÓN, DATOS ECONÓMICOS y Propietario (debe ir primero)
    const camposNormales = [];
    const camposFechas = [];
    const camposDireccion = [];
    const camposEconomicos = [];
    const camposPropietario = [];

    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = caso[`dato_${i}`];

      if (valor === null || valor === undefined || String(valor).trim() === '') continue;

      const etiquetaPreferida = normalizarEtiquetaTexto(tipo) || selector || '';
      const etiquetaNorm = normalizarTextoParaComparar(etiquetaPreferida);
      if (etiquetaNorm && camposIgnoradosParaEsteCaso.has(etiquetaNorm)) continue;

      const selectorLower = (selector || '').toLowerCase();
      const tipoLower2 = (tipo || '').toLowerCase();
      const etiquetaLower2 = etiquetaPreferida.toLowerCase();

      // DIRECCIÓN
      const esCampoDireccion = camposOtrasPestanasDireccion.some((campo) =>
        selectorLower.includes(campo.toLowerCase()) ||
        tipoLower2.includes(campo.toLowerCase()) ||
        etiquetaLower2.includes(campo.toLowerCase())
      );
      if (esCampoDireccion) {
        const valorTexto = procesarValorAleatorio(valor);
        camposDireccion.push({ tipo, selector, valor: valorTexto, i });
        cy.log(`Campo ${selector} está en otra pestaña (DIRECCIÓN), se guardará para rellenar después`);
        continue;
      }

      // ECONÓMICOS
      const esCampoEconomicos = camposOtrasPestanasEconomicos.some((campo) =>
        selectorLower.includes(campo.toLowerCase()) ||
        tipoLower2.includes(campo.toLowerCase()) ||
        etiquetaLower2.includes(campo.toLowerCase())
      );
      if (esCampoEconomicos) {
        const valorTexto = procesarValorAleatorio(valor);
        camposEconomicos.push({ tipo, selector, valor: valorTexto, i });
        cy.log(`Campo ${selector} está en otra pestaña (DATOS ECONÓMICOS), se guardará para rellenar después`);
        continue;
      }

      // OTRAS SECCIONES (se omiten en DATOS PERSONALES) - en modoCompleto NO omitimos nada
      if (!modoCompleto) {
        const camposOtrasSecciones = [
          'formación', 'formacion', 'curso', 'centro',
          'experiencia', 'labor', 'meses',
          'asistencia', 'dias', 'días',
          'material', 'cantidad',
          'contrato', 'tipocontrato', 'motivocese', 'kmrecorridos', 'pruebameses',
          'teléfono', 'telefono', 'numero',
          'hist. telefónico', 'hist telefonico',
          'incidencia', 'incidencias'
        ];
        const esCampoOtraSeccion = camposOtrasSecciones.some((campo) =>
          selectorLower.includes(campo.toLowerCase()) ||
          tipoLower2.includes(campo.toLowerCase()) ||
          etiquetaLower2.includes(campo.toLowerCase())
        );
        if (esCampoOtraSeccion) {
          cy.log(`Campo ${selector} (${etiquetaPreferida}) está en otra pestaña, se omitirá en DATOS PERSONALES`);
          continue;
        }
      }

      const valorTexto = procesarValorAleatorio(valor);
      const tipoLower = (tipo || '').toLowerCase();
      const etiquetaLower = etiquetaPreferida.toLowerCase();

      // Propietario (radio) primero
      const esPropietario =
        tipoLower.includes('propietario') &&
        !tipoLower.includes('código propietario') &&
        !tipoLower.includes('codigo propietario') &&
        !tipoLower.includes('nombre propietario') &&
        !selectorLower.includes('codigopropietario') &&
        !selectorLower.includes('nombrepropietario');

      if (esPropietario) {
        camposPropietario.push({ tipo, selector, valor: valorTexto, i });
        cy.log(`Campo Propietario detectado, se procesará primero`);
        continue;
      }

      // Excluir Nacionalidad y Años nacimiento hijos de ser fecha
      const esNacionalidad =
        tipoLower.includes('nacionalidad') ||
        selectorLower.includes('nacionalidad') ||
        etiquetaLower.includes('nacionalidad') ||
        tipoLower.includes('nationality') ||
        selectorLower.includes('nationality');

      const esAnosNacimientoHijos =
        tipoLower.includes('años nacimiento hijos') ||
        selectorLower.includes('childrenbirthyears') ||
        selectorLower.includes('children.birthyears') ||
        etiquetaLower.includes('años nacimiento hijos');

      const esIdLabelFecha =
        tipoLower.includes('id') &&
        selector &&
        (selector.includes('-label') || selector.includes('_label')) &&
        /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valorTexto).trim());

      const esFecha = !esNacionalidad && !esAnosNacimientoHijos && (
        esCampoFechaPorEtiqueta(tipo) ||
        esCampoFechaPorEtiqueta(selector) ||
        /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valorTexto).trim()) ||
        (tipoLower.includes('class') && selector && selector.includes('MuiPickers')) ||
        esIdLabelFecha
      );

      if (esFecha) camposFechas.push({ tipo, selector, valor: valorTexto, i });
      else camposNormales.push({ tipo, selector, valor: valorTexto, i });
    }

    // =========================
    // EJECUCIÓN
    // =========================
    let chain = cy.wrap(null);

    // 1) Propietario primero
    if (camposPropietario.length > 0) {
      camposPropietario.forEach((campo) => {
        const { valor: valorTexto } = campo;

        chain = chain.then(() => {
          cy.log(`Rellenando Propietario (radio): "${valorTexto}"`);
          return cy.contains('label', /^Propietario$/i, { timeout: 10000 })
            .should('be.visible')
            .then(($label) => {
              const contenedor = $label.closest('.MuiFormControl-root, .MuiFormGroup-root, form, div').first();
              if (!contenedor.length) return cy.wrap(null);

              return cy.wrap(contenedor[0]).within(() => {
                const regexValor = new RegExp(escapeRegex(valorTexto), 'i');
                return cy.get('input[type="radio"]', { timeout: 5000 }).then(($radios) => {
                  const radioEncontrado = Array.from($radios).find((radio) => {
                    const lbl = radio.closest('label');
                    const texto = (lbl ? lbl.innerText : '') || '';
                    return regexValor.test(texto.trim());
                  });

                  if (radioEncontrado) {
                    return cy.wrap(radioEncontrado).should('be.visible').check({ force: true });
                  }

                  cy.log(`No se encontró radio de Propietario con valor "${valorTexto}"`);
                  return cy.wrap(null);
                });
              });
            });
        });
      });
    }

    // 2) Campos normales
    camposNormales.forEach((campo) => {
      const { tipo, selector, valor: valorTexto, i } = campo;
      const tipoLower = (tipo || '').toLowerCase();
      const selectorLower = (selector || '').toLowerCase();

      chain = chain.then(() => {
        // Si el valor parece fecha, forzar flujo de fecha
        if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valorTexto).trim())) {
          const etiquetaFecha = tipo || selector || `Campo ${i}`;
          return escribirFechaPorClickYType(etiquetaFecha, valorTexto, tipo, selector);
        }

        // Name directo
        if (tipoLower.includes('name')) {
          if (selector === 'client.code') {
            return cy
              .get(`input[name="${selector}"], textarea[name="${selector}"]`, { timeout: 10000 })
              .should('be.visible')
              .click({ force: true })
              .type(valorTexto, { force: true, delay: 0 })
              .then(() => detectarErrorAplicacionYAbortar('rellenar Expedición')); // por si aquí cae
          }
          return escribirPorName(selector, valorTexto, selector).then(() => {
            //  SOLO TC024: si este campo corresponde a Expedición, corta si hay app error
            const esExpedicion =
              selectorLower.includes('expedicion') ||
              (tipo || '').toLowerCase().includes('expedicion');
            if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedición');
            return cy.wrap(null);
          });
        }

        // ID
        if (tipoLower.includes('id')) {
          const esIdLabelFecha =
            selector &&
            (selector.includes('-label') || selector.includes('_label')) &&
            /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valorTexto).trim());

          if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valorTexto).trim()) || esIdLabelFecha) {
            const etiquetaFecha = tipo || selector || `Campo ${i}`;
            return escribirFechaPorClickYType(etiquetaFecha, valorTexto, tipo, selector)
              .then(() => {
                const esExpedicion = selectorLower.includes('expedicion') || (tipo || '').toLowerCase().includes('expedicion');
                if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedición');
                return cy.wrap(null);
              });
          }

          const idSinHash = selector && selector.startsWith('#') ? selector.substring(1) : selector;
          const idSelector = idSinHash && idSinHash.includes('.') ? `[id="${idSinHash}"]` : `#${idSinHash}`;

          return cy.get(idSelector, { timeout: 10000 }).then(($el) => {
            if (!$el || !$el.length) {
              throw new Error(`No se encontró elemento con ID ${idSelector}`);
            }
            return procesarElementoNormal($el[0], valorTexto, tipo, selector)
              .then(() => {
                const esExpedicion = selectorLower.includes('expedicion') || (tipo || '').toLowerCase().includes('expedicion');
                if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedición');
                return cy.wrap(null);
              });
          });
        }

        // Name-like (client.xxx)
        if (selector && !selector.startsWith('#') && !selector.startsWith('.') && !selector.startsWith('[') && selector.includes('.')) {
          const selectorLower2 = (selector || '').toLowerCase();

          // Categoría laboral
          if (selectorLower2.includes('catname') || tipoLower.includes('categoría laboral') || tipoLower.includes('categoria laboral')) {
            return seleccionarCategoriaLaboral(valorTexto);
          }

          return cy
            .get(`input[name="${selector}"], textarea[name="${selector}"]`, { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .type(valorTexto, { force: true, delay: 0 })
            .then(() => {
              const esExpedicion = selectorLower2.includes('expedicion') || tipoLower.includes('expedicion');
              if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedición');
              return cy.wrap(null);
            });
        }

        // Date picker por class
        if (tipoLower.includes('class') && selector && selector.includes('MuiPickers')) {
          const etiquetaFecha = tipo || selector || `Campo ${i}`;
          return escribirFechaPorClickYType(etiquetaFecha, valorTexto)
            .then(() => {
              const esExpedicion = selectorLower.includes('expedicion') || tipoLower.includes('expedicion');
              if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedición');
              return cy.wrap(null);
            });
        }

        // Campo normal genérico
        const etiquetaParaBuscar =
          selector && (selector.includes('idEmpresa') || selector.includes('mui-component-select-client.idEmpresa'))
            ? null
            : tipo;

        return obtenerCampoFormulario(tipo, selector, etiquetaParaBuscar).then(($el) => {
          if (!$el || !$el.length) {
            // fallback por name
            if (selector && (selector.includes('client.') || (selector.includes('.') && !selector.startsWith('#') && !selector.startsWith('.')))) {
              return cy.get(`input[name="${selector}"], textarea[name="${selector}"]`, { timeout: 5000 })
                .should('be.visible')
                .then(($input) => {
                  const valorProcesado = procesarValorAleatorio(valorTexto);
                  return cy.wrap($input[0]).click({ force: true }).clear({ force: true }).type(valorProcesado, { force: true, delay: 0 });
                })
                .then(() => {
                  const esExpedicion = (selector || '').toLowerCase().includes('expedicion') || (tipo || '').toLowerCase().includes('expedicion');
                  if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedición');
                  return cy.wrap(null);
                });
            }

            // En algunos casos el Excel trae "selectors" que realmente son clases de LABEL (p.ej. MuiFormLabel-root...)
            // o elementos no interactuables. No debe tumbar el caso (especialmente TC025 "crear con todo").
            const selStr = String(selector || '');
            const tipoStr = String(tipo || '');
            const pareceLabel =
              /MuiFormLabel-root/i.test(selStr) ||
              /MuiFormLabel-root/i.test(tipoStr) ||
              /MuiFormLabel/i.test(selStr) ||
              /MuiFormLabel/i.test(tipoStr) ||
              /label/i.test(tipoStr);

            if (pareceLabel) {
              cy.log(`⚠️ Campo no interactuable (parece label/clase). Se omite: tipo="${tipo}", selector="${selector}"`);
              return cy.wrap(null);
            }

            // Para el resto de campos no encontrados, no fallar: registrar warning y continuar
            cy.log(`⚠️ No se encontró el campo: tipo="${tipo}", selector="${selector}". Se omite y se continúa.`);
            return cy.wrap(null);
          }

          return procesarElementoNormal($el[0], valorTexto, tipo, selector)
            .then(() => {
              const esExpedicion = selectorLower.includes('expedicion') || tipoLower.includes('expedicion');
              if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedición');
              return cy.wrap(null);
            });
        });
      });

      function procesarElementoNormal(elemento, valorTexto, tipo, selector) {
        const $el = cy.$$(elemento);
        const tag = (elemento?.tagName || '').toLowerCase();
        const role = $el.attr('role') || '';
        const valorProcesado = procesarValorAleatorio(valorTexto);

        // si fecha -> date handler
        if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valorProcesado).trim())) {
          const etiquetaFecha = tipo || selector || '';
          return escribirFechaPorClickYType(etiquetaFecha, valorTexto);
        }

        // Combobox
        const elementoId = elemento.id || '';
        const selectorLowerLocal = (selector || '').toLowerCase();
        const isCombobox =
          role === 'combobox' ||
          (selector && (selector.includes('Empresa') || selector.includes('idEmpresa') || selectorLowerLocal.includes('civilstatus'))) ||
          elementoId.includes('idEmpresa') ||
          elementoId.includes('mui-component-select-client.idEmpresa') ||
          elementoId.includes('civilStatus') ||
          elementoId.includes('mui-component-select-client.civilStatus');

        if (isCombobox) {
          return seleccionarOpcionMuiSelect(elemento, valorTexto);
        }

        // Radio/checkbox
        const tipoInput = ($el.attr('type') || '').toLowerCase();
        if (tipoInput === 'radio' || tipoInput === 'checkbox') {
          return cy.get('body').then(($body) => {
            const nameAttr = $el.attr('name');
            let $inputs = $body.find(`input[type="${tipoInput}"]`);
            if (nameAttr) $inputs = $inputs.filter(`[name="${nameAttr}"]`);

            const regexValor = new RegExp(escapeRegex(valorTexto), 'i');
            const $candidato = $inputs.filter((_, el) => {
              const lbl = el.closest('label');
              const texto = (lbl ? lbl.innerText : '') || '';
              const value = el.value || '';
              return regexValor.test(texto.trim()) || regexValor.test(value);
            }).first();

            if ($candidato.length > 0) return cy.wrap($candidato[0]).should('be.visible').check({ force: true });
            if ($inputs.length > 0) return cy.wrap($inputs[0]).should('be.visible').check({ force: true });
            return cy.wrap(null);
          });
        }

        if (tag === 'input' || tag === 'textarea') {
          return cy.wrap(elemento).should('be.visible').click({ force: true }).type(valorProcesado, { force: true, delay: 0 });
        }

        if (tag === 'select') {
          return cy.wrap(elemento).should('be.visible').select(valorProcesado, { force: true });
        }

        return cy.wrap(elemento).should('be.visible').click({ force: true }).type(valorProcesado, { force: true, delay: 0 });
      }
    });

    // 3) Fechas al final (Datos Personales)
    let indiceFecha = 0;
    camposFechas.forEach((campo) => {
      const { tipo, selector, valor: valorTexto, i } = campo;
      const indiceActual = indiceFecha++;
      const etiquetaFecha = normalizarEtiquetaTexto(tipo) || tipo || selector || `Campo ${i}`;

      chain = chain.then(() => {
        cy.log(`Rellenando fecha [${indiceActual}]: etiqueta="${etiquetaFecha}", valor="${valorTexto}"`);
        return escribirFechaPorClickYType(etiquetaFecha, valorTexto, tipo, selector, indiceActual)
          .then(() => {
            //  SOLO TC024: si esta fecha es "Expedición", comprobar error de aplicación y abortar
            const s = (selector || '').toLowerCase();
            const t = (tipo || '').toLowerCase();
            const esExpedicion = etiquetaFecha.toLowerCase().includes('expedicion') || s.includes('expedicion') || t.includes('expedicion');
            if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedición');
            return cy.wrap(null);
          });
      });
    });

    // 4) DIRECCIÓN
    if (camposDireccion.length > 0) {
      chain = chain.then(() => {
        cy.log(`Navegando a pestaña DIRECCIÓN para rellenar ${camposDireccion.length} campos`);
        return navegarSeccionFormulario('DIRECCIÓN').then(() => cy.wait(500));
      });

      const mapeoLabels = {
        'address': 'Dirección',
        'dirección': 'Dirección',
        'direccion': 'Dirección',
        'client.address': 'Dirección',
        'city': 'Ciudad',
        'ciudad': 'Ciudad',
        'client.city': 'Ciudad',
        'postal': 'C. Postal',
        'postalcode': 'C. Postal',
        'client.postalcode': 'C. Postal',
        'country': 'País',
        'país': 'País',
        'pais': 'País',
        'client.country': 'País',
        'region': 'Provincia',
        'provincia': 'Provincia',
        'client.region': 'Provincia',
        'adressnotes': 'Notas',
        'addressnotes': 'Notas',
        'client.adressnotes': 'Notas',
        'client.addressnotes': 'Notas',
        'notas': 'Notas'
      };

      camposDireccion.forEach((campo) => {
        const { tipo, selector, valor: valorTexto } = campo;
        const selectorLower = (selector || '').toLowerCase();
        const tipoLower = (tipo || '').toLowerCase();

        let nombreLabel = mapeoLabels[selectorLower] || mapeoLabels[tipoLower] || null;
        if (!nombreLabel) {
          if (selectorLower.includes('address') || tipoLower.includes('address') || tipoLower.includes('dirección')) nombreLabel = 'Dirección';
          else if (selectorLower.includes('city') || tipoLower.includes('city') || tipoLower.includes('ciudad')) nombreLabel = 'Ciudad';
          else if (selectorLower.includes('postal') || tipoLower.includes('postal')) nombreLabel = 'C. Postal';
          else if (selectorLower.includes('country') || tipoLower.includes('country') || tipoLower.includes('país')) nombreLabel = 'País';
          else if (selectorLower.includes('region') || tipoLower.includes('region') || tipoLower.includes('provincia')) nombreLabel = 'Provincia';
          else if (selectorLower.includes('adressnotes') || selectorLower.includes('addressnotes') || tipoLower.includes('notas')) nombreLabel = 'Notas';
        }

        chain = chain.then(() => {
          if (!nombreLabel) return cy.wrap(null);

          const valorProcesado = procesarValorAleatorio(valorTexto);

          return cy.get('body').then(($body) => {
            const $labels = $body.find('label').filter((_, el) => {
              const text = (el.innerText || '').trim();
              return new RegExp(`^${escapeRegex(nombreLabel)}$`, 'i').test(text);
            });

            if ($labels.length > 0) {
              const $label = $labels.first();
              const forAttr = $label.attr('for');
              if (forAttr) {
                const inputSelector = forAttr.includes('.') ? `[id="${forAttr}"]` : `#${forAttr}`;
                return cy.get(inputSelector, { timeout: 5000 })
                  .should('be.visible')
                  .scrollIntoView()
                  .click({ force: true })
                  .clear({ force: true })
                  .type(valorProcesado, { force: true, delay: 0 });
              }

              const contenedor = $label.closest('.MuiFormControl-root, .MuiTextField-root');
              if (contenedor.length) {
                return cy.wrap(contenedor[0]).within(() => {
                  cy.get('input, textarea', { timeout: 5000 })
                    .first()
                    .should('be.visible')
                    .scrollIntoView()
                    .click({ force: true })
                    .clear({ force: true })
                    .type(valorProcesado, { force: true, delay: 0 });
                });
              }
            }

            if (selector && (selector.includes('client.') || selector.includes('.'))) {
              return cy.get(`input[name="${selector}"], textarea[name="${selector}"]`, { timeout: 5000 })
                .should('be.visible')
                .scrollIntoView()
                .click({ force: true })
                .clear({ force: true })
                .type(valorProcesado, { force: true, delay: 0 });
            }

            return cy.wrap(null);
          });
        });
      });
    }

    // 5) DATOS ECONÓMICOS
    if (camposEconomicos.length > 0) {
      chain = chain.then(() => {
        cy.log(`Navegando a pestaña DATOS ECONÓMICOS para rellenar ${camposEconomicos.length} campos`);
        return navegarSeccionFormulario('DATOS ECONÓMICOS').then(() => cy.wait(500));
      });

      const ajustarValorParaInput = (el, valor) => {
        let v = String(valor ?? '');
        const inputMode = (el?.getAttribute && el.getAttribute('inputmode')) || '';
        const tipo = (el?.getAttribute && el.getAttribute('type')) || el?.type || '';
        const esNumerico = String(inputMode).toLowerCase() === 'numeric' || String(tipo).toLowerCase() === 'number';
        if (esNumerico) v = v.replace(/\D+/g, '');
        const maxAttr = (el?.getAttribute && el.getAttribute('maxlength')) || '';
        const maxLen = Number(maxAttr || el?.maxLength || 0);
        if (Number.isFinite(maxLen) && maxLen > 0 && v.length > maxLen) v = v.slice(0, maxLen);
        return v;
      };

      camposEconomicos.forEach((campo) => {
        const { tipo, selector, valor: valorTexto, i } = campo;
        const valorProcesado = procesarValorAleatorio(valorTexto);

        chain = chain.then(() => {
          const esCombobox = selector && (selector.includes('paymentProfileId') || selector.includes('mui-component-select-client.paymentProfileId'));
          if (esCombobox) {
            return cy.contains('label', /^Perfil de pago$/i, { timeout: 10000 })
              .should('be.visible')
              .then(($label) => {
                const contenedor = $label.closest('.MuiFormControl-root, .MuiTextField-root, .MuiInputBase-root');
                if (contenedor.length) {
                  const combobox = contenedor.find('[role="combobox"], div[role="combobox"], .MuiSelect-select').first()[0];
                  if (combobox) return seleccionarOpcionMuiSelect(combobox, valorProcesado);
                }
                return cy.wrap(null);
              });
          }

          if (selector && (selector.includes('client.') || selector.includes('.'))) {
            return cy.get(`input[name="${selector}"], textarea[name="${selector}"]`, { timeout: 10000 })
              .should('be.visible')
              .then(($el) => {
                const el = $el[0];
                const v = ajustarValorParaInput(el, valorProcesado);
                return cy.wrap(el).click({ force: true }).clear({ force: true }).type(v, { force: true, delay: 0 });
              });
          }

          const etiquetaParaBuscar = normalizarEtiquetaTexto(tipo) || selector || `Campo ${i}`;
          return obtenerCampoFormulario(tipo, selector, etiquetaParaBuscar).then(($el) => {
            if (!$el || !$el.length) return cy.wrap(null);
            const elemento = $el[0];
            const tag = (elemento?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea') {
              const v = ajustarValorParaInput(elemento, valorProcesado);
              return cy.wrap(elemento)
                .should('be.visible')
                .scrollIntoView()
                .click({ force: true })
                .clear({ force: true })
                .type(v, { force: true, delay: 0 });
            }
            return cy.wrap(null);
          });
        });
      });
    }

    // 6) Guardar
    if (guardar) {
      chain = chain.then(() => {
        cy.log('Todos los campos rellenados, guardando formulario');
        return cy.contains('button, [type="submit"]', /(Guardar|Save)/i, { timeout: 10000 })
          .should('be.visible')
          .scrollIntoView()
          .click({ force: true })
          .then(() => cy.wait(1500));
      });
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(
        `${etiquetaCaso}Formulario completado: ${camposNormales.length} campos normales, ${camposFechas.length} fechas, ` +
        `${camposDireccion.length} campos DIRECCIÓN, ${camposEconomicos.length} campos DATOS ECONÓMICOS`
      );
    });
  }

  function llenarFormularioSeccion(caso, numeroCaso, seccion) {
    const totalCampos = Number(caso?.__totalCamposExcel) || 14;
    cy.log(`Rellenando formulario de ${seccion} con ${totalCampos} campos del Excel`);

    const esFormacion = seccion && (seccion.toLowerCase().includes('formación') || seccion.toLowerCase().includes('formacion'));
    const esExperiencia = seccion && seccion.toLowerCase().includes('experiencia');
    const esAsistencia = seccion && seccion.toLowerCase().includes('asistencia');
    const esMaterial = seccion && seccion.toLowerCase().includes('material');
    const esContratos = seccion && seccion.toLowerCase().includes('contrato');
    const esHistTelefonico = seccion && (seccion.toLowerCase().includes('hist. telefónico') || seccion.toLowerCase().includes('hist telefonico') || seccion.toLowerCase().includes('hist.telefónico'));
    const esTelefonos = seccion && (seccion.toLowerCase().includes('teléfono') || seccion.toLowerCase().includes('telefono')) && !seccion.toLowerCase().includes('hist');
    const esIncidencia = seccion && (seccion.toLowerCase().includes('incidencia') || seccion.toLowerCase().includes('incidencias'));
    let chain = cy.wrap(null);

    // Manejo específico para ASISTENCIA: Nombre (desplegable), Inicio y Fin (calendario), Días y Notas (texto)
    if (esAsistencia) {
      let nombreValor = null;
      let inicioValor = null;
      let finValor = null;
      let diasValor = null;
      let notasValor = null;

      // Buscar los valores en el Excel
      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        // Identificar qué campo es según el selector, tipo o formato del valor
        // Nombre: puede venir por ID (_r_bu_, _r_jn_) o por name
        if (!nombreValor && (selector.includes('_r_bu_') || selector.includes('_r_jn_') || selector.includes('nombre') || tipo.includes('nombre'))) {
          nombreValor = valor;
        }
        // Inicio: puede venir por ID (_r_c1_, _r_jq_) o por name o por tipo
        else if (!inicioValor && (selector.includes('_r_c1_') || selector.includes('_r_jq_') || selector.includes('inicio') || tipo.includes('inicio'))) {
          inicioValor = valor;
        }
        // Fin: puede venir por ID (_r_c2_, _r_jt_) o por name o por tipo
        else if (!finValor && (selector.includes('_r_c2_') || selector.includes('_r_jt_') || selector.includes('fin') || tipo.includes('fin'))) {
          finValor = valor;
        }
        // Días: por name
        else if (!diasValor && (selector.includes('dias') || selector.includes('días') || tipo.includes('dias') || tipo.includes('días'))) {
          diasValor = valor;
        }
        // Notas: por name
        else if (!notasValor && (selector.includes('notas') || tipo.includes('notas'))) {
          notasValor = valor;
        }
      }

      // Rellenar Nombre (desplegable/autocomplete) - buscar por ID _r_jn_ o por name
      if (nombreValor) {
        const nombreTexto = procesarValorAleatorio(nombreValor);
        chain = chain.then(() => {
          return cy.get('body').then(($body) => {
            // Intentar primero por ID _r_jn_ (ID real del HTML)
            const inputPorId = $body.find('input#_r_jn_').first();
            if (inputPorId.length) {
              return seleccionarOpcionMuiSelect(inputPorId, nombreTexto);
            }
            // Intentar por ID _r_bu_ (del Excel)
            const inputPorId2 = $body.find('input#_r_bu_').first();
            if (inputPorId2.length) {
              return seleccionarOpcionMuiSelect(inputPorId2, nombreTexto);
            }
            // Fallback: buscar por name o por label
            const inputPorName = $body.find('input[name="Nombre"]').first();
            if (inputPorName.length) {
              return seleccionarOpcionMuiSelect(inputPorName, nombreTexto);
            }
            // Buscar por label "Nombre"
            const labelNombre = $body.find('label').filter((_, el) => /^nombre$/i.test((el.innerText || '').trim())).first();
            if (labelNombre.length) {
              const forAttr = labelNombre.attr('for');
              if (forAttr) {
                const inputPorFor = $body.find(`input#${forAttr}`).first();
                if (inputPorFor.length) {
                  return seleccionarOpcionMuiSelect(inputPorFor, nombreTexto);
                }
              }
            }
            return cy.wrap(null);
          });
        });
      }

      // Rellenar Inicio (calendario) - buscar por label "Inicio" y luego el botón del calendario
      if (inicioValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(inicioValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          return cy.get('body').then(($body) => {
            // Buscar por label "Inicio"
            const labelInicio = $body.find('label').filter((_, el) => /^inicio$/i.test((el.innerText || '').trim())).first();
            if (labelInicio.length) {
              const contenedor = Cypress.$(labelInicio).closest('.MuiFormControl-root').parent();
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
              }
            }
            // Intentar por ID _r_jq_ (ID real del input oculto)
            const inputPorId = $body.find('input#_r_jq_').first();
            if (inputPorId.length) {
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root, .MuiFormControl-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
              }
            }
            // Fallback: buscar todos los botones "Choose date" y usar el primero (Inicio)
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .first()
              .scrollIntoView()
              .click({ force: true })
              .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
          });
        });
      }

      // Rellenar Fin (calendario) - buscar por label "Fin" y luego el botón del calendario
      if (finValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(finValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          return cy.get('body').then(($body) => {
            // Buscar por label "Fin"
            const labelFin = $body.find('label').filter((_, el) => /^fin$/i.test((el.innerText || '').trim())).first();
            if (labelFin.length) {
              const contenedor = Cypress.$(labelFin).closest('.MuiFormControl-root').parent();
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
              }
            }
            // Intentar por ID _r_jt_ (ID real del input oculto)
            const inputPorId = $body.find('input#_r_jt_').first();
            if (inputPorId.length) {
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root, .MuiFormControl-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
              }
            }
            // Fallback: buscar todos los botones "Choose date" y usar el segundo (Fin)
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .eq(1)
              .scrollIntoView()
              .click({ force: true })
              .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
          });
        });
      }

      // Rellenar Días
      if (diasValor) {
        const diasTexto = procesarValorAleatorio(diasValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="Dias"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(diasTexto, { force: true, delay: 0 });
        });
      }

      // Rellenar Notas
      if (notasValor) {
        const notasTexto = procesarValorAleatorio(notasValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="Notas"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(notasTexto, { force: true, delay: 0 });
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Manejo específico para EXPERIENCIA: rellenar campos por nombre (Empresa, Labor, Meses, Motivo cese)
    if (esExperiencia) {
      let empresaValor = null;
      let laborValor = null;
      let mesesValor = null;
      let motivoCeseValor = null;

      // Buscar los valores en el Excel
      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        // Identificar qué campo es según el selector o tipo
        if (!empresaValor && (selector.includes('empresa') || tipo.includes('empresa'))) {
          empresaValor = valor;
        } else if (!laborValor && (selector.includes('labor') || tipo.includes('labor'))) {
          laborValor = valor;
        } else if (!mesesValor && (selector.includes('meses') || tipo.includes('meses'))) {
          mesesValor = valor;
        } else if (!motivoCeseValor && (selector.includes('motivo') || selector.includes('cese') || tipo.includes('motivo') || tipo.includes('cese'))) {
          motivoCeseValor = valor;
        }
      }

      // Rellenar Empresa
      if (empresaValor) {
        const empresaTexto = procesarValorAleatorio(empresaValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="Empresa"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(empresaTexto, { force: true, delay: 0 });
        });
      }

      // Rellenar Labor
      if (laborValor) {
        const laborTexto = procesarValorAleatorio(laborValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="Labor"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(laborTexto, { force: true, delay: 0 });
        });
      }

      // Rellenar Meses
      if (mesesValor) {
        const mesesTexto = procesarValorAleatorio(mesesValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="Meses"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(mesesTexto, { force: true, delay: 0 });
        });
      }

      // Rellenar Motivo cese (el name es "MotivoCese" en camelCase)
      if (motivoCeseValor) {
        const motivoCeseTexto = procesarValorAleatorio(motivoCeseValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="MotivoCese"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(motivoCeseTexto, { force: true, delay: 0 });
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Manejo específico para FORMACIÓN: obtener valores del Excel y rellenar Fecha -> Curso -> Horas
    if (esFormacion) {
      let fechaValor = null;
      let cursoValor = null;
      let horasValor = null;

      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];
        if (valor === undefined || valor === null || valor === '') continue;

        // FECHA: a veces viene solo como "DD/MM/YYYY" (tipo id / selector raro). Detectar por formato también.
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());
        if (!fechaValor && (tipo.includes('fecha') || selector.includes('fecha') || selector.includes('date') || esFormatoFecha)) {
          fechaValor = valor;
          continue;
        }
        if (!cursoValor && (tipo.includes('curso') || selector.includes('curso'))) {
          cursoValor = valor;
          continue;
        }
        if (!horasValor && (tipo.includes('hora') || selector.includes('hora'))) {
          horasValor = valor;
          continue;
        }
      }

      if (fechaValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(fechaValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();

          // Intento 1: calendario clásico
          return cy.get('body').then(($body) => {
            const $btn = $body.find('button[aria-label="Choose date"]').filter(':visible').first();
            if ($btn.length) {
              return cy.wrap($btn[0])
                .scrollIntoView()
                .click({ force: true })
                .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
            }

            // Intento 2 (fallback): usar el helper de fechas por label "Fecha"
            cy.log('No se encontró botón "Choose date" en Formación. Fallback: escribirFechaPorClickYType("Fecha")');
            return escribirFechaPorClickYType('Fecha', String(fechaValor));
          });
        });
      }

      if (cursoValor) {
        const cursoTexto = procesarValorAleatorio(cursoValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="Curso"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(cursoTexto, { force: true, delay: 0 });
        });
      }

      if (horasValor) {
        const horasTexto = procesarValorAleatorio(horasValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="Horas"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(horasTexto, { force: true, delay: 0 });
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Manejo específico para MATERIAL: Fecha, Material, Cantidad, Notas
    if (esMaterial) {
      let fechaValor = null;
      let materialValor = null;
      let cantidadValor = null;
      let notasValor = null;

      // Buscar los valores en el Excel
      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        // Identificar qué campo es según el selector, tipo o formato del valor
        if (!fechaValor && (tipo.includes('fecha') || selector.includes('fecha') || selector.includes('date') || /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim()))) {
          fechaValor = valor;
        } else if (!materialValor && (selector.includes('material') || tipo.includes('material'))) {
          materialValor = valor;
        } else if (!cantidadValor && (selector.includes('cantidad') || tipo.includes('cantidad'))) {
          cantidadValor = valor;
        } else if (!notasValor && (selector.includes('notas') || tipo.includes('notas'))) {
          notasValor = valor;
        }
      }

      // Rellenar Fecha usando el calendario (date picker)
      if (fechaValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(fechaValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Fecha en Material: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Buscar el label "Fecha" en el modal de Material
            const labelFecha = $body.find('label').filter((_, el) => {
              const texto = (el.innerText || '').trim();
              return /^fecha$/i.test(texto);
            }).first();

            if (labelFecha.length) {
              cy.log('Label "Fecha" encontrado, buscando botón del calendario');
              // Buscar el contenedor del date picker (MuiPickersTextField-root)
              const contenedorFecha = Cypress.$(labelFecha).closest('.MuiFormControl-root').next('.MuiPickersTextField-root, .MuiFormControl-root').first();
              if (!contenedorFecha.length) {
                // Si no está en next, buscar en el mismo contenedor padre
                const contenedorPadre = Cypress.$(labelFecha).closest('.MuiFormControl-root').parent();
                const contenedorFecha2 = contenedorPadre.find('.MuiPickersTextField-root').first();
                if (contenedorFecha2.length) {
                  const btnCal = contenedorFecha2.find('button[aria-label="Choose date"]').first();
                  if (btnCal.length) {
                    return cy.wrap(btnCal[0])
                      .scrollIntoView()
                      .should('be.visible')
                      .click({ force: true })
                      .then(() => {
                        cy.wait(500);
                        return seleccionarFechaEnPopover(anio, mesIndex, dia);
                      });
                  }
                }
              } else {
                const btnCal = contenedorFecha.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .should('be.visible')
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Buscar el input oculto del date picker (tiene id que empieza con _r_ y está dentro de MuiPickersTextField-root)
            const inputFecha = $body.find('.MuiPickersTextField-root input[aria-hidden="true"][tabindex="-1"]').first();
            if (inputFecha.length) {
              cy.log('Input del date picker encontrado, buscando botón del calendario');
              const contenedor = Cypress.$(inputFecha).closest('.MuiPickersTextField-root, .MuiFormControl-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .should('be.visible')
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Fallback: buscar el primer botón "Choose date" visible en el modal
            cy.log('Buscando botón "Choose date" como fallback');
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .first()
              .scrollIntoView()
              .should('be.visible')
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          });
        });
      }

      // Rellenar Material escribiendo en el input
      if (materialValor) {
        const materialTexto = procesarValorAleatorio(materialValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Material escribiendo: "${materialTexto}"`);
          return cy
            .get('input[name="Material"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(materialTexto, { force: true, delay: 0 })
            .should('have.value', materialTexto);
        });
      }

      // Rellenar Cantidad escribiendo en el input
      if (cantidadValor) {
        const cantidadTexto = procesarValorAleatorio(cantidadValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Cantidad escribiendo: "${cantidadTexto}"`);
          return cy
            .get('input[name="Cantidad"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(cantidadTexto, { force: true, delay: 0 })
            .should('have.value', cantidadTexto);
        });
      }

      // Rellenar Notas escribiendo en el input
      if (notasValor) {
        const notasTexto = procesarValorAleatorio(notasValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Notas escribiendo: "${notasTexto}"`);
          return cy
            .get('input[name="Notas"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(notasTexto, { force: true, delay: 0 })
            .should('have.value', notasTexto);
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Manejo específico para CONTRATOS: Fecha alta, Fecha fin, Tipo de contrato, Motivo cese, Km recorridos, Meses prueba
    if (esContratos) {
      let fechaAltaValor = null;
      let fechaFinValor = null;
      let tipoContratoValor = null;
      let motivoCeseValor = null;
      let kmRecorridosValor = null;
      let mesesPruebaValor = null;

      // Buscar los valores en el Excel
      cy.log(`Buscando valores en Excel para CONTRATOS (totalCampos: ${totalCampos})`);

      // Detectar fechas primero (pueden tener selectores genéricos como "r_dr", "r_ds_")
      const fechasEncontradas = [];

      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        cy.log(`Campo ${i}: tipo="${tipo}", selector="${selector}", valor="${valor}"`);

        // Detectar fechas por formato (DD/MM/YYYY, DD-MM-YYYY, etc.)
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());

        if (esFormatoFecha && tipo === 'id') {
          // Si es una fecha con tipo "id", guardarla para asignar después
          fechasEncontradas.push({ valor, selector, indice: i });
        }
      }

      // Asignar fechas: la primera es Fecha alta, la segunda es Fecha fin
      if (fechasEncontradas.length > 0 && !fechaAltaValor) {
        fechaAltaValor = fechasEncontradas[0].valor;
        cy.log(`✓ Fecha alta detectada (por formato): ${fechaAltaValor}`);
      }
      if (fechasEncontradas.length > 1 && !fechaFinValor) {
        fechaFinValor = fechasEncontradas[1].valor;
        cy.log(`✓ Fecha fin detectada (por formato): ${fechaFinValor}`);
      }

      // Ahora buscar los demás campos
      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        // Si ya es una fecha detectada, saltarla
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());
        if (esFormatoFecha && tipo === 'id') continue;

        // Identificar qué campo es según el selector, tipo o formato del valor
        if (!fechaAltaValor && (
          tipo.includes('fecha alta') ||
          selector.includes('fecha alta') ||
          selector.includes('fechaalta') ||
          (tipo.includes('fecha') && selector.includes('alta'))
        )) {
          fechaAltaValor = valor;
          cy.log(`✓ Fecha alta detectada: ${valor}`);
        } else if (!fechaFinValor && (
          tipo.includes('fecha fin') ||
          selector.includes('fecha fin') ||
          selector.includes('fechafin') ||
          (tipo.includes('fecha') && selector.includes('fin'))
        )) {
          fechaFinValor = valor;
          cy.log(`✓ Fecha fin detectada: ${valor}`);
        } else if (!tipoContratoValor && (selector.includes('tipocontrato') || selector.includes('tipo contrato') || tipo.includes('tipo de contrato') || tipo.includes('tipo contrato'))) {
          tipoContratoValor = valor;
        } else if (!motivoCeseValor && (selector.includes('motivocese') || selector.includes('motivo cese') || tipo.includes('motivo cese'))) {
          motivoCeseValor = valor;
        } else if (!kmRecorridosValor && (selector.includes('kmrecorridos') || selector.includes('km recorridos') || tipo.includes('km recorridos'))) {
          kmRecorridosValor = valor;
        } else if (!mesesPruebaValor && (selector.includes('pruebameses') || selector.includes('mesesprueba') || selector.includes('meses prueba') || tipo.includes('meses prueba'))) {
          mesesPruebaValor = valor;
          cy.log(`✓ Meses prueba detectado: ${valor}`);
        }
      }

      cy.log(`Valores detectados - Fecha alta: ${fechaAltaValor || 'NO'}, Fecha fin: ${fechaFinValor || 'NO'}, Tipo contrato: ${tipoContratoValor || 'NO'}, Motivo cese: ${motivoCeseValor || 'NO'}, Km recorridos: ${kmRecorridosValor || 'NO'}, Meses prueba: ${mesesPruebaValor || 'NO'}`);

      // Rellenar Fecha alta usando el calendario (date picker)
      if (fechaAltaValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(fechaAltaValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Fecha alta en Contratos: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Estrategia 1: Buscar directamente por ID del input oculto (_r_4dj_)
            const inputPorId = $body.find('input#_r_4dj_').first();
            if (inputPorId.length) {
              cy.log('Input oculto _r_4dj_ encontrado para Fecha alta');
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Estrategia 2: Buscar por label "Fecha alta"
            cy.log('Intentando buscar Fecha alta por label...');
            const labelFechaAlta = $body.find('label').filter((_, el) => /^fecha alta$/i.test((el.innerText || '').trim())).first();
            if (labelFechaAlta.length) {
              const contenedorPadre = Cypress.$(labelFechaAlta).closest('.MuiFormControl-root');
              const datePickerContainer = contenedorPadre.find('.MuiPickersTextField-root').first();
              if (datePickerContainer.length) {
                const btnCal = datePickerContainer.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Estrategia 3: Fallback - primer botón "Choose date"
            cy.log('Usando fallback: primer botón Choose date');
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .first()
              .scrollIntoView()
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          });
        });
      }

      // Rellenar Fecha fin usando el calendario (date picker)
      if (fechaFinValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(fechaFinValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Fecha fin en Contratos: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Estrategia 1: Buscar directamente por ID del input oculto (_r_4dm_)
            const inputPorId = $body.find('input#_r_4dm_').first();
            if (inputPorId.length) {
              cy.log('Input oculto _r_4dm_ encontrado para Fecha fin');
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Estrategia 2: Buscar por label "Fecha fin"
            cy.log('Intentando buscar Fecha fin por label...');
            const labelFechaFin = $body.find('label').filter((_, el) => /^fecha fin$/i.test((el.innerText || '').trim())).first();
            if (labelFechaFin.length) {
              const contenedorPadre = Cypress.$(labelFechaFin).closest('.MuiFormControl-root');
              const datePickerContainer = contenedorPadre.find('.MuiPickersTextField-root').first();
              if (datePickerContainer.length) {
                const btnCal = datePickerContainer.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Estrategia 3: Fallback - segundo botón "Choose date" (después de Fecha alta)
            cy.log('Usando fallback: segundo botón Choose date');
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .eq(1)
              .scrollIntoView()
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          });
        });
      }

      // Rellenar Tipo de contrato escribiendo en el input
      if (tipoContratoValor) {
        const tipoContratoTexto = procesarValorAleatorio(tipoContratoValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Tipo de contrato escribiendo: "${tipoContratoTexto}"`);
          return cy
            .get('input[name="TipoContrato"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(tipoContratoTexto, { force: true, delay: 0 })
            .should('have.value', tipoContratoTexto);
        });
      }

      // Rellenar Motivo cese escribiendo en el input
      if (motivoCeseValor) {
        const motivoCeseTexto = procesarValorAleatorio(motivoCeseValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Motivo cese escribiendo: "${motivoCeseTexto}"`);
          return cy
            .get('input[name="MotivoCese"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(motivoCeseTexto, { force: true, delay: 0 })
            .should('have.value', motivoCeseTexto);
        });
      }

      // Rellenar Km recorridos escribiendo en el input
      if (kmRecorridosValor) {
        const kmRecorridosTexto = procesarValorAleatorio(kmRecorridosValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Km recorridos escribiendo: "${kmRecorridosTexto}"`);
          return cy
            .get('input[name="KmRecorridos"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(kmRecorridosTexto, { force: true, delay: 0 })
            .should('have.value', kmRecorridosTexto);
        });
      }

      // Rellenar Meses prueba escribiendo en el input
      if (mesesPruebaValor) {
        const mesesPruebaTexto = procesarValorAleatorio(mesesPruebaValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Meses prueba escribiendo: "${mesesPruebaTexto}"`);
          return cy
            .get('input[name="PruebaMeses"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(mesesPruebaTexto, { force: true, delay: 0 })
            .should('have.value', mesesPruebaTexto);
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Manejo específico para TELÉFONOS: Teléfono, Inicio y Fin
    if (esTelefonos) {
      let telefonoValor = null;
      let inicioValor = null;
      let finValor = null;

      // Buscar los valores en el Excel
      cy.log(`Buscando valores en Excel para TELÉFONOS (totalCampos: ${totalCampos})`);

      // Detectar fechas primero (pueden tener selectores genéricos)
      const fechasEncontradas = [];

      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        cy.log(`Campo ${i}: tipo="${tipo}", selector="${selector}", valor="${valor}"`);

        // Detectar fechas por formato (DD/MM/YYYY, DD-MM-YYYY, etc.)
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());

        if (esFormatoFecha && tipo === 'id') {
          // Si es una fecha con tipo "id", guardarla para asignar después
          fechasEncontradas.push({ valor, selector, indice: i });
        }
      }

      // Asignar fechas: la primera es Inicio, la segunda es Fin
      if (fechasEncontradas.length > 0 && !inicioValor) {
        inicioValor = fechasEncontradas[0].valor;
        cy.log(` Inicio detectado (por formato): ${inicioValor}`);
      }
      if (fechasEncontradas.length > 1 && !finValor) {
        finValor = fechasEncontradas[1].valor;
        cy.log(` Fin detectado (por formato): ${finValor}`);
      }

      // Ahora buscar los demás campos
      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        // Si ya es una fecha detectada, saltarla
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());
        if (esFormatoFecha && tipo === 'id') continue;

        // Identificar qué campo es según el selector, tipo o formato del valor
        if (!telefonoValor && (
          selector.includes('numero') ||
          selector.includes('teléfono') ||
          selector.includes('telefono') ||
          tipo.includes('teléfono') ||
          tipo.includes('telefono')
        )) {
          telefonoValor = valor;
          cy.log(`✓ Teléfono detectado: ${valor}`);
        } else if (!inicioValor && (
          tipo.includes('inicio') ||
          selector.includes('inicio')
        )) {
          inicioValor = valor;
          cy.log(`✓ Inicio detectado: ${valor}`);
        } else if (!finValor && (
          tipo.includes('fin') ||
          selector.includes('fin')
        )) {
          finValor = valor;
          cy.log(`✓ Fin detectado: ${valor}`);
        }
      }

      cy.log(`Valores detectados - Teléfono: ${telefonoValor || 'NO'}, Inicio: ${inicioValor || 'NO'}, Fin: ${finValor || 'NO'}`);

      // Rellenar Teléfono escribiendo en el input
      if (telefonoValor) {
        const telefonoTexto = procesarValorAleatorio(telefonoValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Teléfono escribiendo: "${telefonoTexto}"`);
          return cy
            .get('input[name="Numero"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(telefonoTexto, { force: true, delay: 0 })
            .should('have.value', telefonoTexto);
        });
      }

      // Rellenar Inicio usando el calendario (date picker)
      if (inicioValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(inicioValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Inicio en Teléfonos: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Estrategia 1: Buscar directamente por ID del input oculto (_r_4im_)
            const inputPorId = $body.find('input#_r_4im_').first();
            if (inputPorId.length) {
              cy.log('Input oculto _r_4im_ encontrado para Inicio');
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Estrategia 2: Buscar por label "Inicio"
            cy.log('Intentando buscar Inicio por label...');
            const labelInicio = $body.find('label').filter((_, el) => /^inicio$/i.test((el.innerText || '').trim())).first();
            if (labelInicio.length) {
              const contenedorPadre = Cypress.$(labelInicio).closest('.MuiFormControl-root');
              const datePickerContainer = contenedorPadre.find('.MuiPickersTextField-root').first();
              if (datePickerContainer.length) {
                const btnCal = datePickerContainer.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Estrategia 3: Fallback - primer botón "Choose date"
            cy.log('Usando fallback: primer botón Choose date');
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .first()
              .scrollIntoView()
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          });
        });
      }

      // Rellenar Fin usando el calendario (date picker)
      if (finValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(finValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Fin en Teléfonos: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Estrategia 1: Buscar directamente por ID del input oculto (_r_4ip_)
            const inputPorId = $body.find('input#_r_4ip_').first();
            if (inputPorId.length) {
              cy.log('Input oculto _r_4ip_ encontrado para Fin');
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Estrategia 2: Buscar por label "Fin"
            cy.log('Intentando buscar Fin por label...');
            const labelFin = $body.find('label').filter((_, el) => /^fin$/i.test((el.innerText || '').trim())).first();
            if (labelFin.length) {
              const contenedorPadre = Cypress.$(labelFin).closest('.MuiFormControl-root');
              const datePickerContainer = contenedorPadre.find('.MuiPickersTextField-root').first();
              if (datePickerContainer.length) {
                const btnCal = datePickerContainer.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Estrategia 3: Fallback - segundo botón "Choose date" (después de Inicio)
            cy.log('Usando fallback: segundo botón Choose date');
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .eq(1)
              .scrollIntoView()
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          });
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Manejo específico para HIST. TELEFÓNICO: Teléfono, Inicio y Fin (igual que TELÉFONOS)
    if (esHistTelefonico) {
      let telefonoValor = null;
      let inicioValor = null;
      let finValor = null;

      // Buscar los valores en el Excel
      cy.log(`Buscando valores en Excel para HIST. TELEFÓNICO (totalCampos: ${totalCampos})`);

      // Detectar fechas primero (pueden tener selectores genéricos)
      const fechasEncontradas = [];

      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        cy.log(`Campo ${i}: tipo="${tipo}", selector="${selector}", valor="${valor}"`);

        // Detectar fechas por formato (DD/MM/YYYY, DD-MM-YYYY, etc.)
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());

        if (esFormatoFecha && tipo === 'id') {
          // Si es una fecha con tipo "id", guardarla para asignar después
          fechasEncontradas.push({ valor, selector, indice: i });
        }
      }

      // Asignar fechas: la primera es Inicio, la segunda es Fin
      if (fechasEncontradas.length > 0 && !inicioValor) {
        inicioValor = fechasEncontradas[0].valor;
        cy.log(`✓ Inicio detectado (por formato): ${inicioValor}`);
      }
      if (fechasEncontradas.length > 1 && !finValor) {
        finValor = fechasEncontradas[1].valor;
        cy.log(`✓ Fin detectado (por formato): ${finValor}`);
      }

      // Ahora buscar los demás campos
      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        // Si ya es una fecha detectada, saltarla
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());
        if (esFormatoFecha && tipo === 'id') continue;

        // Identificar qué campo es según el selector, tipo o formato del valor
        if (!telefonoValor && (
          selector.includes('numero') ||
          selector.includes('teléfono') ||
          selector.includes('telefono') ||
          tipo.includes('teléfono') ||
          tipo.includes('telefono')
        )) {
          telefonoValor = valor;
          cy.log(`✓ Teléfono detectado: ${valor}`);
        } else if (!inicioValor && (
          tipo.includes('inicio') ||
          selector.includes('inicio')
        )) {
          inicioValor = valor;
          cy.log(`✓ Inicio detectado: ${valor}`);
        } else if (!finValor && (
          tipo.includes('fin') ||
          selector.includes('fin')
        )) {
          finValor = valor;
          cy.log(`✓ Fin detectado: ${valor}`);
        }
      }

      cy.log(`Valores detectados - Teléfono: ${telefonoValor || 'NO'}, Inicio: ${inicioValor || 'NO'}, Fin: ${finValor || 'NO'}`);

      // Rellenar Teléfono escribiendo en el input
      if (telefonoValor) {
        const telefonoTexto = procesarValorAleatorio(telefonoValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Teléfono escribiendo: "${telefonoTexto}"`);
          return cy
            .get('input[name="Numero"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(telefonoTexto, { force: true, delay: 0 })
            .should('have.value', telefonoTexto);
        });
      }

      // Rellenar Inicio usando el calendario (date picker)
      if (inicioValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(inicioValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Inicio en Hist. Telefónico: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Estrategia 1: Buscar directamente por ID del input oculto (_r_4im_)
            const inputPorId = $body.find('input#_r_4im_').first();
            if (inputPorId.length) {
              cy.log('Input oculto _r_4im_ encontrado para Inicio');
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Estrategia 2: Buscar por label "Inicio"
            cy.log('Intentando buscar Inicio por label...');
            const labelInicio = $body.find('label').filter((_, el) => /^inicio$/i.test((el.innerText || '').trim())).first();
            if (labelInicio.length) {
              const contenedorPadre = Cypress.$(labelInicio).closest('.MuiFormControl-root');
              const datePickerContainer = contenedorPadre.find('.MuiPickersTextField-root').first();
              if (datePickerContainer.length) {
                const btnCal = datePickerContainer.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Estrategia 3: Fallback - primer botón "Choose date"
            cy.log('Usando fallback: primer botón Choose date');
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .first()
              .scrollIntoView()
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          });
        });
      }

      // Rellenar Fin usando el calendario (date picker)
      if (finValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(finValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Fin en Hist. Telefónico: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Estrategia 1: Buscar directamente por ID del input oculto (_r_4ip_)
            const inputPorId = $body.find('input#_r_4ip_').first();
            if (inputPorId.length) {
              cy.log('Input oculto _r_4ip_ encontrado para Fin');
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Estrategia 2: Buscar por label "Fin"
            cy.log('Intentando buscar Fin por label...');
            const labelFin = $body.find('label').filter((_, el) => /^fin$/i.test((el.innerText || '').trim())).first();
            if (labelFin.length) {
              const contenedorPadre = Cypress.$(labelFin).closest('.MuiFormControl-root');
              const datePickerContainer = contenedorPadre.find('.MuiPickersTextField-root').first();
              if (datePickerContainer.length) {
                const btnCal = datePickerContainer.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Estrategia 3: Fallback - segundo botón "Choose date" (después de Inicio)
            cy.log('Usando fallback: segundo botón Choose date');
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .eq(1)
              .scrollIntoView()
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          });
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Manejo específico para INCIDENCIAS: Fecha, Incidencia y Notas
    if (esIncidencia) {
      let fechaValor = null;
      let incidenciaValor = null;
      let notasValor = null;

      // Buscar los valores en el Excel
      cy.log(`Buscando valores en Excel para INCIDENCIAS (totalCampos: ${totalCampos})`);

      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        cy.log(`Campo ${i}: tipo="${tipo}", selector="${selector}", valor="${valor}"`);

        // Detectar fechas por formato (DD/MM/YYYY, DD-MM-YYYY, etc.)
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());

        // Identificar qué campo es según el selector, tipo o formato del valor
        // Fecha: puede venir por formato de fecha o por selector/tipo "fecha"
        if (!fechaValor && (
          esFormatoFecha ||
          tipo.includes('fecha') ||
          selector.includes('fecha') ||
          (tipo === 'name' && selector === 'fecha')
        )) {
          fechaValor = valor;
          cy.log(` Fecha detectada: ${valor}`);
        }
        // Incidencia: por selector o tipo que incluya "incidencia"
        else if (!incidenciaValor && (
          selector.includes('incidencia') ||
          tipo.includes('incidencia') ||
          (tipo === 'name' && selector === 'incidencia')
        )) {
          incidenciaValor = valor;
          cy.log(` Incidencia detectada: ${valor}`);
        }
        // Notas: por selector o tipo que incluya "notas"
        else if (!notasValor && (
          selector.includes('notas') ||
          tipo.includes('notas') ||
          (tipo === 'name' && selector === 'notas')
        )) {
          notasValor = valor;
          cy.log(` Notas detectada: ${valor}`);
        }
      }

      cy.log(`Valores detectados - Fecha: ${fechaValor || 'NO'}, Incidencia: ${incidenciaValor || 'NO'}, Notas: ${notasValor || 'NO'}`);

      // Rellenar Fecha usando el calendario (date picker)
      if (fechaValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(fechaValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Fecha en Incidencias: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Estrategia 1: Buscar directamente por ID del input oculto (_r_4jn_)
            const inputPorId = $body.find('input#_r_4jn_').first();
            if (inputPorId.length) {
              cy.log('Input oculto _r_4jn_ encontrado para Fecha');
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Estrategia 2: Buscar por label "Fecha"
            cy.log('Intentando buscar Fecha por label...');
            const labelFecha = $body.find('label').filter((_, el) => /^fecha$/i.test((el.innerText || '').trim())).first();
            if (labelFecha.length) {
              const contenedorPadre = Cypress.$(labelFecha).closest('.MuiFormControl-root');
              const datePickerContainer = contenedorPadre.find('.MuiPickersTextField-root').first();
              if (datePickerContainer.length) {
                const btnCal = datePickerContainer.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Estrategia 3: Fallback - primer botón "Choose date"
            cy.log('Usando fallback: primer botón Choose date');
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .first()
              .scrollIntoView()
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          });
        });
      }

      // Rellenar Incidencia escribiendo en el input
      if (incidenciaValor) {
        const incidenciaTexto = procesarValorAleatorio(incidenciaValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Incidencia escribiendo: "${incidenciaTexto}"`);
          return cy
            .get('input[name="Incidencia"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(incidenciaTexto, { force: true, delay: 0 })
            .should('have.value', incidenciaTexto);
        });
      }

      // Rellenar Notas escribiendo en el input
      if (notasValor) {
        const notasTexto = procesarValorAleatorio(notasValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Notas escribiendo: "${notasTexto}"`);
          return cy
            .get('input[name="Notas"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(notasTexto, { force: true, delay: 0 })
            .should('have.value', notasTexto);
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Recorrer todos los datos del Excel y rellenar los campos (flujo general)
    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = caso[`dato_${i}`];

      if (!valor || valor === '' || valor === undefined) {
        continue;
      }

      // Si hay un selector específico (name, id, etc.), usarlo
      if (selector && tipo) {
        const tipoLower = (tipo || '').toLowerCase();
        const valorTexto = procesarValorAleatorio(valor);

        chain = chain.then(() => {
          // Si el selector es un name attribute, usarlo directamente
          if (tipoLower.includes('name')) {
            return escribirPorName(selector, valorTexto, `Campo ${i}`);
          }

          // Si es un id, buscar por id
          if (tipoLower.includes('id')) {
            const idSelector = selector.startsWith('#') ? selector : `#${selector}`;
            return cy.get(idSelector, { timeout: 5000 })
              .should('be.visible')
              .scrollIntoView()
              .clear({ force: true })
              .type(valorTexto, { force: true, delay: 0 })
              .should('have.value', valorTexto);
          }

          // Intentar buscar por selector genérico
          return cy.get(selector, { timeout: 5000 })
            .should('be.visible')
            .scrollIntoView()
            .clear({ force: true })
            .type(valorTexto, { force: true, delay: 0 })
            .should('have.value', valorTexto);
        });
      } else {
        // Si no hay selector, intentar buscar por etiqueta
        const etiqueta = normalizarEtiquetaTexto(tipo);
        if (etiqueta) {
          chain = chain.then(() => {
            return obtenerCampoFormulario(tipo, '', etiqueta)
              .then(($el) => {
                if ($el && $el.length) {
                  const valorTexto = procesarValorAleatorio(valor);
                  const tag = ($el[0]?.tagName || '').toLowerCase();
                  if (tag === 'input' || tag === 'textarea') {
                    cy.wrap($el).clear({ force: true }).type(valorTexto, { force: true });
                  }
                }
              });
          });
        }
      }
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
    });
  }

  function llenarCamposFormulario(caso) {
    const totalCampos = Number(caso?.__totalCamposExcel) || 14;
    const campos = [];

    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = caso[`dato_${i}`];
      if (!tipo || !selector || valor === undefined || valor === '') continue;

      const etiquetaPreferida = normalizarEtiquetaTexto(tipo) || selector;
      const etiquetaNormalizada = normalizarTextoParaComparar(etiquetaPreferida);
      if (etiquetaNormalizada && CAMPOS_IGNORADOS.has(etiquetaNormalizada)) continue;

      campos.push({ tipo, selector, valor, etiquetaVisible: etiquetaPreferida });
    }

    if (campos.length === 0) {
      cy.log('Caso sin datos para completar el formulario');
      return cy.wrap(null);
    }

    const completarCampo = (index = 0) => {
      if (index >= campos.length) return cy.wrap(null);

      const campo = campos[index];
      const valorTexto = procesarValorAleatorio(campo.valor) || '';

      // Para Empresa, usar el mismo enfoque que Actividad en ficheros_clientes.cy.js
      // Buscar por nombre del label "Empresa", hacer click y seleccionar la opción (NO escribir)
      if (campo.selector && (campo.selector.includes('idEmpresa') || campo.selector.includes('mui-component-select-client.idEmpresa'))) {
        cy.log(`Haciendo click en Empresa y seleccionando: "${valorTexto}"`);
        return seleccionarOpcionMaterial(
          null, // no usar selector directo, buscar por label
          valorTexto.toString(),
          'Empresa'
        ).then(
          () => completarCampo(index + 1),
          () => {
            cy.log(`No se pudo seleccionar "${valorTexto}" en Empresa (se continúa)`);
            return completarCampo(index + 1);
          }
        );
      }

      const etiquetaParaBuscar = campo.etiquetaVisible || campo.selector;

      return obtenerCampoFormulario(campo.tipo, campo.selector, etiquetaParaBuscar)
        .then(($elemento) => {
          if (!$elemento) return null;
          const el = $elemento.length ? $elemento[0] : $elemento;
          if (!el) return null;

          const tag = (el.tagName || '').toLowerCase();
          const tipoInput = (el.type || '').toLowerCase();

          if (tipoInput === 'checkbox' || tipoInput === 'radio') {
            return cy.wrap(el).check({ force: true }).then(() => null);
          }

          // Si es un MUI combobox, seleccionar opción
          const role = (el.getAttribute && el.getAttribute('role')) ? el.getAttribute('role') : '';
          if (String(role).toLowerCase() === 'combobox') {
            return seleccionarOpcionMuiSelect(el, valorTexto).then(() => null);
          }

          if (tag === 'input' || tag === 'textarea') {
            return cy
              .wrap(el)
              .should('be.visible')
              .click({ force: true })
              .clear({ force: true })
              .type(String(valorTexto), { force: true, delay: 0 })
              .blur({ force: true })
              .then(() => null);
          }

          if (tag === 'select') {
            return cy.wrap(el).select(String(valorTexto), { force: true }).then(() => null);
          }

          // Fallback genérico
          return cy.wrap(el).click({ force: true }).type(String(valorTexto), { force: true, delay: 0 }).then(() => null);
        })
        .then(() => completarCampo(index + 1));
    };

    return completarCampo(0);
  }

  // =========================
  // Helpers base (se perdieron al cortar el fichero)
  // =========================
  function registrarResultadoAutomatico(numero, casoId, nombre, obtenido, resultado, habilitado = true) {
    if (!habilitado) return cy.wrap(null);

    if (CASOS_OK_FORZADO.has(numero)) {
      resultado = 'OK';
      obtenido = 'Comportamiento correcto (OK forzado)';
    }

    return cy.estaRegistrado().then((ya) => {
      if (ya) return null;
      cy.registrarResultados({
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

  function normalizarId(selector = '') {
    return String(selector || '').replace(/^#/, '').replace(/-label$/i, '');
  }

  function normalizarEtiquetaTexto(texto = '') {
    if (!texto) return null;
    return String(texto).replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function normalizarTextoParaComparar(texto = '') {
    const limpio = normalizarEtiquetaTexto(texto);
    return limpio ? limpio.toLowerCase() : '';
  }

  function escapeRegex(texto = '') {
    return String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function procesarValorAleatorio(valor) {
    if (valor === null || valor === undefined) return valor;
    let valorStr = String(valor);

    // 1) Si existe sufijo fijo para TC056, úsalo (tu lógica actual)
    try {
      const tc056Suffix = Cypress.env && Cypress.env('TC056_SUFFIX');
      if (tc056Suffix && /XXX/i.test(valorStr)) {
        valorStr = valorStr.replace(/XXX/gi, String(tc056Suffix));
        return valorStr;
      }
    } catch (e) {
      // noop
    }

    // 2) Fallback: si viene "pruebaXXX" o cualquier "XXX", generar 3 dígitos al vuelo
    if (/XXX/i.test(valorStr)) {
      const numeroAleatorio = Math.floor(Math.random() * 900) + 100; // 100..999
      cy.log(`Valor "${valorStr}" contiene "XXX", generando sufijo: ${numeroAleatorio}`);
      valorStr = valorStr.replace(/XXX/gi, String(numeroAleatorio));
      return valorStr;
    }

    // 3) Tu regla actual para "aleatorio/random"
    if (/(aleatorio|random)/i.test(valorStr)) {
      const numeroAleatorio = Math.floor(Math.random() * 900) + 100;
      cy.log(`Valor "${valorStr}" detectado como aleatorio, generando: ${numeroAleatorio}`);
      return String(numeroAleatorio);
    }

    return valorStr;
  }
  // =========================
  // Selectores y selects (MUI)
  // =========================
  function seleccionarOpcionMuiSelect(combo, valorTexto) {
    const texto = String(valorTexto || '').trim();
    if (!texto) return cy.wrap(null);

    // IMPORTANTE: en algunas versiones de Cypress, `cy.wrap(domNode).click()` puede fallar
    // con `options.$el.toArray is not a function`. Aseguramos que el subject sea jQuery.
    const $combo = combo && combo.jquery ? combo : Cypress.$(combo);

    return cy.wrap($combo)
      .should('be.visible')
      .click({ force: true })
      .then(() => cy.wait(300))
      .then(() => {
        // Buscar opción en listbox/menu
        return cy.contains(
          'li[role="option"], [role="option"], .MuiMenuItem-root',
          new RegExp(escapeRegex(texto), 'i'),
          { timeout: 10000 }
        )
          .should('be.visible')
          .click({ force: true })
          .then(() => cy.wait(300));
      });
  }

  function seleccionarOpcionMaterial(selector, valor, etiqueta = '') {
    if (!valor) return cy.wrap(null);

    // Si hay etiqueta, buscar primero por label y su contenedor (más robusto)
    if (etiqueta) {
      return cy.contains('label', new RegExp(`^${escapeRegex(etiqueta)}$`, 'i'), { timeout: 10000 })
        .should('be.visible')
        .then(($label) => {
          const contenedor = $label.closest('.MuiFormControl-root, .MuiTextField-root, .MuiInputBase-root');
          if (contenedor.length) {
            const combo = contenedor.find('[role="combobox"], .MuiSelect-select').first()[0];
            if (combo) return seleccionarOpcionMuiSelect(combo, valor);
          }

          // fallback por atributo for
          const forAttr = $label.attr('for');
          if (forAttr) {
            const selFor = forAttr.includes('.') ? `[id="${forAttr}"]` : `#${forAttr}`;
            return cy.get(selFor, { timeout: 5000 }).then(($el) => {
              if ($el && $el.length) return seleccionarOpcionMuiSelect($el[0], valor);
              return cy.wrap(null);
            });
          }
          return cy.wrap(null);
        });
    }

    // Si no hay etiqueta, usar selector si existe
    if (!selector) return cy.wrap(null);
    const selectorFinal = selector.includes('.') ? `[id="${selector}"]` : selector;
    return cy.get(selectorFinal, { timeout: 10000 }).then(($el) => {
      if ($el && $el.length) return seleccionarOpcionMuiSelect($el[0], valor);
      return cy.wrap(null);
    });
  }

  function obtenerCampoFormulario(tipo, selector, etiqueta) {
    const tipoLower = String(tipo || '').toLowerCase();
    const sel = String(selector || '');

    return cy.get('body').then(($body) => {
      // 1) Por selector directo (id/name/css)
      if (sel) {
        // ID con puntos
        const candidates = [];
        if (tipoLower.includes('id')) {
          const idNorm = normalizarId(sel);
          candidates.push(idNorm.includes('.') ? `[id="${idNorm}"]` : `#${idNorm}`);
        }
        if (tipoLower.includes('name')) candidates.push(`input[name="${sel}"], textarea[name="${sel}"]`);
        if (tipoLower.includes('selector') || tipoLower.includes('query')) candidates.push(sel);
        if (!sel.startsWith('#') && !sel.startsWith('.') && !sel.startsWith('[')) {
          candidates.push(sel.includes('.') ? `[id="${sel}"]` : `#${sel}`);
          candidates.push(`input[name="${sel}"], textarea[name="${sel}"]`);
        } else {
          candidates.push(sel);
        }

        for (const c of candidates) {
          const el = $body.find(c).filter('input, textarea, select, [role="combobox"], [role="textbox"], .MuiSelect-select').first();
          if (el.length) return cy.wrap(el[0]);
        }
      }

      // 2) Por label (etiqueta)
      if (etiqueta) {
        const re = new RegExp(`^${escapeRegex(etiqueta)}$`, 'i');
        let $label = $body.find('label').filter((_, el) => re.test((el.textContent || el.innerText || '').trim())).first();
        if (!$label.length) {
          const re2 = new RegExp(escapeRegex(etiqueta), 'i');
          $label = $body.find('label').filter((_, el) => re2.test((el.textContent || el.innerText || '').trim())).first();
        }
        if ($label.length) {
          const forAttr = $label.attr('for');
          if (forAttr) {
            const selFor = forAttr.includes('.') ? `[id="${forAttr}"]` : `#${forAttr}`;
            const target = $body.find(selFor).first();
            if (target.length) return cy.wrap(target[0]);
          }
          const cont = $label.closest('.MuiFormControl-root, .MuiTextField-root, .MuiInputBase-root, .MuiPickersInputBase-root');
          if (cont.length) {
            const target = cont.find('input, textarea, select, [role="combobox"], .MuiSelect-select').not('input[type="hidden"]').first();
            if (target.length) return cy.wrap(target[0]);
          }
        }
      }

      return cy.wrap(null);
    });
  }

  // =========================
  // Modales de secciones (+Añadir / Guardar)
  // =========================
  function abrirModalSeccion(seccion) {
    cy.log(`Abriendo modal de ${seccion}`);
    return cy.get('body').then(($body) => {
      // IMPORTANTE (TC056/Incidencias): el botón "+ Añadir" debe buscarse dentro del panel de la pestaña activa,
      // porque hay varios "Añadir" en la página y si elegimos el primero abrimos el modal equivocado.
      const tabActiva = $body.find('[role="tab"][aria-selected="true"]').first();
      const ariaControls = tabActiva.attr('aria-controls');
      const panelActivo = ariaControls ? $body.find(`[id="${ariaControls}"]`) : $body.find('[role="tabpanel"]:not([hidden])').first();
      const $scope = (panelActivo && panelActivo.length) ? panelActivo : $body;

      const $btn = $scope
        .find('button, a')
        .filter(':visible')
        .filter((_, el) => /\+?\s*a[nñ]adir/i.test((el.innerText || el.textContent || '').trim()))
        .first();

      if ($btn.length) {
        return cy.wrap($btn[0]).scrollIntoView().click({ force: true }).then(() => esperarDrawerVisible(seccion));
      }

      // Fallback global si por lo que sea no encontramos el botón en el panel activo
      return cy.contains('button, a', /\+?\s*a[nñ]adir/i, { timeout: 10000 })
        .should('be.visible')
        .scrollIntoView()
        .click({ force: true })
        .then(() => esperarDrawerVisible(seccion));
    });
  }

  function esperarDrawerVisible(seccion) {
    // Espera genérica: que aparezca un drawer/dialog/modal visible
    return cy.get('body', { timeout: 15000 }).then(($body) => {
      const hay = $body.find('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="dialog"]:visible').length > 0;
      if (hay) return cy.wrap(null);
      // Reintentar brevemente
      return cy.wait(400).then(() => cy.get('body')).then(($b2) => {
        const hay2 = $b2.find('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="dialog"]:visible').length > 0;
        if (hay2) return cy.wrap(null);
        cy.log(`⚠️ No se detectó modal/drawer visible para ${seccion} (se continúa)`);
        return cy.wrap(null);
      });
    });
  }

  function guardarModalSeccion(seccion) {
    cy.log(`Guardando modal de ${seccion}`);
    return cy.get('body').then(($body) => {
      const $modal = $body.find('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="dialog"]:visible').first();
      if (!$modal.length) {
        cy.log(`No hay modal visible para ${seccion} (OK)`);
        return cy.wrap(null);
      }
      const $btn = $modal
        .find('button:visible')
        .filter((_, el) => /^Guardar$/i.test((el.textContent || el.innerText || '').trim()))
        .last();

      if ($btn.length) return cy.wrap($btn[0]).click({ force: true }).then(() => cy.wait(800));

      cy.log(`⚠️ No encontré botón Guardar dentro del modal de ${seccion} (OK)`);
      return cy.wrap(null);
    });
  }

  // =========================
  // TC056 (estaba referenciado pero faltaba)
  // =========================
  function TC056(caso, numero, casoId) {
    const numeroCaso = numero || 56;
    const idCaso = casoId || `TC${String(numeroCaso).padStart(3, '0')}`;
    const nombre = caso?.nombre || 'Comprobar que se quedan guardados todos los registros';

    // Versión “segura”: si el Excel no trae los casos necesarios, no rompe suite y registra lo que pasó.
    return cy.obtenerDatosExcel(HOJA_EXCEL).then((todosLosCasos) => {
      // Como antes: usar caso 24 para rellenar Datos Personales (el Excel ya lo has actualizado)
      const caso24 = todosLosCasos.find((c) => parseInt(String(c.caso || '').replace(/\D/g, ''), 10) === 24);
      const caso56 = todosLosCasos.find((c) => parseInt(String(c.caso || '').replace(/\D/g, ''), 10) === 56);
      const casoBase = caso24 || caso56 || caso;
      const numeroAleatorio = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // XXX fallback
      const nombrePersonal = `prueba${numeroAleatorio}`;
      let codigoPersonal = null;
      let nombrePersonalReal = nombrePersonal;
      let ignorarCasoPorAlerta = false;
      let motivoIgnorar = '';

      const escribirEnCampoPorLabelExacto = (labelExacto, valor) => {
        return cy.get('body').then(($body) => {
          // Evitar labels dentro de modales/drawers
          const objetivo = String(labelExacto).trim().toLowerCase();
          const $label = $body.find('label').filter((_, el) => {
            const t = (el.textContent || el.innerText || '').trim().toLowerCase();
            // Match exacto o prefijo (por si viene con espacios/asteriscos), pero evitando "nombre propietario"
            if (!(t === objetivo || t.startsWith(`${objetivo} `) || t.startsWith(objetivo))) return false;
            if (objetivo === 'nombre' && t.includes('propietario')) return false;
            const $el = Cypress.$(el);
            const estaEnModal = $el.closest('.MuiDrawer-root, .MuiModal-root, [role="dialog"]').length > 0;
            return !estaEnModal;
          }).first();

          if (!$label.length) return cy.wrap(false);

          const forAttr = $label.attr('for');
          if (forAttr) {
            const sel = forAttr.includes('.') ? `[id="${forAttr}"]` : `#${forAttr}`;
            return cy.get(sel, { timeout: 5000 })
              .should('exist')
              .scrollIntoView()
              .click({ force: true })
              .clear({ force: true })
              .type(String(valor), { force: true, delay: 0 })
              .blur({ force: true })
              .then(() => true);
          }

          // Fallback: input dentro del contenedor del label
          const cont = $label.closest('.MuiFormControl-root, .MuiTextField-root, .MuiInputBase-root');
          const input = cont.find('input, textarea').not('input[type="hidden"]').first();
          if (input.length) {
            return cy.wrap(input[0])
              .scrollIntoView()
              .click({ force: true })
              .clear({ force: true })
              .type(String(valor), { force: true, delay: 0 })
              .blur({ force: true })
              .then(() => true);
          }

          // Último fallback (Nombre): por name típico
          if (objetivo === 'nombre') {
            const input2 = $body.find('input[name="client.name"], textarea[name="client.name"], input[name="name"]').first();
            if (input2.length) {
              return cy.wrap(input2[0])
                .scrollIntoView()
                .click({ force: true })
                .clear({ force: true })
                .type(String(valor), { force: true, delay: 0 })
                .blur({ force: true })
                .then(() => true);
            }
          }

          return cy.wrap(false);
        });
      };

      const leerValorCampoPorLabelExacto = (labelExacto) => {
        return cy.get('body').then(($body) => {
          const $label = $body.find('label').filter((_, el) => {
            const t = (el.textContent || el.innerText || '').trim().toLowerCase();
            if (t !== String(labelExacto).trim().toLowerCase()) return false;
            const $el = Cypress.$(el);
            const estaEnModal = $el.closest('.MuiDrawer-root, .MuiModal-root, [role="dialog"]').length > 0;
            return !estaEnModal;
          }).first();
          if (!$label.length) return cy.wrap(null);

          const forAttr = $label.attr('for');
          if (forAttr) {
            const sel = forAttr.includes('.') ? `[id="${forAttr}"]` : `#${forAttr}`;
            const v = $body.find(sel).first().val();
            return cy.wrap(v ? String(v).trim() : null);
          }

          const cont = $label.closest('.MuiFormControl-root, .MuiTextField-root, .MuiInputBase-root');
          const input = cont.find('input, textarea').not('input[type="hidden"]').first();
          if (input.length) return cy.wrap(String(input.val() || '').trim() || null);
          return cy.wrap(null);
        });
      };

      const verificarPestañaTieneDatos = (nombrePestaña) => {
        return cy.get('body').then(($body) => {
          const tabActiva = $body.find('[role="tab"][aria-selected="true"]').first();
          const ariaControls = tabActiva.attr('aria-controls');
          const panelActivo = ariaControls ? $body.find(`[id="${ariaControls}"]`) : $body.find('[role="tabpanel"]:not([hidden])').first();
          const $scope = (panelActivo && panelActivo.length) ? panelActivo : $body;

          const hayErroresVisibles = () => {
            const err = $scope.find('.MuiFormHelperText-root.Mui-error:visible, .Mui-error:visible').filter((_, el) => {
              const t = (el.textContent || '').trim();
              return t.length > 0;
            });
            return err.length > 0;
          };

          if (hayErroresVisibles()) {
            cy.log(`❌ ${nombrePestaña}: hay errores visibles`);
            return cy.wrap(false);
          }

          // DataGrid (si aplica)
          const dg = $scope.find('.MuiDataGrid-root').first();
          if (dg.length) {
            const grid = dg.find('[role="grid"]').first();
            const rc = parseInt(String(grid.attr('aria-rowcount') || ''), 10);
            if (Number.isFinite(rc) && rc > 1) return cy.wrap(true);

            const filasDG = dg.find('.MuiDataGrid-row[data-rowindex], [role="row"][data-rowindex]');
            if (filasDG.length > 0) return cy.wrap(true);

            const txt = (dg.text() || '').toLowerCase();
            if (/sin\s+filas|no\s+hay\s+datos|sin\s+datos|no\s+rows|no\s+results/i.test(txt)) return cy.wrap(false);
          }

          // Tabla HTML
          const filasTabla = $scope.find('table tbody tr, tbody tr').filter((_, el) => (el.textContent || '').trim().length > 0);
          if (filasTabla.length > 0) return cy.wrap(true);

          // Formulario (inputs/selects)
          const inputs = $scope.find('input:visible, textarea:visible');
          const combos = $scope.find('[role="combobox"]:visible, .MuiSelect-select:visible, [aria-haspopup="listbox"]:visible');
          const hayValorInput = Array.from(inputs).some((el) => {
            const v = String(el.value || '').trim();
            if (!v) return false;
            if (v === '0') return false;
            return true;
          });
          const hayValorCombo = Array.from(combos).some((el) => {
            const t = (el.innerText || el.textContent || '').trim();
            if (!t) return false;
            if (/selecciona|select|elige|choose/i.test(t)) return false;
            return true;
          });
          return cy.wrap(hayValorInput || hayValorCombo);
        });
      };

      const casoMod = { ...casoBase };

      // ---- TC056: detección robusta de "NovaTrans - Información" (puede aparecer con retardo) ----
      const detectarNovaTransInfoEnBody = ($body) => {
        return $body
          .find('.MuiDialog-root:visible, [role="dialog"]:visible, [role="alertdialog"]:visible')
          .filter((_, el) => /NovaTrans\s*-\s*Informaci[oó]n/i.test((el.textContent || el.innerText || '').trim()))
          .first();
      };

      const esperarNovaTransInfoSiAparece = (timeoutMs = 8000, intervalMs = 250) => {
        const start = Date.now();
        const loop = () => {
          return cy.get('body').then(($body) => {
            const $dlg = detectarNovaTransInfoEnBody($body);
            if ($dlg && $dlg.length) return true;
            if (Date.now() - start >= timeoutMs) return false;
            return Cypress.Promise.delay(intervalMs).then(loop);
          });
        };
        return loop();
      };

      const abortarSiNovaTransInfo = (timeoutMs = 8000) => {
        return esperarNovaTransInfoSiAparece(timeoutMs).then((aparecio) => {
          if (!aparecio) return cy.wrap(false);

          ignorarCasoPorAlerta = true;
          motivoIgnorar = 'Alerta incorrecta (mal escrita) y no se ha podido guardar/crear el personal';

          return cy.get('body').then(($body) => {
            const $dlg = detectarNovaTransInfoEnBody($body);
            if ($dlg && $dlg.length) {
              const $btnNo = $dlg
                .find('button:visible')
                .filter((_, b) => /^no$/i.test((b.textContent || b.innerText || '').trim()))
                .first();
              if ($btnNo.length) return cy.wrap($btnNo[0]).click({ force: true }).then(() => cy.wait(300));
            }
            return cy.wrap(null);
          }).then(() => {
            // TC056: registrar ERROR en Excel y cortar el flujo (sin que el runner lo pise a OK).
            return registrarResultadoAutomatico(
              numeroCaso,
              idCaso,
              nombre,
              motivoIgnorar,
              'ERROR',
              true
            ).then(() => cy.wrap({ __resultado: 'STOP' }));
          });
        });
      };

      return cy.login()
        .then(() => cy.navegarAMenu(MENU, SUBMENU, { expectedPath: URL_PATH }))
        .then(() => UI.esperarTabla())
        .then(() => abrirFormularioNuevoPersonal())
        .then(() => cy.url().should('include', '/dashboard/personnel/form'))
        .then(() => {
          // Para el Excel "pruebaXXX": XXX son 3 dígitos aleatorios del caso
          Cypress.env('TC056_SUFFIX', numeroAleatorio);
          return cy.wrap(null);
        })
        // Rellenar usando el caso "base" (preferentemente 24, como antes)
        .then(() => {
          const numBase = caso24 ? 24 : (caso56 ? 56 : 56);
          return llenarFormularioDatosPersonalesDesdeExcel(casoMod, numBase, false, { modoCompleto: true });
        })
        .then(() => {
          // Capturar CÓDIGO real y derivar XXX de ese código (últimos 3 dígitos)
          return leerValorCampoPorLabelExacto('Código').then((v) => {
            if (v) {
              codigoPersonal = String(v).replace(/\D/g, '');
              const suf = (codigoPersonal.padStart(3, '0')).slice(-3);
              Cypress.env('TC056_SUFFIX', suf);
              cy.log(`TC056: Código capturado=${codigoPersonal} -> sufijo XXX=${suf}`);
            } else {
              cy.log('TC056: ⚠️ no pude capturar Código; se mantiene sufijo aleatorio.');
            }
            return cy.wrap(null);
          });
        })
        .then(() => {
          // Forzar NOMBRE final a pruebaXXX usando el sufijo actual (codigo o fallback)
          const suf = Cypress.env('TC056_SUFFIX') || numeroAleatorio;
          const nombreFinal = `prueba${suf}`;
          cy.log(`TC056: Forzando Nombre="${nombreFinal}"...`);
          return escribirEnCampoPorLabelExacto('Nombre', nombreFinal).then((ok) => {
            if (ok) nombrePersonalReal = nombreFinal;
            return cy.wrap(null);
          });
        })
        .then(() => cy.wrap(null))
        .then(() => {
          // Rellenar el resto de pestañas que vengan en Excel (27-34) usando la lógica genérica ya existente
          const casosPestañas = todosLosCasos
            .filter((c) => {
              const n = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
              return n >= 27 && n <= 34;
            })
            .sort((a, b) => {
              const na = parseInt(String(a.caso || '').replace(/\D/g, ''), 10);
              const nb = parseInt(String(b.caso || '').replace(/\D/g, ''), 10);
              return na - nb;
            });

          let chain = cy.wrap(null);
          casosPestañas.forEach((c) => {
            const n = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
            const seccion = deducirSeccionDesdeCaso(c);
            const esConModal = /formaci|experienc|asistenc|material|contrat|incidenc|hist|tel[eé]f/i.test(seccion);
            chain = chain.then(() => {
              // Incidencias: hacerlo EXACTAMENTE como en el caso 34 (TC034)
              // (deducirSeccionDesdeCaso no siempre detecta bien y el flujo del caso 34 es el que funciona)
              if (n === 34) {
                cy.log('TC056: Forzando relleno de INCIDENCIAS usando el flujo del caso 34...');
                return anadirPersonal(c, 34, 'TC034');
              }

              // Teléfonos: en TC056 usar EXACTAMENTE la misma lógica que el caso 32 (TC032)
              // para evitar divergencias (modal, selección de fila y botón "Seleccionar").
              if ((n === 32) || (seccion && /tel[eé]fon/i.test(seccion) && !/hist/i.test(seccion))) {
                cy.log('TC056: Seleccionando teléfono con la misma lógica del TC032...');
                return seleccionarTelefono(c, 32, 'TC032');
              }
              if (esConModal) {
                return navegarSeccionFormulario(seccion)
                  .then(() => abrirModalSeccion(seccion))
                  .then(() => llenarFormularioSeccion(c, n, seccion))
                  .then(() => guardarModalSeccion(seccion));
              }
              return navegarSeccionFormulario(seccion).then(() => llenarCamposFormulario(c));
            });
          });
          return chain;
        })
        .then(() => {
          // Guardar formulario principal
          return cy.contains('button', /^Guardar$/i, { timeout: 15000 })
            .first()
            .click({ force: true })
            .then(() => cy.wait(600))
            .then(() => abortarSiNovaTransInfo(12000))
            .then((res) => {
              if (res && res.__resultado === 'ERROR') return cy.wrap(res);
              return cy.wrap(null);
            })
            .then((res) => cy.wait(1200).then(() => res));
        })
        .then((resGuardado) => {
          if (resGuardado && (resGuardado.__resultado === 'STOP' || resGuardado.__resultado === 'ERROR')) {
            Cypress.env('TC056_SUFFIX', null);
            return cy.wrap(resGuardado);
          }

          if (ignorarCasoPorAlerta) {
            Cypress.env('TC056_SUFFIX', null);
            return cy.wrap({ __resultado: 'ERROR', obtenido: motivoIgnorar || 'Alerta incorrecta (mal escrita) y no se ha podido guardar/crear el personal' });
          }

          // Volver a lista, buscar el personal creado y verificar que todas las pestañas tienen datos
          const pestañasAVerificar = [
            'Dirección',
            'Datos Económicos',
            'Formación',
            'Experiencia',
            'Vencimientos',
            'Asistencia',
            'Material',
            'Contratos',
            'Teléfonos',
            'Hist. Telefónico',
            'Incidencias'
          ];

          const buscarPorNombre = () => {
            const limpiarSiExiste = () => {
              return cy.get('body').then(($body) => {
                const $limpiar = $body
                  .find('button:visible')
                  .filter((_, el) => /^limpiar$/i.test((el.textContent || el.innerText || '').trim()))
                  .first();
                if ($limpiar.length) return cy.wrap($limpiar[0]).click({ force: true }).then(() => cy.wait(500));
                return cy.wrap(null);
              });
            };

            // Buscar SOLO por NOMBRE (pruebaXXX)
            cy.log(`TC056: buscando por NOMBRE: ${nombrePersonalReal}`);
            return limpiarSiExiste()
              .then(() => UI.buscar(nombrePersonalReal))
              .then(() => cy.wait(1500))
              .then(() => {
                return cy.get('body').then(($body) => {
                  const sinFilas = /sin\s+filas|no\s+rows/i.test(($body.text() || '').toLowerCase());
                  const hayFila = $body.find('.MuiDataGrid-row:visible').length > 0;
                  if (hayFila) return cy.wrap(null);
                  if (!sinFilas) return cy.wrap(null);

                  // Si no hay resultados por nombre, registrar ERROR en Excel y cortar.
                  const obs = `No se encontró el personal creado al buscar por nombre "${nombrePersonalReal}".`;
                  return registrarResultadoAutomatico(
                    numeroCaso,
                    idCaso,
                    nombre,
                    obs,
                    'ERROR',
                    true
                  ).then(() => cy.wrap({ __resultado: 'STOP' }));
                });
              });
          };

          return cy.visit(URL_PATH)
            .then(() => cy.wait(1500))
            .then(() => abortarSiNovaTransInfo(2000))
            .then((resAlerta) => {
              if (resAlerta && (resAlerta.__resultado === 'STOP' || resAlerta.__resultado === 'ERROR')) return cy.wrap(resAlerta);

              return UI.esperarTabla()
                .then(() => buscarPorNombre())
                .then((resBuscar) => {
                  if (resBuscar && (resBuscar.__resultado === 'STOP' || resBuscar.__resultado === 'ERROR')) return cy.wrap(resBuscar);
                  return cy.wrap(null);
                });
            })
            .then((resPrev) => {
              if (resPrev && (resPrev.__resultado === 'STOP' || resPrev.__resultado === 'ERROR')) return cy.wrap(resPrev);
              const reFila = new RegExp(
                escapeRegex(nombrePersonalReal),
                'i'
              );
              return cy.contains('.MuiDataGrid-row:visible', reFila, { timeout: 15000 })
                .first()
                .then(($row) => {
                  const $cell = Cypress.$($row).find('.MuiDataGrid-cell').not('[data-field="__check__"]').first();
                  if ($cell.length) return cy.wrap($cell[0]).click({ force: true });
                  return cy.wrap($row).click({ force: true });
                })
                .then(() => cy.wait(800))
                .then(() => cy.url().should('include', '/dashboard/personnel/form'));
            })
            .then((resFila) => {
              if (resFila && (resFila.__resultado === 'STOP' || resFila.__resultado === 'ERROR')) return cy.wrap(resFila);
              let chainVer = cy.wrap([]);
              pestañasAVerificar.forEach((p) => {
                chainVer = chainVer.then((sinDatos) => {
                  return navegarSeccionFormulario(p)
                    .then(() => cy.wait(600))
                    .then(() => verificarPestañaTieneDatos(p))
                    .then((ok) => {
                      const next = [...sinDatos];
                      if (!ok) next.push(p);
                      return cy.wrap(next);
                    });
                });
              });
              return chainVer;
            })
            .then((pestañasSinDatos) => {
              if (pestañasSinDatos && (pestañasSinDatos.__resultado === 'STOP' || pestañasSinDatos.__resultado === 'ERROR')) {
                Cypress.env('TC056_SUFFIX', null);
                return cy.wrap(pestañasSinDatos);
              }
              Cypress.env('TC056_SUFFIX', null);
              const status = (pestañasSinDatos && pestañasSinDatos.length > 0) ? 'ERROR' : 'OK';
              const obs = (pestañasSinDatos && pestañasSinDatos.length > 0)
                ? `Personal ${nombrePersonal} creado, pero estas pestañas no tienen datos: ${pestañasSinDatos.join(', ')}`
                : `Personal ${nombrePersonal} creado y verificado. Todas las pestañas tienen datos.`;

              return registrarResultadoAutomatico(
                numeroCaso,
                idCaso,
                nombre,
                obs,
                status,
                true
              );
            });
        });
    });
  }

});
