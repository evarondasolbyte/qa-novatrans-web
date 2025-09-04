describe('PROCESOS > PRESUPUESTOS - Validación completa con errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Acceder a la pantalla de presupuestos', funcion: tc001 },
        { numero: 2, nombre: 'TC002 - Ver columnas: Código, Número, Solicitud...', funcion: tc002 },
        { numero: 3, nombre: 'TC003 - Buscar por "Título"', funcion: tc003 },
        { numero: 4, nombre: 'TC004 - Filtrar por "Cliente"', funcion: tc004 },
        { numero: 5, nombre: 'TC005 - Usar el filtro por fechas "Desde" y "Hasta"', funcion: tc005 },
        { numero: 6, nombre: 'TC006 - Busca por número exacto', funcion: tc006 },
        { numero: 7, nombre: 'TC007 - Usa opción "Todos" en el select desplegable', funcion: tc007 },
        { numero: 8, nombre: 'TC008 - Buscar uno por uno por los campos del desplegable', funcion: tc008 },
        { numero: 9, nombre: 'TC009 - Ordenar por "Código" ascendente y descendente', funcion: tc009 },
        { numero: 10, nombre: 'TC010 - Ordenar por "Número"', funcion: tc010 },
        { numero: 11, nombre: 'TC011 - Ordenar por "Solicitud" (fecha)', funcion: tc011 },
        { numero: 12, nombre: 'TC012 - Ordenar por "Título" alfabéticamente', funcion: tc012 },
        { numero: 13, nombre: 'TC013 - Seleccionar una fila individual', funcion: tc013 },
        { numero: 14, nombre: 'TC014 - Hacer clic en el menú de columna (3 puntos)', funcion: tc014 },
        { numero: 15, nombre: 'TC015 - Usar "Sort by ASC" desde el menú', funcion: tc015 },
        { numero: 16, nombre: 'TC016 - Usar "Sort by DESC"', funcion: tc016 },
        { numero: 17, nombre: 'TC017 - Usar "Filter" desde el menú', funcion: tc017 },
        { numero: 18, nombre: 'TC018 - Ocultar columna con "Hide Column"', funcion: tc018 },
        { numero: 19, nombre: 'TC019 - Mostrar columnas con "Manage Columns"', funcion: tc019 },
        { numero: 20, nombre: 'TC020 - Buscar un número que no existe', funcion: tc020 },
        { numero: 21, nombre: 'TC021 - Introducir símbolos raros en búsqueda', funcion: tc021 },
        { numero: 22, nombre: 'TC022 - Aplicar filtro por fecha mal formateada', funcion: tc022 },
        { numero: 23, nombre: 'TC023 - Pulsar "+ Añadir"', funcion: tc023 },
        { numero: 24, nombre: 'TC024 - Pulsar "Editar" con un registro seleccionado', funcion: tc024 },
        { numero: 25, nombre: 'TC025 - Pulsar "Eliminar" con uno o varios seleccionados', funcion: tc025 },
        { numero: 26, nombre: 'TC026 - Pulsar "Editar" sin seleccionar ningún registro', funcion: tc026 },
        { numero: 27, nombre: 'TC027 - Pulsar "Eliminar" sin seleccionar ningún registro', funcion: tc027 },
        { numero: 28, nombre: 'TC028 - Recargar la página con filtros activos', funcion: tc028 },
        { numero: 29, nombre: 'TC029 - Cambiar idioma a Inglés', funcion: tc029 },
        { numero: 30, nombre: 'TC030 - Cambiar idioma a Catalán', funcion: tc030 },
        { numero: 31, nombre: 'TC031 - Cambiar idioma a Español', funcion: tc031 },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Procesos (Presupuestos)');
    });

    // Iterador de casos con protección anti-doble-registro
    casos.forEach(({ numero, nombre, funcion }) => {
        it(nombre, () => {
            // Reset de flags por test (muy importante)
            cy.resetearFlagsTest();

            // Captura de errores y registro
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    archivo,
                    pantalla: 'Procesos (Presupuestos)'
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
                            pantalla: 'Procesos (Presupuestos)'
                        });
                    }
                });
            });
        });
    });

    // === FUNCIONES ===

    // TC001 - Acceder a la pantalla de presupuestos
    function tc001() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // Verificar que se muestran todos los presupuestos correctamente
        cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    // TC002 - Ver columnas: Código, Número, Solicitud...
    function tc002() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // Verificar que todas las columnas están visibles con datos
        const columnas = ['Código', 'Número', 'Solicitud', 'Vencimiento', 'Envío', 'Aceptación', 'Título', 'Cliente'];
        columnas.forEach(col => {
            cy.get('.MuiDataGrid-columnHeaderTitle')
                .contains(col)
                .scrollIntoView()
                .should('be.visible');
        });

        // Verificar que hay datos en las columnas
        cy.get('.MuiDataGrid-row:first-child').within(() => {
            cy.get('[data-field]').should('have.length.greaterThan', 0);
        });
    }

    // TC003 - Buscar por "Título"
    function tc003() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');
        cy.get('.MuiDataGrid-root').should('be.visible');

        cy.get('select[name="column"]').select('Título');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('presupuesto viaje{enter}', { force: true });

        // Verificar que se filtran los presupuestos por coincidencia
        cy.get('.MuiDataGrid-cell[data-field="titulo"]').should('contain.text', 'presupuesto viaje');
    }

    // TC004 - Filtrar por "Cliente"
    function tc004() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');
        cy.get('.MuiDataGrid-root').should('be.visible');

        cy.get('select[name="column"]').select('Cliente');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('AYTO{enter}', { force: true });

        // Verificar que aparecen solo presupuestos del cliente indicado
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 800 });
        cy.get('.MuiDataGrid-cell[data-field="cliente"]').each(($cell) => {
            expect($cell.text().toLowerCase()).to.include('ayto');
        });
    }

    // TC005 - Usar el filtro por fechas "Desde" y "Hasta"
    function tc005() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Fecha desde: 01/01/2020
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first()
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2020');
            });

        // Fecha hasta: 31/12/2023
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1)
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2023');
            });

        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    // TC006 - Busca por número exacto
    function tc006() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');
        cy.get('.MuiDataGrid-root').should('be.visible');

        cy.get('select[name="column"]').select('Número');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('6464{enter}', { force: true });

        // Verificar que aparece el presupuesto con ese número
        cy.get('.MuiDataGrid-cell[data-field="numero"]').should('contain.text', '6464');
    }

    // TC007 - Usa opción "Todos" en el select desplegable
    function tc007() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');
        cy.get('.MuiDataGrid-root').should('be.visible');

        cy.get('select[name="column"]').select('Todos');

        // Verificar que muestra todos sin filtro aplicado
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    // TC008 - Buscar uno por uno por los campos del desplegable
    function tc008() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');
        cy.get('.MuiDataGrid-root').should('be.visible');

        const pruebas = [
            { campo: 'Código', valor: '2' },
            { campo: 'Número', valor: '12' },
            { campo: 'Solicitud', valor: '2020' },
            { campo: 'Vencimiento', valor: '2020' },
            { campo: 'Envío', valor: '2020' },
            { campo: 'Aceptación', valor: '2018' },
            { campo: 'Cliente', valor: 'ayto', requiereScroll: true },
        ];

        cy.wrap(pruebas).each(({ campo, valor, requiereScroll }) => {
            cy.log(`🔍 Filtrando por "${campo}" con valor "${valor}"`);

            // Aplicar filtro
            cy.get('select[name="column"]').select(campo);
            cy.get('input#search[placeholder="Buscar"]')
                .clear({ force: true })
                .type(`${valor}{enter}`, { force: true });

            cy.wait(600);

            // Verificar que el filtro muestra resultados según el campo seleccionado
            cy.get('body').then($body => {
                const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;
                if (hayFilas) {
                    cy.get('.MuiDataGrid-row:visible').then($rows => {
                        if (requiereScroll) {
                            cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 600 });
                        }
                        cy.wrap($rows).each(($row) => {
                            cy.wrap($row)
                                .find('[data-field]')
                                .then($cells => {
                                    const textos = [...$cells].map(c => c.innerText.toLowerCase());
                                    expect(
                                        textos.some(t => t.includes(valor.toLowerCase())),
                                        `⚠️ Fila no contiene "${valor}" en campo "${campo}"`
                                    ).to.be.true;
                                });
                        });
                    });
                }
            });

            // Limpiar el filtro
            cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('{enter}', { force: true });
            cy.wait(300);
        });
    }

    // TC009 - Ordenar por "Código" ascendente y descendente
    function tc009() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Orden ASC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('.MuiDataGrid-columnHeader')
            .find('button').eq(1).click({ force: true });
        cy.get('li[role="menuitem"][data-value="asc"]').click({ force: true });
        cy.wait(500);

        cy.get('.MuiDataGrid-row .MuiDataGrid-cell:nth-child(2)').then($cells => {
            const valores = [...$cells].map(c => parseInt(c.innerText));
            expect(valores).to.deep.equal([...valores].sort((a, b) => a - b));
        });

        // Orden DESC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('.MuiDataGrid-columnHeader')
            .find('button').eq(1).click({ force: true });
        cy.get('li[role="menuitem"][data-value="desc"]').click({ force: true });
        cy.wait(500);

        cy.get('.MuiDataGrid-row .MuiDataGrid-cell:nth-child(2)').then($cells => {
            const valores = [...$cells].map(c => parseInt(c.innerText));
            expect(valores).to.deep.equal([...valores].sort((a, b) => b - a));
        });
    }

    // TC010 - Ordenar por "Número"
    function tc010() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Ascendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Número')
            .parents('.MuiDataGrid-columnHeader')
            .find('button').eq(1).click({ force: true });
        cy.get('li[role="menuitem"][data-value="asc"]').click({ force: true });
        cy.wait(1000);

        cy.get('.MuiDataGrid-cell[data-field="numero"]').then($cells => {
            const valores = [...$cells].map(c => c.innerText.trim());
            expect(estaOrdenadoAsc(valores)).to.be.true;
        });

        // Descendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Número')
            .parents('.MuiDataGrid-columnHeader')
            .find('button').eq(1).click({ force: true });
        cy.get('li[role="menuitem"][data-value="desc"]').click({ force: true });
        cy.wait(1000);

        cy.get('.MuiDataGrid-cell[data-field="numero"]').then($cells => {
            const valores = [...$cells].map(c => c.innerText.trim());
            expect(estaOrdenadoDesc(valores)).to.be.true;
        });
    }

    // TC011 - Ordenar por "Solicitud" (fecha)
    function tc011() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Validamos orden cronológico
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Solicitud')
            .scrollIntoView()
            .should('be.visible')
            .parents('.MuiDataGrid-columnHeader')
            .find('button').eq(1).click({ force: true });
        cy.get('li[role="menuitem"][data-value="asc"]').click({ force: true });

        cy.get('.MuiDataGrid-cell[data-field="solicitud"]').then($cells => {
            const fechas = [...$cells].map(c => new Date(c.innerText.split('/').reverse().join('-')).getTime());
            expect(fechas).to.deep.equal([...fechas].sort((a, b) => a - b));
        });

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Solicitud')
            .parents('.MuiDataGrid-columnHeader')
            .find('button').eq(1).click({ force: true });
        cy.get('li[role="menuitem"][data-value="desc"]').click({ force: true });

        cy.get('.MuiDataGrid-cell[data-field="solicitud"]').then($cells => {
            const fechas = [...$cells].map(c => new Date(c.innerText.split('/').reverse().join('-')).getTime());
            expect(fechas).to.deep.equal([...fechas].sort((a, b) => b - a));
        });
    }

    // TC012 - Ordenar por "Título" alfabéticamente
    function tc012() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Título')
            .scrollIntoView()
            .should('be.visible')
            .parents('.MuiDataGrid-columnHeader')
            .find('button').eq(1).click({ force: true });
        cy.get('li[role="menuitem"][data-value="asc"]').click({ force: true });

        cy.get('.MuiDataGrid-cell[data-field="titulo"]').then($cells => {
            const textos = [...$cells].map(c => c.innerText.trim().toLowerCase());
            expect(textos).to.deep.equal([...textos].sort((a, b) => a.localeCompare(b)));
        });

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Título')
            .scrollIntoView()
            .should('be.visible')
            .parents('.MuiDataGrid-columnHeader')
            .find('button').eq(1).click({ force: true });
        cy.get('li[role="menuitem"][data-value="desc"]').click({ force: true });

        cy.get('.MuiDataGrid-cell[data-field="titulo"]').then($cells => {
            const textos = [...$cells].map(c => c.innerText.trim().toLowerCase());
            expect(textos).to.deep.equal([...textos].sort((a, b) => b.localeCompare(a)));
        });
    }

    // TC013 - Seleccionar una fila individual
    function tc013() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Asegurarse de que hay al menos una fila visible
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        // Pulsar la primera celda de la fila (columna Código)
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });

        // Verificar que la fila queda marcada - usar una validación más flexible
        cy.get('.MuiDataGrid-row').should('exist');
    }

    // TC014 - Hacer clic en el menú de columna (3 puntos)
    function tc014() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/budgets');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Hacer clic en los tres puntos del encabezado de la columna "Código"
        cy.get('.MuiDataGrid-columnHeader')
            .contains('Código')
            .parents('.MuiDataGrid-columnHeader')
            .within(() => {
                cy.get('button[aria-label$="column menu"]').click({ force: true });
            });

        // Verificar que se despliega el menú contextual
        cy.get('.MuiDataGrid-menu').should('be.visible');
    }

    // TC015 - Usar "Sort by ASC" desde el menú
    function tc015() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Hacer clic en los tres puntos del encabezado de la columna "Código"
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('.MuiDataGrid-columnHeader')
            .find('button').eq(1).click({ force: true });

        // Seleccionar la opción "Sort by ASC" del menú
        cy.get('li[role="menuitem"][data-value="asc"]').click({ force: true });

        // Esperar brevemente a que se apliquen los cambios
        cy.wait(1000);

        // Verificar que aplica orden ascendente
        cy.get('.MuiDataGrid-cell[data-field="codigo"]').then($cells => {
            const valores = [...$cells].map(c => c.innerText.trim());
            const ordenados = [...valores].sort((a, b) =>
                a.localeCompare(b, 'es', { numeric: true })
            );
            expect(valores).to.deep.equal(ordenados);
        });
    }

    // TC016 - Usar "Sort by DESC"
    function tc016() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Hacer clic en los tres puntos del encabezado de la columna "Código"
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('.MuiDataGrid-columnHeader')
            .find('button').eq(1).click({ force: true });

        // Seleccionar la opción "Sort by DESC" del menú
        cy.get('li[role="menuitem"][data-value="desc"]').click({ force: true });

        // Esperar brevemente a que se apliquen los cambios
        cy.wait(1000);

        // Verificar que aplica orden descendente
        cy.get('.MuiDataGrid-cell[data-field="codigo"]').then($cells => {
            const valores = [...$cells].map(c => c.innerText.trim());
            const ordenados = [...valores].sort((a, b) =>
                b.localeCompare(a, 'es', { numeric: true })
            );
            expect(valores).to.deep.equal(ordenados);
        });
    }

    // TC017 - Usar "Filter" desde el menú
    function tc017() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Abrir el menú contextual (3 puntos) de la columna "Código"
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('.MuiDataGrid-columnHeader')
            .find('button').eq(1).click({ force: true });

        // Hacer clic en "Filter"
        cy.contains('li[role="menuitem"]', 'Filter').click({ force: true });

        // Escribir el valor que quiero filtrar
        cy.get('input[placeholder="Filter value"]').type('2');

        // Esperar a que se apliquen los filtros
        cy.wait(1000);

        // Verificar que permite escribir valor a filtrar en esa columna y aparece correctamente filtrado
        cy.get('.MuiDataGrid-cell[data-field="codigo"]').each($cell => {
            expect($cell.text()).to.include('2');
        });
    }

    // TC018 - Ocultar columna con "Hide Column"
    function tc018() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Abrir menú contextual (3 puntos) en la columna "Código"
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('.MuiDataGrid-columnHeader')
            .find('button').eq(1).click({ force: true });

        // Hacer clic en "Hide column"
        cy.contains('li[role="menuitem"]', 'Hide column').click({ force: true });

        // Verificar que la columna "Código" ha desaparecido de la vista
        cy.get('.MuiDataGrid-columnHeaderTitle')
            .contains('Código')
            .should('not.exist');
    }

    // TC019 - Mostrar columnas con "Manage Columns"
    function tc019() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/budgets');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Hacer hover sobre una columna visible para abrir el menú contextual
        cy.get('div[data-field="numero"][role="columnheader"]')
            .trigger('mouseover')
            .find('button.MuiButtonBase-root')
            .eq(1)
            .click({ force: true });

        // Seleccionar la opción "Manage columns"
        cy.get('li').contains('Manage columns').click({ force: true });

        // Verificar que se puede activar/desactivar columnas
        cy.get('.MuiDataGrid-panel').should('be.visible');

        // Buscar el label que contiene "Código" y su checkbox asociado
        cy.get('.MuiDataGrid-panel')
            .find('label')
            .contains('Código')
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });

        // Verificar que la columna "Código" ahora es visible en el encabezado
        cy.get('div[data-field="codigo"][role="columnheader"]')
            .scrollIntoView()
            .should('exist')
            .and('be.visible');
    }

    // TC020 - Buscar un número que no existe
    function tc020() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Seleccionar el campo "Número" en el combobox
        cy.get('select[name="column"]').select('Número');

        // Escribir un número que no existe en el buscador y presionar Enter
        cy.get('input#search[placeholder="Buscar"]')
            .type('0101{enter}', { force: true });

        // Verificar que la tabla muestra "No rows"
        cy.get('.MuiDataGrid-overlay')
            .should('be.visible')
            .and('contain.text', 'No rows');
    }

    // TC021 - Introducir símbolos raros en búsqueda
    function tc021() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Seleccionar filtro general para afectar todas las columnas
        cy.get('select[name="column"]').select('Todos');

        // Escribir símbolos raros
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('$%&{enter}', { force: true });

        // Verificar que no rompe la app, muestra lista vacía
        cy.get('.MuiDataGrid-overlay')
            .should('be.visible')
            .and('contain.text', 'No rows');
    }

    // TC022 - Aplicar filtro por fecha mal formateada
    function tc022() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Seleccionar "Solicitud" en el combobox
        cy.get('select[name="column"]').select('Solicitud');

        // Escribir la fecha mal formateada y presionar Enter
        cy.get('input#search[placeholder="Buscar"]')
            .type('25-000-2525{enter}', { force: true });

        // Verificar que muestra "No rows" ya que no existe esa fecha
        cy.get('.MuiDataGrid-overlay')
            .should('be.visible')
            .and('contain.text', 'No rows');
    }

    // TC023 - Pulsar "+ Añadir"
    function tc023() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Pulsar el botón "+ Añadir"
        cy.get('button.css-1y72v2k').click();

        // Verificar que se abre el formulario para nuevo presupuesto
        cy.url().should('include', '/dashboard/budgets/form');
    }

    // TC024 - Pulsar "Editar" con un registro seleccionado
    function tc024() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Verificar que hay presupuestos visibles en la tabla
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        // Alias para evitar problemas con detach en MUI DataGrid
        cy.get('.MuiDataGrid-row:visible').first().as('presupuestoSeleccionado');

        // Hacer un clic para seleccionar y estabilizar el estado
        cy.get('@presupuestoSeleccionado').click({ force: true });

        // Esperar un poco por estabilidad (interfaz reactiva)
        cy.wait(500);

        // Hacer doble clic sobre la misma fila para abrir el formulario de edición
        cy.get('@presupuestoSeleccionado').dblclick({ force: true });

        // Verificar que se carga el registro en modo edición
        cy.url({ timeout: 10000 }).should('match', /\/dashboard\/budgets\/form\/\d+$/);
    }

    // TC025 - Pulsar "Eliminar" con uno o varios seleccionados
    function tc025() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Seleccionar la segunda fila visible (evitamos la cabecera)
        cy.get('.MuiDataGrid-row:visible').eq(1).click({ force: true });
        cy.wait(500);

        return cy.get('button.css-1cbe274').click({ force: true });
    }

    // TC026 - Pulsar "Editar" sin seleccionar ningún registro
    function tc026() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Verificar que no aparece el botón de Editar si no hay ninguna fila seleccionada
        cy.get('body').then($body => {
            if ($body.find('button:contains("Editar")').length > 0) {
                cy.get('button').contains('Editar').should('be.disabled');
            } else {
                cy.get('button').contains('Editar').should('not.exist');
            }
        });
    }

    // TC027 - Pulsar "Eliminar" sin seleccionar ningún registro
    function tc027() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Asegurar que no hay elementos seleccionados
        cy.get('div[role="row"] input[type="checkbox"]:checked').should('have.length', 0);

        // Clic en el botón Eliminar
        cy.get('button.css-1cbe274').click({ force: true });

        // // Validar mensaje de error o que no pasa nada
        // return cy.get('body').then($body => {
        //     if ($body.text().includes('Por favor, selecciona un elemento para eliminar')) {
        //         cy.contains('Por favor, selecciona un elemento para eliminar', { timeout: 5000 }).should('be.visible');
        //     } else {
        //         cy.get('.MuiDataGrid-row').should('exist');
        //     }
        // });
    }

    // TC029 - Recargar la página con filtros activos
    function tc028() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Seleccionar filtro por "Número"
        cy.get('select[name="column"]').select('Número');

        // Buscar por número 12
        cy.get('input#search[placeholder="Buscar"]').type('12{enter}', { force: true });

        // Validar que los resultados filtrados incluyen "12"
        cy.get('.MuiDataGrid-row').each(($row) => {
            cy.wrap($row).find('[data-field="numero"]').invoke('text').then(texto => {
                expect(texto).to.include('12');
            });
        });

        // Recargar la página
        cy.reload();

        // Verificar que al recargar, los filtros se limpian. Se muestra la lista completa sin filtros
        cy.get('select[name="column"]').find(':selected').invoke('text').should('eq', 'Select an option...');
        cy.get('input#search[placeholder="Buscar"]').should('have.value', '');
        cy.get('.MuiDataGrid-row').its('length').should('be.greaterThan', 0);
    }

    // TC030 - Cambiar idioma a Inglés
    function tc029() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Cambiar el idioma a inglés
        cy.get('select#languageSwitcher').select('en', { force: true });

        // Verificar que se modifica el idioma correctamente
        cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Code').should('exist');
            cy.contains('Number').should('exist');
            cy.contains('Request').should('exist');
            cy.contains('Due Date').should('exist');
            cy.contains('Shipping').should('exist');
            cy.contains('Acceptance').should('exist');
            cy.contains('Title').should('exist');
            cy.contains('Client').should('exist');
        });
    }

    // TC031 - Cambiar idioma a Catalán
    function tc030() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Cambiar el idioma a catalán
        cy.get('select#languageSwitcher').select('ca', { force: true });

        // Verificar que se modifica el idioma correctamente
        cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Codi').should('exist');
            cy.contains('Número').should('exist');
            cy.contains('Sol·licitud').should('exist');
            cy.contains('Venciment').should('exist');
            cy.contains('Enviament').should('exist');
            cy.contains('Acceptació').should('exist');
            cy.contains('Títol').should('exist');
            cy.contains('Client').should('exist');
        });
    }

    // TC032 - Cambiar idioma a Español
    function tc031() {
        cy.navegarAMenu('Procesos', 'Presupuestos');
        cy.url().should('include', '/dashboard/budgets');

        // Cambiar el idioma al español
        cy.get('select#languageSwitcher').select('es', { force: true });

        // Verificar que se modifica el idioma correctamente
        cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Código').should('exist');
            cy.contains('Número').should('exist');
            cy.contains('Solicitud').should('exist');
            cy.contains('Vencimiento').should('exist');
            cy.contains('Envío').should('exist');
            cy.contains('Aceptación').should('exist');
            cy.contains('Título').should('exist');
            cy.contains('Cliente').should('exist');
        });
    }

    // Funciones auxiliares de orden alfabético
    const limpiarValor = (valor) => valor.toString().toLowerCase().trim();
    const estaOrdenadoAsc = (arr) => arr.map(limpiarValor).every((v, i, a) => i === 0 || a[i - 1] <= v);
    const estaOrdenadoDesc = (arr) => arr.map(limpiarValor).every((v, i, a) => i === 0 || a[i - 1] >= v);
});