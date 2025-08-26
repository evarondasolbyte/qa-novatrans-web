describe('PROCESOS > Órdenes de Carga - Validación completa con errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

    const casos = [
        { numero: 1, nombre: 'TC001 - Verificar que se muestran correctamente las órdenes de carga', funcion: tc001 },
        { numero: 2, nombre: 'TC002 - Filtrar por campo "O.C." con coincidencia exacta', funcion: tc002 },
        { numero: 3, nombre: 'TC003 - Filtrar por campo "Proveedor" con coincidencia parcial', funcion: tc003 },
        { numero: 4, nombre: 'TC004 - Filtrar por campo "Lugar" sin coincidencias', funcion: tc004 },
        { numero: 5, nombre: 'TC005 - Filtrar por campo "Ruta" sensible a mayúsculas', funcion: tc005 },
        { numero: 6, nombre: 'TC006 - Ingresar caracteres especiales en el filtro de "Domicilio"', funcion: tc006 },
        { numero: 7, nombre: 'TC007 - Aplicar filtro combinado: "Proveedor" + Fecha desde/hasta', funcion: tc007 },
        { numero: 8, nombre: 'TC008 - Limpiar filtro y verificar recuperación de todos los datos', funcion: tc008 },
        { numero: 9, nombre: 'TC009 - Ingresar Fecha Desde y Fechas Hasta válidas', funcion: tc009 },
        { numero: 10, nombre: 'TC010 - Ingresar solo Fecha Desde', funcion: tc010 },
        { numero: 11, nombre: 'TC011 - Ingresar solo Fecha Hasta', funcion: tc011 },
        { numero: 12, nombre: 'TC012 - Ingresar Fecha Desde mayor que Fecha Hasta', funcion: tc012 },
        { numero: 13, nombre: 'TC013 - Usar formato incorrecto en el campo de fecha', funcion: tc013 },
        { numero: 14, nombre: 'TC014 - Ordenar columna "Fecha" ascendente', funcion: tc014 },
        { numero: 15, nombre: 'TC015 - Ordenar columna "Fecha" descendente', funcion: tc015 },
        { numero: 16, nombre: 'TC016 - Ordenar por columna "Proveedor" alfabéticamente en orden descendente', funcion: tc016 },
        { numero: 17, nombre: 'TC017 - Ordenar columna "O.C." (número) ascendente', funcion: tc017 },
        { numero: 18, nombre: 'TC018 - Aplicar orden y luego un filtro', funcion: tc018 },
        { numero: 19, nombre: 'TC019 - Seleccionar una fila individual', funcion: tc019 },
        { numero: 20, nombre: 'TC020 - Botón "Editar" sin selección', funcion: tc020 },
        { numero: 21, nombre: 'TC021 - Botón "Editar" con una sola fila seleccionada', funcion: tc021 },
        { numero: 22, nombre: 'TC022 - Botón "+ Añadir"', funcion: tc022 },
        { numero: 23, nombre: 'TC023 - Scroll horizontal/vertical', funcion: tc023 },
        { numero: 24, nombre: 'TC024 - Menú de columnas: Sort ASC/DESC', funcion: tc024 },
        { numero: 25, nombre: 'TC025 - Menú de columna: Filter', funcion: tc025 },
        { numero: 26, nombre: 'TC026 - Menú de columna: Hide column', funcion: tc026 },
        { numero: 27, nombre: 'TC027 - Menú de columna: Manage columns', funcion: tc027 },
        { numero: 28, nombre: 'TC028 - Cambiar idioma a Inglés', funcion: tc028 },
        { numero: 29, nombre: 'TC029 - Cambiar idioma a Catalán', funcion: tc029 },
        { numero: 30, nombre: 'TC030 - Cambiar idioma a Español', funcion: tc030 },
        { numero: 31, nombre: 'TC031 - Eliminar con selección', funcion: tc031 },
        { numero: 32, nombre: 'TC032 - Eliminar sin selección', funcion: tc032 },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Procesos (Órdenes de Carga)');
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
                    pantalla: 'Procesos (Órdenes de Carga)'
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
                pantalla: 'Procesos (Órdenes de Carga)'
            });
        });
    });


    // === FUNCIONES POR CASO ===
    function tc001() {
        //Navego usando el menú lateral hasta la opción "Órdenes de Carga - CARGAS / DESCARGAS"
        //Este texto debe coincidir exactamente con el que aparece en el drawer
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');

        //Verifico que la URL sea la esperada
        cy.url().should('include', '/loads-unloads');

        //Validación mínima para asegurar que la pantalla cargó correctamente
        cy.contains('Proveedor').should('exist');
    }

    function tc002() {
        //Primero navego al módulo correcto desde el menú lateral
        //Este comando personalizado me asegura que estoy en la pantalla de Cargas/Descargas
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');

        //Confirmo que la URL realmente haya cambiado al módulo que quiero testear
        cy.url().should('include', '/loads-unloads');

        //Aplico un filtro: selecciono la columna "O.C." en el select de búsqueda
        cy.get('select[name="column"]').select('O.C.');

        //Borro lo que haya en el input de búsqueda y escribo "1700342" con Enter
        //Uso { force: true } porque el campo puede estar tapado por overlays o capas
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('1700342{enter}', { force: true });

        //Ahora valido que el primer resultado visible tenga exactamente "1700342"
        //Uso [data-field="oc"] porque esa celda representa la columna "O.C." en la fila
        cy.get('.MuiDataGrid-row:visible')
            .first()
            .find('div[data-field="oc"]')
            .invoke('text')
            .should('eq', '1700342'); //Confirmo que el contenido sea exactamente ese número
    }

    function tc003() {
        //Accedo a la pantalla de Cargas/Descargas desde el menú lateral
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Aplico el filtro en la columna "Proveedor"
        cy.get('select[name="column"]').select('Proveedor');

        //Escribo "368" en el campo de búsqueda y disparo el filtro con Enter
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('368{enter}', { force: true });

        //Verifico que el primer resultado visible contenga "368" en la celda correspondiente
        cy.get('.MuiDataGrid-row:visible')
            .first()
            .find('div[data-field="provider"]')
            .invoke('text')
            .should('include', '368');
    }

    function tc004() {
        //Accedo al módulo de Cargas/Descargas desde el menú lateral
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Aplico el filtro en la columna "Lugar"
        cy.get('select[name="column"]').select('Lugar');

        //Escribo un valor sin coincidencias (ej: "Marbella") y presiono Enter
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('Marbella{enter}', { force: true });

        //Verifico que no haya filas visibles en la tabla
        cy.get('.MuiDataGrid-row:visible').should('have.length', 0);
    }

    function tc005() {
        //Accedo al módulo de Cargas/Descargas
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Aplico el filtro sobre la columna "Ruta"
        cy.get('select[name="column"]').select('Ruta');

        //Busco con texto en mayúsculas, para comprobar si el filtro es case-insensitive
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('ORIGEN{enter}', { force: true });

        //Verifico que al menos una fila se muestre como resultado
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        //Valido que la columna "Ruta" contenga la palabra "origen" (ignorando mayúsculas)
        cy.get('.MuiDataGrid-row:visible')
            .first()
            .find('div[data-field="route"]')
            .invoke('text')
            .should('match', /origen/i); //insensible a mayúsculas
    }

    function tc006() {
        //Accedo al módulo de Cargas/Descargas
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Aplico el filtro por columna "Domicilio"
        cy.get('select[name="column"]').select('Domicilio');

        //Ingreso caracteres especiales en el filtro
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('$%{enter}', { force: true });

        //Verifico que el sistema no lance errores y simplemente no muestre resultados
        cy.get('.MuiDataGrid-row:visible').should('have.length', 0);
    }

    function tc007() {
        //Navego hasta la pantalla de Cargas/Descargas desde el menú lateral
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Aplico el filtro por columna "Proveedor" escribiendo el valor "368"
        cy.get('select[name="column"]').select('Proveedor');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('368{enter}', { force: true });

        //Modifico el campo de "Fecha desde" — uso los <span> contenteditable que forman el selector
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first() //primer selector de fecha (Fecha desde)
            .within(() => {
                cy.get('span[aria-label="Day"]').clear().type('06');
                cy.get('span[aria-label="Month"]').clear().type('10');
                cy.get('span[aria-label="Year"]').clear().type('2016');
            });

        //Modifico el campo de "Fecha hasta" de la misma forma
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1) //segundo selector (Fecha hasta)
            .within(() => {
                cy.get('span[aria-label="Day"]').clear().type('07');
                cy.get('span[aria-label="Month"]').clear().type('10');
                cy.get('span[aria-label="Year"]').clear().type('2018');
            });

        //Valido que todas las filas visibles cumplan con ambos filtros: proveedor y rango de fechas
        cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).within(() => {
                //Confirmo que la celda de proveedor contenga "368"
                cy.get('div[data-field="provider"]')
                    .invoke('text')
                    .should('contain', '368');

                //Verifico que la fecha esté dentro del rango especificado
                cy.get('div[data-field="date"]')
                    .invoke('text')
                    .then((text) => {
                        //Paso de "dd/mm/yyyy" a objeto Date con "yyyy-mm-dd"
                        const date = new Date(text.split('/').reverse().join('-'));
                        expect(date).to.be.within(
                            new Date('2016-10-06'),
                            new Date('2018-10-07')
                        );
                    });
            });
        });
    }

    function tc008() {
        // Navego al módulo desde el menú lateral
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        // 🔄 Intento limpiar filtros activos solo si existen
        cy.get('body').then(($body) => {
            if ($body.find('div.MuiChip-root').length > 0) {
                cy.get('div.MuiChip-root').each(($chip) => {
                    cy.wrap($chip).find('svg').click({ force: true });
                });
            }
        });

        // Aplico el filtro: selecciono la opción "Todos"
        cy.get('select[name="column"]').select('Todos');

        // Borro cualquier texto en el campo de búsqueda y presiono Enter
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('{enter}', { force: true });

        // Verifico que se muestran filas en la tabla (es decir, se han recuperado todos los datos)
        cy.get('.MuiDataGrid-row:visible', { timeout: 10000 })
            .its('length')
            .should('be.greaterThan', 0);
    }



    function tc009() {
        //Navegar al módulo Cargas/Descargas
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Ingresar fecha desde: 06/10/2016
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first()
            .within(() => {
                cy.get('span[aria-label="Day"]').clear().type('06');
                cy.get('span[aria-label="Month"]').clear().type('10');
                cy.get('span[aria-label="Year"]').clear().type('2016');
            });

        //Ingresar fecha hasta: 07/10/2018
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1)
            .within(() => {
                cy.get('span[aria-label="Day"]').clear().type('07');
                cy.get('span[aria-label="Month"]').clear().type('10');
                cy.get('span[aria-label="Year"]').clear().type('2018');
            });

        //Validar que se muestran registros dentro del rango
        cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).within(() => {
                cy.get('div[data-field="date"]')
                    .invoke('text')
                    .then((text) => {
                        const date = new Date(text.split('/').reverse().join('-')); //dd/mm/yyyy → yyyy-mm-dd
                        expect(date).to.be.within(
                            new Date('2016-10-06'),
                            new Date('2018-10-07')
                        );
                    });
            });
        });
    }

    function tc010() {
        //Navegar al módulo Cargas/Descargas
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Ingresar solo la fecha desde: 06/10/2016
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first()
            .within(() => {
                cy.get('span[aria-label="Day"]').clear().type('06');
                cy.get('span[aria-label="Month"]').clear().type('10');
                cy.get('span[aria-label="Year"]').clear().type('2016');
            });

        //Validar que los registros mostrados tienen fecha >= 06/10/2016
        cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).within(() => {
                cy.get('div[data-field="date"]')
                    .invoke('text')
                    .then((text) => {
                        const date = new Date(text.split('/').reverse().join('-'));
                        expect(date).to.be.gte(new Date('2016-10-06'));
                    });
            });
        });
    }
    function tc011() {
        //Navegar al módulo Cargas/Descargas
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Ingresar solo la fecha hasta: 07/10/2018
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1) //segundo campo (Fecha hasta)
            .within(() => {
                cy.get('span[aria-label="Day"]').clear().type('07');
                cy.get('span[aria-label="Month"]').clear().type('10');
                cy.get('span[aria-label="Year"]').clear().type('2018');
            });

        //Validar que los registros mostrados tienen fecha <= 07/10/2018
        cy.get('.MuiDataGrid-row:visible').each(($row) => {
            cy.wrap($row).within(() => {
                cy.get('div[data-field="date"]')
                    .invoke('text')
                    .then((text) => {
                        const date = new Date(text.split('/').reverse().join('-'));
                        expect(date).to.be.lte(new Date('2018-10-07'));
                    });
            });
        });
    }

    function tc012() {
        //Navegar al módulo Cargas/Descargas
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Ingresar Fecha Desde: 07/06/2022
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .first() //Fecha desde
            .within(() => {
                cy.get('span[aria-label="Day"]').clear().type('07');
                cy.get('span[aria-label="Month"]').clear().type('06');
                cy.get('span[aria-label="Year"]').clear().type('2022');
            });

        //Ingresar Fecha Hasta: 09/05/2018
        cy.get('.MuiPickersInputBase-sectionsContainer')
            .eq(1) //Fecha hasta
            .within(() => {
                cy.get('span[aria-label="Day"]').clear().type('09');
                cy.get('span[aria-label="Month"]').clear().type('05');
                cy.get('span[aria-label="Year"]').clear().type('2018');
            });

        //Validar que no se muestren resultados visibles
        cy.get('.MuiDataGrid-row:visible').should('have.length', 0);

    }

    function tc013() {
        //Ir al menú Órdenes de Carga - CARGAS / DESCARGAS
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Seleccionar el campo "Fecha" desde el combo
        cy.get('select[name="column"]').select('Fecha');

        //Escribir una fecha en formato incorrecto
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('06-11-2017{enter}', { force: true }); //Usa "-" en lugar de "/"

        //Validar que no haya resultados visibles
        cy.get('.MuiDataGrid-row:visible').should('have.length', 0);
    }

    function tc014() {
        //Primero navego al submenú "Órdenes de Carga - CARGAS / DESCARGAS"
        //dentro del módulo "Procesos", y verifico que la URL cargue correctamente.
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Luego, busco la cabecera de la columna "Fecha" en la tabla.
        //Para que se muestre el icono del menú (los tres puntitos),
        //le hago scroll y paso el mouse por encima a la cabecera.
        //Una vez visible, busco el botón correspondiente al menú y hago click.
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha')
            .scrollIntoView()
            .should('be.visible')
            .trigger('mouseover', { force: true })
            .parents('.MuiDataGrid-columnHeader')
            .find('button')
            .eq(1)
            .click({ force: true });

        //Una vez desplegado el menú de opciones de columna,
        //selecciono la opción de orden ascendente ("Sort by ASC").
        cy.get('li[role="menuitem"][data-value="asc"]').click({ force: true });

        //Finalmente, tomo todas las celdas de la columna "Fecha",
        //convierto cada fecha a formato timestamp para poder ordenarlas correctamente,
        //y compruebo que el orden actual de las fechas sea igual al mismo array ordenado ascendentemente.
        cy.get('.MuiDataGrid-cell[data-field="date"]').then($cells => {
            const fechas = [...$cells].map(c =>
                new Date(c.innerText.split('/').reverse().join('-')).getTime()
            );
            expect(fechas).to.deep.equal([...fechas].sort((a, b) => a - b));
        });
    }

    function tc015() {
        //Navego al menú "Órdenes de Carga - CARGAS / DESCARGAS" dentro del módulo "Procesos"
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Hago scroll hasta la cabecera de la columna "Fecha" y me aseguro de que sea visible.
        //Paso el mouse por encima para que aparezca el icono de opciones de columna (los tres puntitos).
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Fecha')
            .scrollIntoView()
            .should('be.visible')
            .trigger('mouseover', { force: true })
            .parents('.MuiDataGrid-columnHeader')
            .find('button')
            .eq(1)
            .click({ force: true });

        //Selecciono la opción "Sort by DESC" (orden descendente) del menú
        cy.get('li[role="menuitem"][data-value="desc"]').click({ force: true });

        //Recojo las fechas de la tabla y verifico que estén ordenadas de forma descendente
        cy.get('.MuiDataGrid-cell[data-field="date"]').then($cells => {
            const fechas = [...$cells].map(c =>
                new Date(c.innerText.split('/').reverse().join('-')).getTime()
            );
            expect(fechas).to.deep.equal([...fechas].sort((a, b) => b - a));
        });
    }

    function tc016() {
        //Navego al menú "Órdenes de Carga - CARGAS / DESCARGAS" desde el módulo "Procesos"
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Hago scroll a la columna "Proveedor", me aseguro de que sea visible
        //y paso el mouse para que aparezca el icono de menú
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'Proveedor')
            .scrollIntoView()
            .should('be.visible')
            .trigger('mouseover', { force: true })
            .parents('.MuiDataGrid-columnHeader')
            .find('button')
            .eq(1)
            .click({ force: true });

        //Selecciono la opción "Sort by DESC" (orden alfabético descendente)
        cy.get('li[role="menuitem"][data-value="desc"]').click({ force: true });

        //Recojo los textos de las celdas de "Proveedor" y valido que estén en orden descendente
        cy.get('.MuiDataGrid-cell[data-field="provider"]').then($cells => {
            const proveedores = [...$cells].map(c => c.innerText.trim().toLowerCase());
            expect(proveedores).to.deep.equal([...proveedores].sort((a, b) => b.localeCompare(a)));
        });
    }

    function tc017() {
        //Ir al menú Órdenes de Carga - CARGAS / DESCARGAS
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Asegura que el icono de menú de la columna "O.C." sea visible pasando el mouse
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'O.C.')
            .scrollIntoView()
            .should('be.visible')
            .trigger('mouseover', { force: true })
            .parents('.MuiDataGrid-columnHeader')
            .find('button')
            .eq(1) //Segundo botón: el del menú de columna
            .click({ force: true });

        //Click en ordenar ascendente
        cy.get('li[role="menuitem"][data-value="asc"]').click({ force: true });

        //Validación ascendente de la columna "O.C." por número
        cy.get('.MuiDataGrid-cell[data-field="oc"]').then($cells => {
            const numeros = [...$cells].map(c => parseInt(c.innerText.trim(), 10));
            expect(numeros).to.deep.equal([...numeros].sort((a, b) => a - b));
        });
    }

    function tc018() {
        //Navegar hasta el módulo de Cargas/Descargas
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Ordenar la columna "O.C." en orden ascendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'O.C.')
            .scrollIntoView()
            .should('be.visible')
            .trigger('mouseover', { force: true })
            .parents('.MuiDataGrid-columnHeader')
            .find('button')
            .eq(1)
            .click({ force: true });

        cy.get('li[role="menuitem"][data-value="asc"]').click({ force: true });

        //los valores de la columna O.C. deben estar ordenados ascendentemente
        cy.get('.MuiDataGrid-cell[data-field="oc"]').then($cells => {
            const valoresOC = [...$cells].map(c => parseInt(c.innerText.trim(), 10));
            expect(valoresOC).to.deep.equal([...valoresOC].sort((a, b) => a - b));
        });

        //Aplicar filtro buscando el valor exacto "3" en la columna O.C.
        cy.get('select[name="column"]').select('O.C.');
        cy.get('input#search[placeholder="Buscar"]')
            .clear({ force: true })
            .type('3{enter}', { force: true });

        //Validar que el filtro funcionó correctamente y que la celda contiene exactamente "3"
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
        cy.get('.MuiDataGrid-row:visible')
            .first()
            .find('div[data-field="oc"]')
            .invoke('text')
            .should('eq', '3');
    }

    function tc019() {
        // Navegar al módulo Cargas/Descargas
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        // Asegurarse de que hay al menos una fila visible
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        // Hacer clic sobre la primera fila para seleccionarla
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });

    }

    function tc020() {
        // Ir a Órdenes de Carga - Cargas/Descargas
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url({ timeout: 15000 }).should('include', '/dashboard/loads-unloads');

        // Asegurarse de que no haya ninguna fila seleccionada
        cy.get('div[role="row"] input[type="checkbox"]:checked').should('have.length', 0);

        // Verificar que el botón "Editar" NO esté visible (porque no hay selección)
        cy.contains('button', 'Editar').should('not.exist');
    }

    function tc021() {
        //Navego a Procesos > Órdenes de Carga - CARGAS / DESCARGAS
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');

        //Verifico que la URL es la correcta
        cy.url({ timeout: 15000 }).should('include', '/dashboard/loads-unloads');

        //Compruebo que hay al menos una fila en la tabla
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        //Alias para evitar problemas con el detach en MUI
        cy.get('.MuiDataGrid-row:visible').first().as('ordenSeleccionada');

        //Selecciono la fila con un clic para estabilizar la selección
        cy.get('@ordenSeleccionada').click({ force: true });

        //Espero un poco para evitar renderizados intermedios
        cy.wait(500);

        //Hago doble clic en la fila para abrir el formulario de edición
        cy.get('@ordenSeleccionada').dblclick({ force: true });

        //Verifico que se abre la pantalla de edición correctamente con un ID dinámico en la URL
        cy.url({ timeout: 10000 }).should('match', /\/dashboard\/loads-unloads\/form\/\d+$/);
    }

    function tc022() {
        //Navego usando el menú lateral hasta la opción "Órdenes de Carga - CARGAS / DESCARGAS"
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');

        //Verifico que la URL sea la esperada
        cy.url().should('include', '/loads-unloads');

        //Verificar existencia y visibilidad del botón "+ Añadir"
        cy.contains('button', 'Añadir')
            .should('exist')
            .and('be.visible')
            .and('not.be.disabled')
            .click();

        //Validar que redirige al formulario de alta
        cy.url().should('include', '/dashboard/loads-unloads/form');

        //Validar que el formulario es nuevo
        cy.get('h5, h6').first().invoke('text').should('include', 'Nueva carga');
    }

    function tc023() {
        //Navegar al módulo
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        //Asegurar que hay al menos una fila
        cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);

        //Scroll vertical recursivo: hasta el final
        const maxScrolls = 10;
        let intentos = 0;

        function hacerScrollVertical(prevHeight = 0) {
            cy.get('.MuiDataGrid-virtualScroller').then($scroller => {
                const currentScrollHeight = $scroller[0].scrollHeight;

                //Si no ha cambiado el scrollHeight, asumimos que hemos llegado al fondo
                if (currentScrollHeight === prevHeight || intentos >= maxScrolls) {
                    cy.log('Fin del scroll vertical');

                    //Validar que las cabeceras siguen visibles
                    cy.get('.MuiDataGrid-columnHeaders')
                        .should('exist')
                        .and($el => {
                            const rect = $el[0].getBoundingClientRect();
                            expect(rect.top).to.be.greaterThan(0);
                            expect(rect.height).to.be.greaterThan(0);
                        });

                    //Scroll horizontal a la derecha
                    cy.get('.MuiDataGrid-virtualScroller').scrollTo('right');

                    //Confirmar cabeceras tras scroll horizontal
                    cy.get('.MuiDataGrid-columnHeaders')
                        .should('exist')
                        .and($el => {
                            const rect = $el[0].getBoundingClientRect();
                            expect(rect.top).to.be.greaterThan(0);
                            expect(rect.height).to.be.greaterThan(0);
                        });

                } else {
                    intentos++;
                    cy.get('.MuiDataGrid-virtualScroller')
                        .scrollTo('bottom', { duration: 400 })
                        .wait(400)
                        .then(() => hacerScrollVertical(currentScrollHeight));
                }
            });
        }

        //Lanzar scroll vertical recursivo
        hacerScrollVertical();
    }

    function tc024() {
        // Navegar hasta el módulo de Cargas/Descargas
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/loads-unloads');

        // Ordenar la columna "O.C." en orden descendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'O.C.')
            .scrollIntoView()
            .should('be.visible')
            .trigger('mouseover', { force: true })
            .parents('.MuiDataGrid-columnHeader')
            .find('button')
            .eq(1)
            .click({ force: true });

        cy.get('li[role="menuitem"][data-value="desc"]').click({ force: true });

        // Verificar orden descendente
        cy.get('.MuiDataGrid-cell[data-field="oc"]', { timeout: 10000 }).then($cells => {
            const valoresOC = [...$cells].map(c => parseInt(c.innerText.trim(), 10));
            const ordenados = [...valoresOC].sort((a, b) => b - a);
            expect(valoresOC).to.deep.equal(ordenados);
        });

        // Ordenar ahora en orden ascendente
        cy.contains('.MuiDataGrid-columnHeaderTitle', 'O.C.')
            .scrollIntoView()
            .should('be.visible')
            .trigger('mouseover', { force: true })
            .parents('.MuiDataGrid-columnHeader')
            .find('button')
            .eq(1)
            .click({ force: true });

        cy.get('li[role="menuitem"][data-value="asc"]').click({ force: true });

        // Verificar orden ascendente
        cy.get('.MuiDataGrid-cell[data-field="oc"]', { timeout: 10000 }).then($cells => {
            const valoresOC = [...$cells].map(c => parseInt(c.innerText.trim(), 10));
            const ordenados = [...valoresOC].sort((a, b) => a - b);
            expect(valoresOC).to.deep.equal(ordenados);
        });
    }

    function tc025() {
        //Entramos directamente en la pantalla de Órdenes de Carga - Cargas/Descargas
        cy.visit('/dashboard/loads-unloads');
        cy.wait(1000); //Doy un pequeño margen para que renderice correctamente

        //Abro el menú de la columna "Lugar"
        cy.get('div.MuiDataGrid-columnHeader[data-field="place"]')
            .find('button[aria-label*="Lugar"]') //Busco el botón del menú contextual de Lugar
            .click({ force: true });

        //Pulso en la opción "Filter" del menú de columna
        cy.contains('li[role="menuitem"]', 'Filter').click({ force: true });

        //Escribo "Malaga" en el input de filtro y doy enter
        cy.get('input[placeholder="Filter value"]')
            .clear() // Limpio por si acaso había un filtro anterior
            .type('Malaga{enter}'); // Aplico el filtro escribiendo "Malaga"

        cy.wait(500);

        //Recorro las filas visibles de la tabla
        cy.get('div[role="row"]').each($row => {
            //De cada fila, saco las celdas
            const $cells = Cypress.$($row).find('div[role="cell"]');

            //Solo valido filas que tengan celdas (ignoro filas vacías o placeholders)
            if ($cells.length > 0) {
                //Me quedo con los textos en minúsculas para comparar sin problemas de mayúsculas/minúsculas
                const textos = [...$cells].map(el => el.innerText.toLowerCase());

                //Compruebo que al menos una celda tenga el texto "malaga"
                expect(textos.some(t => t.includes('malaga'))).to.be.true;
            }
        });
    }

    function tc026() {
        cy.visit('/dashboard/loads-unloads');
        cy.wait(1000);

        //Localizamos el menú de la columna "Lugar"
        cy.get('div.MuiDataGrid-columnHeader[data-field="place"]')
            .find('button[aria-label*="Lugar"]')
            .click({ force: true });

        //Clic en "Hide column" asegurando que sea un item clicable del menú (no un separador ni decorativo).
        cy.get('li.MuiButtonBase-root[role="menuitem"]')
            .contains('Hide column')
            .click({ force: true });


        //Verificamos que la columna "Lugar" ya no está visible
        cy.get('div.MuiDataGrid-columnHeader[data-field="place"]').should('not.exist');

        //También comprobamos que las celdas de la columna "Lugar" han desaparecido de las filas
        cy.get('div[role="row"]').each($row => {
            //Nos aseguramos de que en cada fila ya no haya celdas con data-field="place"
            cy.wrap($row).find('div[data-field="place"]').should('not.exist');
        });
    }

    function tc027() {
        cy.visit('/dashboard/loads-unloads');
        cy.wait(1000);

        //Abrimos el menú de columnas desde cualquier columna, por ejemplo "Proveedor"
        cy.get('div.MuiDataGrid-columnHeader[data-field="provider"]')
            .find('button[aria-label*="Proveedor"]')
            .click({ force: true });

        //Hacemos clic en "Manage columns"
        cy.get('li.MuiButtonBase-root[role="menuitem"]')
            .contains('Manage columns')
            .click({ force: true });

        //Buscamos la opción "Lugar" y marcamos el checkbox si está desmarcado
        cy.get('label.MuiFormControlLabel-root')
            .contains('Lugar')
            .parents('label')
            .find('input[type="checkbox"]')
            .then($checkbox => {
                if (!$checkbox.is(':checked')) {
                    cy.wrap($checkbox).click({ force: true });
                }
            });

        //Comprobamos que la columna Lugar aparece de nuevo en la tabla
        cy.get('div.MuiDataGrid-columnHeaderTitle')
            .contains('Lugar')
            .should('be.visible');
    }

    function tc028() {
        //Navegar a Procesos > Órdenes de carga - Cargas/Descargas
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');

        //Verifica que estamos en la URL correcta
        cy.url().should('include', '/loads-unloads');

        //Cambiar el idioma a inglés
        cy.get('select#languageSwitcher').select('en', { force: true });

        //Validar cabeceras de la tabla en inglés
        cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('O.C.').should('exist');
            cy.contains('Date').should('exist');
            cy.contains('Provider').should('exist');
            cy.contains('Head').should('exist');
            cy.contains('Semi-Trailer').should('exist');
            cy.contains('Route').should('exist');
            cy.contains('Place').should('exist');
        });
    }

    function tc029() {
        //Navegar a Procesos > Órdenes de carga - Cargas/Descargas
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');

        //Verifica que estamos en la URL correcta
        cy.url().should('include', '/loads-unloads');

        //Cambiar el idioma a catalán
        cy.get('select#languageSwitcher').select('ca', { force: true });

        //Validar cabeceras reales en catalán según la interfaz actual
        cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('O.C.').should('exist');
            cy.contains('Data').should('exist');
            cy.contains('Proveïdor').should('exist');
            cy.contains('Ruta').should('exist');
            cy.contains('Lloc').should('exist');
        });

    }

    function tc030() {
        //Navegar al módulo Procesos > Órdenes de carga - Cargas/Descargas
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');

        //Verificar que estamos en la URL correcta
        cy.url().should('include', '/loads-unloads');

        //Cambiar el idioma a Español
        cy.get('select#languageSwitcher').select('es', { force: true });

        //Verificar que las cabeceras de la tabla están en español
        cy.get('.MuiDataGrid-columnHeaders').within(() => {
            cy.contains('O.C.').should('exist');
            cy.contains('Fecha').should('exist');
            cy.contains('Proveedor').should('exist');
        });
    }

    function tc031() {
        const numero = 31;
        const nombre = 'TC031 - Eliminar con selección';
        const pantalla = 'Procesos (Órdenes de Carga)';

        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/dashboard/loads-unloads');
        cy.get('.MuiDataGrid-root').should('be.visible');

        // zona de renderizado real del body (evita headers/skeleton)
        const ZONE = '.MuiDataGrid-virtualScrollerRenderZone';
        const ROWS = `${ZONE} div[role="row"][data-id]`;       // solo filas con data-id (reales)
        const index = 3; // 0-based → 4ª fila

        // asegurar que hay al menos 4 filas
        cy.get(ROWS).should('have.length.greaterThan', index);

        // contar filas antes
        let antes = 0;
        cy.get(ROWS).its('length').then(n => { antes = n; });

        // seleccionar la 4ª fila de forma robusta
        cy.get(ROWS).eq(index).as('fila');
        cy.get('@fila').scrollIntoView();

        // 1) intento preferido: click en la celda de la columna "O.C."
        cy.get('@fila')
            .find('div.MuiDataGrid-cell[data-field="oc"]')
            .should('exist')              // espera a que la celda esté en DOM
            .click({ force: true });

        // 2) fallback si por virtualización no encontró la celda (no rompe si ya clicó arriba)
        cy.get('@fila').then($row => {
            if ($row.find('div.MuiDataGrid-cell[data-field="oc"]').length === 0) {
                cy.wrap($row).click('center', { force: true });
            }
        });

        cy.wait(250);

        // eliminar (no hay confirmación)
        cy.get('button.css-1cbe274').click({ force: true });
        cy.wait(700);

        const MSG_NO_SELECCION = /no hay ningún elemento seleccionado para eliminar/i;
        const MSG_ERROR_ELIMINAR = /error al eliminar la carga\/descarga/i;

        // si aparece toast de error → ERROR; si no, comparamos número de filas
        cy.get('body').then($body => {
            const texto = $body.text();
            if (MSG_NO_SELECCION.test(texto) || MSG_ERROR_ELIMINAR.test(texto)) {
                cy.registrarResultados({
                    numero,
                    nombre,
                    esperado: 'Se elimina correctamente',
                    obtenido: MSG_NO_SELECCION.test(texto)
                        ? 'No hay ningún elemento seleccionado para eliminar'
                        : 'Error al eliminar la carga/descarga',
                    resultado: 'ERROR',
                    pantalla
                });
                return;
            }

            cy.get(ROWS).its('length').then(despues => {
                const ok = despues < antes;
                cy.registrarResultados({
                    numero,
                    nombre,
                    esperado: 'Se elimina correctamente',
                    obtenido: ok ? 'Se elimina correctamente' : 'No se eliminó la fila',
                    resultado: ok ? 'OK' : 'ERROR',
                    pantalla
                });
            });
        });
    }
    // TC032 - Pulsar "Eliminar" sin seleccionar ningún registro
    function tc032() {
        cy.navegarAMenu('Procesos', 'Órdenes de Carga - CARGAS / DESCARGAS');
        cy.url().should('include', '/dashboard/loads-unloads');

        // Asegurar que no hay elementos seleccionados
        cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);

        // Clic en el botón Eliminar
        cy.get('button.css-1cbe274').click({ force: true });

        // Validar mensaje de error esperado
        return cy.contains('No hay ningún elemento seleccionado para eliminar', { timeout: 5000 })
            .should('be.visible');
    }
});