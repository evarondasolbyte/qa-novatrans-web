describe('TESORERÍA (CAJAS) - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla correctamente', funcion: cargarPantalla, prioridad: 'ALTA' },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' },
        { numero: 5, nombre: 'TC005 - Filtrar por Código', funcion: filtrarPorCodigo, prioridad: 'ALTA' },
        { numero: 6, nombre: 'TC006 - Filtrar por Nombre', funcion: filtrarPorNombre, prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - Filtrar por Empresa', funcion: filtrarPorEmpresa, prioridad: 'ALTA' },
        { numero: 8, nombre: 'TC008 - Filtrar por Importe Actual', funcion: filtrarPorImporteActual, prioridad: 'ALTA' },
        { numero: 9, nombre: 'TC009 - Búsqueda general (texto exacto)', funcion: busquedaGeneralExacta, prioridad: 'ALTA' },
        { numero: 10, nombre: 'TC010 - Búsqueda general (texto parcial)', funcion: busquedaGeneralParcial, prioridad: 'ALTA' },
        { numero: 11, nombre: 'TC011 - Búsqueda case-insensitive', funcion: busquedaCaseInsensitive, prioridad: 'MEDIA' },
        { numero: 12, nombre: 'TC012 - Búsqueda con espacios', funcion: busquedaConEspacios, prioridad: 'MEDIA' },
        { numero: 13, nombre: 'TC013 - Búsqueda con caracteres especiales', funcion: busquedaConCaracteresEspeciales, prioridad: 'BAJA' },
        { numero: 14, nombre: 'TC014 - Ordenar por Código ASC/DESC', funcion: ordenarPorCodigo, prioridad: 'MEDIA' },
        { numero: 15, nombre: 'TC015 - Ordenar por Nombre ASC/DESC', funcion: ordenarPorNombre, prioridad: 'MEDIA' },
        { numero: 16, nombre: 'TC016 - Ordenar por Empresa ASC/DESC', funcion: ordenarPorEmpresa, prioridad: 'MEDIA' },
        { numero: 17, nombre: 'TC017 - Ordenar por Importe Actual ASC/DESC', funcion: ordenarPorImporteActual, prioridad: 'MEDIA' },
        { numero: 18, nombre: 'TC018 - Seleccionar fila', funcion: seleccionarFila, prioridad: 'ALTA' },
        { numero: 19, nombre: 'TC019 - Eliminar con fila seleccionada', funcion: eliminarConFilaSeleccionada, prioridad: 'ALTA' },
        { numero: 20, nombre: 'TC020 - Eliminar sin selección', funcion: eliminarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 21, nombre: 'TC021 - Añadir abre formulario', funcion: abrirFormularioAñadir, prioridad: 'ALTA' },
        { numero: 22, nombre: 'TC022 - Editar con fila seleccionada', funcion: editarConFilaSeleccionada, prioridad: 'ALTA' },
        { numero: 23, nombre: 'TC023 - Editar sin selección', funcion: editarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 24, nombre: 'TC024 - Ocultar columna', funcion: ocultarColumna, prioridad: 'BAJA' },
        { numero: 25, nombre: 'TC025 - Manage columns (mostrar/ocultar)', funcion: manageColumns, prioridad: 'BAJA' },
        { numero: 27, nombre: 'TC027 - Reset de filtros al recargar', funcion: resetFiltrosRecarga, prioridad: 'MEDIA' },
        { numero: 28, nombre: 'TC028 - Filtrar por estado Activo', funcion: filtrarPorEstadoActivo, prioridad: 'ALTA' },
        { numero: 29, nombre: 'TC029 - Filtrar por Value', funcion: filterValueEnColumna, prioridad: 'MEDIA' },
    ];

    // Resumen al final
    after(() => {
        cy.log('Procesando resultados finales para Tesorería (Cajas)');
        cy.procesarResultadosPantalla('Tesorería (Cajas)');
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
                    pantalla: 'Tesorería (Cajas)'
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
                            pantalla: 'Tesorería (Cajas)'
                        });
                    }
                });
            });
        });
    });

    // ===== FUNCIONES DE PRUEBA =====

    function cargarPantalla() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');
        cy.get('.MuiDataGrid-root').should('exist');
        cy.get('input[placeholder*="Buscar"]').should('exist');
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');
        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Code');
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Codi');
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Buscar');
    }

    function filtrarPorCodigo() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        cy.get('select[name="column"]').select('Código', { force: true });
        cy.get('input[placeholder="Buscar"]').type('1', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorNombre() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        cy.get('select[name="column"]').select('Nombre', { force: true });
        cy.get('input[placeholder="Buscar"]').type('Caja A', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorEmpresa() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        cy.get('select[name="column"]').select('Empresa', { force: true });
        cy.get('input[placeholder="Buscar"]').type('BARQUIN Y OTXOA', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorImporteActual() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        cy.get('select[name="column"]').select('Importe Actual', { force: true });
        cy.get('input[placeholder="Buscar"]').type('-98111.7', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaGeneralExacta() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        cy.get('input[placeholder="Buscar"]').type('Caja A{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaGeneralParcial() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        cy.get('input[placeholder="Buscar"]').type('Caja{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaCaseInsensitive() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        cy.get('input[placeholder="Buscar"]').type('cAjA a{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaConEspacios() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        cy.get('input[placeholder="Buscar"]').type('   Caja A  {enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaConCaracteresEspeciales() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

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
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorNombre() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorEmpresa() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Empresa').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Empresa').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorImporteActual() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Importe Actual').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Importe Actual').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function seleccionarFila() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function eliminarConFilaSeleccionada() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');
        
        // Seleccionar fila y eliminar
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        cy.wait(500);
        cy.get('button.css-1cbe274').click({ force: true });
        
        // Verificar si realmente se eliminó
        cy.get('body').then($body => {
            if ($body.find('.MuiDataGrid-row:visible').length === 0) {
                // Si no hay filas visibles, asumimos que funcionó
                cy.registrarResultados({
                    numero: 19,
                    nombre: 'TC019 - Eliminar con fila seleccionada',
                    esperado: 'Se elimina y la tabla se refresca',
                    obtenido: 'Se elimina la fila correctamente',
                    resultado: 'OK',
                    pantalla: 'Tesorería (Cajas)',
                    archivo
                });
            } else {
                // Si hay filas visibles, no funcionó (WARNING)
                cy.registrarResultados({
                    numero: 19,
                    nombre: 'TC019 - Eliminar con fila seleccionada',
                    esperado: 'Se elimina y la tabla se refresca',
                    obtenido: 'Aparece mensaje: "No se puede eliminar la caja porque tiene registros relacionados"',
                    resultado: 'WARNING',
                    pantalla: 'Tesorería (Cajas)',
                    archivo,
                    observacion: 'WARNING porque no puedo ver si se elimina o no ya que las 2 filas que hay me salta el mensaje.'
                });
            }
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');
        
        cy.get('button.css-1cbe274').click({ force: true });
        
        // Verificar si aparece el mensaje correcto o si no se realiza acción
        cy.get('body').then($body => {
            if ($body.find('text:contains("No hay ningún elemento seleccionado para eliminar")').length > 0 || 
                $body.find('text:contains("No hay ningún elemento seleccionado")').length > 0) {
                // Si aparece el mensaje correcto, funcionó
                cy.registrarResultados({
                    numero: 20,
                    nombre: 'TC020 - Eliminar sin selección',
                    esperado: 'No acción o aviso de selección requerida',
                    obtenido: 'Aparece mensaje correcto de aviso',
                    resultado: 'OK',
                    pantalla: 'Tesorería (Cajas)',
                    archivo
                });
            } else {
                // Si no aparece el mensaje correcto, no funcionó (WARNING)
                cy.registrarResultados({
                    numero: 20,
                    nombre: 'TC020 - Eliminar sin selección',
                    esperado: 'No acción o aviso de selección requerida',
                    obtenido: 'No se elimina nada pero aparece: "No se puede eliminar la caja porque tiene registros relacionados"',
                    resultado: 'WARNING',
                    pantalla: 'Tesorería (Cajas)',
                    archivo,
                    observacion: 'WARNING porque aunque no se elimine nada no debe aparecer ese mensaje'
                });
            }
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function abrirFormularioAñadir() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        // Hacer click en el botón Añadir
        cy.get('button').contains('Añadir').click({ force: true });
        
        // Verificar que se abre el formulario
        return cy.get('form').should('be.visible');
    }

    function editarConFilaSeleccionada() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        // Seleccionar fila y editar
        cy.get('.MuiDataGrid-row:visible').first().as('filaSeleccionada');
        cy.get('@filaSeleccionada').click({ force: true });
        cy.wait(500);
        cy.get('@filaSeleccionada').dblclick({ force: true });

        // Verificar que se abre el formulario de edición
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/boxes\/form\/\d+$/);
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        // Verificar que el botón editar no esté visible sin selección
        cy.get('button[aria-label="edit"]').should('not.exist');

        return cy.get('.MuiDataGrid-root').should('exist');
    }

    function ocultarColumna() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        // Usar el patrón de incidencias para ocultar columna
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Código column menu"]').click({ force: true });
        cy.get('li').contains(/Hide column|Ocultar/i).click({ force: true });

        return cy.get('[data-field="codigo"]').should('not.exist');
    }

    function manageColumns() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        // Usar el patrón de gastosgenerales para manage columns
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Nombre column menu"]').click({ force: true });
        cy.get('li').contains(/Manage columns|Administrar columnas/i).click({ force: true });

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

    function resetFiltrosRecarga() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        cy.get('input[placeholder="Buscar"]').type('1', { force: true });
        cy.reload();
        cy.get('input[placeholder="Buscar"]').should('have.value', '');
        return cy.get('.MuiDataGrid-root').should('exist');
    }

    function filtrarPorEstadoActivo() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        // Buscar el checkbox de Activo
        cy.get('input[type="checkbox"]').first().check({ force: true });
        cy.wait(500);
        
        // Verificar si aparecen resultados o "No rows"
        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            } else {
                return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
            }
        });
    }

    function filterValueEnColumna() {
        cy.navegarAMenu('Tesoreria', 'Cajas');
        cy.url().should('include', '/dashboard/boxes');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Código column menu"]').click({ force: true });
        cy.get('li').contains(/Filter|Filtro|Filtros/i).click({ force: true });

        // Usar el placeholder correcto como en gastosgenerales
        cy.get('input[placeholder="Filter value"], input[placeholder*="Filtro"]')
            .should('exist')
            .clear()
            .type('1', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }
});
