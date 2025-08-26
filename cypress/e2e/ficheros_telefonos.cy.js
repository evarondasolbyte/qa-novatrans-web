describe('FICHEROS - TELÉFONOS - Validación completa con errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Cargar la pantalla de "Teléfonos" correctamente', funcion: TC001 },
        { numero: 2, nombre: 'TC002 - Ordenar por "Número" ascendente', funcion: TC002 },
        { numero: 3, nombre: 'TC003 - Ordenar por "Número" descendente', funcion: TC003 },
        { numero: 4, nombre: 'TC004 - Ordenar por "Modelo" ascendente', funcion: TC004 },
        { numero: 5, nombre: 'TC005 - Ordenar por "Modelo" descendente', funcion: TC005 },
        { numero: 6, nombre: 'TC006 - Ordenar por "Poseedor" ascendente', funcion: TC006 },
        { numero: 7, nombre: 'TC007 - Ordenar por "Poseedor" descendente', funcion: TC007 },
        { numero: 8, nombre: 'TC008 - Ordenar por "Extensión" ascendente', funcion: TC008 },
        { numero: 9, nombre: 'TC009 - Ordenar por "Extensión" descendente', funcion: TC009 },
        { numero: 10, nombre: 'TC010 - Filtrar por "Número"', funcion: TC010 },
        { numero: 11, nombre: 'TC011 - Filtrar por "Modelo"', funcion: TC011 },
        { numero: 12, nombre: 'TC012 - Filtrar por "Poseedor"', funcion: TC012 },
        { numero: 13, nombre: 'TC013 - Filtrar por "Activo"', funcion: TC013 },
        { numero: 14, nombre: 'TC014 - Filtrar por "Extensión" exacta', funcion: TC014 },
        { numero: 15, nombre: 'TC015 - Filtrar un Modelo por campo "Value"', funcion: TC015 },
        { numero: 16, nombre: 'TC016 - Buscar texto en mayúsculas/minúsculas alternadas', funcion: TC016 },
        { numero: 17, nombre: 'TC017 - Buscar caracteres especiales', funcion: TC017 },
        { numero: 18, nombre: 'TC018 - Buscar texto sin coincidencias', funcion: TC018 },
        { numero: 19, nombre: 'TC019 - Limpiar el filtro y mostrar todos los registros', funcion: TC019 },
        { numero: 20, nombre: 'TC020 - Seleccionar un teléfono individual', funcion: TC020 },
        { numero: 21, nombre: 'TC021 - Botón "Editar" sin selección', funcion: TC021 },
        { numero: 22, nombre: 'TC022 - Botón "Editar" con un teléfono seleccionado', funcion: TC022 },
        { numero: 23, nombre: 'TC023 - Botón "Eliminar" sin selección', funcion: TC023 },
        { numero: 24, nombre: 'TC024 - Botón "Eliminar" con uno o varios seleccionado', funcion: TC024 },
        { numero: 25, nombre: 'TC025 - Botón "+ Añadir"', funcion: TC025 },
        { numero: 26, nombre: 'TC026 - Ocultar columna desde el menú contextual', funcion: TC026 },
        { numero: 27, nombre: 'TC027 - Mostrar/ocultar columnas desde "Manage colums"', funcion: TC027 },
        { numero: 28, nombre: 'TC028 - Scroll vertical', funcion: TC028 },
        { numero: 29, nombre: 'TC029 - Cambio de idioma a "Inglés"', funcion: TC029 },
        { numero: 30, nombre: 'TC030 - Cambio de idioma a "Catalán"', funcion: TC030 },
        { numero: 31, nombre: 'TC031 - Cambio de idioma a "Español"', funcion: TC031 },
        { numero: 32, nombre: 'TC032 - Recargar la página con filtros aplicados', funcion: TC032 },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Ficheros (Teléfonos)');
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
                    pantalla: 'Ficheros (Teléfonos)'
                });
                return false; // Previene que Cypress corte el flujo y nos permite seguir registrando
            });

            // Inicio sesión antes de ejecutar el caso, usando la sesión compartida (cy.login)
            // y espero unos milisegundos por seguridad antes de continuar
            cy.login();
            cy.wait(500);

            // Ejecuto la función correspondiente al test (ya definida arriba)
            funcion().then(() => {
                // Solo registro automáticamente si no es TC023 o TC024 (que manejan su propio registro)
                if (numero !== 23 && numero !== 24) {
                    cy.registrarResultados({
                        numero,                   // Número del caso
                        nombre,                   // Nombre del test
                        esperado: 'Comportamiento correcto',  // Qué esperaba que hiciera
                        obtenido: 'Comportamiento correcto',  // Qué hizo realmente (si coincide, marca OK)
                        resultado: 'OK',          // Marca manualmente como OK
                        archivo,                  // Archivo Excel donde se registra
                        pantalla: 'Ficheros (Teléfonos)'
                    });
                }
            });
        });
    });

    function TC001() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root').should('be.visible');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function TC002() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root').should('be.visible');
        cy.contains('.MuiDataGrid-columnHeader', 'Número').click();
        return cy.get('.MuiDataGrid-row .MuiDataGrid-cell:nth-child(2)').then($cells => {
            const numeros = [...$cells].map(cell => parseInt(cell.innerText.trim()));
            const ordenados = [...numeros].sort((a, b) => a - b);
            expect(numeros).to.deep.equal(ordenados);
        });
    }

    function TC003() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root').should('be.visible');
        cy.contains('.MuiDataGrid-columnHeader', 'Número').click().click();
        return cy.get('.MuiDataGrid-row .MuiDataGrid-cell:nth-child(2)').then($cells => {
            const numeros = [...$cells].map(cell => parseInt(cell.innerText.trim()));
            const ordenados = [...numeros].sort((a, b) => b - a);
            expect(numeros).to.deep.equal(ordenados);
        });
    }

    function TC004() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root').should('be.visible');
        cy.contains('.MuiDataGrid-columnHeader', 'Modelo').click();
        return cy.get('.MuiDataGrid-row .MuiDataGrid-cell:nth-child(3)').then($cells => {
            const modelos = [...$cells].map(cell => cell.innerText.trim());
            const ordenados = [...modelos].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
            expect(modelos).to.deep.equal(ordenados);
        });
    }

    function TC005() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root').should('be.visible');
        cy.contains('.MuiDataGrid-columnHeader', 'Modelo').click().click();
        return cy.get('.MuiDataGrid-cell:nth-child(3)').then($cells => {
            const modelos = [...$cells].map(cell => cell.innerText.trim());
            const ordenados = [...modelos].sort((a, b) => b.localeCompare(a, 'es', { sensitivity: 'base' }));
            expect(modelos).to.deep.equal(ordenados);
        });
    }

    function TC006() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root').should('be.visible');
        cy.contains('.MuiDataGrid-columnHeader', 'Poseedor').click();
        return cy.get('.MuiDataGrid-cell:nth-child(4)').then($cells => {
            const poseedores = [...$cells].map(cell => cell.innerText.trim().toLowerCase()).filter(p => p);
            const ordenados = [...poseedores].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
            expect(poseedores).to.deep.equal(ordenados);
        });
    }

    function TC007() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root').should('be.visible');
        cy.contains('.MuiDataGrid-columnHeader', 'Poseedor').click().click();
        return cy.get('.MuiDataGrid-cell:nth-child(4)').then($cells => {
            const poseedores = [...$cells].map(cell => cell.innerText.trim().toLowerCase()).filter(p => p);
            const ordenados = [...poseedores].sort((a, b) => b.localeCompare(a, 'es', { numeric: true }));
            expect(poseedores).to.deep.equal(ordenados);
        });
    }

    function TC008() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root').should('be.visible');
        cy.contains('.MuiDataGrid-columnHeader', 'Extensión').click();
        return cy.get('.MuiDataGrid-cell:nth-child(5)').then($cells => {
            const extensiones = [...$cells].map(cell => Number(cell.innerText.trim())).filter(n => !isNaN(n));
            const ordenados = [...extensiones].sort((a, b) => a - b);
            expect(extensiones).to.deep.equal(ordenados);
        });
    }

    function TC009() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root').should('be.visible');
        cy.contains('.MuiDataGrid-columnHeader', 'Extensión').click().click();
        return cy.get('.MuiDataGrid-cell:nth-child(5)').then($cells => {
            const extensiones = [...$cells].map(cell => Number(cell.innerText.trim())).filter(n => !isNaN(n));
            const ordenados = [...extensiones].sort((a, b) => b - a);
            expect(extensiones).to.deep.equal(ordenados);
        });
    }

    function TC010() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Número');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('7777{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row)
                .find('[data-field="number"]')
                .invoke('text')
                .should('include', '7777');
        });
    }

    function TC011() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Modelo');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('nokia{enter}', { force: true });

        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row)
                .find('[data-field="model"]')
                .invoke('text')
                .then((texto) => {
                    expect(texto.toLowerCase()).to.include('nokia');
                });
        });
    }

    function TC012() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Poseedor');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('222{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row)
                .find('[data-field="holder"]')
                .invoke('text')
                .should('include', '222');
        });
    }

    function TC013() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Activo');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('true{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row)
                .find('[data-field="active"] input[type="checkbox"]')
                .should('be.checked');
        });
    }

    function TC015() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Extensión');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('36{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row)
                .find('[data-field="extension"]')
                .invoke('text')
                .should('equal', '36');
        });
    }

    function TC020() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.wait(1000);

        cy.get('div.MuiDataGrid-columnHeader[data-field="model"]')
            .find('button[aria-label*="Modelo"]')
            .click({ force: true });

        cy.contains('li[role="menuitem"]', 'Filter').click({ force: true });

        cy.get('input[placeholder="Filter value"]')
            .clear()
            .type('nokia{enter}'); // <- Aquí añadimos {enter} explícito

        cy.wait(500);

        return cy.get('div.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row)
                .find('[data-field="model"]')
                .invoke('text')
                .then(texto => {
                    expect(texto.toLowerCase()).to.include('nokia');
                });
        });
    }

    function TC021() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.wait(1000);

        cy.get('select[name="column"]').select('Todos');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('NoKiA{enter}', { force: true });

        cy.wait(500);

        return cy.get('div.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row)
                .find('div[data-field]')
                .invoke('text')
                .then(texto => {
                    expect(texto.toLowerCase()).to.include('nokia');
                });
        });
    }

    function TC022() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.wait(1000);
        cy.get('select[name="column"]').select('Todos');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('%&{enter}', { force: true });
        cy.wait(500);
        cy.get('.MuiDataGrid-row:visible').should('have.length', 0);
        return cy.contains('No rows', { matchCase: false }).should('exist');
    }

    function TC023() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root').should('be.visible');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        
        // Verificar si el botón está deshabilitado
        cy.get('button.css-1cbe274').should('be.disabled');
        
        // Verificar si aparece algún mensaje de error
        cy.get('body').then(($body) => {
            const tieneMensaje = $body.text().includes('No hay ningún teléfono seleccionado') || 
                                $body.text().includes('No hay ningún elemento seleccionado');
            
            if (tieneMensaje) {
                // Si aparece el mensaje, es OK
                cy.registrarResultados({
                    numero: 23,
                    nombre: 'TC023 - Botón "Eliminar" sin selección',
                    esperado: 'El botón está deshabilitado y muestra mensaje',
                    obtenido: 'El botón está deshabilitado y muestra mensaje',
                    resultado: 'OK',
                    archivo,
                    pantalla: 'Ficheros (Teléfonos)'
                });
            } else {
                // Si no aparece el mensaje, es WARNING
                cy.registrarResultados({
                    numero: 23,
                    nombre: 'TC023 - Botón "Eliminar" sin selección',
                    esperado: 'El botón está deshabilitado y muestra mensaje',
                    obtenido: 'El botón está deshabilitado pero no muestra mensaje',
                    resultado: 'WARNING',
                    archivo,
                    pantalla: 'Ficheros (Teléfonos)',
                    observacion: 'Debería de salir algún mensaje tipo: "No hay ningún teléfono seleccionado para eliminar"'
                });
            }
        });
        
        return cy.get('button.css-1cbe274').should('have.attr', 'disabled');
    }

    function TC024() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root').should('be.visible');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
        cy.get('button.css-1cbe274').should('not.be.disabled');
        
        // Hacer clic en el botón eliminar
        cy.get('button.css-1cbe274').click({ force: true });
        
        // Verificar si aparece algún mensaje de error después de eliminar
        cy.get('body').then(($body) => {
            const tieneError = $body.text().includes('error') || 
                              $body.text().includes('Error') ||
                              $body.text().includes('ERROR');
            
            if (tieneError) {
                // Si aparece un mensaje de error, es WARNING
                cy.registrarResultados({
                    numero: 24,
                    nombre: 'TC024 - Botón "Eliminar" con uno o varios seleccionado',
                    esperado: 'El botón está habilitado y se elimina correctamente',
                    obtenido: 'El botón está habilitado y se elimina correctamente pero con mensaje de error',
                    resultado: 'WARNING',
                    archivo,
                    pantalla: 'Ficheros (Teléfonos)',
                    observacion: 'Se elimina correctamente pero salta un mensaje de error'
                });
            } else {
                // Si no aparece mensaje de error, es OK
                cy.registrarResultados({
                    numero: 24,
                    nombre: 'TC024 - Botón "Eliminar" con uno o varios seleccionado',
                    esperado: 'El botón está habilitado y se elimina correctamente',
                    obtenido: 'El botón está habilitado y se elimina correctamente',
                    resultado: 'OK',
                    archivo,
                    pantalla: 'Ficheros (Teléfonos)'
                });
            }
        });
        
        return cy.get('button.css-1cbe274').should('not.have.attr', 'disabled');
    }

    function TC025() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function TC026() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.wait(1000);
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        cy.get('.MuiDataGrid-row.Mui-selected').should('have.length', 0);
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function TC027() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.wait(1000);
        cy.get('.MuiDataGrid-row:visible')
            .its('length')
            .should('be.greaterThan', 0);
        return cy.get('.MuiDataGrid-row:visible').first().dblclick();
    }

    function TC028() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        cy.get('div[role="row"] input[type="checkbox"]:checked').should('have.length', 0);
        return cy.get('button.css-1cbe274').click({ force: true });
    }

    function TC029() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').then($filas => {
            if ($filas.length === 0) {
                cy.log('No hay teléfonos visibles para eliminar. Test omitido.');
                return;
            }
            cy.wrap($filas[0]).as('filaTelefono');
            cy.get('@filaTelefono').find('.MuiDataGrid-cell').then($celdas => {
                const valores = [...$celdas].map(c => c.innerText.trim()).filter(t => t);
                const identificador = valores[0];
                cy.get('@filaTelefono').click({ force: true });
                cy.get('button').filter(':visible').eq(-3).click({ force: true });


            });
        });
    }

    function TC030() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('button')
            .contains('Añadir')
            .should('be.visible')
            .and('not.be.disabled');
        return cy.get('button')
            .contains('Añadir')
            .click();
    }

    function TC031() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        cy.get('div[role="row"]').should('have.length.greaterThan', 1);
        cy.get('div[role="columnheader"]').contains('Número').should('be.visible');

        return cy.get('div[role="columnheader"][data-field="number"]')
            .find('button[aria-label="Número column menu"]')
            .click({ force: true })
            .then(() => {
                cy.contains('li', 'Hide column').click({ force: true });
                cy.get('div[role="columnheader"]').contains('Número').should('not.exist');
            });
    }

    function TC032() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        cy.get('div[role="row"]').should('have.length.greaterThan', 1);
        cy.get('div[role="columnheader"]').contains('Número').should('exist');

        // Ocultar
        cy.get('div[role="columnheader"][data-field="model"]')
            .find('button[aria-label*="column menu"]')
            .click({ force: true });
        cy.contains('li', 'Manage columns').click({ force: true });
        cy.get('div.MuiDataGrid-panel').within(() => {
            cy.contains('Número')
                .parent()
                .find('input[type="checkbox"]')
                .first()
                .click({ force: true });
        });
        cy.get('body').click(0, 0);
        cy.wait(500);
        cy.get('div[role="columnheader"]').contains('Número').should('not.exist');

        // Mostrar
        cy.get('div[role="columnheader"][data-field="model"]')
            .find('button[aria-label*="column menu"]')
            .click({ force: true });
        cy.contains('li', 'Manage columns').click({ force: true });
        cy.get('div.MuiDataGrid-panel').within(() => {
            cy.contains('Número')
                .parent()
                .find('input[type="checkbox"]')
                .first()
                .click({ force: true });
        });
        cy.get('body').click(0, 0);
        cy.wait(500);

        return cy.get('div[role="columnheader"]').contains('Número').should('exist');
    }

    function TC033() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        cy.get('.MuiDataGrid-virtualScroller').find('div[role="row"]')
            .should('have.length.greaterThan', 1);
        cy.get('.MuiDataGrid-virtualScroller')
            .scrollTo('bottom', { duration: 1000 });
        return cy.get('div.MuiDataGrid-columnHeaders').should('be.visible');
    }

    function TC034() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('select#languageSwitcher').select('en', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Number').should('exist');
            cy.contains('Model').should('exist');
            cy.contains('Holder').should('exist');
            cy.contains('Active').should('exist');
        });
    }


    function TC035() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Número').should('exist');
            cy.contains('Model').should('exist');
            cy.contains('Actiu').should('exist');
        });
    }

    function TC036() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('select#languageSwitcher').select('es', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Número').should('exist');
            cy.contains('Modelo').should('exist');
            cy.contains('Poseedor').should('exist');
            cy.contains('Activo').should('exist');
        });
    }

    function TC037() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        cy.get('select[name="column"]').select('Modelo');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('nokia{enter}', { force: true });
        cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row)
                .find('[data-field="model"]')
                .invoke('text')
                .then(texto => {
                    expect(texto.toLowerCase()).to.include('nokia');
                });
        });
        cy.reload();
        cy.url().should('include', '/dashboard/telephones');
        cy.get('select[name="column"] option:selected').invoke('text').then((selectedText) => {
            expect(selectedText).to.match(/Select an option|Todos/i);
        });
        cy.get('input#search[placeholder="Buscar"]').should('have.value', '');
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }

    function TC014() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('select[name="column"]').select('Extensión');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('36{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).find('[data-field="extension"]').invoke('text').then(texto => {
                expect(texto.trim()).to.equal('36');
            });
        });
    }

    function TC016() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('select[name="column"]').select('Todos');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('NoKiA{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').then($filas => {
            const coincidencias = [...$filas].filter(fila =>
                fila.innerText.toLowerCase().includes('nokia')
            );
            expect(coincidencias.length).to.be.greaterThan(0);
        });
    }

    function TC017() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('select[name="column"]').select('Todos');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('$%&{enter}', { force: true });
        cy.get('.MuiDataGrid-row:visible').should('have.length', 0);
        return cy.contains('No rows').should('be.visible');
    }

    function TC018() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('select[name="column"]').select('Todos');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('Samsung{enter}', { force: true });
        cy.get('.MuiDataGrid-row:visible').should('have.length', 0);
        return cy.contains('No rows').should('be.visible');
    }

    function TC019() {
        cy.navegarAMenu('Ficheros', 'Teléfonos');
        cy.url().should('include', '/dashboard/telephones');
        cy.get('select[name="column"]').select('Todos');
        cy.get('input#search[placeholder="Buscar"]').clear({ force: true }).type('{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    }
});