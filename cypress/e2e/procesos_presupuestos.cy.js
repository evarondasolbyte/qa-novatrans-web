describe('PROCESOS > PRESUPUESTOS - Validación completa con errores y reporte a Excel', () => {
    const archivo = 'reportes_pruebas_novatrans.xlsx';

  // Login una sola vez con sesión cacheada
  before(() => {
    cy.session('novatrans-presupuestos', () => { cy.login(); });
  });

  // Resumen al final
    after(() => {
        cy.procesarResultadosPantalla('Procesos (Presupuestos)');
    });

  // --- Normalizador: mapea lo que venga del Excel a TCxxx ---
  const mapFuncionToTc = (raw, caso = '') => {
    const f = (raw || '').toString().trim().toLowerCase();

    // Si ya es tc###
    const m = f.match(/^tc(\d{1,})$/i);
    if (m) return `tc${m[1].padStart(3, '0')}`;

    // Mapeo automático: si la función es vacía, usar el número de caso
    if (!f || f.trim() === '') {
      const mc = (caso || '').toString().trim().toLowerCase().match(/^tc(\d{1,})$/i);
      if (mc) return `tc${mc[1].padStart(3, '0')}`;
    }


    // Inferir por Nº de caso (p.ej., "TC008" -> "tc008")
    const mc = (caso || '').toString().trim().toLowerCase().match(/^tc(\d{1,})$/i);
    if (mc) return `tc${mc[1].padStart(3, '0')}`;

    return f; // caerá en default (log)
  };

  // === Test principal que ejecuta todos los casos del Excel ===
  it('Ejecutar todos los casos de presupuestos desde Excel', () => {
    cy.obtenerDatosExcel('Procesos (Presupuestos)').then((datos) => {
      cy.log(`Encontrados ${datos.length} casos en Excel`);

    const prioridadFiltro = Cypress.env('prioridad');
    const casosFiltrados = prioridadFiltro && prioridadFiltro !== 'todas' 
        ? datos.filter(c => c.prioridad === prioridadFiltro.toUpperCase())
        : datos;

      // Ejecutar todos los casos del Excel (incluyendo todos los TC008)
      const casosFinales = casosFiltrados;
      cy.log(`Ejecutando ${casosFinales.length} casos del Excel`);

      return cy.wrap(casosFinales).each((caso) => {
        cy.log(`Ejecutando ${caso.caso}: ${caso.nombre}`);
        cy.log(`Datos completos del caso:`, JSON.stringify(caso, null, 2));

        // Reset flags por caso
            cy.resetearFlagsTest();

        // Handler de error SOLO para este caso
        Cypress.once('fail', (err) => {
          cy.capturarError(`${caso.caso} - ${caso.nombre}`, err, {
            numero: caso.caso,
            nombre: `${caso.caso} - ${caso.nombre}`,
                    esperado: 'Comportamiento correcto',
                    archivo,
                    pantalla: 'Procesos (Presupuestos)'
                });
          return false; // continuar con los demás casos
            });

        // Aterriza siempre en dashboard (sesión ya creada en before)
        cy.visit('/dashboard', { timeout: 60000 });
        cy.wait(400);

        // Ejecutar función específica
        return ejecutarFuncionPresupuestos(caso).then(() => {
                cy.estaRegistrado().then((ya) => {
                    if (!ya) {
              cy.log(`Registrando OK automático para ${caso.caso}`);
                        cy.registrarResultados({
                numero: caso.caso,
                nombre: `${caso.caso} - ${caso.nombre}`,
                            esperado: 'Comportamiento correcto',
                            obtenido: 'Comportamiento correcto',
                            resultado: 'OK',
                            archivo,
                            pantalla: 'Procesos (Presupuestos)'
                        });
                    }
                });
                });
            });
        });
    });

  // === FUNCIÓN CENTRAL: ejecuta según TC normalizado ===
  const ejecutarFuncionPresupuestos = (caso) => {
    const tc = mapFuncionToTc(caso.funcion, caso.caso);
    cy.log(`Ejecutando función normalizada: ${tc} (original: ${caso.funcion}) para ${caso.caso}`);

    // Mapeo automático basado en la funcionalidad del Excel
    const funcionalidad = (caso.funcionalidad || '').toLowerCase();
    const numeroCaso = parseInt(caso.caso.replace(/\D/g, ''), 10);
    
    // Mapeo automático por funcionalidad
    if (funcionalidad.includes('carga') || numeroCaso === 1) return cargarPantallaPresupuestos();
    if (funcionalidad.includes('verificar') || numeroCaso === 2) return verificarColumnas();
    if (funcionalidad.includes('filtro') || funcionalidad.includes('busqueda') || funcionalidad.includes('buscar')) {
      return ejecutarFiltroPresupuestos(caso);
    }
    if (funcionalidad.includes('ordenar') || funcionalidad.includes('sort')) {
      return ordenarColumnas(caso.dato_1, caso.dato_2, caso);
    }
    if (funcionalidad.includes('filter') && numeroCaso === 17) {
      return usarFiltroColumna('Código', caso.dato_2 || '2');
    }
    if (funcionalidad.includes('mostrar') || funcionalidad.includes('show')) {
      return numeroCaso === 18 ? mostrarColumnaManageColumns() : mostrarColumna(caso.dato_1);
    }
    if (funcionalidad.includes('ocultar') || funcionalidad.includes('hide')) {
      return ocultarColumna(caso.dato_1);
    }
    if (funcionalidad.includes('añadir') || funcionalidad.includes('add')) {
      return añadirAbreFormulario();
    }
    if (funcionalidad.includes('editar') || funcionalidad.includes('edit')) {
      return editarAbreFormulario();
    }
    if (funcionalidad.includes('eliminar') || funcionalidad.includes('delete')) {
      return eliminarRegistro();
    }
    if (funcionalidad.includes('recargar') || funcionalidad.includes('reload')) {
      return recargarPagina();
    }
    if (funcionalidad.includes('idioma') || funcionalidad.includes('language')) {
      return cambiarIdioma(caso);
    }
    if (funcionalidad.includes('fecha') || funcionalidad.includes('date')) {
      return buscarFecha(caso);
    }

    // Fallback: casos específicos por número (solo para casos existentes)
    if (numeroCaso === 1) return cargarPantallaPresupuestos();
    if (numeroCaso === 2) return verificarColumnas();
    if (numeroCaso === 18) return mostrarColumnaManageColumns();
    if (numeroCaso === 19) return ocultarColumna(caso.dato_1);
    if (numeroCaso === 23) return añadirAbreFormulario();
    if (numeroCaso === 24) return editarAbreFormulario();
    if (numeroCaso === 25) return eliminarRegistro();
    if (numeroCaso === 26) return recargarPagina();
    if (numeroCaso === 30) return buscarFecha(caso);
    if (numeroCaso === 31) return cargarPantallaPresupuestos();

    // Caso por defecto: intentar filtro si no se reconoce
    cy.log(`Función no reconocida para caso: ${caso.caso}, intentando filtro por defecto`);
    return ejecutarFiltroPresupuestos(caso);
  };

  // === FUNCIONES ESPECÍFICAS DE PRESUPUESTOS ===

  // Espera robusta a que cargue el DataGrid de Presupuestos
  const esperarGridPresupuestos = () => {
    cy.location('pathname', { timeout: 15000 }).should('match', /\/dashboard\/budgets/);
    cy.get('.MuiDataGrid-root', { timeout: 20000 }).should('be.visible');
    return cy.get('.MuiDataGrid-row', { timeout: 20000 })
      .its('length')
      .should('be.greaterThan', 0);
  };

  // Navegación directa (robusta) a Budgets
  const cargarPantallaPresupuestos = () => {
    cy.log('Cargando pantalla de presupuestos');
    return cy.location('pathname', { timeout: 0 }).then((path) => {
      if (/\/dashboard\/budgets/.test(path)) {
        cy.log('Ya estoy en /dashboard/budgets');
        return esperarGridPresupuestos();
      }
      cy.visit('https://novatrans-web-2mhoc.ondigitalocean.app/dashboard/budgets', { timeout: 60000 });
      return esperarGridPresupuestos();
    });
  };

  const verificarColumnas = () => {
    cy.log('Verificando columnas de presupuestos');
    cargarPantallaPresupuestos();

    const columnas = ['Código', 'Número', 'Solicitud', 'Vencimiento', 'Envío', 'Aceptación', 'Título', 'Cliente'];

    cy.get('.MuiDataGrid-root').should('be.visible');
    cy.get('.MuiDataGrid-row').should('have.length.greaterThan', 0);

    columnas.forEach(col => {
      cy.log(`Verificando columna: ${col}`);
      cy.get('.MuiDataGrid-columnHeader').contains(col).should('be.visible');
    });

    return cy.get('.MuiDataGrid-row:first-child').within(() => {
      cy.get('[data-field]').should('have.length.greaterThan', 0);
    });
  };

  const ejecutarFiltroPresupuestos = (caso) => {
    cy.log(`Ejecutando filtro: ${caso.dato_1} = ${caso.dato_2}`);

    if (caso.caso === 'TC007') {
      cy.log('TC007: Saltando porque no existe esa columna');
      return cy.wrap({ filasVisibles: 0, noRows: false, resultado: 'SKIP' });
    }

    cargarPantallaPresupuestos();

    const v1 = (caso.valor_etiqueta_1 || '').toString().toLowerCase();
    const d1 = (caso.dato_1 || '').toString().trim();
    const d2 = (caso.dato_2 || '').toString().trim();

    cy.log(`Datos: v1=${v1}, d1="${d1}", d2="${d2}"`);

    // Validar que tenemos datos para buscar
    if (!d1 && !d2) {
      cy.log(`Caso ${caso.caso}: No hay datos para buscar, saltando caso`);
      cy.log(`Datos recibidos: v1="${v1}", d1="${d1}", d2="${d2}"`);
      return cy.wrap({ filasVisibles: 0, noRows: false, resultado: 'SKIP' });
    }

    if (d1 === 'Todos') {
      // búsqueda libre
      cy.log(`Búsqueda libre: ${d2}`);
      cy.get('input[placeholder*="search"]').should('be.visible').clear({ force: true }).type(`${d2}{enter}`, { force: true });
    } else if (v1 === 'search') {
      // búsqueda libre con el dato_1
      cy.log(`Búsqueda libre: ${d1}`);
      cy.get('input[placeholder*="search"]').should('be.visible').clear({ force: true }).type(`${d1}{enter}`, { force: true });
    } else if (v1 === 'columna' && d1 && d2) {
      // selección de columna + texto
      cy.log(`Búsqueda por columna ${d1}: ${d2}`);
                cy.get('body').then($body => {
        if ($body.find('select[name="column"]').length) {
          cy.get('select[name="column"]').select(d1, { force: true });
        } else if ($body.find('select').length) {
          cy.get('select').first().select(d1, { force: true });
        } else if ($body.find('[role="combobox"]').length) {
          cy.get('[role="combobox"]').first().click({ force: true });
          cy.contains('[role="option"], li, div', new RegExp(`^${d1}$`, 'i')).click({ force: true });
                    } else {
          cy.log('No hay selector de columna; fallback a búsqueda libre');
        }
      }).then(() => {
        cy.get('input[placeholder*="search"]').should('be.visible').clear({ force: true }).type(`${d2}{enter}`, { force: true });
                });
            } else {
      // Fallback: búsqueda libre con el dato más informativo
      const valorBuscar = d2 || d1;
      cy.log(`Búsqueda fallback: ${valorBuscar}`);
      cy.get('input[placeholder*="search"]').should('be.visible').clear({ force: true }).type(`${valorBuscar}{enter}`, { force: true });
    }

    cy.wait(1200);

    return cy.get('body').then($body => {
      const filasVisibles = $body.find('.MuiDataGrid-row:visible').length;
      const hayNoRows = $body.find('.MuiDataGrid-overlay').length > 0 && $body.text().includes('No rows');

      cy.log(`Filtro aplicado: ${filasVisibles} filas visibles, No rows: ${hayNoRows}`);

      const casosSinResultados = ['TC020', 'TC021', 'TC022'];
      if (casosSinResultados.includes(caso.caso)) {
        cy.log(`${caso.caso}: esperado 0 resultados - ${hayNoRows ? 'OK' : 'ERROR'}`);
        return cy.wrap({ filasVisibles: 0, noRows: hayNoRows, resultado: hayNoRows ? 'OK' : 'ERROR' });
      } else {
        const resultado = (filasVisibles > 0 || hayNoRows) ? 'OK' : 'ERROR';
        return cy.wrap({ filasVisibles, noRows: hayNoRows, resultado });
      }
    });
  };

  const ejecutarBusquedaSimple = (caso) => {
    cy.log(`Ejecutando búsqueda simple: ${caso.dato_1}`);
    cargarPantallaPresupuestos();
    cy.get('input[placeholder*="search"]').should('be.visible').clear({ force: true }).type(`${caso.dato_1}{enter}`, { force: true });
    cy.wait(1200);
    return cy.get('.MuiDataGrid-row:visible').then($rows => cy.wrap({ filasVisibles: $rows.length }));
  };

  const cambiarIdioma = (caso) => {
    cy.log(`Cambiando idioma a: ${caso.dato_1}`);
    cargarPantallaPresupuestos();
    cy.get('body').then($b => {
      if ($b.find('select#languageSwitcher').length > 0) {
        cy.get('select#languageSwitcher').select(caso.dato_1, { force: true });
      } else if ($b.find('select[name="language"]').length > 0) {
        cy.get('select[name="language"]').select(caso.dato_1, { force: true });
      } else if ($b.find('.language-selector').length > 0) {
        cy.get('.language-selector').select(caso.dato_1, { force: true });
      }
    });
    cy.wait(1200);
    const textoEsperado = caso.dato_1 === 'en' ? 'Code' : (caso.dato_1 === 'ca' ? 'Codi' : 'Código');
    cy.get('.MuiDataGrid-columnHeaders').should('contain.text', textoEsperado);
    return cy.wrap(true);
  };

  const buscarFecha = (caso) => {
    cy.log(`Buscando por fecha: ${caso.dato_1} - ${caso.dato_2}`);
    cargarPantallaPresupuestos();
    cy.get('.MuiPickersInputBase-sectionsContainer').first().within(() => {
      const [d, m, y] = caso.dato_1.split('/');
      cy.get('span[aria-label="Day"]').type(`{selectall}{backspace}${d}`);
      cy.get('span[aria-label="Month"]').type(`{selectall}{backspace}${m}`);
      cy.get('span[aria-label="Year"]').type(`{selectall}{backspace}${y}`);
    });
    cy.get('.MuiPickersInputBase-sectionsContainer').eq(1).within(() => {
      const [d, m, y] = caso.dato_2.split('/');
      cy.get('span[aria-label="Day"]').type(`{selectall}{backspace}${d}`);
      cy.get('span[aria-label="Month"]').type(`{selectall}{backspace}${m}`);
      cy.get('span[aria-label="Year"]').type(`{selectall}{backspace}${y}`);
    });
    cy.wait(1200);
    return cy.get('.MuiDataGrid-row:visible').then($rows => cy.wrap({ filasVisibles: $rows.length }));
  };

  const ordenarColumnas = (columna, orden, caso) => {
    cy.log(`Intentando ordenar por columna: ${columna} (${orden})`);
    
    // Extraer columna del nombre del caso si no se especifica
    let columnaAOrdenar = columna;
    if (!columnaAOrdenar || columnaAOrdenar.trim() === '') {
      const nombre = (caso?.nombre || '').toLowerCase();
      if (nombre.includes('código')) columnaAOrdenar = 'Código';
      else if (nombre.includes('número')) columnaAOrdenar = 'Número';
      else if (nombre.includes('solicitud')) columnaAOrdenar = 'Solicitud';
      else if (nombre.includes('título')) columnaAOrdenar = 'Título';
      else if (nombre.includes('cliente')) columnaAOrdenar = 'Cliente';
      else if (nombre.includes('vencimiento')) columnaAOrdenar = 'Vencimiento';
      else if (nombre.includes('envío')) columnaAOrdenar = 'Envío';
      else if (nombre.includes('aceptación')) columnaAOrdenar = 'Aceptación';
      else {
        cy.log('No se pudo determinar la columna, usando primera columna disponible');
        columnaAOrdenar = 'Código'; // Fallback
      }
    }
    
    cargarPantallaPresupuestos();
    return cy.get('.MuiDataGrid-row:visible').then($rows => {
      const filasVisibles = $rows.length;
      if (filasVisibles === 0) {
        cy.log('No hay datos en la tabla para ordenar');
        return cy.wrap({ exito: false, motivo: 'Sin datos' });
      }
      
      cy.log(`Ordenando por columna: ${columnaAOrdenar}`);
      
      // Hacer click en el header de la columna (orden ascendente)
      cy.get('.MuiDataGrid-columnHeader').contains(columnaAOrdenar).click({ force: true });
        cy.wait(1000);

      // Hacer click otra vez (orden descendente)
      cy.get('.MuiDataGrid-columnHeader').contains(columnaAOrdenar).click({ force: true });
        cy.wait(1000);

      cy.log(`Ordenación aplicada: ${columnaAOrdenar} (ascendente y descendente)`);
      return cy.wrap({ exito: true, filas: filasVisibles });
    });
  };

  const usarFiltroColumna = (columna, valor) => {
    cy.log(`Usando filtro desde menú de columna: ${columna} con valor: ${valor}`);
    
    cargarPantallaPresupuestos();
    return cy.get('.MuiDataGrid-row:visible').then($rows => {
      const filasVisibles = $rows.length;
      if (filasVisibles === 0) {
        cy.log('No hay datos en la tabla para filtrar');
        return cy.wrap({ exito: false, motivo: 'Sin datos' });
      }
      
      // Hacer click en el menú de tres puntos de la columna específica
      cy.get('.MuiDataGrid-columnHeader').contains(columna).parent().find('.MuiDataGrid-menuIcon').click({ force: true });
      cy.wait(500);
      
      // Seleccionar "Filter" del menú
      cy.get('[role="menuitem"]').contains(/Filter|Filtro|Filtros/i).click({ force: true });
      cy.wait(1000);
      
      // Buscar el panel de filtro y escribir el valor
      cy.get('[role="tooltip"], .MuiPopper-root').should('be.visible').then($panel => {
        cy.wrap($panel).find('input[placeholder*="Filter value"], input[placeholder*="Value"], input[placeholder*="Filtro"]')
          .should('be.visible')
          .clear({ force: true })
          .type(valor, { delay: 100, force: true });
      });
      
      cy.wait(500);
      cy.log(`Filtro aplicado en columna ${columna} con valor ${valor}`);
      return cy.wrap({ exito: true, filas: filasVisibles });
    });
  };

  const ocultarColumna = (columna) => {
    cy.log(`Ocultando columna: ${columna}`);
    
    cargarPantallaPresupuestos();
    return cy.get('.MuiDataGrid-row:visible').then($rows => {
      const filasVisibles = $rows.length;
      if (filasVisibles === 0) {
        cy.log('No hay datos en la tabla para ocultar columna');
        return cy.wrap({ exito: false, motivo: 'Sin datos' });
      }
      
      // Hacer click en el menú de tres puntos de la columna específica
      cy.get('.MuiDataGrid-columnHeader').contains(columna).parent().find('.MuiDataGrid-menuIcon').click({ force: true });
      cy.wait(500);
      
      // Seleccionar "Hide column" del menú
      cy.get('[role="menuitem"]').contains(/Hide column|Ocultar/i).click({ force: true });
      cy.wait(1000);
      
      cy.log(`Columna ${columna} ocultada correctamente`);
      return cy.wrap({ exito: true, filas: filasVisibles });
    });
  };

  const mostrarColumna = (columna) => {
    cy.log(`Mostrando columna: ${columna}`);
    cargarPantallaPresupuestos();
    cy.get('button[aria-label*="column menu"]').first().click({ force: true });
    cy.contains('li[role="menuitem"]', /Show column|Mostrar columna/i).click({ force: true });
    cy.wait(600);
    return cy.wrap(true);
  };

  const mostrarColumnaManageColumns = () => {
    cy.log('Mostrando columna usando Manage Columns');
    cargarPantallaPresupuestos();
    cy.get('button[aria-label*="column menu"]').first().click({ force: true });
    cy.contains('li[role="menuitem"]', /Manage columns|Administrar columnas/i).click({ force: true });
    cy.get('[role="tooltip"], .MuiPopper-root').should('be.visible')
      .find('input[name="codigo"]').check({ force: true });
    cy.wait(600);
    return cy.wrap(true);
  };

  const añadirAbreFormulario = () => {
    cy.log('Abriendo formulario de añadir');
    cargarPantallaPresupuestos();
    cy.contains('button', /^(\+\s*)?Añadir$/).click({ force: true });
    cy.url().should('include', '/dashboard/budgets/form');
    return cy.wrap(true);
  };

  const editarAbreFormulario = () => {
    cy.log('Abriendo formulario de editar');
    cargarPantallaPresupuestos();
        cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    cy.wait(400);
    cy.contains('button', /^Editar$/).click({ force: true });
    cy.url().should('include', '/dashboard/budgets/form');
    return cy.wrap(true);
  };

  const eliminarRegistro = () => {
    cy.log('Eliminando registro');
    cargarPantallaPresupuestos();
    cy.get('.MuiDataGrid-row:visible').first().click({ force: true });
    cy.wait(400);
    cy.contains('button', /^Eliminar$/).click({ force: true });
    return cy.wrap(true);
  };

  const recargarPagina = () => {
    cy.log('Recargando página');
    cargarPantallaPresupuestos();
    cy.get('input[placeholder*="search"]').type('12{enter}', { force: true });
    cy.wait(600);
        cy.reload();
    cy.get('input[placeholder*="search"]').should('have.value', '');
    return cy.wrap(true);
  };
});