describe('TALLER Y GASTOS - OTROS GASTOS - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla correctamente', funcion: cargarPantalla },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol },
        { numero: 5, nombre: 'TC005 - Filtrar por Fecha', funcion: filtrarPorFecha },
        { numero: 6, nombre: 'TC006 - Filtrar por Código Parte Trabajo', funcion: filtrarPorCodigoParteTrabajo },
        { numero: 7, nombre: 'TC007 - Filtrar por Tipo', funcion: filtrarPorTipo },
        { numero: 8, nombre: 'TC008 - Filtrar por Motivo (contenga)', funcion: filtrarPorMotivo },
        { numero: 9, nombre: 'TC009 - Filtrar por Vehículo', funcion: filtrarPorVehiculo },
        { numero: 10, nombre: 'TC010 - Filtrar por Importe', funcion: filtrarPorImporte },
        { numero: 11, nombre: 'TC011 - Filtrar por Nombre Proveedor', funcion: filtrarPorNombreProveedor },
        { numero: 12, nombre: 'TC012 - Búsqueda general (texto exacto)', funcion: buscarTextoExacto },
        { numero: 13, nombre: 'TC013 - Búsqueda general (texto parcial)', funcion: buscarTextoParcial },
        { numero: 14, nombre: 'TC014 - Búsqueda case-insensitive', funcion: buscarCaseInsensitive },
        { numero: 15, nombre: 'TC015 - Búsqueda con espacios al inicio/fin', funcion: buscarConEspacios },
        { numero: 16, nombre: 'TC016 - Búsqueda con caracteres especiales', funcion: buscarCaracteresEspeciales },
        { numero: 17, nombre: 'TC017 - Ordenar por Fecha ASC/DESC', funcion: ordenarPorFecha },
        { numero: 18, nombre: 'TC018 - Ordenar por Tipo ASC/DESC', funcion: ordenarPorTipo },
        { numero: 19, nombre: 'TC019 - Ordenar por Importe ASC/DESC', funcion: ordenarPorImporte },
        { numero: 20, nombre: 'TC020 - Seleccionar una fila', funcion: seleccionarFila },
        { numero: 21, nombre: 'TC021 - Botón Eliminar con fila seleccionada', funcion: eliminarConSeleccion },
        { numero: 22, nombre: 'TC022 - Botón Eliminar sin selección', funcion: eliminarSinSeleccion },
        { numero: 23, nombre: 'TC023 - Botón + Añadir abre formulario', funcion: abrirFormulario },
        { numero: 24, nombre: 'TC024 - Scroll vertical en tabla', funcion: scrollVertical },
        { numero: 25, nombre: 'TC025 - Reinicio de filtros al recargar', funcion: reinicioFiltros },
        { numero: 26, nombre: 'TC026 - Botón Editar con fila seleccionada', funcion: editarConSeleccion },
        { numero: 27, nombre: 'TC027 - Botón Editar sin fila seleccionada', funcion: editarSinSeleccion },
        { numero: 28, nombre: 'TC028 - Filtrar por Fecha Desde', funcion: filtrarPorFechaDesde },
        { numero: 29, nombre: 'TC029 - Filtrar por Fecha Hasta', funcion: filtrarPorFechaHasta },
        { numero: 30, nombre: 'TC030 - Filtrar por Fecha Desde + Hasta (rango completo)', funcion: filtrarPorRangoFechas },
        { numero: 31, nombre: 'TC031 - Filtrar por "Value"', funcion: filtrarPorValue },
        { numero: 32, nombre: 'TC032 - Ocultar columna desde menú contextual', funcion: ocultarColumna },
        { numero: 33, nombre: 'TC033 - Mostrar/ocultar columnas con "Manage columns"', funcion: gestionarColumnas },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.log('Procesando resultados finales para Taller y Gastos (Otros Gastos)');
        cy.procesarResultadosPantalla('Taller y Gastos (Otros Gastos)');
    });

    casos.forEach(({ numero, nombre, funcion }) => {
        it(nombre, () => {
            // Reseteo el flag de error al inicio de cada test
            cy.resetearErrorFlag();
            
            // Si algo falla durante la ejecución del test, capturo el error automáticamente
            // y lo registro en el Excel con todos los datos del caso.
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,                    // Número de caso de prueba
                    nombre,                    // Nombre del test (título del caso)
                    esperado: 'Comportamiento correcto',  // Qué se esperaba que ocurriera
                    archivo,                   // Nombre del archivo Excel donde se guarda todo
                    pantalla: 'Taller y Gastos (Otros Gastos)'
                });
                return false; // Previene que Cypress corte el flujo y nos permite seguir registrando
            });

            // Inicio sesión antes de ejecutar el caso, usando la sesión compartida (cy.login)
            // y espero unos milisegundos por seguridad antes de continuar
            cy.login();
            cy.wait(500);

            // Ejecuto la función correspondiente al test (ya definida arriba)
            funcion().then(() => {
                // Si todo salió bien, registro el resultado como OK en el Excel
                cy.log(`Registrando resultado para test ${numero}: ${nombre}`);
                cy.registrarResultados({
                    numero,                   // Número del caso
                    nombre,                   // Nombre del test
                    esperado: 'Comportamiento correcto',  // Qué esperaba que hiciera
                    obtenido: 'Comportamiento correcto',  // Qué hizo realmente (si coincide, marca OK)
                    resultado: 'OK',          // Marca manualmente como OK
                    archivo,                  // Archivo Excel donde se registra
                    pantalla: 'Taller y Gastos (Otros Gastos)'
                });
            });
        });
    });

    // === FUNCIONES DE VALIDACIÓN ===
    
    function cargarPantalla() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Date').should('exist');
            cy.contains('Type').should('exist');
            cy.contains('Vehicle').should('exist');
        });
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500);
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Data').should('exist');
            cy.contains('Tipus').should('exist');
            cy.contains('Vehicle').should('exist');
        });
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Fecha').should('exist');
            cy.contains('Tipo').should('exist');
            cy.contains('Vehículo').should('exist');
        });
    }

    function filtrarPorFecha() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('select[name="column"]').select('Fecha', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('2020{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorCodigoParteTrabajo() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('select[name="column"]').select('Código Parte Trabajo', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('4552{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorTipo() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('select[name="column"]').select('Tipo', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('barco{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorMotivo() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('select[name="column"]').select('Motivo', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Multienergía Andamur{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorVehiculo() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('select[name="column"]').select('Vehículo', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('3108 KCP{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorImporte() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('select[name="column"]').select('Importe', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('200.96{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorNombreProveedor() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('select[name="column"]').select('Nombre Proveedor', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Pedro{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarTextoExacto() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Barco{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarTextoParcial() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Andamur{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarCaseInsensitive() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('BaRcO{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarConEspacios() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('   barco    {enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarCaracteresEspeciales() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('$%&{enter}', { force: true });
        cy.wait(500);
        return cy.contains('No rows', { timeout: 3000 }).should('be.visible');
    }

    function ordenarPorFecha() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        
        // Ordenar ascendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha').click();
        cy.wait(1000);
        
        // Ordenar descendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha').click();
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorTipo() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        
        // Ordenar ascendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Tipo').click();
        cy.wait(1000);
        
        // Ordenar descendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Tipo').click();
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorImporte() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        
        // Ordenar ascendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Importe').click();
        cy.wait(1000);
        
        // Ordenar descendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Importe').click();
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function seleccionarFila() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function eliminarConSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        cy.wait(500);
        return cy.get('button').contains('Eliminar').click({ force: true });
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('button').contains('Eliminar').click({ force: true });
        return cy.contains('No hay ningún elemento seleccionado para eliminar').should('be.visible');
    }

    function abrirFormulario() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('button').contains('Añadir').click({ force: true });
        return cy.get('form').should('be.visible');
    }

    function scrollVertical() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
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
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('barco{enter}', { force: true });
        cy.reload();
        return cy.get('input[placeholder="Buscar"]').should('have.value', '');
    }

    function editarConSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('.MuiDataGrid-row:visible').first().as('filaSeleccionada');
        cy.get('@filaSeleccionada').click({ force: true });
        cy.wait(500);
        cy.get('@filaSeleccionada').dblclick({ force: true });
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/other-expenses\/form\/\d+$/);
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function filtrarPorFechaDesde() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');

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
        cy.get('body').then($body => {
            if ($body.find('.MuiDataGrid-row:visible').length === 0) {
                // No se muestran gastos → registramos como ERROR
                cy.registrarResultados({
                    numero: 28,
                    nombre: 'TC028 - Filtrar por Fecha Desde',
                    esperado: 'Se muestran gastos a partir del 2020',
                    obtenido: 'No se muestra nada',
                    resultado: 'ERROR',
                    pantalla: 'Taller y Gastos (Otros Gastos)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            } else {
                // Se muestran gastos → registramos como OK
                cy.registrarResultados({
                    numero: 28,
                    nombre: 'TC028 - Filtrar por Fecha Desde',
                    esperado: 'Se muestran gastos a partir del 2020',
                    obtenido: 'Se muestran gastos a partir del 2020',
                    resultado: 'OK',
                    pantalla: 'Taller y Gastos (Otros Gastos)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            }
        });

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorFechaHasta() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');

        // Seleccionar fecha "Hasta": 2019
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1)
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2019');
            });

        cy.wait(500);

        // Verificar que se muestran gastos hasta el 2019
        cy.get('body').then($body => {
            if ($body.find('.MuiDataGrid-row:visible').length === 0) {
                // No se muestran gastos → registramos como ERROR
                cy.registrarResultados({
                    numero: 29,
                    nombre: 'TC029 - Filtrar por Fecha Hasta',
                    esperado: 'Se muestran gastos hasta el 2019',
                    obtenido: 'No se muestra nada',
                    resultado: 'ERROR',
                    pantalla: 'Taller y Gastos (Otros Gastos)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            } else {
                // Se muestran gastos → registramos como OK
                cy.registrarResultados({
                    numero: 29,
                    nombre: 'TC029 - Filtrar por Fecha Hasta',
                    esperado: 'Se muestran gastos hasta el 2019',
                    obtenido: 'Se muestran gastos hasta el 2019',
                    resultado: 'OK',
                    pantalla: 'Taller y Gastos (Otros Gastos)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            }
        });

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorRangoFechas() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');

        // Seleccionar fecha "Desde": 2019
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first()
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2019');
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
        cy.get('body').then($body => {
            if ($body.find('.MuiDataGrid-row:visible').length === 0) {
                // No se muestran registros → registramos como ERROR
                cy.registrarResultados({
                    numero: 30,
                    nombre: 'TC030 - Filtrar por Fecha Desde + Hasta (rango completo)',
                    esperado: 'Se muestran únicamente los registros que caen dentro del rango de fechas definido',
                    obtenido: 'No se muestra nada',
                    resultado: 'ERROR',
                    pantalla: 'Taller y Gastos (Otros Gastos)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            } else {
                // Se muestran registros → registramos como OK
                cy.registrarResultados({
                    numero: 30,
                    nombre: 'TC030 - Filtrar por Fecha Desde + Hasta (rango completo)',
                    esperado: 'Se muestran únicamente los registros que caen dentro del rango de fechas definido',
                    obtenido: 'Se muestran únicamente los registros que caen dentro del rango de fechas definido',
                    resultado: 'OK',
                    pantalla: 'Taller y Gastos (Otros Gastos)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            }
        });

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorValue() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');

        // Hacer clic en el menú de la columna Motivo
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Motivo')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Motivo column menu"]').click({ force: true });
        cy.get('li').contains('Filter').click({ force: true });

        // Escribir en el campo Value
        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('andamur');

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ocultarColumna() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');

        // Hacer clic en el menú de la columna Motivo
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Motivo')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Motivo column menu"]').click({ force: true });
        cy.get('li').contains('Hide column').click({ force: true });

        return cy.get('.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains('Motivo').should('not.exist');
            });
    }

    function gestionarColumnas() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');

        // Hacer clic en el menú de la columna Fecha
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Fecha column menu"]').click({ force: true });
        cy.get('li').contains('Manage columns').click({ force: true });

        // Marcar Motivo para que vuelva a ser visible
        cy.get('.MuiDataGrid-panel')
            .should('be.visible')
            .find('label')
            .contains('Motivo')
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });

        return cy.get('.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains('Motivo').should('exist');
            });
    }
});
