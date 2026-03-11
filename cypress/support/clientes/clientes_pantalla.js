function crearAyudasPantallaClientes(config) {
  const {
    URL_PATH,
    MENU,
    SUBMENU,
    SELECTOR_BUSCADOR_PRINCIPAL,
    SELECTOR_OPCIONES_MENU,
    REGEX_TITULO_COLUMNAS,
  } = config;

  function esperarBuscadorPrincipal() {
    return cy.get(SELECTOR_BUSCADOR_PRINCIPAL, { timeout: 10000 })
      .filter(':visible')
      .first()
      .should('be.visible');
  }

  function esperarOpcionesMenu() {
    return cy.get(SELECTOR_OPCIONES_MENU, { timeout: 10000 })
      .should('have.length.greaterThan', 0);
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
            if (!urlFinal.includes('/dashboard/clients/form')) {
              return this.esperarTabla();
            }
            return cy.wrap(null);
          });
        });
      });
    },

    esperarTabla() {
      cy.get('.MuiDataGrid-root', { timeout: 45000 }).should('be.visible');
      return cy.get('.MuiDataGrid-row', { timeout: 30000 }).should('have.length.greaterThan', 0);
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
    }
  };

  function abrirFormularioNuevoCliente() {
    return clickBotonVisible(/\+?\s?(Nuevo|Nou|New|Añadir)/i)
      .then(() => cy.url().should('include', '/dashboard/clients/form'))
      .then(() => cy.get('body').should('be.visible'));
  }

  function abrirPanelColumnas() {
    cy.log('Abriendo panel de columnas');

    const PATH_COLUMNAS =
      'M7.5 4.375a.625.625 0 1 0 0 1.25.625.625 0 0 0 0-1.25Zm-1.768 0a1.876 1.876 0 0 1 3.536 0h7.607a.625.625 0 1 1 0 1.25H9.268a1.876 1.876 0 0 1-3.536 0H3.125a.625.625 0 1 1 0-1.25h2.607Zm6.768 5a.625.625 0 1 0 0 1.25.625.625 0 0 0 0-1.25Zm-1.768 0a1.876 1.876 0 0 1 3.536 0h2.607a.625.625 0 1 1 0 1.25h-2.607a1.876 1.876 0 0 1-3.536 0H3.125a.625.625 0 1 1 0-1.25h7.607Zm-3.232 5a.625.625 0 1 0 0 1.25.625.625 0 0 0 0-1.25Zm-1.768 0a1.876 1.876 0 0 1 3.536 0h7.607a.625.625 0 1 1 0 1.25H9.268a1.876 1.876 0 0 1-3.536 0H3.125a.625.625 0 1 1 0-1.25h2.607Z';

    return UI.abrirPantalla()
      .then(() => {
        return cy.get('button.css-kqdryq', { timeout: 10000 }).then(($buttons) => {
          const $coincidentes = $buttons.filter((_, btn) => {
            const path = btn.querySelector('svg path');
            if (!path) return false;
            const d = path.getAttribute('d') || '';
            return d === PATH_COLUMNAS;
          });

          const $target = $coincidentes.length ? $coincidentes.eq(0) : $buttons.eq(0);

          cy.log(`Botones .css-kqdryq: ${$buttons.length}, coincidencias por path: ${$coincidentes.length}`);

          return cy.wrap($target)
            .should('be.visible')
            .click({ force: true });
        });
      })
      .then(() => {
        return cy.contains('div, span, p', REGEX_TITULO_COLUMNAS, { timeout: 10000 })
          .should('be.visible');
      });
  }

  function guardarPanelColumnas() {
    cy.log('Guardando panel de columnas');
    return cy.contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
      .should('be.visible')
      .click({ force: true })
      .then(() => cy.esperarUIEstable(10000));
  }

  return {
    esperarBuscadorPrincipal,
    esperarOpcionesMenu,
    clickBotonVisible,
    UI,
    abrirFormularioNuevoCliente,
    abrirPanelColumnas,
    guardarPanelColumnas,
  };
}

module.exports = {
  crearAyudasPantallaClientes,
};
