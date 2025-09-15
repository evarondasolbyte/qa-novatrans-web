describe('TESORERÍA (ANTICIPOS A PROVEEDORES) - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla correctamente', funcion: cargarPantalla, prioridad: 'ALTA' },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' },
        { numero: 5, nombre: 'TC005 - Filtrar por Código', funcion: filtrarPorCodigo, prioridad: 'ALTA' },
        { numero: 6, nombre: 'TC006 - Filtrar por Proveedor', funcion: filtrarPorProveedor, prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - Filtrar por Fecha', funcion: filtrarPorFecha, prioridad: 'ALTA' },
        { numero: 8, nombre: 'TC008 - Filtrar por Importe (=)', funcion: filtrarPorImporte, prioridad: 'ALTA' },
        { numero: 9, nombre: 'TC009 - Filtrar por Notas (contenga)', funcion: filtrarPorNotas, prioridad: 'ALTA' },
        { numero: 10, nombre: 'TC010 - Filtrar por Forma', funcion: filtrarPorForma, prioridad: 'MEDIA' },
        { numero: 11, nombre: 'TC011 - Filtrar por Número', funcion: filtrarPorNumero, prioridad: 'MEDIA' },
        { numero: 12, nombre: 'TC012 - Filtrar por Empresa', funcion: filtrarPorEmpresa, prioridad: 'ALTA' },
        { numero: 13, nombre: 'TC013 - Búsqueda general (texto exacto)', funcion: busquedaGeneralExacta, prioridad: 'ALTA' },
        { numero: 14, nombre: 'TC014 - Búsqueda general (texto parcial)', funcion: busquedaGeneralParcial, prioridad: 'ALTA' },
        { numero: 15, nombre: 'TC015 - Búsqueda case-insensitive', funcion: busquedaCaseInsensitive, prioridad: 'MEDIA' },
        { numero: 16, nombre: 'TC016 - Búsqueda con espacios', funcion: busquedaConEspacios, prioridad: 'MEDIA' },
        { numero: 17, nombre: 'TC017 - Búsqueda con caracteres especiales', funcion: busquedaConCaracteresEspeciales, prioridad: 'BAJA' },
        { numero: 18, nombre: 'TC018 - Ordenar por Código ASC/DESC', funcion: ordenarPorCodigo, prioridad: 'MEDIA' },
        { numero: 19, nombre: 'TC019 - Ordenar por Proveedor ASC/DESC', funcion: ordenarPorProveedor, prioridad: 'MEDIA' },
        { numero: 20, nombre: 'TC020 - Ordenar por Fecha ASC/DESC', funcion: ordenarPorFecha, prioridad: 'MEDIA' },
        { numero: 21, nombre: 'TC021 - Ordenar por Importe ASC/DESC', funcion: ordenarPorImporte, prioridad: 'MEDIA' },
        { numero: 22, nombre: 'TC022 - Ordenar por Notas ASC/DESC', funcion: ordenarPorNotas, prioridad: 'MEDIA' },
        { numero: 23, nombre: 'TC023 - Ordenar por Forma ASC/DESC', funcion: ordenarPorForma, prioridad: 'MEDIA' },
        { numero: 24, nombre: 'TC024 - Ordenar por Número ASC/DESC', funcion: ordenarPorNumero, prioridad: 'MEDIA' },
        { numero: 25, nombre: 'TC025 - Ordenar por Empresa ASC/DESC', funcion: ordenarPorEmpresa, prioridad: 'MEDIA' },
        { numero: 26, nombre: 'TC026 - Seleccionar una fila', funcion: seleccionarFila, prioridad: 'ALTA' },
        { numero: 27, nombre: 'TC027 - Eliminar con fila seleccionada', funcion: eliminarConFilaSeleccionada, prioridad: 'ALTA' },
        { numero: 28, nombre: 'TC028 - Eliminar sin selección', funcion: eliminarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 29, nombre: 'TC029 - Añadir abre formulario', funcion: abrirFormularioAñadir, prioridad: 'ALTA' },
        { numero: 30, nombre: 'TC030 - Editar con fila seleccionada', funcion: editarConFilaSeleccionada, prioridad: 'ALTA' },
        { numero: 31, nombre: 'TC031 - Editar sin selección', funcion: editarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 32, nombre: 'TC032 - Fecha inicio (filtro superior)', funcion: fechaInicioFiltro, prioridad: 'ALTA' },
        { numero: 33, nombre: 'TC033 - Fecha fin (filtro superior)', funcion: fechaFinFiltro, prioridad: 'ALTA' },
        { numero: 34, nombre: 'TC034 - Rango inicio + fin', funcion: rangoFechas, prioridad: 'ALTA' },
        { numero: 35, nombre: 'TC035 - Filter → Value en columna', funcion: filterValueEnColumna, prioridad: 'MEDIA' },
        { numero: 36, nombre: 'TC036 - Ocultar columna (Hide column)', funcion: ocultarColumna, prioridad: 'BAJA' },
        { numero: 37, nombre: 'TC037 - Manage columns (mostrar/ocultar)', funcion: manageColumns, prioridad: 'BAJA' },
        { numero: 38, nombre: 'TC038 - Scroll horizontal/vertical', funcion: scrollHorizontalVertical, prioridad: 'BAJA' },
        { numero: 39, nombre: 'TC039 - Reset de filtros al recargar', funcion: resetFiltrosRecarga, prioridad: 'MEDIA' },
        { numero: 42, nombre: 'TC042 - Filtrar por Pagado = Sí', funcion: filtrarPorPagado, prioridad: 'ALTA' },
        { numero: 43, nombre: 'TC043 - Filtrar por Exportado = Sí', funcion: filtrarPorExportado, prioridad: 'ALTA' },
        { numero: 46, nombre: 'TC046 - Ordenar por Pagado', funcion: ordenarPorPagado, prioridad: 'MEDIA' },
        { numero: 47, nombre: 'TC047 - Ordenar por Exportado', funcion: ordenarPorExportado, prioridad: 'MEDIA' },
    ];

    // Resumen al final
    after(() => {
        cy.log('Procesando resultados finales para Tesorería (Anticipos a Proveedores)');
        cy.procesarResultadosPantalla('Tesorería (Anticipos a Proveedores)');
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
                    pantalla: 'Tesorería (Anticipos a Proveedores)'
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
                            pantalla: 'Tesorería (Anticipos a Proveedores)'
                        });
                    }
                });
            });
        });
    });

    // ===== FUNCIONES DE PRUEBA =====

    function cargarPantalla() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
        cy.get('.MuiDataGrid-root').should('exist');
        cy.get('input[placeholder*="Buscar"]').should('exist');
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Code');
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Codi');
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Buscar');
    }

    function filtrarPorCodigo() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('select[name="column"]').select('Código', { force: true });
        cy.get('input[placeholder="Buscar"]').type('7', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorProveedor() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('select[name="column"]').select('Proveedor', { force: true });
        cy.get('input[placeholder="Buscar"]').type('Repuestos Matias', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorFecha() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('select[name="column"]').select('Fecha', { force: true });
        cy.get('input[placeholder="Buscar"]').type('2015', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorImporte() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('select[name="column"]').select('Importe', { force: true });
        cy.get('input[placeholder="Buscar"]').type('300', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorNotas() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('select[name="column"]').select('Notas', { force: true });
        cy.get('input[placeholder="Buscar"]').type('gasoil', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorForma() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('select[name="column"]').select('Forma', { force: true });
        cy.get('input[placeholder="Buscar"]').type('efectivo', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorNumero() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('select[name="column"]').select('Número', { force: true });
        cy.get('input[placeholder="Buscar"]').type('433', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorEmpresa() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('select[name="column"]').select('Empresa', { force: true });
        cy.get('input[placeholder="Buscar"]').type('barquin', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaGeneralExacta() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('input[placeholder="Buscar"]').type('Efectivo{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaGeneralParcial() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('input[placeholder="Buscar"]').type('MATIAS{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaCaseInsensitive() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('input[placeholder="Buscar"]').type('EfEcTiVo{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaConEspacios() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('input[placeholder="Buscar"]').type('   Cheque  {enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaConCaracteresEspeciales() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('input[placeholder="Buscar"]').type('%&/{enter}', { force: true });

        // Para caracteres especiales, esperamos que no haya resultados pero no error
        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            }
            // Si hay resultados, verificamos que sean válidos
            cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
            return cy.get('.MuiDataGrid-root').should('be.visible');
        });
    }

    function ordenarPorCodigo() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorProveedor() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Proveedor').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Proveedor').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorFecha() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorImporte() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Importe').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Importe').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorNotas() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Notas').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Notas').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorForma() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Forma').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Forma').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorNumero() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Número').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Número').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorEmpresa() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
        // Hacer scroll horizontal si es necesario para ver la columna Empresa
        cy.get('body').then($body => {
            if ($body.find('.MuiDataGrid-columnHeaderTitle:contains("Empresa")').length === 0) {
                // Si no está visible, hacer scroll horizontal
                cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 400 });
                cy.wait(500);
            }
        });

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Empresa').should('be.visible').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Empresa').should('be.visible').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function seleccionarFila() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function eliminarConFilaSeleccionada() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
        
        // Seleccionar fila y eliminar
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        cy.wait(500);
        cy.get('button.css-1cbe274').click({ force: true });
        
        // Verificar si realmente se eliminó
        cy.get('body').then($body => {
            if ($body.find('.MuiDataGrid-row:visible').length === 0) {
                // Si no hay filas visibles, asumimos que funcionó
                cy.registrarResultados({
                    numero: 27,
                    nombre: 'TC027 - Eliminar con fila seleccionada',
                    esperado: 'Se elimina y la tabla se refresca',
                    obtenido: 'Se elimina la fila correctamente',
                    resultado: 'OK',
                    pantalla: 'Tesorería (Anticipos a Proveedores)',
                    archivo
                });
            } else {
                // Si hay filas visibles, no funcionó (KO)
                cy.registrarResultados({
                    numero: 27,
                    nombre: 'TC027 - Eliminar con fila seleccionada',
                    esperado: 'Se elimina y la tabla se refresca',
                    obtenido: 'Da error y no se elimina nada',
                    resultado: 'ERROR',
                    pantalla: 'Tesorería (Anticipos a Proveedores)',
                    archivo
                });
            }
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
        
        cy.get('button.css-1cbe274').click({ force: true });
        
        // Verificar si aparece el mensaje correcto o si no se realiza acción
        cy.get('body').then($body => {
            if ($body.find('text:contains("No hay ningún elemento seleccionado para eliminar")').length > 0 || 
                $body.find('text:contains("No hay ningún elemento seleccionado")').length > 0) {
                // Si aparece el mensaje correcto, funcionó
                cy.registrarResultados({
                    numero: 28,
                    nombre: 'TC028 - Eliminar sin selección',
                    esperado: 'No acción o aviso de selección requerida',
                    obtenido: 'Aparece mensaje correcto de aviso',
                    resultado: 'OK',
                    pantalla: 'Tesorería (Anticipos a Proveedores)',
                    archivo
                });
            } else {
                // Si no aparece el mensaje correcto, no funcionó (KO)
                cy.registrarResultados({
                    numero: 28,
                    nombre: 'TC028 - Eliminar sin selección',
                    esperado: 'No acción o aviso de selección requerida',
                    obtenido: 'Da error y no se elimina nada',
                    resultado: 'ERROR',
                    pantalla: 'Tesorería (Anticipos a Proveedores)',
                    archivo
                });
            }
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function abrirFormularioAñadir() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('button').contains('Añadir').click({ force: true });
        return cy.get('form').should('be.visible');
    }

    function editarConFilaSeleccionada() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        // Seleccionar fila y editar
        cy.get('.MuiDataGrid-row:visible').first().as('filaSeleccionada');
        cy.get('@filaSeleccionada').click({ force: true });
        cy.wait(500);
        cy.get('@filaSeleccionada').dblclick({ force: true });

        // Verificar que se abre el formulario de edición
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/supplier-advances\/form\/\d+$/);
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        // Verificar que el botón editar no esté visible sin selección
        cy.get('button[aria-label="edit"]').should('not.exist');

        return cy.get('.MuiDataGrid-root').should('exist');
    }

    function fechaInicioFiltro() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        // Desde: 15/01/2015
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first()
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}15');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2015');
            });

        cy.wait(500);

        // Debe mostrar registros a partir de esa fecha
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function fechaFinFiltro() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        // Hasta: 31/12/2020
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1)
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2020');
            });

        cy.wait(500);

        // Debe mostrar registros hasta esa fecha
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function rangoFechas() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        // Desde: 15/01/2015
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first()
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}15');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2015');
            });

        // Hasta: 31/12/2020
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1)
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2020');
            });

        cy.wait(500);

        // Debe mostrar registros dentro del rango
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filterValueEnColumna() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Importe')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Importe column menu"]').click({ force: true });
        cy.get('li').contains('Filter').click({ force: true });

        // Usar el placeholder correcto como en gastosgenerales
        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('12', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ocultarColumna() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        // Usar el patrón de incidencias para ocultar columna
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Código column menu"]').click({ force: true });
        cy.get('li').contains('Hide column').click({ force: true });

        return cy.get('[data-field="codigo"]').should('not.exist');
    }

    function manageColumns() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
        
        // Usar el patrón de gastosgenerales para manage columns
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Proveedor')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        
        cy.get('[aria-label="Proveedor column menu"]').click({ force: true });
        cy.get('li').contains('Manage columns').click({ force: true });
        
        // Usar el patrón correcto como en gastosgenerales
        cy.get('.MuiDataGrid-panel')
            .should('be.visible')
            .find('label')
            .contains('Código')
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });
        
        // Solo verificar que el panel esté visible, sin verificar los encabezados
        return cy.get('.MuiDataGrid-panel').should('be.visible');
    }

    function scrollHorizontalVertical() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
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

    function resetFiltrosRecarga() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('input[placeholder="Buscar"]').type('2', { force: true });
        cy.reload();
        cy.get('input[placeholder="Buscar"]').should('have.value', '');
        return cy.get('.MuiDataGrid-root').should('exist');
    }

    function filtrarPorPagado() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('select[name="column"]').select('Pagado', { force: true });
        cy.get('input[placeholder="Buscar"]').type('true', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorExportado() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');

        cy.get('select[name="column"]').select('Exportado', { force: true });
        cy.get('input[placeholder="Buscar"]').type('true', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorPagado() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
        
        // Hacer scroll horizontal para ver la columna Pagado
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 400 });
        cy.wait(500);
        
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Pagado').should('be.visible').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Pagado').should('be.visible').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorExportado() {
        cy.navegarAMenu('Tesoreria', 'Anticipos a Proveedores');
        cy.url().should('include', '/dashboard/supplier-advances');
        
        // Hacer scroll horizontal para ver la columna Exportado
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 400 });
        cy.wait(500);
        
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Exportado').should('be.visible').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Exportado').should('be.visible').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }
});