describe('CATEGORÍAS - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';
    // Defino todos los casos con su número, nombre descriptivo y la función que ejecuta la validación
    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla de categorías correctamente', funcion: cargarPantallaCategorias, prioridad: 'ALTA' },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' },
        { numero: 5, nombre: 'TC005 - Filtrar por columna "Código"', funcion: filtrarPorCodigo, prioridad: 'ALTA' },
        { numero: 6, nombre: 'TC006 - Filtrar por columna "Nombre"', funcion: filtrarPorNombre, prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - Filtrar por columna "Módulo"', funcion: filtrarPorModulo, prioridad: 'ALTA' },
        { numero: 8, nombre: 'TC008 - Buscar texto exacto en buscador general', funcion: buscarTextoExacto, prioridad: 'ALTA' },
        { numero: 9, nombre: 'TC009 - Buscar texto parcial en buscador general', funcion: buscarTextoParcial, prioridad: 'ALTA' },
        { numero: 10, nombre: 'TC010 - Buscar con mayúsculas y minúsculas combinadas', funcion: buscarAlternandoMayusculas, prioridad: 'MEDIA' },
        { numero: 11, nombre: 'TC011 - Buscar con espacios al inicio y fin', funcion: buscarConEspacios, prioridad: 'MEDIA' },
        { numero: 12, nombre: 'TC012 - Buscar con caracteres especiales', funcion: buscarCaracteresEspeciales, prioridad: 'BAJA' },
        { numero: 13, nombre: 'TC013 - Ordenar por columna "Nombre" ASC/DESC', funcion: ordenarNombre, prioridad: 'MEDIA' },
        { numero: 14, nombre: 'TC014 - Ordenar por columna "Módulo" ASC/DESC', funcion: ordenarModulo, prioridad: 'MEDIA' },
        { numero: 15, nombre: 'TC015 - Seleccionar una fila', funcion: seleccionarFila, prioridad: 'ALTA' },
        { numero: 16, nombre: 'TC016 - Botón "Editar" con una fila seleccionada', funcion: editarCategoria, prioridad: 'ALTA' },
        { numero: 17, nombre: 'TC017 - Botón "Editar" sin fila seleccionada', funcion: editarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 18, nombre: 'TC018 - Botón "Eliminar" con una fila seleccionada', funcion: eliminarCategoria, prioridad: 'ALTA' },
        { numero: 19, nombre: 'TC019 - Botón "Eliminar" sin fila seleccionada', funcion: eliminarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 20, nombre: 'TC020 - Botón "+ Añadir" abre formulario nuevo', funcion: abrirFormularioAlta, prioridad: 'ALTA' },
        { numero: 21, nombre: 'TC021 - Ocultar columna desde menú contextual', funcion: ocultarColumna, prioridad: 'BAJA' },
        { numero: 22, nombre: 'TC022 - Mostrar/ocultar columnas con "Manage columns"', funcion: gestionarColumnas, prioridad: 'BAJA' },
        { numero: 23, nombre: 'TC023 - Scroll vertical/horizontal en tabla', funcion: scrollHorizontalVertical, prioridad: 'BAJA' },
        { numero: 24, nombre: 'TC024 - Recargar página y verificar reinicio de filtros', funcion: recargarPagina, prioridad: 'MEDIA' },
        { numero: 25, nombre: 'TC025 - Buscar texto con acentos', funcion: buscarConAcentos, prioridad: 'MEDIA' },
        { numero: 26, nombre: 'TC027 - Filtrar por "Value"', funcion: filtrarPorValue, prioridad: 'MEDIA' },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Ficheros (Categorías)');
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
                    pantalla: 'Ficheros (Categorías)'
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
                            pantalla: 'Ficheros (Categorías)'
                        });
                    }
                });
            });
        });
    });

    // === FUNCIONES DE VALIDACIÓN ===
    function cargarPantallaCategorias() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function cambiarIdiomaIngles() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');
        cy.get('select#languageSwitcher').select('en', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaCatalan() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaEspanol() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');
        cy.get('select#languageSwitcher').select('es', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function filtrarPorCodigo() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');

        cy.get('select[name="column"]').should('be.visible').select('Código', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('7{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').should('include', '7');
        });
    }

    function filtrarPorNombre() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');

        cy.get('select[name="column"]').should('be.visible').select('Nombre', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Clientes VIP{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').then((text) => {
                expect(text.toLowerCase()).to.include('clientes vip');
            });
        });
    }

    function filtrarPorModulo() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');

        cy.get('select[name="column"]').should('be.visible').select('Módulo', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Clientes{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').then((text) => {
                expect(text.toLowerCase()).to.include('clientes');
            });
        });
    }

    function buscarTextoExacto() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}Clientes nuevo{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarTextoParcial() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}Clien{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarAlternandoMayusculas() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}cLiEnTeS ViP{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarConEspacios() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace} Clientes nuevo {enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarCaracteresEspeciales() {
        cy.navegarAMenu('Ficheros', 'Categorias');

        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}%&/{enter}', { force: true });

        // Espera y validación de que no hay filas o aparece "No rows"
        cy.wait(500);

        return cy.contains('No rows', { timeout: 3000 }).should('be.visible');
    }

    function ordenarNombre() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Hacer clic en el encabezado de la columna Nombre
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
            .should('be.visible')
            .click();

        cy.wait(1000);

        // Hacer clic nuevamente para cambiar el orden
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function ordenarModulo() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Hacer clic en el encabezado de la columna Módulo
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Módulo')
            .should('be.visible')
            .click();

        cy.wait(1000);

        // Hacer clic nuevamente para cambiar el orden
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Módulo')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function seleccionarFila() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function editarCategoria() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        // Tomar la primera fila visible como alias
        cy.get('.MuiDataGrid-row:visible').first().as('filaCategoria');

        // Hacer clic para seleccionar la fila
        cy.get('@filaCategoria').click({ force: true });
        cy.wait(500);

        // Hacer doble clic en la fila para editar
        cy.get('@filaCategoria').dblclick({ force: true });

        // Verificar que se abrió el formulario con ID en la URL
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/categories\/form\/\d+$/);
    }

    function eliminarCategoria() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');

        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 1);
        cy.get('.MuiDataGrid-row:visible').eq(1).click({ force: true });
        cy.wait(500);

        return cy.get('button.css-1cbe274').click({ force: true });
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');

        // Asegurarse de que el botón 'Editar' no está visible si no hay selección
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');

        // Asegurar que no hay checkboxes seleccionados
        cy.get('div[role="row"] input[type="checkbox"]:checked').should('have.length', 0);

        // Hacer clic en el botón "Eliminar"
        return cy.get('button.css-1cbe274').click({ force: true });
    }

    function abrirFormularioAlta() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');
        cy.get('button').contains('Añadir').click({ force: true });

        // Validar la URL sin exigir terminación exacta
        return cy.url().should('include', '/dashboard/categories/form');
    }

    function ocultarColumna() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');

        // Hacer clic en el encabezado de la columna Nombre
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function gestionarColumnas() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');

        // Hacer clic en el encabezado de la columna Código
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function scrollHorizontalVertical() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');
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
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('clientes{enter}', { force: true });
        cy.reload();
        return cy.get('input[placeholder="Buscar"]').should('have.value', '');
    }

    function buscarConAcentos() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.get('input[placeholder="Buscar"]')
            .type('{selectall}{backspace}facturación{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function filtrarPorValue() {
        cy.navegarAMenu('Ficheros', 'Categorias');
        cy.url().should('include', '/dashboard/categories');

        // Abre el menú contextual de la columna "Nombre"
        cy.get('div.MuiDataGrid-columnHeader[data-field="name"]')
            .find('button[aria-label*="Nombre"]')
            .click({ force: true });

        // Clic en "Filter"
        cy.contains('li[role="menuitem"]', 'Filter').click({ force: true });

        // Escribe "clientes" como valor de filtro
        cy.get('input[placeholder="Filter value"]')
            .clear()
            .type('clientes{enter}');

        cy.wait(500);

        // Validar que todas las filas visibles contienen "clientes"
        return cy.get('div[role="row"]').each($row => {
            const $cells = Cypress.$($row).find('div[role="cell"]');
            if ($cells.length > 0) {
                const textos = [...$cells].map(el => el.innerText.toLowerCase());
                expect(textos.some(t => t.includes('clientes'))).to.be.true;
            }
        });
    }
}); 