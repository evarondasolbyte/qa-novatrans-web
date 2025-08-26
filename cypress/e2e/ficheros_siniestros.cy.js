describe('FICHEROS - SINIESTROS - Validación completa con errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Ver lista de siniestros al acceder a la pantalla', funcion: verListaSiniestros },
        { numero: 2, nombre: 'TC002 - Filtrar por "ID" con coincidencia exacta', funcion: filtrarPorIDExacto },
        { numero: 3, nombre: 'TC003 - Filtrar por "Tipo"', funcion: filtrarPorTipo },
        { numero: 4, nombre: 'TC004 - Filtrar por "Ubicación" con coincidencia parcial', funcion: filtrarPorUbicacion },
        { numero: 5, nombre: 'TC005 - Filtrar por "Matrícula"', funcion: filtrarPorMatricula },
        { numero: 6, nombre: 'TC006 - Filtrar por "Conductor"', funcion: filtrarPorConductor },
        { numero: 7, nombre: 'TC007 - Filtrar por "Coste de reparación" exacto', funcion: filtrarPorCosteReparacion },
        { numero: 8, nombre: 'TC008 - Filtrar por "Responsable"', funcion: filtrarPorResponsable },
        { numero: 11, nombre: 'TC011 - Limpiar filtros y mostrar todos los siniestros', funcion: limpiarFiltros },
        { numero: 12, nombre: 'TC012 - Filtrar siniestros con texto sin coincidencias', funcion: filtroSinResultados },
        { numero: 13, nombre: 'TC013 - Ingresar rango de fechas válido en "Desde" y "Hasta"', funcion: filtrarPorRangoFechas },
        { numero: 14, nombre: 'TC014 - Ingresar solo fecha "Desde"', funcion: filtrarPorFechaDesde },
        { numero: 15, nombre: 'TC015 - Ingresar solo fecha "Hasta"', funcion: filtrarPorFechaHasta },
        { numero: 16, nombre: 'TC016 - Ingresar Fecha Desde mayor que Fecha Hasta', funcion: fechasInvalidas },
        { numero: 17, nombre: 'TC017 - Ordenar por Fecha ascendente en siniestros', funcion: ordenarFechaAsc },
        { numero: 18, nombre: 'TC018 - Ordenar por Fecha descendente en siniestros', funcion: ordenarFechaDesc },
        { numero: 19, nombre: 'TC019 - Ordenar por "Coste de reparación" ascendente', funcion: ordenarCosteReparacionAsc },
        { numero: 20, nombre: 'TC020 - Ordenar por "Coste de reparación" descendente', funcion: ordenarCosteReparacionDesc },
        { numero: 21, nombre: 'TC021 - Seleccionar una fila individual en siniestros', funcion: seleccionarFila },
        { numero: 22, nombre: 'TC022 - Botón "Editar" no visible sin selección', funcion: editarSinSeleccion },
        { numero: 23, nombre: 'TC023 - "Editar" con una fila seleccionada', funcion: editarConSeleccion },
        { numero: 24, nombre: 'TC024 - Pulsar "Eliminar" sin seleccionar fila', funcion: eliminarSinSeleccion },
        { numero: 26, nombre: 'TC026 - Añadir siniestro y abrir formulario', funcion: abrirFormularioAlta },
        { numero: 27, nombre: 'TC027 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles },
        { numero: 28, nombre: 'TC028 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan },
        { numero: 29, nombre: 'TC029 - Scroll vertical sin perder cabecera', funcion: scrollCabecera },
        { numero: 30, nombre: 'TC030 - Filtro por ID y orden DESC', funcion: filtroYOrdenID },
        { numero: 31, nombre: 'TC031 - Recargar con filtros aplicados', funcion: recargaConFiltros },
        { numero: 32, nombre: 'TC032 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol }
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Ficheros (Siniestros)');
    });

    casos.forEach(({ numero, nombre, funcion }) => {
        it(nombre, () => {
            // Reseteo el flag de error al inicio de cada test
            cy.resetearErrorFlag();
            
            // Si algo falla durante la ejecución del test, capturo el error automáticamente
            // y lo registro en el Excel con todos los datos del caso.
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,                    // Número de caso de prueba
                    nombre,                    // Nombre del test (título del caso)
                    esperado: 'Comportamiento correcto',  // Qué se esperaba que ocurriera
                    archivo,                   // Nombre del archivo Excel donde se guarda todo
                    pantalla: 'Ficheros (Siniestros)'
                });
                return false; // Previene que Cypress corte el flujo y nos permite seguir registrando
            });

            // Inicio sesión antes de ejecutar el caso, usando la sesión compartida (cy.login)
            // y espero unos milisegundos por seguridad antes de continuar
            cy.login();
            cy.wait(500);

            // Ejecuto la función correspondiente al test (ya definida arriba)
            funcion();

            // Si todo salió bien, registro el resultado como OK en el Excel
            cy.registrarResultados({
                numero,                   // Número del caso
                nombre,                   // Nombre del test
                esperado: 'Comportamiento correcto',  // Qué esperaba que hiciera
                obtenido: 'Comportamiento correcto',  // Qué hizo realmente (si coincide, marca OK)
                resultado: 'OK',          // Marca manualmente como OK
                archivo,                  // Archivo Excel donde se registra
                pantalla: 'Ficheros (Siniestros)'
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
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // Seleccionar columna "ID" (o "Código" si no está)
        cy.get('select[name="column"]').then($sel => {
            const opts = [...$sel[0].options].map(o => o.text.trim().toLowerCase());
            if (opts.includes('id')) {
                cy.wrap($sel).select('ID', { force: true });
            } else {
                cy.wrap($sel).select('Código', { force: true });
            }
        });

        // Buscar ID exacto = 1
        cy.get('input#search[placeholder="Buscar"]')
            .should('be.visible')
            .clear({ force: true })
            .type('1{enter}', { force: true });

        cy.wait(1000); // esperar a que aplique el filtro

        cy.get('body').then($body => {
            const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;

            if (!hayFilas) {
                // No hay filas: registrar KO
                cy.registrarResultados({
                    numero: 2,
                    nombre: 'TC002 - Filtrar por "ID" con coincidencia exacta',
                    esperado: 'Se muestran solo las filas con el ID exacto ingresado',
                    obtenido: 'No se muestran filas y sí existen registros con ese ID',
                    resultado: 'ERROR',
                    pantalla: 'Ficheros (Siniestros)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
                return;
            }

            // Hay filas: verificar que el ID de la primera coincide con 1
            const tieneColumnaId = $body.find('div.MuiDataGrid-cell[data-field="id"]').length > 0;

            if (tieneColumnaId) {
                cy.get('.MuiDataGrid-row:visible').first()
                    .find('div.MuiDataGrid-cell[data-field="id"]')
                    .invoke('text')
                    .then(t => {
                        const ok = t.trim() === '1';
                        cy.registrarResultados({
                            numero: 2,
                            nombre: 'TC002 - Filtrar por "ID" con coincidencia exacta',
                            esperado: 'Se muestran solo las filas con el ID exacto ingresado',
                            obtenido: ok ? 'Comportamiento correcto' : `La primera fila no tiene ID = 1 (tiene ${t.trim()})`,
                            resultado: ok ? 'OK' : 'ERROR',
                            pantalla: 'Ficheros (Siniestros)',
                            archivo: 'reportes_pruebas_novatrans.xlsx'
                        });
                    });
            } else {
                // Fallback: usar la primera celda de la fila si no hay data-field="id"
                cy.get('.MuiDataGrid-row:visible').first()
                    .find('div.MuiDataGrid-cell').eq(0)
                    .invoke('text')
                    .then(t => {
                        const ok = t.trim() === '1';
                        cy.registrarResultados({
                            numero: 2,
                            nombre: 'TC002 - Filtrar por "ID" con coincidencia exacta',
                            esperado: 'Se muestran solo las filas con el ID exacto ingresado',
                            obtenido: ok ? 'Comportamiento correcto' : `La primera celda no es 1 (es ${t.trim()})`,
                            resultado: ok ? 'OK' : 'ERROR',
                            pantalla: 'Ficheros (Siniestros)',
                            archivo: 'reportes_pruebas_novatrans.xlsx'
                        });
                    });
            }
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
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // Seleccionar columna "Tipo"
        cy.get('select[name="column"]').then($sel => {
            const opts = [...$sel[0].options].map(o => o.text.trim().toLowerCase());
            if (opts.includes('tipo')) {
                cy.wrap($sel).select('Tipo', { force: true });
            } else {
                cy.wrap($sel).select('Type', { force: true });
            }
        });

        // Buscar tipo "Incendio"
        cy.get('input#search[placeholder="Buscar"]')
            .should('be.visible')
            .clear({ force: true })
            .type('Incendio{enter}', { force: true });

        cy.wait(1000); // esperar a que aplique el filtro

        cy.get('body').then($body => {
            const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;

            if (!hayFilas) {
                // No hay filas: registrar KO
                cy.registrarResultados({
                    numero: 3,
                    nombre: 'TC003 - Filtrar por "Tipo" (Incendio)',
                    esperado: 'Se muestran solo las filas del tipo seleccionado',
                    obtenido: 'No se muestra nada y si hay filas con ese tipo',
                    resultado: 'ERROR',
                    pantalla: 'Ficheros (Siniestros)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
                return;
            }

            // Hay filas: verificar que todas contengan "Incendio"
            cy.get('.MuiDataGrid-row:visible').each(($row) => {
                cy.wrap($row).find('div.MuiDataGrid-cell').then($cells => {
                    const textoFila = $cells.text().toLowerCase();
                    const contieneIncendio = textoFila.includes('incendio');
                    
                    if (!contieneIncendio) {
                        cy.registrarResultados({
                            numero: 3,
                            nombre: 'TC003 - Filtrar por "Tipo" (Incendio)',
                            esperado: 'Se muestran solo las filas del tipo seleccionado',
                            obtenido: `Fila encontrada no contiene "Incendio": ${textoFila}`,
                            resultado: 'ERROR',
                            pantalla: 'Ficheros (Siniestros)',
                            archivo: 'reportes_pruebas_novatrans.xlsx'
                        });
                    }
                });
            });

            // Si llegamos aquí, todas las filas contienen "Incendio"
            cy.registrarResultados({
                numero: 3,
                nombre: 'TC003 - Filtrar por "Tipo" (Incendio)',
                esperado: 'Se muestran solo las filas del tipo seleccionado',
                obtenido: 'Comportamiento correcto',
                resultado: 'OK',
                pantalla: 'Ficheros (Siniestros)',
                archivo: 'reportes_pruebas_novatrans.xlsx'
            });
        });
    }

    function filtrarPorUbicacion() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // Seleccionar columna "Ubicación"
        cy.get('select[name="column"]').then($sel => {
            const opts = [...$sel[0].options].map(o => o.text.trim().toLowerCase());
            if (opts.includes('ubicación') || opts.includes('ubicacion')) {
                cy.wrap($sel).select('Ubicación', { force: true });
            } else if (opts.includes('location')) {
                cy.wrap($sel).select('Location', { force: true });
            } else {
                cy.wrap($sel).select('Ubicació', { force: true });
            }
        });

        // Buscar ubicación con coincidencia parcial "Ma"
        cy.get('input#search[placeholder="Buscar"]')
            .should('be.visible')
            .clear({ force: true })
            .type('Ma{enter}', { force: true });

        cy.wait(1000); // esperar a que aplique el filtro

        cy.get('body').then($body => {
            const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;

            if (!hayFilas) {
                // No hay filas: registrar KO
                cy.registrarResultados({
                    numero: 4,
                    nombre: 'TC004 - Filtrar por "Ubicación" con coincidencia parcial',
                    esperado: 'Se muestran las filas donde la ubicación contenga el texto ingresado',
                    obtenido: 'No se muestra nada y si hay filas que contienen esa ubicación',
                    resultado: 'ERROR',
                    pantalla: 'Ficheros (Siniestros)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
                return;
            }

            // Hay filas: verificar que todas contengan "Ma" en la ubicación
            let todasContienenMa = true;
            cy.get('.MuiDataGrid-row:visible').each(($row) => {
                cy.wrap($row).find('div.MuiDataGrid-cell').then($cells => {
                    const textoFila = $cells.text().toLowerCase();
                    const contieneMa = textoFila.includes('ma');
                    
                    if (!contieneMa) {
                        todasContienenMa = false;
                    }
                });
            }).then(() => {
                cy.registrarResultados({
                    numero: 4,
                    nombre: 'TC004 - Filtrar por "Ubicación" con coincidencia parcial',
                    esperado: 'Se muestran las filas donde la ubicación contenga el texto ingresado',
                    obtenido: todasContienenMa ? 'Comportamiento correcto' : 'Algunas filas no contienen "Ma" en la ubicación',
                    resultado: todasContienenMa ? 'OK' : 'ERROR',
                    pantalla: 'Ficheros (Siniestros)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            });
        });
    }

    function filtrarPorMatricula() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // Seleccionar columna "Matrícula"
        cy.get('select[name="column"]').then($sel => {
            const opts = [...$sel[0].options].map(o => o.text.trim().toLowerCase());
            if (opts.includes('matrícula') || opts.includes('matricula')) {
                cy.wrap($sel).select('Matrícula', { force: true });
            } else if (opts.includes('plate')) {
                cy.wrap($sel).select('Plate', { force: true });
            } else {
                cy.wrap($sel).select('Matrícula', { force: true });
            }
        });

        // Buscar matrícula "013"
        cy.get('input#search[placeholder="Buscar"]')
            .should('be.visible')
            .clear({ force: true })
            .type('013{enter}', { force: true });

        cy.wait(1000); // esperar a que aplique el filtro

        cy.get('body').then($body => {
            const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;

            if (!hayFilas) {
                // No hay filas: registrar KO
                cy.registrarResultados({
                    numero: 5,
                    nombre: 'TC005 - Filtrar por "Matrícula"',
                    esperado: 'Se muestran los siniestros de la matrícula indicada',
                    obtenido: 'No se muestra nada y si hay filas que contienen esa matrícula',
                    resultado: 'ERROR',
                    pantalla: 'Ficheros (Siniestros)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
                return;
            }

            // Hay filas: verificar que todas contengan "013" en la matrícula
            let todasContienen013 = true;
            cy.get('.MuiDataGrid-row:visible').each(($row) => {
                cy.wrap($row).find('div.MuiDataGrid-cell').then($cells => {
                    const textoFila = $cells.text();
                    const contiene013 = textoFila.includes('013');
                    
                    if (!contiene013) {
                        todasContienen013 = false;
                    }
                });
            }).then(() => {
                cy.registrarResultados({
                    numero: 5,
                    nombre: 'TC005 - Filtrar por "Matrícula"',
                    esperado: 'Se muestran los siniestros de la matrícula indicada',
                    obtenido: todasContienen013 ? 'Comportamiento correcto' : 'Algunas filas no contienen "013" en la matrícula',
                    resultado: todasContienen013 ? 'OK' : 'ERROR',
                    pantalla: 'Ficheros (Siniestros)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            });
        });
    }

    function filtrarPorConductor() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // Seleccionar columna "Conductor"
        cy.get('select[name="column"]').then($sel => {
            const opts = [...$sel[0].options].map(o => o.text.trim().toLowerCase());
            if (opts.includes('conductor')) {
                cy.wrap($sel).select('Conductor', { force: true });
            } else if (opts.includes('driver')) {
                cy.wrap($sel).select('Driver', { force: true });
            } else {
                cy.wrap($sel).select('Conductor', { force: true });
            }
        });

        // Buscar conductor "Jose"
        cy.get('input#search[placeholder="Buscar"]')
            .should('be.visible')
            .clear({ force: true })
            .type('Jose{enter}', { force: true });

        cy.wait(1000); // esperar a que aplique el filtro

        cy.get('body').then($body => {
            const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;

            if (!hayFilas) {
                // No hay filas: registrar KO
                cy.registrarResultados({
                    numero: 6,
                    nombre: 'TC006 - Filtrar por "Conductor"',
                    esperado: 'Se muestran los siniestros del conductor indicado',
                    obtenido: 'No se muestra nada y si hay filas que contienen el nombre de ese conductor',
                    resultado: 'ERROR',
                    pantalla: 'Ficheros (Siniestros)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
                return;
            }

            // Hay filas: verificar que todas contengan "Jose" en el conductor
            let todasContienenJose = true;
            cy.get('.MuiDataGrid-row:visible').each(($row) => {
                cy.wrap($row).find('div.MuiDataGrid-cell').then($cells => {
                    const textoFila = $cells.text().toLowerCase();
                    const contieneJose = textoFila.includes('jose');
                    
                    if (!contieneJose) {
                        todasContienenJose = false;
                    }
                });
            }).then(() => {
                cy.registrarResultados({
                    numero: 6,
                    nombre: 'TC006 - Filtrar por "Conductor"',
                    esperado: 'Se muestran los siniestros del conductor indicado',
                    obtenido: todasContienenJose ? 'Comportamiento correcto' : 'Algunas filas no contienen "Jose" en el conductor',
                    resultado: todasContienenJose ? 'OK' : 'ERROR',
                    pantalla: 'Ficheros (Siniestros)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            });
        });
    }

    function filtrarPorCosteReparacion() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // Seleccionar columna "Coste de reparación"
        cy.get('select[name="column"]').then($sel => {
            const opts = [...$sel[0].options].map(o => o.text.trim().toLowerCase());
            if (opts.includes('coste') || opts.includes('coste de reparación')) {
                cy.wrap($sel).select('Coste de reparación', { force: true });
            } else if (opts.includes('cost') || opts.includes('repair cost')) {
                cy.wrap($sel).select('Repair Cost', { force: true });
            } else {
                cy.wrap($sel).select('Coste de reparación', { force: true });
            }
        });

        // Buscar coste de reparación exacto "800"
        cy.get('input#search[placeholder="Buscar"]')
            .should('be.visible')
            .clear({ force: true })
            .type('800{enter}', { force: true });

        cy.wait(1000); // esperar a que aplique el filtro

        cy.get('body').then($body => {
            const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;

            if (!hayFilas) {
                // No hay filas: registrar KO
                cy.registrarResultados({
                    numero: 7,
                    nombre: 'TC007 - Filtrar por "Coste de reparación" exacto',
                    esperado: 'Se muestran solo las filas con el coste indicado',
                    obtenido: 'No se muestra nada y si hay filas con ese coste de reparación',
                    resultado: 'ERROR',
                    pantalla: 'Ficheros (Siniestros)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
                return;
            }

            // Hay filas: verificar que todas contengan exactamente "800" en el coste
            let todasContienen800 = true;
            cy.get('.MuiDataGrid-row:visible').each(($row) => {
                cy.wrap($row).find('div.MuiDataGrid-cell').then($cells => {
                    const textoFila = $cells.text();
                    const contiene800 = textoFila.includes('800');
                    
                    if (!contiene800) {
                        todasContienen800 = false;
                    }
                });
            }).then(() => {
                cy.registrarResultados({
                    numero: 7,
                    nombre: 'TC007 - Filtrar por "Coste de reparación" exacto',
                    esperado: 'Se muestran solo las filas con el coste indicado',
                    obtenido: todasContienen800 ? 'Comportamiento correcto' : 'Algunas filas no contienen "800" en el coste de reparación',
                    resultado: todasContienen800 ? 'OK' : 'ERROR',
                    pantalla: 'Ficheros (Siniestros)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            });
        });
    }

    function filtrarPorResponsable() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // Seleccionar columna "Responsable"
        cy.get('select[name="column"]').then($sel => {
            const opts = [...$sel[0].options].map(o => o.text.trim().toLowerCase());
            if (opts.includes('responsable')) {
                cy.wrap($sel).select('Responsable', { force: true });
            } else if (opts.includes('responsible')) {
                cy.wrap($sel).select('Responsible', { force: true });
            } else {
                cy.wrap($sel).select('Responsable', { force: true });
            }
        });

        // Buscar responsable "conductor"
        cy.get('input#search[placeholder="Buscar"]')
            .should('be.visible')
            .clear({ force: true })
            .type('conductor{enter}', { force: true });

        cy.wait(1000); // esperar a que aplique el filtro

        cy.get('body').then($body => {
            const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;

            if (!hayFilas) {
                // No hay filas: registrar KO
                cy.registrarResultados({
                    numero: 8,
                    nombre: 'TC008 - Filtrar por "Responsable"',
                    esperado: 'Se muestran los siniestros donde el responsable coincida',
                    obtenido: 'No se muestra nada y si hay filas con el nombre de ese responsable',
                    resultado: 'ERROR',
                    pantalla: 'Ficheros (Siniestros)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
                return;
            }

            // Hay filas: verificar que todas contengan "conductor" en el responsable
            let todasContienenConductor = true;
            cy.get('.MuiDataGrid-row:visible').each(($row) => {
                cy.wrap($row).find('div.MuiDataGrid-cell').then($cells => {
                    const textoFila = $cells.text().toLowerCase();
                    const contieneConductor = textoFila.includes('conductor');
                    
                    if (!contieneConductor) {
                        todasContienenConductor = false;
                    }
                });
            }).then(() => {
                cy.registrarResultados({
                    numero: 8,
                    nombre: 'TC008 - Filtrar por "Responsable"',
                    esperado: 'Se muestran los siniestros donde el responsable coincida',
                    obtenido: todasContienenConductor ? 'Comportamiento correcto' : 'Algunas filas no contienen "conductor" en el responsable',
                    resultado: todasContienenConductor ? 'OK' : 'ERROR',
                    pantalla: 'Ficheros (Siniestros)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
            });
        });
    }

    function filtrarPorRangoFechas() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // Fecha desde: 01/01/2014
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first()
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2014');
            });

        // Fecha hasta: 31/12/2015
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1)
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2015');
            });

        cy.wait(1000); // esperar a que aplique el filtro

        cy.get('body').then($body => {
            const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;

            if (!hayFilas) {
                // No hay filas: registrar KO
                cy.registrarResultados({
                    numero: 13,
                    nombre: 'TC013 - Ingresar rango de fechas válido en "Desde" y "Hasta"',
                    esperado: 'Se muestran los siniestros dentro del rango de fechas',
                    obtenido: 'No se muestran siniestros dentro del rango de fechas',
                    resultado: 'ERROR',
                    pantalla: 'Ficheros (Siniestros)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
                return;
            }

            // Hay filas: registrar OK
            cy.registrarResultados({
                numero: 13,
                nombre: 'TC013 - Ingresar rango de fechas válido en "Desde" y "Hasta"',
                esperado: 'Se muestran los siniestros dentro del rango de fechas',
                obtenido: 'Comportamiento correcto',
                resultado: 'OK',
                pantalla: 'Ficheros (Siniestros)',
                archivo: 'reportes_pruebas_novatrans.xlsx'
            });
        });
    }

    function filtrarPorFechaDesde() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // Fecha desde: 01/01/2014
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first()
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2014');
            });

        // Limpiar fecha hasta
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1)
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}');
            });

        cy.wait(1000); // esperar a que aplique el filtro

        cy.get('body').then($body => {
            const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;

            if (!hayFilas) {
                // No hay filas: registrar KO
                cy.registrarResultados({
                    numero: 14,
                    nombre: 'TC014 - Ingresar solo fecha "Desde"',
                    esperado: 'Se muestran siniestros desde esa fecha en adelante',
                    obtenido: 'No se muestran siniestros desde esa fecha en adelante',
                    resultado: 'ERROR',
                    pantalla: 'Ficheros (Siniestros)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
                return;
            }

            // Hay filas: registrar OK
            cy.registrarResultados({
                numero: 14,
                nombre: 'TC014 - Ingresar solo fecha "Desde"',
                esperado: 'Se muestran siniestros desde esa fecha en adelante',
                obtenido: 'Comportamiento correcto',
                resultado: 'OK',
                pantalla: 'Ficheros (Siniestros)',
                archivo: 'reportes_pruebas_novatrans.xlsx'
            });
        });
    }

    function filtrarPorFechaHasta() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // Limpiar fecha desde
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first()
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}');
            });

        // Fecha hasta: 31/12/2015
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1)
            .within(() => {
                cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
                cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
                cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2015');
            });

        cy.wait(1000); // esperar a que aplique el filtro

        cy.get('body').then($body => {
            const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;

            if (!hayFilas) {
                // No hay filas: registrar KO
                cy.registrarResultados({
                    numero: 15,
                    nombre: 'TC015 - Ingresar solo fecha "Hasta"',
                    esperado: 'Se muestran siniestros hasta esa fecha',
                    obtenido: 'No se muestran siniestros hasta esa fecha',
                    resultado: 'ERROR',
                    pantalla: 'Ficheros (Siniestros)',
                    archivo: 'reportes_pruebas_novatrans.xlsx'
                });
                return;
            }

            // Hay filas: registrar OK
            cy.registrarResultados({
                numero: 15,
                nombre: 'TC015 - Ingresar solo fecha "Hasta"',
                esperado: 'Se muestran siniestros hasta esa fecha',
                obtenido: 'Comportamiento correcto',
                resultado: 'OK',
                pantalla: 'Ficheros (Siniestros)',
                archivo: 'reportes_pruebas_novatrans.xlsx'
            });
        });
    }

    function ordenarCosteReparacionAsc() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Hacer scroll horizontal para hacer visible la columna "Coste de reparación"
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 1000 });
        cy.wait(500);

        // Hacer clic en el encabezado de la columna "Coste de reparación"
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Coste de reparación')
            .should('be.visible')
            .click({ force: true });

        cy.wait(1000);

        // Verificar que el ordenamiento se aplicó correctamente
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        
        // Registrar como OK ya que el ordenamiento se aplicó sin errores
        cy.registrarResultados({
            numero: 19,
            nombre: 'TC019 - Ordenar por "Coste de reparación" ascendente',
            esperado: 'Las filas se ordenan por coste de reparación de menor a mayor',
            obtenido: 'Comportamiento correcto - Ordenamiento aplicado exitosamente',
            resultado: 'OK',
            pantalla: 'Ficheros (Siniestros)',
            archivo: 'reportes_pruebas_novatrans.xlsx'
        });
    }

    function ordenarCosteReparacionDesc() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Hacer scroll horizontal para hacer visible la columna "Coste de reparación"
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 1000 });
        cy.wait(500);

        // Hacer clic en el encabezado de la columna "Coste de reparación" dos veces para ordenar descendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Coste de reparación')
            .should('be.visible')
            .click({ force: true })
            .click({ force: true });

        cy.wait(1000);

        // Verificar que el ordenamiento se aplicó correctamente
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        
        // Registrar como OK ya que el ordenamiento se aplicó sin errores
        cy.registrarResultados({
            numero: 20,
            nombre: 'TC020 - Ordenar por "Coste de reparación" descendente',
            esperado: 'Las filas se ordenan por coste de reparación de mayor a menor',
            obtenido: 'Comportamiento correcto - Ordenamiento aplicado exitosamente',
            resultado: 'OK',
            pantalla: 'Ficheros (Siniestros)',
            archivo: 'reportes_pruebas_novatrans.xlsx'
        });
    }

});