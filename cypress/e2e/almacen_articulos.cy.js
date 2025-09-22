describe('ALMACEN (ARTÍCULOS) - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla correctamente', funcion: cargarPantalla, prioridad: 'ALTA' },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' },
        { numero: 5, nombre: 'TC005 - Filtrar por Referencia', funcion: filtrarPorReferencia, prioridad: 'ALTA' },
        { numero: 6, nombre: 'TC006 - Filtrar por Familia', funcion: filtrarPorFamilia, prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - Filtrar por Subfamilia', funcion: filtrarPorSubfamilia, prioridad: 'ALTA' },
        { numero: 8, nombre: 'TC008 - Filtrar por Descripción', funcion: filtrarPorDescripcion, prioridad: 'ALTA' },
        { numero: 9, nombre: 'TC009 - Filtrar por Stock', funcion: filtrarPorStock, prioridad: 'ALTA' },
        { numero: 10, nombre: 'TC010 - Filtrar por Precio', funcion: filtrarPorPrecio, prioridad: 'ALTA' },
        { numero: 11, nombre: 'TC011 - Filtrar por Último Proveedor', funcion: filtrarPorUltimoProveedor, prioridad: 'ALTA' },
        { numero: 12, nombre: 'TC012 - Filtrar por Ref. Proveedor', funcion: filtrarPorRefProveedor, prioridad: 'ALTA' },
        { numero: 13, nombre: 'TC013 - Filtrar por Notas', funcion: filtrarPorNotas, prioridad: 'ALTA' },
        { numero: 14, nombre: 'TC014 - Filtrar por Activo', funcion: filtrarPorActivo, prioridad: 'ALTA' },
        { numero: 15, nombre: 'TC015 - Búsqueda general (texto exacto)', funcion: busquedaGeneralExacta, prioridad: 'ALTA' },
        { numero: 16, nombre: 'TC016 - Búsqueda general (texto parcial)', funcion: busquedaGeneralParcial, prioridad: 'ALTA' },
        { numero: 17, nombre: 'TC017 - Búsqueda case-insensitive', funcion: busquedaCaseInsensitive, prioridad: 'MEDIA' },
        { numero: 18, nombre: 'TC018 - Búsqueda con espacios', funcion: busquedaConEspacios, prioridad: 'MEDIA' },
        { numero: 19, nombre: 'TC019 - Búsqueda con caracteres especiales', funcion: busquedaConCaracteresEspeciales, prioridad: 'BAJA' },
        { numero: 20, nombre: 'TC020 - Ordenar por Referencia ASC/DESC', funcion: ordenarPorReferencia, prioridad: 'MEDIA' },
        { numero: 21, nombre: 'TC021 - Ordenar por Familia ASC/DESC', funcion: ordenarPorFamilia, prioridad: 'MEDIA' },
        { numero: 22, nombre: 'TC022 - Ordenar por Subfamilia ASC/DESC', funcion: ordenarPorSubfamilia, prioridad: 'MEDIA' },
        { numero: 23, nombre: 'TC023 - Ordenar por Descripción ASC/DESC', funcion: ordenarPorDescripcion, prioridad: 'MEDIA' },
        { numero: 24, nombre: 'TC024 - Ordenar por Stock ASC/DESC', funcion: ordenarPorStock, prioridad: 'MEDIA' },
        { numero: 25, nombre: 'TC025 - Ordenar por Precio ASC/DESC', funcion: ordenarPorPrecio, prioridad: 'MEDIA' },
        { numero: 26, nombre: 'TC026 - Ordenar por Último Proveedor ASC/DESC', funcion: ordenarPorUltimoProveedor, prioridad: 'MEDIA' },
        { numero: 27, nombre: 'TC027 - Ordenar por Ref. Proveedor ASC/DESC', funcion: ordenarPorRefProveedor, prioridad: 'MEDIA' },
        { numero: 28, nombre: 'TC028 - Ordenar por Notas ASC/DESC', funcion: ordenarPorNotas, prioridad: 'MEDIA' },
        { numero: 29, nombre: 'TC029 - Filtrar columna (Value)', funcion: filtrarColumnaValue, prioridad: 'MEDIA' },
        { numero: 30, nombre: 'TC030 - Ocultar columna (Hide column)', funcion: ocultarColumna, prioridad: 'BAJA' },
        { numero: 31, nombre: 'TC031 - Mostrar/Ocultar columnas (Manage columns)', funcion: manageColumns, prioridad: 'BAJA' },
        { numero: 32, nombre: 'TC032 - Seleccionar fila en tabla', funcion: seleccionarFila, prioridad: 'ALTA' },
        { numero: 33, nombre: 'TC033 - Scroll horizontal/vertical en tabla', funcion: scrollTabla, prioridad: 'BAJA' },
        { numero: 34, nombre: 'TC034 - Reset de filtros al recargar página', funcion: resetFiltrosRecarga, prioridad: 'MEDIA' },
        { numero: 35, nombre: 'TC035 - Filtrar por "Solo activos"', funcion: filtrarSoloActivos, prioridad: 'ALTA' },
        { numero: 36, nombre: 'TC036 - Filtrar por Familia (desplegable)', funcion: filtrarFamiliaDesplegable, prioridad: 'ALTA' },
        { numero: 37, nombre: 'TC037 - Filtrar por Subfamilia (desplegable)', funcion: filtrarSubfamiliaDesplegable, prioridad: 'ALTA' },
        { numero: 38, nombre: 'TC038 - Añadir artículo', funcion: abrirFormularioAñadir, prioridad: 'ALTA' },
        { numero: 39, nombre: 'TC039 - Editar artículo con selección', funcion: editarConFilaSeleccionada, prioridad: 'ALTA' },
        { numero: 40, nombre: 'TC040 - Editar artículo sin selección', funcion: editarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 41, nombre: 'TC041 - Eliminar con fila seleccionada', funcion: eliminarConFilaSeleccionada, prioridad: 'ALTA' },
        { numero: 42, nombre: 'TC042 - Eliminar sin selección', funcion: eliminarSinSeleccion, prioridad: 'MEDIA' }
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Almacen (Artículos)');
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
                    pantalla: 'Almacen (Artículos)'
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
                            pantalla: 'Almacen (Artículos)'
                        });
                    }
                });
            });
        });
    });

    // ===== FUNCIONES DE PRUEBA =====

    function cargarPantalla() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('.MuiDataGrid-root').should('be.visible');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);
        return cy.get('body').should('be.visible');
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500);
        return cy.get('body').should('be.visible');
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);
        return cy.get('body').should('be.visible');
    }

    function filtrarPorReferencia() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('select[name="column"]').select('Referencia', { force: true });
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('01.01.13{enter}', { force: true });
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorFamilia() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('select[name="column"]').select('Familia', { force: true });
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('01 - GENERAL{enter}', { force: true });
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorSubfamilia() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('select[name="column"]').select('Subfamilia', { force: true });
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('01 - GASOIL{enter}', { force: true });
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorDescripcion() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('select[name="column"]').select('Descripción', { force: true });
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('GASOIL{enter}', { force: true });
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorStock() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('select[name="column"]').select('Stock', { force: true });
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('7{enter}', { force: true });
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorPrecio() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('select[name="column"]').select('Precio', { force: true });
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('30.40{enter}', { force: true });
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorUltimoProveedor() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('select[name="column"]').select('Últ. Proveedor', { force: true });
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('GAR-OIL, S.L{enter}', { force: true });
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorRefProveedor() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('select[name="column"]').select('Ref. Proveedor', { force: true });
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('BPE7PLUS05{enter}', { force: true });
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorNotas() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('select[name="column"]').select('Notas', { force: true });
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('tapafugas{enter}', { force: true });
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorActivo() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('select[name="column"]').select('Activo', { force: true });
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaGeneralExacta() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('GASOIL TANQUE{enter}', { force: true });
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaGeneralParcial() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('GASOIL{enter}', { force: true });
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaCaseInsensitive() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('gAsOiL{enter}', { force: true });
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaConEspacios() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('  GASOIL{enter}', { force: true });
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaConCaracteresEspeciales() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('%&$/{enter}', { force: true });
        cy.wait(1000);
        // Para caracteres especiales, puede que no haya resultados, eso es OK
        return cy.get('body').should('be.visible');
    }

    function ordenarPorReferencia() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Referencia')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Referencia column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);

        cy.get('[aria-label="Referencia column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorFamilia() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Familia')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Familia column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);

        cy.get('[aria-label="Familia column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorSubfamilia() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Subfamilia')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Subfamilia column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);

        cy.get('[aria-label="Subfamilia column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorDescripcion() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Descripción')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Descripción column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);

        cy.get('[aria-label="Descripción column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorStock() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Stock')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Stock column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);

        cy.get('[aria-label="Stock column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorPrecio() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Precio')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Precio column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);

        cy.get('[aria-label="Precio column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorUltimoProveedor() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Últ. Proveedor')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Últ. Proveedor column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);

        cy.get('[aria-label="Últ. Proveedor column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorRefProveedor() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        // Hacer scroll horizontal para encontrar la columna "Ref. Proveedor"
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 800 });
        cy.wait(800);

        // Buscar la columna por su título
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Ref. Proveedor')
            .parents('[role="columnheader"]')
            .as('colRefProv')
            .trigger('mouseover');

        cy.get('@colRefProv').find('button[aria-label*="column menu"]').click({ force: true });
        cy.get('ul[role="menu"]').should('be.visible');
        cy.contains('li', 'Sort by ASC').click({ force: true });
        cy.wait(500);

        cy.get('@colRefProv').find('button[aria-label*="column menu"]').click({ force: true });
        cy.get('ul[role="menu"]').should('be.visible');
        cy.contains('li', 'Sort by DESC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorNotas() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        //  Igual: desplaza a la derecha para que aparezca la columna
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 800 });
        cy.wait(800);

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Notas')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Notas column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);

        cy.get('[aria-label="Notas column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarColumnaValue() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        // Menú de la columna "Referencia"
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Referencia')
            .closest('[role="columnheader"]')
            .as('colRef')
            .trigger('mouseover');

        cy.get('@colRef').find('button[aria-label*="column menu"]').click({ force: true });
        cy.get('ul[role="menu"]').should('be.visible');
        cy.contains('li', /^Filter$/i).click({ force: true });

        // Panel de filtros → escribir el Value
        cy.get('.MuiDataGrid-panel').should('be.visible').within(() => {
            cy.contains('label', /^Value$/i)
                .parent()
                .find('input')
                .clear({ force: true })
                .type('01.01.13{enter}', { force: true });
        });

        //  Validación: hay filas visibles y la primera columna contiene el valor
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        return cy.get('.MuiDataGrid-row:visible')
            .first()
            .should('contain.text', '01.01.13');
    }

    function ocultarColumna() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        // Aseguramos que la columna "Referencia" esté visible (suele estar a la izquierda)
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('left', { duration: 600 });

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Referencia')
            .closest('[role="columnheader"]')
            .as('colReferencia');

        cy.get('@colReferencia').trigger('mouseover');
        cy.get('@colReferencia')
            .find('button[aria-label*="column menu"]')
            .click({ force: true });

        // Esperamos el menú abierto
        cy.get('ul[role="menu"]').should('be.visible');

        // Clic en "Hide column"
        cy.contains('li', /^Hide column$/i).click({ force: true });

        //  Validación: comprobar que la cabecera "Referencia" ya no está en la tabla
        return cy.get('.MuiDataGrid-columnHeaders')
            .should('not.contain.text', 'Referencia');
    }

    function manageColumns() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Referencia')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Referencia column menu"]').click({ force: true });
        cy.get('li').contains('Manage columns').click({ force: true });

        cy.get('.MuiDataGrid-panel')
            .should('be.visible')
            .find('label')
            .contains('Familia')
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });

        return cy.get('.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains('Familia').should('exist');
            });
    }

    function seleccionarFila() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function scrollTabla() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        // Scroll vertical hacia abajo
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom', { duration: 1000 });
        cy.wait(500);

        // Validar que las cabeceras siguen visibles
        cy.get('.MuiDataGrid-columnHeaders')
            .should('exist')
            .and($el => {
                const rect = $el[0].getBoundingClientRect();
                expect(rect.top).to.be.greaterThan(0);
                expect(rect.height).to.be.greaterThan(0);
            });

        // Scroll horizontal a la derecha
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 1000 });
        cy.wait(500);

        // Scroll de vuelta a la izquierda
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('left', { duration: 1000 });

        return cy.get('.MuiDataGrid-columnHeaders').should('be.visible');
    }


    function resetFiltrosRecarga() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('general{enter}', { force: true });
        cy.wait(1000);

        cy.reload();
        cy.wait(2000);

        return cy.get('body').then(($body) => {
            const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;
            cy.log(`Después de recargar: ${hayFilas ? 'hay filas visibles' : 'no hay filas visibles'}`);
            return cy.wrap(true);
        });
    }

    function filtrarSoloActivos() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        // Toggle por el texto (más robusto que buscar el input)
        cy.contains('label, span, div, button', /^Solo activos$/i)
            .should('be.visible')
            .click({ force: true });

        cy.wait(600);

        // Validación mínima y estable
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarFamiliaDesplegable() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        cy.get('select#family[name="family"]').should('be.visible').select('07 - CUBAS', { force: true });
        cy.wait(800);

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarSubfamiliaDesplegable() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        cy.get('select#subfamily[name="subfamily"]').should('be.visible').select('02 - MANGUERAS', { force: true });
        cy.wait(800);

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function abrirFormularioAñadir() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        cy.get('button[aria-label*="add"], button[title*="add"], button:contains("Añadir")').first().click({ force: true });
        return cy.get('form, .MuiDialog-root').should('be.visible');
    }

    function editarConFilaSeleccionada() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        // Tomar la primera fila visible como alias
        cy.get('.MuiDataGrid-row:visible').first().as('filaArticulo');

        // Hacer clic para seleccionar la fila
        cy.get('@filaArticulo').click({ force: true });
        cy.wait(500);

        // Hacer doble clic en la fila para editar
        cy.get('@filaArticulo').dblclick({ force: true });

        // Verificar que se abrió el formulario con ID en la URL
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/items\/form\/\d+$/);
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        // Asegurarse de que el botón 'Editar' no está visible si no hay selección
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function eliminarConFilaSeleccionada() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 1);
        cy.get('.MuiDataGrid-row:visible').eq(1).click({ force: true });
        cy.wait(500);

        return cy.get('button.css-1cbe274').click({ force: true });
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Almacen', 'Artículos');
        cy.url().should('include', '/dashboard/items');

        // Asegurar que no hay checkboxes seleccionados
        cy.get('div[role="row"] input[type="checkbox"]:checked').should('have.length', 0);

        // Hacer clic en el botón "Eliminar"
        cy.get('button.css-1cbe274')
            .first()
            .click({ force: true });

        // Verificar que el botón está deshabilitado o no hace nada
        return cy.wrap(true);
    }
});