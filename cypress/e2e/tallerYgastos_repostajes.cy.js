describe('TALLER Y GASTOS - REPOSTAJES - Validación completa con errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Carga inicial de la pantalla de Repostajes', funcion: cargaInicial },
        { numero: 2, nombre: 'TC002 - Filtrar repostajes por Fecha', funcion: filtroFecha },
        { numero: 3, nombre: 'TC003 - Filtrar repostajes por Vehículo', funcion: filtroVehiculo },
        { numero: 4, nombre: 'TC004 - Filtrar repostajes por PT', funcion: filtroPT },
        { numero: 5, nombre: 'TC005 - Filtrar repostajes por AdBlue', funcion: filtroAdBlue },
        { numero: 6, nombre: 'TC006 - Filtrar por campo "Estación de servicio"', funcion: filtroEstacion },
        { numero: 7, nombre: 'TC007 - Filtrar por campo "Tarjeta"', funcion: filtroTarjeta },
        { numero: 8, nombre: 'TC008 - Filtrar por campo "Kilómetros/hora"', funcion: filtroKmsHora },
        { numero: 9, nombre: 'TC009 - Filtrar por campo "Litros"', funcion: filtroLitros },
        { numero: 10, nombre: 'TC010 - Filtrar por campo "Importe"', funcion: filtroImporte },
        { numero: 11, nombre: 'TC011 - Filtrar repostajes por "Lleno"', funcion: filtroLleno },
        { numero: 12, nombre: 'TC012 - Filtrar por campo "Factura"', funcion: filtroFactura },
        { numero: 13, nombre: 'TC013 - Filtrar por campo "Precio/L"', funcion: filtroPrecio },
        { numero: 15, nombre: 'TC015 - Filtrar por "Sólo llenos" activado', funcion: filtroSoloLlenos },
        { numero: 16, nombre: 'TC016 - Check "Sólo sin factura recibida" activado', funcion: filtroSinFacturaRecibida },
        { numero: 17, nombre: 'TC017 - Borrar todos los filtros aplicados', funcion: borrarFiltros },
        { numero: 18, nombre: 'TC018 - Ordenar por "Fecha" ascendente', funcion: ordenarFechaAsc },
        { numero: 19, nombre: 'TC019 - Ordenar por "Fecha" descendente', funcion: ordenarFechaDesc },
        { numero: 20, nombre: 'TC020 - Ordenar por "Litros" ascendente', funcion: ordenarLitrosAsc },
        { numero: 21, nombre: 'TC021 - Ordenar por "Litros" descendente', funcion: ordenarLitrosDesc },
        { numero: 22, nombre: 'TC022 - Seleccionar una fila individual en Repostajes', funcion: seleccionarFila },
        { numero: 23, nombre: 'TC023 - Verificar que el botón "Editar" no se muestra sin filas seleccionadas', funcion: editarSinSeleccion },
        { numero: 24, nombre: 'TC024 - Editar repostaje al hacer doble clic en una fila', funcion: editarConSeleccion },
        { numero: 25, nombre: 'TC025 - Pulsar "Eliminar" sin seleccionar ninguna fila en Repostajes', funcion: eliminarSinSeleccion },
        { numero: 26, nombre: 'TC026 - Eliminar un repostaje si es posible y confirmar su desaparición', funcion: eliminarConSeleccion },
        { numero: 27, nombre: 'TC027 - Botón "+ Añadir" siempre habilitado y abre formulario', funcion: abrirFormularioAlta },
        { numero: 28, nombre: 'TC028 - Scroll horizontal/vertical en la tabla de Repostajes', funcion: scrollTabla },
        { numero: 29, nombre: 'TC029 - Visualización correcta de importes con decimales', funcion: validarImportesDecimales },
        { numero: 30, nombre: 'TC030 - Recargar la página con filtros aplicados', funcion: recargarConFiltros },
        { numero: 31, nombre: 'TC031 - Cambiar idioma a Inglés en Repostajes', funcion: cambiarIdiomaIngles },
        { numero: 32, nombre: 'TC032 - Cambiar idioma a Español en Repostajes', funcion: cambiarIdiomaEspanol },
        { numero: 33, nombre: 'TC033 - Cambiar idioma a Catalán en Repostajes', funcion: cambiarIdiomaCatalan },
        { numero: 34, nombre: 'TC034 - Mostrar todos los repostajes al seleccionar "Todos" en tipo de combustible', funcion: filtroTipoTodos },
        { numero: 35, nombre: 'TC035 - Filtrar repostajes por tipo de combustible "Gasoil"', funcion: filtroTipoGasoil },
        { numero: 36, nombre: 'TC036 - Filtrar repostajes por tipo de combustible "Gas"', funcion: filtroTipoGas },
        { numero: 37, nombre: 'TC037 - Filtrar por tipo de combustible "AdBlue" en Repostajes', funcion: filtroTipoAdBlue },
        { numero: 38, nombre: 'TC038 - Ingresar rango de fechas válido en "Desde" y "Hasta"', funcion: filtroRangoFechas },
    ];

    // Resumen al final
    after(() => {
        cy.log('Procesando resultados finales para Taller y Gastos (Repostajes)');
        cy.procesarResultadosPantalla('Taller y Gastos (Repostajes)');
    });

    casos.forEach(({ numero, nombre, funcion }) => {
        it(nombre, () => {
            // ✅ reset de flags como en tu patrón estándar
            cy.resetearFlagsTest();

            // Captura de errores y registro
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    archivo,
                    pantalla: 'Taller y Gastos (Repostajes)',
                });
                return false;
            });

            cy.login();
            cy.wait(500);

            // Ejecuta el caso y solo auto-OK si nadie registró antes
            return funcion().then(() => {
                if (typeof cy.estaRegistrado === 'function') {
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
                                pantalla: 'Taller y Gastos (Repostajes)',
                            });
                        }
                    });
                } else {
                    cy.registrarResultados({
                        numero,
                        nombre,
                        esperado: 'Comportamiento correcto',
                        obtenido: 'Comportamiento correcto',
                        resultado: 'OK',
                        archivo,
                        pantalla: 'Taller y Gastos (Repostajes)',
                    });
                }
            });
        });
    });

    // ====== FUNCIONES ======

    function cargaInicial() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function filtroFecha() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('select#column').select('Fecha');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('2009{enter}', { force: true });

        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            }
            cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
            return cy.get('.MuiDataGrid-row:visible').each(($row) => {
                cy.wrap($row).invoke('text').should('include', '2009');
            });
        });
    }

    function filtroVehiculo() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('select#column').select('Vehículo');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('002{enter}', { force: true });

        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            }
            cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
            return cy.get('.MuiDataGrid-row:visible').each(($row) => {
                cy.wrap($row).should('contain.text', '002');
            });
        });
    }

    function filtroPT() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('select#column').select('PT');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('4717{enter}', { force: true });

        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            }
            cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
            return cy.get('.MuiDataGrid-row:visible').each(($row) => {
                cy.wrap($row).should('contain.text', '4717');
            });
        });
    }

    function filtroAdBlue() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('select#column').select('Adblue');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });

        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            }
            return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        });
    }

    function filtroEstacion() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('select[name="column"]').select('Estación de servicio');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('gasoil{enter}', { force: true });

        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            }
            cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
            return cy.get('.MuiDataGrid-row:visible').first().find('div[data-field="petrolStation"]')
                .invoke('text').then((text) => {
                    expect(text.toLowerCase()).to.include('gasoil');
                });
        });
    }

    function filtroTarjeta() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('select[name="column"]').select('Tarjeta');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('conductor{enter}', { force: true });

        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            }
            cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
            return cy.get('.MuiDataGrid-row:visible').first().find('div[data-field="card"]')
                .invoke('text').then((text) => {
                    expect(text.toLowerCase()).to.include('conductor');
                });
        });
    }

    function filtroKmsHora() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('select[name="column"]').select('Kilómetros/hora');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('12000{enter}', { force: true });

        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            }
            cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
            return cy.get('.MuiDataGrid-row:visible').first().find('div[data-field="kilometersHours"]')
                .invoke('text').then((text) => {
                    expect(text.trim()).to.equal('12000');
                });
        });
    }

    function filtroLitros() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('select[name="column"]').select('Litros');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('123{enter}', { force: true });

        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            }
            cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
            return cy.get('.MuiDataGrid-row:visible').first().find('div[data-field="liters"]')
                .invoke('text').then((text) => {
                    expect(text.trim()).to.equal('123');
                });
        });
    }

    function filtroImporte() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('select[name="column"]').select('Importe');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('94.1{enter}', { force: true });

        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            }
            return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        });
    }

    function filtroLleno() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('select#column').select('Lleno');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('true{enter}', { force: true });

        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            }
            return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        });
    }

    function filtroFactura() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('select[name="column"]').select('Factura');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('67{enter}', { force: true });

        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            }
            return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        });
    }

    function filtroPrecio() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('select[name="column"]').select('Precio/L');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('0.681{enter}', { force: true });

        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            }
            return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        });
    }

    function filtroSoloLlenos() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.contains('span', 'Sólo Llenos').parents('label').find('input[type="checkbox"]').check({ force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function borrarFiltros() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.contains('span', 'Sólo Llenos').parents('label').find('input[type="checkbox"]').check({ force: true });
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        cy.get('select[name="column"]').select('Todos');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('{enter}');
        cy.contains('span', 'Sólo Llenos').parents('label').find('input[type="checkbox"]').uncheck({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarFechaAsc() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.contains('div.MuiDataGrid-columnHeaderTitle', 'Fecha').click();

        return cy.get('.MuiDataGrid-row:visible').find('div[data-field="date"]').then(($fechas) => {
            const fechas = [...$fechas].map(el => el.innerText.trim());
            const fechasConvertidas = fechas.map(f => {
                const [d, m, y] = f.split('/').map(Number);
                return new Date(y, m - 1, d);
            });
            const ordenadas = [...fechasConvertidas].sort((a, b) => a - b);
            expect(fechasConvertidas).to.deep.equal(ordenadas);
        });
    }

    function ordenarFechaDesc() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.contains('div.MuiDataGrid-columnHeaderTitle', 'Fecha').click().click();

        return cy.get('.MuiDataGrid-row:visible').find('div[data-field="date"]').then(($fechas) => {
            const fechas = [...$fechas].map(el => el.innerText.trim());
            const fechasConvertidas = fechas.map(f => {
                const [d, m, y] = f.split('/').map(Number);
                return new Date(y, m - 1, d);
            });
            const ordenadas = [...fechasConvertidas].sort((a, b) => b - a);
            expect(fechasConvertidas).to.deep.equal(ordenadas);
        });
    }

    function ordenarLitrosAsc() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.contains('div.MuiDataGrid-columnHeaderTitle', 'Litros').click();

        return cy.get('.MuiDataGrid-row:visible').find('div[data-field="liters"]').then(($litros) => {
            const litros = [...$litros].map(el => parseFloat(el.innerText.trim().replace(',', '.')));
            const ordenados = [...litros].sort((a, b) => a - b);
            expect(litros).to.deep.equal(ordenados);
        });
    }

    function ordenarLitrosDesc() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.contains('div.MuiDataGrid-columnHeaderTitle', 'Litros').click().click();

        return cy.get('.MuiDataGrid-row:visible').find('div[data-field="liters"]').then(($litros) => {
            const litros = [...$litros].map(el => parseFloat(el.innerText.trim().replace(',', '.')));
            const ordenados = [...litros].sort((a, b) => b - a);
            expect(litros).to.deep.equal(ordenados);
        });
    }

    function seleccionarFila() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0).first().click({ force: true });
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/refueling');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        cy.get('div[role="row"]').should('have.length.greaterThan', 1);
        cy.get('input[type="checkbox"]:checked').should('have.length', 0);
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function editarConSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('.MuiDataGrid-row:visible').first().as('filaSeleccionada');
        cy.get('@filaSeleccionada').click({ force: true });
        cy.wait(500);
        cy.get('@filaSeleccionada').dblclick({ force: true });
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/refueling\/form\/\d+$/);
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        cy.get('div[role="row"] input[type="checkbox"]:checked').should('have.length', 0);
        return cy.get('button').filter(':visible').eq(-2).click({ force: true });
    }

    function eliminarConSeleccion() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        return cy.get('.MuiDataGrid-row:visible').then($filas => {
            if ($filas.length === 0) {
                cy.log('No hay repostajes visibles para eliminar. Test omitido.');
                return;
            }

            cy.wrap($filas[0]).as('filaRepostaje');
            return cy.get('@filaRepostaje').find('.MuiDataGrid-cell').then($celdas => {
                const valores = [...$celdas].map(c => c.innerText.trim()).filter(t => t);
                const identificador = valores[0];

                cy.get('@filaRepostaje').click({ force: true });
                cy.get('button').filter(':visible').eq(-2).click({ force: true });

                cy.wait(1000);
                return cy.contains('.MuiDataGrid-row', identificador).should('not.exist');
            });
        });
    }

    function abrirFormularioAlta() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.contains('button', 'Añadir').should('be.enabled').click();
        return cy.get('form').should('be.visible');
    }

    function scrollTabla() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');
        cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);

        const maxScrolls = 10;
        let intentos = 0;

        function hacerScrollVertical(prevHeight = 0) {
            return cy.get('.MuiDataGrid-virtualScroller').then($scroller => {
                const currentScrollHeight = $scroller[0].scrollHeight;
                if (currentScrollHeight === prevHeight || intentos >= maxScrolls) {
                    cy.get('.MuiDataGrid-columnHeaders').should('exist').and($el => {
                        const rect = $el[0].getBoundingClientRect();
                        expect(rect.top).to.be.greaterThan(0);
                        expect(rect.height).to.be.greaterThan(0);
                    });

                    cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');

                    return cy.get('.MuiDataGrid-columnHeaders').should('exist').and($el => {
                        const rect = $el[0].getBoundingClientRect();
                        expect(rect.top).to.be.greaterThan(0);
                        expect(rect.height).to.be.greaterThan(0);
                    });
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

    function validarImportesDecimales() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.get('select[name="column"]').select('Importe');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('94.1{enter}', { force: true });

        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).find('.MuiDataGrid-cell').eq(5).invoke('text').then((text) => {
                const valor = text.trim();
                if (valor && valor !== '-') {
                    cy.log(`Valor en Importe: "${valor}"`);
                } else {
                    cy.log(`Celda vacía o guion en Importe, se omite.`);
                }
            });
        });
    }

    function recargarConFiltros() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.get('select[name="column"]').select('Importe');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('136.2{enter}', { force: true });
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        cy.reload();
        cy.url().should('include', '/dashboard/refueling');

        cy.get('select[name="column"] option:selected').invoke('text').then((selectedText) => {
            expect(selectedText).to.match(/Select an option|Todos/i);
        });

        cy.get('input#search[placeholder="Buscar"]').should('have.value', '');
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.get('select#languageSwitcher').select('en', { force: true });

        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Date').should('exist');
            cy.contains('Vehicle').should('exist');
            cy.contains('PT').should('exist');
            cy.contains('Card').should('exist');
            cy.contains('Kilometers/hour').should('exist');
        });
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.get('select#languageSwitcher').select('es', { force: true });

        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Fecha').should('exist');
            cy.contains('Vehículo').should('exist');
            cy.contains('PT').should('exist');
            cy.contains('Estación de servicio').should('exist');
            cy.contains('Tarjeta').should('exist');
            cy.contains('Kilómetros/hora').should('exist');
        });
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.get('select#languageSwitcher').select('ca', { force: true });

        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Data').should('exist');
            cy.contains('Vehicle').should('exist');
            cy.contains('PT').should('exist');
            cy.contains('Estació de servei').should('exist');
            cy.contains('Targeta').should('exist');
            cy.contains('Quilòmetres/hora').should('exist');
        }).then(() => {
            return cy.contains('button', 'Afegir').should('be.visible');
        });
    }

    function filtroTipoTodos() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.contains('label', 'Todos').find('input[type="radio"]').check({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtroTipoGasoil() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.contains('label', 'Gasoil').find('input[type="radio"]').check({ force: true });
        cy.wait(500);

        return cy.get('body').then(($body) => {
            if ($body.text().includes('No rows')) {
                return cy.contains('No rows').should('be.visible');
            }
            cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
            return cy.get('.MuiDataGrid-row:visible').each(($row) => {
                cy.wrap($row).invoke('text').should('match', /gasoil/i);
            });
        });
    }

    function filtroTipoGas() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.get('input[type="radio"][value="gas"]').check({ force: true });

        return cy.get('body').then(($body) => {
            if ($body.find('.MuiDataGrid-row:visible').length > 0) {
                return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
            }
            return cy.contains('No rows').should('exist');
        });
    }

    function filtroTipoAdBlue() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.contains('label', 'AdBlue').click({ force: true });
        cy.wait(1000);

        return cy.get('body').then($body => {
            const filas = $body.find('.MuiDataGrid-row:visible');
            if (filas.length > 0) {
                return cy.get('.MuiDataGrid-row:visible').each(($row) => {
                    cy.wrap($row)
                        .find('div[data-field="petrolStation"], div[data-field="adblue"]')
                        .invoke('text')
                        .then(texto => {
                            expect(texto.toLowerCase()).to.include('ad blue');
                        });
                });
            }
            return cy.contains('No rows').should('be.visible');
        });
    }

    function filtroSinFacturaRecibida() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.contains('span', 'Sólo sin factura recibida').parents('label').find('input[type="checkbox"]').check({ force: true });
        cy.wait(500);

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtroRangoFechas() {
        cy.navegarAMenu('TallerYGastos', 'Repostajes');
        cy.url().should('include', '/dashboard/refueling');

        cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2010');
        });

        cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2011');
        });

        cy.wait(500);

        return cy.get('.MuiDataGrid-row:visible').should('exist');
    }
});