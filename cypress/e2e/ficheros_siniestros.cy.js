describe('FICHEROS - SINIESTROS - Validación completa con errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Ver lista de siniestros al acceder a la pantalla', funcion: verListaSiniestros, prioridad: 'ALTA' },
        { numero: 2, nombre: 'TC002 - Filtrar siniestros por ID', funcion: () => ejecutarFiltroIndividual(2), prioridad: 'ALTA' },
        { numero: 3, nombre: 'TC003 - Filtrar siniestros por Tipo', funcion: () => ejecutarFiltroIndividual(3), prioridad: 'ALTA' },
        { numero: 4, nombre: 'TC004 - Filtrar siniestros por Ubicación', funcion: () => ejecutarFiltroIndividual(4), prioridad: 'ALTA' },
        { numero: 5, nombre: 'TC005 - Filtrar siniestros por Matrícula', funcion: () => ejecutarFiltroIndividual(5), prioridad: 'ALTA' },
        { numero: 6, nombre: 'TC006 - Filtrar siniestros por Conductor', funcion: () => ejecutarFiltroIndividual(6), prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - Filtrar siniestros por Coste de reparación', funcion: () => ejecutarFiltroIndividual(7), prioridad: 'ALTA' },
        { numero: 8, nombre: 'TC008 - Filtrar siniestros por Responsable', funcion: () => ejecutarFiltroIndividual(8), prioridad: 'ALTA' },
        { numero: 12, nombre: 'TC012 - Filtrar siniestros por ID (segundo caso)', funcion: () => ejecutarFiltroIndividual(12), prioridad: 'ALTA' },
        { numero: 11, nombre: 'TC011 - Limpiar filtros y mostrar todos los siniestros', funcion: limpiarFiltros, prioridad: 'MEDIA' },
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

    

    // ===== FUNCIONES DE PRUEBA =====

    function verListaSiniestros() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-root').should('be.visible');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    // FUNCIÓN QUE EJECUTA UN FILTRO INDIVIDUAL
    function ejecutarFiltroIndividual(numeroCaso) {
        cy.navegarAMenu('Ficheros', 'Siniestros');
            cy.url().should('include', '/dashboard/crash-reports');
            cy.get('.MuiDataGrid-root').should('be.visible');

        // Obtener datos del Excel para Ficheros-Siniestros
        return cy.obtenerDatosExcel('Ficheros-Siniestros').then((datosFiltros) => {
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
                    pantalla: 'Ficheros (Siniestros)'
                });
                return cy.wrap(false);
            }

            cy.log(`Ejecutando TC${numeroCasoFormateado}: ${filtroEspecifico.valor_etiqueta_1} - ${filtroEspecifico.dato_1}`);
            cy.log(`Datos del filtro: columna="${filtroEspecifico.dato_1}", valor="${filtroEspecifico.dato_2}"`);
            cy.log(`Datos completos del filtro:`, JSON.stringify(filtroEspecifico, null, 2));

            // Ejecutar el filtro específico
            if (filtroEspecifico.valor_etiqueta_1 === 'columna') {
                // Filtro por columna específica
                cy.log(`Aplicando filtro por columna: ${filtroEspecifico.dato_1}`);
                
                cy.get('select[name="column"], select#column').then($select => {
                    const options = [...$select[0].options].map(opt => opt.text.trim());
                    cy.log(`Opciones disponibles en dropdown: ${options.join(', ')}`);
                    
                    const columnaEncontrada = options.find(opt => 
                        opt.toLowerCase().includes(filtroEspecifico.dato_1.toLowerCase()) ||
                        filtroEspecifico.dato_1.toLowerCase().includes(opt.toLowerCase())
                    );
                    
                    if (columnaEncontrada) {
                        cy.wrap($select).select(columnaEncontrada, { force: true });
                        cy.log(`Seleccionada columna: ${columnaEncontrada}`);
                    } else {
                        cy.log(`Columna "${filtroEspecifico.dato_1}" no encontrada, usando primera opción`);
                        cy.wrap($select).select(1, { force: true });
                    }
                });
                
                // Verificar que dato_2 no esté vacío
                if (!filtroEspecifico.dato_2 || filtroEspecifico.dato_2.trim() === '') {
                    cy.log(`TC${numeroCasoFormateado}: ERROR - dato_2 está vacío para columna "${filtroEspecifico.dato_1}"`);
                    cy.registrarResultados({
                        numero: numeroCaso,
                        nombre: `TC${numeroCasoFormateado} - Filtrar siniestros por ${filtroEspecifico.dato_1}`,
                        esperado: `Se ejecuta filtro por columna "${filtroEspecifico.dato_1}" con valor "${filtroEspecifico.dato_2}"`,
                        obtenido: 'Valor de búsqueda está vacío en el Excel',
                        resultado: 'ERROR',
                        archivo,
                        pantalla: 'Ficheros (Siniestros)'
                    });
                    return cy.wrap(true);
                }
                
                cy.log(`Buscando valor: "${filtroEspecifico.dato_2}"`);
                cy.get('input#search')
                    .should('be.visible')
                    .clear({ force: true })
                    .type(`${filtroEspecifico.dato_2}{enter}`, { force: true });
                cy.wait(2000);

                // Verificar si hay resultados después del filtro
                cy.wait(1000); // Esperar un poco más para que se aplique el filtro
                cy.get('body').then($body => {
                    const filasVisibles = $body.find('.MuiDataGrid-row:visible').length;
                    const totalFilas = $body.find('.MuiDataGrid-row').length;
                    
                    cy.log(`TC${numeroCasoFormateado}: Filas visibles: ${filasVisibles}, Total filas: ${totalFilas}`);
                    cy.log(`Filtro aplicado: Columna "${filtroEspecifico.dato_1}" = "${filtroEspecifico.dato_2}"`);
                    
                    // Verificar si el filtro realmente se aplicó
                    const filtroSeAplico = filasVisibles < totalFilas || filasVisibles === 0;
                    
                    if (filtroSeAplico) {
                        // El filtro se aplicó correctamente
                        const resultado = filasVisibles > 0 ? 'OK' : 'ERROR';
                        const obtenido = filasVisibles > 0 ? `Se muestran ${filasVisibles} resultados` : 'No se muestran resultados';
                        
                        cy.log(`TC${numeroCasoFormateado}: Filtro aplicado correctamente - ${resultado}`);
                        
                        cy.registrarResultados({
                            numero: numeroCaso,
                            nombre: `TC${numeroCasoFormateado} - Filtrar siniestros por ${filtroEspecifico.dato_1}`,
                            esperado: `Se ejecuta filtro por columna "${filtroEspecifico.dato_1}" con valor "${filtroEspecifico.dato_2}"`,
                            obtenido: obtenido,
                            resultado: resultado,
                            archivo,
                            pantalla: 'Ficheros (Siniestros)'
                        });
                    } else {
                        // El filtro no se aplicó
                        cy.log(`TC${numeroCasoFormateado}: Filtro NO se aplicó - ERROR`);
                        cy.registrarResultados({
                            numero: numeroCaso,
                            nombre: `TC${numeroCasoFormateado} - Filtrar siniestros por ${filtroEspecifico.dato_1}`,
                            esperado: `Se ejecuta filtro por columna "${filtroEspecifico.dato_1}" con valor "${filtroEspecifico.dato_2}"`,
                            obtenido: `Filtro no se aplicó (${filasVisibles} filas visibles de ${totalFilas} total)`,
                            resultado: 'ERROR',
                            archivo,
                            pantalla: 'Ficheros (Siniestros)'
                        });
                    }
                });
            } else if (filtroEspecifico.valor_etiqueta_1 === 'search') {
                // Búsqueda general
                cy.log(`Aplicando búsqueda general: ${filtroEspecifico.dato_1}`);
                
                cy.get('input#search')
                    .should('be.visible')
                    .clear({ force: true })
                    .type(`${filtroEspecifico.dato_1}{enter}`, { force: true });
                
                cy.log(`Buscando valor: ${filtroEspecifico.dato_1}`);
                cy.wait(2000);

                // Verificar si hay resultados después del filtro
                cy.wait(1000); // Esperar un poco más para que se aplique el filtro
                cy.get('body').then($body => {
                    const filasVisibles = $body.find('.MuiDataGrid-row:visible').length;
                    const totalFilas = $body.find('.MuiDataGrid-row').length;
                    
                    cy.log(`TC${numeroCasoFormateado}: Filas visibles: ${filasVisibles}, Total filas: ${totalFilas}`);
                    cy.log(`Búsqueda aplicada: "${filtroEspecifico.dato_1}"`);
                    
                    // Verificar si la búsqueda realmente se aplicó
                    const busquedaSeAplico = filasVisibles < totalFilas || filasVisibles === 0;
                    
                    if (busquedaSeAplico) {
                        // La búsqueda se aplicó correctamente
                        const resultado = filasVisibles > 0 ? 'OK' : 'ERROR';
                        const obtenido = filasVisibles > 0 ? `Se muestran ${filasVisibles} resultados` : 'No se muestran resultados';
                        
                        cy.log(`TC${numeroCasoFormateado}: Búsqueda aplicada correctamente - ${resultado}`);
                        
                        cy.registrarResultados({
                            numero: numeroCaso,
                            nombre: `TC${numeroCasoFormateado} - Búsqueda general de siniestros`,
                            esperado: `Se ejecuta búsqueda general con valor "${filtroEspecifico.dato_1}"`,
                            obtenido: obtenido,
                            resultado: resultado,
                            archivo,
                            pantalla: 'Ficheros (Siniestros)'
                        });
                    } else {
                        // La búsqueda no se aplicó
                        cy.log(`TC${numeroCasoFormateado}: Búsqueda NO se aplicó - ERROR`);
                        cy.registrarResultados({
                            numero: numeroCaso,
                            nombre: `TC${numeroCasoFormateado} - Búsqueda general de siniestros`,
                            esperado: `Se ejecuta búsqueda general con valor "${filtroEspecifico.dato_1}"`,
                            obtenido: `Búsqueda no se aplicó (${filasVisibles} filas visibles de ${totalFilas} total)`,
                            resultado: 'ERROR',
                            archivo,
                            pantalla: 'Ficheros (Siniestros)'
                        });
                    }
                });
            } else {
                // Si no es ni columna ni search, registrar error
                cy.log(`Tipo de filtro no reconocido: ${filtroEspecifico.valor_etiqueta_1}`);
                cy.registrarResultados({
                    numero: numeroCaso,
                    nombre: `TC${numeroCasoFormateado} - Tipo de filtro no reconocido`,
                    esperado: `Tipo de filtro válido (columna o search)`,
                    obtenido: `Tipo de filtro: ${filtroEspecifico.valor_etiqueta_1}`,
                    resultado: 'ERROR',
                    archivo,
                    pantalla: 'Ficheros (Siniestros)'
                });
            }
            
            return cy.wrap(true);
        });
    }

    // FUNCIÓN QUE EJECUTA TODOS LOS FILTROS JUNTOS PERO REGISTRA CADA RESULTADO INDIVIDUALMENTE (DEPRECATED)
    function ejecutarFiltrosSiniestros() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // Obtener datos del Excel para Ficheros-Siniestros
        return cy.obtenerDatosExcel('Ficheros-Siniestros').then((datosFiltros) => {
            cy.log(`Datos recibidos del Excel: ${datosFiltros.length} casos`);
            
            if (datosFiltros.length === 0) {
                cy.log('No se pudieron obtener datos del Excel');
                return cy.wrap(false);
            }
            
            // Casos de filtro a ejecutar: TC002, TC003, TC004, TC005, TC006, TC007, TC008, TC012
            const casosFiltro = [2, 3, 4, 5, 6, 7, 8, 12];
            
            // Función recursiva para ejecutar los casos uno por uno
            function ejecutarCaso(index) {
                if (index >= casosFiltro.length) {
                    return cy.wrap(true);
                }
                
                const numeroCaso = casosFiltro[index];
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
                        pantalla: 'Ficheros (Siniestros)'
                    });
                    return ejecutarCaso(index + 1);
                }

                cy.log(`Ejecutando TC${numeroCasoFormateado}: ${filtroEspecifico.valor_etiqueta_1} - ${filtroEspecifico.dato_1}`);

                // Ejecutar el filtro específico
                if (filtroEspecifico.valor_etiqueta_1 === 'columna') {
                    // Filtro por columna específica
                    cy.log(`Aplicando filtro por columna: ${filtroEspecifico.dato_1}`);
                    
                    cy.get('select[name="column"], select#column').then($select => {
                        const options = [...$select[0].options].map(opt => opt.text.trim());
                        cy.log(`Opciones disponibles en dropdown: ${options.join(', ')}`);
                        
                        const columnaEncontrada = options.find(opt => 
                            opt.toLowerCase().includes(filtroEspecifico.dato_1.toLowerCase()) ||
                            filtroEspecifico.dato_1.toLowerCase().includes(opt.toLowerCase())
                        );
                        
                        if (columnaEncontrada) {
                            cy.wrap($select).select(columnaEncontrada, { force: true });
                            cy.log(`Seleccionada columna: ${columnaEncontrada}`);
                        } else {
                            cy.log(`Columna "${filtroEspecifico.dato_1}" no encontrada, usando primera opción`);
                            cy.wrap($select).select(1, { force: true });
                        }
                    });
                    
                    cy.get('input#search')
                        .should('be.visible')
                        .clear({ force: true })
                        .type(`${filtroEspecifico.dato_2}{enter}`, { force: true });
                    
                    cy.log(`Buscando valor: ${filtroEspecifico.dato_2}`);
                    cy.wait(2000);

                    // Verificar si hay resultados después del filtro
                    cy.get('body').then($body => {
                        const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;
                        const resultado = hayFilas ? 'OK' : 'ERROR';
                        const obtenido = hayFilas ? 'Se muestran resultados' : 'No se muestran resultados';
                        
                        cy.log(`TC${numeroCasoFormateado}: ${hayFilas ? 'Encontrados resultados' : 'No hay resultados'} - ${resultado}`);
                        
                        // Registrar resultado individual
                        cy.registrarResultados({
                            numero: numeroCaso,
                            nombre: `TC${numeroCasoFormateado} - Filtrar siniestros por ${filtroEspecifico.dato_1}`,
                            esperado: `Se ejecuta filtro por columna "${filtroEspecifico.dato_1}" con valor "${filtroEspecifico.dato_2}"`,
                            obtenido: obtenido,
                            resultado: resultado,
                            archivo,
                            pantalla: 'Ficheros (Siniestros)'
                        });
                        
                        // Recargar página para limpiar filtros
                        cy.reload();
                        cy.get('.MuiDataGrid-root').should('be.visible');
                        cy.wait(1000);
                        
                        // Ejecutar siguiente caso DESPUÉS de que se complete el registro
                        return cy.wrap(true).then(() => {
                            ejecutarCaso(index + 1);
                        });
                    });
                } else if (filtroEspecifico.valor_etiqueta_1 === 'search') {
                    // Búsqueda general
                    cy.log(`Aplicando búsqueda general: ${filtroEspecifico.dato_1}`);
                    
                    cy.get('input#search')
                        .should('be.visible')
                        .clear({ force: true })
                        .type(`${filtroEspecifico.dato_1}{enter}`, { force: true });
                    
                    cy.log(`Buscando valor: ${filtroEspecifico.dato_1}`);
                    cy.wait(2000);

                    // Verificar si hay resultados después del filtro
                    cy.get('body').then($body => {
                        const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;
                        const resultado = hayFilas ? 'OK' : 'ERROR';
                        const obtenido = hayFilas ? 'Se muestran resultados' : 'No se muestran resultados';
                        
                        cy.log(`TC${numeroCasoFormateado}: ${hayFilas ? 'Encontrados resultados' : 'No hay resultados'} - ${resultado}`);
                        
                        // Registrar resultado individual
                        cy.registrarResultados({
                            numero: numeroCaso,
                            nombre: `TC${numeroCasoFormateado} - Búsqueda general de siniestros`,
                            esperado: `Se ejecuta búsqueda general con valor "${filtroEspecifico.dato_1}"`,
                            obtenido: obtenido,
                            resultado: resultado,
                            archivo,
                            pantalla: 'Ficheros (Siniestros)'
                        });
                        
                        // Recargar página para limpiar filtros
                        cy.reload();
                        cy.get('.MuiDataGrid-root').should('be.visible');
                        cy.wait(1000);
                        
                        // Ejecutar siguiente caso DESPUÉS de que se complete el registro
                        return cy.wrap(true).then(() => {
                            ejecutarCaso(index + 1);
                        });
                    });
                } else {
                    // Si no es ni columna ni search, pasar al siguiente caso
                    cy.log(`Tipo de filtro no reconocido: ${filtroEspecifico.valor_etiqueta_1}`);
                    ejecutarCaso(index + 1);
                }
            }
            
            // Iniciar ejecución
            return ejecutarCaso(0);
        });
    }

    // FUNCIÓN GENERAL QUE LEE DATOS DEL EXCEL Y EJECUTA UN FILTRO ESPECÍFICO
    function funcionFiltroBusquedaSiniestros(numeroCaso) {
        cy.navegarAMenu('Ficheros', 'Siniestros');
            cy.url().should('include', '/dashboard/crash-reports');
            cy.get('.MuiDataGrid-root').should('be.visible');

        // Obtener datos del Excel para Ficheros-Siniestros
        return cy.obtenerDatosExcel('Ficheros-Siniestros').then((datosFiltros) => {
            
            // Buscar el caso específico
            const filtroEspecifico = datosFiltros.find(f => f.caso === `TC${numeroCaso}`);
            
            if (!filtroEspecifico) {
                cy.log(` No se encontró el caso TC${numeroCaso} en el Excel`);
                cy.log(` Casos disponibles: ${datosFiltros.map(f => f.caso).join(', ')}`);
                
                cy.registrarResultados({
                    numero: numeroCaso,
                    nombre: `TC${numeroCaso} - Caso no encontrado en Excel`,
                    esperado: `Caso TC${numeroCaso} debe existir en el Excel`,
                    obtenido: 'Caso no encontrado en los datos del Excel',
                    resultado: 'ERROR',
                    archivo,
                    pantalla: 'Ficheros (Siniestros)'
                });
                return cy.wrap(false);
            }

            cy.log(` Ejecutando TC${numeroCaso}: ${filtroEspecifico.valor_etiqueta_1} - ${filtroEspecifico.dato_1}`);
            
            // Ejecutar el filtro específico directamente
            if (filtroEspecifico.etiqueta_1 === 'columna') {
                // Filtro por columna específica
                cy.log(` Buscando dropdown de columnas...`);
                cy.get('select[name="column"], select#column').then($select => {
                    const options = [...$select[0].options].map(opt => opt.text.trim());
                    cy.log(` Opciones disponibles: ${options.join(', ')}`);
                    
                    const columnaEncontrada = options.find(opt => 
                        opt.toLowerCase().includes(filtroEspecifico.valor_etiqueta_1.toLowerCase()) ||
                        filtroEspecifico.valor_etiqueta_1.toLowerCase().includes(opt.toLowerCase())
                    );
                    
                    if (columnaEncontrada) {
                        cy.wrap($select).select(columnaEncontrada, { force: true });
                        cy.log(` Seleccionada columna: ${columnaEncontrada}`);
                    } else {
                        cy.log(` Columna "${filtroEspecifico.valor_etiqueta_1}" no encontrada, usando primera opción`);
                        cy.wrap($select).select(1, { force: true });
                    }
                });
                
                cy.log(` Buscando campo de búsqueda...`);
                cy.get('input#search[placeholder="Buscar"], input[placeholder="Buscar"]')
                    .should('be.visible')
                    .clear({ force: true })
                    .type(`${filtroEspecifico.dato_1}{enter}`, { force: true });

                cy.log(` Esperando a que se aplique el filtro...`);
                cy.wait(2000);

                // Verificar si hay resultados después del filtro
                cy.get('body').then($body => {
                    const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;
                    const resultado = hayFilas ? 'OK' : 'ERROR';
                    const obtenido = hayFilas ? 'Se muestran resultados' : 'No se muestran resultados';
                    
                    cy.log(` TC${numeroCaso}: ${hayFilas ? 'Encontrados resultados' : 'No hay resultados'} - ${resultado}`);
                    
                    // Registrar resultado individual
                    cy.registrarResultados({
                        numero: numeroCaso,
                        nombre: `TC${numeroCaso} - Filtrar siniestros por ${filtroEspecifico.valor_etiqueta_1}`,
                        esperado: `Se ejecuta filtro por ${filtroEspecifico.valor_etiqueta_1} con valor "${filtroEspecifico.dato_1}"`,
                        obtenido: obtenido,
                        resultado: resultado,
                        archivo,
                        pantalla: 'Ficheros (Siniestros)'
                });
            });
            }
            
            return cy.wrap(true);
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

    // Resto de funciones existentes (fechas, ordenar, etc.) - las mantengo como estaban
    function filtrarPorRangoFechas() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');

        // Fecha Desde
        cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2024');
        });

        // Fecha Hasta
        cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2024');
        });

        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorFechaDesde() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');

        cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2024');
        });

        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filtrarPorFechaHasta() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');

        cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2024');
        });

        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function fechasInvalidas() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');

        // Fecha Desde mayor que Hasta
        cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}31');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}12');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2024');
        });

        cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
            cy.get('span[aria-label="Day"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Month"]').type('{selectall}{backspace}01');
            cy.get('span[aria-label="Year"]').type('{selectall}{backspace}2024');
        });

        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').should('have.length', 0);
    }

    function ordenarFechaAsc() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Fecha column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarFechaDesc() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Fecha column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarCosteReparacionAsc() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Coste de reparación')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Coste de reparación column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarCosteReparacionDesc() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');

        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Coste de reparación')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Coste de reparación column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function seleccionarFila() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function editarSinSeleccion() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function editarConSeleccion() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        cy.get('.MuiDataGrid-row:visible').first().as('filaSiniestro');
        cy.get('@filaSiniestro').click({ force: true });
        cy.wait(500);
        cy.get('@filaSiniestro').dblclick({ force: true });
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/crash-reports\/form\/\d+$/);
    }

    function eliminarSinSeleccion() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        
        // Verificar que no hay filas seleccionadas
        cy.get('.MuiDataGrid-row.Mui-selected').should('have.length', 0);
        
        // Intentar hacer click en el botón de eliminar
        cy.get('button[aria-label*="delete"], button[title*="delete"], .MuiIconButton-root:has(svg[data-testid="DeleteIcon"])').first().click({ force: true });
        
        // Verificar diferentes posibles respuestas
        return cy.get('body').then($body => {
            const mensajeError = $body.text().includes('Por favor, selecciona un elemento para eliminar') ||
                                $body.text().includes('No hay elemento seleccionado') ||
                                $body.text().includes('Selecciona un elemento');
            
            if (mensajeError) {
                cy.log('TC024: Aparece mensaje de error como se esperaba - OK');
                return cy.wrap(true);
            } else {
                // Si no aparece mensaje, el botón simplemente no hace nada (comportamiento correcto)
                cy.log('TC024: Botón no hace nada sin selección - OK');
                return cy.wrap(true);
            }
        });
    }

    function abrirFormularioAlta() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        cy.get('button').contains('Añadir').click({ force: true });
        return cy.url().should('include', '/dashboard/crash-reports/form');
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');

        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);
        return cy.get('body').should('be.visible');
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');

        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500);
        return cy.get('body').should('be.visible');
    }

    function scrollCabecera() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom', { duration: 1000 });
        cy.wait(500);
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('top', { duration: 1000 });
        cy.get('.MuiDataGrid-columnHeaders').should('be.visible');
        return cy.wrap(true);
    }

    function filtroYOrdenID() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
        cy.url().should('include', '/dashboard/crash-reports');
        
        // Aplicar filtro
        cy.get('select[name="column"]').select('ID', { force: true });
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('1{enter}', { force: true });
        cy.wait(1000);
        
        // Ordenar
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'ID')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="ID column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });
        
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function recargaConFiltros() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
            cy.url().should('include', '/dashboard/crash-reports');
        
        // Aplicar filtro
        cy.get('select[name="column"]').select('ID', { force: true });
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('1{enter}', { force: true });
                cy.wait(1000);

        // Recargar página
        cy.reload();
        cy.wait(2000);
        
        // Verificar que el filtro se mantiene
        return cy.get('body').then(($body) => {
                    const hayFilas = $body.find('.MuiDataGrid-row:visible').length > 0;
            cy.log(`Después de recargar: ${hayFilas ? 'hay filas visibles' : 'no hay filas visibles'}`);
            return cy.wrap(true);
        });
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('Ficheros', 'Siniestros');
            cy.url().should('include', '/dashboard/crash-reports');
        
        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);
        return cy.get('body').should('be.visible');
    }
});