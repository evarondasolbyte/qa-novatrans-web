describe('TALLER Y GASTOS - GASTOS GENERALES - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla correctamente', funcion: cargarPantalla, prioridad: 'ALTA' },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' },
        { numero: 5, nombre: 'TC005 - Filtrar por Inicio (fecha)', funcion: filtrarPorInicio, prioridad: 'ALTA' },
        { numero: 6, nombre: 'TC006 - Filtrar por Código', funcion: filtrarPorCodigo, prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - Filtrar por Fin (fecha)', funcion: filtrarPorFin, prioridad: 'ALTA' },
        { numero: 8, nombre: 'TC008 - Filtrar por Importe', funcion: filtrarPorImporte, prioridad: 'ALTA' },
        { numero: 9, nombre: 'TC009 - Filtrar por Descripción (contenga)', funcion: filtrarPorDescripcion, prioridad: 'ALTA' },
        { numero: 10, nombre: 'TC010 - Filtrar por Factura', funcion: filtrarPorFactura, prioridad: 'MEDIA' },
        { numero: 11, nombre: 'TC011 - Filtrar por Nómina', funcion: filtrarPorNomina, prioridad: 'MEDIA' },
        { numero: 12, nombre: 'TC012 - Búsqueda general (texto exacto)', funcion: buscarTextoExacto, prioridad: 'ALTA' },
        { numero: 13, nombre: 'TC013 - Búsqueda general (texto parcial)', funcion: buscarTextoParcial, prioridad: 'ALTA' },
        { numero: 14, nombre: 'TC014 - Búsqueda case-insensitive', funcion: buscarCaseInsensitive, prioridad: 'MEDIA' },
        { numero: 15, nombre: 'TC015 - Búsqueda con espacios inicio/fin', funcion: buscarConEspacios, prioridad: 'MEDIA' },
        { numero: 16, nombre: 'TC016 - Búsqueda con caracteres especiales', funcion: buscarCaracteresEspeciales, prioridad: 'BAJA' },
        { numero: 17, nombre: 'TC017 - Ordenar por Inicio ASC/DESC', funcion: ordenarPorInicio, prioridad: 'MEDIA' },
        { numero: 18, nombre: 'TC018 - Ordenar por Fin ASC/DESC', funcion: ordenarPorFin, prioridad: 'MEDIA' },
        { numero: 19, nombre: 'TC019 - Ordenar por Importe ASC/DESC', funcion: ordenarPorImporte, prioridad: 'MEDIA' },
        { numero: 20, nombre: 'TC020 - Ordenar por Descripción ASC/DESC', funcion: ordenarPorDescripcion, prioridad: 'MEDIA' },
        { numero: 21, nombre: 'TC021 - Ordenar por Factura ASC/DESC', funcion: ordenarPorFactura, prioridad: 'MEDIA' },
        { numero: 22, nombre: 'TC022 - Seleccionar una fila', funcion: seleccionarFila, prioridad: 'ALTA' },
        { numero: 23, nombre: 'TC023 - Botón Eliminar con fila seleccionada', funcion: eliminarConSeleccion, prioridad: 'ALTA' },
        { numero: 24, nombre: 'TC024 - Botón Eliminar sin selección', funcion: eliminarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 25, nombre: 'TC025 - Botón + Añadir abre formulario', funcion: abrirFormulario, prioridad: 'ALTA' },
        { numero: 26, nombre: 'TC026 - Botón Editar con fila seleccionada', funcion: editarConSeleccion, prioridad: 'ALTA' },
        { numero: 27, nombre: 'TC027 - Botón Editar sin selección', funcion: editarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 28, nombre: 'TC028 - Fecha Desde (filtro superior)', funcion: filtrarPorFechaDesde, prioridad: 'ALTA' },
        { numero: 29, nombre: 'TC029 - Fecha Hasta (filtro superior)', funcion: filtrarPorFechaHasta, prioridad: 'ALTA' },
        { numero: 30, nombre: 'TC030 - Fecha Desde + Hasta (rango completo)', funcion: filtrarPorRangoFechas, prioridad: 'ALTA' },
        { numero: 31, nombre: 'TC031 - Filtrar por Value (menú de columna)', funcion: filtrarPorValue, prioridad: 'MEDIA' },
        { numero: 32, nombre: 'TC032 - Ocultar columna desde menú contextual', funcion: ocultarColumna, prioridad: 'BAJA' },
        { numero: 33, nombre: 'TC033 - Manage columns (mostrar/ocultar)', funcion: gestionarColumnas, prioridad: 'BAJA' },
        { numero: 34, nombre: 'TC034 - Scroll en tabla (vertical/horizontal)', funcion: scrollEnTabla, prioridad: 'BAJA' },
        { numero: 35, nombre: 'TC035 - Reinicio de filtros al recargar', funcion: reinicioFiltros, prioridad: 'MEDIA' },
    ];

    // Resumen al final
    after(() => {
        cy.log('Procesando resultados finales para Taller y Gastos (Gastos Generales)');
        cy.procesarResultadosPantalla('Taller y Gastos (Gastos Generales)');
    });

    // Iterador de casos con protección anti-doble-registro
    // Filtrar casos por prioridad si se especifica
    const prioridadFiltro = Cypress.env('prioridad');
    const casosFiltrados = prioridadFiltro && prioridadFiltro !== 'todas' 
        ? casos.filter(caso => caso.prioridad === prioridadFiltro.toUpperCase())
        : casos;

    casosFiltrados.forEach(({ numero, nombre, funcion, prioridad }) => {
        it(`${nombre} [${prioridad}]`, () => {
            // Reset de flags por test (muy importante)
            cy.resetearFlagsTest();

            // Captura de errores y registro
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    archivo,
                    pantalla: 'Taller y Gastos (Gastos Generales)'
                });
                return false;
            });

            cy.login();
            cy.wait(500);

            // Ejecuta el caso y sólo auto-OK si nadie registró antes
            return funcion().then(() => {
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
                            pantalla: 'Taller y Gastos (Gastos Generales)'
                        });
                    }
                });
            });
        });
    });

    // === FUNCIONES DE VALIDACIÓN ===

    function cargarPantalla() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Start').should('exist');
            cy.contains('End').should('exist');
            cy.contains('Amount').should('exist');
        });
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500);
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Inici').should('exist');
            cy.contains('Fi').should('exist');
            cy.contains('Import').should('exist');
        });
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Inicio').should('exist');
            cy.contains('Fin').should('exist');
            cy.contains('Importe').should('exist');
        });
    }

    function filtrarPorInicio() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('select[name="column"]').select('Inicio', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('2015{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorCodigo() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('select[name="column"]').select('Código', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('21{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorFin() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('select[name="column"]').select('Fin', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('2015{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorImporte() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('select[name="column"]').select('Importe', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('300{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorDescripcion() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('select[name="column"]').select('Descripción', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Nómina{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorFactura() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('select[name="column"]').select('Factura', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('26{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorNomina() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('select[name="column"]').select('Nómina', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('32{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarTextoExacto() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('repostaje{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarTextoParcial() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('gasto{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarCaseInsensitive() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('nÓmInA{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarConEspacios() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('   NÓMINA    {enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarCaracteresEspeciales() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('%&/{enter}', { force: true });
        cy.wait(500);
        return cy.contains('No rows', { timeout: 3000 }).should('be.visible');
    }

    function ordenarPorInicio() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Inicio').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Inicio').click();

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorFin() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fin').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fin').click();

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorImporte() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Importe').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Importe').click();

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorDescripcion() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Descripción').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Descripción').click();

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorFactura() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Factura').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Factura').click();

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function seleccionarFila() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function eliminarConSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        
        // Verificar que hay filas disponibles
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        
        // Seleccionar la primera fila
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        cy.wait(500);
        
        // Verificar que el botón eliminar está habilitado
        cy.get('button.css-1cbe274').should('not.be.disabled');
        
        // Verificar que el botón responde al click (sin eliminar realmente)
        cy.get('button.css-1cbe274').click({ force: true });
        cy.wait(500);
        
        // Verificar que la página sigue funcionando correctamente
        cy.get('.MuiDataGrid-root').should('be.visible');
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('button.css-1cbe274').click({ force: true });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function abrirFormulario() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('button').contains('Añadir').click({ force: true });
        return cy.get('form').should('be.visible');
    }

    function editarConSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('.MuiDataGrid-row:visible').first().as('filaSeleccionada');
        cy.get('@filaSeleccionada').click({ force: true });
        cy.wait(500);
        cy.get('@filaSeleccionada').dblclick({ force: true });
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/general-expenses\/form\/\d+$/);
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function filtrarPorFechaDesde() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');

        cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2017');
        });

        cy.wait(500);

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorFechaHasta() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');

        cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2018');
        });

        cy.wait(500);

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorRangoFechas() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');

        cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2015');
        });

        cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2020');
        });

        cy.wait(500);

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorValue() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Código column menu"]').click({ force: true });
        cy.get('li').contains('Filter').click({ force: true });

        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('35');

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ocultarColumna() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Código column menu"]').click({ force: true });
        cy.get('li').contains('Hide column').click({ force: true });

        return cy.get('.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains('Código').should('not.exist');
            });
    }

    function gestionarColumnas() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Inicio')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Inicio column menu"]').click({ force: true });
        cy.get('li').contains('Manage columns').click({ force: true });

        cy.get('.MuiDataGrid-panel')
            .should('be.visible')
            .find('label')
            .contains('Código')
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });

        return cy.get('.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains('Código').should('exist');
            });
    }

    function scrollEnTabla() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);

        const maxScrolls = 10;
        let intentos = 0;

        function hacerScrollVertical(prevHeight = 0) {
            return cy.get('.MuiDataGrid-virtualScroller').then($scroller => {
                const currentScrollHeight = $scroller[0].scrollHeight;
                if (currentScrollHeight === prevHeight || intentos >= maxScrolls) {
                    return cy.get('.MuiDataGrid-columnHeaders').should('exist');
                } else {
                    intentos++;
                    return cy.get('.MuiDataGrid-virtualScroller')
                        .scrollTo('bottom', { duration: 400 })
                        .wait(400)
                        .then(() => hacerScrollVertical(currentScrollHeight));
                }
            });
        }

        return hacerScrollVertical();
    }

    function reinicioFiltros() {
        cy.navegarAMenu('TallerYGastos', 'Gastos Generales');
        cy.url().should('include', '/dashboard/general-expenses');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('nómina{enter}', { force: true });
        cy.reload();
        return cy.get('input[placeholder="Buscar"]').should('have.value', '');
    }
});
