const { escapeRegex } = require('./personal_utils');

function crearHelpersFiltrosPersonal(config) {
  const {
    UI,
    PANTALLA,
    HOJA_EXCEL,
    MENU,
    SUBMENU,
    ordenarColumna,
    ocultarColumna,
    mostrarColumna,
  } = config;

  function ejecutarFiltroIndividualExcel(caso, numero) {
    return UI.abrirPantalla().then(() => cy.ejecutarFiltroIndividual(numero, PANTALLA, HOJA_EXCEL));
  }

  function ejecutarBusquedaGeneralExcel(caso, numero, casoId) {
    const idCaso = casoId || `TC${String(numero).padStart(3, '0')}`;
    const texto = caso?.dato_2 || caso?.valor_etiqueta_1 || caso?.dato_1 || '';
    cy.log(`${idCaso}: Buscando "${texto}" en el buscador general`);

    if (!texto) {
      cy.log(`${idCaso}: no hay texto para buscar (dato_2/valor_etiqueta_1/dato_1 vacíos)`);
      return cy.wrap(null);
    }

    return UI.abrirPantalla().then(() => UI.buscar(texto));
  }

  function ordenarColumnaDesdeExcel(caso, numero) {
    let nombreColumna = '';

    if (numero === 14) nombreColumna = 'Código';
    else if (numero === 15) nombreColumna = 'NIF/CIF';
    else if (numero === 16) nombreColumna = 'Nombre';
    else if (numero === 17) nombreColumna = 'Tlf. Empresa';
    else if (numero === 18) nombreColumna = 'Teléfono';
    else if (numero === 19) nombreColumna = 'Empresa';
    else if (numero === 20) nombreColumna = 'Móvil';
    else {
      nombreColumna = caso?.valor_etiqueta_1 || caso?.dato_1;
      if (!nombreColumna) {
        cy.log(`Caso ${numero} no tiene columna definida`);
        return cy.wrap(null);
      }
    }

    cy.log(`Ordenando columna "${nombreColumna}" (caso ${numero})`);
    if (numero === 20) {
      return UI.abrirPantalla().then(() => {
        cy.get('.MuiDataGrid-virtualScroller').scrollTo('right', { duration: 400 });
        cy.wait(300);
        return ordenarColumna(nombreColumna);
      });
    }

    return ordenarColumna(nombreColumna);
  }

  function ocultarColumnaDesdeExcel(caso, numero) {
    const columna = caso?.valor_etiqueta_1 || caso?.dato_1 || 'Código';
    cy.log(`Caso ${numero}: Ocultando columna "${columna}"`);
    return ocultarColumna(columna);
  }

  function mostrarColumnaDesdeExcel(caso, numero) {
    const columna = numero === 22 ? 'Código' : (caso?.valor_etiqueta_1 || caso?.dato_1 || 'Código');
    cy.log(`Caso ${numero}: Mostrando columna "${columna}"`);
    return mostrarColumna(columna);
  }

  function ejecutarMultifiltroExcel(caso, numero) {
    return cy.ejecutarMultifiltro(numero, PANTALLA, HOJA_EXCEL, MENU, SUBMENU);
  }

  function seleccionarColumnaCodigo() {
    return cy.get('body').then(($body) => {
      if ($body.find('select[name="column"], select#column').length > 0) {
        return cy.get('select[name="column"], select#column')
          .filter(':visible')
          .first()
          .then(($select) => {
            const options = [...$select[0].options].map((opt) => opt.text.trim());
            const columnaCodigo = options.find((o) => /C[oó]digo|Code/i.test(o));
            if (columnaCodigo) {
              cy.wrap($select).select(columnaCodigo, { force: true });
              cy.log(`Columna seleccionada para filtros guardados: ${columnaCodigo}`);
            }
            return cy.wrap(null);
          });
      }

      return cy.contains('button, [role="button"], div[role="button"]', /Multifiltro|Nombre|C[oó]digo|Code/i, { timeout: 10000 })
        .filter(':visible')
        .first()
        .click({ force: true })
        .then(() => cy.wait(300))
        .then(() => {
          return cy.contains('li[role="menuitem"], [role="option"], .MuiMenuItem-root', /^C[oó]digo$/i, { timeout: 10000 })
            .filter(':visible')
            .first()
            .click({ force: true });
        });
    });
  }

  function aplicarBusquedaCodigoDesdeCaso(caso = {}) {
    const termino = caso?.dato_2 || caso?.valor_etiqueta_2 || caso?.dato_1 || caso?.valor_etiqueta_1 || '';
    if (!termino) {
      cy.log('Excel no define criterio de búsqueda para Código');
      return cy.wrap(null);
    }

    return UI.abrirPantalla()
      .then(() => seleccionarColumnaCodigo())
      .then(() => UI.buscar(termino));
  }

  function guardarFiltroDesdeExcel(caso = {}, numero, casoId) {
    const termino = caso?.dato_2 || caso?.valor_etiqueta_2 || caso?.dato_1 || caso?.valor_etiqueta_1 || '';
    const nombreFiltro = caso?.dato_3 || caso?.valor_etiqueta_3 || caso?.dato_1 || caso?.valor_etiqueta_1 || 'filtro personal';
    if (!termino) {
      cy.log('Excel no define criterio para guardar filtro');
      return cy.wrap(null);
    }

    const validarToastGuardado = () => {
      const leerTextoToast = ($body) => {
        const textoAlertas = $body
          .find('[role="alert"]:visible, .MuiAlert-root:visible, .MuiSnackbar-root:visible, .notistack-Snackbar:visible')
          .map((_, el) => (el.textContent || el.innerText || '').trim())
          .get()
          .join(' | ');
        const textoVisible = $body
          .find('*:visible')
          .map((_, el) => (el.textContent || el.innerText || '').trim())
          .get()
          .join(' | ');

        return (textoAlertas || textoVisible || $body.text() || '').trim();
      };

      const detectarResultadoToast = (texto) => {
        const textoLower = String(texto || '').toLowerCase();

        if (/personnel\.notifications\.filtersaved/i.test(texto)) {
          return {
            __resultado: 'ERROR',
            obtenido: 'El mensaje de guardado del filtro sale mal traducido: personnel.notifications.filterSaved',
          };
        }

        if (
          textoLower.includes('guardado correctamente') ||
          textoLower.includes('guardado exitosamente') ||
          textoLower.includes('saved successfully') ||
          textoLower.includes('filter saved')
        ) {
          return null;
        }

        return undefined;
      };

      const reintentar = (intento = 0) => {
        return cy.get('body', { timeout: 10000 }).then(($body) => {
          const texto = leerTextoToast($body);
          const resultado = detectarResultadoToast(texto);

          if (resultado !== undefined) {
            if (resultado === null) {
              cy.log(`Mensaje de guardado correcto detectado: ${texto}`);
              return cy.wrap(null);
            }
            cy.log(`Mensaje de guardado incorrecto detectado: ${texto}`);
            return cy.wrap(resultado);
          }

          if (intento >= 8) {
            cy.log('No se detectó un toast claro de guardado; se continúa sin forzar error');
            return cy.wrap(null);
          }

          return cy.wait(500).then(() => reintentar(intento + 1));
        });
      };

      return reintentar();
    };

    return aplicarBusquedaCodigoDesdeCaso(caso)
      .then(() => {
        cy.contains('button', /(Guardar|Save|Desar)/i).click({ force: true });
        cy.get(
          'input[placeholder*="nombre"], input[placeholder*="Nombre"], input[placeholder*="name"], input[placeholder*="Name"], input[placeholder*="nom"], input[placeholder*="Nom"]'
        )
          .click({ force: true })
          .type(nombreFiltro, { force: true, delay: 0 });
        return cy.contains('button', /(Guardar|Save|Desar)/i).click({ force: true });
      })
      .then(() => cy.wait(500))
      .then(() => validarToastGuardado())
      .then((resultadoToast) => {
        if (resultadoToast && resultadoToast.__resultado === 'ERROR') {
          const idCaso = casoId || `TC${String(numero || '').padStart(3, '0')}`;
          const nombreCaso = caso?.nombre || 'Guardar filtro';
          return cy.registrarResultados({
            numero,
            nombre: `${idCaso} - ${nombreCaso}`,
            esperado: 'Comportamiento correcto',
            obtenido: resultadoToast.obtenido,
            resultado: 'ERROR',
            pantalla: PANTALLA,
          }).then(() => cy.wrap({
            __resultado: 'ERROR_REGISTRADO',
            obtenido: resultadoToast.obtenido,
          }));
        }

        return cy.wrap(resultadoToast || null);
      });
  }

  function limpiarFiltroDesdeExcel(caso = {}) {
    return aplicarBusquedaCodigoDesdeCaso(caso)
      .then(() => cy.contains('button', /(Limpiar|Clear|Netejar)/i).click({ force: true }));
  }

  function seleccionarFiltroGuardadoDesdeExcel(caso = {}, numero, casoId) {
    const filtroNombre = caso?.dato_3 || caso?.valor_etiqueta_3 || caso?.dato_1 || caso?.valor_etiqueta_1 || 'filtro personal';
    return guardarFiltroDesdeExcel(caso, numero, casoId).then((resultadoGuardado) => {
      if (resultadoGuardado && (resultadoGuardado.__resultado === 'ERROR' || resultadoGuardado.__resultado === 'ERROR_REGISTRADO')) {
        return cy.wrap(resultadoGuardado);
      }
      cy.contains('button', /(Guardados|Saved|Guardats)/i).click({ force: true });
      return cy.contains('li, [role="option"]', new RegExp(escapeRegex(filtroNombre), 'i')).click({ force: true });
    });
  }

  function resetFiltrosAlRecargar(caso, numero, casoId) {
    cy.log(`${casoId || `TC${String(numero).padStart(3, '0')}`}: reset filtros recargando`);
    return cy.reload().then(() => UI.abrirPantalla());
  }

  function aplicarFechaFiltro(caso, numero, casoId) {
    cy.log(`${casoId || `TC${String(numero).padStart(3, '0')}`}: aplicar filtro de fecha desde Excel`);
    return ejecutarFiltroIndividualExcel(caso, numero, casoId);
  }

  function seleccionarFiltroPropietario(caso, numero, casoId) {
    const idCaso = casoId || `TC${String(numero).padStart(3, '0')}`;
    const esperadoPorCaso =
      numero === 52 ? 'Propio' :
        numero === 53 ? 'Tercero' :
          numero === 54 ? 'Anexo' :
            (caso?.dato_2 || caso?.dato_1 || caso?.valor_etiqueta_2 || caso?.valor_etiqueta_1 || 'Propio');

    cy.log(`${idCaso}: validar filtro Propietario => ${esperadoPorCaso}`);

    const registrarErrorPropietario = (obtenido) => {
      return cy.registrarResultados({
        numero,
        nombre: `${idCaso} - ${caso?.nombre || 'Aplicar filtros'}`,
        esperado: `Al filtrar por "${esperadoPorCaso}", el registro abierto debe tener marcado "${esperadoPorCaso}" en Propietario`,
        obtenido,
        resultado: 'ERROR',
        pantalla: PANTALLA,
      }).then(() => cy.wrap({
        __resultado: 'ERROR_REGISTRADO',
        obtenido,
      }));
    };

    return UI.abrirPantalla()
      .then(() => {
        cy.log(`${idCaso}: abriendo filtros avanzados...`);
        cy.contains('button, [role="button"]', /(Filtros avanzados|Advanced filters|Filtres avan)/i, { timeout: 10000 })
          .filter(':visible')
          .first()
          .click({ force: true });
        cy.wait(500);

        cy.log(`${idCaso}: seleccionando opción "${esperadoPorCaso}"...`);
        return cy.contains('label, span, button, div', new RegExp(`^${escapeRegex(esperadoPorCaso)}$`, 'i'), { timeout: 10000 })
          .filter(':visible')
          .first()
          .click({ force: true });
      })
      .then(() => {
        cy.wait(400);
        cy.log(`${idCaso}: aplicando filtro de Propietario...`);
        return cy.contains('button', /^(Aplicar|Apply)$/i, { timeout: 10000 })
          .filter(':visible')
          .first()
          .click({ force: true });
      })
      .then(() => cy.wait(800))
      .then(() => cy.esperarUIEstable(10000))
      .then(() => {
        cy.log(`${idCaso}: esperando a que la tabla refresque...`);
        return UI.esperarTabla();
      })
      .then(() => cy.wait(800))
      .then(() => {
        return cy.get('body').then(($body) => {
          const filas = $body.find('.MuiDataGrid-row:visible');
          if (!filas.length) {
            return cy.wrap({
              __resultado: 'ERROR',
              obtenido: `No se muestran resultados al filtrar por Propietario "${esperadoPorCaso}"`,
            });
          }

          cy.log(`${idCaso}: resultados cargados, abriendo el primer registro para comprobarlo...`);
          return cy.get('.MuiDataGrid-row:visible', { timeout: 10000 })
            .first()
            .should('be.visible')
            .dblclick({ force: true })
            .then(() => cy.wait(800))
            .then(() => cy.wrap(null));
        });
      })
      .then((resultadoPrevio) => {
        if (resultadoPrevio && resultadoPrevio.__resultado === 'ERROR') return cy.wrap(resultadoPrevio);

        return cy.url({ timeout: 10000 }).then((url) => {
          if (!url.includes('/dashboard/personnel/form')) {
            return cy.wrap({
              __resultado: 'ERROR',
              obtenido: 'No se pudo abrir el formulario de edición tras aplicar el filtro de Propietario',
            });
          }

          return cy.get('body').then(($body) => {
            const $tabs = $body.find('button, [role="tab"], div, span').filter((_, el) =>
              /^Datos personales$/i.test((el.textContent || el.innerText || '').trim())
            ).filter(':visible');

            if ($tabs.length) {
              cy.log(`${idCaso}: entrando en la pestaña "Datos personales"...`);
              return cy.wrap($tabs[0]).click({ force: true }).then(() => cy.wait(500));
            }

            return cy.wrap(null);
          }).then(() => {
            cy.log(`${idCaso}: comprobando el radio marcado en "Propietario"...`);
            return cy.contains('label', /^Propietario$/i, { timeout: 10000 })
              .should('be.visible')
              .then(($label) => {
                const contenedor = $label.closest('.MuiFormControl-root, .MuiFormGroup-root, form, div').first();
                if (!contenedor.length) {
                  return cy.wrap({
                    __resultado: 'ERROR',
                    obtenido: 'No se encontró el bloque "Propietario" en Datos personales',
                  });
                }

                const radios = Array.from(contenedor.find('input[type="radio"]'));
                const opcionMarcada = radios.find((radio) => Boolean(radio.checked));

                if (!opcionMarcada) {
                  return cy.wrap({
                    __resultado: 'ERROR',
                    obtenido: 'No hay ningún radio marcado en "Propietario"',
                  });
                }

                const obtenerTextoRadio = (radio) => {
                  const $radio = Cypress.$(radio);
                  const $label = $radio.closest('label');
                  if ($label.length) return ($label.text() || '').trim();

                  const $wrapper = $radio.parent().parent();
                  const textoWrapper = ($wrapper.text() || '').trim();
                  if (textoWrapper) return textoWrapper;

                  const $siblings = $radio.parent().siblings();
                  return ($siblings.text() || '').trim();
                };

                const valorMarcado = obtenerTextoRadio(opcionMarcada).replace(/\s+/g, ' ');
                if (!new RegExp(`^${escapeRegex(esperadoPorCaso)}$`, 'i').test(valorMarcado)) {
                  return cy.wrap({
                    __resultado: 'ERROR',
                    obtenido: `El filtro por "${esperadoPorCaso}" muestra un registro con Propietario "${valorMarcado}"`,
                  });
                }

                cy.log(`${idCaso}: Propietario validado correctamente => ${valorMarcado}`);
                return cy.wrap(null);
              });
          });
        });
      })
      .then((resultadoFinal) => {
        if (resultadoFinal && resultadoFinal.__resultado === 'ERROR') {
          return registrarErrorPropietario(resultadoFinal.obtenido || 'Error al validar filtro Propietario');
        }
        return cy.wrap(resultadoFinal || null);
      });
  }

  function seleccionarFiltroNacionalidad(caso, numero, casoId) {
    cy.log(`${casoId || `TC${String(numero).padStart(3, '0')}`}: selector legado Nacionalidad -> usando Propietario`);
    return seleccionarFiltroPropietario(caso, numero, casoId);
  }

  return {
    ejecutarFiltroIndividualExcel,
    ejecutarBusquedaGeneralExcel,
    ordenarColumnaDesdeExcel,
    ocultarColumnaDesdeExcel,
    mostrarColumnaDesdeExcel,
    ejecutarMultifiltroExcel,
    guardarFiltroDesdeExcel,
    limpiarFiltroDesdeExcel,
    seleccionarFiltroGuardadoDesdeExcel,
    resetFiltrosAlRecargar,
    aplicarFechaFiltro,
    seleccionarFiltroPropietario,
    seleccionarFiltroNacionalidad,
  };
}

module.exports = {
  crearHelpersFiltrosPersonal,
};
