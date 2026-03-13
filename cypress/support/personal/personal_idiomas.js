const { crearHelperIdiomasPantalla } = require('../idiomas/idiomas_global');

function crearHelpersIdiomasPersonal(config) {
  const { cambiarIdiomas } = crearHelperIdiomasPantalla({
    ...config,
    abrirFormularioNuevo: config.abrirFormularioNuevoPersonal,
    numeroCasoPorDefecto: 55,
    nombreCasoPorDefecto: 'Tabla responde al cambiar idioma',
  });

  return {
    cambiarIdiomasPersonal: cambiarIdiomas,
  };
}

module.exports = {
  crearHelpersIdiomasPersonal,
};