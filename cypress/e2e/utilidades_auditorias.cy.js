describe('UTILIDADES (AUDITORÍAS) - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Acceder a la pantalla correctamente', funcion: accederPantalla, prioridad: 'ALTA' },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' },
        { numero: 5, nombre: 'TC005 - Filtrar por Tabla Afectada', funcion: filtrarPorTablaAfectada, prioridad: 'ALTA' },
        { numero: 6, nombre: 'TC006 - Filtrar por Acción Realizada', funcion: filtrarPorAccionRealizada, prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - Filtrar por Registro Afectado', funcion: filtrarPorRegistroAfectado, prioridad: 'MEDIA' },
        { numero: 8, nombre: 'TC008 - Filtrar por Usuario', funcion: filtrarPorUsuario, prioridad: 'ALTA' },
        { numero: 9, nombre: 'TC009 - Filtrar por Fecha', funcion: filtrarPorFecha, prioridad: 'ALTA' },
        { numero: 10, nombre: 'TC010 - Filtrar por Fecha (Desde – Hasta)', funcion: filtrarPorFechaDesdeHasta, prioridad: 'ALTA' },
        { numero: 11, nombre: 'TC011 - Búsqueda general (texto exacto)', funcion: busquedaTextoExacto, prioridad: 'ALTA' },
        { numero: 12, nombre: 'TC012 - Búsqueda general (texto parcial)', funcion: busquedaTextoParcial, prioridad: 'ALTA' },
        { numero: 13, nombre: 'TC013 - Búsqueda case-insensitive', funcion: busquedaCaseInsensitive, prioridad: 'MEDIA' },
        { numero: 14, nombre: 'TC014 - Búsqueda con espacios', funcion: busquedaConEspacios, prioridad: 'MEDIA' },
        { numero: 15, nombre: 'TC015 - Búsqueda con caracteres especiales', funcion: busquedaCaracteresEspeciales, prioridad: 'BAJA' },
        { numero: 16, nombre: 'TC016 - Ordenar por Acción Realizada ASC/DESC', funcion: ordenarPorAccionRealizada, prioridad: 'MEDIA' },
        { numero: 17, nombre: 'TC017 - Ordenar por Tabla Afectada ASC/DESC', funcion: ordenarPorTablaAfectada, prioridad: 'MEDIA' },
        { numero: 18, nombre: 'TC018 - Ordenar por Registro Afectado ASC/DESC', funcion: ordenarPorRegistroAfectado, prioridad: 'BAJA' },
        { numero: 19, nombre: 'TC019 - Ordenar por Usuario ASC/DESC', funcion: ordenarPorUsuario, prioridad: 'MEDIA' },
        { numero: 20, nombre: 'TC020 - Ordenar por Fecha ASC/DESC', funcion: ordenarPorFecha, prioridad: 'MEDIA' },
        { numero: 21, nombre: 'TC021 - Filter → Value en columna Usuario', funcion: filterValueEnColumnaUsuario, prioridad: 'MEDIA' },
        { numero: 22, nombre: 'TC022 - Ocultar columna (Hide column)', funcion: ocultarColumna, prioridad: 'BAJA' },
        { numero: 23, nombre: 'TC023 - Mostrar/Ocultar columnas (Manage)', funcion: mostrarOcultarColumnas, prioridad: 'BAJA' },
        { numero: 24, nombre: 'TC024 - Scroll horizontal y vertical', funcion: scrollHorizontalVertical, prioridad: 'BAJA' },
        { numero: 25, nombre: 'TC025 - Reset de filtros al recargar página', funcion: resetFiltrosRecargar, prioridad: 'MEDIA' },
        { numero: 26, nombre: 'TC026 - Seleccionar fila', funcion: seleccionarFila, prioridad: 'ALTA' },
        { numero: 27, nombre: 'TC027 - Seleccionar Tabla', funcion: seleccionarTabla, prioridad: 'ALTA' },
        { numero: 28, nombre: 'TC028 - Seleccionar Usuario', funcion: seleccionarUsuario, prioridad: 'ALTA' },
    ];

    // Resumen al final
    after(() => {
        cy.log('Procesando resultados finales para Utilidades (Auditorías)');
        cy.procesarResultadosPantalla('Utilidades (Auditorías)');
    });

    // Filtrar casos por prioridad si se especifica
    const prioridadFiltro = Cypress.env('prioridad');
    const casosFiltrados = prioridadFiltro && prioridadFiltro !== 'todas' 
        ? casos.filter(caso => caso.prioridad === prioridadFiltro.toUpperCase())
        : casos;

    // Iterador de casos con protección anti-doble-registro
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
                    pantalla: 'Utilidades (Auditorías)'
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
                            pantalla: 'Utilidades (Auditorías)'
                        });
                    }
                });
            });
        });
    });

    // ===== FUNCIONES DE PRUEBA =====

    function accederPantalla() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        cy.get('.MuiDataGrid-root').should('exist');
        cy.get('input[placeholder*="Buscar"]').should('exist');
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
        
        cy.get('select[name="column"]').select('Tabla Afectada', { force: true });
        cy.get('input[placeholder="Buscar"]').type('avisos{enter}', { force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 5,
                nombre: 'TC005 - Filtrar por Tabla Afectada',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR', // Ahora OK si funciona, ERROR si no
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorAccionRealizada() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        cy.get('select[name="column"]').select('Acción Realizada', { force: true });
        cy.get('input[placeholder="Buscar"]').type('eliminación{enter}', { force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 6,
                nombre: 'TC006 - Filtrar por Acción Realizada',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR', // Ahora OK si funciona, ERROR si no
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorRegistroAfectado() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        cy.get('select[name="column"]').select('Registro Afectado', { force: true });
        cy.get('input[placeholder="Buscar"]').type('empresa{enter}', { force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 7,
                nombre: 'TC007 - Filtrar por Registro Afectado',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR', // Ahora OK si funciona, ERROR si no
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorUsuario() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        cy.get('select[name="column"]').select('Usuario', { force: true });
        cy.get('input[placeholder="Buscar"]').type('admin{enter}', { force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 8,
                nombre: 'TC008 - Filtrar por Usuario',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR', // Ahora OK si funciona, ERROR si no
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorFecha() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        cy.get('select[name="column"]').select('Fecha', { force: true });
        cy.get('input[placeholder="Buscar"]').type('11{enter}', { force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 9,
                nombre: 'TC009 - Filtrar por Fecha',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR', // Ahora OK si funciona, ERROR si no
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorFechaDesdeHasta() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');

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

        // Verificar si muestra resultados o no
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 10,
                nombre: 'TC010 - Filtrar por Fecha (Desde – Hasta)',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR', // Ahora OK si funciona, ERROR si no
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function busquedaTextoExacto() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        cy.get('input[placeholder="Buscar"]').type('Facturas de Proveedores{enter}', { force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 11,
                nombre: 'TC011 - Búsqueda general (texto exacto)',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR', // Ahora OK si funciona, ERROR si no
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function busquedaTextoParcial() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        cy.get('input[placeholder="Buscar"]').type('Facturas{enter}', { force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 12,
                nombre: 'TC012 - Búsqueda general (texto parcial)',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR', // Ahora OK si funciona, ERROR si no
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function busquedaCaseInsensitive() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        cy.get('input[placeholder="Buscar"]').type('fAcTuRaS{enter}', { force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 13,
                nombre: 'TC013 - Búsqueda case-insensitive',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR', // Ahora OK si funciona, ERROR si no
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function busquedaConEspacios() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        cy.get('input[placeholder="Buscar"]').type(' Facturas {enter}', { force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 14,
                nombre: 'TC014 - Búsqueda con espacios',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR', // Ahora OK si funciona, ERROR si no
                pantalla: 'Utilidades (Auditorías)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function busquedaCaracteresEspeciales() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        cy.get('input[placeholder="Buscar"]').type('%&/', { force: true });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function ordenarPorAccionRealizada() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Acción Realizada').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Acción Realizada').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorTablaAfectada() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Tabla Afectada').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Tabla Afectada').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorRegistroAfectado() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Registro Afectado').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Registro Afectado').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorUsuario() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Usuario').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Usuario').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorFecha() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Hacer scroll horizontal si es necesario para ver la columna Fecha
        cy.get('body').then($body => {
            if ($body.find('.MuiDataGrid-columnHeaderTitle:contains("Fecha")').length === 0) {
                // Si no está visible, hacer scroll horizontal
                cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 400 });
                cy.wait(500);
            }
        });

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha').should('be.visible').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha').should('be.visible').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filterValueEnColumnaUsuario() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Tabla Afectada')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Tabla Afectada column menu"]').click({ force: true });
        cy.get('li').contains(/Filter|Filtro|Filtros/i).click({ force: true });

        // Escribir "avisos" en el campo Value
        cy.get('input[placeholder="Filter value"], input[placeholder*="Filtro"]')
            .should('exist')
            .clear()
            .type('avisos', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ocultarColumna() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Usar el patrón de incidencias para ocultar columna
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Tabla Afectada')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Tabla Afectada column menu"]').click({ force: true });
        cy.get('li').contains(/Hide column|Ocultar/i).click({ force: true });

        return cy.get('[data-field="tablaAfectada"]').should('not.exist');
    }

    function mostrarOcultarColumnas() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        // Usar el patrón de gastosgenerales para manage columns
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Acción Realizada')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Acción Realizada column menu"]').click({ force: true });
        cy.get('li').contains(/Manage columns|Administrar columnas/i).click({ force: true });

        cy.get('.MuiDataGrid-panel')
            .should('be.visible')
            .find('label')
            .contains('Tabla Afectada')
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });

        // Solo verificar que el panel esté visible, sin verificar los encabezados
        return cy.get('.MuiDataGrid-panel').should('be.visible');
    }

    function scrollHorizontalVertical() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
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

    function resetFiltrosRecargar() {
        cy.navegarAMenu('Utilidades', 'Auditorías');
        cy.url().should('include', '/dashboard/audits');
        
        cy.get('input[placeholder="Buscar"]').type('avisos', { force: true });
        cy.reload();
        cy.get('input[placeholder="Buscar"]').should('have.value', '');
        return cy.get('.MuiDataGrid-root').should('exist');
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
        
        // Interactuar con el dropdown Material-UI para seleccionar tabla
        cy.get('.MuiSelect-select').first().click({ force: true });
        cy.get('li').contains('Avisos').click({ force: true });
        
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
        
        // Interactuar con el dropdown Material-UI para seleccionar usuario
        cy.get('.MuiSelect-select').eq(1).click({ force: true });
        cy.get('li').contains('adminnovatrans').click({ force: true });
        
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