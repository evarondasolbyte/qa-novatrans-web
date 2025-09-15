describe('PROCESOS (INCIDENCIAS) - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    // Defino todos los casos con su número, nombre descriptivo y la función que ejecuta la validación
    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla correctamente', funcion: cargarPantallaIncidencias, prioridad: 'ALTA' },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' },
        { numero: 5, nombre: 'TC005 - Filtrar por Código', funcion: filtrarPorCodigo, prioridad: 'ALTA' },
        { numero: 6, nombre: 'TC006 - Filtrar por Fecha', funcion: filtrarPorFecha, prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - Filtrar por Incidencia', funcion: filtrarPorIncidencia, prioridad: 'ALTA' },
        { numero: 8, nombre: 'TC008 - Filtrar por P.T', funcion: filtrarPorPT, prioridad: 'MEDIA' },
        { numero: 9, nombre: 'TC009 - Filtrar por Tipo incidencia', funcion: filtrarPorTipoIncidencia, prioridad: 'ALTA' },
        { numero: 10, nombre: 'TC010 - Filtrar por Resolución', funcion: filtrarPorResolucion, prioridad: 'ALTA' },
        { numero: 11, nombre: 'TC011 - Filtrar por Id. Planificación', funcion: filtrarPorIdPlanificacion, prioridad: 'MEDIA' },
        { numero: 12, nombre: 'TC012 - Búsqueda general (texto exacto)', funcion: buscarTextoExacto, prioridad: 'ALTA' },
        { numero: 13, nombre: 'TC013 - Búsqueda general (texto parcial)', funcion: buscarTextoParcial, prioridad: 'ALTA' },
        { numero: 14, nombre: 'TC014 - Búsqueda case-insensitive', funcion: buscarCaseInsensitive, prioridad: 'MEDIA' },
        { numero: 15, nombre: 'TC015 - Búsqueda con espacios', funcion: buscarConEspacios, prioridad: 'MEDIA' },
        { numero: 16, nombre: 'TC016 - Búsqueda con caracteres especiales', funcion: buscarCaracteresEspeciales, prioridad: 'BAJA' },
        { numero: 17, nombre: 'TC017 - Ordenar por Código ASC/DESC', funcion: ordenarPorCodigo, prioridad: 'MEDIA' },
        { numero: 18, nombre: 'TC018 - Ordenar por Fecha ASC/DESC', funcion: ordenarPorFecha, prioridad: 'MEDIA' },
        { numero: 19, nombre: 'TC019 - Ordenar por Incidencia ASC/DESC', funcion: ordenarPorIncidencia, prioridad: 'MEDIA' },
        { numero: 20, nombre: 'TC020 - Ordenar por P.T ASC/DESC', funcion: ordenarPorPT, prioridad: 'MEDIA' },
        { numero: 21, nombre: 'TC021 - Ordenar por Tipo incidencia ASC/DESC', funcion: ordenarPorTipoIncidencia, prioridad: 'MEDIA' },
        { numero: 22, nombre: 'TC022 - Ordenar por Resolución ASC/DESC', funcion: ordenarPorResolucion, prioridad: 'MEDIA' },
        { numero: 23, nombre: 'TC023 - Ordenar por Id. Planificación ASC/DESC', funcion: ordenarPorIdPlanificacion, prioridad: 'MEDIA' },
        { numero: 24, nombre: 'TC024 - Seleccionar una fila', funcion: seleccionarFila, prioridad: 'ALTA' },
        { numero: 25, nombre: 'TC025 - Eliminar con fila seleccionada', funcion: eliminarConSeleccion, prioridad: 'ALTA' },
        { numero: 26, nombre: 'TC026 - Eliminar sin selección', funcion: eliminarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 27, nombre: 'TC027 - +Añadir abre formulario', funcion: abrirFormularioAlta, prioridad: 'ALTA' },
        { numero: 28, nombre: 'TC028 - Editar con fila seleccionada', funcion: editarConSeleccion, prioridad: 'ALTA' },
        { numero: 29, nombre: 'TC029 - Editar sin selección', funcion: editarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 30, nombre: 'TC030 - Fecha Desde (filtro superior)', funcion: filtrarFechaDesde, prioridad: 'ALTA' },
        { numero: 31, nombre: 'TC031 - Fecha Hasta (filtro superior)', funcion: filtrarFechaHasta, prioridad: 'ALTA' },
        { numero: 32, nombre: 'TC032 - Fecha Desde + Hasta (rango)', funcion: filtrarRangoFechas, prioridad: 'ALTA' },
        { numero: 33, nombre: 'TC033 - Filter → Value en columna', funcion: filtrarPorValue, prioridad: 'MEDIA' },
        { numero: 34, nombre: 'TC034 - Ocultar columna desde menú contextual', funcion: ocultarColumna, prioridad: 'BAJA' },
        { numero: 35, nombre: 'TC035 - Manage columns (mostrar/ocultar)', funcion: gestionarColumnas, prioridad: 'BAJA' },
        { numero: 36, nombre: 'TC036 - Scroll vertical/horizontal', funcion: scrollTabla, prioridad: 'BAJA' },
        { numero: 37, nombre: 'TC037 - Reinicio de filtros al recargar', funcion: reinicioFiltros, prioridad: 'MEDIA' },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Procesos (Incidencias)');
    });

    // Filtrar casos por prioridad si se especifica
    const prioridadFiltro = Cypress.env('prioridad');
    const casosFiltrados = prioridadFiltro && prioridadFiltro !== 'todas' 
        ? casos.filter(caso => caso.prioridad === prioridadFiltro.toUpperCase())
        : casos;

    casosFiltrados.forEach(({ numero, nombre, funcion, prioridad }) => {
        it(`${nombre} [${prioridad}]`, () => {
            cy.resetearFlagsTest();
            
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    archivo,
                    pantalla: 'Procesos (Incidencias)'
                });
                return false;
            });

            cy.login();
            cy.wait(500);

            funcion().then(() => {
                // Solo registrar para casos que no manejan su propio registro
                if (numero !== 26) {
                    cy.registrarResultados({
                        numero,
                        nombre,
                        esperado: 'Comportamiento correcto',
                        obtenido: 'Comportamiento correcto',
                        archivo,
                        pantalla: 'Procesos (Incidencias)'
                    });
                }
            });
        });
    });

    // === FUNCIONES DE VALIDACIÓN ===
    function cargarPantallaIncidencias() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function cambiarIdiomaIngles() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('select#languageSwitcher').select('en', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaCatalan() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaEspanol() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('select#languageSwitcher').select('es', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function filtrarPorCodigo() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('select[name="column"]').select('Código', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('1{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorFecha() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('select[name="column"]').select('Fecha', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('2018{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorIncidencia() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('select[name="column"]').select('Incidencia', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('viaje{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorPT() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('select[name="column"]').select('P.T', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('50{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorTipoIncidencia() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('select[name="column"]').select('Tipo incidencia', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('M{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorResolucion() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('select[name="column"]').select('Resolución', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('resuelto bien{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorIdPlanificacion() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('select[name="column"]').select('Id. Planificación', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('2881{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarTextoExacto() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('prueba nueva 2{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarTextoParcial() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('viaje{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarCaseInsensitive() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('ReSuElTo BiEn{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarConEspacios() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('   incidencia nueva    {enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarCaracteresEspeciales() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('%&/{enter}', { force: true });
        cy.wait(500);
        return cy.contains('No rows', { timeout: 3000 }).should('be.visible');
    }

    function ordenarPorCodigo() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorFecha() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorIncidencia() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Incidencia').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Incidencia').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorPT() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'P.T').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'P.T').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorTipoIncidencia() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');
        cy.wait(500);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Tipo incidencia').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Tipo incidencia').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorResolucion() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');
        cy.wait(500);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Resolución').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Resolución').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorIdPlanificacion() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');
        cy.wait(500);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Id. Planificación').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Id. Planificación').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function seleccionarFila() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function eliminarConSeleccion() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        cy.wait(500);
        return cy.get('button.css-1cbe274').click({ force: true });
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        return cy.get('body').then(($body) => {
            const tieneMsg = $body.text().includes('No hay ningún elemento seleccionado')
                          || $body.text().includes('No hay ninguna incidencia seleccionada');

            cy.registrarResultados({
                numero: 26,
                nombre: 'TC026 - Eliminar sin selección',
                esperado: 'El botón está deshabilitado y muestra mensaje',
                obtenido: tieneMsg ? 'El botón está deshabilitado y muestra mensaje'
                                   : 'El botón está habilitado pero no muestra mensaje',
                resultado: tieneMsg ? 'OK' : 'WARNING',
                archivo,
                pantalla: 'Procesos (Incidencias)',
                observacion: tieneMsg ? undefined : 'Debería aparecer un aviso de "no seleccionado".'
            });

            return cy.get('button.css-1cbe274').should('exist');
        });
    }

    function abrirFormularioAlta() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('button').contains('Añadir').click({ force: true });
        return cy.get('form').should('be.visible');
    }

    function editarConSeleccion() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('.MuiDataGrid-row:visible').first().as('filaSeleccionada');
        cy.get('@filaSeleccionada').click({ force: true });
        cy.wait(500);
        cy.get('@filaSeleccionada').dblclick({ force: true });
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/incidents\/form\/\d+$/);
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function filtrarFechaDesde() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');

        cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2019');
        });

        cy.wait(500);

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarFechaHasta() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');

        cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2019');
        });

        cy.wait(500);

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarRangoFechas() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');

        cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2019');
        });

        cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2022');
        });

        cy.wait(500);

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorValue() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Incidencia')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Incidencia column menu"]').click({ force: true });
        cy.get('li').contains('Filter').click({ force: true });

        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('prueba');

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ocultarColumna() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Fecha column menu"]').click({ force: true });
        cy.get('li').contains('Hide column').click({ force: true });

        return cy.get('.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains('Fecha').should('not.exist');
            });
    }

    function gestionarColumnas() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Código column menu"]').click({ force: true });
        cy.get('li').contains('Manage columns').click({ force: true });

        cy.get('.MuiDataGrid-panel')
            .should('be.visible')
            .find('label')
            .contains('Fecha')
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });

        return cy.get('.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains('Fecha').should('exist');
            });
    }

    function scrollTabla() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function reinicioFiltros() {
        cy.navegarAMenu('Procesos', 'Incidencias');
        cy.url().should('include', '/dashboard/incidents');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('viaje{enter}', { force: true });
        cy.reload();
        return cy.get('input[placeholder="Buscar"]').should('have.value', '');
    }
});
