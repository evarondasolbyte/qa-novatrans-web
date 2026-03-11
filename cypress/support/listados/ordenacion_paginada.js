function crearHelperOrdenacionPaginada(config) {
  const {
    abrirPantalla,
    irAPagina,
    ordenarColumna,
    obtenerPaginaActual,
    obtenerValoresColumna,
    registrarResultado,
    paginaObjetivo = 3,
    nombreColumna,
    nombreResultado = 'Ordenar otra pagina',
    comparador,
  } = config;

  if (!nombreColumna || !String(nombreColumna).trim()) {
    throw new Error('crearHelperOrdenacionPaginada requiere config.nombreColumna');
  }

  function compararValoresPorDefecto(a, b) {
    return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' });
  }

  function ordenarOtraPagina(caso, numero, casoId) {
    cy.log(
      `TC${String(Number(numero)).padStart(3, '0')}: Ir a pagina ${paginaObjetivo} y ordenar ${nombreColumna} sin volver a la pagina 1`
    );
    let falloRegistrado = false;

    return abrirPantalla()
      .then(() => irAPagina(paginaObjetivo))
      .then(() => ordenarColumna(nombreColumna))
      .then(() => obtenerPaginaActual())
      .then((paginaActual) => {
        if (paginaActual !== paginaObjetivo) {
          falloRegistrado = true;
          const mensaje = `No se ordena la pagina ${paginaObjetivo}, me devuelve a la pagina ${paginaActual}`;
          cy.log(`TC${String(Number(numero)).padStart(3, '0')} ERROR: ${mensaje}`);
          return registrarResultado(numero, casoId, nombreResultado, mensaje, 'ERROR', true);
        }
        return cy.wrap(null);
      })
      .then(() => {
        if (falloRegistrado) return null;
        return obtenerValoresColumna();
      })
      .then((valores) => {
        if (falloRegistrado) return null;

        const cmp = comparador || compararValoresPorDefecto;
        const esperado = [...valores].sort(cmp);

        if (JSON.stringify(valores) !== JSON.stringify(esperado)) {
          const mensaje = `La pagina ${paginaObjetivo} no queda ordenada por ${nombreColumna}. Obtenido: ${valores.join(', ')}`;
          cy.log(`TC${String(Number(numero)).padStart(3, '0')} ERROR: ${mensaje}`);
          return registrarResultado(numero, casoId, nombreResultado, mensaje, 'ERROR', true);
        }

        return registrarResultado(
          numero,
          casoId,
          nombreResultado,
          `Se ordena correctamente la pagina ${paginaObjetivo} sin volver a la pagina 1`,
          'OK',
          true
        );
      });
  }

  return {
    ordenarOtraPagina,
  };
}

module.exports = {
  crearHelperOrdenacionPaginada,
};