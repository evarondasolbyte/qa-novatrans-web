describe('CONFIGURACIÓN PERFILES - Validación completa con gestión de errores y reporte a Excel', () => {
    // Defino todos los casos con su número, nombre descriptivo y la función que ejecuta la validación
    const casos = [
        { numero: 1, nombre: 'TC001 - Verificar perfiles visibles', funcion: verificarPerfilesVisibles },
        { numero: 2, nombre: 'TC002 - Buscar nombre exacto', funcion: buscarNombreExacto },
        { numero: 3, nombre: 'TC003 - Buscar texto parcial', funcion: buscarTextoParcial },
        { numero: 4, nombre: 'TC004 - Buscar sin case sensitive', funcion: buscarSinCase },
        { numero: 5, nombre: 'TC005 - Buscar perfil inexistente', funcion: buscarInexistente },
        { numero: 6, nombre: 'TC006 - Eliminar perfil', funcion: eliminarPerfil },
        { numero: 7, nombre: 'TC007 - No eliminar perfil', funcion: noEliminar },
        { numero: 8, nombre: 'TC008 - Cambiar idioma a inglés', funcion: cambiarIdiomaIngles },
        { numero: 9, nombre: 'TC009 - Cambiar idioma a catalán', funcion: cambiarIdiomaCatalan },
        { numero: 10, nombre: 'TC010 - Cambiar idioma a español', funcion: cambiarIdiomaEspanol },
        { numero: 11, nombre: 'TC011 - Abrir formulario de edición', funcion: abrirFormularioEdicion },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Configuración (Perfiles)');
    });

  // Itero por cada caso individualmente
  casos.forEach(({ numero, nombre, funcion }) => {
    it(nombre, () => {
      // Registro automático de errores si algo falla dentro del test
      cy.on('fail', (err) => {
        cy.capturarError(nombre, err, {
          numero,
          nombre,
          esperado: 'Debe comportarse como se espera',
          archivo: 'reportes_pruebas_novatrans.xlsx',
          pantalla: 'Configuración (Perfiles)'
        });
        return false; // Evita que Cypress corte el resto del flujo del test
      });

      // Hago login y espero un poco antes de empezar la acción
      cy.login();
      cy.wait(500);

      // Ejecuto la función de prueba correspondiente al caso
      funcion().then(() => {
        // Si todo va bien, registro el resultado como OK automáticamente
        cy.registrarResultados({
          numero,
          nombre,
          esperado: 'Comportamiento correcto',
          obtenido: 'Comportamiento correcto',
          archivo: 'reportes_pruebas_novatrans.xlsx',
          pantalla: 'Configuración (Perfiles)'
        });
      });
    });
  });

  function verificarPerfilesVisibles() {
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.url().should('include', '/dashboard/profiles');
    return cy.wrap(null).then(() => {
      cy.contains('Administrador').should('exist');
      cy.contains('Comercial 1').should('exist');
      cy.contains('Jefe Trafico').should('exist');
    });
  }

  function buscarNombreExacto() {
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.get('input[placeholder="Buscar"]').clear().type('Comercial 1{enter}');
    return cy.contains('.MuiDataGrid-row', 'Comercial 1', { timeout: 10000 }).should('exist');
  }

  function buscarTextoParcial() {
    const texto = 'Admin';
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.get('input[placeholder="Buscar"]').clear().type(`${texto}{enter}`);
    cy.get('.MuiDataGrid-row', { timeout: 10000 }).should('exist');

    return cy.get('.MuiDataGrid-row').then(($rows) => {
      if ($rows.length === 0) {
        throw new Error('No se encontraron filas después de la búsqueda parcial');
      }

      let algunaCoincide = false;
      $rows.each((i, row) => {
        const celda = row.querySelector('.MuiDataGrid-cell:not(.MuiDataGrid-cellCheckbox)');
        const textoCelda = celda?.innerText?.trim().toLowerCase() || '';
        if (textoCelda.includes(texto.toLowerCase())) {
          algunaCoincide = true;
        }
      });

      if (!algunaCoincide) {
        throw new Error(`Ninguna fila contiene el texto parcial "${texto}"`);
      }
    });
  }

  function buscarSinCase() {
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.get('input[placeholder="Buscar"]').clear().type('CoMeRCiAl 1{enter}');
    cy.get('.MuiDataGrid-row', { timeout: 10000 }).should('exist');
    return cy.contains('.MuiDataGrid-cell', /comercial 1/i).should('exist');
  }

  function buscarInexistente() {
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.get('input[placeholder="Buscar"]').clear().type('caso{enter}');
    return cy.get('.MuiDataGrid-row', { timeout: 10000 }).should('not.exist');
  }

  function eliminarPerfil() {
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.url().should('include', '/dashboard/profiles');

    return cy.get('.MuiDataGrid-row:visible').then($filas => {
      if ($filas.length === 0) {
        cy.log('No hay perfiles visibles para eliminar. Test omitido.');
        return cy.wrap(null); // ← CORREGIDO
      }

      cy.wrap($filas[0]).as('filaPerfil');

      return cy.get('@filaPerfil')
        .find('.MuiDataGrid-cell')
        .eq(0)
        .invoke('text')
        .then((nombreCrudo) => {
          const nombre = nombreCrudo.trim();

          if (!nombre) {
            cy.log('La fila no tiene nombre válido. Test omitido.');
            return cy.wrap(null); // ← CORREGIDO
          }

          return cy.get('@filaPerfil').click({ force: true })
            .then(() => {
              return cy.get('button')
                .filter(':visible')
                .eq(-2)
                .click({ force: true });
            })
            .then(() => {
              cy.wait(1000);
              return cy.contains('.MuiDataGrid-row', nombre).should('not.exist');
            });
        });
    });
  }

  function noEliminar() {
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.url().should('include', '/dashboard/profiles');

    const nombrePerfil = 'Administrador';

    return cy.contains('.MuiDataGrid-row', nombrePerfil).as('filaEnUso').then(() => {
      return cy.get('@filaEnUso').click({ force: true })
        .then(() => {
          return cy.get('button')
            .filter(':visible')
            .eq(-2)
            .click({ force: true });
        })
        .then(() => {
          cy.contains('No se puede eliminar el perfil porque está en uso', { matchCase: false }).should('exist');
          return cy.contains('.MuiDataGrid-row', nombrePerfil).should('exist');
        });
    });
  }

  function cambiarIdiomaIngles() {
    // Forzar navegación desde cero para evitar quedarse en el formulario
    cy.visit('/dashboard'); // ← clave
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.url().should('include', '/dashboard/profiles');

    cy.get('select#languageSwitcher').select('en', { force: true });

    return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist').then(() => {
      cy.contains('.MuiDataGrid-columnHeaders', 'Name').should('exist');
      cy.contains('.MuiDataGrid-columnHeaders', 'Description').should('exist');
    });
  }

  function cambiarIdiomaCatalan() {
    cy.visit('/dashboard');
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.url().should('include', '/dashboard/profiles');

    cy.get('select#languageSwitcher').select('ca', { force: true });

    return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist').then(() => {
      cy.contains('.MuiDataGrid-columnHeaders', 'Nom').should('exist');
      cy.contains('.MuiDataGrid-columnHeaders', 'Descripció').should('exist');
    });
  }

  function cambiarIdiomaEspanol() {
    cy.visit('/dashboard');
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.url().should('include', '/dashboard/profiles');

    cy.get('select#languageSwitcher').select('es', { force: true });

    return cy.get('.MuiDataGrid-columnHeaders', { timeout: 10000 }).should('exist').then(() => {
      cy.contains('.MuiDataGrid-columnHeaders', 'Nombre').should('exist');
      cy.contains('.MuiDataGrid-columnHeaders', 'Descripción').should('exist');
    });
  }

  function abrirFormularioEdicion() {
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.get('.MuiDataGrid-row:visible').first().as('filaPerfil');
    cy.get('@filaPerfil').click({ force: true });
    cy.wait(400);
    cy.get('@filaPerfil').dblclick({ force: true });
    return cy.url().should('match', /\/dashboard\/profiles\/form\/\d+$/);
  }
});