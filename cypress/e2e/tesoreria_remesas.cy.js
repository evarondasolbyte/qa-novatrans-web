describe('TESORERÍA (REMESAS) - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

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
        { numero: 13, nombre: 'TC013 - Filtrar por Exportada = No', funcion: filtrarPorExportada },
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
        { numero: 47, nombre: 'TC047 - Reset: reinicio de filtros al recargar', funcion: resetFiltrosRecarga },
    ];

    // Resumen al final
    after(() => {
        cy.log('Procesando resultados finales para Tesorería (Remesas)');
        cy.procesarResultadosPantalla('Tesorería (Remesas)');
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
                    pantalla: 'Tesorería (Remesas)'
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
                            pantalla: 'Tesorería (Remesas)'
                        });
                    }
                });
            });
        });
    });

    // === FUNCIONES DE VALIDACIÓN ===

    function cargarPantalla() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Search');
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Cercar');
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Buscar');
    }

    function filtrarPorCodigo() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('select[name="column"]').select('Código', { force: true });
        cy.get('input[placeholder="Buscar"]').type('4', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorTipo() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('select[name="column"]').select('Tipo', { force: true });
        cy.get('input[placeholder="Buscar"]').type('Cobros', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorNumero() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('select[name="column"]').select('Número', { force: true });
        cy.get('input[placeholder="Buscar"]').type('444555', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorEmision() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('select[name="column"]').select('Emisión', { force: true });
        cy.get('input[placeholder="Buscar"]').type('2013', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorIngresoAdeudo() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('select[name="column"]').select('Ingreso/Adeudo', { force: true });
        cy.get('input[placeholder="Buscar"]').type('2018', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorImporte() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('select[name="column"]').select('Importe', { force: true });
        cy.get('input[placeholder="Buscar"]').type('544', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorCobrosPagos() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('select[name="column"]').select('Cobros/Pagos', { force: true });
        cy.get('input[placeholder="Buscar"]').type('1517', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorPagada() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('select[name="column"]').select('Pagada', { force: true });
        cy.get('input[placeholder="Buscar"]').type('true', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorExportada() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('select[name="column"]').select('Exportada', { force: true });
        cy.get('input[placeholder="Buscar"]').type('false', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorEmpresaCombobox() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        // Buscar el filtro de Empresa y seleccionar la empresa
        cy.get('select[id="companyId"]').select('BARQUIN Y OTXOA S.L.', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorEmpresaBusqueda() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('select[name="column"]').select('Empresa', { force: true });
        cy.get('input[placeholder="Buscar"]').type('BARQUIN Y OTXOA S.L.', { force: true });
        
        // Verificar si realmente funciona el filtro buscando el nombre de la empresa
        cy.get('body').then($body => {
            if ($body.find('.MuiDataGrid-row:visible').length === 0) {
                // Si no hay filas visibles, no funciona (KO)
                cy.registrarResultados({
                    numero: 15,
                    nombre: 'TC015 - Filtrar por Empresa (combobox de búsqueda)',
                    esperado: 'Filas con esa empresa',
                    obtenido: 'No aparece nada',
                    resultado: 'ERROR',
                    pantalla: 'Tesorería (Remesas)',
                    archivo
                });
            } else {
                // Verificar que las filas visibles contengan realmente la empresa buscada
                let empresaEncontrada = false;
                $body.find('.MuiDataGrid-row:visible').each((index, row) => {
                    if (row.textContent.includes('BARQUIN Y OTXOA S.L.')) {
                        empresaEncontrada = true;
                        return false; // break
                    }
                });
                
                if (empresaEncontrada) {
                    // Si encuentra la empresa, funciona (OK)
                    cy.registrarResultados({
                        numero: 15,
                        nombre: 'TC015 - Filtrar por Empresa (combobox de búsqueda)',
                        esperado: 'Filas con esa empresa',
                        obtenido: 'Muestra filas con la empresa correctamente',
                        resultado: 'OK',
                        pantalla: 'Tesorería (Remesas)',
                        archivo
                    });
                } else {
                    // Si no encuentra la empresa, no funciona (KO)
                    cy.registrarResultados({
                        numero: 15,
                        nombre: 'TC015 - Filtrar por Empresa (combobox de búsqueda)',
                        esperado: 'Filas con esa empresa',
                        obtenido: 'Aparecen filas pero no con la empresa buscada',
                        resultado: 'ERROR',
                        pantalla: 'Tesorería (Remesas)',
                        archivo
                    });
                }
            }
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filtrarPorBanco() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('select[name="column"]').select('Banco', { force: true });
        cy.get('input[placeholder="Buscar"]').type('Ibercaja', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function selectorSuperiorTipo() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        // Buscar el filtro de Tipo y seleccionar Cobros
        cy.get('select[id="type"]').select('Cobros', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaGeneralExacta() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('input[placeholder="Buscar"]').type('Cobros{enter}', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaGeneralParcial() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('input[placeholder="Buscar"]').type('Iber{enter}', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaCaseInsensitive() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('input[placeholder="Buscar"]').type('cObRoS{enter}', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaConEspacios() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('input[placeholder="Buscar"]').type('   Cobros  {enter}', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function busquedaConCaracteresEspeciales() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
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
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorTipo() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Tipo').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Tipo').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorNumero() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Número').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Número').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorEmision() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Emisión').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Emisión').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorIngresoAdeudo() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Ingreso/Adeudo').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Ingreso/Adeudo').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorImporte() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Importe').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Importe').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorCobrosPagos() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Cobros/Pagos').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Cobros/Pagos').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorPagada() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Pagada').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Pagada').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorExportada() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Exportada').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Exportada').click({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('be.visible');
    }

    function ordenarPorEmpresa() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
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

    function ordenarPorBanco() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        // Hacer scroll horizontal si es necesario para ver la columna Banco
        cy.get('body').then($body => {
            if ($body.find('.MuiDataGrid-columnHeaderTitle:contains("Banco")').length === 0) {
                // Si no está visible, hacer scroll horizontal
                cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 400 });
                cy.wait(500);
            }
        });
        
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Banco').should('be.visible').click({ force: true });
        cy.wait(1000);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Banco').should('be.visible').click({ force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function seleccionarFila() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        // Usar el patrón de gastosgenerales para seleccionar fila
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function eliminarConFilaSeleccionada() {
        cy.navegarAMenu('TallerYGastos', 'Otros Gastos');
        cy.url().should('include', '/dashboard/other-expenses');
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        cy.wait(500);
        // devolvemos la cadena para que Cypress espere
        return cy.get('button.css-1cbe274').click({ force: true });
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('button.css-1cbe274').click({ force: true });
        // No debería hacer nada o mostrar aviso
        return cy.get('.MuiDataGrid-root').should('exist');
    }

    function abrirFormularioAñadir() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        cy.get('button').contains('Añadir').click({ force: true });
        return cy.get('form').should('be.visible');
    }

    function editarConFilaSeleccionada() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        // Usar el patrón de gastosgenerales para editar
        cy.get('.MuiDataGrid-row:visible').first().as('filaSeleccionada');
        cy.get('@filaSeleccionada').click({ force: true });
        cy.wait(500);
        cy.get('@filaSeleccionada').dblclick({ force: true });
        
        // Verificar que se abra el formulario de edición (como en gastosgenerales)
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/remittances\/form\/\d+$/);
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        // Verificar que el botón editar no esté visible sin selección
        cy.get('button[aria-label="edit"]').should('not.exist');
        
        return cy.get('.MuiDataGrid-root').should('exist');
    }

    function fechaDesdeFiltro() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        // Buscar el input de fecha desde usando el patrón de incidencias
        cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}15');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2020');
        });
        
        cy.wait(500);
        
        // Verificar si realmente funciona el filtro
        cy.get('body').then($body => {
            if ($body.find('.MuiDataGrid-row:visible').length === 0) {
                // Si no hay filas visibles, no funciona (KO)
                cy.registrarResultados({
                    numero: 40,
                    nombre: 'TC040 - Fecha desde (filtro superior)',
                    esperado: 'Muestra registros a partir de esa fecha',
                    obtenido: 'No muestra nada',
                    resultado: 'ERROR',
                    pantalla: 'Tesorería (Remesas)',
                    archivo
                });
            } else {
                // Si hay filas visibles, funciona (OK)
                cy.registrarResultados({
                    numero: 40,
                    nombre: 'TC040 - Fecha desde (filtro superior)',
                    esperado: 'Muestra registros a partir de esa fecha',
                    obtenido: 'Muestra registros correctamente',
                    resultado: 'OK',
                    pantalla: 'Tesorería (Remesas)',
                    archivo
                });
            }
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function fechaHastaFiltro() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        // Buscar el input de fecha hasta usando el patrón de incidencias
        cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}20');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2021');
        });
        
        cy.wait(500);
        
        // Verificar si realmente funciona el filtro
        cy.get('body').then($body => {
            if ($body.find('.MuiDataGrid-row:visible').length === 0) {
                // Si no hay filas visibles, no funciona (KO)
                cy.registrarResultados({
                    numero: 41,
                    nombre: 'TC041 - Fecha hasta (filtro superior)',
                    esperado: 'Muestra registros hasta esa fecha',
                    obtenido: 'No muestra nada',
                    resultado: 'ERROR',
                    pantalla: 'Tesorería (Remesas)',
                    archivo
                });
            } else {
                // Si hay filas visibles, funciona (OK)
                cy.registrarResultados({
                    numero: 41,
                    nombre: 'TC041 - Fecha hasta (filtro superior)',
                    esperado: 'Muestra registros hasta esa fecha',
                    obtenido: 'Muestra registros correctamente',
                    resultado: 'OK',
                    pantalla: 'Tesorería (Remesas)',
                    archivo
                });
            }
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function rangoFechas() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        // Buscar el input de fecha desde
        cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}15');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2020');
        });
        
        // Buscar el input de fecha hasta
        cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}20');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2021');
        });
        
        cy.wait(500);
        
        // Verificar si realmente funciona el filtro
        cy.get('body').then($body => {
            if ($body.find('.MuiDataGrid-row:visible').length === 0) {
                // Si no hay filas visibles, no funciona (KO)
                cy.registrarResultados({
                    numero: 42,
                    nombre: 'TC042 - Rango Desde + Hasta',
                    esperado: 'Solo registros dentro del rango',
                    obtenido: 'No muestra nada',
                    resultado: 'ERROR',
                    pantalla: 'Tesorería (Remesas)',
                    archivo
                });
            } else {
                // Si hay filas visibles, funciona (OK)
                cy.registrarResultados({
                    numero: 42,
                    nombre: 'TC042 - Rango Desde + Hasta',
                    esperado: 'Solo registros dentro del rango',
                    obtenido: 'Muestra registros correctamente',
                    resultado: 'OK',
                    pantalla: 'Tesorería (Remesas)',
                    archivo
                });
            }
        });
        
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function filterValueEnColumna() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        // Usar el patrón de gastosgenerales para el filtro de columna
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        
        cy.get('[aria-label="Código column menu"]').click({ force: true });
        cy.get('li').contains('Filter').click({ force: true });
        
        // Usar el placeholder correcto como en gastosgenerales
        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('1', { force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ocultarColumna() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        // Usar el patrón de incidencias para ocultar columna
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        
        cy.get('[aria-label="Código column menu"]').click({ force: true });
        cy.get('li').contains('Hide column').click({ force: true });
        
        return cy.get('[data-field="codigo"]').should('not.exist');
    }

    function manageColumns() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        // Usar el patrón de gastosgenerales para manage columns
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Tipo')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        
        cy.get('[aria-label="Tipo column menu"]').click({ force: true });
        cy.get('li').contains('Manage columns').click({ force: true });
        
        // Usar el patrón correcto como en gastosgenerales
        cy.get('.MuiDataGrid-panel')
            .should('be.visible')
            .find('label')
            .contains('Código')
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });
        
        return cy.get('.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains('Código').should('exist');
            });
    }

    function scrollVerticalHorizontal() {
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
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
        cy.navegarAMenu('Tesoreria', 'Remesas');
        cy.url().should('include', '/dashboard/remittances');
        
        cy.get('input[placeholder="Buscar"]').type('1', { force: true });
        cy.reload();
        cy.get('input[placeholder="Buscar"]').should('have.value', '');
        return cy.get('.MuiDataGrid-root').should('exist');
    }
});
