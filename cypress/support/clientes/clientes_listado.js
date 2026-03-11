function crearHelpersListadoClientes(config) {
  const {
    UI,
    abrirPanelColumnas,
    guardarPanelColumnas,
    REGEX_TITULO_COLUMNAS,
    URL_PATH,
    escapeRegex,
  } = config;

  function obtenerPatronColumna(nombreColumna = '') {
    const lower = String(nombreColumna || '').toLowerCase();

    if (/c[oó]digo/.test(lower)) {
      return /(C[oó]digo|Code|Codi)/i;
    }
    if (/nombre/.test(lower)) {
      return /(Nombre|Name|Nom)/i;
    }
    if (/raz[oó]n social/.test(lower)) {
      return /(Raz[oó]n Social|Business Name|Ra[óo] Social)/i;
    }
    if (/tel[eé]fono/.test(lower)) {
      return /(Tel[eé]fono|Phone|Tel[eé]fon)/i;
    }

    return new RegExp(`^${escapeRegex(nombreColumna)}$`, 'i');
  }

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

  function ordenarColumnaDobleClick(nombreColumna) {
    return UI.abrirPantalla().then(() => {
      const patron = obtenerPatronColumna(nombreColumna);

      cy.log(`Pulsando 2 veces en la columna "${nombreColumna}"`);

      return cy.contains('.MuiDataGrid-columnHeaderTitle', patron)
        .should('be.visible')
        .closest('[role="columnheader"]')
        .then(($header) => {
          cy.wrap($header).click({ force: true });
          cy.wait(300);
          cy.wrap($header).click({ force: true });
          cy.wait(300);
          return UI.filasVisibles().should('have.length.greaterThan', 0);
        });
    });
  }

  function obtenerPaginaActualClientes() {
    return cy.get('body').then(($body) => {
      const candidatos = [
        'button.MuiPaginationItem-root.Mui-selected',
        '.MuiPaginationItem-root.Mui-selected',
        'button[aria-current="true"]',
        '[aria-current="true"]',
      ];

      for (const selector of candidatos) {
        const $actual = $body.find(selector).filter(':visible').first();
        const texto = ($actual.text() || '').trim();
        if (/^\d+$/.test(texto)) {
          return Number(texto);
        }
      }

      return 1;
    });
  }

  function irAPaginaClientes(numeroPagina) {
    cy.log(`Ir a la pagina ${numeroPagina}`);

    return UI.abrirPantalla()
      .then(() => UI.esperarTabla())
      .then(() => cy.get('.MuiDataGrid-footerContainer, .MuiTablePagination-root, .MuiPagination-root', { timeout: 10000 }).should('be.visible'))
      .then(() => {
        return cy.contains('button, [role="button"]', new RegExp(`^${numeroPagina}$`), { timeout: 10000 })
          .filter(':visible')
          .last()
          .scrollIntoView({ block: 'center' })
          .click({ force: true });
      })
      .then(() => cy.wait(800))
      .then(() => obtenerPaginaActualClientes())
      .then((paginaActual) => {
        expect(paginaActual, `Pagina activa tras pulsar ${numeroPagina}`).to.eq(numeroPagina);
      });
  }

  function obtenerValoresColumnaCodigoPaginaActual() {
    return cy.get('.MuiDataGrid-row[role="row"]', { timeout: 10000 })
      .filter(':visible')
      .then(($rows) => {
        const valores = Array.from($rows)
          .map((row) => {
            const cell = row.querySelector('[data-field="code"]');
            return (cell?.textContent || cell?.innerText || '').trim();
          })
          .filter(Boolean);

        cy.log(`Codigos detectados en la pagina actual: ${valores.join(', ')}`);
        return valores;
      });
  }

  function toggleColumnaEnPanel(columna) {
    const patron = obtenerPatronColumna(columna);
    cy.log(`Panel columnas: clic en "${columna}"`);

    return cy
      .contains('div, span, p', REGEX_TITULO_COLUMNAS, { timeout: 10000 })
      .closest('div.MuiPaper-root')
      .within(() => {
        return cy
          .contains('li, label, span', patron, { timeout: 10000 })
          .should('be.visible')
          .click({ force: true });
      });
  }

  function ocultarColumna(columna) {
    return UI.abrirPantalla().then(() => {
      cy.log(`Ocultando columna "${columna}" (panel columnas)`);
      return abrirPanelColumnas()
        .then(() => toggleColumnaEnPanel(columna))
        .then(() => cy.wait(500))
        .then(() =>
          cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 })
            .should('not.contain.text', columna)
        );
    });
  }

  function obtenerOrdenCabecerasClientes() {
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

    cy.log(`Moviendo columna "${origen}" detras de "${destino}"`);

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

  function mostrarColumna(columna) {
    cy.reload();
    cy.wait(1000);

    return UI.abrirPantalla().then(() => {
      cy.url().should('include', URL_PATH).and('not.include', '/form');
      cy.wait(500);

      cy.log(`Mostrando columna "${columna}" (panel columnas, con posible segundo clic)`);

      const patron = obtenerPatronColumna(columna);

      const clickEnPanel = () => {
        cy.log('Abriendo panel y pulsando en la columna del panel...');
        return abrirPanelColumnas()
          .then(() => {
            return cy
              .contains('div, span, p', REGEX_TITULO_COLUMNAS, { timeout: 10000 })
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
          return cy
            .get('.MuiDataGrid-columnHeaders', { timeout: 10000 })
            .then(($headers) => {
              const texto = $headers.text();

              if (!texto.includes(columna) && intento === 0) {
                cy.log('La columna sigue sin aparecer, repitiendo clic una vez mas...');
                return intentar(1);
              }

              return cy.wrap($headers).should('contain.text', columna);
            });
        });
      };

      return intentar(0);
    });
  }

  function obtenerColumnasVisiblesClientes() {
    let columnasVisibles = [];

    const leerCabecerasVisibles = () => {
      return cy.get('[role="columnheader"], .MuiDataGrid-columnHeader', { timeout: 10000 })
        .filter(':visible')
        .then(($headers) => {
          const columnas = Array.from($headers)
            .map((el) => (el.textContent || el.innerText || '').trim())
            .filter((txt) => txt && !/^\d+$/.test(txt))
            .map((txt) => txt.replace(/\s+/g, ' ').trim());

          columnas.forEach((c) => {
            if (!columnasVisibles.includes(c)) columnasVisibles.push(c);
          });
        });
    };

    return cy.get('.MuiDataGrid-virtualScroller', { timeout: 10000 })
      .first()
      .then(($scroller) => {
        const scroller = $scroller[0];
        if (!scroller) return cy.wrap(columnasVisibles);

        const maxScrollLeft = Math.max(0, (scroller.scrollWidth || 0) - (scroller.clientWidth || 0));
        const pasos = maxScrollLeft > 0
          ? [0, Math.round(maxScrollLeft * 0.33), Math.round(maxScrollLeft * 0.66), maxScrollLeft]
          : [0];

        let chain = cy.wrap(null);
        pasos.forEach((pos) => {
          chain = chain
            .then(() => cy.get('.MuiDataGrid-virtualScroller').first().scrollTo(pos, 0, { ensureScrollable: false, duration: 200 }))
            .then(() => cy.wait(250))
            .then(() => leerCabecerasVisibles());
        });

        return chain
          .then(() => cy.get('.MuiDataGrid-virtualScroller').first().scrollTo('left', { ensureScrollable: false, duration: 100 }))
          .then(() => {
            columnasVisibles = [...new Set(columnasVisibles)];
            cy.log(`Columnas visibles detectadas: ${columnasVisibles.join(', ')}`);
            return cy.wrap(columnasVisibles);
          });
      });
  }

  return {
    ordenarColumna,
    ordenarColumnaDobleClick,
    obtenerPaginaActualClientes,
    irAPaginaClientes,
    obtenerValoresColumnaCodigoPaginaActual,
    obtenerPatronColumna,
    ocultarColumna,
    obtenerOrdenCabecerasClientes,
    moverColumnaDespues,
    mostrarColumna,
    obtenerColumnasVisiblesClientes,
  };
}

module.exports = {
  crearHelpersListadoClientes,
};
