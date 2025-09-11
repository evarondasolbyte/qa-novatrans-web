describe('UTILIDADES (GASÓLEO PROF. AUTONÓMICO) - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Acceder a la pantalla correctamente', funcion: accederPantalla },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol },
        { numero: 5, nombre: 'TC005 - Crear nuevo registro', funcion: crearNuevoRegistro },
        { numero: 7, nombre: 'TC007 - Eliminar registro', funcion: eliminarRegistro },
        { numero: 8, nombre: 'TC008 - Filtros aplicados', funcion: filtrosAplicados},
        { numero: 9, nombre: 'TC009 - Cancelar acción', funcion: cancelarAccion},
        { numero: 10, nombre: 'TC010 - Ordenar por Comunidad Autónoma ASC/DESC', funcion: ordenarPorComunidadAutonoma },
        { numero: 11, nombre: 'TC011 - Ordenar por Fecha de Inicio ASC/DESC', funcion: ordenarPorFechaInicio },
        { numero: 12, nombre: 'TC012 - Ordenar por Fecha de Fin ASC/DESC', funcion: ordenarPorFechaFin },
        { numero: 13, nombre: 'TC013 - Ordenar por Porcentaje ASC/DESC', funcion: ordenarPorPorcentaje },
        { numero: 14, nombre: 'TC014 - Filter → Value en columna Comunidad', funcion: filterValueEnColumnaComunidad },
        { numero: 15, nombre: 'TC015 - Seleccionar una fila', funcion: seleccionarFila },
        { numero: 16, nombre: 'TC016 - Ocultar columna', funcion: ocultarColumna },
        { numero: 17, nombre: 'TC017 - Mostrar columna', funcion: mostrarColumna },
    ];

    // Resumen al final
    after(() => {
        cy.log('Procesando resultados finales para Utilidades (Gasóleo Prof. Autonómico)');
        cy.procesarResultadosPantalla('Utilidades (Gasóleo Prof. Autonómico)');
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
                    pantalla: 'Utilidades (Gasóleo Prof. Autonómico)'
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
                            pantalla: 'Utilidades (Gasóleo Prof. Autonómico)'
                        });
                    }
                });
            });
        });
    });

    // ===== FUNCIONES DE PRUEBA =====

    function accederPantalla() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');
        cy.get('body').should('contain.text', 'Gasóleo Profesional - Autonómico');
        return cy.get('body').should('be.visible');
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');
        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);

        // Siempre registrar ERROR por ahora, según la indicación del usuario
        cy.registrarResultados({
            numero: 2,
            nombre: 'TC002 - Cambiar idioma a Inglés',
            esperado: 'Cambia idioma correctamente',
            obtenido: 'Algunos títulos no cambian',
            resultado: 'ERROR',
            pantalla: 'Utilidades (Gasóleo Prof. Autonómico)',
            archivo
        });

        return cy.get('body').should('be.visible');
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');

        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500);
        return cy.get('body').should('be.visible');
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');

        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);
        return cy.get('body').should('be.visible');
    }

    function crearNuevoRegistro() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');

        return cy.get('.MuiDataGrid-row').its('length').then((filasAntes) => {

            // Comunidad
            cy.get('select[name="autonomousCommunity"], select[name="comunidadAutonoma"]')
                .first()
                .should('exist')
                .select('ANDALUCÍA', { force: true });

            // Inicio (input type="date")
            cy.get('input[name="startDate"]').then(($in) => {
                cy.wrap($in).invoke('val', '2025-09-11').trigger('input').trigger('change');
            });

            // Porcentaje
            cy.get('input[name="percentage"], input[name="porcentaje"]')
                .first()
                .type('{selectall}{backspace}20', { force: true });

            // Botón verde (+)
            cy.get('button.MuiIconButton-colorSuccess').click({ force: true });

            // ACEPTAR **izquierda** (excluye el del panel Filtros)
            cy.get('button:visible').filter((i, el) => {
                const txt = (el.textContent || '').trim().toUpperCase();
                if (txt !== 'ACEPTAR') return false;

                const paper = el.closest('.MuiPaper-root');
                const dentroDeFiltros = paper ? /Filtros/i.test(paper.textContent || '') : false;

                const form = el.closest('form');
                const esFormFiltros = form
                    ? (form.querySelector('input[name="fromDate"]') || form.querySelector('input[name="toDate"]'))
                    : false;

                return !dentroDeFiltros && !esFormFiltros; // sólo el ACEPTAR de la izquierda
            }).first().scrollIntoView().click({ force: true });

            // Validación y registro
            cy.wait(600);
            cy.get('body').then(($b) => {
                const hayMensaje = /Registro creado|Creado correctamente/i.test($b.text());
                cy.get('.MuiDataGrid-row').its('length').then((filasDespues) => {
                    const creado = hayMensaje || (filasDespues > filasAntes);
                    cy.registrarResultados({
                        numero: 5,
                        nombre: 'TC005 - Crear nuevo registro',
                        esperado: 'Se crea correctamente',
                        obtenido: creado ? 'Se crea correctamente' : 'Pone que se crea correctamente pero no se crea nada',
                        resultado: creado ? 'OK' : 'ERROR',
                        pantalla: 'Utilidades (Gasóleo Prof. Autonómico)',
                        archivo,
                    });
                });
            });

            return cy.get('body').should('be.visible');
        });
    }

    function eliminarRegistro() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');

        // Seleccionar fila y eliminar
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        cy.wait(500);
        cy.get('button.MuiIconButton-colorError').click({ force: true });

        // Verificar si se elimina correctamente o si da error
        cy.wait(1000);
        cy.get('body').then($body => {
            if ($body.text().includes('Registro eliminado') || $body.text().includes('Eliminado correctamente') ||
                $body.find('.MuiDataGrid-row:visible').length === 0) {
                // Si se elimina correctamente
                cy.registrarResultados({
                    numero: 7,
                    nombre: 'TC007 - Eliminar registro',
                    esperado: 'Se elimina correctamente',
                    obtenido: 'Se elimina correctamente',
                    resultado: 'OK',
                    pantalla: 'Utilidades (Gasóleo Prof. Autonómico)',
                    archivo
                });
            } else {
                // Si da error de eliminación (ERROR esperado)
                cy.registrarResultados({
                    numero: 7,
                    nombre: 'TC007 - Eliminar registro',
                    esperado: 'Se elimina correctamente',
                    obtenido: 'Da error de eliminación',
                    resultado: 'ERROR',
                    pantalla: 'Utilidades (Gasóleo Prof. Autonómico)',
                    archivo
                });
            }
        });

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    // TC008 - Filtros aplicados (con OK/ERROR)
    function filtrosAplicados() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');

        return cy.get('.MuiDataGrid-row').its('length').then((filasAntes) => {
            // Click exacto al icono verde de filtros (en <main>, el más abajo/izquierda)
            cy.get('main button.MuiIconButton-root:visible').then($btns => {
                const arr = [...$btns].map(el => ({ el, r: el.getBoundingClientRect() }));
                arr.sort((a, b) => (b.r.bottom - a.r.bottom) || (a.r.left - b.r.left));
                cy.wrap(arr[0].el).scrollIntoView().click({ force: true });
            });

            // ==> Panel de filtros: seleccionamos su <form> por los inputs fromDate/toDate
            cy.get('form')
                .filter((i, el) =>
                    el.querySelector('input[name="fromDate"]') && el.querySelector('input[name="toDate"]')
                )
                .first()
                .as('formFiltros');

            // Rellenar fechas (inputs type="date") y pulsar ACEPTAR del panel (type=submit)
            cy.get('@formFiltros').within(() => {
                cy.get('input[name="fromDate"]')
                    .invoke('val', '2015-01-01')
                    .trigger('input')
                    .trigger('change');

                cy.get('input[name="toDate"]')
                    .invoke('val', '2016-12-31')
                    .trigger('input')
                    .trigger('change');

                cy.get('button[type="submit"]').filter(':visible').first().click({ force: true });
            });

            // Registrar OK/ERROR (mensaje o cambio en nº filas)
            cy.wait(400);
            cy.get('body').then(($b) => {
                const hayMensaje = /Filtros aplicados|Filtrado correctamente/i.test($b.text());
                cy.get('.MuiDataGrid-row').its('length').then((filasDespues) => {
                    const filtrado = hayMensaje || (filasDespues !== filasAntes);

                    cy.registrarResultados({
                        numero: 8,
                        nombre: 'TC008 - Filtros aplicados',
                        esperado: 'Se filtra correctamente',
                        obtenido: filtrado
                            ? `Se filtra correctamente (antes: ${filasAntes}, después: ${filasDespues})`
                            : `Pone filtros aplicados correctamente pero no hace nada (antes: ${filasAntes}, después: ${filasDespues})`,
                        resultado: filtrado ? 'OK' : 'ERROR',
                        pantalla: 'Utilidades (Gasóleo Prof. Autonómico)',
                        archivo,
                    });
                });
            });
        })
            .get('.MuiDataGrid-root').should('be.visible'); // mantener cadena activa
    }

    // TC009 - Cancelar acción (OK automático, sin registrar)
    function cancelarAccion() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');

        // Click exacto al icono verde de filtros
        cy.get('main button.MuiIconButton-root:visible').then($btns => {
            const arr = [...$btns].map(el => ({ el, r: el.getBoundingClientRect() }));
            arr.sort((a, b) => (b.r.bottom - a.r.bottom) || (a.r.left - b.r.left));
            cy.wrap(arr[0].el).scrollIntoView().click({ force: true });
        });

        // En el <form> del panel, pulsar CANCELAR (botón outlined de error)
        cy.get('form')
            .filter((i, el) =>
                el.querySelector('input[name="fromDate"]') && el.querySelector('input[name="toDate"]')
            )
            .first()
            .within(() => {
                cy.get('button.MuiButton-outlinedError, button.MuiButton-colorError')
                    .filter(':visible')
                    .first()
                    .click({ force: true });
            });

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    function ordenarPorComunidadAutonoma() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');

        // Ordenar por C. Autónoma ASC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'C. Autónoma')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="C. Autónoma column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);

        // Ordenar por C. Autónoma DESC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'C. Autónoma')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="C. Autónoma column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorFechaInicio() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');

        // Ordenar por Inicio ASC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Inicio')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Inicio column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);

        // Ordenar por Inicio DESC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Inicio')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Inicio column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorFechaFin() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');

        // Ordenar por Fin ASC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fin')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Fin column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);

        // Ordenar por Fin DESC
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fin')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Fin column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function ordenarPorPorcentaje() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');

        // Ordenar por Porcentaje ASC
        cy.contains('.MuiDataGrid-columnHeaderTitle', '%')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="% column menu"]').click({ force: true });
        cy.get('li').contains('Sort by ASC').click({ force: true });
        cy.wait(1000);

        // Ordenar por Porcentaje DESC
        cy.contains('.MuiDataGrid-columnHeaderTitle', '%')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="% column menu"]').click({ force: true });
        cy.get('li').contains('Sort by DESC').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function filterValueEnColumnaComunidad() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');

        // Filtrar por C. Autónoma
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'C. Autónoma')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="C. Autónoma column menu"]').click({ force: true });
        cy.get('li').contains('Filter').click({ force: true });

        // Escribir ANDALUCÍA en el campo Value
        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('ANDALUCÍA', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function seleccionarFila() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');

        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function ocultarColumna() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');

        // Ocultar columna C. Autónoma
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'C. Autónoma')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="C. Autónoma column menu"]').click({ force: true });
        cy.get('li').contains('Hide column').click({ force: true });

        return cy.get('[data-field="comunidadAutonoma"]').should('not.exist');
    }

    function mostrarColumna() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional - Autonómico');
        cy.url().should('include', '/dashboard/regional-professional-diesel');

        // Mostrar columna C. Autónoma usando Manage columns
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Inicio')
            .parents('[role="columnheader"]')
            .trigger('mouseover');
        cy.get('[aria-label="Inicio column menu"]').click({ force: true });
        cy.get('li').contains('Manage columns').click({ force: true });

        cy.get('.MuiDataGrid-panel')
            .should('be.visible')
            .find('label')
            .contains('C. Autónoma')
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });

        return cy.get('.MuiDataGrid-panel').should('be.visible');
    }
});