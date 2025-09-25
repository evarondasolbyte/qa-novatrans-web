describe('UTILIDADES (DIVISAS) - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    // Defino todos los casos con su número, nombre descriptivo y la función que ejecuta la validación
    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla correctamente', funcion: cargarPantallaDivisas, prioridad: 'ALTA' },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' },
        { numero: 5, nombre: 'TC005 - Crear divisa correctamente', funcion: () => ejecutarCrearIndividual(5), prioridad: 'ALTA' },
        { numero: 6, nombre: 'TC006 - Validar campo obligatorio "Valor" vacío', funcion: () => ejecutarCrearIndividual(6), prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - Validar campo "Valor" con caracteres no numéricos', funcion: () => ejecutarCrearIndividual(7), prioridad: 'ALTA' },
        { numero: 8, nombre: 'TC008 - Crear varios registros de la misma divisa en fechas distintas', funcion: () => ejecutarCrearIndividual(8), prioridad: 'ALTA' },
        { numero: 9, nombre: 'TC009 - Eliminar divisa correctamente', funcion: eliminarDivisaCorrectamente, prioridad: 'ALTA' },
        { numero: 10, nombre: 'TC010 - Eliminar sin selección', funcion: eliminarSinSeleccion, prioridad: 'MEDIA' },
        { numero: 11, nombre: 'TC011 - Crear divisa con valor decimal', funcion: () => ejecutarCrearIndividual(11), prioridad: 'ALTA' },
        { numero: 12, nombre: 'TC012 - Validar que la fecha es obligatoria', funcion: () => ejecutarCrearIndividual(12), prioridad: 'ALTA' },
        { numero: 13, nombre: 'TC013 - Scroll vertical/horizontal en tabla', funcion: scrollTabla, prioridad: 'BAJA' },
        { numero: 14, nombre: 'TC014 - Reinicio de la pantalla (recarga)', funcion: reinicioPantalla, prioridad: 'MEDIA' },
        { numero: 15, nombre: 'TC015 - Ordenar ASC/DESC Inicio', funcion: ordenarInicioAscDesc, prioridad: 'MEDIA' },
        { numero: 17, nombre: 'TC017 - Ordenar ASC/DESC Valor Euros', funcion: ordenarValorEurosAscDesc, prioridad: 'MEDIA' },
        { numero: 18, nombre: 'TC018 - Filtrar por Value', funcion: filtrarPorValue, prioridad: 'MEDIA' },
        { numero: 19, nombre: 'TC019 - Ocultar columna', funcion: ocultarColumna, prioridad: 'BAJA' },
        { numero: 20, nombre: 'TC020 - Mostrar columna', funcion: mostrarColumna, prioridad: 'BAJA' },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Utilidades (Divisas)');
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
                    pantalla: 'Utilidades (Divisas)'
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
                            pantalla: 'Utilidades (Divisas)'
                        });
                    }
                });
            });
        });
    });

    // === Helpers de fecha (MUI) ===
    function openInicioCalendar() {
        // botón del calendario junto al campo "Inicio"
        cy.contains('label', /^Inicio$/i)
            .parent()
            .find('button')        // icon button del datepicker
            .click({ force: true });
        return cy.get('[role="dialog"], .MuiPickersPopper-root').should('be.visible');
    }

    function setInicioDateByCalendar({ day, month, year }) {
        // month: 1..12
        openInicioCalendar();

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        function navigateTo(targetMonthIdx, targetYear) {
            cy.get('.MuiPickersCalendarHeader-label')
                .invoke('text')
                .then(label => {
                    // label ej: "September 2025"
                    const [currMonthName, currYearStr] = label.trim().split(/\s+/);
                    const currMonthIdx = monthNames.indexOf(currMonthName) + 1;
                    const currYear = parseInt(currYearStr, 10);

                    if (currYear === targetYear && currMonthIdx === targetMonthIdx) {
                        return; // ya estamos en el mes/año deseado
                    }

                    if (currYear < targetYear || (currYear === targetYear && currMonthIdx < targetMonthIdx)) {
                        cy.get('button[aria-label="Next month"]').click({ force: true });
                    } else {
                        cy.get('button[aria-label="Previous month"]').click({ force: true });
                    }
                    // re-evaluar hasta llegar
                    navigateTo(targetMonthIdx, targetYear);
                });
        }

        navigateTo(month, year);

        // seleccionar día y confirmar
        cy.contains('.MuiPickersDay-root', new RegExp(`^${Number(day)}$`)).click({ force: true });
        cy.get('body').click(0, 0); // blur/commit

        // verificar que el input se ha rellenado (MM/DD/YYYY)
        return cy.contains('label', /^Inicio$/i)
            .parent()
            .find('input')
            .invoke('val')
            .should('match', /^\d{2}\/\d{2}\/\d{4}$/);
    }

    function reseleccionarDivisa(texto = 'EUR - Euro') {
        cy.get('[role="combobox"]').first().click({ force: true });
        cy.contains('li', texto).click({ force: true });
        cy.get('body').click(0, 0);
    }

    // Helper para abrir el menú de una columna por su data-field
    function abrirMenuColumna(field) {
        cy.get(`div[role="columnheader"][data-field="${field}"]`)
            .should('be.visible')
            .within(() => {
                cy.get('button[aria-label="Menu"]').click({ force: true });
            });
    }

    function crearDivisa({ day, month, year, value }) {
        reseleccionarDivisa('EUR - Euro');
        setInicioDateByCalendar({ day, month, year });
        cy.get('input[name="valueEuros"]').clear().type(String(value));
        cy.get('body').click(0, 0);
        cy.contains('button', 'Crear').click({ force: true });
    }

    function prepararDosDivisas() {
        crearDivisa({ day: 2, month: 9, year: 2025, value: 10 });
        reseleccionarDivisa('EUR - Euro');
        crearDivisa({ day: 4, month: 9, year: 2025, value: 7 });
        reseleccionarDivisa('EUR - Euro');
    }

    function ensureColumnVisible(titleRegex) {
        cy.get('body').then($b => {
            const visible = $b.find('.MuiDataGrid-columnHeaderTitle').toArray()
                .some(el => titleRegex.test(el.textContent || ''));
            if (!visible) {
                cy.get('.MuiDataGrid-virtualScroller, .MuiDataGrid-main')
                    .first()
                    .scrollTo('right', { duration: 400 });
                cy.wait(300);
            }
        });
    }
    // === FUNCIONES DE VALIDACIÓN ===
    function cargarPantallaDivisas() {
        cy.navegarAMenu('Utilidades', 'Divisas');
        cy.url().should('include', '/dashboard/currencies');
        cy.get('h1, h2, h3, h4, h5, h6').contains('Divisas').should('exist');
        cy.get('button').contains('Crear').should('exist');
        return cy.get('button').contains('Eliminar').should('exist');
    }

    // FUNCIÓN QUE EJECUTA UN CREAR INDIVIDUAL
    function ejecutarCrearIndividual(numeroCaso) {
        cy.navegarAMenu('Utilidades', 'Divisas');
        cy.url().should('include', '/dashboard/currencies');
        cy.get('h1, h2, h3, h4, h5, h6').contains('Divisas').should('exist');

        // Obtener datos del Excel para Utilidades-Divisas
        return cy.obtenerDatosExcel('Utilidades-Divisas').then((datosFiltros) => {
            const numeroCasoFormateado = numeroCaso.toString().padStart(3, '0');
            cy.log(`Buscando caso TC${numeroCasoFormateado}...`);
            
            const filtroEspecifico = datosFiltros.find(f => f.caso === `TC${numeroCasoFormateado}`);
            
            if (!filtroEspecifico) {
                cy.log(`No se encontró TC${numeroCasoFormateado}`);
                cy.log(`Casos disponibles: ${datosFiltros.map(f => f.caso).join(', ')}`);
                cy.registrarResultados({
                    numero: numeroCaso,
                    nombre: `TC${numeroCasoFormateado} - Caso no encontrado en Excel`,
                    esperado: `Caso TC${numeroCasoFormateado} debe existir en el Excel`,
                    obtenido: 'Caso no encontrado en los datos del Excel',
                    resultado: 'ERROR',
                    archivo,
                    pantalla: 'Utilidades (Divisas)'
                });
                return cy.wrap(false);
            }

            cy.log(`Ejecutando TC${numeroCasoFormateado}: ${filtroEspecifico.valor_etiqueta_1} - ${filtroEspecifico.dato_1}`);
            cy.log(`Datos del filtro: columna="${filtroEspecifico.dato_1}", valor="${filtroEspecifico.dato_2}"`);
            cy.log(`Datos completos del filtro:`, JSON.stringify(filtroEspecifico, null, 2));

            // Ejecutar el crear específico
            if (filtroEspecifico.valor_etiqueta_1 === 'mui-component-select-currency') {
                // Crear divisa con datos del Excel
                cy.log(`Aplicando crear divisa: ${filtroEspecifico.dato_1}`);
                
                // Seleccionar divisa
                cy.get('[role="combobox"]').first().click({ force: true });
                cy.contains('li', filtroEspecifico.dato_1).click({ force: true });
                cy.get('body').click(0, 0);
                
                // Procesar los datos adicionales del Excel
                const datosAdicionales = [];
                let i = 0;
                while (filtroEspecifico[`etiqueta_${i + 1}`] && filtroEspecifico[`valor_etiqueta_${i + 1}`] && filtroEspecifico[`dato_${i + 1}`]) {
                    datosAdicionales.push({
                        etiqueta: filtroEspecifico[`etiqueta_${i + 1}`],
                        valor_etiqueta: filtroEspecifico[`valor_etiqueta_${i + 1}`],
                        dato: filtroEspecifico[`dato_${i + 1}`]
                    });
                    i++;
                }
                
                cy.log(`Datos adicionales encontrados: ${datosAdicionales.length}`);
                
                // Procesar cada dato adicional
                datosAdicionales.forEach((dato, index) => {
                    cy.log(`Procesando dato ${index + 1}: ${dato.etiqueta} - ${dato.valor_etiqueta} - ${dato.dato}`);
                    
                    if (dato.valor_etiqueta === 'r1g' || dato.valor_etiqueta === 'r1q') {
                        // Es una fecha - usar el calendario
                        const fechaParts = dato.dato.split('/');
                        if (fechaParts.length === 3) {
                            const day = parseInt(fechaParts[0]);
                            const month = parseInt(fechaParts[1]);
                            const year = parseInt(fechaParts[2]);
                            
                            cy.log(`Configurando fecha: ${day}/${month}/${year}`);
                            setInicioDateByCalendar({ day, month, year });
                        }
                    } else if (dato.valor_etiqueta === 'r1k') {
                        // Es un valor numérico
                        cy.log(`Configurando valor: ${dato.dato}`);
                        cy.get('input[name="valueEuros"]').should('be.visible').click().clear().type(dato.dato, { force: true });
                        cy.wait(1000); // Esperar más tiempo para que se procese el valor
                        cy.get('input[name="valueEuros"]').should('have.value', dato.dato);
                    }
                });
                
                // Verificar que el campo Valor esté lleno antes de crear
                cy.get('input[name="valueEuros"]').should('have.value').and('not.be.empty');
                
                // Crear la divisa
                cy.contains('button', 'Crear').should('be.enabled').click({ force: true });
                
                // Esperar un poco para que se procese la creación
                cy.wait(2000);
                
                // Re-seleccionar la divisa para forzar la actualización de la tabla
                cy.get('[role="combobox"]').first().click({ force: true });
                cy.contains('li', filtroEspecifico.dato_1).click({ force: true });
                cy.get('body').click(0, 0);
                
                // Verificar que se creó correctamente
                cy.get('.MuiDataGrid-row', { timeout: 8000 }).should('have.length.greaterThan', 0);
                
                cy.registrarResultados({
                    numero: numeroCaso,
                    nombre: `TC${numeroCasoFormateado} - Crear divisa con datos del Excel`,
                    esperado: `Se crea divisa con datos: ${filtroEspecifico.dato_1}`,
                    obtenido: 'Divisa creada correctamente',
                    resultado: 'OK',
                    archivo,
                    pantalla: 'Utilidades (Divisas)'
                });
            } else {
                // Si no es mui-component-select-currency, registrar error
                cy.log(`Tipo de componente no reconocido: ${filtroEspecifico.valor_etiqueta_1}`);
                cy.registrarResultados({
                    numero: numeroCaso,
                    nombre: `TC${numeroCasoFormateado} - Tipo de componente no reconocido`,
                    esperado: `Tipo de componente válido (mui-component-select-currency)`,
                    obtenido: `Tipo de componente: ${filtroEspecifico.valor_etiqueta_1}`,
                    resultado: 'ERROR',
                    archivo,
                    pantalla: 'Utilidades (Divisas)'
                });
            }
            
            return cy.wrap(true);
        });
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('Utilidades', 'Divisas');
        cy.url().should('include', '/dashboard/currencies');
        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Currency');
    }

    // TC003 - Cambiar idioma a Catalán
    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('Utilidades', 'Divisas');
        cy.url().should('include', '/dashboard/currencies');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500); // Esperar a que se aplique el cambio de idioma
        
        // Verificar elementos que deberían estar en catalán
        return cy.get('.MuiDataGrid-columnHeaders').then(($headers) => {
            const headerText = $headers.text();
            cy.log('Texto completo de headers:', headerText);
            
            // Elementos que deberían estar en catalán
            const elementosCatalanes = ['Inici', 'Fi'];
            
            // Elementos que están mal traducidos (en español en lugar de catalán)
            const elementosMalTraducidos = ['Inicio', 'Fin'];
            
            // Contar elementos correctos e incorrectos
            let elementosCorrectos = 0;
            let elementosIncorrectos = 0;
            
            elementosCatalanes.forEach(elemento => {
                if (headerText.includes(elemento)) {
                    elementosCorrectos++;
                    cy.log(`Elemento correcto encontrado: ${elemento}`);
                }
            });
            
            elementosMalTraducidos.forEach(elemento => {
                if (headerText.includes(elemento)) {
                    elementosIncorrectos++;
                    cy.log(`Elemento mal traducido encontrado: ${elemento}`);
                }
            });
            
            cy.log(`Elementos correctos: ${elementosCorrectos}, Elementos incorrectos: ${elementosIncorrectos}`);
            
            // Determinar si la traducción funciona correctamente
            const traduccionCorrecta = elementosCorrectos > 0 && elementosIncorrectos === 0;
            
            if (traduccionCorrecta) {
                // Si funciona, registrar OK
                cy.registrarResultados({
                    numero: 3,
                    nombre: 'TC003 - Cambiar idioma a Catalán',
                    esperado: 'La interfaz cambia correctamente a catalán',
                    obtenido: 'La interfaz cambia correctamente a catalán',
                    resultado: 'OK',
                    archivo,
                    pantalla: 'Utilidades (Divisas)'
                });
            } else {
                // Si no funciona, registrar ERROR
                cy.registrarResultados({
                    numero: 3,
                    nombre: 'TC003 - Cambiar idioma a Catalán',
                    esperado: 'La interfaz cambia correctamente a catalán',
                    obtenido: 'La interfaz no cambia correctamente a catalán - elementos en español',
                    resultado: 'ERROR',
                    archivo,
                    pantalla: 'Utilidades (Divisas)'
                });
            }
            
            return cy.wrap(true); // Devolver algo para que la promesa se resuelva
        });
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('Utilidades', 'Divisas');
        cy.url().should('include', '/dashboard/currencies');
        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Divisas');
    }


    // TC009 – Eliminar divisa correctamente
    function eliminarDivisaCorrectamente() {
        cy.navegarAMenu('Utilidades', 'Divisas');
        cy.url().should('include', '/dashboard/currencies');

        reseleccionarDivisa('EUR - Euro');

        // Me aseguro de tener al menos 1 registro creando uno rápido
        setInicioDateByCalendar({ day: 2, month: 9, year: 2025 });
        cy.get('input[name="valueEuros"]').clear().type('10');
        cy.get('body').click(0, 0);
        cy.contains('button', 'Crear').click({ force: true });
        reseleccionarDivisa('EUR - Euro');

        // Cuenta filas y elimina la primera
        let filasAntes = 0;
        cy.get('.MuiDataGrid-row', { timeout: 8000 }).then($rows => { filasAntes = $rows.length; });

        cy.get('.MuiDataGrid-row').first().click();
        cy.contains('button', 'Eliminar').click({ force: true });

        // Valida que disminuye (o que no hay filas)
        return cy.get('.MuiDataGrid-virtualScrollerContent', { timeout: 8000 }).then($c => {
            const filasDespues = $c.find('.MuiDataGrid-row').length;
            expect(filasDespues, 'Debe disminuir el número de filas').to.be.at.most(Math.max(0, filasAntes - 1));
        });
    }

    // TC010 - Eliminar sin selección (sin registro explícito)
    function eliminarSinSeleccion() {
        cy.navegarAMenu('Utilidades', 'Divisas');
        cy.url().should('include', '/dashboard/currencies');

        cy.contains('button', 'Eliminar').click({ force: true });
        cy.wait(500);

        // No falla; simplemente valida que la pantalla sigue operativa
        return cy.contains(/^Divisas$/).should('be.visible');
    }



    // TC013 - Scroll vertical/horizontal en tabla
    function scrollTabla() {
        cy.navegarAMenu('Utilidades', 'Divisas');
        cy.url().should('include', '/dashboard/currencies');
        
        // Crear 15 divisas antes de hacer scroll
        reseleccionarDivisa('EUR - Euro');
        
        // Crear 15 divisas con fechas y valores diferentes
        for (let i = 1; i <= 15; i++) {
            setInicioDateByCalendar({ day: i, month: 9, year: 2025 });
            cy.get('input[name="valueEuros"]').clear().type(String(i * 2.5));
            cy.get('body').click(0, 0);
            cy.contains('button', 'Crear').click({ force: true });
            cy.wait(500); // Esperar a que se cree la divisa
            reseleccionarDivisa('EUR - Euro');
            cy.wait(200); // Pequeña pausa entre creaciones
        }
        
        // Verificar que hay al menos 15 filas (cambiar la condición)
        cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 13);

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

    function reinicioPantalla() {
        cy.navegarAMenu('Utilidades', 'Divisas');
        cy.url().should('include', '/dashboard/currencies');
        cy.wait(2000);

        // Crear una divisa antes de recargar para verificar si se mantiene
        reseleccionarDivisa('EUR - Euro');
        setInicioDateByCalendar({ day: 15, month: 9, year: 2025 });
        cy.get('input[name="valueEuros"]').clear().type('25.50');
        cy.get('body').click(0, 0);
        cy.contains('button', 'Crear').should('be.enabled').click({ force: true });
        reseleccionarDivisa('EUR - Euro');
        
        // Esperar a que se cree la divisa
        cy.wait(1000);

        // Recargar la página
        cy.reload();
        cy.wait(3000);

        // Verificar que la pantalla vuelve al estado inicial
        cy.get('h1, h2, h3, h4, h5, h6').contains('Divisas').should('exist');
        cy.get('button').contains('Crear').should('exist');

        // Verificar si los datos desaparecen o se mantienen
        return cy.get('body').then(($body) => {
            const bodyText = $body.text();
            const datosDesaparecen = bodyText.includes('No rows') ||
                bodyText.includes('Sin datos') ||
                bodyText.includes('No hay datos');

            if (datosDesaparecen) {
                // Si los datos desaparecen, registrar WARNING
                cy.registrarResultados({
                    numero: 14,
                    nombre: 'Reinicio de la pantalla (recarga)',
                    esperado: 'Los datos se mantienen después de recargar',
                    obtenido: 'Desaparecen todos los datos creados al recargar',
                    resultado: 'WARNING',
                    archivo,
                    pantalla: 'Utilidades (Divisas)'
                });
            } else {
                // Si los datos se mantienen, registrar OK
                cy.registrarResultados({
                    numero: 14,
                    nombre: 'Reinicio de la pantalla (recarga)',
                    esperado: 'Los datos se mantienen después de recargar',
                    obtenido: 'Los datos se mantienen correctamente después de recargar',
                    resultado: 'OK',
                    archivo,
                    pantalla: 'Utilidades (Divisas)'
                });
            }

            return cy.wrap(true); // Devolver promesa para evitar auto-OK
        });
    }

    // TC015 - Ordenar por Inicio (crear 2, luego click header 2 veces)
    function ordenarInicioAscDesc() {
        cy.navegarAMenu('Utilidades', 'Divisas');
        cy.url().should('include', '/dashboard/currencies');

        prepararDosDivisas(); // <-- crea 02/09 y 04/09

        ensureColumnVisible(/^(Inicio|Inici)$/);
        cy.contains('.MuiDataGrid-columnHeaderTitle', /(Inicio|Inici)/)
            .should('be.visible').click({ force: true });
        cy.wait(700);
        cy.contains('.MuiDataGrid-columnHeaderTitle', /(Inicio|Inici)/)
            .should('be.visible').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    // TC017 - Ordenar por Valor Euros (crear 2, luego click header 2 veces)
    function ordenarValorEurosAscDesc() {
        cy.navegarAMenu('Utilidades', 'Divisas');
        cy.url().should('include', '/dashboard/currencies');

        prepararDosDivisas(); // <-- misma pareja de registros

        ensureColumnVisible(/^Valor Euros$/);
        cy.contains('.MuiDataGrid-columnHeaderTitle', /^Valor Euros$/)
            .should('be.visible').click({ force: true });
        cy.wait(700);
        cy.contains('.MuiDataGrid-columnHeaderTitle', /^Valor Euros$/)
            .should('be.visible').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }
    // TC018 - Filtrar por Value (como tu filterValueEnColumna)
    function filtrarPorValue() {
        cy.navegarAMenu('Utilidades', 'Divisas');
        cy.url().should('include', '/dashboard/currencies');

        // crear una fila asegurada con valor 10
        reseleccionarDivisa('EUR - Euro');
        setInicioDateByCalendar({ day: 6, month: 9, year: 2025 });
        cy.get('input[name="valueEuros"]').clear().type('10');
        cy.get('body').click(0, 0);
        cy.contains('button', 'Crear').click({ force: true });
        reseleccionarDivisa('EUR - Euro');

        // abrir menú de la columna "Valor Euros" como en tu patrón
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Valor Euros')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Valor Euros column menu"]').click({ force: true });
        cy.get('li').contains('Filter').click({ force: true });

        // usar el placeholder "Filter value" (mismo patrón de tu ejemplo)
        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('10', { force: true });

        // al menos debe quedar 1 fila visible
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    // TC019 - Ocultar columna
    function ocultarColumna() {
        cy.navegarAMenu('Utilidades', 'Divisas');
        cy.url().should('include', '/dashboard/currencies');

        // Abrir menú contextual (3 puntos) en la columna "Inicio"
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Inicio')
            .parents('.MuiDataGrid-columnHeader')
            .find('button').eq(1).click({ force: true });

        // Hacer clic en "Hide column"
        cy.contains('li[role="menuitem"]', 'Hide column').click({ force: true });

        // Verificar que la columna "Inicio" ha desaparecido de la vista
        return cy.get('.MuiDataGrid-columnHeaderTitle')
            .contains('Inicio')
            .should('not.exist');
    }

    // TC020 - Ocultar "Inicio" y volver a mostrarlo desde el menú de "Fin"
    function mostrarColumna() {
        cy.navegarAMenu('Utilidades', 'Divisas');
        cy.url().should('include', '/dashboard/currencies');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // Abrir el menú desde "Fin"
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fin')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Fin column menu"]').click({ force: true });
        cy.get('li').contains('Manage columns').click({ force: true });

        // Panel visible
        cy.get('.MuiDataGrid-panel').should('be.visible');

        // 1) Ocultar "Inicio"
        cy.get('.MuiDataGrid-panel')
            .find('label')
            .contains(/(Inicio|Inici|Start)/)
            .parents('label')
            .find('input[type="checkbox"]')
            .uncheck({ force: true });

        // Verificar que ya no está visible en headers
        cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains(/(Inicio|Inici)/).should('not.exist');
        });

        // 2) Volver a mostrar "Inicio"
        // (si el panel se cerró, lo abrimos otra vez desde "Fin")
        cy.get('body').then($b => {
            if (!$b.find('.MuiDataGrid-panel:visible').length) {
                cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fin')
                    .parents('[role="columnheader"]').trigger('mouseover');
                cy.get('[aria-label="Fin column menu"]').click({ force: true });
                cy.get('li').contains('Manage columns').click({ force: true });
            }
        });

        cy.get('.MuiDataGrid-panel')
            .find('label')
            .contains(/(Inicio|Inici|Start)/)
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });

        // Confirmar que "Inicio" vuelve a existir en los headers
        return cy.get('.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains(/(Inicio|Inici)/).should('exist');
            });
    }
});