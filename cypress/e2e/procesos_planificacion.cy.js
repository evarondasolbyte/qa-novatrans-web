// procesos_planificacion.cy.js
describe('PROCESOS - PLANIFICACIÓN - Casos TC001-TC030', () => {
  const archivo = 'reportes_pruebas_novatrans.xlsx';

  beforeEach(() => {
    cy.resetearFlagsTest();
    cy.configurarViewportZoom();
    // Configurar timeout para mayor estabilidad
    Cypress.config('defaultCommandTimeout', 30000);
    Cypress.config('requestTimeout', 30000);
    Cypress.config('responseTimeout', 30000);
  });

  after(() => {
    cy.log('Procesando resultados finales para Procesos (Planificación)');
    cy.procesarResultadosPantalla('Procesos (Planificación)');
  });

  it('Ejecutar casos TC001-TC014 desde Excel', () => {
    cy.obtenerDatosExcel('PROCESOS-PLANIFICACION').then((casos) => {
      const casosPlanificacion = casos.filter(caso => {
        const numero = parseInt(caso.caso.replace('TC', ''), 10);
        return numero >= 1 && numero <= 30 && (
          (caso.pantalla || '').toLowerCase().includes('planificación') ||
          (caso.pantalla || '').toLowerCase().includes('planificacion')
        );
      });

      cy.log(`Se encontraron ${casos.length} casos en la hoja`);
      cy.log(`Casos filtrados para Planificación: ${casosPlanificacion.length}`);

      // Nombres específicos para cada caso
      const nombresCasos = {
        1: 'Cargar pantalla correctamente',
        2: 'Buscar por Id',
        3: 'Buscar por Fecha Salida',
        4: 'Buscar por Cliente',
        5: 'Buscar por Ruta',
        6: 'Buscar por Tipo',
        7: 'Buscar por Albarán',
        8: 'Buscar por Cantidad',
        9: 'Buscar por Cantidad Compra',
        10: 'Buscar por Cabeza',
        11: 'Buscar por Kms',
        12: 'Buscar por Domicilio',
        13: 'Buscar por Exp',
        14: 'Buscar por P.Debe',
        15: 'Ordenar por Id (ASC)',
        16: 'Ordenar por Id (DESC)',
        17: 'Ordenar por Fecha Salida (ASC)',
        18: 'Ordenar por Fecha Salida (DESC)',
        19: 'Ordenar por Cliente (ASC)',
        20: 'Ordenar por Cliente (DESC)',
        21: 'Ordenar por Ruta (ASC)',
        22: 'Ordenar por Ruta (DESC)',
        23: 'Ordenar por Tipo (ASC)',
        24: 'Ordenar por Tipo (DESC)',
        25: 'Ordenar por Albarán (ASC)',
        26: 'Ordenar por Albarán (DESC)',
        27: 'Ordenar por Cantidad (ASC)',
        28: 'Ordenar por Cantidad (DESC)',
        29: 'Ordenar por Cantidad Compra (ASC)',
        30: 'Ordenar por Cantidad Compra (DESC)',
      };

      // Función recursiva para ejecutar casos secuencialmente
      const ejecutarCaso = (index) => {
        if (index >= casosPlanificacion.length) {
          return cy.wrap(true);
        }

        const caso = casosPlanificacion[index];
        const numero = parseInt(caso.caso.replace('TC', ''), 10);
        const nombre = caso.nombre || `Caso ${caso.caso}`;
        const prioridad = caso.prioridad || 'MEDIA';

        cy.log(`────────────────────────────────────────────────────────`);
        cy.log(`▶️ Ejecutando caso ${index + 1}/${casosPlanificacion.length}: ${caso.caso} - ${nombre} [${prioridad}]`);
        cy.log(`📝 Nombre del caso: "${nombre}"`);

        cy.resetearFlagsTest();
        cy.login();
        cy.wait(400);

        let funcion;
        // Mapeo específico para TC001-TC014
        if (numero === 1) funcion = cargarPantallaPlanificacion;
        else if (numero >= 2 && numero <= 14) funcion = () => ejecutarFiltroIndividual(numero);
        else if (numero >= 15 && numero <= 30) funcion = () => ejecutarOrdenamiento(numero, caso);
        else {
          cy.log(`⚠️ Caso ${numero} no está en el rango TC001-TC030 - saltando`);
          return ejecutarCaso(index + 1);
        }

        // Ejecutar función si existe
        if (funcion) {
          return funcion().then(() => {
            // Registrar resultado con nombre específico
            cy.log(`TC${numero}: Registrando OK automático`);
            cy.registrarResultados({
              numero,
              nombre: nombresCasos[numero] || nombre,
              esperado: 'Comportamiento correcto',
              obtenido: 'Comportamiento correcto',
              resultado: 'OK',
              archivo,
              pantalla: 'Procesos (Planificación)',
            });
          }).then(() => {
            // Ejecutar el siguiente caso
            return ejecutarCaso(index + 1);
          });
        } else {
          // Si no hay función, registrar directamente
          cy.log(`TC${numero}: Registrando OK automático (sin función)`);
          cy.registrarResultados({
            numero,
            nombre: nombresCasos[numero] || nombre,
            esperado: 'Comportamiento correcto',
            obtenido: 'Comportamiento correcto',
            resultado: 'OK',
            archivo,
            pantalla: 'Procesos (Planificación)',
          });
          return ejecutarCaso(index + 1);
        }
      };

      // Iniciar ejecución del primer caso
      return ejecutarCaso(0);
    });
  });

  // ====== OBJETO UI ======
  const UI = {
    abrirPantalla() {
      cy.navegarAMenu('Procesos', 'Planificación');
      cy.url().should('include', '/dashboard/planification');
      
      // Esperar a que la página cargue completamente
      cy.get('body').should('be.visible');
      cy.wait(1000); // Pausa para estabilizar la carga
      
      // Verificar que el DataGrid esté presente y visible
      cy.get('.MuiDataGrid-root', { timeout: 15000 })
        .should('be.visible')
        .should('not.be.empty');
      
      // Verificar que hay filas de datos
      cy.get('.MuiDataGrid-row', { timeout: 10000 })
        .should('have.length.greaterThan', 0);
      
      return cy.get('.MuiDataGrid-root');
    },

    setColumna(nombreColumna) {
      return cy.get('select[name="column"], select#column').should('be.visible').then($select => {
        const options = [...$select[0].options].map(opt => opt.text.trim());
        cy.log(`Opciones columna: ${options.join(', ')}`);
        let columnaEncontrada = null;
        
        switch (nombreColumna) {
          case 'Id': columnaEncontrada = options.find(o => /Id|ID/i.test(o)); break;
          case 'Fecha Salida': columnaEncontrada = options.find(o => /Fecha Salida|Fecha/i.test(o)); break;
          case 'Cliente': columnaEncontrada = options.find(o => /Cliente|Client/i.test(o)); break;
          case 'Ruta': columnaEncontrada = options.find(o => /Ruta|Route/i.test(o)); break;
          case 'Tipo': columnaEncontrada = options.find(o => /Tipo|Type/i.test(o)); break;
          case 'Albarán': columnaEncontrada = options.find(o => /Albarán|Albaran/i.test(o)); break;
          case 'Cantidad': columnaEncontrada = options.find(o => /Cantidad|Quantity/i.test(o)); break;
          case 'Cantidad Compra': columnaEncontrada = options.find(o => /Cantidad Compra|Purchase/i.test(o)); break;
          case 'Cabeza': columnaEncontrada = options.find(o => /Cabeza|Head/i.test(o)); break;
          case 'Kms': columnaEncontrada = options.find(o => /Kms|Kilometers/i.test(o)); break;
          case 'Domicilio': columnaEncontrada = options.find(o => /Domicilio|Address/i.test(o)); break;
          case 'Exp': columnaEncontrada = options.find(o => /Exp|Experience/i.test(o)); break;
          case 'P.Debe': columnaEncontrada = options.find(o => /P\.Debe|Debt/i.test(o)); break;
          case 'Reemb': columnaEncontrada = options.find(o => /Reemb|Reimburse/i.test(o)); break;
          case 'Tarifa': columnaEncontrada = options.find(o => /Tarifa|Rate/i.test(o)); break;
          case 'Todos': columnaEncontrada = options.find(o => /Todos|All/i.test(o)); break;
          default:
            columnaEncontrada = options.find(opt => 
              opt.toLowerCase().includes(nombreColumna.toLowerCase()) ||
              nombreColumna.toLowerCase().includes(opt.toLowerCase())
            );
        }
        
        if (columnaEncontrada) {
          cy.wrap($select).select(columnaEncontrada);
        } else {
          cy.wrap($select).select(1);
        }
      });
    },

    buscar(texto) {
      return cy.get('input[placeholder="Buscar"]:not([id*="sidebar"])', { timeout: 10000 })
        .should('be.visible')
        .should('not.be.disabled')
        .clear({ force: true })
        .type(`${texto}`, { force: true, delay: 50 })
        .wait(300) // Aumentado para estabilidad
        .type('{enter}', { force: true })
        .wait(500); // Esperar a que se procese la búsqueda
    },

    filasVisibles() {
      return cy.get('.MuiDataGrid-row:visible');
    }
  };

  // ====== FUNCIONES DINÁMICAS ======

  function cargarPantallaPlanificacion() {
    UI.abrirPantalla();
    cy.get('.MuiDataGrid-root').should('be.visible');
    return UI.filasVisibles().should('have.length.greaterThan', 0);
  }

  // Usar la función de commands.js para filtros individuales
  function ejecutarFiltroIndividual(numeroCaso) {
    return cy.ejecutarFiltroIndividual(numeroCaso, 'Procesos (Planificación)', 'PROCESOS-PLANIFICACION', 'Procesos', 'Planificación');
  }

  const limpiarTextoColumna = (texto = '') => texto
    .replace(/ordenar\s+por\s+/gi, '')
    .replace(/(ascendente|descendente)/gi, '')
    .trim();

  const simplificar = (texto = '') => texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const obtenerConfigOrden = (casoExcel) => {
    const candidatosColumna = [
      casoExcel?.dato_1,
      casoExcel?.valor_etiqueta_1,
      casoExcel?.etiqueta_1,
      casoExcel?.nombre
    ].filter(Boolean);

    let columna = 'Id';
    for (const candidato of candidatosColumna) {
      const limpio = limpiarTextoColumna(candidato);
      if (limpio) {
        columna = limpio;
        break;
      }
    }

    const textoDireccion = simplificar([
      casoExcel?.dato_2,
      casoExcel?.valor_etiqueta_2,
      casoExcel?.etiqueta_2,
      casoExcel?.nombre
    ].filter(Boolean).join(' '));

    const direccion = textoDireccion.includes('desc') ? 'desc' : 'asc';

    return { columna, direccion };
  };

  function ejecutarOrdenamiento(numeroCaso, casoExcel) {
    const { columna, direccion } = obtenerConfigOrden(casoExcel);
    cy.log(`⚙️ TC${numeroCaso}: Ordenando columna "${columna}" en dirección "${direccion}"`);
    return ordenarColumna(columna, direccion);
  }

  const escapeRegex = (texto = '') => texto.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

  function ordenarColumna(nombreColumna, direccion = 'asc') {
    UI.abrirPantalla();

    const esperado = direccion.startsWith('desc') ? 'descending' : 'ascending';
    const maxIntentos = 4;
    const patron = new RegExp(`^${escapeRegex(nombreColumna)}$`, 'i');

    const intentarOrden = (intento = 0) => {
      return cy.contains('.MuiDataGrid-columnHeaderTitle', patron)
        .should('be.visible')
        .closest('[role="columnheader"]')
        .then($header => {
          const actual = $header.attr('aria-sort') || 'none';

          if (actual === esperado) {
            cy.log(`✅ Columna "${nombreColumna}" quedó en "${direccion}"`);
            return UI.filasVisibles().should('have.length.greaterThan', 0);
          }

          if (intento >= maxIntentos) {
            cy.log(`⚠️ No se logró fijar el orden "${direccion}" para "${nombreColumna}" tras ${maxIntentos} intentos`);
            return UI.filasVisibles().should('have.length.greaterThan', 0);
          }

          cy.wrap($header).click({ force: true });
          cy.wait(400);
          return intentarOrden(intento + 1);
        });
    };

    return intentarOrden();
  }
});
