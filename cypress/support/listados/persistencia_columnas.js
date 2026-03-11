function crearHelperPersistenciaColumnas(config) {
  const {
    abrirPantalla,
    esperarTabla,
    obtenerOrdenCabeceras,
    moverColumnaDespues,
    navegarParaPersistencia,
    registrarResultado,
    columnaMover,
    columnaReferencia,
    nombreResultado = 'Cambiar una columna y comprobar que se graba',
    encontrarIndiceColumna,
  } = config;

  if (!columnaMover || !String(columnaMover).trim()) {
    throw new Error('crearHelperPersistenciaColumnas requiere config.columnaMover');
  }

  if (!columnaReferencia || !String(columnaReferencia).trim()) {
    throw new Error('crearHelperPersistenciaColumnas requiere config.columnaReferencia');
  }

  function encontrarIndicePorDefecto(ordenCabeceras, nombreColumna) {
    const objetivo = String(nombreColumna || '').trim().toLowerCase();
    return ordenCabeceras.findIndex((texto) => String(texto || '').trim().toLowerCase() === objetivo);
  }

  function obtenerIndices(ordenCabeceras) {
    const finder = encontrarIndiceColumna || encontrarIndicePorDefecto;

    return {
      idxMover: finder(ordenCabeceras, columnaMover),
      idxReferencia: finder(ordenCabeceras, columnaReferencia),
    };
  }

  function comprobarPersistenciaOrdenColumna(caso, numero, casoId) {
    cy.log(`TC${String(Number(numero)).padStart(3, '0')}: mover "${columnaMover}" detras de "${columnaReferencia}" y comprobar persistencia`);

    return abrirPantalla()
      .then(() => esperarTabla())
      .then(() => obtenerOrdenCabeceras())
      .then((ordenInicial) => {
        const { idxMover, idxReferencia } = obtenerIndices(ordenInicial);

        if (idxMover !== idxReferencia + 1) {
          return moverColumnaDespues(columnaMover, columnaReferencia).then(() => cy.wait(1000));
        }

        cy.log(`La columna "${columnaMover}" ya estaba colocada despues de "${columnaReferencia}"`);
        return cy.wrap(null);
      })
      .then(() => navegarParaPersistencia())
      .then(() => abrirPantalla())
      .then(() => esperarTabla())
      .then(() => obtenerOrdenCabeceras())
      .then((ordenFinal) => {
        const { idxMover, idxReferencia } = obtenerIndices(ordenFinal);

        if (idxReferencia === -1 || idxMover === -1 || idxMover !== idxReferencia + 1) {
          const mensaje = 'No se guarda el orden de las columnas, se queda como estaba antes';
          cy.log(`TC${String(Number(numero)).padStart(3, '0')} ERROR: ${mensaje}`);
          return registrarResultado(numero, casoId, nombreResultado, mensaje, 'ERROR', true);
        }

        return registrarResultado(
          numero,
          casoId,
          nombreResultado,
          'Se guarda correctamente el orden de las columnas',
          'OK',
          true
        );
      });
  }

  return {
    comprobarPersistenciaOrdenColumna,
  };
}

module.exports = {
  crearHelperPersistenciaColumnas,
};