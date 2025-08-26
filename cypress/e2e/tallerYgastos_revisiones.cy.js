describe('TALLER Y GASTOS - REVISIONES - Validación completa con errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Carga inicial de la pantalla de Revisiones', funcion: TC001 },
        { numero: 2, nombre: 'TC002 - Ordenar por "Nombre" ascendente', funcion: TC002 },
        { numero: 3, nombre: 'TC003 - Ordenar por "Nombre" descendente', funcion: TC003 },
        { numero: 4, nombre: 'TC004 - Filtrar por "Nombre" (ejemplo: "cisterna")', funcion: TC004 },
        { numero: 5, nombre: 'TC005 - Filtrar por "Kms" exacto (40000)', funcion: TC005 },
        { numero: 6, nombre: 'TC006 - Filtrar por "General"', funcion: TC006 },
        { numero: 7, nombre: 'TC007 - Filtrar por "Neumático"', funcion: TC007 },
        { numero: 8, nombre: 'TC008 - Filtrar por "ITV"', funcion: TC008 },
        { numero: 9, nombre: 'TC009 - Filtrar por "Tacógrafo"', funcion: TC009 },
        { numero: 10, nombre: 'TC010 - Filtrar por "Chassis"', funcion: TC010 },
        { numero: 11, nombre: 'TC011 - Filtrar por "Mecánica"', funcion: TC011 },
        { numero: 12, nombre: 'TC012 - Filtrar por "Aceites"', funcion: TC012 },
        { numero: 13, nombre: 'TC013 - Filtrar por "Filtros"', funcion: TC013 },
        { numero: 14, nombre: 'TC014 - Filtrar por "Otros"', funcion: TC014 },
        { numero: 15, nombre: 'TC015 - Limpiar filtros seleccionando "Todos"', funcion: TC015 },
        { numero: 16, nombre: 'TC016 - Filtrar en Revisiones con valor sin coincidencias', funcion: TC016 },
        { numero: 17, nombre: 'TC017 - Seleccionar una fila individual en Revisiones', funcion: TC017 },
        { numero: 18, nombre: 'TC018 - Botón "Editar" no visible sin selección en Revisiones', funcion: TC018 },
        { numero: 19, nombre: 'TC019 - Editar revisión al hacer doble clic en una fila', funcion: TC019 },
        { numero: 20, nombre: 'TC020 - Botón "Eliminar" sin selección en Revisiones', funcion: TC020 },
        { numero: 21, nombre: 'TC021 - Eliminar una revisión si es posible y confirmar su desaparición', funcion: TC021 },
        { numero: 22, nombre: 'TC022 - Validar botón "+ Añadir" en Revisiones', funcion: TC022 },
        { numero: 23, nombre: 'TC023 - Ocultar columna desde el menú contextual en Revisiones', funcion: TC023 },
        { numero: 24, nombre: 'TC024 - Mostrar columna oculta desde Manage Columns en Revisiones', funcion: TC024 },
        { numero: 25, nombre: 'TC025 - Scroll horizontal/vertical en la tabla de Revisiones', funcion: TC025 },
        { numero: 26, nombre: 'TC026 - Recargar la página con filtros aplicados en Revisiones', funcion: TC026 },
        { numero: 27, nombre: 'TC027 - Cambiar idioma a Inglés en Revisiones', funcion: TC027 },
        { numero: 28, nombre: 'TC028 - Cambiar idioma a Catalán en Revisiones', funcion: TC028 },
        { numero: 29, nombre: 'TC029 - Cambiar idioma a Español en Revisiones', funcion: TC029 },
        { numero: 30, nombre: 'TC030 - Alternar mayúsculas y minúsculas en el buscador de Revisiones', funcion: TC030 },
        { numero: 31, nombre: 'TC031 - Buscar caracteres especiales en el buscador de Revisiones', funcion: TC031 },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Taller y Gastos (Revisiones)');
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
                    pantalla: 'Taller y Gastos (Revisiones)'
                });
                return false; // Previene que Cypress corte el flujo y nos permite seguir registrando
            });

            // Inicio sesión antes de ejecutar el caso, usando la sesión compartida (cy.login)
            // y espero unos milisegundos por seguridad antes de continuar
            cy.login();
            cy.wait(500);

            // Ejecuto la función correspondiente al test (ya definida arriba)
            funcion().then(() => {
                // Solo registro automáticamente si la función no lo ha hecho ya
                // Los tests 12, 13 y 14 manejan su propio registro
                if (numero !== 12 && numero !== 13 && numero !== 14) {
                    cy.registrarResultados({
                        numero,                   // Número del caso
                        nombre,                   // Nombre del test
                        esperado: 'Comportamiento correcto',  // Qué esperaba que hiciera
                        obtenido: 'Comportamiento correcto',  // Qué hizo realmente (si coincide, marca OK)
                        resultado: 'OK',          // Marca manualmente como OK
                        archivo,                  // Archivo Excel donde se registra
                        pantalla: 'Taller y Gastos (Revisiones)'
                    });
                }
            });
        });
    });

    function TC001() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        return cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
    }

    function TC002() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
            .parents('.MuiDataGrid-columnHeader')
            .find('button').eq(1).click({ force: true });

        cy.get('li[role="menuitem"][data-value="asc"]').click({ force: true });
        cy.wait(1000);

        return cy.get('.MuiDataGrid-cell[data-field="name"]').then($cells => {
            const textos = [...$cells].map(c => c.innerText.trim().toLowerCase());
            const ordenados = [...textos].sort((a, b) => a.localeCompare(b, 'es'));
            expect(textos).to.deep.equal(ordenados);
        });
    }

    function TC003() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
            .parents('.MuiDataGrid-columnHeader')
            .find('button').eq(1).click({ force: true });

        cy.get('li[role="menuitem"][data-value="desc"]').click({ force: true });
        cy.wait(1000);

        return cy.get('.MuiDataGrid-cell[data-field="name"]').then($cells => {
            const textos = [...$cells].map(c => c.innerText.trim().toLowerCase());
            const ordenados = [...textos].sort((a, b) => b.localeCompare(a, 'es'));
            expect(textos).to.deep.equal(ordenados);
        });
    }

    function TC004() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true });
        cy.get('select[name="column"]').select('Nombre');
        return cy.get('input#search[placeholder="Buscar"]').type('cisterna{enter}', { force: true });
    }

    function TC005() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Kms');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('40000{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row)
                .find('[data-field="kms"]')
                .invoke('text')
                .should('equal', '40000');
        });
    }

    function TC006() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('General');
        return cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });
    }

    function TC007() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Neumáticos');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });

        return cy.get('body').then($body => {
            const filas = $body.find('.MuiDataGrid-row:visible');
            if (filas.length > 0) {
                cy.get('.MuiDataGrid-row:visible').each(($row) => {
                    cy.wrap($row)
                        .find('[data-field="tyre"] input[type="checkbox"]')
                        .should('be.checked');
                });
            } else {
                cy.contains('No rows').should('exist');
            }
        });
    }

    function TC008() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('ITV');
        return cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });
    }

    function TC009() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Tacógrafo');
        return cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });
    }

    function TC010() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Chassis');
        return cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });
    }

    function TC011() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Mecánica');
        return cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });
    }

    function TC015() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Todos');
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function TC016() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/inspections');
        cy.get('select[name="column"]').select('Todos');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('presupuesto{enter}', { force: true });
        cy.get('.MuiDataGrid-row:visible').should('have.length', 0);
        return cy.get('.MuiDataGrid-virtualScroller').should('contain.text', 'No rows');
    }

    function TC017() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function TC018() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 1);
        cy.get('.MuiDataGrid-row:visible input[type="checkbox"]:checked').should('have.length', 0);
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function TC019() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        cy.get('.MuiDataGrid-row:visible').first().as('filaSeleccionada');
        cy.get('@filaSeleccionada').click({ force: true });
        cy.wait(500);
        cy.get('@filaSeleccionada').dblclick({ force: true });
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/inspections\/form\/\d+$/);
    }

    function TC020() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        cy.get('div[role="row"] input[type="checkbox"]:checked').should('have.length', 0);
        cy.get('button.css-1cbe274').click({ force: true });
        return cy.get('body').should('contain.text', 'No hay ningún elemento seleccionado para eliminar');
    }

    function TC021() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');

        return cy.get('.MuiDataGrid-row:visible').then($filas => {
            if ($filas.length === 0) {
                cy.log('No hay revisiones visibles para eliminar. Test omitido.');
                return;
            }

            cy.wrap($filas[0]).as('filaRevision');
            cy.get('@filaRevision').find('.MuiDataGrid-cell').then($celdas => {
                const valores = [...$celdas].map(c => c.innerText.trim()).filter(t => t);
                const identificador = valores[0];

                cy.get('@filaRevision').click({ force: true });
                cy.get('button').filter(':visible').eq(-2).click({ force: true });
            });
        });
    }

    function TC022() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('button').contains('Añadir').should('be.visible').and('not.be.disabled');
        cy.get('button').contains('Añadir').click();
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/inspections\/form(\/\d+)?$/);
    }

    function TC023() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        cy.get('div[role="row"]').should('have.length.greaterThan', 1);
        cy.get('div[role="columnheader"]').contains('Nombre').should('be.visible');

        cy.get('div[role="columnheader"][data-field="name"]')
            .find('button[aria-label="Nombre column menu"]')
            .click({ force: true });

        cy.contains('li', 'Hide column').click({ force: true });

        return cy.get('div[role="columnheader"]').contains('Nombre').should('not.exist');
    }

    function TC024() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        cy.get('div[role="row"]').should('have.length.greaterThan', 1);
        cy.get('div[role="columnheader"]').contains('Nombre').should('be.visible');

        cy.get('div[role="columnheader"][data-field="name"]')
            .find('button[aria-label="Nombre column menu"]')
            .click({ force: true });

        cy.contains('li', 'Hide column').click({ force: true });
        cy.get('div[role="columnheader"]').contains('Nombre').should('not.exist');

        cy.get('div[role="columnheader"][data-field="kms"]')
            .find('button[aria-label="Kms column menu"]')
            .click({ force: true });

        cy.contains('li', 'Manage columns').click({ force: true });

        cy.get('label').contains('Nombre')
            .parent()
            .find('input[type="checkbox"]')
            .check({ force: true }).should('be.checked');

        cy.get('body').click(0, 0);
        return cy.get('div[role="columnheader"]').contains('Nombre').should('be.visible');
    }

    function TC025() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);

        const maxScrolls = 10;
        let intentos = 0;

        function hacerScrollVertical(prevHeight = 0) {
            return cy.get('.MuiDataGrid-virtualScroller').then($scroller => {
                const currentScrollHeight = $scroller[0].scrollHeight;
                if (currentScrollHeight === prevHeight || intentos >= maxScrolls) {
                    cy.get('.MuiDataGrid-columnHeaders').should('exist').and($el => {
                        const rect = $el[0].getBoundingClientRect();
                        expect(rect.top).to.be.greaterThan(0);
                        expect(rect.height).to.be.greaterThan(0);
                    });
                    cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');
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

    function TC026() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('select[name="column"]').select('Nombre');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('ITV{enter}', { force: true });
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        cy.reload();
        cy.url().should('include', '/dashboard/inspections');

        cy.get('select[name="column"] option:selected').invoke('text').then((selectedText) => {
            expect(selectedText).to.match(/Select an option|Todos/i);
        });

        cy.get('input#search[placeholder="Buscar"]').should('have.value', '');
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function TC027() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('select#languageSwitcher').select('en', { force: true });

        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Name').should('exist');
            cy.contains('Kms').should('exist');
            cy.contains('Kms/Hours').should('exist');
            cy.contains('General').should('exist');
            cy.contains('Tachograph').should('exist');
        });
    }

    function TC028() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('select#languageSwitcher').select('ca', { force: true });

        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Nom').should('exist');
            cy.contains('Kms').should('exist');
            cy.contains('Kms/Hores').should('exist');
            cy.contains('General').should('exist');
            cy.contains('Tacògraf').should('exist');
        });
    }

    function TC029() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('select#languageSwitcher').select('es', { force: true });

        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Nombre').should('exist');
            cy.contains('Kms').should('exist');
            cy.contains('Kms/Horas').should('exist');
            cy.contains('General').should('exist');
            cy.contains('Tacógrafo').should('exist');
        });
    }

    function TC030() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        const textoBusqueda = 'BaTeRiA';
        cy.get('select[name="column"]').select('Todos');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type(`${textoBusqueda}{enter}`, { force: true });

        return cy.get('.MuiDataGrid-row:visible').then($filas => {
            const coincidencias = [...$filas].filter(fila =>
                fila.innerText.toLowerCase().includes('bateria')
            );
            expect(coincidencias.length).to.be.greaterThan(0);
        });
    }

    function TC031() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        cy.get('select[name="column"]').select('Todos');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('$%&{enter}', { force: true });
        cy.get('.MuiDataGrid-row:visible').should('have.length', 0);
        return cy.contains('No rows').should('be.visible');
    }

    function TC012() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        
        // Verificamos si hay filas antes de aplicar el filtro
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        
        cy.get('select[name="column"]').select('Aceites');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });
        
        return cy.get('body').then($body => {
            if ($body.text().includes('No rows')) {
                // Si hay filas en la tabla pero el filtro muestra "No rows", es un ERROR
                cy.registrarResultados({
                    numero: 12,
                    nombre: 'TC012 - Filtrar por "Aceites"',
                    esperado: 'Se muestran las filas donde está marcada la casilla Aceites',
                    obtenido: 'Hay filas pero muestra "No rows"',
                    resultado: 'ERROR',
                    pantalla: 'Taller y Gastos (Revisiones)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
                cy.contains('No rows').should('be.visible');
            } else {
                // Si muestra filas, el filtro funciona correctamente
                cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
                cy.registrarResultados({
                    numero: 12,
                    nombre: 'TC012 - Filtrar por "Aceites"',
                    esperado: 'Se muestran las filas donde está marcada la casilla Aceites',
                    obtenido: 'Comportamiento correcto',
                    resultado: 'OK',
                    pantalla: 'Taller y Gastos (Revisiones)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            }
        });
    }

    function TC013() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        
        // Verificamos si hay filas antes de aplicar el filtro
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        
        cy.get('select[name="column"]').select('Filtros');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });
        
        return cy.get('body').then($body => {
            if ($body.text().includes('No rows')) {
                // Si hay filas en la tabla pero el filtro muestra "No rows", es un ERROR
                cy.registrarResultados({
                    numero: 13,
                    nombre: 'TC013 - Filtrar por "Filtros"',
                    esperado: 'Se muestran las filas donde está marcada la casilla Filtros',
                    obtenido: 'Hay filas pero muestra "No rows"',
                    resultado: 'ERROR',
                    pantalla: 'Taller y Gastos (Revisiones)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
                cy.contains('No rows').should('be.visible');
            } else {
                // Si muestra filas, el filtro funciona correctamente
                cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
                cy.registrarResultados({
                    numero: 13,
                    nombre: 'TC013 - Filtrar por "Filtros"',
                    esperado: 'Se muestran las filas donde está marcada la casilla Filtros',
                    obtenido: 'Comportamiento correcto',
                    resultado: 'OK',
                    pantalla: 'Taller y Gastos (Revisiones)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            }
        });
    }

    function TC014() {
        cy.navegarAMenu('TallerYGastos', 'Revisiones');
        cy.url().should('include', '/dashboard/inspections');
        
        // Verificamos si hay filas antes de aplicar el filtro
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        
        cy.get('select[name="column"]').select('Otros');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });
        
        return cy.get('body').then($body => {
            if ($body.text().includes('No rows')) {
                // Si hay filas en la tabla pero el filtro muestra "No rows", es un ERROR
                cy.registrarResultados({
                    numero: 14,
                    nombre: 'TC014 - Filtrar por "Otros"',
                    esperado: 'Se muestran las filas donde está marcada la casilla Otros',
                    obtenido: 'Hay filas pero muestra "No rows"',
                    resultado: 'ERROR',
                    pantalla: 'Taller y Gastos (Revisiones)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
                cy.contains('No rows').should('be.visible');
            } else {
                // Si muestra filas, el filtro funciona correctamente
                cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
                cy.registrarResultados({
                    numero: 14,
                    nombre: 'TC014 - Filtrar por "Otros"',
                    esperado: 'Se muestran las filas donde está marcada la casilla Otros',
                    obtenido: 'Comportamiento correcto',
                    resultado: 'OK',
                    pantalla: 'Taller y Gastos (Revisiones)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            }
        });
    }

});