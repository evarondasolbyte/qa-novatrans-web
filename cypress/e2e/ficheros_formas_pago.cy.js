describe('FORMAS DE PAGO - Validación completa con gestión de errores y reporte a Excel', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';

  const casos = [
    { numero: 1, nombre: 'TC001 - Cargar la pantalla de formas de pago correctamente', funcion: cargarPantallaFormasPago },
    { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles },
    { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan },
    { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol },
    { numero: 5, nombre: 'TC005 - Aplicar filtro por columna "Código"', funcion: filtrarPorCodigo },
    { numero: 6, nombre: 'TC006 - Aplicar filtro por columna "Referencia"', funcion: filtrarPorReferencia },
    { numero: 7, nombre: 'TC007 - Aplicar filtro por columna "Descripción"', funcion: filtrarPorDescripcion },
    { numero: 8, nombre: 'TC008 - Aplicar filtro por columna "Días para pago"', funcion: filtrarPorDiasPago },
    { numero: 9, nombre: 'TC009 - Buscar por texto exacto en buscador', funcion: buscarTextoExacto },
    { numero: 10, nombre: 'TC010 - Buscar por texto parcial en buscador', funcion: buscarTextoParcial },
    { numero: 11, nombre: 'TC011 - Buscar ignorando mayúsculas y minúsculas', funcion: buscarAlternandoMayusculas },
    { numero: 12, nombre: 'TC012 - Buscar con espacios al inicio y fin', funcion: buscarConEspacios },
    { numero: 13, nombre: 'TC013 - Buscar con caracteres especiales', funcion: buscarCaracteresEspeciales },
    { numero: 14, nombre: 'TC014 - Ordenar columna "Código" ascendente/descendente', funcion: ordenarCodigo },
    { numero: 15, nombre: 'TC015 - Ordenar columna "Referencia" ascendente/descendente', funcion: ordenarReferencia },
    { numero: 16, nombre: 'TC016 - Seleccionar una fila', funcion: seleccionarFila },
    { numero: 17, nombre: 'TC017 - Botón "Editar" con una fila seleccionada', funcion: editarFormaPago },
    { numero: 18, nombre: 'TC018 - Botón "Eliminar" con varias filas seleccionadas', funcion: eliminarFormaPago },
    { numero: 19, nombre: 'TC019 - Botón "Editar" sin ninguna fila seleccionada', funcion: editarSinSeleccion },
    { numero: 20, nombre: 'TC020 - Botón "Eliminar" sin ninguna fila seleccionada', funcion: eliminarSinSeleccion },
    { numero: 21, nombre: 'TC021 - Botón "+ Añadir" abre formulario de alta', funcion: abrirFormularioAlta },
    { numero: 22, nombre: 'TC022 - Ocultar columna desde el menú contextual', funcion: ocultarColumna },
    { numero: 23, nombre: 'TC023 - Gestionar visibilidad desde "Manage columns"', funcion: gestionarColumnas },
    { numero: 24, nombre: 'TC024 - Scroll vertical en la tabla', funcion: scrollVertical },
    { numero: 25, nombre: 'TC025 - Recargar página y verificar reinicio de filtros', funcion: recargarPagina },
    { numero: 26, nombre: 'TC026 - Aplicar filtro con valor inexistente', funcion: filtrarValorInexistente },
    { numero: 27, nombre: 'TC027 - Validar opción de "Todos" en filtro', funcion: validarOpcionTodos },
    { numero: 28, nombre: 'TC028 - Filtrar por campo "Value"', funcion: filtrarPorValue },
  ];

  after(() => {
    cy.log('Procesando resultados finales para Ficheros (Formas de Pago)');
    cy.wait(1000);
    cy.procesarResultadosPantalla('Ficheros (Formas de Pago)');
  });

  casos.forEach(({ numero, nombre, funcion }) => {
    it(nombre, () => {
      // Reset de flags por test (evita doble registro)
      cy.resetearFlagsTest();

      // Captura de errores y registro
      cy.on('fail', (err) => {
        cy.capturarError(nombre, err, {
          numero,
          nombre,
          esperado: 'Comportamiento correcto',
          archivo,
          pantalla: 'Ficheros (Formas de Pago)',
        });
        return false; // dejamos que continúe el flujo de comandos/registro
      });

      cy.login();
      cy.wait(500);

      // Ejecutar la función y sólo auto-OK si nadie registró antes
      return funcion().then(() => {
        cy.wait(500);
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
              pantalla: 'Ficheros (Formas de Pago)',
            });
          }
        });
      });
    });
  });

  // === FUNCIONES DE VALIDACIÓN ===
  function cargarPantallaFormasPago() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('exist');
    cy.wait(1000);
    return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
  }

  function cambiarIdiomaIngles() {
    cy.visit('/dashboard');
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('select#languageSwitcher').select('en', { force: true });
    return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
  }

  function cambiarIdiomaCatalan() {
    cy.visit('/dashboard');
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('select#languageSwitcher').select('ca', { force: true });
    return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
  }

  function cambiarIdiomaEspanol() {
    cy.visit('/dashboard');
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('select#languageSwitcher').select('es', { force: true });
    return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist');
  }

  function filtrarPorCodigo() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');

    cy.get('select[name="column"]').should('be.visible').select('Código', { force: true });
    cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('10{enter}', { force: true });

    cy.wait(1000);

    // Registro MANUAL (OK/ERROR) -> bloquea el auto-OK del final
    return cy.get('body').then($body => {
      if ($body.find('.MuiDataGrid-row:visible').length === 0) {
        cy.registrarResultados({
          numero: 5,
          nombre: 'TC005 - Aplicar filtro por columna "Código"',
          esperado: 'Comportamiento correcto',
          obtenido: 'No se encontraron filas con Código = 10 y sí debería haber',
          resultado: 'ERROR',
          pantalla: 'Ficheros (Formas de Pago)',
          archivo
        });
      } else {
        cy.registrarResultados({
          numero: 5,
          nombre: 'TC005 - Aplicar filtro por columna "Código"',
          esperado: 'Comportamiento correcto',
          obtenido: 'Comportamiento correcto',
          resultado: 'OK',
          pantalla: 'Ficheros (Formas de Pago)',
          archivo
        });
      }
    });
  }

  function filtrarPorReferencia() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('select[name="column"]').should('be.visible').select('Referencia', { force: true });
    cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('369{enter}', { force: true });
    return cy.get('.MuiDataGrid-row:visible').each(($row) => {
      cy.wrap($row).invoke('text').should('include', '369');
    });
  }

  function filtrarPorDescripcion() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('select[name="column"]').should('be.visible').select('Descripción', { force: true });
    cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('días{enter}', { force: true });
    return cy.get('.MuiDataGrid-row:visible').each(($row) => {
      const rowText = $row.text().toLowerCase();
      expect(rowText).to.include('días');
    });
  }

  function filtrarPorDiasPago() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('select[name="column"]').should('be.visible').select('Días para pago', { force: true });
    cy.get('input[placeholder="Buscar"]').clear({ force: true }).type('120{enter}', { force: true });
    return cy.get('.MuiDataGrid-row:visible').each(($row) => {
      cy.wrap($row).invoke('text').should('include', '120');
    });
  }

  function buscarTextoExacto() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.get('input[placeholder="Buscar"]').type('{selectall}{backspace}reposición 120 días{enter}', { force: true });
    return cy.get('.MuiDataGrid-row:visible').should('exist');
  }

  function buscarTextoParcial() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.get('input[placeholder="Buscar"]').type('{selectall}{backspace}pagaré{enter}', { force: true });
    return cy.get('.MuiDataGrid-row:visible').should('exist');
  }

  function buscarAlternandoMayusculas() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.get('input[placeholder="Buscar"]').type('{selectall}{backspace}RePoSiCiÓn{enter}', { force: true });
    return cy.get('.MuiDataGrid-row:visible').should('exist');
  }

  function buscarConEspacios() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.get('input[placeholder="Buscar"]').type('{selectall}{backspace}   reposición    {enter}', { force: true });
    return cy.get('.MuiDataGrid-row:visible').should('exist');
  }

  function buscarCaracteresEspeciales() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.get('input[placeholder="Buscar"]').type('{selectall}{backspace}$%&{enter}', { force: true });
    cy.wait(500);
    return cy.contains('No rows', { timeout: 3000 }).should('be.visible');
  }

  function ordenarCodigo() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').should('be.visible').click();
    cy.wait(1000);
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').should('be.visible').click();
    return cy.get('.MuiDataGrid-row').should('exist');
  }

  function ordenarReferencia() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Referencia').should('be.visible').click();
    cy.wait(1000);
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Referencia').should('be.visible').click();
    return cy.get('.MuiDataGrid-row').should('exist');
  }

  function seleccionarFila() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
  }

  function editarFormaPago() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
    cy.get('.MuiDataGrid-row:visible').first().as('filaFormaPago');
    cy.get('@filaFormaPago').click({ force: true });
    cy.wait(500);
    cy.get('@filaFormaPago').dblclick({ force: true });
    return cy.url({ timeout: 10000 }).should('match', /\/dashboard\/payment-methods\/form\/\d+$/);
  }

  function eliminarFormaPago() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');

    cy.get('.MuiDataGrid-row:visible')
      .filter(':not(.MuiDataGrid-rowSkeleton)')
      .should('have.length.greaterThan', 1)
      .then(filas => {
        cy.wrap(filas.eq(1)).click({ force: true });
      });

    cy.wait(500);
    cy.get('button.css-1cbe274').click({ force: true });
    cy.wait(1000);

    return cy.get('body').then($body => {
      if ($body.text().includes('No se puede eliminar la forma de pago por dependencias')) {
        return cy.contains('No se puede eliminar la forma de pago por dependencias')
          .should('be.visible')
          .then(() => cy.wrap(true));
      } else {
        return cy.get('.MuiDataGrid-row:visible')
          .filter(':not(.MuiDataGrid-rowSkeleton)')
          .should('have.length.lessThan', 55)
          .then(() => cy.wrap(true));
      }
    });
  }

  function editarSinSeleccion() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    return cy.contains('button', 'Editar').should('not.exist');
  }

  function eliminarSinSeleccion() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('div[role="row"] input[type="checkbox"]:checked').should('have.length', 0);
    cy.get('button.css-1cbe274').click({ force: true });
    return cy.contains('Por favor, selecciona un elemento para eliminar', { timeout: 5000 }).should('be.visible');
  }

  function abrirFormularioAlta() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('button').contains('Añadir').click({ force: true });
    return cy.url().should('include', '/dashboard/payment-methods/form');
  }

  function ocultarColumna() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');

    // Usar el patrón correcto para ocultar columna
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Referencia')
      .parents('[role="columnheader"]')
      .trigger('mouseover');

    cy.get('[aria-label="Referencia column menu"]').click({ force: true });
    cy.get('li').contains('Hide column').click({ force: true });

    return cy.get('[data-field="referencia"]').should('not.exist');
  }

  function gestionarColumnas() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');

    // Usar el patrón correcto para manage columns
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
      .parents('[role="columnheader"]')
      .trigger('mouseover');

    cy.get('[aria-label="Código column menu"]').click({ force: true });
    cy.get('li').contains('Manage columns').click({ force: true });

    // Usar el patrón correcto como en otros archivos
    cy.get('.MuiDataGrid-panel')
      .should('be.visible')
      .find('label')
      .contains('Referencia')
      .parents('label')
      .find('input[type="checkbox"]')
      .check({ force: true });

    return cy.get('.MuiDataGrid-columnHeaders')
      .should('be.visible')
      .within(() => {
        cy.contains('Referencia').should('exist');
      });
  }

  function scrollVertical() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);

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

  function recargarPagina() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.get('input[placeholder="Buscar"]').type('{selectall}{backspace}prueba{enter}', { force: true });
    cy.reload();
    return cy.get('input[placeholder="Buscar"]').should('have.value', '');
  }

  function filtrarValorInexistente() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('input[placeholder="Buscar"]').type('{selectall}{backspace}cartera{enter}', { force: true });
    cy.wait(500);
    return cy.contains('No rows', { timeout: 3000 }).should('be.visible');
  }

  function validarOpcionTodos() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');
    cy.get('select[name="column"]').should('be.visible').select('Todos', { force: true });
    cy.wait(500);
    return cy.get('.MuiDataGrid-row:visible').should('exist');
  }

  function filtrarPorValue() {
    cy.navegarAMenu('Ficheros', 'Formas de Pago');
    cy.url().should('include', '/dashboard/payment-methods');

    cy.contains('div.MuiDataGrid-columnHeader', 'Referencia')
      .find('button[aria-label*="menu"]')
      .click({ force: true });

    cy.contains('li[role="menuitem"]', 'Filter').click({ force: true });

    cy.get('input[placeholder="Filter value"]').clear().type('119{enter}');
    cy.wait(500);

    return cy.get('div[role="row"]').each($row => {
      const $cells = Cypress.$($row).find('div[role="cell"]');
      if ($cells.length > 0) {
        const textos = [...$cells].map(el => el.innerText);
        expect(textos.some(t => t.includes('119'))).to.be.true;
      }
    });
  }
});