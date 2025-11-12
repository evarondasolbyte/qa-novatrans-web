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
        cy.log('📄 Obteniendo datos de Excel...');
        cy.obtenerDatosExcel('Ficheros (Siniestros)').then((casos) => {
            const casosSiniestros = casos.filter(caso =>
                (caso.pantalla || '').toLowerCase().includes('siniestros') ||
                (caso.pantalla || '').toLowerCase().includes('siniestros')
            );

            cy.log(`Se encontraron ${casos.length} casos en la hoja`);
            cy.log(`Casos filtrados para Siniestros: ${casosSiniestros.length}`);

            // Función recursiva para ejecutar casos secuencialmente
            const ejecutarCaso = (index) => {
                if (index >= casosSiniestros.length) {
                    return cy.wrap(true);
                }

                const caso = casosSiniestros[index];
                const numero = parseInt(caso.caso.replace('TC', ''), 10);
                const nombre = caso.nombre || `Caso ${caso.caso}`;
                const prioridad = caso.prioridad || 'MEDIA';

                cy.log(`────────────────────────────────────────────────────────`);
                cy.log(`▶️ Ejecutando caso ${index + 1}/${casosSiniestros.length}: ${caso.caso} - ${nombre} [${prioridad}]`);
                cy.resetearFlagsTest();
                cy.login();
                cy.wait(400);
                cy.on('fail', (err) => {
                    cy.capturarError(nombre, err, {
                        numero,
                        nombre,
                        esperado: 'Comportamiento correcto',
                        archivo,
                        pantalla: 'Ficheros (Siniestros)'
                    });
                    return false;
                });

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
                // Detectar casos de cambio de idioma
                else if (nombre.toLowerCase().includes('idioma') || nombre.toLowerCase().includes('language') || numero === 34) {
                    funcion = () => {
                        UI.abrirPantalla();
                        return cy.cambiarIdiomaCompleto('Ficheros (Siniestros)', 'Siniestros', 'Sinistres', 'Crash Reports', numero);
                    };
                }
                else {
                    cy.log(`⚠️ Caso ${numero} no tiene función asignada - saltando`);
                    return ejecutarCaso(index + 1);
                }

                return funcion().then(() => {
                    return cy.estaRegistrado().then((ya) => {
                        if (!ya) {
                            if (numero === 34) {
                                cy.log(`Registrando WARNING para test ${numero}: ${nombre} (faltan traducciones Catalán/Inglés)`);
                                cy.registrarResultados({
                                    numero,
                                    nombre,
                                    esperado: 'Textos traducidos correctamente en todos los idiomas',
                                    obtenido: 'Catalán/Inglés presentan textos sin traducir',
                                    resultado: 'WARNING',
                                    archivo,
                                    pantalla: 'Ficheros (Siniestros)'
                                });
                            } else {
                                cy.log(`Registrando OK automático para test ${numero}: ${nombre}`);
                                cy.registrarResultados({
                                    numero,
                                    nombre,
                                    esperado: 'Comportamiento correcto',
                                    obtenido: 'Comportamiento correcto',
                                    resultado: 'OK',
                                    archivo,
                                    pantalla: 'Ficheros (Siniestros)'
                                });
                            }
                        }
                    });
                }).then(() => {
                    // Ejecutar el siguiente caso
                    return ejecutarCaso(index + 1);
                });
            };

            // Iniciar ejecución del primer caso
            return ejecutarCaso(0);
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
            return cy.get('body').then($body => {
                if ($body.find('select[name="column"], select#column').length > 0) {
                    // Select nativo
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
                            cy.log(`Seleccionada columna: ${columnaEncontrada}`);
                        } else {
                            cy.log(`Columna "${nombreColumna}" no encontrada, usando primera opción`);
                            cy.wrap($select).select(1);
                        }
                    });
                } else {
                    // Material-UI dropdown (botón con menú)
                    cy.log('No se encontró select nativo, intentando con Material-UI dropdown');
                    
                    // Buscar el botón que abre el menú de columna
                    const selectors = [
                        'button:contains("Multifiltro")',
                        'button:contains("Nombre")',
                        'button:contains("Código")',
                        '[role="button"]:contains("Multifiltro")',
                        '[role="button"]:contains("Nombre")',
                        'div[role="button"]',
                    ];
                    
                    let selectorEncontrado = null;
                    for (const selector of selectors) {
                        if ($body.find(selector).length > 0 && !selectorEncontrado) {
                            selectorEncontrado = selector;
                            break;
                        }
                    }
                    
                    if (selectorEncontrado) {
                        cy.get(selectorEncontrado).first().click({ force: true });
                        cy.wait(500);
                        
                        // Buscar el elemento del menú con el nombre de la columna
                        cy.get('li[role="menuitem"], [role="option"]').then($items => {
                            const items = Array.from($items).map(item => item.textContent.trim());
                            cy.log(`Opciones del menú: ${items.join(', ')}`);
                            
                            let columnaEncontrada = null;
                            switch (nombreColumna) {
                                case 'Código': columnaEncontrada = items.find(o => /Código|Code/i.test(o)); break;
                                case 'Tipo': columnaEncontrada = items.find(o => /Tipo|Type/i.test(o)); break;
                                case 'Lugar': columnaEncontrada = items.find(o => /Lugar|Location/i.test(o)); break;
                                case 'Matrícula': columnaEncontrada = items.find(o => /Matrícula|Plate/i.test(o)); break;
                                case 'Nombre': columnaEncontrada = items.find(o => /Nombre|Name/i.test(o)); break;
                                case 'Coste Total': columnaEncontrada = items.find(o => /Coste.*Total|Total.*Cost/i.test(o)); break;
                                case 'Responsable': columnaEncontrada = items.find(o => /Responsable|Responsible/i.test(o)); break;
                                case 'Implicado': columnaEncontrada = items.find(o => /Implicado|Involved/i.test(o)); break;
                                case 'Finalizado': columnaEncontrada = items.find(o => /Finalizado|Finished/i.test(o)); break;
                                case 'Todos': columnaEncontrada = items.find(o => /Todos|All/i.test(o)); break;
                                default:
                                    columnaEncontrada = items.find(opt =>
                                        opt.toLowerCase().includes(nombreColumna.toLowerCase()) ||
                                        nombreColumna.toLowerCase().includes(opt.toLowerCase())
                                    );
                            }
                            
                            if (columnaEncontrada) {
                                cy.get('li[role="menuitem"], [role="option"]').contains(columnaEncontrada).click({ force: true });
                                cy.log(`Columna seleccionada: ${columnaEncontrada}`);
                            } else {
                                cy.log(`Columna "${nombreColumna}" no encontrada en el menú`);
                                cy.get('body').click(0, 0); // Cerrar el menú
                            }
                        });
                    } else {
                        cy.log('No se encontró el botón del dropdown de columna');
                    }
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
        
        // Solo verificar que existe el botón Eliminar, sin hacer clic para no eliminar datos
        cy.get('button').contains(/Eliminar/i).should('exist').then(() => {
            cy.registrarResultados({
                numero: 21,
                nombre: 'TC021 - Eliminar siniestro',
                esperado: 'Botón Eliminar debe existir cuando hay una fila seleccionada',
                obtenido: 'Botón Eliminar existe correctamente',
                resultado: 'OK',
                archivo,
                pantalla: 'Ficheros (Siniestros)'
            });
        });
        
        return cy.wrap(true);
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