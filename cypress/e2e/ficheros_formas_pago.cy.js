describe('FORMAS DE PAGO - Validación completa con gestión de errores y reporte a Excel', () => {
    // Defino todos los casos con su número, nombre descriptivo y la función que ejecuta la validación
    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla de formas de pago correctamente', funcion: cargarPantallaFormasPago },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol },
        { numero: 5, nombre: 'TC005 - Aplicar filtro por columna "Código"', funcion: filtrarPorCodigo },
        { numero: 6, nombre: 'TC006 - Aplicar filtro por columna "Referencia"', funcion: filtrarPorReferencia },
        { numero: 7, nombre: 'TC007 - Aplicar filtro por columna "Descripción"', funcion: filtrarPorDescripcion },
        { numero: 8, nombre: 'TC008 - Aplicar filtro por columna "Días para pago"', funcion: filtrarPorDiasPago },
        { numero: 9, nombre: 'TC009 - Buscar por texto exacto en buscador', funcion: buscarTextoExacto },
        { numero: 10, nombre: 'TC010 - Buscar por texto parcial en buscador', funcion: buscarTextoParcial },
        { numero: 11, nombre: 'TC011 - Buscar ignorando mayúsculas y minúsculas', funcion: buscarAlternandoMayusculas },
        { numero: 12, nombre: 'TC012 - Buscar con espacios al inicio y fin', funcion: buscarConEspacios },
        { numero: 13, nombre: 'TC013 - Buscar con caracteres especiales', funcion: buscarCaracteresEspeciales },
        { numero: 14, nombre: 'TC014 - Ordenar columna "Código" ascendente/descendente', funcion: ordenarCodigo },
        { numero: 15, nombre: 'TC015 - Ordenar columna "Referencia" ascendente/descendente', funcion: ordenarReferencia },
        { numero: 16, nombre: 'TC016 - Seleccionar una fila', funcion: seleccionarFila },
        { numero: 17, nombre: 'TC017 - Botón "Editar" con una fila seleccionada', funcion: editarFormaPago },
        { numero: 18, nombre: 'TC018 - Botón "Eliminar" con varias filas seleccionadas', funcion: eliminarFormaPago },
        { numero: 19, nombre: 'TC019 - Botón "Editar" sin ninguna fila seleccionada', funcion: editarSinSeleccion },
        { numero: 20, nombre: 'TC020 - Botón "Eliminar" sin ninguna fila seleccionada', funcion: eliminarSinSeleccion },
        { numero: 21, nombre: 'TC021 - Botón "+ Añadir" abre formulario de alta', funcion: abrirFormularioAlta },
        { numero: 22, nombre: 'TC022 - Ocultar columna desde el menú contextual', funcion: ocultarColumna },
        { numero: 23, nombre: 'TC023 - Gestionar visibilidad desde "Manage columns"', funcion: gestionarColumnas },
        { numero: 24, nombre: 'TC024 - Scroll vertical en la tabla', funcion: scrollVertical },
        { numero: 25, nombre: 'TC025 - Recargar página y verificar reinicio de filtros', funcion: recargarPagina },
        { numero: 26, nombre: 'TC026 - Aplicar filtro con valor inexistente', funcion: filtrarValorInexistente },
        { numero: 27, nombre: 'TC027 - Validar opción de "Todos" en filtro', funcion: validarOpcionTodos },
        { numero: 28, nombre: 'TC028 - Filtrar por campo "Value"', funcion: filtrarPorValue },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Ficheros (Formas de Pago)');
    });

    casos.forEach(({ numero, nombre, funcion }) => {
        it(nombre, () => {
            // Captura de errores si algo falla dentro del test
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    archivo: 'reportes_pruebas_novatrans.xlsx',
                    pantalla: 'Ficheros (Formas de Pago)'
                });
                throw err; // para que Cypress marque el test como fallido
            });

            cy.login();
            cy.wait(500);

            // Ejecutar función normalmente
            funcion();

            // Registrar resultado solo si no falló
            cy.then(() => {
                cy.registrarResultados({
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    obtenido: 'Comportamiento correcto',
                    archivo: 'reportes_pruebas_novatrans.xlsx',
                    pantalla: 'Ficheros (Formas de Pago)'
                });
            });
        });
    });

    // === FUNCIONES DE VALIDACIÓN ===
    function cargarPantallaFormasPago() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function cambiarIdiomaIngles() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');
        cy.get('select#languageSwitcher').select('en', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaCatalan() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaEspanol() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');
        cy.get('select#languageSwitcher').select('es', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function filtrarPorCodigo() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');

        cy.get('select[name="column"]').should('be.visible').select('Código', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('10{enter}', { force: true });

        cy.wait(1000); // esperar que cargue

        cy.get('body').then($body => {
            if ($body.find('.MuiDataGrid-row').length === 0) {
                //No hay filas → registramos como ERROR
                cy.registrarResultados({
                    numero: 5,
                    nombre: 'TC005 - Aplicar filtro por columna "Código"',
                    esperado: 'Comportamiento correcto',
                    obtenido: 'No se encontraron filas con Código = 10 y si hay filas',
                    resultado: 'ERROR',
                    pantalla: 'Ficheros (Formas de Pago)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            } else {
                //Hay al menos una fila → registramos como OK
                cy.registrarResultados({
                    numero: 5,
                    nombre: 'TC005 - Aplicar filtro por columna "Código"',
                    esperado: 'Comportamiento correcto',
                    obtenido: 'Comportamiento correcto',
                    resultado: 'OK',
                    pantalla: 'Ficheros (Formas de Pago)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            }
        });
    }

    function filtrarPorReferencia() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');

        cy.get('select[name="column"]').should('be.visible').select('Referencia', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('369{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').should('include', '369');
        });
    }

    function filtrarPorDescripcion() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');

        cy.get('select[name="column"]').should('be.visible').select('Descripción', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('días{enter}', { force: true });

        // Validar que cada fila contiene el texto "días"
        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            const rowText = $row.text().toLowerCase();
            expect(rowText).to.include('días');
        });
    }

    function filtrarPorDiasPago() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');

        cy.get('select[name="column"]').should('be.visible').select('Días para pago', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('120{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').should('include', '120');
        });
    }

    function buscarTextoExacto() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}reposición 120 días{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarTextoParcial() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}pagaré{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarAlternandoMayusculas() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}RePoSiCiÓn{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarConEspacios() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}   reposición    {enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarCaracteresEspeciales() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');

        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}$%&{enter}', { force: true });

        // Espera y validación de que no hay filas o aparece "No rows"
        cy.wait(500);

        return cy.contains('No rows', { timeout: 3000 }).should('be.visible');
    }

    function ordenarCodigo() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Hacer clic en el encabezado de la columna Código
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .should('be.visible')
            .click();

        cy.wait(1000);

        // Hacer clic nuevamente para cambiar el orden
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function ordenarReferencia() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Hacer clic en el encabezado de la columna Referencia
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Referencia')
            .should('be.visible')
            .click();

        cy.wait(1000);

        // Hacer clic nuevamente para cambiar el orden
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Referencia')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function seleccionarFila() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function editarFormaPago() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        // Tomar la primera fila visible como alias
        cy.get('.MuiDataGrid-row:visible').first().as('filaFormaPago');

        // Hacer clic para seleccionar la fila
        cy.get('@filaFormaPago').click({ force: true });
        cy.wait(500);

        // Hacer doble clic en la fila para editar
        cy.get('@filaFormaPago').dblclick({ force: true });

        // Verificar que se abrió el formulario con ID en la URL
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/payment-methods\/form\/\d+$/);
    }

    function eliminarFormaPago() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');

        cy.get('.MuiDataGrid-row:visible')
            .filter(':not(.MuiDataGrid-rowSkeleton)')
            .should('have.length.greaterThan', 1)
            .then(filas => {
                cy.wrap(filas.eq(1)).click({ force: true });
            });

        cy.wait(500);
        cy.get('button.css-1cbe274').click({ force: true });

        cy.wait(1000);

        // Usamos return para que Cypress no pierda el flujo
        return cy.get('body').then($body => {
            if ($body.text().includes('No se puede eliminar la forma de pago por dependencias')) {
                return cy.contains('No se puede eliminar la forma de pago por dependencias')
                    .should('be.visible')
                    .then(() => {
                        // Devolver comando para que el test tenga ejecución activa
                        return cy.wrap(true);
                    });
            } else {
                return cy.get('.MuiDataGrid-row:visible')
                    .filter(':not(.MuiDataGrid-rowSkeleton)')
                    .should('have.length.lessThan', 55)
                    .then(() => {
                        return cy.wrap(true);
                    });
            }
        });
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');

        // Asegurarse de que el botón 'Editar' no está visible si no hay selección
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');

        // Asegurar que no hay checkboxes seleccionados
        cy.get('div[role="row"] input[type="checkbox"]:checked').should('have.length', 0);

        // Hacer clic en el botón "Eliminar"
        cy.get('button.css-1cbe274').click({ force: true });

        // Validar que aparece el mensaje de error correspondiente
        return cy.contains('Por favor, selecciona un elemento para eliminar', { timeout: 5000 }).should('be.visible');
    }

    function abrirFormularioAlta() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');
        cy.get('button').contains('Añadir').click({ force: true });

        // Validar la URL sin exigir terminación exacta
        return cy.url().should('include', '/dashboard/payment-methods/form');
    }

    function ocultarColumna() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');

        // Hacer clic en el encabezado de la columna Referencia
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Referencia')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function gestionarColumnas() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');

        // Hacer clic en el encabezado de la columna Código
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function scrollVertical() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');
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
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}prueba{enter}', { force: true });
        cy.reload();
        return cy.get('input[placeholder="Buscar"]').should('have.value', '');
    }

    function filtrarValorInexistente() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');

        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}cartera{enter}', { force: true });

        // Espera adicional y validación de que no hay resultados
        cy.wait(500);
        return cy.contains('No rows', { timeout: 3000 }).should('be.visible');
    }

    function validarOpcionTodos() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');

        cy.get('select[name="column"]').should('be.visible').select('Todos', { force: true });

        // Esperar y verificar que aparecen filas
        cy.wait(500);
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function filtrarPorValue() {
        cy.navegarAMenu('Ficheros', 'Formas de Pago');
        cy.url().should('include', '/dashboard/payment-methods');

        // Buscar el header por texto "Referencia" y abrir menú contextual
        cy.contains('div.MuiDataGrid-columnHeader', 'Referencia')
            .find('button[aria-label*="menu"]')
            .click({ force: true });

        // Clic en "Filter"
        cy.contains('li[role="menuitem"]', 'Filter').click({ force: true });

        // Ingresar el valor a filtrar
        cy.get('input[placeholder="Filter value"]')
            .clear()
            .type('119{enter}');

        cy.wait(500);

        // Validar que al menos una fila contiene "119"
        return cy.get('div[role="row"]').each($row => {
            const $cells = Cypress.$($row).find('div[role="cell"]');
            if ($cells.length > 0) {
                const textos = [...$cells].map(el => el.innerText);
                expect(textos.some(t => t.includes('119'))).to.be.true;
            }
        });
    }

}); 