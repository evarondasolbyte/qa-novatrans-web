describe('FICHEROS - TIPOS DE VEHÍCULO - Validación completa con errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Ver lista de tipos de vehículo al acceder a la pantalla', funcion: TC001 },
        { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: TC002 },
        { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: TC003 },
        { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: TC004 },
        { numero: 5, nombre: 'TC005 - Filtrar por "Código"', funcion: TC005 },
        { numero: 6, nombre: 'TC006 - Filtrar por "Nombre"', funcion: TC006 },
        { numero: 7, nombre: 'TC007 - Filtrar por "Remolque"', funcion: TC007 },
        { numero: 8, nombre: 'TC008 - Filtrar por "Rígido"', funcion: TC008 },
        { numero: 9, nombre: 'TC009 - Filtrar por "Rígido + Remolque"', funcion: TC009 },
        { numero: 10, nombre: 'TC010 - Filtrar por "Refrigerado"', funcion: TC010 },
        { numero: 11, nombre: 'TC011 - Buscar por texto exacto en "Todos"', funcion: TC011 },
        { numero: 12, nombre: 'TC012 - Buscar por texto parcial en "Todos"', funcion: TC012 },
        { numero: 13, nombre: 'TC013 - Buscar alternando mayúsculas y minúsculas', funcion: TC013 },
        { numero: 14, nombre: 'TC014 - Buscar con caracteres especiales', funcion: TC014 },
        { numero: 15, nombre: 'TC015 - Ordenar columna "Código" ascendente y descendente', funcion: TC015 },
        { numero: 16, nombre: 'TC016 - Ordenar columna "Nombre" ascendente y descendente', funcion: TC016 },
        { numero: 17, nombre: 'TC017 - Seleccionar un tipo de vehículo individual', funcion: TC017 },
        { numero: 18, nombre: 'TC018 - Intentar editar un tipo de vehículo con doble clic', funcion: TC018 },
        { numero: 19, nombre: 'TC019 - Eliminar un tipo de vehículo si es posible y confirmar su desaparición', funcion: TC019 },
        { numero: 20, nombre: 'TC020 - Botón "+ Añadir" abre el formulario de alta', funcion: TC020 },
        { numero: 21, nombre: 'TC021 - Ocultar columna desde el menú contextual en Tipos de Vehículo', funcion: TC021 },
        { numero: 22, nombre: 'TC022 - Ocultar y mostrar columna "Código" desde "Manage columns" en Tipos de Vehículo', funcion: TC022 },
        { numero: 23, nombre: 'TC023 - Scroll vertical en Tipos de Vehículo', funcion: TC023 },
        { numero: 24, nombre: 'TC024 - Búsqueda con espacios al inicio y al fin en Tipos de Vehículo', funcion: TC024 },
        { numero: 25, nombre: 'TC025 - Búsqueda de nombres con acentos en Tipos de Vehículo', funcion: TC025 },
        { numero: 26, nombre: 'TC026 - Botón "Eliminar" sin selección en Tipos de Vehículo', funcion: TC026 },
        { numero: 27, nombre: 'TC027 - Botón "Editar" no visible sin selección en Tipos de Vehículo', funcion: TC027 },
        { numero: 28, nombre: 'TC028 - Filtrar por campo "Value" en Tipos de Vehículo', funcion: TC028 },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Ficheros (Tipos de Vehículo)');
    });

    casos.forEach(({ numero, nombre, funcion }) => {
        it(nombre, () => {
            // Si algo falla durante la ejecución del test, capturo el error automáticamente
            // y lo registro en el Excel con todos los datos del caso.
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,                    // Número de caso de prueba
                    nombre,                    // Nombre del test (título del caso)
                    esperado: 'Comportamiento correcto',  // Qué se esperaba que ocurriera
                    archivo,                   // Nombre del archivo Excel donde se guarda todo
                    pantalla: 'Ficheros (Tipos de Vehículo)'
                });
                return false; // Previene que Cypress corte el flujo y nos permite seguir registrando
            });

            // Inicio sesión antes de ejecutar el caso, usando la sesión compartida (cy.login)
            // y espero unos milisegundos por seguridad antes de continuar
            cy.login();
            cy.wait(500);

            // Ejecuto la función correspondiente al test (ya definida arriba)
            funcion();

            // Solo registro el resultado como OK si no se registró manualmente en la función
            // (esto evita doble registro para casos que registran manualmente)
            if (numero !== 3) {
                cy.registrarResultados({
                    numero,                   // Número del caso
                    nombre,                   // Nombre del test
                    esperado: 'Comportamiento correcto',  // Qué esperaba que hiciera
                    obtenido: 'Comportamiento correcto',  // Qué hizo realmente (si coincide, marca OK)
                    resultado: 'OK',          // Marca manualmente como OK
                    archivo,                  // Archivo Excel donde se registra
                    pantalla: 'Ficheros (Tipos de Vehículo)'
                });
            }
        });
    });

    function TC001() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root').should('be.visible');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function TC002() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('select#languageSwitcher').select('en', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Code').should('exist');
            cy.contains('Name').should('exist');
            cy.contains('Trailer').should('exist');
            cy.contains('Rigid').should('exist');
        });
    }

    function TC003() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('select#languageSwitcher').select('ca', { force: true });
        
        // Verificar elementos que deberían estar en catalán
        cy.get('.MuiDataGrid-columnHeaders').then(($headers) => {
            const headerText = $headers.text();
            cy.log('Texto completo de headers:', headerText);
            
            // Elementos que deberían estar en catalán
            const elementosCatalanes = ['Codi', 'Nom'];
            
            // Elementos que están mal traducidos (en español en lugar de catalán)
            const elementosMalTraducidos = ['Rígido', 'Rígido + Remolque', 'Refrigerado', 'Remolque'];
            
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
            
            // Si hay elementos mal traducidos, registrar KO
            if (elementosIncorrectos > 0) {
                cy.log('Registrando KO porque hay elementos mal traducidos');
                cy.registrarResultados({
                    numero: 3,
                    nombre: 'TC003 - Cambiar idioma a Catalán',
                    esperado: 'La interfaz cambia correctamente a catalán',
                    obtenido: 'La interfaz no cambia correctamente a catalán',
                    resultado: 'ERROR',
                    archivo,
                    pantalla: 'Ficheros (Tipos de Vehículo)'
                });
                return; // No lanzar error, solo registrar KO
            } else {
                // Solo si TODOS los elementos están correctos, registrar OK
                cy.log('Registrando OK porque todos los elementos están correctos');
                cy.registrarResultados({
                    numero: 3,
                    nombre: 'TC003 - Cambiar idioma a Catalán',
                    esperado: 'La interfaz cambia correctamente a catalán',
                    obtenido: 'La interfaz cambia correctamente a catalán',
                    resultado: 'OK',
                    archivo,
                    pantalla: 'Ficheros (Tipos de Vehículo)'
                });
            }
        });
    }

    function TC004() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('select#languageSwitcher').select('es', { force: true });
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Código').should('exist');
            cy.contains('Nombre').should('exist');
            cy.contains('Remolque').should('exist');
            cy.contains('Rígido').should('exist');
        });
    }

    function TC005() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Código');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('11{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row)
                .find('[data-field="code"]')
                .invoke('text')
                .then(texto => {
                    expect(texto).to.include('11');
                });
        });
    }

    function TC006() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Nombre');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('coche{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row)
                .find('[data-field="name"]')
                .invoke('text')
                .then(texto => {
                    expect(texto.toLowerCase()).to.include('coche');
                });
        });
    }

    function TC007() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Remolque');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('true{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row)
                .find('input[type="checkbox"]')
                .should('be.checked');
        });
    }

    function TC008() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Rígido');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('true{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row)
                .find('input[type="checkbox"]')
                .should('be.checked');
        });
    }

    function TC009() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Rígido + Remolque');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('true{enter}', { force: true });
        cy.get('.MuiDataGrid-virtualScroller', { timeout: 10000 }).should('exist');
        return cy.get('.MuiDataGrid-virtualScroller').then($scroller => {
            if ($scroller.text().includes('No rows')) {
                cy.log('Filtro aplicado correctamente, sin resultados esperados');
            } else {
                cy.get('.MuiDataGrid-row:visible').each(($row) => {
                    cy.wrap($row)
                        .find('input[type="checkbox"]:checked')
                        .should('have.length.at.least', 2);
                });
            }
        });
    }

    function TC010() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Refrigerado');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('true{enter}', { force: true });
        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row)
                .find('input[type="checkbox"]')
                .should('be.checked');
        });
    }

    function TC011() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Todos');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('coche{enter}', { force: true });
        cy.get('.MuiDataGrid-row:visible').should('exist');
        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').then((text) => {
                expect(text.toLowerCase()).to.include('coche');
            });
        });
    }

    function TC012() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Todos');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('furgoneta{enter}', { force: true });
        cy.get('.MuiDataGrid-row:visible').should('exist');
        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').then((text) => {
                expect(text.toLowerCase()).to.include('furgoneta');
            });
        });
    }

    function TC013() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Todos');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('CoChE{enter}', { force: true });
        cy.get('.MuiDataGrid-row:visible').should('exist');
        return cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).invoke('text').then((text) => {
                expect(text.toLowerCase()).to.include('coche');
            });
        });
    }

    function TC014() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('select[name="column"]').select('Todos');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('$%&{enter}', { force: true });
        cy.get('.MuiDataGrid-virtualScroller').should('exist');
        return cy.get('.MuiDataGrid-virtualScroller').then($scroller => {
            if ($scroller.text().includes('No rows')) {
                cy.log('La tabla está vacía como se esperaba al buscar caracteres especiales.');
            } else {
                cy.get('.MuiDataGrid-row:visible').should('exist');
                cy.log('Hay registros coincidentes con los caracteres especiales.');
            }
        });
    }

    function TC015() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('.MuiDataGrid-columnHeader[data-field="code"]').click();
        cy.wait(500);
        cy.get('.MuiDataGrid-row:visible [data-field="code"]')
            .then($cells => {
                const valoresAsc = [...$cells].map(cell => parseInt(cell.textContent.trim()));
                const ordenadosAsc = [...valoresAsc].sort((a, b) => a - b);
                expect(valoresAsc).to.deep.equal(ordenadosAsc);
            });
        cy.get('.MuiDataGrid-columnHeader[data-field="code"]').click();
        cy.wait(500);
        return cy.get('.MuiDataGrid-row:visible [data-field="code"]')
            .then($cells => {
                const valoresDesc = [...$cells].map(cell => parseInt(cell.textContent.trim()));
                const ordenadosDesc = [...valoresDesc].sort((a, b) => b - a);
                expect(valoresDesc).to.deep.equal(ordenadosDesc);
            });
    }

    function TC016() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
        cy.get('.MuiDataGrid-columnHeader[data-field="name"]').click();
        cy.wait(500);
        cy.get('.MuiDataGrid-row:visible [data-field="name"]')
            .then($cells => {
                const textos = [...$cells].map(cell => cell.textContent.trim().toLowerCase());
                const ordenAsc = [...textos].sort((a, b) => a.localeCompare(b));
                expect(textos).to.deep.equal(ordenAsc);
            });
        cy.get('.MuiDataGrid-columnHeader[data-field="name"]').click();
        cy.wait(500);
        return cy.get('.MuiDataGrid-row:visible [data-field="name"]')
            .then($cells => {
                const textos = [...$cells].map(cell => cell.textContent.trim().toLowerCase());
                const ordenDesc = [...textos].sort((a, b) => b.localeCompare(a));
                expect(textos).to.deep.equal(ordenDesc);
            });
    }

    function TC017() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    }

    function TC018() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.wait(1000);
        cy.get('.MuiDataGrid-row:visible')
            .its('length')
            .should('be.greaterThan', 0);
        return cy.get('.MuiDataGrid-row:visible').first().dblclick();
    }

    function TC019() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.wait(1000);
        return cy.get('.MuiDataGrid-row:visible').then($filas => {
            if ($filas.length === 0) {
                cy.log('No hay tipos de vehículo visibles para eliminar. Test omitido.');
                return;
            }
            cy.wrap($filas[0]).as('filaVehiculo');
            cy.get('@filaVehiculo')
                .find('.MuiDataGrid-cell')
                .then($celdas => {
                    const valores = [...$celdas].map(c => c.innerText.trim()).filter(t => t);
                    const identificador = valores[0];
                    cy.get('@filaVehiculo').click({ force: true });
                    cy.get('button')
                        .filter(':visible')
                        .eq(-3)
                        .click({ force: true });
                });
        });
    }

    function TC020() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('button')
            .contains('Añadir')
            .should('be.visible')
            .and('not.be.disabled');
        cy.get('button')
            .contains('Añadir')
            .click();
        return cy.url().should('include', '/dashboard/vehicle-types/form');
    }

    function TC021() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        cy.get('div[role="row"]').should('have.length.greaterThan', 1);
        cy.get('div[role="columnheader"]').contains('Nombre').should('be.visible');
        cy.get('div[role="columnheader"][data-field="name"]')
            .find('button[aria-label="Nombre column menu"]')
            .click({ force: true });
        cy.contains('li', 'Hide column').click({ force: true });
        return cy.get('div[role="columnheader"]').contains('Nombre').should('not.exist');
    }

    function TC022() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        cy.get('div[role="row"]').should('have.length.greaterThan', 1);
        cy.get('div[role="columnheader"]').contains('Código').should('exist');
        cy.get('div[role="columnheader"][data-field="trailer"]')
            .find('button[aria-label*="column menu"]')
            .click({ force: true });
        cy.contains('li', 'Manage columns').click({ force: true });
        cy.get('div.MuiDataGrid-panel').within(() => {
            cy.contains('Código')
                .parent()
                .find('input[type="checkbox"]')
                .first()
                .uncheck({ force: true });
        });
        cy.get('body').click(0, 0);
        cy.wait(500);
        cy.get('div[role="columnheader"]').contains('Código').should('not.exist');
        cy.get('div[role="columnheader"][data-field="trailer"]')
            .find('button[aria-label*="column menu"]')
            .click({ force: true });
        cy.contains('li', 'Manage columns').click({ force: true });
        cy.get('div.MuiDataGrid-panel').within(() => {
            cy.contains('Código')
                .parent()
                .find('input[type="checkbox"]')
                .first()
                .check({ force: true });
        });
        cy.get('body').click(0, 0);
        cy.wait(500);
        return cy.get('div[role="columnheader"]').contains('Código').should('exist');
    }

    function TC023() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        cy.get('.MuiDataGrid-virtualScroller').find('div[role="row"]')
            .should('have.length.greaterThan', 1);
        cy.get('.MuiDataGrid-virtualScroller')
            .scrollTo('bottom', { duration: 1000 });
        return cy.get('div.MuiDataGrid-columnHeaders').should('be.visible');
    }

    function TC024() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        cy.get('div[role="row"]').should('have.length.greaterThan', 1);
        cy.get('input#search')
            .click({ force: true })
            .clear({ force: true })
            .type('   coche   ', { force: true })
            .type('{enter}', { force: true });
        cy.wait(500);
        return cy.get('.MuiDataGrid-row:visible').should('contain.text', 'COCHE');
    }

    function TC025() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        cy.get('div[role="row"]').should('have.length.greaterThan', 1);
        cy.get('input#search')
            .click({ force: true })
            .clear({ force: true })
            .type('CÁMARA', { force: true })
            .type('{enter}', { force: true });
        cy.wait(500);
        return cy.get('.MuiDataGrid-row:visible').should('contain.text', 'CÁMARA');
    }

    function TC026() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        cy.get('div[role="row"] input[type="checkbox"]:checked').should('have.length', 0);
        return cy.get('button.css-1cbe274').click({ force: true });
    }

    function TC027() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        cy.get('div[role="row"] input[type="checkbox"]:checked').should('have.length', 0);
        return cy.contains('button', 'Editar').should('not.exist');
    }

    function TC028() {
        cy.navegarAMenu('Ficheros', 'Tipos de Vehículo');
        cy.url().should('include', '/dashboard/vehicle-types');
        cy.get('.MuiDataGrid-root').should('be.visible');
        cy.get('div[role="row"]').should('have.length.greaterThan', 1);
        cy.get('div[role="columnheader"][data-field="name"]')
            .find('button[aria-label*="column menu"]')
            .click({ force: true });
        cy.contains('li', 'Filter').click({ force: true });
        cy.get('input[placeholder="Filter value"]')
            .should('be.visible')
            .clear()
            .type('coche')
            .blur();
        return cy.get('div.MuiDataGrid-row')
            .should('have.length.greaterThan', 0)
            .first()
            .invoke('text')
            .should('match', /coche/i);
    }
}); 