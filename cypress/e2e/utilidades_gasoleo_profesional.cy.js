describe('UTILIDADES (GASÓLEO PROFESIONAL) - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Acceder a la pantalla correctamente', funcion: accederPantalla },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol },
        { numero: 5, nombre: 'TC005 - Exportar archivo correctamente', funcion: exportarArchivo },
    ];

    // Resumen al final
    after(() => {
        cy.log('Procesando resultados finales para Utilidades (Gasóleo Profesional)');
        cy.procesarResultadosPantalla('Utilidades (Gasóleo Profesional)');
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
                    pantalla: 'Utilidades (Gasóleo Profesional)'
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
                            pantalla: 'Utilidades (Gasóleo Profesional)'
                        });
                    }
                });
            });
        });
    });

    // ===== FUNCIONES DE PRUEBA =====

    function accederPantalla() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional');
        cy.url().should('include', '/dashboard/professional-diesel');
        cy.get('body').should('contain.text', 'Gasóleo Profesional');
        return cy.get('body').should('be.visible');
    }

    function cambiarIdiomaIngles() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional');
        cy.url().should('include', '/dashboard/professional-diesel');
        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Professional Diesel');
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional');
        cy.url().should('include', '/dashboard/professional-diesel');

        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Gasoli Professional');
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional');
        cy.url().should('include', '/dashboard/professional-diesel');

        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);
        return cy.get('body').should('contain.text', 'Gasóleo Profesional');
    }

    function exportarArchivo() {
        cy.navegarAMenu('Utilidades', 'Gasóleo Profesional');
        cy.url().should('include', '/dashboard/professional-diesel');

        // Filtros
        cy.get('input[value="kilometers"]').should('be.checked');
        cy.get('input[name="filters.year"]').clear().type('2020', { force: true });
        cy.get('input[name="filters.period"]').clear().type('4', { force: true });
        cy.get('input[name="filters.quarter"]').clear().type('2', { force: true });
        cy.get('input[name="filters.month"]').clear().type('10', { force: true });
        cy.get('input[name="filters.filePath"]').clear()
            .type('C:\\Gasoleo Profesional\\Kilometros2020.txt', { force: true });

        // CLICK ROBUSTO
        cy.get('form').then(($form) => {
            // 1) intenta el submit por selector semántico
            const $submit = $form.find('button[type="submit"], [type="submit"]').last();
            if ($submit.length) {
                cy.wrap($submit)
                    .scrollIntoView()
                    .should('be.visible')
                    .and('not.be.disabled')
                    .click({ force: true });
            } else {
                // 2) si no hay botón submit, fuerza el envío nativo del form
                $form[0].requestSubmit ? $form[0].requestSubmit() : $form[0].submit();
            }
        });

        // retornar la validación del toast (para tu Excel)
        return cy.contains(/Export (completed|completada)/i, { timeout: 15000 }).should('be.visible');
    }

});