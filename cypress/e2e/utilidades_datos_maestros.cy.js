describe('Utilidades (Datos Maestros)', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';
    const pantalla = 'Utilidades (Datos Maestros)';

    beforeEach(() => {
        cy.login();
        cy.resetearFlagsTest();
    });

    after(() => {
        cy.log('Procesando resultados de la pantalla: ' + pantalla);
        cy.wait(1000);
        cy.procesarResultadosPantalla(pantalla, archivo);
    });

    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla correctamente', funcion: cargarPantallaDatosMaestros },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol },
        { numero: 5, nombre: 'TC005 - Filtrar por Concepto', funcion: filtrarPorConcepto },
        { numero: 6, nombre: 'TC006 - Crear registro (+)', funcion: crearRegistro },
        { numero: 7, nombre: 'TC007 - Editar registro existente', funcion: editarRegistro },
        { numero: 8, nombre: 'TC008 - Eliminar registro (X roja)', funcion: eliminarRegistro },
        { numero: 9, nombre: 'TC009 - Ordenar columna Nombre ASC/DESC', funcion: ordenarColumnaNombre },
        { numero: 10, nombre: 'TC010 - Filtrar columna por Value', funcion: filtrarColumnaPorValue },
        { numero: 11, nombre: 'TC011 - Ocultar y Mostrar columna desde Manage columns', funcion: ocultarMostrarColumna },
        { numero: 12, nombre: 'TC012 - Reiniciar pantalla', funcion: reiniciarPantalla },
        { numero: 13, nombre: 'TC013 - Eliminar sin registro seleccionado', funcion: eliminarSinSeleccion },
        { numero: 14, nombre: 'TC014 - Editar sin registro seleccionado', funcion: editarSinSeleccion },
        { numero: 15, nombre: 'TC015 - Scroll', funcion: scrollTabla }
    ];

    casos.forEach(caso => {
        it(caso.nombre, () => {
            cy.estaRegistrado(caso.numero, pantalla, archivo).then(registrado => {
                if (!registrado) {
                    return caso.funcion().then(() => {
                        // Si la función se ejecuta sin errores, registrar OK automático
                        cy.estaRegistrado(caso.numero, pantalla, archivo).then((ya) => {
                            if (!ya) {
                                cy.log(`Registrando OK automático para test ${caso.numero}: ${caso.nombre}`);
                                cy.registrarResultados({
                                    numero: caso.numero,
                                    nombre: caso.nombre,
                                    esperado: 'Comportamiento correcto',
                                    obtenido: 'Comportamiento correcto',
                                    resultado: 'OK',
                                    archivo,
                                    pantalla: 'Utilidades (Datos Maestros)'
                                });
                            }
                        });
                    });
                }
            });
        });
    });

    // TC001 - Cargar la pantalla correctamente
    function cargarPantallaDatosMaestros() {
        cy.navegarAMenu('Utilidades', 'Datos Maestros');
        cy.url().should('include', '/dashboard/master-data');
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    // TC002 - Cambiar idioma a Inglés
    function cambiarIdiomaIngles() {
        cy.navegarAMenu('Utilidades', 'Datos Maestros');
        cy.url().should('include', '/dashboard/master-data');
        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Master Data');
    }

    // TC003 - Cambiar idioma a Catalán
    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('Utilidades', 'Datos Maestros');
        cy.url().should('include', '/dashboard/master-data');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Dades Mestres');
    }

    // TC004 - Cambiar idioma a Español
    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('Utilidades', 'Datos Maestros');
        cy.url().should('include', '/dashboard/master-data');
        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Datos Maestros');
    }

    // TC005 - Filtrar por Concepto
    function filtrarPorConcepto() {
        cy.navegarAMenu('Utilidades', 'Datos Maestros');
        cy.url().should('include', '/dashboard/master-data');

        // Filtrar por Concepto "Asistencia" - usar el desplegable correcto
        cy.get('#mui-component-select-concept').click({ force: true });
        cy.get('[role="option"]').contains('Asistencia').click({ force: true });

        return cy.get('body').should('contain.text', 'Asistencia');
    }

    // TC006 - Crear registro (+)
    function crearRegistro() {
        cy.navegarAMenu('Utilidades', 'Datos Maestros');
        cy.url().should('include', '/dashboard/master-data');

        // Rellenar campo Nombre en la sección "Datos"
        cy.get('input[placeholder="Nombre"]').last().clear().type('prueba');

        // Pulsar botón + (verde) - usar el selector correcto del MUI IconButton
        cy.get('button[class*="MuiIconButton-colorSuccess"]').click({ force: true });

        return cy.get('.MuiDataGrid-row', { timeout: 8000 }).should('contain.text', 'prueba');
    }

    // TC007 - Editar registro existente
    function editarRegistro() {
        cy.navegarAMenu('Utilidades', 'Datos Maestros');
        cy.url().should('include', '/dashboard/master-data');

        // 1. Crear registro "prueba"
        cy.get('input[placeholder="Nombre"]').last().clear().type('prueba');
        cy.get('button[class*="MuiIconButton-colorSuccess"]').click({ force: true });
        cy.wait(1000);

        // 2. Pulsar la fila recién creada
        cy.get('.MuiDataGrid-row').contains('prueba').click();
        cy.wait(500);

        // 3. Editar el campo poniendo "prueba1"
        cy.get('input[placeholder="Nombre"]').last().clear().type('prueba1');
        cy.wait(500);

        // 4. Dar clic al botón azul (lápiz) en la sección "Datos"
        cy.get('button.MuiIconButton-colorPrimary:not(.Mui-disabled)')
            .eq(1) // El segundo botón azul (el primero es del menú de arriba)
            .click({ force: true });
        cy.wait(2000);

        // Verificar que se actualizó en la tabla
        return cy.get('.MuiDataGrid-row', { timeout: 8000 }).should('contain.text', 'prueba1');
    }

    // TC008 - Eliminar registro (X roja)
    function eliminarRegistro() {
        cy.navegarAMenu('Utilidades', 'Datos Maestros');
        cy.url().should('include', '/dashboard/master-data');

        // Crear un registro llamado "prueba" antes de eliminarlo
        cy.get('input[placeholder="Nombre"]').last().clear().type('prueba');
        cy.get('button[class*="MuiIconButton-colorSuccess"]').click({ force: true });
        cy.wait(1000);

        // Seleccionar la fila recién creada
        cy.get('.MuiDataGrid-row').contains('prueba').click();
        cy.wait(500);

        // Hacer clic en el botón eliminar (X roja) - debe estar habilitado ahora
        cy.get('button[class*="MuiIconButton-colorError"]:not(.Mui-disabled)').first().click({ force: true });
        cy.wait(1000);

        // Verificar que se eliminó - usar una verificación más robusta
        return cy.get('body').then(($body) => {
            if ($body.find('.MuiDataGrid-row').length === 0) {
                // No hay filas, la eliminación fue exitosa
                return cy.wrap(true);
            } else {
                // Hay filas, verificar que "prueba" no está presente
                return cy.get('.MuiDataGrid-row', { timeout: 8000 }).should('not.contain.text', 'prueba');
            }
        });
    }

    // TC009 - Ordenar columna Nombre ASC/DESC
    function ordenarColumnaNombre() {
        cy.navegarAMenu('Utilidades', 'Datos Maestros');
        cy.url().should('include', '/dashboard/master-data');

        // Crear registros "prueba" y "ayuda" antes de ordenar
        cy.get('input[placeholder="Nombre"]').last().clear().type('prueba');
        cy.get('button[class*="MuiIconButton-colorSuccess"]').click({ force: true });
        cy.wait(500);

        cy.get('input[placeholder="Nombre"]').last().clear().type('ayuda');
        cy.get('button[class*="MuiIconButton-colorSuccess"]').click({ force: true });
        cy.wait(1000);

        // Ordenar por Nombre ASC/DESC usando click en header (como en utilidades_divisas)
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
            .should('be.visible').click({ force: true });
        cy.wait(700);
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
            .should('be.visible').click({ force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    // TC010 - Filtrar columna por Value
    function filtrarColumnaPorValue() {
        cy.navegarAMenu('Utilidades', 'Datos Maestros');
        cy.url().should('include', '/dashboard/master-data');

        // Crear un registro llamado "prueba" antes de filtrar
        cy.get('input[placeholder="Nombre"]').last().clear().type('prueba');
        cy.get('button[class*="MuiIconButton-colorSuccess"]').click({ force: true });
        cy.wait(1000);

        // Filtrar columna Nombre por Value (como en utilidades_divisas)
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Nombre column menu"]').click({ force: true });
        cy.get('li').contains('Filter').click({ force: true });

        // Escribir en el campo Value
        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('prueba', { force: true });

        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    // TC011 - Ocultar y Mostrar columna desde Manage columns
    function ocultarMostrarColumna() {
        cy.navegarAMenu('Utilidades', 'Datos Maestros');
        cy.url().should('include', '/dashboard/master-data');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // Abrir el menú desde "Nombre"
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        cy.get('[aria-label="Nombre column menu"]').click({ force: true });
        cy.get('li').contains('Manage columns').click({ force: true });

        // Panel visible
        cy.get('.MuiDataGrid-panel').should('be.visible');

        // 1) Ocultar "Nombre"
        cy.get('.MuiDataGrid-panel')
            .find('label')
            .contains('Nombre')
            .parents('label')
            .find('input[type="checkbox"]')
            .uncheck({ force: true });

        // Verificar que ya no está visible en headers
        cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Nombre').should('not.exist');
        });

        // 2) Volver a mostrar "Nombre"
        // (si el panel se cerró, lo abrimos otra vez desde "Nombre")
        cy.get('body').then($b => {
            if (!$b.find('.MuiDataGrid-panel:visible').length) {
                cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
                    .parents('[role="columnheader"]').trigger('mouseover');
                cy.get('[aria-label="Nombre column menu"]').click({ force: true });
                cy.get('li').contains('Manage columns').click({ force: true });
            }
        });

        cy.get('.MuiDataGrid-panel')
            .find('label')
            .contains('Nombre')
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });

        // Confirmar que "Nombre" vuelve a existir en los headers
        return cy.get('.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains('Nombre').should('exist');
            });
    }

    // TC012 - Reiniciar pantalla
    function reiniciarPantalla() {
        cy.navegarAMenu('Utilidades', 'Datos Maestros');
        cy.url().should('include', '/dashboard/master-data');
        cy.wait(2000);

        // Crear un dato maestro antes de recargar para verificar si se mantiene
        cy.get('input[placeholder="Nombre"]').last().clear().type('test_reinicio');
        cy.get('button[class*="MuiIconButton-colorSuccess"]').click({ force: true });
        cy.wait(1000);

        // Recargar la página
        cy.reload();
        cy.wait(3000);

        // Verificar que la pantalla vuelve al estado inicial
        cy.get('h1, h2, h3, h4, h5, h6').contains('Datos Maestros').should('exist');
        cy.get('button[class*="MuiIconButton-colorSuccess"]').should('exist');

        // Verificar si los datos desaparecen o se mantienen
        return cy.get('body').then(($body) => {
            const bodyText = $body.text();
            const datosDesaparecen = bodyText.includes('No rows') ||
                bodyText.includes('Sin datos') ||
                bodyText.includes('No hay datos') ||
                !bodyText.includes('test_reinicio');

            if (datosDesaparecen) {
                // Si los datos desaparecen, registrar WARNING
                cy.registrarResultados({
                    numero: 12,
                    nombre: 'TC012 - Reiniciar pantalla',
                    esperado: 'Los datos se mantienen después de recargar',
                    obtenido: 'Desaparecen todos los datos creados al recargar',
                    resultado: 'WARNING',
                    archivo,
                    pantalla: 'Utilidades (Datos Maestros)'
                });
            } else {
                // Si los datos se mantienen, registrar OK
                cy.registrarResultados({
                    numero: 12,
                    nombre: 'TC012 - Reiniciar pantalla',
                    esperado: 'Los datos se mantienen después de recargar',
                    obtenido: 'Los datos se mantienen correctamente después de recargar',
                    resultado: 'OK',
                    archivo,
                    pantalla: 'Utilidades (Datos Maestros)'
                });
            }

            return cy.wrap(true); // Devolver promesa para evitar auto-OK
        });
    }

    // TC013 - Eliminar sin registro seleccionado
    function eliminarSinSeleccion() {
        cy.navegarAMenu('Utilidades', 'Datos Maestros');
        cy.url().should('include', '/dashboard/master-data');

        // Verificar que el botón eliminar no está disponible sin selección
        cy.get('[data-testid="DeleteIcon"]').should('not.exist');

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    // TC014 - Editar sin registro seleccionado
    function editarSinSeleccion() {
        cy.navegarAMenu('Utilidades', 'Datos Maestros');
        cy.url().should('include', '/dashboard/master-data');

        // Verificar que el botón editar no está disponible sin selección
        cy.get('[data-testid="EditIcon"]').should('not.exist');

        return cy.get('.MuiDataGrid-root').should('be.visible');
    }

    // TC015 - Scroll
    function scrollTabla() {
        cy.navegarAMenu('Utilidades', 'Datos Maestros');
        cy.url().should('include', '/dashboard/master-data');

        // Crear datos antes de hacer scroll
        for (let i = 1; i <= 10; i++) {
            cy.get('input[placeholder="Nombre"]').last().clear().type(`test_scroll_${i}`);
            cy.get('button[class*="MuiIconButton-colorSuccess"]').click({ force: true });
            cy.wait(300);
        }

        // Verificar que hay suficientes filas para hacer scroll
        cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 5);

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
});
