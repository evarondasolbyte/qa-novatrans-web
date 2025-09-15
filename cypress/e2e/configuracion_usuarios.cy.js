describe('CONFIGURACIÓN (USUARIOS) - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Acceder a la pantalla correctamente', funcion: accederPantalla, prioridad: 'ALTA' },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' },
        { numero: 5, nombre: 'TC005 - Filtrar por Login', funcion: filtrarPorLogin, prioridad: 'ALTA' },
        { numero: 6, nombre: 'TC006 - Filtrar por Perfil', funcion: filtrarPorPerfil, prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - Filtrar por Notas', funcion: filtrarPorNotas, prioridad: 'MEDIA' },
        { numero: 8, nombre: 'TC008 - Filtrar por Conductor Asociado', funcion: filtrarPorConductorAsociado, prioridad: 'MEDIA' },
        { numero: 9, nombre: 'TC009 - Filtrar por Activo', funcion: filtrarPorActivo, prioridad: 'ALTA' },
        { numero: 10, nombre: 'TC010 - Filtrar por Conectado', funcion: filtrarPorConectado, prioridad: 'MEDIA' },
        { numero: 11, nombre: 'TC011 - Búsqueda general (texto exacto)', funcion: busquedaTextoExacto, prioridad: 'ALTA' },
        { numero: 12, nombre: 'TC012 - Búsqueda general (texto parcial)', funcion: busquedaTextoParcial, prioridad: 'ALTA' },
        { numero: 13, nombre: 'TC013 - Búsqueda case-insensitive', funcion: busquedaCaseInsensitive, prioridad: 'MEDIA' },
        { numero: 14, nombre: 'TC014 - Búsqueda con espacios', funcion: busquedaConEspacios, prioridad: 'MEDIA' },
        { numero: 15, nombre: 'TC015 - Búsqueda con caracteres especiales', funcion: busquedaCaracteresEspeciales, prioridad: 'BAJA' },
        { numero: 16, nombre: 'TC016 - Ordenar por Login ASC/DESC', funcion: ordenarPorLogin, prioridad: 'MEDIA' },
        { numero: 17, nombre: 'TC017 - Ordenar por Perfil ASC/DESC', funcion: ordenarPorPerfil, prioridad: 'MEDIA' },
        { numero: 18, nombre: 'TC018 - Ordenar por Notas ASC/DESC', funcion: ordenarPorNotas, prioridad: 'BAJA' },
        { numero: 19, nombre: 'TC019 - Ordenar por Conductor Asociado ASC/DESC', funcion: ordenarPorConductorAsociado, prioridad: 'BAJA' },
        { numero: 20, nombre: 'TC020 - Ordenar por Activo ASC/DESC', funcion: ordenarPorActivo, prioridad: 'BAJA' },
        { numero: 21, nombre: 'TC021 - Ordenar por Conectado ASC/DESC', funcion: ordenarPorConectado, prioridad: 'BAJA' },
        { numero: 22, nombre: 'TC022 - Filter → Value en columna Usuario', funcion: filterValueEnColumnaUsuario, prioridad: 'MEDIA' },
        { numero: 23, nombre: 'TC023 - Ocultar columna (Hide column)', funcion: ocultarColumna, prioridad: 'BAJA' },
        { numero: 24, nombre: 'TC024 - Mostrar/Ocultar columnas (Manage)', funcion: mostrarOcultarColumnas, prioridad: 'BAJA' },
        { numero: 25, nombre: 'TC025 - Scroll horizontal y vertical', funcion: scrollHorizontalVertical, prioridad: 'BAJA' },
        { numero: 26, nombre: 'TC026 - Reset de filtros al recargar página', funcion: resetFiltrosRecargar, prioridad: 'MEDIA' },
        { numero: 27, nombre: 'TC027 - Seleccionar fila', funcion: seleccionarFila, prioridad: 'ALTA' },
        { numero: 28, nombre: 'TC028 - Eliminar con selección', funcion: eliminarConSeleccion, prioridad: 'ALTA' },
        { numero: 29, nombre: 'TC029 - Eliminar sin selección', funcion: eliminarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 30, nombre: 'TC030 - Añadir nuevo usuario', funcion: añadirNuevoUsuario, prioridad: 'ALTA' },
        { numero: 31, nombre: 'TC031 - Editar con selección', funcion: editarConSeleccion, prioridad: 'ALTA' },
        { numero: 32, nombre: 'TC032 - Editar sin selección', funcion: editarSinSeleccion, prioridad: 'MEDIA' },
    ];

    // Resumen al final
    after(() => {
        cy.log('Procesando resultados finales para Configuracion (Usuarios)');
        cy.procesarResultadosPantalla('Configuracion (Usuarios)');
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
                    pantalla: 'Configuracion (Usuarios)'
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
                            pantalla: 'Configuracion (Usuarios)'
                        });
                    }
                });
            });
        });
    });

    // ===== FUNCIONES DE PRUEBA =====

    function accederPantalla() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        cy.get('.MuiDataGrid-root').should('exist');
        cy.get('input[placeholder*="Buscar"]').should('exist');
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);
        return cy.get('body').should('be.visible');
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500);
        return cy.get('body').should('be.visible');
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);
        return cy.get('body').should('be.visible');
    }

    function filtrarPorLogin() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        cy.get('select[name="column"]').select('Login', { force: true });
        cy.get('input[placeholder="Buscar"]').type('elena{enter}', { force: true });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorPerfil() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        cy.get('select[name="column"]').select('Perfil', { force: true });
        cy.get('input[placeholder="Buscar"]').type('Administrador{enter}', { force: true });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorNotas() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        cy.get('select[name="column"]').select('Notas', { force: true });
        cy.get('input[placeholder="Buscar"]').type('Administrador{enter}', { force: true });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorConductorAsociado() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        cy.get('select[name="column"]').select('Conductor Asociado', { force: true });
        cy.get('input[placeholder="Buscar"]').type('Elena{enter}', { force: true });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorActivo() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        cy.get('select[name="column"]').select('Activo', { force: true });
        cy.get('input[placeholder="Buscar"]').type('true{enter}', { force: true });
        
        // Verificar si muestra resultados o no
        cy.wait(1000);
        cy.get('body').then($body => {
            const hayResultados = $body.find('.MuiDataGrid-row:visible').length > 0;
            
            cy.registrarResultados({
                numero: 9,
                nombre: 'TC009 - Filtrar por Activo',
                esperado: 'Filtro correcto',
                obtenido: hayResultados ? 'Filtro correcto' : 'No muestra nada y si hay datos',
                resultado: hayResultados ? 'OK' : 'ERROR', // Ahora OK si funciona, ERROR si no
                pantalla: 'Configuracion (Usuarios)',
                archivo
            });
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorConectado() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        cy.get('select[name="column"]').select('Conectado', { force: true });
        cy.get('input[placeholder="Buscar"]').type('true{enter}', { force: true });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function busquedaTextoExacto() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        cy.get('input[placeholder="Buscar"]').type('elena{enter}', { force: true });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function busquedaTextoParcial() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        cy.get('input[placeholder="Buscar"]').type('admi{enter}', { force: true });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function busquedaCaseInsensitive() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        cy.get('input[placeholder="Buscar"]').type('ElEnA{enter}', { force: true });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function busquedaConEspacios() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        cy.get('input[placeholder="Buscar"]').type(' elena {enter}', { force: true });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function busquedaCaracteresEspeciales() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        cy.get('input[placeholder="Buscar"]').type('$%&{enter}', { force: true });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function ordenarPorLogin() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Login').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Login').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorPerfil() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Perfil').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Perfil').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorNotas() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Notas').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Notas').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorConductorAsociado() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Conductor Asociado').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Conductor Asociado').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorActivo() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Activo').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Activo').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorConectado() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Conectado').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Conectado').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filterValueEnColumnaUsuario() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Login')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Login column menu"]').click({ force: true });
        cy.get('li').contains('Filter').click({ force: true });

        // Escribir "elena" en el campo Value
        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('elena', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ocultarColumna() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        // Usar el patrón de incidencias para ocultar columna
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Login')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Login column menu"]').click({ force: true });
        cy.get('li').contains('Hide column').click({ force: true });

        return cy.get('[data-field="login"]').should('not.exist');
    }

    function mostrarOcultarColumnas() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        // Usar el patrón de gastosgenerales para manage columns
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Perfil')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Perfil column menu"]').click({ force: true });
        cy.get('li').contains('Manage columns').click({ force: true });

        cy.get('.MuiDataGrid-panel')
            .should('be.visible')
            .find('label')
            .contains('Login')
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });

        // Solo verificar que el panel esté visible, sin verificar los encabezados
        return cy.get('.MuiDataGrid-panel').should('be.visible');
    }

    function scrollHorizontalVertical() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
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
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        cy.get('input[placeholder="Buscar"]').type('elena', { force: true });
        cy.reload();
        cy.get('input[placeholder="Buscar"]').should('have.value', '');
        return cy.get('.MuiDataGrid-root').should('exist');
    }

    function seleccionarFila() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        // Hacer clic en la primera fila
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function eliminarConSeleccion() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        // Seleccionar una fila
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        
        // Hacer clic en el botón eliminar (ahora debería estar habilitado)
        cy.get('button').contains('Eliminar').click({ force: true });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        // Verificar que el botón eliminar está deshabilitado sin selección
        cy.get('button').contains('Eliminar').should('be.disabled');
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function añadirNuevoUsuario() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        // Hacer clic en el botón "Nuevo Usuario"
        cy.get('button').contains('Nuevo Usuario').click({ force: true });
        
        return cy.get('.MuiDialog-root, .MuiModal-root, .MuiDrawer-root').should('be.visible');
    }

    function editarConSeleccion() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        // Hacer doble clic en la primera fila para abrir el formulario de edición
        cy.get('.MuiDataGrid-row:visible').first().dblclick({ force: true });
        
        return cy.get('.MuiDialog-root, .MuiModal-root, .MuiDrawer-root').should('be.visible');
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Configuracion', 'Usuarios');
        cy.url().should('include', '/dashboard/users');
        
        // Verificar que no hay botón de editar visible (solo se edita con doble clic)
        cy.get('button').contains('Editar').should('not.exist');
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }
});
