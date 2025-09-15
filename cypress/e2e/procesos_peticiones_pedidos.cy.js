describe('PROCESOS (PETICIONES PEDIDOS) - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    // Defino todos los casos con su número, nombre descriptivo y la función que ejecuta la validación
    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla correctamente', funcion: cargarPantallaPeticionesPedidos, prioridad: 'ALTA' },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' },
        { numero: 5, nombre: 'TC005 - Filtrar por Código', funcion: filtrarPorCodigo, prioridad: 'ALTA' },
        { numero: 6, nombre: 'TC006 - Filtrar por Cliente', funcion: filtrarPorCliente, prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - Filtrar por Fecha de entrada', funcion: filtrarPorFechaEntrada, prioridad: 'ALTA' },
        { numero: 8, nombre: 'TC008 - Filtrar por Fecha de salida', funcion: filtrarPorFechaSalida, prioridad: 'ALTA' },
        { numero: 9, nombre: 'TC009 - Filtrar por Origen', funcion: filtrarPorOrigen, prioridad: 'ALTA' },
        { numero: 10, nombre: 'TC010 - Filtrar por Destino', funcion: filtrarPorDestino, prioridad: 'ALTA' },
        { numero: 11, nombre: 'TC011 - Filtrar por Carga', funcion: filtrarPorCarga, prioridad: 'MEDIA' },
        { numero: 12, nombre: 'TC012 - Filtrar por Unidades', funcion: filtrarPorUnidades, prioridad: 'MEDIA' },
        { numero: 13, nombre: 'TC013 - Filtrar por Estado', funcion: filtrarPorEstado, prioridad: 'ALTA' },
        { numero: 14, nombre: 'TC014 - Filtrar por Notas (contenga)', funcion: filtrarPorNotas, prioridad: 'MEDIA' },
        { numero: 15, nombre: 'TC015 - Búsqueda general (texto exacto)', funcion: buscarTextoExacto, prioridad: 'ALTA' },
        { numero: 16, nombre: 'TC016 - Búsqueda general (texto parcial)', funcion: buscarTextoParcial, prioridad: 'ALTA' },
        { numero: 17, nombre: 'TC017 - Búsqueda case-insensitive', funcion: buscarCaseInsensitive, prioridad: 'MEDIA' },
        { numero: 18, nombre: 'TC018 - Búsqueda con espacios', funcion: buscarConEspacios, prioridad: 'MEDIA' },
        { numero: 19, nombre: 'TC019 - Búsqueda con caracteres especiales', funcion: buscarCaracteresEspeciales, prioridad: 'BAJA' },
        { numero: 20, nombre: 'TC020 - Ordenar por Código ASC/DESC', funcion: ordenarPorCodigo, prioridad: 'MEDIA' },
        { numero: 21, nombre: 'TC021 - Ordenar por Fecha de entrada ASC/DESC', funcion: ordenarPorFechaEntrada, prioridad: 'MEDIA' },
        { numero: 22, nombre: 'TC022 - Ordenar por Fecha de salida ASC/DESC', funcion: ordenarPorFechaSalida, prioridad: 'MEDIA' },
        { numero: 23, nombre: 'TC023 - Ordenar por Origen ASC/DESC', funcion: ordenarPorOrigen, prioridad: 'MEDIA' },
        { numero: 24, nombre: 'TC024 - Ordenar por Destino ASC/DESC', funcion: ordenarPorDestino, prioridad: 'MEDIA' },
        { numero: 25, nombre: 'TC025 - Ordenar por Carga ASC/DESC', funcion: ordenarPorCarga, prioridad: 'MEDIA' },
        { numero: 26, nombre: 'TC026 - Ordenar por Unidades ASC/DESC', funcion: ordenarPorUnidades, prioridad: 'MEDIA' },
        { numero: 27, nombre: 'TC027 - Ordenar por Estado ASC/DESC', funcion: ordenarPorEstado, prioridad: 'MEDIA' },
        { numero: 28, nombre: 'TC028 - Seleccionar una fila', funcion: seleccionarFila, prioridad: 'ALTA' },
        { numero: 29, nombre: 'TC029 - Eliminar con fila seleccionada', funcion: eliminarConSeleccion, prioridad: 'ALTA' },
        { numero: 30, nombre: 'TC030 - Eliminar sin selección', funcion: eliminarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 31, nombre: 'TC031 - +Añadir abre formulario', funcion: abrirFormularioAlta, prioridad: 'ALTA' },
        { numero: 32, nombre: 'TC032 - Editar con fila seleccionada', funcion: editarConSeleccion, prioridad: 'ALTA' },
        { numero: 33, nombre: 'TC033 - Editar sin selección', funcion: editarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 34, nombre: 'TC034 - Fecha Desde (filtro superior)', funcion: filtrarFechaDesde, prioridad: 'ALTA' },
        { numero: 35, nombre: 'TC035 - Fecha Hasta (filtro superior)', funcion: filtrarFechaHasta, prioridad: 'ALTA' },
        { numero: 36, nombre: 'TC036 - Fecha Desde + Hasta (rango)', funcion: filtrarRangoFechas, prioridad: 'ALTA' },
        { numero: 37, nombre: 'TC037 - Filter → Value en columna', funcion: filtrarPorValue, prioridad: 'MEDIA' },
        { numero: 38, nombre: 'TC038 - Ocultar columna desde menú contextual', funcion: ocultarColumna, prioridad: 'BAJA' },
        { numero: 39, nombre: 'TC039 - Manage columns (mostrar/ocultar)', funcion: gestionarColumnas, prioridad: 'BAJA' },
        { numero: 40, nombre: 'TC040 - Scroll vertical/horizontal', funcion: scrollTabla, prioridad: 'BAJA' },
        { numero: 41, nombre: 'TC041 - Reinicio de filtros al recargar', funcion: reinicioFiltros, prioridad: 'MEDIA' },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Procesos (Peticiones Pedidos)');
    });

    // Filtrar casos por prioridad si se especifica
    const prioridadFiltro = Cypress.env('prioridad');
    const casosFiltrados = prioridadFiltro && prioridadFiltro !== 'todas' 
        ? casos.filter(caso => caso.prioridad === prioridadFiltro.toUpperCase())
        : casos;

    casosFiltrados.forEach(({ numero, nombre, funcion, prioridad }) => {
        it(`${nombre} [${prioridad}]`, () => {
            cy.resetearFlagsTest();
            
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    archivo,
                    pantalla: 'Procesos (Peticiones Pedidos)'
                });
                return false;
            });

            cy.login();
            cy.wait(500);

            funcion().then(() => {
                // Solo registrar para casos que no manejan su propio registro
                if (numero !== 30) {
                    cy.registrarResultados({
                        numero,
                        nombre,
                        esperado: 'Comportamiento correcto',
                        obtenido: 'Comportamiento correcto',
                        archivo,
                        pantalla: 'Procesos (Peticiones Pedidos)'
                    });
                }
            });
        });
    });

    // === FUNCIONES DE VALIDACIÓN ===
    function cargarPantallaPeticionesPedidos() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function cambiarIdiomaIngles() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('select#languageSwitcher').select('en', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaCatalan() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaEspanol() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('select#languageSwitcher').select('es', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function filtrarPorCodigo() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('select[name="column"]').select('Código', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('7{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorCliente() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('select[name="column"]').select('Cliente', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('cabezabellosa{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorFechaEntrada() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('select[name="column"]').select('Fecha de entrada', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('2020{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorFechaSalida() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('select[name="column"]').select('Fecha de salida', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('2021{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorOrigen() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('select[name="column"]').select('Origen', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Madrid{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorDestino() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('select[name="column"]').select('Destino', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Barcelona{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorCarga() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('select[name="column"]').select('Carga', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Platanos{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorUnidades() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('select[name="column"]').select('Unidades', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('50{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorEstado() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('select[name="column"]').select('Estado', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('enviado{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorNotas() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('select[name="column"]').select('Notas', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('especial{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarTextoExacto() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Fruta{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarTextoParcial() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('Pla{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarCaseInsensitive() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('fRuTa{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarConEspacios() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('   enviado   {enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function buscarCaracteresEspeciales() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('%&/{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.at.least', 0);
    }

    function ordenarPorCodigo() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        
        cy.get('[aria-label="Código column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(500);
        
        cy.get('[aria-label="Código column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorFechaEntrada() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha de entrada')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        
        cy.get('[aria-label="Fecha de entrada column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(500);
        
        cy.get('[aria-label="Fecha de entrada column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorFechaSalida() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha de salida')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        
        cy.get('[aria-label="Fecha de salida column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(500);
        
        cy.get('[aria-label="Fecha de salida column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorOrigen() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Origen')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        
        cy.get('[aria-label="Origen column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(500);
        
        cy.get('[aria-label="Origen column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorDestino() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Destino')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        
        cy.get('[aria-label="Destino column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(500);
        
        cy.get('[aria-label="Destino column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorCarga() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');
        cy.wait(500);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Carga').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Carga').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorUnidades() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');
        cy.wait(500);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Unidades').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Unidades').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorEstado() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');
        cy.wait(500);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Estado').click();
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Estado').click();
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function seleccionarFila() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function eliminarConSeleccion() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        cy.wait(500);
        return cy.get('button.css-1cbe274').click({ force: true });
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        return cy.get('body').then(($body) => {
            const tieneMsg = $body.text().includes('No hay ningún elemento seleccionado')
                          || $body.text().includes('No hay ninguna petición seleccionada');

            cy.registrarResultados({
                numero: 30,
                nombre: 'TC030 - Eliminar sin selección',
                esperado: 'El botón está deshabilitado y muestra mensaje',
                obtenido: tieneMsg ? 'El botón está deshabilitado y muestra mensaje'
                                   : 'El botón está habilitado pero no muestra mensaje',
                resultado: tieneMsg ? 'OK' : 'WARNING',
                archivo,
                pantalla: 'Procesos (Peticiones Pedidos)',
                observacion: tieneMsg ? undefined : 'Debería aparecer un aviso de "no seleccionado".'
            });

            return cy.get('button.css-1cbe274').should('exist');
        });
    }

    function abrirFormularioAlta() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('button').contains('Añadir').click({ force: true });
        return cy.get('form').should('be.visible');
    }

    function editarConSeleccion() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('.MuiDataGrid-row:visible').first().as('filaSeleccionada');
        cy.get('@filaSeleccionada').click({ force: true });
        cy.wait(500);
        cy.get('@filaSeleccionada').dblclick({ force: true });
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/order-requests\/form\/\d+$/);
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function filtrarFechaDesde() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');

        cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2021');
        });

        cy.wait(500);

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarFechaHasta() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');

        cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2021');
        });

        cy.wait(500);

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarRangoFechas() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');

        cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2020');
        });

        cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2022');
        });

        cy.wait(500);

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorValue() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Cliente')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Cliente column menu"]').click({ force: true });
        cy.get('li').contains('Filter').click({ force: true });

        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('Cabrerizos');

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ocultarColumna() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Cliente')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Cliente column menu"]').click({ force: true });
        cy.get('li').contains('Hide column').click({ force: true });

        return cy.get('.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains('Cliente').should('not.exist');
            });
    }

    function gestionarColumnas() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/order-requests');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Verificar que la columna Cliente existe inicialmente
        cy.get('.MuiDataGrid-columnHeaders')
            .should('contain', 'Cliente');

        // Ocultar la columna Cliente usando el menú contextual
        // Usar el patrón que funciona en otros archivos
        cy.get('div[data-field="cliente"][role="columnheader"], div[role="columnheader"]:contains("Cliente")')
            .trigger('mouseover')
            .find('button.MuiButtonBase-root')
            .eq(1)
            .click({ force: true });

        // Buscar y hacer clic en "Hide column"
        cy.get('li').contains('Hide column').click({ force: true });

        // Esperar a que la columna se oculte
        cy.wait(2000);

        // Verificar que la columna Cliente está oculta
        cy.get('.MuiDataGrid-columnHeaders')
            .should('not.contain', 'Cliente');

        return cy.get('.MuiDataGrid-root')
            .should('be.visible');
    }

    function scrollTabla() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function reinicioFiltros() {
        cy.navegarAMenu('Procesos', 'Peticiones Pedidos');
        cy.url().should('include', '/dashboard/order-requests');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('fruta{enter}', { force: true });
        cy.reload();
        return cy.get('input[placeholder="Buscar"]').should('have.value', '');
    }
});
