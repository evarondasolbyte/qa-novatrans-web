const {
  escapeRegex,
  parseFechaBasicaExcel,
  seleccionarFechaEnCalendario,
} = require('./clientes_utils');

function crearHelpersFiltrosClientes(config) {
  const {
    UI,
    clickBotonVisible,
    abrirFormularioNuevoCliente,
    esperarOpcionesMenu,
    PANTALLA,
    HOJA_EXCEL,
    MENU,
    SUBMENU,
    SELECTOR_OPCIONES_MENU,
    ordenarColumna,
    ordenarColumnaDobleClick,
    ocultarColumna,
    mostrarColumna,
  } = config;

  function ejecutarFiltroIndividualExcel(caso, numero) {
    return UI.abrirPantalla().then(() => {
      const preparacion = numero === 23 ? limpiarMultifiltroClientes() : cy.wrap(null);

      return preparacion.then(() => cy.ejecutarFiltroIndividual(
        numero,
        PANTALLA,
        HOJA_EXCEL
      ));
    });
  }

  function ejecutarMultifiltroExcel(caso, numero) {
    UI.esperarTabla();
    return limpiarMultifiltroClientes()
      .then(() => cy.ejecutarMultifiltro(
        numero,
        PANTALLA,
        HOJA_EXCEL,
        MENU,
        SUBMENU
      ));
  }

  function limpiarMultifiltroClientes() {
    return cy.get('body').then(($body) => {
      const botonLimpiar = $body.find('button')
        .filter((_, el) => /^(Limpiar|Clear|Netejar)$/i.test((el.textContent || el.innerText || '').trim()))
        .filter(':visible')
        .first();

      if (!botonLimpiar.length) {
        return cy.wrap(null);
      }

      cy.log('Limpiando multifiltro anterior antes de aplicar el siguiente');
      return cy.wrap(botonLimpiar)
        .scrollIntoView()
        .click({ force: true })
        .then(() => cy.esperarUIEstable(10000));
    });
  }

  function seleccionarNacionalidad(caso, numero) {
    let textoBuscar = '';
    let descripcionCaso = 'Seleccionar nacionalidad';

    if (numero === 25) {
      textoBuscar = 'Nacionales|Nationals|Nacionals';
      descripcionCaso = 'Seleccionar nacionales';
    } else if (numero === 26) {
      textoBuscar = 'U\\.E\\.|UE|EU';
      descripcionCaso = 'Seleccionar U.E.';
    } else if (numero === 27) {
      textoBuscar = 'Extranjeros|Foreigners|Estrangers';
      descripcionCaso = 'Seleccionar extranjeros';
    } else {
      cy.log(`Caso ${numero} no tiene nacionalidad definida`);
      return cy.wrap(null);
    }

    cy.log(`Seleccionando nacionalidad para caso ${numero}: ${textoBuscar}`);

    return UI.abrirPantalla().then(() => {
      clickBotonVisible(/(Filtros avanzados|Advanced filters|Filtres avançats)/i);
      cy.contains('label, span', new RegExp(textoBuscar, 'i'), { timeout: 10000 })
        .should('be.visible')
        .scrollIntoView()
        .click({ force: true });
      clickBotonVisible(/^(Aplicar|Apply)$/i);
      cy.esperarUIEstable(10000);

      return cy.get('body').then(($body) => {
        const textoPantalla = ($body.text() || '').replace(/\s+/g, ' ').trim();
        const overlayText = $body.find('.MuiDataGrid-overlay, .MuiDataGrid-main, [role="grid"]').text() || '';
        const filasVisibles = $body.find('.MuiDataGrid-row:visible').length;
        const tieneNoRows = /No rows|Sin resultados|No se encontraron|No results|Sin filas|No hay datos/i.test(textoPantalla) ||
          /No rows|Sin resultados|No se encontraron|No results|Sin filas|No hay datos/i.test(overlayText);

        if (numero === 25 && (filasVisibles === 0 || tieneNoRows)) {
          const mensajeError = 'No se muestran resultados para el filtro de nacionales';
          cy.log(`ERROR caso ${numero}: ${mensajeError}`);
          return cy.registrarResultados({
            numero,
            nombre: `TC${String(numero).padStart(3, '0')} - ${caso?.nombre || descripcionCaso}`,
            esperado: 'Deben mostrarse clientes nacionales en la tabla',
            obtenido: mensajeError,
            resultado: 'ERROR',
            pantalla: PANTALLA,
          });
        }

        cy.log(`Filtro de nacionalidad aplicado para caso ${numero}`);
        return cy.wrap(null);
      });
    });
  }

  function ordenarColumnaDesdeExcel(caso, numero) {
    let nombreColumna = '';

    if (numero === 28 || numero === 29 || numero === 36) {
      nombreColumna = 'Código';
    } else if (numero === 30) {
      nombreColumna = 'Nombre';
    } else if (numero === 31) {
      nombreColumna = 'Teléfono';
    } else {
      nombreColumna = caso?.valor_etiqueta_1 || caso?.dato_1;
      if (!nombreColumna) {
        cy.log(`Caso ${numero} no tiene columna definida`);
        return cy.wrap(null);
      }
    }

    if (numero === 36) {
      cy.log(`Caso ${numero}: Pulsando 2 veces en la columna "${nombreColumna}"`);
      return ordenarColumnaDobleClick(nombreColumna);
    }

    cy.log(`Ordenando columna "${nombreColumna}" (caso ${numero})`);
    return ordenarColumna(nombreColumna);
  }

  function ocultarColumnaDesdeExcel(caso, numero) {
    let columna = '';
    if (numero === 36) {
      columna = caso?.valor_etiqueta_1 || caso?.dato_1 || 'Código';
    } else {
      columna = caso?.valor_etiqueta_1 || caso?.dato_1 || 'Código';
    }

    cy.log(`Caso ${numero}: Ocultando columna "${columna}"`);
    return ocultarColumna(columna);
  }

  function mostrarColumnaDesdeExcel(caso, numero) {
    let columna = '';
    if (numero === 37) {
      columna = caso?.valor_etiqueta_1 || caso?.dato_1 || 'Código';
    } else {
      columna = caso?.valor_etiqueta_1 || caso?.dato_1 || 'Código';
    }

    cy.log(`Caso ${numero}: Mostrando columna "${columna}"`);
    return mostrarColumna(columna);
  }

  function abrirFormularioDesdeExcel(caso, numero) {
    cy.log(`Caso ${numero}: Abriendo formulario con botón "+ Nuevo"`);
    return UI.abrirPantalla().then(() => abrirFormularioNuevoCliente());
  }

  function guardarFiltroDesdeExcel(caso) {
    return guardarFiltroClientes(caso);
  }

  function limpiarFiltroDesdeExcel(caso) {
    return limpiarFiltroClientes(caso);
  }

  function seleccionarFiltroGuardadoDesdeExcel(caso) {
    return seleccionarFiltroGuardadoClientes(caso);
  }

  function cargaPantalla() {
    return UI.abrirPantalla();
  }

  function clickAplicarCalendario() {
    return cy.get('body').then(($body) => {
      const $botonCalendario = $body.find('button')
        .filter((_, el) => /^Aplicar$/i.test((el.textContent || el.innerText || '').trim()))
        .filter(':visible')
        .filter((_, el) => {
          const contenedor = el.closest('div');
          if (!contenedor) return false;
          const textoContenedor = contenedor.textContent || contenedor.innerText || '';
          return /Cancelar/i.test(textoContenedor);
        })
        .last();

      const $fallback = $body.find('button')
        .filter((_, el) => /^Aplicar$/i.test((el.textContent || el.innerText || '').trim()))
        .filter(':visible')
        .first();

      const $objetivo = $botonCalendario.length ? $botonCalendario : $fallback;

      return cy.wrap($objetivo)
        .should('be.visible')
        .scrollIntoView()
        .click({ force: true });
    });
  }

  function clickAplicarFiltroGeneral() {
    return cy.get('body').then(($body) => {
      const $botonFueraCalendario = $body.find('button')
        .filter((_, el) => /^Aplicar$/i.test((el.textContent || el.innerText || '').trim()))
        .filter(':visible')
        .filter((_, el) => !el.closest('div[role="dialog"], .MuiPopover-root, .MuiPickersPopper-root, .MuiPickerPopper-root'))
        .last();

      const $fallback = $body.find('button')
        .filter((_, el) => /^Aplicar$/i.test((el.textContent || el.innerText || '').trim()))
        .filter(':visible')
        .last();

      const $objetivo = $botonFueraCalendario.length ? $botonFueraCalendario : $fallback;

      if (!$objetivo.length) {
        cy.log('No hay boton Aplicar general visible tras el calendario, se omite este paso');
        return cy.wrap(false);
      }

      return cy.wrap($objetivo)
        .should('be.visible')
        .scrollIntoView()
        .click({ force: true })
        .then(() => true);
    });
  }

  function seleccionarFechasFiltro(caso, numero, casoId) {
    const etiquetaCaso = casoId || `TC${String(numero || 4).padStart(3, '0')}`;

    return UI.abrirPantalla().then(() => {
      cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
      cy.get('.MuiDataGrid-row').should('exist');
      cy.intercept('POST', '**/GetVisor').as('getVisorFechas');

      cy.contains('button', /^Todos$/i).first().click({ force: true });
      cy.wait(300);

      const fechaDesde = caso?.dato_1 || '01/12/2020';
      const fechaHasta = caso?.dato_2 || '04/01/2021';

      cy.log(`${etiquetaCaso}: Seleccionando rango de fechas desde ${fechaDesde} hasta ${fechaHasta}`);

      const fechaInicioObj = parseFechaBasicaExcel(fechaDesde);
      const fechaFinObj = parseFechaBasicaExcel(fechaHasta);

      cy.get('button[label="Fecha de inicio"], button[label*="Fecha"], button[aria-label*="date"]').first().click({ force: true });
      cy.wait(200);

      seleccionarFechaEnCalendario(fechaInicioObj);

      cy.wait(300);

      cy.get('button[label="Fecha de fin"], button[label*="Fecha"], button[aria-label*="date"]').last().click({ force: true });
      cy.wait(200);

      seleccionarFechaEnCalendario(fechaFinObj);

      cy.wait(800);

      cy.log(`${etiquetaCaso}: Pulso el Aplicar interno del calendario`);
      clickAplicarCalendario();
      cy.wait('@getVisorFechas', { timeout: 20000 });
      cy.wait(1500);

      cy.log(`${etiquetaCaso}: Reviso si queda un Aplicar general pendiente`);
      clickAplicarFiltroGeneral().then((sePulsoAplicarGeneral) => {
        if (sePulsoAplicarGeneral) {
          cy.log(`${etiquetaCaso}: Pulso el Aplicar del filtro para refrescar la tabla`);
          cy.wait('@getVisorFechas', { timeout: 20000 });
        } else {
          cy.log(`${etiquetaCaso}: El Aplicar interno ya refresco la tabla, no se repite`);
        }
      });
      cy.wait(2000);
      cy.esperarUIEstable(15000);
      cy.get('.MuiDataGrid-root', { timeout: 15000 }).should('be.visible');
      cy.get('.MuiDataGrid-row', { timeout: 15000 }).should('have.length.greaterThan', 0);
      cy.wait(1200);
      
      return cy.get('body').then(($body) => {
        const textoVisible = ($body.text() || '').replace(/\s+/g, ' ').trim();
        const muestraClavesInternas = /clients\.table\.filters\.dateFrom|clients\.table\.filters\.dateTo/i.test(textoVisible);
        const tieneDesde = /\bDesde\b/i.test(textoVisible);
        const tieneHasta = /\bHasta\b/i.test(textoVisible);

        if (muestraClavesInternas || !tieneDesde || !tieneHasta) {
          const mensajeError = muestraClavesInternas
            ? 'El filtro de fechas muestra las claves internas dateFrom/dateTo en vez de "Desde" y "Hasta"'
            : 'El filtro de fechas no muestra correctamente las etiquetas "Desde" y "Hasta"';

          cy.log(`${etiquetaCaso}: ERROR - ${mensajeError}`);
          return cy.registrarResultados({
            numero: numero || 4,
            nombre: `${etiquetaCaso} - ${caso?.nombre || 'Seleccionar fechas en el filtro'}`,
            esperado: 'El filtro de fechas debe mostrar "Desde" y "Hasta"',
            obtenido: mensajeError,
            resultado: 'ERROR',
            pantalla: PANTALLA,
          });
        }

        cy.log(`${etiquetaCaso}: Filtro de fechas aplicado y tabla refrescada`);
        return cy.wrap(null);
      });
    });
  }

  function guardarFiltroClientes(caso = {}) {
    const columna = /column/i.test(caso?.valor_etiqueta_1 || '') ? (caso?.dato_1 || '') : '';
    const termino = /search/i.test(caso?.valor_etiqueta_2 || '') ? (caso?.dato_2 || '') : '';
    const nombreFiltro = 'filtro código';
    if (!termino) {
      cy.log('Excel no define criterio para guardar filtro');
      return cy.wrap(null);
    }
    return UI.abrirPantalla()
      .then(() => limpiarMultifiltroClientes())
      .then(() => seleccionarCampoFiltroClientes(columna))
      .then(() => UI.buscar(termino))
      .then(() => {
        cy.contains('button', /(Guardar|Save|Desar)/i).click({ force: true });
        cy.get('input[placeholder*="nombre"], input[placeholder*="Nombre"], input[placeholder*="name"], input[placeholder*="Name"], input[placeholder*="nom"], input[placeholder*="Nom"]')
          .clear({ force: true })
          .type(nombreFiltro, { force: true });
        return cy.contains('button', /(Guardar|Save|Desar)/i).click({ force: true });
      });
  }

  function limpiarFiltroClientes() {
    return UI.abrirPantalla()
      .then(() => clickBotonVisible(/^(Limpiar|Clear|Netejar)$/i))
      .then(() => cy.esperarUIEstable(10000));
  }

  function seleccionarFiltroGuardadoClientes(caso = {}) {
    const filtroNombre = caso?.dato_1 || caso?.valor_etiqueta_1 || 'filtro código';
    return UI.abrirPantalla()
      .then(() => clickBotonVisible(/(Guardados|Saved|Guardats)/i))
      .then(() => esperarOpcionesMenu())
      .then(() => cy.contains(SELECTOR_OPCIONES_MENU, new RegExp(filtroNombre, 'i'), { timeout: 10000 }).click({ force: true }));
  }

  function seleccionarCampoFiltroClientes(nombreCampo) {
    return cy.contains('button, [role="button"], .MuiSelect-select', /Multifiltro/i, { timeout: 10000 })
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true })
      .then(() => esperarOpcionesMenu())
      .then(() => {
        return cy.contains(SELECTOR_OPCIONES_MENU, new RegExp(`^${nombreCampo}$`, 'i'), { timeout: 10000 })
          .should('be.visible')
          .scrollIntoView()
          .click({ force: true });
      });
  }

  return {
    ejecutarFiltroIndividualExcel,
    ejecutarMultifiltroExcel,
    limpiarMultifiltroClientes,
    seleccionarNacionalidad,
    ordenarColumnaDesdeExcel,
    ocultarColumnaDesdeExcel,
    mostrarColumnaDesdeExcel,
    abrirFormularioDesdeExcel,
    guardarFiltroDesdeExcel,
    limpiarFiltroDesdeExcel,
    seleccionarFiltroGuardadoDesdeExcel,
    cargaPantalla,
    parseFechaBasicaExcel,
    seleccionarFechaEnCalendario,
    seleccionarFechasFiltro,
    guardarFiltroClientes,
    limpiarFiltroClientes,
    seleccionarFiltroGuardadoClientes,
    seleccionarCampoFiltroClientes,
  };
}

module.exports = {
  crearHelpersFiltrosClientes,
};
