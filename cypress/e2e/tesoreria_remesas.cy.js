describe('TESORERÍA (REMESAS) - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    // Defino todos los casos con su número, nombre descriptivo y la función que ejecuta la validación
    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla correctamente', funcion: cargarPantalla },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol },
        { numero: 5, nombre: 'TC005 - Filtrar por Código', funcion: filtrarPorCodigo },
        { numero: 6, nombre: 'TC006 - Filtrar por Tipo (Cobros/Pagos)', funcion: filtrarPorTipo },
        { numero: 7, nombre: 'TC007 - Filtrar por Número', funcion: filtrarPorNumero },
        { numero: 8, nombre: 'TC008 - Filtrar por Emisión (fecha)', funcion: filtrarPorEmision },
        { numero: 9, nombre: 'TC009 - Filtrar por Ingreso/Adeudo', funcion: filtrarPorIngresoAdeudo },
        { numero: 10, nombre: 'TC010 - Filtrar por Importe', funcion: filtrarPorImporte },
        { numero: 11, nombre: 'TC011 - Filtrar por Cobros/Pagos (códigos)', funcion: filtrarPorCobrosPagos },
        { numero: 12, nombre: 'TC012 - Filtrar por Pagada = Sí', funcion: filtrarPorPagada },
        { numero: 13, nombre: 'TC013 - Filtrar por Exportada = Sí', funcion: filtrarPorExportada },
        { numero: 14, nombre: 'TC014 - Filtrar por Empresa (combobox general)', funcion: filtrarPorEmpresaCombobox },
        { numero: 15, nombre: 'TC015 - Filtrar por Empresa (combobox de búsqueda)', funcion: filtrarPorEmpresaBusqueda },
        { numero: 16, nombre: 'TC016 - Filtrar por Banco', funcion: filtrarPorBanco },
        { numero: 17, nombre: 'TC017 - Selector superior Tipo', funcion: selectorSuperiorTipo },
        { numero: 18, nombre: 'TC018 - Búsqueda general (texto exacto)', funcion: busquedaGeneralExacta },
        { numero: 19, nombre: 'TC019 - Búsqueda general (texto parcial)', funcion: busquedaGeneralParcial },
        { numero: 20, nombre: 'TC020 - Búsqueda case-insensitive', funcion: busquedaCaseInsensitive },
        { numero: 21, nombre: 'TC021 - Búsqueda con espacios', funcion: busquedaConEspacios },
        { numero: 22, nombre: 'TC022 - Búsqueda con caracteres especiales', funcion: busquedaConCaracteresEspeciales },
        { numero: 23, nombre: 'TC023 - Ordenar por Código ASC/DESC', funcion: ordenarPorCodigo },
        { numero: 24, nombre: 'TC024 - Ordenar por Tipo ASC/DESC', funcion: ordenarPorTipo },
        { numero: 25, nombre: 'TC025 - Ordenar por Número ASC/DESC', funcion: ordenarPorNumero },
        { numero: 26, nombre: 'TC026 - Ordenar por Emisión ASC/DESC', funcion: ordenarPorEmision },
        { numero: 27, nombre: 'TC027 - Ordenar por Ingreso/Adeudo ASC/DESC', funcion: ordenarPorIngresoAdeudo },
        { numero: 28, nombre: 'TC028 - Ordenar por Importe ASC/DESC', funcion: ordenarPorImporte },
        { numero: 29, nombre: 'TC029 - Ordenar por Cobros/Pagos ASC/DESC', funcion: ordenarPorCobrosPagos },
        { numero: 30, nombre: 'TC030 - Ordenar por Pagada ASC/DESC', funcion: ordenarPorPagada },
        { numero: 31, nombre: 'TC031 - Ordenar por Exportada ASC/DESC', funcion: ordenarPorExportada },
        { numero: 32, nombre: 'TC032 - Ordenar por Empresa ASC/DESC', funcion: ordenarPorEmpresa },
        { numero: 33, nombre: 'TC033 - Ordenar por Banco ASC/DESC', funcion: ordenarPorBanco },
        { numero: 34, nombre: 'TC034 - Seleccionar una fila', funcion: seleccionarFila },
        { numero: 35, nombre: 'TC035 - Eliminar con fila seleccionada', funcion: eliminarConFilaSeleccionada },
        { numero: 36, nombre: 'TC036 - Eliminar sin selección', funcion: eliminarSinSeleccion },
        { numero: 37, nombre: 'TC037 - "+ Añadir" abre formulario', funcion: abrirFormularioAñadir },
        { numero: 38, nombre: 'TC038 - Editar con fila seleccionada', funcion: editarConFilaSeleccionada },
        { numero: 39, nombre: 'TC039 - Editar sin selección', funcion: editarSinSeleccion },
        { numero: 40, nombre: 'TC040 - Fecha desde (filtro superior)', funcion: fechaDesdeFiltro },
        { numero: 41, nombre: 'TC041 - Fecha hasta (filtro superior)', funcion: fechaHastaFiltro },
        { numero: 42, nombre: 'TC042 - Rango Desde + Hasta', funcion: rangoFechas },
        { numero: 43, nombre: 'TC043 - Filter → Value en columna', funcion: filterValueEnColumna },
        { numero: 44, nombre: 'TC044 - Ocultar columna (Hide column)', funcion: ocultarColumna },
        { numero: 45, nombre: 'TC045 - Manage columns (mostrar/ocultar)', funcion: manageColumns },
        { numero: 46, nombre: 'TC046 - Scroll vertical y horizontal', funcion: scrollVerticalHorizontal },
        { numero: 47, nombre: 'TC047 - Reset: reinicio de filtros al recargar', funcion: resetFiltrosRecarga }
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Tesorería (Remesas)');
    });

    casos.forEach(({ numero, nombre, funcion }) => {
        it(nombre, () => {
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    archivo,
                    pantalla: 'Tesorería (Remesas)'
                });
                return false;
            });

            cy.login();
            cy.wait(500);

            funcion().then(() => {
                cy.registrarResultados({
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    obtenido: 'Comportamiento correcto',
                    archivo,
                    pantalla: 'Tesorería (Remesas)'
                });
            });
        });
    });

    // === FUNCIONES DE VALIDACIÓN ===
    
    function cargarPantalla() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.url().should('include', '/dashboard/treasury/remittances');
        return cy.get('.MuiDataGrid-root').should('exist');
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('button[aria-label="language"]').click();
        cy.contains('li', 'English').click();
        return cy.get('.MuiDataGrid-root').should('exist');
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('button[aria-label="language"]').click();
        cy.contains('li', 'Català').click();
        return cy.get('.MuiDataGrid-root').should('exist');
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('button[aria-label="language"]').click();
        cy.contains('li', 'Español').click();
        return cy.get('.MuiDataGrid-root').should('exist');
    }

    function filtrarPorCodigo() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('div.MuiFormControl-root').first().click();
        cy.contains('li', 'Código').click();
        cy.get('input[placeholder="Buscar..."]').type('4');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function filtrarPorTipo() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('div.MuiFormControl-root').first().click();
        cy.contains('li', 'Tipo').click();
        cy.get('input[placeholder="Buscar..."]').type('Cobros');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function filtrarPorNumero() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('div.MuiFormControl-root').first().click();
        cy.contains('li', 'Número').click();
        cy.get('input[placeholder="Buscar..."]').type('444555');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function filtrarPorEmision() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('div.MuiFormControl-root').first().click();
        cy.contains('li', 'Emisión').click();
        cy.get('input[placeholder="Buscar..."]').type('2013');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function filtrarPorIngresoAdeudo() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('div.MuiFormControl-root').first().click();
        cy.contains('li', 'Ingreso/Adeudo').click();
        cy.get('input[placeholder="Buscar..."]').type('2018');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function filtrarPorImporte() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('div.MuiFormControl-root').first().click();
        cy.contains('li', 'Importe').click();
        cy.get('input[placeholder="Buscar..."]').type('544');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function filtrarPorCobrosPagos() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('div.MuiFormControl-root').first().click();
        cy.contains('li', 'Cobros/Pagos').click();
        cy.get('input[placeholder="Buscar..."]').type('1517');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function filtrarPorPagada() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('div.MuiFormControl-root').first().click();
        cy.contains('li', 'Pagada').click();
        cy.get('input[placeholder="Buscar..."]').type('true');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function filtrarPorExportada() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('div.MuiFormControl-root').first().click();
        cy.contains('li', 'Exportada').click();
        cy.get('input[placeholder="Buscar..."]').type('false');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function filtrarPorEmpresaCombobox() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('select[name="empresa"]').select('BARQUIN Y OTXOA S.L.');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function filtrarPorEmpresaBusqueda() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('div.MuiFormControl-root').first().click();
        cy.contains('li', 'Empresa').click();
        cy.get('input[placeholder="Buscar..."]').type('BARQUIN Y OTXOA S.L.');
        // Este caso está marcado como KO en el excel, por lo que esperamos que no funcione
        return cy.get('.MuiDataGrid-row').should('not.exist');
    }

    function filtrarPorBanco() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('div.MuiFormControl-root').first().click();
        cy.contains('li', 'Banco').click();
        cy.get('input[placeholder="Buscar..."]').type('Ibercaja');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function selectorSuperiorTipo() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('select[name="tipo"]').select('Cobros');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function busquedaGeneralExacta() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('input[placeholder="Buscar..."]').type('Cobros');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function busquedaGeneralParcial() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('input[placeholder="Buscar..."]').type('Iber');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function busquedaCaseInsensitive() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('input[placeholder="Buscar..."]').type('cObRoS');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function busquedaConEspacios() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('input[placeholder="Buscar..."]').type('   Cobros  ');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function busquedaConCaracteresEspeciales() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('input[placeholder="Buscar..."]').type('%&/');
        // Para caracteres especiales, esperamos que no haya resultados pero no error
        return cy.get('.MuiDataGrid-row').should('have.length', 0);
    }

    function ordenarPorCodigo() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('[data-field="codigo"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by ASC').click();
        cy.wait(500);
        cy.get('[data-field="codigo"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by DESC').click();
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function ordenarPorTipo() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('[data-field="tipo"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by ASC').click();
        cy.wait(500);
        cy.get('[data-field="tipo"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by DESC').click();
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function ordenarPorNumero() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('[data-field="numero"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by ASC').click();
        cy.wait(500);
        cy.get('[data-field="numero"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by DESC').click();
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function ordenarPorEmision() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('[data-field="emision"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by ASC').click();
        cy.wait(500);
        cy.get('[data-field="emision"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by DESC').click();
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function ordenarPorIngresoAdeudo() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('[data-field="ingresoAdeudo"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by ASC').click();
        cy.wait(500);
        cy.get('[data-field="ingresoAdeudo"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by DESC').click();
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function ordenarPorImporte() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('[data-field="importe"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by ASC').click();
        cy.wait(500);
        cy.get('[data-field="importe"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by DESC').click();
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function ordenarPorCobrosPagos() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('[data-field="cobrosPagos"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by ASC').click();
        cy.wait(500);
        cy.get('[data-field="cobrosPagos"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by DESC').click();
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function ordenarPorPagada() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('[data-field="pagada"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by ASC').click();
        cy.wait(500);
        cy.get('[data-field="pagada"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by DESC').click();
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function ordenarPorExportada() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('[data-field="exportada"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by ASC').click();
        cy.wait(500);
        cy.get('[data-field="exportada"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by DESC').click();
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function ordenarPorEmpresa() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('[data-field="empresa"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by ASC').click();
        cy.wait(500);
        cy.get('[data-field="empresa"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by DESC').click();
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function ordenarPorBanco() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('[data-field="banco"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by ASC').click();
        cy.wait(500);
        cy.get('[data-field="banco"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Sort by DESC').click();
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function seleccionarFila() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('.MuiDataGrid-row').first().click();
        return cy.get('.MuiDataGrid-row.Mui-selected').should('exist');
    }

    function eliminarConFilaSeleccionada() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('.MuiDataGrid-row').first().click();
        cy.get('button[aria-label="delete"]').click();
        cy.get('.MuiDialog-root').should('exist');
        cy.get('.MuiDialog-root button').contains('Confirmar').click();
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('button[aria-label="delete"]').click();
        // No debería hacer nada o mostrar aviso
        return cy.get('.MuiDataGrid-root').should('exist');
    }

    function abrirFormularioAñadir() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('button').contains('+ Añadir').click();
        return cy.get('.MuiDialog-root').should('exist');
    }

    function editarConFilaSeleccionada() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('.MuiDataGrid-row').first().click();
        cy.get('button[aria-label="edit"]').click();
        return cy.get('.MuiDialog-root').should('exist');
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        // El botón editar no debería estar visible sin selección
        cy.get('button[aria-label="edit"]').should('not.exist');
        return cy.get('.MuiDataGrid-root').should('exist');
    }

    function fechaDesdeFiltro() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('input[name="fechaDesde"]').click();
        cy.get('.MuiPickersDay-root').contains('15').click();
        // Este caso está marcado como KO en el excel
        return cy.get('.MuiDataGrid-row').should('not.exist');
    }

    function fechaHastaFiltro() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('input[name="fechaHasta"]').click();
        cy.get('.MuiPickersDay-root').contains('20').click();
        // Este caso está marcado como KO en el excel
        return cy.get('.MuiDataGrid-row').should('not.exist');
    }

    function rangoFechas() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('input[name="fechaDesde"]').click();
        cy.get('.MuiPickersDay-root').contains('15').click();
        cy.get('input[name="fechaHasta"]').click();
        cy.get('.MuiPickersDay-root').contains('20').click();
        // Este caso está marcado como KO en el excel
        return cy.get('.MuiDataGrid-row').should('not.exist');
    }

    function filterValueEnColumna() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('[data-field="codigo"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Filter').click();
        cy.get('input[placeholder="Value"]').type('1');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function ocultarColumna() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('[data-field="codigo"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Hide column').click();
        return cy.get('[data-field="codigo"]').should('not.exist');
    }

    function manageColumns() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('[data-field="tipo"] .MuiDataGrid-columnHeaderMenuIcon').click();
        cy.contains('li', 'Manage columns').click();
        cy.get('.MuiDialog-root input[type="checkbox"]').first().check();
        return cy.get('.MuiDialog-root').should('exist');
    }

    function scrollVerticalHorizontal() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom');
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function resetFiltrosRecarga() {
        cy.navegarAMenu('Tesorería', 'Remesas');
        cy.get('input[placeholder="Buscar..."]').type('1');
        cy.reload();
        cy.get('input[placeholder="Buscar..."]').should('have.value', '');
        return cy.get('.MuiDataGrid-root').should('exist');
    }
});
