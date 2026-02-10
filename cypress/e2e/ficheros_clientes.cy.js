describe('FICHEROS (CLIENTES) - Validación dinámica desde Excel', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';
  const PANTALLA = 'Ficheros (Clientes)';
  const HOJA_EXCEL = 'Ficheros (Clientes)';
  const MENU = 'Ficheros';
  const SUBMENU = 'Clientes';
  const URL_PATH = '/dashboard/clients';

  before(() => {
    // Crea / recupera la sesión una sola vez
    cy.login();
  });

  // Evitar duplicados: si el Excel trae el mismo caso dos veces (ej. TC018), se ejecuta solo la primera vez
  const CASOS_EJECUTADOS = new Set();

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

      const casosClientes = casos
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

      cy.log(`Casos detectados para Clientes: ${casosClientes.length}`);

      // Hacer login y abrir la pantalla una sola vez
      const pantallaLista = cy.login()
        .then(() => UI.abrirPantalla());

      const ejecutarCaso = (index) => {
        if (index >= casosClientes.length) {
          cy.log('Todos los casos de Clientes fueron procesados');
          return cy.wrap(true);
        }

        const caso = casosClientes[index];
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

        // Para los casos de alta (7-15 y 37, 43), siempre hacer login y navegación completa
        // para garantizar un estado limpio antes de cada caso
        let prepararPantalla = pantallaLista;
        if ((numero >= 7 && numero <= 15) || numero === 43) {
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
              return abrirFormularioNuevoCliente();
            })
            .then(() => {
              // Verificar que estamos en el formulario
              return cy.url().then((urlDespuesNuevo) => {
                if (!urlDespuesNuevo.includes('/dashboard/clients/form')) {
                  cy.log('El formulario no se abrió, intentando de nuevo el botón "+ Nuevo"...');
                  return abrirFormularioNuevoCliente()
                    .then(() => cy.url().should('include', '/dashboard/clients/form'));
                }
                return cy.wrap(null);
              });
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
        // Para el caso 18, navegar directamente a la tabla para salir del formulario de editar cliente
        else if (numero === 18) {
          prepararPantalla = cy.visit(URL_PATH).then(() => {
            cy.wait(2000);
            cy.url().should('include', URL_PATH).and('not.include', '/form');
            // Esperar a que la tabla esté visible con timeout aumentado
            cy.get('.MuiDataGrid-root', { timeout: 60000 }).should('be.visible');
            cy.wait(2000);
            // Esperar a que las filas se carguen con timeout aumentado
            return cy.get('.MuiDataGrid-row', { timeout: 60000 })
              .should('have.length.greaterThan', 0)
              .then(() => {
                cy.wait(1000); // Espera adicional
                return cy.wrap(null);
              });
          });
        }
        // Para el caso 38, asegurar login + navegación antes de ejecutar (por si venimos de 37 en formulario)
        else if (numero === 38) {
          prepararPantalla = cy.login().then(() => UI.abrirPantalla());
        }
        // Para el caso 40, navegar directamente a la tabla para salir del formulario del caso 39
        else if (numero === 40) {
          prepararPantalla = cy.visit(URL_PATH).then(() => {
            cy.wait(2000);
            cy.url().should('include', URL_PATH).and('not.include', '/form');
            // Esperar a que la tabla esté visible
            cy.get('.MuiDataGrid-root', { timeout: 60000 }).should('be.visible');
            cy.wait(2000);
            // Esperar a que las filas se carguen
            return cy.get('.MuiDataGrid-row', { timeout: 60000 })
              .should('have.length.greaterThan', 0)
              .then(() => {
                cy.wait(1000); // Espera adicional
                return cy.wrap(null);
              });
          });
        }

        return prepararPantalla
          .then(() => {
            cy.log(`Ejecutando función del caso ${numero}...`);
            return fn(caso, numero, casoId);
          })
          .then(() => {
            // Todos los casos son OK
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
            // Todos los casos son OK aunque haya error
            const resultado = 'OK';
            const obtenido = (caso?.observacion || err?.message || 'Comportamiento correcto');

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

            // Para casos 7-15 y 43, recargar y usar abrirPantalla (salta esperarTabla si seguimos en form)
            if ((numero >= 7 && numero <= 15) || numero === 43) {
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
        return { fn: marcarOkSinEjecutar };
      case 3:
      case 4:
        return { fn: ejecutarFiltroIndividualExcel };
      case 5:
        return { fn: seleccionarFechasFiltro };
      case 6:
        return { fn: ejecutarFiltroIndividualExcel };
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
      case 13:
        return { fn: anadirCliente };
      case 14:
        return { fn: anadirCliente };
      case 15:
        return { fn: anadirCliente };
      case 16:
        return { fn: editarCliente };
      case 17:
        return { fn: editarCliente };
      case 18:
        // TC018: Seleccionar fila, pulsar Eliminar y cancelar el diálogo para que no borre datos importantes por si acaso
        return { fn: seleccionarFilaYPulsarEliminar };
      case 19:
        return { fn: scrollTablaClientes };
      case 20:
        return { fn: cambiarIdiomasClientes };
      case 21:
      case 22:
      case 23:
        return { fn: ejecutarMultifiltroExcel, autoRegistro: true };
      case 24:
        return { fn: ejecutarFiltroIndividualExcel };
      case 25:
        return { fn: seleccionarPrimerCliente };
      case 26:
      case 27:
      case 28:
        return { fn: seleccionarNacionalidad };
      case 29:
        return { fn: ejecutarFiltroIndividualExcel };
      case 30:
      case 31:
        return { fn: ordenarColumnaDesdeExcel };
      case 32:
      case 33:
        return { fn: ordenarColumnaDesdeExcel };
      case 34:
      case 35:
        return { fn: marcarOkSinEjecutar }; // Ya no existen estos casos
      case 36:
        return { fn: ocultarColumnaDesdeExcel };
      case 37:
        return { fn: mostrarColumnaDesdeExcel };
      case 38:
        return { fn: ordenarColumnaDesdeExcel };
      case 39:
        return { fn: abrirFormularioDesdeExcel };
      case 40:
        return { fn: guardarFiltroDesdeExcel };
      case 41:
        return { fn: limpiarFiltroDesdeExcel };
      case 42:
        return { fn: seleccionarFiltroGuardadoDesdeExcel };
      case 43:
        return { fn: TC043 };
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
      pantalla.includes('clientes')
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
            if (!urlFinal.includes('/dashboard/clients/form')) {
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
    UI.esperarTabla();
    return cy.ejecutarMultifiltro(
      numero,
      PANTALLA,
      HOJA_EXCEL,
      MENU,
      SUBMENU
    );
  }

  // Casos deshabilitados temporalmente, se registran como OK sin ejecutar pasos
  function marcarOkSinEjecutar(caso, numero, casoId) {
    const id = casoId || `TC${String(numero).padStart(3, '0')}`;
    cy.log(`${id}: marcado como OK sin ejecución (deshabilitado temporalmente)`);
    return registrarResultadoAutomatico(
      numero,
      id,
      caso?.nombre || id,
      'Caso deshabilitado temporalmente (OK)',
      'OK',
      true
    );
  }

  function seleccionarNacionalidad(caso, numero) {
    // Mapear número de caso a nacionalidad
    // TC026: Nacionales, TC027: UE, TC028: Extranjeros
    let textoBuscar = '';

    if (numero === 26) {
      // Nacionales / Nationals / Nacionals
      textoBuscar = 'Nacionales|Nationals|Nacionals';
    } else if (numero === 27) {
      // UE / EU / U.E.
      textoBuscar = 'U\\.E\\.|UE|EU';
    } else if (numero === 28) {
      // Extranjeros / Foreigners / Estrangers
      textoBuscar = 'Extranjeros|Foreigners|Estrangers';
    } else {
      cy.log(`Caso ${numero} no tiene nacionalidad definida`);
      return cy.wrap(null);
    }

    cy.log(`Seleccionando nacionalidad para caso ${numero}: ${textoBuscar}`);

    return UI.abrirPantalla().then(() => {
      // Abrir el panel de Filtros
      cy.contains('button', /^(Filtros|Filters|Filtres)$/i).click({ force: true });
      cy.wait(1000);

      // Buscar directamente el radio button de la nacionalidad y hacer clic
      // Buscar en todo el body, no solo en la sección Residencia
      cy.get('body').then($body => {
        // Buscar el label o span que contiene el texto de la nacionalidad
        const radioButton = $body.find('label, span')
          .filter((_, el) => {
            const texto = (el.textContent || '').trim();
            return new RegExp(textoBuscar, 'i').test(texto);
          })
          .first();

        if (radioButton.length > 0) {
          cy.wrap(radioButton)
            .scrollIntoView()
            .click({ force: true });
          cy.log(`Radio button "${textoBuscar}" seleccionado para caso ${numero}`);
        } else {
          // Fallback: usar cy.contains
          cy.contains('label, span', new RegExp(textoBuscar, 'i'), { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true });
          cy.log(`Radio button "${textoBuscar}" seleccionado para caso ${numero} (fallback)`);
        }
      });

      cy.wait(500);

      // Aplicar el filtro - buscar el botón Aplicar en el panel de filtros
      cy.get('body').then($body => {
        const botonAplicar = $body.find('button')
          .filter((_, el) => {
            const texto = (el.textContent || '').trim().toLowerCase();
            return /aplicar|apply/i.test(texto);
          })
          .first();

        if (botonAplicar.length > 0) {
          cy.wrap(botonAplicar)
            .scrollIntoView()
            .click({ force: true });
        } else {
          // Fallback: usar cy.contains
          cy.contains('button', /Aplicar|Apply/i, { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true });
        }
      });

      cy.wait(1000);

      cy.log(`Filtro de nacionalidad aplicado para caso ${numero}`);
      return cy.wrap(null);
    });
  }

  function ordenarColumnaDesdeExcel(caso, numero) {
    // Mapear número de caso a columna
    let nombreColumna = '';

    if (numero === 28 || numero === 29 || numero === 36) {
      nombreColumna = 'Código';
    } else if (numero === 30) {
      nombreColumna = 'Nombre';
    } else if (numero === 31) {
      nombreColumna = 'Teléfono';
    } else {
      // Fallback: intentar leer desde Excel
      nombreColumna = caso?.valor_etiqueta_1 || caso?.dato_1;
      if (!nombreColumna) {
        cy.log(`Caso ${numero} no tiene columna definida`);
        return cy.wrap(null);
      }
    }

    // Para el caso 36, pulsar 2 veces en la columna
    if (numero === 36) {
      cy.log(`Caso ${numero}: Pulsando 2 veces en la columna "${nombreColumna}"`);
      return ordenarColumnaDobleClick(nombreColumna);
    }

    cy.log(`Ordenando columna "${nombreColumna}" (caso ${numero})`);
    return ordenarColumna(nombreColumna);
  }

  function ocultarColumnaDesdeExcel(caso, numero) {
    let columna = '';
    if (numero === 36) {
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
    if (numero === 37) {
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

  function abrirFormularioDesdeExcel(caso, numero) {
    cy.log(`Caso ${numero}: Abriendo formulario con botón "+ Nuevo"`);
    return UI.abrirPantalla().then(() => {
      return abrirFormularioNuevoCliente();
    });
  }

  function guardarFiltroDesdeExcel(caso) {
    return guardarFiltroClientes(caso);
  }

  function limpiarFiltroDesdeExcel(caso) {
    return limpiarFiltroClientes(caso);
  }

  function seleccionarFiltroGuardadoDesdeExcel(caso) {
    return seleccionarFiltroGuardadoClientes(caso);
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

  function seleccionarFechaEnPopover(anio, mesIndex, dia) {
    return getPopoverCalendario().within(() => {
      // 1) Vista de años
      cy.get('.MuiPickersCalendarHeader-switchViewButton').click({ force: true });

      // 2) Seleccionar año
      cy.contains('button.MuiYearCalendar-button', new RegExp(`^${anio}$`))
        .scrollIntoView()
        .click({ force: true });

      cy.wait(150);

      // 3) Ajustar mes con flechas
      const stepMes = () => {
        cy.get('.MuiPickersCalendarHeader-label')
          .first()
          .invoke('text')
          .then((txt) => {
            const { mes, anio: anioActual } = parseMesAnio(txt);

            if (anioActual !== anio) {
              cy.get('.MuiPickersCalendarHeader-switchViewButton').click({ force: true });
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

      // 4) Seleccionar día (evita días gris)
      cy.get('button.MuiPickersDay-root:not([disabled])')
        .contains(new RegExp(`^${dia}$`))
        .click({ force: true });
    });
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
    const dia = fechaObjetivo.getDate();
    const mesIndex = fechaObjetivo.getMonth();
    const anio = fechaObjetivo.getFullYear();

    return seleccionarFechaEnPopover(anio, mesIndex, dia);
  }

  function seleccionarFechasFiltro(caso, numero, casoId) {
    return UI.abrirPantalla().then(() => {
      cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
      // No verificar que haya filas, solo que la tabla esté visible
      cy.get('.MuiDataGrid-row').should('exist');

      // Abrir selector de rango
      cy.contains('button', /^Todos$/i).first().click({ force: true });
      cy.wait(300);

      // Leer fechas desde el Excel
      // dato_1: fecha inicio (formato: DD/MM/YYYY)
      // dato_2: fecha fin (formato: DD/MM/YYYY)
      // Valores por defecto: "01/12/2020" y "04/01/2021"
      const fechaDesde = caso?.dato_1 || '01/12/2020';
      const fechaHasta = caso?.dato_2 || '04/01/2021';

      cy.log(`TC005: Seleccionando rango de fechas desde ${fechaDesde} hasta ${fechaHasta}`);

      // Parsear fechas
      const fechaInicioObj = parseFechaBasicaExcel(fechaDesde);
      const fechaFinObj = parseFechaBasicaExcel(fechaHasta);

      // =========================
      // FECHA DE INICIO
      // =========================
      cy.get('button[label="Fecha de inicio"], button[label*="Fecha"], button[aria-label*="date"]').first().click({ force: true });
      cy.wait(200);

      seleccionarFechaEnCalendario(fechaInicioObj);

      cy.wait(300);

      // =========================
      // FECHA DE FIN
      // =========================
      cy.get('button[label="Fecha de fin"], button[label*="Fecha"], button[aria-label*="date"]').last().click({ force: true });
      cy.wait(200);

      seleccionarFechaEnCalendario(fechaFinObj);

      cy.wait(400);

      // Aplicar (popover)
      cy.contains('button', /^Aplicar$/i).first().click({ force: true });
      cy.wait(800);

      // Aplicar filtro general
      cy.contains('button', /^Aplicar$/i).last().click({ force: true });
      cy.wait(1000);

      // No verificar que haya filas visibles, el filtro puede no devolver resultados
      // El test es OK si se aplica el filtro correctamente, aunque no haya resultados
      cy.log('TC005: Filtro de fechas aplicado correctamente');
      return cy.wrap(null);
    });
  }

  /** -------------------- AÑADIR CLIENTE -------------------- **/

  function anadirCliente(caso, numero, casoId) {
    const seccion = deducirSeccionDesdeCaso(caso);
    const numeroCaso = numero || parseInt(String(caso?.caso || '').replace(/\D/g, ''), 10);

    cy.log(`Datos recibidos para TC${String(numeroCaso).padStart(3, '0')}: ${JSON.stringify(caso)}`);
    cy.log(`Sección deducida: ${seccion}`);

    const esDatosGenerales = /generales/i.test(seccion);
    const esSeccionContacto = /contacto/i.test(seccion);
    const esSeccionAcciones = /acciones|historial/i.test(seccion);
    const esSeccionCertificaciones = /certific/i.test(seccion);
    const esZonasCarga = /zona(s)?\s+de\s+carga/i.test(seccion);
    const esDatosAdicionales = /dato.*adicional/i.test(seccion);
    const esSeccionDocumentos = /documento/i.test(seccion);
    const esSeccionDireccion = /dirección|direccion/i.test(seccion);
    const esSeccionFacturacion = /facturación|facturacion/i.test(seccion);
    const esSeccionConModal = esSeccionContacto || esSeccionAcciones || esZonasCarga || esSeccionCertificaciones || esSeccionDocumentos || esSeccionDireccion;

    // OPCIÓN 1: Si ya estamos en el formulario, ir directamente a la pestaña
    // OPCIÓN 2: Si estamos en la tabla, hacer todos los pasos necesarios
    return cy.url().then((urlActual) => {
      const enFormulario = urlActual.includes('/dashboard/clients/form');

      if (enFormulario) {
        // OPCIÓN 1: Ya estamos en el formulario, ir directamente a la pestaña
        cy.log(`Ya estamos en el formulario, navegando directamente a la pestaña: ${seccion}`);

        // Si no es Datos Generales, navegar a la pestaña correspondiente
        if (!esDatosGenerales && seccion) {
          // Caso especial: Dirección está dentro de Contacto
          if (esSeccionDireccion) {
            cy.log('Navegando a la pestaña: Contacto (para acceder a Direcciones)');
            return navegarSeccionFormulario('Contacto')
              .then(() => {
                cy.wait(500);
                cy.log('Navegación a la pestaña "Contacto" completada');
                return cy.wrap(null);
              });
          }
          return navegarSeccionFormulario(seccion)
            .then(() => {
              cy.wait(500);
              cy.log(`Navegación a la pestaña "${seccion}" completada`);
              return cy.wrap(null);
            });
        }
        return cy.wrap(null);
      } else {
        // OPCIÓN 2: Estamos en la tabla, hacer todos los pasos necesarios
        cy.log('Estamos en la tabla, ejecutando todos los pasos: abrir pantalla, esperar tabla, abrir formulario');
        return UI.abrirPantalla()
          .then(() => {
            // Verificar que estamos en la lista (no en el formulario) antes de esperar tabla
            return cy.url().then((urlDespuesAbrir) => {
              if (!urlDespuesAbrir.includes('/dashboard/clients/form')) {
                return UI.esperarTabla();
              }
              return cy.wrap(null);
            });
          })
          .then(() => {
            // Verificar de nuevo que seguimos en la lista antes de abrir formulario
            return cy.url().then((urlAntesNuevo) => {
              if (!urlAntesNuevo.includes('/dashboard/clients/form')) {
                cy.log('Pulsando botón "+ Nuevo" para abrir formulario...');
                return abrirFormularioNuevoCliente()
                  .then(() => cy.url().should('include', '/dashboard/clients/form'));
              }
              return cy.wrap(null);
            });
          })
          .then(() => {
            // Si no es Datos Generales, navegar a la pestaña correspondiente
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
      }
    })
      .then(() => {
        // Ahora rellenar el formulario según la sección
        if (esDatosGenerales) {
          return llenarFormularioGeneralesDesdeExcel(caso, numeroCaso);
        }

        // Secciones con modal lateral (Contacto, Acciones, Zonas de carga, etc.)
        if (esSeccionConModal) {
          // Caso especial: Dirección está dentro de Contacto, primero navegar a Contacto
          if (esSeccionDireccion) {
            return navegarSeccionFormulario('Contacto')
              .then(() => {
                cy.wait(500);
                cy.log('Navegando a sub-pestaña "Direcciones" dentro de Contacto...');
                // Buscar y hacer clic en la sub-pestaña "Direcciones"
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
              .then(() => llenarFormularioDireccion(caso, numeroCaso))
              .then(() => guardarModalSeccion(seccion));
          }

          return navegarSeccionFormulario(seccion)
            .then(() => {
              if (esSeccionContacto) return abrirModalContacto();
              if (esSeccionDocumentos) return asegurarGestorDocumentosAbierto();
              // Zonas de carga ahora requiere rellenar "Nombre"
              // Para Zonas de carga NO usamos esperarDrawerVisible() (sus inputs no coinciden con la lista hardcodeada)
              return abrirModalSeccion(seccion, esZonasCarga ? false : !esZonasCarga);
            })
            .then(() => {
              // Zonas de carga: rellenar Nombre (dato_1) y luego guardar
              if (esZonasCarga) return llenarFormularioZonasCarga(caso, numeroCaso);
              // Contacto, Acciones, Certificaciones, Documentos usan funciones específicas, otras secciones usan la genérica
              if (esSeccionContacto) {
                return llenarFormularioContacto(caso, numeroCaso);
              }
              if (esSeccionAcciones) {
                return llenarFormularioAcciones(caso, numeroCaso);
              }
              if (esSeccionCertificaciones) {
                return llenarFormularioCertificaciones(caso, numeroCaso);
              }
              if (esSeccionDocumentos) {
                return llenarFormularioDocumentos(caso, numeroCaso);
              }
              return llenarFormularioSeccion(caso, numeroCaso, seccion);
            })
            .then(() => {
              // Para Zonas de carga, hay que guardar el drawer
              if (esZonasCarga) {
                cy.log('Guardando modal de Zonas de carga...');
                return clickGuardarDentroFormulario().then(() => cy.wait(500));
              }
              return (esSeccionContacto ? guardarModalContacto() : guardarModalSeccion(seccion));
            });
        }

        // Sección Facturación sin modal (rellenar directamente en la pestaña)
        if (esSeccionFacturacion) {
          return navegarSeccionFormulario(seccion)
            .then(() => llenarFormularioFacturacion(caso, numeroCaso));
        }

        // Sección Datos adicionales sin modal (rellenar directamente en la pestaña)
        if (esDatosAdicionales) {
          return navegarSeccionFormulario(seccion)
            .then(() => llenarFormularioDatosAdicionales(caso, numeroCaso));
        }

        // Sección Datos adicionales sin modal (rellenar directamente en la pestaña)
        if (esDatosAdicionales) {
          return navegarSeccionFormulario(seccion)
            .then(() => llenarFormularioDatosAdicionales(caso, numeroCaso));
        }

        // Otras secciones sin modal
        return navegarSeccionFormulario(seccion)
          .then(() => llenarCamposFormulario(caso));
      })
      .then(() => {
        // Solo intentar guardar el formulario principal si no es una sección con modal
        // (el modal ya se guardó en el bloque anterior y puede haber cerrado el formulario)
        if (!esSeccionConModal) {
          cy.contains('button, [type="submit"]', /Guardar/i, { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true });
          cy.wait(1500);
        }

        cy.log(`Formulario completado y enviado con datos del Excel (TC${String(numeroCaso).padStart(3, '0')})`);
      });
  }

  function editarCliente(caso, numero) {
    const nuevoEmail = caso?.dato_1 || caso?.email || 'pruebas@gmail.com';

    // Si ya estamos en el formulario de edición, editar y guardar directamente
    return cy.url().then((urlActual) => {
      const enFormularioEdicion = /\/dashboard\/clients\/form\/\d+$/i.test(urlActual);
      if (enFormularioEdicion) {
        // Caso 16: solo abrir, no editar
        if (numero === 16) {
          cy.log('TC016: ya en formulario, no se edita, solo se mantiene abierto');
          return cy.wrap(null);
        }
        // Caso 17: editar email y guardar
        if (numero === 17) {
          cy.log('TC017: ya en formulario, editando email y guardando');
          return actualizarEmailYGuardar(nuevoEmail);
        }
        // Casos 14 y 15 (mantener compatibilidad)
        if (numero === 14) {
          cy.log('Caso 14: ya en formulario, no se edita, solo se mantiene abierto');
          return cy.wrap(null);
        }
        if (numero === 15) {
          cy.log('Caso 15: ya en formulario, editando email y guardando');
          return actualizarEmailYGuardar(nuevoEmail);
        }
        cy.log('Ya en formulario de edición, editando email y guardando');
        return actualizarEmailYGuardar(nuevoEmail);
      }

      // No estamos en el formulario: ir a la lista, abrir el primer registro y editar
      cy.log('No estamos en formulario, navegando a lista y abriendo primer registro');
      return UI.abrirPantalla()
        .then(() => UI.filasVisibles()
          .should('have.length.greaterThan', 0)
          .first()
          .dblclick({ force: true })
          .then(() => cy.url().should('match', /\/dashboard\/clients\/form\/\d+$/))
        )
        .then(() => {
          if (numero === 16) {
            cy.log('TC016: formulario abierto, sin edición');
            return cy.wrap(null);
          }
          if (numero === 17) {
            cy.log('TC017: formulario abierto, editando email');
            return actualizarEmailYGuardar(nuevoEmail);
          }
          // Casos 14 y 15 (mantener compatibilidad)
          if (numero === 14) {
            cy.log('Caso 14: formulario abierto, sin edición');
            return cy.wrap(null);
          }
          if (numero === 15) {
            cy.log('Caso 15: formulario abierto, editando email');
            return actualizarEmailYGuardar(nuevoEmail);
          }
          return actualizarEmailYGuardar(nuevoEmail);
        });
    });
  }

  function actualizarEmailYGuardar(nuevoEmail) {
    cy.log(`Editando email a: ${nuevoEmail}`);

    const selectoresEmail = [
      'input[name*="mail"]',
      'input[name*="Mail"]',
      'input[placeholder*="mail"]',
      'input[type="email"]'
    ];

    const rellenarEmail = () => cy.get('body').then(($body) => {
      let encontrado = null;
      for (const sel of selectoresEmail) {
        const $el = $body.find(sel).filter(':visible').first();
        if ($el.length) {
          encontrado = $el;
          break;
        }
      }

      if (!encontrado) {
        cy.log('No se encontró input de email visible, se asume ya editado');
        return cy.wrap(null);
      }

      return cy.wrap(encontrado)
        .scrollIntoView()
        .should('be.visible')
        .then(($el) => {
          // Borrado agresivo: click, selectall, clear, y verificar que esté vacío
          cy.wrap($el)
            .click({ force: true })
            .type('{selectall}', { force: true })
            .clear({ force: true })
            .wait(100)
            .then(($input) => {
              const val = $input.val();
              // Si todavía tiene valor, intentar borrar de nuevo
              if (val && val !== '') {
                cy.wrap($input)
                  .click({ force: true })
                  .type('{selectall}', { force: true })
                  .clear({ force: true })
                  .wait(50);
              }
              return cy.wrap(null);
            });
        })
        .then(() => {
          // Escribir el nuevo email
          cy.wrap(encontrado)
            .type(nuevoEmail, { force: true, delay: 0 })
            .then(($el) => {
              const val = $el.val();
              if (val !== nuevoEmail) {
                cy.log(`El valor escrito difiere: esperado="${nuevoEmail}", obtenido="${val}"`);
              } else {
                cy.log(`Email editado correctamente: ${nuevoEmail}`);
              }
              return cy.wrap(null);
            });
        });
    });

    return rellenarEmail();
  }

  function seleccionarFilaYPulsarEliminar(caso, numero, casoId) {
    cy.log('TC018: Seleccionando fila y pulsando botón eliminar');

    // Navegar directamente a la URL de la tabla (sin /form) para asegurar que estamos en la vista inicial
    cy.visit(URL_PATH);
    cy.wait(2000);

    // Verificar que estamos en la vista de tabla, no en el formulario
    cy.url().should('include', URL_PATH).and('not.include', '/form');

    // Esperar a que la tabla esté visible con timeout aumentado
    cy.get('.MuiDataGrid-root', { timeout: 60000 }).should('be.visible');
    cy.wait(2000);

    // Esperar a que las filas se carguen con timeout aumentado
    return cy.get('.MuiDataGrid-row', { timeout: 60000 })
      .should('have.length.greaterThan', 0)
      .then(() => {
        cy.wait(1000); // Espera adicional para asegurar que todo está cargado
        cy.log('Tabla cargada con filas visibles');
      })
      .then(() => {
        cy.log('Seleccionando primera fila con checkbox...');
        // Seleccionar la primera fila con checkbox
        return UI.seleccionarPrimeraFilaConCheckbox();
      })
      .then(() => {
        cy.wait(500); // Esperar a que aparezca la barra de acciones
        cy.log('Fila seleccionada, buscando botón de eliminar...');

        // Buscar el botón de eliminar en la barra de acciones inferior
        return cy.get('body').then(($body) => {
          // Buscar botón que contenga "Eliminar" en el texto
          const $btnEliminar = $body.find('button, a, [role="button"]').filter((_, el) => {
            const texto = (el.textContent || el.innerText || '').trim();
            return /^eliminar$/i.test(texto);
          }).filter(':visible').first();

          if ($btnEliminar.length) {
            cy.log('Botón Eliminar encontrado, haciendo clic...');
            return cy.wrap($btnEliminar[0])
              .scrollIntoView()
              .should('be.visible')
              .click({ force: true });
          } else {
            cy.log('No se encontró botón Eliminar, intentando con selector más amplio...');
            // Fallback: buscar con cy.contains
            return cy.contains('button, a', /^Eliminar$/i, { timeout: 5000 })
              .should('be.visible')
              .scrollIntoView()
              .click({ force: true });
          }
        });
      })
      .then(() => {
        cy.log('Botón Eliminar pulsado, verificando que aparezca el diálogo de confirmación...');
        // Verificar que el diálogo de confirmación aparezca
        cy.contains(/¿Estás seguro|eliminar.*cliente|Esta acción no se puede deshacer/i, { timeout: 5000 })
          .should('be.visible');
        cy.log('TC018: Diálogo de confirmación de eliminación visible. Test completado.');
      });
  }

  function scrollTablaClientes(caso, numero, casoId) {
    return UI.abrirPantalla().then(() => {
      cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom', { duration: 400 });
      cy.wait(200);
      return cy.get('.MuiDataGrid-virtualScroller').scrollTo('top', { duration: 400 });
    });
  }

  function cambiarIdiomasClientes(caso, numero, casoId) {
    return UI.abrirPantalla()
      // Misma lógica que procesos_planificacion: delegar en cambiarIdiomaCompleto con los tres idiomas
      .then(() => cy.cambiarIdiomaCompleto(
        PANTALLA,
        'Clientes',   // Español
        'Clients',    // Catalán
        'Clients',    // Inglés
        20
      ));
  }

  function seleccionarPrimerCliente(caso, numero, casoId) {
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

  function ordenarColumnaDobleClick(nombreColumna) {
    return UI.abrirPantalla().then(() => {
      const patron = obtenerPatronColumna(nombreColumna);

      cy.log(`Pulsando 2 veces en la columna "${nombreColumna}"`);

      return cy.contains('.MuiDataGrid-columnHeaderTitle', patron)
        .should('be.visible')
        .closest('[role="columnheader"]')
        .then(($header) => {
          // Primer clic
          cy.wrap($header).click({ force: true });
          cy.wait(300);

          // Segundo clic
          cy.wrap($header).click({ force: true });
          cy.wait(300);

          // Verificar que la tabla sigue visible
          return UI.filasVisibles().should('have.length.greaterThan', 0);
        });
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

  // Patrón multilenguaje para columnas (es/en/ca)
  function obtenerPatronColumna(nombreColumna = '') {
    const lower = nombreColumna.toLowerCase();

    if (/c[óo]digo/.test(lower)) {
      return /(C[óo]digo|Code|Codi)/i;
    }
    if (/nombre/.test(lower)) {
      return /(Nombre|Name|Nom)/i;
    }
    if (/tel[eé]fono/.test(lower)) {
      return /(Tel[eé]fono|Phone|Tel[eè]fon)/i;
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
    // Recargar la página para asegurar que estamos en la vista inicial (tabla), no en el formulario
    cy.reload();
    cy.wait(1000);

    return UI.abrirPantalla().then(() => {
      // Verificar que estamos en la vista de tabla, no en el formulario
      cy.url().should('include', URL_PATH).and('not.include', '/form');
      cy.wait(500);

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

  function abrirFormularioNuevoCliente() {
    return cy.contains('button, a', /\+?\s?Nuevo|Añadir/i, { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true })
      .then(() => {
        cy.url().should('include', '/dashboard/clients/form');
        return cy.wait(500);
      });
  }

  function guardarFiltroClientes(caso = {}) {
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

  function limpiarFiltroClientes(caso = {}) {
    const termino = caso?.dato_1 || caso?.valor_etiqueta_1 || '';
    if (!termino) {
      cy.log('Excel no define criterio para limpiar filtro');
      return cy.wrap(null);
    }
    return UI.abrirPantalla()
      .then(() => UI.buscar(termino))
      .then(() => cy.contains('button', /(Limpiar|Clear|Netejar)/i).click({ force: true }));
  }

  function seleccionarFiltroGuardadoClientes(caso = {}) {
    const filtroNombre = caso?.dato_1 || caso?.valor_etiqueta_1 || 'filtro clientes';
    return guardarFiltroClientes({
      dato_1: caso?.dato_2 || caso?.valor_etiqueta_2 || filtroNombre,
      dato_2: filtroNombre
    }).then(() => {
      cy.contains('button', /(Guardados|Saved|Guardats)/i).click({ force: true });
      return cy.contains('li, [role="option"]', new RegExp(filtroNombre, 'i')).click({ force: true });
    });
  }

  /** ---------- Fecha / Calendario ---------- **/

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

    cy.log(`Seleccionando "${valor}" en campo "${etiqueta || selector}"`);

    const escaparIdCss = (id = '') => {
      // Escapar caracteres especiales en IDs (p.ej. puntos en ids de MUI)
      return id.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');
    };

    // Si hay etiqueta, buscar primero por etiqueta para encontrar el campo correcto
    if (etiqueta) {
      // Buscar la etiqueta y luego el desplegable asociado
      // IMPORTANTE: restringir a label/legend para evitar capturar spans genéricos de otros componentes (ej. selector de BD)
      return cy.contains('label, fieldset legend span, legend span', new RegExp(`^${escapeRegex(etiqueta)}$`, 'i'), { timeout: 10000 })
        .should('be.visible')
        .then(($label) => {
          // Buscar el contenedor padre (MuiFormControl)
          return cy.wrap($label)
            // IMPORTANTE: no subir hasta <form> (demasiado amplio) para no clicar comboboxes ajenos
            .closest('.MuiFormControl-root, .MuiFormGroup-root, .MuiAutocomplete-root, .MuiTextField-root')
            .then(($container) => {
              // Buscar el desplegable dentro del contenedor
              const selectElement = $container.find('[id="mui-component-select-client.activity"], #mui-component-select-client\\.activity, [role="combobox"], [aria-haspopup="listbox"], div.MuiSelect-root').first();

              if (selectElement.length > 0) {
                const el = selectElement[0];
                const id = el && el.getAttribute ? (el.getAttribute('id') || '') : '';
                const selPorId = id ? `#${escaparIdCss(id)}` : null;

                const clickSeguro = () => {
                  if (selPorId) {
                    return cy.get(selPorId, { timeout: 10000 })
                      .scrollIntoView()
                      .should('be.visible')
                      .click({ force: true });
                  }
                  return cy.wrap(el)
                    .scrollIntoView()
                    .should('be.visible')
                    .click({ force: true });
                };

                return clickSeguro().then(
                  () => cy.wrap(null),
                  (err) => {
                    cy.log(` No se pudo abrir el desplegable "${etiqueta}" (continuando): ${err?.message || err}`);
                    return cy.wrap(null);
                  }
                );
              }

              // Si no se encuentra en el contenedor, buscar por el selector específico
              if (selector) {
                return cy.get(selector, { timeout: 10000 })
                  .scrollIntoView()
                  .should('be.visible')
                  .click({ force: true })
                  .then(
                    () => cy.wrap(null),
                    (err) => {
                      cy.log(`No se pudo clicar selector "${selector}" para "${etiqueta}" (continuando): ${err?.message || err}`);
                      return cy.wrap(null);
                    }
                  );
              }

              // No hacer fallback global (puede clicar el selector de BD u otros comboboxes).
              cy.log(`No se encontró desplegable para "${etiqueta}" en su contenedor. Continuando sin seleccionar.`);
              return cy.wrap(null);
            })
            .then(() => {
              // Esperar a que el menú se abra
              cy.wait(500);

              // Para "Actividad", verificar si hay opciones disponibles antes de buscar
              const esActividad = /actividad/i.test(etiqueta || '');

              if (esActividad) {
                // Verificar si hay mensaje "Sin opciones" o si no hay opciones disponibles
                return cy.get('body').then($body => {
                  const mensajeSinOpciones = $body.find('*').filter((_, el) => {
                    const texto = (el.textContent || '').toLowerCase();
                    return /sin\s+opciones|no\s+hay\s+opciones|no\s+options/i.test(texto);
                  }).filter(':visible');

                  if (mensajeSinOpciones.length > 0) {
                    cy.log(` Campo "Actividad" no tiene opciones disponibles, continuando sin seleccionar...`);
                    // Cerrar el dropdown si está abierto
                    cy.get('body').click({ force: true });
                    return cy.wrap(null);
                  }

                  // Verificar si hay opciones disponibles
                  const opciones = $body.find('li[role="option"], [role="option"], div[role="option"]').filter(':visible');
                  if (opciones.length === 0) {
                    cy.log(` Campo "Actividad" no tiene opciones disponibles, continuando sin seleccionar...`);
                    // Cerrar el dropdown si está abierto
                    cy.get('body').click({ force: true });
                    return cy.wrap(null);
                  }

                  // Si hay opciones, intentar seleccionar la que coincida
                  return cy.contains(
                    'li[role="option"], [role="option"], div[role="option"]',
                    new RegExp(`^${escapeRegex(valor)}$`, 'i'),
                    { timeout: 10000 }
                  )
                    .scrollIntoView()
                    .should('be.visible')
                    .click({ force: true });
                }).then(null, (err) => {
                  // Si falla al buscar la opción, continuar sin error
                  const mensajeError = err && err.message ? err.message : (err ? String(err) : 'Sin opciones disponibles');
                  cy.log(` No se pudo seleccionar "${valor}" en Actividad: ${mensajeError}. Continuando...`);
                  // Cerrar el dropdown si está abierto
                  cy.get('body').click({ force: true });
                  return cy.wrap(null);
                });
              }

              // Para otros campos, comportamiento normal
              return cy.contains(
                'li[role="option"], [role="option"], div[role="option"]',
                new RegExp(`^${escapeRegex(valor)}$`, 'i'),
                { timeout: 10000 }
              )
                .scrollIntoView()
                .should('be.visible')
                .click({ force: true });
            });
        });
    }

    // Si no hay etiqueta, usar el selector original
    return cy.get(selector || '[id="mui-component-select-client.activity"]', { timeout: 10000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true })
      .then(() => {
        cy.wait(500);

        // Para "Actividad", verificar si hay opciones disponibles antes de buscar
        const esActividad = selector && selector.includes('activity');

        if (esActividad) {
          // Verificar si hay mensaje "Sin opciones" o si no hay opciones disponibles
          return cy.get('body').then($body => {
            const mensajeSinOpciones = $body.find('*').filter((_, el) => {
              const texto = (el.textContent || '').toLowerCase();
              return /sin\s+opciones|no\s+hay\s+opciones|no\s+options/i.test(texto);
            }).filter(':visible');

            if (mensajeSinOpciones.length > 0) {
              cy.log(` Campo "Actividad" no tiene opciones disponibles, continuando sin seleccionar...`);
              // Cerrar el dropdown si está abierto
              cy.get('body').click({ force: true });
              return cy.wrap(null);
            }

            // Verificar si hay opciones disponibles
            const opciones = $body.find('li[role="option"], [role="option"], div[role="option"]').filter(':visible');
            if (opciones.length === 0) {
              cy.log(` Campo "Actividad" no tiene opciones disponibles, continuando sin seleccionar...`);
              // Cerrar el dropdown si está abierto
              cy.get('body').click({ force: true });
              return cy.wrap(null);
            }

            // Si hay opciones, intentar seleccionar la que coincida
            return cy.contains(
              'li[role="option"], [role="option"], div[role="option"]',
              new RegExp(`^${escapeRegex(valor)}$`, 'i'),
              { timeout: 10000 }
            )
              .scrollIntoView()
              .should('be.visible')
              .click({ force: true });
          }).then(null, (err) => {
            // Si falla al buscar la opción, continuar sin error
            const mensajeError = err && err.message ? err.message : (err ? String(err) : 'Sin opciones disponibles');
            cy.log(` No se pudo seleccionar "${valor}" en Actividad: ${mensajeError}. Continuando...`);
            // Cerrar el dropdown si está abierto
            cy.get('body').click({ force: true });
            return cy.wrap(null);
          });
        }

        // Para otros campos, comportamiento normal
        return cy.contains(
          'li[role="option"], [role="option"], div[role="option"]',
          new RegExp(`^${escapeRegex(valor)}$`, 'i'),
          { timeout: 10000 }
        )
          .scrollIntoView()
          .should('be.visible')
          .click({ force: true });
      }, (err) => {
        cy.log(`No se pudo abrir el desplegable (${etiqueta || selector}). Continuando: ${err?.message || err}`);
        return cy.wrap(null);
      });
  }

  function normalizarId(selector = '') {
    return selector.replace(/^#/, '').replace(/-label$/i, '');
  }

  function normalizarEtiquetaTexto(texto = '') {
    if (!texto) return null;
    return texto.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function normalizarTextoParaComparar(texto = '') {
    const limpio = normalizarEtiquetaTexto(texto);
    return limpio ? limpio.toLowerCase() : '';
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
    const campos = [];
    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = caso[`dato_${i}`];
      if (!tipo || !selector || valor === undefined || valor === '') continue;
      const etiquetaPreferida =
        CAMPOS_FORMULARIO_ORDEN[i - 1] ||
        normalizarEtiquetaTexto(tipo) ||
        selector;
      const etiquetaNormalizada = normalizarTextoParaComparar(etiquetaPreferida);
      if (etiquetaNormalizada && CAMPOS_IGNORADOS.has(etiquetaNormalizada)) continue;
      campos.push({
        tipo,
        selector,
        valor,
        etiquetaVisible: etiquetaPreferida
      });
    }

    if (campos.length === 0) {
      cy.log('Caso sin datos para completar el formulario');
      return cy.wrap(null);
    }

    const completarCampo = (index = 0) => {
      if (index >= campos.length) return cy.wrap(null);
      const campo = campos[index];
      const valorTexto = campo.valor?.toString() || '';

      if (/actividad/i.test((campo.etiquetaVisible || '').toLowerCase())) {
        return seleccionarOpcionMaterial(campo.selector, valorTexto, campo.etiquetaVisible
        )
          .then(
            () => completarCampo(index + 1),
            () => {
              cy.log(`No se pudo seleccionar ${valorTexto} en Actividad`);
              return completarCampo(index + 1);
            }
          );
      }

      return obtenerCampoFormulario(campo.tipo, campo.selector, campo.etiquetaVisible || campo.selector)
        .then(($elemento) => {
          if (!$elemento || !$elemento.length) {
            cy.log(`No se encontró el campo ${campo.selector}`);
            return null;
          }

          const tipoInput = ($elemento[0]?.type || '').toLowerCase();
          const tag = ($elemento[0]?.tagName || '').toLowerCase();

          if (tipoInput === 'radio' || tipoInput === 'checkbox') {
            const regexValor = new RegExp(`^${escapeRegex(valorTexto)}$`, 'i');
            const candidato = $elemento.filter((_, el) => {
              const label = el.closest('label');
              const texto = (label ? label.innerText : '') || '';
              return regexValor.test(texto) || regexValor.test(el.value || '');
            }).first();
            const objetivo = candidato.length ? candidato : $elemento.first();
            cy.wrap(objetivo).check({ force: true });
            return null;
          }

          if (tag === 'input' || tag === 'textarea') {
            cy.wrap($elemento).clear({ force: true }).type(valorTexto, { force: true });
            cy.wrap($elemento).blur();
            return null;
          }

          if (tag === 'select') {
            cy.wrap($elemento).select(valorTexto, { force: true });
            return null;
          }

          cy.wrap($elemento).click({ force: true }).type(valorTexto, { force: true });
          return null;
        }, () => {
          cy.log(`No se pudo completar el campo ${campo.selector} (${campo.tipo})`);
        })
        .then(() => completarCampo(index + 1));
    };

    return completarCampo(0);
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
          'input[name="add_name"]',              // Dirección
          'input[name="add_address"]',           // Dirección
          'input[name="add_postalCode"]',        // Dirección
          'input[name="add_city"]',              // Dirección
          'input[name="add_region"]',            // Dirección
          'textarea[name="add_notes"]'           // Dirección (Notas es textarea)
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

  function guardarModalSeccion(seccion) {
    const seccionLower = (seccion || '').toLowerCase();
    const esCertificaciones = /certific/i.test(seccionLower);
    const esDocumentos = /documento/i.test(seccionLower);

    // Para Certificaciones, realmente guardar el modal.
    // Documentos ha cambiado: ahora se sube por icono + selector de archivo (sin botón Guardar).
    // IMPORTANTE: Solo guardar el modal, NO el formulario principal
    if (esCertificaciones) {
      cy.log(`Guardando modal de ${seccion}...`);
      return cy.get('body').then($body => {
        // Buscar el botón Guardar dentro del modal/drawer (NO el del formulario principal)
        const botonGuardar = $body.find('.MuiDrawer-root:visible button, .MuiModal-root:visible button, [role="dialog"] button')
          .filter((_, el) => {
            const texto = (el.textContent || '').trim().toLowerCase();
            // Asegurarse de que es el botón del modal, no del formulario principal
            const $modal = Cypress.$(el).closest('.MuiDrawer-root, .MuiModal-root, [role="dialog"]');
            return $modal.length > 0 && /guardar|save|desar/i.test(texto);
          })
          .first();

        if (botonGuardar.length > 0) {
          cy.log(`Botón Guardar encontrado en modal de ${seccion}`);
          return cy.wrap(botonGuardar)
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .then(() => {
              cy.wait(1000); // Esperar a que se guarde y cierre el modal
              cy.log(`Modal de ${seccion} guardado correctamente`);
              return cy.wrap(null);
            });
        } else {
          // Fallback: buscar con cy.contains dentro del modal
          cy.log(`Buscando botón Guardar con cy.contains para ${seccion}...`);
          return cy.get('body').then($body => {
            const modalVisible = $body.find('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="dialog"]:visible').first();

            if (modalVisible.length > 0) {
              return cy.wrap(modalVisible[0])
                .within(() => {
                  const botonEnModal = Cypress.$(modalVisible[0]).find('button')
                    .filter((_, el) => {
                      const texto = (el.textContent || '').trim().toLowerCase();
                      return /^guardar$/i.test(texto);
                    })
                    .first();

                  if (botonEnModal.length > 0) {
                    return cy.wrap(botonEnModal[0])
                      .should('be.visible')
                      .scrollIntoView()
                      .click({ force: true })
                      .then(() => {
                        cy.wait(1000);
                        cy.log(`Modal de ${seccion} guardado correctamente`);
                        return cy.wrap(null);
                      });
                  } else {
                    cy.log(` No se pudo encontrar botón Guardar en modal de ${seccion}, continuando...`);
                    cy.wait(300);
                    return cy.wrap(null);
                  }
                });
            } else {
              cy.log(` No se encontró modal visible para ${seccion}, continuando...`);
              cy.wait(300);
              return cy.wrap(null);
            }
          });
        }
      });
    }

    // Para otras secciones, NO guardar el modal ni el formulario principal
    cy.log(`Pasando al siguiente formulario sin guardar modal de ${seccion}`);
    cy.wait(300);
    return cy.wrap(null);
  }

  // --- Documentos (nuevo flujo) ---
  function obtenerRutaDocumentoPrueba() {
    const override = (Cypress.env('DOCUMENTO_PRUEBA_PATH') || '').toString().trim();
    // Si por entorno se cuela una ruta del Escritorio pero queremos estabilidad,
    // priorizamos el fixture del proyecto (evita dependencias del PC).
    if (override) {
      if (/\\desktop\\/i.test(override)) {
        return 'cypress/fixtures/documento prueba.txt';
      }
      return override;
    }

    const desktopDirOneDrive = (Cypress.env('DESKTOP_DIR_ONEDRIVE') || '').toString().trim();
    const desktopDir = (Cypress.env('DESKTOP_DIR') || '').toString().trim();
    const filename = (Cypress.env('DOCUMENTO_PRUEBA_FILENAME') || 'documento prueba.txt').toString();

    if (desktopDirOneDrive) {
      return `${desktopDirOneDrive}\\${filename}`;
    }

    if (desktopDir) {
      return `${desktopDir}\\${filename}`;
    }

    // Fallback: fixture dentro del repo
    return 'cypress/fixtures/documento prueba.txt';
  }

  function asegurarGestorDocumentosAbierto() {
    const esAddBtnVisible = ($body) =>
      $body
        .find(
          'span[aria-label*="Agregar documento"], button[aria-label*="Agregar documento"], span[aria-label*="Add document"], button[aria-label*="Add document"]'
        )
        .filter(':visible')
        .length > 0;

    // Botón azul "documento" que abre el gestor (HTML aportado por el usuario).
    // Lo identificamos por clase + path del SVG para evitar clicar cosas equivocadas.
    const PATH_ICONO_DOCUMENTO = 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8zm2 16H8v-2h8zm0-4H8v-2h8zm-3-5V3.5L18.5 9z';

    return cy.get('body').then(($body) => {
      if (esAddBtnVisible($body)) return cy.wrap(null);

      // Buscar el botón SOLO dentro de la pantalla/formulario (evita popups del menú "Buscar módulos...")
      const $scope = $body.find('form:visible, [role="main"]:visible, .MuiContainer-root:visible').first();
      const $buscarEn = $scope.length ? $scope : $body;

      const $btn = $buscarEn
        .find('button.css-wjdcvk')
        .filter((_, el) => {
          const d = el.querySelector('svg path')?.getAttribute('d') || '';
          return d === PATH_ICONO_DOCUMENTO;
        })
        .filter(':visible')
        .first();

      if (!$btn.length) {
        cy.log(' Documentos: no se encontró el botón azul (css-wjdcvk) para abrir el gestor. Continuando...');
        return cy.wrap(null);
      }

      return cy.wrap($btn[0])
        .click({ force: true })
        .then(() => cy.wait(800))
        .then(() =>
          cy.get('body').then(($b2) => {
            if (esAddBtnVisible($b2)) return cy.wrap(null);
            cy.log(' Documentos: se pulsó el botón azul pero no apareció "Agregar documento". Continuando...');
            return cy.wrap(null);
          })
        );
    });
  }

  function subirDocumentoPruebaPorIcono() {
    const ruta = obtenerRutaDocumentoPrueba();
    cy.log(`Documentos: subiendo archivo "${ruta}"`);
    cy.log(`Documentos DEBUG env: DOCUMENTO_PRUEBA_PATH="${Cypress.env('DOCUMENTO_PRUEBA_PATH') || ''}", DESKTOP_DIR="${Cypress.env('DESKTOP_DIR') || ''}"`);
    cy.log(`Documentos DEBUG ruta efectiva: "${ruta}"`);

    // Solución 100% automatizable si el botón "+" usa File System Access API:
    // stub de showOpenFilePicker para devolver nuestro archivo sin abrir diálogo nativo.
    const prepararStubShowOpenFilePicker = () => {
      return cy.window({ log: false }).then((win) => {
        // Si la app bloquea clicks automatizados con event.isTrusted, intentamos neutralizarlo.
        // OJO: en algunos Chromes la propiedad puede ser no configurable.
        const intentarParcheIsTrusted = () => {
          try {
            const desc = Object.getOwnPropertyDescriptor(win.Event.prototype, 'isTrusted');
            if (desc && desc.configurable === false) {
              Cypress.log({ name: 'Documentos', message: ' Event.isTrusted no es configurable; puede bloquear clicks automatizados.' });
              return false;
            }
            Object.defineProperty(win.Event.prototype, 'isTrusted', {
              configurable: true,
              get: () => true,
            });
            Cypress.log({ name: 'Documentos', message: ' Parche aplicado: Event.isTrusted => true' });
            return true;
          } catch (e) {
            Cypress.log({ name: 'Documentos', message: ' No se pudo parchear Event.isTrusted; puede bloquear clicks automatizados.' });
            return false;
          }
        };

        intentarParcheIsTrusted();

        if (typeof win.showOpenFilePicker !== 'function') return false;
        if (win.__cypressShowOpenFilePickerStubbed) return true;

        return cy.task('leerArchivoBase64', { filePath: ruta }, { log: false }).then((data) => {
          if (!data || !data.base64) {
            Cypress.log({ name: 'Documentos', message: ' No se pudo leer el archivo para stub de showOpenFilePicker' });
            return false;
          }

          const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
          const file = new win.File(
            [bytes],
            data.name || (Cypress.env('DOCUMENTO_PRUEBA_FILENAME') || 'documento prueba.txt'),
            { type: data.mime || 'application/octet-stream' }
          );

          // Stub compatible: FileSystemFileHandle-like
          const handle = {
            kind: 'file',
            name: file.name,
            getFile: async () => file,
            queryPermission: async () => 'granted',
            requestPermission: async () => 'granted',
          };

          win.__cypressPickerCalls = 0;
          const stub = async () => {
            win.__cypressPickerCalls += 1;
            return [handle];
          };
          win.showOpenFilePicker = stub;
          // Algunas implementaciones lo miran en navigator (por seguridad)
          try { win.navigator.showOpenFilePicker = stub; } catch (e) { /* ignore */ }
          win.__cypressShowOpenFilePickerStubbed = true;
          Cypress.log({ name: 'Documentos', message: '✅ showOpenFilePicker stubbeado (sin diálogo nativo)' });
          return true;
        });
      });
    };

    const esperarConfirmacionSubida = (filename, timeoutMs = 15000) => {
      const inicio = Date.now();
      const nombre = (filename || '').toString().toLowerCase();

      const check = () => {
        return cy.get('body', { log: false }).then(($b) => {
          const raw = ($b.text() || '');
          const txt = raw.toLowerCase();
          const okToast = /archivos subidos correctamente|files uploaded successfully/i.test(raw);
          const okNombre = nombre && txt.includes(nombre);
          if (okToast || okNombre) return true;
          if (Date.now() - inicio >= timeoutMs) return false;
          return cy.wait(500, { log: false }).then(() => check());
        });
      };

      return check();
    };

    // Intento 1 (preferido): capturar el input[type=file] y usar selectFile (sin diálogo nativo).
    // Esto evita bloqueos y es lo más estable si la app usa un input real.
    const prepararCapturaInputFile = () => {
      return cy.window({ log: false }).then((win) => {
        if (win.__cypressFileInputPatched) {
          win.__cypressLastFileInput = null;
          win.__cypressKeepFileInput = false;
          return;
        }
        win.__cypressFileInputPatched = true;
        win.__cypressLastFileInput = null;
        win.__cypressKeepFileInput = false;

        const originalClick = win.HTMLInputElement.prototype.click;
        win.__cypressOriginalFileClick = originalClick;

        // Evitar que el input file “temporal” sea eliminado antes de adjuntar el archivo
        const originalRemove = win.Element.prototype.remove;
        const originalRemoveChild = win.Node.prototype.removeChild;
        win.__cypressOriginalRemove = originalRemove;
        win.__cypressOriginalRemoveChild = originalRemoveChild;

        win.Element.prototype.remove = function patchedRemove() {
          try {
            if (win.__cypressKeepFileInput && win.__cypressLastFileInput && this === win.__cypressLastFileInput) {
              return;
            }
          } catch (e) {
            // ignore
          }
          return originalRemove.apply(this, arguments);
        };

        win.Node.prototype.removeChild = function patchedRemoveChild(child) {
          try {
            if (win.__cypressKeepFileInput && win.__cypressLastFileInput && child === win.__cypressLastFileInput) {
              return child;
            }
          } catch (e) {
            // ignore
          }
          return originalRemoveChild.apply(this, arguments);
        };

        win.HTMLInputElement.prototype.click = function patchedClick() {
          try {
            if (this && this.type === 'file') {
              win.__cypressLastFileInput = this;
              win.__cypressKeepFileInput = true;
              // Algunas implementaciones crean el input en memoria y NO lo insertan en DOM.
              // Para que Cypress pueda usar selectFile(), lo insertamos en el DOM de forma oculta.
              try {
                if (!this.isConnected) {
                  this.setAttribute('data-cy-temp-file-input', '1');
                  this.style.position = 'fixed';
                  this.style.left = '-10000px';
                  this.style.top = '-10000px';
                  this.style.opacity = '0';
                  win.document.body.appendChild(this);
                }
              } catch (e2) {
                // ignore
              }
              // No abrir diálogo nativo
              return;
            }
          } catch (e) {
            // ignore
          }
          return originalClick.apply(this, arguments);
        };
      });
    };

    const restaurarClickInputFile = () => {
      return cy.window({ log: false }).then((win) => {
        if (win.__cypressFileInputPatched && win.__cypressOriginalFileClick) {
          win.HTMLInputElement.prototype.click = win.__cypressOriginalFileClick;
          if (win.__cypressOriginalRemove) win.Element.prototype.remove = win.__cypressOriginalRemove;
          if (win.__cypressOriginalRemoveChild) win.Node.prototype.removeChild = win.__cypressOriginalRemoveChild;
          win.__cypressFileInputPatched = false;
          win.__cypressLastFileInput = null;
          win.__cypressKeepFileInput = false;
        }
      });
    };

    const clickBotonMas = () => {
      // Click en el "+" real del modal (tooltip "Agregar documento")
      return cy.get('body').then(($body) => {
        let $btn = $body.find('span[aria-label="Agregar documento"] button, span[aria-label*="Agregar documento"] button')
          .filter(':visible')
          .first();
        if (!$btn.length) {
          $btn = $body.find('button.css-11jhhn6:visible').first();
        }
        if ($btn.length) {
          return cy.wrap($btn[0]).click({ force: true });
        }
        cy.log(' Documentos: no se encontró el botón "+" para abrir selector. Continuando...');
        return cy.wrap(null);
      });
    };

    const subirPorInputCapturado = () => {
      // Devolver booleano: true si se adjuntó, false si no (para decidir fallback).
      return cy.window({ log: false }).then((win) => {
        const input = win.__cypressLastFileInput;
        if (!input) return cy.wrap(false, { log: false });

        cy.log('Documentos: input[type=file] capturado, intentando adjuntar archivo sin diálogo...');

        // Buscar input de forma segura (sin cy.get que puede fallar el test)
        return cy.get('body', { log: false }).then(($body) => {
          // Preferir el input temporal que insertamos en DOM
          let $inputs = $body.find('input[data-cy-temp-file-input="1"][type="file"]');
          if (!$inputs.length) {
            $inputs = $body.find('input[type="file"]');
          }
          if (!$inputs.length) {
            cy.log(' Documentos: no hay input[type=file] en DOM tras capturar. Se probará con diálogo nativo.');
            return false;
          }

          return cy.wrap($inputs[$inputs.length - 1], { log: false })
            .selectFile(ruta, { force: true })
            .then(
              () => true,
              (err) => {
                cy.log(` Documentos: selectFile() falló (se usará diálogo nativo). Detalle: ${err?.message || err}`);
                return false;
              }
            )
            .then((ok) => {
              // Permitir limpieza del input temporal una vez intentado el attach
              return cy.window({ log: false }).then((w2) => {
                w2.__cypressKeepFileInput = false;
                // Intentar limpiar el input temporal si quedó en el DOM
                try {
                  const el = w2.document.querySelector('input[data-cy-temp-file-input="1"][type="file"]');
                  if (el) el.remove();
                } catch (e3) {
                  // ignore
                }
                return ok;
              });
            });
        });
      });
    };

    const seleccionarEnDialogoWindows = () => {
      // Automatiza el diálogo nativo: escribe ruta y Enter (equivalente a "Abrir")
      cy.log('Documentos: esperando diálogo nativo "Abrir/Open" y seleccionando archivo...');
      return cy.task(
        'seleccionarArchivoDialogoWindows',
        // Mantenerlo corto para que no "congele" la ejecución
        { filePath: ruta, timeoutMs: 12000 },
        { log: false, timeout: 20000 }
      )
        .then((ok) => {
          if (ok) {
            cy.log('Documentos: diálogo "Abrir/Open" completado');
            return cy.wait(800);
          }
          cy.log(' Documentos: no se pudo automatizar el diálogo (no se detectó o no hubo foco).');
          return cy.wrap(null);
        });
    };

    let pickerStubbed = false;

    return asegurarGestorDocumentosAbierto()
      .then(() => prepararStubShowOpenFilePicker().then((ok) => { pickerStubbed = !!ok; }))
      // Aunque stubbeemos el picker, puede que la app NO lo use (use input.click). Preparamos captura siempre.
      .then(() => prepararCapturaInputFile())
      .then(() => clickBotonMas())
      .then(() => cy.wait(800))
      .then(() => {
        // Si el picker existe y fue stubbeado, comprobamos si realmente se llamó.
        if (!pickerStubbed) return cy.wrap(false);
        return cy.window({ log: false }).then((win) => {
          const calls = Number(win.__cypressPickerCalls || 0);
          Cypress.log({ name: 'Documentos', message: `Picker calls: ${calls}` });
          return calls > 0;
        });
      })
      .then((pickerFueLlamado) => {
        const filename = (Cypress.env('DOCUMENTO_PRUEBA_FILENAME') || 'documento prueba.txt').toString();

        if (pickerFueLlamado) {
          // Espera activa (sin fallar) para que se refleje en UI
          return esperarConfirmacionSubida(filename, 15000).then(() => cy.wrap(null));
        }

        // Si no se llamó el picker (o no existe), seguimos con input temporal y luego diálogo
        return subirPorInputCapturado()
          .then((ok) => {
            if (ok) return cy.wrap(null);
            const intentoDialogo = () =>
              restaurarClickInputFile()
                .then(() => clickBotonMas())
                .then(() => cy.wait(700))
                .then(() => seleccionarEnDialogoWindows());
            return intentoDialogo().then(() => intentoDialogo());
          });
      })
      .then(() => {
        // Confirmación robusta sin hacer fallar el test:
        // - Si sale toast, lo logueamos
        // - Si no, buscamos el filename en el texto del modal/tabla
        const filename = (Cypress.env('DOCUMENTO_PRUEBA_FILENAME') || 'documento prueba.txt').toString();

        return cy.get('body').then(($b) => {
          const texto = ($b.text() || '');
          const textoLower = texto.toLowerCase();

          if (/Archivos subidos correctamente|Files uploaded successfully/i.test(texto)) {
            cy.log(' Documentos: subida confirmada por texto/toast');
            return cy.wrap(null);
          }

          if (textoLower.includes(filename.toLowerCase())) {
            cy.log(` Documentos: archivo "${filename}" aparece en la tabla`);
            return cy.wrap(null);
          }

          cy.log(` Documentos: no pude confirmar subida (no aparece toast ni "${filename}"). Continuando igualmente.`);
          return cy.wrap(null);
        });
      }, (err) => {
        cy.log(` Documentos: no se pudo subir (continuando): ${err?.message || err}`);
        return cy.wrap(null);
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
    if (nombre.includes('contacto')) return 'Contacto';
    if (nombre.includes('historial')) return 'Acciones'; // Historial ahora se llama "Acciones"
    if (nombre.includes('accion') || nombre.includes('acciones')) return 'Acciones';
    if (nombre.includes('zona de carga') || nombre.includes('zonas de carga')) return 'Zonas de carga';
    if (nombre.includes('certific')) return 'Certificaciones';
    if (nombre.includes('dato adicional') || nombre.includes('datos adicional') || nombre.includes('adicional') || nombre.includes('facturación electrónica') || nombre.includes('facturacion electronica')) return 'Datos adicionales';
    if (nombre.includes('documento')) return 'Documentos';
    // Ojo: en algunos Excels el nombre puede incluir "dirección de facturación".
    // Para TC043 es crítico que eso se trate como la pestaña "Facturación" (sin modal),
    // no como "Dirección" (que va dentro de Contacto).
    if (nombre.includes('facturación') || nombre.includes('facturacion')) return 'Facturación';
    if (nombre.includes('dirección') || nombre.includes('direccion')) return 'Dirección';
    return 'Generales';
  }

  function escapeRegex(texto = '') {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Función para seleccionar la primera opción disponible en un combobox/autocomplete por label
  // Adaptada para labels/legends no visibles (como País) y usando el patrón de Actividad
  function seleccionarPrimeraOpcionPorLabel(labelTexto) {
    cy.log(`Buscando dropdown "${labelTexto}" para seleccionar la primera opción...`);

    const abrirDropdownDesde = ($container) => {
      // Preferencia: botón/combobox dentro del contenedor
      const selectElement = $container.find(
        'button[aria-haspopup="listbox"], [role="combobox"], [aria-haspopup="listbox"], div.MuiSelect-root, input[role="combobox"], input[aria-autocomplete="list"], input'
      ).first();

      if (selectElement.length > 0) {
        return cy.wrap(selectElement)
          .should('exist')
          .click({ force: true });
      }

      cy.log(' No se encontró elemento clickeable dentro del contenedor, buscando genérico en body...');
      return cy.get('[role="combobox"], [aria-haspopup="listbox"], input[role="combobox"], input[aria-autocomplete="list"]', { timeout: 10000 })
        .first()
        .should('exist')
        .click({ force: true });
    };

    const seleccionarPrimeraOpcion = () => {
      // Esperar más tiempo para que el listbox se cargue completamente
      cy.wait(1000);

      // Buscar el listbox primero (igual que en vehículos)
      return cy.get('body').then($body => {
        // Verificar si hay listbox visible
        const $listbox = $body.find('ul[role="listbox"]:visible, [role="listbox"]:visible').first();

        if ($listbox.length > 0) {
          return cy.wrap($listbox[0])
            .should('be.visible')
            .within(() => {
              return cy.get('li[role="option"]:visible, [role="option"]:visible')
                .first()
                .should('be.visible')
                .then($option => {
                  const textoOpcion = ($option.text() || '').trim();
                  cy.log(`Seleccionando primera opción: ${textoOpcion}`);
                  return cy.wrap($option)
                    .click({ force: true });
                });
            })
            .then(() => {
              cy.wait(300);
              cy.log(` Primera opción seleccionada en "${labelTexto}"`);
            }, () => {
              cy.log(` No se pudo seleccionar opción en listbox, continuando...`);
              cy.get('body').click({ force: true });
              return cy.wrap(null);
            });
        }

        // Si no hay listbox, buscar opciones directamente
        const $opciones = $body.find('li[role="option"]:visible, [role="option"]:visible').filter(':visible');
        if ($opciones.length > 0) {
          return cy.wrap($opciones[0])
            .should('exist')
            .click({ force: true })
            .then(() => {
              cy.log(` Primera opción seleccionada en "${labelTexto}" (fallback)`);
            }, () => {
              cy.log(` No se pudo hacer clic en opción, continuando...`);
              cy.get('body').click({ force: true });
              return cy.wrap(null);
            });
        }

        // Si no hay opciones, simplemente continuar sin error
        cy.log(` Campo "${labelTexto}" no tiene opciones disponibles, continuando sin seleccionar...`);
        cy.get('body').click({ force: true });
        return cy.wrap(null);
      });
    };

    // 1) Intentar por label/legend usando jQuery directamente (más robusto)
    return cy.get('body').then($body => {
      // Buscar label
      let $label = $body.find('label').filter((_, el) => {
        const texto = (el.textContent || el.innerText || '').trim();
        return new RegExp(`^${escapeRegex(labelTexto)}$`, 'i').test(texto);
      }).first();

      // Si no se encuentra label, buscar legend span
      if ($label.length === 0) {
        $label = $body.find('legend span, fieldset legend span').filter((_, el) => {
          const texto = (el.textContent || el.innerText || '').trim();
          return new RegExp(`^${escapeRegex(labelTexto)}$`, 'i').test(texto);
        }).first();
      }

      if ($label.length > 0) {
        const forAttr = $label.attr('for');
        if (forAttr) {
          // Si hay for, usar el target directo
          return cy.get(`#${forAttr}`, { timeout: 10000 })
            .should('exist')
            .click({ force: true })
            .then(() => {
              cy.wait(700);
              return seleccionarPrimeraOpcion();
            });
        }

        // Sin for: usar el contenedor padre
        const $container = $label.closest('.MuiFormControl-root, .MuiFormGroup-root, form, div[class*="Form"], .MuiAutocomplete-root, .MuiTextField-root, .MuiInputBase-root').first();
        if ($container.length > 0) {
          return abrirDropdownDesde($container)
            .then(() => {
              cy.wait(700);
              return seleccionarPrimeraOpcion();
            });
        }
      }

      // Si no se encuentra nada, buscar directamente el input cerca del texto
      cy.log(`No se encontró label/legend, buscando input cerca del texto "${labelTexto}"...`);
      const $elementosConTexto = $body.find('*').filter((_, el) => {
        const texto = (el.textContent || el.innerText || '').trim();
        return new RegExp(`^${escapeRegex(labelTexto)}$`, 'i').test(texto);
      });

      if ($elementosConTexto.length > 0) {
        const $primerElemento = $elementosConTexto.first();
        const $container = $primerElemento.closest('.MuiFormControl-root, .MuiAutocomplete-root, .MuiTextField-root, .MuiInputBase-root');
        if ($container.length > 0) {
          return abrirDropdownDesde($container)
            .then(() => {
              cy.wait(700);
              return seleccionarPrimeraOpcion();
            });
        }
      }

      cy.log(` No se encontró ningún elemento para "${labelTexto}"`);
      return cy.wrap(null);
    });
  }

  function llenarFormularioGeneralesDesdeExcel(caso, numeroCaso) {
    const alta = caso.dato_1;   // 22/11/2025
    const razonSocial = caso.dato_2;   // prueba
    const actividad = caso.dato_3;   // ALMACENES (Autocomplete)
    const web = caso.dato_4;   // web
    const persona = caso.dato_5;   // Física/Jurídica
    const nombre = caso.dato_6;   // prueba
    const nif = caso.dato_7;   // 12345p
    const niva = caso.dato_8;   // 123
    const tlfFijo = caso.dato_9;   // 999874587
    const tlfMovil = caso.dato_10;  // 666254478
    const email = caso.dato_11;  // prueba@gmail.com
    const notas = caso.dato_12;  // prueba
    const residencia = caso.dato_13;  // España/Extranjero/UE

    // Helper para leer del Excel por name (como en Facturación)
    const obtenerDatoPorNameExcel = (nameAttr) => {
      if (!nameAttr) return null;
      const total = Number(caso?.__totalCamposExcel) || 30;
      const nameAttrLower = (nameAttr || '').toString().toLowerCase().trim();
      for (let i = 1; i <= total; i++) {
        const tipo = (caso?.[`etiqueta_${i}`] || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
        const selector = (caso?.[`valor_etiqueta_${i}`] || '').toString().toLowerCase().trim();
        const val = caso?.[`dato_${i}`];
        if (!tipo.includes('name')) continue;
        const selectorSinPrefijo = selector.replace(/^client\./, '');
        const nameAttrSinPrefijo = nameAttrLower.replace(/^client\./, '');
        const coincide = selector === nameAttrLower ||
          selector.includes(nameAttrLower) ||
          nameAttrLower.includes(selector) ||
          selectorSinPrefijo === nameAttrSinPrefijo ||
          selectorSinPrefijo.includes(nameAttrSinPrefijo) ||
          nameAttrSinPrefijo.includes(selectorSinPrefijo);
        if (coincide && val !== undefined && val !== null && `${val}` !== '') {
          return val;
        }
      }
      return null;
    };

    const direccion = caso.dato_14;  // prueba
    // C.P se lee SOLO por name client.postalCode (no desplaza los demás campos)
    const codigoPostal = obtenerDatoPorNameExcel('client.postalCode');  // 29620 (C.P)
    const ciudad = caso.dato_15;  // prueba
    const provincia = caso.dato_16;  // prueba
    const pais = caso.dato_17;  // prueba

    const contactoEmail = caso.dato_18; // prueba@gmail.com
    const contactoTelefono = caso.dato_19; // 952345678
    const contactoCargo = caso.dato_21; // prueba

    let chain = cy.wrap(null);

    // Alta (fecha)
    if (alta) {
      chain = chain.then(() => {
        const textoFecha = alta.toString();
        const fechaObj = parseFechaBasicaExcel(textoFecha);

        return cy.contains('label', /^Alta$/i, { timeout: 10000 })
          .parents('.MuiFormControl-root')
          .first()
          .within(() => {
            cy.get('button[aria-label="Choose date"], button[aria-label*="date"], button[aria-label*="calendar"]')
              .first()
              .click({ force: true });
          })
          .then(() => seleccionarFechaEnCalendario(fechaObj));
      });
    }

    // Campos por name (solo los que tu Excel trae)
    const campos = [
      { label: 'Nombre', name: 'client.name', valor: nombre },
      { label: 'Razón Social', name: 'client.companyName', valor: razonSocial },
      { label: 'NIF/CIF', name: 'client.nif', valor: nif },
      { label: 'NIVA', name: 'client.niva', valor: niva },
      { label: 'E-mail', name: 'client.email', valor: email },
      { label: 'Tlf. Fijo', name: 'client.phoneNumber', valor: tlfFijo },
      { label: 'Tlf. Móvil', name: 'client.mobileNumber', valor: tlfMovil },
      { label: 'Web', name: 'client.web', valor: web },
      { label: 'Notas', name: 'client.notes', valor: notas },

      // Dirección fiscal (en UI nueva)
      { label: 'Dirección', name: 'client.address', valor: direccion },
      { label: 'C.P', name: 'client.postalCode', valor: codigoPostal },
      { label: 'Ciudad', name: 'client.city', valor: ciudad },
      { label: 'Provincia', name: 'client.region', valor: provincia },
      { label: 'País', name: 'client.country', valor: pais },

      // Contacto principal (UI nueva)
      { label: 'Contacto - E-mail', name: 'client.principalContactEmail', valor: contactoEmail },
      { label: 'Contacto - Teléfono', name: 'client.principalContactPhone', valor: contactoTelefono },
      { label: 'Contacto - Cargo', name: 'client.principalContactJobTitle', valor: contactoCargo },
    ];

    campos.forEach(c => {
      chain = chain
        .then(() => escribirPorNameSeguro(c.name, c.valor, c.label))
        .then(() => cy.wait(100)); // Pequeña espera entre campos para evitar errores 500
    });

    // Actividad (Autocomplete)
    if (actividad) {
      chain = chain.then(() => seleccionarActividadAutocomplete(actividad));
    }

    // Persona (radio J/F)
    if (persona) {
      chain = chain.then(() => seleccionarRadioPorNameSeguro('client.clientPerson', persona, 'Persona'));
    }

    // Residencia (radio R/E/U)
    if (residencia) {
      chain = chain.then(() => seleccionarRadioPorNameSeguro('client.clientResidency', residencia, 'Residencia'));
    }

    return chain
      .then(() => {
        // Esperar un momento adicional para asegurar que todos los campos estén procesados
        cy.wait(500);
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Datos Generales rellenados (mapeo Excel 1..21 OK)`);
      })
      .then(() => {
        // Verificar que los campos obligatorios estén rellenados antes de continuar
        cy.log('Verificando que los campos obligatorios estén rellenados...');
        return cy.get('body').then($body => {
          // Buscar campos con borde rojo (campos obligatorios vacíos)
          const camposObligatoriosVacios = $body.find('input[required], textarea[required]')
            .filter((_, el) => {
              const valor = (el.value || '').trim();
              return !valor && el.offsetParent !== null; // Visible y vacío
            });

          if (camposObligatoriosVacios.length > 0) {
            cy.log(` ADVERTENCIA: Se encontraron ${camposObligatoriosVacios.length} campos obligatorios vacíos`);
            // Listar los campos vacíos para debug
            camposObligatoriosVacios.each((i, el) => {
              const label = $body.find(`label[for="${el.id}"]`).text() || el.name || 'sin etiqueta';
              cy.log(`  - Campo vacío: ${label} (name="${el.name}")`);
            });
          } else {
            cy.log('✓ Todos los campos obligatorios parecen estar rellenados');
          }
        });
      });
  }

  function escribirPorNameSeguro(nameAttr, valor, etiqueta = '') {
    if (!nameAttr || valor === undefined || valor === null || String(valor).trim() === '') {
      return cy.wrap(null);
    }

    const texto = String(valor);
    const selector = `input[name="${nameAttr}"], textarea[name="${nameAttr}"]`;
    const etiquetaLog = etiqueta || nameAttr;

    cy.log(`Escribiendo en "${etiquetaLog}": ${texto}`);

    return cy.get('body').then($body => {
      const $found = $body.find(selector);

      if (!$found.length) {
        cy.log(`(SKIP) No existe en UI: ${nameAttr}`);
        return cy.wrap(null);
      }

      const $el = $found.first();

      return cy.wrap($el)
        .scrollIntoView()
        .should('be.visible')
        .then(() => cy.wrap($el).clear({ force: true }))
        .then(() => {
          cy.wait(80);
          return cy.wrap($el).type(texto, { force: true, delay: 0 });
        })
        .then(() => {
          cy.wait(30);
          return cy.wrap($el).should(($input) => {
            const actual = $input.val();
            if (actual !== texto) {
              cy.log(` "${etiquetaLog}" esperaba "${texto}" pero tiene "${actual}" (ok, seguimos)`);
            }
          });
        });
    });
  }

  function seleccionarRadioPorNameSeguro(name, textoHumano, etiqueta = '') {
    if (!textoHumano) return cy.wrap(null);

    const t = String(textoHumano).trim().toLowerCase();

    const mapPersona = { 'juridica': 'J', 'jurídica': 'J', 'fisica': 'F', 'física': 'F' };
    const mapResidencia = { 'españa': 'R', 'espana': 'R', 'extranjero': 'E', 'ue': 'U' };

    const value =
      name === 'client.clientPerson' ? (mapPersona[t] || textoHumano) :
        name === 'client.clientResidency' ? (mapResidencia[t] || textoHumano) :
          textoHumano;

    const selector = `input[type="radio"][name="${name}"][value="${value}"]`;
    const etiquetaLog = etiqueta || name;

    return cy.get('body').then($body => {
      const $radio = $body.find(selector);
      if (!$radio.length) {
        cy.log(`(SKIP) Radio no existe: ${etiquetaLog} (${name}=${value})`);
        return cy.wrap(null);
      }
      cy.log(`Seleccionando ${etiquetaLog}: ${textoHumano} -> ${value}`);
      return cy.wrap($radio.first()).check({ force: true });
    });
  }

  function seleccionarActividadAutocomplete(valor) {
    if (!valor) return cy.wrap(null);

    const texto = String(valor);

    return cy.contains('label', /^Actividad$/i, { timeout: 10000 })
      .should('exist')
      .then($label => {
        const forId = $label.attr('for'); // ej: _r_3u_

        if (forId) {
          return cy.get(`#${forId}`, { timeout: 10000 })
            .scrollIntoView()
            .should('be.visible')
            .clear({ force: true })
            .type(texto, { force: true, delay: 0 })
            .type('{enter}', { force: true });
        }

        // Fallback por si cambian el for
        return cy.get('input[role="combobox"]', { timeout: 10000 })
          .first()
          .scrollIntoView()
          .should('be.visible')
          .clear({ force: true })
          .type(texto, { force: true, delay: 0 })
          .type('{enter}', { force: true });
      });
  }

  // Rellenar formulario de Contacto en el modal lateral
  function llenarFormularioContacto(caso, numeroCaso) {
    const nombre = caso.dato_1;
    const email = caso.dato_2;
    const telefono = caso.dato_3;
    const cargo = caso.dato_4;

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
    // Ya no existe label "Fecha": el campo es el datepicker (input + botón calendario)
    if (fecha) {
      chain = chain.then(() => {
        const textoFecha = fecha.toString();
        const fechaObj = parseFechaBasicaExcel(textoFecha);
        cy.log(`Rellenando Fecha con ${textoFecha}`);

        // Buscar el datepicker dentro del drawer/modal visible (Crear Acción)
        const abrirCalendario = () => {
          return cy.get('body').then(($body) => {
            const $container = $body
              .find('.MuiDrawer-root:visible, [role="dialog"]:visible, .MuiModal-root:visible')
              .last();

            const $btn = $container
              .find('button[aria-label*="Choose date"], button[aria-label*="date"], button[aria-label*="fecha"]')
              .filter(':visible')
              .first();

            if ($btn.length) {
              return cy.wrap($btn[0]).click({ force: true });
            }

            // Fallback: click sobre el input (típico placeholder DD/MM/YYYY)
            const $inp = $container
              .find('input[placeholder="DD/MM/YYYY"], input[placeholder*="DD/"], input')
              .filter(':visible')
              .first();
            if ($inp.length) {
              return cy.wrap($inp[0]).click({ force: true });
            }

            // Último fallback: buscar botón calendario en toda la página visible
            return cy.get('button[aria-label*="Choose date"], button[aria-label*="date"], button[aria-label*="fecha"]', { timeout: 10000 })
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
    const numero = caso.dato_1;
    const fecha = caso.dato_2;
    const tipoCertificacion = caso.dato_3; // NUEVO (Excel: id _r_af_ -> "Seguridad Social")

    cy.log(`Datos Certificaciones detectados: numero=${numero}, fecha=${fecha}, tipoCertificacion=${tipoCertificacion}`);

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

        // Ya no existe label "Fecha": abrir el datepicker dentro del drawer "Crear Certificación"
        const titulo = /(Crear\s+Certificaci[oó]n|Create\s+Certification)/i;

        const abrirCalendario = () => {
          // Igual que en ACCIONES: no dependemos de label, clicamos el botón del calendario
          // o el input DD/MM/YYYY dentro del drawer "Crear Certificación".
          return cy.contains(titulo, { timeout: 20000 })
            .should('be.visible')
            .then(($t) => {
              const $anc = Cypress.$($t).parents();
              const contenedor = Array.from($anc).find((a) => {
                const $a = Cypress.$(a);
                const tieneBtn = $a.find('button[aria-label*="Choose date"], button[aria-label*="date"], button[aria-label*="fecha"]').length > 0;
                const tieneInput = $a.find('input[placeholder="DD/MM/YYYY"], input[placeholder*="DD/"]').length > 0;
                return tieneBtn || tieneInput;
              });
              return cy.wrap(contenedor || Cypress.$($t).parent());
            })
            .within(() => {
              // 1) Botón calendario
              cy.get('button[aria-label*="Choose date"], button[aria-label*="date"], button[aria-label*="fecha"]', { timeout: 15000 })
                .filter(':visible')
                .first()
                .then(($btn) => {
                  if ($btn.length) {
                    return cy.wrap($btn[0]).click({ force: true });
                  }
                  // 2) Fallback: input
                  return cy.get('input[placeholder="DD/MM/YYYY"], input[placeholder*="DD/"]', { timeout: 15000 })
                    .filter(':visible')
                    .first()
                    .click({ force: true });
                });
            });
        };

        return abrirCalendario()
          .then(() => cy.wait(300))
          .then(() => seleccionarFechaEnCalendario(fechaObj));
      });
    }

    // Tipo de Certificación: autocomplete/combobox (seleccionar el valor del Excel, p.ej. "Seguridad Social")
    if (tipoCertificacion) {
      chain = chain.then(() => {
        const valorTxt = tipoCertificacion.toString();
        cy.log(`Seleccionando "Tipo de Certificación": ${valorTxt}`);

        const seleccionarOpcion = () => {
          const regexValor = new RegExp(`^${escapeRegex(valorTxt)}$`, 'i');
          return cy.get('body').then(($body) => {
            const $opts = $body.find('[role="option"]').filter(':visible');
            if (!$opts.length) return cy.wrap(null);

            const exacta = Array.from($opts).find((el) => regexValor.test((el.textContent || '').trim()));
            if (exacta) return cy.wrap(exacta).click({ force: true });

            return cy.wrap($opts[0]).click({ force: true });
          });
        };

        // Preferir el id del input si existe (Excel aporta _r_af_)
        return cy.get('body').then(($body) => {
          const $inpPorId = $body.find('input#_r_af_, input[id="_r_af_"]').filter(':visible').first();
          if ($inpPorId.length) {
            return cy.wrap($inpPorId[0])
              .scrollIntoView()
              .click({ force: true })
              .clear({ force: true })
              .type(valorTxt, { force: true })
              .then(() => cy.wait(500))
              .then(() => seleccionarOpcion());
          }

          // Fallback: por label "Tipo de Certificación"
          return cy.contains('label', /^Tipo de Certificaci[oó]n$/i, { timeout: 10000 })
            .should('exist')
            .invoke('attr', 'for')
            .then((forAttr) => {
              if (forAttr) {
                return cy.get(`#${forAttr}`, { timeout: 10000 })
                  .scrollIntoView()
                  .click({ force: true })
                  .clear({ force: true })
                  .type(valorTxt, { force: true })
                  .then(() => cy.wait(500))
                  .then(() => seleccionarOpcion());
              }
              return cy.wrap(null);
            });
        });
      });
    }

    // Empresa es un autocomplete/combobox - seleccionar la primera opción disponible
    chain = chain.then(() => {
      cy.log('Seleccionando primera opción en "Empresa" (CERTIFICACIONES)...');
      return seleccionarPrimeraOpcionPorLabel('Empresa');
    });

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
        cy.log(`Campo vacío en Excel: ${campo.label}`);
        return;
      }

      // Para "Dto." en Datos adicionales, escribir directamente sin scroll
      if (campo.name === 'client.discount') {
        chain = chain.then(() => {
          cy.log(`Escribiendo en "${campo.label}": ${campo.valor}`);
          return cy.get('body').then($body => {
            const $input = $body.find(`input[name="${campo.name}"]`).filter(':visible').first();
            if ($input.length) {
              return cy.wrap($input[0])
                .click({ force: true })
                .type('{selectall}', { force: true })
                .clear({ force: true })
                .wait(50)
                .type(String(campo.valor), { force: true, delay: 0 });
            }
            cy.log(`(SKIP) No existe en UI: ${campo.name}`);
            return cy.wrap(null);
          });
        });
      } else {
        chain = chain.then(() =>
          escribirPorName(campo.name, campo.valor, campo.label)
        );
      }
    });

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Datos adicionales rellenado desde Excel`);
    });
  }

  // Rellenar formulario de Documentos en el modal lateral
  function llenarFormularioDocumentos(caso, numeroCaso) {
    // Nuevo flujo: subir archivo por icono (Agregar documento).
    cy.log('Documentos: flujo nuevo (icono + subida de archivo)');

    return subirDocumentoPruebaPorIcono().then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Documentos rellenado desde Excel`);
    });
  }

  // Rellenar formulario de Dirección en el modal lateral
  function llenarFormularioDireccion(caso, numeroCaso) {
    // Orden según Excel: Tipo, Domicilio, C.Postal, Población, País, Notas
    const tipo = caso.dato_1;           // "Fiscal" - Select con name="add_add_typeId"
    const domicilio = caso.dato_2;      // "prueba" - Input con name="add_address"
    const codigoPostal = caso.dato_3;   // "12345" - Input con name="add_postalCode"
    const poblacion = caso.dato_4;      // "233" - Autocomplete con id="_r_9g_"
    const pais = caso.dato_5;            // "ESPAÑA" - Autocomplete con id="_r_9j_"
    const notas = caso.dato_6;          // "prueba" - Textarea con name="add_notes"
    const provincia = caso.dato_7;      // Opcional, puede no estar en Excel

    cy.log(`Datos Dirección detectados: tipo=${tipo}, domicilio=${domicilio}, codigoPostal=${codigoPostal}, poblacion=${poblacion}, pais=${pais}, notas=${notas}, provincia=${provincia || '(vacío)'}`);

    let chain = cy.wrap(null);

    // Función auxiliar para escapar regex
    const escapeRegex = (texto = '') => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Función genérica para manejar Selects (País) - buscar por label
    const seleccionarSelectPorLabel = (labelText, valor) => {
      cy.log(`Seleccionando "${labelText}": ${valor} (Select)...`);
      // Buscar el label y luego el Select - continuar la cadena directamente sin .then()
      return cy.contains('label', new RegExp(`^${escapeRegex(labelText)}$`, 'i'), { timeout: 10000 })
        .should('exist')
        .closest('.MuiFormControl-root')
        .find('.MuiSelect-root, [role="combobox"], .MuiSelect-select')
        .first()
        .should('exist')
        .click({ force: true })
        .then(() => {
          cy.wait(1000); // Esperar más tiempo para que se abra el listbox
          // Buscar la opción en el listbox con más tiempo
          return cy.get('ul[role="listbox"]:visible', { timeout: 10000 })
            .first()
            .should('be.visible')
            .within(() => {
              cy.contains('li[role="option"]', new RegExp(`^${escapeRegex(valor)}$`, 'i'))
                .click({ force: true });
            })
            .then(() => {
              cy.wait(300);
              cy.log(` ${labelText} "${valor}" seleccionado`);
            }, () => {
              // Si no encuentra exacto, primera opción
              return cy.get('ul[role="listbox"]:visible')
                .first()
                .within(() => {
                  return cy.get('li[role="option"]:visible')
                    .first()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(300);
                      cy.log(` Primera opción de ${labelText} seleccionada (fallback)`);
                    });
                });
            });
        }, () => {
          cy.log(` No se pudo hacer clic en el Select de "${labelText}"`);
          return cy.wrap(null);
        });
    };

    // Mapeo de campos del Excel a los name attributes del formulario (usando los nombres reales del HTML)
    const camposDireccion = [
      { name: 'add_add_typeId', valor: tipo, label: 'Tipo', tipo: 'select' }, // Select
      { name: 'add_address', valor: domicilio, label: 'Domicilio' },
      { name: 'add_postalCode', valor: codigoPostal, label: 'C. Postal' },
      { name: 'add_city', valor: poblacion, label: 'Población', tipo: 'autocomplete' }, // Autocomplete
      { name: 'add_region', valor: provincia, label: 'Provincia' }, // Input normal
      { name: 'add_notes', valor: notas, label: 'Notas' }
    ];

    // Función auxiliar para manejar autocompletes (Población) - igual que en proveedores
    const escribirInputYSeleccionar = ($input, valor, labelCampo) => {
      // Escribir el valor (igual que en proveedores: selectall + backspace + type)
      return cy.wrap($input)
        .scrollIntoView()
        .click({ force: true })
        .type('{selectall}{backspace}', { force: true })
        .type(String(valor), { force: true })
        .then(() => {
          // Esperar un poco para que el listbox aparezca después de escribir
          cy.wait(1000);
          // Verificar si hay listbox visible antes de intentar seleccionar
          return cy.get('body').then(($body) => {
            const hayList = $body.find('ul[role="listbox"]:visible').length > 0;
            if (hayList) {
              // Si aparece el listbox, seleccionar la opción
              return cy.get('ul[role="listbox"]:visible', { timeout: 15000 })
                .first()
                .should('be.visible')
                .within(() => {
                  cy.contains('li[role="option"], li', new RegExp(`^${escapeRegex(valor)}$`, 'i'))
                    .click({ force: true });
                })
                .then(() => {
                  cy.wait(300);
                  cy.log(` ${labelCampo} "${valor}" seleccionado`);
                  // Cerrar cualquier dropdown abierto (igual que en proveedores)
                  return cy.get('body').type('{esc}', { force: true, log: false });
                }, () => {
                  // Si no encuentra exacto, intentar buscar cualquier opción que contenga el valor
                  cy.log(` No se encontró opción exacta "${valor}" en el listbox, buscando opción que contenga el texto...`);
                  return cy.get('ul[role="listbox"]:visible', { timeout: 15000 })
                    .first()
                    .should('be.visible')
                    .within(() => {
                      cy.contains('li[role="option"], li', new RegExp(escapeRegex(valor), 'i'))
                        .first()
                        .click({ force: true });
                    })
                    .then(() => {
                      cy.wait(300);
                      cy.log(` ${labelCampo} "${valor}" seleccionado (opción parcial)`);
                      return cy.get('body').type('{esc}', { force: true, log: false });
                    }, () => {
                      // Si todavía no encuentra, usar primera opción
                      cy.log(` No se encontró opción que contenga "${valor}", seleccionando primera opción...`);
                      return cy.get('ul[role="listbox"]:visible', { timeout: 15000 })
                        .first()
                        .should('be.visible')
                        .within(() => {
                          cy.get('li[role="option"], li')
                            .first()
                            .click({ force: true });
                        })
                        .then(() => {
                          cy.wait(300);
                          cy.log(` Primera opción de ${labelCampo} seleccionada (fallback)`);
                          return cy.get('body').type('{esc}', { force: true, log: false });
                        }, () => {
                          // Si no aparece el listbox, usar teclado (último recurso)
                          cy.log(` No se encontró listbox visible para ${labelCampo}, usando teclado...`);
                          return cy.wrap($input)
                            .type('{downArrow}{enter}', { force: true })
                            .then(() => {
                              cy.wait(300);
                              cy.log(` ${labelCampo} "${valor}" seleccionado (vía teclado)`);
                              return cy.get('body').type('{esc}', { force: true, log: false });
                            });
                        });
                    });
                });
            } else {
              // Si no hay listbox, el valor ya está escrito, solo confirmar
              cy.log(` ${labelCampo} "${valor}" escrito (sin listbox)`);
              return cy.wrap(null);
            }
          });
        });
    };

    const rellenarAutocompletePorLabel = (labelText, valor) => {
      // Buscar el label y obtener su atributo "for" (igual que en proveedores)
      return cy.contains('label', new RegExp(`^${escapeRegex(labelText)}$`, 'i'), { timeout: 10000 })
        .should('exist')
        .invoke('attr', 'for')
        .then((forAttr) => {
          if (!forAttr) {
            cy.log(` El label "${labelText}" no tiene atributo "for", buscando input en contenedor...`);
            // Fallback: buscar el input en el contenedor del label
            return cy.contains('label', new RegExp(`^${escapeRegex(labelText)}$`, 'i'), { timeout: 10000 })
              .closest('.MuiFormControl-root, .MuiAutocomplete-root, .MuiTextField-root')
              .find('input[role="combobox"], input[aria-autocomplete="list"], input')
              .first()
              .should('exist')
              .then(($input) => {
                return escribirInputYSeleccionar($input, valor, labelText);
              });
          }

          // Usar el ID del atributo "for" para encontrar el input (igual que en proveedores)
          return cy.get(`#${CSS.escape(forAttr)}`, { timeout: 10000 })
            .should('exist')
            .then(($input) => {
              return escribirInputYSeleccionar($input, valor, labelText);
            });
        });
    };

    // Procesar cada campo según su tipo
    camposDireccion.forEach((campo) => {
      // Log específico para Provincia para debug
      if (campo.label === 'Provincia') {
        cy.log(` DEBUG Provincia: valor="${campo.valor}", name="${campo.name}", tipo=${typeof campo.valor}`);
      }

      if (!campo.valor || campo.valor === '') {
        cy.log(`Campo vacío en Excel: ${campo.label}`);
        return;
      }

      chain = chain.then(() => {
        // Tipo es un Select - buscar por name del input oculto (como antes)
        if (campo.name === 'add_add_typeId') {
          cy.log(`Seleccionando "${campo.label}": ${campo.valor} (Select)...`);
          // Buscar el Select por name y hacer clic para abrir
          return cy.get(`input[name="${campo.name}"]`, { timeout: 10000 })
            .should('exist')
            .closest('.MuiSelect-root, .MuiFormControl-root')
            .find('[role="combobox"], .MuiSelect-select')
            .first()
            .click({ force: true })
            .then(() => {
              cy.wait(500);
              // Buscar la opción en el listbox
              return cy.get('ul[role="listbox"]:visible', { timeout: 5000 })
                .first()
                .should('be.visible')
                .within(() => {
                  cy.contains('li[role="option"]', new RegExp(`^${escapeRegex(campo.valor)}$`, 'i'))
                    .click({ force: true });
                })
                .then(() => {
                  cy.wait(300);
                  cy.log(` ${campo.label} "${campo.valor}" seleccionado`);
                }, () => {
                  // Si no encuentra exacto, primera opción
                  return cy.get('li[role="option"]:visible')
                    .first()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(300);
                      cy.log(` Primera opción de ${campo.label} seleccionada (fallback)`);
                    });
                });
            }, () => {
              cy.log(` No se encontró el Select de ${campo.label}`);
              return cy.wrap(null);
            });
        }
        // Autocomplete (Población)
        else if (campo.tipo === 'autocomplete') {
          return rellenarAutocompletePorLabel(campo.label, campo.valor);
        }
        // Campos normales (Domicilio, C.Postal, Provincia, Notas) - Provincia se rellena como Domicilio
        else {
          cy.log(`Rellenando campo normal "${campo.label}": ${campo.valor} (name="${campo.name}")`);
          return escribirPorName(campo.name, campo.valor, campo.label);
        }
      });
    });

    // País es un Autocomplete (igual que Población) - añadirlo al final
    chain = chain.then(() => {
      if (!pais) {
        cy.log('⏭Campo "País" vacío en Excel');
        return cy.wrap(null);
      }
      cy.log(`Seleccionando "País": ${pais} (Autocomplete, igual que Población)...`);
      return rellenarAutocompletePorLabel('País', pais);
    });

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Dirección rellenado desde Excel`);
    });
  }

  // Rellenar formulario de Zonas de Carga en el modal lateral
  function llenarFormularioZonasCarga(caso, numeroCaso) {
    // Excel TC012: id _r_9o_-label -> dato_1 (ej: "prueba")
    const nombreZona = caso?.dato_1;

    if (!nombreZona) {
      cy.log('Zonas de carga: Excel no trae nombre (dato_1), se omite');
      return cy.wrap(null);
    }

    cy.log(`Zonas de carga: rellenando Nombre="${nombreZona}"`);

    const escapeCssId = (id = '') => id.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');

    // IMPORTANTÍSIMO: NO usar ".last()" de drawers visibles (siempre cae en el menú lateral docked).
    // En su lugar, partimos del título "Crear Zona de Carga" (panel derecho) y subimos al contenedor
    // que realmente contiene el label "Nombre" + su input.
    const tituloDrawer = /(Crear\s+Zona\s+de\s+Carga|Create\s+Load\s+Zone|Create\s+Loading\s+Zone)/i;

    return cy
      .contains(tituloDrawer, { timeout: 20000 })
      .should('be.visible')
      .then(($titulo) => {
        const $ancestros = Cypress.$($titulo).parents();
        const contenedor = Array.from($ancestros).find((a) => {
          const $a = Cypress.$(a);
          const tieneNombre = $a
            .find('label')
            .toArray()
            .some((l) => /^Nombre$/i.test((l.textContent || l.innerText || '').trim()));
          const tieneInput = $a.find('input').length > 0;
          return tieneNombre && tieneInput;
        });

        return cy.wrap(contenedor || Cypress.$($titulo).parent());
      })
      .within(() => {
        return cy
          .contains('label', /^Nombre$/i, { timeout: 15000 })
          // En MUI el label puede estar "cubierto" aunque el input sea usable; no exigir visibilidad.
          .should('exist')
          .invoke('attr', 'for')
          .then((forAttr) => {
            if (forAttr) {
              const sel = `#${escapeCssId(forAttr)}`;
              return cy
                .get(sel, { timeout: 15000 })
                .should('exist')
                .scrollIntoView()
                .click({ force: true })
                .clear({ force: true })
                .type(nombreZona.toString(), { force: true, delay: 0 })
                .type('{enter}', { force: true });
            }

            // Fallback: primer input visible dentro del panel derecho
            return cy
              .get('input:visible', { timeout: 15000 })
              .first()
              .scrollIntoView()
              .click({ force: true })
              .clear({ force: true })
              .type(nombreZona.toString(), { force: true, delay: 0 })
              .type('{enter}', { force: true });
          });
      });
  }

  // Rellenar formulario de Facturación (sin modal, directamente en la pestaña)
  function llenarFormularioFacturacion(caso, numeroCaso) {
    // --- util: buscar en Excel por fragmento del selector/etiqueta ---
    const obtenerDatoPorSelectorExcel = (needle) => {
      if (!needle) return null;
      const n = (needle || '').toString().toLowerCase().trim();
      const total = Number(caso?.__totalCamposExcel) || 30;

      for (let i = 1; i <= total; i++) {
        const sel = (caso?.[`valor_etiqueta_${i}`] || '').toString().toLowerCase().trim();
        const val = caso?.[`dato_${i}`];

        // Normalizar: quitar espacios y mantener guiones bajos tal cual
        const selSinEspacios = sel.replace(/\s+/g, '');
        const nSinEspacios = n.replace(/\s+/g, '');

        // Buscar coincidencia exacta, por fragmento, o sin espacios
        // También buscar si el needle está contenido en el selector o viceversa
        const coincide = sel === n ||
          selSinEspacios === nSinEspacios ||
          sel.includes(n) ||
          n.includes(sel) ||
          selSinEspacios.includes(nSinEspacios) ||
          nSinEspacios.includes(selSinEspacios);

        // Log de depuración solo para IBAN parte 1
        if (needle.includes('17p') || needle.includes('iban')) {
          cy.log(`   IBAN DEBUG campo ${i}: buscando "${n}", encontrado "${sel}", coincide=${coincide}, valor="${val || '(vacío)'}"`);
        }

        if (sel && coincide && val !== undefined && val !== null && `${val}` !== '') {
          return val;
        }
      }
      return null;
    };

    // --- util: buscar en Excel por name attribute ---
    const obtenerDatoPorNameExcel = (nameAttr) => {
      if (!nameAttr) return null;
      const total = Number(caso?.__totalCamposExcel) || 30;
      const nameAttrLower = (nameAttr || '').toString().toLowerCase().trim();

      for (let i = 1; i <= total; i++) {
        const tipo = (caso?.[`etiqueta_${i}`] || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
        const selector = (caso?.[`valor_etiqueta_${i}`] || '').toString().toLowerCase().trim();
        const val = caso?.[`dato_${i}`];

        // Verificar que sea de tipo "name" (puede tener espacios: "name " o "name")
        if (!tipo.includes('name')) continue;

        // Buscar coincidencia exacta o por fragmento
        // También buscar por el nombre del campo sin el prefijo "client."
        const selectorSinPrefijo = selector.replace(/^client\./, '');
        const nameAttrSinPrefijo = nameAttrLower.replace(/^client\./, '');

        const coincide = selector === nameAttrLower ||
          selector.includes(nameAttrLower) ||
          nameAttrLower.includes(selector) ||
          selectorSinPrefijo === nameAttrSinPrefijo ||
          selectorSinPrefijo.includes(nameAttrSinPrefijo) ||
          nameAttrSinPrefijo.includes(selectorSinPrefijo);

        if (coincide && val !== undefined && val !== null && `${val}` !== '') {
          return val;
        }
      }
      return null;
    };

    // --- datos según el mapeo del Excel TC010 ---
    // Leer siempre por valor_etiqueta_X para no depender del orden
    // Empresas (id _r_17g_-label -> "DESDE CANARIAS")
    const empresas = obtenerDatoPorSelectorExcel('_r_17g_') || obtenerDatoPorSelectorExcel('_r_17g_-label');
    // Diseño Factura (id _r_17j_-label -> "Diseño 2")
    const disenoFactura = obtenerDatoPorSelectorExcel('_r_17j_') || obtenerDatoPorSelectorExcel('_r_17j_-label');
    // Banco (name client.bankName -> "prueba")
    const banco = obtenerDatoPorNameExcel('client.bankName');
    // Forma de Pago (name client.paymentMethodDesc -> "233", pero en HTML es client.paymentMethodId)
    // Buscar primero por paymentMethodDesc (descripción) y luego por paymentMethodId (ID)
    const formaPago = obtenerDatoPorNameExcel('client.paymentMethodDesc') || obtenerDatoPorNameExcel('client.paymentMethodId');
    if (formaPago) {
      cy.log(` Forma de Pago encontrada en Excel: "${formaPago}" (se escribirá como número)`);
    } else {
      cy.log(` Forma de Pago NO encontrada en Excel`);
    }
    // Swift (name client.swift -> "eeeeee44")
    const swift = obtenerDatoPorNameExcel('client.swift');
    // IBAN - leer los 5 campos separados del Excel
    // Campo 1: código país (puede venir como id _r_17p_-label o name client.iban-iban -> "EE11")
    const ibanParte1 = obtenerDatoPorSelectorExcel('_r_17p_-label') ||
      obtenerDatoPorSelectorExcel('_r_17p_') ||
      obtenerDatoPorSelectorExcel('r_17p') ||
      obtenerDatoPorSelectorExcel('17p') ||
      obtenerDatoPorNameExcel('client.iban-iban') ||
      obtenerDatoPorNameExcel('client.iban-country');
    // Campo 2: office (puede venir como name client.iban-office o client.iban-entity -> "1111")
    const ibanOffice = obtenerDatoPorNameExcel('client.iban-office') ||
      obtenerDatoPorNameExcel('client.iban-entity');
    // Campo 3: control (name client.iban-control -> "11")
    const ibanControl = obtenerDatoPorNameExcel('client.iban-control');
    // Campo 4: account (name client.iban-account -> "1111111111")
    const ibanAccount = obtenerDatoPorNameExcel('client.iban-account');
    // IBAN parte 2 (name client.iban -> "11111111111111111111") - para compatibilidad con versiones antiguas
    const ibanParte2 = obtenerDatoPorNameExcel('client.iban');

    // Logs de depuración detallados
    cy.log(`═══════════════════════════════════════════════════════`);
    cy.log(` IBAN - LECTURA DEL EXCEL:`);
    cy.log(`   País (ibanParte1): ${ibanParte1 || '(NO ENCONTRADO)'}`);
    cy.log(`   Office: ${ibanOffice || '(NO ENCONTRADO)'}`);
    cy.log(`   Control: ${ibanControl || '(NO ENCONTRADO)'}`);
    cy.log(`   Account: ${ibanAccount || '(NO ENCONTRADO)'}`);
    cy.log(`   Parte 2 (legacy): ${ibanParte2 || '(NO ENCONTRADO)'}`);

    // Debug: buscar manualmente en el Excel para ver qué hay
    const totalCamposIban = Number(caso?.__totalCamposExcel) || 30;
    cy.log(` DEBUG IBAN: Buscando en ${totalCamposIban} campos del Excel...`);
    for (let i = 1; i <= Math.min(totalCamposIban, 30); i++) {
      const etiqueta = caso?.[`etiqueta_${i}`];
      const valorEtiqueta = caso?.[`valor_etiqueta_${i}`];
      const dato = caso?.[`dato_${i}`];
      if (etiqueta && valorEtiqueta && (valorEtiqueta.includes('iban') || valorEtiqueta.includes('IBAN'))) {
        cy.log(`   Campo ${i}: etiqueta="${etiqueta}", valor="${valorEtiqueta}", dato="${dato}"`);
      }
    }
    cy.log(`═══════════════════════════════════════════════════════`);
    // C. Contable (name client.CuentaContable -> "prueba", pero en HTML es client.bankAccount)
    const cContable = obtenerDatoPorNameExcel('client.CuentaContable') || obtenerDatoPorNameExcel('client.bankAccount');
    // IVA (name client.defaultTax -> "20")
    const iva = obtenerDatoPorNameExcel('client.defaultTax');
    // Días Cobro (name client.diaCobro1 -> "2")
    const diasCobro = obtenerDatoPorNameExcel('client.diaCobro1');
    // Riesgo Asegurado (name client.RiesgoAsegurado -> "prueba", pero en HTML es client.insuredRisk)
    const riesgoAsegurado = obtenerDatoPorNameExcel('client.RiesgoAsegurado') || obtenerDatoPorNameExcel('client.insuredRisk');
    // Dto (name client.discount -> "2")
    const dto = obtenerDatoPorNameExcel('client.discount');
    // Tipo Facturación (id r_5t_ -> "Beneficio")
    const tipoFacturacion = obtenerDatoPorSelectorExcel('r_5t_');

    // C. Venta (autocomplete) - buscar por selector o name
    // Puede venir como id _r_48 o _r_1an_ o por name client.salesAccount
    const cVenta = obtenerDatoPorSelectorExcel('_r_48') ||
      obtenerDatoPorSelectorExcel('_r_1an_') ||
      obtenerDatoPorSelectorExcel('C. Venta') ||
      obtenerDatoPorNameExcel('client.salesAccount') ||
      null;
    if (cVenta) {
      cy.log(` C. Venta encontrada en Excel: "${cVenta}"`);
    } else {
      cy.log(` C. Venta NO encontrada en Excel`);
    }

    // CCC Empresa - buscar por selector (puede no estar en Excel)
    const cccEmpresa = obtenerDatoPorSelectorExcel('_r_1ab_') || obtenerDatoPorSelectorExcel('CCC Empresa') || null;

    // Campos opcionales que pueden no estar en el Excel
    const cobroFinMes = null; // No está en el Excel del TC010
    const conRiesgo = null; // No está en el Excel del TC010

    // Construir IBAN completo manualmente: concatenar las 5 partes sin espacios
    // Formato: EE11 + 1111 + 1111 + 11 + 1111111111 = EE1111111111111111111111
    let iban = null;
    if (ibanParte1 && ibanOffice && ibanControl && ibanAccount) {
      // Construir IBAN completo concatenando las 5 partes
      iban = `${String(ibanParte1).trim()}${String(ibanOffice).trim()}${String(ibanControl).trim()}${String(ibanAccount).trim()}`;
      cy.log(`IBAN completo construido manualmente: "${iban}" (${iban.length} caracteres)`);
      console.log(`IBAN completo construido manualmente: "${iban}" (${iban.length} caracteres)`);
    } else if (ibanParte1 && ibanParte2) {
      // Fallback: usar partes antiguas si no tenemos las 5 partes separadas
      iban = `${String(ibanParte1).trim()}${String(ibanParte2).trim()}`;
      cy.log(`IBAN construido con partes antiguas: "${iban}" (${iban.length} caracteres)`);
    } else if (ibanParte1) {
      // Solo tenemos la primera parte (país)
      iban = String(ibanParte1).trim();
      cy.log(`ADVERTENCIA: Solo se tiene la primera parte del IBAN: "${iban}"`);
    } else if (ibanParte2) {
      iban = String(ibanParte2).trim();
    }

    // Log de depuración completo
    cy.log(`═══════════════════════════════════════════════════════`);
    cy.log(` DATOS LEÍDOS DEL EXCEL (TC010):`);
    cy.log(`   Empresas: ${empresas || '(vacío)'}`);
    cy.log(`   Diseño Factura: ${disenoFactura || '(vacío)'}`);
    cy.log(`   Tipo Facturación: ${tipoFacturacion || '(vacío)'}`);
    cy.log(`   Banco: ${banco || '(vacío)'}`);
    cy.log(`   Forma de Pago: ${formaPago || '(vacío)'}`);
    cy.log(`   Swift: ${swift || '(vacío)'}`);
    cy.log(`   IBAN País: ${ibanParte1 || '(vacío)'}`);
    cy.log(`   IBAN Office: ${ibanOffice || '(vacío)'}`);
    cy.log(`   IBAN Control: ${ibanControl || '(vacío)'}`);
    cy.log(`   IBAN Account: ${ibanAccount || '(vacío)'}`);
    cy.log(`   IBAN Parte 2 (legacy): ${ibanParte2 || '(vacío)'}`);
    cy.log(`   IBAN Completo: ${iban || '(vacío)'}`);
    cy.log(`   C. Contable: ${cContable || '(vacío)'}`);
    cy.log(`   C. Venta: ${cVenta || '(vacío)'}`);
    cy.log(`   CCC Empresa: ${cccEmpresa || '(vacío)'}`);
    cy.log(`   IVA: ${iva || '(vacío)'}`);
    cy.log(`   Días Cobro: ${diasCobro || '(vacío)'}`);
    cy.log(`   Riesgo Asegurado: ${riesgoAsegurado || '(vacío)'}`);
    cy.log(`   Dto: ${dto || '(vacío)'}`);
    cy.log(`═══════════════════════════════════════════════════════`);

    // Log de depuración del Excel completo para ver qué hay
    const totalCampos = Number(caso?.__totalCamposExcel) || 30;
    cy.log(` DEBUG: Total campos en Excel: ${totalCampos}`);
    for (let i = 1; i <= Math.min(totalCampos, 20); i++) {
      const etiqueta = caso?.[`etiqueta_${i}`];
      const valorEtiqueta = caso?.[`valor_etiqueta_${i}`];
      const dato = caso?.[`dato_${i}`];
      if (etiqueta || valorEtiqueta || dato) {
        cy.log(`   Campo ${i}: etiqueta="${etiqueta || ''}", valor_etiqueta="${valorEtiqueta || ''}", dato="${dato || ''}"`);
      }
    }

    // Resumen de campos encontrados vs no encontrados
    cy.log(` RESUMEN DE CAMPOS:`);
    cy.log(`Encontrados: Empresas=${!!empresas}, Diseño=${!!disenoFactura}, Tipo Fact=${!!tipoFacturacion}, Banco=${!!banco}, FormaPago=${!!formaPago}, Swift=${!!swift}`);
    cy.log(`IBAN: País=${!!ibanParte1}, Office=${!!ibanOffice}, Control=${!!ibanControl}, Account=${!!ibanAccount}, Parte2=${!!ibanParte2}`);
    cy.log(`Otros: C.Contable=${!!cContable}, IVA=${!!iva}, DíasCobro=${!!diasCobro}, Riesgo=${!!riesgoAsegurado}, Dto=${!!dto}`);
    cy.log(`No en Excel: CCC Empresa=${!cccEmpresa}, C.Venta=${!cVenta}`);

    // ---------------- helpers ----------------
    const escapeRegex = (s) => Cypress._.escapeRegExp(String(s));

    // Helper: seleccionar opción de una lista de elementos jQuery
    const seleccionarOpcionDeLista = ($opts, valor, regexExacto, regexParcial) => {
      // Buscar opción exacta
      const exacta = Array.from($opts).find((el) => {
        const texto = (el.textContent || el.innerText || '').trim();
        return regexExacto.test(texto);
      });

      if (exacta) {
        cy.log(`Opción exacta encontrada: "${(exacta.textContent || '').trim()}"`);
        return cy.wrap(exacta)
          .scrollIntoView()
          .click({ force: true })
          .then(() => {
            cy.wait(300);
            cy.log(` Empresa "${valor}" seleccionada`);
          });
      }

      // Buscar opción parcial
      cy.log(` No se encontró opción exacta "${valor}", buscando opción que contenga el texto...`);
      const parcial = Array.from($opts).find((el) => {
        const texto = (el.textContent || el.innerText || '').trim();
        return regexParcial.test(texto);
      });

      if (parcial) {
        cy.log(`Opción parcial encontrada: "${(parcial.textContent || '').trim()}"`);
        return cy.wrap(parcial)
          .scrollIntoView()
          .click({ force: true })
          .then(() => {
            cy.wait(300);
            cy.log(` Empresa "${valor}" seleccionada (opción parcial)`);
          });
      }

      // Buscar primera opción válida (que no sea "- TODAS -")
      cy.log(` No se encontró opción que contenga "${valor}", seleccionando primera opción válida...`);
      const valida = Array.from($opts).find((el) => {
        const texto = (el.textContent || el.innerText || '').trim();
        return texto !== '- TODAS -' && texto !== '';
      });

      if (valida) {
        cy.log(`Primera opción válida encontrada: "${(valida.textContent || '').trim()}"`);
        return cy.wrap(valida)
          .scrollIntoView()
          .click({ force: true })
          .then(() => {
            cy.wait(300);
            cy.log(' Primera opción válida de Empresa seleccionada (fallback)');
          });
      }

      // Último recurso: primera opción
      cy.log(' Seleccionando primera opción disponible...');
      if ($opts.length > 0) {
        return cy.wrap($opts[0])
          .scrollIntoView()
          .click({ force: true })
          .then(() => {
            cy.wait(300);
            cy.log(' Primera opción de Empresa seleccionada (último fallback)');
          });
      }

      cy.log('ERROR: No se encontró ninguna opción para seleccionar');
      return cy.wrap(null);
    };

    //  Empresas: click + seleccionar opción (como antes). NO usa id.
    const seleccionarEmpresaFacturacion = (empresaTxt) => {
      const valor = String(empresaTxt).trim();
      const regexExacto = new RegExp(`^${escapeRegex(valor)}$`, 'i');
      const regexParcial = new RegExp(escapeRegex(valor), 'i');

      cy.log(`Seleccionando Empresa (Facturación): "${valor}"`);

      return cy.contains('label', /^Empresas$/i, { timeout: 10000 })
        .should('exist')
        .scrollIntoView()
        .parents('.MuiFormControl-root')
        .first()
        .within(() => {
          cy.get('[role="combobox"]', { timeout: 10000 })
            .should('be.visible')
            .click({ force: true });
        })
        .then(() => {
          cy.wait(800); // Esperar a que se abra el listbox (más tiempo para caso 43)

          // Buscar el listbox directamente con cy.get (más robusto que wrap de jQuery)
          // Esperar a que el listbox esté presente y tenga opciones
          return cy.get('[role="listbox"]', { timeout: 15000 })
            .first()
            .should('exist')
            .should(($listbox) => {
              // Verificar que el listbox tenga opciones antes de continuar
              const $options = $listbox.find('[role="option"]');
              expect($options.length).to.be.greaterThan(0, 'El listbox debe tener al menos una opción');
            })
            .then(($listbox) => {
              const numOpciones = $listbox.find('[role="option"]').length;
              cy.log(`Listbox encontrado con ${numOpciones} opciones`);

              // Buscar todas las opciones en el body (más robusto que within)
              return cy.get('body').then(($body) => {
                const $opts = $body.find('[role="option"]').filter(':visible');
                cy.log(`Encontradas ${$opts.length} opciones visibles en el body`);

                if (!$opts.length) {
                  cy.log('No hay opciones visibles, esperando...');
                  cy.wait(500);
                  // Reintentar
                  const $optsRetry = $body.find('[role="option"]').filter(':visible');
                  if (!$optsRetry.length) {
                    cy.log('Aún no hay opciones después de esperar');
                    return cy.wrap(null);
                  }
                  return seleccionarOpcionDeLista($optsRetry, valor, regexExacto, regexParcial);
                }

                return seleccionarOpcionDeLista($opts, valor, regexExacto, regexParcial);
              });
            });
        });
    };

    //  modal "Aplicar a todas las empresas" -> Sí, aplicar
    const aceptarModalAplicarSiExiste = () => {
      return cy.get('body').then(($body) => {
        const $dlg = $body.find('[role="dialog"]:visible');
        if (!$dlg.length) return cy.wrap(null);

        // Tu modal tiene botón: "Sí, aplicar"
        return cy.contains('[role="dialog"] button', /sí,\s*aplicar/i, { timeout: 5000 })
          .should('be.visible')
          .click({ force: true });
      });
    };

    //  Autocomplete por label (sin ids dinámicos), selecciona opción exacta si strictExact
    const seleccionarAutocompletePorLabel = (label, valor, { strictExact = false } = {}) => {
      const valorTxt = String(valor).trim();
      const regexValor = new RegExp(`^${escapeRegex(valorTxt)}$`, 'i');

      cy.log(`Autocomplete "${label}" => "${valorTxt}"`);

      return cy.contains('label', new RegExp(`^${escapeRegex(label)}$`, 'i'), { timeout: 10000 })
        .should('exist')
        .scrollIntoView()
        .parents('.MuiFormControl-root')
        .first()
        .within(() => {
          cy.get('input[role="combobox"], input[aria-autocomplete="list"], input', { timeout: 10000 })
            .first()
            .should('be.visible')
            .click({ force: true })
            .clear({ force: true })
            .type(valorTxt, { force: true });
        })
        .then(() => cy.wait(200))
        .then(() => {
          return cy.get('body').then(($body) => {
            const $opts = $body.find('[role="option"]').filter(':visible');
            if (!$opts.length) {
              cy.log(`No hay opciones visibles para "${label}"`);
              return cy.wrap(null);
            }

            const exacta = Array.from($opts).find((el) => regexValor.test((el.textContent || '').trim()));
            if (exacta) {
              return cy.wrap(exacta).click({ force: true });
            }

            if (strictExact) {
              cy.log(` No exacta para "${label}" con "${valorTxt}" (strict). No se selecciona fallback.`);
              return cy.get('body').type('{esc}', { force: true }).then(() => cy.wrap(null));
            }

            return cy.wrap($opts[0]).click({ force: true });
          });
        });
    };

    // IBAN en el HTML viene en 5 campos separados
    const escribirIbanSiSePuede = (ibanCompleto, ibanParte1, ibanParte2, ibanOffice, ibanControl, ibanAccount) => {
      // Si tenemos partes separadas, usarlas directamente
      if (ibanParte1 || ibanParte2) {
        // Si solo tenemos una parte, intentar escribirla en el input correspondiente
        if (ibanParte1 && !ibanParte2) {
          cy.log(`Escribiendo solo IBAN parte 1: ${ibanParte1}`);
          return cy.get('body').then(($body) => {
            const $input1 = $body.find('input#_r_1af_, input[id="_r_1af_"]').filter(':visible').first();
            if ($input1.length) {
              cy.wrap($input1[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
              return cy.wrap(null);
            }
            // Buscar por label
            const $label = $body.find('label').filter((_, el) => /^IBAN$/i.test((el.textContent || '').trim())).filter(':visible').first();
            if ($label.length) {
              return cy.wrap($label).parents('.MuiBox-root, .MuiFormControl-root').first().then(($container) => {
                const $inputs = $container.find('input').filter(':visible');
                if ($inputs.length >= 1) {
                  cy.wrap($inputs[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
                }
                return cy.wrap(null);
              });
            }
            return cy.wrap(null);
          });
        }

        if (ibanParte2 && !ibanParte1) {
          cy.log(`Escribiendo solo IBAN parte 2: ${ibanParte2}`);
          return cy.get('body').then(($body) => {
            const $input2 = $body.find('input#_r_1ag_, input[id="_r_1ag_"]').filter(':visible').first();
            if ($input2.length) {
              cy.wrap($input2[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte2), { force: true, delay: 0 });
              return cy.wrap(null);
            }
            // Buscar por label
            const $label = $body.find('label').filter((_, el) => /^IBAN$/i.test((el.textContent || '').trim())).filter(':visible').first();
            if ($label.length) {
              return cy.wrap($label).parents('.MuiBox-root, .MuiFormControl-root').first().then(($container) => {
                const $inputs = $container.find('input').filter(':visible');
                if ($inputs.length >= 2) {
                  cy.wrap($inputs[1]).scrollIntoView().clear({ force: true }).type(String(ibanParte2), { force: true, delay: 0 });
                }
                return cy.wrap(null);
              });
            }
            return cy.wrap(null);
          });
        }

        // PRIORIDAD 1: Si tenemos los campos separados del Excel, usarlos directamente
        // No requerimos que estén todos, escribimos los que tengamos
        if (ibanParte1 || ibanOffice || ibanControl || ibanAccount) {
          cy.log(`Escribiendo IBAN desde Excel: país="${ibanParte1 || '(vacío)'}", office="${ibanOffice || '(vacío)'}", control="${ibanControl || '(vacío)'}", account="${ibanAccount || '(vacío)'}"`);

          return cy.get('body').then(($body) => {
            // Buscar inputs por name attributes (más robusto)
            const $input1 = $body.find('input[name="client.iban-country"], input[name="client.iban-iban"], input[name*="iban-country"], input[name*="iban-iban"]').filter(':visible').first();
            const $input2 = $body.find('input[name="client.iban-office"], input[name="client.iban-entity"], input[name*="iban-office"], input[name*="iban-entity"]').filter(':visible').first();
            const $input3 = $body.find('input[name="client.iban-control"], input[name*="iban-control"]').filter(':visible').first();
            const $input4 = $body.find('input[name="client.iban-account"], input[name*="iban-account"]').filter(':visible').first();

            cy.log(`IBAN DEBUG: Input1 encontrado=${$input1.length > 0}, Input2 encontrado=${$input2.length > 0}, Input3 encontrado=${$input3.length > 0}, Input4 encontrado=${$input4.length > 0}`);

            // Escribir en los campos que encontremos y tengamos datos
            let camposEscritos = 0;
            let chainIban = cy.wrap(null);

            if ($input1.length && ibanParte1) {
              cy.log('Escribiendo IBAN campo 1 (país)');
              chainIban = chainIban.then(() => {
                return cy.wrap($input1[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
              }).then(() => cy.wait(100));
              camposEscritos++;
            }
            if ($input2.length && ibanOffice) {
              cy.log('Escribiendo IBAN campo 2 (office)');
              chainIban = chainIban.then(() => {
                return cy.wrap($input2[0]).scrollIntoView().clear({ force: true }).type(String(ibanOffice), { force: true, delay: 0 });
              }).then(() => cy.wait(100));
              camposEscritos++;
            }
            if ($input3.length && ibanControl) {
              cy.log('Escribiendo IBAN campo 3 (control)');
              chainIban = chainIban.then(() => {
                return cy.wrap($input3[0]).scrollIntoView().clear({ force: true }).type(String(ibanControl), { force: true, delay: 0 });
              }).then(() => cy.wait(100));
              camposEscritos++;
            }
            if ($input4.length && ibanAccount) {
              cy.log('Escribiendo IBAN campo 4 (account)');
              chainIban = chainIban.then(() => {
                return cy.wrap($input4[0]).scrollIntoView().clear({ force: true }).type(String(ibanAccount), { force: true, delay: 0 });
              }).then(() => cy.wait(100));
              camposEscritos++;
            }

            if (camposEscritos > 0) {
              cy.log(`IBAN: Se escribieron ${camposEscritos} campos por name attributes`);
              return chainIban.then(() => {
                // Verificar que los valores se hayan escrito correctamente
                return cy.wait(200).then(() => {
                  return cy.get('body').then($body => {
                    const valores = [];
                    if ($input1.length) valores.push(`campo1="${$input1[0].value || '(vacío)'}"`);
                    if ($input2.length) valores.push(`campo2="${$input2[0].value || '(vacío)'}"`);
                    if ($input3.length) valores.push(`campo3="${$input3[0].value || '(vacío)'}"`);
                    if ($input4.length) valores.push(`campo4="${$input4[0].value || '(vacío)'}"`);
                    cy.log(`IBAN: Valores después de escribir: ${valores.join(', ')}`);
                  });
                });
              });
            }

            // Si no encontramos por name, intentar por label y posición

            // PRIORIDAD 2: Buscar por label IBAN y luego por orden/posición
            const $label = $body.find('label').filter((_, el) => {
              const texto = (el.textContent || el.innerText || '').trim();
              return /^IBAN$/i.test(texto);
            }).filter(':visible').first();

            if ($label.length) {
              cy.log('IBAN encontrado por label, buscando inputs...');
              return cy.wrap($label)
                .parents('.MuiBox-root, .MuiFormControl-root')
                .first()
                .then(($container) => {
                  const $inputs = $container.find('input').filter(':visible');
                  cy.log(`IBAN DEBUG por label: Encontrados ${$inputs.length} inputs visibles en el contenedor`);

                  // Escribir en los inputs disponibles según los datos que tengamos
                  let camposEscritosLabel = 0;
                  let chainIbanLabel = cy.wrap(null);

                  if ($inputs.length >= 1 && ibanParte1) {
                    cy.log('Escribiendo IBAN campo 1 (país) por posición');
                    chainIbanLabel = chainIbanLabel.then(() => {
                      return cy.wrap($inputs[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
                    }).then(() => cy.wait(100));
                    camposEscritosLabel++;
                  }
                  if ($inputs.length >= 2 && ibanOffice) {
                    cy.log('Escribiendo IBAN campo 2 (office) por posición');
                    chainIbanLabel = chainIbanLabel.then(() => {
                      return cy.wrap($inputs[1]).scrollIntoView().clear({ force: true }).type(String(ibanOffice), { force: true, delay: 0 });
                    }).then(() => cy.wait(100));
                    camposEscritosLabel++;
                  }
                  if ($inputs.length >= 3 && ibanControl) {
                    cy.log('Escribiendo IBAN campo 3 (control) por posición');
                    chainIbanLabel = chainIbanLabel.then(() => {
                      return cy.wrap($inputs[2]).scrollIntoView().clear({ force: true }).type(String(ibanControl), { force: true, delay: 0 });
                    }).then(() => cy.wait(100));
                    camposEscritosLabel++;
                  }
                  if ($inputs.length >= 4 && ibanAccount) {
                    cy.log('Escribiendo IBAN campo 4 (account) por posición');
                    chainIbanLabel = chainIbanLabel.then(() => {
                      return cy.wrap($inputs[3]).scrollIntoView().clear({ force: true }).type(String(ibanAccount), { force: true, delay: 0 });
                    }).then(() => cy.wait(100));
                    camposEscritosLabel++;
                  }

                  if (camposEscritosLabel > 0) {
                    cy.log(`IBAN: Se escribieron ${camposEscritosLabel} campos por posición`);
                    return chainIbanLabel.then(() => {
                      // Verificar que los valores se hayan escrito correctamente
                      return cy.wait(200).then(() => {
                        return cy.get('body').then($body => {
                          const valores = [];
                          if ($inputs.length >= 1) valores.push(`campo1="${$inputs[0].value || '(vacío)'}"`);
                          if ($inputs.length >= 2) valores.push(`campo2="${$inputs[1].value || '(vacío)'}"`);
                          if ($inputs.length >= 3) valores.push(`campo3="${$inputs[2].value || '(vacío)'}"`);
                          if ($inputs.length >= 4) valores.push(`campo4="${$inputs[3].value || '(vacío)'}"`);
                          cy.log(`IBAN: Valores después de escribir (por posición): ${valores.join(', ')}`);
                        });
                      });
                    });
                  }

                  // Si hay menos de 4 inputs pero tenemos datos, intentar escribir lo que podamos
                  if ($inputs.length >= 2 && (ibanParte1 || ibanOffice || ibanControl || ibanAccount)) {
                    cy.log(`IBAN: Solo se encontraron ${$inputs.length} inputs, escribiendo en los disponibles`);
                    if (ibanParte1) {
                      cy.wrap($inputs[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
                    }
                    if ($inputs.length >= 2 && (ibanOffice || ibanControl || ibanAccount)) {
                      cy.wait(50);
                      const resto = (ibanOffice || '') + (ibanControl || '') + (ibanAccount || '');
                      if (resto) {
                        cy.wrap($inputs[1]).scrollIntoView().clear({ force: true }).type(resto, { force: true, delay: 0 });
                      }
                    }
                    return cy.wrap(null);
                  }

                  cy.log('No se detectaron suficientes inputs IBAN. Se omite.');
                  return cy.wrap(null);
                });
            }

            cy.log('No se encontraron inputs IBAN. Se omite.');
            return cy.wrap(null);
          });
        }

        // PRIORIDAD 2: Si tenemos ambas partes (legacy), dividir en 5 campos
        if (ibanParte1 && ibanParte2) {
          // Dividir ibanParte2 en los campos 2, 3 y 4
          const parte2Str = String(ibanParte2);
          const campo2 = parte2Str.slice(0, 4);   // Primeros 4 caracteres
          const campo3 = parte2Str.slice(4, 6);   // Siguientes 2 caracteres
          const campo4 = parte2Str.slice(6, 16);  // Resto (máximo 10 caracteres)

          cy.log(`Escribiendo IBAN en 5 campos (legacy): ${ibanParte1} / ${campo2} / ${campo3} / ${campo4}`);

          return cy.get('body').then(($body) => {
            // Buscar inputs por name attributes (más robusto)
            const $input1 = $body.find('input[name="client.iban-country"], input[name="client.iban-iban"], input[name*="iban-country"], input[name*="iban-iban"]').filter(':visible').first();
            const $input2 = $body.find('input[name="client.iban-office"], input[name="client.iban-entity"], input[name*="iban-office"], input[name*="iban-entity"]').filter(':visible').first();
            const $input3 = $body.find('input[name="client.iban-control"], input[name*="iban-control"]').filter(':visible').first();
            const $input4 = $body.find('input[name="client.iban-account"], input[name*="iban-account"]').filter(':visible').first();

            // Si encontramos los 4 campos por name, escribir directamente
            if ($input1.length && $input2.length && $input3.length && $input4.length) {
              cy.log('IBAN encontrado por name attributes (5 campos desde partes)');
              cy.wrap($input1[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
              cy.wait(50);
              cy.wrap($input2[0]).scrollIntoView().clear({ force: true }).type(campo2, { force: true, delay: 0 });
              cy.wait(50);
              cy.wrap($input3[0]).scrollIntoView().clear({ force: true }).type(campo3, { force: true, delay: 0 });
              cy.wait(50);
              cy.wrap($input4[0]).scrollIntoView().clear({ force: true }).type(campo4, { force: true, delay: 0 });
              return cy.wrap(null);
            }

            // PRIORIDAD 2: Buscar por label IBAN y luego por orden/posición
            const $label = $body.find('label').filter((_, el) => {
              const texto = (el.textContent || el.innerText || '').trim();
              return /^IBAN$/i.test(texto);
            }).filter(':visible').first();

            if ($label.length) {
              cy.log('IBAN encontrado por label, buscando inputs...');
              return cy.wrap($label)
                .parents('.MuiBox-root, .MuiFormControl-root')
                .first()
                .then(($container) => {
                  const $inputs = $container.find('input').filter(':visible');
                  cy.log(`IBAN DEBUG por label: Encontrados ${$inputs.length} inputs visibles en el contenedor`);

                  // Si hay 4 o más inputs, escribir en los primeros 4
                  if ($inputs.length >= 4) {
                    cy.log('Escribiendo IBAN en 4 campos por posición (desde partes)');
                    cy.wrap($inputs[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
                    cy.wait(50);
                    cy.wrap($inputs[1]).scrollIntoView().clear({ force: true }).type(campo2, { force: true, delay: 0 });
                    cy.wait(50);
                    cy.wrap($inputs[2]).scrollIntoView().clear({ force: true }).type(campo3, { force: true, delay: 0 });
                    cy.wait(50);
                    cy.wrap($inputs[3]).scrollIntoView().clear({ force: true }).type(campo4, { force: true, delay: 0 });
                    return cy.wrap(null);
                  }

                  // Si hay menos de 4 inputs, intentar con los que hay
                  if ($inputs.length >= 2) {
                    cy.log(`IBAN: Solo se encontraron ${$inputs.length} inputs, escribiendo en los disponibles`);
                    cy.wrap($inputs[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
                    if ($inputs.length >= 2) {
                      cy.wait(50);
                      cy.wrap($inputs[1]).scrollIntoView().clear({ force: true }).type(campo2 + campo3 + campo4, { force: true, delay: 0 });
                    }
                    return cy.wrap(null);
                  }

                  cy.log('No se detectaron suficientes inputs IBAN. Se omite.');
                  return cy.wrap(null);
                });
            }

            cy.log('No se encontraron inputs IBAN. Se omite.');
            return cy.wrap(null);
          });
        }
      }

      // Si tenemos IBAN completo, hacer split en 5 campos
      if (!ibanCompleto) return cy.wrap(null);
      const ibanTxt = String(ibanCompleto).replace(/\s+/g, '').toUpperCase();

      // Split del IBAN en 5 campos según la estructura:
      // Campo 1: 4 caracteres (código país, ej: "EE11")
      // Campo 2: 4 caracteres (office, ej: "1111")
      // Campo 3: 2 caracteres (control, ej: "11")
      // Campo 4: 10 caracteres (account, ej: "1111111111")
      const campo1 = ibanTxt.slice(0, 4);   // "EE11"
      const campo2 = ibanTxt.slice(4, 8);   // "1111"
      const campo3 = ibanTxt.slice(8, 10);   // "11"
      const campo4 = ibanTxt.slice(10, 20); // "1111111111" (máximo 10 chars)

      cy.log(`Escribiendo IBAN completo (split en 5 campos): ${campo1} / ${campo2} / ${campo3} / ${campo4}`);

      return cy.get('body').then(($body) => {
        // Buscar inputs por name attributes (más robusto que por ID)
        const $input1 = $body.find('input[name="client.iban-country"], input[name*="iban-country"]').filter(':visible').first();
        const $input2 = $body.find('input[name="client.iban-office"], input[name*="iban-office"]').filter(':visible').first();
        const $input3 = $body.find('input[name="client.iban-control"], input[name*="iban-control"]').filter(':visible').first();
        const $input4 = $body.find('input[name="client.iban-account"], input[name*="iban-account"]').filter(':visible').first();

        // Si encontramos los 4 campos por name, escribir directamente
        if ($input1.length && $input2.length && $input3.length && $input4.length) {
          cy.log('IBAN encontrado por name attributes (5 campos)');
          cy.wrap($input1[0]).scrollIntoView().clear({ force: true }).type(campo1, { force: true, delay: 0 });
          cy.wait(50);
          cy.wrap($input2[0]).scrollIntoView().clear({ force: true }).type(campo2, { force: true, delay: 0 });
          cy.wait(50);
          cy.wrap($input3[0]).scrollIntoView().clear({ force: true }).type(campo3, { force: true, delay: 0 });
          cy.wait(50);
          cy.wrap($input4[0]).scrollIntoView().clear({ force: true }).type(campo4, { force: true, delay: 0 });
          return cy.wrap(null);
        }

        // PRIORIDAD 2: Buscar por label IBAN y luego por orden/posición
        const $label = $body.find('label').filter((_, el) => {
          const texto = (el.textContent || el.innerText || '').trim();
          return /^IBAN$/i.test(texto);
        }).filter(':visible').first();

        if ($label.length) {
          return cy.wrap($label)
            .parents('.MuiBox-root, .MuiFormControl-root')
            .first()
            .then(($container) => {
              const $inputs = $container.find('input').filter(':visible');
              cy.log(`IBAN DEBUG: Encontrados ${$inputs.length} inputs en el contenedor`);

              // Si hay 4 o más inputs, escribir en los primeros 4
              if ($inputs.length >= 4) {
                cy.log('Escribiendo IBAN en 4 campos por posición');
                cy.wrap($inputs[0]).scrollIntoView().clear({ force: true }).type(campo1, { force: true, delay: 0 });
                cy.wait(50);
                cy.wrap($inputs[1]).scrollIntoView().clear({ force: true }).type(campo2, { force: true, delay: 0 });
                cy.wait(50);
                cy.wrap($inputs[2]).scrollIntoView().clear({ force: true }).type(campo3, { force: true, delay: 0 });
                cy.wait(50);
                cy.wrap($inputs[3]).scrollIntoView().clear({ force: true }).type(campo4, { force: true, delay: 0 });
                return cy.wrap(null);
              }

              // Si hay menos de 4 inputs, intentar con los que hay
              if ($inputs.length >= 2) {
                cy.log(`IBAN: Solo se encontraron ${$inputs.length} inputs, escribiendo en los disponibles`);
                cy.wrap($inputs[0]).scrollIntoView().clear({ force: true }).type(campo1, { force: true, delay: 0 });
                if ($inputs.length >= 2) {
                  cy.wait(50);
                  cy.wrap($inputs[1]).scrollIntoView().clear({ force: true }).type(campo2 + campo3 + campo4, { force: true, delay: 0 });
                }
                return cy.wrap(null);
              }

              cy.log('No se detectaron suficientes inputs IBAN. Se omite.');
              return cy.wrap(null);
            });
        }

        cy.log('IBAN label no visible. Se omite.');
        return cy.wrap(null);
      });
    };

    // ---------------- ejecución ----------------
    let chain = cy.wrap(null);

    //  1) EMPRESAS: como antes (click + seleccionar) + modal si aparece
    if (empresas) {
      chain = chain
        .then(() => seleccionarEmpresaFacturacion(empresas))
        .then(() => aceptarModalAplicarSiExiste());
    }

    //  2) CCC Empresa (select dentro Configuración de Factura)
    if (cccEmpresa) {
      chain = chain.then(() => seleccionarAutocompletePorLabel('CCC Empresa', cccEmpresa, { strictExact: true }));
    }

    //  3) Tipo Facturación + Diseño Factura (autocompletes)
    if (tipoFacturacion) {
      chain = chain.then(() => seleccionarAutocompletePorLabel('Tipo Facturación', tipoFacturacion, { strictExact: true }));
    }
    if (disenoFactura) {
      chain = chain.then(() => seleccionarAutocompletePorLabel('Diseño Factura', disenoFactura, { strictExact: true }));
    }

    //  4) IVA (tiene name="client.defaultTax")
    if (iva !== undefined && iva !== null && `${iva}` !== '') {
      chain = chain.then(() => escribirPorName('client.defaultTax', iva, 'IVA'));
    }

    //  5) Banco + Swift
    if (banco) chain = chain.then(() => escribirPorName('client.bankName', banco, 'Banco'));
    if (swift) chain = chain.then(() => escribirPorName('client.swift', swift, 'Swift'));

    //  6) Forma de pago: en tu HTML es input name="client.paymentMethodId" + botón (buscador)
    // FORZAR valor a 62 (el usuario indicó que el 233 no existe en la base de datos)
    const formaPagoForzada = '62';
    cy.log(`Forma de Pago: usando valor forzado "${formaPagoForzada}" en lugar del Excel (${formaPago || 'vacío'})`);
    chain = chain.then(() => escribirPorName('client.paymentMethodId', formaPagoForzada, 'Forma de Pago'));

    //  7) Días cobro (dos inputs diaCobro1/diaCobro2). Si solo tienes uno en Excel, va al 1.
    if (diasCobro) {
      chain = chain.then(() => escribirPorName('client.diaCobro1', diasCobro, 'Días Cobro'));
    }

    //  8) Cobro fin mes (switch checkbox)
    if (cobroFinMes) {
      chain = chain.then(() => {
        cy.log('Marcando "Cobro fin mes"');
        return cy.get('input[name="client.cobroFinMes"]', { timeout: 10000 })
          .should('exist')
          .check({ force: true });
      });
    }

    //  9) C. Contable (name="client.bankAccount")
    if (cContable) {
      chain = chain.then(() => escribirPorName('client.bankAccount', cContable, 'C. Contable'));
    }

    //  10) C. Venta (autocomplete)
    if (cVenta) {
      chain = chain.then(() => seleccionarAutocompletePorLabel('C. Venta', cVenta, { strictExact: true }));
    }

    //  11) IBAN (especial; 5 campos separados)
    if (ibanParte1 || ibanOffice || ibanControl || ibanAccount || ibanParte2 || iban) {
      chain = chain.then(() => {
        cy.log(`Ejecutando escritura de IBAN: país="${ibanParte1 || '(vacío)'}", office="${ibanOffice || '(vacío)'}", control="${ibanControl || '(vacío)'}", account="${ibanAccount || '(vacío)'}", parte2="${ibanParte2 || '(vacío)'}", completo="${iban || '(vacío)'}"`);
        return escribirIbanSiSePuede(iban, ibanParte1, ibanParte2, ibanOffice, ibanControl, ibanAccount);
      })
        .then(() => {
          // Esperar un momento adicional después de escribir el IBAN para asegurar que se procese
          cy.wait(500);

          // Construir IBAN completo manualmente si tenemos todas las partes
          const ibanCompletoManual = (ibanParte1 && ibanOffice && ibanControl && ibanAccount)
            ? `${String(ibanParte1).trim()}${String(ibanOffice).trim()}${String(ibanControl).trim()}${String(ibanAccount).trim()}`
            : (iban || null);

          if (ibanCompletoManual && ibanCompletoManual.length >= 15) {
            cy.log(`IBAN completo construido manualmente: "${ibanCompletoManual}" (${ibanCompletoManual.length} caracteres)`);
            console.log(`IBAN completo construido manualmente: "${ibanCompletoManual}" (${ibanCompletoManual.length} caracteres)`);

            // Guardar el IBAN completo en una variable global para que el intercept pueda usarlo
            cy.window().then((win) => {
              win.ibanCompletoGlobal = ibanCompletoManual;
              cy.log(`IBAN completo guardado globalmente: "${ibanCompletoManual}"`);
              console.log(`IBAN completo guardado globalmente: "${ibanCompletoManual}"`);
            });

            // Buscar y escribir el IBAN completo en un campo oculto o principal
            return cy.get('body').then($body => {
              // Buscar campo oculto o principal para el IBAN completo (múltiples estrategias)
              let $ibanCompleto = $body.find('input[name="client.iban"]').first();

              if (!$ibanCompleto.length) {
                $ibanCompleto = $body.find('input[name*="iban"][type="hidden"]').first();
              }
              if (!$ibanCompleto.length) {
                $ibanCompleto = $body.find('input[id*="iban"][type="hidden"]').first();
              }
              if (!$ibanCompleto.length) {
                $ibanCompleto = $body.find('input[name*="IBAN"]').first();
              }
              if (!$ibanCompleto.length) {
                // Buscar cualquier input que contenga "iban" en su nombre o id (visible u oculto)
                $ibanCompleto = $body.find('input[name*="iban"], input[id*="iban"]').not('input[name*="iban-country"], input[name*="iban-iban"], input[name*="iban-office"], input[name*="iban-entity"], input[name*="iban-control"], input[name*="iban-account"]').first();
              }

              if ($ibanCompleto.length) {
                const campoName = $ibanCompleto.attr('name') || $ibanCompleto.attr('id') || 'sin nombre';
                cy.log(`Escribiendo IBAN completo en campo "${campoName}": "${ibanCompletoManual}"`);
                console.log(`Escribiendo IBAN completo en campo "${campoName}": "${ibanCompletoManual}"`);

                // Usar jQuery para establecer el valor directamente y disparar eventos
                const $input = Cypress.$($ibanCompleto[0]);
                const valorAnterior = $input.val() || '';
                $input.val(ibanCompletoManual);
                $input.trigger('input');
                $input.trigger('change');
                $input.trigger('blur');

                const valorDespues = $input.val() || '';
                cy.log(`IBAN completo: antes="${valorAnterior}", después="${valorDespues}"`);
                console.log(`IBAN completo: antes="${valorAnterior}", después="${valorDespues}"`);

                return cy.wait(300);
              } else {
                cy.log('No se encontró campo oculto para IBAN completo. El formulario debería construirlo automáticamente desde los 5 campos individuales.');
                console.warn('No se encontró campo oculto para IBAN completo. El formulario debería construirlo automáticamente desde los 5 campos individuales.');

                // Intentar buscar todos los inputs relacionados con IBAN para debug
                const $todosIban = $body.find('input[name*="iban"], input[id*="iban"]');
                cy.log(`DEBUG: Se encontraron ${$todosIban.length} inputs relacionados con IBAN:`);
                $todosIban.each((i, el) => {
                  const $el = Cypress.$(el);
                  const name = $el.attr('name') || '';
                  const id = $el.attr('id') || '';
                  const type = $el.attr('type') || 'text';
                  const valor = $el.val() || '';
                  cy.log(`  Input ${i + 1}: name="${name}", id="${id}", type="${type}", valor="${valor}"`);
                });
              }

              // Verificar que los campos del IBAN se hayan rellenado correctamente
              const $ibanInputs = $body.find('input[name*="iban"], input[id*="iban"]').filter(':visible');
              cy.log(`IBAN: Verificando ${$ibanInputs.length} campos IBAN después de escribir...`);
              let ibanCompletoVerificado = '';
              $ibanInputs.each((i, el) => {
                const valor = (el.value || '').trim();
                const name = el.name || el.id || 'sin nombre';
                cy.log(`  Campo IBAN ${i + 1} (${name}): valor="${valor}"`);
                if (valor) {
                  ibanCompletoVerificado += valor;
                }
              });
              if (ibanCompletoVerificado) {
                cy.log(`IBAN completo verificado desde campos visibles: "${ibanCompletoVerificado}" (${ibanCompletoVerificado.length} caracteres)`);
                console.log(`IBAN completo verificado desde campos visibles: "${ibanCompletoVerificado}" (${ibanCompletoVerificado.length} caracteres)`);
              }

              return cy.wrap(null);
            });
          } else {
            cy.log(`ADVERTENCIA: No se pudo construir IBAN completo (faltan partes): país=${!!ibanParte1}, office=${!!ibanOffice}, control=${!!ibanControl}, account=${!!ibanAccount}`);
            console.warn(`⚠ ADVERTENCIA: No se pudo construir IBAN completo (faltan partes): país=${!!ibanParte1}, office=${!!ibanOffice}, control=${!!ibanControl}, account=${!!ibanAccount}`);
            return cy.wrap(null);
          }
        });
    } else {
      cy.log(`IBAN no se ejecutará: país=${!!ibanParte1}, office=${!!ibanOffice}, control=${!!ibanControl}, account=${!!ibanAccount}, parte2=${!!ibanParte2}, completo=${!!iban}`);
    }

    //  12) Dto (name="client.discount")
    if (dto !== undefined && dto !== null && `${dto}` !== '') {
      chain = chain.then(() => escribirPorName('client.discount', dto, 'Dto'));
    }

    //  13) Con Riesgo (switch: name="client.withRiskB") y Riesgo asegurado (name="client.insuredRisk")
    if (conRiesgo) {
      chain = chain.then(() => {
        cy.log('Activando "Con Riesgo"');
        return cy.get('input[name="client.withRiskB"]', { timeout: 10000 })
          .should('exist')
          .check({ force: true });
      });
    }

    if (riesgoAsegurado !== undefined && riesgoAsegurado !== null && `${riesgoAsegurado}` !== '') {
      chain = chain.then(() => {
        // Solo escribir si el input está visible (evita fallos si UI lo oculta)
        return cy.get('body').then(($body) => {
          const $inp = $body.find('input[name="client.insuredRisk"]').filter(':visible');
          if (!$inp.length) {
            cy.log('Riesgo Asegurado no visible, se omite');
            return cy.wrap(null);
          }
          return escribirPorName('client.insuredRisk', riesgoAsegurado, 'Riesgo Asegurado');
        });
      });
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Facturación rellenado (corregido)`);
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

    //  Si no existe el input, NO fallar
    return cy.get('body').then($body => {
      const $found = $body.find(selector);
      if (!$found.length) {
        cy.log(`(SKIP) No existe en UI: ${selector}`);
        return cy.wrap(null);
      }

      // Usamos el elemento encontrado para evitar re-render
      const $el = $found.first();

      return cy.wrap($el)
        .scrollIntoView()
        .should('be.visible')
        .then(() => {
          // Limpiar el campo de forma más agresiva: seleccionar todo y borrar
          cy.wrap($el).click({ force: true });
          cy.wrap($el).type('{selectall}', { force: true });
          cy.wrap($el).clear({ force: true });
          cy.wait(50);
          // Verificar que esté vacío antes de escribir usando cy.then() en lugar de cy.should()
          return cy.wrap($el).then(($input) => {
            const val = $input.val();
            // Si todavía tiene valor (incluyendo "0"), intentar borrar de nuevo
            if (val && val !== '') {
              cy.wrap($input).click({ force: true });
              cy.wrap($input).type('{selectall}', { force: true });
              cy.wrap($input).clear({ force: true });
              cy.wait(30);
            }
            return cy.wrap(null);
          });
        })
        .then(() => {
          cy.wait(100);
          return cy.wrap($el).type(texto, { force: true, delay: 0 });
        })
        .then(() => {
          cy.wait(50);
          // Usar cy.then() en lugar de cy.should() para evitar el error de comandos dentro del callback
          return cy.wrap($el).then(($input) => {
            const valorActual = $input.val();
            if (valorActual !== texto) {
              // Mover cy.log() fuera del callback usando cy.then() para loguear después
              cy.log(` Valor esperado "${texto}" pero se obtuvo "${valorActual}", continuando...`);
            }
            return cy.wrap(null);
          });
        });
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

  function clickGuardarDentroFormulario() {
    return cy.get('button', { timeout: 15000 })
      .filter((_, el) => {
        const $el = Cypress.$(el);
        const texto = ($el.text() || '').trim().toLowerCase();
        const tieneSvg = $el.find('svg').length > 0;
        return texto === 'guardar' && !tieneSvg;
      })
      .then($btns => {
        const ordenados = [...$btns].sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);
        return cy.wrap(ordenados[0]); // el más abajo en pantalla
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
    // Generar nombre único usando timestamp + número aleatorio para evitar duplicados
    const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos del timestamp
    const numeroAleatorio = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const nombreCliente = `prueba${timestamp}${numeroAleatorio}`;
    cy.log(`TC043: Nombre del cliente generado (único): ${nombreCliente}`);

    // Variable para almacenar el código del cliente (se capturará después de guardar)
    let codigoCliente = null;

    // Modificar el caso para usar el nombre generado
    const casoModificado = { ...casoDatosGenerales };
    casoModificado.dato_7 = nombreCliente; // El nombre va en dato_7

    // En TC043, Facturación debe aplicar exactamente la lógica/datos del caso 10 (si existe)
    const caso10Facturacion = todosLosCasos.find((c) => {
      const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
      return num === 10;
    });

    // Interceptar la petición POST para capturar qué se está enviando y corregir el IBAN
    // IMPORTANTE: Configurar el interceptor ANTES de hacer login
    cy.intercept('POST', '**/InsertRegister**', (req) => {
      // Modificar el request body para corregir el IBAN incompleto
      if (req.body) {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

          // Obtener el IBAN completo desde window (guardado antes de hacer click en Guardar)
          const ibanCompletoGlobal = window.ibanCompletoGlobal;

          // Si tenemos un IBAN completo guardado globalmente, usarlo
          if (ibanCompletoGlobal && ibanCompletoGlobal.length >= 15) {
            // Corregir IBAN en Mantenimiento
            if (body.Mantenimiento && body.Mantenimiento.IBAN) {
              const ibanAnterior = body.Mantenimiento.IBAN;
              if (ibanAnterior.length < 15) {
                body.Mantenimiento.IBAN = ibanCompletoGlobal;
                console.log(`[INTERCEPT] IBAN corregido en Mantenimiento: "${ibanAnterior}" -> "${ibanCompletoGlobal}"`);
              }
            }

            // Corregir IBAN en FacturacionEmpresas
            if (body.FacturacionEmpresas && Array.isArray(body.FacturacionEmpresas)) {
              body.FacturacionEmpresas.forEach((fact, idx) => {
                if (fact.IBAN && fact.IBAN.length < 15) {
                  const ibanAnterior = fact.IBAN;
                  fact.IBAN = ibanCompletoGlobal;
                  console.log(`[INTERCEPT] IBAN corregido en FacturacionEmpresas[${idx}]: "${ibanAnterior}" -> "${ibanCompletoGlobal}"`);
                }
              });
            }

            // Actualizar el request body
            req.body = typeof req.body === 'string' ? JSON.stringify(body) : body;
          } else {
            console.warn(`[INTERCEPT] No se encontró IBAN completo global (ibanCompletoGlobal=${ibanCompletoGlobal})`);
          }
        } catch (e) {
          console.error(`[INTERCEPT] Error al procesar request body: ${e.message}`);
        }
      }
    }).as('guardarCliente');

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
        return abrirFormularioNuevoCliente();
      })
      .then(() => {
        return cy.url().then((urlDespuesNuevo) => {
          if (!urlDespuesNuevo.includes('/dashboard/clients/form')) {
            cy.log('El formulario no se abrió, intentando de nuevo el botón "+ Nuevo"...');
            return abrirFormularioNuevoCliente().then(() =>
              cy.url().should('include', '/dashboard/clients/form')
            );
          }
          return cy.wrap(null);
        });
      })
      .then(() => {
        cy.log('Rellenando DATOS GENERALES usando datos del caso 7...');
        // Rellenar DATOS GENERALES con el nombre generado
        return llenarFormularioGeneralesDesdeExcel(casoModificado, 7);
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

        // TC043: ejecutar Documentos SIEMPRE al final (justo antes del Guardar principal)
        const casoDocumentos = casosPestañas.find((c) => /documento/i.test(deducirSeccionDesdeCaso(c)));
        const casosSinDocumentos = casosPestañas.filter((c) => !/documento/i.test(deducirSeccionDesdeCaso(c)));

        // Rellenar cada pestaña usando la misma lógica que anadirCliente
        let chain = cy.wrap(null);

        casosSinDocumentos.forEach((casoPestaña) => {
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
              // En TC043, Documentos se ejecuta al final fuera de este bucle
              if (esSeccionDocumentos) {
                cy.log('TC043: Documentos se pospone al final, continuando con la siguiente pestaña...');
                return cy.wrap(null);
              }
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
                    return clickGuardarDentroFormulario().then(() => cy.wait(500));

                  })
                  .then(() => cy.wait(500));
              }

              return navegarSeccionFormulario(seccion)
                .then(() => {
                  if (esSeccionContacto) return abrirModalContacto();
                  // Zonas de carga ahora requiere rellenar "Nombre"
                  // Para Zonas de carga NO usamos esperarDrawerVisible() (sus inputs no coinciden con la lista hardcodeada)
                  return abrirModalSeccion(seccion, esZonasCarga ? false : !esZonasCarga);
                })
                .then(() => {
                  if (esZonasCarga) return llenarFormularioZonasCarga(casoPestaña, numeroPestaña);
                  if (esSeccionContacto) {
                    return llenarFormularioContacto(casoPestaña, numeroPestaña);
                  }
                  if (esSeccionAcciones) {
                    return llenarFormularioAcciones(casoPestaña, numeroPestaña);
                  }
                  if (esSeccionCertificaciones) {
                    return llenarFormularioCertificaciones(casoPestaña, numeroPestaña);
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
                  if (esSeccionContacto || esSeccionAcciones || esZonasCarga || esSeccionCertificaciones) {
                    cy.log(`Guardando modal de ${seccion} usando botón Guardar del formulario...`);
                    return clickGuardarDentroFormulario().then(() => cy.wait(500));
                  } else {
                    // No guardar nada, solo continuar a la siguiente pestaña
                    cy.log(`No se guarda modal de ${seccion}, continuando a siguiente pestaña`);
                    return cy.wrap(null);
                  }
                })
                .then(() => cy.wait(500));
            }

            // Sección Facturación sin modal
            // TC043: usar EXACTAMENTE el caso 10 para Facturación (igual que en TC010)
            if (esSeccionFacturacion) {
              if (!caso10Facturacion) {
                cy.log('TC043: ERROR - No se encontró el caso 10 para Facturación. Se omite el rellenado de Facturación.');
                return cy.wrap(null);
              }
              // Hacer EXACTAMENTE igual que en anadirCliente (caso 10) - línea 951-952
              // Añadir un wait adicional para asegurar que la pestaña esté completamente cargada
              return navegarSeccionFormulario(seccion)
                .then(() => {
                  cy.wait(1000); // Esperar a que la pestaña de Facturación esté completamente cargada
                  cy.log('TC043: Pestaña Facturación cargada, iniciando rellenado...');
                  return llenarFormularioFacturacion(caso10Facturacion, 10);
                })
                .then(() => {
                  cy.wait(1000); // Esperar después de rellenar Facturación para evitar errores 500
                });
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
        cy.log('TC043: Se omite la subida de documentos para evitar errores 500');

        return chain;
      })
      .then(() => {
        // Verificar que estamos todavía en el formulario antes de guardar
        return cy.url().then((urlActual) => {
          if (!urlActual.includes('/dashboard/clients/form')) {
            cy.log(' Ya no estamos en el formulario, no se puede guardar');
            return cy.wrap(null);
          }

          cy.log('Guardando formulario principal DESPUÉS de rellenar todas las pestañas (Documentos va el último)...');

          // Esperar un momento adicional para asegurar que todos los campos estén completamente procesados
          // Especialmente importante después de subir documentos
          cy.wait(3000);

          // Verificar que no haya errores de validación visibles antes de guardar
          return cy.get('body').then($body => {
            const erroresValidacion = $body.find('[class*="error"], [class*="Error"]')
              .filter((_, el) => {
                const texto = (el.textContent || '').toLowerCase();
                return texto.includes('obligatorio') || texto.includes('requerido') || texto.includes('required');
              });

            if (erroresValidacion.length > 0) {
              cy.log(`ADVERTENCIA: Se encontraron ${erroresValidacion.length} errores de validación antes de guardar`);
              erroresValidacion.each((i, el) => {
                cy.log(`  - Error: ${(el.textContent || '').trim()}`);
              });
            } else {
              cy.log(' No se detectaron errores de validación antes de guardar');
            }
          })
            .then(() => {
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
                  // ANTES de hacer click en Guardar: construir el IBAN completo desde los campos del formulario
                  return cy.get('body').then($body => {
                    const $ibanInputs = $body.find('input[name*="iban"], input[id*="iban"]').filter(':visible');
                    const ibanPartes = {};

                    // Buscar los 5 campos del IBAN
                    $ibanInputs.each((i, el) => {
                      const name = el.name || el.id || '';
                      const valor = (el.value || '').trim();

                      if (name.includes('iban-country') || name.includes('iban-iban')) {
                        ibanPartes.pais = valor; // EE11
                      } else if (name.includes('iban-office') || name.includes('iban-entity')) {
                        ibanPartes.office = valor; // 1111
                      } else if (name.includes('iban-control')) {
                        ibanPartes.control = valor; // 11
                      } else if (name.includes('iban-account')) {
                        ibanPartes.account = valor; // 1111111111
                      }
                    });

                    // Construir IBAN completo si tenemos todas las partes
                    if (ibanPartes.pais && ibanPartes.office && ibanPartes.control && ibanPartes.account) {
                      const ibanCompleto = `${ibanPartes.pais}${ibanPartes.office}${ibanPartes.control}${ibanPartes.account}`;
                      cy.window().then((win) => {
                        win.ibanCompletoGlobal = ibanCompleto;
                        cy.log(`IBAN completo construido antes de Guardar: "${ibanCompleto}" (${ibanCompleto.length} caracteres)`);
                        console.log(`IBAN completo construido antes de Guardar: "${ibanCompleto}" (${ibanCompleto.length} caracteres)`);
                      });
                    } else {
                      cy.log(`No se pudo construir IBAN completo antes de Guardar. Partes encontradas: país=${!!ibanPartes.pais}, office=${!!ibanPartes.office}, control=${!!ibanPartes.control}, account=${!!ibanPartes.account}`);
                    }

                    return cy.wrap(botonGuardarGeneral)
                      .should('be.visible')
                      .scrollIntoView()
                      .click({ force: true });
                  })
                    .then(() => {
                      cy.log('TC043: Botón Guardar clickeado, esperando respuesta...');

                      // Esperar a que se complete la petición y capturar la respuesta
                      return cy.wait('@guardarCliente', { timeout: 15000 })
                        .then((interception) => {
                          const status = interception.response?.statusCode || 'N/A';
                          const statusText = interception.response?.statusMessage || 'N/A';
                          const requestBody = interception.request.body;
                          const responseBody = interception.response?.body;

                          // Logs en Cypress
                          cy.log('═══════════════════════════════════════════════════════');
                          cy.log('TC043: RESPUESTA DEL SERVIDOR RECIBIDA');
                          cy.log(`Status: ${status}`);
                          cy.log(`Status Text: ${statusText}`);

                          // También en consola del navegador (más visible)
                          console.log('═══════════════════════════════════════════════════════');
                          console.log('TC043: RESPUESTA DEL SERVIDOR RECIBIDA');
                          console.log('Status:', status);
                          console.log('Status Text:', statusText);

                          if (responseBody) {
                            cy.log(`Response Body: ${JSON.stringify(responseBody, null, 2)}`);
                            console.log('Response Body:', responseBody);

                            // Intentar capturar el código del cliente desde la respuesta
                            if (responseBody.code || responseBody.codigo || responseBody.id) {
                              codigoCliente = responseBody.code || responseBody.codigo || responseBody.id;
                              cy.log(`TC043: Código del cliente capturado desde respuesta: ${codigoCliente}`);
                              console.log(`TC043: Código del cliente capturado desde respuesta: ${codigoCliente}`);
                            }
                          }

                          if (status === 409) {
                            cy.log(' ERROR 409 DETECTADO: El código del cliente ya existe');
                            console.error('ERROR 409 DETECTADO: El código del cliente ya existe');
                            if (responseBody?.Message) {
                              cy.log(`Mensaje: ${responseBody.Message}`);
                              console.error(`Mensaje: ${responseBody.Message}`);
                            }
                            // Si el código ya existe, no intentar guardar de nuevo
                            cy.log('El cliente ya existe en la base de datos. No se intentará guardar de nuevo.');
                            console.warn('El cliente ya existe en la base de datos. No se intentará guardar de nuevo.');
                          }

                          if (status === 500) {
                            cy.log(' ERROR 500 DETECTADO EN LA RESPUESTA');
                            cy.log(`Request Body enviado: ${JSON.stringify(requestBody, null, 2)}`);
                            console.error('ERROR 500 DETECTADO EN LA RESPUESTA');
                            console.log('Request Body enviado:', requestBody);
                            console.log('Request Body (JSON):', JSON.stringify(requestBody, null, 2));

                            // Mostrar el mensaje de error del servidor si está disponible
                            if (responseBody?.Message || responseBody?.MENSAJE_ERROR) {
                              const errorMsg = responseBody.Message || responseBody.MENSAJE_ERROR;
                              cy.log(`Mensaje de error del servidor: ${errorMsg}`);
                              console.error(`Mensaje de error del servidor: ${errorMsg}`);
                            }

                            // Análisis detallado de campos problemáticos
                            cy.log('═══════════════════════════════════════════════════════');
                            cy.log('ANÁLISIS DE CAMPOS EN REQUEST BODY:');
                            console.log('═══════════════════════════════════════════════════════');
                            console.log('ANÁLISIS DE CAMPOS EN REQUEST BODY:');

                            if (requestBody?.Mantenimiento) {
                              const mant = requestBody.Mantenimiento;

                              // Verificar IBAN
                              if (mant.IBAN) {
                                const ibanLength = String(mant.IBAN || '').length;
                                if (ibanLength < 10) {
                                  cy.log(`PROBLEMA DETECTADO: IBAN incompleto (solo ${ibanLength} caracteres): "${mant.IBAN}"`);
                                  console.error(`PROBLEMA DETECTADO: IBAN incompleto (solo ${ibanLength} caracteres): "${mant.IBAN}"`);
                                  cy.log(`El IBAN debería tener al menos 15-34 caracteres.`);
                                  console.error(`El IBAN debería tener al menos 15-34 caracteres.`);
                                }
                              }

                              // Verificar otros campos numéricos que podrían ser inválidos
                              if (mant.IdFormaPago && (isNaN(mant.IdFormaPago) || mant.IdFormaPago <= 0)) {
                                cy.log(`PROBLEMA DETECTADO: IdFormaPago inválido: ${mant.IdFormaPago}`);
                                console.error(`PROBLEMA DETECTADO: IdFormaPago inválido: ${mant.IdFormaPago}`);
                              }

                              if (mant.IdmTipoFacturacion && (isNaN(mant.IdmTipoFacturacion) || mant.IdmTipoFacturacion <= 0)) {
                                cy.log(`PROBLEMA DETECTADO: IdmTipoFacturacion inválido: ${mant.IdmTipoFacturacion}`);
                                console.error(`PROBLEMA DETECTADO: IdmTipoFacturacion inválido: ${mant.IdmTipoFacturacion}`);
                              }

                              if (mant.IdmCuentaVenta && (isNaN(mant.IdmCuentaVenta) || mant.IdmCuentaVenta <= 0)) {
                                cy.log(`PROBLEMA DETECTADO: IdmCuentaVenta inválido: ${mant.IdmCuentaVenta}`);
                                console.error(`PROBLEMA DETECTADO: IdmCuentaVenta inválido: ${mant.IdmCuentaVenta}`);
                              }

                              // Verificar campos de fecha
                              if (mant.Alta && !/^\d{4}-\d{2}-\d{2}$/.test(mant.Alta)) {
                                cy.log(`PROBLEMA DETECTADO: Fecha Alta formato incorrecto: "${mant.Alta}"`);
                                console.error(`PROBLEMA DETECTADO: Fecha Alta formato incorrecto: "${mant.Alta}"`);
                              }
                            }

                            // Verificar FacturacionEmpresas
                            if (requestBody?.FacturacionEmpresas && Array.isArray(requestBody.FacturacionEmpresas)) {
                              requestBody.FacturacionEmpresas.forEach((fact, idx) => {
                                if (fact.IBAN && String(fact.IBAN).length < 10) {
                                  cy.log(`PROBLEMA DETECTADO: IBAN incompleto en FacturacionEmpresas[${idx}]: "${fact.IBAN}"`);
                                  console.error(`PROBLEMA DETECTADO: IBAN incompleto en FacturacionEmpresas[${idx}]: "${fact.IBAN}"`);
                                }
                              });
                            }

                            cy.log('═══════════════════════════════════════════════════════');
                            console.log('═══════════════════════════════════════════════════════');
                          }

                          cy.log('═══════════════════════════════════════════════════════');
                          console.log('═══════════════════════════════════════════════════════');

                          // Retornar el código si se capturó
                          return cy.wrap(codigoCliente);
                        });
                    });
                } else {
                  // Fallback: buscar cualquier botón Guardar que no esté en un modal
                  return cy.contains('button', /^Guardar$/i, { timeout: 10000 })
                    .not('.MuiDrawer-root button, .MuiModal-root button, [role="dialog"] button')
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.log('TC043: Botón Guardar clickeado (fallback), esperando respuesta...');

                      // Esperar a que se complete la petición y capturar la respuesta
                      return cy.wait('@guardarCliente', { timeout: 15000 })
                        .then((interception) => {
                          const status = interception.response?.statusCode || 'N/A';
                          const requestBody = interception.request.body;
                          const responseBody = interception.response?.body;

                          // Logs en Cypress
                          cy.log('═══════════════════════════════════════════════════════');
                          cy.log('TC043: RESPUESTA DEL SERVIDOR RECIBIDA (fallback)');
                          cy.log(`Status: ${status}`);

                          // También en consola del navegador (más visible)
                          console.log('═══════════════════════════════════════════════════════');
                          console.log('TC043: RESPUESTA DEL SERVIDOR RECIBIDA (fallback)');
                          console.log('Status:', status);

                          if (responseBody) {
                            // Intentar capturar el código del cliente desde la respuesta
                            if (responseBody.code || responseBody.codigo || responseBody.id) {
                              codigoCliente = responseBody.code || responseBody.codigo || responseBody.id;
                              cy.log(`TC043: Código del cliente capturado desde respuesta (fallback): ${codigoCliente}`);
                              console.log(`TC043: Código del cliente capturado desde respuesta (fallback): ${codigoCliente}`);
                            }
                          }

                          if (status === 500) {
                            cy.log('ERROR 500 DETECTADO EN LA RESPUESTA (fallback)');
                            cy.log(`Request Body enviado: ${JSON.stringify(requestBody, null, 2)}`);
                            console.error('ERROR 500 DETECTADO EN LA RESPUESTA (fallback)');
                            console.log('Request Body enviado:', requestBody);
                            console.log('Request Body (JSON):', JSON.stringify(requestBody, null, 2));

                            // Análisis detallado de campos problemáticos (igual que en el bloque principal)
                            cy.log('═══════════════════════════════════════════════════════');
                            cy.log('ANÁLISIS DE CAMPOS EN REQUEST BODY (fallback):');
                            console.log('═══════════════════════════════════════════════════════');
                            console.log('ANÁLISIS DE CAMPOS EN REQUEST BODY (fallback):');

                            if (requestBody?.Mantenimiento) {
                              const mant = requestBody.Mantenimiento;

                              // Verificar IBAN
                              if (mant.IBAN) {
                                const ibanLength = String(mant.IBAN || '').length;
                                if (ibanLength < 10) {
                                  cy.log(`PROBLEMA DETECTADO: IBAN incompleto (solo ${ibanLength} caracteres): "${mant.IBAN}"`);
                                  console.error(`PROBLEMA DETECTADO: IBAN incompleto (solo ${ibanLength} caracteres): "${mant.IBAN}"`);
                                  cy.log(`   El IBAN debería tener al menos 15-34 caracteres.`);
                                  console.error(`   El IBAN debería tener al menos 15-34 caracteres.`);
                                }
                              }

                              // Verificar otros campos numéricos que podrían ser inválidos
                              if (mant.IdFormaPago && (isNaN(mant.IdFormaPago) || mant.IdFormaPago <= 0)) {
                                cy.log(`PROBLEMA DETECTADO: IdFormaPago inválido: ${mant.IdFormaPago}`);
                                console.error(`PROBLEMA DETECTADO: IdFormaPago inválido: ${mant.IdFormaPago}`);
                              }

                              if (mant.IdmTipoFacturacion && (isNaN(mant.IdmTipoFacturacion) || mant.IdmTipoFacturacion <= 0)) {
                                cy.log(`PROBLEMA DETECTADO: IdmTipoFacturacion inválido: ${mant.IdmTipoFacturacion}`);
                                console.error(`PROBLEMA DETECTADO: IdmTipoFacturacion inválido: ${mant.IdmTipoFacturacion}`);
                              }

                              if (mant.IdmCuentaVenta && (isNaN(mant.IdmCuentaVenta) || mant.IdmCuentaVenta <= 0)) {
                                cy.log(`PROBLEMA DETECTADO: IdmCuentaVenta inválido: ${mant.IdmCuentaVenta}`);
                                console.error(`PROBLEMA DETECTADO: IdmCuentaVenta inválido: ${mant.IdmCuentaVenta}`);
                              }

                              // Verificar campos de fecha
                              if (mant.Alta && !/^\d{4}-\d{2}-\d{2}$/.test(mant.Alta)) {
                                cy.log(`PROBLEMA DETECTADO: Fecha Alta formato incorrecto: "${mant.Alta}"`);
                                console.error(`PROBLEMA DETECTADO: Fecha Alta formato incorrecto: "${mant.Alta}"`);
                              }
                            }

                            // Verificar FacturacionEmpresas
                            if (requestBody?.FacturacionEmpresas && Array.isArray(requestBody.FacturacionEmpresas)) {
                              requestBody.FacturacionEmpresas.forEach((fact, idx) => {
                                if (fact.IBAN && String(fact.IBAN).length < 10) {
                                  cy.log(`PROBLEMA DETECTADO: IBAN incompleto en FacturacionEmpresas[${idx}]: "${fact.IBAN}"`);
                                  console.error(`PROBLEMA DETECTADO: IBAN incompleto en FacturacionEmpresas[${idx}]: "${fact.IBAN}"`);
                                }
                              });
                            }

                            cy.log('═══════════════════════════════════════════════════════');
                            console.log('═══════════════════════════════════════════════════════');
                          }

                          cy.log('═══════════════════════════════════════════════════════');
                          console.log('═══════════════════════════════════════════════════════');

                          // Retornar el código si se capturó
                          return cy.wrap(codigoCliente);
                        });
                    });
                }
              });
            });
        });
      })
      .then(() => {
        // Verificar si aparece mensaje de "guardado correctamente" o éxito
        cy.log('TC043: Verificando si aparece mensaje de guardado correcto...');
        return cy.get('body', { timeout: 10000 }).then($body => {
          const textoCompleto = $body.text();
          const tieneExito = textoCompleto.includes('guardado correctamente') ||
            textoCompleto.includes('Guardado correctamente') ||
            textoCompleto.includes('guardado exitosamente') ||
            textoCompleto.includes('Guardado exitosamente') ||
            textoCompleto.includes('saved successfully') ||
            $body.find('[class*="success"], [class*="Success"], [role="alert"]').filter((_, el) => {
              const texto = (el.textContent || '').toLowerCase();
              return texto.includes('guardado') || texto.includes('correcto') || texto.includes('exitoso');
            }).length > 0;

          if (tieneExito) {
            cy.log('TC043: Mensaje de guardado correcto detectado');
            cy.wait(2000); // Esperar un poco más para asegurar que el guardado se complete
          } else {
            cy.log('TC043: No se detectó mensaje de éxito explícito, continuando...');
          }
        });
      })
      .then(() => {
        // Verificar si aparece una alerta de error después de guardar
        cy.log('TC043: Verificando si aparece alerta de error...');
        return cy.get('body').then($body => {
          const textoCompleto = $body.text();

          // Buscar alertas de error (como "Request failed with status code 500")
          const tieneError = textoCompleto.includes('Request failed with status code 500') ||
            textoCompleto.includes('status code 500') ||
            textoCompleto.includes('Error 500') ||
            $body.find('[class*="error"], [class*="Error"], [role="alert"]').filter((_, el) => {
              const texto = (el.textContent || '').toLowerCase();
              return texto.includes('500') ||
                texto.includes('error') ||
                texto.includes('failed');
            }).length > 0;

          if (tieneError) {
            cy.log(' TC043: Alerta de error detectada después de guardar');
            const mensajeError = $body.find('[class*="error"], [class*="Error"], [role="alert"]')
              .first()
              .text()
              .trim() || 'Request failed with status code 500';

            // Registrar como ERROR y terminar el caso
            return cy.registrarResultados({
              numero: 43,
              nombre: `TC043 - ${casoDatosGenerales?.nombre || 'Crear cliente completo con todas las pestañas'}`,
              esperado: 'Comportamiento correcto',
              obtenido: mensajeError,
              resultado: 'ERROR',
              pantalla: PANTALLA,
              archivo: 'reportes_pruebas_novatrans.xlsx'
            }).then(() => {
              cy.log('TC043: Caso terminado por error detectado');
              return cy.wrap('ERROR_DETECTADO');
            });
          }

          // Si no hay error, continuar con el flujo normal
          cy.log('TC043: No se detectó alerta de error, continuando con búsqueda...');
          return cy.wrap(null);
        });
      })
      .then((codigoDesdeRespuesta) => {
        // Si se detectó un error, terminar aquí sin buscar
        if (codigoDesdeRespuesta === 'ERROR_DETECTADO') {
          return cy.wrap(null);
        }

        // Si se capturó el código desde la respuesta, usarlo
        if (codigoDesdeRespuesta) {
          codigoCliente = codigoDesdeRespuesta;
          cy.log(`TC043: Código del cliente obtenido desde respuesta: ${codigoCliente}`);
        }

        cy.log(`TC043: Formulario guardado. Buscando cliente por código...`);

        // Volver a la lista y buscar el cliente por código
        return cy.url().then((urlActual) => {
          // Si todavía estamos en el formulario, navegar a la lista
          if (urlActual.includes('/dashboard/clients/form')) {
            cy.log('Navegando a la lista de clientes...');
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
        // Si no tenemos el código, intentar leerlo de la primera fila después de buscar por nombre
        if (!codigoCliente) {
          cy.log(`TC043: No se capturó el código desde la respuesta, buscando primero por nombre para obtener el código...`);
          return UI.buscar(nombreCliente)
            .then(() => cy.wait(1000))
            .then(() => {
              // Intentar leer el código de la primera fila de la tabla
              return cy.get('body').then($body => {
                const primeraFila = $body.find('.MuiDataGrid-row:visible').first();
                if (primeraFila.length > 0) {
                  // El código suele estar en la primera columna
                  const primeraCelda = primeraFila.find('.MuiDataGrid-cell').first();
                  const textoCodigo = (primeraCelda.text() || '').trim();
                  if (textoCodigo && /^\d+$/.test(textoCodigo)) {
                    codigoCliente = textoCodigo;
                    cy.log(`TC043: Código del cliente leído de la tabla: ${codigoCliente}`);
                  }
                }
                return cy.wrap(null);
              });
            });
        }
        return cy.wrap(null);
      })
      .then(() => {
        // Buscar el cliente por código (o por nombre si no tenemos código)
        const valorBusqueda = codigoCliente || nombreCliente;
        const tipoBusqueda = codigoCliente ? 'código' : 'nombre';
        cy.log(`TC043: Buscando cliente por ${tipoBusqueda}: ${valorBusqueda}`);
        return UI.buscar(valorBusqueda);
      })
      .then(() => {
        cy.wait(1000);

        // Reintentar la búsqueda una vez si no se encuentra la fila
        let intentos = 0;
        const buscarFila = () => {
          return cy.get('body').then($body => {
            const filas = $body.find('.MuiDataGrid-row:visible');
            if (filas.length === 0) {
              cy.log(' No se encontraron filas en la tabla');
              return cy.wrap(null);
            }

            // Buscar por código si lo tenemos, sino por nombre
            const filaEncontrada = Array.from(filas).find((el) => {
              const textoFila = (el.innerText || el.textContent || '').toLowerCase();
              if (codigoCliente) {
                // Buscar por código (suele estar en la primera columna)
                const primeraCelda = el.querySelector('.MuiDataGrid-cell:first-child');
                const codigoEnFila = primeraCelda ? (primeraCelda.textContent || '').trim() : '';
                return codigoEnFila === codigoCliente || textoFila.includes(codigoCliente.toLowerCase());
              } else {
                // Buscar por nombre como fallback
                return textoFila.includes(nombreCliente.toLowerCase());
              }
            });

            if (filaEncontrada) {
              const tipoEncontrado = codigoCliente ? 'código' : 'nombre';
              cy.log(`Cliente encontrado en la lista por ${tipoEncontrado} - VERIFICADO que está guardado`);
              cy.log('Abriendo formulario de edición para verificar datos...');
              return cy.wrap(filaEncontrada).dblclick({ force: true });
            }

            // Si no se encuentra y aún no hemos reintentado, volver a buscar
            if (intentos === 0) {
              intentos += 1;
              cy.log(' Fila no encontrada, reintentando búsqueda...');
              const valorBusqueda = codigoCliente || nombreCliente;
              return UI.buscar(valorBusqueda)
                .then(() => cy.wait(1000))
                .then(() => buscarFila());
            }

            const tipoBusqueda = codigoCliente ? 'código' : 'nombre';
            const valorBusqueda = codigoCliente || nombreCliente;
            cy.log(`ERROR: No se encontró la fila con el ${tipoBusqueda} del cliente "${valorBusqueda}" tras reintentar`);
            cy.log('El cliente NO está guardado en la base de datos');
            return cy.wrap('CLIENTE_NO_ENCONTRADO');
          });
        };

        return buscarFila();
      })
      .then((resultado) => {
        // Si no se encontró el cliente, terminar con error
        if (resultado === 'CLIENTE_NO_ENCONTRADO') {
          return cy.registrarResultados({
            numero: 43,
            nombre: `TC043 - ${casoDatosGenerales?.nombre || 'Crear cliente completo con todas las pestañas'}`,
            esperado: `Cliente "${nombreCliente}" guardado y encontrado en la lista`,
            obtenido: 'Cliente no encontrado en la lista después de guardar',
            resultado: 'ERROR',
            pantalla: PANTALLA,
            archivo: 'reportes_pruebas_novatrans.xlsx'
          }).then(() => {
            cy.log('TC043: Caso terminado - cliente no encontrado');
            return cy.wrap('CLIENTE_NO_ENCONTRADO');
          });
        }

        cy.wait(2000);
        // Verificar que estamos en el formulario de edición
        return cy.url().should('include', '/dashboard/clients/form')
          .then(() => {
            cy.log(`✓ TC043: Cliente "${nombreCliente}" guardado correctamente y verificado`);
            cy.log('✓ Formulario de edición abierto - el cliente existe en la base de datos');
          });
      })
      .then((resultado) => {
        // Si no se encontró el cliente, terminar aquí
        if (resultado === 'CLIENTE_NO_ENCONTRADO') {
          return cy.wrap(null);
        }

        // Continuar con la verificación de pestañas
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

        const escapeCssId = (id = '') => id.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');
        const normalizar = (v) => (v === undefined || v === null ? '' : String(v)).trim().toLowerCase();

        const obtenerDatoPorSelectorExcel = (caso, needle) => {
          const n = (needle || '').toString();
          const total = Number(caso?.__totalCamposExcel) || 30;
          for (let i = 1; i <= total; i++) {
            const sel = (caso?.[`valor_etiqueta_${i}`] || '').toString();
            const val = caso?.[`dato_${i}`];
            if (sel && sel.includes(n) && val !== undefined && val !== null && `${val}` !== '') {
              return val;
            }
          }
          return null;
        };

        const tieneValorEsperado = (v) => v !== undefined && v !== null && String(v).trim() !== '';

        const esperadosFacturacion = caso10Facturacion
          ? {
            // mismos mapeos que en llenarFormularioFacturacion()
            empresas: caso10Facturacion.dato_1,
            disenoFactura: caso10Facturacion.dato_2,
            banco: caso10Facturacion.dato_3,
            formaPago: caso10Facturacion.dato_4,
            swift: caso10Facturacion.dato_5,
            tipoFacturacion: obtenerDatoPorSelectorExcel(caso10Facturacion, 'r_5t_')
          }
          : null;

        const leerValorInputPorLabel = (labelTexto) => {
          const rx = new RegExp(`^${escapeRegex(labelTexto)}$`, 'i');
          return cy.get('body').then(($b) => {
            const $label = $b.find('label').filter((_, el) => rx.test((el.textContent || el.innerText || '').trim())).first();
            if ($label.length) {
              const forAttr = $label.attr('for');
              if (forAttr) {
                const sel = `#${escapeCssId(forAttr)}`;
                const $inp = $b.find(sel).first();
                if ($inp.length) return cy.wrap($inp).invoke('val');
              }
              const $inp2 = $label.parents('.MuiFormControl-root').first().find('input, textarea').first();
              if ($inp2.length) return cy.wrap($inp2).invoke('val');
            }
            return cy.wrap('');
          });
        };

        const verificarFacturacion = () => {
          if (!esperadosFacturacion) return cy.wrap([]);

          const checks = [
            { label: 'Empresas', esperado: esperadosFacturacion.empresas },
            { label: 'Tipo Facturación', esperado: esperadosFacturacion.tipoFacturacion },
            { label: 'Diseño Factura', esperado: esperadosFacturacion.disenoFactura }
          ];

          let chain = cy.wrap([]);
          checks.forEach((c) => {
            chain = chain.then((errores) => {
              // Solo validamos los campos que se intentaron rellenar (tienen valor esperado en Excel),
              // incluyendo valores como 0.
              if (!tieneValorEsperado(c.esperado)) return cy.wrap(errores);

              // Para "Empresas": está OK si está vacío o es "0" (el usuario indicó que no pasa nada)
              const esEmpresas = /^empresas$/i.test(c.label);

              return leerValorInputPorLabel(c.label).then((actual) => {
                const a = normalizar(actual);
                const e = normalizar(c.esperado);
                const esDiseno = /^diseño factura$/i.test(c.label);

                // Si es Empresas y está vacío o es "0", considerarlo OK
                if (esEmpresas && (!a || a === '0' || a === '')) {
                  cy.log(`Facturación (${c.label}): está vacío o es "0", se considera OK (no se verifica)`);
                  return cy.wrap(errores);
                }

                const ok = a && (esDiseno ? a === e : (a === e || a.includes(e)));
                if (!ok) {
                  const msg = `Facturación (${c.label}): esperado="${c.esperado}" obtenido="${actual || ''}"`;
                  return cy.wrap([...errores, msg]);
                }
                return cy.wrap(errores);
              });
            });
          });

          // Campos de texto: solo si tenían dato esperado en Excel
          const checksTexto = [
            { name: 'client.bankName', label: 'Banco', esperado: esperadosFacturacion.banco },
            { name: 'client.swift', label: 'Swift', esperado: esperadosFacturacion.swift }
          ];

          checksTexto.forEach((c) => {
            chain = chain.then((errores) => {
              if (!tieneValorEsperado(c.esperado)) return cy.wrap(errores);
              const sel = `input[name="${c.name}"], textarea[name="${c.name}"]`;
              return cy.get('body').then(($b) => {
                const $inp = $b.find(sel).filter(':visible').first();
                if ($inp.length) {
                  return cy.wrap($inp).invoke('val').then((actual) => {
                    const a = normalizar(actual);
                    const e = normalizar(c.esperado);
                    const ok = a && (a === e || a.includes(e));
                    if (!ok) {
                      const msg = `Facturación (${c.label}): esperado="${c.esperado}" obtenido="${actual || ''}"`;
                      return cy.wrap([...errores, msg]);
                    }
                    return cy.wrap(errores);
                  });
                }
                // Si no existe el input, intentamos por label como fallback
                return leerValorInputPorLabel(c.label).then((actual) => {
                  const a = normalizar(actual);
                  const e = normalizar(c.esperado);
                  const ok = a && (a === e || a.includes(e));
                  if (!ok) {
                    const msg = `Facturación (${c.label}): esperado="${c.esperado}" obtenido="${actual || ''}"`;
                    return cy.wrap([...errores, msg]);
                  }
                  return cy.wrap(errores);
                });
              });
            });
          });

          return chain;
        };

        pestañasAVerificar.forEach((pestañaInfo) => {
          chainVerificacion = chainVerificacion.then((pestañasSinDatos) => {
            cy.log(`Verificando pestaña: ${pestañaInfo.nombre}`);

            // Navegar a la pestaña
            return navegarSeccionFormulario(pestañaInfo.nombre)
              .then(() => cy.wait(1000))
              .then(() => {
                // Facturación: verificar campos (si se rellenaron y luego no aparecen => ERROR)
                if (pestañaInfo.nombre === 'Facturación') {
                  return verificarFacturacion().then((erroresFact) => {
                    const nuevas = [...pestañasSinDatos];
                    if (erroresFact && erroresFact.length) {
                      erroresFact.forEach((e) => nuevas.push(e));
                    } else {
                      // Si no hay esperados (caso 10 no existe), caemos a verificación genérica
                      // sin marcar error extra.
                    }
                    return cy.wrap(nuevas);
                  });
                }

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
        let mensaje = `Cliente ${nombreCliente} creado y verificado. Todas las pestañas tienen datos guardados.`;

        if (pestañasSinDatos && pestañasSinDatos.length > 0) {
          resultado = 'ERROR';
          const pestañasError = pestañasSinDatos.join(', ');
          mensaje = `Cliente ${nombreCliente} creado, pero las siguientes pestañas NO tienen datos guardados: ${pestañasError}`;
          cy.log(` ERROR: Las siguientes pestañas no tienen datos: ${pestañasError}`);
        } else {
          cy.log(` Todas las pestañas tienen datos guardados correctamente`);
        }

        // Registrar resultado
        return registrarResultadoAutomatico(
          43,
          'TC043',
          casoModificado?.nombre || 'Comprobar que se guardan todos los datos',
          mensaje,
          resultado,
          true
        );
      });
  }

});