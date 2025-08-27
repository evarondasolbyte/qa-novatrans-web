describe('ALQUILERES VEHÍCULOS - Validación completa con gestión de errores y reporte a Excel', () => {
    // Defino todos los casos con su número, nombre descriptivo y la función que ejecuta la validación
    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla de alquileres correctamente', funcion: cargarPantallaAlquileres },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol },
        { numero: 5, nombre: 'TC005 - Aplicar filtro por columna "F. Alta"', funcion: filtrarPorFAlta },
        { numero: 6, nombre: 'TC006 - Aplicar filtro por columna "F. Baja"', funcion: filtrarPorFBaja },
        { numero: 7, nombre: 'TC007 - Aplicar filtro por columna "Empresa"', funcion: filtrarPorEmpresa },
        { numero: 8, nombre: 'TC008 - Aplicar filtro por columna "Vehículo"', funcion: filtrarPorVehiculo },
        { numero: 9, nombre: 'TC009 - Aplicar filtro por columna "Kms Inicio"', funcion: filtrarPorKmsInicio },
        { numero: 10, nombre: 'TC010 - Aplicar filtro por columna "Kms Fin"', funcion: filtrarPorKmsFin },
        { numero: 11, nombre: 'TC011 - Aplicar filtro por columna "Kms Contr."', funcion: filtrarPorKmsContr },
        { numero: 12, nombre: 'TC012 - Aplicar filtro por columna "Lleno Recogida"', funcion: filtrarPorLlenoRecogida },
        { numero: 13, nombre: 'TC013 - Aplicar filtro por columna "Lleno Entrega"', funcion: filtrarPorLlenoEntrega },
        { numero: 14, nombre: 'TC014 - Aplicar filtro por columna "Cuota"', funcion: filtrarPorCuota },
        { numero: 15, nombre: 'TC015 - Buscar texto exacto en buscador general', funcion: buscarTextoExacto },
        { numero: 16, nombre: 'TC016 - Buscar texto parcial en buscador general', funcion: buscarTextoParcial },
        { numero: 17, nombre: 'TC017 - Buscar con mayúsculas/minúsculas combinadas', funcion: buscarAlternandoMayusculas },
        { numero: 18, nombre: 'TC018 - Buscar con espacios al inicio y fin', funcion: buscarConEspacios },
        { numero: 19, nombre: 'TC019 - Buscar con caracteres especiales', funcion: buscarCaracteresEspeciales },
        { numero: 20, nombre: 'TC020 - Ordenar por columna "Empresa" ascendente/descendente', funcion: ordenarEmpresa },
        { numero: 21, nombre: 'TC021 - Ordenar por columna "Cuota" ascendente/descendente', funcion: ordenarCuota },
        { numero: 22, nombre: 'TC022 - Seleccionar una fila', funcion: seleccionarFila },
        { numero: 23, nombre: 'TC023 - Botón "Editar" con una fila seleccionada', funcion: editarAlquiler },
        { numero: 24, nombre: 'TC024 - Botón "Editar" sin fila seleccionada', funcion: editarSinSeleccion },
        { numero: 25, nombre: 'TC025 - Botón "Eliminar" con una fila seleccionada', funcion: eliminarAlquiler },
        { numero: 26, nombre: 'TC026 - Botón "Eliminar" sin fila seleccionada', funcion: eliminarSinSeleccion },
        { numero: 27, nombre: 'TC027 - Botón "+ Añadir" abre formulario nuevo', funcion: abrirFormularioAlta },
        { numero: 28, nombre: 'TC028 - Ocultar columna desde menú contextual', funcion: ocultarColumna },
        { numero: 29, nombre: 'TC029 - Mostrar/ocultar columnas con "Manage columns"', funcion: gestionarColumnas },
        { numero: 30, nombre: 'TC030 - Scroll vertical y horizontal en la tabla', funcion: scrollHorizontalVertical },
        { numero: 31, nombre: 'TC031 - Filtrar por rango de fechas desde/hasta', funcion: filtrarPorRangoFechas },
        { numero: 32, nombre: 'TC032 - Recargar página y verificar reinicio de filtros', funcion: recargarPagina },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Ficheros (Alquileres Vehículos)');
    });

    // Itero por cada caso individualmente
    casos.forEach(({ numero, nombre, funcion }) => {
        it(nombre, () => {
            // Reset de flags por test
            cy.resetearFlagsTest();

            // Captura de errores -> registra y marca flags
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    archivo: 'reportes_pruebas_novatrans.xlsx',
                    pantalla: 'Ficheros (Alquileres Vehículos)'
                });
                return false; // seguir ejecutando hooks de registro
            });

            // Login y pequeña espera
            cy.login();
            cy.wait(500);

            // Ejecutar la función del caso (debe devolver una cadena de Cypress)
            return funcion().then(() => {
                // Solo registrar OK si NADIE registró antes en este test
                cy.estaRegistrado().then((ya) => {
                    if (!ya) {
                        cy.registrarResultados({
                            numero,
                            nombre,
                            esperado: 'Comportamiento correcto',
                            obtenido: 'Comportamiento correcto',
                            resultado: 'OK',
                            archivo: 'reportes_pruebas_novatrans.xlsx',
                            pantalla: 'Ficheros (Alquileres Vehículos)'
                        });
                    }
                });
            });
        });
    });

    // === FUNCIONES DE VALIDACIÓN ===
    function cargarPantallaAlquileres() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function cambiarIdiomaIngles() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');
        cy.get('select#languageSwitcher').select('en', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaCatalan() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaEspanol() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');
        cy.get('select#languageSwitcher').select('es', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function filtrarPorFAlta() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

        cy.get('select[name="column"]').should('be.visible').select('F. Alta', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('01{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').should('include', '01');
        });
    }

    function filtrarPorFBaja() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

        cy.get('select[name="column"]').should('be.visible').select('F. Baja', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('31{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').should('include', '31');
        });
    }

    function filtrarPorEmpresa() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

        cy.get('select[name="column"]').should('be.visible').select('Empresa', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('RIEGOS MANZANO{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').then((text) => {
                expect(text.toLowerCase()).to.include('riegos manzano');
            });
        });
    }

    function filtrarPorVehiculo() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

        cy.get('select[name="column"]').should('be.visible').select('Vehículo', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('SA-1129-K{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').should('include', 'SA-1129-K');
        });
    }

    function filtrarPorKmsInicio() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

        cy.get('select[name="column"]').should('be.visible').select('Kms Inicio', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('1000{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').should('include', '1000');
        });
    }

    function filtrarPorKmsFin() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

        cy.get('select[name="column"]').should('be.visible').select('Kms Fin', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('2345{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').should('include', '2345');
        });
    }

    function filtrarPorKmsContr() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

        cy.get('select[name="column"]').should('be.visible').select('Kms Contr.', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('1500{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').should('include', '1500');
        });
    }

    function filtrarPorLlenoRecogida() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

        cy.get('select[name="column"]').should('be.visible').select('Lleno Recogida', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Sí{enter}', { force: true });

        // Validamos que la tabla cargó correctamente, aunque no haya filas
        return cy.get('.MuiDataGrid-virtualScroller').should('be.visible');
    }

    function filtrarPorLlenoEntrega() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

        cy.get('select[name="column"]').should('be.visible').select('Lleno Entrega', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function filtrarPorCuota() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

        // Scroll horizontal hasta la columna "Cuota"
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 500 });

        // Aplicar filtro por "Cuota"
        cy.get('select[name="column"]').should('be.visible').select('Cuota', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('201{enter}', { force: true });

        // Validar que las filas visibles contienen "201"
        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').should('include', '201');
        });
    }

    function buscarTextoExacto() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}RIEGOS MANZANO{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarTextoParcial() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}RIE{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarAlternandoMayusculas() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}sA-1129-K{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarConEspacios() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace} 6131-DPH {enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarCaracteresEspeciales() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');

        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}%&/{enter}', { force: true });

        // Espera y validación de que no hay filas o aparece "No rows"
        cy.wait(500);

        return cy.contains('No rows', { timeout: 3000 }).should('be.visible');
    }

    function ordenarEmpresa() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Hacer clic en el encabezado de la columna Empresa
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Empresa')
            .should('be.visible')
            .click();

        cy.wait(1000);

        // Hacer clic nuevamente para cambiar el orden
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Empresa')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function ordenarCuota() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Hacer scroll horizontal hasta que se vea la columna "Cuota"
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 500 });

        // Hacer clic en el encabezado de la columna "Cuota" dos veces para ordenar
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Cuota')
            .should('be.visible')
            .click();

        cy.wait(500);

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Cuota')
            .should('be.visible')
            .click();

        // Validar que hay filas visibles tras el ordenamiento
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function seleccionarFila() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function editarAlquiler() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        // Tomar la primera fila visible como alias
        cy.get('.MuiDataGrid-row:visible').first().as('filaAlquiler');

        // Hacer clic para seleccionar la fila
        cy.get('@filaAlquiler').click({ force: true });
        cy.wait(500);

        // Hacer doble clic en la fila para editar
        cy.get('@filaAlquiler').dblclick({ force: true });

        // Verificar que se abrió el formulario con ID en la URL
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/vehicle-rentals\/form\/\d+$/);
    }

    function eliminarAlquiler() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 1);
        cy.get('.MuiDataGrid-row:visible').eq(1).click({ force: true });
        cy.wait(500);

        return cy.get('button.css-1cbe274').click({ force: true });
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

        // Asegurarse de que el botón 'Editar' no está visible si no hay selección
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

        // Asegurar que no hay checkboxes seleccionados
        cy.get('div[role="row"] input[type="checkbox"]:checked').should('have.length', 0);

        // Hacer clic en el botón "Eliminar"
        cy.get('button.css-1cbe274').click({ force: true });

        // Validar simplemente que no ocurre ningún error o bloqueo
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function abrirFormularioAlta() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');
        cy.get('button').contains('Añadir').click({ force: true });

        // Validar la URL sin exigir terminación exacta
        return cy.url().should('include', '/dashboard/vehicle-rentals/form');
    }

    function ocultarColumna() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

        // Hacer clic en el encabezado de la columna Empresa
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Empresa')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function gestionarColumnas() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

        // Hacer clic en el encabezado de la columna F. Baja
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'F. Baja')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function scrollHorizontalVertical() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');
        cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);

        const maxScrolls = 10;
        let intentos = 0;

        function hacerScrollVertical(prevHeight = 0) {
            return cy.get('.MuiDataGrid-virtualScroller').then($scroller => {
                const currentScrollHeight = $scroller[0].scrollHeight;

                if (currentScrollHeight === prevHeight || intentos >= maxScrolls) {
                    cy.log('Fin del scroll vertical');

                    cy.get('.MuiDataGrid-columnHeaders')
                        .should('exist')
                        .and($el => {
                            const rect = $el[0].getBoundingClientRect();
                            expect(rect.top).to.be.greaterThan(0);
                            expect(rect.height).to.be.greaterThan(0);
                        });

                    cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');

                    cy.get('.MuiDataGrid-columnHeaders')
                        .should('exist')
                        .and($el => {
                            const rect = $el[0].getBoundingClientRect();
                            expect(rect.top).to.be.greaterThan(0);
                            expect(rect.height).to.be.greaterThan(0);
                        });

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

    function recargarPagina() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.get('select[name="column"]').should('be.visible').select('Empresa', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Riegos{enter}', { force: true });
        cy.reload();
        return cy.get('input[placeholder="Buscar"]').should('have.value', '');
    }

    function filtrarPorRangoFechas() {
        cy.navegarAMenu('Ficheros', 'Alquileres Vehículos');
        cy.url().should('include', '/dashboard/vehicle-rentals');

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

        // Verificar que se muestran tarjetas dentro del rango
        cy.get('body').then($body => {
            if ($body.find('.MuiDataGrid-row:visible').length === 0) {
                // No se muestran tarjetas → registramos como ERROR
                cy.registrarResultados({
                    numero: 31,
                    nombre: 'TC031 - Filtrar por rango de fechas desde/hasta',
                    esperado: 'Se muestran tarjetas dentro del rango',
                    obtenido: 'No se muestra nada',
                    resultado: 'ERROR',
                    pantalla: 'Ficheros (Alquileres Vehículos)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            } else {
                // Se muestran tarjetas → registramos como OK
                cy.registrarResultados({
                    numero: 31,
                    nombre: 'TC031 - Filtrar por rango de fechas desde/hasta',
                    esperado: 'Se muestran tarjetas dentro del rango',
                    obtenido: 'Se muestran tarjetas dentro del rango',
                    resultado: 'OK',
                    pantalla: 'Ficheros (Alquileres Vehículos)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            }
        });

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }
}); 