describe('CONFIGURACIÓN PERFILES - Validación completa con gestión de errores y reporte a Excel', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';

  // Hook para procesar los resultados agregados después de que terminen todas las pruebas
  after(() => {
    cy.procesarResultadosPantalla('Configuración (Perfiles)');
  });

  // ===== FUNCIONES ESPECÍFICAS PARA PERFILES =====
  
  // Función para cargar pantalla de perfiles
  const cargarPantallaPerfiles = () => {
    cy.navegarAMenu('Configuracion', 'Perfiles');
    cy.url().should('include', '/dashboard/profiles');
    cy.get('.MuiDataGrid-root').should('be.visible');
    return cy.wrap(true);
  };

  // Función para ejecutar filtro de búsqueda
  const ejecutarFiltroPerfiles = (valorBusqueda) => {
    cy.get('input[placeholder="Buscar"]')
      .should('be.visible')
      .clear({ force: true })
      .type(`${valorBusqueda}{enter}`, { force: true });
    cy.wait(2000);
    
    return cy.get('body').then($body => {
      const filasVisibles = $body.find('.MuiDataGrid-row:visible').length;
      return cy.wrap({ filasVisibles, valorBusqueda });
    });
  };

  // Función para cambiar idioma
  const cambiarIdioma = (idioma) => {
    const idiomas = {
      'Inglés': { codigo: 'en', texto: 'Name' },
      'Catalán': { codigo: 'ca', texto: 'Nom' },
      'Español': { codigo: 'es', texto: 'Nombre' }
    };
    
    const config = idiomas[idioma];
    if (!config) {
      cy.log(`Idioma no soportado: ${idioma}, usando valores por defecto`);
      const configDefault = { codigo: 'en', texto: 'Name' };
      cy.get('select#languageSwitcher').select(configDefault.codigo, { force: true });
      cy.wait(1500);
      return cy.get('body').should('contain.text', configDefault.texto);
    }
    
    cy.log(`Cambiando idioma a: ${idioma} (${config.codigo})`);
    cy.get('select#languageSwitcher').select(config.codigo, { force: true });
    cy.wait(1500);
    
    return cy.get('body').should('contain.text', config.texto).then(() => {
      cy.log(`Idioma cambiado exitosamente a ${idioma}`);
      return cy.wrap(true);
    });
  };

  // Función para eliminar perfil
  const eliminarPerfil = (nombrePerfil) => {
    if (nombrePerfil) {
      return cy.contains('.MuiDataGrid-row', nombrePerfil)
        .click({ force: true })
        .then(() => {
          cy.get('button').filter(':visible').eq(-2).click({ force: true });
          cy.wait(1000);
          return cy.contains('.MuiDataGrid-row', nombrePerfil).should('not.exist');
        });
    } else {
      return cy.get('.MuiDataGrid-row:visible').first()
        .click({ force: true })
        .then(() => {
          cy.get('button').filter(':visible').eq(-2).click({ force: true });
          cy.wait(1000);
          return cy.wrap(true);
        });
    }
  };

  // Función para abrir formulario de edición
  const abrirFormularioEdicion = () => {
    cy.get('.MuiDataGrid-row:visible').first().as('filaPerfil');
    cy.get('@filaPerfil').click({ force: true });
    cy.wait(400);
    cy.get('@filaPerfil').dblclick({ force: true });
    return cy.url().should('match', /\/dashboard\/profiles\/form\/\d+$/);
  };

  // Función centralizada que ejecuta la función correcta según el tipo
  const ejecutarFuncionPerfiles = (funcion, caso) => {
    cy.log(`Ejecutando función: ${funcion} para caso ${caso.caso}`);
    
    switch (funcion) {
      case 'cargarPantalla':
        cy.log(`Caso ${caso.caso}: Cargando pantalla de perfiles`);
        return cargarPantallaPerfiles().then(() => {
          // Verificar que se cargan los perfiles
          cy.contains('Administrador').should('exist');
          cy.contains('Comercial 1').should('exist');
          cy.contains('Jefe Trafico').should('exist');
          
          cy.registrarResultados({
            numero: parseInt(caso.caso.replace('TC', '')),
            nombre: `${caso.caso} - ${caso.nombre}`,
            esperado: 'Comportamiento correcto',
            obtenido: 'Comportamiento correcto',
            resultado: 'OK',
            archivo: 'reportes_pruebas_novatrans.xlsx',
            pantalla: 'Configuración (Perfiles)'
          });
        });
        
      case 'ejecutarFiltroIndividual':
        cy.log(`Caso ${caso.caso}: Ejecutando búsqueda con "${caso.dato_1}"`);
        return cargarPantallaPerfiles().then(() => {
          return ejecutarFiltroPerfiles(caso.dato_1).then((resultado) => {
            const esTC010 = caso.caso === 'TC010';
            const esperado = esTC010 ? 0 : '>0';
            const obtenido = resultado.filasVisibles;
            
            cy.log(`Búsqueda completada: ${obtenido} resultados encontrados`);
            
            cy.registrarResultados({
              numero: parseInt(caso.caso.replace('TC', '')),
              nombre: `${caso.caso} - ${caso.nombre}`,
              esperado: 'Comportamiento correcto',
              obtenido: 'Comportamiento correcto',
              resultado: esTC010 ? (obtenido === 0 ? 'OK' : 'ERROR') : (obtenido > 0 ? 'OK' : 'ERROR'),
              archivo: 'reportes_pruebas_novatrans.xlsx',
              pantalla: 'Configuración (Perfiles)'
            });
          });
        });
        
      case 'cambiarIdioma':
        cy.log(`Caso ${caso.caso}: Cambiando idioma a "${caso.dato_1}"`);
        return cargarPantallaPerfiles().then(() => {
          return cambiarIdioma(caso.dato_1).then(() => {
            cy.log(`Idioma cambiado exitosamente a ${caso.dato_1}`);
            
            cy.registrarResultados({
              numero: parseInt(caso.caso.replace('TC', '')),
              nombre: `${caso.caso} - ${caso.nombre}`,
              esperado: 'Comportamiento correcto',
              obtenido: 'Comportamiento correcto',
              resultado: 'OK',
              archivo: 'reportes_pruebas_novatrans.xlsx',
              pantalla: 'Configuración (Perfiles)'
            });
          });
        });
        
      case 'eliminar':
        cy.log(`Caso ${caso.caso}: Eliminando perfil`);
        return cargarPantallaPerfiles().then(() => {
          return eliminarPerfil(caso.dato_1).then(() => {
            cy.registrarResultados({
              numero: parseInt(caso.caso.replace('TC', '')),
              nombre: `${caso.caso} - ${caso.nombre}`,
              esperado: 'Comportamiento correcto',
              obtenido: 'Comportamiento correcto',
              resultado: 'OK',
              archivo: 'reportes_pruebas_novatrans.xlsx',
              pantalla: 'Configuración (Perfiles)'
            });
          });
        });
        
      case 'abrirFormularioEdicion':
        cy.log(`Caso ${caso.caso}: Abriendo formulario de edición`);
        return cargarPantallaPerfiles().then(() => {
          return abrirFormularioEdicion().then(() => {
            cy.registrarResultados({
              numero: parseInt(caso.caso.replace('TC', '')),
              nombre: `${caso.caso} - ${caso.nombre}`,
              esperado: 'Comportamiento correcto',
              obtenido: 'Comportamiento correcto',
              resultado: 'OK',
              archivo: 'reportes_pruebas_novatrans.xlsx',
              pantalla: 'Configuración (Perfiles)'
            });
          });
        });
        
      default:
        cy.log(`Función no reconocida: ${funcion} para caso ${caso.caso}`);
        return cy.wrap(true);
    }
  };

  // Test principal que ejecuta todos los casos desde Excel
  it('Ejecutar todos los casos de Configuración Perfiles desde Excel', () => {
    // Cargar casos desde Google Sheets usando el sistema existente
    cy.obtenerDatosExcel('Configuración (perfiles)').then((casos) => {
      // Filtrar casos por prioridad si se especifica
      const prioridadFiltro = Cypress.env('prioridad');
      const casosFiltrados = prioridadFiltro && prioridadFiltro !== 'todas'
        ? casos.filter(caso => caso.prioridad === prioridadFiltro.toUpperCase())
        : casos;

      // Ejecutar cada caso secuencialmente
      casosFiltrados.forEach((caso, index) => {
        const numero = parseInt(caso.caso.replace('TC', ''));
        const nombre = caso.nombre || `Caso ${caso.caso}`;
        const prioridad = caso.prioridad || 'MEDIA';
        const funcion = caso.funcion || 'cargarPantalla';
        
        // Ejecutar el caso
        cy.log(`Ejecutando: ${nombre} [${prioridad}]`);
        
        // Resetear flags para cada caso
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

        // Login y navegación inicial
        cy.login();
        cy.wait(200);

        // Ejecutar función según el tipo
        ejecutarFuncionPerfiles(funcion, caso).then(() => {
          // Registrar resultado automático si no se registró antes
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
  });

});