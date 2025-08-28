describe('REMUNERACIÓN (DIETAS PREDEFINIDAS) - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    // Defino todos los casos con su número, nombre descriptivo y la función que ejecuta la validación
    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla correctamente', funcion: cargarPantallaDietas },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol },
        { numero: 5, nombre: 'TC005 - Filtrar por ID', funcion: filtrarPorID },
        { numero: 6, nombre: 'TC006 - Filtrar por Conductor', funcion: filtrarPorConductor },
        { numero: 7, nombre: 'TC007 - Filtrar por Fecha', funcion: filtrarPorFecha },
        { numero: 8, nombre: 'TC008 - Filtrar por Concepto (contenga)', funcion: filtrarPorConcepto },
        { numero: 9, nombre: 'TC009 - Filtrar por Unidades', funcion: filtrarPorUnidades },
        { numero: 10, nombre: 'TC010 - Filtrar por Precio', funcion: filtrarPorPrecio },
        { numero: 11, nombre: 'TC011 - Filtrar por Total', funcion: filtrarPorTotal },
        { numero: 12, nombre: 'TC012 - Filtrar por Porcentaje', funcion: filtrarPorPorcentaje },
        { numero: 13, nombre: 'TC013 - Búsqueda general (texto exacto)', funcion: buscarTextoExacto },
        { numero: 14, nombre: 'TC014 - Búsqueda general (texto parcial)', funcion: buscarTextoParcial },
        { numero: 15, nombre: 'TC015 - Búsqueda case-insensitive', funcion: buscarCaseInsensitive },
        { numero: 16, nombre: 'TC016 - Búsqueda con espacios al inicio/fin', funcion: buscarConEspacios },
        { numero: 17, nombre: 'TC017 - Búsqueda con caracteres especiales', funcion: buscarCaracteresEspeciales },
        { numero: 18, nombre: 'TC018 - Ordenar por ID ASC/DESC', funcion: ordenarPorID },
        { numero: 19, nombre: 'TC019 - Ordenar por Conductor ASC/DESC', funcion: ordenarPorConductor },
        { numero: 20, nombre: 'TC020 - Ordenar por Fecha ASC/DESC', funcion: ordenarPorFecha },
        { numero: 21, nombre: 'TC021 - Ordenar por Concepto ASC/DESC', funcion: ordenarPorConcepto },
        { numero: 22, nombre: 'TC022 - Ordenar por Unidades ASC/DESC', funcion: ordenarPorUnidades },
        { numero: 23, nombre: 'TC023 - Ordenar por Precio ASC/DESC', funcion: ordenarPorPrecio },
        { numero: 24, nombre: 'TC024 - Ordenar por Total ASC/DESC', funcion: ordenarPorTotal },
        { numero: 25, nombre: 'TC025 - Ordenar por Porcentaje ASC/DESC', funcion: ordenarPorPorcentaje },
        { numero: 26, nombre: 'TC026 - Seleccionar una fila', funcion: seleccionarFila },
        { numero: 27, nombre: 'TC027 - Botón Eliminar con fila seleccionada', funcion: eliminarConSeleccion },
        { numero: 28, nombre: 'TC028 - Botón Eliminar sin selección', funcion: eliminarSinSeleccion },
        { numero: 29, nombre: 'TC029 - Botón + Añadir abre formulario', funcion: abrirFormularioAlta },
        { numero: 30, nombre: 'TC030 - Botón Editar con fila seleccionada', funcion: editarConSeleccion },
        { numero: 31, nombre: 'TC031 - Botón Editar sin selección', funcion: editarSinSeleccion },
        { numero: 32, nombre: 'TC032 - Fecha Desde (filtro superior)', funcion: filtrarFechaDesde },
        { numero: 33, nombre: 'TC033 - Fecha Hasta (filtro superior)', funcion: filtrarFechaHasta },
        { numero: 34, nombre: 'TC034 - Fecha Desde + Hasta (rango completo)', funcion: filtrarRangoFechas },
        { numero: 35, nombre: 'TC035 - Filtrar por Value (menú de columna)', funcion: filtrarPorValue },
        { numero: 36, nombre: 'TC036 - Ocultar columna desde menú contextual', funcion: ocultarColumna },
        { numero: 37, nombre: 'TC037 - Manage columns (mostrar/ocultar)', funcion: gestionarColumnas },
        { numero: 38, nombre: 'TC038 - Scroll en tabla (vertical y horizontal)', funcion: scrollTabla },
        { numero: 39, nombre: 'TC039 - Reinicio de filtros al recargar', funcion: reinicioFiltros },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Remuneración (Dietas Predefinidas)');
    });

    casos.forEach(({ numero, nombre, funcion }) => {
        it(nombre, () => {
            cy.resetearFlagsTest();
            
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    archivo,
                    pantalla: 'Remuneración (Dietas Predefinidas)'
                });
                return false;
            });

            cy.login();
            cy.wait(500);

            funcion().then(() => {
                cy.registrarResultados({
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    obtenido: 'Comportamiento correcto',
                    archivo,
                    pantalla: 'Remuneración (Dietas Predefinidas)'
                });
            });
        });
    });

    // === FUNCIONES DE VALIDACIÓN ===
    function cargarPantallaDietas() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function cambiarIdiomaIngles() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('select#languageSwitcher').select('en', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaCatalan() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaEspanol() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('select#languageSwitcher').select('es', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function filtrarPorID() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('select[name="column"]').select('ID', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('8170{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorConductor() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('select[name="column"]').select('Conductor', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Ismael{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorFecha() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('select[name="column"]').select('Fecha', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('2019{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorConcepto() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('select[name="column"]').select('Concepto', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('viaje{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorUnidades() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('select[name="column"]').select('Unidades', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('2{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorPrecio() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('select[name="column"]').select('Precio', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('40{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorTotal() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');
        cy.wait(500);
        cy.get('select[name="column"]').select('Total', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('50{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorPorcentaje() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');
        cy.wait(500);
        cy.get('select[name="column"]').select('Porcentaje', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('100{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarTextoExacto() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('FESTIVO{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarTextoParcial() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Joaquin{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarCaseInsensitive() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('cEnA{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarConEspacios() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('   cena    {enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarCaracteresEspeciales() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('%&/{enter}', { force: true });
        cy.wait(500);
        return cy.contains('No rows', { timeout: 3000 }).should('be.visible');
    }

    function ordenarPorID() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'ID').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'ID').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorConductor() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Conductor').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Conductor').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorFecha() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorConcepto() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Concepto').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Concepto').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorUnidades() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Unidades').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Unidades').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorPrecio() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Precio').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Precio').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorTotal() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');
        cy.wait(500);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Total').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Total').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorPorcentaje() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');
        cy.wait(500);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Porcentaje').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Porcentaje').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function seleccionarFila() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function eliminarConSeleccion() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        cy.wait(500);
        return cy.get('button.css-1cbe274').click({ force: true });
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        return cy.get('button.css-1cbe274').click({ force: true });
    }

    function abrirFormularioAlta() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('button').contains('Añadir').click({ force: true });
        return cy.get('form').should('be.visible');
    }

    function editarConSeleccion() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('.MuiDataGrid-row:visible').first().as('filaSeleccionada');
        cy.get('@filaSeleccionada').click({ force: true });
        cy.wait(500);
        cy.get('@filaSeleccionada').dblclick({ force: true });
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/predefined-diets\/form\/\d+$/);
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function filtrarFechaDesde() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');

        cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2020');
        });

        cy.wait(500);

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarFechaHasta() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');

        cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2019');
        });

        cy.wait(500);

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarRangoFechas() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');

        cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2019');
        });

        cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2021');
        });

        cy.wait(500);

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorValue() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Concepto')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Concepto column menu"]').click({ force: true });
        cy.get('li').contains('Filter').click({ force: true });

        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('cena');

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ocultarColumna() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Conductor')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Conductor column menu"]').click({ force: true });
        cy.get('li').contains('Hide column').click({ force: true });

        return cy.get('.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains('Conductor').should('not.exist');
            });
    }

    function gestionarColumnas() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'ID')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="ID column menu"]').click({ force: true });
        cy.get('li').contains('Manage columns').click({ force: true });

        cy.get('.MuiDataGrid-panel')
            .should('be.visible')
            .find('label')
            .contains('Concepto')
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });

        return cy.get('.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains('Concepto').should('exist');
            });
    }

    function scrollTabla() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function reinicioFiltros() {
        cy.navegarAMenu('Remuneracion', 'Dietas Predefinidas');
        cy.url().should('include', '/dashboard/predefined-diets');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('cena{enter}', { force: true });
        cy.reload();
        return cy.get('input[placeholder="Buscar"]').should('have.value', '');
    }
});
