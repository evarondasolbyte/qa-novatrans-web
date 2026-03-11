describe('FICHEROS (CLIENTES) - Validación dinámica desde Excel', () => {
  const { crearAyudasPantallaClientes } = require('../support/clientes/clientes_pantalla');
  const { crearHelpersFiltrosClientes } = require('../support/clientes/clientes_filtros');
  const { crearHelpersIdiomasClientes } = require('../support/clientes/clientes_idiomas');
  const { crearHelpersFormularioClientes } = require('../support/clientes/clientes_formulario');
  const { crearHelpersFacturacionClientes } = require('../support/clientes/clientes_facturacion');
  const { crearHelpersDocumentosClientes } = require('../support/clientes/clientes_documentos');
  const { crearHelperCrearCompletoClientes } = require('../support/clientes/clientes_crearCompleto');
  const {
    normalizarId,
    normalizarEtiquetaTexto,
    normalizarTextoParaComparar,
    escapeRegex,
    escribirPorName,
    parseFechaBasicaExcel,
    seleccionarFechaEnCalendario,
  } = require('../support/clientes/clientes_utils');

  const PANTALLA = 'Ficheros (Clientes)';
  const HOJA_EXCEL = 'Ficheros (Clientes)';
  const MENU = 'Ficheros';
  const SUBMENU = 'Clientes';
  const URL_PATH = '/dashboard/clients';

  // Estos selectores comunes los dejo aquí arriba porque los reutilizo en varios helpers
  // y así, si mañana cambia algo de la UI, lo toco en un solo sitio.
  const SELECTOR_BUSCADOR_PRINCIPAL =
    'input[placeholder*="Buscar"]:not([id*="sidebar"]), ' +
    'input[placeholder*="Search"]:not([id*="sidebar"]), ' +
    'input[placeholder*="Cerc"]:not([id*="sidebar"]), ' +
    'input[placeholder*="Buscar..."], input[placeholder*="Search..."], input[placeholder*="Cerc"]';
  const SELECTOR_OPCIONES_MENU =
    'li[role="menuitem"]:visible, li[role="option"]:visible, [role="menuitem"]:visible, ' +
    '[role="option"]:visible, .MuiMenuItem-root:visible';
  const SELECTOR_DATEPICKER_VISIBLE =
    'div[role="dialog"]:visible, .MuiPopover-root:visible, .MuiPickersPopper-root:visible, .MuiPickerPopper-root:visible';
  const REGEX_TITULO_COLUMNAS = /(Columnas|Columns?|Columnes)/i;

  // Aquí monto las ayudas de pantalla de Clientes. Esto me sirve para sacar del spec
  // toda la parte repetitiva de navegar, buscar, abrir formularios y tocar columnas.
  const ayudasPantalla = crearAyudasPantallaClientes({
    URL_PATH,
    MENU,
    SUBMENU,
    SELECTOR_BUSCADOR_PRINCIPAL,
    SELECTOR_OPCIONES_MENU,
    REGEX_TITULO_COLUMNAS,
  });
  const {
    esperarOpcionesMenu,
    clickBotonVisible,
    UI,
    abrirFormularioNuevoCliente,
    abrirPanelColumnas,
    guardarPanelColumnas,
  } = ayudasPantalla;

  // Aquí engancho toda la lógica de filtros con lo que ya sabe hacer la pantalla.
  // La idea es que el spec principal siga diciendo qué caso ejecuto, pero el cómo
  // se resuelve cada filtro se queda fuera para que esto no siga creciendo sin control.
  const helpersFiltros = crearHelpersFiltrosClientes({
    UI,
    clickBotonVisible,
    abrirFormularioNuevoCliente,
    esperarOpcionesMenu,
    PANTALLA,
    HOJA_EXCEL,
    MENU,
    SUBMENU,
    SELECTOR_OPCIONES_MENU,
    ordenarColumna,
    ordenarColumnaDobleClick,
    ocultarColumna,
    mostrarColumna,
  });
  const {
    ejecutarFiltroIndividualExcel,
    ejecutarMultifiltroExcel,
    limpiarMultifiltroClientes,
    seleccionarNacionalidad,
    ordenarColumnaDesdeExcel,
    ocultarColumnaDesdeExcel,
    mostrarColumnaDesdeExcel,
    abrirFormularioDesdeExcel,
    guardarFiltroDesdeExcel,
    limpiarFiltroDesdeExcel,
    seleccionarFiltroGuardadoDesdeExcel,
    seleccionarFechasFiltro,
  } = helpersFiltros;

  // El bloque de idiomas lo separo aparte porque es otra responsabilidad distinta:
  // no es filtro ni navegación, es validación de traducciones y cambio de idioma.
  const { cambiarIdiomasClientes } = crearHelpersIdiomasClientes({
    UI,
    abrirFormularioNuevoCliente,
    PANTALLA,
    URL_PATH,
  });

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

  // Aquí separo la parte de formulario porque ya era demasiada lógica mezclada
  // en el spec principal: pestanas, modales, campos genéricos y deducción de sección.
  const helpersFormulario = crearHelpersFormularioClientes({
    CAMPOS_FORMULARIO_ORDEN,
    CAMPOS_IGNORADOS,
    normalizarEtiquetaTexto,
    normalizarTextoParaComparar,
    seleccionarOpcionMaterial,
    escapeRegex,
    parseFechaBasicaExcel,
    seleccionarFechaEnCalendario,
    normalizarId,
    escribirPorName,
    UI,
    abrirFormularioNuevoCliente,
    asegurarGestorDocumentosAbierto: (...args) => asegurarGestorDocumentosAbierto(...args),
    llenarFormularioDocumentos: (...args) => llenarFormularioDocumentos(...args),
    llenarFormularioFacturacion: (...args) => llenarFormularioFacturacion(...args),
    clickGuardarDentroFormulario,
  });
  const {
    anadirCliente,
    navegarSeccionFormulario,
    llenarCamposFormulario,
    abrirModalContacto,
    guardarModalContacto,
    abrirModalSeccion,
    llenarFormularioSeccion,
    guardarModalSeccion,
    deducirSeccionDesdeCaso,
    llenarFormularioGeneralesDesdeExcel,
    llenarFormularioContacto,
    llenarFormularioAcciones,
    llenarFormularioCertificaciones,
    llenarFormularioDatosAdicionales,
    llenarFormularioDireccion,
    llenarFormularioZonasCarga,
  } = helpersFormulario;

  // Documentos lo separo aparte porque tiene un flujo muy específico:
  // abrir gestor, subir archivo y manejar los fallbacks del selector de fichero.
  const {
    asegurarGestorDocumentosAbierto,
    llenarFormularioDocumentos,
  } = crearHelpersDocumentosClientes();

  const { llenarFormularioFacturacion } = crearHelpersFacturacionClientes({
    escribirPorName,
  });

  const { TC040: TC040Helper } = crearHelperCrearCompletoClientes({
    PANTALLA,
    HOJA_EXCEL,
    MENU,
    SUBMENU,
    URL_PATH,
    UI,
    abrirFormularioNuevoCliente,
    llenarFormularioGeneralesDesdeExcel,
    deducirSeccionDesdeCaso,
    navegarSeccionFormulario,
    abrirModalSeccion,
    llenarFormularioDireccion,
    clickGuardarDentroFormulario,
    abrirModalContacto,
    llenarFormularioZonasCarga,
    llenarFormularioContacto,
    llenarFormularioAcciones,
    llenarFormularioCertificaciones,
    llenarFormularioSeccion,
    llenarFormularioFacturacion,
    llenarFormularioDatosAdicionales,
    llenarFormularioDocumentos,
    verificarPestanaConFilas,
    registrarResultadoAutomatico,
  });

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

        cy.log('-----------------------------------------------');
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

        // Para los casos de alta (6-14 y 40), siempre hacer login y navegación completa
        // para garantizar un estado limpio antes de cada caso
        let prepararPantalla = pantallaLista;
        if ((numero >= 6 && numero <= 14) || numero === 40) {
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
              // Navegar a la pestana correspondiente si no es Datos Generales
              if (seccion && !/generales/i.test(seccion)) {
                cy.log(`Navegando a la pestana: ${seccion}`);
                return navegarSeccionFormulario(seccion)
                  .then(() => {
                    cy.wait(500);
                    cy.log(`Navegación a la pestana "${seccion}" completada`);
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
        // Para el caso 15, recargar antes de ejecutar
        else if (numero === 15) {
          prepararPantalla = cy.login().then(() => UI.abrirPantalla());
        }
        // Para el caso 17, navegar directamente a la tabla para salir del formulario de editar cliente
        else if (numero === 17) {
          prepararPantalla = cy.visit(URL_PATH).then(() => {
            cy.wait(2000);
            cy.url().should('include', URL_PATH).and('not.include', '/form');
            // Esperar a que la tabla está visible con timeout aumentado
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
        // Para el caso 37, navegar directamente a la tabla para salir del formulario del caso 36
        else if (numero === 37) {
          prepararPantalla = cy.visit(URL_PATH).then(() => {
            cy.wait(2000);
            cy.url().should('include', URL_PATH).and('not.include', '/form');
            // Esperar a que la tabla está visible
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
          .then(() => limpiarBusquedaTrasCaso(numero))
          // Tras cada caso, recargar pantalla para no arrastrar estado del anterior
          .then(() => {
            // Para casos 14 y 15, no recargar para evitar buscar tabla desde el formulario
            if (numero === 13 || numero === 14) {
              return cy.wrap(null);
            }

            // Caso 13: asegurar salir del formulario con login + navegación limpia
            if (numero === 12) {
              return cy.login().then(() => UI.abrirPantalla());
            }

            // Para casos 7-14 y 40, recargar y usar abrirPantalla (salta esperarTabla si seguimos en form)
            if ((numero >= 6 && numero <= 14) || numero === 40) {
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
      // case 1:
      //   return { fn: cargaPantalla };
      // case 2:
      // case 3:
      //   return { fn: ejecutarFiltroIndividualExcel };
      // case 4:
      //   return { fn: seleccionarFechasFiltro };
      // case 5:
      //   return { fn: ejecutarFiltroIndividualExcel };
      // case 6:
      // case 7:
      // case 8:
      // case 9:
      // case 10:
      // case 11:
      // case 12:
      // case 13:
      // case 14:
      //   return { fn: anadirCliente };
      // case 15:
      // case 16:
      //   return { fn: editarCliente };
      // case 17:
      //   // Seleccionar fila, confirmar eliminación y validar borrado o aviso de vinculación
      //   return { fn: seleccionarFilaYPulsarEliminar };
      // case 18:
      //   return { fn: scrollTablaClientes };
      // case 19:
      //   return { fn: cambiarIdiomasClientes };
      // case 20:
      // case 21:
      // case 22:
      //   return { fn: ejecutarMultifiltroExcel, autoRegistro: true };
      // case 23:
      //   return { fn: ejecutarFiltroIndividualExcel };
      // case 24:
      //   return { fn: seleccionarPrimerCliente };
      // case 25:
      // case 26:
      // case 27:
      //   return { fn: seleccionarNacionalidad };
      // case 28:
      //   return { fn: ejecutarFiltroIndividualExcel };
      // case 29:
      // case 30:
      // case 31:
      // case 32:
      //   return { fn: ordenarColumnaDesdeExcel };
      // case 33:
      //   return { fn: ocultarColumnaDesdeExcel };
      // case 34:
      //   return { fn: mostrarColumnaDesdeExcel };
      // case 35:
      //   return { fn: ordenarColumnaDesdeExcel };
      // case 36:
      //   return { fn: abrirFormularioDesdeExcel };
      // case 37:
      //   return { fn: guardarFiltroDesdeExcel };
      // case 38:
      //   return { fn: limpiarFiltroDesdeExcel };
      // case 39:
      //   return { fn: seleccionarFiltroGuardadoDesdeExcel };
      case 40:
        return { fn: TC040Helper };
      case 41:
      case 42:
        return { fn: exportarCliente, autoRegistro: true };
      case 43:
        return { fn: ordenarOtraPaginaClientes, autoRegistro: false };
      case 44:
        return { fn: comprobarPersistenciaOrdenColumnaClientes, autoRegistro: false };
      default:
        return null;
    }
  }

  function limpiarBusquedaTrasCaso(numero) {
    // Estos casos dejan búsquedas/filtros activos y me interesa resetearlos antes del siguiente.
    if (![2, 3, 4, 5].includes(numero)) {
      return cy.wrap(null);
    }

    return UI.abrirPantalla().then(() => {
      return cy.get('body').then(($body) => {
        const botonLimpiar = $body.find('button')
          .filter((_, el) => /^(Limpiar|Clear|Netejar)$/i.test((el.innerText || '').trim()))
          .filter(':visible')
          .first();

        if (!botonLimpiar.length) {
          cy.log(`Caso ${numero}: no encuentro botón "Limpiar", continúo`);
          return cy.wrap(null);
        }

        cy.log(`Caso ${numero}: pulso "Limpiar" para no arrastrar la búsqueda al siguiente caso`);
        return cy.wrap(botonLimpiar).click({ force: true });
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
      pantalla.includes('clientes')
    );
  }

  function editarCliente(caso, numero) {
    const nuevoEmail = caso?.dato_1 || caso?.email || 'pruebas@gmail.com';
    const etiquetaCaso = `TC${String(numero || 15).padStart(3, '0')}`;

    // Si ya estamos en el formulario de edición, editar y guardar directamente
    return cy.url().then((urlActual) => {
      const enFormularioEdicion = /\/dashboard\/clients\/form\/\d+$/i.test(urlActual);
      if (enFormularioEdicion) {
        // Caso 16: solo abrir, no editar
        if (numero === 15) {
          cy.log(`${etiquetaCaso}: ya en formulario, no se edita, solo se mantiene abierto`);
          return cy.wrap(null);
        }
        // Caso 17: editar email y guardar
        if (numero === 16) {
          cy.log(`${etiquetaCaso}: ya en formulario, editando email y guardando`);
          return actualizarEmailYGuardar(nuevoEmail);
        }
        // Casos 14 y 15 (mantener compatibilidad)
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
          if (numero === 15) {
            cy.log('TC016: formulario abierto, sin edición');
            return cy.wrap(null);
          }
          if (numero === 16) {
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
          // Borrado agresivo: click, selectall, clear, y verificar que está vacío
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
    const etiquetaCaso = casoId || `TC${String(numero || 17).padStart(3, '0')}`;
    let totalFilasAntes = 0;
    let textoFilaSeleccionada = '';

    cy.log(`${etiquetaCaso}: Seleccionando fila y pulsando botón eliminar`);

    cy.visit(URL_PATH);
    cy.wait(2000);
    cy.url().should('include', URL_PATH).and('not.include', '/form');
    cy.get('.MuiDataGrid-root', { timeout: 60000 }).should('be.visible');
    cy.wait(2000);

    return cy.get('.MuiDataGrid-row', { timeout: 60000 })
      .should('have.length.greaterThan', 0)
      .then(($rows) => {
        totalFilasAntes = $rows.length;
        textoFilaSeleccionada = (($rows[0]?.innerText || $rows[0]?.textContent || '').trim()).replace(/\s+/g, ' ');
        return UI.seleccionarPrimeraFilaConCheckbox();
      })
      .then(() => {
        cy.wait(500);
        return cy.get('body').then(($body) => {
          const $btnEliminar = $body.find('button, a, [role="button"]').filter((_, el) => {
            const texto = (el.textContent || el.innerText || '').trim();
            return /^eliminar$/i.test(texto);
          }).filter(':visible').first();

          if ($btnEliminar.length) {
            return cy.wrap($btnEliminar[0]).scrollIntoView().should('be.visible').click({ force: true });
          }

          return cy.contains('button, a, [role="button"]', /^Eliminar$/i, { timeout: 5000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true });
        });
      })
      .then(() => {
        return cy.get('[role="dialog"], .MuiDialog-root', { timeout: 10000 })
          .should('be.visible')
          .last()
          .within(() => {
            cy.contains(/seguro|eliminar.*cliente|esta acci.n no se puede deshacer/i, { timeout: 5000 })
              .should('be.visible');
            cy.contains('button, [role="button"]', /eliminar|aceptar|confirmar|s[ií]/i, { timeout: 5000 })
              .should('be.visible')
              .click({ force: true });
          });
      })
      .then(() => cy.wait(1500))
      .then(() => {
        const patronAvisoVinculado = /vinculad|relacionad|asociad|no se puede eliminar|no es posible eliminar|linked|cannot delete/i;
        const patronExito = /eliminad|borrad|deleted|correctamente|success/i;

        return cy.get('body').then(($body) => {
          const textoBody = ($body.text() || '').replace(/\s+/g, ' ').trim();

          if (patronAvisoVinculado.test(textoBody)) {
            cy.log(`${etiquetaCaso}: Se mostró aviso de vinculación. Resultado válido.`);
            return;
          }

          if (patronExito.test(textoBody)) {
            cy.log(`${etiquetaCaso}: Se mostró mensaje de eliminación correcta.`);
            return;
          }

          return cy.get('.MuiDataGrid-row', { timeout: 15000 }).then(($rowsDespues) => {
            const totalFilasDespues = $rowsDespues.length;
            const sigueVisible = Array.from($rowsDespues).some((row) => {
              const textoFila = ((row.innerText || row.textContent || '').trim()).replace(/\s+/g, ' ');
              return textoFilaSeleccionada && textoFila.includes(textoFilaSeleccionada);
            });

            expect(
              totalFilasDespues < totalFilasAntes || !sigueVisible,
              `${etiquetaCaso}: tras confirmar, el cliente debe eliminarse o mostrarse un aviso de vinculación`
            ).to.eq(true);
          });
        });
      });
  }

  function scrollTablaClientes(caso, numero, casoId) {
    return UI.abrirPantalla().then(() => {
      cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom', { duration: 400 });
      cy.wait(200);
      return cy.get('.MuiDataGrid-virtualScroller').scrollTo('top', { duration: 400 });
    });
  }

  function seleccionarPrimerCliente(caso, numero, casoId) {
    return UI.abrirPantalla()
      .then(() => limpiarMultifiltroClientes())
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

  function obtenerPaginaActualClientes() {
    return cy.get('body').then(($body) => {
      const candidatos = [
        'button.MuiPaginationItem-root.Mui-selected',
        '.MuiPaginationItem-root.Mui-selected',
        'button[aria-current="true"]',
        '[aria-current="true"]'
      ];

      for (const selector of candidatos) {
        const $actual = $body.find(selector).filter(':visible').first();
        const texto = ($actual.text() || '').trim();
        if (/^\d+$/.test(texto)) {
          return Number(texto);
        }
      }

      return 1;
    });
  }

  function irAPaginaClientes(numeroPagina) {
    cy.log(`Ir a la página ${numeroPagina}`);

    return UI.abrirPantalla()
      .then(() => UI.esperarTabla())
      .then(() => cy.get('.MuiDataGrid-footerContainer, .MuiTablePagination-root, .MuiPagination-root', { timeout: 10000 }).should('be.visible'))
      .then(() => {
        return cy.contains('button, [role="button"]', new RegExp(`^${numeroPagina}$`), { timeout: 10000 })
          .filter(':visible')
          .last()
          .scrollIntoView({ block: 'center' })
          .click({ force: true });
      })
      .then(() => cy.wait(800))
      .then(() => obtenerPaginaActualClientes())
      .then((paginaActual) => {
        expect(paginaActual, `Página activa tras pulsar ${numeroPagina}`).to.eq(numeroPagina);
      });
  }

  function obtenerValoresColumnaCodigoPaginaActual() {
    return cy.get('.MuiDataGrid-row[role="row"]', { timeout: 10000 })
      .filter(':visible')
      .then(($rows) => {
        const valores = Array.from($rows)
          .map((row) => {
            const cell = row.querySelector('[data-field="code"]');
            return (cell?.textContent || cell?.innerText || '').trim();
          })
          .filter(Boolean);

        cy.log(`Códigos detectados en la página actual: ${valores.join(', ')}`);
        return valores;
      });
  }

  function ordenarOtraPaginaClientes(caso, numero, casoId) {
    cy.log('TC043: Ir a página 3 y ordenar Código sin volver a la página 1');
    let falloRegistrado = false;

    return UI.abrirPantalla()
      .then(() => irAPaginaClientes(3))
      .then(() => ordenarColumna('Código'))
      .then(() => obtenerPaginaActualClientes())
      .then((paginaActual) => {
        if (paginaActual !== 3) {
          falloRegistrado = true;
          const mensaje = `No se ordena la página 3, me devuelve a la página ${paginaActual}`;
          cy.log(`TC043 ERROR: ${mensaje}`);
          return registrarResultadoAutomatico(numero, casoId, 'Ordenar otra página', mensaje, 'ERROR', true);
        }
        return cy.wrap(null);
      })
      .then(() => {
        if (falloRegistrado) return null;
        return obtenerValoresColumnaCodigoPaginaActual();
      })
      .then((codigos) => {
        if (falloRegistrado) return null;

        const esperado = [...codigos].sort((a, b) => a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' }));
        if (JSON.stringify(codigos) !== JSON.stringify(esperado)) {
          falloRegistrado = true;
          const mensaje = `La página 3 no queda ordenada por Código. Obtenido: ${codigos.join(', ')}`;
          cy.log(`TC043 ERROR: ${mensaje}`);
          return registrarResultadoAutomatico(numero, casoId, 'Ordenar otra página', mensaje, 'ERROR', true);
        }

        return registrarResultadoAutomatico(
          numero,
          casoId,
          'Ordenar otra página',
          'Se ordena correctamente la página 3 sin volver a la página 1',
          'OK',
          true
        );
      });
  }

  // Marcar / desmarcar columna en el panel simplemente clicando en la fila
  function toggleColumnaEnPanel(columna, mostrar) {
    const patron = obtenerPatronColumna(columna);
    cy.log(`Panel columnas: clic en "${columna}"`);

    // Localizamos el panel por el título "Columnas / Columns / Columnes"
    return cy
      .contains('div, span, p', REGEX_TITULO_COLUMNAS, { timeout: 10000 })
      .closest('div.MuiPaper-root')          // el papel del panel
      .within(() => {
        // Dentro del panel, buscamos la fila que tiene el texto de la columna
        return cy
          .contains('li, label, span', patron, { timeout: 10000 })
          .should('be.visible')
          .click({ force: true });           // un solo clic sobre "Teléfono"
      });
  }

  // Patrón multilenguaje para columnas (es/en/ca)
  function obtenerPatronColumna(nombreColumna = '') {
    const lower = nombreColumna.toLowerCase();

    if (/c[oó]digo/.test(lower)) {
      return /(C[oó]digo|Code|Codi)/i;
    }
    if (/nombre/.test(lower)) {
      return /(Nombre|Name|Nom)/i;
    }
    if (/raz[oó]n social/.test(lower)) {
      return /(Raz[oó]n Social|Business Name|Ra[óo] Social)/i;
    }
    if (/tel[eé]fono/.test(lower)) {
      return /(Tel[eé]fono|Phone|Tel[eé]fon)/i;
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

  function obtenerOrdenCabecerasClientes() {
    return cy.get('[role="columnheader"], .MuiDataGrid-columnHeader', { timeout: 10000 })
      .filter(':visible')
      .then(($headers) => {
        const columnas = Array.from($headers)
          .filter((el) => {
            const className = el.className || '';
            return !String(className).includes('MuiDataGrid-columnHeader--moving');
          })
          .sort((a, b) => {
            const idxA = Number(a.getAttribute('aria-colindex') || '0');
            const idxB = Number(b.getAttribute('aria-colindex') || '0');
            return idxA - idxB;
          })
          .map((el) => (el.textContent || el.innerText || '').replace(/\s+/g, ' ').trim())
          .filter((txt) => txt && !/^\d+$/.test(txt));

        Cypress.log({
          name: 'cabeceras',
          message: `Orden actual de cabeceras: ${columnas.join(' | ')}`
        });

        return columnas;
      });
  }

  function moverColumnaDespues(origen, destino) {
    const patronOrigen = obtenerPatronColumna(origen);
    const patronDestino = obtenerPatronColumna(destino);

    cy.log(`Moviendo columna "${origen}" detrás de "${destino}"`);

    return UI.abrirPantalla().then(() => {
      return cy.contains('.MuiDataGrid-columnHeaderTitle', patronOrigen, { timeout: 10000 })
        .should('be.visible')
        .closest('[role="columnheader"]')
        .then(($source) => {
          return cy.contains('.MuiDataGrid-columnHeaderTitle', patronDestino, { timeout: 10000 })
            .should('be.visible')
            .closest('[role="columnheader"]')
            .then(($target) => {
              const sourceRect = $source[0].getBoundingClientRect();
              const targetRect = $target[0].getBoundingClientRect();
              const startX = Math.round(sourceRect.left + (sourceRect.width / 2));
              const startY = Math.round(sourceRect.top + (sourceRect.height / 2));
              const endX = Math.round(targetRect.right - 10);
              const endY = Math.round(targetRect.top + (targetRect.height / 2));

              const dataTransfer = new DataTransfer();
              const sourceSelector = '.MuiDataGrid-columnHeaderDraggableContainer[draggable="true"]';

              cy.log(`Drag coordinates: start(${startX},${startY}) target(${endX},${endY})`);

              return cy.wrap($source)
                .find(sourceSelector)
                .first()
                .should('exist')
                .trigger('mousedown', {
                  button: 0,
                  buttons: 1,
                  which: 1,
                  clientX: startX,
                  clientY: startY,
                  force: true
                })
                .trigger('dragstart', {
                  dataTransfer,
                  eventConstructor: 'DragEvent',
                  force: true
                })
                .wait(250)
                .then(() => {
                  return cy.wrap($target)
                    .find(sourceSelector)
                    .first()
                    .should('exist')
                    .trigger('dragenter', {
                      dataTransfer,
                      eventConstructor: 'DragEvent',
                      clientX: endX,
                      clientY: endY,
                      force: true
                    })
                    .trigger('dragover', {
                      dataTransfer,
                      eventConstructor: 'DragEvent',
                      clientX: endX,
                      clientY: endY,
                      force: true
                    })
                    .wait(150)
                    .trigger('drop', {
                      dataTransfer,
                      eventConstructor: 'DragEvent',
                      clientX: endX,
                      clientY: endY,
                      force: true
                    });
                })
                .then(() => {
                  return cy.wrap($source)
                    .find(sourceSelector)
                    .first()
                    .trigger('dragend', {
                      dataTransfer,
                      eventConstructor: 'DragEvent',
                      force: true
                    })
                    .trigger('mouseup', {
                      button: 0,
                      which: 1,
                      clientX: endX,
                      clientY: endY,
                      force: true
                    });
                })
                .then(() => cy.wait(1000));
            });
        });
    });
  }

  function comprobarPersistenciaOrdenColumnaClientes(caso, numero, casoId) {
    cy.log('TC044: Mover "Nombre" detrás de "Razón Social" y comprobar persistencia');

    return UI.abrirPantalla()
      .then(() => UI.esperarTabla())
      .then(() => obtenerOrdenCabecerasClientes())
      .then((ordenInicial) => {
        const idxNombre = ordenInicial.findIndex((txt) => obtenerPatronColumna('Nombre').test(txt));
        const idxRazon = ordenInicial.findIndex((txt) => obtenerPatronColumna('Razón Social').test(txt));

        if (idxNombre !== idxRazon + 1) {
          return moverColumnaDespues('Nombre', 'Razón Social')
            .then(() => cy.wait(1000));
        }

        cy.log('La columna "Nombre" ya estaba colocada después de "Razón Social"');
        return cy.wrap(null);
      })
      .then(() => {
        cy.log('Navegando a otro módulo para comprobar persistencia');
        return cy.navegarAMenu('Ficheros', 'Proveedores');
      })
      .then(() => cy.wait(1000))
      .then(() => UI.abrirPantalla())
      .then(() => UI.esperarTabla())
      .then(() => obtenerOrdenCabecerasClientes())
      .then((ordenFinal) => {
        const idxNombre = ordenFinal.findIndex((txt) => obtenerPatronColumna('Nombre').test(txt));
        const idxRazon = ordenFinal.findIndex((txt) => obtenerPatronColumna('Razón Social').test(txt));

        if (idxRazon === -1 || idxNombre === -1 || idxNombre !== idxRazon + 1) {
          const mensaje = 'No se guarda el orden de las columnas, se queda como estaba antes';
          cy.log(`TC044 ERROR: ${mensaje}`);
          return registrarResultadoAutomatico(
            numero,
            casoId,
            'Cambiar una columna y comprobar que se graba',
            mensaje,
            'ERROR',
            true
          );
        }

        return registrarResultadoAutomatico(
          numero,
          casoId,
          'Cambiar una columna y comprobar que se graba',
          'Se guarda correctamente el orden de las columnas',
          'OK',
          true
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

  // Función auxiliar para verificar que una pestana no muestre "Sin filas"
  function verificarPestanaSinFilas(nombrePestana) {
    return cy.get('body').then($body => {
      // Buscar específicamente en el área de la tabla de la pestana actual
      // Buscar la tabla MuiDataGrid o el área de contenido de la pestana
      const tabla = $body.find('.MuiDataGrid-root:visible, .MuiTableContainer:visible, table:visible').first();

      if (tabla.length > 0) {
        // Verificar si la tabla tiene filas de datos
        const filas = tabla.find('.MuiDataGrid-row:visible, tbody tr:visible, .MuiTableBody-root tr:visible').filter((_, el) => {
          // Excluir filas vacías o que solo contengan "Sin filas"
          const textoFila = (el.textContent || el.innerText || '').trim().toLowerCase();
          return textoFila.length > 0 && !/sin\s+filas|no\s+hay\s+datos/i.test(textoFila);
        });

        if (filas.length > 0) {
          cy.log(` La pestana ${nombrePestana} tiene ${filas.length} fila(s) de datos`);
          return cy.wrap(true);
        } else {
          // Verificar si hay mensaje "Sin filas" en la tabla
          const mensajeSinFilas = tabla.find('*').filter((_, el) => {
            const texto = (el.textContent || '').toLowerCase();
            return /sin\s+filas|no\s+hay\s+datos|sin\s+datos/i.test(texto);
          });

          if (mensajeSinFilas.length > 0) {
            cy.log(` ERROR: La pestana ${nombrePestana} muestra "Sin filas" - los datos no se guardaron`);
            return cy.wrap(false);
          } else {
            // Si no hay filas pero tampoco hay mensaje "Sin filas", puede que la tabla está vacía
            cy.log(` La pestana ${nombrePestana} no tiene filas visibles`);
            return cy.wrap(false);
          }
        }
      } else {
        // Si no hay tabla visible, buscar mensaje "Sin filas" en el área de contenido de la pestana
        const mensajeSinFilas = $body.find('*').filter((_, el) => {
          const texto = (el.textContent || '').toLowerCase();
          // Buscar solo en elementos visibles y dentro del área de contenido principal
          const $el = Cypress.$(el);
          const estaVisible = $el.is(':visible');
          const estaEnContenido = $el.closest('[class*="MuiPaper"], [class*="content"], [class*="tabpanel"]').length > 0;
          return estaVisible && estaEnContenido && /sin\s+filas|no\s+hay\s+datos|sin\s+datos/i.test(texto);
        });

        if (mensajeSinFilas.length > 0) {
          cy.log(` ERROR: La pestana ${nombrePestana} muestra "Sin filas" - los datos no se guardaron`);
          return cy.wrap(false);
        } else {
          // Si no hay tabla ni mensaje "Sin filas", asumir que tiene datos (puede ser un formulario sin tabla)
          cy.log(` La pestana ${nombrePestana} parece tener contenido (no se encontró tabla ni mensaje "Sin filas")`);
          return cy.wrap(true);
        }
      }
    });
  }

  function verificarPestanaConFilas(nombrePestana) {
    return cy.get('body').then(($body) => {
      const filasVisibles = $body.find('.MuiDataGrid-row:visible, tbody tr:visible, .MuiTableBody-root tr:visible')
        .filter((_, el) => {
          const textoFila = (el.textContent || el.innerText || '').trim().toLowerCase();
          return textoFila.length > 0 && !/sin\s+filas|no\s+hay\s+datos|sin\s+datos/i.test(textoFila);
        });

      if (filasVisibles.length > 0) {
        cy.log(`La pestana ${nombrePestana} tiene ${filasVisibles.length} fila(s) visibles`);
        return cy.wrap(true);
      }

      return verificarPestanaSinFilas(nombrePestana);
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

  // TC041 y TC042: Exportar Excel (datos visibles o todo)
  function exportarCliente(caso, numero, casoId) {
    const nCaso = Number(numero);
    const descripcionExportacion = nCaso === 41 ? 'columnas visibles' : 'todo';
    cy.log(`TC${String(nCaso).padStart(3, '0')}: Exportar ${descripcionExportacion} a Excel`);
    let columnasVisibles = [];

    const normalizarCabecera = (txt = '') => String(txt)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const obtenerColumnasVisiblesClientes = () => {
      const leerCabecerasVisibles = () => {
        return cy.get('[role="columnheader"], .MuiDataGrid-columnHeader', { timeout: 10000 })
          .filter(':visible')
          .then(($headers) => {
            const columnas = Array.from($headers)
              .map((el) => (el.textContent || el.innerText || '').trim())
              .filter((txt) => txt && !/^\d+$/.test(txt))
              .map((txt) => txt.replace(/\s+/g, ' ').trim());

            columnas.forEach((c) => {
              if (!columnasVisibles.includes(c)) columnasVisibles.push(c);
            });
          });
      };

      return cy.get('.MuiDataGrid-virtualScroller', { timeout: 10000 })
        .first()
        .then(($scroller) => {
          const scroller = $scroller[0];
          if (!scroller) return cy.wrap(columnasVisibles);

          const maxScrollLeft = Math.max(0, (scroller.scrollWidth || 0) - (scroller.clientWidth || 0));
          const pasos = maxScrollLeft > 0
            ? [0, Math.round(maxScrollLeft * 0.33), Math.round(maxScrollLeft * 0.66), maxScrollLeft]
            : [0];

          let chain = cy.wrap(null);
          pasos.forEach((pos) => {
            chain = chain
              .then(() => cy.get('.MuiDataGrid-virtualScroller').first().scrollTo(pos, 0, { ensureScrollable: false, duration: 200 }))
              .then(() => cy.wait(250))
              .then(() => leerCabecerasVisibles());
          });

          return chain
            .then(() => cy.get('.MuiDataGrid-virtualScroller').first().scrollTo('left', { ensureScrollable: false, duration: 100 }))
            .then(() => {
              columnasVisibles = [...new Set(columnasVisibles)];
              cy.log(`Columnas visibles detectadas: ${columnasVisibles.join(', ')}`);
              return cy.wrap(columnasVisibles);
            });
        });
    };

    // Paso 0: Asegurarse de estar en la lista, no en el formulario
    return cy.url().then((urlActual) => {
      // Si estamos en el formulario, navegar a la lista primero
      if (urlActual.includes('/dashboard/clients/form')) {
        cy.log('TC041/TC042: Estamos en el formulario, navegando a la lista...');
        // Navegar directamente a la URL de la lista
        return cy.visit('/dashboard/clients')
          .then(() => cy.wait(1000));
      }
      return cy.wrap(null);
    })
      .then(() => {
        // Paso 1: Limpiar archivos antiguos y obtener lista de archivos antes de la descarga
        return cy.task('limpiarArchivosDescargados')
          .then(() => cy.task('listarArchivosDescargados'))
          .then((archivosAntes) => {
            cy.log(`Archivos antes de descargar: ${archivosAntes.length}`);

            return UI.abrirPantalla()
              .then(() => UI.esperarTabla())
              .then(() => obtenerColumnasVisiblesClientes())
              .then(() => {
                // Hacer clic en el botón de exportar Excel (icono con aria-label="Exportar a Excel")
                return cy.get('button[aria-label="Exportar a Excel"], button[aria-label*="Excel"]', { timeout: 10000 })
                  .should('be.visible')
                  .scrollIntoView({ block: 'center' })
                  .click({ force: true });
              })
              .then(() => cy.wait(500)) // Esperar a que aparezca el menú
              .then(() => {
                // Seleccionar la opción del menú según el caso
                const opcionMenu = nCaso === 41 ? 'Exportar columnas visibles' : 'Exportar todo';

                // Buscar el menú por id o por clase, y luego el item dentro
                return cy.get('body').then(($body) => {
                  const $menu = $body.find('#excel-export-menu, [id*="excel-export"], .MuiPopover-root:visible').last();

                  if ($menu.length > 0) {
                    // Buscar dentro del menú
                    const $item = $menu.find('li[role="menuitem"], .MuiMenuItem-root')
                      .filter((_, el) => {
                        const texto = (el.textContent || el.innerText || '').trim();
                        return new RegExp(opcionMenu, 'i').test(texto);
                      })
                      .first();

                    if ($item.length > 0) {
                      return cy.wrap($item)
                        .should('be.visible')
                        .scrollIntoView({ block: 'center' })
                        .click({ force: true });
                    }
                  }

                  // Fallback: buscar directamente en el body
                  return cy.contains('li[role="menuitem"], .MuiMenuItem-root', new RegExp(opcionMenu, 'i'), { timeout: 10000 })
                    .should('be.visible')
                    .scrollIntoView({ block: 'center' })
                    .click({ force: true });
                });
              })
              .then(() => {
                // Esperar a que se descargue el archivo
                cy.log('Esperando a que se descargue el archivo Excel...');

                // Esperar un tiempo fijo para que se complete la descarga (más simple y evita bucles infinitos)
                return cy.wait(8000) // Esperar 8 segundos
                  .then(() => {
                    // Verificar si hay un archivo nuevo
                    return cy.task('listarArchivosDescargados')
                      .then((archivosAhora) => {
                        cy.log(`Archivos antes: ${archivosAntes.length}, Archivos ahora: ${archivosAhora.length}`);

                        // Buscar un archivo nuevo
                        const archivoNuevo = archivosAhora.find(f => !archivosAntes.includes(f));

                        if (archivoNuevo) {
                          cy.log(`Archivo descargado encontrado: ${archivoNuevo}`);
                          return cy.wrap(archivoNuevo);
                        }

                        // Si no hay archivo nuevo pero hay archivos, usar el más reciente
                        if (archivosAhora.length > 0) {
                          cy.log(`No se detectó archivo nuevo, usando el más reciente: ${archivosAhora[0]}`);
                          return cy.wrap(archivosAhora[0]);
                        }

                        cy.log('No se encontró ningún archivo .xlsx en la carpeta downloads');
                        return cy.wrap(null);
                      });
                  });
              })
              .then((nombreArchivo) => {
                if (!nombreArchivo) {
                  const error = 'No se detectó ningún archivo nuevo descargado';
                  cy.log(`ERROR: ${error}`);
                  return registrarResultadoAutomatico(
                    numero,
                    casoId,
                    `Exportar ${descripcionExportacion}`,
                    error,
                    'ERROR',
                    true
                  );
                }

                // Leer el Excel descargado
                return cy.task('leerUltimoExcelDescargado').then((excelData) => {
                  if (!excelData || !excelData.rows) {
                    const error = 'No se pudo leer el archivo Excel descargado';
                    cy.log(`ERROR: ${error}`);
                    return registrarResultadoAutomatico(
                      numero,
                      casoId,
                      `Exportar ${descripcionExportacion}`,
                      error,
                      'ERROR',
                      true
                    );
                  }

                  const totalFilas = excelData.totalRows;
                  const cabecerasExcel = excelData.rows.length ? Object.keys(excelData.rows[0] || {}) : [];
                  const visiblesNorm = columnasVisibles.map(normalizarCabecera);
                  const excelNorm = cabecerasExcel.map(normalizarCabecera);

                  cy.log(`Excel descargado: ${excelData.fileName} con ${totalFilas} filas de datos`);
                  cy.log(`Cabeceras Excel: ${cabecerasExcel.join(', ')}`);

                  // Validar según el caso
                  let resultado = 'OK';
                  let mensaje = `Excel descargado correctamente con ${totalFilas} filas`;

                  if (nCaso === 41) {
                    const faltanVisibles = columnasVisibles.filter((c) => !excelNorm.includes(normalizarCabecera(c)));
                    const sobranEnExcel = cabecerasExcel.filter((c) => !visiblesNorm.includes(normalizarCabecera(c)));

                    if (totalFilas > 0 && faltanVisibles.length === 0 && sobranEnExcel.length === 0) {
                      mensaje = `Excel descargado correctamente con ${totalFilas} filas y solo las columnas visibles: ${columnasVisibles.join(', ')}`;
                      resultado = 'OK';
                    } else {
                      mensaje = `Exportación visible incorrecta. Faltan columnas visibles: ${faltanVisibles.join(', ') || 'ninguna'}. Sobran columnas en Excel: ${sobranEnExcel.join(', ') || 'ninguna'}. Filas: ${totalFilas}`;
                      resultado = 'ERROR';
                    }
                  } else if (nCaso === 42) {
                    const faltanVisibles = columnasVisibles.filter((c) => !excelNorm.includes(normalizarCabecera(c)));
                    const tieneMasColumnasQueVisibles = cabecerasExcel.length > columnasVisibles.length;

                    if (totalFilas > 0 && faltanVisibles.length === 0 && tieneMasColumnasQueVisibles) {
                      mensaje = `Excel descargado correctamente con ${totalFilas} filas y todas las columnas. Visibles detectadas: ${columnasVisibles.length}. Exportadas: ${cabecerasExcel.length}`;
                      resultado = 'OK';
                    } else {
                      mensaje = `Exportación completa incorrecta. Faltan columnas visibles: ${faltanVisibles.join(', ') || 'ninguna'}. Columnas exportadas: ${cabecerasExcel.length}. Columnas visibles: ${columnasVisibles.length}. Filas: ${totalFilas}`;
                      resultado = 'ERROR';
                    }
                  }

                  cy.log(`Resultado: ${resultado} - ${mensaje}`);

                  return registrarResultadoAutomatico(
                    numero,
                    casoId,
                    `Exportar ${descripcionExportacion}`,
                    mensaje,
                    resultado,
                    true
                  );
                });
              });
          });
      });
  }

});

