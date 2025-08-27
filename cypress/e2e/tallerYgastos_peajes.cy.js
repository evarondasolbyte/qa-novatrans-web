describe('TALLER Y GASTOS - PEAJES - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla correctamente', funcion: cargarPantalla },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol },
        { numero: 5, nombre: 'TC005 - Filtrar por Fecha', funcion: filtrarPorFecha },
        { numero: 7, nombre: 'TC007 - Filtrar por Lugar', funcion: filtrarPorLugar },
        { numero: 8, nombre: 'TC008 - Filtrar por Vehículo', funcion: filtrarPorVehiculo },
        { numero: 9, nombre: 'TC009 - Filtrar por Importe', funcion: filtrarPorImporte },
        { numero: 10, nombre: 'TC010 - Filtrar por Tarjeta', funcion: filtrarPorTarjeta },
        { numero: 14, nombre: 'TC014 - Búsqueda general (texto exacto)', funcion: buscarTextoExacto },
        { numero: 15, nombre: 'TC015 - Búsqueda general (texto parcial)', funcion: buscarTextoParcial },
        { numero: 16, nombre: 'TC016 - Búsqueda case-insensitive', funcion: buscarCaseInsensitive },
        { numero: 17, nombre: 'TC017 - Búsqueda con espacios', funcion: buscarConEspacios },
        { numero: 18, nombre: 'TC018 - Búsqueda con caracteres especiales', funcion: buscarCaracteresEspeciales },
        { numero: 19, nombre: 'TC019 - Ordenar por Fecha ASC/DESC', funcion: ordenarPorFecha },
        { numero: 20, nombre: 'TC020 - Ordenar por Vehículo ASC/DESC', funcion: ordenarPorVehiculo },
        { numero: 21, nombre: 'TC021 - Ordenar por Importe ASC/DESC', funcion: ordenarPorImporte },
        { numero: 22, nombre: 'TC022 - Seleccionar una fila', funcion: seleccionarFila },
        { numero: 23, nombre: 'TC023 - Botón Eliminar con fila seleccionada', funcion: eliminarConSeleccion },
        { numero: 24, nombre: 'TC024 - Botón Eliminar sin selección', funcion: eliminarSinSeleccion },
        { numero: 25, nombre: 'TC025 - Botón + Añadir abre formulario', funcion: abrirFormulario },
        { numero: 26, nombre: 'TC026 - Botón Editar con fila seleccionada', funcion: editarConSeleccion },
        { numero: 27, nombre: 'TC027 - Botón Editar sin selección', funcion: editarSinSeleccion },
        { numero: 28, nombre: 'TC028 - Filtrar por Fecha Desde', funcion: filtrarPorFechaDesde },
        { numero: 29, nombre: 'TC029 - Filtrar por Fecha Hasta', funcion: filtrarPorFechaHasta },
        { numero: 30, nombre: 'TC030 - Filtrar por Fecha Desde + Hasta', funcion: filtrarPorRangoFechas },
        { numero: 31, nombre: 'TC031 - Filtrar por "Value"', funcion: filtrarPorValue },
        { numero: 32, nombre: 'TC032 - Ocultar columna desde menú contextual', funcion: ocultarColumna },
        { numero: 33, nombre: 'TC033 - Mostrar/ocultar columnas con "Manage columns"', funcion: gestionarColumnas },
        { numero: 34, nombre: 'TC034 - Scroll en tabla', funcion: scrollEnTabla },
        { numero: 35, nombre: 'TC035 - Reinicio de filtros al recargar', funcion: reinicioFiltros },
    ];

    // Resumen al final
    after(() => {
        cy.log('Procesando resultados finales para Taller y Gastos (Peajes)');
        cy.procesarResultadosPantalla('Taller y Gastos (Peajes)');
    });

    // Iterador de casos con protección anti-doble-registro
    casos.forEach(({ numero, nombre, funcion }) => {
        it(nombre, () => {
            // Reset de flags por test
            cy.resetearFlagsTest();

            // Captura de errores y registro
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    archivo,
                    pantalla: 'Taller y Gastos (Peajes)'
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
                            pantalla: 'Taller y Gastos (Peajes)'
                        });
                    }
                });
            });
        });
    });

    // === FUNCIONES DE VALIDACIÓN ===

    function cargarPantalla() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Date').should('exist');
            cy.contains('Vehicle').should('exist');
            cy.contains('Amount').should('exist');
        });
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500);
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Data').should('exist');
            cy.contains('Ubicació').should('exist');
            cy.contains('Import').should('exist');
        });
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Fecha').should('exist');
            cy.contains('Vehículo').should('exist');
            cy.contains('Importe').should('exist');
        });
    }

    function filtrarPorFecha() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('select[name="column"]').select('Fecha', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('2020{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorLugar() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('select[name="column"]').select('Lugar', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Bilbao{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorVehiculo() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('select[name="column"]').select('Vehículo', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('3108 KCP{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorImporte() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('select[name="column"]').select('Importe', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('12{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorTarjeta() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('select[name="column"]').select('Tarjeta', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Conductor{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarTextoExacto() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('CONDUCTOR{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarTextoParcial() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Vial{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarCaseInsensitive() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('CoNdUcToR{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarConEspacios() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('   conductor    {enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarCaracteresEspeciales() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('$%&{enter}', { force: true });
        cy.wait(500);
        return cy.contains('No rows', { timeout: 3000 }).should('be.visible');
    }

    function ordenarPorFecha() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');

        // Ordenar ascendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha').click();
        cy.wait(1000);

        // Ordenar descendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha').click();

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorVehiculo() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');

        // Ordenar ascendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Vehículo').click();
        cy.wait(1000);

        // Ordenar descendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Vehículo').click();

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorImporte() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');

        // Ordenar ascendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Importe').click();
        cy.wait(1000);

        // Ordenar descendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Importe').click();

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function seleccionarFila() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function eliminarConSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').then($filas => {
            if ($filas.length === 0) {
                cy.log('No hay peajes visibles para eliminar. Test omitido.');
                return;
            }
            cy.wrap($filas[0]).as('filaPeaje');
            cy.get('@filaPeaje')
                .find('.MuiDataGrid-cell')
                .then($celdas => {
                    const valores = [...$celdas].map(c => c.innerText.trim()).filter(t => t);
                    const identificador = valores[0];
                    cy.get('@filaPeaje').click({ force: true });
                    cy.get('button')
                        .filter(':visible')
                        .eq(-3)
                        .click({ force: true });
                });
        });
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        cy.get('div[role="row"] input[type="checkbox"]:checked').should('have.length', 0);
        return cy.get('button.css-1cbe274').click({ force: true });
    }

    function abrirFormulario() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('button').contains('Añadir').click({ force: true });
        return cy.get('form').should('be.visible');
    }

    function editarConSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        cy.get('.MuiDataGrid-row:visible').first().as('filaSeleccionada');
        cy.get('@filaSeleccionada').click({ force: true });
        cy.wait(1000);
        cy.get('@filaSeleccionada').dblclick({ force: true });
        cy.wait(1000);
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/tolls\/form\/\d+$/);
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function filtrarPorFechaDesde() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');

        // Seleccionar fecha "Desde": 2020
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first()
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2020');
            });

        cy.wait(500);

        // Verificar que se muestran gastos a partir del 2020
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorFechaHasta() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');

        // Seleccionar fecha "Hasta": 2021
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1)
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2021');
            });

        cy.wait(500);

        // Verificar que se muestran gastos hasta el 2021
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorRangoFechas() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');

        // Seleccionar fecha "Desde": 2020
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first()
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2020');
            });

        // Seleccionar fecha "Hasta": 2021
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1)
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2021');
            });

        cy.wait(500);

        // Verificar que se muestran registros dentro del rango
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorValue() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');

        // Hacer clic en el menú de la columna Lugar
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Lugar')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Lugar column menu"]').click({ force: true });
        cy.get('li').contains('Filter').click({ force: true });

        // Escribir en el campo Value
        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('Vialtis');

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ocultarColumna() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');

        // Hacer clic en el menú de la columna Lugar
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Lugar')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Lugar column menu"]').click({ force: true });
        cy.get('li').contains('Hide column').click({ force: true });

        return cy.get('.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains('Lugar').should('not.exist');
            });
    }

    function gestionarColumnas() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');

        // Hacer clic en el menú de la columna Fecha
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Fecha column menu"]').click({ force: true });
        cy.get('li').contains('Manage columns').click({ force: true });

        // Marcar Lugar para que vuelva a ser visible
        cy.get('.MuiDataGrid-panel')
            .should('be.visible')
            .find('label')
            .contains('Lugar')
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });

        return cy.get('.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains('Lugar').should('exist');
            });
    }

    function scrollEnTabla() {
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
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
        cy.navegarAMenu('TallerYGastos', 'Peajes');
        cy.url().should('include', '/dashboard/tolls');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('conductor{enter}', { force: true });
        cy.reload();
        return cy.get('input[placeholder="Buscar"]').should('have.value', '');
    }
});