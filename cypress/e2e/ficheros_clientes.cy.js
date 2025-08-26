describe('CLIENTES - Validación completa con gestión de errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    // Defino todos los casos con su número, nombre descriptivo y la función que ejecuta la validación
    const casos = [
        { numero: 1, nombre: 'TC001 - Ver lista de clientes', funcion: verListaClientes },
        { numero: 2, nombre: 'TC002 - Verificar columnas de la tabla', funcion: verificarColumnas },
        { numero: 4, nombre: 'TC004 - Buscar cliente por nombre', funcion: buscarPorNombre },
        { numero: 7, nombre: 'TC007 - Buscar cliente por NIF', funcion: buscarPorNIF },
        { numero: 12, nombre: 'TC012 - Editar cliente', funcion: editarCliente },
        { numero: 19, nombre: 'TC019 - Scroll lateral y vertical', funcion: scrollBuscarCodigo },
        { numero: 20, nombre: 'TC020 - Tabla responde al cambiar idioma', funcion: cambiarIdiomaClientes },
        { numero: 21, nombre: 'TC021 - Aplicar multifiltro por Nombre + condición Contenga', funcion: filtrarNombreContenga },
        { numero: 22, nombre: 'TC022 - Filtrar por Teléfono con condición >=', funcion: filtrarTelefono },
        { numero: 23, nombre: 'TC023 - Filtrar por Notas con condición Empiece Por', funcion: filtrarNotasEmpiece },
        { numero: 24, nombre: 'TC024 - Búsqueda con valor inexistente', funcion: buscarNotasInexistente },
        { numero: 26, nombre: 'TC026 - Marcar un cliente', funcion: marcarUnCliente },
        { numero: 33, nombre: 'TC033 - Ingresar caracteres inválidos en búsqueda', funcion: buscarCaracteresInvalidos },
        { numero: 34, nombre: 'TC034 - Ordenar por columna Código ascendente', funcion: ordenarCodigoAsc },
        { numero: 35, nombre: 'TC035 - Ordenar por columna Código descendente', funcion: ordenarCodigoDesc },
        { numero: 36, nombre: 'TC036 - Ordenar por Nombre ascendente', funcion: ordenarNombreAsc },
        { numero: 37, nombre: 'TC037 - Ordenar por Teléfono numéricamente', funcion: ordenarTelefonoDesc },
        { numero: 38, nombre: 'TC038 - Aplicar filtro desde opción Filter en NIF/CIF', funcion: filtrarNIF },
        { numero: 39, nombre: 'TC039 - Filtrar por Email desde su columna', funcion: filtrarEmail },
        { numero: 40, nombre: 'TC040 - Ocultar columna Teléfono', funcion: ocultarColumnaTelefono },
        { numero: 41, nombre: 'TC041 - Mostrar columna oculta desde Manage columns', funcion: mostrarColumnaTelefono },
        { numero: 42, nombre: 'TC042 - Ordenar por columna Código desde el icono de orden', funcion: ordenarCodigoIcono },
        { numero: 43, nombre: 'TC043 - Pulsar + Añadir', funcion: abrirFormulario },
        { numero: 44, nombre: 'TC044 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan },
        { numero: 45, nombre: 'TC045 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Ficheros (Clientes)');
    });

    casos.forEach(({ numero, nombre, funcion }) => {
        it(nombre, () => {
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    archivo,
                    pantalla: 'Ficheros (Clientes)'
                });
                return false;
            });

            cy.login();
            cy.wait(500);

            funcion().then(() => {
                cy.registrarResultados({
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    obtenido: 'Comportamiento correcto',
                    archivo,
                    pantalla: 'Ficheros (Clientes)'
                });
            });
        });
    });


    // === FUNCIONES DE VALIDACIÓN ===
    function verListaClientes() {
        cy.navegarAMenu('Ficheros', 'Clientes');
        cy.url().should('include', '/dashboard/clients');
        return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
    }

    function verificarColumnas() {
        cy.navegarAMenu('Ficheros', 'Clientes');
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Código').should('exist');
            cy.contains('NIF/CIF').should('exist');
            cy.contains('Nombre').should('exist');
            cy.contains('Email').should('exist');
        });
    }

    function buscarPorNombre() {
        cy.navegarAMenu('Ficheros', 'Clientes');
        cy.get('div.MuiFormControl-root').first().click();
        cy.contains('li', 'Nombre').click();
        cy.get('input[placeholder="Buscar..."]').type('AYTO');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function buscarPorNIF() {
        cy.navegarAMenu('Ficheros', 'Clientes');
        cy.get('div.MuiFormControl-root').first().click();
        cy.contains('li', 'NIF/CIF').click();
        cy.get('input[placeholder="Buscar..."]').type('P37');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function editarCliente() {
        // Navegar al módulo de clientes
        cy.navegarAMenu('Ficheros', 'Clientes');
        cy.url().should('include', '/dashboard/clients');

        // Asegurarse de que hay filas visibles
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        // Tomar la primera fila visible como alias
        cy.get('.MuiDataGrid-row:visible').first().as('filaCliente');

        // Hacer clic para seleccionar la fila (requerido por el sistema)
        cy.get('@filaCliente').click({ force: true });

        // Esperar brevemente por estabilidad
        cy.wait(500);

        // Hacer doble clic específicamente en la celda con data-field="id"
        cy.get('@filaCliente')
            .find('div[data-field="id"]')
            .dblclick({ force: true });

        // Verificar que se abrió el formulario con ID en la URL
        return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/clients\/form\/\d+$/);

    }

    function scrollBuscarCodigo() {
        cy.navegarAMenu('Ficheros', 'Clientes');
        return cy.get('body').then(($body) => {
            if ($body.text().includes('ES3722500J')) {
                cy.contains('ES3722500J').scrollIntoView().should('be.visible');
            }
        });
    }

    function cambiarIdiomaClientes() {
        cy.navegarAMenu('Ficheros', 'Clientes');
        cy.url().should('include', '/dashboard/clients');

        cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Código').should('exist');
            cy.contains('Nombre').should('exist');
        });

        cy.get('select#languageSwitcher').select('en', { force: true });
        cy.wait(1500);

        //DEVOLVER cadena
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Code').should('exist');
            cy.contains('Name').should('exist');
        });
    }

    function filtrarNombreContenga() {
        cy.navegarAMenu('Ficheros', 'Clientes');
        cy.get('div[role="combobox"]').eq(0).click();
        cy.contains('li', 'Nombre').click();
        cy.get('select[name="search-filter-selector"]').select('Contenga');
        cy.get('input[placeholder="Buscar..."]').type('colegio');
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function filtrarTelefono() {
        cy.navegarAMenu('Ficheros', 'Clientes');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/clients');

        cy.get('div[role="combobox"]').eq(0).click();
        cy.get('ul[role="listbox"] li').then(($items) => {
            const telefonoOption = [...$items].find((el) => {
                const normalizado = el.textContent?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                return normalizado === 'Telefono';
            });
            expect(telefonoOption, 'Opción "Teléfono" encontrada').to.exist;
            cy.wrap(telefonoOption).scrollIntoView().click({ force: true });
        });

        cy.get('.MuiBackdrop-root').should('not.exist');
        cy.get('select[name="search-filter-selector"]').should('exist').select('>=', { force: true });
        cy.get('input[placeholder="Buscar..."]').clear().type('923');
        cy.wait(1000);

        //DEVOLVER cadena (validación final)
        return cy.get('.MuiDataGrid-row').each(($row) => {
            cy.wrap($row).within(() => {
                cy.get('[data-field="phoneNumber"]')
                    .invoke('text')
                    .then((telefono) => {
                        const numerico = parseInt(telefono.replace(/\D/g, ''), 10);
                        expect(numerico, `Teléfono mostrado: ${telefono}`).to.be.at.least(923);
                    });
            });
        });
    }
    function filtrarNotasEmpiece() {
        cy.navegarAMenu('Ficheros', 'Clientes');

        // Seleccionar campo "Notas"
        cy.get('div[role="combobox"]').eq(0).click();
        cy.get('ul[role="listbox"] li').then(($items) => {
            const opcionNotas = [...$items].find((el) => {
                const texto = el.textContent?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                return texto === 'Notas';
            });
            expect(opcionNotas, 'Opción "Notas" encontrada').to.exist;
            cy.wrap(opcionNotas).scrollIntoView().click({ force: true });
        });

        // Esperar a que desaparezca backdrop
        cy.get('.MuiBackdrop-root').should('not.exist');

        // Seleccionar opción que contenga "empiece"
        cy.get('select[name="search-filter-selector"]')
            .should('exist')
            .find('option')
            .then(($options) => {
                const opcion = [...$options].find((o) =>
                    o.textContent?.trim().toLowerCase().includes('empiece')
                );
                expect(opcion, 'Opción "Empiece por" encontrada').to.exist;
                cy.get('select[name="search-filter-selector"]').select(opcion.value, { force: true });
            });

        // Escribir filtro
        cy.get('input[placeholder="Buscar..."]').clear().type('Rosa');

        // Esperar a que aparezcan los resultados
        return cy.get('.MuiDataGrid-row').should('exist');
    }

    function buscarNotasInexistente() {
        cy.navegarAMenu('Ficheros', 'Clientes');

        // Seleccionar opción "Notas" del selector de campo
        cy.get('div[role="combobox"]').eq(0).click();
        cy.get('ul[role="listbox"] li').then(($items) => {
            const opcionNotas = [...$items].find((el) => {
                const texto = el.textContent?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                return texto === 'Notas';
            });
            expect(opcionNotas, 'Opción "Notas" encontrada').to.exist;
            cy.wrap(opcionNotas).scrollIntoView().click({ force: true });
        });

        // Esperar que desaparezca el backdrop de selección
        cy.get('.MuiBackdrop-root').should('not.exist');

        // Escribir el filtro en el input de búsqueda
        cy.get('input[placeholder="Buscar..."]').clear().type('365');

        // Verificar que no hay resultados en la tabla
        return cy.get('.MuiDataGrid-row').should('not.exist');
    }

    function buscarCaracteresInvalidos() {
        cy.navegarAMenu('Ficheros', 'Clientes');

        // Espera a que el input de búsqueda esté visible (por placeholder o tipo)
        cy.get('input[type="search"], input[placeholder*="Buscar"]', { timeout: 10000 }).should('be.visible');

        // Escribe caracteres inválidos
        cy.get('input[type="search"], input[placeholder*="Buscar"]').type('&%$');

        // Verifica que la tabla siga visible
        return cy.get('.MuiDataGrid-root').should('be.visible');
    }


    function ordenarCodigoAsc() {
        cy.navegarAMenu('Ficheros', 'Clientes');

        // Esperar a que aparezca la tabla
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Simular hover sobre la cabecera de "Código" para mostrar el botón del menú
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        // Forzar clic sobre el botón de menú que puede estar oculto
        cy.get('[aria-label="Código column menu"]').click({ force: true });

        // Seleccionar orden ascendente
        cy.get('li[data-value="asc"]').contains('Sort by ASC').click({ force: true });

        // Espera opcional para que se aplique el orden
        return cy.wait(1000);
    }
    function ordenarCodigoDesc() {
        cy.navegarAMenu('Ficheros', 'Clientes');

        // Esperar a que aparezca la tabla
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');

        // Simular hover sobre la cabecera de "Código" para que se muestre el botón del menú
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
            .parents('[role="columnheader"]')
            .trigger('mouseover');

        // Forzar clic en el botón del menú de columna
        cy.get('[aria-label="Código column menu"]').click({ force: true });

        // Seleccionar orden descendente
        cy.get('li[data-value="desc"]').contains('Sort by DESC').click({ force: true });

        return cy.wait(1000); // Espera a que se apliquen los cambios
    }

    function ordenarNombreAsc() {
        cy.navegarAMenu('Ficheros', 'Clientes');

        // Hacer hover sobre la cabecera para activar el botón de menú
        cy.get('div[data-field="companyName"][role="columnheader"]').trigger('mouseover');

        // Forzar clic en el botón de menú de columna
        cy.get('div[data-field="companyName"] .MuiDataGrid-menuIconButton').click({ force: true });

        // Seleccionar orden ascendente
        cy.get('li[data-value="asc"]').contains('Sort by ASC').click({ force: true });

        return cy.wait(1000);
    }

    function ordenarTelefonoDesc() {
        cy.navegarAMenu('Ficheros', 'Clientes');

        // Hacer hover sobre la cabecera de "Teléfono"
        cy.get('div[data-field="phoneNumber"][role="columnheader"]').trigger('mouseover');

        // Clic forzado en el botón de menú
        cy.get('div[data-field="phoneNumber"] .MuiDataGrid-menuIconButton').click({ force: true });

        // Seleccionar orden descendente
        cy.get('li[data-value="desc"]').contains('Sort by DESC').click({ force: true });

        return cy.wait(1000);
    }


    function filtrarNIF() {
        cy.navegarAMenu('Ficheros', 'Clientes');

        cy.get('div[data-field="nif"][role="columnheader"]')
            .trigger('mouseover')
            .find('button.MuiButtonBase-root').eq(1)
            .click({ force: true });

        cy.get('li').contains('Filter').click({ force: true });

        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('A');

        return cy.wait(1000);
    }

    function filtrarEmail() {
        cy.navegarAMenu('Ficheros', 'Clientes');

        cy.get('div[data-field="email"][role="columnheader"]')
            .trigger('mouseover')
            .find('button.MuiButtonBase-root').eq(1)
            .click({ force: true });

        cy.get('li').contains('Filter').click({ force: true });

        cy.get('input[placeholder="Filter value"]')
            .should('exist')
            .clear()
            .type('email');

        return cy.wait(1000);
    }


    function ocultarColumnaTelefono() {
        cy.navegarAMenu('Ficheros', 'Clientes');

        cy.get('div[data-field="phoneNumber"][role="columnheader"]')
            .trigger('mouseover')
            .find('button.MuiButtonBase-root').eq(1)
            .click({ force: true });

        cy.get('li').contains('Hide column').click({ force: true });

        return cy.get('div.MuiDataGrid-columnHeaders')
            .should('be.visible')
            .within(() => {
                cy.contains('Teléfono').should('not.exist');
            });
    }


    function mostrarColumnaTelefono() {
        cy.navegarAMenu('Ficheros', 'Clientes');

        cy.get('div[data-field="name"][role="columnheader"]')
            .trigger('mouseover')
            .find('button.MuiButtonBase-root').eq(1)
            .click({ force: true });

        cy.get('li').contains('Manage columns').click({ force: true });

        cy.get('.MuiDataGrid-panel')
            .should('be.visible')
            .find('label')
            .contains('Teléfono')
            .parents('label')
            .find('input[type="checkbox"]')
            .check({ force: true });

        return cy.get('div[data-field="phoneNumber"][role="columnheader"]')
            .scrollIntoView()
            .should('exist')
            .and('be.visible');
    }


    function ordenarCodigoIcono() {
        cy.navegarAMenu('Ficheros', 'Clientes');

        // Esperar a que se cargue la tabla y exista al menos una fila con "id"
        cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
        cy.get('.MuiDataGrid-row .MuiDataGrid-cell[data-field="id"]', { timeout: 10000 }).should('exist');

        // Hacer clic sobre el encabezado de la columna Código (id)
        cy.get('div.MuiDataGrid-columnHeader[data-field="id"]')
            .should('be.visible')
            .click();

        // Esperar breve
        return cy.wait(1000);
    }

    function abrirFormulario() {
        cy.navegarAMenu('Ficheros', 'Clientes');
        cy.get('button.css-1y72v2k').click();
        return cy.get('form').should('be.visible');
    }

    function cambiarIdiomaCatalan() {
        cy.navegarAMenu('Ficheros', 'Clientes');
        cy.url().should('include', '/dashboard/clients');

        cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Código').should('exist');
            cy.contains('Nombre').should('exist');
        });

        cy.get('select#languageSwitcher').select('ca', { force: true });
        cy.wait(1500);

        //DEVOLVER cadena
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Codi').should('exist');
            cy.contains('Nom').should('exist');
            cy.contains('Correu electrònic').should('exist');
        });
    }

    function cambiarIdiomaEspanol() {
        cy.navegarAMenu('Ficheros', 'Clientes');
        cy.url().should('include', '/dashboard/clients');

        cy.get('select#languageSwitcher').select('es', { force: true });
        cy.wait(1500);

        //DEVOLVER cadena
        return cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('Código').should('exist');
            cy.contains('Nombre').should('exist');
            cy.contains('Email').should('exist');
        });
    }

    // === FUNCIONES ADICIONALES PARA LOS NUEVOS CASOS ===
    
    function marcarUnCliente() {
        cy.navegarAMenu('Ficheros', 'Clientes');
        // Implementar selección de cliente
        return cy.get('.MuiDataGrid-row.Mui-selected').should('exist');
    }
});