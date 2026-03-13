const { escapeRegex } = require('./personal_utils');

function crearHelpersListadoPersonal(config) {
  const {
    UI,
    URL_PATH,
  } = config;

  function ordenarColumna(nombreColumna) {
    return UI.abrirPantalla().then(() => {
      const patron = obtenerPatronColumna(nombreColumna);
      const maxIntentos = 4;

      const intentarOrden = (intento = 0) => {
        return cy.contains('.MuiDataGrid-columnHeaderTitle', patron)
          .should('be.visible')
          .closest('[role="columnheader"]')
          .then(($header) => {
            const ariaSort = $header.attr('aria-sort') || 'none';
            if (ariaSort === 'ascending') {
              cy.wrap($header).click({ force: true });
              cy.wait(300);
              cy.wrap($header).click({ force: true });
              return UI.filasVisibles().should('have.length.greaterThan', 0);
            }
            if (intento >= maxIntentos) {
              cy.log(`No se pudo ordenar la columna "${nombreColumna}" tras ${maxIntentos} intentos`);
              return UI.filasVisibles().should('have.length.greaterThan', 0);
            }
            cy.wrap($header).click({ force: true });
            cy.wait(300);
            return intentarOrden(intento + 1);
          });
      };

      return intentarOrden();
    });
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
          return cy.wrap($target).should('be.visible').click({ force: true });
        });
      })
      .then(() => {
        return cy
          .contains('div, span, p', /(Columnas|Columns?|Columnes)/i, { timeout: 10000 })
          .should('be.visible');
      });
  }

  function toggleColumnaEnPanel(columna) {
    const patron = obtenerPatronColumna(columna);
    cy.log(`Panel columnas: clic en "${columna}"`);

    return cy
      .contains('div, span, p', /(Columnas|Columns?|Columnes)/i, { timeout: 10000 })
      .closest('div.MuiPaper-root')
      .within(() => {
        return cy
          .contains('li, label, span', patron, { timeout: 10000 })
          .should('be.visible')
          .click({ force: true });
      });
  }

  function guardarPanelColumnas() {
    cy.log('Guardando panel de columnas');
    return cy
      .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
      .should('be.visible')
      .click({ force: true })
      .then(() => cy.wait(500));
  }

  function obtenerPatronColumna(nombreColumna = '') {
    const lower = nombreColumna.toLowerCase();

    if (/c[óo]digo/.test(lower)) return /(C[óo]digo|Code|Codi)/i;
    if (/nombre/.test(lower)) return /(Nombre|Name|Nom)/i;
    if (/nif|cif/.test(lower)) return /(NIF|CIF)/i;
    if (/tel[eé]fono/.test(lower)) return /(Tel[eé]fono|Phone|Tel[eè]fon)/i;
    if (/m[óo]vil/.test(lower)) return /(M[óo]vil|Mobile|M[òo]bil)/i;
    if (/empresa/.test(lower)) return /(Empresa|Company)/i;
    if (/operator/.test(lower)) return /(Operator|Operador)/i;

    return new RegExp(escapeRegex(nombreColumna), 'i');
  }

  function ocultarColumna(columna) {
    return UI.abrirPantalla().then(() => {
      cy.log(`Ocultando columna "${columna}" (panel columnas)`);
      return abrirPanelColumnas()
        .then(() => toggleColumnaEnPanel(columna))
        .then(() => cy.wait(500))
        .then(() => cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('not.contain.text', columna));
    });
  }

  function mostrarColumna(columna) {
    return UI.abrirPantalla().then(() => {
      cy.url().should('include', URL_PATH).and('not.include', '/form');
      cy.wait(500);

      cy.log(`Mostrando columna "${columna}" (panel columnas, con posible segundo clic)`);
      const patron = obtenerPatronColumna(columna);

      const clickEnPanel = () => {
        return abrirPanelColumnas()
          .then(() => {
            return cy
              .contains('div, span, p', /(Columnas|Columns?|Columnes)/i, { timeout: 10000 })
              .closest('div.MuiPaper-root')
              .within(() => {
                cy.contains('li, label, span', patron, { timeout: 10000 })
                  .should('be.visible')
                  .click({ force: true });
              });
          })
          .then(() => cy.wait(500));
      };

      const intentar = (intento = 0) => {
        return clickEnPanel().then(() => {
          return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).then(($headers) => {
            const texto = $headers.text();
            if (!texto.includes(columna) && intento === 0) {
              cy.log('La columna sigue sin aparecer, repitiendo clic una vez más...');
              return intentar(1);
            }
            return cy.wrap($headers).should('contain.text', columna);
          });
        });
      };

      return intentar(0);
    });
  }

  function obtenerOrdenCabecerasPersonal() {
    return cy.get('[role="columnheader"], .MuiDataGrid-columnHeader', { timeout: 10000 })
      .filter(':visible')
      .then(($headers) => {
        const columnas = Array.from($headers)
          .filter((el) => {
            const className = el.className || '';
            return !String(className).includes('MuiDataGrid-columnHeader--moving');
          })
          .sort((a, b) => {
            const idxA = Number(a.getAttribute('aria-colindex') || '0');
            const idxB = Number(b.getAttribute('aria-colindex') || '0');
            return idxA - idxB;
          })
          .map((el) => (el.textContent || el.innerText || '').replace(/\s+/g, ' ').trim())
          .filter((txt) => txt && !/^\d+$/.test(txt));

        Cypress.log({
          name: 'cabeceras',
          message: `Orden actual de cabeceras: ${columnas.join(' | ')}`,
        });

        return columnas;
      });
  }

  function moverColumnaDespues(origen, destino) {
    const patronOrigen = obtenerPatronColumna(origen);
    const patronDestino = obtenerPatronColumna(destino);

    cy.log(`Moviendo columna "${origen}" detrás de "${destino}"`);

    return UI.abrirPantalla().then(() => {
      return cy.contains('.MuiDataGrid-columnHeaderTitle', patronOrigen, { timeout: 10000 })
        .should('be.visible')
        .closest('[role="columnheader"]')
        .then(($source) => {
          return cy.contains('.MuiDataGrid-columnHeaderTitle', patronDestino, { timeout: 10000 })
            .should('be.visible')
            .closest('[role="columnheader"]')
            .then(($target) => {
              const sourceRect = $source[0].getBoundingClientRect();
              const targetRect = $target[0].getBoundingClientRect();
              const startX = Math.round(sourceRect.left + (sourceRect.width / 2));
              const startY = Math.round(sourceRect.top + (sourceRect.height / 2));
              const endX = Math.round(targetRect.right - 10);
              const endY = Math.round(targetRect.top + (targetRect.height / 2));

              const dataTransfer = new DataTransfer();
              const sourceSelector = '.MuiDataGrid-columnHeaderDraggableContainer[draggable="true"]';

              cy.log(`Drag coordinates: start(${startX},${startY}) target(${endX},${endY})`);

              return cy.wrap($source)
                .find(sourceSelector)
                .first()
                .should('exist')
                .trigger('mousedown', {
                  button: 0,
                  buttons: 1,
                  which: 1,
                  clientX: startX,
                  clientY: startY,
                  force: true,
                })
                .trigger('dragstart', {
                  dataTransfer,
                  eventConstructor: 'DragEvent',
                  force: true,
                })
                .wait(250)
                .then(() => {
                  return cy.wrap($target)
                    .find(sourceSelector)
                    .first()
                    .should('exist')
                    .trigger('dragenter', {
                      dataTransfer,
                      eventConstructor: 'DragEvent',
                      clientX: endX,
                      clientY: endY,
                      force: true,
                    })
                    .trigger('dragover', {
                      dataTransfer,
                      eventConstructor: 'DragEvent',
                      clientX: endX,
                      clientY: endY,
                      force: true,
                    })
                    .wait(150)
                    .trigger('drop', {
                      dataTransfer,
                      eventConstructor: 'DragEvent',
                      clientX: endX,
                      clientY: endY,
                      force: true,
                    });
                })
                .then(() => {
                  return cy.wrap($source)
                    .find(sourceSelector)
                    .first()
                    .trigger('dragend', {
                      dataTransfer,
                      eventConstructor: 'DragEvent',
                      force: true,
                    })
                    .trigger('mouseup', {
                      button: 0,
                      which: 1,
                      clientX: endX,
                      clientY: endY,
                      force: true,
                    });
                })
                .then(() => cy.wait(1000));
            });
        });
    });
  }

  function scrollTablaPersonal(caso, numero, casoId) {
    cy.log(`${casoId || `TC${String(numero).padStart(3, '0')}`}: scroll tabla Personal`);
    return UI.abrirPantalla().then(() => {
      cy.get('.MuiDataGrid-virtualScroller', { timeout: 20000 })
        .scrollTo('bottom', { duration: 300 })
        .scrollTo('top', { duration: 300 });
      cy.get('.MuiDataGrid-virtualScroller', { timeout: 20000 }).scrollTo('right', { duration: 300 });
      return cy.wrap(null);
    });
  }

  return {
    ordenarColumna,
    abrirPanelColumnas,
    toggleColumnaEnPanel,
    guardarPanelColumnas,
    obtenerPatronColumna,
    ocultarColumna,
    mostrarColumna,
    obtenerOrdenCabecerasPersonal,
    moverColumnaDespues,
    scrollTablaPersonal,
  };
}

module.exports = {
  crearHelpersListadoPersonal,
};
