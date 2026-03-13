function crearHelperIdiomasPantalla(config) {
  const {
    UI,
    abrirFormularioNuevo,
    PANTALLA,
    URL_PATH,
    numeroCasoPorDefecto = 1,
    nombreCasoPorDefecto = 'Tabla responde al cambiar idioma',
  } = config;

  function cambiarIdiomas(caso, numero, casoId) {
    const idiomas = [
      { codigo: 'ca', nombre: 'Catalan' },
      { codigo: 'en', nombre: 'Ingles' },
      { codigo: 'es', nombre: 'Espanol' },
    ];
    const todosLosErrores = [];
    const nombreCaso = `${casoId || `TC${String(numero || numeroCasoPorDefecto).padStart(3, '0')}`} - ${caso?.nombre || nombreCasoPorDefecto}`;

    return UI.abrirPantalla()
      .then(() => cambiarYValidarIdioma(idiomas[0], todosLosErrores))
      .then(() => cambiarYValidarIdioma(idiomas[1], todosLosErrores))
      .then(() => cambiarIdioma('es'))
      .then(() => {
        const erroresReales = [...new Set(todosLosErrores)].filter((e) =>
          e.startsWith('Clave sin traducir:') || e.startsWith('Palabra en espanol:')
        );

        if (erroresReales.length > 0) {
          return cy.registrarResultados({
            numero: numero || numeroCasoPorDefecto,
            nombre: nombreCaso,
            esperado: 'EN: sin palabras UI en espanol ni claves con puntos. CA: sin claves con puntos.',
            obtenido: erroresReales.join(' | '),
            resultado: 'ERROR',
            pantalla: PANTALLA,
          });
        }

        return cy.registrarResultados({
          numero: numero || numeroCasoPorDefecto,
          nombre: nombreCaso,
          esperado: 'EN: sin palabras UI en espanol ni claves con puntos. CA: sin claves con puntos.',
          obtenido: 'OK',
          resultado: 'OK',
          pantalla: PANTALLA,
        });
      })
      .then(() => cambiarIdioma('es'))
      .then(() => UI.abrirPantalla());
  }

  function cambiarYValidarIdioma(configIdioma, todosLosErrores) {
    cy.log(`Cambiando idioma a: ${configIdioma.nombre} (${configIdioma.codigo})`);

    return cambiarIdioma(configIdioma.codigo)
      .then(() => cy.wait(1500))
      .then(() => {
        if (configIdioma.codigo === 'es') return cy.wrap(null);

        return cy.validarTraducciones(configIdioma.codigo).then((validacion) => {
          const erroresFiltrados = filtrarErroresIdioma(configIdioma.codigo, validacion?.errores || []);
          erroresFiltrados.forEach((e) => todosLosErrores.push(e));
        });
      })
      .then(() => {
        if (configIdioma.codigo === 'es') return cy.wrap(null);

        return cy.url().then((urlActual) => {
          if (/\/form/i.test(urlActual)) {
            return validarFormularioIdioma(configIdioma, todosLosErrores);
          }

          return abrirFormularioNuevo()
            .then(() => cy.wait(1000))
            .then(() => validarFormularioIdioma(configIdioma, todosLosErrores));
        });
      });
  }

  function filtrarErroresIdioma(codigoIdioma, errores = []) {
    if (codigoIdioma === 'es') return [];
    if (codigoIdioma === 'ca') {
      return errores.filter((e) => e.startsWith('Clave sin traducir:'));
    }
    return errores;
  }

  function validarFormularioIdioma(configIdioma, todosLosErrores) {
    return cy.validarTraducciones(configIdioma.codigo)
      .then((validacion) => {
        filtrarErroresIdioma(configIdioma.codigo, validacion?.errores || [])
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
                const nombre = normalizarNombrePestana(
                  tab.textContent || tab.getAttribute('aria-label') || `pestana-${index}`
                );
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
                      const nombre = normalizarNombrePestana(
                        tab.textContent || tab.getAttribute('aria-label') || `pestana-${index}`
                      );
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
                        filtrarErroresIdioma(configIdioma.codigo, validacionSiguiente?.errores || [])
                          .forEach((e) => todosLosErrores.push(e));

                        cy.log(`Pestana validada (${configIdioma.nombre}): ${nombrePestana}`);
                      })
                      .then(() => validarSiguientePestana());
                  });
              };

              return validarSiguientePestana();
            });
        });
      })
      .then(() => cerrarFormularioIdioma());
  }

  function cerrarFormularioIdioma() {
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

  function cambiarIdioma(codigo) {
    const regexIdioma = {
      en: /English|Ingles|Inglés|Angles|Anglès/i,
      ca: /Catalan|Catalán|Catala|Català/i,
      es: /Spanish|Espanol|Español|Espanyol/i,
    };

    return cy.get('body').then(($body) => {
      if ($body.find('select#languageSwitcher').length > 0) {
        return cy.get('select#languageSwitcher').select(codigo, { force: true });
      }

      if ($body.find('select[name="language"], select[data-testid="language-switcher"]').length > 0) {
        return cy.get('select[name="language"], select[data-testid="language-switcher"]').select(codigo, { force: true });
      }

      const selectorEncontrado = [
        'button:contains("Spanish")',
        'button:contains("Espanol")',
        'button:contains("Español")',
        'button:contains("Espanyol")',
        'button:contains("English")',
        'button:contains("Ingles")',
        'button:contains("Inglés")',
        'button:contains("Angles")',
        'button:contains("Anglès")',
        'button:contains("Catalan")',
        'button:contains("Catalán")',
        'button:contains("Catala")',
        'button:contains("Català")',
        '[role="button"]:contains("Spanish")',
        '[role="button"]:contains("Espanol")',
        '[role="button"]:contains("Español")',
        'button.MuiButton-root',
      ].find((selector) => $body.find(selector).length > 0);

      if (!selectorEncontrado) return cy.wrap(null);

      cy.get(selectorEncontrado).first().click({ force: true });
      cy.wait(500);

      return cy.get('li.MuiMenuItem-root, [role="menuitem"]')
        .filter(':visible')
        .contains(regexIdioma[codigo] || regexIdioma.es)
        .click({ force: true });
    });
  }

  return {
    cambiarIdiomas,
    cambiarYValidarIdioma,
    filtrarErroresIdioma,
    validarFormularioIdioma,
    cerrarFormularioIdioma,
    cambiarIdioma,
  };
}

module.exports = {
  crearHelperIdiomasPantalla,
};
