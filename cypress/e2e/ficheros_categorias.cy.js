describe('FICHEROS (CATEGORÍAS) - Validación completa con gestión de errores y reporte a Excel', () => {
    let archivo = 'ficheros_categorias.cy.js';
    
    beforeEach(() => {
        cy.resetearFlagsTest();
        cy.configurarViewportZoom();
    });

    after(() => {
        cy.log('Procesando resultados finales para Ficheros (Categorías)');
        cy.procesarResultadosPantalla('Ficheros (Categorías)');
    });

    it('Ejecutar todos los casos de prueba desde Excel', () => {
        cy.obtenerDatosExcel('FICHEROS-CATEGORIAS').then((casos) => {
            const casosCategorias = casos.filter(caso =>
                (caso.pantalla || '').toLowerCase().includes('categorías') ||
                (caso.pantalla || '').toLowerCase().includes('categorias')
            );

            cy.log(`📊 Total de casos encontrados para Categorías: ${casosCategorias.length}`);

            casosCategorias.forEach((caso, index) => {
                const numero = parseInt(caso.n_caso?.replace('TC', '') || caso.numero || index + 1);
                const nombre = caso.nombre || `Caso ${caso.n_caso || numero}`;
                const prioridad = caso.prioridad || 'MEDIA';

                cy.log(`────────────────────────────────────────────────────────`);
                cy.log(`▶️ Ejecutando caso ${index + 1}/${casosCategorias.length}: TC${numero.toString().padStart(3, '0')} - ${nombre} [${prioridad}]`);

            cy.resetearFlagsTest();
            cy.login();
                cy.wait(400);

                let funcion;
                // Mapeo dinámico basado en los casos disponibles en Excel (TC001-TC032)
                if (numero === 1) funcion = cargarPantallaCategorias;
                else if (numero >= 2 && numero <= 4) funcion = () => cy.ejecutarFiltroIndividual(numero, 'Ficheros (Categorías)', 'FICHEROS-CATEGORIAS', 'Ficheros', 'Categorías');
                else if (numero >= 5 && numero <= 9) funcion = () => cy.ejecutarFiltroIndividual(numero, 'Ficheros (Categorías)', 'FICHEROS-CATEGORIAS', 'Ficheros', 'Categorías');
                else if (numero >= 10 && numero <= 11) funcion = () => ordenarPorColumna(numero);
                else if (numero === 12) funcion = seleccionarFila;
                else if (numero === 13) funcion = editarConSeleccion;
                else if (numero === 14) funcion = editarSinSeleccion;
                else if (numero === 15) funcion = eliminarConSeleccion;
                else if (numero === 16) funcion = eliminarSinSeleccion;
                else if (numero === 17) funcion = abrirFormularioAlta;
                else if (numero === 18) funcion = ocultarColumna;
                else if (numero === 19) funcion = gestionarColumnas;
                else if (numero === 20) funcion = scrollVertical;
                else if (numero === 21) funcion = recargarPagina;
                else if (numero >= 22 && numero <= 23) funcion = () => cy.ejecutarFiltroIndividual(numero, 'Ficheros (Categorías)', 'FICHEROS-CATEGORIAS', 'Ficheros', 'Categorías');
                else if (numero === 24) funcion = guardarFiltro;
                else if (numero === 25) funcion = limpiarFiltro;
                else if (numero === 26) funcion = seleccionarFiltroGuardado;
                else if (numero >= 27 && numero <= 32) funcion = () => cy.ejecutarMultifiltro(numero, 'Ficheros (Categorías)', 'FICHEROS-CATEGORIAS', 'Ficheros', 'Categorías');
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
                                pantalla: 'Ficheros (Categorías)',
                        });
                    }
                    });
                });
            });
        });
    });

    // ========== FUNCIONES DE PRUEBA ==========

    const UI = {
        abrirPantalla() {
            cy.configurarViewportZoom();
            cy.navegarAMenu('Ficheros', 'Categorías');
            cy.url().should('include', '/dashboard/categories');
            return cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        },

        setColumna(columna) {
            return cy.get('select[name="column"], select#column').select(columna, { force: true });
        },

        buscar(valor) {
            return cy.get('input[placeholder="Buscar"]:not([id*="sidebar"])')
                .clear({ force: true })
                .type(valor + '{enter}', { force: true });
        },

        filasVisibles() {
            return cy.get('.MuiDataGrid-row:visible');
        }
    };

    function cargarPantallaCategorias() {
        UI.abrirPantalla();
        return UI.filasVisibles().should('have.length.greaterThan', 0);
    }

    function ordenarPorColumna(numeroCaso) {
        UI.abrirPantalla();
        
        if (numeroCaso === 10) {
            // Ordenar por Nombre
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
                .parents('[role="columnheader"]')
                .trigger('mouseover');
            cy.get('[aria-label="Nombre column menu"]').click({ force: true });
            cy.get('li').contains('Sort by ASC').click({ force: true });
            cy.get('[aria-label="Nombre column menu"]').click({ force: true });
            cy.get('li').contains('Sort by DESC').click({ force: true });
        } else if (numeroCaso === 11) {
            // Ordenar por Módulo
            cy.contains('.MuiDataGrid-columnHeaderTitle', 'Módulo')
                .parents('[role="columnheader"]')
                .trigger('mouseover');
            cy.get('[aria-label="Módulo column menu"]').click({ force: true });
            cy.get('li').contains('Sort by ASC').click({ force: true });
            cy.get('[aria-label="Módulo column menu"]').click({ force: true });
            cy.get('li').contains('Sort by DESC').click({ force: true });
        }
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function seleccionarFila() {
        UI.abrirPantalla();
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        return cy.wait(500);
    }

    function editarConSeleccion() {
        UI.abrirPantalla();
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
                        cy.wait(500);
        cy.get('button').contains(/Editar/i).click({ force: true });
        return cy.wait(1000);
    }

    function editarSinSeleccion() {
        UI.abrirPantalla();
        // Verificar que el botón Editar no está disponible sin selección
        cy.get('button').contains(/Editar/i).should('not.exist');
                    return cy.wrap(true);
                }
                
    function eliminarConSeleccion() {
        UI.abrirPantalla();
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        cy.wait(500);
        cy.get('button').contains(/Eliminar/i).click({ force: true });
        
        // Verificar si el elemento sigue apareciendo después de eliminar
        cy.wait(1000);
                cy.get('body').then($body => {
                    const filasVisibles = $body.find('.MuiDataGrid-row:visible').length;
            const filasAntes = 1; // Asumimos que había al menos 1 fila antes de eliminar
            
            if (filasVisibles >= filasAntes) {
                // ERROR: El elemento sigue apareciendo después de eliminar
                cy.registrarResultados({
                    numero: 15,
                    nombre: 'TC015 - Botón "Eliminar" con una fila seleccionada',
                    esperado: 'Se elimina la fila seleccionada',
                    obtenido: 'Se elimina correctamente pero sigue apareciendo',
                    resultado: 'ERROR',
                    archivo,
                    pantalla: 'Ficheros (Categorías)'
                });
            } else {
                // OK: El elemento se eliminó correctamente
                cy.log(`TC015: OK - Elemento eliminado correctamente`);
            }
        });
        
        return cy.wait(1000);
    }

    function eliminarSinSeleccion() {
        UI.abrirPantalla();
        // Verificar que el botón Eliminar no está disponible sin selección
        cy.get('button').contains(/Eliminar/i).should('not.exist');
        return cy.wrap(true);
    }

    function abrirFormularioAlta() {
        UI.abrirPantalla();
        return cy.get('button[aria-label="Nuevo"], button:contains("Nuevo"), button:contains("+ Añadir")').first().click({ force: true });
    }

    function ocultarColumna() {
        UI.abrirPantalla();
        cy.get('div[role="columnheader"][data-field="name"]')
            .find('button[aria-label*="column menu"]')
            .click({ force: true });
        cy.contains('li', /Hide column/i).click({ force: true });
        return cy.wait(1000);
    }

    function gestionarColumnas() {
        UI.abrirPantalla();
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Ocultar columna
        cy.get('div[role="columnheader"][data-field="name"]')
            .find('button[aria-label*="column menu"]')
            .click({ force: true });
        cy.contains('li', /Manage columns|Show columns/i).click({ force: true });

        cy.get('div.MuiDataGrid-panel, .MuiPopover-paper').within(() => {
            cy.contains(/Nombre/i)
                .parent()
                .find('input[type="checkbox"]')
                .first()
                .uncheck({ force: true });
        });
        cy.get('body').click(0, 0);
        cy.wait(500);

        // Volver a mostrarla
        cy.get('div[role="columnheader"][data-field="name"]')
            .find('button[aria-label*="column menu"]')
            .click({ force: true });
        cy.contains('li', /Manage columns|Show columns/i).click({ force: true });

        cy.get('div.MuiDataGrid-panel, .MuiPopover-paper').within(() => {
            cy.contains(/Nombre/i)
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
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom', { duration: 1000 });
        cy.wait(200);
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('top', { duration: 500 });
        cy.wait(200);
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 1000 });
        cy.wait(200);
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('left', { duration: 500 });
        return cy.wait(500);
    }

    function recargarPagina() {
        UI.abrirPantalla();
        UI.buscar('clientes');
        cy.wait(1000);
        cy.reload();
        cy.wait(2000);
        cy.get('input[placeholder="Buscar"]').should('have.value', '');
        return cy.wait(500);
    }

    function guardarFiltro() {
        return UI.abrirPantalla()
            .then(() => UI.setColumna('Nombre'))
            .then(() => UI.buscar('clientes'))
            .then(() => {
                cy.contains('button', /^Guardar$/i).click({ force: true });
                cy.get('input[placeholder*="nombre"], input[placeholder*="Nombre"]')
                    .should('be.visible')
                    .type('filtro empresa');
                cy.contains('button', /^Guardar$/i).click({ force: true });
                return cy.wait(500);
            });
    }

    function limpiarFiltro() {
        return UI.abrirPantalla()
            .then(() => UI.setColumna('Nombre'))
            .then(() => UI.buscar('clientes'))
            .then(() => {
                cy.contains('button', /^Limpiar$/i).click({ force: true });
        return cy.get('input[placeholder="Buscar"]').should('have.value', '');
            });
    }

    function seleccionarFiltroGuardado() {
        return UI.abrirPantalla()
            .then(() => UI.setColumna('Nombre'))
            .then(() => UI.buscar('clientes'))
            .then(() => {
                cy.contains('button', /^Guardar$/i).click({ force: true });
                cy.get('input[placeholder*="nombre"], input[placeholder*="Nombre"]')
                    .should('be.visible')
                    .type('filtro modulo');
                cy.contains('button', /^Guardar$/i).click({ force: true });
                cy.wait(500);

                // Primero limpiar los filtros actuales
                cy.contains('button', /^Limpiar$/i).click({ force: true });
        cy.wait(500);

                // Pulsar en el desplegable "Guardados" y seleccionar el filtro guardado
                cy.contains('button, [role="button"]', /Guardados/i).click({ force: true });
                cy.wait(500);
                // Pulsar en "filtro modulo" que aparece en el desplegable
                cy.contains('li, [role="option"]', /filtro modulo/i).click({ force: true });

                return UI.filasVisibles().should('have.length.greaterThan', 0);
        });
    }
}); 