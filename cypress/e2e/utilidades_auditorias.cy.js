describe('UTILIDADES (AUDITORÍAS) - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Acceder a la pantalla correctamente', funcion: accederPantalla },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol },
        { numero: 5, nombre: 'TC005 - Filtrar por Tabla Afectada', funcion: filtrarPorTablaAfectada },
        { numero: 6, nombre: 'TC006 - Filtrar por Acción Realizada', funcion: filtrarPorAccionRealizada },
        { numero: 7, nombre: 'TC007 - Filtrar por Registro Afectado', funcion: filtrarPorRegistroAfectado },
        { numero: 8, nombre: 'TC008 - Filtrar por Usuario', funcion: filtrarPorUsuario },
        { numero: 9, nombre: 'TC009 - Filtrar por Fecha', funcion: filtrarPorFecha },
        { numero: 10, nombre: 'TC010 - Filtrar por Fecha (Desde – Hasta)', funcion: filtrarPorFechaDesdeHasta },
        { numero: 11, nombre: 'TC011 - Búsqueda general (texto exacto)', funcion: busquedaTextoExacto },
        { numero: 12, nombre: 'TC012 - Búsqueda general (texto parcial)', funcion: busquedaTextoParcial },
        { numero: 13, nombre: 'TC013 - Búsqueda case-insensitive', funcion: busquedaCaseInsensitive },
        { numero: 14, nombre: 'TC014 - Búsqueda con espacios', funcion: busquedaConEspacios },
        { numero: 15, nombre: 'TC015 - Búsqueda con caracteres especiales', funcion: busquedaCaracteresEspeciales },
        { numero: 16, nombre: 'TC016 - Ordenar por Acción Realizada ASC/DESC', funcion: ordenarPorAccionRealizada },
        { numero: 17, nombre: 'TC017 - Ordenar por Tabla Afectada ASC/DESC', funcion: ordenarPorTablaAfectada },
        { numero: 18, nombre: 'TC018 - Ordenar por Registro Afectado ASC/DESC', funcion: ordenarPorRegistroAfectado },
        { numero: 19, nombre: 'TC019 - Ordenar por Usuario ASC/DESC', funcion: ordenarPorUsuario },
        { numero: 20, nombre: 'TC020 - Ordenar por Fecha ASC/DESC', funcion: ordenarPorFecha },
        { numero: 21, nombre: 'TC021 - Filter → Value en columna Usuario', funcion: filterValueEnColumnaUsuario },
        { numero: 22, nombre: 'TC022 - Ocultar columna (Hide column)', funcion: ocultarColumna },
        { numero: 23, nombre: 'TC023 - Mostrar/Ocultar columnas (Manage)', funcion: mostrarOcultarColumnas },
        { numero: 24, nombre: 'TC024 - Scroll horizontal y vertical', funcion: scrollHorizontalVertical },
        { numero: 25, nombre: 'TC025 - Reset de filtros al recargar página', funcion: resetFiltrosRecargar },
        { numero: 26, nombre: 'TC026 - Seleccionar fila', funcion: seleccionarFila },
        { numero: 27, nombre: 'TC027 - Seleccionar Tabla', funcion: seleccionarTabla },
        { numero: 28, nombre: 'TC028 - Seleccionar Usuario', funcion: seleccionarUsuario },
    ];

    // Resumen al final
    after(() => {
        cy.log('Procesando resultados finales para Utilidades (Auditorías)');
        cy.procesarResultadosPantalla('Utilidades (Auditorías)');
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
                    pantalla: 'Utilidades (Auditorías)'
                });
                return false;
            });

            cy.login();
            cy.wait(500);

            // Ejecuta el caso y sólo auto-OK si nadie registró antes
            funcion().then(() => {
                if (!cy.estaRegistrado(numero)) {
                    cy.registrarResultados({
                        numero,
                        nombre,
                        esperado: 'Comportamiento correcto',
                        obtenido: 'Comportamiento correcto',
                        resultado: 'OK',
                        pantalla: 'Utilidades (Auditorías)',
                        archivo
                    });
                }
            });
        });
    });

    // ===== FUNCIONES DE TEST =====

    function accederPantalla() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);
        return cy.get('body').should('be.visible');
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500);
        return cy.get('body').should('be.visible');
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);
        return cy.get('body').should('be.visible');
    }

    function filtrarPorTablaAfectada() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Seleccionar filtro "Tabla Afectada"
        cy.get('select[name="filterType"], select[name="filter-type"]').select('Tabla Afectada', { force: true });
        
        // Buscar "avisos"
        cy.get('input[name="searchValue"], input[name="search-value"]').clear().type('avisos', { force: true });
        
        // Aplicar filtro
        cy.get('button').contains('Buscar').click({ force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 5,
                nombre: 'TC005 - Filtrar por Tabla Afectada',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR',
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorAccionRealizada() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Seleccionar filtro "Acción Realizada"
        cy.get('select[name="filterType"], select[name="filter-type"]').select('Acción Realizada', { force: true });
        
        // Buscar "eliminación"
        cy.get('input[name="searchValue"], input[name="search-value"]').clear().type('eliminación', { force: true });
        
        // Aplicar filtro
        cy.get('button').contains('Buscar').click({ force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 6,
                nombre: 'TC006 - Filtrar por Acción Realizada',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR',
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorRegistroAfectado() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Seleccionar filtro "Registro Afectado"
        cy.get('select[name="filterType"], select[name="filter-type"]').select('Registro Afectado', { force: true });
        
        // Buscar "empresa"
        cy.get('input[name="searchValue"], input[name="search-value"]').clear().type('empresa', { force: true });
        
        // Aplicar filtro
        cy.get('button').contains('Buscar').click({ force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 7,
                nombre: 'TC007 - Filtrar por Registro Afectado',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR',
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorUsuario() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Seleccionar filtro "Usuario"
        cy.get('select[name="filterType"], select[name="filter-type"]').select('Usuario', { force: true });
        
        // Buscar "admin"
        cy.get('input[name="searchValue"], input[name="search-value"]').clear().type('admin', { force: true });
        
        // Aplicar filtro
        cy.get('button').contains('Buscar').click({ force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 8,
                nombre: 'TC008 - Filtrar por Usuario',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR',
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorFecha() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Seleccionar filtro "Fecha"
        cy.get('select[name="filterType"], select[name="filter-type"]').select('Fecha', { force: true });
        
        // Buscar "11"
        cy.get('input[name="searchValue"], input[name="search-value"]').clear().type('11', { force: true });
        
        // Aplicar filtro
        cy.get('button').contains('Buscar').click({ force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 9,
                nombre: 'TC009 - Filtrar por Fecha',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR',
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorFechaDesdeHasta() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Abrir calendario "Desde"
        cy.get('input[name="fromDate"], input[name="fechaDesde"]').click({ force: true });
        cy.get('.MuiPickersCalendar-root').should('be.visible');
        cy.get('button[aria-label="Previous month"]').click({ force: true });
        cy.get('button[aria-label="1"]').click({ force: true });
        
        // Abrir calendario "Hasta"
        cy.get('input[name="toDate"], input[name="fechaHasta"]').click({ force: true });
        cy.get('.MuiPickersCalendar-root').should('be.visible');
        cy.get('button[aria-label="Next month"]').click({ force: true });
        cy.get('button[aria-label="15"]').click({ force: true });
        
        // Aplicar filtro
        cy.get('button').contains('Aplicar').click({ force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 10,
                nombre: 'TC010 - Filtrar por Fecha (Desde – Hasta)',
                esperado: 'Fechas correctas',
                obtenido: hayResultados ? 'Fechas correctas' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR',
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function busquedaTextoExacto() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Búsqueda por texto exacto
        cy.get('input[name="search"], input[placeholder*="buscar"]').clear().type('Facturas de Proveedores', { force: true });
        cy.get('button').contains('Buscar').click({ force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 11,
                nombre: 'TC011 - Búsqueda general (texto exacto)',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR',
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function busquedaTextoParcial() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Búsqueda por texto parcial
        cy.get('input[name="search"], input[placeholder*="buscar"]').clear().type('Facturas', { force: true });
        cy.get('button').contains('Buscar').click({ force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 12,
                nombre: 'TC012 - Búsqueda general (texto parcial)',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR',
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function busquedaCaseInsensitive() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Búsqueda case-insensitive
        cy.get('input[name="search"], input[placeholder*="buscar"]').clear().type('fAcTuRaS', { force: true });
        cy.get('button').contains('Buscar').click({ force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 13,
                nombre: 'TC013 - Búsqueda case-insensitive',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR',
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function busquedaConEspacios() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Búsqueda con espacios
        cy.get('input[name="search"], input[placeholder*="buscar"]').clear().type(' Facturas ', { force: true });
        cy.get('button').contains('Buscar').click({ force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 14,
                nombre: 'TC014 - Búsqueda con espacios',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR',
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function busquedaCaracteresEspeciales() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Búsqueda con caracteres especiales
        cy.get('input[name="search"], input[placeholder*="buscar"]').clear().type('%&/', { force: true });
        cy.get('button').contains('Buscar').click({ force: true });
        
        // Verificar si muestra resultados o no (debería mostrar lista vacía sin error)
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayError = $body.text().includes('Error') || $body.text().includes('error');
            
            cy.registrarResultados({
                numero: 15,
                nombre: 'TC015 - Búsqueda con caracteres especiales',
                esperado: 'Si no hay match, lista vacía sin error.',
                obtenido: hayError ? 'Error al buscar' : 'Si no hay match, lista vacía sin error.',
                resultado: hayError ? 'ERROR' : 'OK',
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function ordenarPorAccionRealizada() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Ordenar por Acción Realizada ASC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Acción Realizada')
            .should('be.visible')
            .parent()
            .find('[aria-label="Acción Realizada column menu"]')
            .click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);
        
        // Ordenar por Acción Realizada DESC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Acción Realizada')
            .should('be.visible')
            .parent()
            .find('[aria-label="Acción Realizada column menu"]')
            .click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorTablaAfectada() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Ordenar por Tabla Afectada ASC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Tabla Afectada')
            .should('be.visible')
            .parent()
            .find('[aria-label="Tabla Afectada column menu"]')
            .click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);
        
        // Ordenar por Tabla Afectada DESC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Tabla Afectada')
            .should('be.visible')
            .parent()
            .find('[aria-label="Tabla Afectada column menu"]')
            .click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorRegistroAfectado() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Ordenar por Registro Afectado ASC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Registro Afectado')
            .should('be.visible')
            .parent()
            .find('[aria-label="Registro Afectado column menu"]')
            .click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);
        
        // Ordenar por Registro Afectado DESC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Registro Afectado')
            .should('be.visible')
            .parent()
            .find('[aria-label="Registro Afectado column menu"]')
            .click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorUsuario() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Ordenar por Usuario ASC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Usuario')
            .should('be.visible')
            .parent()
            .find('[aria-label="Usuario column menu"]')
            .click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);
        
        // Ordenar por Usuario DESC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Usuario')
            .should('be.visible')
            .parent()
            .find('[aria-label="Usuario column menu"]')
            .click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorFecha() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Ordenar por Fecha ASC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha')
            .should('be.visible')
            .parent()
            .find('[aria-label="Fecha column menu"]')
            .click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);
        
        // Ordenar por Fecha DESC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha')
            .should('be.visible')
            .parent()
            .find('[aria-label="Fecha column menu"]')
            .click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filterValueEnColumnaUsuario() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Ir a la columna "Tabla Afectada" y seleccionar Filter
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Tabla Afectada')
            .should('be.visible')
            .parent()
            .find('[aria-label="Tabla Afectada column menu"]')
            .click({ force: true });
        cy.get('li').contains('Filter').click({ force: true });
        
        // Escribir "avisos" en el campo Value
        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('avisos', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ocultarColumna() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Ir a la columna "Tabla Afectada" y seleccionar Hide column
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Tabla Afectada')
            .should('be.visible')
            .parent()
            .find('[aria-label="Tabla Afectada column menu"]')
            .click({ force: true });
        cy.get('li').contains('Hide column').click({ force: true });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function mostrarOcultarColumnas() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Ir a la columna "Acción Realizada" y seleccionar Manage columns
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Acción Realizada')
            .should('be.visible')
            .parent()
            .find('[aria-label="Acción Realizada column menu"]')
            .click({ force: true });
        cy.get('li').contains('Manage columns').click({ force: true });
        
        // Marcar "Tabla Afectada" para que vuelva a ser visible
        cy.get('input[type="checkbox"]').check({ force: true });
        
        return cy.get('.MuiDataGrid-panel').should('be.visible');
    }

    function scrollHorizontalVertical() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Hacer scroll horizontal
        cy.get('.MuiDataGrid-root').scrollTo('right', { duration: 1000 });
        cy.wait(500);
        
        // Hacer scroll vertical
        cy.get('.MuiDataGrid-root').scrollTo('bottom', { duration: 1000 });
        cy.wait(500);
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function resetFiltrosRecargar() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Buscar "avisos" en el buscador
        cy.get('input[name="search"], input[placeholder*="buscar"]').clear().type('avisos', { force: true });
        cy.get('button').contains('Buscar').click({ force: true });
        cy.wait(1000);
        
        // Recargar la página
        cy.reload();
        cy.wait(2000);
        
        // Verificar que vuelve a su estado inicial (sin filtros)
        cy.get('input[name="search"], input[placeholder*="buscar"]').should('have.value', '');
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function seleccionarFila() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Hacer clic en la primera fila
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function seleccionarTabla() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Hacer clic en el desplegable de Tabla
        cy.get('select[name="table"], select[name="tabla"]').select('avisos', { force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 27,
                nombre: 'TC027 - Seleccionar Tabla',
                esperado: 'Se muestran los registros de esa tabla',
                obtenido: hayResultados ? 'Se muestran los registros de esa tabla' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR',
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function seleccionarUsuario() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Hacer clic en el desplegable de Usuario
        cy.get('select[name="user"], select[name="usuario"]').select('adminnovatrans', { force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 28,
                nombre: 'TC028 - Seleccionar Usuario',
                esperado: 'Se muestran los registros de ese usuario',
                obtenido: hayResultados ? 'Se muestran los registros de ese usuario' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR',
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }
});
