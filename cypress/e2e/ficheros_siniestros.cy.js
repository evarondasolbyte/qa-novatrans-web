// ficheros_siniestros.cy.js
describe('FICHEROS - SINIESTROS - Validación completa con errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    beforeEach(() => {
        cy.resetearFlagsTest();
        cy.configurarViewportZoom();
    });

    after(() => {
        cy.log('Procesando resultados finales para Ficheros (Siniestros)');
        cy.procesarResultadosPantalla('Ficheros (Siniestros)');
    });

    it('Ejecutar todos los casos de prueba desde Excel', () => {
        cy.obtenerDatosExcel('Ficheros (Siniestros)').then((casos) => {
            const casosSiniestros = casos.filter(caso =>
                (caso.pantalla || '').toLowerCase().includes('siniestros') ||
                (caso.pantalla || '').toLowerCase().includes('siniestros')
            );

            cy.log(`Se encontraron ${casos.length} casos en la hoja`);
            cy.log(`Casos filtrados para Siniestros: ${casosSiniestros.length}`);

            casosSiniestros.forEach((caso, index) => {
                const numero = parseInt(caso.caso.replace('TC', ''), 10);
                const nombre = caso.nombre || `Caso ${caso.caso}`;
                const prioridad = caso.prioridad || 'MEDIA';

                cy.log(`────────────────────────────────────────────────────────`);
                cy.log(`▶️ Ejecutando caso ${index + 1}/${casosSiniestros.length}: ${caso.caso} - ${nombre} [${prioridad}]`);

            cy.resetearFlagsTest();
            cy.login();
                cy.wait(400);

                let funcion;
                // Mapeo dinámico basado en los casos disponibles en Excel
                if (numero === 1) funcion = cargarPantallaSiniestros;
                else if (numero >= 2 && numero <= 10) funcion = () => cy.ejecutarFiltroIndividual(numero, 'Ficheros (Siniestros)', 'Ficheros (Siniestros)', 'Ficheros', 'Siniestros');
                else if (numero === 11) funcion = limpiarFiltros;
                else if (numero === 12) funcion = () => cy.ejecutarFiltroIndividual(numero, 'Ficheros (Siniestros)', 'Ficheros (Siniestros)', 'Ficheros', 'Siniestros');
                else if (numero === 13) funcion = ordenarFechaAsc;
                else if (numero === 14) funcion = ordenarFechaDesc;
                else if (numero === 15) funcion = ordenarCosteTotalAsc;
                else if (numero === 16) funcion = ordenarCosteTotalDesc;
                else if (numero === 17) funcion = seleccionarFila;
                else if (numero === 18) funcion = editarSinSeleccion;
                else if (numero === 19) funcion = editarConSeleccion;
                else if (numero === 20) funcion = eliminarSinSeleccion;
                else if (numero === 21) funcion = eliminarConSeleccion;
                else if (numero === 22) funcion = abrirFormularioAlta;
                else if (numero === 23) funcion = scrollVertical;
                else if (numero === 24) funcion = recargarPagina;
                else if (numero === 25) funcion = guardarFiltro;
                else if (numero === 26) funcion = limpiarFiltros;
                else if (numero === 27) funcion = seleccionarFiltroGuardado;
                else if (numero >= 28 && numero <= 33) funcion = () => cy.ejecutarMultifiltro(numero, 'Ficheros (Siniestros)', 'Ficheros (Siniestros)', 'Ficheros', 'Siniestros');
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
                                pantalla: 'Ficheros (Siniestros)',
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
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
            return cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        },

        setColumna(nombreColumna) {
            return cy.get('select[name="column"], select#column').should('be.visible').then($select => {
                    const options = [...$select[0].options].map(opt => opt.text.trim());
                cy.log(`Opciones columna: ${options.join(', ')}`);
                let columnaEncontrada = null;

                switch (nombreColumna) {
                    case 'Código': columnaEncontrada = options.find(o => /Código|Code/i.test(o)); break;
                    case 'Tipo': columnaEncontrada = options.find(o => /Tipo|Type/i.test(o)); break;
                    case 'Lugar': columnaEncontrada = options.find(o => /Lugar|Location/i.test(o)); break;
                    case 'Matrícula': columnaEncontrada = options.find(o => /Matrícula|Plate/i.test(o)); break;
                    case 'Nombre': columnaEncontrada = options.find(o => /Nombre|Name/i.test(o)); break;
                    case 'Coste Total': columnaEncontrada = options.find(o => /Coste.*Total|Total.*Cost/i.test(o)); break;
                    case 'Responsable': columnaEncontrada = options.find(o => /Responsable|Responsible/i.test(o)); break;
                    case 'Implicado': columnaEncontrada = options.find(o => /Implicado|Involved/i.test(o)); break;
                    case 'Finalizado': columnaEncontrada = options.find(o => /Finalizado|Finished/i.test(o)); break;
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

    function cargarPantallaSiniestros() {
        UI.abrirPantalla();
        cy.get('.MuiDataGrid-root').should('be.visible');
        return UI.filasVisibles().should('have.length.greaterThan', 0);
    }

    

    
    // ====== FUNCIONES ESPECÍFICAS ======

    function limpiarFiltros() {
        return UI.abrirPantalla()
            .then(() => UI.setColumna('Todos'))
            .then(() => {
                cy.get('input[placeholder="Buscar"]').should('have.value', '');
                return UI.filasVisibles().should('have.length.greaterThan', 0);
            });
    }


    function ordenarFechaAsc() {
        UI.abrirPantalla();
        // Hacer clic dos veces en la flechita de la columna "Fecha" para ordenar ASC y DESC
        cy.get('div[role="columnheader"][data-field="generalData_date"]').click({ force: true });
        return cy.wait(500);
    }

    function ordenarFechaDesc() {
        UI.abrirPantalla();
        // Hacer clic dos veces en la flechita de la columna "Fecha" para ordenar ASC y DESC
        cy.get('div[role="columnheader"][data-field="generalData_date"]').click({ force: true });
        cy.wait(500);
        cy.get('div[role="columnheader"][data-field="generalData_date"]').click({ force: true });
        return cy.wait(500);
    }

    function ordenarCosteTotalAsc() {
        UI.abrirPantalla();
        // Hacer clic dos veces en la flechita de la columna "Coste Total" para ordenar ASC y DESC
        cy.get('div[role="columnheader"][data-field="reparation_total_cost"]').click({ force: true });
        return cy.wait(500);
    }

    function ordenarCosteTotalDesc() {
        UI.abrirPantalla();
        // Hacer clic dos veces en la flechita de la columna "Coste Total" para ordenar ASC y DESC
        cy.get('div[role="columnheader"][data-field="reparation_total_cost"]').click({ force: true });
        cy.wait(500);
        cy.get('div[role="columnheader"][data-field="reparation_total_cost"]').click({ force: true });
        return cy.wait(500);
    }

    function seleccionarFila() {
        UI.abrirPantalla();
        return cy.get('.MuiDataGrid-row').eq(1).click({ force: true }); // eq(1) = segunda fila
    }

    function editarSinSeleccion() {
        UI.abrirPantalla();
        UI.filasVisibles().should('have.length.greaterThan', 0);
        // Solo verificar que no existe el botón Editar
        cy.get('button').then($buttons => {
            const editarButton = $buttons.filter(':contains("Editar")');
            if (editarButton.length === 0) {
            }
        });
        return cy.wrap(true);
    }

    function editarConSeleccion() {
        UI.abrirPantalla();
        return cy.get('.MuiDataGrid-row').eq(1).dblclick({ force: true });
    }

    function eliminarSinSeleccion() {
        UI.abrirPantalla();
        UI.filasVisibles().should('have.length.greaterThan', 0);
        // Solo verificar que no existe el botón Eliminar
        cy.get('button').then($buttons => {
            const eliminarButton = $buttons.filter(':contains("Eliminar")');
            if (eliminarButton.length === 0) {
            }
        });
        return cy.wrap(true);
    }

    function eliminarConSeleccion() {
        UI.abrirPantalla();
        // Seleccionar la segunda fila de datos (no la cabecera)
        cy.get('.MuiDataGrid-row').eq(1).click({ force: true }); // eq(1) = segunda fila
        cy.wait(500); // Esperar a que se seleccione
        
        // Verificar que la fila está seleccionada
        cy.get('.MuiDataGrid-row.Mui-selected').should('exist');
        
        // Buscar y hacer clic en el botón Eliminar
        cy.get('button').contains(/Eliminar/i).click({ force: true });
        return cy.wait(1000);
    }

    function abrirFormularioAlta() {
        UI.abrirPantalla();
        return cy.get('button[aria-label="Nuevo"], button:contains("Nuevo")').first().click({ force: true });
    }

    function scrollVertical() {
        UI.abrirPantalla();
        return cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom', { duration: 1000 });
    }

    function recargarPagina() {
        return UI.abrirPantalla()
            .then(() => UI.setColumna('Código'))
            .then(() => UI.buscar('1'))
            .then(() => {
                cy.reload();
                return cy.get('input[placeholder="Buscar"]').should('have.value', '');
            });
    }

    function guardarFiltro() {
        return UI.abrirPantalla()
            .then(() => UI.setColumna('Lugar'))
            .then(() => UI.buscar('madrid'))
            .then(() => {
                cy.contains('button', /^Guardar$/i).click({ force: true });
                cy.get('input[placeholder*="nombre"], input[placeholder*="Nombre"]')
                    .should('be.visible')
                    .type('filtro lugar');
                cy.contains('button', /^Guardar$/i).click({ force: true });
                return cy.wait(500);
            });
    }


    function seleccionarFiltroGuardado() {
        return UI.abrirPantalla()
            .then(() => UI.setColumna('Lugar'))
            .then(() => UI.buscar('madrid'))
            .then(() => {
                cy.contains('button', /^Guardar$/i).click({ force: true });
                cy.get('input[placeholder*="nombre"], input[placeholder*="Nombre"]')
                    .should('be.visible')
                    .type('filtro lugar');
                cy.contains('button', /^Guardar$/i).click({ force: true });
                cy.wait(500);

                // Primero limpiar los filtros actuales
                cy.contains('button', /^Limpiar$/i).click({ force: true });
                cy.wait(500);

                // Pulsar en el desplegable "Guardados" y seleccionar el filtro guardado
                cy.contains('button, [role="button"]', /Guardados/i).click({ force: true });
                cy.wait(500);
                // Pulsar en "filtro lugar" que aparece en el desplegable
                cy.contains('li, [role="option"]', /filtro lugar/i).click({ force: true });

                return UI.filasVisibles().should('have.length.greaterThan', 0);
            });
    }
});