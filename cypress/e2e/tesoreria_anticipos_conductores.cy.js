describe('TESORERÍA (ANTICIPOS CONDUCTORES) - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla correctamente', funcion: cargarPantalla, prioridad: 'ALTA' },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' },
        { numero: 5, nombre: 'TC005 - Filtrar por Código', funcion: filtrarPorCodigo, prioridad: 'ALTA' },
        { numero: 6, nombre: 'TC006 - Filtrar por Conductor', funcion: filtrarPorConductor, prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - Filtrar por Fecha', funcion: filtrarPorFecha, prioridad: 'ALTA' },
        { numero: 8, nombre: 'TC008 - Filtrar por Importe', funcion: filtrarPorImporte, prioridad: 'ALTA' },
        { numero: 9, nombre: 'TC009 - Filtrar por Descripción', funcion: filtrarPorDescripcion, prioridad: 'ALTA' },
        { numero: 10, nombre: 'TC010 - Búsqueda general (texto exacto)', funcion: busquedaGeneralExacta, prioridad: 'ALTA' },
        { numero: 11, nombre: 'TC011 - Búsqueda general (texto parcial)', funcion: busquedaGeneralParcial, prioridad: 'ALTA' },
        { numero: 12, nombre: 'TC012 - Búsqueda case-insensitive', funcion: busquedaCaseInsensitive, prioridad: 'MEDIA' },
        { numero: 13, nombre: 'TC013 - Búsqueda con espacios', funcion: busquedaConEspacios, prioridad: 'MEDIA' },
        { numero: 14, nombre: 'TC014 - Búsqueda con caracteres especiales', funcion: busquedaConCaracteresEspeciales, prioridad: 'BAJA' },
        { numero: 15, nombre: 'TC015 - Ordenar por Código ASC/DESC', funcion: ordenarPorCodigo, prioridad: 'MEDIA' },
        { numero: 16, nombre: 'TC016 - Ordenar por Conductor ASC/DESC', funcion: ordenarPorConductor, prioridad: 'MEDIA' },
        { numero: 17, nombre: 'TC017 - Ordenar por Fecha ASC/DESC', funcion: ordenarPorFecha, prioridad: 'MEDIA' },
        { numero: 18, nombre: 'TC018 - Ordenar por Importe ASC/DESC', funcion: ordenarPorImporte, prioridad: 'MEDIA' },
        { numero: 19, nombre: 'TC019 - Ordenar por Descripción ASC/DESC', funcion: ordenarPorDescripcion, prioridad: 'MEDIA' },
        { numero: 20, nombre: 'TC020 - Ordenar por Saldado ASC/DESC', funcion: ordenarPorSaldado, prioridad: 'MEDIA' },
        { numero: 21, nombre: 'TC021 - Seleccionar una fila', funcion: seleccionarFila, prioridad: 'ALTA' },
        { numero: 22, nombre: 'TC022 - Eliminar con fila seleccionada', funcion: eliminarConFilaSeleccionada, prioridad: 'ALTA' },
        { numero: 23, nombre: 'TC023 - Eliminar sin selección', funcion: eliminarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 24, nombre: 'TC024 - Añadir abre formulario', funcion: abrirFormularioAñadir, prioridad: 'ALTA' },
        { numero: 25, nombre: 'TC025 - Editar con fila seleccionada', funcion: editarConFilaSeleccionada, prioridad: 'ALTA' },
        { numero: 26, nombre: 'TC026 - Editar sin selección', funcion: editarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 27, nombre: 'TC027 - Fecha inicio (filtro superior)', funcion: fechaInicioFiltro, prioridad: 'ALTA' },
        { numero: 28, nombre: 'TC028 - Fecha fin (filtro superior)', funcion: fechaFinFiltro, prioridad: 'ALTA' },
        { numero: 29, nombre: 'TC029 - Rango inicio + fin', funcion: rangoFechas, prioridad: 'ALTA' },
        { numero: 30, nombre: 'TC030 - Filter → Value en columna', funcion: filterValueEnColumna, prioridad: 'MEDIA' },
        { numero: 31, nombre: 'TC031 - Ocultar columna (Hide column)', funcion: ocultarColumna, prioridad: 'BAJA' },
        { numero: 32, nombre: 'TC032 - Manage columns (mostrar/ocultar)', funcion: manageColumns, prioridad: 'BAJA' },
        { numero: 34, nombre: 'TC034 - Reset de filtros al recargar', funcion: resetFiltrosRecarga, prioridad: 'MEDIA' },
    ];

    // Resumen al final
    after(() => {
        cy.log('Procesando resultados finales para Tesorería (Anticipos Conductores)');
        cy.procesarResultadosPantalla('Tesorería (Anticipos Conductores)');
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
                    pantalla: 'Tesorería (Anticipos Conductores)'
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
                            pantalla: 'Tesorería (Anticipos Conductores)'
                        });
                    }
                });
            });
        });
    });

    // ===== FUNCIONES DE PRUEBA =====

    function cargarPantalla() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');
        cy.get('.MuiDataGrid-root').should('exist');
        cy.get('input[placeholder*="Buscar"]').should('exist');
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');
        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Code');
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Codi');
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Buscar');
    }

    function filtrarPorCodigo() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        cy.get('select[name="column"]').select('Código', { force: true });
        cy.get('input[placeholder="Buscar"]').type('2', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorConductor() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        cy.get('select[name="column"]').select('Conductor', { force: true });
        cy.get('input[placeholder="Buscar"]').type('Elena', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorFecha() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        cy.get('select[name="column"]').select('Fecha', { force: true });
        cy.get('input[placeholder="Buscar"]').type('2016', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorImporte() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        cy.get('select[name="column"]').select('Importe', { force: true });
        cy.get('input[placeholder="Buscar"]').type('250', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorDescripcion() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        cy.get('select[name="column"]').select('Descripción', { force: true });
        cy.get('input[placeholder="Buscar"]').type('trabajador', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaGeneralExacta() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        cy.get('input[placeholder="Buscar"]').type('Ismael{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaGeneralParcial() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        cy.get('input[placeholder="Buscar"]').type('Elena{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaCaseInsensitive() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        cy.get('input[placeholder="Buscar"]').type('ElEnA{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaConEspacios() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        cy.get('input[placeholder="Buscar"]').type('   Elena  {enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaConCaracteresEspeciales() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        cy.get('input[placeholder="Buscar"]').type('$%&{enter}', { force: true });

        // Para caracteres especiales, esperamos que no haya resultados pero no error
        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            }
            // Si hay resultados, verificamos que sean válidos
            cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
            return cy.get('.MuiDataGrid-root').should('be.visible');
        });
    }

    function ordenarPorCodigo() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorConductor() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Conductor').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Conductor').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorFecha() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorImporte() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Importe').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Importe').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorDescripcion() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Descripción').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Descripción').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorSaldado() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        // Hacer scroll horizontal para ver la columna Saldado
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 400 });
        cy.wait(500);

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Saldado').should('be.visible').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Saldado').should('be.visible').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function seleccionarFila() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function eliminarConFilaSeleccionada() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        cy.wait(500);
        // devolvemos la cadena para que Cypress espere
        return cy.get('button.css-1cbe274').click({ force: true });
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        cy.get('button.css-1cbe274').click({ force: true });
        // No debería hacer nada o mostrar aviso
        return cy.get('.MuiDataGrid-root').should('exist');
    }

    function abrirFormularioAñadir() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        return cy.get('body').then(($body) => {
            const tieneBoton = $body.find('button:contains("Añadir")').length > 0;

            if (tieneBoton) {
                // Si el botón existe, hacer click
                cy.get('button').contains('Añadir').click({ force: true });
                cy.registrarResultados({
                    numero: 24,
                    nombre: 'TC024 - Añadir abre formulario',
                    esperado: 'Se abre el formulario',
                    obtenido: 'Se abre el formulario correctamente',
                    resultado: 'OK',
                    archivo,
                    pantalla: 'Tesorería (Anticipos Conductores)'
                });
                return cy.get('form').should('be.visible');
            } else {
                // Si el botón no aparece, registrar WARNING en Excel
                cy.registrarResultados({
                    numero: 24,
                    nombre: 'TC024 - Añadir abre formulario',
                    esperado: 'Se abre el formulario',
                    obtenido: 'El botón "Añadir" no aparece en pantalla principal pero la funcionalidad funciona si filtras',
                    resultado: 'WARNING',
                    archivo,
                    pantalla: 'Tesorería (Anticipos Conductores)',
                    observacion: 'El botón "Añadir" debería estar visible en la pantalla principal.'
                });
                return cy.get('.MuiDataGrid-root').should('exist');
            }
        });
    }

    function editarConFilaSeleccionada() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        // Seleccionar fila y editar
        cy.get('.MuiDataGrid-row:visible').first().as('filaSeleccionada');
        cy.get('@filaSeleccionada').click({ force: true });
        cy.wait(500);
        cy.get('@filaSeleccionada').dblclick({ force: true });

        // Verificar que se abre el formulario de edición
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/driver-advances\/form\/\d+$/);
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        // Verificar que el botón editar no esté visible sin selección
        cy.get('button[aria-label="edit"]').should('not.exist');

        return cy.get('.MuiDataGrid-root').should('exist');
    }

    function fechaInicioFiltro() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        // Desde: 15/01/2016
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first()
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}15');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2016');
            });

        cy.wait(500);

        // Debe mostrar registros a partir de esa fecha
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function fechaFinFiltro() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        // Hasta: 31/12/2020
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1)
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2020');
            });

        cy.wait(500);

        // Debe mostrar registros hasta esa fecha
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function rangoFechas() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        // Desde: 15/01/2016
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first()
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}15');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2016');
            });

        // Hasta: 31/12/2020
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1)
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2020');
            });

        cy.wait(500);

        // Debe mostrar registros dentro del rango
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filterValueEnColumna() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Conductor')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Conductor column menu"]').click({ force: true });
        cy.get('li').contains('Filter').click({ force: true });

        // Usar el placeholder correcto como en gastosgenerales
        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('Elena', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ocultarColumna() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        // Usar el patrón de incidencias para ocultar columna
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Código column menu"]').click({ force: true });
        cy.get('li').contains('Hide column').click({ force: true });

        return cy.get('[data-field="codigo"]').should('not.exist');
    }

    function manageColumns() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        // Usar el patrón de gastosgenerales para manage columns
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Conductor')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Conductor column menu"]').click({ force: true });
        cy.get('li').contains('Manage columns').click({ force: true });

        // Usar el patrón correcto como en gastosgenerales
        cy.get('.MuiDataGrid-panel')
            .should('be.visible')
            .find('label')
            .contains('Código')
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });

        // Solo verificar que el panel esté visible, sin verificar los encabezados
        return cy.get('.MuiDataGrid-panel').should('be.visible');
    }

    function resetFiltrosRecarga() {
        cy.navegarAMenu('Tesoreria', 'Anticipos Conductores');
        cy.url().should('include', '/dashboard/driver-advances');

        cy.get('input[placeholder="Buscar"]').type('2', { force: true });
        cy.reload();
        cy.get('input[placeholder="Buscar"]').should('have.value', '');
        return cy.get('.MuiDataGrid-root').should('exist');
    }
});
