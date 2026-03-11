function normalizarId(selector = '') {
  return selector.replace(/^#/, '').replace(/-label$/i, '');
}

function normalizarEtiquetaTexto(texto = '') {
  if (!texto) return null;
  return texto.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizarTextoParaComparar(texto = '') {
  const limpio = normalizarEtiquetaTexto(texto);
  return limpio ? limpio.toLowerCase() : '';
}

function escapeRegex(texto = '') {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escribirPorName(nameAttr, valor, etiqueta = '') {
  if (!nameAttr || valor === undefined || valor === null) {
    return cy.wrap(null);
  }

  const texto = valor.toString();
  const selector = `input[name="${nameAttr}"], textarea[name="${nameAttr}"]`;
  const etiquetaLog = etiqueta || nameAttr;

  cy.log(`Escribiendo en "${etiquetaLog}": ${texto}`);

  return cy.get('body').then(($body) => {
    const $found = $body.find(selector).filter(':visible');
    if (!$found.length) {
      cy.log(`(SKIP) No existe en UI: ${selector}`);
      return cy.wrap(null);
    }

    const $el = $found.first();

    return cy.wrap($el)
      .scrollIntoView()
      .should('be.visible')
      .then(() => {
        cy.wrap($el).click({ force: true });
        cy.wrap($el).type('{selectall}', { force: true });
        cy.wrap($el).clear({ force: true });
        cy.wait(50);

        return cy.wrap($el).then(($input) => {
          const val = $input.val();
          if (val && val !== '') {
            cy.wrap($input).click({ force: true });
            cy.wrap($input).type('{selectall}', { force: true });
            cy.wrap($input).clear({ force: true });
            cy.wait(30);
          }
          return cy.wrap(null);
        });
      })
      .then(() => {
        cy.wait(100);
        return cy.wrap($el).type(texto, { force: true, delay: 0 });
      })
      .then(() => {
        cy.wait(50);
        return cy.wrap($el).then(($input) => {
          const valorActual = $input.val();
          if (valorActual !== texto) {
            cy.log(` Valor esperado "${texto}" pero se obtuvo "${valorActual}", continuando...`);
          }
          return cy.wrap(null);
        });
      });
  });
}

function parseFechaBasicaExcel(texto) {
  if (texto instanceof Date) return texto;

  const str = String(texto).trim();
  const m = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (!m) {
    cy.log(`No se pudo parsear la fecha "${str}", se usa hoy`);
    return new Date();
  }

  const dia = Number(m[1]);
  const mes = Number(m[2]) - 1;
  const anio = Number(m[3]);
  return new Date(anio, mes, dia);
}

function seleccionarFechaEnCalendario(fechaObjetivo) {
  const dia = `${fechaObjetivo.getDate()}`;
  const regexDia = new RegExp(`^${escapeRegex(dia)}$`);

  return cy
    .get('div[role="dialog"], .MuiPickersPopper-root, .MuiPopover-root', {
      timeout: 10000
    })
    .filter(':visible')
    .last()
    .within(() => {
      cy.contains(
        'button, [role="button"], .MuiPickersDay-root',
        regexDia
      )
        .scrollIntoView()
        .click({ force: true });
    });
}

module.exports = {
  normalizarId,
  normalizarEtiquetaTexto,
  normalizarTextoParaComparar,
  escapeRegex,
  escribirPorName,
  parseFechaBasicaExcel,
  seleccionarFechaEnCalendario,
};
