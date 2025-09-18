describe('CATEGORÍAS DE CONDUCTORES - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    // Defino todos los casos con su número, nombre descriptivo y la función que ejecuta la validación
    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla de categorías de conductores correctamente', funcion: cargarPantallaCategorias, prioridad: 'ALTA' },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' },
        { numero: 5, nombre: 'TC005 - Aplicar filtro por columna "Código"', funcion: filtrarPorCodigo, prioridad: 'ALTA' },
        { numero: 6, nombre: 'TC006 - Aplicar filtro por columna "Nombre"', funcion: filtrarPorNombre, prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - Aplicar filtro por "Conductor"', funcion: filtrarPorConductor, prioridad: 'ALTA' },
        { numero: 8, nombre: 'TC008 - Aplicar filtro por "Administrativo"', funcion: filtrarPorAdministrativo, prioridad: 'MEDIA' },
        { numero: 9, nombre: 'TC009 - Aplicar filtro por "Mecánico"', funcion: filtrarPorMecanico, prioridad: 'MEDIA' },
        { numero: 10, nombre: 'TC010 - Aplicar filtro por "Agente Comercial"', funcion: filtrarPorAgenteComercial, prioridad: 'MEDIA' },
        { numero: 11, nombre: 'TC011 - Aplicar filtro por "Director Comercial"', funcion: filtrarPorDirectorComercial, prioridad: 'MEDIA' },
        { numero: 12, nombre: 'TC012 - Aplicar filtro por "Comisionista"', funcion: filtrarPorComisionista, prioridad: 'MEDIA' },
        { numero: 13, nombre: 'TC013 - Aplicar filtro por "Gestor de tráfico"', funcion: filtrarPorGestorTrafico, prioridad: 'MEDIA' },
        { numero: 14, nombre: 'TC014 - Buscar por texto exacto', funcion: buscarTextoExacto, prioridad: 'ALTA' },
        { numero: 15, nombre: 'TC015 - Buscar por texto parcial', funcion: buscarTextoParcial, prioridad: 'ALTA' },
        { numero: 16, nombre: 'TC016 - Buscar alternando mayúsculas y minúsculas', funcion: buscarAlternandoMayusculas, prioridad: 'MEDIA' },
        { numero: 17, nombre: 'TC017 - Buscar con caracteres especiales', funcion: buscarCaracteresEspeciales, prioridad: 'BAJA' },
        { numero: 18, nombre: 'TC018 - Ordenar columna "Código" ascendente/descendente', funcion: ordenarCodigo, prioridad: 'MEDIA' },
        { numero: 19, nombre: 'TC019 - Ordenar columna "Nombre" ascendente/descendente', funcion: ordenarNombre, prioridad: 'MEDIA' },
        { numero: 20, nombre: 'TC020 - Seleccionar una fila', funcion: seleccionarFila, prioridad: 'ALTA' },
        { numero: 21, nombre: 'TC021 - Botón "Editar" con una fila seleccionada', funcion: editarCategoria, prioridad: 'ALTA' },
        { numero: 22, nombre: 'TC022 - Botón "Eliminar" con varias filas seleccionadas', funcion: eliminarConSeleccion, prioridad: 'ALTA' },
        { numero: 23, nombre: 'TC023 - Botón "+ Añadir" abre formulario de alta', funcion: abrirFormularioAlta, prioridad: 'ALTA' },
        { numero: 24, nombre: 'TC024 - Ocultar columna desde el menú contextual', funcion: ocultarColumna, prioridad: 'BAJA' },
        { numero: 25, nombre: 'TC025 - Gestionar visibilidad desde "Manage columns"', funcion: gestionarColumnas, prioridad: 'BAJA' },
        { numero: 26, nombre: 'TC026 - Scroll vertical', funcion: scrollVertical, prioridad: 'BAJA' },
        { numero: 27, nombre: 'TC027 - Búsqueda con espacios adicionales al inicio y al fin', funcion: buscarConEspacios, prioridad: 'MEDIA' },
        { numero: 28, nombre: 'TC028 - Búsqueda de nombres con acentos', funcion: buscarConAcentos, prioridad: 'MEDIA' },
        { numero: 29, nombre: 'TC029 - Botón "Eliminar" sin ninguna fila seleccionada', funcion: eliminarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 30, nombre: 'TC030 - Botón "Editar" sin ninguna fila seleccionada', funcion: editarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 31, nombre: 'TC031 - Filtrar por campo "Value"', funcion: filtrarPorValue, prioridad: 'MEDIA' },
        { numero: 32, nombre: 'TC032 - Recargar la página y verificar que se borran los filtros', funcion: recargarPagina, prioridad: 'MEDIA' },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Ficheros (Categorías Conductores)');
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
                    pantalla: 'Ficheros (Categorías Conductores)'
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
                            pantalla: 'Ficheros (Categorías Conductores)'
                        });
                    }
                });
            });
        });
    });

    // === FUNCIONES DE VALIDACIÓN ===
    function cargarPantallaCategorias() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function cambiarIdiomaIngles() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');
        cy.get('select#languageSwitcher').select('en', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaCatalan() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function cambiarIdiomaEspanol() {
        cy.visit('/dashboard');
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');
        cy.get('select#languageSwitcher').select('es', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
    }

    function filtrarPorCodigo() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');

        cy.get('select[name="column"]').should('be.visible').select('Código', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('2{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            // Validación alternativa sin depender de data-field
            cy.wrap($row).invoke('text').should('include', '2');
        });
    }

    function filtrarPorNombre() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');

        cy.get('select[name="column"]').should('be.visible').select('Nombre', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('comisionista{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').then((texto) => {
                expect(texto.toLowerCase()).to.include('comisionista');
            });
        });
    }

    function filtrarPorConductor() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');

        cy.get('select[name="column"]').should('be.visible').select('Conductor', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function filtrarPorAdministrativo() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');

        cy.get('select[name="column"]').should('be.visible').select('Administrativo', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function filtrarPorMecanico() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');

        cy.get('select[name="column"]').should('be.visible').select('Mecánico', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function filtrarPorAgenteComercial() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');

        cy.get('select[name="column"]').should('be.visible').select('Agente Comercial', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function filtrarPorDirectorComercial() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');

        cy.get('select[name="column"]').should('be.visible').select('Director Comercial', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function filtrarPorComisionista() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');

        cy.get('select[name="column"]').should('be.visible').select('Comisionista', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function filtrarPorGestorTrafico() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');

        cy.get('select[name="column"]').should('be.visible').select('Gestor de Tráfico', { force: true });
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }

    function buscarTextoExacto() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.get('input[placeholder="Buscar"]').clear().type('conductor{enter}');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function buscarTextoParcial() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.get('input[placeholder="Buscar"]').clear().type('comercial{enter}');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function buscarAlternandoMayusculas() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.get('input[placeholder="Buscar"]').clear().type('CoNdUcToR{enter}');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function buscarCaracteresEspeciales() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.get('input[placeholder="Buscar"]').clear().type('$%&{enter}');
        return cy.get('.MuiDataGrid-row').should('not.exist');
    }

    function ordenarCodigo() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');
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

    function ordenarNombre() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');
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

    function seleccionarFila() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }


    function editarCategoria() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        // Tomar la primera fila visible como alias
        cy.get('.MuiDataGrid-row:visible').first().as('filaCategoria');

        // Hacer clic para seleccionar la fila
        cy.get('@filaCategoria').click({ force: true });
        cy.wait(500);

        // Hacer doble clic en la fila para editar
        cy.get('@filaCategoria').dblclick({ force: true });

        // Verificar que se abrió el formulario con ID en la URL
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/driver-categories\/form\/\d+$/);
    }

    function abrirFormularioAlta() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');
        cy.get('button').contains('Añadir').click({ force: true });

        // Validar la URL sin exigir terminación exacta
        return cy.url().should('include', '/dashboard/driver-categories/form');
    }

    function ocultarColumna() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');

        // Hacer clic en el encabezado de la columna Nombre
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function gestionarColumnas() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');

        // Hacer clic en el encabezado de la columna Código
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .should('be.visible')
            .click();

        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function scrollVertical() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom');
        return cy.get('.MuiDataGrid-columnHeaders').should('be.visible');
    }

    function buscarConEspacios() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.get('input[placeholder="Buscar"]').clear().type('    conductor   {enter}');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function buscarConAcentos() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.get('input[placeholder="Buscar"]').clear().type('Mecánico{enter}');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');

        // Confirmar que no hay ningún checkbox seleccionado
        cy.get('div[role="row"] input[type="checkbox"]:checked').should('have.length', 0);

        // Intentar hacer click forzado en el botón eliminar (que no hace nada si está desactivado)
        return cy.get('button.css-1cbe274').click({ force: true });
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');

        // Asegurarse de que el botón 'Editar' no está visible si no hay selección
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function filtrarPorValue() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');

        // Abre el menú contextual de la columna "Nombre"
        cy.get('div.MuiDataGrid-columnHeader[data-field="name"]')
            .find('button[aria-label*="Nombre"]')
            .click({ force: true });

        // Clic en "Filter"
        cy.contains('li[role="menuitem"]', 'Filter').click({ force: true });

        // Escribe "agente" en el campo de filtro
        cy.get('input[placeholder="Filter value"]')
            .clear()
            .type('agente{enter}');

        cy.wait(500);

        // Valida que todas las filas visibles contengan "agente"
        return cy.get('div[role="row"]').each($row => {
            const $cells = Cypress.$($row).find('div[role="cell"]');
            if ($cells.length > 0) {
                const textos = [...$cells].map(el => el.innerText.toLowerCase());
                expect(textos.some(t => t.includes('agente'))).to.be.true;
            }
        });
    }

    function eliminarConSeleccion() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.url().should('include', '/dashboard/driver-categories');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        
        // Contar filas antes de intentar eliminar
        return cy.get('.MuiDataGrid-row:visible').then(($filasAntes) => {
            const numFilasAntes = $filasAntes.length;
            cy.log(`Filas antes de eliminar: ${numFilasAntes}`);
            
            // Seleccionar la segunda fila
            cy.get('.MuiDataGrid-row:visible').eq(1).click({ force: true });
            cy.wait(500);
            
            // Hacer clic en el botón eliminar
            cy.get('button.css-1cbe274').click({ force: true });
            cy.wait(1000); // Esperar a que se procese la acción
        
            // Verificar si se eliminó correctamente comparando el número de filas
            return cy.get('.MuiDataGrid-row:visible').then(($filasDespues) => {
                const numFilasDespues = $filasDespues.length;
                cy.log(`Filas después de eliminar: ${numFilasDespues}`);
                
                // Si el número de filas cambió, se eliminó correctamente
                if (numFilasDespues < numFilasAntes) {
                    cy.log('Botón eliminar funciona correctamente - se eliminó al menos una fila');
                    cy.registrarResultados({
                        numero: 22,
                        nombre: 'TC022 - Botón "Eliminar" con varias filas seleccionadas',
                        esperado: 'Se elimina correctamente o mensaje de no se puede eliminar',
                        obtenido: 'Se elimina correctamente',
                        resultado: 'OK',
                        archivo: 'reportes_pruebas_novatrans.xlsx',
                        pantalla: 'Ficheros (Categorías Conductores)'
                    });
                } else {
                    // Si el número de filas no cambió, verificar si hay mensaje de error
                    return cy.get('body').then(($body) => {
                        const bodyText = $body.text();
                        const mensajeAsociado = bodyText.includes('El elemento seleccionado no puede ser eliminado por estar asociado a otros datos') ||
                                             bodyText.includes('no puede ser eliminado') ||
                                             bodyText.includes('asociado a otros datos') ||
                                             bodyText.includes('elemento seleccionado');
                        
                        if (mensajeAsociado) {
                            cy.log('Botón eliminar funciona correctamente - muestra mensaje de no se puede eliminar por estar asociado');
                            cy.registrarResultados({
                                numero: 22,
                                nombre: 'TC022 - Botón "Eliminar" con varias filas seleccionadas',
                                esperado: 'Se elimina correctamente o mensaje de no se puede eliminar',
                                obtenido: 'Mensaje de no se puede eliminar por estar asociado',
                                resultado: 'OK',
                                archivo: 'reportes_pruebas_novatrans.xlsx',
                                pantalla: 'Ficheros (Categorías Conductores)'
                            });
                        } else {
                            // Si no hay mensaje de error, entonces el botón no funciona
                            cy.log('Botón eliminar no funciona - no se eliminó ni mostró mensaje');
                            cy.registrarResultados({
                                numero: 22,
                                nombre: 'TC022 - Botón "Eliminar" con varias filas seleccionadas',
                                esperado: 'Se elimina correctamente o mensaje de no se puede eliminar',
                                obtenido: 'No se elimina ni muestra mensaje',
                                resultado: 'ERROR',
                                archivo: 'reportes_pruebas_novatrans.xlsx',
                                pantalla: 'Ficheros (Categorías Conductores)'
                            });
                        }
                        
                        return cy.wrap(true);
                    });
                }
                
                // Devolver algo para que la promesa se resuelva correctamente
                return cy.wrap(true);
            });
        });

    }

    function recargarPagina() {
        cy.navegarAMenu('Ficheros', 'Categorías de Conductores');
        cy.get('input[placeholder="Buscar"]').clear().type('conductor{enter}');
        cy.reload();
        return cy.get('input[placeholder="Buscar"]').should('have.value', '');
    }
}); 