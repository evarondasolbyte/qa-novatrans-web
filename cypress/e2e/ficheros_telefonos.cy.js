// ficheros_telefonos.cy.js
describe('FICHEROS - TELÉFONOS - Validación completa con errores y reporte a Excel', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';

  after(() => {
        cy.log('Procesando resultados finales para Ficheros (Teléfonos)');
    cy.procesarResultadosPantalla('Ficheros (Teléfonos)');
  });

    it('Ejecutar todos los casos de prueba desde Excel', () => {
        cy.obtenerDatosExcel('FICHEROS-TELEFONOS').then((casos) => {
            const casosTelefonos = casos.filter(caso =>
                (caso.pantalla || '').toLowerCase().includes('teléfonos') ||
                (caso.pantalla || '').toLowerCase().includes('telefonos')
            );

            cy.log(`Se encontraron ${casos.length} casos en la hoja`);
            cy.log(`Casos filtrados para Teléfonos: ${casosTelefonos.length}`);

            casosTelefonos.forEach((caso, index) => {
                const numero = parseInt(caso.caso.replace('TC', ''), 10);
                const nombre = caso.nombre || `Caso ${caso.caso}`;
                const prioridad = caso.prioridad || 'MEDIA';

                cy.log(`────────────────────────────────────────────────────────`);
                cy.log(`▶️ Ejecutando caso ${index + 1}/${casosTelefonos.length}: ${caso.caso} - ${nombre} [${prioridad}]`);

      cy.resetearFlagsTest();
      cy.login();
                cy.wait(400);

                let funcion;
                // Mapeo dinámico basado en los casos disponibles en Excel (TC001-TC038)
                if (numero === 1) funcion = cargarPantallaTelefonos;
                else if (numero >= 2 && numero <= 9) funcion = () => ordenarPorColumna(numero);
                else if (numero >= 10 && numero <= 14) funcion = () => cy.ejecutarFiltroIndividual(numero, 'Ficheros (Teléfonos)', 'FICHEROS-TELEFONOS', 'Ficheros', 'Teléfonos');
                else if (numero >= 15 && numero <= 18) funcion = () => cy.ejecutarFiltroIndividual(numero, 'Ficheros (Teléfonos)', 'FICHEROS-TELEFONOS', 'Ficheros', 'Teléfonos');
                else if (numero === 19) funcion = limpiarFiltroMostrarTodos;
                else if (numero === 20) funcion = seleccionarFila;
                else if (numero === 21) funcion = editarSinSeleccion;
                else if (numero === 22) funcion = editarConSeleccion;
                else if (numero === 23) funcion = eliminarSinSeleccion;
                else if (numero === 24) funcion = eliminarConSeleccion;
                else if (numero === 25) funcion = abrirFormularioAlta;
                else if (numero === 26) funcion = ocultarColumna;
                else if (numero === 27) funcion = gestionarColumnas;
                else if (numero === 28) funcion = scrollVertical;
                else if (numero === 29) funcion = recargarPagina;
                else if (numero === 30) funcion = guardarFiltro;
                else if (numero === 31) funcion = limpiarFiltro;
                else if (numero === 32) funcion = seleccionarFiltroGuardado;
                else if (numero >= 33 && numero <= 38) funcion = () => cy.ejecutarMultifiltro(numero, 'Ficheros (Teléfonos)', 'FICHEROS-TELEFONOS', 'Ficheros', 'Teléfonos');
                else if (numero === 39) funcion = checkboxSoloActivos;
                else {
                    cy.log(`⚠️ Caso ${numero} no tiene función asignada - saltando`);
                    return cy.wrap(true);
                }

                funcion().then(() => {
          cy.estaRegistrado().then((ya) => {
            if (!ya) {
                            cy.log(`Registrando OK automático para test ${numero}: ${nombre}`);
              cy.registrarResultados({
                numero,
                nombre,
                esperado: 'Comportamiento correcto',
                obtenido: 'Comportamiento correcto',
                resultado: 'OK',
                archivo,
                                pantalla: 'Ficheros (Teléfonos)',
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
            cy.navegarAMenu('Ficheros', 'Teléfonos');
            cy.url().should('include', '/dashboard/telephones');
            return cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        },

        setColumna(nombreColumna) {
            return cy.get('select[name="column"], select#column').should('be.visible').then($select => {
            const options = [...$select[0].options].map(opt => opt.text.trim());
                cy.log(`Opciones columna: ${options.join(', ')}`);
            let columnaEncontrada = null;
            
                switch (nombreColumna) {
                    case 'Número': columnaEncontrada = options.find(o => /Número|Number/i.test(o)); break;
                    case 'Modelo': columnaEncontrada = options.find(o => /Modelo|Model/i.test(o)); break;
                    case 'Poseedor': columnaEncontrada = options.find(o => /Poseedor|Holder/i.test(o)); break;
                    case 'Activo': columnaEncontrada = options.find(o => /Activo|Active/i.test(o)); break;
                    case 'Extensión': columnaEncontrada = options.find(o => /Extensión|Extension/i.test(o)); break;
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
            return cy.get('input[placeholder="Buscar"]:not([id*="sidebar"])')
                .should('exist')
            .clear({ force: true })
                .type(`${texto}{enter}`, { force: true })
                .wait(1000);
        },

        filasVisibles() {
            return cy.get('.MuiDataGrid-row:visible');
        }
    };

    // ====== FUNCIONES DINÁMICAS ======

    function cargarPantallaTelefonos() {
        UI.abrirPantalla();
        cy.get('.MuiDataGrid-root').should('be.visible');
        return UI.filasVisibles().should('have.length.greaterThan', 0);
    }

    function ordenarPorColumna(numeroCaso) {
        UI.abrirPantalla();
        
        let columna = '';
        let orden = '';
        
        switch (numeroCaso) {
            case 2: columna = 'Número'; orden = 'ASC'; break;
            case 3: columna = 'Número'; orden = 'DESC'; break;
            case 4: columna = 'Modelo'; orden = 'ASC'; break;
            case 5: columna = 'Modelo'; orden = 'DESC'; break;
            case 6: columna = 'Poseedor'; orden = 'ASC'; break;
            case 7: columna = 'Poseedor'; orden = 'DESC'; break;
            case 8: columna = 'Extensión'; orden = 'ASC'; break;
            case 9: columna = 'Extensión'; orden = 'DESC'; break;
        }

        cy.contains('.MuiDataGrid-columnHeaderTitle', columna)
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get(`[aria-label="${columna} column menu"]`).click({ force: true });
        cy.get('li').contains(`Sort by ${orden}`).click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    // ====== FUNCIONES ESPECÍFICAS ======

    function limpiarFiltroMostrarTodos() {
        UI.abrirPantalla();
        return UI.setColumna('Todos').then(() => {
            cy.get('input[placeholder="Buscar"]:not([id*="sidebar"])')
                .clear({ force: true })
                .type('{enter}', { force: true });
            return UI.filasVisibles().should('have.length.greaterThan', 0);
        });
    }

    function seleccionarFila() {
        UI.abrirPantalla();
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function editarSinSeleccion() {
        UI.abrirPantalla();
        UI.filasVisibles().should('have.length.greaterThan', 0);
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function editarConSeleccion() {
        UI.abrirPantalla();
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
      cy.wait(300);
        cy.get('button').contains(/Editar/i).click({ force: true });
        return cy.url().should('match', /\/dashboard\/telephones\/form\/\d+$/);
    }

    function eliminarSinSeleccion() {
        UI.abrirPantalla();
        UI.filasVisibles().should('have.length.greaterThan', 0);
        return cy.contains('button', 'Eliminar').should('not.exist');
    }

    function eliminarConSeleccion() {
        UI.abrirPantalla();
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        cy.wait(500);
        cy.get('button').contains(/Eliminar/i).click({ force: true });
        return cy.wait(1000);
    }

    function abrirFormularioAlta() {
        UI.abrirPantalla();
        return cy.get('button[aria-label="Nuevo"], button:contains("Nuevo")').first().click({ force: true });
    }

    function ocultarColumna() {
        UI.abrirPantalla();
        cy.get('div[role="columnheader"][data-field="number"]')
            .find('button[aria-label*="column menu"]')
            .click({ force: true });
        cy.contains('li', /Hide column/i).click({ force: true });
        return cy.wait(1000);
    }

    function gestionarColumnas() {
        UI.abrirPantalla();
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Ocultar columna
        cy.get('div[role="columnheader"][data-field="number"]')
            .find('button[aria-label*="column menu"]')
            .click({ force: true });
        cy.contains('li', /Manage columns|Show columns/i).click({ force: true });

        cy.get('div.MuiDataGrid-panel, .MuiPopover-paper').within(() => {
            cy.contains(/Número/i)
                .parent()
                .find('input[type="checkbox"]')
                .first()
                .uncheck({ force: true });
        });
        cy.get('body').click(0, 0);
        cy.wait(500);

        // Volver a mostrarla
        cy.get('div[role="columnheader"][data-field="number"]')
            .find('button[aria-label*="column menu"]')
            .click({ force: true });
        cy.contains('li', /Manage columns|Show columns/i).click({ force: true });

        cy.get('div.MuiDataGrid-panel, .MuiPopover-paper').within(() => {
            cy.contains(/Número/i)
                .parent()
                .find('input[type="checkbox"]')
                .first()
                .check({ force: true });
        });
        cy.get('body').click(0, 0);
        return cy.wait(500);
    }

    function scrollVertical() {
        UI.abrirPantalla();
        return cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom', { duration: 1000 });
    }

    function recargarPagina() {
        return UI.abrirPantalla()
            .then(() => UI.setColumna('Modelo'))
            .then(() => UI.buscar('modelo'))
            .then(() => {
                cy.reload();
                return cy.get('input[placeholder="Buscar"]').should('have.value', '');
            });
    }

    function guardarFiltro() {
        return UI.abrirPantalla()
            .then(() => UI.setColumna('Modelo'))
            .then(() => UI.buscar('modelo'))
            .then(() => {
                cy.contains('button', /^Guardar$/i).click({ force: true });
                cy.get('input[placeholder*="nombre"], input[placeholder*="Nombre"]')
                    .should('be.visible')
                    .type('filtro modelo');
                cy.contains('button', /^Guardar$/i).click({ force: true });
                return cy.wait(500);
            });
    }

    function limpiarFiltro() {
        return UI.abrirPantalla()
            .then(() => UI.setColumna('Modelo'))
            .then(() => UI.buscar('modelo'))
            .then(() => {
                cy.contains('button', /^Limpiar$/i).click({ force: true });
                return cy.get('input[placeholder="Buscar"]').should('have.value', '');
            });
    }

    function seleccionarFiltroGuardado() {
        return UI.abrirPantalla()
            .then(() => UI.setColumna('Modelo'))
            .then(() => UI.buscar('modelo'))
            .then(() => {
                cy.contains('button', /^Guardar$/i).click({ force: true });
                cy.get('input[placeholder*="nombre"], input[placeholder*="Nombre"]')
                    .should('be.visible')
                    .type('filtro modelo');
                cy.contains('button', /^Guardar$/i).click({ force: true });
                cy.wait(500);

                // Primero limpiar los filtros actuales
                cy.contains('button', /^Limpiar$/i).click({ force: true });
                cy.wait(500);

                // Pulsar en el desplegable "Guardados" y seleccionar el filtro guardado
                cy.contains('button, [role="button"]', /Guardados/i).click({ force: true });
                cy.wait(500);
                // Pulsar en "filtro modelo" que aparece en el desplegable
                cy.contains('li, [role="option"]', /filtro modelo/i).click({ force: true });

                return UI.filasVisibles().should('have.length.greaterThan', 0);
            });
    }

    function checkboxSoloActivos() {
        UI.abrirPantalla();
        
        // Hacer clic en el checkbox "Solo activos"
        cy.get('input[type="checkbox"]').then($checkboxes => {
            const soloActivosCheckbox = $checkboxes.filter((i, el) => {
                const label = el.closest('label') || el.parentElement;
                return label && label.textContent.includes('Solo activos');
            }).first();
            
            if (soloActivosCheckbox.length > 0) {
                cy.wrap(soloActivosCheckbox).click({ force: true });
            } else {
                // Fallback: buscar por label
                cy.contains('label', 'Solo activos').click({ force: true });
            }
        });
        
        cy.wait(1000);
        
        // Verificar si aparecen filas o "No rows"
        cy.get('body').then($body => {
            const filasVisibles = $body.find('.MuiDataGrid-row:visible').length;
            const tieneNoRows = $body.text().includes('No rows');
            
            cy.log(`TC039 - Debug: filasVisibles=${filasVisibles}, tieneNoRows=${tieneNoRows}`);
            
            // PRIORIDAD: Si aparece "No rows", es ERROR porque deberían existir datos
            if (tieneNoRows) {
                cy.log(`TC039: ERROR - Aparece "No rows" cuando deberían existir datos activos`);
                cy.registrarResultados({
                    numero: 39,
                    nombre: 'TC039 - Checkbox Solo activos',
                    esperado: 'Debería mostrar teléfonos activos',
                    obtenido: 'Muestra "No rows" cuando deberían existir datos activos',
                    resultado: 'ERROR',
                    archivo,
                    pantalla: 'Ficheros (Teléfonos)'
                });
            } else if (filasVisibles > 0) {
                // OK: muestra datos
                cy.log(`TC039: Checkbox "Solo activos" muestra ${filasVisibles} resultados - OK`);
          cy.registrarResultados({
                    numero: 39,
                    nombre: 'TC039 - Checkbox Solo activos',
                    esperado: 'Debería mostrar teléfonos activos',
                    obtenido: `Se muestran ${filasVisibles} teléfonos activos`,
            resultado: 'OK',
            archivo,
            pantalla: 'Ficheros (Teléfonos)'
          });
        } else {
                // Caso inesperado
          cy.registrarResultados({
                    numero: 39,
                    nombre: 'TC039 - Checkbox Solo activos',
                    esperado: 'Debería mostrar teléfonos activos',
                    obtenido: 'Estado inesperado: no hay filas visibles ni mensaje "No rows"',
                    resultado: 'ERROR',
            archivo,
            pantalla: 'Ficheros (Teléfonos)'
          });
        }
        });
        
        return cy.wrap(true);
  }
});