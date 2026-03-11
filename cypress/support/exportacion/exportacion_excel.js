function crearHelperExportacionExcel(config) {
  const {
    asegurarEnListado = () => cy.wrap(null),
    abrirPantalla,
    esperarTabla = () => cy.wrap(null),
    obtenerColumnasVisibles,
    registrarResultado,
    getDescripcionExportacion = (modo) => (modo === 'visible' ? 'columnas visibles' : 'todo'),
    getOpcionMenu = (modo) => (modo === 'visible' ? 'Exportar columnas visibles' : 'Exportar todo'),
    getNombreResultado = (modo) => `Exportar ${getDescripcionExportacion(modo)}`,
    validarResultado,
  } = config;

  function normalizarCabecera(txt = '') {
    return String(txt)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function seleccionarOpcionExportacion(opcionMenu) {
    return cy.get('body').then(($body) => {
      const $menu = $body.find('#excel-export-menu, [id*="excel-export"], .MuiPopover-root:visible').last();

      if ($menu.length > 0) {
        const $item = $menu.find('li[role="menuitem"], .MuiMenuItem-root')
          .filter((_, el) => {
            const texto = (el.textContent || el.innerText || '').trim();
            return new RegExp(opcionMenu, 'i').test(texto);
          })
          .first();

        if ($item.length > 0) {
          return cy.wrap($item)
            .should('be.visible')
            .scrollIntoView({ block: 'center' })
            .click({ force: true });
        }
      }

      return cy.contains('li[role="menuitem"], .MuiMenuItem-root', new RegExp(opcionMenu, 'i'), { timeout: 10000 })
        .should('be.visible')
        .scrollIntoView({ block: 'center' })
        .click({ force: true });
    });
  }

  function esperarArchivoDescargado(archivosAntes) {
    cy.log('Esperando a que se descargue el archivo Excel...');

    return cy.wait(8000).then(() => {
      return cy.task('listarArchivosDescargados').then((archivosAhora) => {
        cy.log(`Archivos antes: ${archivosAntes.length}, Archivos ahora: ${archivosAhora.length}`);

        const archivoNuevo = archivosAhora.find((f) => !archivosAntes.includes(f));
        if (archivoNuevo) {
          cy.log(`Archivo descargado encontrado: ${archivoNuevo}`);
          return cy.wrap(archivoNuevo);
        }

        if (archivosAhora.length > 0) {
          cy.log(`No se detectó archivo nuevo, usando el más reciente: ${archivosAhora[0]}`);
          return cy.wrap(archivosAhora[0]);
        }

        cy.log('No se encontró ningún archivo .xlsx en la carpeta downloads');
        return cy.wrap(null);
      });
    });
  }

  function ejecutarExportacion(modo, caso, numero, casoId) {
    const descripcionExportacion = getDescripcionExportacion(modo, numero, caso, casoId);
    const nombreResultado = getNombreResultado(modo, numero, caso, casoId);
    const opcionMenu = getOpcionMenu(modo, numero, caso, casoId);

    cy.log(`TC${String(Number(numero)).padStart(3, '0')}: Exportar ${descripcionExportacion} a Excel`);

    return asegurarEnListado()
      .then(() => cy.task('limpiarArchivosDescargados'))
      .then(() => cy.task('listarArchivosDescargados'))
      .then((archivosAntes) => {
        cy.log(`Archivos antes de descargar: ${archivosAntes.length}`);

        return abrirPantalla()
          .then(() => esperarTabla())
          .then(() => obtenerColumnasVisibles())
          .then((columnasVisibles) => {
            return cy.get('button[aria-label="Exportar a Excel"], button[aria-label*="Excel"]', { timeout: 10000 })
              .should('be.visible')
              .scrollIntoView({ block: 'center' })
              .click({ force: true })
              .then(() => cy.wait(500))
              .then(() => seleccionarOpcionExportacion(opcionMenu))
              .then(() => esperarArchivoDescargado(archivosAntes))
              .then((nombreArchivo) => {
                if (!nombreArchivo) {
                  const error = 'No se detectó ningún archivo nuevo descargado';
                  cy.log(`ERROR: ${error}`);
                  return registrarResultado(numero, casoId, nombreResultado, error, 'ERROR', true);
                }

                return cy.task('leerUltimoExcelDescargado').then((excelData) => {
                  if (!excelData || !excelData.rows) {
                    const error = 'No se pudo leer el archivo Excel descargado';
                    cy.log(`ERROR: ${error}`);
                    return registrarResultado(numero, casoId, nombreResultado, error, 'ERROR', true);
                  }

                  const totalFilas = excelData.totalRows;
                  const cabecerasExcel = excelData.rows.length ? Object.keys(excelData.rows[0] || {}) : [];
                  const resultadoValidacion = validarResultado({
                    modo,
                    caso,
                    numero,
                    casoId,
                    descripcionExportacion,
                    excelData,
                    totalFilas,
                    columnasVisibles,
                    cabecerasExcel,
                    normalizarCabecera,
                  });

                  const { resultado, mensaje } = resultadoValidacion;

                  cy.log(`Excel descargado: ${excelData.fileName} con ${totalFilas} filas de datos`);
                  cy.log(`Cabeceras Excel: ${cabecerasExcel.join(', ')}`);
                  cy.log(`Resultado: ${resultado} - ${mensaje}`);

                  return registrarResultado(numero, casoId, nombreResultado, mensaje, resultado, true);
                });
              });
          });
      });
  }

  return {
    exportarExcelVisible: (caso, numero, casoId) => ejecutarExportacion('visible', caso, numero, casoId),
    exportarExcelCompleto: (caso, numero, casoId) => ejecutarExportacion('todo', caso, numero, casoId),
  };
}

module.exports = {
  crearHelperExportacionExcel,
};