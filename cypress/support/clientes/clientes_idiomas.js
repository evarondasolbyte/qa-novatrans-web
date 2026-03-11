function crearHelpersIdiomasClientes(config) {
  const {
    UI,
    abrirFormularioNuevoCliente,
    PANTALLA,
    URL_PATH,
  } = config;

  function cambiarIdiomasClientes(caso, numero, casoId) {
    const idiomas = [
      { codigo: 'ca', nombre: 'Catalán' },
      { codigo: 'en', nombre: 'Inglés' },
      { codigo: 'es', nombre: 'Español' }
    ];
    const todosLosErrores = [];
    const nombreCaso = `${casoId || `TC${String(numero || 19).padStart(3, '0')}`} - ${caso?.nombre || 'Tabla responde al cambiar idioma'}`;

    return UI.abrirPantalla()
      .then(() => cambiarYValidarIdiomaCliente(idiomas[0], todosLosErrores))
      .then(() => cambiarYValidarIdiomaCliente(idiomas[1], todosLosErrores))
      .then(() => cambiarIdiomaClientes('es'))
      .then(() => {
        const erroresReales = [...new Set(todosLosErrores)].filter(e =>
          e.startsWith('Clave sin traducir:') || e.startsWith('Palabra en español:')
        );

        if (erroresReales.length > 0) {
          return cy.registrarResultados({
            numero: numero || 19,
            nombre: nombreCaso,
            esperado: 'EN: sin palabras UI en español ni claves con puntos. CA: sin claves con puntos.',
            obtenido: erroresReales.join(' | '),
            resultado: 'ERROR',
            pantalla: PANTALLA
          });
        }

        return cy.registrarResultados({
          numero: numero || 19,
          nombre: nombreCaso,
          esperado: 'EN: sin palabras UI en español ni claves con puntos. CA: sin claves con puntos.',
          obtenido: 'OK',
          resultado: 'OK',
          pantalla: PANTALLA
        });
      })
      .then(() => cambiarIdiomaClientes('es'))
      .then(() => UI.abrirPantalla());
  }

  function cambiarYValidarIdiomaCliente(configIdioma, todosLosErrores) {
    cy.log(`Cambiando idioma a: ${configIdioma.nombre} (${configIdioma.codigo})`);

    return cambiarIdiomaClientes(configIdioma.codigo)
      .then(() => cy.wait(1500))
      .then(() => {
        if (configIdioma.codigo === 'es') return;

        return cy.validarTraducciones(configIdioma.codigo).then((validacion) => {
          const erroresFiltrados = filtrarErroresIdiomaClientes(configIdioma.codigo, validacion?.errores || []);
          erroresFiltrados.forEach((e) => todosLosErrores.push(e));
        });
      })
      .then(() => {
        if (configIdioma.codigo === 'es') return;

        return cy.url().then((urlActual) => {
          if (/\/form/i.test(urlActual)) {
            return validarFormularioIdiomaClientes(configIdioma, todosLosErrores);
          }

          return abrirFormularioNuevoCliente()
            .then(() => validarFormularioIdiomaClientes(configIdioma, todosLosErrores));
        });
      });
  }

  function filtrarErroresIdiomaClientes(codigoIdioma, errores = []) {
    if (codigoIdioma === 'es') return [];
    if (codigoIdioma === 'ca') {
      return errores.filter((e) => e.startsWith('Clave sin traducir:'));
    }
    return errores;
  }

  function validarFormularioIdiomaClientes(configIdioma, todosLosErrores) {
    return cy.validarTraducciones(configIdioma.codigo)
      .then((validacion) => {
        filtrarErroresIdiomaClientes(configIdioma.codigo, validacion?.errores || [])
          .forEach((e) => todosLosErrores.push(e));
      })
      .then(() => {
        const pestanasVisitadas = new Set();

        return cy.get('body').then(($body) => {
          const tabs = $body
            .find('[role="tab"], .MuiTab-root, button[role="tab"], [data-testid*="tab"]')
            .filter(':visible');

          if (!tabs.length) {
            return cy.wrap(null);
          }

          const normalizarNombrePestana = (valor) => (valor || '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();

          return cy.get('[role="tab"], .MuiTab-root, button[role="tab"], [data-testid*="tab"]')
            .filter(':visible')
            .then(($tabsIniciales) => {
              Array.from($tabsIniciales).forEach((tab, index) => {
                const nombre = normalizarNombrePestana(tab.textContent || tab.getAttribute('aria-label') || `pestana-${index}`);
                const ariaSelected = (tab.getAttribute('aria-selected') || '').toLowerCase();
                if (ariaSelected === 'true' || tab.classList.contains('Mui-selected')) {
                  pestanasVisitadas.add(nombre);
                }
              });
            })
            .then(() => {
              const validarSiguientePestana = () => {
                return cy.get('[role="tab"], .MuiTab-root, button[role="tab"], [data-testid*="tab"]')
                  .filter(':visible')
                  .then(($tabsActuales) => {
                    const siguiente = Array.from($tabsActuales).find((tab, index) => {
                      const nombre = normalizarNombrePestana(tab.textContent || tab.getAttribute('aria-label') || `pestana-${index}`);
                      return !pestanasVisitadas.has(nombre);
                    });

                    if (!siguiente) {
                      return cy.wrap(null);
                    }

                    const nombrePestana = (siguiente.textContent || siguiente.getAttribute('aria-label') || '').trim();
                    const clavePestana = normalizarNombrePestana(nombrePestana);
                    pestanasVisitadas.add(clavePestana);

                    return cy.wrap(siguiente)
                      .click({ force: true })
                      .then(() => cy.wait(800))
                      .then(() => cy.validarTraducciones(configIdioma.codigo))
                      .then((validacionSiguiente) => {
                        filtrarErroresIdiomaClientes(configIdioma.codigo, validacionSiguiente?.errores || [])
                          .forEach((e) => todosLosErrores.push(e));

                        cy.log(`Pestaña validada (${configIdioma.nombre}): ${nombrePestana}`);
                      })
                      .then(() => validarSiguientePestana());
                  });
              };

              return validarSiguientePestana();
            });
        });
      })
      .then(() => cerrarFormularioIdiomaClientes());
  }

  function cerrarFormularioIdiomaClientes() {
    return cy.url().then((urlActual) => {
      if (!/\/form/i.test(urlActual)) return cy.wrap(null);

      return cy.get('body').then(($body) => {
        const botonCerrar = $body.find('button, a').filter((_, btn) => {
          const texto = (btn.textContent || btn.innerText || '').trim().toLowerCase();
          const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();

          return /cerrar|close|cancelar|cancel|salir|exit/i.test(texto) ||
            /cerrar|close|cancelar|cancel/i.test(ariaLabel) ||
            (btn.classList.contains('MuiIconButton-root') &&
              btn.querySelector('[aria-label*="close"], [aria-label*="Close"], [aria-label*="cerrar"]'));
        }).filter(':visible').first();

        if (botonCerrar.length > 0) {
          return cy.wrap(botonCerrar).click({ force: true })
            .then(() => cy.wait(1000))
            .then(() => cy.url().then((urlDespues) => {
              if (/\/form/i.test(urlDespues)) {
                cy.get('body').type('{esc}', { force: true });
                cy.wait(500);
              }
            }));
        }

        cy.get('body').type('{esc}', { force: true });
        return cy.wait(500);
      }).then(() => cy.visit(URL_PATH).then(() => UI.esperarTabla()));
    });
  }

  function cambiarIdiomaClientes(codigo) {
    return cy.get('body').then(($body) => {
      if ($body.find('select#languageSwitcher').length > 0) {
        return cy.get('select#languageSwitcher').select(codigo, { force: true });
      }

      if ($body.find('select[name="language"], select[data-testid="language-switcher"]').length > 0) {
        return cy.get('select[name="language"], select[data-testid="language-switcher"]').select(codigo, { force: true });
      }

      const selectors = [
        'button:contains("Spanish")',
        'button:contains("Español")',
        'button:contains("Espanyol")',
        'button:contains("English")',
        'button:contains("Inglés")',
        'button:contains("Angles")',
        'button:contains("Anglès")',
        'button:contains("Catalan")',
        'button:contains("Catalán")',
        'button:contains("Català")',
        '[role="button"]:contains("Spanish")',
        '[role="button"]:contains("Español")',
        'button.MuiButton-root'
      ];

      const selectorEncontrado = selectors.find((selector) => $body.find(selector).length > 0);
      if (!selectorEncontrado) return cy.wrap(null);

      cy.get(selectorEncontrado).first().click({ force: true });
      cy.wait(500);

      if (codigo === 'en') {
        return cy.get('li.MuiMenuItem-root, [role="menuitem"]').contains(/English|Inglés|Angles|Anglès/i).click({ force: true });
      }
      if (codigo === 'ca') {
        return cy.get('li.MuiMenuItem-root, [role="menuitem"]').contains(/Catalan|Catalán|Català/i).click({ force: true });
      }
      return cy.get('li.MuiMenuItem-root, [role="menuitem"]').contains(/Spanish|Español|Espanyol/i).click({ force: true });
    });
  }

  return {
    cambiarIdiomasClientes,
    cambiarYValidarIdiomaCliente,
    filtrarErroresIdiomaClientes,
    validarFormularioIdiomaClientes,
    cerrarFormularioIdiomaClientes,
    cambiarIdiomaClientes,
  };
}

module.exports = {
  crearHelpersIdiomasClientes,
};
