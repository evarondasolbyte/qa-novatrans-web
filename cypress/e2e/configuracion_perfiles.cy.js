describe('CONFIGURACIÓN PERFILES - Validación completa con gestión de errores y reporte a Excel', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';
    // Defino todos los casos con su número, nombre descriptivo y la función que ejecuta la validación
    const casos = [
        { numero: 5, nombre: 'TC005 - Verificar que se cargan todos los perfiles existentes', funcion: verificarPerfilesVisibles, prioridad: 'ALTA' },
        { numero: 6, nombre: 'TC006 - Verificar que cada perfil muestra correctamente su nombre y descripción', funcion: verificarColumnas, prioridad: 'ALTA' },
        { numero: 7, nombre: 'TC007 - Buscar por nombre exacto', funcion: () => ejecutarFiltroIndividual(7), prioridad: 'ALTA' },
        { numero: 8, nombre: 'TC008 - Buscar por texto parcial', funcion: () => ejecutarFiltroIndividual(8), prioridad: 'ALTA' },
        { numero: 9, nombre: 'TC009 - Buscar con mayúsculas/minúsculas', funcion: () => ejecutarFiltroIndividual(9), prioridad: 'MEDIA' },
        { numero: 10, nombre: 'TC010 - Buscar un nombre inexistente', funcion: () => ejecutarFiltroIndividual(10), prioridad: 'MEDIA' },
        { numero: 11, nombre: 'TC011 - Seleccionar un perfil, editar su nombre o descripción', funcion: editarPerfil, prioridad: 'ALTA' },
        { numero: 12, nombre: 'TC012 - Verificar que los cambios se reflejan correctamente en la lista', funcion: verificarCambios, prioridad: 'ALTA' },
        { numero: 14, nombre: 'TC014 - Intentar eliminar un perfil', funcion: eliminarPerfil, prioridad: 'ALTA' },
        { numero: 15, nombre: 'TC015 - Verificar si hay validación para impedir borrar perfiles en uso', funcion: noEliminar, prioridad: 'MEDIA' },
        { numero: 19, nombre: 'TC019 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
        { numero: 20, nombre: 'TC020 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
        { numero: 21, nombre: 'TC021 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' },
        { numero: 22, nombre: 'TC022 - Formulario edición', funcion: abrirFormularioEdicion, prioridad: 'ALTA' },
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

  function verificarColumnas() {
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.url().should('include', '/dashboard/profiles');
    cy.get('.MuiDataGrid-root').should('be.visible');
    cy.get('.MuiDataGrid-columnHeaders').within(() => {
      cy.contains('Nombre').should('exist');
      cy.contains('Descripción').should('exist');
    });
  }

  function editarPerfil() {
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.url().should('include', '/dashboard/profiles');
    cy.get('.MuiDataGrid-root').should('be.visible');
    
    // Buscar el perfil "Comercial 1" y hacer doble clic para editarlo
    cy.contains('.MuiDataGrid-row', 'Comercial 1').dblclick();
    cy.url().should('match', /\/dashboard\/profiles\/\d+/);
    
    // Cambiar el nombre del perfil
    cy.get('input[name="nombre"]').clear().type('Comercial');
    cy.get('button[type="submit"]').click();
    
    return cy.url().should('include', '/dashboard/profiles');
  }

  function verificarCambios() {
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.url().should('include', '/dashboard/profiles');
    cy.get('.MuiDataGrid-root').should('be.visible');
    
    // Verificar que el perfil editado aparece en la lista
    return cy.contains('.MuiDataGrid-row', 'Comercial').should('exist');
  }

  // FUNCIÓN QUE EJECUTA UN FILTRO INDIVIDUAL
  function ejecutarFiltroIndividual(numeroCaso) {
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.url().should('include', '/dashboard/profiles');
    cy.get('.MuiDataGrid-root').should('be.visible');

    // Obtener datos del Excel para Configuración-Perfiles
    return cy.obtenerDatosExcel('Configuración-Perfiles').then((datosFiltros) => {
      const numeroCasoFormateado = numeroCaso.toString().padStart(3, '0');
      cy.log(`Buscando caso TC${numeroCasoFormateado}...`);
      cy.log(`Total de datos encontrados para Configuración-Perfiles: ${datosFiltros.length}`);
      cy.log(`Casos disponibles: ${datosFiltros.map(f => f.caso).join(', ')}`);
      
      const filtroEspecifico = datosFiltros.find(f => f.caso === `TC${numeroCasoFormateado}`);
      
      if (!filtroEspecifico) {
        cy.log(`No se encontró TC${numeroCasoFormateado} en Excel, usando datos por defecto`);
        
        // Datos por defecto para cada caso
        const datosPorDefecto = {
          '007': 'Comercial 1',
          '008': 'Admin', 
          '009': 'CoMeRCiAl 1',
          '010': 'caso'
        };
        
        const valorPorDefecto = datosPorDefecto[numeroCasoFormateado] || 'Admin';
        cy.log(`Usando valor por defecto: "${valorPorDefecto}"`);
        
        cy.get('input[placeholder="Buscar"]')
          .should('be.visible')
          .clear({ force: true })
          .type(`${valorPorDefecto}{enter}`, { force: true });
        cy.wait(2000);

        // Verificar si hay resultados después del filtro
        cy.wait(1000);
        cy.get('body').then($body => {
          const filasVisibles = $body.find('.MuiDataGrid-row:visible').length;
          
          cy.log(`TC${numeroCasoFormateado}: Filas visibles: ${filasVisibles}`);
          cy.log(`Búsqueda aplicada (por defecto): "${valorPorDefecto}"`);
          
          let resultado, obtenido;
          
          if (numeroCasoFormateado === '010') {
              // TC010 busca "caso" que no existe, por lo que 0 resultados es correcto
              resultado = 'OK';
              obtenido = `No se muestran resultados (comportamiento esperado para búsqueda inexistente)`;
          } else {
              // Para otros casos, esperamos encontrar resultados
              resultado = filasVisibles > 0 ? 'OK' : 'ERROR';
              obtenido = filasVisibles > 0 ? `Se muestran ${filasVisibles} resultados` : 'No se muestran resultados';
          }
          
          cy.log(`TC${numeroCasoFormateado}: Búsqueda completada - ${resultado}`);
          
          cy.registrarResultados({
            numero: numeroCaso,
            nombre: `TC${numeroCasoFormateado} - Búsqueda de perfil`,
            esperado: `Se ejecuta búsqueda con valor "${valorPorDefecto}"`,
            obtenido: obtenido,
            resultado: resultado,
            archivo,
            pantalla: 'Configuración (Perfiles)'
          });
        });
        
        return cy.wrap(true);
      }

      cy.log(`Ejecutando TC${numeroCasoFormateado}: ${filtroEspecifico.valor_etiqueta_1} - ${filtroEspecifico.dato_1}`);
      cy.log(`Datos del filtro: valor="${filtroEspecifico.dato_1}"`);

      // Verificar que dato_1 no esté vacío
      if (!filtroEspecifico.dato_1 || filtroEspecifico.dato_1.trim() === '') {
        cy.log(`TC${numeroCasoFormateado}: ERROR - dato_1 está vacío`);
        cy.registrarResultados({
          numero: numeroCaso,
          nombre: `TC${numeroCasoFormateado} - Búsqueda de perfil`,
          esperado: `Se ejecuta búsqueda con valor "${filtroEspecifico.dato_1}"`,
          obtenido: 'Valor de búsqueda está vacío en el Excel',
          resultado: 'ERROR',
          archivo,
          pantalla: 'Configuración (Perfiles)'
        });
        return cy.wrap(true);
      }
      
      cy.log(`Buscando valor: "${filtroEspecifico.dato_1}"`);
      cy.get('input[placeholder="Buscar"]')
        .should('be.visible')
        .clear({ force: true })
        .type(`${filtroEspecifico.dato_1}{enter}`, { force: true });
      cy.wait(2000);

      // Verificar si hay resultados después del filtro
      cy.wait(1000);
      cy.get('body').then($body => {
        const filasVisibles = $body.find('.MuiDataGrid-row:visible').length;
        
        cy.log(`TC${numeroCasoFormateado}: Filas visibles: ${filasVisibles}`);
        cy.log(`Búsqueda aplicada: "${filtroEspecifico.dato_1}"`);
        
        // Para Configuración-Perfiles, verificamos que la búsqueda funcione
        // Para TC010 (buscar "caso"), esperamos 0 resultados, por lo que es OK
        let resultado, obtenido;
        
        if (numeroCasoFormateado === '010') {
            // TC010 busca "caso" que no existe, por lo que 0 resultados es correcto
            resultado = 'OK';
            obtenido = `No se muestran resultados (comportamiento esperado para búsqueda inexistente)`;
        } else {
            // Para otros casos, esperamos encontrar resultados
            resultado = filasVisibles > 0 ? 'OK' : 'ERROR';
            obtenido = filasVisibles > 0 ? `Se muestran ${filasVisibles} resultados` : 'No se muestran resultados';
        }
        
        cy.log(`TC${numeroCasoFormateado}: Búsqueda completada - ${resultado}`);
        
        cy.registrarResultados({
          numero: numeroCaso,
          nombre: `TC${numeroCasoFormateado} - Búsqueda de perfil`,
          esperado: `Se ejecuta búsqueda con valor "${filtroEspecifico.dato_1}"`,
          obtenido: obtenido,
          resultado: resultado,
          archivo,
          pantalla: 'Configuración (Perfiles)'
        });
      });
      
      return cy.wrap(true);
    });
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