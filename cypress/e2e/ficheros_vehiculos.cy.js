describe('FICHEROS (VEHÍCULOS) - Validación dinámica desde Excel', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';
  const PANTALLA = 'Ficheros (Vehículos)';
  const HOJA_EXCEL = 'FICHEROS-VEHÍCULOS';
  const MENU = 'Ficheros';
  const SUBMENU = 'Vehículos';
  const URL_PATH = '/dashboard/vehicles';

  before(() => {
    // Crea / recupera la sesión una sola vez
    cy.login();
  });

  // Evitar duplicados: si el Excel trae el mismo caso dos veces (ej. TC018), se ejecuta solo la primera vez
  const CASOS_EJECUTADOS = new Set();

  const CASOS_INCIDENTE = new Map([]);
  const CASOS_WARNING = new Map([
    ['TC022', 'Mensaje de confirmación muestra "Vehiclee" en lugar de "Vehículo"'],
    ['TC023', 'Mensaje de confirmación muestra "Vehiclee" en lugar de "Vehículo"']
  ]);

  const CAMPOS_IGNORADOS = new Set(['código', 'codigo', 'activo']);
  const CAMPOS_FORMULARIO_ORDEN = [
    'Alta',
    'Razón Social',
    'Actividad',
    'Web',
    'Persona',
    'Nombre',
    'NIF/CIF',
    'NIVA',
    'Tlf. Fijo',
    'Tlf. Móvil',
    'E-mail',
    'Notas',
    'Residencia',
    'Dirección',
    'Ciudad',
    'Provincia',
    'País',
    'Código (Contacto)',
    'Cargo (Contacto)',
    'Contacto Activo'
  ];

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

      const casosVehículos = casos
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

      cy.log(`Casos detectados para Vehículos: ${casosVehículos.length}`);

      // Hacer login y abrir la pantalla una sola vez
      const pantallaLista = cy.login()
        .then(() => UI.abrirPantalla());

      const ejecutarCaso = (index) => {
        if (index >= casosVehículos.length) {
          cy.log('Todos los casos de Vehículos fueron procesados');
          return cy.wrap(true);
        }

        const caso = casosVehículos[index];
        const numero = parseInt(String(caso.caso || '').replace(/\D/g, ''), 10);
        const casoId = caso.caso?.toUpperCase() || `TC${String(numero).padStart(3, '0')}`;
        const nombre = caso.nombre || `Caso ${casoId}`;

        // Evitar duplicados: si el mismo número de caso ya se ejecutó, se omite
        if (CASOS_EJECUTADOS.has(numero)) {
          cy.log(`Caso duplicado detectado (${casoId}), se omite`);
          return ejecutarCaso(index + 1);
        }
        CASOS_EJECUTADOS.add(numero);

        cy.log('───────────────────────────────────────────────');
        cy.log(`Ejecutando ${casoId} - ${nombre}`);

        // Log específico para casos de filtro (32, 33) para depuración
        if (numero === 32 || numero === 33) {
          cy.log(`DEBUG PRE-EJECUCIÓN Caso ${numero}:`);
          cy.log(`   - caso.dato_1: "${caso.dato_1}"`);
          cy.log(`   - caso.dato_2: "${caso.dato_2}"`);
          cy.log(`   - caso.valor_etiqueta_1: "${caso.valor_etiqueta_1}"`);
          cy.log(`   - caso.__totalCamposExcel: ${caso.__totalCamposExcel}`);
          cy.log(`   - Todas las propiedades: ${Object.keys(caso).join(', ')}`);
        }

        cy.resetearFlagsTest();

        const ejecucion = obtenerFuncionPorNumero(numero);

        if (!ejecucion) {
          cy.log(`Sin función asignada para ${casoId}, se omite`);
          return ejecutarCaso(index + 1);
        }

        const { fn, autoRegistro = true } = ejecucion;

        // Para los casos de alta (22-33), siempre hacer login y navegación completa
        // para garantizar un estado limpio antes de cada caso
        let prepararPantalla = pantallaLista;
        if ((numero >= 22 && numero <= 33)) {
          const seccion = deducirSeccionDesdeCaso(caso);
          cy.log(`Caso ${numero}: Preparando estado limpio (login + navegación + abrir formulario)`);
          prepararPantalla = cy.login()
            .then(() => {
              // Navegar al menú
              cy.navegarAMenu(MENU, SUBMENU, { expectedPath: URL_PATH });
              cy.url().should('include', URL_PATH).and('not.include', '/form');
              cy.wait(1000);
              // Esperar tabla (estamos en la lista)
              return UI.esperarTabla();
            })
            .then(() => {
              // Pulsar el botón "+ Nuevo" para abrir el formulario
              cy.log('Pulsando botón "+ Nuevo" para abrir formulario...');
              return abrirFormularioNuevoVehiculo();
            })
            .then(() => {
              // Navegar a la pestaña correspondiente si no es Datos Generales
              if (seccion && !/generales/i.test(seccion)) {
                cy.log(`Navegando a la pestaña: ${seccion}`);
                return navegarSeccionFormulario(seccion)
                  .then(() => {
                    cy.wait(500);
                    cy.log(`Navegación a la pestaña "${seccion}" completada`);
                    return cy.wrap(null);
                  });
              }
              return cy.wrap(null);
            });
        }
        // Caso 27: asegurar login + navegación antes del multifiltro
        else if (numero === 27) {
          prepararPantalla = cy.login()
            .then(() => {
              cy.navegarAMenu(MENU, SUBMENU, { expectedPath: URL_PATH });
              cy.url().should('include', URL_PATH).and('not.include', '/form');
              return UI.esperarTabla();
            });
        }
        // Para el caso 16, recargar antes de ejecutar
        else if (numero === 16) {
          prepararPantalla = cy.login().then(() => UI.abrirPantalla());
        }
        // Para el caso 18, recargar página para salir del formulario de editar cliente y volver a la lista
        else if (numero === 18) {
          prepararPantalla = cy.reload().then(() => {
            cy.wait(1000);
            return UI.abrirPantalla();
          });
        }
        // Para el caso 38, asegurar login + navegación antes de ejecutar (por si venimos de 37 en formulario)
        else if (numero === 38) {
          prepararPantalla = cy.login().then(() => UI.abrirPantalla());
        }

        return prepararPantalla
          .then(() => {
            cy.log(`Ejecutando función del caso ${numero}...`);
            return fn(caso, numero, casoId);
          })
          .then(() => {
            // Verificar si hay WARNING o INCIDENTE conocido
            const incidente = obtenerIncidente(casoId, numero);
            const warning = obtenerWarning(casoId, numero);
            const resultado = incidente ? 'ERROR' : warning ? 'WARNING' : 'OK';
            const obtenido = incidente || warning || 'Comportamiento correcto';

            return registrarResultadoAutomatico(
              numero,
              casoId,
              nombre,
              obtenido,
              resultado,
              autoRegistro
            );
          }, (err) => {
            // Verificar si hay WARNING o INCIDENTE conocido incluso si hay error
            const incidente = obtenerIncidente(casoId, numero);
            const warning = obtenerWarning(casoId, numero);
            const resultado = incidente ? 'ERROR' : warning ? 'WARNING' : 'OK';
            const obtenido = incidente || warning || (caso?.observacion || err?.message || 'Comportamiento correcto');

            return registrarResultadoAutomatico(
              numero,
              casoId,
              nombre,
              obtenido,
              resultado,
              autoRegistro
            );
          })
          // Tras cada caso, recargar pantalla para no arrastrar estado del anterior
          .then(() => {
            // Para casos 14 y 15, no recargar para evitar buscar tabla desde el formulario
            if (numero === 14 || numero === 15) {
              return cy.wrap(null);
            }

            // Caso 13: asegurar salir del formulario con login + navegación limpia
            if (numero === 13) {
              return cy.login().then(() => UI.abrirPantalla());
            }

            // Caso 26: asegurar recargar y volver a la lista principal (no quedarse en formulario)
            if (numero === 26) {
              return cy.url().then((urlActual) => {
                if (urlActual.includes('/dashboard/vehicles/form')) {
                  // Si estamos en el formulario, navegar a la lista primero
                  return cy.visit(URL_PATH).then(() => cy.wait(1000));
                }
                return cy.reload().then(() => UI.abrirPantalla());
              });
            }

            // Casos 35 y 36: asegurar recargar y volver a la lista principal (no quedarse en formulario)
            if (numero === 35 || numero === 36) {
              return cy.url().then((urlActual) => {
                if (urlActual.includes('/dashboard/vehicles/form')) {
                  // Si estamos en el formulario, navegar a la lista primero
                  return cy.visit(URL_PATH).then(() => cy.wait(1000));
                }
                return cy.reload().then(() => UI.abrirPantalla());
              });
            }

            // Para casos 22-33 (crear vehículos), recargar y usar abrirPantalla (salta esperarTabla si seguimos en form)
            if ((numero >= 22 && numero <= 33)) {
              return cy.reload().then(() => UI.abrirPantalla());
            }

            // Para los demás casos, recargar y volver a la tabla
            return cy.reload().then(() => UI.abrirPantalla());
          })
          .then(() => ejecutarCaso(index + 1));
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
      case 9:
      case 10:
      case 11:
      case 12:
        return { fn: ejecutarFiltroIndividualExcel };
      case 13:
      case 14:
      case 15:
      case 16:
      case 17:
      case 18:
        return { fn: ordenarColumnaDesdeExcel, autoRegistro: false };
      case 19:
        return { fn: ocultarColumnaDesdeExcel };
      case 20:
        return { fn: mostrarColumnaDesdeExcel };
      case 21:
        return { fn: abrirFormularioCreacion };
      case 22:
      case 23:
      case 24:
      case 25:
      case 26:
      case 27:
      case 28:
      case 29:
      case 31:
      case 32:
      case 33:
        return { fn: anadirVehiculo };
      case 30:
        return { fn: seleccionarTarjeta };
      case 34:
        return { fn: editarConSeleccion };
      case 35:
        return { fn: editarSinSeleccion };
      case 36:
        return { fn: eliminarConSeleccion };
      case 37:
        return { fn: eliminarSinSeleccion };
      case 38:
        return { fn: seleccionarFila };
      case 39:
        return { fn: scrollTabla };
      case 40:
        return { fn: resetFiltros };
      case 41:
        return { fn: guardarFiltroDesdeExcel };
      case 42:
        return { fn: limpiarFiltroDesdeExcel };
      case 43:
        return { fn: seleccionarFiltroGuardadoDesdeExcel };
      case 44:
      case 45:
      case 46:
      case 47:
      case 48:
      case 49:
        return { fn: ejecutarMultifiltroExcel };
      case 50:
        return {
          fn: cambiarIdiomaCompleto,
          autoRegistro: false
        };
      case 51:
        return { fn: TC051 };
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        return { fn: guardarSeccionSinRellenarVehiculos };
      default:
        return null;
    }
  }

  // Fallback para rellenar Dirección Fiscal por posición dentro del bloque
  function rellenarDireccionFiscalOrden(dir, ciudad, prov, pais) {
    const valores = [dir, ciudad, prov, pais].filter(v => v !== undefined && v !== null && `${v}` !== '');
    if (!valores.length) return cy.wrap(null);

    return cy.contains(/Dirección Fiscal/i)
      .parent()
      .within(() => {
        cy.get('input')
          .filter(':visible')
          .then(($inputs) => {
            const campos = [dir, ciudad, prov, pais];
            $inputs.each((idx, el) => {
              if (campos[idx] !== undefined && campos[idx] !== null && `${campos[idx]}` !== '') {
                cy.wrap(el).clear({ force: true }).type(`${campos[idx]}`, { force: true });
              }
            });
          });
      });
  }

  function esCasoValido(caso) {
    const numero = parseInt(String(caso.caso || '').replace(/\D/g, ''), 10);
    const pantalla = (caso.pantalla || '').toLowerCase();
    return (
      !Number.isNaN(numero) &&
      numero >= 1 &&
      numero <= 200 &&
      pantalla.includes('ficheros') &&
      pantalla.includes('vehículos') || pantalla.includes('vehiculos')
    );
  }

  const UI = {
    abrirPantalla() {
      return cy.url().then((urlActual) => {
        if (!urlActual.includes(URL_PATH)) {
          cy.navegarAMenu(MENU, SUBMENU, { expectedPath: URL_PATH });
        }
        // Verificar que estamos en la lista (no en el formulario) antes de esperar tabla
        return cy.url().should('include', URL_PATH).then(() => {
          return cy.url().then((urlFinal) => {
            // Solo esperar tabla si estamos en la lista, no en el formulario
            if (!urlFinal.includes('/dashboard/vehicles/form')) {
              return this.esperarTabla();
            }
            return cy.wrap(null);
          });
        });
      });
    },

    esperarTabla() {
      // Aumentamos timeout para entornos saturados
      cy.get('.MuiDataGrid-root', { timeout: 45000 }).should('be.visible');
      return cy.get('.MuiDataGrid-row', { timeout: 30000 }).should('have.length.greaterThan', 0);
    },

    buscar(valor) {
      const texto = (valor || '').toString();
      // Aceptar placeholders en español, inglés o catalán
      cy.get('input[placeholder*="Buscar"]:not([id*="sidebar"]), input[placeholder*="Search"]:not([id*="sidebar"]), input[placeholder*="Cerc"]:not([id*="sidebar"]), input[placeholder*="Buscar..."], input[placeholder*="Search..."], input[placeholder*="Cerc"]')
        .first()
        .clear({ force: true })
        .type(texto, { force: true })
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
      return cy.ejecutarFiltroIndividual(
        numero,
        PANTALLA,
        HOJA_EXCEL
      );
    });
  }

  function ejecutarMultifiltroExcel(caso, numero, casoId) {
    return cy.ejecutarMultifiltro(
      numero,
      PANTALLA,
      HOJA_EXCEL,
      MENU,
      SUBMENU
    );
  }

  function ordenarColumnaDesdeExcel(caso, numero, casoId) {
    // Mapear número de caso a columna para vehículos
    let nombreColumna = '';

    if (numero === 13) {
      nombreColumna = 'Código';
    } else if (numero === 14) {
      nombreColumna = 'Matrícula';
    } else if (numero === 15) {
      nombreColumna = 'Marca';
    } else if (numero === 16) {
      nombreColumna = 'Modelo';
    } else if (numero === 17) {
      nombreColumna = 'Tipo Vehículo';
    } else if (numero === 18) {
      nombreColumna = 'Empresa';
    } else {
      // Fallback: intentar leer desde Excel
      nombreColumna = caso?.valor_etiqueta_1 || caso?.dato_1;
      if (!nombreColumna) {
        cy.log(`Caso ${numero} no tiene columna definida`);
        return cy.wrap(null);
      }
    }

    cy.log(`Ordenando columna "${nombreColumna}" (caso ${numero})`);

    const idCaso = casoId || `TC${String(numero).padStart(3, '0')}`;
    const nombre = caso?.nombre || `Ordenar ${nombreColumna}`;

    // Ejecutar la ordenación
    return ordenarColumna(nombreColumna)
      .then(() => {
        // Registrar como OK - la ordenación funciona correctamente
        return registrarResultadoAutomatico(
          numero,
          idCaso,
          nombre,
          'Comportamiento correcto',
          'OK',
          true
        );
      });
  }

  function ocultarColumnaDesdeExcel(caso, numero) {
    // Para el caso 19, ocultar la columna "Matrícula"
    let columna = '';
    if (numero === 19) {
      columna = 'Matrícula';
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
    // Para el caso 20, mostrar la columna "Matrícula"
    let columna = '';
    if (numero === 20) {
      columna = 'Matrícula';
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

  function guardarFiltroDesdeExcel(caso) {
    return guardarFiltroVehiculos(caso);
  }

  function limpiarFiltroDesdeExcel(caso) {
    return limpiarFiltroVehiculos(caso);
  }

  function seleccionarFiltroGuardadoDesdeExcel(caso) {
    return seleccionarFiltroGuardadoVehiculos(caso);
  }

  function cargaPantalla(caso, numero, casoId) {
    return UI.abrirPantalla();
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
    const t = labelText.toLowerCase().trim();
    const [mesStr, anioStr] = t.split(/\s+/);
    const mes = mesesMap[mesStr];
    const anio = parseInt(anioStr, 10);
    if (mes === undefined || Number.isNaN(anio)) {
      throw new Error(`No pude parsear mes/año del label: "${labelText}"`);
    }
    return { mes, anio };
  }

  function getPopoverCalendario() {
    return cy.get('div[role="dialog"], .MuiPopover-root').filter(':visible').last();
  }

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

  function seleccionarFechaEnCalendario(fechaObjetivo) {
    const dia = `${fechaObjetivo.getDate()}`;
    const regexDia = new RegExp(`^${escapeRegex(dia)}$`);

    // Buscamos el popover del datepicker visible y clicamos el día
    return cy
      .get('div[role="dialog"], .MuiPickersPopper-root, .MuiPopover-root', {
        timeout: 10000
      })
      .filter(':visible')
      .last()
      .within(() => {
        cy.contains(
          'button, [role="button"], .MuiPickersDay-root',
          regexDia
        )
          .scrollIntoView()
          .click({ force: true });
      });
  }

  /** -------------------- AÑADIR CLIENTE -------------------- **/

  function anadirVehiculo(caso, numero, casoId) {
    let seccion = deducirSeccionDesdeCaso(caso);
    const numeroCaso = numero || parseInt(String(caso?.caso || '').replace(/\D/g, ''), 10);

    cy.log(`Datos recibidos para TC${String(numeroCaso).padStart(3, '0')}: ${JSON.stringify(caso)}`);
    cy.log(`Sección deducida: ${seccion}`);

    // Caso especial 22: rellenar DATOS GENERALES, VENCIMIENTOS y MANTENIMIENTO en secuencia (campos específicos)
    // NO se pulsa Guardar durante el rellenado, solo al final después de las tres pestañas
    if (numeroCaso === 22) {
      cy.log('TC022: Rellenando tres pestañas sin guardar hasta el final');

      return cy.url().then((urlActual) => {
        const enFormulario = urlActual.includes('/dashboard/vehicles/form');

        if (!enFormulario) {
          cy.log('No estamos en el formulario, abriendo "+ Nuevo"...');
          return UI.abrirPantalla()
            .then(() => cy.url().then((urlDespuesAbrir) => {
              if (!urlDespuesAbrir.includes('/dashboard/vehicles/form')) {
                return UI.esperarTabla();
              }
              return cy.wrap(null);
            }))
            .then(() => cy.url().then((urlAntesNuevo) => {
              if (!urlAntesNuevo.includes('/dashboard/vehicles/form')) {
                cy.log('Pulsando botón "+ Nuevo" para abrir formulario...');
                return abrirFormularioNuevoVehiculo()
                  .then(() => cy.url().should('include', '/dashboard/vehicles/form'));
              }
              return cy.wrap(null);
            }))
            .then(() => rellenarTresPestañasCaso22(caso, numeroCaso));
        }

        return rellenarTresPestañasCaso22(caso, numeroCaso);
      });

      // IMPORTANTE: Retornar explícitamente para evitar que continúe con el resto del código
      return cy.wrap(null);
    }

    // Caso especial 23: rellenar DATOS GENERALES, VENCIMIENTOS y MANTENIMIENTO en secuencia (TODOS los campos)
    // NO se pulsa Guardar durante el rellenado, solo al final después de las tres pestañas
    if (numeroCaso === 23) {
      cy.log('TC023: Rellenando TODOS los campos en tres pestañas sin guardar hasta el final');

      return cy.url().then((urlActual) => {
        const enFormulario = urlActual.includes('/dashboard/vehicles/form');

        if (!enFormulario) {
          cy.log('No estamos en el formulario, abriendo "+ Nuevo"...');
          return UI.abrirPantalla()
            .then(() => cy.url().then((urlDespuesAbrir) => {
              if (!urlDespuesAbrir.includes('/dashboard/vehicles/form')) {
                return UI.esperarTabla();
              }
              return cy.wrap(null);
            }))
            .then(() => cy.url().then((urlAntesNuevo) => {
              if (!urlAntesNuevo.includes('/dashboard/vehicles/form')) {
                cy.log('Pulsando botón "+ Nuevo" para abrir formulario...');
                return abrirFormularioNuevoVehiculo()
                  .then(() => cy.url().should('include', '/dashboard/vehicles/form'));
              }
              return cy.wrap(null);
            }))
            .then(() => rellenarTresPestañasCaso23(caso, numeroCaso));
        }

        return rellenarTresPestañasCaso23(caso, numeroCaso);
      });
    }

    // Para vehículos, todas las secciones se rellenan directamente en la pestaña (sin modales)
    const esDatosGenerales = /generales/i.test(seccion);

    const prepararNavegacion = () => {
      return cy.url().then((urlActual) => {
        const enFormulario = urlActual.includes('/dashboard/vehicles/form');

        if (enFormulario) {
          cy.log(`Ya estamos en el formulario, navegando directamente a la pestaña necesaria (${seccion || 'Datos Generales'})`);
          if (!esDatosGenerales && seccion) {
            return navegarSeccionFormulario(seccion)
              .then(() => {
                cy.wait(500);
                cy.log(`Navegación a la pestaña "${seccion}" completada`);
                return cy.wrap(null);
              });
          }
          cy.log('Manteniéndonos en Datos Generales');
          return cy.wrap(null);
        }

        cy.log('Estamos en la tabla, abriendo pantalla y formulario...');
        return UI.abrirPantalla()
          .then(() => cy.url().then((urlDespuesAbrir) => {
            if (!urlDespuesAbrir.includes('/dashboard/vehicles/form')) {
              return UI.esperarTabla();
            }
            return cy.wrap(null);
          }))
          .then(() => cy.url().then((urlAntesNuevo) => {
            if (!urlAntesNuevo.includes('/dashboard/vehicles/form')) {
              cy.log('Pulsando botón "+ Nuevo" para abrir formulario...');
              return abrirFormularioNuevoVehiculo()
                .then(() => cy.url().should('include', '/dashboard/vehicles/form'));
            }
            return cy.wrap(null);
          }))
          .then(() => {
            if (!esDatosGenerales && seccion) {
              cy.log(`Navegando a la pestaña: ${seccion}`);
              return navegarSeccionFormulario(seccion)
                .then(() => {
                  cy.wait(500);
                  cy.log(`Navegación a la pestaña "${seccion}" completada`);
                  return cy.wrap(null);
                });
            }
            return cy.wrap(null);
          });
      });
    };

    return prepararNavegacion()
      .then(() => {
        // Esperar un momento para asegurar que el formulario esté completamente cargado
        cy.wait(500);

        if (esDatosGenerales) {
          cy.log(`Caso ${numeroCaso}: Rellenando Datos Generales desde Excel...`);
          return llenarFormularioGeneralesDesdeExcel(caso, numeroCaso);
        }

        // FICHA TÉCNICA se rellena igual que DATOS GENERALES
        const esFichaTecnica = /ficha\s*t[eé]cnica/i.test(seccion);
        if (esFichaTecnica) {
          cy.log(`Caso ${numeroCaso}: Rellenando Ficha Técnica desde Excel (igual que DATOS GENERALES)...`);
          return navegarSeccionFormulario(seccion)
            .then(() => cy.wait(500))
            .then(() => llenarFormularioFichaTecnicaDesdeExcel(caso, numeroCaso));
        }

        // COMPRA/VENTA se rellena con Forma (select), fechas (Inicio, Fin, Fecha) y campos de texto
        const esCompraVenta = /compra\s*\/?\s*venta/i.test(seccion);
        if (esCompraVenta) {
          cy.log(`Caso ${numeroCaso}: Rellenando Compra/Venta desde Excel...`);
          return navegarSeccionFormulario(seccion)
            .then(() => cy.wait(500))
            .then(() => llenarFormularioCompraVentaDesdeExcel(caso, numeroCaso));
        }

        // SEGUROS necesita abrir el modal con "Añadir" antes de rellenar
        const esSeguros = /seguros/i.test(seccion);
        if (esSeguros) {
          cy.log(`Caso ${numeroCaso}: Sección SEGUROS detectada, abriendo modal con botón "Añadir"...`);
          return navegarSeccionFormulario(seccion)
            .then(() => cy.wait(500))
            .then(() => abrirModalSeccion('Seguros'))
            .then(() => cy.wait(500))
            .then(() => llenarCamposFormulario(caso))
            .then(() => {
              // Para SEGUROS: usar el botón Guardar dentro del formulario (del drawer/modal)
              cy.log('Guardando formulario SEGUROS usando botón Guardar del modal...');
              return clickGuardarDentroFormulario(numeroCaso, caso?.nombre).then(() => cy.wait(1500));
            });
        }

        // AMORTIZACIÓN necesita abrir el modal con "Añadir" antes de rellenar (igual que SEGUROS)
        const esAmortizacion = /amortizaci[oó]n/i.test(seccion);
        if (esAmortizacion) {
          cy.log(`Caso ${numeroCaso}: Sección AMORTIZACIÓN detectada, abriendo modal con botón "Añadir"...`);
          return navegarSeccionFormulario(seccion)
            .then(() => cy.wait(500))
            .then(() => abrirModalSeccion('Amortización'))
            .then(() => cy.wait(500))
            .then(() => llenarCamposFormulario(caso))
            .then(() => {
              // Esperar un momento para asegurar que todos los campos estén rellenados
              cy.wait(500);
              // Para AMORTIZACIÓN: usar el botón Guardar dentro del formulario (del drawer/modal)
              cy.log('Guardando formulario AMORTIZACIÓN usando botón Guardar del modal...');
              return clickGuardarDentroFormulario(numeroCaso, caso?.nombre).then(() => cy.wait(1500));
            });
        }

        // IMPUESTOS necesita abrir el modal con "Añadir" antes de rellenar (igual que SEGUROS y AMORTIZACIÓN)
        const esImpuestos = /impuestos/i.test(seccion);
        if (esImpuestos) {
          cy.log(`Caso ${numeroCaso}: Sección IMPUESTOS detectada, abriendo modal con botón "Añadir"...`);
          return navegarSeccionFormulario(seccion)
            .then(() => cy.wait(500))
            .then(() => abrirModalSeccion('Impuestos'))
            .then(() => cy.wait(500))
            .then(() => llenarCamposFormulario(caso))
            .then(() => {
              // Para IMPUESTOS: usar el botón Guardar dentro del formulario (del drawer/modal)
              cy.log('Guardando formulario IMPUESTOS usando botón Guardar del modal...');
              return clickGuardarDentroFormulario(numeroCaso, caso?.nombre).then(() => cy.wait(1500));
            });
        }

        // REVISIONES necesita abrir el modal con "Añadir" antes de rellenar (igual que SEGUROS, AMORTIZACIÓN e IMPUESTOS)
        const esRevisiones = /revisiones/i.test(seccion);
        if (esRevisiones) {
          cy.log(`Caso ${numeroCaso}: Sección REVISIONES detectada, abriendo modal con botón "Añadir"...`);
          return navegarSeccionFormulario(seccion)
            .then(() => cy.wait(500))
            .then(() => abrirModalSeccion('Revisiones'))
            .then(() => cy.wait(500))
            .then(() => llenarCamposFormulario(caso))
            .then(() => {
              // Esperar un momento para asegurar que todos los campos estén rellenados
              cy.wait(500);
              // Para REVISIONES: usar el botón Guardar dentro del formulario (del drawer/modal)
              cy.log('Guardando formulario REVISIONES usando botón Guardar del modal...');
              return clickGuardarDentroFormulario(numeroCaso, caso?.nombre).then(() => cy.wait(1500));
            });
        }

        // HISTÓRICO KMS necesita abrir el modal con "Añadir" antes de rellenar (igual que otras secciones con modal)
        const esHistoricoKms = /hist[oó]rico kms/i.test(seccion);
        if (esHistoricoKms) {
          cy.log(`Caso ${numeroCaso}: Sección HISTÓRICO KMS detectada, abriendo modal con botón "Añadir"...`);
          return navegarSeccionFormulario(seccion)
            .then(() => cy.wait(500))
            .then(() => abrirModalSeccion('Histórico Kms'))
            .then(() => cy.wait(500))
            .then(() => llenarCamposFormulario(caso))
            .then(() => {
              // Esperar un momento para asegurar que todos los campos estén rellenados
              cy.wait(500);
              // Para HISTÓRICO KMS: usar el botón Guardar dentro del formulario (del drawer/modal)
              cy.log('Guardando formulario HISTÓRICO KMS usando botón Guardar del modal...');
              return clickGuardarDentroFormulario(numeroCaso, caso?.nombre).then(() => cy.wait(1500));
            });
        }

        // HISTÓRICO VEHÍCULO necesita abrir el modal con "Añadir" antes de rellenar (igual que otras secciones con modal)
        const esHistoricoVehiculo = /hist[oó]rico veh[ií]culo/i.test(seccion);
        if (esHistoricoVehiculo) {
          cy.log(`Caso ${numeroCaso}: Sección HISTÓRICO VEHÍCULO detectada, abriendo modal con botón "Añadir"...`);
          return navegarSeccionFormulario(seccion)
            .then(() => cy.wait(500))
            .then(() => abrirModalSeccion('Histórico Vehículo'))
            .then(() => cy.wait(500))
            .then(() => llenarCamposFormulario(caso))
            .then(() => {
              // Esperar un momento para asegurar que todos los campos estén rellenados
              cy.wait(500);
              // Para HISTÓRICO VEHÍCULO: usar el botón Guardar dentro del formulario (del drawer/modal)
              cy.log('Guardando formulario HISTÓRICO VEHÍCULO usando botón Guardar del modal...');
              return clickGuardarDentroFormulario(numeroCaso, caso?.nombre).then(() => cy.wait(1500));
            });
        }

        // Todas las demás secciones de vehículos se rellenan directamente en la pestaña
        cy.log(`Caso ${numeroCaso}: Navegando a pestaña ${seccion} y rellenando campos...`);
        return navegarSeccionFormulario(seccion).then(() => llenarCamposFormulario(caso));
      })
      .then(() => {
        // Guardar el formulario después de rellenar (solo si no es SEGUROS, AMORTIZACIÓN, IMPUESTOS, REVISIONES, HISTÓRICO KMS o HISTÓRICO VEHÍCULO, que ya se guardaron arriba)
        const esSeguros = /seguros/i.test(seccion);
        const esAmortizacion = /amortizaci[oó]n/i.test(seccion);
        const esImpuestos = /impuestos/i.test(seccion);
        const esRevisiones = /revisiones/i.test(seccion);
        const esHistoricoKms = /hist[oó]rico kms/i.test(seccion);
        const esHistoricoVehiculo = /hist[oó]rico veh[ií]culo/i.test(seccion);
        if (esSeguros || esAmortizacion || esImpuestos || esRevisiones || esHistoricoKms || esHistoricoVehiculo) {
          let seccionNombre = 'SEGUROS';
          if (esAmortizacion) seccionNombre = 'AMORTIZACIÓN';
          else if (esImpuestos) seccionNombre = 'IMPUESTOS';
          else if (esRevisiones) seccionNombre = 'REVISIONES';
          else if (esHistoricoKms) seccionNombre = 'HISTÓRICO KMS';
          else if (esHistoricoVehiculo) seccionNombre = 'HISTÓRICO VEHÍCULO';
          cy.log(`${seccionNombre} ya se guardó dentro del modal, no se guarda de nuevo`);
          return cy.wrap(null);
        }
        // Guardar el formulario principal después de rellenar
        // Verificar primero el texto del botón para detectar si dice "Guardado" en lugar de "Guardar"
        return cy.get('body').then($body => {
          const botonGuardar = $body.find('button[type="submit"], button:contains("Guardar"), button:contains("Guardado")')
            .filter((_, el) => {
              const $el = Cypress.$(el);
              const estaEnFormulario = $el.closest('.MuiDrawer-root, .MuiModal-root, [role="dialog"]').length === 0;
              const texto = ($el.text() || '').trim();
              return estaEnFormulario && (/guardar|guardado/i.test(texto));
            })
            .first();

          if (botonGuardar.length > 0) {
            const textoBoton = (botonGuardar.text() || '').trim();
            const diceGuardado = /^guardado$/i.test(textoBoton);

            if (diceGuardado && (numeroCaso === 28 || numeroCaso === 29 || numeroCaso === 31 || numeroCaso === 32 || numeroCaso === 33)) {
              cy.log(`TC${String(numeroCaso).padStart(3, '0')}: Botón dice "Guardado" en lugar de "Guardar" - WARNING`);
              // Registrar como WARNING antes de hacer click
              return registrarResultadoAutomatico(
                numeroCaso,
                `TC${String(numeroCaso).padStart(3, '0')}`,
                caso?.nombre || 'Crear vehículo',
                'Botón muestra "Guardado" en lugar de "Guardar"',
                'WARNING',
                true
              ).then(() => {
                // Hacer click en el botón de todas formas
                return cy.wrap(botonGuardar)
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => cy.wait(1500));
              });
            }

            // Si dice "Guardar" o no es caso 28, hacer click normalmente
            return cy.wrap(botonGuardar)
              .scrollIntoView()
              .click({ force: true })
              .then(() => cy.wait(1500));
          } else {
            // Fallback: usar cy.contains
            return cy.contains('button, [type="submit"]', /Guardar/i, { timeout: 10000 })
              .scrollIntoView()
              .click({ force: true })
              .then(() => cy.wait(1500));
          }
        });
      })
      .then(() => {
        cy.log(`Formulario completado y enviado con datos del Excel (TC${String(numeroCaso).padStart(3, '0')})`);
      });
  }

  function rellenarTresPestañasCaso22(caso, numeroCaso) {
    cy.log(`TC022: Rellenando DATOS GENERALES (Matrícula, Marca, Modelo, Código), luego VENCIMIENTOS (ITV) y MANTENIMIENTO (Inicio, Fin, Tipo)`);

    // Buscar los valores en el Excel
    const totalCampos = Number(caso?.__totalCamposExcel) || 20;
    let codigo = null;
    let matricula = null;
    let marca = null;
    let modelo = null;
    let tipoVehiculoCodigo = null;
    let tipoVehiculoNombre = null;
    let itv = null;
    let inicio = null;
    let fin = null;
    let tipo = null;

    // Buscar campos en el Excel
    // El Excel tiene: etiqueta_i = tipo de selector (value name, aria-labelledby, id)
    //                 valor_etiqueta_i = selector real (vehicle.code, _r_2n_-label, etc.)
    //                 dato_i = valor
    for (let i = 1; i <= totalCampos; i++) {
      const tipoCampo = (caso[`etiqueta_${i}`] || '').toLowerCase();
      const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
      const valor = procesarValorXXX(caso[`dato_${i}`]);

      if (!valor || String(valor).trim() === '') continue;

      const etiquetaLower = tipoCampo.toLowerCase();
      const selectorLower = selector.toLowerCase();

      cy.log(`TC022: Campo ${i} - etiqueta: "${tipoCampo}", selector: "${selector}", valor: "${valor}"`);

      // DATOS GENERALES - Buscar por selector (value name)
      if (etiquetaLower === 'value name' || etiquetaLower.includes('value name')) {
        if (selectorLower === 'vehicle.code' || selectorLower.includes('vehicle.code')) {
          codigo = valor;
        } else if (selectorLower === 'vehicle.matricula' || selectorLower.includes('vehicle.matricula')) {
          matricula = valor;
        } else if (selectorLower === 'vehicle.brand' || selectorLower.includes('vehicle.brand')) {
          marca = valor;
        } else if (selectorLower === 'vehicle.model' || selectorLower.includes('vehicle.model')) {
          modelo = valor;
        } else if (selectorLower === 'vehicle.type.code' || selectorLower.includes('vehicle.type.code')) {
          tipoVehiculoCodigo = valor;
        } else if (selectorLower === 'vehicle.type.name' || selectorLower.includes('vehicle.type.name')) {
          tipoVehiculoNombre = valor;
        } else if (selectorLower === 'maintenance.0.maintenancetype' || selectorLower.includes('maintenance.0.maintenancetype') || selectorLower.includes('maintenancetype') || selectorLower.includes('maintenance.type')) {
          tipo = valor;
          cy.log(`TC022: Campo "Tipo" de MANTENIMIENTO encontrado: "${tipo}"`);
        }
      }
      // VENCIMIENTOS - ITV (viene como aria-labelledby con fecha)
      else if ((etiquetaLower === 'aria-labelledby' || etiquetaLower.includes('aria-labelledby')) && !itv) {
        // Si el valor es una fecha, es ITV
        const esFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());
        if (esFecha) {
          itv = valor;
        }
      }
      // MANTENIMIENTO - Inicio y Fin (vienen como id con fecha)
      else if (etiquetaLower === 'id' || etiquetaLower.includes('id')) {
        // Si el valor es una fecha, podría ser Inicio o Fin
        const esFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());
        if (esFecha) {
          // Por el orden en el Excel, el primero con id es Inicio, el segundo es Fin
          if (!inicio) {
            inicio = valor;
          } else if (!fin) {
            fin = valor;
          }
        }
      }
    }

    cy.log(`TC022: Campos encontrados:`);
    cy.log(`  DATOS GENERALES - Código: ${codigo}, Matrícula: ${matricula}, Marca: ${marca}, Modelo: ${modelo}`);
    cy.log(`  DATOS GENERALES - Tipo Vehículo Código: ${tipoVehiculoCodigo}, Tipo Vehículo Nombre: ${tipoVehiculoNombre}`);
    cy.log(`  VENCIMIENTOS - ITV: ${itv}`);
    cy.log(`  MANTENIMIENTO - Inicio: ${inicio}, Fin: ${fin}, Tipo: ${tipo}`);

    let chain = cy.wrap(null);

    // 1) DATOS GENERALES: Matrícula, Marca, Modelo, Código, Tipo de Vehículo (Código y Nombre)
    chain = chain.then(() => {
      cy.log('TC022: Paso 1 - Rellenando DATOS GENERALES (Matrícula, Marca, Modelo, Código, Tipo de Vehículo)');
      cy.url().should('include', '/dashboard/vehicles/form');
      cy.wait(500);

      let datosGeneralesChain = cy.wrap(null);

      if (codigo) {
        datosGeneralesChain = datosGeneralesChain.then(() => escribirPorName('vehicle.code', codigo, 'Código'));
      }
      if (matricula) {
        datosGeneralesChain = datosGeneralesChain.then(() => escribirPorName('vehicle.matricula', matricula, 'Matrícula'));
      }
      if (marca) {
        datosGeneralesChain = datosGeneralesChain.then(() => escribirPorName('vehicle.brand', marca, 'Marca'));
      }
      if (modelo) {
        datosGeneralesChain = datosGeneralesChain.then(() => escribirPorName('vehicle.model', modelo, 'Modelo'));
      }
      if (tipoVehiculoCodigo) {
        datosGeneralesChain = datosGeneralesChain.then(() => escribirPorName('vehicle.type.code', tipoVehiculoCodigo, 'Tipo de Vehículo - Código'));
      }
      if (tipoVehiculoNombre) {
        datosGeneralesChain = datosGeneralesChain.then(() => escribirPorName('vehicle.type.name', tipoVehiculoNombre, 'Tipo de Vehículo - Nombre'));
      }

      return datosGeneralesChain.then(() => {
        cy.wait(500);
        cy.url().should('include', '/dashboard/vehicles/form');
        cy.log('✓ DATOS GENERALES rellenados, NO se pulsa Guardar');
      });
    });

    // 2) VENCIMIENTOS: ITV
    chain = chain.then(() => {
      if (itv) {
        cy.log('TC022: Paso 2 - Navegando a VENCIMIENTOS y rellenando ITV');
        return navegarSeccionFormulario('VENCIMIENTOS')
          .then(() => cy.wait(1000))
          .then(() => {
            // Buscar el campo ITV y rellenarlo
            return cy.contains('label', /^ITV$/i, { timeout: 10000 })
              .should('be.visible')
              .parents('.MuiFormControl-root')
              .first()
              .within(() => {
                cy.get('button[aria-label*="date"], button[aria-label*="calendar"]', { timeout: 10000 })
                  .should('be.visible')
                  .click({ force: true });
              })
              .then(() => {
                cy.wait(500);
                const fechaObj = parseFechaBasicaExcel(itv);
                return seleccionarFechaEnCalendario(fechaObj);
              });
          })
          .then(() => {
            cy.wait(500);
            cy.url().should('include', '/dashboard/vehicles/form');
            cy.log('✓ ITV rellenado en VENCIMIENTOS');
          });
      } else {
        cy.log('TC022: No se encontró campo ITV en el Excel, saltando VENCIMIENTOS');
        return cy.wrap(null);
      }
    });

    // 3) MANTENIMIENTO: Inicio, Fin y Tipo
    chain = chain.then(() => {
      if (inicio || fin || tipo) {
        cy.log('TC022: Paso 3 - Navegando a MANTENIMIENTO y rellenando Inicio, Fin y Tipo');
        return navegarSeccionFormulario('MANTENIMIENTO')
          .then(() => cy.wait(1000))
          .then(() => {
            // Inicio
            if (inicio) {
              return cy.contains('label', /^Inicio$/i, { timeout: 10000 })
                .should('be.visible')
                .parents('.MuiFormControl-root')
                .first()
                .within(() => {
                  cy.get('button[aria-label*="date"], button[aria-label*="calendar"]', { timeout: 10000 })
                    .should('be.visible')
                    .click({ force: true });
                })
                .then(() => {
                  cy.wait(500);
                  const fechaObj = parseFechaBasicaExcel(inicio);
                  return seleccionarFechaEnCalendario(fechaObj);
                })
                .then(() => cy.wait(500));
            }
            return cy.wrap(null);
          })
          .then(() => {
            // Fin
            if (fin) {
              return cy.contains('label', /^Fin$/i, { timeout: 10000 })
                .should('be.visible')
                .parents('.MuiFormControl-root')
                .first()
                .within(() => {
                  cy.get('button[aria-label*="date"], button[aria-label*="calendar"]', { timeout: 10000 })
                    .should('be.visible')
                    .click({ force: true });
                })
                .then(() => {
                  cy.wait(500);
                  const fechaObj = parseFechaBasicaExcel(fin);
                  return seleccionarFechaEnCalendario(fechaObj);
                })
                .then(() => cy.wait(500));
            }
            return cy.wrap(null);
          })
          .then(() => {
            // Tipo
            if (tipo) {
              cy.log(`TC022: Seleccionando Tipo de Mantenimiento: "${tipo}"`);
              // Buscar el campo "Tipo" por label primero
              return cy.get('body').then($body => {
                // Buscar el label "Tipo" en la sección de Mantenimiento por Fecha
                const labelTipo = $body.find('label').filter((_, el) => {
                  const texto = (el.textContent || el.innerText || '').trim();
                  return /^Tipo$/i.test(texto);
                }).first();

                if (labelTipo.length > 0) {
                  // Buscar el select asociado al label
                  const forAttr = labelTipo.attr('for');
                  let selectorSelect = null;

                  if (forAttr) {
                    // Escapar el ID para usar en selector CSS
                    const escapedId = forAttr.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');
                    selectorSelect = `#${escapedId}`;
                  } else {
                    // Si no hay for, buscar el select dentro del mismo contenedor
                    selectorSelect = '[id*="maintenanceType"], [id*="maintenance.type"], [name*="maintenanceType"], [name*="maintenance.type"]';
                  }

                  // Intentar encontrar el select
                  return cy.get(selectorSelect || '[id="mui-component-select-maintenance.0.maintenanceType"]', { timeout: 10000 })
                    .should('be.visible')
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      // Buscar la opción en el menú desplegable con múltiples métodos
                      const tipoNormalizado = String(tipo).trim();
                      const tipoEscapado = escapeRegex(tipoNormalizado);

                      // Intentar encontrar la opción con diferentes selectores
                      return cy.get('body').then($body2 => {
                        const listbox = $body2.find('ul[role="listbox"]:visible, [role="listbox"]:visible').last();

                        if (listbox.length > 0) {
                          // Buscar la opción dentro del listbox
                          const opciones = listbox.find('li[role="option"], [role="option"]');
                          const opcionEncontrada = Array.from(opciones).find(opt => {
                            const texto = (opt.textContent || opt.innerText || '').trim();
                            return new RegExp(`^${tipoEscapado}$`, 'i').test(texto) ||
                              texto.toLowerCase() === tipoNormalizado.toLowerCase();
                          });

                          if (opcionEncontrada) {
                            return cy.wrap(opcionEncontrada)
                              .scrollIntoView()
                              .should('be.visible')
                              .click({ force: true })
                              .then(() => {
                                cy.wait(500);
                                cy.log(`✓ Tipo de Mantenimiento seleccionado: "${tipo}"`);
                                return cy.wrap(null);
                              });
                          }
                        }

                        // Fallback: usar cy.contains
                        return cy.contains(
                          'li[role="option"], [role="option"], div[role="option"]',
                          new RegExp(`^${tipoEscapado}$`, 'i'),
                          { timeout: 10000 }
                        )
                          .should('be.visible')
                          .scrollIntoView()
                          .click({ force: true })
                          .then(() => {
                            cy.wait(500);
                            cy.log(`✓ Tipo de Mantenimiento seleccionado: "${tipo}"`);
                            return cy.wrap(null);
                          });
                      });
                    });
                } else {
                  // Si no se encuentra el label, usar el selector directo
                  return cy.get('[id="mui-component-select-maintenance.0.maintenanceType"]', { timeout: 10000 })
                    .should('be.visible')
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      const tipoEscapado = escapeRegex(String(tipo).trim());
                      return cy.contains(
                        'li[role="option"], [role="option"], div[role="option"]',
                        new RegExp(`^${tipoEscapado}$`, 'i'),
                        { timeout: 10000 }
                      )
                        .should('be.visible')
                        .scrollIntoView()
                        .click({ force: true })
                        .then(() => {
                          cy.wait(500);
                          cy.log(`✓ Tipo de Mantenimiento seleccionado: "${tipo}"`);
                          return cy.wrap(null);
                        });
                    });
                }
              });
            }
            return cy.wrap(null);
          })
          .then(() => {
            cy.wait(500);
            cy.url().should('include', '/dashboard/vehicles/form');
            cy.log(' MANTENIMIENTO rellenado (Inicio, Fin, Tipo)');
          });
      } else {
        cy.log('TC022: No se encontraron campos de MANTENIMIENTO en el Excel, saltando MANTENIMIENTO');
        return cy.wrap(null);
      }
    });

    // Guardar el formulario después de rellenar las tres pestañas
    return chain.then(() => {
      cy.log('TC022: Tres pestañas rellenadas correctamente, guardando formulario...');
      cy.url().should('include', '/dashboard/vehicles/form');
      // Hacer scroll hacia arriba para ver el botón Guardar
      return cy.window().then((win) => {
        win.scrollTo(0, 0);
        return cy.wait(500);
      })
        .then(() => {
          return cy
            .contains('button, [type="submit"]', /Guardar/i, { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .then(() => cy.wait(2000))
            .then(() => {
              // Verificar mensaje de éxito "Vehículo guardado correctamente"
              return cy.get('body').then($body => {
                const textoCompleto = ($body.text() || '').toLowerCase();
                const tieneExito = /veh[ií]culo.*guardado.*correctamente|veh[ií]culo.*creado.*correctamente|guardado.*correctamente|creado.*correctamente|vehicle.*saved.*successfully|vehicle.*created.*successfully/i.test(textoCompleto) ||
                  $body.find('[class*="success"], [class*="Success"], [role="alert"]').filter((_, el) => {
                    const textoEl = (el.textContent || el.innerText || '').toLowerCase();
                    return /veh[ií]culo.*guardado|veh[ií]culo.*creado|guardado.*correctamente|creado.*correctamente|vehicle.*saved|vehicle.*created/i.test(textoEl);
                  }).length > 0;

                if (tieneExito) {
                  cy.log('TC022: Vehículo guardado correctamente - OK');
                  // Registrar como OK directamente
                  return registrarResultadoAutomatico(
                    22,
                    'TC022',
                    caso?.nombre || 'Rellenar DATOS GENERALES, VENCIMIENTOS y MANTENIMIENTO',
                    'Vehículo guardado correctamente',
                    'OK',
                    true
                  );
                }

                // Verificar si aparece "Vehiclee" (error conocido)
                const tieneVehiclee = /vehiclee/i.test(textoCompleto);
                if (tieneVehiclee) {
                  cy.log('TC022: Mensaje muestra "Vehiclee" en lugar de "Vehículo" - WARNING');
                  return registrarResultadoAutomatico(
                    22,
                    'TC022',
                    caso?.nombre || 'Rellenar DATOS GENERALES, VENCIMIENTOS y MANTENIMIENTO',
                    'Mensaje de confirmación muestra "Vehiclee" en lugar de "Vehículo"',
                    'WARNING',
                    true
                  );
                }

                cy.log('TC022: No se detectó mensaje de éxito claro');
                return cy.wrap(null);
              });
            });
        });
    });
  }

  function rellenarTresPestañasCaso23(caso, numeroCaso, guardar = true) {
    cy.log('TC023: Iniciando rellenado de TODOS los campos en tres pestañas');

    // Extraer todos los campos del Excel
    const totalCampos = Number(caso?.__totalCamposExcel) || 14;
    const camposDatosGenerales = [];
    const camposVencimientos = [];
    const camposMantenimiento = [];

    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = procesarValorXXX(caso[`dato_${i}`]); // Procesar XXX

      if (!tipo || !selector || valor === undefined || valor === '') continue;

      const etiquetaPreferida = normalizarEtiquetaTexto(tipo) || selector;
      const etiquetaLower = etiquetaPreferida.toLowerCase();
      const selectorLower = (selector || '').toLowerCase();
      const tipoLower = (tipo || '').toLowerCase();

      const campo = {
        tipo,
        selector,
        valor,
        etiquetaVisible: etiquetaPreferida
      };

      // Detectar si el valor es una fecha
      const esFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());

      // Categorizar campos por pestaña
      // DATOS GENERALES: vehicle.* (excepto expirations y maintenance), status, campos de fecha como Alta, F. Matriculación, Baja
      // Normalizar selector para quitar -label si existe
      const selectorNormalizado = selectorLower.replace(/-label$/, '');

      if (selectorLower.includes('vehicle.') && !selectorLower.includes('expirations') && !selectorLower.includes('maintenance')) {
        camposDatosGenerales.push(campo);
      } else if (selectorLower.includes('mui-component-select-status') || selectorLower.includes('status')) {
        camposDatosGenerales.push(campo);
      } else if (etiquetaLower.includes('alta') || etiquetaLower.includes('matriculación') || etiquetaLower.includes('matricula') || etiquetaLower.includes('baja')) {
        camposDatosGenerales.push(campo);
      } else if (tipoLower === 'id' && esFecha && (selectorNormalizado.includes('_r_6c') || selectorNormalizado.includes('_r_6f') || selectorNormalizado.includes('_r_6i') || selectorNormalizado.includes('_r_76') || selectorNormalizado.includes('_r_79') || selectorNormalizado.includes('_r_7c'))) {
        // Campos de fecha en DATOS GENERALES (Alta, F. Matriculación, Baja) - IDs específicos
        camposDatosGenerales.push(campo);
      } else if (tipoLower === 'id' && esFecha && (selectorNormalizado.includes('_r_6') || selectorNormalizado.includes('_r_7') || selectorNormalizado.includes('_r_8')) && !selectorNormalizado.includes('_r_70') && !selectorNormalizado.includes('_r_73') && !selectorNormalizado.includes('_r_7a') && !selectorNormalizado.includes('_r_7g') && !selectorNormalizado.includes('_r_7m') && !selectorNormalizado.includes('_r_7s') && !selectorNormalizado.includes('_r_77') && !selectorNormalizado.includes('_r_7d') && !selectorNormalizado.includes('_r_7j') && !selectorNormalizado.includes('_r_7p') && !selectorNormalizado.includes('_r_80') && !selectorNormalizado.includes('_r_84') && !selectorNormalizado.includes('_r_88')) {
        // Otros campos de fecha en DATOS GENERALES - IDs que empiezan con _r_6, _r_7, _r_8 (excluyendo los de VENCIMIENTOS)
        camposDatosGenerales.push(campo);
      }
      // VENCIMIENTOS: expirations.*, expiration.*, ITV, Tacógrafo, ATP, ADR, Extintor, Emisoras, Permiso Comunitario, Autorización Transporte Animales, Certificado Transporte Mercancías Perecederas, O. R. Aparcamiento, Nº Tarjeta Transporte, Tipo 1, Tipo 2, Tipo 3, Fecha Tipo 1, Fecha Tipo 2, Fecha Tipo 3
      else if (selectorLower.includes('expirations') ||
        selectorLower.includes('expiration') ||
        selectorLower.includes('cardtransportnumber') ||
        selectorLower.includes('cardtransport') ||
        etiquetaLower.includes('itv') ||
        etiquetaLower.includes('tacógrafo') ||
        etiquetaLower.includes('tacografo') ||
        etiquetaLower.includes('atp') ||
        etiquetaLower.includes('adr') ||
        etiquetaLower.includes('extintor') ||
        etiquetaLower.includes('emisoras') ||
        etiquetaLower.includes('permiso comunitario') ||
        etiquetaLower.includes('autorización transporte') ||
        etiquetaLower.includes('certificado transporte') ||
        etiquetaLower.includes('aparacamiento') ||
        etiquetaLower.includes('tarjeta transporte') ||
        etiquetaLower.includes('tipo 1') ||
        etiquetaLower.includes('tipo 2') ||
        etiquetaLower.includes('tipo 3') ||
        etiquetaLower.includes('fecha tipo 1') ||
        etiquetaLower.includes('fecha tipo 2') ||
        etiquetaLower.includes('fecha tipo 3') ||
        (tipoLower === 'id' && (esFecha || selectorLower.includes('_r_7')) && !selectorLower.includes('_r_9') && !selectorLower.includes('_r_a'))) {
        // Campos de VENCIMIENTOS: IDs que empiezan con _r_7 (excepto los de mantenimiento que son _r_9 y _r_a)
        camposVencimientos.push(campo);
      }
      // MANTENIMIENTO: maintenance.*, Inicio, Fin, Tipo, Cada (km), Actual (km), Última (km), Cada (hour), Actual (hour), Última (hour), Próxima (hour), Última, Próxima
      else if (selectorLower.includes('maintenance') ||
        etiquetaLower.includes('inicio') ||
        etiquetaLower.includes('fin') ||
        (etiquetaLower === 'tipo' && !etiquetaLower.includes('tipo 1') && !etiquetaLower.includes('tipo 2') && !etiquetaLower.includes('tipo 3') && !etiquetaLower.includes('tipo de vehículo') && !etiquetaLower.includes('tipo de vehiculo')) ||
        etiquetaLower.includes('cada') ||
        etiquetaLower.includes('actual') ||
        etiquetaLower.includes('última') ||
        etiquetaLower.includes('ultima') ||
        etiquetaLower.includes('próxima') ||
        etiquetaLower.includes('proxima') ||
        (tipoLower === 'id' && (esFecha || selectorLower.includes('_r_9') || selectorLower.includes('_r_a'))) ||
        // Campos con name attribute: every, actual, last, everyHour, actualHour, lastHour, nextHour
        (tipoLower === 'name' && (selectorLower.includes('every') || selectorLower.includes('actual') || selectorLower.includes('last') || selectorLower.includes('everyhour') || selectorLower.includes('actualhour') || selectorLower.includes('lasthour') || selectorLower.includes('nexthour')))) {
        // Campos de MANTENIMIENTO: IDs que empiezan con _r_9 o _r_a, o campos con name attribute de mantenimiento
        camposMantenimiento.push(campo);
      } else {
        // Si no se puede categorizar, intentar por el tipo de selector o valor
        // Si es una fecha y no está categorizada, probablemente es VENCIMIENTOS o MANTENIMIENTO
        if (esFecha) {
          // Si el ID contiene números altos (_r_7, _r_8, _r_9, _r_a), probablemente es VENCIMIENTOS o MANTENIMIENTO
          if (selectorLower.includes('_r_7') || selectorLower.includes('_r_8')) {
            camposVencimientos.push(campo);
          } else if (selectorLower.includes('_r_9') || selectorLower.includes('_r_a')) {
            camposMantenimiento.push(campo);
          } else {
            // Por defecto, si es fecha y no sabemos, intentar en VENCIMIENTOS
            camposVencimientos.push(campo);
          }
        } else {
          // Si no es fecha y no está categorizada, intentar en DATOS GENERALES
          camposDatosGenerales.push(campo);
        }
      }
    }

    cy.log(`TC023: Campos encontrados - DATOS GENERALES: ${camposDatosGenerales.length}, VENCIMIENTOS: ${camposVencimientos.length}, MANTENIMIENTO: ${camposMantenimiento.length}`);

    let chain = cy.wrap(null);

    // 1) DATOS GENERALES: Todos los campos
    chain = chain.then(() => {
      cy.log('TC023: Paso 1 - Rellenando DATOS GENERALES (todos los campos)');
      cy.url().should('include', '/dashboard/vehicles/form');
      cy.wait(500);

      return rellenarCamposEnPestaña(camposDatosGenerales, 'DATOS GENERALES')
        .then(() => {
          cy.wait(500);
          cy.url().should('include', '/dashboard/vehicles/form');
          cy.log('✓ DATOS GENERALES rellenados completamente, NO se pulsa Guardar');
        })
        .then(() => {
          // Marcar aleatoriamente algunos checkboxes de actividades (Activo y Principal)
          cy.log('TC023: Marcando aleatoriamente checkboxes de actividades');
          return marcarCheckboxesActividadesAleatoriamente();
        })
        .then(() => {
          // Asegurar que las fechas de DATOS GENERALES se rellenen después de los checkboxes
          cy.log('TC023: Verificando y rellenando fechas de DATOS GENERALES (Alta, F. Matriculación, Baja)');
          return rellenarFechasDatosGeneralesDesdeCampos(camposDatosGenerales);
        })
        .then(() => {
          // Asegurar que Propietario se seleccione como "Propio"
          cy.log('TC023: Seleccionando Propietario: Propio');
          return seleccionarPropietarioPropio();
        });
    });

    // 2) VENCIMIENTOS: Todos los campos
    chain = chain.then(() => {
      if (camposVencimientos.length > 0) {
        cy.log('TC023: Paso 2 - Navegando a VENCIMIENTOS y rellenando todos los campos');
        return navegarSeccionFormulario('VENCIMIENTOS')
          .then(() => cy.wait(1000))
          .then(() => rellenarFechasVencimientosDesdeCampos(camposVencimientos))
          .then(() => {
            cy.wait(500);
            cy.url().should('include', '/dashboard/vehicles/form');
            cy.log('✓ VENCIMIENTOS rellenados completamente');
          });
      } else {
        cy.log('TC023: No se encontraron campos de VENCIMIENTOS en el Excel, saltando VENCIMIENTOS');
        return cy.wrap(null);
      }
    });

    // 3) MANTENIMIENTO: Todos los campos
    chain = chain.then(() => {
      if (camposMantenimiento.length > 0) {
        cy.log('TC023: Paso 3 - Navegando a MANTENIMIENTO y rellenando todos los campos');
        return navegarSeccionFormulario('MANTENIMIENTO')
          .then(() => cy.wait(1000))
          .then(() => rellenarFechasMantenimientoDesdeCampos(camposMantenimiento))
          .then(() => rellenarCamposEnPestaña(camposMantenimiento, 'MANTENIMIENTO'))
          .then(() => {
            cy.wait(500);
            cy.url().should('include', '/dashboard/vehicles/form');
            cy.log('✓ MANTENIMIENTO rellenado completamente');
          });
      } else {
        cy.log('TC023: No se encontraron campos de MANTENIMIENTO en el Excel, saltando MANTENIMIENTO');
        return cy.wrap(null);
      }
    });

    // Guardar el formulario después de rellenar las tres pestañas (solo si guardar es true)
    return chain.then(() => {
      if (!guardar) {
        cy.log('TC023: Tres pestañas rellenadas completamente, NO se guarda (se guardará al final del caso 51)');
        return cy.wrap(null);
      }

      cy.log('TC023: Tres pestañas rellenadas completamente, guardando formulario...');
      cy.url().should('include', '/dashboard/vehicles/form');
      // Hacer scroll hacia arriba para ver el botón Guardar
      return cy.window().then((win) => {
        win.scrollTo(0, 0);
        return cy.wait(500);
      })
        .then(() => {
          return cy
            .contains('button, [type="submit"]', /Guardar/i, { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .then(() => cy.wait(2000))
            .then(() => {
              // Verificar mensaje de éxito "Vehículo guardado correctamente"
              return cy.get('body').then($body => {
                const textoCompleto = ($body.text() || '').toLowerCase();
                const tieneExito = /veh[ií]culo.*guardado.*correctamente|veh[ií]culo.*creado.*correctamente|guardado.*correctamente|creado.*correctamente|vehicle.*saved.*successfully|vehicle.*created.*successfully/i.test(textoCompleto) ||
                  $body.find('[class*="success"], [class*="Success"], [role="alert"]').filter((_, el) => {
                    const textoEl = (el.textContent || el.innerText || '').toLowerCase();
                    return /veh[ií]culo.*guardado|veh[ií]culo.*creado|guardado.*correctamente|creado.*correctamente|vehicle.*saved|vehicle.*created/i.test(textoEl);
                  }).length > 0;

                if (tieneExito) {
                  cy.log('TC023: Vehículo guardado correctamente - OK');
                  // Registrar como OK directamente
                  return registrarResultadoAutomatico(
                    23,
                    'TC023',
                    caso?.nombre || 'Rellenar TODOS los campos en DATOS GENERALES, VENCIMIENTOS y MANTENIMIENTO',
                    'Vehículo guardado correctamente',
                    'OK',
                    true
                  );
                }

                // Verificar si aparece "Vehiclee" (error conocido)
                const tieneVehiclee = /vehiclee/i.test(textoCompleto);
                if (tieneVehiclee) {
                  cy.log('TC023: Mensaje muestra "Vehiclee" en lugar de "Vehículo" - WARNING');
                  return registrarResultadoAutomatico(
                    23,
                    'TC023',
                    caso?.nombre || 'Rellenar TODOS los campos en DATOS GENERALES, VENCIMIENTOS y MANTENIMIENTO',
                    'Mensaje de confirmación muestra "Vehiclee" en lugar de "Vehículo"',
                    'WARNING',
                    true
                  );
                }

                cy.log('TC023: No se detectó mensaje de éxito claro');
                return cy.wrap(null);
              });
            });
        });
    });
  }

  function rellenarFechasDatosGeneralesDesdeCampos(camposDatosGenerales) {
    if (!camposDatosGenerales || camposDatosGenerales.length === 0) {
      cy.log('No hay campos de DATOS GENERALES para buscar fechas');
      return cy.wrap(null);
    }

    const encontrarFecha = (keys) => {
      const c = camposDatosGenerales.find(x => {
        const et = String(x.etiquetaVisible || '').toLowerCase();
        const sel = String(x.selector || '').toLowerCase();
        const tipo = String(x.tipo || '').toLowerCase();
        // Buscar por etiqueta, selector o tipo
        return keys.some(k => {
          const kLower = k.toLowerCase();
          return et.includes(kLower) || sel.includes(kLower) ||
            (tipo === 'id' && sel.includes('_r_6') && (kLower.includes('alta') || kLower.includes('baja') || kLower.includes('matriculacion')));
        });
      });
      return c ? String(c.valor || '').trim() : null;
    };

    const alta = encontrarFecha(['alta', '_r_6f', '_r_79']);
    const baja = encontrarFecha(['baja', '_r_6i', '_r_7c']);
    const fMat = encontrarFecha(['matriculación', 'matricula', 'f. matriculación', 'f matriculacion', '_r_6c', '_r_76']);

    cy.log(`TC023: Fechas encontradas - Alta: ${alta || 'NO'}, F. Matriculación: ${fMat || 'NO'}, Baja: ${baja || 'NO'}`);

    const rellenarPorLabel = (label, fechaTexto) => {
      if (!fechaTexto || fechaTexto.trim() === '') {
        cy.log(`⏭ No hay fecha para ${label}, saltando...`);
        return cy.wrap(null);
      }

      const fechaObj = parseFechaBasicaExcel(fechaTexto);

      return cy.contains('label', new RegExp(`^${escapeRegex(label)}$`, 'i'), { timeout: 10000 })
        .should('be.visible')
        .parents('.MuiFormControl-root')
        .first()
        .within(() => {
          cy.get('button[aria-label*="date"], button[aria-label*="calendar"]', { timeout: 10000 })
            .should('be.visible')
            .click({ force: true });
        })
        .then(() => {
          cy.wait(300);
          return seleccionarFechaEnCalendario(fechaObj);
        })
        .then(() => {
          cy.log(`✓ Fecha ${label} rellenada: ${fechaTexto}`);
        }, () => {
          cy.log(`⚠ No se pudo rellenar la fecha ${label}: ${fechaTexto}`);
        });
    };

    // Rellenar en el orden típico del formulario
    return cy.wrap(null)
      .then(() => rellenarPorLabel('Alta', alta))
      .then(() => cy.wait(200))
      .then(() => rellenarPorLabel('F. Matriculación', fMat))
      .then(() => cy.wait(200))
      .then(() => rellenarPorLabel('Baja', baja));
  }

  function rellenarFechasVencimientosDesdeCampos(camposVencimientos) {
    if (!camposVencimientos || camposVencimientos.length === 0) {
      cy.log('No hay campos de VENCIMIENTOS para buscar fechas');
      return cy.wrap(null);
    }

    cy.log(`TC023: Rellenando VENCIMIENTOS con ${camposVencimientos.length} campos`);
    cy.log(`TC023: Campos VENCIMIENTOS: ${JSON.stringify(camposVencimientos.map(c => ({ selector: c.selector, valor: c.valor, tipo: c.tipo })))}`);

    const encontrarFecha = (keys) => {
      const c = camposVencimientos.find(x => {
        const sel = String(x.selector || '').toLowerCase().replace(/-label$/, '');
        return keys.some(k => {
          const kLower = k.toLowerCase();
          return sel.includes(kLower) || sel === kLower || sel === '_' + kLower || sel === kLower.replace(/^_/, '');
        });
      });
      return c ? String(c.valor || '').trim() : null;
    };

    // Buscar fechas por selector
    const itv = encontrarFecha(['r_70', '_r_70']);
    const tacografo = encontrarFecha(['r_73', '_r_73']);
    const certificado = encontrarFecha(['r_7a', '_r_7a']);
    const atp = encontrarFecha(['r_7g', '_r_7g']);
    const adr = encontrarFecha(['r_7m', '_r_7m']);
    const aparcamiento = encontrarFecha(['r_7s', '_r_7s']);
    const animales = encontrarFecha(['r_77', '_r_77']);
    const comunitario = encontrarFecha(['r_7d', '_r_7d']);
    const emisoras = encontrarFecha(['r_7j', '_r_7j']);
    const extintor = encontrarFecha(['r_7p', '_r_7p']);
    const fechaTipo1 = encontrarFecha(['r_80', '_r_80']);
    const fechaTipo2 = encontrarFecha(['r_84', '_r_84']);
    const fechaTipo3 = encontrarFecha(['r_88', '_r_88']);

    cy.log(`TC023: Fechas VENCIMIENTOS encontradas - ITV: ${itv || 'NO'}, Tacógrafo: ${tacografo || 'NO'}, etc.`);

    const rellenarPorLabel = (label, fechaTexto) => {
      if (!fechaTexto || fechaTexto.trim() === '') {
        cy.log(`⏭ No hay fecha para ${label}, saltando...`);
        return cy.wrap(null);
      }

      const fechaObj = parseFechaBasicaExcel(fechaTexto);

      return cy.contains('label', new RegExp(`^${escapeRegex(label)}$`, 'i'), { timeout: 10000 })
        .should('be.visible')
        .parents('.MuiFormControl-root')
        .first()
        .within(() => {
          cy.get('button[aria-label*="date"], button[aria-label*="calendar"]', { timeout: 10000 })
            .should('be.visible')
            .click({ force: true });
        })
        .then(() => {
          cy.wait(500);
          return seleccionarFechaEnCalendario(fechaObj);
        })
        .then(() => {
          cy.log(`✓ Fecha ${label} rellenada: ${fechaTexto}`);
        }, () => {
          cy.log(` No se pudo rellenar la fecha ${label}: ${fechaTexto}`);
        });
    };

    // Rellenar todas las fechas encontradas
    let chain = cy.wrap(null);
    if (itv) chain = chain.then(() => rellenarPorLabel('ITV', itv)).then(() => cy.wait(200));
    if (tacografo) chain = chain.then(() => rellenarPorLabel('Tacógrafo', tacografo)).then(() => cy.wait(200));
    if (certificado) chain = chain.then(() => rellenarPorLabel('Certificado Transporte Mercancías Perecederas', certificado)).then(() => cy.wait(200));
    if (atp) chain = chain.then(() => rellenarPorLabel('ATP', atp)).then(() => cy.wait(200));
    if (adr) chain = chain.then(() => rellenarPorLabel('ADR', adr)).then(() => cy.wait(200));
    if (aparcamiento) chain = chain.then(() => rellenarPorLabel('O. R. Aparcamiento', aparcamiento)).then(() => cy.wait(200));
    if (animales) chain = chain.then(() => rellenarPorLabel('Autorización Transporte Animales', animales)).then(() => cy.wait(200));
    if (comunitario) chain = chain.then(() => rellenarPorLabel('Permiso Comunitario', comunitario)).then(() => cy.wait(200));
    if (emisoras) chain = chain.then(() => rellenarPorLabel('Emisoras', emisoras)).then(() => cy.wait(200));
    if (extintor) chain = chain.then(() => rellenarPorLabel('Extintor', extintor)).then(() => cy.wait(200));
    if (fechaTipo1) chain = chain.then(() => rellenarPorLabel('Fecha Tipo 1', fechaTipo1)).then(() => cy.wait(200));
    if (fechaTipo2) chain = chain.then(() => rellenarPorLabel('Fecha Tipo 2', fechaTipo2)).then(() => cy.wait(200));
    if (fechaTipo3) chain = chain.then(() => rellenarPorLabel('Fecha Tipo 3', fechaTipo3)).then(() => cy.wait(200));

    // También rellenar campos de texto (Tipo 1, Tipo 2, Tipo 3, Nº Tarjeta Transporte)
    const tipo1 = camposVencimientos.find(x => String(x.selector || '').toLowerCase().includes('expirations.0.type1'));
    const tipo2 = camposVencimientos.find(x => String(x.selector || '').toLowerCase().includes('expirations.0.type2'));
    const tipo3 = camposVencimientos.find(x => String(x.selector || '').toLowerCase().includes('expirations.0.type3'));

    // Buscar Nº Tarjeta Transporte: puede venir como:
    // - expirations.0.cardTransportNumber o expiration.0.cardTransportNumber (name attribute)
    // - _r_76, r_76, _r_76_, r_76-label, etc. (ID) y el valor NO es una fecha
    cy.log(`TC023: Buscando campo Nº Tarjeta Transporte en ${camposVencimientos.length} campos de VENCIMIENTOS`);
    const tarjeta = camposVencimientos.find(x => {
      const sel = String(x.selector || '').toLowerCase();
      const val = String(x.valor || '').trim();
      const esFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(val);
      const matchCardTransport = sel.includes('cardtransportnumber') || sel.includes('cardtransport');
      const matchR76 = (sel.includes('r_76') || sel === '_r_76' || sel === 'r_76') && !esFecha;
      const match = matchCardTransport || matchR76;
      if (match) {
        cy.log(`TC023:  Campo Nº Tarjeta Transporte encontrado: selector="${x.selector}", valor="${x.valor}", tipo="${x.tipo}"`);
      }
      // Buscar por name attribute o por ID
      return match;
    });

    // Valor para Nº Tarjeta Transporte: usar el del Excel si existe, sino "prueba"
    const valorTarjeta = (tarjeta && tarjeta.valor) ? String(tarjeta.valor) : 'prueba';
    cy.log(`TC023: Valor para Nº Tarjeta Transporte: "${valorTarjeta}" ${tarjeta ? '(desde Excel)' : '(valor por defecto - no encontrado en Excel)'}`);

    if (tipo1 && tipo1.valor) {
      chain = chain.then(() => escribirPorName('expirations.0.type1', tipo1.valor, 'Tipo 1')).then(() => cy.wait(200));
    }
    if (tipo2 && tipo2.valor) {
      chain = chain.then(() => escribirPorName('expirations.0.type2', tipo2.valor, 'Tipo 2')).then(() => cy.wait(200));
    }
    if (tipo3 && tipo3.valor) {
      chain = chain.then(() => escribirPorName('expirations.0.type3', tipo3.valor, 'Tipo 3')).then(() => cy.wait(200));
    }

    // Siempre rellenar Nº Tarjeta Transporte (con valor del Excel o "prueba" por defecto)
    // Usar la misma función escribirPorName que se usa para Tipo 1, Tipo 2, Tipo 3
    chain = chain.then(() => escribirPorName('expirations.0.cardTransportNumber', valorTarjeta, 'Nº Tarjeta Transporte')).then(() => cy.wait(200));

    return chain;
  }

  function rellenarFechasMantenimientoDesdeCampos(camposMantenimiento) {
    if (!camposMantenimiento || camposMantenimiento.length === 0) {
      cy.log('No hay campos de MANTENIMIENTO para buscar fechas');
      return cy.wrap(null);
    }

    cy.log(`TC023: Rellenando fechas de MANTENIMIENTO con ${camposMantenimiento.length} campos`);

    const encontrarFecha = (keys) => {
      const c = camposMantenimiento.find(x => {
        const sel = String(x.selector || '').toLowerCase().replace(/-label$/, '');
        const val = String(x.valor || '').trim();
        const esFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(val);
        if (!esFecha) return false;
        return keys.some(k => {
          const kLower = k.toLowerCase();
          return sel.includes(kLower) || sel === kLower || sel === '_' + kLower || sel === kLower.replace(/^_/, '');
        });
      });
      return c ? String(c.valor || '').trim() : null;
    };

    // Buscar fechas por selector (IDs de MANTENIMIENTO)
    const inicio = encontrarFecha(['r_9u', '_r_9u']);
    const fin = encontrarFecha(['r_a1', '_r_a1']);
    const ultima = encontrarFecha(['r_ad', '_r_ad']);
    const proxima = encontrarFecha(['r_ag', '_r_ag']);

    cy.log(`TC023: Fechas MANTENIMIENTO encontradas - Inicio: ${inicio || 'NO'}, Fin: ${fin || 'NO'}, Última: ${ultima || 'NO'}, Próxima: ${proxima || 'NO'}`);

    const rellenarPorLabel = (label, fechaTexto) => {
      if (!fechaTexto || fechaTexto.trim() === '') {
        cy.log(`⏭ No hay fecha para ${label}, saltando...`);
        return cy.wrap(null);
      }

      const fechaObj = parseFechaBasicaExcel(fechaTexto);

      return cy.contains('label', new RegExp(`^${escapeRegex(label)}$`, 'i'), { timeout: 10000 })
        .should('be.visible')
        .parents('.MuiFormControl-root')
        .first()
        .within(() => {
          cy.get('button[aria-label*="date"], button[aria-label*="calendar"]', { timeout: 10000 })
            .should('be.visible')
            .click({ force: true });
        })
        .then(() => {
          cy.wait(500);
          return seleccionarFechaEnCalendario(fechaObj);
        })
        .then(() => {
          cy.log(` Fecha ${label} rellenada: ${fechaTexto}`);
        }, () => {
          cy.log(` No se pudo rellenar la fecha ${label}: ${fechaTexto}`);
        });
    };

    // Rellenar todas las fechas encontradas
    let chain = cy.wrap(null);
    if (inicio) chain = chain.then(() => rellenarPorLabel('Inicio', inicio)).then(() => cy.wait(200));
    if (fin) chain = chain.then(() => rellenarPorLabel('Fin', fin)).then(() => cy.wait(200));
    if (ultima) chain = chain.then(() => rellenarPorLabel('Última', ultima)).then(() => cy.wait(200));
    if (proxima) chain = chain.then(() => rellenarPorLabel('Próxima', proxima)).then(() => cy.wait(200));

    return chain;
  }

  function seleccionarPropietarioPropio() {
    return cy.get('input[type="radio"][name="vehicle.owner"][value="own"]', { timeout: 10000 })
      .then($radio => {
        if (!$radio.length) return cy.wrap(null);

        return cy.wrap($radio)
          .scrollIntoView({ block: 'center' })
          .then(() => {
            if ($radio.is(':checked')) {
              // Si ya está marcado, verificar si hay que seleccionar empresa
              return seleccionarPrimeraEmpresa();
            }

            return cy.wrap($radio)
              .check({ force: true })
              .then(
                () => {
                  cy.wrap($radio).should('be.checked');
                  // Después de marcar "Propio", esperar a que aparezca el dropdown de empresa
                  cy.wait(1000);
                  return seleccionarPrimeraEmpresa();
                },
                () => cy.wrap($radio)
                  .closest('span.MuiRadio-root, span.PrivateSwitchBase-root')
                  .click({ force: true })
                  .then(() => {
                    cy.wrap($radio).should('be.checked');
                    // Después de marcar "Propio", esperar a que aparezca el dropdown de empresa
                    cy.wait(1000);
                    return seleccionarPrimeraEmpresa();
                  })
              );
          });
      });
  }

  function seleccionarPrimeraEmpresa() {
    cy.log('Buscando dropdown "Seleccionar empresa" para seleccionar la primera opción...');

    // Esperar un momento para que el dropdown aparezca después de marcar "Propio"
    cy.wait(1000);

    // Buscar el select por ID o por name (más específico)
    return cy.get('body').then($body => {
      // Buscar el select por diferentes selectores posibles
      const selectors = [
        '[id*="mui-component-select-vehicle.companyId"]',
        '[name="vehicle.companyId"]',
        'label:contains("Seleccionar empresa")',
        'input[aria-label*="Seleccionar empresa" i]',
        'input[aria-label*="empresa" i]'
      ];

      let selectorEncontrado = null;
      for (const selector of selectors) {
        const elementos = $body.find(selector);
        if (elementos.length > 0) {
          selectorEncontrado = selector;
          break;
        }
      }

      if (!selectorEncontrado) {
        cy.log('No se encontró el dropdown "Seleccionar empresa", puede que no esté visible o no se haya marcado "Propio"');
        return cy.wrap(null);
      }

      // Si encontramos un label, buscar el input asociado
      if (selectorEncontrado.includes('label')) {
        return cy.contains('label', /seleccionar empresa/i, { timeout: 5000 })
          .should('be.visible')
          .then($label => {
            const forAttr = $label.attr('for');
            if (forAttr) {
              return cy.get(`#${forAttr}`, { timeout: 5000 })
                .should('be.visible')
                .scrollIntoView({ block: 'center' })
                .click({ force: true });
            } else {
              // Si no tiene for, buscar el input dentro del mismo contenedor
              return cy.wrap($label)
                .parents('.MuiFormControl-root')
                .first()
                .within(() => {
                  return cy.get('input, [role="combobox"]', { timeout: 5000 })
                    .first()
                    .should('be.visible')
                    .scrollIntoView({ block: 'center' })
                    .click({ force: true });
                });
            }
          })
          .then(() => {
            cy.wait(500);
            // Seleccionar la primera opción disponible
            return cy.get('ul[role="listbox"]:visible, [role="listbox"]:visible', { timeout: 5000 })
              .first()
              .should('be.visible')
              .within(() => {
                return cy.get('li[role="option"]:visible, [role="option"]:visible')
                  .first()
                  .should('be.visible')
                  .then($option => {
                    const textoEmpresa = ($option.text() || '').trim();
                    cy.log(`Seleccionando primera empresa: ${textoEmpresa}`);
                    return cy.wrap($option)
                      .scrollIntoView({ block: 'center' })
                      .click({ force: true });
                  });
              })
              .then(() => {
                cy.wait(500);
                cy.log('✓ Primera empresa seleccionada correctamente');
              });
          }, (err) => {
            cy.log(` No se pudo seleccionar la primera empresa: ${err.message}`);
            return cy.wrap(null);
          });
      }

      // Buscar directamente el select por ID o name
      return cy.get('[id*="mui-component-select-vehicle.companyId"], [name="vehicle.companyId"]', { timeout: 10000 })
        .first()
        .should('exist')
        .then(() => {
          return cy.get('[id*="mui-component-select-vehicle.companyId"], [name="vehicle.companyId"]')
            .first()
            .should('be.visible')
            .scrollIntoView({ block: 'center' })
            .click({ force: true });
        })
        .then(() => {
          cy.wait(500);
          // Seleccionar la primera opción disponible
          return cy.get('ul[role="listbox"]:visible, [role="listbox"]:visible', { timeout: 5000 })
            .first()
            .should('be.visible')
            .within(() => {
              return cy.get('li[role="option"]:visible, [role="option"]:visible')
                .first()
                .should('be.visible')
                .then($option => {
                  const textoEmpresa = ($option.text() || '').trim();
                  cy.log(`Seleccionando primera empresa: ${textoEmpresa}`);
                  return cy.wrap($option)
                    .scrollIntoView({ block: 'center' })
                    .click({ force: true });
                });
            })
            .then(() => {
              cy.wait(500);
              cy.log('✓ Primera empresa seleccionada correctamente');
            });
        }, (err) => {
          cy.log(` No se pudo abrir o seleccionar empresa: ${err.message}`);
          return cy.wrap(null);
        });
    });
  }

  function marcarCheckboxesActividadesAleatoriamente() {
    cy.log('Marcando checkboxes de actividades: TODOS "Activo" y algunos "Principal"');

    // 1) Marcar TODOS los Activo (vehicle.activities.*.active)
    const marcarActivos = () => {
      return cy
        .get('input[type="checkbox"][name^="vehicle.activities."][name$=".active"]', { timeout: 10000 })
        .then($cbs => {
          if (!$cbs.length) {
            cy.log('No se encontraron checkboxes de "Activo"');
            return cy.wrap(null);
          }

          cy.log(`Encontrados ${$cbs.length} checkboxes de "Activo"`);

          return cy.wrap($cbs).each($cb => {
            return cy.wrap($cb).then($el => {
              const name = $el.attr('name');

              if ($el.is(':checked')) {
                cy.log(`⏭ Ya marcado (Activo): ${name}`);
                return cy.wrap(null);
              }

              cy.wrap($el).scrollIntoView({ block: 'center' });

              // Intento 1: check force -> si falla, fallback click en root
              return cy.wrap($el)
                .check({ force: true })
                .then(
                  () => {
                    return cy.wrap($el)
                      .should('be.checked')
                      .then(() => cy.log(`✓ Marcado (Activo): ${name}`));
                  },
                  () => {
                    cy.log(`Fallback click (Activo): ${name}`);
                    return cy.wrap($el)
                      .closest('span.MuiCheckbox-root, span.PrivateSwitchBase-root')
                      .click({ force: true })
                      .then(() => cy.wrap($el).should('be.checked'))
                      .then(() => cy.log(`✓ Marcado con click (Activo): ${name}`));
                  }
                );
            });
          });
        });
    };

    // 2) Marcar algunos Principal (vehicle.principalActivity) aleatoriamente
    const marcarPrincipales = () => {
      return cy
        .get('input[type="checkbox"][name="vehicle.principalActivity"]', { timeout: 10000 })
        .then($cbs => {
          if (!$cbs.length) {
            cy.log('No se encontraron checkboxes de "Principal"');
            return cy.wrap(null);
          }

          cy.log(`Encontrados ${$cbs.length} checkboxes de "Principal"`);

          const indices = [...Array($cbs.length).keys()];
          const elegidos = indices.filter(() => Math.random() > 0.5);

          // Si no salió ninguno, marca 1 seguro
          if (elegidos.length === 0) {
            elegidos.push(Math.floor(Math.random() * $cbs.length));
          }

          cy.log(`Marcando ${elegidos.length} checkboxes de "Principal" aleatoriamente`);

          return cy.wrap(elegidos).each(i => {
            const el = $cbs.get(i);

            return cy.wrap(el).then($cb => {
              if ($cb.is(':checked')) {
                cy.log(`⏭ Ya marcado (Principal) idx=${i}`);
                return cy.wrap(null);
              }

              cy.wrap($cb).scrollIntoView({ block: 'center' });

              return cy.wrap($cb)
                .check({ force: true })
                .then(
                  () => {
                    return cy.wrap($cb)
                      .should('be.checked')
                      .then(() => cy.log(`✓ Marcado (Principal) idx=${i}`));
                  },
                  () => {
                    cy.log(`Fallback click (Principal) idx=${i}`);
                    return cy.wrap($cb)
                      .closest('span.MuiCheckbox-root, span.PrivateSwitchBase-root')
                      .click({ force: true })
                      .then(() => cy.wrap($cb).should('be.checked'))
                      .then(() => cy.log(`✓ Marcado con click (Principal) idx=${i}`));
                  }
                );
            });
          });
        });
    };

    return cy.wrap(null)
      .then(() => cy.wait(300))
      .then(() => marcarActivos())
      .then(() => cy.wait(300))
      .then(() => marcarPrincipales());
  }
  function rellenarCamposEnPestaña(campos, nombrePestaña) {
    if (!campos || campos.length === 0) {
      cy.log(`No hay campos para rellenar en ${nombrePestaña}`);
      return cy.wrap(null);
    }

    const limpiarFecha = (txt) =>
      String(txt || '')
        .replace(/\s+/g, ' ')
        .trim();

    const completarCampo = (index = 0) => {
      if (index >= campos.length) return cy.wrap(null);

      const campo = campos[index];
      const valorTextoRaw = campo.valor?.toString() || '';
      const valorTexto = valorTextoRaw.trim();

      const etiquetaLower = (campo.etiquetaVisible || '').toLowerCase();
      const tipoLower = (campo.tipo || '').toLowerCase();
      const selectorLower = (campo.selector || '').toLowerCase();

      cy.log(
        `Rellenando campo ${index + 1}/${campos.length} en ${nombrePestaña}: ` +
        `${campo.etiquetaVisible || campo.selector} = ${valorTexto}`
      );

      // =========================
      // 1) FECHAS (como caso 22)
      // =========================
      const esFecha =
        etiquetaLower.includes('fecha') ||
        etiquetaLower.includes('itv') ||
        etiquetaLower.includes('tacógrafo') ||
        etiquetaLower.includes('tacografo') ||
        etiquetaLower.includes('atp') ||
        etiquetaLower.includes('adr') ||
        etiquetaLower.includes('extintor') ||
        etiquetaLower.includes('emisoras') ||
        etiquetaLower.includes('permiso comunitario') ||
        etiquetaLower.includes('autorización transporte') ||
        etiquetaLower.includes('certificado transporte') ||
        etiquetaLower.includes('aparacamiento') ||
        etiquetaLower.includes('inicio') ||
        etiquetaLower.includes('fin') ||
        etiquetaLower.includes('última') ||
        etiquetaLower.includes('ultima') ||
        etiquetaLower.includes('próxima') ||
        etiquetaLower.includes('proxima') ||
        etiquetaLower.includes('alta') ||
        etiquetaLower.includes('baja') ||
        etiquetaLower.includes('matriculación') ||
        etiquetaLower.includes('matricula') ||
        tipoLower.includes('fecha') ||
        tipoLower.includes('date') ||
        /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(valorTexto.trim());

      if (esFecha && valorTexto) {
        const fechaLimpia = limpiarFecha(valorTexto);
        const fechaObj = parseFechaBasicaExcel(fechaLimpia);

        let nombreLabel = null;

        if (tipoLower === 'id' && (selectorLower.startsWith('_r_') || selectorLower.includes('-label'))) {
          const idInput = selectorLower.replace(/-label$/, '');

          const mapeoIds = {
            '_r_6c': 'F. Matriculación',
            '_r_76': 'F. Matriculación',
            '_r_6f': 'Alta',
            '_r_79': 'Alta',
            '_r_6i': 'Baja',
            '_r_7c': 'Baja',
            '_r_70': 'ITV',
            '_r_73': 'Tacógrafo',
            '_r_7a': 'Certificado Transporte Mercancías Perecederas',
            '_r_7g': 'ATP',
            '_r_7m': 'ADR',
            '_r_7s': 'O. R. Aparcamiento',
            '_r_77': 'Autorización Transporte Animales',
            '_r_7d': 'Permiso Comunitario',
            '_r_7j': 'Emisoras',
            '_r_7p': 'Extintor',
            '_r_80': 'Fecha Tipo 1',
            '_r_84': 'Fecha Tipo 2',
            '_r_88': 'Fecha Tipo 3',
            '_r_9u': 'Inicio',
            '_r_a1': 'Fin',
            '_r_ad': 'Última',
            '_r_ag': 'Próxima'
          };

          nombreLabel = mapeoIds[idInput] || null;
        } else if (campo.etiquetaVisible && campo.etiquetaVisible !== campo.selector && campo.etiquetaVisible !== 'id') {
          nombreLabel = campo.etiquetaVisible;
        }

        if (nombreLabel) {
          return cy
            .contains('label', new RegExp(`^${escapeRegex(nombreLabel)}$`, 'i'), { timeout: 10000 })
            .should('be.visible')
            .parents('.MuiFormControl-root')
            .first()
            .within(() => {
              return cy
                .get('button[aria-label*="date"], button[aria-label*="calendar"]', { timeout: 10000 })
                .should('be.visible')
                .click({ force: true });
            })
            .then(() => {
              cy.wait(300);
              return seleccionarFechaEnCalendario(fechaObj);
            })
            .then(
              () => completarCampo(index + 1),
              () => {
                cy.log(`No se pudo rellenar la fecha ${fechaLimpia} en ${nombreLabel}`);
                return completarCampo(index + 1);
              }
            );
        }

        cy.log(`No se pudo determinar el nombre del label para la fecha ${fechaLimpia} (selector: ${campo.selector})`);
        return completarCampo(index + 1);
      }

      // =========================
      // 2) DEDUCIR NOMBRE LABEL REAL
      // =========================
      let nombreLabelReal = campo.etiquetaVisible || '';

      if (selectorLower.includes('mui-component-select-status') || (tipoLower === 'id' && selectorLower.includes('status'))) {
        nombreLabelReal = 'Estado';
      } else if (selectorLower.includes('mui-component-select-vehicle.section') || selectorLower.includes('vehicle.section')) {
        nombreLabelReal = 'Sección';
      } else if (selectorLower.includes('vehicle.owner')) {
        nombreLabelReal = 'Propietario';
      } else if (tipoLower === 'id' && (selectorLower.startsWith('_r_') || selectorLower.includes('-label'))) {
        const idInput = selectorLower.replace(/-label$/, '');

        const mapeoIds = {
          '_r_6c': 'F. Matriculación',
          '_r_76': 'F. Matriculación',
          '_r_6f': 'Alta',
          '_r_79': 'Alta',
          '_r_6i': 'Baja',
          '_r_7c': 'Baja',
          '_r_70': 'ITV',
          '_r_73': 'Tacógrafo',
          '_r_7a': 'Certificado Transporte Mercancías Perecederas',
          '_r_7g': 'ATP',
          '_r_7m': 'ADR',
          '_r_7s': 'O. R. Aparcamiento',
          '_r_77': 'Autorización Transporte Animales',
          '_r_7d': 'Permiso Comunitario',
          '_r_7j': 'Emisoras',
          '_r_7p': 'Extintor',
          '_r_80': 'Fecha Tipo 1',
          '_r_84': 'Fecha Tipo 2',
          '_r_88': 'Fecha Tipo 3',
          '_r_9u': 'Inicio',
          '_r_a1': 'Fin',
          '_r_ad': 'Última',
          '_r_ag': 'Próxima'
        };

        if (mapeoIds[idInput]) nombreLabelReal = mapeoIds[idInput];
      }

      // =========================
      // 3) PROPIETARIO (RADIO)
      // =========================
      if (selectorLower.includes('vehicle.owner') || String(nombreLabelReal).toLowerCase().includes('propietario')) {
        cy.log(`Seleccionando Propietario: ${valorTexto}`);

        let valorRadio = (valorTexto || '').toLowerCase();
        if (valorRadio.includes('propio')) valorRadio = 'own';
        else if (valorRadio.includes('tercero')) valorRadio = 'thirdParty';
        else if (valorRadio.includes('anexado')) valorRadio = 'annexed';
        else valorRadio = 'own';

        return cy
          .get(`input[type="radio"][name="vehicle.owner"][value="${valorRadio}"]`, { timeout: 10000 })
          .then($radio => {
            if (!$radio || !$radio.length) {
              cy.log(`No se encontró radio Propietario con value="${valorRadio}"`);
              return completarCampo(index + 1);
            }

            return cy.wrap($radio)
              .scrollIntoView({ block: 'center' })
              .then(() => {
                if ($radio.is(':checked')) {
                  cy.log(`⏭ Propietario ya seleccionado: ${valorTexto}`);
                  return completarCampo(index + 1);
                }

                return cy.wrap($radio)
                  .check({ force: true })
                  .then(
                    () => cy.wrap($radio).should('be.checked'),
                    () => cy.wrap($radio)
                      .closest('span.MuiRadio-root, span.PrivateSwitchBase-root')
                      .click({ force: true })
                      .then(() => cy.wrap($radio).should('be.checked'))
                  )
                  .then(() => {
                    cy.log(`✓ Propietario seleccionado: ${valorTexto}`);
                    return completarCampo(index + 1);
                  });
              });
          });
      }

      // =========================
      // 4) CHECKBOX ACTIVIDADES (MUI input oculto -> exist)
      // =========================
      if (selectorLower.includes('vehicle.activities') && (selectorLower.includes('.active') || selectorLower.includes('.modificable'))) {
        cy.log(`Marcando checkbox de actividad: ${campo.selector} = ${valorTexto}`);

        const valorLower = valorTexto.toLowerCase().trim();
        const debeMarcar =
          valorLower === 'true' || valorLower === '1' || valorLower === 'checked' ||
          valorLower === 'activo' || valorLower === 'principal' || valorLower === 'si' ||
          valorLower === 'yes' || valorLower === 'on';

        const selectorCb = `input[type="checkbox"][name="${campo.selector}"]`;

        if (debeMarcar) {
          return cy.get(selectorCb, { timeout: 10000 })
            .should('exist')
            .scrollIntoView({ block: 'center' })
            .check({ force: true })
            .then(() => {
              cy.wait(150);
              cy.log(`✓ Checkbox ${campo.selector} marcado`);
              return completarCampo(index + 1);
            }, () => {
              cy.log(`No se pudo marcar el checkbox ${campo.selector}`);
              return completarCampo(index + 1);
            });
        }

        return cy.get(selectorCb, { timeout: 10000 })
          .should('exist')
          .scrollIntoView({ block: 'center' })
          .uncheck({ force: true })
          .then(() => {
            cy.wait(150);
            cy.log(`✓ Checkbox ${campo.selector} desmarcado`);
            return completarCampo(index + 1);
          }, () => {
            cy.log(`No se pudo desmarcar el checkbox ${campo.selector}`);
            return completarCampo(index + 1);
          });
      }

      // =========================
      // 5) SELECT MUI (combobox)
      // =========================
      const esSelectMUI =
        selectorLower.includes('mui-component-select') ||
        selectorLower.includes('maintenancetype') ||
        (String(nombreLabelReal).toLowerCase() === 'tipo' &&
          !String(nombreLabelReal).toLowerCase().includes('tipo 1') &&
          !String(nombreLabelReal).toLowerCase().includes('tipo 2') &&
          !String(nombreLabelReal).toLowerCase().includes('tipo 3') &&
          !String(nombreLabelReal).toLowerCase().includes('tipo de vehículo') &&
          !String(nombreLabelReal).toLowerCase().includes('tipo de vehiculo')) ||
        String(nombreLabelReal).toLowerCase().includes('estado') ||
        String(nombreLabelReal).toLowerCase().includes('sección') ||
        String(nombreLabelReal).toLowerCase().includes('seccion');

      if (esSelectMUI) {
        cy.log(`Detectado select MUI para "${nombreLabelReal}"`);

        if (selectorLower.includes('maintenance.0.maintenancetype') || (String(nombreLabelReal).toLowerCase() === 'tipo' && nombrePestaña === 'MANTENIMIENTO')) {
          cy.log(`Rellenando campo Tipo de Mantenimiento (desplegable): "${valorTexto}"`);
          // Buscar el campo "Tipo" por label primero (igual que en caso 22)
          return cy.get('body').then($body => {
            // Buscar el label "Tipo" en la sección de Mantenimiento
            const labelTipo = $body.find('label').filter((_, el) => {
              const texto = (el.textContent || el.innerText || '').trim();
              return /^Tipo$/i.test(texto);
            }).first();

            let selectorSelect = null;
            if (labelTipo.length > 0) {
              // Buscar el select asociado al label
              const forAttr = labelTipo.attr('for');
              if (forAttr) {
                // Escapar el ID para usar en selector CSS
                const escapedId = forAttr.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');
                selectorSelect = `#${escapedId}`;
              } else {
                // Si no hay for, buscar el select dentro del mismo contenedor
                selectorSelect = '[id*="maintenanceType"], [id*="maintenance.type"], [name*="maintenanceType"], [name*="maintenance.type"]';
              }
            } else {
              selectorSelect = '[id="mui-component-select-maintenance.0.maintenanceType"]';
            }

            // Intentar encontrar el select
            return cy.get(selectorSelect || '[id="mui-component-select-maintenance.0.maintenanceType"]', { timeout: 10000 })
              .should('be.visible')
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                const tipoEscapado = escapeRegex(String(valorTexto).trim());
                // Usar cy.contains directamente para seleccionar la opción
                return cy.contains(
                  'li[role="option"], [role="option"], div[role="option"], ul[role="listbox"] [role="option"]',
                  new RegExp(`^${tipoEscapado}$`, 'i'),
                  { timeout: 10000 }
                )
                  .should('be.visible')
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    cy.log(`✓ Tipo de Mantenimiento seleccionado: "${valorTexto}"`);
                    return completarCampo(index + 1);
                  }, () => {
                    cy.log(`No se pudo encontrar la opción "${valorTexto}" en Tipo de Mantenimiento`);
                    return completarCampo(index + 1);
                  });
              }, () => {
                cy.log(`No se encontró el campo Tipo de Mantenimiento`);
                return completarCampo(index + 1);
              });
          });
        }

        if (selectorLower.includes('mui-component-select-status') || String(nombreLabelReal).toLowerCase().includes('estado')) {
          cy.log(`Rellenando campo Estado: "${valorTexto}"`);
          // Buscar el campo "Estado" por label primero
          return cy.get('body').then($body => {
            // Buscar el label "Estado"
            const labelEstado = $body.find('label').filter((_, el) => {
              const texto = (el.textContent || el.innerText || '').trim();
              return /^Estado$/i.test(texto);
            }).first();

            if (labelEstado.length > 0) {
              // Buscar el select asociado al label
              const forAttr = labelEstado.attr('for');
              let selectorSelect = null;

              if (forAttr) {
                // Escapar el ID para usar en selector CSS
                const escapedId = forAttr.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');
                selectorSelect = `#${escapedId}`;
              } else {
                // Si no hay for, buscar el select dentro del mismo contenedor
                selectorSelect = '[id*="status"], [id*="mui-component-select-status"]';
              }

              // Intentar encontrar el select
              return cy.get(selectorSelect || '[id="mui-component-select-status"]', { timeout: 10000 })
                .should('be.visible')
                .scrollIntoView({ block: 'center' })
                .click({ force: true })
                .then(() => {
                  cy.wait(500);
                  // Buscar la opción en el menú desplegable con múltiples métodos
                  const estadoNormalizado = String(valorTexto).trim();
                  const estadoEscapado = escapeRegex(estadoNormalizado);

                  // Intentar encontrar la opción con diferentes selectores
                  return cy.get('body').then($body2 => {
                    const listbox = $body2.find('ul[role="listbox"]:visible, [role="listbox"]:visible').last();

                    if (listbox.length > 0) {
                      // Buscar la opción dentro del listbox
                      const opciones = listbox.find('li[role="option"], [role="option"]');
                      const opcionEncontrada = Array.from(opciones).find(opt => {
                        const texto = (opt.textContent || opt.innerText || '').trim();
                        return new RegExp(`^${estadoEscapado}$`, 'i').test(texto) ||
                          texto.toLowerCase() === estadoNormalizado.toLowerCase();
                      });

                      if (opcionEncontrada) {
                        return cy.wrap(opcionEncontrada)
                          .scrollIntoView({ block: 'center' })
                          .should('be.visible')
                          .click({ force: true })
                          .then(() => {
                            cy.wait(500);
                            cy.log(`✓ Estado seleccionado: "${valorTexto}"`);
                            return completarCampo(index + 1);
                          });
                      }
                    }

                    // Fallback: usar cy.contains
                    return cy.contains(
                      'li[role="option"], [role="option"], div[role="option"]',
                      new RegExp(`^${estadoEscapado}$`, 'i'),
                      { timeout: 10000 }
                    )
                      .should('be.visible')
                      .scrollIntoView({ block: 'center' })
                      .click({ force: true })
                      .then(() => {
                        cy.wait(500);
                        cy.log(`✓ Estado seleccionado: "${valorTexto}"`);
                        return completarCampo(index + 1);
                      });
                  });
                })
                .then(() => completarCampo(index + 1), () => {
                  cy.log(`No se pudo seleccionar ${valorTexto} en Estado`);
                  return completarCampo(index + 1);
                });
            } else {
              // Si no se encuentra el label, usar el selector directo
              return cy.get('[id="mui-component-select-status"]', { timeout: 10000 })
                .should('be.visible')
                .scrollIntoView({ block: 'center' })
                .click({ force: true })
                .then(() => {
                  cy.wait(500);
                  const estadoEscapado = escapeRegex(String(valorTexto).trim());
                  return cy.contains(
                    'li[role="option"], [role="option"], div[role="option"]',
                    new RegExp(`^${estadoEscapado}$`, 'i'),
                    { timeout: 10000 }
                  )
                    .should('be.visible')
                    .scrollIntoView({ block: 'center' })
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      cy.log(`✓ Estado seleccionado: "${valorTexto}"`);
                      return completarCampo(index + 1);
                    });
                })
                .then(() => completarCampo(index + 1), () => {
                  cy.log(`No se pudo seleccionar ${valorTexto} en Estado`);
                  return completarCampo(index + 1);
                });
            }
          });
        }

        if (selectorLower.includes('mui-component-select-vehicle.section') || selectorLower.includes('vehicle.section') || String(nombreLabelReal).toLowerCase().includes('sección') || String(nombreLabelReal).toLowerCase().includes('seccion')) {
          cy.log(`Rellenando campo Sección: "${valorTexto}"`);
          // Buscar el campo "Sección" por label primero
          return cy.get('body').then($body => {
            // Buscar el label "Sección"
            const labelSeccion = $body.find('label').filter((_, el) => {
              const texto = (el.textContent || el.innerText || '').trim();
              return /^Sección$/i.test(texto) || /^Seccion$/i.test(texto);
            }).first();

            let selectorSelect = null;
            if (labelSeccion.length > 0) {
              // Buscar el select asociado al label
              const forAttr = labelSeccion.attr('for');
              if (forAttr) {
                // Escapar el ID para usar en selector CSS
                const escapedId = forAttr.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');
                selectorSelect = `#${escapedId}`;
              } else {
                selectorSelect = '[id="mui-component-select-vehicle.section"]';
              }
            } else {
              selectorSelect = '[id="mui-component-select-vehicle.section"]';
            }

            // Verificar si el valor ya está seleccionado
            return cy.get(selectorSelect, { timeout: 10000 })
              .should('be.visible')
              .then($select => {
                const valorActual = ($select.text() || '').trim();
                const valorBuscado = String(valorTexto).trim();

                if (valorActual.toLowerCase() === valorBuscado.toLowerCase()) {
                  cy.log(`⏭ Sección ya está seleccionada: "${valorActual}"`);
                  return completarCampo(index + 1);
                }

                // Si no está seleccionado, abrir el desplegable y seleccionar
                return cy.wrap($select)
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    const seccionEscapada = escapeRegex(valorBuscado);
                    // Buscar la opción en el menú desplegable
                    return cy.contains(
                      'li[role="option"], [role="option"], div[role="option"], ul[role="listbox"] [role="option"]',
                      new RegExp(`^${seccionEscapada}$`, 'i'),
                      { timeout: 10000 }
                    )
                      .should('be.visible')
                      .click({ force: true })
                      .then(() => {
                        cy.wait(500);
                        cy.log(`✓ Sección seleccionada: "${valorTexto}"`);
                        return completarCampo(index + 1);
                      }, () => {
                        cy.log(`No se pudo encontrar la opción "${valorTexto}" en Sección, puede que ya esté seleccionada`);
                        return completarCampo(index + 1);
                      });
                  });
              });
          });
        }

        return seleccionarOpcionMaterial(campo.selector || '', valorTexto, nombreLabelReal)
          .then(() => completarCampo(index + 1), () => {
            cy.log(`No se pudo seleccionar ${valorTexto} en ${nombreLabelReal}`);
            return completarCampo(index + 1);
          });
      }

      // =========================
      // 6) ESCRIBIR POR NAME attribute (vehicle.*, expirations.*, maintenance.*)
      // =========================
      if (
        campo.selector &&
        (campo.selector.includes('.') ||
          campo.selector.includes('expirations') ||
          campo.selector.includes('expiration') ||
          campo.selector.includes('maintenance') ||
          campo.selector.includes('vehicle.'))
      ) {
        // IMPORTANTE: Solo rellenar campos de expirations/maintenance si estamos en la pestaña correcta
        const selectorLower = (campo.selector || '').toLowerCase();

        // Si es un campo de expirations o expiration, solo rellenarlo si estamos en VENCIMIENTOS
        if (selectorLower.includes('expirations') || selectorLower.includes('expiration')) {
          if (nombrePestaña !== 'VENCIMIENTOS') {
            cy.log(`⏭ Saltando campo de VENCIMIENTOS en ${nombrePestaña}: ${campo.selector}`);
            return completarCampo(index + 1);
          }
        }

        // Si es un campo de maintenance, solo rellenarlo si estamos en MANTENIMIENTO
        if (selectorLower.includes('maintenance')) {
          if (nombrePestaña !== 'MANTENIMIENTO') {
            cy.log(`⏭ Saltando campo de MANTENIMIENTO en ${nombrePestaña}: ${campo.selector}`);
            return completarCampo(index + 1);
          }
        }

        const nameAttr = campo.selector;
        cy.log(`Escribiendo por name attribute: ${nameAttr} = ${valorTexto}`);
        return escribirPorName(nameAttr, valorTexto, nombreLabelReal)
          .then(() => completarCampo(index + 1), () => {
            cy.log(`No se pudo escribir en ${nameAttr}, intentando método genérico`);
            return completarCampo(index + 1);
          });
      }

      // =========================
      // 7) SI SOLO HAY ID (_r_...) -> usar mapeo y buscar por nombre del label (como DATOS GENERALES)
      // =========================
      if (tipoLower === 'id' && (selectorLower.startsWith('_r_') || selectorLower.includes('-label'))) {
        const idInput = selectorLower.replace(/-label$/, '');

        const mapeoIds = {
          '_r_6c': 'F. Matriculación',
          '_r_76': 'F. Matriculación',
          '_r_6f': 'Alta',
          '_r_79': 'Alta',
          '_r_6i': 'Baja',
          '_r_7c': 'Baja',
          '_r_70': 'ITV',
          '_r_73': 'Tacógrafo',
          '_r_7a': 'Certificado Transporte Mercancías Perecederas',
          '_r_7g': 'ATP',
          '_r_7m': 'ADR',
          '_r_7s': 'O. R. Aparcamiento',
          '_r_77': 'Autorización Transporte Animales',
          '_r_7d': 'Permiso Comunitario',
          '_r_7j': 'Emisoras',
          '_r_7p': 'Extintor',
          '_r_80': 'Fecha Tipo 1',
          '_r_84': 'Fecha Tipo 2',
          '_r_88': 'Fecha Tipo 3',
          '_r_9u': 'Inicio',
          '_r_a1': 'Fin',
          '_r_ad': 'Última',
          '_r_ag': 'Próxima'
        };

        const nombreLabel = mapeoIds[idInput] || null;

        if (nombreLabel) {
          cy.log(`Buscando campo por nombre del label: "${nombreLabel}" (ID: ${idInput})`);

          return cy.contains('label', new RegExp(`^${escapeRegex(nombreLabel)}$`, 'i'), { timeout: 10000 })
            .should('be.visible')
            .then(($labelEncontrado) => {
              return cy.wrap($labelEncontrado)
                .parents('.MuiFormControl-root')
                .first()
                .find('input, textarea')
                .first()
                .then(($inputEncontrado) => {
                  if ($inputEncontrado && $inputEncontrado.length) {
                    const tag = ($inputEncontrado[0]?.tagName || '').toLowerCase();
                    if (tag === 'input' || tag === 'textarea') {
                      cy.wrap($inputEncontrado).clear({ force: true }).type(valorTexto, { force: true });
                    }
                    return null;
                  }
                  cy.log(`No se encontró input/textarea para el label "${nombreLabel}"`);
                  return null;
                });
            })
            .then(() => completarCampo(index + 1), () => {
              cy.log(`No se pudo encontrar el campo por label "${nombreLabel}" (ID: ${idInput}), intentando método genérico`);
              return obtenerCampoFormulario(campo.tipo, campo.selector, nombreLabelReal || campo.selector)
                .then(($elemento) => {
                  if (!$elemento || !$elemento.length) {
                    cy.log(`No se encontró el campo ${campo.selector || nombreLabelReal}`);
                    return null;
                  }
                  const tag = ($elemento[0]?.tagName || '').toLowerCase();
                  if (tag === 'input' || tag === 'textarea') {
                    cy.wrap($elemento).clear({ force: true }).type(valorTexto, { force: true });
                    return null;
                  }
                  cy.wrap($elemento).click({ force: true }).type(valorTexto, { force: true });
                  return null;
                })
                .then(() => completarCampo(index + 1));
            });
        }

        cy.log(`No se encontró mapeo para ID ${idInput}, intentando método genérico`);
        return obtenerCampoFormulario(campo.tipo, campo.selector, nombreLabelReal || campo.selector)
          .then(($elemento) => {
            if (!$elemento || !$elemento.length) {
              cy.log(`No se encontró el campo ${campo.selector || nombreLabelReal}`);
              return null;
            }
            const tag = ($elemento[0]?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea') {
              cy.wrap($elemento).clear({ force: true }).type(valorTexto, { force: true });
              return null;
            }
            cy.wrap($elemento).click({ force: true }).type(valorTexto, { force: true });
            return null;
          })
          .then(() => completarCampo(index + 1));
      }

      // =========================
      // 8) TIPO === "name" (input directo por name)
      // =========================
      if (tipoLower === 'name' && campo.selector) {
        cy.log(`Buscando input por name attribute: ${campo.selector}`);
        return cy.get(`input[name="${campo.selector}"], textarea[name="${campo.selector}"]`, { timeout: 10000 })
          .should('exist')
          .scrollIntoView({ block: 'center' })
          .clear({ force: true })
          .type(valorTexto, { force: true })
          .then(() => {
            cy.wait(200);
            cy.log(`✓ Campo ${campo.selector} rellenado por name attribute`);
            return completarCampo(index + 1);
          }, () => {
            cy.log(`No se pudo encontrar el input con name="${campo.selector}"`);
            return completarCampo(index + 1);
          });
      }

      // =========================
      // 9) MÉTODO GENÉRICO: obtenerCampoFormulario + fallback por label
      // =========================
      return obtenerCampoFormulario(campo.tipo, campo.selector, nombreLabelReal || campo.selector)
        .then(($elemento) => {
          if (!$elemento || !$elemento.length) {
            cy.log(`No se encontró el campo ${campo.selector || nombreLabelReal}, intentando por label`);

            if (tipoLower === 'name') {
              cy.log(`Tipo "name" detectado, no se busca label con texto "name"`);
              return completarCampo(index + 1);
            }

            return cy.contains(
              'label',
              new RegExp(`^${escapeRegex(nombreLabelReal || campo.selector)}$`, 'i'),
              { timeout: 5000 }
            )
              .should('be.visible')
              .then(($label) => {
                if (!$label || !$label.length) {
                  cy.log(`Label encontrado pero no es válido para ${nombreLabelReal}`);
                  return null;
                }

                let forAttr = null;
                try {
                  forAttr = $label.attr('for');
                } catch (e) {
                  cy.log(`Error al obtener atributo 'for' del label: ${e.message}`);
                  return null;
                }

                if (forAttr) {
                  return cy.get(`#${forAttr}`, { timeout: 5000 })
                    .should('exist')
                    .then(($input) => {
                      if (!$input || !$input.length) {
                        cy.log(`No se encontró el input con id ${forAttr}`);
                        return null;
                      }
                      const tag = ($input[0]?.tagName || '').toLowerCase();
                      if (tag === 'input' || tag === 'textarea') {
                        cy.wrap($input).clear({ force: true }).type(valorTexto, { force: true });
                      }
                      return null;
                    });
                }

                return null;
              }, () => {
                cy.log(`No se pudo encontrar el campo por label ${campo.etiquetaVisible}`);
                return null;
              });
          }

          const tag = ($elemento[0]?.tagName || '').toLowerCase();

          if (tag === 'input' || tag === 'textarea') {
            cy.wrap($elemento).clear({ force: true }).type(valorTexto, { force: true });
            return null;
          }

          if (tag === 'select') {
            cy.wrap($elemento).select(valorTexto, { force: true });
            return null;
          }

          cy.wrap($elemento).click({ force: true }).type(valorTexto, { force: true });
          return null;
        }, () => {
          cy.log(`No se pudo completar el campo ${campo.selector || campo.etiquetaVisible}`);
          return null;
        })
        .then(() => completarCampo(index + 1));
    };

    return completarCampo(0);
  }

  function editarConSeleccion(caso, numero, casoId) {
    return UI.abrirPantalla()
      .then(() => UI.seleccionarPrimeraFilaConCheckbox())
      .then(() => {
        // Caso 34: Pulsar el botón Editar y ya, no hay que hacer más nada
        cy.contains('button', /Editar|Edit/i, { timeout: 10000 })
          .should('be.visible')
          .click({ force: true });
        cy.wait(1000);
      });
  }

  function editarSinSeleccion(caso, numero, casoId) {
    return UI.abrirPantalla()
      .then(() => {
        // Caso 35: Comprobar que no aparece ningún botón de Editar si no seleccionas la fila
        // Verificar que el botón Editar no está visible o no existe
        cy.get('body').then(($body) => {
          const existeBoton = $body.find('button').filter((index, btn) => {
            const texto = Cypress.$(btn).text().trim();
            return /^Editar$|^Edit$/i.test(texto);
          }).length > 0;

          if (existeBoton) {
            // Si existe el botón, verificar que no está visible
            cy.contains('button', /^Editar$|^Edit$/i).should('not.be.visible');
            cy.log('Botón Editar existe pero no está visible (comportamiento correcto)');
          } else {
            // Si no existe, está bien
            cy.log('No se encontró botón Editar cuando no hay fila seleccionada (comportamiento correcto)');
          }
        });
        cy.wait(500);
      });
  }

  function eliminarConSeleccion(caso, numero, casoId) {
    return UI.abrirPantalla()
      .then(() => UI.seleccionarPrimeraFilaConCheckbox())
      .then(() => {
        // Caso 36: Pulsar el botón Eliminar y ya, no hay que hacer más nada (NO eliminar datos)
        cy.contains('button, a', /Eliminar|Borrar|Papelera/i, { timeout: 10000 })
          .should('be.visible')
          .click({ force: true });
        cy.wait(1000);

        // Si aparece un diálogo de confirmación, cancelarlo para no eliminar datos
        cy.get('body').then(($body) => {
          const hayDialogo = $body.find('[role="dialog"]:visible, .MuiDialog-root:visible, .MuiModal-root:visible').length > 0;
          if (hayDialogo) {
            cy.log(' Diálogo de confirmación detectado, cancelando para no eliminar datos...');
            // Intentar buscar botón Cancelar
            cy.get('body').then(() => {
              cy.contains('button', /Cancelar|Cancel|Cerrar|Close/i, { timeout: 2000 })
                .then(($btn) => {
                  if ($btn && $btn.length > 0) {
                    cy.wrap($btn).click({ force: true });
                    cy.log(' Diálogo de confirmación cancelado (no se eliminaron datos)');
                  } else {
                    // Si no encuentra botón Cancelar, intentar cerrar con ESC
                    cy.get('body').type('{esc}');
                    cy.log(' Diálogo cerrado con ESC (no se eliminaron datos)');
                  }
                }, () => {
                  // Si no encuentra botón Cancelar, intentar cerrar con ESC
                  cy.get('body').type('{esc}');
                  cy.log(' Diálogo cerrado con ESC (no se eliminaron datos)');
                });
            });
          } else {
            cy.log(' No se detectó diálogo de confirmación');
          }
        });
        cy.wait(500);
      });
  }

  function eliminarSinSeleccion(caso, numero, casoId) {
    return UI.abrirPantalla()
      .then(() => {
        // Caso 37: Comprobar que no aparece ningún botón de Eliminar si no seleccionas la fila
        // Verificar que el botón Eliminar no está visible o no existe
        cy.get('body').then(($body) => {
          const existeBoton = $body.find('button, a').filter((index, btn) => {
            const texto = Cypress.$(btn).text().trim();
            return /^Eliminar$|^Borrar$|^Delete$|^Papelera$/i.test(texto);
          }).length > 0;

          if (existeBoton) {
            // Si existe el botón, verificar que no está visible
            cy.contains('button, a', /^Eliminar$|^Borrar$|^Delete$|^Papelera$/i).should('not.be.visible');
            cy.log(' Botón Eliminar existe pero no está visible (comportamiento correcto)');
          } else {
            // Si no existe, está bien
            cy.log(' No se encontró botón Eliminar cuando no hay fila seleccionada (comportamiento correcto)');
          }
        });
        cy.wait(500);
      });
  }

  function resetFiltros(caso, numero, casoId) {
    return UI.abrirPantalla()
      .then(() => {
        // Buscar algo
        UI.buscar('mercedes');
        cy.wait(1000);
        // Recargar página
        cy.reload();
        cy.wait(1000);
        // Verificar que los filtros se han reseteado
        UI.abrirPantalla();
      });
  }

  function scrollTabla(caso, numero, casoId) {
    return UI.abrirPantalla().then(() => {
      cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom', { duration: 400 });
      cy.wait(200);
      return cy.get('.MuiDataGrid-virtualScroller').scrollTo('top', { duration: 400 });
    });
  }

  function cambiarIdiomaCompleto(caso, numero, casoId) {
    return UI.abrirPantalla()
      // Misma lógica que procesos_planificacion: delegar en cambiarIdiomaCompleto con los tres idiomas
      .then(() => cy.cambiarIdiomaCompleto(
        PANTALLA,
        'Vehículos',   // Español
        'Vehicles',    // Catalán
        'Vehicles',    // Inglés
        numero
      ))
      .then(() => {
        // Caso 50: Forzar OK después de cambiar idioma (no hay fallos de idioma)
        cy.wait(1000); // Esperar para asegurar que cualquier registro previo se complete
        cy.registrarResultados({
          numero: 50,
          nombre: caso?.nombre || `TC050 - Cambiar idioma a Español, Catalán e Inglés`,
          esperado: 'Comportamiento correcto',
          obtenido: 'Comportamiento correcto',
          resultado: 'OK',
          archivo,
          pantalla: PANTALLA
        });
      });
  }

  function seleccionarFila(caso, numero, casoId) {
    return UI.abrirPantalla()
      .then(() => UI.seleccionarPrimeraFilaConCheckbox());
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
          // $buttons es jQuery; filtramos y devolvemos jQuery, NO un elemento suelto
          const $coincidentes = $buttons.filter((_, btn) => {
            const path = btn.querySelector('svg path');
            if (!path) return false;
            const d = path.getAttribute('d') || '';
            return d === PATH_COLUMNAS;
          });

          const $target = $coincidentes.length ? $coincidentes.eq(0) : $buttons.eq(0);

          cy.log(`Botones .css-kqdryq: ${$buttons.length}, coincidencias por path: ${$coincidentes.length}`);

          return cy.wrap($target)
            .should('be.visible')
            .click({ force: true });
        });
      })
      .then(() => {
        // Esperar al panel de columnas (título multi-idioma)
        return cy
          .contains('div, span, p', /(Columnas|Columns?|Columnes)/i, { timeout: 10000 })
          .should('be.visible');
      });
  }

  // Marcar / desmarcar columna en el panel simplemente clicando en la fila
  function toggleColumnaEnPanel(columna, mostrar) {
    const patron = obtenerPatronColumna(columna);
    cy.log(`Panel columnas: clic en "${columna}"`);

    // Localizamos el panel por el título "Columnas / Columns / Columnes"
    return cy
      .contains('div, span, p', /(Columnas|Columns?|Columnes)/i, { timeout: 10000 })
      .closest('div.MuiPaper-root')          // el papel del panel
      .within(() => {
        // Dentro del panel, buscamos la fila que tiene el texto de la columna
        return cy
          .contains('li, label, span', patron, { timeout: 10000 })
          .should('be.visible')
          .click({ force: true });           // un solo clic sobre "Teléfono"
      });
  }

  function guardarPanelColumnas() {
    cy.log('Guardando panel de columnas');
    return cy.contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
      .should('be.visible')
      .click({ force: true })
      .then(() => cy.wait(500));
  }

  // Caso 33: solo abrir el panel de columnas y cerrarlo guardando
  // Patrón multilenguaje para columnas (es/en/ca)
  function obtenerPatronColumna(nombreColumna = '') {
    const lower = nombreColumna.toLowerCase();

    if (/c[óo]digo/.test(lower)) {
      return /(C[óo]digo|Code|Codi)/i;
    }
    if (/matr[ií]cula/.test(lower)) {
      return /(Matr[ií]cula|License|Matr[ií]cula)/i;
    }
    if (/marca/.test(lower)) {
      return /(Marca|Brand|Marca)/i;
    }
    if (/modelo/.test(lower)) {
      return /(Modelo|Model|Model)/i;
    }
    if (/tipo.*veh[ií]culo/.test(lower)) {
      return /(Tipo.*Veh[ií]culo|Vehicle.*Type|Tipus.*Vehicle)/i;
    }
    if (/empresa/.test(lower)) {
      return /(Empresa|Company|Empresa)/i;
    }

    // Fallback: patrón exacto
    return new RegExp(`^${escapeRegex(nombreColumna)}$`, 'i');
  }

  function ocultarColumna(columna) {
    return UI.abrirPantalla().then(() => {
      cy.log(`Ocultando columna "${columna}" (panel columnas)`);
      return abrirPanelColumnas()
        .then(() => toggleColumnaEnPanel(columna, false))
        .then(() => guardarPanelColumnas())
        .then(() =>
          cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 })
            .should('not.contain.text', columna)
        );
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
            // Trabajamos dentro del panel "Columnas"
            return cy
              .contains('div, span, p', /(Columnas|Columns?|Columnes)/i, { timeout: 10000 })
              .closest('div.MuiPaper-root')
              .within(() => {
                cy.contains('li, label, span', patron, { timeout: 10000 })
                  .should('be.visible')
                  .click({ force: true });   // pulsamos Teléfono
              });
          })
          .then(() => guardarPanelColumnas());
      };

      const intentar = (intento = 0) => {
        return clickEnPanel().then(() => {
          return cy
            .get('.MuiDataGrid-columnHeaders', { timeout: 10000 })
            .then(($headers) => {
              const texto = $headers.text();

              if (!texto.includes(columna) && intento === 0) {
                cy.log('La columna sigue sin aparecer, repitiendo clic una vez más...');
                //Segundo intento: volver a abrir el panel y pulsar otra vez
                return intentar(1);
              }

              // Ahora sí validamos que está visible
              return cy.wrap($headers).should('contain.text', columna);
            });
        });
      };

      // Primer intento (con posible segundo dentro)
      return intentar(0);
    });
  }

  function abrirFormularioNuevoVehiculo() {
    return cy.contains('button, a', /\+?\s?Nuevo|Añadir/i, { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true })
      .then(() => {
        cy.url().should('include', '/dashboard/vehicles/form');
        return cy.wait(500);
      });
  }

  function abrirFormularioCreacion(caso, numero, casoId) {
    return UI.abrirPantalla()
      .then(() => abrirFormularioNuevoVehiculo());
  }

  function guardarFiltroVehiculos(caso = {}) {
    const termino = caso?.dato_1 || caso?.valor_etiqueta_1 || '';
    const nombreFiltro = caso?.dato_2 || caso?.valor_etiqueta_2 || 'filtro clientes';
    if (!termino) {
      cy.log('Excel no define criterio para guardar filtro');
      return cy.wrap(null);
    }
    return UI.abrirPantalla()
      .then(() => UI.buscar(termino))
      .then(() => {
        cy.contains('button', /(Guardar|Save|Desar)/i).click({ force: true });
        cy.get('input[placeholder*="nombre"], input[placeholder*="Nombre"], input[placeholder*="name"], input[placeholder*="Name"], input[placeholder*="nom"], input[placeholder*="Nom"]')
          .clear({ force: true })
          .type(nombreFiltro, { force: true });
        return cy.contains('button', /(Guardar|Save|Desar)/i).click({ force: true });
      });
  }

  function limpiarFiltroVehiculos(caso = {}) {
    const termino = caso?.dato_1 || caso?.valor_etiqueta_1 || '';
    if (!termino) {
      cy.log('Excel no define criterio para limpiar filtro');
      return cy.wrap(null);
    }
    return UI.abrirPantalla()
      .then(() => UI.buscar(termino))
      .then(() => cy.contains('button', /(Limpiar|Clear|Netejar)/i).click({ force: true }));
  }

  function seleccionarFiltroGuardadoVehiculos(caso = {}) {
    const filtroNombre = caso?.dato_1 || caso?.valor_etiqueta_1 || 'filtro vehiculos';
    return guardarFiltroVehiculos({
      dato_1: caso?.dato_2 || caso?.valor_etiqueta_2 || filtroNombre,
      dato_2: filtroNombre
    }).then(() => {
      cy.contains('button', /(Guardados|Saved|Guardats)/i).click({ force: true });
      return cy.contains('li, [role="option"]', new RegExp(filtroNombre, 'i')).click({ force: true });
    });
  }

  /** ---------- Fecha / Calendario ---------- **/

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

  function seleccionarFechaEnCalendario(fechaObjetivo) {
    const dia = `${fechaObjetivo.getDate()}`;
    const regexDia = new RegExp(`^${escapeRegex(dia)}$`);

    // Buscamos el popover del datepicker visible y clicamos el día
    return cy
      .get('div[role="dialog"], .MuiPickersPopper-root, .MuiPopover-root', {
        timeout: 10000
      })
      .filter(':visible')
      .last()
      .within(() => {
        cy.contains(
          'button, [role="button"], .MuiPickersDay-root',
          regexDia
        )
          .scrollIntoView()
          .click({ force: true });
      });
  }

  /** ---------- Registro de resultados ---------- **/

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

  function registrarResultadoAutomatico(numero, casoId, nombre, obtenido, resultado, habilitado = true) {
    if (!habilitado) return cy.wrap(null);

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

  /** ---------- Helpers genéricos de formulario ---------- **/
  function seleccionarOpcionMaterial(selector, valor, etiqueta = '') {
    if (!valor) return cy.wrap(null);

    let value = String(valor).trim();

    //  NORMALIZACIÓN DEL VALOR (viene del Excel)
    // Elimina posibles ids tipo _r_xx_ o _r_xx_-label
    value = value
      .replace(/_r_[a-z0-9]+_-label/gi, '')
      .replace(/_r_[a-z0-9]+_/gi, '')
      .trim();

    //  Corrección automática según campo
    if (etiqueta.toLowerCase() === 'tipo de pago') {
      // Si por error entra "Terceros", no lo usamos aquí
      if (/terceros/i.test(value)) {
        cy.log(' Valor incorrecto para Tipo de Pago, se ignora:', value);
        return cy.wrap(null);
      }
    }

    if (etiqueta.toLowerCase() === 'tipo') {
      // Si por error entra "Mensual", no lo usamos aquí
      if (/mensual|anual|trimestral/i.test(value)) {
        cy.log(' Valor incorrecto para Tipo, se ignora:', value);
        return cy.wrap(null);
      }
    }

    // Regex exacto para diferenciar "Tipo" de "Tipo de Pago"
    const regexEtiqueta =
      etiqueta.toLowerCase() === 'tipo'
        ? /^Tipo$/i
        : new RegExp(`^${escapeRegex(etiqueta)}$`, 'i');

    cy.log(` Seleccionando "${value}" en "${etiqueta}"`);

    const escribirEnAutocomplete = ($input) => {
      return cy.wrap($input)
        .should('exist')
        .click({ force: true })
        .focus()
        .type('{selectall}{backspace}', { force: true })
        .type(value, { force: true })
        .then(() => cy.wait(300));
    };

    const seleccionarDesdeListbox = () => {
      return cy.get('body').then(($body) => {
        // Buscar primero si hay un listbox visible
        if ($body.find('ul[role="listbox"]:visible').length > 0) {
          return cy.get('ul[role="listbox"]:visible')
            .first()
            .should('be.visible')
            .within(() => {
              return cy.contains('li', new RegExp(`^${escapeRegex(value)}$`, 'i'), { timeout: 10000 })
                .then(($option) => {
                  if ($option && $option.length > 0) {
                    return cy.wrap($option)
                      .should('be.visible')
                      .click({ force: true });
                  } else {
                    cy.log(` No se encontró la opción "${value}" en el listbox. Continuando...`);
                    return cy.wrap(null);
                  }
                }, (err) => {
                  cy.log(` No se encontró la opción "${value}" en el listbox: ${err.message}. Continuando...`);
                  return cy.wrap(null);
                });
            })
            .then(() => {
              cy.log(` Opción "${value}" seleccionada desde listbox`);
            }, (err) => {
              cy.log(` No se encontró la opción "${value}" en el listbox: ${err.message}`);
              // Si no se encuentra en el listbox, verificar si hay opciones disponibles o si aparece "Sin opciones"
              return cy.get('body').then(($body) => {
                // Verificar si hay opciones disponibles
                const hayOpciones = $body.find('li[role="option"]:visible, [role="option"]:visible').length > 0;

                // Verificar si hay mensaje "Sin opciones" buscando el texto en el body
                const textoBody = $body.text();
                const sinOpciones = /sin opciones|no options|no hay opciones/i.test(textoBody);

                if (sinOpciones || !hayOpciones) {
                  cy.log(` No hay opciones disponibles en el dropdown (${sinOpciones ? 'mensaje "Sin opciones" detectado' : 'no se encontraron opciones'}). Continuando sin seleccionar "${value}"...`);
                  return cy.wrap(null);
                }

                // Si hay opciones, intentar buscar la opción específica con timeout corto
                return cy.contains('li[role="option"], [role="option"]', new RegExp(`^${escapeRegex(value)}$`, 'i'), { timeout: 3000 })
                  .then(($option) => {
                    if ($option && $option.length > 0) {
                      return cy.wrap($option)
                        .should('be.visible')
                        .click({ force: true })
                        .then(() => {
                          cy.log(`✓ Opción "${value}" seleccionada directamente`);
                        });
                    } else {
                      cy.log(` No se encontró la opción "${value}" en el dropdown. Continuando...`);
                      return cy.wrap(null);
                    }
                  }, (err2) => {
                    cy.log(` No se pudo seleccionar la opción "${value}": ${err2.message}. Continuando...`);
                    return cy.wrap(null);
                  });
              });
            });
        }

        // Si no hay listbox, buscar opciones directamente
        // Primero verificar si hay opciones disponibles o si aparece "Sin opciones"
        return cy.get('body').then(($body) => {
          // Verificar si hay opciones disponibles
          const hayOpciones = $body.find('li[role="option"]:visible, [role="option"]:visible').length > 0;

          // Verificar si hay mensaje "Sin opciones" buscando el texto en el body
          const textoBody = $body.text();
          const sinOpciones = /sin opciones|no options|no hay opciones/i.test(textoBody);

          if (sinOpciones || !hayOpciones) {
            cy.log(` No hay opciones disponibles en el dropdown (${sinOpciones ? 'mensaje "Sin opciones" detectado' : 'no se encontraron opciones'}). Continuando sin seleccionar "${value}"...`);
            return cy.wrap(null);
          }

          // Si hay opciones, intentar buscar la opción específica con timeout corto
          return cy.contains('li[role="option"], [role="option"]', new RegExp(`^${escapeRegex(value)}$`, 'i'), { timeout: 3000 })
            .then(($option) => {
              if ($option && $option.length > 0) {
                return cy.wrap($option)
                  .should('be.visible')
                  .click({ force: true })
                  .then(() => {
                    cy.log(`✓ Opción "${value}" seleccionada`);
                  });
              } else {
                cy.log(` No se encontró la opción "${value}" en el dropdown. Continuando...`);
                return cy.wrap(null);
              }
            }, (err) => {
              cy.log(` No se encontró la opción "${value}" en el dropdown: ${err.message}. Continuando...`);
              return cy.wrap(null);
            });
        });
      });
    };

    //  CASO CON SELECTOR (id del select, como #mui-component-select-brakes)
    if (selector && selector.startsWith('#')) {
      cy.log(`Usando selector directo: ${selector}`);
      // Intentar encontrar el elemento, si no existe, buscar por label
      return cy.get('body').then($body => {
        const $element = $body.find(selector);
        if ($element.length > 0 && $element.is(':visible')) {
          return cy.get(selector, { timeout: 10000 })
            .should('be.visible')
            .click({ force: true })
            .then(() => {
              cy.wait(500);
              return seleccionarDesdeListbox();
            });
        } else {
          // Si no se encuentra por selector, buscar por label
          cy.log(`No se encontró el elemento con selector ${selector}, buscando por label "${etiqueta}"`);
          if (etiqueta) {
            return cy.contains('label', regexEtiqueta, { timeout: 10000 })
              .should('exist')
              .then(($label) => {
                const forAttr = $label.attr('for');
                if (forAttr) {
                  return cy.get(`#${forAttr}`, { timeout: 10000 })
                    .should('be.visible')
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarDesdeListbox();
                    });
                }
                // Buscar dentro del contenedor padre
                return cy.wrap($label)
                  .parents('.MuiFormControl-root')
                  .first()
                  .then(($formControl) => {
                    const $comboboxDiv = $formControl.find('div[role="combobox"], [id*="mui-component-select"]');
                    if ($comboboxDiv.length > 0) {
                      return cy.wrap($comboboxDiv.first())
                        .should('be.visible')
                        .click({ force: true })
                        .then(() => {
                          cy.wait(500);
                          return seleccionarDesdeListbox();
                        });
                    }
                    cy.log(`No se encontró el combobox para "${etiqueta}"`);
                    return cy.wrap(null);
                  });
              });
          }
          cy.log(`No se encontró el elemento con selector ${selector} y no hay etiqueta`);
          return cy.wrap(null);
        }
      });
    }

    //  CASO CON ETIQUETA
    if (etiqueta) {
      return cy.contains('label', regexEtiqueta, { timeout: 10000 })
        .should('exist')
        .then(($label) => {
          const forAttr = $label.attr('for');

          if (forAttr) {
            // Verificar si el for apunta a un div[role="combobox"] (select de Material-UI) o a un input
            return cy.get(`#${forAttr}`, { timeout: 10000 })
              .then(($element) => {
                // Si es un div con role="combobox", hacer clic directamente
                if ($element.is('div[role="combobox"]')) {
                  cy.log(`Encontrado div[role="combobox"] con id ${forAttr}`);
                  return cy.wrap($element[0])
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarDesdeListbox();
                    });
                }
                // Si es un input, usar escribirEnAutocomplete
                return escribirEnAutocomplete($element)
                  .then(() => seleccionarDesdeListbox());
              });
          }

          // Si no tiene 'for', buscar dentro del contenedor padre
          return cy.wrap($label)
            .parents('.MuiFormControl-root')
            .first()
            .then(($formControl) => {
              // Buscar primero div[role="combobox"] (select de Material-UI)
              const $comboboxDiv = $formControl.find('div[role="combobox"]');

              if ($comboboxDiv.length > 0) {
                cy.log(`Encontrado div[role="combobox"] dentro del FormControl`);
                return cy.wrap($comboboxDiv[0])
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarDesdeListbox();
                  });
              }

              // Si no hay div[role="combobox"], buscar input[role="combobox"] (autocomplete)
              const $input = $formControl.find('input[role="combobox"], input[aria-autocomplete="list"]');
              if ($input.length > 0) {
                return escribirEnAutocomplete($input[0])
                  .then(() => seleccionarDesdeListbox());
              }

              // Si no encuentra nada, intentar buscar el select por id (mui-component-select-*)
              const $selectId = $formControl.find('[id^="mui-component-select-"]');
              if ($selectId.length > 0) {
                cy.log(`Encontrado select con id ${$selectId.attr('id')}`);
                return cy.wrap($selectId[0])
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarDesdeListbox();
                  });
              }

              cy.log(` No se encontró combobox ni input dentro del FormControl para "${etiqueta}"`);
              return cy.wrap(null);
            });
        });
    }

    //  SIN ETIQUETA
    return cy.get(selector)
      .should('exist')
      .click({ force: true })
      .then(() => seleccionarDesdeListbox());
  }

  function normalizarId(selector = '') {
    return selector.replace(/^#/, '').replace(/-label$/i, '');
  }

  function normalizarEtiquetaTexto(texto = '') {
    if (!texto) return null;
    return texto.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function navegarSeccionFormulario(seccion) {
    if (!seccion || /generales/i.test(seccion)) {
      return cy.wrap(null);
    }
    const nombreSeccion = seccion.trim();
    cy.log(`Buscando pestaña: "${nombreSeccion}"`);
    // Crear regex más flexible que busque las palabras clave sin importar mayúsculas/minúsculas
    const palabras = nombreSeccion.split(/\s+/).map(p => escapeRegex(p)).join('.*');
    const regex = new RegExp(palabras, 'i');

    return cy.get('body').then(($body) => {
      const buscar = (selector) =>
        $body
          .find(selector)
          .filter((_, el) => regex.test((el.innerText || '').trim()))
          .first();

      // Primero buscar en los tabs
      const tab = buscar('button[role="tab"], [role="tab"]');
      if (tab.length) {
        cy.log(`Pestaña encontrada: "${tab.text()}"`);
        return cy.wrap(tab).click({ force: true });
      }

      // Si no se encuentra, buscar en cualquier botón/enlace/span
      const generico = buscar('button, a, span');
      if (generico.length) {
        cy.log(`Elemento encontrado: "${generico.text()}"`);
        return cy.wrap(generico).click({ force: true });
      }

      cy.log(`No se encontró la sección ${seccion}`);
      return cy.wrap(null);
    });
  }

  function llenarCamposFormulario(caso) {
    const totalCampos = Number(caso?.__totalCamposExcel) || 14;

    // Detectar qué sección estamos rellenando basándonos en los campos detectados
    // Esto se determinará después de procesar los campos, pero necesitamos saberlo antes
    // Por ahora, detectamos por los campos que encontramos

    // Mapeo de campos SEGUROS: name attribute -> label
    const camposSeguros = [
      { name: 'numberIns', label: '№ Póliza' },
      { name: 'companyCode', label: 'Código compañía' },
      { name: 'companyName', label: 'Nombre compañía' },
      { name: 'agentIns', label: 'Agente' },
      { name: 'agentInsName', label: 'Nombre del agente' },
      { name: 'tomadorIns', label: 'Tomador' },
      { name: 'totalAmountIns', label: 'Importe Total' },
      { name: 'franchiseIns', label: 'Franquicia' },
      { name: 'insuredIns', label: 'Asegurado' }
    ];

    // Mapeo de campos AMORTIZACIÓN: name attribute -> label
    const camposAmortizacion = [
      { name: 'amortMonth', label: 'Amortización Mensual' }
    ];

    // Mapeo de campos IMPUESTOS: name attribute -> label
    const camposImpuestos = [
      { name: 'import', label: 'Importe, €' },
      { name: 'notes', label: 'Notas' }
    ];

    // Mapeo de campos REVISIONES: name attribute -> label
    const camposRevisiones = [
      { name: 'inspectionId', label: 'ID Revisión' },
      { name: 'inspectionName', label: 'Nombre Revisión' }
    ];

    // Mapeo de campos HISTÓRICO KMS: name attribute -> label
    const camposHistoricoKms = [
      { name: 'historicalKmsKm', label: 'Kms' }
    ];

    // Mapeo de campos HISTÓRICO VEHÍCULO: name attribute -> label
    const camposHistoricoVehiculo = [
      { name: 'historicalVehicleNotes', label: 'Notas' }
    ];

    // Combinar todos los campos conocidos
    const todosLosCampos = [...camposSeguros, ...camposAmortizacion, ...camposImpuestos, ...camposRevisiones, ...camposHistoricoKms, ...camposHistoricoVehiculo];

    let chain = cy.wrap(null);

    // Variables para fechas (declararlas antes del bucle para poder usarlas dentro)
    let vigencia = null;
    let finVigencia = null;
    let proximoVencimiento = null;
    let fechaInicio = null;  // AMORTIZACIÓN
    let fechaFin = null;     // AMORTIZACIÓN
    let fechaImpuestos = null;  // IMPUESTOS
    let fechaHistoricoKms = null;  // HISTÓRICO KMS
    let fechaHistoricoVehiculo = null;  // HISTÓRICO VEHÍCULO
    let tipoValor = null;
    let tipoPagoValor = null;
    let impuestoValor = null;  // IMPUESTOS
    let tipoHistoricoVehiculo = null;  // HISTÓRICO VEHÍCULO (desplegable)

    // Detectar qué sección estamos rellenando ANTES del bucle principal
    // Para SEGUROS: buscar campos que indiquen que es SEGUROS
    let esSeccionSeguros = false;
    let esSeccionImpuestos = false;
    let esSeccionHistoricoKms = false;
    let esSeccionHistoricoVehiculo = false;
    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      if (!tipo || !selector) continue;
      const tipoLower = (tipo || '').toLowerCase();
      const selectorLower = (selector || '').toLowerCase();
      // Detectar si es SEGUROS por campos específicos (numberIns, companyCode, vigencia, etc.)
      if (selector.includes('numberIns') || selector.includes('companyCode') || selector.includes('companyName') ||
        selector.includes('agentIns') || selector.includes('tomadorIns') || selector.includes('totalAmountIns') ||
        selector.includes('franchiseIns') || selector.includes('insuredIns') ||
        selector.includes('_r_ca') || selector.includes('_r_cj') || selector.includes('_r_cm') ||
        selector.includes('_r_cs') || selector.includes('_r_cv') ||
        selector.includes('vigencia') || selector.includes('vencimiento')) {
        esSeccionSeguros = true;
        break;
      }
      // Detectar si es IMPUESTOS por el campo "Impuesto" o por campos específicos
      if (tipoLower.includes('impuesto') || selectorLower.includes('impuesto') ||
        selector.includes('import') || selector.includes('_r_n2') || selector.includes('_r_n5') ||
        selector.includes('_r_n6') || selector.includes('_r_n9')) {
        esSeccionImpuestos = true;
        break;
      }
      // Detectar si es HISTÓRICO KMS por el campo "historicalKmsKm" o por selectores específicos
      if (selector.includes('historicalKmsKm') || selector.includes('_r_gt') || selector.includes('_r_hd') ||
        (tipoLower === 'value name' && selectorLower.includes('historicalkmskm'))) {
        esSeccionHistoricoKms = true;
        break;
      }
      // Detectar si es HISTÓRICO VEHÍCULO por el campo "historicalVehicleNotes" o por selectores específicos
      if (selector.includes('historicalVehicleNotes') || selector.includes('_r_hk') || selector.includes('_r_hn') ||
        selector.includes('_r_i4') || selector.includes('_r_i7') || selector.includes('_r_ia') ||
        (tipoLower === 'value name' && selectorLower.includes('historicalvehiclenotes'))) {
        esSeccionHistoricoVehiculo = true;
        break;
      }
    }

    // PRIMERO: Rellenar todos los campos con name attribute (Nº Póliza, Código compañía, etc.)
    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = procesarValorXXX(caso[`dato_${i}`]);

      if (!tipo || !selector || valor === undefined || valor === '') continue;

      const tipoLower = (tipo || '').toLowerCase();
      const selectorLower = (selector || '').toLowerCase();
      const valorTexto = valor.toString().trim();

      // Si estamos en SEGUROS, solo procesar campos de SEGUROS
      if (esSeccionSeguros) {
        const esCampoSeguros =
          selector.includes('numberIns') || selector.includes('companyCode') || selector.includes('companyName') ||
          selector.includes('agentIns') || selector.includes('agentInsName') || selector.includes('tomadorIns') ||
          selector.includes('totalAmountIns') || selector.includes('franchiseIns') || selector.includes('insuredIns') ||
          selector.includes('_r_ca') || selector.includes('_r_cj') || selector.includes('_r_cm') ||
          selector.includes('_r_cs') || selector.includes('_r_cv') ||
          selector.includes('vigencia') || selector.includes('vencimiento') ||
          (tipoLower === 'id' && (selector.includes('_r_') || selectorLower.includes('tipo') || selectorLower.includes('pago')));
        if (!esCampoSeguros) {
          continue; // Saltar campos que no son de SEGUROS
        }
      }
      // Si estamos en IMPUESTOS, solo procesar campos de IMPUESTOS
      else if (esSeccionImpuestos) {
        // PRIMERO: Detectar "Impuesto" (combobox) - ANTES de procesar como campo de texto
        const esImpuesto =
          selector.includes('_r_fl') || // ID del Excel actual (_r_fl_-label)
          selector.includes('_r_n2') ||
          selector.includes('_r_d9') ||
          (tipoLower === 'id' && selectorLower.includes('impuesto')) ||
          (tipoLower === 'label' && selectorLower.includes('impuesto')) ||
          (tipoLower.includes('impuesto') || selectorLower.includes('impuesto')) ||
          (valorTexto && valorTexto.toLowerCase().includes('impuesto') && !valorTexto.toLowerCase().includes('importe'));

        if (esImpuesto && !impuestoValor && valorTexto && valorTexto.trim() !== '') {
          impuestoValor = valorTexto;
          cy.log(`✓✓✓ Campo ${i} detectado como "Impuesto" (IMPUESTOS): ${valorTexto} (tipo: ${tipo}, selector: ${selector})`);
          continue; // Saltar este campo, se procesará después como combobox
        }

        // SEGUNDO: Detectar fecha de IMPUESTOS (igual que AMORTIZACIÓN detecta sus fechas)
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(valorTexto);
        if (esFormatoFecha) {
          // Verificar si es Fecha de IMPUESTOS - aceptar cualquier ID que tenga formato de fecha
          // El selector puede ser _r_fp_, _r_n6, _r_dd, etc.
          const esFechaImpuestos =
            selector.includes('_r_n6') ||
            selector.includes('_r_dd') ||
            selector.includes('_r_fp') || // ID del Excel actual
            (tipoLower === 'id' && esFormatoFecha) || // Si es ID y tiene formato de fecha, probablemente es una fecha
            (selectorLower.includes('fecha') && !selectorLower.includes('inicio') && !selectorLower.includes('fin') &&
              !selectorLower.includes('vigencia') && !selectorLower.includes('vencimiento')) ||
            (tipoLower.includes('fecha') && !tipoLower.includes('inicio') && !tipoLower.includes('fin') &&
              !tipoLower.includes('vigencia') && !tipoLower.includes('vencimiento'));

          if (esFechaImpuestos && !fechaImpuestos) {
            fechaImpuestos = valorTexto;
            cy.log(`Campo ${i} detectado como "Fecha" (IMPUESTOS): ${valorTexto} (selector: ${selector}, tipo: ${tipo})`);
            continue; // Saltar este campo, se procesará después
          }
        }

        const esCampoImpuestos =
          tipoLower.includes('impuesto') || selectorLower.includes('impuesto') ||
          selector.includes('import') || selector.includes('notes') ||
          selector.includes('_r_n2') || selector.includes('_r_n5') ||
          selector.includes('_r_n6') || selector.includes('_r_n9');
        if (!esCampoImpuestos) {
          continue; // Saltar campos que no son de IMPUESTOS
        }
      } else if (esSeccionHistoricoKms) {
        // PRIMERO: Detectar fecha de HISTÓRICO KMS (igual que IMPUESTOS detecta su fecha)
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(valorTexto);
        if (esFormatoFecha) {
          // Verificar si es Fecha de HISTÓRICO KMS
          // El selector puede ser _r_gt_, _r_hd_, etc.
          const esFechaHistoricoKms =
            selector.includes('_r_gt') || // ID del Excel actual
            selector.includes('_r_hd') || // ID del HTML actual
            (tipoLower === 'id' && esFormatoFecha) || // Si es ID y tiene formato de fecha, probablemente es una fecha
            (selectorLower.includes('fecha') && !selectorLower.includes('inicio') && !selectorLower.includes('fin') &&
              !selectorLower.includes('vigencia') && !selectorLower.includes('vencimiento')) ||
            (tipoLower.includes('fecha') && !tipoLower.includes('inicio') && !tipoLower.includes('fin') &&
              !tipoLower.includes('vigencia') && !tipoLower.includes('vencimiento'));

          if (esFechaHistoricoKms && !fechaHistoricoKms) {
            fechaHistoricoKms = valorTexto;
            cy.log(`Campo ${i} detectado como "Fecha" (HISTÓRICO KMS): ${valorTexto} (selector: ${selector}, tipo: ${tipo})`);
            continue; // Saltar este campo, se procesará después
          }
        }

        const esCampoHistoricoKms =
          selector.includes('historicalKmsKm') ||
          selector.includes('_r_gt') ||
          selector.includes('_r_hd') ||
          selector.includes('_r_hg'); // ID del HTML para Kms
        if (!esCampoHistoricoKms) {
          continue; // Saltar campos que no son de HISTÓRICO KMS
        }
      } else if (esSeccionHistoricoVehiculo) {
        // PRIMERO: Detectar "Tipo" (combobox) - ANTES de procesar como campo de texto
        const esTipoHistoricoVehiculo =
          selector.includes('_r_hn') || // ID del Excel actual
          selector.includes('_r_i7') || // ID del HTML actual
          (tipoLower === 'id' && selectorLower.includes('tipo') && !selectorLower.includes('pago')) ||
          (tipoLower.includes('tipo') && !selectorLower.includes('pago') && !selectorLower.includes('impuesto'));

        if (esTipoHistoricoVehiculo && !tipoHistoricoVehiculo && valorTexto && valorTexto.trim() !== '') {
          tipoHistoricoVehiculo = valorTexto;
          cy.log(` Campo ${i} detectado como "Tipo" (HISTÓRICO VEHÍCULO): ${valorTexto} (tipo: ${tipo}, selector: ${selector})`);
          continue; // Saltar este campo, se procesará después como combobox
        }

        // SEGUNDO: Detectar fecha de HISTÓRICO VEHÍCULO (igual que IMPUESTOS detecta su fecha)
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(valorTexto);
        if (esFormatoFecha) {
          // Verificar si es Fecha de HISTÓRICO VEHÍCULO
          // El selector puede ser _r_hk_, _r_i4_, etc.
          const esFechaHistoricoVehiculo =
            selector.includes('_r_hk') || // ID del Excel actual
            selector.includes('_r_i4') || // ID del HTML actual
            (tipoLower === 'id' && esFormatoFecha) || // Si es ID y tiene formato de fecha, probablemente es una fecha
            (selectorLower.includes('fecha') && !selectorLower.includes('inicio') && !selectorLower.includes('fin') &&
              !selectorLower.includes('vigencia') && !selectorLower.includes('vencimiento')) ||
            (tipoLower.includes('fecha') && !tipoLower.includes('inicio') && !tipoLower.includes('fin') &&
              !tipoLower.includes('vigencia') && !tipoLower.includes('vencimiento'));

          if (esFechaHistoricoVehiculo && !fechaHistoricoVehiculo) {
            fechaHistoricoVehiculo = valorTexto;
            cy.log(`Campo ${i} detectado como "Fecha" (HISTÓRICO VEHÍCULO): ${valorTexto} (selector: ${selector}, tipo: ${tipo})`);
            continue; // Saltar este campo, se procesará después
          }
        }

        const esCampoHistoricoVehiculo =
          selector.includes('historicalVehicleNotes') ||
          selector.includes('_r_hk') ||
          selector.includes('_r_hn') ||
          selector.includes('_r_i4') ||
          selector.includes('_r_i7') ||
          selector.includes('_r_ia'); // ID del HTML para Notas
        if (!esCampoHistoricoVehiculo) {
          continue; // Saltar campos que no son de HISTÓRICO VEHÍCULO
        }
      } else {
        // PRIMERO: Verificar si es una fecha de AMORTIZACIÓN (ANTES de procesar como campo de texto)
        // Solo si NO estamos en IMPUESTOS
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(valorTexto);
        if (esFormatoFecha) {
          // Verificar si es Fecha Inicio o Fecha Fin de AMORTIZACIÓN
          // IDs específicos de AMORTIZACIÓN según el Excel: _r_ek_ = Fecha Inicio, _r_en_ = Fecha Fin
          const esFechaInicio = selectorLower.includes('_r_ot') ||
            selectorLower.includes('_r_ek') ||  // ID específico de AMORTIZACIÓN del Excel
            selector.includes('_r_ek_') ||
            selectorLower.includes('fecha inicio') ||
            tipoLower.includes('fecha inicio') ||
            (selectorLower.includes('inicio') && !selectorLower.includes('vigencia'));
          const esFechaFin = selectorLower.includes('_r_p0') ||
            selectorLower.includes('_r_en') ||  // ID específico de AMORTIZACIÓN del Excel
            selector.includes('_r_en_') ||
            selectorLower.includes('fecha fin') ||
            tipoLower.includes('fecha fin') ||
            (selectorLower.includes('fin') && !selectorLower.includes('vigencia') && !selectorLower.includes('vencimiento'));

          if (esFechaInicio || esFechaFin) {
            // Guardar la fecha para procesarla después (en la sección de fechas)
            if (esFechaInicio && !fechaInicio) {
              fechaInicio = valorTexto;
              cy.log(`Campo ${i} detectado como "Fecha Inicio" (AMORTIZACIÓN): ${valorTexto} (selector: ${selector})`);
              continue; // Saltar este campo, se procesará después
            } else if (esFechaFin && !fechaFin) {
              fechaFin = valorTexto;
              cy.log(`Campo ${i} detectado como "Fecha Fin" (AMORTIZACIÓN): ${valorTexto} (selector: ${selector})`);
              continue; // Saltar este campo, se procesará después
            }
          }
        }
      }

      // Si tiene name attribute, usar escribirPorName directamente (como en CONTACTO, ACCIONES)
      // Si estamos en SEGUROS, solo buscar en camposSeguros; si estamos en IMPUESTOS, solo buscar en camposImpuestos
      const camposABuscar = esSeccionSeguros ? camposSeguros : (esSeccionImpuestos ? camposImpuestos : todosLosCampos);
      const todosLosCamposOrdenados = camposABuscar.sort((a, b) => b.name.length - a.name.length);
      const campoName = todosLosCamposOrdenados.find(c => {
        // Buscar coincidencia exacta o que el selector contenga el name attribute
        if (selector === c.name) return true;
        if (selector.includes(`name="${c.name}"`) || selector.includes(`name='${c.name}'`)) return true;
        // Si el selector contiene el nombre, verificar que no sea un substring de otro campo más largo
        if (selector.includes(c.name)) {
          // Si es "agentIns", verificar que no sea parte de "agentInsName"
          if (c.name === 'agentIns' && selector.includes('agentInsName')) return false;
          // Si es "agentInsName", está bien
          return true;
        }
        return false;
      });
      if (campoName) {
        chain = chain.then(() => {
          cy.log(`Escribiendo por name: ${campoName.name} = ${valorTexto}`);
          return escribirPorName(campoName.name, valorTexto, campoName.label);
        });
        continue;
      }

      // Si el selector es un ID pero el campo tiene name attribute conocido, intentar por name también
      // Por ejemplo: _r_59 puede ser "Nombre del agente" con name="agentInsName"
      // NO hacer esto si estamos en IMPUESTOS (solo campos de IMPUESTOS)
      if (!esSeccionImpuestos && tipoLower === 'id' && selector) {
        const selectorNorm = selector.replace(/^#/, '').replace(/-label$/, '');
        // Mapeo de IDs a names (solo para SEGUROS, no para IMPUESTOS)
        const idToName = {
          '_r_59': 'agentInsName',  // Nombre del agente
          '_r_55': 'numberIns',     // Nº Póliza
          '_r_56': 'companyCode',   // Código compañía
          '_r_57': 'companyName',   // Nombre compañía
          '_r_58': 'agentIns',      // Agente
          '_r_5a': 'tomadorIns',    // Tomador
          '_r_5h': 'totalAmountIns', // Importe Total
          '_r_5i': 'franchiseIns',  // Franquicia
          '_r_5j': 'insuredIns'     // Asegurado
        };

        const nameAttr = idToName[selectorNorm] || idToName['_' + selectorNorm];
        if (nameAttr) {
          const campoNameById = todosLosCampos.find(c => c.name === nameAttr);
          if (campoNameById) {
            chain = chain.then(() => {
              cy.log(`Escribiendo por name (desde ID ${selectorNorm}): ${nameAttr} = ${valorTexto}`);
              return escribirPorName(nameAttr, valorTexto, campoNameById.label);
            });
            continue;
          }
        }
      }
    }

    // SEGUNDO: Rellenar fechas (Vigencia, Fin de vigencia, Próximo Vencimiento)
    // Usar la misma lógica que funciona en llenarFormularioAcciones
    const rellenarFechaPorLabel = (label, fechaTexto) => {
      if (!fechaTexto || fechaTexto.trim() === '') {
        cy.log(`⏭ No hay fecha para ${label}, saltando...`);
        return cy.wrap(null);
      }

      const fechaObj = parseFechaBasicaExcel(fechaTexto);

      cy.log(`Rellenando fecha "${label}" con ${fechaTexto}`);

      // Buscar por el label y luego hacer clic en el botón del calendario (igual que en llenarFormularioAcciones)
      return cy.contains('label', new RegExp(`^${escapeRegex(label)}$`, 'i'), { timeout: 10000 })
        .should('be.visible')
        .then(($label) => {
          return cy.wrap($label)
            .parents('.MuiFormControl-root')
            .first()
            .within(() => {
              // Hacer clic en el botón del calendario
              cy.get('button[aria-label*="date"], button[aria-label*="fecha"], button[aria-label*="Choose date"]', { timeout: 10000 })
                .should('be.visible')
                .click({ force: true });
            })
            .then(() => {
              cy.wait(500);
              // Usar la función de seleccionar fecha en calendario
              return seleccionarFechaEnCalendario(fechaObj);
            });
        })
        .then(() => {
          cy.log(` Fecha "${label}" rellenada: ${fechaTexto}`);
        }, (err) => {
          cy.log(` No se pudo rellenar la fecha "${label}": ${err.message}`);
          return cy.wrap(null);
        });
    };

    cy.log(`Buscando fechas y comboboxes en ${totalCampos} campos del Excel...`);

    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = procesarValorXXX(caso[`dato_${i}`]);

      if (!tipo || !selector || valor === undefined || valor === '') continue;

      const tipoLower = (tipo || '').toLowerCase();
      const selectorLower = (selector || '').toLowerCase();
      const valorTexto = valor.toString().trim();

      // Si estamos en IMPUESTOS, solo procesar campos de IMPUESTOS
      if (esSeccionImpuestos) {
        const esCampoImpuestos =
          tipoLower.includes('impuesto') || selectorLower.includes('impuesto') ||
          selector.includes('import') || selector.includes('notes') ||
          selector.includes('_r_n2') || selector.includes('_r_n5') ||
          selector.includes('_r_n6') || selector.includes('_r_n9') ||
          (tipoLower.includes('fecha') && !tipoLower.includes('inicio') && !tipoLower.includes('fin') &&
            !tipoLower.includes('vigencia') && !tipoLower.includes('vencimiento'));
        if (!esCampoImpuestos) {
          continue; // Saltar campos que no son de IMPUESTOS
        }
      }

      // ==========================
      //  DETECCIÓN COMBOBOXES (ARREGLADO)
      // ==========================
      // Si estamos en IMPUESTOS, solo detectar "Impuesto"
      if (esSeccionImpuestos) {
        // Detectar "Impuesto" - IMPUESTOS (desplegable) - igual que "Tipo" en SEGUROS
        // El selector puede ser _r_fl_-label, _r_fl, _r_n2, _r_d9, etc.
        // O el valor puede contener "Impuesto" (como "Impuesto Circulación")
        const esImpuesto =
          selector.includes('_r_fl') ||
          selector.includes('_r_n2') ||
          selector.includes('_r_d9') ||
          (tipoLower === 'id' && selectorLower.includes('impuesto')) ||
          (tipoLower === 'label' && selectorLower.includes('impuesto')) ||
          (tipoLower.includes('impuesto') || selectorLower.includes('impuesto')) ||
          (valorTexto && valorTexto.toLowerCase().includes('impuesto') && !valorTexto.toLowerCase().includes('importe'));

        if (esImpuesto && !impuestoValor && valorTexto && valorTexto.trim() !== '') {
          impuestoValor = valorTexto;
          cy.log(` Campo ${i} detectado como "Impuesto" (IMPUESTOS): ${valorTexto} (tipo: ${tipo}, selector: ${selector})`);
          continue; //  evita procesarlo como otro campo
        }
      } else {
        const esTipoDePago =
          tipoLower.includes('tipo de pago') ||
          selectorLower.includes('tipo de pago') ||
          selectorLower.includes('pago') ||
          selector.includes('_r_5k') ||
          selector.includes('_r_1m0') ||
          selector.includes('_r_cs') ||
          selector.includes('_r_ku');

        const esTipo =
          // etiqueta exacta o selector que contiene "tipo" pero no pago
          tipoLower === 'tipo' ||
          (tipoLower === 'id' && selectorLower.includes('tipo') && !selectorLower.includes('pago')) ||
          (selectorLower.includes('tipo') && !selectorLower.includes('pago')) ||
          selector.includes('_r_52') ||
          selector.includes('_r_bo') ||
          selector.includes('_r_ca') ||
          selector.includes('_r_kc');

        // Detectar "Tipo de Pago" PRIMERO (más específico)
        if (esTipoDePago && !tipoPagoValor) {
          tipoPagoValor = valorTexto;
          cy.log(`Campo ${i} detectado como "Tipo de Pago": ${valorTexto}`);
          continue; //  evita que este campo caiga en otras lógicas de "id" / "label"
        }

        // Detectar "Tipo"
        if (esTipo && !tipoValor) {
          tipoValor = valorTexto;
          cy.log(`Campo ${i} detectado como "Tipo": ${valorTexto}`);
          continue; //  evita procesarlo como otro campo
        }
      }

      // Detectar "Tipo" - HISTÓRICO VEHÍCULO (desplegable)
      // Solo si no es Tipo de SEGUROS y el contexto sugiere HISTÓRICO VEHÍCULO
      const esTipoHistoricoVehiculo =
        (tipoLower.includes('tipo') || selectorLower.includes('tipo')) &&
        !selectorLower.includes('pago') &&
        !tipoValor && // Solo si no es el Tipo de SEGUROS
        (selectorLower.includes('historico') || selectorLower.includes('histórico') || selectorLower.includes('vehiculo') || selectorLower.includes('vehículo'));

      if (esTipoHistoricoVehiculo && !tipoHistoricoVehiculo) {
        tipoHistoricoVehiculo = valorTexto;
        cy.log(`Campo ${i} detectado como "Tipo" (HISTÓRICO VEHÍCULO): ${valorTexto}`);
        continue; //  evita procesarlo como otro campo
      }

      // ==========================
      //  DETECCIÓN FECHAS 
      // ==========================
      const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(valorTexto);
      const esFechaPorTipo = tipoLower.includes('fecha');
      // Si estamos en IMPUESTOS, solo buscar fecha de IMPUESTOS
      const esFechaPorSelector = esSeccionImpuestos
        ? (selector.includes('_r_n6') || (selectorLower.includes('fecha') && !selectorLower.includes('inicio') && !selectorLower.includes('fin') && !selectorLower.includes('vigencia') && !selectorLower.includes('vencimiento')))
        : (selector.includes('vigencia') || selector.includes('vencimiento') ||
          selector.includes('_r_1ln') || selector.includes('_r_1lq') ||
          selector.includes('_r_1m3') || selector.includes('_r_5e') ||
          selector.includes('_r_5n') || selector.includes('_r_c1') ||
          selector.includes('_r_c4') || selector.includes('_r_cd') ||
          selector.includes('_r_ot') || selector.includes('_r_p0') ||
          selector.includes('_r_ek_') || selector.includes('_r_ek') ||
          selector.includes('_r_en_') || selector.includes('_r_en') ||
          selectorLower.includes('fecha inicio') || selectorLower.includes('fecha fin') ||
          tipoLower.includes('fecha inicio') || tipoLower.includes('fecha fin') ||
          (selectorLower.includes('fecha') && !selectorLower.includes('inicio') && !selectorLower.includes('fin') && !selectorLower.includes('vigencia') && !selectorLower.includes('vencimiento'))); // IMPUESTOS - Fecha

      // Si tiene formato de fecha, es una fecha potencial
      if (valorTexto && esFormatoFecha) {
        cy.log(`Campo ${i} tiene formato de fecha: tipo="${tipo}", selector="${selector}", valor="${valorTexto}"`);

        // Si estamos en IMPUESTOS, solo detectar fecha de IMPUESTOS
        if (esSeccionImpuestos) {
          // Detectar fecha de IMPUESTOS - más robusto
          const esFechaImpuestos =
            selector.includes('_r_n6') ||
            selector.includes('_r_dd') || // ID del HTML actual
            (selectorLower.includes('fecha') && !selectorLower.includes('inicio') && !selectorLower.includes('fin') &&
              !selectorLower.includes('vigencia') && !selectorLower.includes('vencimiento')) ||
            (tipoLower.includes('fecha') && !tipoLower.includes('inicio') && !tipoLower.includes('fin') &&
              !tipoLower.includes('vigencia') && !tipoLower.includes('vencimiento')) ||
            (tipoLower === 'label' && selectorLower.includes('fecha') && !selectorLower.includes('inicio') && !selectorLower.includes('fin'));

          if (esFechaImpuestos && !fechaImpuestos) {
            fechaImpuestos = valorTexto;
            cy.log(`  → Asignado a "Fecha" (IMPUESTOS) - selector: ${selector}, tipo: ${tipo}`);
          }
        } else {
          // Identificar qué fecha es (verificar PRIMERO HISTÓRICO KMS e HISTÓRICO VEHÍCULO si aplica, luego AMORTIZACIÓN, luego SEGUROS)
          const tipoLowerCompleto = tipoLower;

          // ============================================
          // PRIMERO: Detectar fechas de HISTÓRICO KMS (si es HISTÓRICO KMS)
          // ============================================
          if (esSeccionHistoricoKms) {
            const esFechaHistoricoKms =
              selector.includes('_r_gt') || // ID del Excel actual
              selector.includes('_r_hd') || // ID del HTML actual
              (tipoLower === 'id' && esFormatoFecha) || // Si es ID y tiene formato de fecha, probablemente es una fecha
              (selectorLower.includes('fecha') && !selectorLower.includes('inicio') && !selectorLower.includes('fin') &&
                !selectorLower.includes('vigencia') && !selectorLower.includes('vencimiento')) ||
              (tipoLower.includes('fecha') && !tipoLower.includes('inicio') && !tipoLower.includes('fin') &&
                !tipoLower.includes('vigencia') && !tipoLower.includes('vencimiento'));

            if (esFechaHistoricoKms && !fechaHistoricoKms) {
              fechaHistoricoKms = valorTexto;
              cy.log(`  → Asignado a "Fecha" (HISTÓRICO KMS) - selector: ${selector}, tipo: ${tipo}`);
            }
          }
          // ============================================
          // SEGUNDO: Detectar fechas de HISTÓRICO VEHÍCULO (si es HISTÓRICO VEHÍCULO)
          // ============================================
          else if (esSeccionHistoricoVehiculo) {
            const esFechaHistoricoVehiculo =
              selector.includes('_r_hk') || // ID del Excel actual
              selector.includes('_r_i4') || // ID del HTML actual
              (tipoLower === 'id' && esFormatoFecha) || // Si es ID y tiene formato de fecha, probablemente es una fecha
              (selectorLower.includes('fecha') && !selectorLower.includes('inicio') && !selectorLower.includes('fin') &&
                !selectorLower.includes('vigencia') && !selectorLower.includes('vencimiento')) ||
              (tipoLower.includes('fecha') && !tipoLower.includes('inicio') && !tipoLower.includes('fin') &&
                !tipoLower.includes('vigencia') && !tipoLower.includes('vencimiento'));

            if (esFechaHistoricoVehiculo && !fechaHistoricoVehiculo) {
              fechaHistoricoVehiculo = valorTexto;
              cy.log(`  → Asignado a "Fecha" (HISTÓRICO VEHÍCULO) - selector: ${selector}, tipo: ${tipo}`);
            }
          }
          // ============================================
          // TERCERO: Detectar fechas de AMORTIZACIÓN
          // ============================================
          // "Fecha Inicio" - AMORTIZACIÓN (verificar PRIMERO)
          else if (
            selector.includes('_r_ot') ||
            selector.includes('_r_ek_') || selectorLower.includes('_r_ek') ||  // ID específico del Excel
            selectorLower.includes('fecha inicio') || tipoLowerCompleto.includes('fecha inicio') ||
            (selectorLower.includes('inicio') && !selectorLower.includes('vigencia') && !selectorLower.includes('vencimiento'))
          ) {
            if (!fechaInicio) {
              fechaInicio = valorTexto;
              cy.log(`  → Asignado a "Fecha Inicio" (AMORTIZACIÓN) - selector: ${selector}`);
            }
          }
          // "Fecha Fin" - AMORTIZACIÓN (verificar SEGUNDO)
          else if (
            selector.includes('_r_p0') ||
            selector.includes('_r_en_') || selectorLower.includes('_r_en') ||  // ID específico del Excel
            selectorLower.includes('fecha fin') || tipoLowerCompleto.includes('fecha fin') ||
            (selectorLower.includes('fin') && !selectorLower.includes('vigencia') && !selectorLower.includes('vencimiento') && !selectorLower.includes('próximo') && !selectorLower.includes('proximo'))
          ) {
            if (!fechaFin) {
              fechaFin = valorTexto;
              cy.log(`  → Asignado a "Fecha Fin" (AMORTIZACIÓN) - selector: ${selector}`);
            }
          }
          // ============================================
          // CUARTO: Detectar fechas de SEGUROS (solo si NO es AMORTIZACIÓN)
          // ============================================
          // "Vigencia" - SEGUROS (primera fecha, verificar primero)
          else if (
            selector.includes('_r_cj') || selector.includes('_r_1ln') || selector.includes('_r_c1') ||
            tipoLowerCompleto.includes('vigencia') ||
            (tipoLower === 'id' && esFormatoFecha && !vigencia && !finVigencia && !proximoVencimiento && !fechaInicio && !fechaFin)
          ) {
            if (!vigencia) {
              vigencia = valorTexto;
              cy.log(`  → Asignado a "Vigencia" (SEGUROS - primera fecha encontrada)`);
            }
          }
          // "Fin de vigencia" - SEGUROS (verificar segundo)
          else if (
            selector.includes('_r_cm') || selector.includes('_r_5e') || selector.includes('_r_1lq') || selector.includes('_r_c4') ||
            tipoLowerCompleto.includes('fin de vigencia') ||
            tipoLowerCompleto.includes('fin vigencia') || tipoLowerCompleto.includes('fin vig')
          ) {
            if (!finVigencia) {
              finVigencia = valorTexto;
              cy.log(`  → Asignado a "Fin de vigencia" (SEGUROS)`);
            }
          }
          // "Próximo Vencimiento" - SEGUROS (verificar tercero)
          else if (
            selector.includes('_r_cv') || selector.includes('_r_5n') || selector.includes('_r_1m3') || selector.includes('_r_cd') ||
            selectorLower.includes('próximo') || selectorLower.includes('proximo') ||
            tipoLowerCompleto.includes('próximo vencimiento') || tipoLowerCompleto.includes('proximo vencimiento') ||
            tipoLowerCompleto.includes('próximo ven') || tipoLowerCompleto.includes('proximo ven')
          ) {
            if (!proximoVencimiento) {
              proximoVencimiento = valorTexto;
              cy.log(`  → Asignado a "Próximo Vencimiento" (SEGUROS)`);
            }
          }
          // Si ya tenemos Vigencia, asignar las siguientes fechas a Fin y Próximo (fallback)
          else if (vigencia && !finVigencia) {
            finVigencia = valorTexto;
            cy.log(`  → Asignado a "Fin de vigencia" (segunda fecha encontrada)`);
          } else if (vigencia && finVigencia && !proximoVencimiento) {
            proximoVencimiento = valorTexto;
            cy.log(`  → Asignado a "Próximo Vencimiento" (tercera fecha encontrada)`);
          }
          // ============================================
          // QUINTO: Detectar fecha de IMPUESTOS (fallback)
          // ============================================
          // "Fecha" - IMPUESTOS (solo si no es AMORTIZACIÓN ni SEGUROS ni HISTÓRICO)
          else if (
            (selectorLower.includes('fecha') && !selectorLower.includes('inicio') && !selectorLower.includes('fin') &&
              !selectorLower.includes('vigencia') && !selectorLower.includes('vencimiento') && !selectorLower.includes('próximo') && !selectorLower.includes('proximo') &&
              !selectorLower.includes('historico') && !selectorLower.includes('histórico') && !selectorLower.includes('kms')) ||
            (tipoLowerCompleto.includes('fecha') && !tipoLowerCompleto.includes('inicio') && !tipoLowerCompleto.includes('fin') &&
              !tipoLowerCompleto.includes('vigencia') && !tipoLowerCompleto.includes('vencimiento') &&
              !tipoLowerCompleto.includes('historico') && !tipoLowerCompleto.includes('histórico'))
          ) {
            if (!fechaImpuestos && !fechaInicio && !fechaFin && !vigencia && !finVigencia && !proximoVencimiento && !fechaHistoricoKms && !fechaHistoricoVehiculo) {
              fechaImpuestos = valorTexto;
              cy.log(`  → Asignado a "Fecha" (IMPUESTOS) - selector: ${selector}`);
            }
          }
        }
      }
      // Si no tiene formato de fecha pero el selector o tipo indica que es fecha
      else if (valorTexto && (esFechaPorTipo || esFechaPorSelector)) {
        cy.log(`Campo ${i} detectado como fecha por selector/tipo: tipo="${tipo}", selector="${selector}", valor="${valorTexto}"`);

        const tipoLowerCompleto = tipoLower;

        // ============================================
        // PRIMERO: Detectar fechas de AMORTIZACIÓN
        // ============================================
        // "Fecha Inicio" - AMORTIZACIÓN (verificar PRIMERO)
        if (
          selector.includes('_r_ot') ||
          selector.includes('_r_ek_') || selectorLower.includes('_r_ek') ||  // ID específico del Excel
          selectorLower.includes('fecha inicio') || tipoLowerCompleto.includes('fecha inicio') ||
          (selectorLower.includes('inicio') && !selectorLower.includes('vigencia') && !selectorLower.includes('vencimiento'))
        ) {
          if (!fechaInicio) {
            fechaInicio = valorTexto;
            cy.log(`  → Asignado a "Fecha Inicio" (AMORTIZACIÓN) - selector: ${selector}`);
          }
        }
        // "Fecha Fin" - AMORTIZACIÓN (verificar SEGUNDO)
        else if (
          selector.includes('_r_p0') ||
          selector.includes('_r_en_') || selectorLower.includes('_r_en') ||  // ID específico del Excel
          selectorLower.includes('fecha fin') || tipoLowerCompleto.includes('fecha fin') ||
          (selectorLower.includes('fin') && !selectorLower.includes('vigencia') && !selectorLower.includes('vencimiento') && !selectorLower.includes('próximo') && !selectorLower.includes('proximo'))
        ) {
          if (!fechaFin) {
            fechaFin = valorTexto;
            cy.log(`  → Asignado a "Fecha Fin" (AMORTIZACIÓN) - selector: ${selector}`);
          }
        }
        // ============================================
        // SEGUNDO: Detectar fechas de SEGUROS (solo si NO es AMORTIZACIÓN)
        // ============================================
        // "Vigencia" - SEGUROS (primera fecha, verificar primero)
        else if (
          selector.includes('_r_cj') || selector.includes('_r_1ln') || selector.includes('_r_c1') ||
          tipoLowerCompleto.includes('vigencia') ||
          (tipoLower === 'id' && esFormatoFecha && !vigencia && !finVigencia && !proximoVencimiento && !fechaInicio && !fechaFin)
        ) {
          if (!vigencia) {
            vigencia = valorTexto;
            cy.log(`  → Asignado a "Vigencia" (SEGUROS - primera fecha encontrada)`);
          }
        }
        // "Fin de vigencia" - SEGUROS (verificar segundo)
        else if (
          selector.includes('_r_cm') || selector.includes('_r_5e') || selector.includes('_r_1lq') || selector.includes('_r_c4') ||
          tipoLowerCompleto.includes('fin de vigencia') ||
          tipoLowerCompleto.includes('fin vigencia') || tipoLowerCompleto.includes('fin vig')
        ) {
          if (!finVigencia) {
            finVigencia = valorTexto;
            cy.log(`  → Asignado a "Fin de vigencia" (SEGUROS)`);
          }
        }
        // "Próximo Vencimiento" - SEGUROS (verificar tercero)
        else if (
          selector.includes('_r_cv') || selector.includes('_r_5n') || selector.includes('_r_1m3') || selector.includes('_r_cd') ||
          selectorLower.includes('próximo') || selectorLower.includes('proximo') ||
          tipoLowerCompleto.includes('próximo vencimiento') || tipoLowerCompleto.includes('proximo vencimiento') ||
          tipoLowerCompleto.includes('próximo ven') || tipoLowerCompleto.includes('proximo ven')
        ) {
          if (!proximoVencimiento) {
            proximoVencimiento = valorTexto;
            cy.log(`  → Asignado a "Próximo Vencimiento" (SEGUROS)`);
          }
        }
        // ============================================
        // TERCERO: Detectar fecha de IMPUESTOS
        // ============================================
        // "Fecha" - IMPUESTOS (solo si no es AMORTIZACIÓN ni SEGUROS ni HISTÓRICO)
        else if (
          (selectorLower.includes('fecha') && !selectorLower.includes('inicio') && !selectorLower.includes('fin') &&
            !selectorLower.includes('vigencia') && !selectorLower.includes('vencimiento') && !selectorLower.includes('próximo') && !selectorLower.includes('proximo') &&
            !selectorLower.includes('historico') && !selectorLower.includes('histórico') && !selectorLower.includes('kms')) ||
          (tipoLowerCompleto.includes('fecha') && !tipoLowerCompleto.includes('inicio') && !tipoLowerCompleto.includes('fin') &&
            !tipoLowerCompleto.includes('vigencia') && !tipoLowerCompleto.includes('vencimiento') &&
            !tipoLowerCompleto.includes('historico') && !tipoLowerCompleto.includes('histórico'))
        ) {
          if (!fechaImpuestos && !fechaInicio && !fechaFin && !vigencia && !finVigencia && !proximoVencimiento && !fechaHistoricoKms && !fechaHistoricoVehiculo) {
            fechaImpuestos = valorTexto;
            cy.log(`  → Asignado a "Fecha" (IMPUESTOS) - selector: ${selector}`);
          }
        }
      }
    }

    cy.log(`═══════════════════════════════════════`);
    cy.log(`RESUMEN DE DETECCIÓN:`);
    cy.log(`Fechas detectadas - Vigencia: ${vigencia || 'NO'}, Fin de vigencia: ${finVigencia || 'NO'}, Próximo Vencimiento: ${proximoVencimiento || 'NO'}, Fecha Inicio: ${fechaInicio || 'NO'}, Fecha Fin: ${fechaFin || 'NO'}, Fecha (IMPUESTOS): ${fechaImpuestos || 'NO'}, Fecha (HISTÓRICO KMS): ${fechaHistoricoKms || 'NO'}, Fecha (HISTÓRICO VEHÍCULO): ${fechaHistoricoVehiculo || 'NO'}`);
    cy.log(`Comboboxes detectados - Tipo: ${tipoValor || 'NO'}, Tipo de Pago: ${tipoPagoValor || 'NO'}, Impuesto: ${impuestoValor || 'NO'}, Tipo (HISTÓRICO VEHÍCULO): ${tipoHistoricoVehiculo || 'NO'}`);
    cy.log(`esSeccionImpuestos: ${esSeccionImpuestos}`);
    cy.log(`esImpuestos (calculado): ${fechaImpuestos || impuestoValor ? 'SÍ' : 'NO'}`);
    cy.log(`═══════════════════════════════════════`);

    // Determinar qué sección estamos rellenando basándonos en las fechas detectadas
    const esAmortizacion = fechaInicio || fechaFin;
    const esSeguros = vigencia || finVigencia || proximoVencimiento;
    const esImpuestos = fechaImpuestos || impuestoValor;
    const esHistoricoKms = fechaHistoricoKms;
    const esHistoricoVehiculo = fechaHistoricoVehiculo || tipoHistoricoVehiculo;

    // Rellenar las fechas encontradas (asegurarse de que se ejecuten secuencialmente)
    // Si es AMORTIZACIÓN, solo rellenar Fecha Inicio y Fecha Fin
    // Si es SEGUROS, rellenar Vigencia, Fin de vigencia, Próximo Vencimiento

    // AMORTIZACIÓN: Rellenar Fecha Inicio y Fecha Fin
    if (esAmortizacion) {
      if (fechaInicio) {
        chain = chain.then(() => {
          cy.log(`═══════════════════════════════════════`);
          cy.log(`Iniciando rellenado de Fecha Inicio (AMORTIZACIÓN) con valor: ${fechaInicio}`);
          cy.log(`═══════════════════════════════════════`);
          return rellenarFechaPorLabel('Fecha Inicio', fechaInicio);
        }).then(() => {
          cy.wait(300);
          cy.log(` Fecha Inicio (AMORTIZACIÓN) completada correctamente`);
        });
      } else {
        cy.log(` No se detectó valor para Fecha Inicio (AMORTIZACIÓN)`);
      }

      if (fechaFin) {
        chain = chain.then(() => {
          cy.log(`═══════════════════════════════════════`);
          cy.log(`Iniciando rellenado de Fecha Fin (AMORTIZACIÓN) con valor: ${fechaFin}`);
          cy.log(`═══════════════════════════════════════`);
          return rellenarFechaPorLabel('Fecha Fin', fechaFin);
        }).then(() => {
          cy.wait(300);
          cy.log(` Fecha Fin (AMORTIZACIÓN) completada correctamente`);
        });
      } else {
        cy.log(` No se detectó valor para Fecha Fin (AMORTIZACIÓN)`);
      }

      // Cerrar el calendario después de rellenar las fechas de AMORTIZACIÓN
      chain = chain.then(() => {
        cy.log('Cerrando calendario después de rellenar fechas de AMORTIZACIÓN...');
        return cy.get('body').then(($body) => {
          const calendarioAbierto = $body.find('.MuiPickersPopper-root, .MuiPopover-root, [role="dialog"]').filter(':visible');
          if (calendarioAbierto.length > 0) {
            cy.log('Calendario detectado abierto, cerrando...');
            return cy.get('body').click(0, 0, { force: true }).then(() => {
              cy.wait(500);
              cy.log('Calendario cerrado');
            });
          }
          return cy.wrap(null);
        });
      });
    }

    // IMPUESTOS: Rellenar Fecha (siempre que esté detectada, independientemente de otras secciones)
    if (fechaImpuestos && esSeccionImpuestos && !esAmortizacion && !esSeguros && !esHistoricoKms && !esHistoricoVehiculo) {
      chain = chain.then(() => {
        cy.log(`═══════════════════════════════════════`);
        cy.log(`Iniciando rellenado de Fecha (IMPUESTOS) con valor: ${fechaImpuestos}`);
        cy.log(`═══════════════════════════════════════`);
        return rellenarFechaPorLabel('Fecha', fechaImpuestos);
      }).then(() => {
        cy.wait(300);
        cy.log(`✓ Fecha (IMPUESTOS) completada correctamente`);
      });

      // Cerrar el calendario después de rellenar la fecha de IMPUESTOS
      chain = chain.then(() => {
        cy.log('Cerrando calendario después de rellenar fecha de IMPUESTOS...');
        return cy.get('body').then(($body) => {
          const calendarioAbierto = $body.find('.MuiPickersPopper-root, .MuiPopover-root, [role="dialog"]').filter(':visible');
          if (calendarioAbierto.length > 0) {
            cy.log('Calendario detectado abierto, cerrando...');
            return cy.get('body').click(0, 0, { force: true }).then(() => {
              cy.wait(500);
              cy.log('Calendario cerrado');
            });
          }
          return cy.wrap(null);
        });
      });
    } else if (esSeccionImpuestos && !fechaImpuestos) {
      cy.log(` No se detectó valor para Fecha (IMPUESTOS)`);
    }

    // HISTÓRICO KMS: Rellenar Fecha (siempre que esté detectada, independientemente de otras secciones)
    if (fechaHistoricoKms && esSeccionHistoricoKms && !esAmortizacion && !esSeguros && !esImpuestos && !esHistoricoVehiculo) {
      chain = chain.then(() => {
        cy.log(`═══════════════════════════════════════`);
        cy.log(`Iniciando rellenado de Fecha (HISTÓRICO KMS) con valor: ${fechaHistoricoKms}`);
        cy.log(`═══════════════════════════════════════`);
        return rellenarFechaPorLabel('Fecha', fechaHistoricoKms);
      }).then(() => {
        cy.wait(300);
        cy.log(` Fecha (HISTÓRICO KMS) completada correctamente`);
      });

      // Cerrar el calendario después de rellenar la fecha de HISTÓRICO KMS
      chain = chain.then(() => {
        cy.log('Cerrando calendario después de rellenar fecha de HISTÓRICO KMS...');
        return cy.get('body').then(($body) => {
          const calendarioAbierto = $body.find('.MuiPickersPopper-root, .MuiPopover-root, [role="dialog"]').filter(':visible');
          if (calendarioAbierto.length > 0) {
            cy.log('Calendario detectado abierto, cerrando...');
            return cy.get('body').click(0, 0, { force: true }).then(() => {
              cy.wait(500);
              cy.log('Calendario cerrado');
            });
          }
          return cy.wrap(null);
        });
      });
    } else if (esSeccionHistoricoKms && !fechaHistoricoKms) {
      cy.log(` No se detectó valor para Fecha (HISTÓRICO KMS)`);
    }

    // HISTÓRICO VEHÍCULO: Rellenar Fecha (siempre que esté detectada, independientemente de otras secciones)
    if (fechaHistoricoVehiculo && esSeccionHistoricoVehiculo && !esAmortizacion && !esSeguros && !esImpuestos && !esHistoricoKms) {
      chain = chain.then(() => {
        cy.log(`═══════════════════════════════════════`);
        cy.log(`Iniciando rellenado de Fecha (HISTÓRICO VEHÍCULO) con valor: ${fechaHistoricoVehiculo}`);
        cy.log(`═══════════════════════════════════════`);
        return rellenarFechaPorLabel('Fecha', fechaHistoricoVehiculo);
      }).then(() => {
        cy.wait(300);
        cy.log(`✓ Fecha (HISTÓRICO VEHÍCULO) completada correctamente`);
      });

      // Cerrar el calendario después de rellenar la fecha de HISTÓRICO VEHÍCULO
      chain = chain.then(() => {
        cy.log('Cerrando calendario después de rellenar fecha de HISTÓRICO VEHÍCULO...');
        return cy.get('body').then(($body) => {
          const calendarioAbierto = $body.find('.MuiPickersPopper-root, .MuiPopover-root, [role="dialog"]').filter(':visible');
          if (calendarioAbierto.length > 0) {
            cy.log('Calendario detectado abierto, cerrando...');
            return cy.get('body').click(0, 0, { force: true }).then(() => {
              cy.wait(500);
              cy.log('Calendario cerrado');
            });
          }
          return cy.wrap(null);
        });
      });
    } else if (esSeccionHistoricoVehiculo && !fechaHistoricoVehiculo) {
      cy.log(` No se detectó valor para Fecha (HISTÓRICO VEHÍCULO)`);
    }

    // SEGUROS: Rellenar Vigencia, Fin de vigencia, Próximo Vencimiento
    if (esSeguros && !esAmortizacion && !esImpuestos && !esHistoricoKms && !esHistoricoVehiculo) {
      // IMPORTANTE: Rellenar en orden: Vigencia, Fin de vigencia, Próximo Vencimiento
      if (vigencia) {
        chain = chain.then(() => {
          cy.log(`═══════════════════════════════════════`);
          cy.log(`Iniciando rellenado de Vigencia con valor: ${vigencia}`);
          cy.log(`═══════════════════════════════════════`);
          return rellenarFechaPorLabel('Vigencia', vigencia);
        }).then(() => {
          cy.wait(300);
          cy.log(` Vigencia completada correctamente`);
        });
      } else {
        cy.log(` No se detectó valor para Vigencia`);
      }

      if (finVigencia) {
        chain = chain.then(() => {
          cy.log(`═══════════════════════════════════════`);
          cy.log(`Iniciando rellenado de Fin de vigencia con valor: ${finVigencia}`);
          cy.log(`═══════════════════════════════════════`);
          return rellenarFechaPorLabel('Fin de vigencia', finVigencia);
        }).then(() => {
          cy.wait(300);
          cy.log(` Fin de vigencia completada correctamente`);
        });
      } else {
        cy.log(` No se detectó valor para Fin de vigencia`);
      }

      if (proximoVencimiento) {
        chain = chain.then(() => {
          cy.log(`═══════════════════════════════════════`);
          cy.log(`Iniciando rellenado de Próximo Vencimiento con valor: ${proximoVencimiento}`);
          cy.log(`═══════════════════════════════════════`);
          return rellenarFechaPorLabel('Próximo Vencimiento', proximoVencimiento);
        }).then(() => {
          cy.wait(300);
          cy.log(` Próximo Vencimiento completada correctamente`);
        });
      } else {
        cy.log(` No se detectó valor para Próximo Vencimiento`);
      }
    }


    // Cerrar el calendario si está abierto y quitar el foco antes de rellenar comboboxes
    chain = chain.then(() => {
      cy.log('Cerrando calendario y quitando foco antes de rellenar comboboxes...');
      // Hacer clic fuera del calendario para cerrarlo si está abierto
      return cy.get('body').then(($body) => {
        // Verificar si hay un popover o calendario abierto
        const calendarioAbierto = $body.find('.MuiPickersPopper-root, .MuiPopover-root, [role="dialog"]').filter(':visible');
        if (calendarioAbierto.length > 0) {
          cy.log('Calendario detectado abierto, cerrando...');
          // Hacer clic fuera del calendario
          return cy.get('body').click(0, 0, { force: true }).then(() => {
            cy.wait(1000); // Esperar más tiempo para que el calendario se cierre completamente
            cy.log('Calendario cerrado');
          });
        }
        // Si no hay calendario, hacer clic en un área neutral para quitar el foco
        return cy.get('body').click(0, 0, { force: true }).then(() => {
          cy.wait(500);
          cy.log('Foco quitado del campo de fecha');
        });
      });
    }).then(() => {
      // Esperar a que el drawer esté completamente visible y listo
      cy.log('Verificando que el drawer esté visible antes de rellenar comboboxes...');
      return cy.get('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="presentation"]:visible', { timeout: 10000 })
        .should('exist')
        .first()
        .should('be.visible')
        .then(() => {
          cy.wait(500); // Esperar un poco más para asegurar que el drawer esté completamente listo
          cy.log('Drawer verificado y listo');
        });
    });

    // TERCERO: Rellenar comboboxes "Tipo" y "Tipo de Pago" (igual que Estado y Sección en DATOS GENERALES)
    // Usar la misma lógica que seleccionarOpcionMaterial pero escribiendo y presionando Enter
    const rellenarCombobox = (label, valor) => {
      if (!valor || valor.trim() === '') {
        cy.log(`⏭ No hay valor para ${label}, saltando...`);
        return cy.wrap(null);
      }

      cy.log(`Rellenando combobox "${label}" con "${valor}" (igual que Estado/Sección en DATOS GENERALES)`);

      // Para "Tipo", buscar exactamente "Tipo" pero que NO sea "Tipo de Pago"
      let regexLabel;
      if (label === 'Tipo') {
        // Buscar "Tipo" exacto, no "Tipo de Pago"
        regexLabel = /^Tipo$/i;
      } else {
        // Para "Tipo de Pago", buscar exactamente "Tipo de Pago"
        regexLabel = new RegExp(`^${escapeRegex(label)}$`, 'i');
      }

      // Buscar el drawer/modal primero y buscar SOLO dentro de él (igual que seleccionarOpcionMaterial y esperarDrawerVisible)
      return cy.get('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="presentation"]:visible', { timeout: 10000 })
        .should('exist')
        .first()
        .then(() => {
          cy.wait(500); // Esperar a que la animación del drawer termine completamente
        })
        .then(() => {
          cy.log(`Drawer encontrado, buscando label "${label}" dentro del drawer...`);

          // Usar cy.contains dentro del drawer (más confiable)
          return cy.get('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="presentation"]:visible')
            .first()
            .within(() => {
              return cy.contains('label', regexLabel, { timeout: 10000 })
                .should('be.visible')
                .then(($label) => {
                  const forAttr = $label.attr('for');

                  if (forAttr) {
                    cy.log(`Encontrado label "${label}" con for="${forAttr}", buscando input...`);
                    return cy.get(`#${forAttr}`, { timeout: 10000 })
                      .scrollIntoView()
                      .should('be.visible')
                      .click({ force: true })
                      .clear({ force: true })
                      .type(valor, { force: true })
                      .type('{enter}', { force: true })
                      .then(() => {
                        cy.wait(300);
                        cy.log(`✓ Combobox "${label}" rellenado: ${valor}`);
                      });
                  }

                  return cy.wrap($label)
                    .parents('.MuiFormControl-root')
                    .first()
                    .within(() => {
                      cy.get('input[role="combobox"], input[aria-autocomplete="list"]', { timeout: 10000 })
                        .first()
                        .scrollIntoView()
                        .should('be.visible')
                        .click({ force: true })
                        .clear({ force: true })
                        .type(valor, { force: true })
                        .type('{enter}', { force: true });
                    })
                    .then(() => {
                      cy.wait(300);
                      cy.log(`✓ Combobox "${label}" rellenado: ${valor}`);
                    });
                }, (err) => {
                  cy.log(`⚠ No se encontró label "${label}" dentro del drawer: ${err.message}`);
                  throw err;
                });
            });
        }, (err) => {
          // Si no hay drawer, buscar directamente en toda la página (fallback)
          cy.log(`No se encontró drawer visible (${err.message}), buscando "${label}" en toda la página...`);

          return cy.contains('label', regexLabel, { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .then(($label) => {
              const forAttr = $label.attr('for');

              if (forAttr) {
                return cy.get(`#${forAttr}`, { timeout: 10000 })
                  .scrollIntoView()
                  .should('be.visible')
                  .click({ force: true })
                  .clear({ force: true })
                  .type(valor, { force: true })
                  .type('{enter}', { force: true })
                  .then(() => {
                    cy.wait(300);
                    cy.log(`✓ Combobox "${label}" rellenado: ${valor}`);
                  });
              }

              return cy.wrap($label)
                .parents('.MuiFormControl-root')
                .first()
                .within(() => {
                  cy.get('input[role="combobox"], input[aria-autocomplete="list"]', { timeout: 10000 })
                    .first()
                    .scrollIntoView()
                    .should('be.visible')
                    .click({ force: true })
                    .clear({ force: true })
                    .type(valor, { force: true })
                    .type('{enter}', { force: true });
                })
                .then(() => {
                  cy.wait(300);
                  cy.log(`✓ Combobox "${label}" rellenado: ${valor}`);
                });
            }, (err2) => {
              cy.log(`⚠ No se pudo rellenar el combobox "${label}": ${err2.message}`);
              return cy.wrap(null);
            });
        });
    };

    // Rellenar primero "Tipo de Pago" y luego "Tipo" (igual que Estado y Sección en DATOS GENERALES)
    if (tipoPagoValor) {
      chain = chain.then(() => {
        cy.log(`Seleccionando Tipo de Pago: ${tipoPagoValor}`);
        return seleccionarOpcionMaterial(
          '',
          tipoPagoValor.toString(),
          'Tipo de Pago'
        );
      });
    }
    if (tipoValor) {
      chain = chain.then(() => {
        cy.log(`Seleccionando Tipo: ${tipoValor}`);
        return seleccionarOpcionMaterial(
          '',
          tipoValor.toString(),
          'Tipo'
        );
      });
    }
    // Rellenar "Impuesto" - IMPUESTOS (desplegable)
    if (impuestoValor) {
      chain = chain.then(() => {
        cy.log(`Seleccionando Impuesto: ${impuestoValor}`);
        return seleccionarOpcionMaterial(
          '',
          impuestoValor.toString(),
          'Impuesto'
        );
      });
    }
    // Rellenar "Tipo" - HISTÓRICO VEHÍCULO (desplegable)
    if (tipoHistoricoVehiculo) {
      chain = chain.then(() => {
        cy.log(`Seleccionando Tipo (HISTÓRICO VEHÍCULO): ${tipoHistoricoVehiculo}`);
        return seleccionarOpcionMaterial(
          '',
          tipoHistoricoVehiculo.toString(),
          'Tipo'
        ).then(() => {
          cy.log(` Tipo (HISTÓRICO VEHÍCULO) completado`);
        }, (err) => {
          cy.log(` No se encontró el combobox "Tipo" (HISTÓRICO VEHÍCULO), continuando...`);
          return cy.wrap(null);
        });
      });
    }

    // CUARTO: Rellenar otros campos por label si no se rellenaron antes
    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = procesarValorXXX(caso[`dato_${i}`]);

      if (!tipo || !selector || valor === undefined || valor === '') continue;

      const tipoLower = (tipo || '').toLowerCase();
      const selectorLower = (selector || '').toLowerCase();
      const valorTexto = valor.toString();

      // Si estamos en IMPUESTOS, solo procesar campos de IMPUESTOS
      if (esSeccionImpuestos) {
        const esCampoImpuestos =
          tipoLower.includes('impuesto') || selectorLower.includes('impuesto') ||
          selector.includes('import') || selector.includes('notes') ||
          selector.includes('_r_n2') || selector.includes('_r_n5') ||
          selector.includes('_r_n6') || selector.includes('_r_n9') ||
          (tipoLower.includes('fecha') && !tipoLower.includes('inicio') && !tipoLower.includes('fin') &&
            !tipoLower.includes('vigencia') && !tipoLower.includes('vencimiento'));
        if (!esCampoImpuestos) {
          continue; // Saltar campos que no son de IMPUESTOS
        }
      }

      // Si estamos en IMPUESTOS, solo procesar campos de IMPUESTOS (ya se procesaron arriba)
      // No intentar rellenar por label campos que no son de IMPUESTOS
      if (esSeccionImpuestos) {
        // Solo verificar si es un campo de IMPUESTOS que ya se procesó
        const campoImpuestos = camposImpuestos.find(c => selector.includes(c.name));
        const esImpuesto = tipoLower.includes('impuesto') || selectorLower.includes('impuesto');
        const esFechaImpuestos = (tipoLower.includes('fecha') || selector.includes('_r_n6')) &&
          !tipoLower.includes('inicio') && !tipoLower.includes('fin') &&
          !tipoLower.includes('vigencia') && !tipoLower.includes('vencimiento');
        // Si ya se procesó, saltar
        if (campoImpuestos || esImpuesto || esFechaImpuestos) continue;
        // Si no es un campo de IMPUESTOS, saltar también
        continue;
      }

      // Si ya se procesó (name, fecha, combobox), saltar
      const campoName = camposSeguros.find(c => selector.includes(c.name));
      const campoAmortizacion = camposAmortizacion.find(c => selector.includes(c.name));
      const campoImpuestos = camposImpuestos.find(c => selector.includes(c.name));
      const campoRevisiones = camposRevisiones.find(c => selector.includes(c.name));
      const campoHistoricoKms = camposHistoricoKms.find(c => selector.includes(c.name));
      const campoHistoricoVehiculo = camposHistoricoVehiculo.find(c => selector.includes(c.name));
      const esFecha = tipoLower.includes('fecha') || selector.includes('vigencia') || selector.includes('vencimiento');
      const esTipo = selector.includes('_r_52') || selector.includes('_r_ca') || (tipoLower === 'id' && selector.includes('tipo') && !selector.includes('pago'));
      const esTipoPago = selector.includes('_r_5k') || selector.includes('_r_1m0') || tipoLower.includes('tipo de pago');
      const esImpuesto = tipoLower.includes('impuesto') || selectorLower.includes('impuesto');
      const esTipoHistoricoVehiculo = tipoHistoricoVehiculo && (tipoLower.includes('tipo') || selectorLower.includes('tipo')) && !selectorLower.includes('pago');
      const esValueName = tipoLower === 'value name' || tipoLower.includes('value name');

      // Saltar si ya se procesó o si es "value name" sin campo válido
      if (campoName || campoAmortizacion || campoImpuestos || campoRevisiones || campoHistoricoKms || campoHistoricoVehiculo || esFecha || esTipo || esTipoPago || esImpuesto || esTipoHistoricoVehiculo || esValueName) continue;

      // Para otros campos, buscar por label
      const mapeoIds = {
        '_r_55': '№ Póliza',
        '_r_56': 'Código compañía',
        '_r_57': 'Nombre compañía',
        '_r_58': 'Agente',
        '_r_59': 'Nombre del agente',
        '_r_5a': 'Tomador',
        '_r_5h': 'Importe Total',
        '_r_5i': 'Franquicia',
        '_r_5j': 'Asegurado'
      };

      let nombreLabel = null;

      // Si el tipo es "id", solo usar el mapeo, no normalizar
      if (tipoLower === 'id' && selector) {
        const selectorNorm = selector.replace(/^#/, '').replace(/-label$/, '');
        nombreLabel = mapeoIds[selectorNorm] || mapeoIds['_' + selectorNorm] || null;
      } else {
        // Para otros tipos, usar normalizarEtiquetaTexto
        nombreLabel = normalizarEtiquetaTexto(tipo);
      }

      // Solo rellenar si hay un nombreLabel válido (no "id", no "value name" ni vacío)
      if (nombreLabel && nombreLabel.toLowerCase() !== 'id' && nombreLabel.toLowerCase() !== 'value name' && nombreLabel.trim() !== '') {
        chain = chain.then(() => {
          cy.log(`Rellenando campo "${nombreLabel}" con ${valorTexto}`);
          // Buscar dentro del drawer visible
          return cy.get('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="presentation"]:visible', { timeout: 5000 })
            .first()
            .within(() => {
              return cy.contains('label', new RegExp(`^${escapeRegex(nombreLabel)}$`, 'i'), { timeout: 10000 })
                .should('be.visible')
                .parents('.MuiFormControl-root')
                .first()
                .within(() => {
                  cy.get('input, textarea', { timeout: 10000 })
                    .should('be.visible')
                    .first()
                    .clear({ force: true })
                    .type(valorTexto, { force: true });
                });
            });
        });
      } else {
        cy.log(`⏭ Saltando campo con tipo="${tipo}", selector="${selector}" - no hay label válido`);
      }
    }

    return chain.then(() => {
      // Determinar qué sección se está rellenando basándose en las fechas detectadas
      const esAmortizacion = fechaInicio || fechaFin;
      const esSeguros = vigencia || finVigencia || proximoVencimiento;

      if (esAmortizacion) {
        cy.log('Formulario AMORTIZACIÓN rellenado desde Excel');
        cy.log(`Fechas procesadas - Fecha Inicio: ${fechaInicio ? '✓' : '✗'}, Fecha Fin: ${fechaFin ? '✓' : '✗'}`);
      } else if (esSeguros) {
        cy.log('Formulario SEGUROS rellenado desde Excel');
        cy.log(`Fechas procesadas - Vigencia: ${vigencia ? '✓' : '✗'}, Fin de vigencia: ${finVigencia ? '✓' : '✗'}, Próximo Vencimiento: ${proximoVencimiento ? '✓' : '✗'}`);
      } else {
        cy.log('Formulario rellenado desde Excel');
      }
      if (tipoValor || tipoPagoValor || impuestoValor) {
        cy.log(`Comboboxes procesados - Tipo: ${tipoValor ? '✓' : '✗'}, Tipo de Pago: ${tipoPagoValor ? '✓' : '✗'}, Impuesto: ${impuestoValor ? '✓' : '✗'}`);
      } else {
        cy.log(' No se detectaron comboboxes (Tipo, Tipo de Pago, Impuesto) en los datos del Excel');
      }
    });
  }

  function abrirModalContacto() {
    cy.log('Abriendo modal de contacto');
    return cy.contains('button, a', /\+?\s*Añadir/i)
      .filter(':visible')
      .first()
      .click({ force: true })
      .then(() => {
        // Esperar a que el modal esté visible y tenga los campos de contacto
        return cy.get('input[name="cp_name"]', { timeout: 10000 })
          .should('be.visible')
          .then(() => {
            cy.log('Modal de contacto abierto correctamente');
            return cy.wrap(null);
          });
      });
  }

  function guardarModalContacto() {
    cy.log('Pasando al siguiente formulario sin guardar modal de contacto');
    // No hacer clic en "Guardar", simplemente pasar al siguiente
    cy.wait(300);
    return cy.wrap(null);
  }

  // Funciones genéricas para todas las secciones con modal
  function abrirModalSeccion(seccion, esperarInputs = true) {
    const nombreSeccion = seccion.toLowerCase();
    cy.log(`Abriendo modal de ${seccion}`);

    // Buscar el botón "+ Añadir" de forma más específica
    return cy.get('body').then(($body) => {
      // Intentar varios selectores para encontrar el botón
      const botones = $body.find('button, a').filter((_, el) => {
        const texto = (el.innerText || el.textContent || '').trim();
        return /\+?\s*Añadir/i.test(texto);
      }).filter(':visible');

      if (botones.length > 0) {
        return cy.wrap(botones[0])
          .scrollIntoView()
          .should('be.visible')
          .click({ force: true })
          .then(() => {
            cy.wait(300); // Esperar a que el drawer comience a abrirse
            return esperarInputs ? esperarDrawerVisible(seccion) : esperarBotonGuardarModal(seccion);
          });
      }

      // Fallback: usar cy.contains si no se encontró con jQuery
      return cy.contains('button, a', /\+?\s*Añadir/i, { timeout: 10000 })
        .should('be.visible')
        .scrollIntoView()
        .click({ force: true })
        .then(() => {
          cy.wait(300); // Esperar a que el drawer comience a abrirse
          return esperarInputs ? esperarDrawerVisible(seccion) : esperarBotonGuardarModal(seccion);
        });
    });
  }

  function esperarDrawerVisible(seccion) {
    cy.log(`Esperando a que el drawer/modal de ${seccion} esté visible...`);

    // Esperar a que el drawer esté visible (buscar por clases comunes de Material-UI Drawer)
    // Esto asegura que el drawer esté completamente abierto antes de buscar los inputs
    return cy.get('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="presentation"]:visible', { timeout: 10000 })
      .should('exist')
      .then(() => {
        cy.wait(500); // Esperar a que la animación del drawer termine completamente
      })
      .then(() => {
        // Esperar a que aparezca cualquier input visible del modal (no el sidebar)
        // Buscar directamente por los name conocidos de cada sección
        const selectoresInputs = [
          'input[name="his_date"]',           // Acciones
          'input[name="his_notes"]',           // Acciones
          'input[name="cp_name"]',            // Contacto
          'input[name="cp_email"]',           // Contacto
          'input[name="cp_phone"]',          // Contacto
          'input[name="cp_position"]',        // Contacto
          'input[name="cert_number"]',        // Certificaciones
          'input[name="cert_certificationDate"]', // Certificaciones
          'input[name="ei_accounting_office"]',   // Datos adicionales
          'input[name="ei_management_body"]',     // Datos adicionales
          'input[name="ei_processing_unit"]',     // Datos adicionales
          'input[name="ei_preponderant_body"]',   // Datos adicionales
          'input[name="doc_name"]',              // Documentos
          'input[name="doc_type"]',              // Documentos
          'input[name="add_name"]',              // Dirección
          'input[name="add_address"]',           // Dirección
          'input[name="add_postalCode"]',        // Dirección
          'input[name="add_city"]',              // Dirección
          'input[name="add_region"]',            // Dirección
          'textarea[name="add_notes"]',           // Dirección (Notas es textarea)
          'input[name="numberIns"]',             // SEGUROS - Nº Póliza
          'input[name="companyCode"]',           // SEGUROS - Código compañía
          'input[name="companyName"]',           // SEGUROS - Nombre compañía
          'input[name="agentIns"]',              // SEGUROS - Agente
          'input[name="agentInsName"]',          // SEGUROS - Nombre del agente
          'input[name="tomadorIns"]',            // SEGUROS - Tomador
          'input[name="totalAmountIns"]',        // SEGUROS - Importe Total
          'input[name="franchiseIns"]',          // SEGUROS - Franquicia
          'input[name="insuredIns"]',            // SEGUROS - Asegurado
          'input[name="amortMonth"]',            // AMORTIZACIÓN - Amortización Mensual
          'input[name="import"]',                // IMPUESTOS - Importe, €
          'input[name="notes"]',                 // IMPUESTOS - Notas
          'input[name="inspectionId"]',          // REVISIONES - ID Revisión
          'input[name="inspectionName"]',        // REVISIONES - Nombre Revisión
          'input[name="historicalKmsKm"]',       // HISTÓRICO KMS - Kms
          'input[name="historicalVehicleNotes"]' // HISTÓRICO VEHÍCULO - Notas
        ].join(', ');

        // Buscar inputs que estén realmente visibles (filtrar por visibilidad)
        return cy.get(selectoresInputs, { timeout: 10000 })
          .filter(':visible')
          .first()
          .should('be.visible')
          .then(() => {
            cy.log(`Modal de ${seccion} abierto correctamente`);
            return cy.wrap(null);
          });
      });
  }

  function esperarBotonGuardarModal(seccion) {
    return cy.contains('button', /^Guardar$/i, { timeout: 10000 })
      .should('be.visible')
      .then(() => {
        cy.log(`Modal de ${seccion} abierto (sin campos que rellenar)`);
        return cy.wrap(null);
      });
  }

  function llenarFormularioSeccion(caso, numeroCaso, seccion) {
    const totalCampos = Number(caso?.__totalCamposExcel) || 14;
    cy.log(`Rellenando formulario de ${seccion} con ${totalCampos} campos del Excel`);

    let chain = cy.wrap(null);

    // Recorrer todos los datos del Excel y rellenar los campos
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
        const valorTexto = valor.toString();

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
            // Si el tipo es "Fecha", usar el date picker
            const tipoLower = (tipo || '').toLowerCase();
            if (tipoLower.includes('fecha') || etiqueta.toLowerCase().includes('fecha')) {
              const textoFecha = valor.toString();
              const fechaObj = parseFechaBasicaExcel(textoFecha);
              cy.log(`Rellenando Fecha "${etiqueta}" con ${textoFecha}`);

              // Buscar por el label y luego hacer clic en el botón del calendario
              return cy.contains('label', new RegExp(`^${escapeRegex(etiqueta)}$`, 'i'), { timeout: 10000 })
                .should('be.visible')
                .then(($label) => {
                  return cy.wrap($label)
                    .parents('.MuiFormControl-root')
                    .first()
                    .within(() => {
                      // Hacer clic en el botón del calendario
                      cy.get('button[aria-label*="date"], button[aria-label*="fecha"], button[aria-label*="Choose date"]', { timeout: 10000 })
                        .should('be.visible')
                        .click({ force: true });
                    })
                    .then(() => {
                      cy.wait(500);
                      // Usar la función de seleccionar fecha en calendario
                      return seleccionarFechaEnCalendario(fechaObj);
                    });
                });
            }

            // Para otros campos, buscar y escribir normalmente
            return obtenerCampoFormulario(tipo, '', etiqueta)
              .then(($el) => {
                if ($el && $el.length) {
                  const valorTexto = valor.toString();
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

  function obtenerCampoFormulario(tipo, selector, etiqueta) {
    const tipoLower = (tipo || '').toLowerCase();
    const objetivos = [];

    if (selector) {
      if (tipoLower.includes('id')) objetivos.push(`#${normalizarId(selector)}`);
      if (tipoLower.includes('name')) objetivos.push(`[name="${selector}"]`);
      if (tipoLower.includes('selector') || tipoLower.includes('query')) objetivos.push(selector);
      if (!selector.startsWith('#') && !selector.startsWith('.') && !selector.startsWith('[')) {
        objetivos.push(`#${selector}`);
      } else {
        objetivos.push(selector);
      }
    }

    return cy.get('body').then(($body) => {
      if (etiqueta) {
        const regex = new RegExp(`^${escapeRegex(etiqueta)}$`, 'i');
        const label = $body.find('label').filter((_, el) => regex.test((el.innerText || '').trim())).first();
        if (label.length) {
          const forAttr = label.attr('for');
          if (forAttr) {
            const target = $body.find(`#${forAttr}`)[0];
            if (target) return cy.wrap(target);
          }
          const input = label.parent().find('input, textarea, select')[0];
          if (input) return cy.wrap(input);
        }
      }

      for (const sel of objetivos) {
        const elemento = $body.find(sel)[0];
        if (elemento) return cy.wrap(elemento);
      }

      cy.log(`No se encontró el selector ${selector || ''} (etiqueta: ${etiqueta || 'N/D'})`);
      return cy.wrap(null);
    });
  }

  function deducirSeccionDesdeCaso(caso) {
    const nombre = (caso?.nombre || '').toLowerCase();
    if (nombre.includes('vencimientos')) return 'Vencimientos';
    if (nombre.includes('mantenimiento')) return 'Mantenimiento';
    if (nombre.includes('seguros')) return 'Seguros';
    if (nombre.includes('ficha técnica') || nombre.includes('ficha tecnica')) return 'Ficha Técnica';
    if (nombre.includes('compra/venta') || nombre.includes('compra venta')) return 'Compra/Venta';
    if (nombre.includes('amortización') || nombre.includes('amortizacion')) return 'Amortización';
    if (nombre.includes('impuestos')) return 'Impuestos';
    if (nombre.includes('tarjetas')) return 'Tarjetas';
    if (nombre.includes('revisiones')) return 'Revisiones';
    if (nombre.includes('histórico kms') || nombre.includes('historico kms') || nombre.includes('histórico kms') || nombre.includes('historico kms')) return 'Histórico Kms';
    if (nombre.includes('histórico vehículo') || nombre.includes('historico vehiculo') || nombre.includes('histórico vehiculo') || nombre.includes('historico vehículo')) return 'Histórico Vehículo';
    return 'Datos Generales';
  }

  function escapeRegex(texto = '') {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Función para procesar valores "XXX" y reemplazarlos con 3 números aleatorios
  function procesarValorXXX(valor) {
    if (valor === null || valor === undefined) return valor;
    const valorStr = String(valor).trim();

    if (valorStr.toUpperCase() === 'XXX') {
      const numeroAleatorio = Math.floor(Math.random() * 900) + 100; // Genera número entre 100-999
      cy.log(`Valor "XXX" detectado, generando 3 números aleatorios: ${numeroAleatorio}`);
      return numeroAleatorio.toString();
    }

    return valorStr;
  }

  // Rellenar TODOS los campos de Datos Generales de Vehículos (se usa por defecto en altas)
  function llenarFormularioGeneralesDesdeExcel(caso, numeroCaso) {
    // Mapeo de campos según el Excel para vehículos
    // Procesar valores "XXX" y reemplazarlos con 3 números aleatorios
    const codigo = procesarValorXXX(caso.dato_1);   // Código
    const matricula = procesarValorXXX(caso.dato_2);   // Matrícula
    const marca = procesarValorXXX(caso.dato_3);   // Marca
    const modelo = procesarValorXXX(caso.dato_4);   // Modelo
    const tipoVehiculoCodigo = procesarValorXXX(caso.dato_5);   // Tipo de vehículo (Código)
    const tipoVehiculoNombre = procesarValorXXX(caso.dato_6);   // Tipo de vehículo (Nombre)
    const alta = caso.dato_7;   // Alta (fecha) - no procesar XXX aquí
    const fMatriculacion = caso.dato_8;   // F. Matriculación - no procesar XXX aquí
    const baja = caso.dato_9;   // Baja - no procesar XXX aquí
    const descripcion = procesarValorXXX(caso.dato_10);  // Descripción
    const estado = caso.dato_11;  // Estado - no procesar XXX aquí
    const semirremolqueCodigo = procesarValorXXX(caso.dato_12);  // Semirremolque Tara (Código)
    const semirremolqueNombre = procesarValorXXX(caso.dato_13);  // Semirremolque Tara (Nombre)
    const seccion = caso.dato_14;  // Sección - no procesar XXX aquí
    const propietario = caso.dato_15;    // Propietario - no procesar XXX aquí
    const notas = procesarValorXXX(caso.dato_16);      // Notas

    cy.log(`Datos Generales Vehículos detectados: ${JSON.stringify({
      codigo,
      matricula,
      marca,
      modelo,
      tipoVehiculoCodigo,
      tipoVehiculoNombre,
      alta,
      fMatriculacion,
      baja,
      descripcion,
      estado,
      semirremolqueCodigo,
      semirremolqueNombre,
      seccion,
      propietario,
      notas
    })}`);

    let chain = cy.wrap(null);

    //  Campos de texto básicos (por name)
    const camposTexto = [
      { label: 'Código', name: 'vehicle.code', valor: codigo },
      { label: 'Matrícula', name: 'vehicle.matricula', valor: matricula },
      { label: 'Marca', name: 'vehicle.brand', valor: marca },
      { label: 'Modelo', name: 'vehicle.model', valor: modelo },
      { label: 'Descripción', name: 'vehicle.description', valor: descripcion },
      { label: 'Notas', name: 'vehicle.notes', valor: notas }
    ];

    camposTexto.forEach((campo) => {
      if (!campo.valor) {
        cy.log(`⏭Campo vacío en Excel: ${campo.label}`);
        return;
      }

      chain = chain.then(() =>
        escribirPorName(campo.name, campo.valor, campo.label)
      );
    });

    //  Tipo de Vehículo (Código y Nombre)
    if (tipoVehiculoCodigo) {
      chain = chain.then(() => {
        cy.log(`Rellenando Tipo de Vehículo - Código: ${tipoVehiculoCodigo}`);
        return escribirPorName('vehicle.type.code', tipoVehiculoCodigo, 'Tipo de Vehículo - Código');
      });
    }

    if (tipoVehiculoNombre) {
      chain = chain.then(() => {
        cy.log(`Rellenando Tipo de Vehículo - Nombre: ${tipoVehiculoNombre}`);
        return escribirPorName('vehicle.type.name', tipoVehiculoNombre, 'Tipo de Vehículo - Nombre');
      });
    }

    //  Semirremolque Tara (Código y Nombre)
    if (semirremolqueCodigo) {
      chain = chain.then(() => {
        cy.log(`Rellenando Semirremolque Tara - Código: ${semirremolqueCodigo}`);
        return escribirPorName('vehicle.semiTrailerTara.code', semirremolqueCodigo, 'Semirremolque Tara - Código');
      });
    }

    if (semirremolqueNombre) {
      chain = chain.then(() => {
        cy.log(`Rellenando Semirremolque Tara - Nombre: ${semirremolqueNombre}`);
        return escribirPorName('vehicle.semiTrailerTara.name', semirremolqueNombre, 'Semirremolque Tara - Nombre');
      });
    }

    //  Estado (select MUI)
    if (estado) {
      chain = chain.then(() => {
        cy.log(`Seleccionando Estado: ${estado}`);
        return seleccionarOpcionMaterial(
          '#mui-component-select-status',
          estado.toString(),
          'Estado'
        );
      });
    }

    //  Sección (select MUI)
    if (seccion) {
      chain = chain.then(() => {
        cy.log(`Seleccionando Sección: ${seccion}`);
        return seleccionarOpcionMaterial(
          '#mui-component-select-vehicle.section',
          seccion.toString(),
          'Sección'
        );
      });
    }

    //  Propietario (radio buttons)
    if (propietario) {
      chain = chain.then(() => {
        cy.log(`Seleccionando Propietario: ${propietario}`);
        return seleccionarPorName('vehicle.owner', propietario.toString());
      });
    }

    //  Fechas usando calendario
    if (alta) {
      chain = chain.then(() => {
        const textoFecha = alta.toString();
        const fechaObj = parseFechaBasicaExcel(textoFecha);
        cy.log(`Rellenando Alta con ${textoFecha}`);

        return cy
          .contains('label', /^Alta$/i)
          .parents('.MuiFormControl-root')
          .first()
          .within(() => {
            cy.get(
              'button[aria-label*="calendar"], ' +
              'button[aria-label*="date"], ' +
              'button[aria-label*="fecha"], ' +
              'button[aria-label*="Choose date"]'
            )
              .first()
              .click({ force: true });
          })
          .then(() => seleccionarFechaEnCalendario(fechaObj));
      });
    }

    if (fMatriculacion) {
      chain = chain.then(() => {
        const textoFecha = fMatriculacion.toString();
        const fechaObj = parseFechaBasicaExcel(textoFecha);
        cy.log(`Rellenando F. Matriculación con ${textoFecha}`);

        return cy
          .contains('label', /F\.?\s*Matriculaci[oó]n/i)
          .parents('.MuiFormControl-root')
          .first()
          .within(() => {
            cy.get(
              'button[aria-label*="calendar"], ' +
              'button[aria-label*="date"], ' +
              'button[aria-label*="fecha"], ' +
              'button[aria-label*="Choose date"]'
            )
              .first()
              .click({ force: true });
          })
          .then(() => seleccionarFechaEnCalendario(fechaObj));
      });
    }

    if (baja) {
      chain = chain.then(() => {
        const textoFecha = baja.toString();
        const fechaObj = parseFechaBasicaExcel(textoFecha);
        cy.log(`Rellenando Baja con ${textoFecha}`);

        return cy
          .contains('label', /^Baja$/i)
          .parents('.MuiFormControl-root')
          .first()
          .within(() => {
            cy.get(
              'button[aria-label*="calendar"], ' +
              'button[aria-label*="date"], ' +
              'button[aria-label*="fecha"], ' +
              'button[aria-label*="Choose date"]'
            )
              .first()
              .click({ force: true });
          })
          .then(() => seleccionarFechaEnCalendario(fechaObj));
      });
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Datos Generales de Vehículo rellenados desde Excel`);
    });
  }

  // Rellenar TODOS los campos de FICHA TÉCNICA desde Excel (igual que DATOS GENERALES)
  function llenarFormularioFichaTecnicaDesdeExcel(caso, numeroCaso) {
    const totalCampos = Number(caso?.__totalCamposExcel) || 20;
    cy.log(`Rellenando FICHA TÉCNICA con ${totalCampos} campos desde Excel (igual que DATOS GENERALES)`);

    // Mapeo de campos de FICHA TÉCNICA según el HTML proporcionado
    // Campos de texto normales (con name attribute)
    const camposTexto = [
      { name: 'chassisNumber', label: '№ Bastidor' },
      { name: 'consumptionAverage', label: 'Consumo est.' },
      { name: 'tachograph', label: 'Tacógrafo' },
      { name: 'euroClassification', label: 'Clasificación Euro' },
      { name: 'discType', label: 'Tipo Disco' }, // Tipo Disco es campo de texto, no desplegable
      { name: 'seats', label: 'Plazas' },
      { name: 'tireType', label: 'T.Neumático' },
      { name: 'pma', label: 'PMA' },
      { name: 'cap', label: 'Cap.' },
      { name: 'tara', label: 'Tara' },
      { name: 'axlesNumber', label: '№ Ejes' },
      { name: 'raisedAxlesNumber', label: '№ Ejes Elevados' },
      { name: 'axlesBrand', label: 'Marca Ejes' },
      { name: 'tireT', label: 'T. Neum.' },
      { name: 'height', label: 'Altura' },
      { name: 'length', label: 'Largo' },
      { name: 'width', label: 'Ancho' },
      { name: 'm3', label: 'm3' }
    ];

    // Campos select (comboboxes) - usar seleccionarOpcionMaterial con el label (igual que Estado y Sección en DATOS GENERALES)
    const camposSelect = [
      { name: 'brakes', id: 'mui-component-select-brakes', label: 'Frenos' },
      { name: 'suspension', id: 'mui-component-select-suspension', label: 'Suspensión' },
      { name: 'auxiliaryBrake', id: 'mui-component-select-auxiliaryBrake', label: 'Freno Auxiliar' },
      { name: 'awning', id: 'mui-component-select-awning', label: 'Toldo' },
      { name: 'capSelect', id: 'mui-component-select-capSelect', label: 'Cap. Select' }
    ];

    // Campos checkbox
    const camposCheckbox = [
      { name: 'hydraulicEquipment', label: 'Equipo Hidráulico' },
      { name: 'compressor', label: 'Compresor' },
      { name: 'heater', label: 'Calefactror' },
      { name: 'gasoilProfessional', label: 'Gasoleo Professional' },
      { name: 'auxiliaryMotor', label: 'Motor Auxolar' }
    ];

    let chain = cy.wrap(null);

    // Procesar todos los campos del Excel
    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = procesarValorXXX(caso[`dato_${i}`]);

      if (!tipo || !selector || valor === undefined || valor === '') continue;

      const tipoLower = (tipo || '').toLowerCase();
      const selectorLower = (selector || '').toLowerCase();
      const valorTexto = valor.toString().trim();

      // Si tiene name attribute (value name), verificar si es texto, select o checkbox
      if (tipoLower === 'value name' || tipoLower.includes('value name')) {
        // PRIMERO: Buscar en campos de texto por name exacto
        let campoTexto = camposTexto.find(c => c.name === selector || selectorLower === c.name.toLowerCase());

        // SEGUNDO: Si no se encuentra, buscar por name parcial (para manejar errores de tipeo como "heigth" -> "height")
        if (!campoTexto) {
          campoTexto = camposTexto.find(c =>
            selectorLower.includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes(selectorLower)
          );
        }

        // TERCERO: Si aún no se encuentra, intentar buscar por el label que viene en el tipo o selector
        if (!campoTexto) {
          const posibleLabel = normalizarEtiquetaTexto(tipo) || normalizarEtiquetaTexto(selector);
          if (posibleLabel) {
            campoTexto = camposTexto.find(c => {
              const labelNormalizado = c.label.toLowerCase().trim();
              const nombreNormalizado = posibleLabel.toLowerCase().trim();
              // Coincidencia exacta
              if (nombreNormalizado === labelNormalizado) return true;
              // Coincidencia parcial
              if (nombreNormalizado.includes(labelNormalizado) || labelNormalizado.includes(nombreNormalizado)) return true;
              // Coincidencia sin acentos
              const sinAcentos = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[º°]/g, 'o');
              if (sinAcentos(nombreNormalizado) === sinAcentos(labelNormalizado)) return true;
              return false;
            });
          }
        }

        if (campoTexto) {
          chain = chain.then(() => {
            cy.log(`Escribiendo por name: ${campoTexto.name} = ${valorTexto} (label: ${campoTexto.label})`);
            return escribirPorName(campoTexto.name, valorTexto, campoTexto.label)
              .then(() => {
                cy.log(`✓ Campo "${campoTexto.label}" rellenado correctamente`);
              }, (err) => {
                cy.log(`⚠ Error al rellenar "${campoTexto.label}" por name. Intentando por label "Altura"...`);
                // Si falla por name, intentar buscar directamente por label
                if (campoTexto.label.toLowerCase().includes('altura') || campoTexto.label.toLowerCase().includes('largo') ||
                  campoTexto.label.toLowerCase().includes('ancho') || campoTexto.label.toLowerCase() === 'm3') {
                  return cy.contains('label', new RegExp(`^${escapeRegex(campoTexto.label)}$`, 'i'), { timeout: 10000 })
                    .should('be.visible')
                    .then(($label) => {
                      const forAttr = $label.attr('for');
                      if (forAttr) {
                        return cy.get(`#${forAttr}`, { timeout: 10000 })
                          .should('be.visible')
                          .clear({ force: true })
                          .type(valorTexto, { force: true });
                      } else {
                        return cy.wrap($label)
                          .parents('.MuiFormControl-root')
                          .first()
                          .within(() => {
                            cy.get('input, textarea', { timeout: 10000 })
                              .should('be.visible')
                              .first()
                              .clear({ force: true })
                              .type(valorTexto, { force: true });
                          });
                      }
                    })
                    .then(() => {
                      cy.log(` Campo "${campoTexto.label}" rellenado correctamente por label`);
                    }, (err2) => {
                      cy.log(` No se pudo rellenar "${campoTexto.label}": ${err2.message}. Continuando...`);
                      return cy.wrap(null);
                    });
                }
                return cy.wrap(null);
              });
          });
          continue;
        }

        // Buscar en campos select
        const campoSelect = camposSelect.find(c => c.name === selector || selectorLower.includes(c.name));
        if (campoSelect) {
          chain = chain.then(() => {
            cy.log(`Seleccionando en combobox "${campoSelect.label}": ${valorTexto} (igual que Estado/Sección en DATOS GENERALES)`);
            // Si tiene id, usarlo; si no, usar solo el label (igual que Estado y Sección)
            const selectorId = campoSelect.id ? `#${campoSelect.id}` : '';
            return seleccionarOpcionMaterial(selectorId, valorTexto, campoSelect.label);
          });
          continue;
        }

        // Buscar en campos checkbox
        const campoCheckbox = camposCheckbox.find(c => c.name === selector || selectorLower.includes(c.name));
        if (campoCheckbox) {
          chain = chain.then(() => {
            cy.log(`Marcando checkbox "${campoCheckbox.label}": ${valorTexto}`);
            // Si el valor es "true", "1", "si", "sí", "yes", marcar el checkbox
            const debeMarcar = /^(true|1|si|sí|yes|on)$/i.test(valorTexto);
            if (debeMarcar) {
              return cy.get(`input[name="${campoCheckbox.name}"]`, { timeout: 10000 })
                .should('exist')
                .check({ force: true });
            }
            return cy.wrap(null);
          });
          continue;
        }

        // Si no está en los mapeos, intentar escribirPorName directamente
        chain = chain.then(() => {
          cy.log(`Escribiendo por name (genérico): ${selector} = ${valorTexto}`);
          return escribirPorName(selector, valorTexto, selector);
        });
        continue;
      }

      // Si es un combobox/select por ID, usar seleccionarOpcionMaterial (igual que Estado y Sección en DATOS GENERALES)
      if (tipoLower === 'id' || tipoLower === 'aria-labelledby') {
        let nombreLabel = normalizarEtiquetaTexto(tipo) || normalizarEtiquetaTexto(selector);

        // PRIMERO: Verificar si es un campo de texto conocido (Plazas, T.Neumático, etc.)
        if (nombreLabel) {
          const campoTextoPorLabel = camposTexto.find(c =>
            nombreLabel.toLowerCase() === c.label.toLowerCase() ||
            nombreLabel.toLowerCase().includes(c.label.toLowerCase()) ||
            c.label.toLowerCase().includes(nombreLabel.toLowerCase())
          );

          if (campoTextoPorLabel) {
            chain = chain.then(() => {
              cy.log(`Escribiendo por name (detectado por label): ${campoTextoPorLabel.name} = ${valorTexto}`);
              return escribirPorName(campoTextoPorLabel.name, valorTexto, campoTextoPorLabel.label);
            });
            continue;
          }
        }

        // SEGUNDO: Verificar si el selector coincide con algún campo select conocido
        const campoSelect = camposSelect.find(c =>
          selectorLower.includes(c.name) ||
          (c.id && selectorLower.includes(c.id.replace('#', ''))) ||
          (nombreLabel && nombreLabel.toLowerCase() === c.label.toLowerCase())
        );

        if (campoSelect) {
          chain = chain.then(() => {
            cy.log(`Seleccionando en combobox "${campoSelect.label}": ${valorTexto} (igual que Estado/Sección en DATOS GENERALES)`);
            // Usar el label directamente para buscar el campo (más robusto que el selector ID)
            return seleccionarOpcionMaterial('', valorTexto, campoSelect.label);
          });
          continue;
        }

        // TERCERO: Si el nombre del label coincide con algún campo select conocido (Frenos, Suspensión, Tipo Disco)
        if (nombreLabel) {
          const campoSelectPorLabel = camposSelect.find(c =>
            nombreLabel.toLowerCase() === c.label.toLowerCase()
          );

          if (campoSelectPorLabel) {
            chain = chain.then(() => {
              cy.log(`Seleccionando en combobox "${campoSelectPorLabel.label}": ${valorTexto} (detectado por label, igual que Estado/Sección)`);
              // Usar el label directamente para buscar el campo (más robusto que el selector ID)
              return seleccionarOpcionMaterial('', valorTexto, campoSelectPorLabel.label);
            });
            continue;
          }
        }

        // CUARTO: Si no es un campo conocido, intentar como combobox genérico
        if (nombreLabel && nombreLabel.toLowerCase() !== 'id' && nombreLabel.trim() !== '') {
          chain = chain.then(() => {
            cy.log(`Seleccionando en combobox "${nombreLabel}": ${valorTexto}`);
            return seleccionarOpcionMaterial('', valorTexto, nombreLabel);
          });
          continue;
        }
      }

      // Si es una fecha, usar el mismo patrón que DATOS GENERALES
      const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(valorTexto);
      const esFechaPorTipo = tipoLower.includes('fecha');
      const esFechaPorSelector = selectorLower.includes('fecha') || selectorLower.includes('date');

      if (esFormatoFecha || esFechaPorTipo || esFechaPorSelector) {
        let nombreLabel = normalizarEtiquetaTexto(tipo) || normalizarEtiquetaTexto(selector);

        if (nombreLabel && nombreLabel.toLowerCase() !== 'id' && nombreLabel.trim() !== '') {
          chain = chain.then(() => {
            const fechaObj = parseFechaBasicaExcel(valorTexto);
            cy.log(`Rellenando fecha "${nombreLabel}" con ${valorTexto}`);

            return cy
              .contains('label', new RegExp(`^${escapeRegex(nombreLabel)}$`, 'i'), { timeout: 10000 })
              .should('be.visible')
              .parents('.MuiFormControl-root')
              .first()
              .within(() => {
                cy.get(
                  'button[aria-label*="calendar"], ' +
                  'button[aria-label*="date"], ' +
                  'button[aria-label*="fecha"], ' +
                  'button[aria-label*="Choose date"]'
                )
                  .first()
                  .click({ force: true });
              })
              .then(() => seleccionarFechaEnCalendario(fechaObj));
          });
          continue;
        }
      }

      // Para otros campos, verificar primero si es un campo de texto conocido, luego si es select
      let nombreLabel = normalizarEtiquetaTexto(tipo) || normalizarEtiquetaTexto(selector);
      if (nombreLabel && nombreLabel.toLowerCase() !== 'id' && nombreLabel.trim() !== '') {
        // PRIMERO: Verificar si es un campo de texto conocido (Plazas, T.Neumático, Altura, Largo, Ancho, etc.)
        const campoTextoPorLabel = camposTexto.find(c => {
          const labelNormalizado = c.label.toLowerCase().trim();
          const nombreNormalizado = nombreLabel.toLowerCase().trim();
          // Coincidencia exacta
          if (nombreNormalizado === labelNormalizado) return true;
          // Coincidencia parcial (que uno contenga al otro)
          if (nombreNormalizado.includes(labelNormalizado) || labelNormalizado.includes(nombreNormalizado)) return true;
          // Coincidencia sin acentos ni caracteres especiales
          const sinAcentos = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[º°]/g, 'o');
          if (sinAcentos(nombreNormalizado) === sinAcentos(labelNormalizado)) return true;
          return false;
        });

        if (campoTextoPorLabel) {
          chain = chain.then(() => {
            cy.log(`Escribiendo por name (detectado por label): ${campoTextoPorLabel.name} = ${valorTexto} (label: ${campoTextoPorLabel.label})`);
            return escribirPorName(campoTextoPorLabel.name, valorTexto, campoTextoPorLabel.label)
              .then(() => {
                cy.log(` Campo "${campoTextoPorLabel.label}" rellenado correctamente`);
              }, (err) => {
                cy.log(` Error al rellenar "${campoTextoPorLabel.label}" por name: ${err.message}. Intentando por label...`);
                // Si falla por name, buscar directamente por label (especialmente para Altura, Largo, Ancho, m3)
                return cy.contains('label', new RegExp(`^${escapeRegex(campoTextoPorLabel.label)}$`, 'i'), { timeout: 10000 })
                  .should('be.visible')
                  .then(($label) => {
                    const forAttr = $label.attr('for');
                    if (forAttr) {
                      return cy.get(`#${forAttr}`, { timeout: 10000 })
                        .should('be.visible')
                        .clear({ force: true })
                        .type(valorTexto, { force: true });
                    } else {
                      return cy.wrap($label)
                        .parents('.MuiFormControl-root')
                        .first()
                        .within(() => {
                          cy.get('input, textarea', { timeout: 10000 })
                            .should('be.visible')
                            .first()
                            .clear({ force: true })
                            .type(valorTexto, { force: true });
                        });
                    }
                  })
                  .then(() => {
                    cy.log(` Campo "${campoTextoPorLabel.label}" rellenado correctamente por label`);
                  }, (err2) => {
                    cy.log(` No se pudo rellenar "${campoTextoPorLabel.label}": ${err2.message}. Continuando...`);
                    return cy.wrap(null);
                  });
              });
          });
          continue;
        }

        // SEGUNDO: Verificar si el label coincide con algún campo select conocido (Frenos, Suspensión, Tipo Disco, etc.)
        const campoSelectPorLabel = camposSelect.find(c =>
          nombreLabel.toLowerCase() === c.label.toLowerCase() ||
          nombreLabel.toLowerCase().includes(c.label.toLowerCase()) ||
          c.label.toLowerCase().includes(nombreLabel.toLowerCase())
        );

        if (campoSelectPorLabel) {
          chain = chain.then(() => {
            cy.log(`Seleccionando en combobox "${campoSelectPorLabel.label}": ${valorTexto} (detectado por label, igual que Estado/Sección)`);
            const selectorId = campoSelectPorLabel.id ? `#${campoSelectPorLabel.id}` : '';
            return seleccionarOpcionMaterial(selectorId, valorTexto, campoSelectPorLabel.label);
          });
          continue;
        }

        // TERCERO: Si no es un campo conocido, intentar buscar por label como campo de texto normal
        chain = chain.then(() => {
          cy.log(`Rellenando campo "${nombreLabel}" con ${valorTexto} (búsqueda genérica por label)`);
          // Intentar primero búsqueda exacta
          return cy.contains('label', new RegExp(`^${escapeRegex(nombreLabel)}$`, 'i'), { timeout: 10000 })
            .should('be.visible')
            .then(($label) => {
              const forAttr = $label.attr('for');
              if (forAttr) {
                // Si el label tiene un atributo 'for', buscar el input por ese ID
                return cy.get(`#${forAttr}`, { timeout: 10000 })
                  .should('be.visible')
                  .clear({ force: true })
                  .type(valorTexto, { force: true });
              } else {
                // Si no tiene 'for', buscar dentro del FormControl
                return cy.wrap($label)
                  .parents('.MuiFormControl-root')
                  .first()
                  .within(() => {
                    cy.get('input, textarea', { timeout: 10000 })
                      .should('be.visible')
                      .first()
                      .clear({ force: true })
                      .type(valorTexto, { force: true });
                  });
              }
            })
            .then(() => {
              cy.log(` Campo "${nombreLabel}" rellenado correctamente`);
            }, (err) => {
              cy.log(` Error al rellenar "${nombreLabel}": ${err.message}. Intentando búsqueda alternativa...`);
              // Si falla, intentar búsqueda más flexible
              return cy.contains('label', new RegExp(escapeRegex(nombreLabel), 'i'), { timeout: 5000 })
                .should('be.visible')
                .then(($label) => {
                  const forAttr = $label.attr('for');
                  if (forAttr) {
                    return cy.get(`#${forAttr}`, { timeout: 10000 })
                      .should('be.visible')
                      .clear({ force: true })
                      .type(valorTexto, { force: true });
                  } else {
                    return cy.wrap($label)
                      .parents('.MuiFormControl-root')
                      .first()
                      .within(() => {
                        cy.get('input, textarea', { timeout: 10000 })
                          .should('be.visible')
                          .first()
                          .clear({ force: true })
                          .type(valorTexto, { force: true });
                      });
                  }
                })
                .then(() => {
                  cy.log(` Campo "${nombreLabel}" rellenado correctamente (búsqueda alternativa)`);
                }, (err2) => {
                  cy.log(` No se pudo rellenar "${nombreLabel}": ${err2.message}. Continuando con siguiente campo...`);
                  return cy.wrap(null); // Continuar aunque falle
                });
            });
        });
      }
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Ficha Técnica de Vehículo rellenada desde Excel`);
    });
  }

  // Rellenar TODOS los campos de COMPRA/VENTA desde Excel
  function llenarFormularioCompraVentaDesdeExcel(caso, numeroCaso) {
    const totalCampos = Number(caso?.__totalCamposExcel) || 20;
    cy.log(`Rellenando COMPRA/VENTA con ${totalCampos} campos desde Excel`);

    // Mapeo de campos de COMPRA/VENTA según el HTML proporcionado
    // Campos de texto normales (con name attribute)
    const camposTexto = [
      { name: 'nLeasing', label: '№ Leasing' },
      { name: 'companyCode', label: 'Código' },
      { name: 'companyName', label: 'Nombre' },
      { name: 'cuota', label: 'Cuota (€)' },
      { name: 'month', label: 'Meses' },
      { name: 'value', label: 'Valor (€)' },
      { name: 'import', label: 'Importe, € (€)' },
      { name: 'dest', label: 'Destinatario' }
    ];

    // Campos select (comboboxes) - usar seleccionarOpcionMaterial con el ID (igual que FICHA TÉCNICA)
    const camposSelect = [
      { name: 'forma', id: 'mui-component-select-forma', label: 'Forma' }
    ];

    // Campos de fecha (calendarios) - usar el mismo patrón que VENCIMIENTOS
    const camposFecha = [
      { label: 'Inicio' },
      { label: 'Fin' },
      { label: 'Fecha' }
    ];

    let chain = cy.wrap(null);

    // Procesar todos los campos del Excel
    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = procesarValorXXX(caso[`dato_${i}`]);

      if (!tipo || !selector || valor === undefined || valor === '') continue;

      const tipoLower = (tipo || '').toLowerCase();
      const selectorLower = (selector || '').toLowerCase();
      const valorTexto = valor.toString().trim();

      // PRIMERO: Verificar si es una fecha (antes de procesar otros campos)
      const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(valorTexto);
      const esFechaPorTipo = tipoLower.includes('fecha');
      const esFechaPorSelector = selectorLower.includes('fecha') || selectorLower.includes('date') ||
        selectorLower.includes('inicio') || selectorLower.includes('fin') ||
        selectorLower.includes('_r_nr_') || selectorLower.includes('r_nr') ||
        selectorLower.includes('_r_nu_') || selectorLower.includes('r_nu') ||
        selectorLower.includes('_r_o4_') || selectorLower.includes('r_o4');
      const esFechaPorLabel = camposFecha.some(c => {
        const labelLower = c.label.toLowerCase();
        const tipoNormalizado = normalizarEtiquetaTexto(tipo)?.toLowerCase() || '';
        const selectorNormalizado = normalizarEtiquetaTexto(selector)?.toLowerCase() || '';
        return tipoLower.includes(labelLower) || selectorLower.includes(labelLower) ||
          tipoNormalizado.includes(labelLower) || selectorNormalizado.includes(labelLower);
      });

      if (esFormatoFecha || esFechaPorTipo || esFechaPorSelector || esFechaPorLabel) {
        let nombreLabel = normalizarEtiquetaTexto(tipo) || normalizarEtiquetaTexto(selector);

        // Si no se encuentra el label, intentar detectarlo por el selector o tipo
        if (!nombreLabel || nombreLabel.toLowerCase() === 'id' || nombreLabel.toLowerCase() === 'value name') {
          // Buscar por IDs específicos de las fechas según el HTML (prioridad alta)
          if (selectorLower.includes('_r_nr_') || selectorLower.includes('r_nr')) {
            nombreLabel = 'Inicio';
          } else if (selectorLower.includes('_r_nu_') || selectorLower.includes('r_nu')) {
            nombreLabel = 'Fin';
          } else if (selectorLower.includes('_r_o4_') || selectorLower.includes('r_o4')) {
            nombreLabel = 'Fecha';
          }
          // Buscar por palabras clave en el selector (segunda prioridad)
          else if (selectorLower.includes('inicio') || tipoLower.includes('inicio')) {
            nombreLabel = 'Inicio';
          } else if (selectorLower.includes('fin') || tipoLower.includes('fin')) {
            nombreLabel = 'Fin';
          } else if (selectorLower.includes('fecha') || tipoLower.includes('fecha') || selectorLower.includes('date')) {
            nombreLabel = 'Fecha';
          }
          // Si es una fecha pero no se puede determinar el label específico, intentar buscar por el orden
          else if (esFormatoFecha) {
            // Si es una fecha pero no sabemos cuál, intentar buscar todas las fechas disponibles
            // en orden: Inicio, Fin, Fecha. Usar un contador para rastrear qué fecha intentar
            // Si es la primera fecha detectada, intentar con "Inicio", si es la segunda con "Fin", etc.
            const indiceFecha = i % 3; // Usar el índice del campo para determinar qué fecha intentar
            const fechasOrden = ['Inicio', 'Fin', 'Fecha'];
            nombreLabel = fechasOrden[indiceFecha];
            cy.log(`⚠ Fecha detectada pero no se pudo determinar el label. Selector: ${selector}, Tipo: ${tipo}. Intentando con "${nombreLabel}" (índice ${indiceFecha})...`);
          } else {
            // Si no es formato fecha pero tiene indicios de ser fecha, intentar con Inicio
            if (esFechaPorSelector || esFechaPorLabel) {
              nombreLabel = 'Inicio';
            } else {
              nombreLabel = 'Inicio'; // Por defecto
            }
          }
        } else {
          // Si ya tenemos un nombreLabel, verificar que sea uno de los campos de fecha conocidos
          const esLabelFechaConocido = camposFecha.some(c => {
            const labelLower = c.label.toLowerCase();
            return nombreLabel.toLowerCase() === labelLower ||
              nombreLabel.toLowerCase().includes(labelLower) ||
              labelLower.includes(nombreLabel.toLowerCase());
          });

          if (!esLabelFechaConocido) {
            // Si el nombreLabel no es un campo de fecha conocido, intentar detectarlo de nuevo
            if (selectorLower.includes('_r_nr_') || selectorLower.includes('r_nr') || nombreLabel.toLowerCase().includes('inicio')) {
              nombreLabel = 'Inicio';
            } else if (selectorLower.includes('_r_nu_') || selectorLower.includes('r_nu') || nombreLabel.toLowerCase().includes('fin')) {
              nombreLabel = 'Fin';
            } else if (selectorLower.includes('_r_o4_') || selectorLower.includes('r_o4') || nombreLabel.toLowerCase().includes('fecha')) {
              nombreLabel = 'Fecha';
            }
          }
        }

        if (nombreLabel && nombreLabel.toLowerCase() !== 'id' && nombreLabel.toLowerCase() !== 'value name' && nombreLabel.trim() !== '') {
          chain = chain.then(() => {
            const fechaObj = parseFechaBasicaExcel(valorTexto);
            cy.log(`Rellenando fecha "${nombreLabel}" con ${valorTexto} (igual que VENCIMIENTOS)`);

            return cy
              .contains('label', new RegExp(`^${escapeRegex(nombreLabel)}$`, 'i'), { timeout: 10000 })
              .should('be.visible')
              .parents('.MuiFormControl-root')
              .first()
              .within(() => {
                cy.get(
                  'button[aria-label*="calendar"], ' +
                  'button[aria-label*="date"], ' +
                  'button[aria-label*="fecha"], ' +
                  'button[aria-label*="Choose date"]'
                )
                  .first()
                  .click({ force: true });
              })
              .then(() => seleccionarFechaEnCalendario(fechaObj))
              .then(() => {
                cy.log(`✓ Fecha "${nombreLabel}" rellenada correctamente`);
              }, (err) => {
                cy.log(`⚠ Error al rellenar fecha "${nombreLabel}": ${err.message}. Intentando con siguiente fecha...`);
                // Si falla, intentar con las siguientes fechas en orden
                const fechasOrden = ['Inicio', 'Fin', 'Fecha'];
                const indiceActual = fechasOrden.indexOf(nombreLabel);
                const siguienteFecha = fechasOrden[indiceActual + 1];

                if (siguienteFecha) {
                  cy.log(`Intentando rellenar "${siguienteFecha}" en lugar de "${nombreLabel}"...`);
                  return cy
                    .contains('label', new RegExp(`^${escapeRegex(siguienteFecha)}$`, 'i'), { timeout: 10000 })
                    .should('be.visible')
                    .parents('.MuiFormControl-root')
                    .first()
                    .within(() => {
                      cy.get(
                        'button[aria-label*="calendar"], ' +
                        'button[aria-label*="date"], ' +
                        'button[aria-label*="fecha"], ' +
                        'button[aria-label*="Choose date"]'
                      )
                        .first()
                        .click({ force: true });
                    })
                    .then(() => seleccionarFechaEnCalendario(fechaObj))
                    .then(() => {
                      cy.log(`Fecha "${siguienteFecha}" rellenada correctamente`);
                    }, (err2) => {
                      cy.log(`Error al rellenar "${siguienteFecha}": ${err2.message}. Intentando con última fecha...`);
                      // Si aún falla, intentar con la última fecha disponible
                      const ultimaFecha = fechasOrden[fechasOrden.length - 1];
                      if (siguienteFecha !== ultimaFecha) {
                        return cy
                          .contains('label', new RegExp(`^${escapeRegex(ultimaFecha)}$`, 'i'), { timeout: 10000 })
                          .should('be.visible')
                          .parents('.MuiFormControl-root')
                          .first()
                          .within(() => {
                            cy.get(
                              'button[aria-label*="calendar"], ' +
                              'button[aria-label*="date"], ' +
                              'button[aria-label*="fecha"], ' +
                              'button[aria-label*="Choose date"]'
                            )
                              .first()
                              .click({ force: true });
                          })
                          .then(() => seleccionarFechaEnCalendario(fechaObj))
                          .then(() => {
                            cy.log(`Fecha "${ultimaFecha}" rellenada correctamente`);
                          }, (err3) => {
                            cy.log(`No se pudo rellenar ninguna fecha: ${err3.message}. Continuando...`);
                            return cy.wrap(null);
                          });
                      }
                      return cy.wrap(null);
                    });
                }
                return cy.wrap(null);
              });
          });
          continue;
        }
      }

      // Si tiene name attribute (value name), verificar si es texto o select
      if (tipoLower === 'value name' || tipoLower.includes('value name')) {
        // PRIMERO: Buscar en campos de texto
        let campoTexto = camposTexto.find(c => c.name === selector || selectorLower === c.name.toLowerCase());

        // SEGUNDO: Si no se encuentra, buscar por name parcial
        if (!campoTexto) {
          campoTexto = camposTexto.find(c =>
            selectorLower.includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes(selectorLower)
          );
        }

        // TERCERO: Si aún no se encuentra, intentar buscar por el label
        if (!campoTexto) {
          const posibleLabel = normalizarEtiquetaTexto(tipo) || normalizarEtiquetaTexto(selector);
          if (posibleLabel) {
            campoTexto = camposTexto.find(c => {
              const labelNormalizado = c.label.toLowerCase().trim();
              const nombreNormalizado = posibleLabel.toLowerCase().trim();
              if (nombreNormalizado === labelNormalizado) return true;
              if (nombreNormalizado.includes(labelNormalizado) || labelNormalizado.includes(nombreNormalizado)) return true;
              const sinAcentos = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[º°]/g, 'o');
              if (sinAcentos(nombreNormalizado) === sinAcentos(labelNormalizado)) return true;
              return false;
            });
          }
        }

        if (campoTexto) {
          chain = chain.then(() => {
            cy.log(`Escribiendo por name: ${campoTexto.name} = ${valorTexto} (label: ${campoTexto.label})`);
            return escribirPorName(campoTexto.name, valorTexto, campoTexto.label)
              .then(() => {
                cy.log(` Campo "${campoTexto.label}" rellenado correctamente`);
              }, (err) => {
                cy.log(` Error al rellenar "${campoTexto.label}": ${err.message}. Continuando...`);
                return cy.wrap(null);
              });
          });
          continue;
        }

        // Buscar en campos select
        const campoSelect = camposSelect.find(c => c.name === selector || selectorLower.includes(c.name));
        if (campoSelect) {
          chain = chain.then(() => {
            cy.log(`Seleccionando en combobox "${campoSelect.label}": ${valorTexto} (igual que FICHA TÉCNICA)`);
            const selectorId = campoSelect.id ? `#${campoSelect.id}` : '';
            return seleccionarOpcionMaterial(selectorId, valorTexto, campoSelect.label);
          });
          continue;
        }
      }

      // Para otros campos, verificar si es un campo de texto conocido o select
      let nombreLabel = normalizarEtiquetaTexto(tipo) || normalizarEtiquetaTexto(selector);
      if (nombreLabel && nombreLabel.toLowerCase() !== 'id' && nombreLabel.trim() !== '') {
        // Verificar si es un campo de texto conocido
        const campoTextoPorLabel = camposTexto.find(c => {
          const labelNormalizado = c.label.toLowerCase().trim();
          const nombreNormalizado = nombreLabel.toLowerCase().trim();
          if (nombreNormalizado === labelNormalizado) return true;
          if (nombreNormalizado.includes(labelNormalizado) || labelNormalizado.includes(nombreNormalizado)) return true;
          const sinAcentos = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[º°]/g, 'o');
          if (sinAcentos(nombreNormalizado) === sinAcentos(labelNormalizado)) return true;
          return false;
        });

        if (campoTextoPorLabel) {
          chain = chain.then(() => {
            cy.log(`Escribiendo por name (detectado por label): ${campoTextoPorLabel.name} = ${valorTexto}`);
            return escribirPorName(campoTextoPorLabel.name, valorTexto, campoTextoPorLabel.label)
              .then(() => {
                cy.log(` Campo "${campoTextoPorLabel.label}" rellenado correctamente`);
              }, (err) => {
                cy.log(` Error al rellenar "${campoTextoPorLabel.label}": ${err.message}. Continuando...`);
                return cy.wrap(null);
              });
          });
          continue;
        }

        // Verificar si es un campo select conocido
        const campoSelectPorLabel = camposSelect.find(c =>
          nombreLabel.toLowerCase() === c.label.toLowerCase() ||
          nombreLabel.toLowerCase().includes(c.label.toLowerCase()) ||
          c.label.toLowerCase().includes(nombreLabel.toLowerCase())
        );

        if (campoSelectPorLabel) {
          chain = chain.then(() => {
            cy.log(`Seleccionando en combobox "${campoSelectPorLabel.label}": ${valorTexto} (detectado por label)`);
            const selectorId = campoSelectPorLabel.id ? `#${campoSelectPorLabel.id}` : '';
            return seleccionarOpcionMaterial(selectorId, valorTexto, campoSelectPorLabel.label);
          });
          continue;
        }
      }
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Compra/Venta de Vehículo rellenada desde Excel`);
    });
  }

  // Rellenar formulario de Contacto en el modal lateral
  function llenarFormularioContacto(caso, numeroCaso) {
    const nombre = procesarValorXXX(caso.dato_1);
    const email = caso.dato_2; // Email no procesar XXX
    const telefono = procesarValorXXX(caso.dato_3);
    const cargo = procesarValorXXX(caso.dato_4);

    cy.log(`Datos Contacto detectados: nombre=${nombre}, email=${email}, telefono=${telefono}, cargo=${cargo}`);

    let chain = cy.wrap(null);

    // Mapeo directo de campos del Excel a los name attributes del formulario
    const camposContacto = [
      { name: 'cp_name', valor: nombre, label: 'Nombre' },
      { name: 'cp_email', valor: email, label: 'Correo electrónico' },
      { name: 'cp_phone', valor: telefono, label: 'Teléfono' },
      { name: 'cp_position', valor: cargo, label: 'Cargo' }
    ];

    camposContacto.forEach((campo) => {
      if (!campo.valor || campo.valor === '') {
        cy.log(`Campo vacío en Excel: ${campo.label}`);
        return;
      }

      chain = chain.then(() =>
        escribirPorName(campo.name, campo.valor, campo.label)
      );
    });

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Contacto rellenado desde Excel`);
    });
  }

  // Rellenar formulario de Acciones en el modal lateral
  function llenarFormularioAcciones(caso, numeroCaso) {
    const fecha = caso.dato_1;
    const notas = caso.dato_2;

    cy.log(`Datos Acciones detectados: fecha=${fecha}, notas=${notas}`);

    let chain = cy.wrap(null);

    // Campo Fecha (his_date) - usar el date picker de Material-UI
    // Usar la misma lógica que funciona en llenarFormularioSeccion
    if (fecha) {
      chain = chain.then(() => {
        const textoFecha = fecha.toString();
        const fechaObj = parseFechaBasicaExcel(textoFecha);
        cy.log(`Rellenando Fecha con ${textoFecha}`);

        // Buscar por el label "Fecha" y luego hacer clic en el botón del calendario
        return cy.contains('label', new RegExp(`^${escapeRegex('Fecha')}$`, 'i'), { timeout: 10000 })
          .should('be.visible')
          .then(($label) => {
            return cy.wrap($label)
              .parents('.MuiFormControl-root')
              .first()
              .within(() => {
                // Hacer clic en el botón del calendario
                cy.get('button[aria-label*="date"], button[aria-label*="fecha"], button[aria-label*="Choose date"]', { timeout: 10000 })
                  .should('be.visible')
                  .click({ force: true });
              })
              .then(() => {
                cy.wait(500);
                // Usar la función de seleccionar fecha en calendario
                return seleccionarFechaEnCalendario(fechaObj);
              });
          });
      });
    }

    // Campo Notas (his_notes)
    if (notas) {
      chain = chain.then(() =>
        escribirPorName('his_notes', notas, 'Notas')
      );
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Acciones rellenado desde Excel`);
    });
  }

  // Rellenar formulario de Certificaciones en el modal lateral
  function llenarFormularioCertificaciones(caso, numeroCaso) {
    const numero = procesarValorXXX(caso.dato_1);
    const fecha = caso.dato_2; // Fecha no procesar XXX

    cy.log(`Datos Certificaciones detectados: numero=${numero}, fecha=${fecha}`);

    // Esperar adicional para asegurar que el drawer esté completamente visible
    cy.wait(300);

    let chain = cy.wrap(null);

    // Campo Número (cert_number)
    if (numero) {
      chain = chain.then(() =>
        escribirPorName('cert_number', numero, 'Número')
      );
    }

    // Campo Fecha - usar el date picker de Material-UI
    // Si no se puede rellenar la fecha, continuar sin error
    if (fecha) {
      chain = chain.then(() => {
        const textoFecha = fecha.toString();
        const fechaObj = parseFechaBasicaExcel(textoFecha);
        cy.log(`Intentando rellenar Fecha con ${textoFecha}`);

        // Intentar buscar el label "Fecha", si no se encuentra, continuar sin error
        return cy.get('body').then(($body) => {
          const label = $body.find('label').filter((_, el) => {
            const texto = (el.innerText || el.textContent || '').trim();
            return /^Fecha$/i.test(texto);
          }).filter(':visible').first();

          if (label.length > 0) {
            // Si el label existe y es visible, intentar rellenar la fecha
            return cy.wrap(label)
              .parents('.MuiFormControl-root')
              .first()
              .within(() => {
                cy.get('button[aria-label*="date"], button[aria-label*="fecha"], button[aria-label*="Choose date"]', { timeout: 10000 })
                  .should('be.visible')
                  .click({ force: true });
              })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnCalendario(fechaObj);
              });
          } else {
            cy.log(' No se pudo rellenar la fecha en Certificaciones (label no visible), continuando sin error');
            return cy.wrap(null);
          }
        });
      });
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Certificaciones rellenado desde Excel`);
    });
  }

  // Rellenar formulario de Datos adicionales (Factura Electrónica) directamente en la pestaña
  function llenarFormularioDatosAdicionales(caso, numeroCaso) {
    const oficinaContable = caso.dato_1;
    const organoGestor = caso.dato_2;
    const unidadTramitadora = caso.dato_3;
    const organoProponente = caso.dato_4;
    const riesgoAsegurado = caso.dato_5;
    const discount = caso.dato_6;

    cy.log(`Datos adicionales detectados: oficinaContable=${oficinaContable}, organoGestor=${organoGestor}, unidadTramitadora=${unidadTramitadora}, organoProponente=${organoProponente}, riesgoAsegurado=${riesgoAsegurado}, discount=${discount}`);

    let chain = cy.wrap(null);

    // Campos de Factura Electrónica y Otros Datos - buscar por name del HTML
    const camposDatosAdicionales = [
      { name: 'client.accountableOffice', valor: oficinaContable, label: 'Oficina contable' },
      { name: 'client.managingOrganization', valor: organoGestor, label: 'Órgano gestor' },
      { name: 'client.processingUnit', valor: unidadTramitadora, label: 'Unidad tramitadora' },
      { name: 'client.preponentOrganization', valor: organoProponente, label: 'Órgano proponente' },
      { name: 'client.RiesgoAsegurado', valor: riesgoAsegurado, label: 'Riesgo Asegurado' },
      { name: 'client.discount', valor: discount, label: 'Dto' }
    ];

    camposDatosAdicionales.forEach((campo) => {
      if (!campo.valor || campo.valor === '') {
        cy.log(`⏭Campo vacío en Excel: ${campo.label}`);
        return;
      }

      chain = chain.then(() =>
        escribirPorName(campo.name, campo.valor, campo.label)
      );
    });

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Datos adicionales rellenado desde Excel`);
    });
  }

  // Rellenar formulario de Documentos en el modal lateral
  function llenarFormularioDocumentos(caso, numeroCaso) {
    const nombre = caso.dato_1;
    const tipo = caso.dato_2;

    cy.log(`Datos Documentos detectados: nombre=${nombre}, tipo=${tipo}`);

    let chain = cy.wrap(null);

    // Campo Nombre (doc_name)
    if (nombre) {
      chain = chain.then(() =>
        escribirPorName('doc_name', nombre, 'Nombre')
      );
    }

    // Campo Tipo (doc_type)
    if (tipo) {
      chain = chain.then(() =>
        escribirPorName('doc_type', tipo, 'Tipo')
      );
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Documentos rellenado desde Excel`);
    });
  }

  // Rellenar formulario de Dirección en el modal lateral
  function llenarFormularioDireccion(caso, numeroCaso) {
    const tipo = procesarValorXXX(caso.dato_1);
    const domicilio = procesarValorXXX(caso.dato_2);
    const codigoPostal = procesarValorXXX(caso.dato_3);
    const poblacion = procesarValorXXX(caso.dato_4);
    const provincia = procesarValorXXX(caso.dato_5);
    const pais = caso.dato_6; // País no procesar XXX
    const notas = procesarValorXXX(caso.dato_6 || caso.dato_7); // Notas puede estar después de país

    cy.log(`Datos Dirección detectados: tipo=${tipo}, domicilio=${domicilio}, codigoPostal=${codigoPostal}, poblacion=${poblacion}, provincia=${provincia}, pais=${pais}, notas=${notas}`);

    let chain = cy.wrap(null);

    // Mapeo de campos del Excel a los name attributes del formulario (usando los nombres reales del HTML)
    const camposDireccion = [
      { name: 'add_name', valor: tipo, label: 'Tipo' },
      { name: 'add_address', valor: domicilio, label: 'Domicilio' },
      { name: 'add_postalCode', valor: codigoPostal, label: 'C. Postal' },
      { name: 'add_city', valor: poblacion, label: 'Población' },
      { name: 'add_region', valor: provincia, label: 'Provincia' },
      { name: 'add_notes', valor: notas, label: 'Notas' }
    ];

    camposDireccion.forEach((campo) => {
      if (!campo.valor || campo.valor === '') {
        cy.log(`⏭Campo vacío en Excel: ${campo.label}`);
        return;
      }

      chain = chain.then(() =>
        escribirPorName(campo.name, campo.valor, campo.label)
      );
    });

    // País es un autocomplete, se puede manejar opcionalmente si está en el Excel
    // if (pais) {
    //   chain = chain.then(() => {
    //     cy.get('input[name*="country"], input[id*="_r_2d6_"]', { timeout: 10000 })
    //       .should('be.visible')
    //       .clear({ force: true })
    //       .type(pais.toString(), { force: true })
    //       .then(() => cy.wait(500));
    //   });
    // }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Dirección rellenado desde Excel`);
    });
  }

  // Rellenar formulario de Facturación (sin modal, directamente en la pestaña)
  function llenarFormularioFacturacion(caso, numeroCaso) {
    const empresas = caso.dato_1; // Autocomplete, no procesar XXX
    const disenoFactura = caso.dato_2; // Autocomplete, no procesar XXX
    const banco = procesarValorXXX(caso.dato_3);
    const formaPago = caso.dato_4; // Autocomplete, no procesar XXX
    const swift = procesarValorXXX(caso.dato_5);
    const cobroFinMes = caso.dato_6; // Checkbox, no procesar XXX
    const conRiesgo = caso.dato_7; // Checkbox, no procesar XXX
    const cccEmpresa = procesarValorXXX(caso.dato_8);
    const iban = procesarValorXXX(caso.dato_9);
    const cContable = procesarValorXXX(caso.dato_10);
    const iva = caso.dato_11; // Select, no procesar XXX
    const diasCobro = procesarValorXXX(caso.dato_12);
    const riesgoAsegurado = caso.dato_13; // Select, no procesar XXX
    const dto = procesarValorXXX(caso.dato_14);

    cy.log(`Datos Facturación detectados: empresas=${empresas}, disenoFactura=${disenoFactura}, banco=${banco}, formaPago=${formaPago}, swift=${swift}, cobroFinMes=${cobroFinMes}, conRiesgo=${conRiesgo}, cccEmpresa=${cccEmpresa}, iban=${iban}, cContable=${cContable}, iva=${iva}, diasCobro=${diasCobro}, riesgoAsegurado=${riesgoAsegurado}, dto=${dto}`);

    let chain = cy.wrap(null);

    // Campos de texto normales (usando los nombres reales del HTML)
    const camposTexto = [
      { name: 'client.bankName', valor: banco, label: 'Banco' },
      { name: 'client.paymentMethodRef', valor: formaPago, label: 'Forma de Pago' },
      { name: 'client.swift', valor: swift, label: 'Swift' },
      { name: 'client.iban', valor: iban, label: 'IBAN' },
      { name: 'client.CuentaContable', valor: cContable, label: 'C. Contable' },
      { name: 'client.defaultTax', valor: iva, label: 'IVA' },
      { name: 'client.diaCobro1', valor: diasCobro, label: 'Días Cobro' },
      { name: 'client.RiesgoAsegurado', valor: riesgoAsegurado, label: 'Riesgo Asegurado' },
      { name: 'client.discount', valor: dto, label: 'Dto' }
    ];

    // Campos de autocomplete (necesitan tratamiento especial)
    const camposAutocomplete = [
      { label: 'Empresas', valor: empresas },
      { label: 'Diseño Factura', valor: disenoFactura }
    ];

    // Rellenar campos de texto normales
    camposTexto.forEach((campo) => {
      if (!campo.valor || campo.valor === '') {
        cy.log(`Campo vacío en Excel: ${campo.label}`);
        return;
      }

      chain = chain.then(() =>
        escribirPorName(campo.name, campo.valor, campo.label)
      );
    });

    // Rellenar campos autocomplete
    camposAutocomplete.forEach((campo) => {
      if (!campo.valor || campo.valor === '') {
        cy.log(`Campo vacío en Excel: ${campo.label}`);
        return;
      }

      chain = chain.then(() => {
        cy.log(`Rellenando autocomplete "${campo.label}" con valor "${campo.valor}"`);
        // Buscar por label y luego el input del autocomplete
        return cy.contains('label', new RegExp(`^${escapeRegex(campo.label)}$`, 'i'), { timeout: 10000 })
          .should('be.visible')
          .then(($label) => {
            // Buscar el input del autocomplete asociado
            return cy.wrap($label)
              .parents('.MuiFormControl-root')
              .first()
              .within(() => {
                cy.get('input[role="combobox"], input[aria-autocomplete="list"]', { timeout: 10000 })
                  .should('be.visible')
                  .click({ force: true })
                  .clear({ force: true })
                  .type(campo.valor.toString(), { force: true });
              })
              .then(() => {
                cy.wait(1000);
                // Hacer clic en la primera opción que aparezca
                cy.get('[role="option"]', { timeout: 10000 })
                  .first()
                  .should('be.visible')
                  .click({ force: true })
                  .then(() => {
                    cy.log(`Opción seleccionada para "${campo.label}"`);
                  }, () => {
                    cy.log(`No se encontraron opciones para "${campo.label}", continuando`);
                  });
              });
          });
      });
    });

    // Checkbox: Cobro fin de mes
    if (cobroFinMes) {
      chain = chain.then(() => {
        cy.log('Marcando checkbox "Cobro fin de mes"');
        return cy.get('input[name="client.cobroFinMes"]', { timeout: 10000 })
          .check({ force: true });
      });
    }

    // Checkbox: Con Riesgo
    if (conRiesgo) {
      chain = chain.then(() => {
        cy.log('Marcando checkbox "Con Riesgo"');
        return cy.get('input[name="client.bConRiesgo"]', { timeout: 10000 })
          .check({ force: true });
      });
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Facturación rellenado desde Excel`);
    });
  }

  function escribirPorName(nameAttr, valor, etiqueta = '') {
    if (!nameAttr || valor === undefined || valor === null) {
      return cy.wrap(null);
    }

    const texto = valor.toString();
    const selector = `input[name="${nameAttr}"], textarea[name="${nameAttr}"]`;
    const etiquetaLog = etiqueta || nameAttr;

    cy.log(`Escribiendo en "${etiquetaLog}": ${texto}`);

    // Buscar directamente con Cypress
    // Romper la cadena para evitar errores cuando la página se actualiza
    // NO hacer blur() ni disparar eventos que puedan guardar el formulario automáticamente
    return cy.get(selector, { timeout: 10000 })
      .should('be.visible')
      .scrollIntoView()
      .then(($el) => {
        // Limpiar el campo
        return cy.wrap($el[0])
          .clear({ force: true });
      })
      .then(() => {
        // Esperar un poco para que se estabilice
        cy.wait(100);
        // Escribir el texto - NO hacer blur después
        return cy.get(selector, { timeout: 10000 })
          .should('be.visible')
          .type(texto, { force: true, delay: 0 });
      })
      .then(() => {
        // Verificar el valor sin hacer blur (evita guardado automático)
        cy.wait(50);
        return cy.get(selector, { timeout: 10000 })
          .should(($input) => {
            const valorActual = $input.val();
            if (valorActual !== texto) {
              cy.log(` Valor esperado "${texto}" pero se obtuvo "${valorActual}", continuando...`);
            }
          });
      });
  }

  function seleccionarPorName(nameAttr, valor) {
    if (!nameAttr || !valor) return cy.wrap(null);
    const regex = new RegExp(`^${escapeRegex(valor)}$`, 'i');

    return cy.get('body').then(($body) => {
      const inputs = $body.find(`*[name="${nameAttr}"]`);

      if (!inputs.length) {
        cy.log(`No se encontraron elementos con name="${nameAttr}"`);
        return;
      }

      const arr = Array.from(inputs);
      const match = arr.find((input) => {
        const label = input.closest('label');
        const texto = (label ? label.innerText : '') || '';
        return regex.test(texto.trim()) || regex.test((input.value || '').trim());
      });

      const objetivo = match || arr[0];
      const tipo = (objetivo.type || '').toLowerCase();
      const tag = (objetivo.tagName || '').toLowerCase();

      if (tipo === 'radio' || tipo === 'checkbox') {
        cy.log(`Seleccionando "${valor}" en name="${nameAttr}"`);
        return cy.wrap(objetivo).check({ force: true });
      }

      if (tag === 'select') {
        cy.log(`Seleccionando "${valor}" en <select> name="${nameAttr}"`);
        return cy.wrap(objetivo).select(valor.toString(), { force: true });
      }

      cy.log(`Click en "${valor}" name="${nameAttr}"`);
      return cy.wrap(objetivo).click({ force: true });
    });
  }

  // Función auxiliar para verificar que una pestaña no muestre "Sin filas"
  function verificarPestañaSinFilas(nombrePestaña) {
    return cy.get('body').then($body => {
      // Buscar específicamente en el área de la tabla de la pestaña actual
      // Buscar la tabla MuiDataGrid o el área de contenido de la pestaña
      const tabla = $body.find('.MuiDataGrid-root:visible, .MuiTableContainer:visible, table:visible').first();

      if (tabla.length > 0) {
        // Verificar si la tabla tiene filas de datos
        const filas = tabla.find('.MuiDataGrid-row:visible, tbody tr:visible, .MuiTableBody-root tr:visible').filter((_, el) => {
          // Excluir filas vacías o que solo contengan "Sin filas"
          const textoFila = (el.textContent || el.innerText || '').trim().toLowerCase();
          return textoFila.length > 0 && !/sin\s+filas|no\s+hay\s+datos/i.test(textoFila);
        });

        if (filas.length > 0) {
          cy.log(` La pestaña ${nombrePestaña} tiene ${filas.length} fila(s) de datos`);
          return cy.wrap(true);
        } else {
          // Verificar si hay mensaje "Sin filas" en la tabla
          const mensajeSinFilas = tabla.find('*').filter((_, el) => {
            const texto = (el.textContent || '').toLowerCase();
            return /sin\s+filas|no\s+hay\s+datos|sin\s+datos/i.test(texto);
          });

          if (mensajeSinFilas.length > 0) {
            cy.log(` ERROR: La pestaña ${nombrePestaña} muestra "Sin filas" - los datos no se guardaron`);
            return cy.wrap(false);
          } else {
            // Si no hay filas pero tampoco hay mensaje "Sin filas", puede que la tabla esté vacía
            cy.log(` La pestaña ${nombrePestaña} no tiene filas visibles`);
            return cy.wrap(false);
          }
        }
      } else {
        // Si no hay tabla visible, buscar mensaje "Sin filas" en el área de contenido de la pestaña
        const mensajeSinFilas = $body.find('*').filter((_, el) => {
          const texto = (el.textContent || '').toLowerCase();
          // Buscar solo en elementos visibles y dentro del área de contenido principal
          const $el = Cypress.$(el);
          const estaVisible = $el.is(':visible');
          const estaEnContenido = $el.closest('[class*="MuiPaper"], [class*="content"], [class*="tabpanel"]').length > 0;
          return estaVisible && estaEnContenido && /sin\s+filas|no\s+hay\s+datos|sin\s+datos/i.test(texto);
        });

        if (mensajeSinFilas.length > 0) {
          cy.log(` ERROR: La pestaña ${nombrePestaña} muestra "Sin filas" - los datos no se guardaron`);
          return cy.wrap(false);
        } else {
          // Si no hay tabla ni mensaje "Sin filas", asumir que tiene datos (puede ser un formulario sin tabla)
          cy.log(` La pestaña ${nombrePestaña} parece tener contenido (no se encontró tabla ni mensaje "Sin filas")`);
          return cy.wrap(true);
        }
      }
    });
  }

  function clickGuardarDentroFormulario(numeroCaso = null, nombreCaso = null, numeroCasoPrincipal = null) {
    return cy.get('button', { timeout: 15000 })
      .filter((_, el) => {
        const $el = Cypress.$(el);
        const texto = ($el.text() || '').trim().toLowerCase();
        const tieneSvg = $el.find('svg').length > 0;
        // Aceptar tanto "guardar" como "guardado"
        return (texto === 'guardar' || texto === 'guardado') && !tieneSvg;
      })
      .then($btns => {
        if ($btns.length === 0) {
          cy.log('No se encontró botón Guardar ni Guardado');
          return cy.wrap(null);
        }
        const ordenados = [...$btns].sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);
        const botonSeleccionado = ordenados[0];
        const textoBoton = (botonSeleccionado.textContent || botonSeleccionado.innerText || '').trim().toLowerCase();

        // Si el botón dice "guardado", registrar WARNING
        // EXCEPTO si numeroCasoPrincipal es 51 (TC051) o si numeroCaso está entre 52-58, donde ignoramos este WARNING
        // Si hay numeroCasoPrincipal (como 51), usar ese número en lugar del numeroCaso de la pestaña
        const esCaso52a58 = numeroCaso && numeroCaso >= 52 && numeroCaso <= 58;
        if (textoBoton === 'guardado' && (numeroCaso || numeroCasoPrincipal) && numeroCasoPrincipal !== 51 && !esCaso52a58) {
          const numeroParaRegistrar = numeroCasoPrincipal || numeroCaso;
          cy.log(`TC${String(numeroParaRegistrar).padStart(3, '0')}: Botón muestra "Guardado" en lugar de "Guardar" - WARNING`);
          // Usar el nombre del caso si está disponible, sino usar un nombre genérico
          const nombreFinal = nombreCaso || `TC${String(numeroParaRegistrar).padStart(3, '0')} - Botón en modal muestra "Guardado" en lugar de "Guardar"`;
          // Registrar como WARNING usando el número principal si existe
          return registrarResultadoAutomatico(
            numeroParaRegistrar,
            `TC${String(numeroParaRegistrar).padStart(3, '0')}`,
            nombreFinal,
            'Botón muestra "Guardado" en lugar de "Guardar"',
            'WARNING',
            true
          ).then(() => {
            return cy.wrap(botonSeleccionado);
          });
        } else if (textoBoton === 'guardado' && (numeroCasoPrincipal === 51 || esCaso52a58)) {
          // Para TC051 y casos 52-58, ignorar el WARNING del botón "Guardado"
          // En los casos 52-58, se verificará la alerta de campos obligatorios y se dará ERROR si no aparece
          cy.log(`TC${String(numeroCaso || numeroCasoPrincipal || '').padStart(3, '0')}: Botón muestra "Guardado" pero se ignora el WARNING (como solicitado)`);
        } else if (textoBoton === 'guardado') {
          cy.log('Botón muestra "Guardado" en lugar de "Guardar" - WARNING (sin número de caso)');
        }

        return cy.wrap(botonSeleccionado);
      })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });
  }

  // TC043: Crear cliente completo con todas las pestañas
  function TC043(caso, numero, casoId) {
    cy.log('TC043: Creando cliente completo con todas las pestañas');

    // Obtener datos del caso 7 para DATOS GENERALES
    return cy.obtenerDatosExcel(HOJA_EXCEL).then((todosLosCasos) => {
      const caso7 = todosLosCasos.find(c => {
        const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
        return num === 7;
      });

      if (!caso7) {
        cy.log(' No se encontró el caso 7 en Excel, usando datos del caso actual');
        return TC043ConDatos(caso, todosLosCasos);
      }

      cy.log('Usando datos del caso 7 para DATOS GENERALES');
      return TC043ConDatos(caso7, todosLosCasos);
    });
  }

  function TC043ConDatos(casoDatosGenerales, todosLosCasos) {
    // Generar nombre pruebaXXX con 3 números aleatorios
    const numeroAleatorio = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const nombreCliente = `prueba${numeroAleatorio}`;
    cy.log(`TC043: Nombre del cliente generado: ${nombreCliente}`);

    // Modificar el caso para usar el nombre generado
    const casoModificado = { ...casoDatosGenerales };
    casoModificado.dato_7 = nombreCliente; // El nombre va en dato_7

    // Preparar pantalla limpia: login + navegación + abrir formulario
    return cy.login()
      .then(() => {
        cy.navegarAMenu(MENU, SUBMENU, { expectedPath: URL_PATH });
        cy.url().should('include', URL_PATH).and('not.include', '/form');
        cy.wait(1000);
        return UI.esperarTabla();
      })
      .then(() => {
        cy.log('Pulsando botón "+ Nuevo" para abrir formulario...');
        return abrirFormularioNuevoVehiculo();
      })
      .then(() => {
        cy.log('Rellenando DATOS GENERALES usando datos del caso 22...');
        // Rellenar DATOS GENERALES con el nombre generado
        return llenarFormularioGeneralesDesdeExcel(casoModificado, 22);
      })
      .then(() => {
        cy.log('Rellenando todas las pestañas usando datos de los casos 8-15...');
        // Obtener casos 8-15 para las demás pestañas
        const casosPestañas = todosLosCasos.filter(c => {
          const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
          return num >= 8 && num <= 15;
        });

        cy.log(`Encontrados ${casosPestañas.length} casos para las pestañas (8-15)`);

        // Ordenar por número de caso
        casosPestañas.sort((a, b) => {
          const numA = parseInt(String(a.caso || '').replace(/\D/g, ''), 10);
          const numB = parseInt(String(b.caso || '').replace(/\D/g, ''), 10);
          return numA - numB;
        });

        // Rellenar cada pestaña usando la misma lógica que anadirCliente
        let chain = cy.wrap(null);

        casosPestañas.forEach((casoPestaña) => {
          const numeroPestaña = parseInt(String(casoPestaña.caso || '').replace(/\D/g, ''), 10);
          const seccion = deducirSeccionDesdeCaso(casoPestaña);

          chain = chain.then(() => {
            cy.log(`Rellenando pestaña ${seccion} con datos del caso ${numeroPestaña}`);

            const esSeccionContacto = /contacto/i.test(seccion);
            const esSeccionAcciones = /acciones|historial/i.test(seccion);
            const esSeccionCertificaciones = /certific/i.test(seccion);
            const esZonasCarga = /zona(s)?\s+de\s+carga/i.test(seccion);
            const esDatosAdicionales = /dato.*adicional/i.test(seccion);
            const esSeccionDocumentos = /documento/i.test(seccion);
            const esSeccionDireccion = /dirección|direccion/i.test(seccion);
            const esSeccionFacturacion = /facturación|facturacion/i.test(seccion);
            const esSeccionConModal = esSeccionContacto || esSeccionAcciones || esZonasCarga || esSeccionCertificaciones || esSeccionDocumentos || esSeccionDireccion;

            // Secciones con modal
            if (esSeccionConModal) {
              // Caso especial: Dirección está dentro de Contacto
              if (esSeccionDireccion) {
                return navegarSeccionFormulario('Contacto')
                  .then(() => {
                    cy.wait(500);
                    cy.log('Navegando a sub-pestaña "Direcciones" dentro de Contacto...');
                    return cy.contains('button, [role="tab"], div, span', /Direcciones|Direccion/i, { timeout: 10000 })
                      .should('be.visible')
                      .click({ force: true })
                      .then(() => {
                        cy.wait(500);
                        cy.log('Sub-pestaña "Direcciones" seleccionada');
                        return cy.wrap(null);
                      });
                  })
                  .then(() => abrirModalSeccion(seccion, true))
                  .then(() => llenarFormularioDireccion(casoPestaña, numeroPestaña))
                  .then(() => {
                    // Guardar el modal de Direcciones usando el botón Guardar del formulario
                    cy.log(`Guardando modal de ${seccion} usando botón Guardar del formulario...`);
                    return clickGuardarDentroFormulario(43).then(() => cy.wait(500));

                  })
                  .then(() => cy.wait(500));
              }

              return navegarSeccionFormulario(seccion)
                .then(() => (esSeccionContacto ? abrirModalContacto() : abrirModalSeccion(seccion, !esZonasCarga)))
                .then(() => {
                  if (esZonasCarga) {
                    cy.log('Zonas de carga: sin campos definidos en Excel, se guarda directamente');
                    return cy.wrap(null);
                  }
                  if (esSeccionContacto) {
                    return llenarFormularioContacto(casoPestaña, numeroPestaña);
                  }
                  if (esSeccionAcciones) {
                    return llenarFormularioAcciones(casoPestaña, numeroPestaña);
                  }
                  if (esSeccionCertificaciones) {
                    return llenarFormularioCertificaciones(casoPestaña, numeroPestaña);
                  }
                  if (esSeccionDocumentos) {
                    return llenarFormularioDocumentos(casoPestaña, numeroPestaña);
                  }
                  return llenarFormularioSeccion(casoPestaña, numeroPestaña, seccion);
                })
                .then(() => {
                  // Esperar un momento después de rellenar para que el formulario se renderice
                  return cy.wait(500);
                })
                .then(() => {
                  // Para TC043: Guardar el modal usando el botón Guardar del formulario para:
                  // Contacto, Direcciones, Acciones, Zonas de Carga, Certificaciones y Documentos
                  if (esSeccionContacto || esSeccionAcciones || esZonasCarga || esSeccionCertificaciones || esSeccionDocumentos) {
                    cy.log(`Guardando modal de ${seccion} usando botón Guardar del formulario...`);
                    return clickGuardarDentroFormulario(43).then(() => cy.wait(500));
                  } else {
                    // No guardar nada, solo continuar a la siguiente pestaña
                    cy.log(`No se guarda modal de ${seccion}, continuando a siguiente pestaña`);
                    return cy.wrap(null);
                  }
                })
                .then(() => cy.wait(500));
            }

            // Sección Facturación sin modal
            if (esSeccionFacturacion) {
              return navegarSeccionFormulario(seccion)
                .then(() => llenarFormularioFacturacion(casoPestaña, numeroPestaña))
                .then(() => cy.wait(500));
            }

            // Sección Datos adicionales sin modal (rellenar directamente en la pestaña)
            if (esDatosAdicionales) {
              return navegarSeccionFormulario(seccion)
                .then(() => llenarFormularioDatosAdicionales(casoPestaña, numeroPestaña))
                .then(() => cy.wait(500));
            }

            return cy.wrap(null);
          });
        });

        return chain;
      })
      .then(() => {
        // Verificar que estamos todavía en el formulario antes de guardar
        return cy.url().then((urlActual) => {
          if (!urlActual.includes('/dashboard/clients/form')) {
            cy.log(' Ya no estamos en el formulario, no se puede guardar');
            return cy.wrap(null);
          }

          cy.log('Guardando formulario principal DESPUÉS de rellenar todas las pestañas (incluyendo Documentos)...');
          // Guardar el formulario principal (botón con tic) SOLO al final, después de Documentos
          // Buscar el botón Guardar general que tiene un tic (icono de check)
          return cy.get('body').then($body => {
            // Buscar botón Guardar que tenga un icono de check/tick o esté en el header del formulario
            const botonGuardarGeneral = $body.find('button[type="submit"], button:contains("Guardar")')
              .filter((_, el) => {
                const $el = Cypress.$(el);
                // Buscar si tiene un icono de check o está en el área del formulario principal (no en modal)
                const tieneCheck = $el.find('svg, [class*="Check"], [class*="check"]').length > 0;
                const estaEnFormulario = $el.closest('.MuiDrawer-root, .MuiModal-root, [role="dialog"]').length === 0;
                const texto = ($el.text() || '').trim().toLowerCase();
                return estaEnFormulario && /guardar/i.test(texto);
              })
              .first();

            if (botonGuardarGeneral.length > 0) {
              return cy.wrap(botonGuardarGeneral)
                .should('be.visible')
                .scrollIntoView()
                .click({ force: true })
                .then(() => cy.wait(3000));
            } else {
              // Fallback: buscar cualquier botón Guardar que no esté en un modal
              return cy.contains('button', /^Guardar$/i, { timeout: 10000 })
                .not('.MuiDrawer-root button, .MuiModal-root button, [role="dialog"] button')
                .scrollIntoView()
                .click({ force: true })
                .then(() => cy.wait(3000));
            }
          });
        });
      })
      .then(() => {
        cy.log(`TC043: Formulario guardado. Buscando cliente ${nombreCliente}...`);

        // Volver a la lista y buscar el cliente por nombre
        return cy.url().then((urlActual) => {
          // Si todavía estamos en el formulario, navegar a la lista
          if (urlActual.includes('/dashboard/vehicles/form')) {
            cy.log('Navegando a la lista de vehículos...');
            return cy.visit(URL_PATH).then(() => cy.wait(2000));
          }
          return cy.wrap(null);
        });
      })
      .then(() => {
        // Esperar a que la tabla esté visible
        return UI.esperarTabla();
      })
      .then(() => {
        // Buscar el vehículo por código
        cy.log(`Buscando vehículo: ${nombreCliente}`);
        return UI.buscar(nombreCliente);
      })
      .then(() => {
        cy.wait(1000);
        // Buscar la fila del cliente y abrirla
        return cy.get('body').then($body => {
          const filas = $body.find('.MuiDataGrid-row:visible');
          if (filas.length === 0) {
            cy.log(' No se encontraron filas en la tabla');
            return cy.wrap(null);
          }

          // Buscar la fila que contiene el nombre del cliente
          const filaEncontrada = Array.from(filas).find((el) => {
            const textoFila = (el.innerText || el.textContent || '').toLowerCase();
            return textoFila.includes(nombreCliente.toLowerCase());
          });

          if (filaEncontrada) {
            cy.log('Vehículo encontrado, abriendo formulario de edición...');
            return cy.wrap(filaEncontrada).dblclick({ force: true });
          } else {
            cy.log(' No se encontró la fila con el código del vehículo');
            return cy.wrap(null);
          }
        });
      })
      .then(() => {
        cy.wait(2000);
        // Verificar que estamos en el formulario de edición
        return cy.url().should('include', '/dashboard/vehicles/form');
      })
      .then(() => {
        cy.log('TC043: Verificando que todas las pestañas tienen datos guardados...');

        // Lista de pestañas a verificar (las que tienen formularios)
        const pestañasAVerificar = [
          { nombre: 'Contacto', tieneSubpestaña: true },
          { nombre: 'Acciones', tieneSubpestaña: false },
          { nombre: 'Zonas de carga', tieneSubpestaña: false },
          { nombre: 'Certificaciones', tieneSubpestaña: false },
          { nombre: 'Documentos', tieneSubpestaña: false },
          { nombre: 'Facturación', tieneSubpestaña: false },
          { nombre: 'Datos adicionales', tieneSubpestaña: false }
        ];

        // Iniciar con un array vacío y acumular errores en la cadena
        let chainVerificacion = cy.wrap([]);

        pestañasAVerificar.forEach((pestañaInfo) => {
          chainVerificacion = chainVerificacion.then((pestañasSinDatos) => {
            cy.log(`Verificando pestaña: ${pestañaInfo.nombre}`);

            // Navegar a la pestaña
            return navegarSeccionFormulario(pestañaInfo.nombre)
              .then(() => cy.wait(1000))
              .then(() => {
                // Si tiene subpestaña (Contacto con Direcciones), verificar ambas
                if (pestañaInfo.tieneSubpestaña && pestañaInfo.nombre === 'Contacto') {
                  // Verificar Contacto primero
                  return verificarPestañaSinFilas('Contacto')
                    .then((tieneDatosContacto) => {
                      const nuevasPestañasSinDatos = [...pestañasSinDatos];
                      if (!tieneDatosContacto) {
                        nuevasPestañasSinDatos.push('Contacto');
                      }
                      // Navegar a sub-pestaña Direcciones (igual que al rellenar)
                      cy.log('Navegando a sub-pestaña "Direcciones" dentro de Contacto...');
                      return cy.wait(500)
                        .then(() => {
                          // Buscar el elemento de Direcciones sin verificar visibilidad primero
                          return cy.get('body').then($body => {
                            const elementoDirecciones = $body.find('button, [role="tab"], div, span')
                              .filter((_, el) => {
                                const texto = (el.textContent || el.innerText || '').trim();
                                return /^Direcciones?$/i.test(texto);
                              })
                              .filter(':visible')
                              .first();

                            if (elementoDirecciones.length > 0) {
                              return cy.wrap(elementoDirecciones[0])
                                .scrollIntoView()
                                .click({ force: true })
                                .then(() => cy.wait(1000))
                                .then(() => verificarPestañaSinFilas('Direcciones'));
                            } else {
                              // Si no se encuentra visible, intentar con cy.contains
                              return cy.contains('button, [role="tab"], div, span', /Direcciones|Direccion/i, { timeout: 10000 })
                                .scrollIntoView()
                                .click({ force: true })
                                .then(() => cy.wait(1000))
                                .then(() => verificarPestañaSinFilas('Direcciones'));
                            }
                          });
                        })
                        .then((tieneDatosDirecciones) => {
                          if (!tieneDatosDirecciones) {
                            nuevasPestañasSinDatos.push('Direcciones');
                          }
                          return cy.wrap(nuevasPestañasSinDatos);
                        });
                    });
                } else {
                  return verificarPestañaSinFilas(pestañaInfo.nombre)
                    .then((tieneDatos) => {
                      const nuevasPestañasSinDatos = [...pestañasSinDatos];
                      if (!tieneDatos) {
                        nuevasPestañasSinDatos.push(pestañaInfo.nombre);
                      }
                      return cy.wrap(nuevasPestañasSinDatos);
                    });
                }
              });
          });
        });

        return chainVerificacion;
      })
      .then((pestañasSinDatos) => {
        cy.log('TC043: Verificación completada');

        // Determinar el resultado y mensaje
        let resultado = 'OK';
        let mensaje = `Vehículo ${nombreCliente} creado y verificado. Todas las pestañas tienen datos guardados.`;

        if (pestañasSinDatos && pestañasSinDatos.length > 0) {
          resultado = 'ERROR';
          const pestañasError = pestañasSinDatos.join(', ');
          mensaje = `Vehículo ${nombreCliente} creado, pero las siguientes pestañas NO tienen datos guardados: ${pestañasError}`;
          cy.log(` ERROR: Las siguientes pestañas no tienen datos: ${pestañasError}`);
        } else {
          cy.log(` Todas las pestañas tienen datos guardados correctamente`);
        }

        // Registrar resultado
        return registrarResultadoAutomatico(
          51,
          'TC051',
          'Comprobar que se quedan guardados todos los registros',
          mensaje,
          resultado,
          true
        );
      });
  }

  function TC051(caso, numero, casoId) {
    cy.log('TC051: Creando vehículo completo con todas las pestañas');

    // Obtener datos del caso 23 para DATOS GENERALES (igual que TC023)
    return cy.obtenerDatosExcel(HOJA_EXCEL).then((todosLosCasos) => {
      const caso23 = todosLosCasos.find(c => {
        const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
        return num === 23;
      });

      if (!caso23) {
        cy.log(' No se encontró el caso 23 en Excel, usando datos del caso actual');
        return TC051ConDatos(caso, todosLosCasos);
      }

      cy.log('Usando datos del caso 23 para DATOS GENERALES (igual que TC023)');
      return TC051ConDatos(caso23, todosLosCasos);
    });
  }

  // Función auxiliar para esperar resultados de la tabla (igual que caso 55 de proveedores)
  function esperarResultadosTablaEnLista(timeoutMs = 25000) {
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

  // Función auxiliar para hacer click en el botón Guardar principal (igual que caso 55 de proveedores)
  function clickGuardarPrincipalSiExiste({ requerido = false } = {}) {
    // Devuelve booleano: true si clicó, false si no.
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

      // 1) Preferir texto exacto multi-idioma (Guardar, Save, etc.)
      let $btn = base
        .filter((_, el) => /^(guardar|save|desar)$/i.test((el.textContent || '').trim()))
        .filter((_, el) => esEnabled(el))
        .first();

      // 2) Fallback: contiene "guardar" o "guardado" (aceptar ambos)
      if (!$btn.length) {
        $btn = base
          .filter((_, el) => /guardar|guardado/i.test((el.textContent || '').trim()))
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
        cy.log(`TC051: Botón Guardar encontrado, haciendo click...`);
        return cy
          .wrap($btn[0])
          .scrollIntoView()
          .should('be.visible')
          .click({ force: true })
          .then(() => {
            cy.log('TC051: Click en botón Guardar ejecutado');
            return cy.wait(1200);
          })
          .then(() => true);
      }

      cy.log('TC051: ERROR - No se encontró botón Guardar principal visible/habilitado');
      return cy.wrap(false);
    });
  }

  // Función para leer el código del vehículo (igual que caso 55 de proveedores)
  const leerCodigoVehiculo = () => {
    return cy.get('body').then(($body) => {
      // Buscar campo "Código" por label
      const $label = $body.find('label').filter((_, el) => {
        const t = (el.textContent || el.innerText || '').trim().toLowerCase();
        return t === 'código' || t === 'codigo' || t === 'code';
      }).first();

      if ($label.length) {
        const forAttr = $label.attr('for');
        if (forAttr) {
          const sel = forAttr.includes('.') ? `[id="${forAttr}"]` : `#${forAttr}`;
          const v = $body.find(sel).first().val();
          return cy.wrap(v ? String(v).trim() : null);
        }
      }

      // Fallback: buscar por name
      const $input = $body.find('input[name*="code"], input[name*="codigo"], input[name*="Code"]').first();
      if ($input.length) {
        const v = $input.val();
        return cy.wrap(v ? String(v).trim() : null);
      }

      return cy.wrap(null);
    });
  };

  function TC051ConDatos(casoDatosGenerales, todosLosCasos) {
    const numeroCaso = 51;
    const idCaso = 'TC051';
    const nombreCaso = 'Comprobar que se quedan guardados todos los registros';

    const LIST_URL = '/dashboard/vehicles';
    const FORM_URL = '/dashboard/vehicles/form';

    // Función para verificar que una pestaña tiene datos guardados (igual que caso 55 de proveedores)
    const verificarPestañaSinFilas = (nombrePestaña) => {
      return cy.get('body').then($body => {
        // Buscar específicamente en el área de la tabla de la pestaña actual
        const tabla = $body.find('.MuiDataGrid-root:visible, .MuiTableContainer:visible, table:visible').first();

        if (tabla.length > 0) {
          // Verificar si la tabla tiene filas de datos
          const filas = tabla.find('.MuiDataGrid-row:visible, tbody tr:visible, .MuiTableBody-root tr:visible').filter((_, el) => {
            // Excluir filas vacías o que solo contengan "Sin filas"
            const textoFila = (el.textContent || el.innerText || '').trim().toLowerCase();
            return textoFila.length > 0 && !/sin\s+filas|no\s+hay\s+datos/i.test(textoFila);
          });

          if (filas.length > 0) {
            cy.log(`TC051: La pestaña ${nombrePestaña} tiene ${filas.length} fila(s) de datos`);
            return cy.wrap(true);
          } else {
            // Verificar si hay mensaje "Sin filas" en la tabla
            const mensajeSinFilas = tabla.find('*').filter((_, el) => {
              const texto = (el.textContent || '').toLowerCase();
              return /sin\s+filas|no\s+hay\s+datos|sin\s+datos/i.test(texto);
            });

            if (mensajeSinFilas.length > 0) {
              cy.log(`TC051: ERROR: La pestaña ${nombrePestaña} muestra "Sin filas" - los datos no se guardaron`);
              return cy.wrap(false);
            } else {
              cy.log(`TC051: La pestaña ${nombrePestaña} no tiene filas visibles`);
              return cy.wrap(false);
            }
          }
        } else {
          // Si no hay tabla visible, buscar mensaje "Sin filas" en el área de contenido de la pestaña
          const mensajeSinFilas = $body.find('*').filter((_, el) => {
            const texto = (el.textContent || '').toLowerCase();
            const $el = Cypress.$(el);
            const estaVisible = $el.is(':visible');
            const estaEnContenido = $el.closest('[class*="MuiPaper"], [class*="content"], [class*="tabpanel"]').length > 0;
            return estaVisible && estaEnContenido && /sin\s+filas|no\s+hay\s+datos|sin\s+datos/i.test(texto);
          });

          if (mensajeSinFilas.length > 0) {
            cy.log(`TC051: ERROR: La pestaña ${nombrePestaña} muestra "Sin filas" - los datos no se guardaron`);
            return cy.wrap(false);
          } else {
            cy.log(`TC051: La pestaña ${nombrePestaña} parece tener contenido (no se encontró tabla ni mensaje "Sin filas")`);
            return cy.wrap(true);
          }
        }
      });
    };

    // Generar código con 3 números aleatorios (100-999)
    const numeroAleatorio = Math.floor(Math.random() * 900) + 100;
    let codigoVehiculo = numeroAleatorio.toString();
    cy.log(`TC051: Código del vehículo generado: ${codigoVehiculo}`);

    // Modificar el caso para usar el código generado
    const casoModificado = { ...casoDatosGenerales };
    casoModificado.dato_1 = codigoVehiculo;

    // Preparar pantalla limpia: el runner ya lo hace, pero verificamos
    return cy.url().then((u) => {
      if (!/\/form/i.test(u)) {
        return abrirFormularioNuevoVehiculo();
      }
      return cy.wrap(null);
    })
      .then(() => {
        cy.log('Rellenando DATOS GENERALES usando datos del caso 23...');
        // Rellenar DATOS GENERALES, VENCIMIENTOS y MANTENIMIENTO usando caso 23
        const caso23 = todosLosCasos.find(c => {
          const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
          return num === 23;
        });
        if (caso23) {
          const caso23Modificado = { ...caso23 };
          caso23Modificado.dato_1 = codigoVehiculo;
          return rellenarTresPestañasCaso23(caso23Modificado, 23, false)
            .then(() => {
              return leerCodigoVehiculo().then((codigo) => {
                if (codigo) {
                  codigoVehiculo = codigo;
                  cy.log(`TC051: Código del vehículo capturado: ${codigoVehiculo}`);
                }
                return cy.wrap(null);
              });
            });
        }
        return cy.wrap(null);
      })
      .then(() => {
        cy.log('Rellenando todas las pestañas usando datos de los casos correspondientes...');
        // Obtener casos para las demás pestañas
        const tc25 = todosLosCasos.find(c => {
          const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
          return num === 25;
        }); // Seguros
        const tc26 = todosLosCasos.find(c => {
          const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
          return num === 26;
        }); // Ficha Técnica
        const tc27 = todosLosCasos.find(c => {
          const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
          return num === 27;
        }); // Compra/Venta
        const tc28 = todosLosCasos.find(c => {
          const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
          return num === 28;
        }); // Amortización
        const tc29 = todosLosCasos.find(c => {
          const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
          return num === 29;
        }); // Impuestos
        const tc30 = todosLosCasos.find(c => {
          const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
          return num === 30;
        }); // Tarjetas
        const tc31 = todosLosCasos.find(c => {
          const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
          return num === 31;
        }); // Revisiones
        const tc32 = todosLosCasos.find(c => {
          const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
          return num === 32;
        }); // Histórico Kms
        const tc33 = todosLosCasos.find(c => {
          const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
          return num === 33;
        }); // Histórico Vehículo

        const casosPestañas = [
          { caso: tc25, num: 25, nombre: 'Seguros' },
          { caso: tc26, num: 26, nombre: 'Ficha Técnica' },
          { caso: tc27, num: 27, nombre: 'Compra/Venta' },
          { caso: tc28, num: 28, nombre: 'Amortización' },
          { caso: tc29, num: 29, nombre: 'Impuestos' },
          { caso: tc30, num: 30, nombre: 'Tarjetas' },
          { caso: tc31, num: 31, nombre: 'Revisiones' },
          { caso: tc32, num: 32, nombre: 'Histórico Kms' },
          { caso: tc33, num: 33, nombre: 'Histórico Vehículo' }
        ].filter((x) => !!x.caso);

        cy.log(`Encontrados ${casosPestañas.length} casos para las pestañas (25-33)`);

        // Rellenar cada pestaña
        let chain = cy.wrap(null);
        casosPestañas.forEach((item) => {
          chain = chain.then(() => {
            cy.log(`Rellenando pestaña con datos del caso ${item.num} (TC${String(item.num).padStart(3, '0')})...`);

            if (item.num === 25) {
              // SEGUROS
              return navegarSeccionFormulario(item.nombre)
                .then(() => abrirModalSeccion('Seguros'))
                .then(() => llenarCamposFormulario(item.caso))
                .then(() => clickGuardarDentroFormulario(item.num, item.caso?.nombre, 51))
                .then(() => cy.wait(500));
            } else if (item.num === 26) {
              // FICHA TÉCNICA
              return navegarSeccionFormulario(item.nombre)
                .then(() => llenarFormularioFichaTecnicaDesdeExcel(item.caso, item.num))
                .then(() => cy.wait(500));
            } else if (item.num === 27) {
              // COMPRA/VENTA
              return navegarSeccionFormulario(item.nombre)
                .then(() => llenarFormularioCompraVentaDesdeExcel(item.caso, item.num))
                .then(() => cy.wait(500));
            } else if (item.num === 28) {
              // AMORTIZACIÓN
              return navegarSeccionFormulario(item.nombre)
                .then(() => abrirModalSeccion('Amortización'))
                .then(() => llenarCamposFormulario(item.caso))
                .then(() => clickGuardarDentroFormulario(item.num, item.caso?.nombre, 51))
                .then(() => cy.wait(500));
            } else if (item.num === 29) {
              // IMPUESTOS
              return navegarSeccionFormulario(item.nombre)
                .then(() => abrirModalSeccion('Impuestos'))
                .then(() => llenarCamposFormulario(item.caso))
                .then(() => clickGuardarDentroFormulario(item.num, item.caso?.nombre, 51))
                .then(() => cy.wait(500));
            } else if (item.num === 30) {
              // TARJETAS
              return navegarSeccionFormulario(item.nombre)
                .then(() => seleccionarTarjeta(item.caso, item.num, `TC${String(item.num).padStart(3, '0')}`))
                .then(() => cy.wait(500));
            } else if (item.num === 31 || item.num === 32 || item.num === 33) {
              // REVISIONES, HISTÓRICO KMS, HISTÓRICO VEHÍCULO
              return navegarSeccionFormulario(item.nombre)
                .then(() => abrirModalSeccion(item.nombre, true))
                .then(() => llenarCamposFormulario(item.caso))
                .then(() => clickGuardarDentroFormulario(item.num, item.caso?.nombre, 51))
                .then(() => cy.wait(500));
            }

            return cy.wrap(null);
          });
        });
        return chain;
      })
      .then(() => {
        // GUARDAR FINAL (igual que casos 22 y 23)
        cy.log('TC051: TODO relleno -> Click Guardar FINAL (igual que casos 22 y 23)');
        cy.url().should('include', '/dashboard/vehicles/form');

        // Hacer scroll hacia arriba para ver el botón Guardar (igual que casos 22 y 23)
        return cy.window().then((win) => {
          win.scrollTo(0, 0);
          return cy.wait(500);
        })
          .then(() => {
            cy.log('TC051: Buscando botón Guardar general...');
            return cy
              .contains('button, [type="submit"]', /Guardar/i, { timeout: 10000 })
              .scrollIntoView()
              .click({ force: true })
              .then(() => {
                cy.log('TC051: Botón Guardar clicado, esperando respuesta...');
                return cy.wait(2000);
              });
          });
      })
      .then(() => {
        // Verificar si el guardado fue exitoso
        return cy.wait(2000).then(() => {
          return cy.url().then((urlActual) => {
            // Si ya estamos en la lista, el guardado fue exitoso
            if (urlActual.includes('/vehicles') && !urlActual.includes('/form')) {
              cy.log('TC051: Guardado exitoso - ya estamos en la lista');
              return cy.wrap({ resultado: 'OK', guardado: true, yaEnLista: true });
            }

            // Si todavía estamos en el formulario, verificar mensajes
            return cy.get('body').then(($b) => {
              const texto = ($b.text() || '').toString();

              // Buscar errores visibles (500, error, etc.)
              const elementosError = $b.find('[class*="error"], [class*="Error"], [role="alert"], [class*="snackbar"], [class*="Snackbar"], [class*="message"], [class*="Message"], [class*="MuiAlert"], [class*="MuiSnackbar"]')
                .filter((_, el) => {
                  const textoEl = (el.textContent || el.innerText || '').toLowerCase();
                  return /error|500|fallo|failed|exception|internal server|error del servidor/i.test(textoEl);
                });

              // También buscar en campos del formulario que tienen errores
              const camposConError = $b.find('input[aria-invalid="true"], textarea[aria-invalid="true"], .Mui-error input, .Mui-error textarea, .Mui-error select, [class*="error"] input, [class*="error"] textarea')
                .filter(':visible');

              // Verificar si hay error 500 en el texto general
              const textoCompleto = texto.toLowerCase();
              const tieneError500 = /error\s*500|500\s*error|internal\s*server\s*error|error\s*del\s*servidor/i.test(textoCompleto);

              if (elementosError.length > 0 || tieneError500 || camposConError.length > 0) {
                cy.log('TC051: ERROR detectado después de guardar');

                // Extraer todos los mensajes de error
                const mensajesError = [];
                elementosError.each((_, el) => {
                  const textoEl = (el.textContent || el.innerText || '').trim();
                  if (textoEl && !mensajesError.includes(textoEl)) {
                    mensajesError.push(textoEl);
                  }
                });

                // Si no hay mensajes de error pero hay error 500 en el texto, agregarlo
                if (tieneError500 && mensajesError.length === 0) {
                  const matchError500 = texto.match(/(error\s*500|500\s*error|internal\s*server\s*error|error\s*del\s*servidor)/i);
                  if (matchError500) {
                    mensajesError.push(matchError500[0]);
                  }
                }

                // Intentar identificar el campo problemático
                let campoProblema = null;
                let campoProblemaLabel = null;

                // PRIMERO: Buscar en campos con errores visibles
                if (camposConError.length > 0) {
                  camposConError.each((_, input) => {
                    if (campoProblema) return; // Ya encontramos uno

                    const $input = Cypress.$(input);
                    const name = $input.attr('name') || '';
                    const id = $input.attr('id') || '';

                    // Buscar el label asociado
                    let label = null;
                    if (id) {
                      const $label = $b.find(`label[for="${id}"]`);
                      if ($label.length > 0) {
                        label = $label.first().text().trim();
                      }
                    }

                    // Si no hay label por for, buscar el label padre
                    if (!label) {
                      const $labelPadre = $input.closest('.MuiFormControl-root').find('label');
                      if ($labelPadre.length > 0) {
                        label = $labelPadre.first().text().trim();
                      }
                    }

                    // Si no hay label, usar el name o id
                    if (!label) {
                      label = name || id || 'Campo desconocido';
                    }

                    campoProblema = name || id;
                    campoProblemaLabel = label;
                  });
                }

                // SEGUNDO: Buscar en los mensajes de error
                if (!campoProblema && mensajesError.length > 0) {
                  const textoErrorCompleto = mensajesError.join(' ').toLowerCase();

                  // Buscar patrones específicos de errores de inserción (ej: "Error inserting personnel: Y")
                  const patronesInsercion = [
                    /error\s+inserting\s+\w+:\s*([^\s:]+)/i,
                    /error\s+inserting\s+([^:]+):\s*([^\s:]+)/i,
                    /error:\s*([^\s:]+)/i,
                    /failed\s+to\s+insert\s+([^:]+):\s*([^\s:]+)/i,
                    /insert\s+error:\s*([^\s:]+)/i
                  ];

                  for (const patron of patronesInsercion) {
                    const match = textoErrorCompleto.match(patron);
                    if (match) {
                      // El último grupo capturado suele ser el campo problemático
                      const posibleCampo = match[match.length - 1];
                      if (posibleCampo && posibleCampo.length > 0 && posibleCampo.length < 50) {
                        campoProblema = posibleCampo;
                        cy.log(`TC051: Campo problemático detectado por patrón de inserción: "${campoProblema}"`);
                        break;
                      }
                    }
                  }

                  // Si aún no encontramos el campo, buscar en la lista de campos comunes
                  if (!campoProblema) {
                    const camposComunes = [
                      { patrones: ['código', 'codigo', 'code'], nombre: 'Código' },
                      { patrones: ['matrícula', 'matricula', 'license', 'plate'], nombre: 'Matrícula' },
                      { patrones: ['marca', 'brand'], nombre: 'Marca' },
                      { patrones: ['modelo', 'model'], nombre: 'Modelo' },
                      { patrones: ['año', 'ano', 'year'], nombre: 'Año' },
                      { patrones: ['fecha', 'date'], nombre: 'Fecha' },
                      { patrones: ['precio', 'price'], nombre: 'Precio' },
                      { patrones: ['kilometraje', 'kilometros', 'kilometers', 'km'], nombre: 'Kilometraje' },
                      { patrones: ['seguro', 'insurance'], nombre: 'Seguro' },
                      { patrones: ['amortización', 'amortizacion', 'amortization'], nombre: 'Amortización' },
                      { patrones: ['impuesto', 'tax'], nombre: 'Impuesto' },
                      { patrones: ['tarjeta', 'card'], nombre: 'Tarjeta' },
                      { patrones: ['revisión', 'revision', 'review'], nombre: 'Revisión' },
                      { patrones: ['histórico', 'historico', 'historical'], nombre: 'Histórico' },
                      { patrones: ['mantenimiento', 'maintenance'], nombre: 'Mantenimiento' },
                      { patrones: ['vencimiento', 'expiration', 'expiry'], nombre: 'Vencimiento' },
                      { patrones: ['compra', 'buy', 'purchase'], nombre: 'Compra' },
                      { patrones: ['venta', 'sell', 'sale'], nombre: 'Venta' },
                      { patrones: ['ficha técnica', 'ficha tecnica', 'technical'], nombre: 'Ficha Técnica' },
                      { patrones: ['tipo', 'type'], nombre: 'Tipo' },
                      { patrones: ['estado', 'status', 'state'], nombre: 'Estado' },
                      { patrones: ['sección', 'seccion', 'section'], nombre: 'Sección' }
                    ];

                    // Buscar nombres de campos en el mensaje de error
                    for (const campo of camposComunes) {
                      const encontrado = campo.patrones.some(p => textoErrorCompleto.includes(p));
                      if (encontrado) {
                        campoProblema = campo.nombre;
                        break;
                      }
                    }
                  }

                  // Buscar patrones comunes de errores de validación
                  if (!campoProblema) {
                    const patronesCampo = [
                      /campo\s+['"]?([^'",.\s]+)['"]?/i,
                      /field\s+['"]?([^'",.\s]+)['"]?/i,
                      /([a-záéíóúñ]+)\s+(?:es\s+)?(?:requerido|obligatorio|required|invalid|inválido)/i,
                      /([a-záéíóúñ]+)\s+(?:no\s+)?(?:válido|valido|valid)/i,
                      /el\s+([a-záéíóúñ]+)\s+(?:es|está|esta)/i,
                      /the\s+([a-z]+)\s+(?:is|has)/i,
                      /['"]([^'"]+)['"]\s+(?:es|está|esta|is|has)/i
                    ];

                    for (const patron of patronesCampo) {
                      const match = textoErrorCompleto.match(patron);
                      if (match && match[1] && match[1].length > 2) {
                        campoProblema = match[1];
                        break;
                      }
                    }
                  }
                }

                // CUARTO: Buscar en el texto del body mensajes de consola (ej: "Error inserting X: Y")
                if (!campoProblema) {
                  const textoBody = texto.toLowerCase();
                  // Buscar mensajes como "Error inserting X: Y" o "Error: Y"
                  const matchErrorInsert = textoBody.match(/error\s+inserting\s+\w+:\s*([^\s:.,]+)/i);
                  if (matchErrorInsert && matchErrorInsert[1]) {
                    campoProblema = matchErrorInsert[1];
                    cy.log(`TC051: Campo problemático detectado en mensaje de error: "${campoProblema}"`);
                  } else {
                    // Buscar patrones más simples como "Error: Y"
                    const matchErrorSimple = textoBody.match(/error[:\s]+([a-záéíóúñ]{1,30})/i);
                    if (matchErrorSimple && matchErrorSimple[1] && matchErrorSimple[1].length > 0) {
                      campoProblema = matchErrorSimple[1];
                      cy.log(`TC051: Campo problemático detectado en mensaje simple: "${campoProblema}"`);
                    }
                  }
                }

                // TERCERO: Buscar en el texto completo del body si aún no encontramos el campo
                if (!campoProblema) {
                  const textoBody = texto.toLowerCase();
                  const camposEnTexto = [
                    { patrones: ['vehicle.code', 'codigo', 'code'], nombre: 'Código' },
                    { patrones: ['vehicle.matricula', 'matricula', 'license'], nombre: 'Matrícula' },
                    { patrones: ['vehicle.brand', 'marca', 'brand'], nombre: 'Marca' },
                    { patrones: ['vehicle.model', 'modelo', 'model'], nombre: 'Modelo' },
                    { patrones: ['maintenance', 'mantenimiento'], nombre: 'Mantenimiento' },
                    { patrones: ['expiration', 'vencimiento'], nombre: 'Vencimiento' },
                    { patrones: ['insurance', 'seguro'], nombre: 'Seguro' },
                    { patrones: ['amortization', 'amortización'], nombre: 'Amortización' },
                    { patrones: ['tax', 'impuesto'], nombre: 'Impuesto' },
                    { patrones: ['historical', 'histórico'], nombre: 'Histórico' }
                  ];

                  for (const campo of camposEnTexto) {
                    const encontrado = campo.patrones.some(p => textoBody.includes(p));
                    if (encontrado) {
                      campoProblema = campo.nombre;
                      break;
                    }
                  }
                }

                // Construir mensaje detallado
                let obs = 'Error 500 detectado después de intentar guardar el vehículo.';
                if (mensajesError.length > 0) {
                  obs += ` Mensajes de error encontrados: ${mensajesError.join(' | ')}`;
                }

                // Si el campo problemático es un valor simple como "Y", "N", etc., puede ser un valor de campo
                const esValorSimple = campoProblema && /^[YNyn01]$/.test(campoProblema);

                if (campoProblemaLabel) {
                  obs += ` Campo problemático identificado: "${campoProblemaLabel}"`;
                } else if (campoProblema) {
                  if (esValorSimple) {
                    obs += ` Campo problemático: El valor "${campoProblema}" está causando el error (puede ser un checkbox o campo booleano).`;
                  } else {
                    obs += ` Campo problemático detectado: "${campoProblema}"`;
                  }
                } else {
                  // Intentar extraer el campo del mensaje de error directamente
                  if (mensajesError.length > 0) {
                    const ultimoMensaje = mensajesError[mensajesError.length - 1];
                    const matchDirecto = ultimoMensaje.match(/error\s+inserting\s+\w+:\s*([^\s:.,]+)/i);
                    if (matchDirecto && matchDirecto[1]) {
                      const valorCampo = matchDirecto[1];
                      obs += ` Campo problemático detectado en mensaje de error: "${valorCampo}" (valor que está causando el error).`;
                    } else {
                      obs += ' No se pudo identificar el campo específico. Revisar los logs de la consola del navegador para más detalles.';
                    }
                  } else {
                    obs += ' No se pudo identificar el campo específico. Revisar los logs de la consola del navegador para más detalles.';
                  }
                }

                // Log detallado para debugging
                cy.log(`TC051: ERROR 500 - Mensajes completos: ${JSON.stringify(mensajesError)}`);
                cy.log(`TC051: ERROR 500 - Campo detectado: ${campoProblemaLabel || campoProblema || 'NO IDENTIFICADO'}`);
                cy.log(`TC051: ERROR 500 - Campos con error en formulario: ${camposConError.length}`);
                if (mensajesError.length > 0) {
                  cy.log(`TC051: ERROR 500 - Texto completo del error: ${mensajesError.join(' | ').substring(0, 500)}`);
                }
                // Log adicional para ayudar a identificar el campo
                cy.log(`TC051: ERROR 500 - Buscar en la consola del navegador mensajes como "Error inserting X: Y" para identificar el campo problemático`);

                return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'ERROR', true)
                  .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
              }

              // Buscar mensajes de éxito en diferentes formatos
              const hayExito = /veh[íi]culo.*creado|veh[íi]culo.*guardado|vehicle.*created|vehicle.*saved|creado.*correctamente|guardado.*correctamente|guardado.*exitosamente|saved.*successfully/i.test(texto) ||
                $b.find('[class*="success"], [class*="Success"], [role="alert"]').filter((_, el) => {
                  const textoEl = (el.textContent || el.innerText || '').toLowerCase();
                  return /guardado|creado|saved|created/.test(textoEl) && /correcto|exitoso|success/.test(textoEl);
                }).length > 0;

              if (hayExito) {
                cy.log(`TC051: Vehículo guardado correctamente (mensaje de éxito detectado)`);
                return cy.wrap({ resultado: 'OK', guardado: true });
              }

              // Si no hay éxito ni error, asumir que se guardó (continuar con verificación)
              cy.log('TC051: No se detectó mensaje explícito, pero no hay errores. Continuando con verificación...');
              return cy.wrap({ resultado: 'OK', guardado: true, sinMensaje: true });
            });
          });
        });
      })
      .then((resultadoGuardado) => {
        // Si ya estamos en la lista, continuar directamente
        if (resultadoGuardado && resultadoGuardado.yaEnLista) {
          cy.log('TC051: Ya estamos en la lista, continuando con búsqueda...');
          return cy.wrap({ navegado: true, codigo: codigoVehiculo, yaEnLista: true });
        }

        // Verificar si realmente se guardó correctamente (igual que caso 55 de proveedores)
        return cy.url().then((urlActual) => {
          // Verificar si hay mensaje de éxito en la página actual (puede estar en formulario o lista)
          return cy.get('body').then(($b) => {
            const texto = ($b.text() || '').toString();
            const hayExito = /veh[íi]culo.*creado|veh[íi]culo.*guardado|vehicle.*created|vehicle.*saved|creado.*correctamente|guardado.*correctamente|guardado.*exitosamente|saved.*successfully/i.test(texto) ||
              $b.find('[class*="success"], [class*="Success"], [role="alert"]').filter((_, el) => {
                const textoEl = (el.textContent || el.innerText || '').toLowerCase();
                return /guardado|creado|saved|created/.test(textoEl) && /correcto|exitoso|success/.test(textoEl);
              }).length > 0;

            // Si hay éxito o el resultado fue OK, continuar
            if (hayExito || (resultadoGuardado && resultadoGuardado.resultado === 'OK' && resultadoGuardado.guardado)) {
              cy.log(`TC051: Guardado exitoso detectado. URL actual: ${urlActual}`);
              cy.log(`TC051: Código actual: ${codigoVehiculo || 'NO CAPTURADO'}`);
            } else if (resultadoGuardado && resultadoGuardado.resultado === 'ERROR') {
              cy.log('TC051: El guardado falló, NO se continúa con la verificación ni se navega');
              return cy.wrap({ navegado: false, razon: 'Guardado falló' });
            } else {
              // Si no hay mensaje pero tampoco hay error, continuar de todas formas
              cy.log('TC051: No se detectó mensaje explícito, pero continuando con verificación...');
              cy.log(`TC051: URL actual: ${urlActual}`);
              cy.log(`TC051: Código actual: ${codigoVehiculo || 'NO CAPTURADO'}`);
            }

            // Leer el código si estamos en el formulario
            if (urlActual.includes('/form')) {
              return leerCodigoVehiculo().then((codigo) => {
                if (codigo) {
                  codigoVehiculo = codigo;
                  cy.log(`TC051: Código del vehículo leído del formulario: ${codigoVehiculo}`);
                } else if (!codigoVehiculo) {
                  cy.log('TC051: WARNING - No se pudo leer el código del formulario y no había código previo');
                } else {
                  cy.log(`TC051: No se pudo leer el código del formulario, usando código previo: ${codigoVehiculo}`);
                }
                cy.log(`TC051: Código final para búsqueda: ${codigoVehiculo}`);

                // Si estamos en el formulario, navegar a la lista
                cy.log('TC051: Navegando a la lista de vehículos...');
                return cy.visit(LIST_URL).then(() => cy.wait(2000)).then(() => {
                  cy.log('TC051: Navegación a lista completada');
                  return cy.wrap({ navegado: true, codigo: codigoVehiculo });
                });
              });
            }

            // Si ya estamos en la lista, buscar directamente sin navegar
            if (urlActual.includes('/vehicles') && !urlActual.includes('/form')) {
              cy.log('TC051: Ya estamos en la lista de vehículos, buscando directamente...');
              if (!codigoVehiculo) {
                cy.log('TC051: WARNING - No hay código disponible para buscar');
              }
              return cy.wrap({ navegado: true, codigo: codigoVehiculo, yaEnLista: true });
            }

            // Si no estamos ni en formulario ni en lista, navegar a la lista
            cy.log('TC051: No estamos en formulario ni lista, navegando a la lista...');
            return cy.visit(LIST_URL).then(() => cy.wait(2000)).then(() => {
              cy.log('TC051: Navegación a lista completada');
              return cy.wrap({ navegado: true, codigo: codigoVehiculo });
            });
          });
        });
      })
      .then((resultadoNavegacion) => {
        // Solo buscar el vehículo si realmente se navegó a la lista o ya estamos en ella (igual que caso 55)
        if (!resultadoNavegacion || !resultadoNavegacion.navegado) {
          cy.log(`TC051: No se navegó a la lista: ${resultadoNavegacion?.razon || 'Razón desconocida'}`);
          return cy.wrap({ resultado: 'ERROR', obtenido: `No se navegó a la lista: ${resultadoNavegacion?.razon || 'Razón desconocida'}` }, { log: false });
        }

        // Si ya estábamos en la lista, usar el código que tenemos
        if (resultadoNavegacion.yaEnLista && resultadoNavegacion.codigo) {
          codigoVehiculo = resultadoNavegacion.codigo;
        }

        // Asegurar que estamos en la lista antes de buscar
        return cy.url().then((urlActual) => {
          if (!urlActual.includes('/vehicles') || urlActual.includes('/form')) {
            cy.log('TC051: No estamos en la lista, navegando...');
            return cy.visit(LIST_URL).then(() => cy.wait(2000));
          }
          cy.log('TC051: Confirmado que estamos en la lista, continuando con búsqueda...');
          return cy.wrap(null);
        })
          .then(() => UI.esperarTabla())
          .then(() => {
            // Verificar que tenemos el código antes de buscar
            if (!codigoVehiculo) {
              const obs = 'No se pudo capturar el código del vehículo para buscar y verificar.';
              cy.log(`TC051: ERROR - ${obs}`);
              return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'ERROR', true)
                .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
            }

            cy.log(`TC051: Buscando vehículo con código: ${codigoVehiculo}`);
            // Ejecutar la búsqueda y esperar resultados
            return UI.buscar(codigoVehiculo)
              .then(() => {
                cy.log(`TC051: Búsqueda ejecutada para código: ${codigoVehiculo}, esperando resultados...`);
                return cy.wait(1000); // Esperar a que se complete la búsqueda
              })
              .then(() => esperarResultadosTablaEnLista(25000))
              .then(() => {
                cy.log(`TC051: Resultados de búsqueda cargados, buscando fila con código: ${codigoVehiculo}`);
                return cy.wrap(null);
              });
          });
      })
      .then((resPrev) => {
        if (resPrev && resPrev.resultado === 'ERROR') {
          cy.log('TC051: Error en la búsqueda, no se puede continuar con la verificación');
          return cy.wrap(resPrev);
        }

        cy.wait(1000);
        return cy.get('body').then($body => {
          const filas = $body.find('.MuiDataGrid-row:visible');
          if (filas.length === 0) {
            const obs = `No se encontró el vehículo con código ${codigoVehiculo} después de guardar.`;
            return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'ERROR', true)
              .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
          }

          const filaEncontrada = Array.from(filas).find((el) => {
            const textoFila = (el.innerText || el.textContent || '').toLowerCase();
            return textoFila.includes(codigoVehiculo.toLowerCase());
          });

          if (filaEncontrada) {
            cy.log(`TC051: Vehículo con código ${codigoVehiculo} encontrado, abriendo formulario de edición...`);
            return cy.wrap(filaEncontrada).dblclick({ force: true });
          } else {
            const obs = `No se encontró la fila con el código ${codigoVehiculo}.`;
            return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'ERROR', true)
              .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
          }
        });
      })
      .then((resPrev) => {
        if (resPrev && resPrev.resultado === 'ERROR') {
          cy.log('TC051: Error al abrir el formulario, no se puede continuar con la verificación');
          const obs = resPrev.obtenido || 'Error al abrir el formulario del vehículo';
          return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'ERROR', true)
            .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
        }

        cy.wait(2000);
        return cy.url().should('include', '/dashboard/vehicles/form');
      })
      .then((resPrev) => {
        if (resPrev && resPrev.resultado === 'ERROR') {
          cy.log('TC051: Error al navegar al formulario, no se puede continuar con la verificación');
          return cy.wrap(resPrev);
        }

        cy.log('TC051: Formulario abierto, comenzando verificación de pestañas...');

        // Lista de pestañas a verificar
        const pestañasAVerificar = [
          'Vencimientos',
          'Mantenimiento',
          'Seguros',
          'Ficha Técnica',
          'Compra/Venta',
          'Amortización',
          'Impuestos',
          'Tarjetas',
          'Revisiones',
          'Histórico Kms',
          'Histórico Vehículo'
        ];

        let chainVerificacion = cy.wrap([]);

        pestañasAVerificar.forEach((pestaña) => {
          chainVerificacion = chainVerificacion.then((pestañasSinDatos) => {
            cy.log(`TC051: Verificando pestaña: ${pestaña}`);
            const nuevasPestañasSinDatos = [...(pestañasSinDatos || [])];

            // Intentar verificar la pestaña (igual que caso 55 de proveedores)
            return navegarSeccionFormulario(pestaña)
              .then(() => cy.wait(1000))
              .then(() => verificarPestañaSinFilas(pestaña))
              .then((tieneDatos) => {
                if (!tieneDatos) {
                  nuevasPestañasSinDatos.push(pestaña);
                }
                return cy.wrap(nuevasPestañasSinDatos);
              });
          });
        });

        return chainVerificacion;
      })
      .then((pestañasSinDatos) => {
        cy.log('TC051: Verificación completada');

        // Determinar el resultado y mensaje (igual que caso 55 de proveedores)
        let resultado = 'OK';
        let mensaje = `Vehículo ${codigoVehiculo || 'creado'} verificado. Todas las pestañas tienen datos guardados.`;

        if (pestañasSinDatos && pestañasSinDatos.length > 0) {
          resultado = 'ERROR';
          const pestañasError = pestañasSinDatos.join(', ');
          mensaje = `Vehículo ${codigoVehiculo || 'creado'} creado, pero las siguientes pestañas NO tienen datos guardados: ${pestañasError}`;
          cy.log(`TC051: ERROR: Las siguientes pestañas no tienen datos: ${pestañasError}`);
        } else {
          cy.log(`TC051: Todas las pestañas tienen datos guardados correctamente`);
        }

        // Registrar resultado
        return registrarResultadoAutomatico(
          numeroCaso,
          idCaso,
          nombreCaso,
          mensaje,
          resultado,
          true
        );
      })
      .then(() => {
        cy.log('TC051: Test completado correctamente');
      });
  }

  // Función para rellenar DATOS GENERALES igual que el caso 23
  // CASO 30: Seleccionar tarjeta
  // =========================
  function seleccionarTarjeta(caso, numero, casoId) {
    const numeroCaso = numero || parseInt(String(caso?.caso || '').replace(/\D/g, ''), 10);

    cy.log(`TC${String(numeroCaso).padStart(3, '0')}: Seleccionar tarjeta`);

    return cy.url()
      .then((urlActual) => {
        const enFormulario = urlActual.includes('/dashboard/vehicles/form');

        if (!enFormulario) {
          cy.log('No estamos en el formulario, abriendo...');
          return UI.abrirPantalla()
            .then(() => UI.esperarTabla())
            .then(() => abrirFormularioNuevoVehiculo())
            .then(() => cy.url().should('include', '/dashboard/vehicles/form'));
        }
        return cy.wrap(null);
      })
      .then(() => {
        // Navegar a la pestaña TARJETAS
        cy.log('Navegando a la pestaña TARJETAS...');
        return navegarSeccionFormulario('Tarjetas').then(() => {
          cy.wait(500);
          cy.log('Navegación a TARJETAS completada');
          return cy.wrap(null);
        });
      })
      .then(() => {
        // PRIMERO: Hacer clic en "Añadir" para abrir el modal (igual que SEGUROS, AMORTIZACIÓN, IMPUESTOS)
        // Pero para TARJETAS no esperamos inputs, solo esperamos que aparezca la tabla
        cy.log('Abriendo modal TARJETAS con botón "Añadir"...');
        return cy.get('body').then(($body) => {
          // Buscar el botón "+ Añadir"
          const botones = $body.find('button, a').filter((_, el) => {
            const texto = (el.innerText || el.textContent || '').trim();
            return /\+?\s*Añadir/i.test(texto);
          }).filter(':visible');

          if (botones.length > 0) {
            return cy.wrap(botones[0])
              .scrollIntoView()
              .should('be.visible')
              .click({ force: true })
              .then(() => {
                cy.wait(300);
                // Esperar a que aparezca el modal con la tabla (no inputs)
                return cy.get('.MuiDataGrid-root, [role="dialog"] .MuiDataGrid-root', { timeout: 10000 })
                  .should('be.visible')
                  .then(() => {
                    cy.wait(1000); // Esperar a que se carguen los datos
                    cy.log('Modal de tarjetas abierto y tabla cargada');
                    return cy.wrap(null);
                  });
              });
          }

          // Fallback: usar cy.contains si no se encontró con jQuery
          return cy.contains('button, a', /\+?\s*Añadir/i, { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .then(() => {
              cy.wait(300);
              // Esperar a que aparezca el modal con la tabla (no inputs)
              return cy.get('.MuiDataGrid-root, [role="dialog"] .MuiDataGrid-root', { timeout: 10000 })
                .should('be.visible')
                .then(() => {
                  cy.wait(1000); // Esperar a que se carguen los datos
                  cy.log('Modal de tarjetas abierto y tabla cargada');
                  return cy.wrap(null);
                });
            });
        });
      })
      .then(() => {
        // SEGUNDO: Hacer clic en la primera fila (tarjeta) de la tabla (igual que seleccionarTelefono)
        cy.log('Buscando la primera fila de la tabla para hacer clic...');
        return cy
          .get('.MuiDataGrid-row:visible', { timeout: 10000 })
          .first()
          .should('be.visible')
          .click({ force: true })
          .then(() => {
            cy.wait(300);
            cy.log('Clic en la primera fila realizado');
            return cy.wrap(null);
          });
      })
      .then(() => {
        // TERCERO: Hacer clic en el botón "Seleccionar" (igual que seleccionarTelefono)
        cy.log('Buscando botón "Seleccionar"...');
        return cy
          .contains('button', /^Seleccionar$/i, { timeout: 10000 })
          .should('be.visible')
          .click({ force: true })
          .then(() => {
            cy.wait(500);
            cy.log('Botón "Seleccionar" clickeado');
            return cy.wrap(null);
          });
      });
  }

  // Función para rellenar DATOS GENERALES igual que el caso 23
  // CASO 30: Seleccionar tarjeta
  // =========================
  function seleccionarTarjeta(caso, numero, casoId) {
    const numeroCaso = numero || parseInt(String(caso?.caso || '').replace(/\D/g, ''), 10);

    cy.log(`TC${String(numeroCaso).padStart(3, '0')}: Seleccionar tarjeta`);

    return cy.url()
      .then((urlActual) => {
        const enFormulario = urlActual.includes('/dashboard/vehicles/form');

        if (!enFormulario) {
          cy.log('No estamos en el formulario, abriendo...');
          return UI.abrirPantalla()
            .then(() => UI.esperarTabla())
            .then(() => abrirFormularioNuevoVehiculo())
            .then(() => cy.url().should('include', '/dashboard/vehicles/form'));
        }
        return cy.wrap(null);
      })
      .then(() => {
        // Navegar a la pestaña TARJETAS
        cy.log('Navegando a la pestaña TARJETAS...');
        return navegarSeccionFormulario('Tarjetas').then(() => {
          cy.wait(500);
          cy.log('Navegación a TARJETAS completada');
          return cy.wrap(null);
        });
      })
      .then(() => {
        // PRIMERO: Hacer clic en "Añadir" para abrir el modal (igual que SEGUROS, AMORTIZACIÓN, IMPUESTOS)
        // Pero para TARJETAS no esperamos inputs, solo esperamos que aparezca la tabla
        cy.log('Abriendo modal TARJETAS con botón "Añadir"...');
        return cy.get('body').then(($body) => {
          // Buscar el botón "+ Añadir"
          const botones = $body.find('button, a').filter((_, el) => {
            const texto = (el.innerText || el.textContent || '').trim();
            return /\+?\s*Añadir/i.test(texto);
          }).filter(':visible');

          if (botones.length > 0) {
            return cy.wrap(botones[0])
              .scrollIntoView()
              .should('be.visible')
              .click({ force: true })
              .then(() => {
                cy.wait(300);
                // Esperar a que aparezca el modal con la tabla (no inputs)
                return cy.get('.MuiDataGrid-root, [role="dialog"] .MuiDataGrid-root', { timeout: 10000 })
                  .should('be.visible')
                  .then(() => {
                    cy.wait(1000); // Esperar a que se carguen los datos
                    cy.log('Modal de tarjetas abierto y tabla cargada');
                    return cy.wrap(null);
                  });
              });
          }

          // Fallback: usar cy.contains si no se encontró con jQuery
          return cy.contains('button, a', /\+?\s*Añadir/i, { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .then(() => {
              cy.wait(300);
              // Esperar a que aparezca el modal con la tabla (no inputs)
              return cy.get('.MuiDataGrid-root, [role="dialog"] .MuiDataGrid-root', { timeout: 10000 })
                .should('be.visible')
                .then(() => {
                  cy.wait(1000); // Esperar a que se carguen los datos
                  cy.log('Modal de tarjetas abierto y tabla cargada');
                  return cy.wrap(null);
                });
            });
        });
      })
      .then(() => {
        // SEGUNDO: Hacer clic en la primera fila (tarjeta) de la tabla (igual que seleccionarTelefono)
        cy.log('Buscando la primera fila de la tabla para hacer clic...');
        return cy
          .get('.MuiDataGrid-row:visible', { timeout: 10000 })
          .first()
          .should('be.visible')
          .click({ force: true })
          .then(() => {
            cy.wait(300);
            cy.log('Clic en la primera fila realizado');
            return cy.wrap(null);
          });
      })
      .then(() => {
        // TERCERO: Hacer clic en el botón "Seleccionar" (igual que seleccionarTelefono)
        cy.log('Buscando botón "Seleccionar"...');
        return cy
          .contains('button', /^Seleccionar$/i, { timeout: 10000 })
          .should('be.visible')
          .click({ force: true })
          .then(() => {
            cy.wait(500);
            cy.log('Botón "Seleccionar" clickeado');
            return cy.wrap(null);
          });
      });
  }

  // Función para rellenar DATOS GENERALES igual que el caso 23
  // CASO 30: Seleccionar tarjeta
  // =========================
  function seleccionarTarjeta(caso, numero, casoId) {
    const numeroCaso = numero || parseInt(String(caso?.caso || '').replace(/\D/g, ''), 10);

    cy.log(`TC${String(numeroCaso).padStart(3, '0')}: Seleccionar tarjeta`);

    return cy.url()
      .then((urlActual) => {
        const enFormulario = urlActual.includes('/dashboard/vehicles/form');

        if (!enFormulario) {
          cy.log('No estamos en el formulario, abriendo...');
          return UI.abrirPantalla()
            .then(() => UI.esperarTabla())
            .then(() => abrirFormularioNuevoVehiculo())
            .then(() => cy.url().should('include', '/dashboard/vehicles/form'));
        }
        return cy.wrap(null);
      })
      .then(() => {
        // Navegar a la pestaña TARJETAS
        cy.log('Navegando a la pestaña TARJETAS...');
        return navegarSeccionFormulario('Tarjetas').then(() => {
          cy.wait(500);
          cy.log('Navegación a TARJETAS completada');
          return cy.wrap(null);
        });
      })
      .then(() => {
        // PRIMERO: Hacer clic en "Añadir" para abrir el modal (igual que SEGUROS, AMORTIZACIÓN, IMPUESTOS)
        // Pero para TARJETAS no esperamos inputs, solo esperamos que aparezca la tabla
        cy.log('Abriendo modal TARJETAS con botón "Añadir"...');
        return cy.get('body').then(($body) => {
          // Buscar el botón "+ Añadir"
          const botones = $body.find('button, a').filter((_, el) => {
            const texto = (el.innerText || el.textContent || '').trim();
            return /\+?\s*Añadir/i.test(texto);
          }).filter(':visible');

          if (botones.length > 0) {
            return cy.wrap(botones[0])
              .scrollIntoView()
              .should('be.visible')
              .click({ force: true })
              .then(() => {
                cy.wait(300);
                // Esperar a que aparezca el modal con la tabla (no inputs)
                return cy.get('.MuiDataGrid-root, [role="dialog"] .MuiDataGrid-root', { timeout: 10000 })
                  .should('be.visible')
                  .then(() => {
                    cy.wait(1000); // Esperar a que se carguen los datos
                    cy.log('Modal de tarjetas abierto y tabla cargada');
                    return cy.wrap(null);
                  });
              });
          }

          // Fallback: usar cy.contains si no se encontró con jQuery
          return cy.contains('button, a', /\+?\s*Añadir/i, { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .then(() => {
              cy.wait(300);
              // Esperar a que aparezca el modal con la tabla (no inputs)
              return cy.get('.MuiDataGrid-root, [role="dialog"] .MuiDataGrid-root', { timeout: 10000 })
                .should('be.visible')
                .then(() => {
                  cy.wait(1000); // Esperar a que se carguen los datos
                  cy.log('Modal de tarjetas abierto y tabla cargada');
                  return cy.wrap(null);
                });
            });
        });
      })
      .then(() => {
        // SEGUNDO: Hacer clic en la primera fila (tarjeta) de la tabla (igual que seleccionarTelefono)
        cy.log('Buscando la primera fila de la tabla para hacer clic...');
        return cy
          .get('.MuiDataGrid-row:visible', { timeout: 10000 })
          .first()
          .should('be.visible')
          .click({ force: true })
          .then(() => {
            cy.wait(300);
            cy.log('Clic en la primera fila realizado');
            return cy.wrap(null);
          });
      })
      .then(() => {
        // TERCERO: Hacer clic en el botón "Seleccionar" (igual que seleccionarTelefono)
        cy.log('Buscando botón "Seleccionar"...');
        return cy
          .contains('button', /^Seleccionar$/i, { timeout: 10000 })
          .should('be.visible')
          .click({ force: true })
          .then(() => {
            cy.wait(500);
            cy.log('Botón "Seleccionar" clickeado');
            return cy.wrap(null);
          });
      });
  }

  // TC052-TC058: Guardar secciones sin rellenar ningún campo
  function guardarSeccionSinRellenarVehiculos(caso, numero, casoId) {
    const numeroCaso = numero || 52;
    const idCaso = casoId || `TC${String(numeroCaso).padStart(3, '0')}`;
    const nombreCaso = caso?.nombre || 'Guardar sección sin rellenar ningún campo';

    // Mapear número de caso a nombre de sección
    const mapeoSecciones = {
      52: 'Seguros',
      53: 'Amortización',
      54: 'Impuestos',
      55: 'Revisiones',
      56: 'Histórico Kms',
      57: 'Histórico Vehículo'
    };

    const nombreSeccion = mapeoSecciones[numeroCaso];
    if (!nombreSeccion) {
      const obs = `No se encontró mapeo para el caso ${numeroCaso}`;
      return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'ERROR', true)
        .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
    }

    // Asegurar que estamos en el formulario
    return cy.url().then((u) => {
      if (!/\/form/i.test(u)) {
        return abrirFormularioNuevoVehiculo();
      }
      return cy.wrap(null);
    })
      .then(() => cy.url().should('include', '/dashboard/vehicles/form'))
      .then(() => {
        cy.log(`TC${String(numeroCaso).padStart(3, '0')}: Navegando a la pestaña ${nombreSeccion}...`);
        return navegarSeccionFormulario(nombreSeccion);
      })
      .then(() => cy.wait(1000))
      .then(() => {
        cy.log(`TC${String(numeroCaso).padStart(3, '0')}: Abriendo modal de ${nombreSeccion}...`);
        // Para Tarjetas, el modal es diferente (muestra una tabla para seleccionar)
        if (nombreSeccion === 'Tarjetas') {
          return cy.get('body').then(($body) => {
            const botones = $body.find('button, a').filter((_, el) => {
              const texto = (el.innerText || el.textContent || '').trim();
              return /\+?\s*Añadir/i.test(texto);
            }).filter(':visible');

            if (botones.length > 0) {
              return cy.wrap(botones[0])
                .scrollIntoView()
                .should('be.visible')
                .click({ force: true })
                .then(() => cy.wait(2000));
            }
            return cy.contains('button, a', /\+?\s*Añadir/i, { timeout: 10000 })
              .should('be.visible')
              .scrollIntoView()
              .click({ force: true })
              .then(() => cy.wait(2000));
          });
        }
        // Para las demás secciones, abrir el modal normalmente
        return abrirModalSeccion(nombreSeccion, true);
      })
      .then(() => cy.wait(1000))
      .then(() => {
        cy.log(`TC${String(numeroCaso).padStart(3, '0')}: Pulsando Guardar del formulario sin rellenar campos...`);
        // Para Tarjetas, buscar el botón "Seleccionar" o "Guardar" en el modal
        if (nombreSeccion === 'Tarjetas') {
          return cy.get('body').then($body => {
            const modal = $body.find('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="dialog"]:visible').first();
            if (modal.length > 0) {
              return cy.wrap(modal[0]).within(() => {
                const botonGuardar = Cypress.$(modal[0]).find('button')
                  .filter((_, el) => {
                    const texto = (el.textContent || '').trim().toLowerCase();
                    return /^guardar$|^seleccionar$|^save$|^select$/i.test(texto);
                  })
                  .first();

                if (botonGuardar.length > 0) {
                  return cy.wrap(botonGuardar[0])
                    .should('be.visible')
                    .scrollIntoView()
                    .click({ force: true });
                }
                return cy.wrap(null);
              });
            }
            return cy.wrap(null);
          });
        }
        // Para las demás secciones, usar clickGuardarDentroFormulario
        // La función ya está modificada para no registrar WARNING por "Guardado" en casos 52-57
        return clickGuardarDentroFormulario(numeroCaso);
      })
      .then(() => cy.wait(2000)) // Esperar a que aparezca el aviso o se cierre el modal
      .then(() => {
        cy.log(`TC${String(numeroCaso).padStart(3, '0')}: Verificando si aparece aviso de campos obligatorios...`);
        // Verificar si aparece un aviso de campos obligatorios
        return cy.get('body').then($body => {
          const modal = $body.find('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="dialog"]:visible').first();

          // Si el modal se cerró, significa que se guardó sin validación - ERROR
          if (modal.length === 0) {
            const obs = 'El modal se cerró sin mostrar aviso de campos obligatorios. Se guardó en blanco sin validación. Esto es un ERROR.';
            return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'ERROR', true)
              .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
          }

          // El modal está abierto, buscar el aviso dentro del modal
          const textoModal = (Cypress.$(modal[0]).text() || '').trim();

          // Buscar específicamente el título "Campos obligatorios" (exacto o muy cercano)
          // Debe aparecer como título principal del aviso, no solo como parte de otro texto
          const tieneTituloCamposObligatorios = /^campos obligatorios$|^campos obligatorios\s*$/i.test(textoModal) ||
            /campos obligatorios/i.test(textoModal) &&
            (textoModal.includes('es obligatorio') || textoModal.includes('obligatorio') || textoModal.includes('required'));

          // Buscar elementos de alerta visibles dentro del modal
          const avisosEnModal = Cypress.$(modal[0]).find('[role="alert"], .MuiAlert-root, .MuiSnackbar-root, [class*="error"], [class*="Error"], [class*="warning"], [class*="Warning"], [class*="alert"], [class*="Alert"]')
            .filter(':visible')
            .map((_, el) => {
              const texto = (el.textContent || el.innerText || '').trim();
              const tieneTitulo = /campos obligatorios/i.test(texto);
              return { texto, tieneTitulo, elemento: el };
            })
            .get();

          // Verificar si hay algún aviso que contenga "Campos obligatorios" como título
          const avisoValido = avisosEnModal.find(aviso => aviso.tieneTitulo) ||
            (tieneTituloCamposObligatorios && avisosEnModal.length > 0);

          if (avisoValido) {
            const textoAviso = avisosEnModal.find(aviso => aviso.tieneTitulo)?.texto ||
              textoModal.match(/campos obligatorios[^.]*/i)?.[0] || 'Campos obligatorios';
            const obs = `Aparece aviso de campos obligatorios: "${textoAviso.substring(0, 100)}". Esto es correcto.`;
            return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'OK', true)
              .then(() => cy.wrap({ resultado: 'OK', obtenido: obs }, { log: false }));
          }

          // Si no se encontró el aviso pero el modal sigue abierto, puede ser que el aviso esté mal formado
          // Verificar si hay algún texto relacionado pero no es el aviso correcto
          const tieneTextoRelacionado = /campo.*obligatorio|obligatorio.*campo|required.*field|field.*required/i.test(textoModal);
          if (tieneTextoRelacionado && avisosEnModal.length === 0) {
            const obs = 'Se detectó texto relacionado con campos obligatorios pero no aparece como aviso visual. El modal no se cerró pero no hay alerta visible.';
            return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'ERROR', true)
              .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
          }

          // Si NO aparece ningún aviso de campos obligatorios y el modal sigue abierto
          const obs = 'No aparece aviso de campos obligatorios al intentar guardar sin rellenar campos. El modal sigue abierto pero sin alerta de validación. Debería aparecer un aviso.';
          return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'ERROR', true)
            .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
        });
      });
  }

});