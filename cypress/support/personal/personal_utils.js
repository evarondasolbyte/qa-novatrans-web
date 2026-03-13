function normalizarId(selector = '') {
  return String(selector || '').replace(/^#/, '').replace(/-label$/i, '');
}

function normalizarEtiquetaTexto(texto = '') {
  if (!texto) return null;
  return String(texto).replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizarTextoParaComparar(texto = '') {
  const limpio = normalizarEtiquetaTexto(texto);
  return limpio ? limpio.toLowerCase() : '';
}

function escapeRegex(texto = '') {
  return String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generarDigitosAleatorios(longitud = 3) {
  let resultado = '';
  for (let i = 0; i < longitud; i++) {
    resultado += Math.floor(Math.random() * 10);
  }
  return resultado;
}

function procesarValorAleatorio(valor) {
  if (valor === null || valor === undefined) return valor;
  let valorStr = String(valor);

  try {
    const tc056Suffix = Cypress.env && Cypress.env('TC056_SUFFIX');
    if (tc056Suffix && /X{3,}/i.test(valorStr)) {
      valorStr = valorStr.replace(/X{3,}/gi, (match) => String(tc056Suffix).padStart(match.length, '0').slice(-match.length));
      return valorStr;
    }
  } catch (e) {
  }

  if (/X{3,}/i.test(valorStr)) {
    valorStr = valorStr.replace(/X{3,}/gi, (match) => {
      const numeroAleatorio = generarDigitosAleatorios(match.length);
      cy.log(`Valor "${valorStr}" contiene "${match}", generando sufijo: ${numeroAleatorio}`);
      return numeroAleatorio;
    });
    return valorStr;
  }

  if (/(aleatorio|random)/i.test(valorStr)) {
    const numeroAleatorio = Math.floor(Math.random() * 900) + 100;
    cy.log(`Valor "${valorStr}" detectado como aleatorio, generando: ${numeroAleatorio}`);
    return String(numeroAleatorio);
  }

  return valorStr;
}

function escribirPorName(nameAttr, valor, etiqueta = '') {
  if (!nameAttr || valor === undefined || valor === null) return cy.wrap(null);

  const texto = procesarValorAleatorio(valor);
  const selector = `input[name="${nameAttr}"], textarea[name="${nameAttr}"]`;
  const etiquetaLog = etiqueta || nameAttr;

  cy.log(`Escribiendo en "${etiquetaLog}": ${texto}`);

  return cy.get('body').then(($body) => {
    const $el = $body.find(selector).filter(':visible').first();
    if ($el.length) {
      return cy
        .wrap($el[0])
        .scrollIntoView()
        .click({ force: true })
        .clear({ force: true })
        .type(String(texto), { force: true, delay: 0 })
        .blur({ force: true });
    }

    const $el2 = $body.find(selector).first();
    if ($el2.length) {
      return cy
        .wrap($el2[0])
        .scrollIntoView()
        .click({ force: true })
        .clear({ force: true })
        .type(String(texto), { force: true, delay: 0 })
        .blur({ force: true });
    }

    cy.log(`No se encontró input/textarea con name="${nameAttr}" (se omite)`);
    return cy.wrap(null);
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

module.exports = {
  normalizarId,
  normalizarEtiquetaTexto,
  normalizarTextoParaComparar,
  escapeRegex,
  procesarValorAleatorio,
  escribirPorName,
  parseFechaBasicaExcel,
};
