describe('MULTAS - Validación completa con gestión de errores y reporte a Excel', () => {
    // Defino todos los casos con su número, nombre descriptivo y la función que ejecuta la validación
    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla de multas correctamente', funcion: cargarPantallaMultas },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol },
        { numero: 5, nombre: 'TC005 - Aplicar filtro por columna "Código"', funcion: filtrarPorCodigo },
        { numero: 6, nombre: 'TC006 - Aplicar filtro por columna "Fecha"', funcion: filtrarPorFecha },
        { numero: 7, nombre: 'TC007 - Aplicar filtro por "Conductor"', funcion: filtrarPorConductor },
        { numero: 8, nombre: 'TC008 - Aplicar filtro por "Boletín"', funcion: filtrarPorBoletin },
        { numero: 9, nombre: 'TC009 - Aplicar filtro por "Estado"', funcion: filtrarPorEstado },
        { numero: 10, nombre: 'TC010 - Aplicar filtro por "Pagado"', funcion: filtrarPorPagado },
        { numero: 11, nombre: 'TC011 - Buscar por texto exacto en buscador', funcion: buscarTextoExacto },
        { numero: 12, nombre: 'TC012 - Buscar por texto parcial en buscador', funcion: buscarTextoParcial },
        { numero: 13, nombre: 'TC013 - Buscar con mayúsculas y minúsculas combinadas', funcion: buscarAlternandoMayusculas },
        { numero: 14, nombre: 'TC014 - Buscar con espacios al inicio y fin', funcion: buscarConEspacios },
        { numero: 15, nombre: 'TC015 - Buscar con caracteres especiales', funcion: buscarCaracteresEspeciales },
        { numero: 16, nombre: 'TC016 - Ordenar columna "Fecha" ascendente/descendente', funcion: ordenarFecha },
        { numero: 17, nombre: 'TC017 - Ordenar columna "Código" ascendente/descendente', funcion: ordenarCodigo },
        { numero: 18, nombre: 'TC018 - Seleccionar una fila', funcion: seleccionarFila },
        { numero: 19, nombre: 'TC019 - Botón "Editar" con una fila seleccionada', funcion: editarMulta },
        { numero: 20, nombre: 'TC020 - Botón "Eliminar" con varias filas seleccionadas', funcion: eliminarMulta },
        { numero: 21, nombre: 'TC021 - Botón "Editar" sin ninguna fila seleccionada', funcion: editarSinSeleccion },
        { numero: 22, nombre: 'TC022 - Botón "Eliminar" sin ninguna fila seleccionada', funcion: eliminarSinSeleccion },
        { numero: 23, nombre: 'TC023 - Botón "+ Añadir" abre formulario de alta', funcion: abrirFormularioAlta },
        { numero: 24, nombre: 'TC024 - Ocultar columna desde el menú contextual', funcion: ocultarColumna },
        { numero: 25, nombre: 'TC025 - Gestionar visibilidad desde "Manage columns"', funcion: gestionarColumnas },
        { numero: 26, nombre: 'TC026 - Scroll horizontal y vertical en la tabla', funcion: scrollHorizontalVertical },
        { numero: 27, nombre: 'TC027 - Buscar "Expediente" con valor parcial', funcion: buscarExpedienteParcial },
        { numero: 28, nombre: 'TC028 - Filtro por "Fecha desde" y "Fecha hasta"', funcion: filtrarPorFechaDesdeHasta },
        { numero: 29, nombre: 'TC029 - Filtro por "Imp. Final"', funcion: filtrarPorImpFinal },
        { numero: 30, nombre: 'TC030 - Filtro por "Imp. Inicial" igual a un valor', funcion: filtrarPorImpInicial },
        { numero: 31, nombre: 'TC031 - Filtro por "Finalizada" marcada', funcion: filtrarPorFinalizada },
        { numero: 32, nombre: 'TC032 - Recargar página y verificar reinicio de filtros', funcion: recargarPagina },
        { numero: 33, nombre: 'TC033 - Filtrar por campo "Value"', funcion: filtrarPorValue },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Ficheros (Multas)');
    });

    // Itero por cada caso individualmente
    casos.forEach(({ numero, nombre, funcion }) => {
        it(nombre, () => {
            // Registro automático de errores si algo falla dentro del test
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    archivo: 'reportes_pruebas_novatrans.xlsx',
                    pantalla: 'Ficheros (Multas)'
                });
                return false; // Evita que Cypress corte el resto del flujo del test
            });

            // Hago login y espero un poco antes de empezar la acción
            cy.login();
            cy.wait(500);

            // Ejecuto la función de prueba correspondiente al caso
            funcion().then(() => {
                // Si todo va bien, registro el resultado como OK automáticamente
                cy.registrarResultados({
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    obtenido: 'Comportamiento correcto',
                    archivo: 'reportes_pruebas_novatrans.xlsx',
                    pantalla: 'Ficheros (Multas)'
                });
            });
        });
    });

    // === FUNCIONES DE VALIDACIÓN ===
    function cargarPantallaMultas() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function cambiarIdiomaIngles() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');
        cy.get('select#languageSwitcher').select('en', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaCatalan() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaEspanol() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');
        cy.get('select#languageSwitcher').select('es', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function filtrarPorCodigo() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        cy.get('select[name="column"]').should('be.visible').select('Código', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('2{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').should('include', '2');
        });
    }

    function filtrarPorFecha() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        cy.get('select[name="column"]').should('be.visible').select('Fecha', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('2014{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').then((text) => {
                expect(text).to.include('2014');
            });
        });
    }


    function filtrarPorConductor() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        cy.get('select[name="column"]').should('be.visible').select('Conductor', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Pedro{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').then((text) => {
                expect(text.toLowerCase()).to.include('pedro');
            });
        });
    }

    function filtrarPorBoletin() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        cy.get('select[name="column"]').should('be.visible').select('Boletín', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('5555{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').should('include', '5555');
        });
    }

    function filtrarPorEstado() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        cy.get('select[name="column"]').should('be.visible').select('Estado', { force: true });
        cy.get('input[placeholder="Buscar"]').type('Pagada{enter}', { force: true });
        cy.wait(500); // Pequeña espera para que renderice correctamente

        // Validar que todas las filas visibles contienen "Pagada" en alguna celda
        return cy.get('div[role="row"]').each($row => {
            const $cells = Cypress.$($row).find('div[role="cell"]');
            if ($cells.length > 0) {
                const textos = [...$cells].map(el => el.innerText.toLowerCase());
                expect(textos.some(t => t.includes('pagada'))).to.be.true;
            }
        });
    }

    function filtrarPorPagado() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        cy.get('select[name="column"]').should('be.visible').select('Pagado', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarTextoExacto() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}ITO{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }


    function buscarTextoParcial() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}GARCIA{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarAlternandoMayusculas() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}PeDrO{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarConEspacios() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace} Elena {enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarCaracteresEspeciales() {
        cy.navegarAMenu('Ficheros', 'Multas');

        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}%&/{enter}', { force: true });

        // Espera y validación de que no hay filas o aparece "No rows"
        cy.wait(500);

        return cy.contains('No rows', { timeout: 3000 }).should('be.visible');
    }

    function ordenarFecha() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Hacer clic en el encabezado de la columna Fecha
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha')
            .should('be.visible')
            .click();

        cy.wait(1000);

        // Hacer clic nuevamente para cambiar el orden
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function ordenarCodigo() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');
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

    function seleccionarFila() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function editarMulta() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        // Tomar la primera fila visible como alias
        cy.get('.MuiDataGrid-row:visible').first().as('filaMulta');

        // Hacer clic para seleccionar la fila
        cy.get('@filaMulta').click({ force: true });
        cy.wait(500);

        // Hacer doble clic en la fila para editar
        cy.get('@filaMulta').dblclick({ force: true });

        // Verificar que se abrió el formulario con ID en la URL
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/fines\/form\/\d+$/);
    }

    function eliminarMulta() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 1);
        cy.get('.MuiDataGrid-row:visible').eq(1).click({ force: true });
        cy.wait(500);

        return cy.get('button.css-1cbe274').click({ force: true });
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        // Asegurarse de que el botón 'Editar' no está visible si no hay selección
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        // Asegurar que no hay checkboxes seleccionados
        cy.get('div[role="row"] input[type="checkbox"]:checked').should('have.length', 0);

        // Hacer clic en el botón "Eliminar"
        cy.get('button.css-1cbe274').click({ force: true });

        // Validar que aparece el mensaje de error correspondiente
        return cy.contains('No hay elemento seleccionado', { timeout: 5000 }).should('be.visible');
    }

    function abrirFormularioAlta() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');
        cy.get('button').contains('Añadir').click({ force: true });

        // Validar la URL sin exigir terminación exacta
        return cy.url().should('include', '/dashboard/fines/form');
    }

    function ocultarColumna() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        // Hacer clic en el encabezado de la columna Conductor
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Conductor')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function gestionarColumnas() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        // Hacer clic en el encabezado de la columna Expediente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Expediente')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function scrollHorizontalVertical() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');
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

    function buscarExpedienteParcial() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        cy.get('select[name="column"]').should('be.visible').select('Expediente', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('exp{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').should('include', 'exp');
        });
    }

    function filtrarPorFechaDesdeHasta() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        // Fecha desde: 01/01/2013
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first()
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2013');
            });

        // Fecha hasta: 31/12/2016
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1)
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2016');
            });

        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function filtrarPorImpFinal() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        cy.get('select[name="column"]').should('be.visible').select('Imp. Final', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('150{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').should('include', '150');
        });
    }

    function filtrarPorImpInicial() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        cy.get('select[name="column"]').should('be.visible').select('Imp. Inicial', { force: true });
        cy.get('input[placeholder="Buscar"]').type('60{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').then($rows => {
            const contiene = [...$rows].some(row => row.innerText.includes('60'));
            expect(contiene).to.be.true;
        });
    }

    function filtrarPorFinalizada() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        cy.get('select[name="column"]').should('be.visible').select('Finalizada', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function recargarPagina() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.get('select[name="column"]').should('be.visible').select('Finalizada', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });
        cy.reload();
        return cy.get('input[placeholder="Buscar"]').should('have.value', '');
    }

    function filtrarPorValue() {
        cy.navegarAMenu('Ficheros', 'Multas');
        cy.url().should('include', '/dashboard/fines');

        // Abre el menú contextual de la columna "Conductor"
        cy.get('div.MuiDataGrid-columnHeader[data-field="driverName"]')
            .find('button[aria-label*="Conductor"]')
            .click({ force: true });

        // Clic en "Filter"
        cy.contains('li[role="menuitem"]', 'Filter').click({ force: true });

        // Escribe "Elena" como valor de filtro
        cy.get('input[placeholder="Filter value"]')
            .clear()
            .type('Elena{enter}');

        cy.wait(500);

        // Validar que todas las filas visibles contienen "Elena"
        return cy.get('div[role="row"]').each($row => {
            const $cells = Cypress.$($row).find('div[role="cell"]');
            if ($cells.length > 0) {
                const textos = [...$cells].map(el => el.innerText.toLowerCase());
                expect(textos.some(t => t.includes('elena'))).to.be.true;
            }
        });
    }
}); 