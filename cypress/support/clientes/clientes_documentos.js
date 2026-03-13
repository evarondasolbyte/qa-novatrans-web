const { crearHelpersDocumentosGlobales } = require('../documentos/documentos_global');

function crearHelpersDocumentosClientes() {
  return crearHelpersDocumentosGlobales();
}

module.exports = {
  crearHelpersDocumentosClientes,
};