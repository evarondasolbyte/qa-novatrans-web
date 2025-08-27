describe('FICHEROS - TELÉFONOS - Validación completa con gestión de errores y reporte a Excel', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';

  const casos = [
    { numero: 1,  nombre: 'TC001 - Cargar la pantalla de "Teléfonos" correctamente', funcion: TC001 },
    { numero: 2,  nombre: 'TC002 - Ordenar por "Número" ascendente', funcion: TC002 },
    { numero: 3,  nombre: 'TC003 - Ordenar por "Número" descendente', funcion: TC003 },
    { numero: 4,  nombre: 'TC004 - Ordenar por "Modelo" ascendente', funcion: TC004 },
    { numero: 5,  nombre: 'TC005 - Ordenar por "Modelo" descendente', funcion: TC005 },
    { numero: 6,  nombre: 'TC006 - Ordenar por "Poseedor" ascendente', funcion: TC006 },
    { numero: 7,  nombre: 'TC007 - Ordenar por "Poseedor" descendente', funcion: TC007 },
    { numero: 8,  nombre: 'TC008 - Ordenar por "Extensión" ascendente', funcion: TC008 },
    { numero: 9,  nombre: 'TC009 - Ordenar por "Extensión" descendente', funcion: TC009 },
    { numero: 10, nombre: 'TC010 - Filtrar por "Número"', funcion: TC010 },
    { numero: 11, nombre: 'TC011 - Filtrar por "Modelo"', funcion: TC011 },
    { numero: 12, nombre: 'TC012 - Filtrar por "Poseedor"', funcion: TC012 },
    { numero: 13, nombre: 'TC013 - Filtrar por "Activo"', funcion: TC013 },
    { numero: 14, nombre: 'TC014 - Filtrar por "Extensión" exacta', funcion: TC014 },
    { numero: 15, nombre: 'TC015 - Filtrar un Modelo por campo "Value" (menú columna)', funcion: TC015 },
    { numero: 16, nombre: 'TC016 - Buscar texto en mayúsculas/minúsculas alternadas', funcion: TC016 },
    { numero: 17, nombre: 'TC017 - Buscar caracteres especiales', funcion: TC017 },
    { numero: 18, nombre: 'TC018 - Buscar texto sin coincidencias', funcion: TC018 },
    { numero: 19, nombre: 'TC019 - Limpiar el filtro y mostrar todos los registros', funcion: TC019 },
    { numero: 20, nombre: 'TC020 - Seleccionar un teléfono individual', funcion: TC020 },
    { numero: 21, nombre: 'TC021 - Botón "Editar" sin selección', funcion: TC021 },
    { numero: 22, nombre: 'TC022 - Botón "Editar" con un teléfono seleccionado', funcion: TC022 },
    { numero: 23, nombre: 'TC023 - Botón "Eliminar" sin selección', funcion: TC023 },
    { numero: 24, nombre: 'TC024 - Botón "Eliminar" con uno o varios seleccionado', funcion: TC024 },
    { numero: 25, nombre: 'TC025 - Botón "+ Añadir" abre formulario', funcion: TC025 },
    { numero: 26, nombre: 'TC026 - Ocultar columna desde el menú contextual', funcion: TC026 },
    { numero: 27, nombre: 'TC027 - Mostrar/ocultar columnas desde "Manage columns"', funcion: TC027 },
    { numero: 28, nombre: 'TC028 - Scroll vertical', funcion: TC028 },
    { numero: 29, nombre: 'TC029 - Cambio de idioma a "Inglés"', funcion: TC029 },
    { numero: 30, nombre: 'TC030 - Cambio de idioma a "Catalán"', funcion: TC030 },
    { numero: 31, nombre: 'TC031 - Cambio de idioma a "Español"', funcion: TC031 },
    { numero: 32, nombre: 'TC032 - Recargar la página con filtros aplicados', funcion: TC032 },
  ];

  // Resumen final
  after(() => {
    cy.procesarResultadosPantalla('Ficheros (Teléfonos)');
  });

  // Iterador de casos con el mismo patrón que "Otros Gastos"
  casos.forEach(({ numero, nombre, funcion }) => {
    it(nombre, () => {
      // ✅ usar el helper que sí existe
      cy.resetearFlagsTest();

      cy.on('fail', (err) => {
        cy.capturarError(nombre, err, {
          numero,
          nombre,
          esperado: 'Comportamiento correcto',
          archivo,
          pantalla: 'Ficheros (Teléfonos)'
        });
        return false;
      });

      cy.login();
      cy.wait(500);

      // Todas las funciones devuelven un chainable
      return funcion().then(() => {
        // TC023 y TC024 registran dentro del propio caso
        if (numero !== 23 && numero !== 24) {
          cy.estaRegistrado().then((ya) => {
            if (!ya) {
              cy.registrarResultados({
                numero,
                nombre,
                esperado: 'Comportamiento correcto',
                obtenido: 'Comportamiento correcto',
                resultado: 'OK',
                archivo,
                pantalla: 'Ficheros (Teléfonos)'
              });
            }
          });
        }
      });
    });
  });

  // ==== FUNCIONES ====

  function ir() {
    return cy.navegarAMenu('Ficheros', 'Teléfonos').then(() => {
      cy.url({ timeout: 15000 }).should('include', '/dashboard/telephones');
      return cy.get('.MuiDataGrid-root', { timeout: 10000 }).should('be.visible');
    });
  }

  function TC001() {
    return ir().then(() => cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0));
  }

  function TC002() {
    return ir().then(() => {
      cy.contains('.MuiDataGrid-columnHeader', 'Número').click();
      return cy.get('.MuiDataGrid-row .MuiDataGrid-cell:nth-child(2)').then($cells => {
        const nums = [...$cells].map(c => parseInt(c.innerText.trim(), 10));
        const orden = [...nums].sort((a,b)=>a-b);
        expect(nums).to.deep.equal(orden);
      });
    });
  }

  function TC003() {
    return ir().then(() => {
      cy.contains('.MuiDataGrid-columnHeader', 'Número').click().click();
      return cy.get('.MuiDataGrid-row .MuiDataGrid-cell:nth-child(2)').then($cells => {
        const nums = [...$cells].map(c => parseInt(c.innerText.trim(), 10));
        const orden = [...nums].sort((a,b)=>b-a);
        expect(nums).to.deep.equal(orden);
      });
    });
  }

  function TC004() {
    return ir().then(() => {
      cy.contains('.MuiDataGrid-columnHeader', 'Modelo').click();
      return cy.get('.MuiDataGrid-row .MuiDataGrid-cell:nth-child(3)').then($cells => {
        const arr = [...$cells].map(c => c.innerText.trim());
        const ord = [...arr].sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
        expect(arr).to.deep.equal(ord);
      });
    });
  }

  function TC005() {
    return ir().then(() => {
      cy.contains('.MuiDataGrid-columnHeader', 'Modelo').click().click();
      return cy.get('.MuiDataGrid-cell:nth-child(3)').then($cells => {
        const arr = [...$cells].map(c => c.innerText.trim());
        const ord = [...arr].sort((a,b)=>b.localeCompare(a,'es',{sensitivity:'base'}));
        expect(arr).to.deep.equal(ord);
      });
    });
  }

  function TC006() {
    return ir().then(() => {
      cy.contains('.MuiDataGrid-columnHeader', 'Poseedor').click();
      return cy.get('.MuiDataGrid-cell:nth-child(4)').then($cells => {
        const arr = [...$cells].map(c => c.innerText.trim().toLowerCase()).filter(Boolean);
        const ord = [...arr].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
        expect(arr).to.deep.equal(ord);
      });
    });
  }

  function TC007() {
    return ir().then(() => {
      cy.contains('.MuiDataGrid-columnHeader', 'Poseedor').click().click();
      return cy.get('.MuiDataGrid-cell:nth-child(4)').then($cells => {
        const arr = [...$cells].map(c => c.innerText.trim().toLowerCase()).filter(Boolean);
        const ord = [...arr].sort((a,b)=>b.localeCompare(a,'es',{numeric:true}));
        expect(arr).to.deep.equal(ord);
      });
    });
  }

  function TC008() {
    return ir().then(() => {
      cy.contains('.MuiDataGrid-columnHeader', 'Extensión').click();
      return cy.get('.MuiDataGrid-cell:nth-child(5)').then($cells => {
        const arr = [...$cells].map(c => Number(c.innerText.trim())).filter(n=>!isNaN(n));
        const ord = [...arr].sort((a,b)=>a-b);
        expect(arr).to.deep.equal(ord);
      });
    });
  }

  function TC009() {
    return ir().then(() => {
      cy.contains('.MuiDataGrid-columnHeader', 'Extensión').click().click();
      return cy.get('.MuiDataGrid-cell:nth-child(5)').then($cells => {
        const arr = [...$cells].map(c => Number(c.innerText.trim())).filter(n=>!isNaN(n));
        const ord = [...arr].sort((a,b)=>b-a);
        expect(arr).to.deep.equal(ord);
      });
    });
  }

  function TC010() {
    return ir().then(() => {
      cy.get('select[name="column"]').select('Número');
      cy.get('input#search[placeholder="Buscar"]').clear({force:true}).type('7777{enter}',{force:true});
      return cy.get('.MuiDataGrid-row:visible').each(($row)=>{
        cy.wrap($row).find('[data-field="number"]').invoke('text').should('include','7777');
      });
    });
  }

  function TC011() {
    return ir().then(() => {
      cy.get('select[name="column"]').select('Modelo');
      cy.get('input#search[placeholder="Buscar"]').clear({force:true}).type('nokia{enter}',{force:true});
      return cy.get('.MuiDataGrid-row:visible').each(($row)=>{
        cy.wrap($row).find('[data-field="model"]').invoke('text').then(t=> {
          expect(t.toLowerCase()).to.include('nokia');
        });
      });
    });
  }

  function TC012() {
    return ir().then(() => {
      cy.get('select[name="column"]').select('Poseedor');
      cy.get('input#search[placeholder="Buscar"]').clear({force:true}).type('222{enter}',{force:true});
      return cy.get('.MuiDataGrid-row:visible').each(($row)=>{
        cy.wrap($row).find('[data-field="holder"]').invoke('text').should('include','222');
      });
    });
  }

  function TC013() {
    return ir().then(() => {
      cy.get('select[name="column"]').select('Activo');
      cy.get('input#search[placeholder="Buscar"]').clear({force:true}).type('true{enter}',{force:true});
      return cy.get('.MuiDataGrid-row:visible').each(($row)=>{
        cy.wrap($row).find('[data-field="active"] input[type="checkbox"]').should('be.checked');
      });
    });
  }

  function TC014() {
    return ir().then(() => {
      cy.get('select[name="column"]').select('Extensión');
      cy.get('input#search[placeholder="Buscar"]').clear({force:true}).type('36{enter}',{force:true});
      return cy.get('.MuiDataGrid-row:visible').each(($row)=>{
        cy.wrap($row).find('[data-field="extension"]').invoke('text').then(t=>{
          expect(t.trim()).to.equal('36');
        });
      });
    });
  }

  function TC015() {
    // Filtrado por "Value" usando menú de columna en "Modelo"
    return ir().then(() => {
      cy.get('div.MuiDataGrid-columnHeader[data-field="model"]')
        .find('button[aria-label*="Modelo"]')
        .click({force:true});
      cy.contains('li[role="menuitem"]','Filter').click({force:true});
      cy.get('input[placeholder="Filter value"]').clear().type('nokia{enter}');
      cy.wait(300);
      return cy.get('div.MuiDataGrid-row:visible').each(($row)=>{
        cy.wrap($row).find('[data-field="model"]').invoke('text').then(t=>{
          expect(t.toLowerCase()).to.include('nokia');
        });
      });
    });
  }

  function TC016() {
    return ir().then(() => {
      cy.get('select[name="column"]').select('Todos');
      cy.get('input#search[placeholder="Buscar"]').clear({force:true}).type('NoKiA{enter}',{force:true});
      return cy.get('.MuiDataGrid-row:visible').then($rows=>{
        const hits = [...$rows].filter(r=>r.innerText.toLowerCase().includes('nokia'));
        expect(hits.length).to.be.greaterThan(0);
      });
    });
  }

  function TC017() {
    return ir().then(() => {
      cy.get('select[name="column"]').select('Todos');
      cy.get('input#search[placeholder="Buscar"]').clear({force:true}).type('$%&{enter}',{force:true});
      cy.get('.MuiDataGrid-row:visible').should('have.length',0);
      return cy.contains('No rows',{matchCase:false}).should('be.visible');
    });
  }

  function TC018() {
    return ir().then(() => {
      cy.get('select[name="column"]').select('Todos');
      cy.get('input#search[placeholder="Buscar"]').clear({force:true}).type('Samsung{enter}',{force:true});
      cy.get('.MuiDataGrid-row:visible').should('have.length',0);
      return cy.contains('No rows',{matchCase:false}).should('be.visible');
    });
  }

  function TC019() {
    return ir().then(() => {
      cy.get('select[name="column"]').select('Todos');
      cy.get('input#search[placeholder="Buscar"]').clear({force:true}).type('{enter}',{force:true});
      return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan',0);
    });
  }

  function TC020() {
    return ir().then(() => {
      cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan',0);
      return cy.get('.MuiDataGrid-row:visible').first().click({force:true});
    });
  }

  function TC021() {
    return ir().then(() => {
      cy.get('.MuiDataGrid-row.Mui-selected').should('have.length',0);
      return cy.contains('button','Editar').should('not.exist');
    });
  }

  function TC022() {
    return ir().then(() => {
      cy.get('.MuiDataGrid-row:visible').first().as('fila');
      cy.get('@fila').click({force:true});
      cy.wait(300);
      cy.get('@fila').dblclick({force:true});
      return cy.url().should('match',/\/dashboard\/telephones\/form\/\d+$/);
    });
  }

  function TC023() {
    return ir().then(() => {
      cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan',0);
      cy.get('button.css-1cbe274').should('be.disabled');

      return cy.get('body').then(($body)=>{
        const tieneMsg = $body.text().includes('No hay ningún teléfono seleccionado')
                      || $body.text().includes('No hay ningún elemento seleccionado');

        cy.registrarResultados({
          numero: 23,
          nombre: 'TC023 - Botón "Eliminar" sin selección',
          esperado: 'El botón está deshabilitado y muestra mensaje',
          obtenido: tieneMsg ? 'El botón está deshabilitado y muestra mensaje'
                             : 'El botón está deshabilitado pero no muestra mensaje',
          resultado: tieneMsg ? 'OK' : 'WARNING',
          archivo,
          pantalla: 'Ficheros (Teléfonos)',
          observacion: tieneMsg ? undefined : 'Debería aparecer un aviso de “no seleccionado”.'
        });

        return cy.get('button.css-1cbe274').should('have.attr','disabled');
      });
    });
  }

  function TC024() {
    return ir().then(() => {
      cy.get('.MuiDataGrid-row:visible').first().click({force:true});
      cy.get('button.css-1cbe274').should('not.be.disabled').click({force:true});

      return cy.get('body').then(($body)=>{
        const error = /error/i.test($body.text());
        cy.registrarResultados({
          numero: 24,
          nombre: 'TC024 - Botón "Eliminar" con uno o varios seleccionado',
          esperado: 'El botón está habilitado y se elimina correctamente',
          obtenido: error ? 'Eliminado con mensaje de error' : 'Eliminado correctamente',
          resultado: error ? 'WARNING' : 'OK',
          archivo,
          pantalla: 'Ficheros (Teléfonos)',
          observacion: error ? 'Se elimina, pero aparece un mensaje de error.' : undefined
        });
        return cy.get('button.css-1cbe274').should('not.have.attr','disabled');
      });
    });
  }

  function TC025() {
    return ir().then(() => {
      cy.get('button').contains('Añadir').should('be.visible').and('not.be.disabled');
      return cy.get('button').contains('Añadir').click({force:true});
    });
  }

  function TC026() {
    // Ocultar columna vía menú contextual (ej: "Número")
    return ir().then(() => {
      return cy.get('div[role="columnheader"][data-field="number"]')
        .find('button[aria-label*="column menu"]').click({force:true}).then(()=>{
          cy.contains('li','Hide column').click({force:true});
          return cy.get('div[role="columnheader"]').contains('Número').should('not.exist');
        });
    });
  }

  function TC027() {
    // Manage columns: ocultar y volver a mostrar "Número"
    return ir().then(() => {
      cy.get('div[role="columnheader"][data-field="model"]')
        .find('button[aria-label*="column menu"]').click({force:true});
      cy.contains('li','Manage columns').click({force:true});

      cy.get('div.MuiDataGrid-panel').within(()=>{
        cy.contains('Número').parent().find('input[type="checkbox"]').first().click({force:true});
      });
      cy.get('body').click(0,0);
      cy.get('div[role="columnheader"]').contains('Número').should('not.exist');

      cy.get('div[role="columnheader"][data-field="model"]')
        .find('button[aria-label*="column menu"]').click({force:true});
      cy.contains('li','Manage columns').click({force:true});
      cy.get('div.MuiDataGrid-panel').within(()=>{
        cy.contains('Número').parent().find('input[type="checkbox"]').first().click({force:true});
      });
      cy.get('body').click(0,0);

      return cy.get('div[role="columnheader"]').contains('Número').should('exist');
    });
  }

  function TC028() {
    // Scroll vertical
    return ir().then(() => {
      cy.get('.MuiDataGrid-virtualScroller').find('div[role="row"]').should('have.length.greaterThan',1);
      cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom',{duration:800});
      return cy.get('div.MuiDataGrid-columnHeaders').should('be.visible');
    });
  }

  function TC029() {
    // Idioma Inglés
    return ir().then(() => {
      cy.get('select#languageSwitcher').select('en',{force:true});
      return cy.get('.MuiDataGrid-columnHeaders').within(()=>{
        cy.contains('Number').should('exist');
        cy.contains('Model').should('exist');
        cy.contains('Holder').should('exist');
        cy.contains('Active').should('exist');
      });
    });
  }

  function TC030() {
    // Idioma Catalán
    return ir().then(() => {
      cy.get('select#languageSwitcher').select('ca',{force:true});
      return cy.get('.MuiDataGrid-columnHeaders').within(()=>{
        cy.contains('Número').should('exist');
        cy.contains('Model').should('exist');
        cy.contains('Actiu').should('exist');
      });
    });
  }

  function TC031() {
    // Idioma Español
    return ir().then(() => {
      cy.get('select#languageSwitcher').select('es',{force:true});
      return cy.get('.MuiDataGrid-columnHeaders').within(()=>{
        cy.contains('Número').should('exist');
        cy.contains('Modelo').should('exist');
        cy.contains('Poseedor').should('exist');
        cy.contains('Activo').should('exist');
      });
    });
  }

  function TC032() {
    // Recarga con filtros aplicados (se reinician)
    return ir().then(() => {
      cy.get('select[name="column"]').select('Modelo');
      cy.get('input#search[placeholder="Buscar"]').clear({force:true}).type('nokia{enter}',{force:true});
      cy.reload();
      cy.url().should('include','/dashboard/telephones');
      cy.get('select[name="column"] option:selected').invoke('text').then(txt=>{
        expect(txt).to.match(/Select an option|Todos/i);
      });
      return cy.get('input#search[placeholder="Buscar"]').should('have.value','');
    });
  }
});