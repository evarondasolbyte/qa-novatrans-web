// procesos_planificacion.cy.js
describe('PROCESOS - PLANIFICACIÓN - Casos TC001-TC061', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';

  beforeEach(() => {
    cy.resetearFlagsTest();
    cy.configurarViewportZoom();
    // Configurar timeout para mayor estabilidad
    Cypress.config('defaultCommandTimeout', 30000);
    Cypress.config('requestTimeout', 30000);
    Cypress.config('responseTimeout', 30000);
  });

  after(() => {
    cy.log('Procesando resultados finales para Procesos (Planificación)');
    cy.procesarResultadosPantalla('Procesos (Planificación)');
  });

  it('Ejecutar todos los casos de prueba desde Excel', () => {
    cy.obtenerDatosExcel('PROCESOS-PLANIFICACION').then((casos) => {
      const casosPlanificacion = casos.filter(caso => {
        const numero = parseInt(caso.caso.replace('TC', ''), 10);
        return numero >= 1 && numero <= 61 && (
          (caso.pantalla || '').toLowerCase().includes('planificación') ||
          (caso.pantalla || '').toLowerCase().includes('planificacion')
        );
      });

      cy.log(`Se encontraron ${casos.length} casos en la hoja`);
      cy.log(`Casos filtrados para Planificación: ${casosPlanificacion.length}`);

      casosPlanificacion.forEach((caso, index) => {
        const numero = parseInt(caso.caso.replace('TC', ''), 10);
        const nombre = caso.nombre || `Caso ${caso.caso}`;
        const prioridad = caso.prioridad || 'MEDIA';

        cy.log(`────────────────────────────────────────────────────────`);
        cy.log(`▶️ Ejecutando caso ${index + 1}/${casosPlanificacion.length}: ${caso.caso} - ${nombre} [${prioridad}]`);

        cy.resetearFlagsTest();
        cy.login();
        cy.wait(400);

        let funcion;
        // Mapeo dinámico basado en los casos disponibles (TC001-TC061)
        if (numero === 1) funcion = cargarPantallaPlanificacion;
        else if (numero >= 2 && numero <= 16) funcion = () => ejecutarFiltroIndividual(numero);
        else if (numero >= 17 && numero <= 31) funcion = () => ordenarPorColumna(numero);
        else if (numero >= 32 && numero <= 40) funcion = () => ejecutarFiltroIndividual(numero);
        else if (numero === 41) funcion = ocultarColumna;
        else if (numero === 42) funcion = gestionarColumnas;
        else if (numero === 43) funcion = abrirFormularioCreacion;
        else if (numero === 44) funcion = editarConSeleccion;
        else if (numero === 45) funcion = editarSinSeleccion;
        else if (numero === 46) funcion = eliminarConSeleccion;
        else if (numero === 47) funcion = eliminarSinSeleccion;
        else if (numero === 48) funcion = seleccionarFila;
        else if (numero === 49) funcion = scrollTabla;
        else if (numero === 50) funcion = resetFiltrosRecargar;
        else if (numero === 51) funcion = aplicarFechaSalida;
        else if (numero === 52) funcion = aplicarFiltros;
        else if (numero === 53) funcion = guardarFiltro;
        else if (numero === 54) funcion = limpiarFiltro;
        else if (numero === 55) funcion = seleccionarFiltroGuardado;
        else if (numero >= 56 && numero <= 61) funcion = () => ejecutarMultifiltro(numero);
        else {
          cy.log(`⚠️ Caso ${numero} no está en el rango TC001-TC061 - saltando`);
          return cy.wrap(true);
        }

        funcion().then(() => {
          // Caso especial: TC046 se maneja dentro de la función eliminarConSeleccion
          if (numero === 46) {
            cy.log('TC046: Resultado manejado dentro de la función eliminarConSeleccion');
            return cy.wrap(true);
          }
          
          cy.estaRegistrado().then((ya) => {
            if (!ya) {
              // Nombres más descriptivos basados en el tipo de caso
              let nombreDescriptivo = nombre;
              if (numero >= 2 && numero <= 16) {
                const columnas = ['Id', 'Fecha Salida', 'Cliente', 'Ruta', 'Tipo', 'Albarán', 'Cantidad', 'Cantidad Compra', 'Cabeza', 'Kms', 'Domicilio', 'Exp', 'P.Debe', 'Reemb', 'Tarifa'];
                const columna = columnas[numero - 2];
                nombreDescriptivo = `Filtrar por columna "${columna}"`;
              } else if (numero >= 17 && numero <= 31) {
                const columnas = ['Id', 'Fecha Salida', 'Cliente', 'Ruta', 'Tipo', 'Albarán', 'Cantidad', 'Cantidad Compra', 'Cabeza', 'Kms', 'Domicilio', 'Exp', 'P.Debe', 'Reemb', 'Tarifa'];
                const columna = columnas[numero - 17];
                nombreDescriptivo = `Ordenar por columna "${columna}"`;
              } else if (numero >= 56 && numero <= 61) {
                const operadores = ['Contenga', 'Empiece por', 'Distinto', 'Mayor o igual que', 'Menor o igual que', 'Igual'];
                const operador = operadores[numero - 56];
                nombreDescriptivo = `Multifiltro ${operador}`;
              }

              cy.log(`Registrando OK automático para test ${numero}: ${nombreDescriptivo}`);
              cy.registrarResultados({
                numero,
                nombre: `${caso.caso} - ${nombreDescriptivo}`,
                esperado: 'Comportamiento correcto',
                obtenido: 'Comportamiento correcto',
                resultado: 'OK',
                archivo,
                pantalla: 'Procesos (Planificación)',
              });
            }
          });
        });
      });
    });
  });

  // ====== OBJETO UI ======
  const UI = {
    abrirPantalla() {
      cy.navegarAMenu('Procesos', 'Planificación');
      cy.url().should('include', '/dashboard/planification');
      
      // Esperar a que la página cargue completamente
      cy.get('body').should('be.visible');
      cy.wait(1000); // Pausa para estabilizar la carga
      
      // Verificar que el DataGrid esté presente y visible
      cy.get('.MuiDataGrid-root', { timeout: 15000 })
        .should('be.visible')
        .should('not.be.empty');
      
      // Verificar que hay filas de datos
      cy.get('.MuiDataGrid-row', { timeout: 10000 })
        .should('have.length.greaterThan', 0);
      
      return cy.get('.MuiDataGrid-root');
    },

    setColumna(nombreColumna) {
      return cy.get('select[name="column"], select#column').should('be.visible').then($select => {
        const options = [...$select[0].options].map(opt => opt.text.trim());
        cy.log(`Opciones columna: ${options.join(', ')}`);
        let columnaEncontrada = null;
        
        switch (nombreColumna) {
          case 'Id': columnaEncontrada = options.find(o => /Id|ID/i.test(o)); break;
          case 'Fecha Salida': columnaEncontrada = options.find(o => /Fecha Salida|Fecha/i.test(o)); break;
          case 'Cliente': columnaEncontrada = options.find(o => /Cliente|Client/i.test(o)); break;
          case 'Ruta': columnaEncontrada = options.find(o => /Ruta|Route/i.test(o)); break;
          case 'Tipo': columnaEncontrada = options.find(o => /Tipo|Type/i.test(o)); break;
          case 'Albarán': columnaEncontrada = options.find(o => /Albarán|Albaran/i.test(o)); break;
          case 'Cantidad': columnaEncontrada = options.find(o => /Cantidad|Quantity/i.test(o)); break;
          case 'Cantidad Compra': columnaEncontrada = options.find(o => /Cantidad Compra|Purchase/i.test(o)); break;
          case 'Cabeza': columnaEncontrada = options.find(o => /Cabeza|Head/i.test(o)); break;
          case 'Kms': columnaEncontrada = options.find(o => /Kms|Kilometers/i.test(o)); break;
          case 'Domicilio': columnaEncontrada = options.find(o => /Domicilio|Address/i.test(o)); break;
          case 'Exp': columnaEncontrada = options.find(o => /Exp|Experience/i.test(o)); break;
          case 'P.Debe': columnaEncontrada = options.find(o => /P\.Debe|Debt/i.test(o)); break;
          case 'Reemb': columnaEncontrada = options.find(o => /Reemb|Reimburse/i.test(o)); break;
          case 'Tarifa': columnaEncontrada = options.find(o => /Tarifa|Rate/i.test(o)); break;
          case 'Todos': columnaEncontrada = options.find(o => /Todos|All/i.test(o)); break;
          default:
            columnaEncontrada = options.find(opt => 
              opt.toLowerCase().includes(nombreColumna.toLowerCase()) ||
              nombreColumna.toLowerCase().includes(opt.toLowerCase())
            );
        }
        
        if (columnaEncontrada) {
          cy.wrap($select).select(columnaEncontrada);
        } else {
          cy.wrap($select).select(1);
        }
      });
    },

    buscar(texto) {
      return cy.get('input[placeholder="Buscar"]:not([id*="sidebar"])', { timeout: 10000 })
        .should('be.visible')
        .should('not.be.disabled')
        .clear({ force: true })
        .type(`${texto}`, { force: true, delay: 50 })
        .wait(300) // Aumentado para estabilidad
        .type('{enter}', { force: true })
        .wait(500); // Esperar a que se procese la búsqueda
    },

    filasVisibles() {
      return cy.get('.MuiDataGrid-row:visible');
    }
  };

  // ====== FUNCIONES DINÁMICAS ======

  function cargarPantallaPlanificacion() {
    UI.abrirPantalla();
    cy.get('.MuiDataGrid-root').should('be.visible');
    return UI.filasVisibles().should('have.length.greaterThan', 0);
  }

  // Usar la función de commands.js para filtros individuales
  function ejecutarFiltroIndividual(numeroCaso) {
    return cy.ejecutarFiltroIndividual(numeroCaso, 'Procesos (Planificación)', 'PROCESOS-PLANIFICACION', 'Procesos', 'Planificación');
  }

  function ordenarPorColumna(numeroCaso) {
    UI.abrirPantalla();
    
    let columna = '';
    let orden = '';
    
    switch (numeroCaso) {
      case 17: columna = 'Id'; orden = 'ASC'; break;
      case 18: columna = 'Id'; orden = 'DESC'; break;
      case 19: columna = 'Fecha Salida'; orden = 'ASC'; break;
      case 20: columna = 'Fecha Salida'; orden = 'DESC'; break;
      case 21: columna = 'Cliente'; orden = 'ASC'; break;
      case 22: columna = 'Cliente'; orden = 'DESC'; break;
      case 23: columna = 'Ruta'; orden = 'ASC'; break;
      case 24: columna = 'Ruta'; orden = 'DESC'; break;
      case 25: columna = 'Tipo'; orden = 'ASC'; break;
      case 26: columna = 'Tipo'; orden = 'DESC'; break;
      case 27: columna = 'Albarán'; orden = 'ASC'; break;
      case 28: columna = 'Albarán'; orden = 'DESC'; break;
      case 29: columna = 'Cantidad'; orden = 'ASC'; break;
      case 30: columna = 'Cantidad'; orden = 'DESC'; break;
      case 31: columna = 'Cantidad Compra'; orden = 'ASC'; break;
      case 32: columna = 'Cantidad Compra'; orden = 'DESC'; break;
      case 33: columna = 'Cabeza'; orden = 'ASC'; break;
      case 34: columna = 'Cabeza'; orden = 'DESC'; break;
      case 35: columna = 'Kms'; orden = 'ASC'; break;
      case 36: columna = 'Kms'; orden = 'DESC'; break;
      case 37: columna = 'Domicilio'; orden = 'ASC'; break;
      case 38: columna = 'Domicilio'; orden = 'DESC'; break;
      case 39: columna = 'Exp'; orden = 'ASC'; break;
      case 40: columna = 'Exp'; orden = 'DESC'; break;
      case 41: columna = 'P.Debe'; orden = 'ASC'; break;
      case 42: columna = 'P.Debe'; orden = 'DESC'; break;
      case 43: columna = 'Reemb'; orden = 'ASC'; break;
      case 44: columna = 'Reemb'; orden = 'DESC'; break;
      case 45: columna = 'Tarifa'; orden = 'ASC'; break;
      case 46: columna = 'Tarifa'; orden = 'DESC'; break;
    }

    cy.contains('.MuiDataGrid-columnHeaderTitle', columna)
      .parents('[role="columnheader"]')
      .trigger('mouseover');

    cy.get(`[aria-label="${columna} column menu"]`).click({ force: true });
    cy.get('li').contains(`Sort by ${orden}`).click({ force: true });

    return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
  }

  // ====== FUNCIONES ESPECÍFICAS ======

  function ocultarColumna() {
    UI.abrirPantalla();
    cy.get('div[role="columnheader"][data-field="id"]')
      .find('button[aria-label*="column menu"]')
      .click({ force: true });
    cy.contains('li', /Hide column/i).click({ force: true });
    return cy.wait(1000);
  }

  function gestionarColumnas() {
    UI.abrirPantalla();
    cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

    // Ocultar columna
    cy.get('div[role="columnheader"][data-field="id"]')
      .find('button[aria-label*="column menu"]')
      .click({ force: true });
    cy.contains('li', /Manage columns|Show columns/i).click({ force: true });

    cy.get('div.MuiDataGrid-panel, .MuiPopover-paper').within(() => {
      cy.contains(/Id/i)
        .parent()
        .find('input[type="checkbox"]')
        .first()
        .uncheck({ force: true });
    });
    cy.get('body').click(0, 0);
    cy.wait(500);

    // Volver a mostrarla
    cy.get('div[role="columnheader"][data-field="id"]')
      .find('button[aria-label*="column menu"]')
      .click({ force: true });
    cy.contains('li', /Manage columns|Show columns/i).click({ force: true });

    cy.get('div.MuiDataGrid-panel, .MuiPopover-paper').within(() => {
      cy.contains(/Id/i)
        .parent()
        .find('input[type="checkbox"]')
        .first()
        .check({ force: true });
    });
    cy.get('body').click(0, 0);
    return cy.wait(500);
  }

  function abrirFormularioCreacion() {
    UI.abrirPantalla();
    return cy.get('button[aria-label="Nuevo"], button:contains("Crear")').first().click({ force: true });
  }

  function editarConSeleccion() {
    UI.abrirPantalla();
    cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    cy.wait(300);
    cy.get('button').contains(/Editar/i).click({ force: true });
    return cy.url().should('match', /\/dashboard\/planification\/form\/\d+$/);
  }

  function editarSinSeleccion() {
    UI.abrirPantalla();
    UI.filasVisibles().should('have.length.greaterThan', 0);
    return cy.contains('button', 'Editar').should('not.exist');
  }

  function eliminarConSeleccion() {
    UI.abrirPantalla();
    cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    cy.wait(500);
    cy.get('button').contains(/Eliminar/i).click({ force: true });
    
    // Esperar un poco para que aparezca el error
    cy.wait(1000);
    
    // Verificar si aparece el error "Registro no encontrado"
    cy.get('body').then($body => {
      const errorText = $body.text();
      cy.log(`TC046: Texto del body: ${errorText.substring(0, 200)}...`);
      
      if (errorText.includes('Error: Registro no encontrado.') || 
          errorText.includes('Registro no encontrado') ||
          errorText.includes('Eliminar') && errorText.includes('Error:') ||
          errorText.includes('no encontrado')) {
        cy.log('TC046: ERROR - Registro no encontrado al intentar eliminar');
        cy.registrarResultados({
          numero: 46,
          nombre: 'TC046 - Eliminar con fila seleccionada',
          esperado: 'Se elimina correctamente',
          obtenido: 'Error: Registro no encontrado.',
          resultado: 'ERROR',
          archivo,
          pantalla: 'Procesos (Planificación)'
        });
      } else {
        cy.log('TC046: Eliminación exitosa');
        cy.registrarResultados({
          numero: 46,
          nombre: 'TC046 - Eliminar con fila seleccionada',
          esperado: 'Se elimina correctamente',
          obtenido: 'Se elimina correctamente',
          resultado: 'OK',
          archivo,
          pantalla: 'Procesos (Planificación)'
        });
      }
    });
    
    return cy.wait(1000);
  }

  function eliminarSinSeleccion() {
    UI.abrirPantalla();
    UI.filasVisibles().should('have.length.greaterThan', 0);
    return cy.contains('button', 'Eliminar').should('not.exist');
  }

  function seleccionarFila() {
    UI.abrirPantalla();
    return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
  }

  function scrollTabla() {
    UI.abrirPantalla();
    return cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom', { duration: 1000 });
  }

  function resetFiltrosRecargar() {
    return UI.abrirPantalla()
      .then(() => UI.setColumna('Cliente'))
      .then(() => UI.buscar('ayto'))
      .then(() => {
        cy.reload();
        return cy.get('input[placeholder="Buscar"]').should('have.value', '');
      });
  }

  function gestionarColumnas() {
    UI.abrirPantalla();
    cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

    // Ocultar columna
    cy.get('div[role="columnheader"][data-field="id"]')
      .find('button[aria-label*="column menu"]')
      .click({ force: true });
    cy.contains('li', /Manage columns|Show columns/i).click({ force: true });

    cy.get('div.MuiDataGrid-panel, .MuiPopover-paper').within(() => {
      cy.contains(/Id/i)
        .parent()
        .find('input[type="checkbox"]')
        .first()
        .uncheck({ force: true });
    });
    cy.get('body').click(0, 0);
    cy.wait(500);

    // Volver a mostrarla
    cy.get('div[role="columnheader"][data-field="id"]')
      .find('button[aria-label*="column menu"]')
      .click({ force: true });
    cy.contains('li', /Manage columns|Show columns/i).click({ force: true });

    cy.get('div.MuiDataGrid-panel, .MuiPopover-paper').within(() => {
      cy.contains(/Id/i)
        .parent()
        .find('input[type="checkbox"]')
        .first()
        .check({ force: true });
    });
    cy.get('body').click(0, 0);
    return cy.wait(500);
  }

  function abrirFormularioCreacion() {
    UI.abrirPantalla();
    return cy.get('button[aria-label="Nuevo"], button:contains("Crear")').first().click({ force: true });
  }

  function editarConSeleccion() {
    UI.abrirPantalla();
    cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    cy.wait(300);
    cy.get('button').contains(/Editar/i).click({ force: true });
    return cy.url().should('match', /\/dashboard\/planification\/form\/\d+$/);
  }

  function editarSinSeleccion() {
    UI.abrirPantalla();
    UI.filasVisibles().should('have.length.greaterThan', 0);
    return cy.contains('button', 'Editar').should('not.exist');
  }

  function eliminarSinSeleccion() {
    UI.abrirPantalla();
    UI.filasVisibles().should('have.length.greaterThan', 0);
    return cy.contains('button', 'Eliminar').should('not.exist');
  }

  function seleccionarFila() {
    UI.abrirPantalla();
    return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
  }

  function scrollTabla() {
    UI.abrirPantalla();
    return cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom', { duration: 1000 });
  }

  function aplicarFechaSalida(fechaSalida = '2017-11-06', fechaEntrada = '2017-11-10') {
    UI.abrirPantalla();
    cy.contains('button', 'Todos').click({ force: true });
    
    // Navegar hasta noviembre 2017 usando las flechas
    // Desde 2025 hasta 2017 = 8 años = 96 meses
    for (let i = 0; i < 96; i++) {
      cy.get('button[title="Mes anterior"], button[aria-label="Mes anterior"]', { timeout: 5000 })
        .first()
        .click({ force: true });
      cy.wait(50); // Pequeña pausa entre clicks
    }
    
    // Verificar que llegamos a noviembre 2017
    cy.contains('noviembre 2017').should('be.visible');
    
    // Seleccionar el día 6
    cy.get('button').contains('6').click({ force: true });
    
    // Si hay fecha de entrada, navegar a ella
    if (fechaEntrada) {
      const [añoEntrada, mesEntrada, diaEntrada] = fechaEntrada.split('-');
      const mesEntradaNum = parseInt(mesEntrada);
      const diaEntradaNum = parseInt(diaEntrada);
      
      // Si la fecha de entrada es diferente, navegar a ella
      if (mesEntradaNum !== 11 || parseInt(añoEntrada) !== 2017) {
        // Navegar a la fecha de entrada (simplificado)
        cy.get('button[title="Mes anterior"], button[aria-label="Mes anterior"]', { timeout: 5000 })
          .first()
          .click({ force: true });
        cy.wait(100);
      }
      
      // Seleccionar el día de entrada
      cy.get('button').contains(diaEntradaNum.toString()).click({ force: true });
    }
    
    cy.contains('button', 'Aplicar').click({ force: true });
    return cy.wait(200);
  }

  function aplicarFiltros() {
    UI.abrirPantalla();
    cy.contains('button', 'Filtros').click({ force: true });
    
    // Esperar un poco para que aparezca el modal
    cy.wait(1000);
    
    // Buscar directamente el campo Cliente por su label
    cy.contains('label', 'Cliente').parent().find('input').type('campamento');
    
    cy.contains('button', 'Aplicar').click({ force: true });
    return cy.wait(200);
  }

  function guardarFiltro() {
    return UI.abrirPantalla()
      .then(() => UI.setColumna('Id'))
      .then(() => UI.buscar('106'))
      .then(() => cy.contains('button', 'Guardar').click({ force: true }))
      .then(() => cy.get('input[placeholder*="nombre"], input[type="text"]').last().type('filtro id'))
      .then(() => cy.contains('button', 'Guardar').click({ force: true }));
  }

  function limpiarFiltro() {
    return UI.abrirPantalla()
      .then(() => UI.setColumna('Id'))
      .then(() => UI.buscar('107'))
      .then(() => cy.contains('button', 'Limpiar').click({ force: true }));
  }

  function seleccionarFiltroGuardado() {
    return UI.abrirPantalla()
      .then(() => UI.setColumna('Id'))
      .then(() => UI.buscar('108'))
      .then(() => cy.contains('button', 'Guardar').click({ force: true }))
      .then(() => cy.get('input[placeholder*="nombre"], input[type="text"]').last().type('filtro id'))
      .then(() => cy.contains('button', 'Guardar').click({ force: true }))
      .then(() => cy.get('select, [role="combobox"]').click({ force: true }))
      .then(() => cy.contains('option, li', 'filtro id').click({ force: true }));
  }

  function ejecutarMultifiltro(numeroCaso) {
    return cy.ejecutarMultifiltro(numeroCaso, 'Procesos (Planificación)', 'PROCESOS-PLANIFICACION', 'Procesos', 'Planificación');
  }


  function guardarFiltro() {
    return UI.abrirPantalla()
      .then(() => UI.setColumna('Id'))
      .then(() => UI.buscar('106'))
      .then(() => {
        cy.contains('button', /^Guardar$/i).click({ force: true });
        cy.get('input[placeholder*="nombre"], input[placeholder*="Nombre"]')
          .should('be.visible')
          .type('filtro id');
        cy.contains('button', /^Guardar$/i).click({ force: true });
        return cy.wait(100);
      });
  }

  function limpiarFiltro() {
    return UI.abrirPantalla()
      .then(() => UI.setColumna('Id'))
      .then(() => UI.buscar('107'))
      .then(() => {
        cy.contains('button', /^Limpiar$/i).click({ force: true });
        return cy.get('input[placeholder="Buscar"]').should('have.value', '');
      });
  }

  function seleccionarFiltroGuardado() {
    return UI.abrirPantalla()
      .then(() => UI.setColumna('Id'))
      .then(() => UI.buscar('108'))
      .then(() => {
        cy.contains('button', /^Guardar$/i).click({ force: true });
        cy.get('input[placeholder*="nombre"], input[placeholder*="Nombre"]')
          .should('be.visible')
          .type('filtro id');
        cy.contains('button', /^Guardar$/i).click({ force: true });
        cy.wait(100);

        // Primero limpiar los filtros actuales
        cy.contains('button', /^Limpiar$/i).click({ force: true });
        cy.wait(100);

        // Pulsar en el desplegable "Guardados" y seleccionar el filtro guardado
        cy.contains('button, [role="button"]', /Guardados/i).click({ force: true });
        cy.wait(100);
        // Pulsar en "filtro id" que aparece en el desplegable
        cy.contains('li, [role="option"]', /filtro id/i).click({ force: true });

        return UI.filasVisibles().should('have.length.greaterThan', 0);
      });
  }
});
