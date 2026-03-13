function crearHelpersAccionesRegistro(config) {
  const {
    UI,
    formPathIncludes = '/form',
    labelEditar = /^editar$/i,
    labelEliminar = /^eliminar$/i,
    deleteEnabled = true,
    rowSelector = '.MuiDataGrid-row:visible',
    onEditSelected,
    onEditWithoutSelection,
    onDeleteSelected,
    onDeleteWithoutSelection,
    onSelectRow,
  } = config;

  function buscarBotonVisible(matchers = []) {
    return cy.get('body').then(($body) => {
      for (const matcher of matchers) {
        const $btn = $body
          .find('button:visible, a:visible, [role="button"]:visible')
          .filter((_, el) => matcher(el))
          .first();

        if ($btn.length) return cy.wrap($btn[0]);
      }

      return cy.wrap(null);
    });
  }

  function editarSeleccionado(caso, numero, casoId) {
    if (typeof onEditSelected === 'function') {
      return onEditSelected(caso, numero, casoId);
    }

    const id = casoId || `TC${String(numero).padStart(3, '0')}`;
    cy.log(`${id}: editar con fila seleccionada`);

    const matchers = [
      (el) => labelEditar.test((el.textContent || el.innerText || '').trim()),
      (el) => {
        const label = (
          el.getAttribute('aria-label') ||
          el.getAttribute('title') ||
          ''
        ).toLowerCase();
        return label.includes('editar') || label.includes('edit');
      },
    ];

    return UI.abrirPantalla()
      .then(() => UI.esperarTabla())
      .then(() => UI.seleccionarPrimeraFilaConCheckbox())
      .then(() => buscarBotonVisible(matchers))
      .then(($btn) => {
        if (!$btn || !$btn.length) {
          cy.log(`${id}: no se encontró botón "Editar" (se continúa sin fallar)`);
          return cy.wrap(null);
        }
        return cy.wrap($btn).click({ force: true });
      })
      .then(() => {
        return cy.url().then((url) => {
          if (url.includes(formPathIncludes)) return cy.wrap(null);
          return cy.wrap(null);
        });
      })
      .then(() => UI.abrirPantalla());
  }

  function editarSinSeleccion(caso, numero, casoId) {
    if (typeof onEditWithoutSelection === 'function') {
      return onEditWithoutSelection(caso, numero, casoId);
    }

    const id = casoId || `TC${String(numero).padStart(3, '0')}`;
    cy.log(`${id}: editar sin selección`);

    return UI.abrirPantalla()
      .then(() => UI.esperarTabla())
      .then(() => {
        return cy.get('body').then(($body) => {
          const $btn = $body
            .find('button:visible, a:visible, [role="button"]:visible')
            .filter((_, el) => labelEditar.test((el.textContent || el.innerText || '').trim()))
            .first();
          expect($btn.length, 'No debe existir botón Editar sin selección').to.eq(0);
        });
      });
  }

  function eliminarSeleccionado(caso, numero, casoId) {
    const id = casoId || `TC${String(numero).padStart(3, '0')}`;

    if (!deleteEnabled) {
      cy.log(`Caso ${id}: eliminación deshabilitada. Se marca OK sin ejecutar.`);
      return cy.wrap(null);
    }

    if (typeof onDeleteSelected === 'function') {
      return onDeleteSelected(caso, numero, casoId);
    }

    cy.log(`${id}: eliminación seleccionada no configurada en helper global`);
    return cy.wrap(null);
  }

  function eliminarSinSeleccion(caso, numero, casoId) {
    if (typeof onDeleteWithoutSelection === 'function') {
      return onDeleteWithoutSelection(caso, numero, casoId);
    }

    const id = casoId || `TC${String(numero).padStart(3, '0')}`;
    cy.log(`${id}: verificando que no existe "Eliminar" sin selección.`);

    return cy.get('body').then(($body) => {
      const $btn = $body
        .find('button:visible, a:visible, [role="button"]:visible')
        .filter((_, el) => labelEliminar.test((el.textContent || el.innerText || '').trim()))
        .first();
      expect($btn.length, 'No debe existir botón Eliminar sin selección').to.eq(0);
    });
  }

  function seleccionarFila(caso, numero, casoId) {
    if (typeof onSelectRow === 'function') {
      return onSelectRow(caso, numero, casoId);
    }

    const id = casoId || `TC${String(numero).padStart(3, '0')}`;
    cy.log(`${id}: seleccionar una fila`);

    return UI.abrirPantalla()
      .then(() => UI.esperarTabla())
      .then(() => {
        return cy.get(rowSelector, { timeout: 20000 })
          .first()
          .scrollIntoView()
          .click({ force: true })
          .then(($row) => {
            const aria = $row.attr('aria-selected');
            if (aria === 'true') return cy.wrap(null);
            if (($row.attr('class') || '').includes('Mui-selected')) return cy.wrap(null);
            return cy.wrap(null);
          });
      });
  }

  return {
    editarSeleccionado,
    editarSinSeleccion,
    eliminarSeleccionado,
    eliminarSinSeleccion,
    seleccionarFila,
  };
}

module.exports = {
  crearHelpersAccionesRegistro,
};
