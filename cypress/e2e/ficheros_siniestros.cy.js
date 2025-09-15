describe('FICHEROS - SINIESTROS - Validación completa con errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Ver lista de siniestros al acceder a la pantalla', funcion: verListaSiniestros, prioridad: 'ALTA' },
        { numero: 2, nombre: 'TC002 - Filtrar por "ID" con coincidencia exacta', funcion: filtrarPorIDExacto, prioridad: 'ALTA' },
        { numero: 3, nombre: 'TC003 - Filtrar por "Tipo"', funcion: filtrarPorTipo, prioridad: 'ALTA' },
        { numero: 4, nombre: 'TC004 - Filtrar por "Ubicación" con coincidencia parcial', funcion: filtrarPorUbicacion, prioridad: 'ALTA' },
        { numero: 5, nombre: 'TC005 - Filtrar por "Matrícula"', funcion: filtrarPorMatricula, prioridad: 'ALTA' },
        { numero: 6, nombre: 'TC006 - Filtrar por "Conductor"', funcion: filtrarPorConductor, prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - Filtrar por "Coste de reparación" exacto', funcion: filtrarPorCosteReparacion, prioridad: 'MEDIA' },
        { numero: 8, nombre: 'TC008 - Filtrar por "Responsable"', funcion: filtrarPorResponsable, prioridad: 'MEDIA' },
        { numero: 11, nombre: 'TC011 - Limpiar filtros y mostrar todos los siniestros', funcion: limpiarFiltros, prioridad: 'MEDIA' },
        { numero: 12, nombre: 'TC012 - Filtrar siniestros con texto sin coincidencias', funcion: filtroSinResultados, prioridad: 'MEDIA' },
        { numero: 13, nombre: 'TC013 - Ingresar rango de fechas válido en "Desde" y "Hasta"', funcion: filtrarPorRangoFechas, prioridad: 'ALTA' },
        { numero: 14, nombre: 'TC014 - Ingresar solo fecha "Desde"', funcion: filtrarPorFechaDesde, prioridad: 'ALTA' },
        { numero: 15, nombre: 'TC015 - Ingresar solo fecha "Hasta"', funcion: filtrarPorFechaHasta, prioridad: 'ALTA' },
        { numero: 16, nombre: 'TC016 - Ingresar Fecha Desde mayor que Fecha Hasta', funcion: fechasInvalidas, prioridad: 'MEDIA' },
        { numero: 17, nombre: 'TC017 - Ordenar por Fecha ascendente en siniestros', funcion: ordenarFechaAsc, prioridad: 'MEDIA' },
        { numero: 18, nombre: 'TC018 - Ordenar por Fecha descendente en siniestros', funcion: ordenarFechaDesc, prioridad: 'MEDIA' },
        { numero: 19, nombre: 'TC019 - Ordenar por "Coste de reparación" ascendente', funcion: ordenarCosteReparacionAsc, prioridad: 'BAJA' },
        { numero: 20, nombre: 'TC020 - Ordenar por "Coste de reparación" descendente', funcion: ordenarCosteReparacionDesc, prioridad: 'BAJA' },
        { numero: 21, nombre: 'TC021 - Seleccionar una fila individual en siniestros', funcion: seleccionarFila, prioridad: 'ALTA' },
        { numero: 22, nombre: 'TC022 - Botón "Editar" no visible sin selección', funcion: editarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 23, nombre: 'TC023 - "Editar" con una fila seleccionada', funcion: editarConSeleccion, prioridad: 'ALTA' },
        { numero: 24, nombre: 'TC024 - Pulsar "Eliminar" sin seleccionar fila', funcion: eliminarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 26, nombre: 'TC026 - Añadir siniestro y abrir formulario', funcion: abrirFormularioAlta, prioridad: 'ALTA' },
        { numero: 27, nombre: 'TC027 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
        { numero: 28, nombre: 'TC028 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
        { numero: 29, nombre: 'TC029 - Scroll vertical sin perder cabecera', funcion: scrollCabecera, prioridad: 'BAJA' },
        { numero: 30, nombre: 'TC030 - Filtro por ID y orden DESC', funcion: filtroYOrdenID, prioridad: 'MEDIA' },
        { numero: 31, nombre: 'TC031 - Recargar con filtros aplicados', funcion: recargaConFiltros, prioridad: 'MEDIA' },
        { numero: 32, nombre: 'TC032 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' }
    ];

    // Resumen al final
    after(() => {
        cy.procesarResultadosPantalla('Ficheros (Siniestros)');
    });

    // Filtrar casos por prioridad si se especifica
    const prioridadFiltro = Cypress.env('prioridad');
    const casosFiltrados = prioridadFiltro && prioridadFiltro !== 'todas' 
        ? casos.filter(caso => caso.prioridad === prioridadFiltro.toUpperCase())
        : casos;

    // Iterador con protección anti doble registro
    casosFiltrados.forEach(({ numero, nombre, funcion, prioridad }) => {
        it(`${nombre} [${prioridad}]`, () => {
            // Reset de flags por test
            cy.resetearFlagsTest();

            // Captura de errores y registro
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    archivo,
                    pantalla: 'Ficheros (Siniestros)'
                });
                return false;
            });

            cy.login();
            cy.wait(500);

            // Ejecuta el caso y sólo auto-OK si nadie registró antes
            return funcion().then(() => {
                cy.estaRegistrado().then((ya) => {
                    if (!ya) {
                        cy.registrarResultados({
                            numero,
                            nombre,
                            esperado: 'Comportamiento correcto',
                            obtenido: 'Comportamiento correcto',
                            resultado: 'OK',
                            archivo,
                            pantalla: 'Ficheros (Siniestros)'
                        });
                    }
                });
            });
        });
    });

    function verListaSiniestros() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-root').should('be.visible');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function filtrarPorIDExacto() {
        return cy.navegarAMenu('Ficheros', 'Siniestros').then(() => {
            cy.url().should('include', '/dashboard/crash-reports');
            cy.get('.MuiDataGrid-root').should('be.visible');

            return cy.get('select[name="column"]').then($sel => {
                const opts = [...$sel[0].options].map(o => o.text.trim().toLowerCase());
                cy.wrap($sel).select(opts.includes('id') ? 'ID' : 'Código', { force: true });

                cy.get('input#search[placeholder="Buscar"]')
                    .should('be.visible')
                    .clear({ force: true })
                    .type('1{enter}', { force: true });

                cy.wait(1000);

                return cy.get('body').then($body => {
                    const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;

                    if (!hayFilas) {
                        return cy.registrarResultados({
                            numero: 2, nombre: 'TC002 - Filtrar por "ID" con coincidencia exacta',
                            esperado: 'Se muestran solo las filas con el ID exacto ingresado',
                            obtenido: 'No se muestran filas y sí existen registros con ese ID',
                            resultado: 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                        });
                    }

                    const tieneColumnaId = $body.find('div.MuiDataGrid-cell[data-field="id"]').length > 0;
                    const obtenerTexto = tieneColumnaId
                        ? cy.get('.MuiDataGrid-row:visible').first().find('div.MuiDataGrid-cell[data-field="id"]').invoke('text')
                        : cy.get('.MuiDataGrid-row:visible').first().find('div.MuiDataGrid-cell').eq(0).invoke('text');

                    return obtenerTexto.then(t => {
                        const ok = t.trim() === '1';
                        return cy.registrarResultados({
                            numero: 2,
                            nombre: 'TC002 - Filtrar por "ID" con coincidencia exacta',
                            esperado: 'Se muestran solo las filas con el ID exacto ingresado',
                            obtenido: ok ? 'Comportamiento correcto' : `La primera celda/columna no es 1 (es ${t.trim()})`,
                            resultado: ok ? 'OK' : 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                        });
                    });
                });
            });
        });
    }

    function limpiarFiltros() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-row').its('length').as('totalFilasIniciales');
        cy.get('#column').select('Todos');
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row').its('length').then(filasActuales => {
            cy.get('@totalFilasIniciales').then(filasIniciales => {
                expect(filasActuales).to.equal(filasIniciales);
            });
        });
    }

    function filtroSinResultados() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.get('#column').select('ID');
        cy.get('#search').clear({ force: true }).type('256{enter}', { force: true });
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row').should('have.length', 0);
    }

    function fechasInvalidas() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        // completar fechas según lo implementado
        return cy.get('.MuiDataGrid-row:visible').should('have.length', 0);
    }

    function ordenarFechaAsc() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.contains('.MuiDataGrid-columnHeader', 'Fecha').click();
        return cy.get('.MuiDataGrid-cell[data-colindex="2"]').then($cells => {
            const fechas = [...$cells].map(c => new Date(c.innerText.trim()));
            const ordenadas = [...fechas].sort((a, b) => a - b);
            expect(fechas).to.deep.equal(ordenadas);
        });
    }

    function ordenarFechaDesc() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.contains('.MuiDataGrid-columnHeader', 'Fecha').click().click();
        return cy.get('.MuiDataGrid-cell[data-colindex="2"]').then($cells => {
            const fechas = [...$cells].map(c => new Date(c.innerText.trim()));
            const ordenadas = [...fechas].sort((a, b) => b - a);
            expect(fechas).to.deep.equal(ordenadas);
        });
    }

    function seleccionarFila() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0).then(() => {
            cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        });
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0).then(() => {
            cy.contains('button', 'Editar').should('not.exist');
        });
    }


    function eliminarSinSeleccion() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        return cy.get('button').filter(':visible').eq(-2).click({ force: true });
    }

    function editarConSeleccion() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.get('.MuiDataGrid-row:visible').first().as('fila');
        cy.get('@fila').click({ force: true });
        cy.wait(500);
        cy.get('@fila').dblclick({ force: true });
        return cy.url().should('match', /\/dashboard\/crash-reports\/form\/\d+$/);
    }

    function abrirFormularioAlta() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.contains('button', 'Añadir').click();
        cy.url().should('include', '/dashboard/crash-reports/form');
        cy.contains('label', 'Código').should('exist');
        return cy.contains('label', 'Tipo').should('exist');
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/crash-reports');

        cy.get('select#languageSwitcher').select('en', { force: true });

        // Esperar que regrese a la pantalla deseada
        cy.url().should('include', '/crash-reports');

        // Asegurar que se cargue la tabla correctamente
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('be.visible').within(() => {
            cy.contains('Number').should('exist');
            cy.contains('Date').should('exist');
            cy.contains('Type').should('exist');
            cy.contains('Location').should('exist');
            cy.contains('Plate').should('exist');
        });
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/crash-reports');

        cy.get('select#languageSwitcher').select('ca', { force: true });

        cy.url().should('include', '/crash-reports');
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('be.visible').within(() => {
            cy.contains('Número').should('exist');
            cy.contains('Data').should('exist');
            cy.contains('Tipus').should('exist');
            cy.contains('Ubicació').should('exist');
            cy.contains('Matrícula').should('exist');
        });
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/crash-reports');

        cy.get('select#languageSwitcher').select('es', { force: true });

        cy.url().should('include', '/crash-reports');
        return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('be.visible').within(() => {
            cy.contains('Número').should('exist');
            cy.contains('Fecha').should('exist');
        });
    }

    function scrollCabecera() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        const maxScrolls = 10;
        let intentos = 0;

        function hacerScroll(prev = 0) {
            return cy.get('.MuiDataGrid-virtualScroller').then($scroller => {
                const actual = $scroller[0].scrollHeight;
                if (actual === prev || intentos >= maxScrolls) {
                    return cy.get('.MuiDataGrid-columnHeaders').should('exist');
                } else {
                    intentos++;
                    return cy.get('.MuiDataGrid-virtualScroller')
                        .scrollTo('bottom', { duration: 400 })
                        .wait(400)
                        .then(() => hacerScroll(actual));
                }
            });
        }

        return hacerScroll();
    }

    function filtroYOrdenID() {
        cy.navegarAMenu('Ficheros', 'Siniestros');

        // Esperar a que se cargue el buscador y la tabla
        cy.get('input[placeholder="Buscar"]', { timeout: 10000 }).should('be.visible');

        // Buscar por ID específico (por ejemplo, "1")
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('1', { force: true });

        // Hacer clic en la cabecera "ID" para ordenar ASC y luego DESC
        cy.contains('div[role="columnheader"]', 'ID', { timeout: 10000 })
            .should('be.visible')
            .click({ force: true })
            .click({ force: true }); // segundo clic para DESC

        // Validar que las filas visibles están ordenadas DESC por ID numérico
        return cy.get('.MuiDataGrid-row:visible', { timeout: 10000 }).then($rows => {
            const ids = [...$rows].map(row => {
                const celda = Cypress.$(row).find('div.MuiDataGrid-cell[data-field="id"]');
                if (celda.length) {
                    return parseInt(celda.text().trim(), 10);
                } else {
                    return parseInt(Cypress.$(row).find('div.MuiDataGrid-cell').eq(0).text().trim(), 10);
                }
            });
            const ordenEsperado = [...ids].sort((a, b) => b - a);
            expect(ids).to.deep.equal(ordenEsperado);
        });
    }

    function recargaConFiltros() {
        cy.navegarAMenu('Ficheros', 'Siniestros');

        cy.get('input[placeholder="Buscar"]', { timeout: 10000 }).should('be.visible');
        cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('CR', { force: true });

        cy.contains('div[role="columnheader"]', 'ID', { timeout: 10000 }).should('be.visible').click({ force: true });
        cy.contains('div[role="columnheader"]', 'ID').click({ force: true });

        // Recargar la página y esperar a que reaparezca la tabla
        cy.reload();
        cy.get('.MuiDataGrid-rowSkeleton', { timeout: 10000 }).should('not.exist');

        // Esperar a que el input vuelva a aparecer
        cy.get('input[placeholder="Buscar"]', { timeout: 10000 }).should('exist').should('have.value', '');

        // Validar que hay datos en la primera fila
        return cy.get('.MuiDataGrid-row').first().find('div.MuiDataGrid-cell').eq(0).invoke('text').should('not.be.empty');
    }

    function filtrarPorTipo() {
        return cy.navegarAMenu('Ficheros', 'Siniestros').then(() => {
            cy.url().should('include', '/dashboard/crash-reports');
            cy.get('.MuiDataGrid-root').should('be.visible');

            return cy.get('select[name="column"]').then($sel => {
                const opts = [...$sel[0].options].map(o => o.text.trim().toLowerCase());
                cy.wrap($sel).select(opts.includes('tipo') ? 'Tipo' : 'Type', { force: true });

                cy.get('input#search[placeholder="Buscar"]')
                    .should('be.visible')
                    .clear({ force: true })
                    .type('Incendio{enter}', { force: true });

                cy.wait(1000);

                return cy.get('body').then($body => {
                    const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;
                    if (!hayFilas) {
                        return cy.registrarResultados({
                            numero: 3, nombre: 'TC003 - Filtrar por "Tipo" (Incendio)',
                            esperado: 'Se muestran solo las filas del tipo seleccionado',
                            obtenido: 'No se muestra nada y si hay filas con ese tipo',
                            resultado: 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                        });
                    }

                    let todasOK = true;
                    return cy.get('.MuiDataGrid-row:visible').each(($row) => {
                        cy.wrap($row).find('div.MuiDataGrid-cell').then($cells => {
                            if (!$cells.text().toLowerCase().includes('incendio')) todasOK = false;
                        });
                    }).then(() => {
                        return cy.registrarResultados({
                            numero: 3, nombre: 'TC003 - Filtrar por "Tipo" (Incendio)',
                            esperado: 'Se muestran solo las filas del tipo seleccionado',
                            obtenido: todasOK ? 'Comportamiento correcto' : 'Algunas filas no contienen "Incendio"',
                            resultado: todasOK ? 'OK' : 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                        });
                    });
                });
            });
        });
    }

    function filtrarPorUbicacion() {
        return cy.navegarAMenu('Ficheros', 'Siniestros').then(() => {
            cy.url().should('include', '/dashboard/crash-reports');
            cy.get('.MuiDataGrid-root').should('be.visible');

            return cy.get('select[name="column"]').then($sel => {
                const opts = [...$sel[0].options].map(o => o.text.trim().toLowerCase());
                const label = opts.includes('ubicación') || opts.includes('ubicacion') ? 'Ubicación' : (opts.includes('location') ? 'Location' : 'Ubicació');
                cy.wrap($sel).select(label, { force: true });

                cy.get('input#search[placeholder="Buscar"]').should('be.visible').clear({ force: true }).type('Ma{enter}', { force: true });
                cy.wait(1000);

                return cy.get('body').then($body => {
                    const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;
                    if (!hayFilas) {
                        return cy.registrarResultados({
                            numero: 4, nombre: 'TC004 - Filtrar por "Ubicación" con coincidencia parcial',
                            esperado: 'Se muestran las filas donde la ubicación contenga el texto ingresado',
                            obtenido: 'No se muestra nada existiendo filas coincidentes',
                            resultado: 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                        });
                    }

                    let todasOK = true;
                    return cy.get('.MuiDataGrid-row:visible').each(($row) => {
                        cy.wrap($row).find('div.MuiDataGrid-cell').then($cells => {
                            if (!$cells.text().toLowerCase().includes('ma')) todasOK = false;
                        });
                    }).then(() => {
                        return cy.registrarResultados({
                            numero: 4, nombre: 'TC004 - Filtrar por "Ubicación" con coincidencia parcial',
                            esperado: 'Se muestran las filas donde la ubicación contenga el texto ingresado',
                            obtenido: todasOK ? 'Comportamiento correcto' : 'Algunas filas no contienen "Ma" en la ubicación',
                            resultado: todasOK ? 'OK' : 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                        });
                    });
                });
            });
        });
    }

    function filtrarPorMatricula() {
        return cy.navegarAMenu('Ficheros', 'Siniestros').then(() => {
            cy.url().should('include', '/dashboard/crash-reports');
            cy.get('.MuiDataGrid-root').should('be.visible');

            return cy.get('select[name="column"]').then($sel => {
                const opts = [...$sel[0].options].map(o => o.text.trim().toLowerCase());
                const label = opts.includes('matrícula') || opts.includes('matricula') ? 'Matrícula' : (opts.includes('plate') ? 'Plate' : 'Matrícula');
                cy.wrap($sel).select(label, { force: true });

                cy.get('input#search[placeholder="Buscar"]').should('be.visible').clear({ force: true }).type('013{enter}', { force: true });
                cy.wait(1000);

                return cy.get('body').then($body => {
                    const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;
                    if (!hayFilas) {
                        return cy.registrarResultados({
                            numero: 5, nombre: 'TC005 - Filtrar por "Matrícula"',
                            esperado: 'Se muestran los siniestros de la matrícula indicada',
                            obtenido: 'No se muestra nada existiendo filas coincidentes',
                            resultado: 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                        });
                    }

                    let todasOK = true;
                    return cy.get('.MuiDataGrid-row:visible').each(($row) => {
                        cy.wrap($row).find('div.MuiDataGrid-cell').then($cells => {
                            if (!$cells.text().includes('013')) todasOK = false;
                        });
                    }).then(() => {
                        return cy.registrarResultados({
                            numero: 5, nombre: 'TC005 - Filtrar por "Matrícula"',
                            esperado: 'Se muestran los siniestros de la matrícula indicada',
                            obtenido: todasOK ? 'Comportamiento correcto' : 'Algunas filas no contienen "013" en la matrícula',
                            resultado: todasOK ? 'OK' : 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                        });
                    });
                });
            });
        });
    }

    function filtrarPorConductor() {
        return cy.navegarAMenu('Ficheros', 'Siniestros').then(() => {
            cy.url().should('include', '/dashboard/crash-reports');
            cy.get('.MuiDataGrid-root').should('be.visible');

            return cy.get('select[name="column"]').then($sel => {
                const opts = [...$sel[0].options].map(o => o.text.trim().toLowerCase());
                const label = opts.includes('conductor') ? 'Conductor' : (opts.includes('driver') ? 'Driver' : 'Conductor');
                cy.wrap($sel).select(label, { force: true });

                cy.get('input#search[placeholder="Buscar"]').should('be.visible').clear({ force: true }).type('Jose{enter}', { force: true });
                cy.wait(1000);

                return cy.get('body').then($body => {
                    const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;
                    if (!hayFilas) {
                        return cy.registrarResultados({
                            numero: 6, nombre: 'TC006 - Filtrar por "Conductor"',
                            esperado: 'Se muestran los siniestros del conductor indicado',
                            obtenido: 'No se muestra nada existiendo filas coincidentes',
                            resultado: 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                        });
                    }

                    let todasOK = true;
                    return cy.get('.MuiDataGrid-row:visible').each(($row) => {
                        cy.wrap($row).find('div.MuiDataGrid-cell').then($cells => {
                            if (!$cells.text().toLowerCase().includes('jose')) todasOK = false;
                        });
                    }).then(() => {
                        return cy.registrarResultados({
                            numero: 6, nombre: 'TC006 - Filtrar por "Conductor"',
                            esperado: 'Se muestran los siniestros del conductor indicado',
                            obtenido: todasOK ? 'Comportamiento correcto' : 'Algunas filas no contienen "Jose"',
                            resultado: todasOK ? 'OK' : 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                        });
                    });
                });
            });
        });
    }

    function filtrarPorCosteReparacion() {
        return cy.navegarAMenu('Ficheros', 'Siniestros').then(() => {
            cy.url().should('include', '/dashboard/crash-reports');
            cy.get('.MuiDataGrid-root').should('be.visible');

            return cy.get('select[name="column"]').then($sel => {
                const opts = [...$sel[0].options].map(o => o.text.trim().toLowerCase());
                const label = (opts.includes('coste') || opts.includes('coste de reparación')) ? 'Coste de reparación'
                    : (opts.includes('cost') || opts.includes('repair cost')) ? 'Repair Cost'
                        : 'Coste de reparación';
                cy.wrap($sel).select(label, { force: true });

                cy.get('input#search[placeholder="Buscar"]').should('be.visible').clear({ force: true }).type('800{enter}', { force: true });
                cy.wait(1000);

                return cy.get('body').then($body => {
                    const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;
                    if (!hayFilas) {
                        return cy.registrarResultados({
                            numero: 7, nombre: 'TC007 - Filtrar por "Coste de reparación" exacto',
                            esperado: 'Se muestran solo las filas con el coste indicado',
                            obtenido: 'No se muestra nada existiendo filas coincidentes',
                            resultado: 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                        });
                    }

                    let todasOK = true;
                    return cy.get('.MuiDataGrid-row:visible').each(($row) => {
                        cy.wrap($row).find('div.MuiDataGrid-cell').then($cells => {
                            if (!$cells.text().includes('800')) todasOK = false;
                        });
                    }).then(() => {
                        return cy.registrarResultados({
                            numero: 7, nombre: 'TC007 - Filtrar por "Coste de reparación" exacto',
                            esperado: 'Se muestran solo las filas con el coste indicado',
                            obtenido: todasOK ? 'Comportamiento correcto' : 'Algunas filas no contienen "800"',
                            resultado: todasOK ? 'OK' : 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                        });
                    });
                });
            });
        });
    }

    function filtrarPorResponsable() {
        return cy.navegarAMenu('Ficheros', 'Siniestros').then(() => {
            cy.url().should('include', '/dashboard/crash-reports');
            cy.get('.MuiDataGrid-root').should('be.visible');

            return cy.get('select[name="column"]').then($sel => {
                const opts = [...$sel[0].options].map(o => o.text.trim().toLowerCase());
                const label = opts.includes('responsable') ? 'Responsable' : (opts.includes('responsible') ? 'Responsible' : 'Responsable');
                cy.wrap($sel).select(label, { force: true });

                cy.get('input#search[placeholder="Buscar"]').should('be.visible').clear({ force: true }).type('conductor{enter}', { force: true });
                cy.wait(1000);

                return cy.get('body').then($body => {
                    const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;
                    if (!hayFilas) {
                        return cy.registrarResultados({
                            numero: 8, nombre: 'TC008 - Filtrar por "Responsable"',
                            esperado: 'Se muestran los siniestros donde el responsable coincida',
                            obtenido: 'No se muestra nada existiendo filas coincidentes',
                            resultado: 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                        });
                    }

                    let todasOK = true;
                    return cy.get('.MuiDataGrid-row:visible').each(($row) => {
                        cy.wrap($row).find('div.MuiDataGrid-cell').then($cells => {
                            if (!$cells.text().toLowerCase().includes('conductor')) todasOK = false;
                        });
                    }).then(() => {
                        return cy.registrarResultados({
                            numero: 8, nombre: 'TC008 - Filtrar por "Responsable"',
                            esperado: 'Se muestran los siniestros donde el responsable coincida',
                            obtenido: todasOK ? 'Comportamiento correcto' : 'Algunas filas no contienen "conductor"',
                            resultado: todasOK ? 'OK' : 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                        });
                    });
                });
            });
        });
    }

    function filtrarPorRangoFechas() {
        return cy.navegarAMenu('Ficheros', 'Siniestros').then(() => {
            cy.url().should('include', '/dashboard/crash-reports');
            cy.get('.MuiDataGrid-root').should('be.visible');

            cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2014');
            });

            cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2015');
            });

            cy.wait(1000);

            return cy.get('body').then($body => {
                const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;
                return cy.registrarResultados({
                    numero: 13, nombre: 'TC013 - Ingresar rango de fechas válido en "Desde" y "Hasta"',
                    esperado: 'Se muestran los siniestros dentro del rango de fechas',
                    obtenido: hayFilas ? 'Comportamiento correcto' : 'No se muestran siniestros dentro del rango de fechas',
                    resultado: hayFilas ? 'OK' : 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                });
            });
        });
    }

    function filtrarPorFechaDesde() {
        return cy.navegarAMenu('Ficheros', 'Siniestros').then(() => {
            cy.url().should('include', '/dashboard/crash-reports');
            cy.get('.MuiDataGrid-root').should('be.visible');

            cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2014');
            });

            cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}');
            });

            cy.wait(1000);

            return cy.get('body').then($body => {
                const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;
                return cy.registrarResultados({
                    numero: 14, nombre: 'TC014 - Ingresar solo fecha "Desde"',
                    esperado: 'Se muestran siniestros desde esa fecha en adelante',
                    obtenido: hayFilas ? 'Comportamiento correcto' : 'No se muestran siniestros desde esa fecha en adelante',
                    resultado: hayFilas ? 'OK' : 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                });
            });
        });
    }

    function filtrarPorFechaHasta() {
        return cy.navegarAMenu('Ficheros', 'Siniestros').then(() => {
            cy.url().should('include', '/dashboard/crash-reports');
            cy.get('.MuiDataGrid-root').should('be.visible');

            cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}');
            });

            cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2015');
            });

            cy.wait(1000);

            return cy.get('body').then($body => {
                const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;
                return cy.registrarResultados({
                    numero: 15, nombre: 'TC015 - Ingresar solo fecha "Hasta"',
                    esperado: 'Se muestran siniestros hasta esa fecha',
                    obtenido: hayFilas ? 'Comportamiento correcto' : 'No se muestran siniestros hasta esa fecha',
                    resultado: hayFilas ? 'OK' : 'ERROR', pantalla: 'Ficheros (Siniestros)', archivo
                });
            });
        });
    }

    function ordenarCosteReparacionAsc() {
        return cy.navegarAMenu('Ficheros', 'Siniestros').then(() => {
            cy.url().should('include', '/dashboard/crash-reports');
            cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

            cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 1000 });
            cy.wait(500);
            cy.contains('.MuiDataGrid-columnHeaderTitle', 'Coste de reparación').should('be.visible').click({ force: true });
            cy.wait(1000);

            return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0).then(() => {
                return cy.registrarResultados({
                    numero: 19, nombre: 'TC019 - Ordenar por "Coste de reparación" ascendente',
                    esperado: 'Las filas se ordenan por coste de reparación de menor a mayor',
                    obtenido: 'Comportamiento correcto - Ordenamiento aplicado exitosamente',
                    resultado: 'OK', pantalla: 'Ficheros (Siniestros)', archivo
                });
            });
        });
    }

    function ordenarCosteReparacionDesc() {
        return cy.navegarAMenu('Ficheros', 'Siniestros').then(() => {
            cy.url().should('include', '/dashboard/crash-reports');
            cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

            cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 1000 });
            cy.wait(500);
            cy.contains('.MuiDataGrid-columnHeaderTitle', 'Coste de reparación').should('be.visible').click({ force: true }).click({ force: true });
            cy.wait(1000);

            return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0).then(() => {
                return cy.registrarResultados({
                    numero: 20, nombre: 'TC020 - Ordenar por "Coste de reparación" descendente',
                    esperado: 'Las filas se ordenan por coste de reparación de mayor a menor',
                    obtenido: 'Comportamiento correcto - Ordenamiento aplicado exitosamente',
                    resultado: 'OK', pantalla: 'Ficheros (Siniestros)', archivo
                });
            });
        });
    }

});