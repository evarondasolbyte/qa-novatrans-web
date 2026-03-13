function crearHelpersPantallaPersonal(config) {
  const {
    MENU,
    SUBMENU,
    URL_PATH,
  } = config;

  function esperarBuscadorPrincipal() {
    return cy.get(
      'input[placeholder*="Buscar"]:not([id*="sidebar"]), input[placeholder*="Search"]:not([id*="sidebar"]), input[placeholder*="Cerc"]:not([id*="sidebar"]), input[placeholder*="Buscar..."], input[placeholder*="Search..."], input[placeholder*="Cerc"]',
      { timeout: 10000 }
    )
      .filter(':visible')
      .first()
      .should('be.visible');
  }

  function clickBotonVisible(regexTexto, selector = 'button, a, [role="button"]') {
    return cy.contains(selector, regexTexto, { timeout: 10000 })
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });
  }

  const UI = {
    abrirPantalla() {
      return cy.url().then((urlActual) => {
        if (!urlActual.includes(URL_PATH)) {
          cy.navegarAMenu(MENU, SUBMENU, { expectedPath: URL_PATH });
        }
        return cy.url().should('include', URL_PATH).then(() => {
          return cy.url().then((urlFinal) => {
            if (!urlFinal.includes('/dashboard/personnel/form')) {
              return this.esperarTabla();
            }
            return cy.wrap(null);
          });
        });
      });
    },

    esperarTabla() {
      const regexSinFilas = /(No rows|Sin resultados|No se encontraron|No results|Sin filas|No hay datos)/i;

      cy.get('.MuiDataGrid-root', { timeout: 45000 }).should('be.visible');
      return cy.get('body', { timeout: 30000 }).should(($body) => {
        const filas = $body.find('.MuiDataGrid-row').length;
        const overlayText = $body.find('.MuiDataGrid-overlay:visible, .MuiDataGrid-overlayWrapper:visible').text() || '';
        const bodyText = $body.text() || '';
        const tieneMensajeSinFilas = regexSinFilas.test(overlayText) || regexSinFilas.test(bodyText);

        expect(
          filas > 0 || tieneMensajeSinFilas,
          'la tabla debe tener filas o mostrar un mensaje de "sin filas"'
        ).to.eq(true);
      });
    },

    buscar(valor) {
      const texto = (valor || '').toString();
      return esperarBuscadorPrincipal()
        .clear({ force: true })
        .type(texto, { force: true })
        .type('{enter}', { force: true })
        .then(() => cy.esperarUIEstable(10000));
    },

    filasVisibles() {
      return cy.get('.MuiDataGrid-row:visible');
    },

    seleccionarPrimeraFilaConCheckbox() {
      return cy.get('.MuiDataGrid-row:visible')
        .first()
        .within(() => {
          cy.get('.MuiDataGrid-cellCheckbox [role="checkbox"], .MuiDataGrid-cellCheckbox input[type="checkbox"], input[type="checkbox"]')
            .first()
            .click({ force: true });
        });
    },
  };

  function cargaPantalla() {
    return UI.abrirPantalla();
  }

  return {
    esperarBuscadorPrincipal,
    clickBotonVisible,
    UI,
    cargaPantalla,
  };
}

module.exports = {
  crearHelpersPantallaPersonal,
};
