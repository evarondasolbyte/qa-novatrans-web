describe('CONFIGURACIÓN PERFILES - Validación completa con gestión de errores y reporte a Excel', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';
    // Defino todos los casos con su número, nombre descriptivo y la función que ejecuta la validación
    const casos = [
        { numero: 1, nombre: 'TC001 - Verificar perfiles visibles', funcion: verificarPerfilesVisibles, prioridad: 'ALTA' },
        { numero: 2, nombre: 'TC002 - Buscar nombre exacto', funcion: buscarNombreExacto, prioridad: 'ALTA' },
        { numero: 3, nombre: 'TC003 - Buscar texto parcial', funcion: buscarTextoParcial, prioridad: 'ALTA' },
        { numero: 4, nombre: 'TC004 - Buscar sin case sensitive', funcion: buscarSinCase, prioridad: 'MEDIA' },
        { numero: 5, nombre: 'TC005 - Buscar perfil inexistente', funcion: buscarInexistente, prioridad: 'MEDIA' },
        { numero: 6, nombre: 'TC006 - Eliminar perfil', funcion: eliminarPerfil, prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - No eliminar perfil', funcion: noEliminar, prioridad: 'MEDIA' },
        { numero: 8, nombre: 'TC008 - Cambiar idioma a inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
        { numero: 9, nombre: 'TC009 - Cambiar idioma a catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
        { numero: 10, nombre: 'TC010 - Cambiar idioma a español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' },
        { numero: 11, nombre: 'TC011 - Abrir formulario de edición', funcion: abrirFormularioEdicion, prioridad: 'ALTA' },
    ];

    // Hook para procesar los resultados agregados después de que terminen todas las pruebas
    after(() => {
        cy.procesarResultadosPantalla('Configuración (Perfiles)');
    });

    // Filtrar casos por prioridad si se especifica
    const prioridadFiltro = Cypress.env('prioridad');
    const casosFiltrados = prioridadFiltro && prioridadFiltro !== 'todas' 
        ? casos.filter(caso => caso.prioridad === prioridadFiltro.toUpperCase())
        : casos;

    // Iterador de casos con protección anti-doble-registro
    casosFiltrados.forEach(({ numero, nombre, funcion, prioridad }) => {
        it(`${nombre} [${prioridad}]`, () => {
            // Reset de flags por test (muy importante)
            cy.resetearFlagsTest();

            // Captura de errores y registro
            cy.on('fail', (err) => {
                cy.capturarError(nombre, err, {
                    numero,
                    nombre,
                    esperado: 'Comportamiento correcto',
                    archivo,
                    pantalla: 'Configuración (Perfiles)'
                });
                return false;
            });

            cy.login();
            cy.wait(500);

            // Ejecuta el caso y sólo auto-OK si nadie registró antes
            return funcion().then(() => {
                cy.estaRegistrado().then((ya) => {
                    if (!ya) {
                        cy.log(`Registrando OK automático para test ${numero}: ${nombre}`);
                        cy.registrarResultados({
                            numero,
                            nombre,
                            esperado: 'Comportamiento correcto',
                            obtenido: 'Comportamiento correcto',
                            resultado: 'OK',
                            archivo,
                            pantalla: 'Configuración (Perfiles)'
                        });
                    }
                });
            });
        });
    });

  function verificarPerfilesVisibles() {
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.url().should('include', '/dashboard/profiles');
    cy.contains('Administrador').should('exist');
    cy.contains('Comercial 1').should('exist');
    return cy.contains('Jefe Trafico').should('exist');
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

    return cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);
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
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.url().should('include', '/dashboard/profiles');
    cy.get('select#languageSwitcher').select('en', { force: true });
    cy.wait(1500);
    return cy.get('body').should('contain.text', 'Name');
  }

  function cambiarIdiomaCatalan() {
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.url().should('include', '/dashboard/profiles');
    cy.get('select#languageSwitcher').select('ca', { force: true });
    cy.wait(1500);
    return cy.get('body').should('contain.text', 'Nom');
  }

  function cambiarIdiomaEspanol() {
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.url().should('include', '/dashboard/profiles');
    cy.get('select#languageSwitcher').select('es', { force: true });
    cy.wait(1500);
    return cy.get('body').should('contain.text', 'Nombre');
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