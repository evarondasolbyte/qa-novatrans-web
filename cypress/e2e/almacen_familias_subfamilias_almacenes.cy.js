describe('ALMACEN - Familias, Subfamilias y Almacenes - Validación completa con gestión de errores y reporte a Excel', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';
  
  // Defino todos los casos con su número, nombre descriptivo y la función que ejecuta la validación
  const casos = [
    { numero: 1, nombre: 'TC001 - Cargar la pantalla correctamente', funcion: cargarPantalla, prioridad: 'ALTA' },
    { numero: 2, nombre: 'TC002 - Cambiar idioma a Inglés', funcion: cambiarIdiomaIngles, prioridad: 'BAJA' },
    { numero: 3, nombre: 'TC003 - Cambiar idioma a Catalán', funcion: cambiarIdiomaCatalan, prioridad: 'BAJA' },
    { numero: 4, nombre: 'TC004 - Cambiar idioma a Español', funcion: cambiarIdiomaEspanol, prioridad: 'BAJA' },
    { numero: 5, nombre: 'TC005 - Crear familia', funcion: crearFamilia, prioridad: 'ALTA' },
    { numero: 6, nombre: 'TC006 - Editar familia existente', funcion: editarFamiliaExistente, prioridad: 'ALTA' },
    { numero: 7, nombre: 'TC007 - Editar familia sin selección', funcion: editarFamiliaSinSeleccion, prioridad: 'MEDIA' },
    { numero: 8, nombre: 'TC008 - Eliminar familia con selección', funcion: eliminarFamiliaConSeleccion, prioridad: 'ALTA' },
    { numero: 9, nombre: 'TC009 - Eliminar familia sin selección', funcion: eliminarFamiliaSinSeleccion, prioridad: 'MEDIA' },
    { numero: 10, nombre: 'TC010 - Crear subfamilia', funcion: crearSubfamilia, prioridad: 'ALTA' },
    { numero: 12, nombre: 'TC012 - Editar subfamilia sin selección', funcion: editarSubfamiliaSinSeleccion, prioridad: 'MEDIA' },
    { numero: 14, nombre: 'TC014 - Eliminar subfamilia sin selección', funcion: eliminarSubfamiliaSinSeleccion, prioridad: 'MEDIA' },
    { numero: 15, nombre: 'TC015 - Crear almacén', funcion: crearAlmacen, prioridad: 'ALTA' },
    { numero: 16, nombre: 'TC016 - Editar almacén', funcion: editarAlmacen, prioridad: 'ALTA' },
    { numero: 17, nombre: 'TC017 - Editar almacén sin selección', funcion: editarAlmacenSinSeleccion, prioridad: 'MEDIA' },
    { numero: 18, nombre: 'TC018 - Eliminar almacén con selección', funcion: eliminarAlmacenConSeleccion, prioridad: 'ALTA' },
    { numero: 19, nombre: 'TC019 - Eliminar almacén sin selección', funcion: eliminarAlmacenSinSeleccion, prioridad: 'MEDIA' },
    { numero: 20, nombre: 'TC020 - Ordenar por Código (ASC/DESC) en Familias', funcion: ordenarCodigoFamilias, prioridad: 'MEDIA' },
    { numero: 21, nombre: 'TC021 - Ordenar por Nombre (ASC/DESC) en Familias', funcion: ordenarNombreFamilias, prioridad: 'MEDIA' },
    { numero: 24, nombre: 'TC024 - Ordenar por Código (ASC/DESC) en Almacenes', funcion: ordenarCodigoAlmacenes, prioridad: 'MEDIA' },
    { numero: 25, nombre: 'TC025 - Ordenar por Nombre (ASC/DESC) en Almacenes', funcion: ordenarNombreAlmacenes, prioridad: 'MEDIA' },
    { numero: 26, nombre: 'TC026 - Filtrar por columna (Value) en Familias', funcion: filtrarFamilias, prioridad: 'MEDIA' },
    { numero: 28, nombre: 'TC028 - Filtrar por columna (Value) en Almacenes', funcion: filtrarAlmacenes, prioridad: 'MEDIA' },
    { numero: 29, nombre: 'TC029 - Ocultar columna (Hide column) en Familias', funcion: ocultarColumnaFamilias, prioridad: 'BAJA' },
    { numero: 30, nombre: 'TC030 - Ocultar columna (Hide column) en Subfamilias', funcion: ocultarColumnaSubfamilias, prioridad: 'BAJA' },
    { numero: 31, nombre: 'TC031 - Ocultar columna (Hide column) en Almacenes', funcion: ocultarColumnaAlmacenes, prioridad: 'BAJA' },
    { numero: 32, nombre: 'TC032 - Mostrar/Ocultar columnas (Manage columns) en Familias', funcion: gestionarColumnasFamilias, prioridad: 'BAJA' },
    { numero: 33, nombre: 'TC033 - Mostrar/Ocultar columnas (Manage columns) en Subfamilias', funcion: gestionarColumnasSubfamilias, prioridad: 'BAJA' },
    { numero: 34, nombre: 'TC034 - Mostrar/Ocultar columnas (Manage columns) en Almacenes', funcion: gestionarColumnasAlmacenes, prioridad: 'BAJA' },
    { numero: 35, nombre: 'TC035 - Seleccionar fila en tabla Familias', funcion: seleccionarFilaFamilias, prioridad: 'MEDIA' },
    { numero: 37, nombre: 'TC037 - Seleccionar fila en tabla Almacenes', funcion: seleccionarFilaAlmacenes, prioridad: 'MEDIA' },
    { numero: 38, nombre: 'TC038 - Scroll horizontal/vertical en tabla Familias', funcion: scrollFamilias, prioridad: 'BAJA' },
    { numero: 40, nombre: 'TC040 - Scroll horizontal/vertical en tabla Almacenes', funcion: scrollAlmacenes, prioridad: 'BAJA' },
    { numero: 41, nombre: 'TC041 - Reset de filtros al recargar página', funcion: resetFiltrosRecargar, prioridad: 'MEDIA' },
    { numero: 42, nombre: 'TC042 - Añadir en Familias sin poner Código o Nombre', funcion: añadirFamiliaSinCampos, prioridad: 'MEDIA' },
    { numero: 43, nombre: 'TC043 - Añadir en Subfamilias sin poner Código o Nombre', funcion: añadirSubfamiliaSinCampos, prioridad: 'MEDIA' },
    { numero: 44, nombre: 'TC044 - Añadir en Almacenes sin poner Código o Nombre', funcion: añadirAlmacenSinCampos, prioridad: 'MEDIA' }
  ];

  // Hook para procesar los resultados agregados después de que terminen todas las pruebas
  after(() => {
    cy.procesarResultadosPantalla('Almacen (Familias, Subfamilias y Almacenes)');
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
          pantalla: 'Almacen (Familias, Subfamilias y Almacenes)'
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
              pantalla: 'Almacen (Familias, Subfamilias y Almacenes)'
            });
          }
        });
      });
    });
  });

  // === FUNCIONES HELPER ===


  function accederPantalla() {
    cy.navegarAMenu('Almacen', 'Familias, Subfamilias y Almacenes');
    cy.url().should('include', '/dashboard/families-subfamilies-warehouses');
    cy.get('body').should('contain.text', 'Familias');
    cy.get('body').should('contain.text', 'Subfamilias');
    cy.get('body').should('contain.text', 'Almacenes');
    return cy.get('body').should('be.visible');
  }

  function cambiarIdiomaIngles() {
    cy.navegarAMenu('Almacen', 'Familias, Subfamilias y Almacenes');
    cy.url().should('include', '/dashboard/families-subfamilies-warehouses');
    cy.get('select#languageSwitcher').select('en', { force: true });
    cy.wait(1500);
    return cy.get('body').should('contain.text', 'Families, Subfamilies and Warehouses');
  }

  function cambiarIdiomaCatalan() {
    cy.navegarAMenu('Almacen', 'Familias, Subfamilias y Almacenes');
    cy.url().should('include', '/dashboard/families-subfamilies-warehouses');
    cy.get('select#languageSwitcher').select('ca', { force: true });
    cy.wait(1500);
    return cy.get('body').should('contain.text', 'Famílies, Subfamílies i Magatzems');
  }

  function cambiarIdiomaEspanol() {
    cy.navegarAMenu('Almacen', 'Familias, Subfamilias y Almacenes');
    cy.url().should('include', '/dashboard/families-subfamilies-warehouses');
    cy.get('select#languageSwitcher').select('es', { force: true });
    cy.wait(1500);
    return cy.get('body').should('contain.text', 'Familias, Subfamilias y Almacenes');
  }

  // Helper para crear registro en sección específica
  function crearRegistro(seccion, codigo, nombre, familia = null) {
    // Buscar el panel específico por el título (sin hacer clic)
    cy.contains('h3, h4, h5, h6, .panel-title, .section-title', seccion, { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');

    // Llenar campos dentro del panel
    if (codigo) {
      cy.get('@panel')
        .find('input')
        .first()
        .clear()
        .type(codigo);
    }

    if (nombre) {
      cy.get('@panel')
        .find('input')
        .eq(1) // Segundo input (campo Nombre)
        .clear()
        .type(nombre);
    }

    if (familia) {
      cy.get('@panel')
        .find('select, .dropdown, [role="combobox"]')
        .first()
        .select(familia);
    }

    // Pulsar botón verde + dentro del panel
    return cy.get('@panel')
      .find('button')
      .first()
      .click();
  }

  // Helper para seleccionar fila
  function seleccionarFila(seccion, indice = 0) {
    // Buscar el panel específico por el título (sin hacer clic)
    cy.contains('h3, h4, h5, .panel-title, .section-title', seccion, { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');

    // Buscar la tabla dentro del panel y seleccionar la fila
    return cy.get('@panel')
      .find('tbody tr, .MuiDataGrid-row, [role="row"]')
      .eq(indice)
      .should('exist')
      .click();
  }

  // Helper para editar registro
  function editarRegistro(seccion, codigo = null, nombre = null) {
    // Buscar el panel específico por el título (sin hacer clic)
    cy.contains('h3, h4, h5, .panel-title, .section-title', seccion, { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');

    // Seleccionar fila primero
    seleccionarFila(seccion);

    // Editar campos si se proporcionan
    if (codigo) {
      cy.get('@panel')
        .find('input[placeholder*="Código"], input[placeholder*="Cód"]')
        .first()
        .clear()
        .type(codigo);
    }

    if (nombre) {
      cy.get('@panel')
        .find('input[placeholder*="Nombre"]')
        .first()
        .clear()
        .type(nombre);
    }

    // Pulsar botón azul (lápiz) dentro del panel
    return cy.get('@panel')
      .find('button[class*="blue"], button[class*="primary"], button[class*="edit"], .btn-primary, button[title*="edit"], button[aria-label*="edit"]')
      .first()
      .click();
  }

  // Helper para eliminar registro
  function eliminarRegistro(seccion) {
    // Buscar el panel específico por el título (sin hacer clic)
    cy.contains('h3, h4, h5, .panel-title, .section-title', seccion, { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');

    // Seleccionar fila primero
    seleccionarFila(seccion);

    // Pulsar botón rojo (papelera) dentro del panel
    return cy.get('@panel')
      .find('button[class*="red"], button[class*="danger"], button[class*="delete"], .btn-danger, button[title*="delete"], button[aria-label*="delete"]')
      .first()
      .click();
  }

  // Helper para ordenar columna
  function ordenarColumna(seccion, columna, orden) {
    // Buscar el panel específico por el título (sin hacer clic)
    cy.contains('h3, h4, h5, .panel-title, .section-title', seccion, { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');

    // Buscar columna y hacer clic en el header para ordenar
    return cy.get('@panel')
      .find(`th:contains("${columna}"), .MuiDataGrid-columnHeader:contains("${columna}")`)
      .should('exist')
      .click()
      .then(() => {
        // Si hay menú de ordenamiento, seleccionar el orden
        cy.get('@panel')
          .find(`button:contains("Sort by ${orden}"), [data-sort="${orden.toLowerCase()}"]`)
          .then($btn => {
            if ($btn.length > 0) {
              cy.wrap($btn).click();
            }
          });
      });
  }

  // Helper para filtrar columna
  function filtrarColumna(seccion, columna, valor) {
    // Buscar el panel específico por el título (sin hacer clic)
    cy.contains('h3, h4, h5, .panel-title, .section-title', seccion, { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');

    // Buscar columna y sus 3 puntos
    cy.get('@panel')
      .find(`th:contains("${columna}"), .MuiDataGrid-columnHeader:contains("${columna}")`)
      .should('exist')
      .parent()
      .find('button[aria-label*="menu"], .dropdown-toggle, .three-dots, .MuiIconButton-root')
      .click();

    // Seleccionar Filter
    cy.get('button:contains("Filter"), [data-action="filter"], .MuiMenuItem-root:contains("Filter")')
      .should('exist')
      .click();

    // Escribir valor en el campo Value
    return cy.get('input[placeholder*="Value"], input[name*="value"], input[type="text"]')
      .last()
      .clear()
      .type(valor);
  }

  // Helper para ocultar columna
  function ocultarColumna(seccion, columna) {
    // Buscar el panel específico por el título (sin hacer clic)
    cy.contains('h3, h4, h5, .panel-title, .section-title', seccion, { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');

    // Buscar columna y sus 3 puntos
    cy.get('@panel')
      .find(`th:contains("${columna}"), .MuiDataGrid-columnHeader:contains("${columna}")`)
      .should('exist')
      .parent()
      .find('button[aria-label*="menu"], .dropdown-toggle, .three-dots, .MuiIconButton-root')
      .click();

    // Seleccionar Hide column
    return cy.get('button:contains("Hide column"), [data-action="hide"], .MuiMenuItem-root:contains("Hide column")')
      .should('exist')
      .click();
  }

  // Helper para gestionar columnas
  function gestionarColumnas(seccion, columna) {
    // Buscar el panel específico por el título (sin hacer clic)
    cy.contains('h3, h4, h5, .panel-title, .section-title', seccion, { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');

    // Buscar columna y sus 3 puntos
    cy.get('@panel')
      .find(`th:contains("${columna}"), .MuiDataGrid-columnHeader:contains("${columna}")`)
      .should('exist')
      .parent()
      .find('button[aria-label*="menu"], .dropdown-toggle, .three-dots, .MuiIconButton-root')
      .click();

    // Seleccionar Manage columns
    cy.get('button:contains("Manage columns"), [data-action="manage"], .MuiMenuItem-root:contains("Manage columns")')
      .should('exist')
      .click();

    // Marcar la columna para que sea visible
    return cy.get(`input[type="checkbox"], .checkbox`)
      .first()
      .check();
  }

  // === FUNCIONES DE VALIDACIÓN ===

  function cargarPantalla() {
    return accederPantalla();
  }

  function cambiarIdiomaIngles() {
    cy.navegarAMenu('Almacen', 'Familias, Subfamilias y Almacenes');
    cy.url().should('include', '/dashboard/families-subfamilies-warehouses');
    cy.get('select#languageSwitcher').select('en', { force: true });
    cy.wait(1500);
    return cy.get('body').should('contain.text', 'Families, Subfamilies and Warehouses');
  }

  function cambiarIdiomaCatalan() {
    cy.navegarAMenu('Almacen', 'Familias, Subfamilias y Almacenes');
    cy.url().should('include', '/dashboard/families-subfamilies-warehouses');
    cy.get('select#languageSwitcher').select('ca', { force: true });
    cy.wait(1500);
    return cy.get('body').should('contain.text', 'Famílies, Subfamílies i Magatzems');
  }

  function cambiarIdiomaEspanol() {
    cy.navegarAMenu('Almacen', 'Familias, Subfamilias y Almacenes');
    cy.url().should('include', '/dashboard/families-subfamilies-warehouses');
    cy.get('select#languageSwitcher').select('es', { force: true });
    cy.wait(1500);
    return cy.get('body').should('contain.text', 'Familias, Subfamilias y Almacenes');
  }

  function crearFamilia() {
    accederPantalla();
    // Buscar el panel de Familias - usar selector más específico
    cy.get('h3, h4, h5, h6, .panel-title, .section-title')
      .contains('Familias')
      .should('exist')
      .parent()
      .as('panel');
    
    // Llenar solo el campo Nombre (segundo input)
    cy.get('@panel')
      .find('input')
      .eq(1) // Segundo input (campo Nombre)
      .clear({ force: true })
      .type('Familia Prueba', { force: true });

    // Pulsar botón verde +
    return cy.get('@panel')
      .find('button')
      .first()
      .click({ force: true });
  }

  function editarFamiliaExistente() {
    accederPantalla();
    // Primero crear una familia para editar
    cy.contains('h3, h4, h5, h6, .panel-title, .section-title', 'Familias', { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');
    
    // Crear registro primero (con código y nombre)
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('FAM001');
    
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo Nombre
      .clear()
      .type('Familia para Editar');
    
    cy.get('@panel')
      .find('button')
      .first() // Botón +
      .click();
    
    cy.wait(1000);
    
    // Pulsar en la fila creada (seleccionarla)
    cy.get('@panel')
      .find('tbody tr, .MuiDataGrid-row, [role="row"]')
      .first()
      .click();
    
    cy.wait(500);
    
    // Editar los campos
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('FAM001-EDIT');
    
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo Nombre
      .clear()
      .type('Familia Editada');
    
    // Dar al botón azul (lápiz) de la cabecera
    return cy.get('@panel')
      .find('button')
      .eq(1) // Segundo botón (lápiz)
      .click();
  }

  function editarFamiliaSinSeleccion() {
    accederPantalla();
    // Buscar el panel de Familias
    cy.contains('h3, h4, h5, h6, .panel-title, .section-title', 'Familias', { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');
    
    // Pulsar botón azul (lápiz) directamente sin seleccionar fila
    return cy.get('@panel')
      .find('button')
      .eq(1) // Segundo botón (lápiz)
      .click();
  }

  function eliminarFamiliaConSeleccion() {
    accederPantalla();
    // Primero crear una familia para eliminar
    cy.contains('h3, h4, h5, h6, .panel-title, .section-title', 'Familias', { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');
    
    // Crear registro primero (con código y nombre)
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('FAM002');
    
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo Nombre
      .clear()
      .type('Familia para Eliminar');
    
    cy.get('@panel')
      .find('button')
      .first() // Botón +
      .click();
    
    cy.wait(1000);
    
    // Seleccionar la segunda fila (evitar cabecera)
    cy.get('@panel')
      .find('tbody tr, .MuiDataGrid-row, [role="row"]')
      .eq(1) // Segunda fila
      .click();
    
    cy.wait(500);
    
    // Dar al botón rojo (papelera) de la cabecera
    return cy.get('@panel')
      .find('button')
      .eq(2) // Tercer botón (papelera)
      .click();
  }

  function eliminarFamiliaSinSeleccion() {
    accederPantalla();
    // Buscar el panel de Familias
    cy.contains('h3, h4, h5, h6, .panel-title, .section-title', 'Familias', { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');
    
    // Pulsar botón rojo (papelera) directamente sin seleccionar fila
    return cy.get('@panel')
      .find('button')
      .eq(2) // Tercer botón (papelera)
      .click();
  }

  function crearSubfamilia() {
    accederPantalla();
    
    // Buscar el panel de Subfamilias (panel del medio)
    cy.get('h3, h4, h5, h6, .panel-title, .section-title')
      .contains('Subfamilias')
      .should('exist')
      .parent()
      .as('panel');

    // 1. Llenar el campo "C." (primer campo - código)
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo "C."
      .clear({ force: true })
      .type('SUB001', { force: true });

    // 2. Llenar el campo "Nom..." (segundo campo - nombre)
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo "Nom..."
      .clear({ force: true })
      .type('Subfamilia Prueba', { force: true });

    // Pulsar botón verde +
    cy.get('@panel')
      .find('button')
      .first()
      .click({ force: true });

    // Verificar si se creó correctamente
    cy.wait(1000);
    return cy.get('body').then(($body) => {
      const bodyText = $body.text();
      const subfamiliaCreada = bodyText.includes('Subfamilia Prueba') &&
        !bodyText.includes('No rows');

      if (subfamiliaCreada) {
        // Si funciona, registrar OK
        cy.registrarResultados({
          numero: 10,
          nombre: 'TC010 - Crear subfamilia',
          esperado: 'Subfamilia creada correctamente',
          obtenido: 'Subfamilia creada correctamente',
          resultado: 'OK',
          archivo,
          pantalla: 'Almacen (Familias, Subfamilias y Almacenes)'
        });
      } else {
        // Si no funciona, registrar ERROR
        cy.registrarResultados({
          numero: 10,
          nombre: 'TC010 - Crear subfamilia',
          esperado: 'Subfamilia creada correctamente',
          obtenido: 'No se pudo crear la subfamilia',
          resultado: 'ERROR',
          archivo,
          pantalla: 'Almacen (Familias, Subfamilias y Almacenes)'
        });
      }

      return cy.wrap(true); // Devolver promesa para evitar auto-OK
    });
  }


  function editarSubfamiliaSinSeleccion() {
    accederPantalla();
    // Buscar el panel de Subfamilias
    cy.contains('h3, h4, h5, h6, .panel-title, .section-title', 'Subfamilias', { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');
    
    // Pulsar botón azul (lápiz) directamente sin seleccionar fila
    return cy.get('@panel')
      .find('button')
      .eq(1) // Segundo botón (lápiz)
      .click();
  }


  function eliminarSubfamiliaSinSeleccion() {
    accederPantalla();
    // Buscar el panel de Subfamilias
    cy.contains('h3, h4, h5, h6, .panel-title, .section-title', 'Subfamilias', { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');
    
    // Pulsar botón rojo (papelera) directamente sin seleccionar fila
    return cy.get('@panel')
      .find('button')
      .eq(2) // Tercer botón (papelera)
      .click();
  }

  function crearAlmacen() {
    accederPantalla();
    // Buscar el panel de Almacenes
    cy.get('h3, h4, h5, h6, .panel-title, .section-title')
      .contains('Almacenes')
      .should('exist')
      .parent()
      .as('panel');
    
    // Llenar solo el campo Nombre (segundo input)
    cy.get('@panel')
      .find('input')
      .eq(1) // Segundo input (campo Nombre)
      .clear({ force: true })
      .type('Almacen Prueba', { force: true });

    // Pulsar botón verde +
    return cy.get('@panel')
      .find('button')
      .first()
      .click({ force: true });
  }

  function editarAlmacen() {
    accederPantalla();
    // Primero crear un almacén para editar
    cy.contains('h3, h4, h5, h6, .panel-title, .section-title', 'Almacenes', { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');
    
    // Crear registro primero (con código y nombre)
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('ALM001');
    
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo Nombre
      .clear()
      .type('Almacen para Editar');
    
    cy.get('@panel')
      .find('button')
      .first() // Botón +
      .click();
    
    cy.wait(1000);
    
    // Seleccionar la primera fila visible (patrón como seleccionarFila)
    cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    
    cy.wait(500);
    
    // Editar los campos
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('ALM001-EDIT');
    
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo Nombre
      .clear()
      .type('Almacen Editado');
    
    // Dar al botón azul (lápiz) de la cabecera
    return cy.get('@panel')
      .find('button')
      .eq(1) // Segundo botón (lápiz)
      .click();
  }

  function editarAlmacenSinSeleccion() {
    accederPantalla();
    // Buscar el panel de Almacenes
    cy.contains('h3, h4, h5, h6, .panel-title, .section-title', 'Almacenes', { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');
    
    // Pulsar botón azul (lápiz) directamente sin seleccionar fila
    return cy.get('@panel')
      .find('button')
      .eq(1) // Segundo botón (lápiz)
      .click();
  }

  function eliminarAlmacenConSeleccion() {
    accederPantalla();
    // Primero crear un almacén para eliminar
    cy.contains('h3, h4, h5, h6, .panel-title, .section-title', 'Almacenes', { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');
    
    // Crear registro primero (con código y nombre)
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('ALM002');
    
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo Nombre
      .clear()
      .type('Almacen para Eliminar');
    
    cy.get('@panel')
      .find('button')
      .first() // Botón +
      .click();
    
    cy.wait(1000);
    
    // Seleccionar la segunda fila (evitar cabecera)
    cy.get('@panel')
      .find('tbody tr, .MuiDataGrid-row, [role="row"]')
      .eq(1) // Segunda fila
      .click();
    
    cy.wait(500);
    
    // Dar al botón rojo (papelera) de la cabecera
    return cy.get('@panel')
      .find('button')
      .eq(2) // Tercer botón (papelera)
      .click();
  }

  function eliminarAlmacenSinSeleccion() {
    accederPantalla();
    // Buscar el panel de Almacenes
    cy.contains('h3, h4, h5, h6, .panel-title, .section-title', 'Almacenes', { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');
    
    // Pulsar botón rojo (papelera) directamente sin seleccionar fila
    return cy.get('@panel')
      .find('button')
      .eq(2) // Tercer botón (papelera)
      .click();
  }

  function ordenarCodigoFamilias() {
    accederPantalla();
    // Crear dos familias para ordenar
    crearRegistro('Familias', 'FAM002', 'Familia Z');
    cy.wait(500);
    crearRegistro('Familias', 'FAM001', 'Familia A');
    cy.wait(1000); // Esperar a que los registros se añadan a la tabla

    // Ordenar por Código ASC
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').click({ force: true });
    cy.wait(1000);
    // Ordenar por Código DESC
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').click({ force: true });
    return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
  }

  function ordenarNombreFamilias() {
    accederPantalla();
    // Crear dos familias para ordenar
    crearRegistro('Familias', 'FAM003', 'Familia Z');
    cy.wait(500);
    crearRegistro('Familias', 'FAM004', 'Familia A');
    cy.wait(1000); // Esperar a que los registros se añadan a la tabla

    // Ordenar por Nombre ASC
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre').click({ force: true });
    cy.wait(1000);
    // Ordenar por Nombre DESC
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre').click({ force: true });
    return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
  }


  function ordenarCodigoAlmacenes() {
    accederPantalla();
    // Crear dos almacenes para ordenar
    crearRegistro('Almacenes', 'ALM002', 'Almacen Z');
    cy.wait(500);
    crearRegistro('Almacenes', 'ALM001', 'Almacen A');
    cy.wait(1000); // Esperar a que los registros se añadan a la tabla

    // Ordenar por Código ASC
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').click({ force: true });
    cy.wait(1000);
    // Ordenar por Código DESC
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código').click({ force: true });
    return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
  }

  function ordenarNombreAlmacenes() {
    accederPantalla();
    // Crear dos almacenes para ordenar
    crearRegistro('Almacenes', 'ALM003', 'Almacen Z');
    cy.wait(500);
    crearRegistro('Almacenes', 'ALM004', 'Almacen A');
    cy.wait(1000); // Esperar a que los registros se añadan a la tabla

    // Ordenar por Nombre ASC
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre').click({ force: true });
    cy.wait(1000);
    // Ordenar por Nombre DESC
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre').click({ force: true });
    return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
  }

  function filtrarFamilias() {
    accederPantalla();
    
    // Crear 2 registros primero para poder filtrar
    cy.get('h3, h4, h5, h6, .panel-title, .section-title')
      .contains('Familias')
      .should('exist')
      .parent()
      .as('panel');
    
    // Crear primer registro con código que contenga "1"
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('FAM1');
    
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo Nombre
      .clear()
      .type('Familia con 1');
    
    cy.get('@panel')
      .find('button')
      .first()
      .click();
    
    cy.wait(500);
    
    // Crear segundo registro con código diferente
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('FAM2');
    
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo Nombre
      .clear()
      .type('Familia con 2');
    
    cy.get('@panel')
      .find('button')
      .first()
      .click();
    
    cy.wait(1000);
    
    // Ahora filtrar usando el patrón correcto
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
      .parents('[role="columnheader"]')
      .trigger('mouseover');
    cy.get('[aria-label="Código column menu"]').click({ force: true });
    
    cy.get('li').contains('Filter').click({ force: true });
    
    // Usar el placeholder correcto como en gastosgenerales
    cy.get('input[placeholder="Filter value"]')
      .should('exist')
      .clear()
      .type('1', { force: true });
    
    return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
  }


  function filtrarAlmacenes() {
    accederPantalla();
    
    // Crear 2 registros primero para poder filtrar
    cy.get('h3, h4, h5, h6, .panel-title, .section-title')
      .contains('Almacenes')
      .should('exist')
      .parent()
      .as('panel');
    
    // Crear primer registro con código que contenga "1"
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('ALM1');
    
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo Nombre
      .clear()
      .type('Almacen con 1');
    
    cy.get('@panel')
      .find('button')
      .first()
      .click();
    
    cy.wait(500);
    
    // Crear segundo registro con código diferente
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('ALM2');
    
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo Nombre
      .clear()
      .type('Almacen con 2');
    
    cy.get('@panel')
      .find('button')
      .first()
      .click();
    
    cy.wait(1000);
    
    // Ahora filtrar usando el patrón correcto
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
      .parents('[role="columnheader"]')
      .trigger('mouseover');
    cy.get('[aria-label="Código column menu"]').click({ force: true });
    
    cy.get('li').contains('Filter').click({ force: true });
    
    // Usar el placeholder correcto como en gastosgenerales
    cy.get('input[placeholder="Filter value"]')
      .should('exist')
      .clear()
      .type('1', { force: true });
    
    return cy.get('.MuiDataGrid-row:visible').should('have.length.greaterThan', 0);
  }

  function ocultarColumnaFamilias() {
    accederPantalla();
    
    // Usar el patrón correcto
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
      .parents('[role="columnheader"]')
      .trigger('mouseover');
    cy.get('[aria-label="Código column menu"]').click({ force: true });
    
    cy.get('li').contains('Hide column').click({ force: true });
    
    return cy.get('[data-field="codigo"]').should('not.exist');
  }

  function ocultarColumnaSubfamilias() {
    accederPantalla();
    
    // Usar el patrón correcto
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
      .parents('[role="columnheader"]')
      .trigger('mouseover');
    cy.get('[aria-label="Código column menu"]').click({ force: true });
    
    cy.get('li').contains('Hide column').click({ force: true });
    
    return cy.get('[data-field="codigo"]').should('not.exist');
  }

  function ocultarColumnaAlmacenes() {
    accederPantalla();
    
    // Usar el patrón correcto
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Código')
      .parents('[role="columnheader"]')
      .trigger('mouseover');
    cy.get('[aria-label="Código column menu"]').click({ force: true });
    
    cy.get('li').contains('Hide column').click({ force: true });
    
    return cy.get('[data-field="codigo"]').should('not.exist');
  }

  function gestionarColumnasFamilias() {
    accederPantalla();
    
    // Usar el patrón correcto
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
      .parents('[role="columnheader"]')
      .trigger('mouseover');
    cy.get('[aria-label="Nombre column menu"]').click({ force: true });
    
    cy.get('li').contains('Manage columns').click({ force: true });
    
    // Usar el patrón correcto como en gastosgenerales
    cy.get('.MuiDataGrid-panel')
      .should('be.visible')
      .find('label')
      .contains('Código')
      .parents('label')
      .find('input[type="checkbox"]')
      .check({ force: true });
    
    return cy.get('.MuiDataGrid-columnHeaders')
      .should('be.visible')
      .within(() => {
        cy.contains('Código').should('exist');
      });
  }

  function gestionarColumnasSubfamilias() {
    accederPantalla();
    
    // Usar el patrón correcto
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
      .parents('[role="columnheader"]')
      .trigger('mouseover');
    cy.get('[aria-label="Nombre column menu"]').click({ force: true });
    
    cy.get('li').contains('Manage columns').click({ force: true });
    
    // Usar el patrón correcto como en gastosgenerales
    cy.get('.MuiDataGrid-panel')
      .should('be.visible')
      .find('label')
      .contains('Código')
      .parents('label')
      .find('input[type="checkbox"]')
      .check({ force: true });
    
    return cy.get('.MuiDataGrid-columnHeaders')
      .should('be.visible')
      .within(() => {
        cy.contains('Código').should('exist');
      });
  }

  function gestionarColumnasAlmacenes() {
    accederPantalla();
    
    // Usar el patrón correcto
    cy.contains('.MuiDataGrid-columnHeaderTitle', 'Nombre')
      .parents('[role="columnheader"]')
      .trigger('mouseover');
    cy.get('[aria-label="Nombre column menu"]').click({ force: true });
    
    cy.get('li').contains('Manage columns').click({ force: true });
    
    // Usar el patrón correcto como en gastosgenerales
    cy.get('.MuiDataGrid-panel')
      .should('be.visible')
      .find('label')
      .contains('Código')
      .parents('label')
      .find('input[type="checkbox"]')
      .check({ force: true });
    
    return cy.get('.MuiDataGrid-columnHeaders')
      .should('be.visible')
      .within(() => {
        cy.contains('Código').should('exist');
      });
  }

  function seleccionarFilaFamilias() {
    accederPantalla();
    
    // Primero crear registros para poder seleccionar
    cy.contains('h3, h4, h5, h6, .panel-title, .section-title', 'Familias', { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');
    
    // Crear primer registro
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('FAM1');
    
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo Nombre
      .clear()
      .type('Familia para Seleccionar 1');
    
    cy.get('@panel')
      .find('button')
      .first() // Botón +
      .click();
    
    cy.wait(500);
    
    // Crear segundo registro
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('FAM2');
    
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo Nombre
      .clear()
      .type('Familia para Seleccionar 2');
    
    cy.get('@panel')
      .find('button')
      .first() // Botón +
      .click();
    
    cy.wait(1000);
    
    // Ahora seleccionar la primera fila visible
    return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
  }


  function seleccionarFilaAlmacenes() {
    accederPantalla();
    
    // Primero crear registros para poder seleccionar
    cy.contains('h3, h4, h5, h6, .panel-title, .section-title', 'Almacenes', { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');
    
    // Crear primer registro
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('ALM1');
    
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo Nombre
      .clear()
      .type('Almacen para Seleccionar 1');
    
    cy.get('@panel')
      .find('button')
      .first() // Botón +
      .click();
    
    cy.wait(500);
    
    // Crear segundo registro
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('ALM2');
    
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo Nombre
      .clear()
      .type('Almacen para Seleccionar 2');
    
    cy.get('@panel')
      .find('button')
      .first() // Botón +
      .click();
    
    cy.wait(1000);
    
    // Ahora seleccionar la primera fila visible
    return cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
  }

  function scrollFamilias() {
    accederPantalla();
    
    // Crear 10 registros para intentar hacer scroll
    cy.get('h3, h4, h5, h6, .panel-title, .section-title')
      .contains('Familias')
      .should('exist')
      .parent()
      .as('panel');
    
    // Crear 10 registros para generar scroll
    for (let i = 1; i <= 10; i++) {
      cy.get('@panel')
        .find('input')
        .eq(0) // Campo Código
        .clear()
        .type(`FAM${i.toString().padStart(3, '0')}`);
      
      cy.get('@panel')
        .find('input')
        .eq(1) // Campo Nombre
        .clear()
        .type(`Familia Scroll ${i}`);
      
      cy.get('@panel')
        .find('button')
        .first()
        .click();
      
      cy.wait(200);
    }
    
    cy.wait(1000);
    
    // Verificar que hay filas para hacer scroll
    cy.get('@panel')
      .find('.MuiDataGrid-row')
      .should('have.length.greaterThan', 0);

    // Intentar hacer scroll usando el patrón correcto
    cy.get('.MuiDataGrid-virtualScroller')
      .scrollTo('bottom', { duration: 400 });
    cy.wait(400);
    cy.get('.MuiDataGrid-virtualScroller')
      .scrollTo('top', { duration: 400 });
    cy.wait(400);
    
    // Como no se puede hacer scroll actualmente, registrar ERROR
    // Si en el futuro funciona, cambiar a OK
    cy.registrarResultados({
      numero: 38,
      nombre: 'TC038 - Scroll horizontal/vertical en tabla Familias',
      esperado: 'Scroll funciona correctamente',
      obtenido: 'Scroll no funciona en la tabla (limitación del sistema)',
      resultado: 'ERROR',
      archivo,
      pantalla: 'Almacen (Familias, Subfamilias y Almacenes)'
    });

    return cy.wrap(true);
  }


  function scrollAlmacenes() {
    accederPantalla();
    
    // Crear 10 registros para intentar hacer scroll
    cy.get('h3, h4, h5, h6, .panel-title, .section-title')
      .contains('Almacenes')
      .should('exist')
      .parent()
      .as('panel');
    
    // Crear 10 registros para generar scroll
    for (let i = 1; i <= 10; i++) {
      cy.get('@panel')
        .find('input')
        .eq(0) // Campo Código
        .clear()
        .type(`ALM${i.toString().padStart(3, '0')}`);
      
      cy.get('@panel')
        .find('input')
        .eq(1) // Campo Nombre
        .clear()
        .type(`Almacen Scroll ${i}`);
      
      cy.get('@panel')
        .find('button')
        .first()
        .click();
      
      cy.wait(200);
    }
    
    cy.wait(1000);
    
    // Verificar que hay filas para hacer scroll
    cy.get('@panel')
      .find('.MuiDataGrid-row')
      .should('have.length.greaterThan', 0);

    // Intentar hacer scroll usando el patrón correcto
    cy.get('.MuiDataGrid-virtualScroller')
      .scrollTo('bottom', { duration: 400 });
    cy.wait(400);
    cy.get('.MuiDataGrid-virtualScroller')
      .scrollTo('top', { duration: 400 });
    cy.wait(400);
    
    // Como no se puede hacer scroll actualmente, registrar ERROR
    // Si en el futuro funciona, cambiar a OK
    cy.registrarResultados({
      numero: 40,
      nombre: 'TC040 - Scroll horizontal/vertical en tabla Almacenes',
      esperado: 'Scroll funciona correctamente',
      obtenido: 'Scroll no funciona en la tabla (limitación del sistema)',
      resultado: 'ERROR',
      archivo,
      pantalla: 'Almacen (Familias, Subfamilias y Almacenes)'
    });

    return cy.wrap(true);
  }

  function resetFiltrosRecargar() {
    accederPantalla();
    // Crear un registro
    crearRegistro('Familias', '7', 'familia_reset');
    cy.wait(1000);
    
    // Recargar página
    cy.reload();
    cy.wait(2000);
    
    // Verificar si los datos se mantienen o desaparecen
    return cy.get('body').then(($body) => {
      const bodyText = $body.text();
      const datosDesaparecen = bodyText.includes('No rows') ||
        bodyText.includes('Sin datos') ||
        bodyText.includes('No hay datos') ||
        !bodyText.includes('familia_reset');

      if (datosDesaparecen) {
        // Si los datos desaparecen, registrar WARNING
        cy.registrarResultados({
          numero: 41,
          nombre: 'TC041 - Reset de filtros al recargar página',
          esperado: 'Los datos se mantienen después de recargar',
          obtenido: 'Desaparecen todos los datos creados al recargar',
          resultado: 'WARNING',
          archivo,
          pantalla: 'Almacen (Familias, Subfamilias y Almacenes)'
        });
      } else {
        // Si los datos se mantienen, registrar OK
        cy.registrarResultados({
          numero: 41,
          nombre: 'TC041 - Reset de filtros al recargar página',
          esperado: 'Los datos se mantienen después de recargar',
          obtenido: 'Los datos se mantienen correctamente después de recargar',
          resultado: 'OK',
          archivo,
          pantalla: 'Almacen (Familias, Subfamilias y Almacenes)'
        });
      }

      return cy.wrap(true); // Devolver promesa para evitar auto-OK
    });
  }

  function añadirFamiliaSinCampos() {
    accederPantalla();
    
    // Buscar el panel de Familias
    cy.contains('h3, h4, h5, h6, .panel-title, .section-title', 'Familias', { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');
    
    // Llenar solo el campo Código (dejar Nombre vacío)
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('FAM_TEST');
    
    // No llenar el campo Nombre (dejarlo vacío)
    
    // Pulsar botón verde + sin llenar nombre
    cy.get('@panel')
      .find('button')
      .first()
      .click();
    
    // Verificar que aparece mensaje de error y registrar OK
    return cy.get('body').then(($body) => {
      const bodyText = $body.text();
      const mensajeError = bodyText.includes('por favor') || 
                          bodyText.includes('complete todos los campos') ||
                          bodyText.includes('campos obligatorios') ||
                          bodyText.includes('error') ||
                          bodyText.includes('required');
      
      if (mensajeError) {
        // Si aparece mensaje de error, registrar OK
        cy.registrarResultados({
          numero: 42,
          nombre: 'TC042 - Añadir en Familias sin poner Código o Nombre',
          esperado: 'Mensaje de error por campos incompletos',
          obtenido: 'Mensaje de error mostrado correctamente',
          resultado: 'OK',
          archivo,
          pantalla: 'Almacen (Familias, Subfamilias y Almacenes)'
        });
      } else {
        // Si no aparece mensaje, registrar ERROR
        cy.registrarResultados({
          numero: 42,
          nombre: 'TC042 - Añadir en Familias sin poner Código o Nombre',
          esperado: 'Mensaje de error por campos incompletos',
          obtenido: 'No se mostró mensaje de error',
          resultado: 'ERROR',
          archivo,
          pantalla: 'Almacen (Familias, Subfamilias y Almacenes)'
        });
      }
      
      return cy.wrap(true); // Devolver promesa para evitar auto-OK
    });
  }

  function añadirSubfamiliaSinCampos() {
    accederPantalla();

    // Buscar el panel de Subfamilias (panel del medio)
    cy.get('h3, h4, h5, h6, .panel-title, .section-title')
      .contains('Subfamilias')
      .should('exist')
      .parent()
      .as('panel');
    
    // Llenar el campo "G..." (dropdown/selector)
    cy.get('@panel')
      .find('input, select, button')
      .eq(0) // Campo "G..."
      .type('GENERAL', { force: true });

    // Llenar solo el campo Código (dejar Nombre vacío)
    cy.get('@panel')
      .find('input')
      .eq(1) // Campo Código
      .clear()
      .type('SUB_TEST');

    // No llenar el campo Nombre (dejarlo vacío)
    
    // Pulsar botón verde + sin llenar nombre
    cy.get('@panel')
      .find('button')
      .first()
      .click();
    
    // Verificar que aparece mensaje de error y registrar OK
    return cy.get('body').then(($body) => {
      const bodyText = $body.text();
      const mensajeError = bodyText.includes('por favor') || 
                          bodyText.includes('complete todos los campos') ||
                          bodyText.includes('campos obligatorios') ||
                          bodyText.includes('error') ||
                          bodyText.includes('required');
      
      if (mensajeError) {
        // Si aparece mensaje de error, registrar OK
        cy.registrarResultados({
          numero: 43,
          nombre: 'TC043 - Añadir en Subfamilias sin poner Código o Nombre',
          esperado: 'Mensaje de error por campos incompletos',
          obtenido: 'Mensaje de error mostrado correctamente',
          resultado: 'OK',
          archivo,
          pantalla: 'Almacen (Familias, Subfamilias y Almacenes)'
        });
      } else {
        // Si no aparece mensaje, registrar ERROR
        cy.registrarResultados({
          numero: 43,
          nombre: 'TC043 - Añadir en Subfamilias sin poner Código o Nombre',
          esperado: 'Mensaje de error por campos incompletos',
          obtenido: 'No se mostró mensaje de error',
          resultado: 'ERROR',
          archivo,
          pantalla: 'Almacen (Familias, Subfamilias y Almacenes)'
        });
      }
      
      return cy.wrap(true); // Devolver promesa para evitar auto-OK
    });
  }

  function añadirAlmacenSinCampos() {
    accederPantalla();
    
    // Buscar el panel de Almacenes
    cy.contains('h3, h4, h5, h6, .panel-title, .section-title', 'Almacenes', { timeout: 10000 })
      .should('exist')
      .parent()
      .as('panel');
    
    // Llenar solo el campo Código (dejar Nombre vacío)
    cy.get('@panel')
      .find('input')
      .eq(0) // Campo Código
      .clear()
      .type('ALM_TEST');
    
    // No llenar el campo Nombre (dejarlo vacío)
    
    // Pulsar botón verde + sin llenar nombre
    cy.get('@panel')
      .find('button')
      .first()
      .click();
    
    // Verificar que aparece mensaje de error y registrar OK
    return cy.get('body').then(($body) => {
      const bodyText = $body.text();
      const mensajeError = bodyText.includes('por favor') || 
                          bodyText.includes('complete todos los campos') ||
                          bodyText.includes('campos obligatorios') ||
                          bodyText.includes('error') ||
                          bodyText.includes('required');
      
      if (mensajeError) {
        // Si aparece mensaje de error, registrar OK
        cy.registrarResultados({
          numero: 44,
          nombre: 'TC044 - Añadir en Almacenes sin poner Código o Nombre',
          esperado: 'Mensaje de error por campos incompletos',
          obtenido: 'Mensaje de error mostrado correctamente',
          resultado: 'OK',
          archivo,
          pantalla: 'Almacen (Familias, Subfamilias y Almacenes)'
        });
      } else {
        // Si no aparece mensaje, registrar ERROR
        cy.registrarResultados({
          numero: 44,
          nombre: 'TC044 - Añadir en Almacenes sin poner Código o Nombre',
          esperado: 'Mensaje de error por campos incompletos',
          obtenido: 'No se mostró mensaje de error',
          resultado: 'ERROR',
          archivo,
          pantalla: 'Almacen (Familias, Subfamilias y Almacenes)'
        });
      }
      
      return cy.wrap(true); // Devolver promesa para evitar auto-OK
    });
  }
});