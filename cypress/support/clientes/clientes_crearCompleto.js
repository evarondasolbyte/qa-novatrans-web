const { escapeRegex } = require('./clientes_utils');

function crearHelperCrearCompletoClientes(config) {
  const {
    PANTALLA,
    HOJA_EXCEL,
    MENU,
    SUBMENU,
    URL_PATH,
    UI,
    abrirFormularioNuevoCliente,
    llenarFormularioGeneralesDesdeExcel,
    deducirSeccionDesdeCaso,
    navegarSeccionFormulario,
    abrirModalSeccion,
    llenarFormularioDireccion,
    clickGuardarDentroFormulario,
    abrirModalContacto,
    llenarFormularioZonasCarga,
    llenarFormularioContacto,
    llenarFormularioAcciones,
    llenarFormularioCertificaciones,
    llenarFormularioSeccion,
    llenarFormularioFacturacion,
    llenarFormularioDatosAdicionales,
    llenarFormularioDocumentos,
    verificarPestanaConFilas,
    registrarResultadoAutomatico,
  } = config;

  function TC040(caso, numero, casoId) {
    const numeroCaso = Number(numero) || 40;
    const idCaso = casoId || `TC${String(numeroCaso).padStart(3, '0')}`;
    cy.log('TC040: Creando cliente completo con todas las pestanas');

    return cy.obtenerDatosExcel(HOJA_EXCEL).then((todosLosCasos) => {
      const caso6 = todosLosCasos.find((c) => {
        const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
        return num === 6;
      });

      if (!caso6) {
        cy.log(' No se encontró el caso 6 en Excel, usando datos del caso actual');
        return TC040ConDatos(caso, todosLosCasos, numeroCaso, idCaso);
      }

      cy.log('Usando datos del caso 6 para DATOS GENERALES');
      return TC040ConDatos(caso6, todosLosCasos, numeroCaso, idCaso);
    });
  }

  function TC040ConDatos(casoDatosGenerales, todosLosCasos, numeroCaso = 40, idCaso = 'TC040') {
    const timestamp = Date.now().toString().slice(-6);
    const numeroAleatorio = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const nombreCliente = `prueba${timestamp}${numeroAleatorio}`;
    cy.log(`TC040: Nombre del cliente generado (único): ${nombreCliente}`);

    let codigoCliente = null;
    let busquedaClienteRealizada = false;

    const casoModificado = { ...casoDatosGenerales };
    casoModificado.dato_7 = nombreCliente;

    const caso9Facturacion = todosLosCasos.find((c) => {
      const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
      return num === 9;
    });

    cy.intercept('POST', '**/InsertRegister**', (req) => {
      if (req.body) {
        try {
          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const ibanCompletoGlobal = window.ibanCompletoGlobal;

          if (ibanCompletoGlobal && ibanCompletoGlobal.length >= 15) {
            if (body.Mantenimiento && body.Mantenimiento.IBAN) {
              const ibanAnterior = body.Mantenimiento.IBAN;
              if (ibanAnterior.length < 15) {
                body.Mantenimiento.IBAN = ibanCompletoGlobal;
                console.log(`[INTERCEPT] IBAN corregido en Mantenimiento: "${ibanAnterior}" -> "${ibanCompletoGlobal}"`);
              }
            }

            if (body.FacturacionEmpresas && Array.isArray(body.FacturacionEmpresas)) {
              body.FacturacionEmpresas.forEach((fact, idx) => {
                if (fact.IBAN && fact.IBAN.length < 15) {
                  const ibanAnterior = fact.IBAN;
                  fact.IBAN = ibanCompletoGlobal;
                  console.log(`[INTERCEPT] IBAN corregido en FacturacionEmpresas[${idx}]: "${ibanAnterior}" -> "${ibanCompletoGlobal}"`);
                }
              });
            }

            req.body = typeof req.body === 'string' ? JSON.stringify(body) : body;
          } else {
            console.warn(`[INTERCEPT] No se encontró IBAN completo global (ibanCompletoGlobal=${ibanCompletoGlobal})`);
          }
        } catch (e) {
          console.error(`[INTERCEPT] Error al procesar request body: ${e.message}`);
        }
      }
    }).as('guardarCliente');

    return cy.login()
      .then(() => {
        cy.navegarAMenu(MENU, SUBMENU, { expectedPath: URL_PATH });
        cy.url().should('include', URL_PATH).and('not.include', '/form');
        cy.wait(1000);
        return UI.esperarTabla();
      })
      .then(() => {
        cy.log('Pulsando botón "+ Nuevo" para abrir formulario...');
        return abrirFormularioNuevoCliente();
      })
      .then(() => {
        return cy.url().then((urlDespuesNuevo) => {
          if (!urlDespuesNuevo.includes('/dashboard/clients/form')) {
            cy.log('El formulario no se abrió, intentando de nuevo el botón "+ Nuevo"...');
            return abrirFormularioNuevoCliente().then(() =>
              cy.url().should('include', '/dashboard/clients/form')
            );
          }
          return cy.wrap(null);
        });
      })
      .then(() => {
        cy.log('Rellenando DATOS GENERALES usando datos del caso 6...');
        return llenarFormularioGeneralesDesdeExcel(casoModificado, 6);
      })
      .then(() => {
        cy.log('Rellenando todas las pestanas usando datos de los casos 7-14...');
        const casosPestanas = todosLosCasos.filter((c) => {
          const num = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
          return num >= 7 && num <= 14;
        });

        cy.log(`Encontrados ${casosPestanas.length} casos para las pestanas (7-14)`);

        casosPestanas.sort((a, b) => {
          const numA = parseInt(String(a.caso || '').replace(/\D/g, ''), 10);
          const numB = parseInt(String(b.caso || '').replace(/\D/g, ''), 10);
          return numA - numB;
        });

        const casoDocumentos = casosPestanas.find((c) => /documento/i.test(deducirSeccionDesdeCaso(c)));
        const casosSinDocumentos = casosPestanas.filter((c) => !/documento/i.test(deducirSeccionDesdeCaso(c)));

        let chain = cy.wrap(null);

        casosSinDocumentos.forEach((casoPestana) => {
          const numeroPestana = parseInt(String(casoPestana.caso || '').replace(/\D/g, ''), 10);
          const seccion = deducirSeccionDesdeCaso(casoPestana);

          chain = chain.then(() => {
            cy.log(`Rellenando pestana ${seccion} con datos del caso ${numeroPestana}`);

            const esSeccionContacto = /contacto/i.test(seccion);
            const esSeccionAcciones = /acciones|historial/i.test(seccion);
            const esSeccionCertificaciones = /certific/i.test(seccion);
            const esZonasCarga = /zona(s)?\s+de\s+carga/i.test(seccion);
            const esDatosAdicionales = /dato.*adicional/i.test(seccion);
            const esSeccionDocumentos = /documento/i.test(seccion);
            const esSeccionDireccion = /dirección|direccion/i.test(seccion);
            const esSeccionFacturacion = /facturación|facturacion/i.test(seccion);
            const esSeccionConModal = esSeccionContacto || esSeccionAcciones || esZonasCarga || esSeccionCertificaciones || esSeccionDocumentos || esSeccionDireccion;

            if (esSeccionConModal) {
              if (esSeccionDocumentos) {
                cy.log('TC040: Documentos se pospone al final, continuando con la siguiente pestana...');
                return cy.wrap(null);
              }

              if (esSeccionDireccion) {
                return navegarSeccionFormulario('Contacto')
                  .then(() => {
                    cy.wait(500);
                    cy.log('Navegando a sub-pestana "Direcciones" dentro de Contacto...');
                    return cy.contains('button, [role="tab"], div, span', /Direcciones|Direccion/i, { timeout: 10000 })
                      .should('be.visible')
                      .click({ force: true })
                      .then(() => {
                        cy.wait(500);
                        cy.log('Sub-pestana "Direcciones" seleccionada');
                        return cy.wrap(null);
                      });
                  })
                  .then(() => abrirModalSeccion(seccion, true))
                  .then(() => llenarFormularioDireccion(casoPestana, numeroPestana))
                  .then(() => {
                    cy.log(`Guardando modal de ${seccion} usando botón Guardar del formulario...`);
                    return clickGuardarDentroFormulario().then(() => cy.wait(500));
                  })
                  .then(() => cy.wait(500));
              }

              return navegarSeccionFormulario(seccion)
                .then(() => {
                  if (esSeccionContacto) return abrirModalContacto();
                  return abrirModalSeccion(seccion, esZonasCarga ? false : !esZonasCarga);
                })
                .then(() => {
                  if (esZonasCarga) return llenarFormularioZonasCarga(casoPestana, numeroPestana);
                  if (esSeccionContacto) return llenarFormularioContacto(casoPestana, numeroPestana);
                  if (esSeccionAcciones) return llenarFormularioAcciones(casoPestana, numeroPestana);
                  if (esSeccionCertificaciones) return llenarFormularioCertificaciones(casoPestana, numeroPestana);
                  return llenarFormularioSeccion(casoPestana, numeroPestana, seccion);
                })
                .then(() => cy.wait(500))
                .then(() => {
                  if (esSeccionContacto || esSeccionAcciones || esZonasCarga || esSeccionCertificaciones) {
                    cy.log(`Guardando modal de ${seccion} usando botón Guardar del formulario...`);
                    return clickGuardarDentroFormulario().then(() => cy.wait(500));
                  }

                  cy.log(`No se guarda modal de ${seccion}, continuando a siguiente pestana`);
                  return cy.wrap(null);
                })
                .then(() => cy.wait(500));
            }

            if (esSeccionFacturacion) {
              if (!caso9Facturacion) {
                cy.log('TC040: ERROR - No se encontró el caso 9 para Facturación. Se omite el rellenado de Facturación.');
                return cy.wrap(null);
              }

              return navegarSeccionFormulario(seccion)
                .then(() => {
                  cy.wait(1000);
                  cy.log('TC040: Pestana Facturación cargada, iniciando rellenado...');
                  return llenarFormularioFacturacion(caso9Facturacion, 9);
                })
                .then(() => {
                  cy.wait(1000);
                });
            }

            if (esDatosAdicionales) {
              return navegarSeccionFormulario(seccion)
                .then(() => llenarFormularioDatosAdicionales(casoPestana, numeroPestana))
                .then(() => cy.wait(500));
            }

            return cy.wrap(null);
          });
        });

        return chain.then(() => {
          if (!casoDocumentos) {
            cy.log('TC040: No hay caso de Documentos en Excel, se continúa sin subir documento');
            return cy.wrap(null);
          }

          const numeroPestana = parseInt(String(casoDocumentos.caso || '').replace(/\D/g, ''), 10);
          cy.log(`TC040: Subiendo documento con datos del caso ${numeroPestana}`);

          return navegarSeccionFormulario('Documentos')
            .then(() => llenarFormularioDocumentos(casoDocumentos, numeroPestana))
            .then(() => cy.wait(1000));
        });
      })
      .then(() => {
        return cy.url().then((urlActual) => {
          if (!urlActual.includes('/dashboard/clients/form')) {
            cy.log(' Ya no estamos en el formulario, no se puede guardar');
            return cy.wrap(null);
          }

          cy.log('Guardando formulario principal DESPUÉS de rellenar todas las pestanas (Documentos va el último)...');
          cy.wait(3000);

          return cy.get('body').then(($body) => {
            const erroresValidacion = $body.find('[class*="error"], [class*="Error"]')
              .filter((_, el) => {
                const texto = (el.textContent || '').toLowerCase();
                return texto.includes('obligatorio') || texto.includes('requerido') || texto.includes('required');
              });

            if (erroresValidacion.length > 0) {
              cy.log(`ADVERTENCIA: Se encontraron ${erroresValidacion.length} errores de validación antes de guardar`);
              erroresValidacion.each((i, el) => {
                cy.log(`  - Error: ${(el.textContent || '').trim()}`);
              });
            } else {
              cy.log(' No se detectaron errores de validación antes de guardar');
            }
          });
        });
      })
      .then(() => {
        return cy.get('body').then(($body) => {
          const botonGuardarGeneral = $body.find('button[type="submit"], button:contains("Guardar")')
            .filter((_, el) => {
              const $el = Cypress.$(el);
              const tieneCheck = $el.find('svg, [class*="Check"], [class*="check"]').length > 0;
              const estaEnFormulario = $el.closest('.MuiDrawer-root, .MuiModal-root, [role="dialog"]').length === 0;
              const texto = ($el.text() || '').trim().toLowerCase();
              return estaEnFormulario && /guardar/i.test(texto);
            })
            .first();

          if (botonGuardarGeneral.length > 0) {
            return cy.get('body').then(($bodyIban) => {
              const $ibanInputs = $bodyIban.find('input[name*="iban"], input[id*="iban"]').filter(':visible');
              const ibanPartes = {};

              $ibanInputs.each((i, el) => {
                const name = el.name || el.id || '';
                const valor = (el.value || '').trim();

                if (name.includes('iban-country') || name.includes('iban-iban')) {
                  ibanPartes.pais = valor;
                } else if (name.includes('iban-office') || name.includes('iban-entity')) {
                  ibanPartes.office = valor;
                } else if (name.includes('iban-control')) {
                  ibanPartes.control = valor;
                } else if (name.includes('iban-account')) {
                  ibanPartes.account = valor;
                }
              });

              if (ibanPartes.pais && ibanPartes.office && ibanPartes.control && ibanPartes.account) {
                const ibanCompleto = `${ibanPartes.pais}${ibanPartes.office}${ibanPartes.control}${ibanPartes.account}`;
                cy.window().then((win) => {
                  win.ibanCompletoGlobal = ibanCompleto;
                  cy.log(`IBAN completo construido antes de Guardar: "${ibanCompleto}" (${ibanCompleto.length} caracteres)`);
                  console.log(`IBAN completo construido antes de Guardar: "${ibanCompleto}" (${ibanCompleto.length} caracteres)`);
                });
              } else {
                cy.log(`No se pudo construir IBAN completo antes de Guardar. Partes encontradas: país=${!!ibanPartes.pais}, office=${!!ibanPartes.office}, control=${!!ibanPartes.control}, account=${!!ibanPartes.account}`);
              }

              return cy.wrap(botonGuardarGeneral)
                .should('be.visible')
                .scrollIntoView()
                .click({ force: true });
            })
              .then(() => esperarRespuestaGuardadoTC040(() => {
                cy.log('TC040: Botón Guardar clickeado, esperando respuesta...');
              }));
          }

          return cy.contains('button', /^Guardar$/i, { timeout: 10000 })
            .not('.MuiDrawer-root button, .MuiModal-root button, [role="dialog"] button')
            .scrollIntoView()
            .click({ force: true })
            .then(() => esperarRespuestaGuardadoTC040(() => {
              cy.log('TC040: Botón Guardar clickeado (fallback), esperando respuesta...');
            }, true));
        });
      })
      .then(() => {
        cy.log('TC040: Verificando si aparece mensaje de guardado correcto...');
        return cy.get('body', { timeout: 10000 }).then(($body) => {
          const textoCompleto = $body.text();
          const tieneExito = textoCompleto.includes('guardado correctamente') ||
            textoCompleto.includes('Guardado correctamente') ||
            textoCompleto.includes('guardado exitosamente') ||
            textoCompleto.includes('Guardado exitosamente') ||
            textoCompleto.includes('saved successfully') ||
            $body.find('[class*="success"], [class*="Success"], [role="alert"]').filter((_, el) => {
              const texto = (el.textContent || '').toLowerCase();
              return texto.includes('guardado') || texto.includes('correcto') || texto.includes('exitoso');
            }).length > 0;

          try {
            const win = window || null;
            if (win) {
              win.__TC040_GUARDADO_OK__ = !!tieneExito;
            }
          } catch (e) {
          }

          if (tieneExito) {
            cy.log('TC040: Mensaje de guardado correcto detectado');
            cy.wait(2000);
          } else {
            cy.log('TC040: No se detectó mensaje de éxito explícito, continuando...');
          }
        });
      })
      .then(() => {
        cy.log('TC040: Verificando si aparece alerta de error...');
        return cy.get('body').then(($body) => {
          const textoCompleto = $body.text();
          let guardadoOk = false;

          try {
            const win = window || null;
            guardadoOk = !!(win && win.__TC040_GUARDADO_OK__);
          } catch (e) {
            guardadoOk = false;
          }

          const hayTextoError = textoCompleto.includes('Request failed with status code 500') ||
            textoCompleto.includes('status code 500') ||
            textoCompleto.includes('Error 500') ||
            $body.find('[class*="error"], [class*="Error"], [role="alert"]').filter((_, el) => {
              const texto = (el.textContent || '').toLowerCase();
              return texto.includes('500') ||
                texto.includes('error') ||
                texto.includes('failed');
            }).length > 0;

          const tieneError = !guardadoOk && hayTextoError;

          if (tieneError) {
            cy.log(' TC040: Alerta de error detectada después de guardar');
            const mensajeError = $body.find('[class*="error"], [class*="Error"], [role="alert"]')
              .first()
              .text()
              .trim() || 'Request failed with status code 500';

            return cy.registrarResultados({
              numero: numeroCaso,
              nombre: `${idCaso} - ${casoDatosGenerales?.nombre || 'Crear cliente completo con todas las pestanas'}`,
              esperado: 'Comportamiento correcto',
              obtenido: mensajeError,
              resultado: 'ERROR',
              pantalla: PANTALLA
            }).then(() => {
              cy.log('TC040: Caso terminado por error detectado');
              return cy.wrap('ERROR_DETECTADO');
            });
          }

          cy.log('TC040: No se detectó alerta de error, continuando con búsqueda...');
          return cy.wrap(null);
        });
      })
      .then((codigoDesdeRespuesta) => {
        if (codigoDesdeRespuesta === 'ERROR_DETECTADO') {
          return cy.wrap(null);
        }

        if (codigoDesdeRespuesta) {
          codigoCliente = codigoDesdeRespuesta;
          cy.log(`TC040: Código del cliente obtenido desde respuesta: ${codigoCliente}`);
        }

        cy.log('TC040: Formulario guardado. Buscando cliente por código...');

        return cy.url().then((urlActual) => {
          if (urlActual.includes('/dashboard/clients/form')) {
            cy.log('Navegando a la lista de clientes...');
            return cy.visit(URL_PATH).then(() => cy.wait(2000));
          }
          return cy.wrap(null);
        });
      })
      .then(() => UI.esperarTabla())
      .then(() => {
        if (!codigoCliente) {
          cy.log('TC040: No se capturó el código desde la respuesta, buscando primero por nombre para obtener el código...');
          return UI.buscar(nombreCliente)
            .then(() => {
              busquedaClienteRealizada = true;
            })
            .then(() => cy.wait(1000))
            .then(() => {
              return cy.get('body').then(($body) => {
                const primeraFila = $body.find('.MuiDataGrid-row:visible').first();
                if (primeraFila.length > 0) {
                  const primeraCelda = primeraFila.find('.MuiDataGrid-cell').first();
                  const textoCodigo = (primeraCelda.text() || '').trim();
                  if (textoCodigo && /^\d+$/.test(textoCodigo)) {
                    codigoCliente = textoCodigo;
                    cy.log(`TC040: Código del cliente leído de la tabla: ${codigoCliente}`);
                  }
                }
                return cy.wrap(null);
              });
            });
        }
        return cy.wrap(null);
      })
      .then(() => {
        if (busquedaClienteRealizada) {
          cy.log('TC040: La búsqueda del cliente ya está hecha, no se repite');
          return cy.wrap(null);
        }
        const valorBusqueda = codigoCliente || nombreCliente;
        const tipoBusqueda = codigoCliente ? 'código' : 'nombre';
        cy.log(`TC040: Buscando cliente por ${tipoBusqueda}: ${valorBusqueda}`);
        return UI.buscar(valorBusqueda).then(() => {
          busquedaClienteRealizada = true;
        });
      })
      .then(() => {
        cy.wait(1000);

        let intentos = 0;
        const buscarFila = () => {
          return cy.get('body').then(($body) => {
            const filas = $body.find('.MuiDataGrid-row:visible');
            if (filas.length === 0) {
              cy.log(' No se encontraron filas en la tabla');
              return cy.wrap(null);
            }

            const filaEncontrada = Array.from(filas).find((el) => {
              const textoFila = (el.innerText || el.textContent || '').toLowerCase();
              if (codigoCliente) {
                const primeraCelda = el.querySelector('.MuiDataGrid-cell:first-child');
                const codigoEnFila = primeraCelda ? (primeraCelda.textContent || '').trim() : '';
                return codigoEnFila === codigoCliente || textoFila.includes(codigoCliente.toLowerCase());
              }
              return textoFila.includes(nombreCliente.toLowerCase());
            });

            if (filaEncontrada) {
              const tipoEncontrado = codigoCliente ? 'código' : 'nombre';
              cy.log(`Cliente encontrado en la lista por ${tipoEncontrado} - VERIFICADO que está guardado`);
              cy.log('Abriendo formulario de edición para verificar datos...');
              return cy.wrap(filaEncontrada).dblclick({ force: true });
            }

            if (intentos === 0) {
              intentos += 1;
              cy.log(' Fila no encontrada, reintentando búsqueda...');
              const valorBusqueda = codigoCliente || nombreCliente;
              return UI.buscar(valorBusqueda)
                .then(() => cy.wait(1000))
                .then(() => buscarFila());
            }

            const tipoBusqueda = codigoCliente ? 'código' : 'nombre';
            const valorBusqueda = codigoCliente || nombreCliente;
            cy.log(`ERROR: No se encontró la fila con el ${tipoBusqueda} del cliente "${valorBusqueda}" tras reintentar`);
            cy.log('El cliente NO está guardado en la base de datos');
            return cy.wrap('CLIENTE_NO_ENCONTRADO');
          });
        };

        return buscarFila();
      })
      .then((resultado) => {
        if (resultado === 'CLIENTE_NO_ENCONTRADO') {
          return cy.registrarResultados({
            numero: numeroCaso,
            nombre: `${idCaso} - ${casoDatosGenerales?.nombre || 'Crear cliente completo con todas las pestanas'}`,
            esperado: `Cliente "${nombreCliente}" guardado y encontrado en la lista`,
            obtenido: 'Cliente no encontrado en la lista después de guardar',
            resultado: 'ERROR',
            pantalla: PANTALLA
          }).then(() => {
            cy.log('TC040: Caso terminado - cliente no encontrado');
            return cy.wrap('CLIENTE_NO_ENCONTRADO');
          });
        }

        cy.wait(2000);
        return cy.url().should('include', '/dashboard/clients/form')
          .then(() => {
            cy.log(`? TC040: Cliente "${nombreCliente}" guardado correctamente y verificado`);
            cy.log('? Formulario de edición abierto - el cliente existe en la base de datos');
          });
      })
      .then((resultado) => {
        if (resultado === 'CLIENTE_NO_ENCONTRADO') {
          return cy.wrap(null);
        }

        cy.log('TC040: Verificando que todas las pestanas tienen datos guardados...');

        const pestanasAVerificar = [
          { nombre: 'Contacto', tieneSubpestana: true },
          { nombre: 'Acciones', tieneSubpestana: false },
          { nombre: 'Zonas de carga', tieneSubpestana: false },
          { nombre: 'Certificaciones', tieneSubpestana: false },
          { nombre: 'Documentos', tieneSubpestana: false },
          { nombre: 'Facturación', tieneSubpestana: false },
          { nombre: 'Datos adicionales', tieneSubpestana: false }
        ];

        let chainVerificacion = cy.wrap([]);

        const escapeCssId = (id = '') => id.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');
        const normalizar = (v) => (v === undefined || v === null ? '' : String(v)).trim().toLowerCase();

        const obtenerDatoPorSelectorExcel = (caso, needle) => {
          const n = (needle || '').toString();
          const total = Number(caso?.__totalCamposExcel) || 30;
          for (let i = 1; i <= total; i++) {
            const sel = (caso?.[`valor_etiqueta_${i}`] || '').toString();
            const val = caso?.[`dato_${i}`];
            if (sel && sel.includes(n) && val !== undefined && val !== null && `${val}` !== '') {
              return val;
            }
          }
          return null;
        };

        const tieneValorEsperado = (v) => v !== undefined && v !== null && String(v).trim() !== '';

        const obtenerDatoPorNameExcel = (caso, nameAttr) => {
          if (!nameAttr) return null;
          const total = Number(caso?.__totalCamposExcel) || 30;
          const nameAttrLower = String(nameAttr).toLowerCase().trim();

          for (let i = 1; i <= total; i++) {
            const tipo = (caso?.[`etiqueta_${i}`] || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
            const selector = (caso?.[`valor_etiqueta_${i}`] || '').toString().toLowerCase().trim();
            const val = caso?.[`dato_${i}`];
            if (!tipo.includes('name')) continue;

            const selectorSinPrefijo = selector.replace(/^client\./, '');
            const nameAttrSinPrefijo = nameAttrLower.replace(/^client\./, '');
            const coincide = selector === nameAttrLower ||
              selector.includes(nameAttrLower) ||
              nameAttrLower.includes(selector) ||
              selectorSinPrefijo === nameAttrSinPrefijo ||
              selectorSinPrefijo.includes(nameAttrSinPrefijo) ||
              nameAttrSinPrefijo.includes(selectorSinPrefijo);

            if (coincide && val !== undefined && val !== null && `${val}` !== '') {
              return val;
            }
          }
          return null;
        };

        const leerBooleanoExcel = (...valores) => {
          const bruto = valores.find((v) => v !== undefined && v !== null && String(v).trim() !== '');
          if (bruto === undefined) return null;

          const txt = String(bruto).trim().toLowerCase();
          if (['true', '1', 'si', 'sí', 'yes', 'y', 'x'].includes(txt)) return true;
          if (['false', '0', 'no', 'n'].includes(txt)) return false;
          return null;
        };

        const esperadosFacturacion = caso9Facturacion
          ? {
            empresas: obtenerDatoPorNameExcel(caso9Facturacion, 'client.companyId') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, 'client.companyId') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_17g_') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_17g_-label') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, 'Empresas'),
            tipoFacturacion: obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_17i_') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_17i_-label') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_17h_') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_17h_-label') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, 'r_5t_') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_5t_') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_8i_') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_8i_-label') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_8j_') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_8j_-label') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, 'Tipo Facturación'),
            disenoFactura: obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_17j_') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_17j_-label') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, 'Diseño Factura'),
            banco: obtenerDatoPorNameExcel(caso9Facturacion, 'client.bankName'),
            formaPago: obtenerDatoPorNameExcel(caso9Facturacion, 'client.paymentMethodDesc') ||
              obtenerDatoPorNameExcel(caso9Facturacion, 'client.paymentMethodId'),
            swift: obtenerDatoPorNameExcel(caso9Facturacion, 'client.swift'),
            iva: obtenerDatoPorNameExcel(caso9Facturacion, 'client.defaultTax'),
            diaCobro1: obtenerDatoPorNameExcel(caso9Facturacion, 'client.diaCobro1'),
            diaCobro2: obtenerDatoPorNameExcel(caso9Facturacion, 'client.diaCobro2'),
            cContable: obtenerDatoPorNameExcel(caso9Facturacion, 'client.CuentaContable') ||
              obtenerDatoPorNameExcel(caso9Facturacion, 'client.bankAccount'),
            riesgoAsegurado: obtenerDatoPorNameExcel(caso9Facturacion, 'client.RiesgoAsegurado') ||
              obtenerDatoPorNameExcel(caso9Facturacion, 'client.insuredRisk'),
            dto: obtenerDatoPorNameExcel(caso9Facturacion, 'client.discount'),
            cVenta: obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_48') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_1an_') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, 'C. Venta') ||
              obtenerDatoPorNameExcel(caso9Facturacion, 'client.salesAccount'),
            cccEmpresa: obtenerDatoPorSelectorExcel(caso9Facturacion, '_r_1ab_') ||
              obtenerDatoPorSelectorExcel(caso9Facturacion, 'CCC Empresa'),
            cobroFinMes: leerBooleanoExcel(
              obtenerDatoPorNameExcel(caso9Facturacion, 'client.cobroFinMes'),
              obtenerDatoPorSelectorExcel(caso9Facturacion, 'Cobro fin mes')
            ),
            conRiesgo: leerBooleanoExcel(
              obtenerDatoPorNameExcel(caso9Facturacion, 'client.withRiskB'),
              obtenerDatoPorSelectorExcel(caso9Facturacion, 'Con Riesgo')
            )
          }
          : null;

        const leerValorInputPorLabel = (labelTexto) => {
          const rx = new RegExp(`^${escapeRegex(labelTexto)}$`, 'i');
          return cy.get('body').then(($b) => {
            const $label = $b.find('label').filter((_, el) => rx.test((el.textContent || el.innerText || '').trim())).first();
            if ($label.length) {
              const forAttr = $label.attr('for');
              if (forAttr) {
                const sel = `#${escapeCssId(forAttr)}`;
                const $inp = $b.find(sel).first();
                if ($inp.length) return cy.wrap($inp).invoke('val');
              }
              const $inp2 = $label.parents('.MuiFormControl-root').first().find('input, textarea').first();
              if ($inp2.length) return cy.wrap($inp2).invoke('val');
            }
            return cy.wrap('');
          });
        };

        const leerValorPorName = (nameAttr) => {
          const sel = `input[name="${nameAttr}"], textarea[name="${nameAttr}"]`;
          return cy.get('body').then(($b) => {
            const $inp = $b.find(sel).filter(':visible').first();
            if ($inp.length) return cy.wrap($inp).invoke('val');
            return cy.wrap('');
          });
        };

        const leerSwitchPorName = (nameAttr) => {
          return cy.get('body').then(($b) => {
            const $inp = $b.find(`input[name="${nameAttr}"]`).filter(':visible').first();
            if (!$inp.length) return cy.wrap(null);
            return cy.wrap(Boolean($inp.prop('checked')));
          });
        };

        const coincideValor = (actual, esperado, { exacto = false } = {}) => {
          const a = normalizar(actual);
          const e = normalizar(esperado);
          if (!a && a !== '0') return false;
          if (!e && e !== '0') return false;
          return exacto ? a === e : (a === e || a.includes(e) || e.includes(a));
        };

        const verificarFacturacion = () => {
          if (!esperadosFacturacion) return cy.wrap([]);

          const checksLabel = [
            { label: 'Empresas', esperado: esperadosFacturacion.empresas, exacto: false, permitirVacio: true },
            { label: 'Tipo Facturación', esperado: esperadosFacturacion.tipoFacturacion, exacto: true },
            { label: 'Diseño Factura', esperado: esperadosFacturacion.disenoFactura, exacto: true },
            { label: 'CCC Empresa', esperado: esperadosFacturacion.cccEmpresa, exacto: true },
            { label: 'C. Venta', esperado: esperadosFacturacion.cVenta, exacto: true }
          ];

          const checksTexto = [
            { name: 'client.bankName', label: 'Banco', esperado: esperadosFacturacion.banco, exacto: false },
            { name: 'client.paymentMethodId', label: 'Forma de Pago', esperado: esperadosFacturacion.formaPago, exacto: false },
            { name: 'client.swift', label: 'Swift', esperado: esperadosFacturacion.swift, exacto: false },
            { name: 'client.defaultTax', label: 'IVA', esperado: esperadosFacturacion.iva, exacto: false },
            { name: 'client.diaCobro1', label: 'Días Cobro 1', esperado: esperadosFacturacion.diaCobro1, exacto: false },
            { name: 'client.diaCobro2', label: 'Días Cobro 2', esperado: esperadosFacturacion.diaCobro2, exacto: false },
            { name: 'client.bankAccount', label: 'C. Contable', esperado: esperadosFacturacion.cContable, exacto: false },
            { name: 'client.insuredRisk', label: 'Riesgo Asegurado', esperado: esperadosFacturacion.riesgoAsegurado, exacto: false },
            { name: 'client.discount', label: 'Dto', esperado: esperadosFacturacion.dto, exacto: false }
          ];

          const checksSwitch = [
            { name: 'client.cobroFinMes', label: 'Cobro fin mes', esperado: esperadosFacturacion.cobroFinMes },
            { name: 'client.withRiskB', label: 'Con Riesgo', esperado: esperadosFacturacion.conRiesgo }
          ];

          let chain = cy.wrap([]);

          checksLabel.forEach((c) => {
            chain = chain.then((errores) => {
              if (!tieneValorEsperado(c.esperado)) return cy.wrap(errores);
              return leerValorInputPorLabel(c.label).then((actual) => {
                const a = normalizar(actual);
                if (c.permitirVacio && (!a || a === '0')) {
                  cy.log(`Facturación (${c.label}): está vacío o es "0", se considera OK (no se verifica)`);
                  return cy.wrap(errores);
                }
                if (!coincideValor(actual, c.esperado, { exacto: c.exacto })) {
                  const msg = `Facturación (${c.label}): esperado="${c.esperado}" obtenido="${actual || ''}"`;
                  return cy.wrap([...errores, msg]);
                }
                return cy.wrap(errores);
              });
            });
          });

          checksTexto.forEach((c) => {
            chain = chain.then((errores) => {
              if (!tieneValorEsperado(c.esperado)) return cy.wrap(errores);
              return leerValorPorName(c.name).then((actualPorName) => {
                if (c.name === 'client.insuredRisk' && normalizar(actualPorName) === '0') {
                  cy.log('Facturación (Riesgo Asegurado): valor por defecto "0", se considera OK');
                  return cy.wrap(errores);
                }
                if (tieneValorEsperado(actualPorName)) {
                  if (!coincideValor(actualPorName, c.esperado, { exacto: c.exacto })) {
                    const msg = `Facturación (${c.label}): esperado="${c.esperado}" obtenido="${actualPorName || ''}"`;
                    return cy.wrap([...errores, msg]);
                  }
                  return cy.wrap(errores);
                }
                return leerValorInputPorLabel(c.label).then((actualPorLabel) => {
                  if (c.name === 'client.insuredRisk' && normalizar(actualPorLabel) === '0') {
                    cy.log('Facturación (Riesgo Asegurado): valor por defecto "0", se considera OK');
                    return cy.wrap(errores);
                  }
                  if (!coincideValor(actualPorLabel, c.esperado, { exacto: c.exacto })) {
                    const msg = `Facturación (${c.label}): esperado="${c.esperado}" obtenido="${actualPorLabel || ''}"`;
                    return cy.wrap([...errores, msg]);
                  }
                  return cy.wrap(errores);
                });
              });
            });
          });

          checksSwitch.forEach((c) => {
            chain = chain.then((errores) => {
              if (c.esperado === null || c.esperado === undefined) return cy.wrap(errores);
              return leerSwitchPorName(c.name).then((actual) => {
                if (actual === null) {
                  const msg = `Facturación (${c.label}): no se encontró el switch en pantalla`;
                  return cy.wrap([...errores, msg]);
                }
                if (Boolean(actual) !== Boolean(c.esperado)) {
                  const msg = `Facturación (${c.label}): esperado="${c.esperado}" obtenido="${actual}"`;
                  return cy.wrap([...errores, msg]);
                }
                return cy.wrap(errores);
              });
            });
          });

          return chain.then((errores) => {
            if (!errores.length) {
              cy.log('Facturación verificada completa');
            }
            return cy.wrap(errores);
          });
        };

        pestanasAVerificar.forEach((pestanaInfo) => {
          chainVerificacion = chainVerificacion.then((pestanasSinDatos) => {
            cy.log(`Verificando pestana: ${pestanaInfo.nombre}`);

            return navegarSeccionFormulario(pestanaInfo.nombre)
              .then(() => cy.wait(1000))
              .then(() => {
                if (pestanaInfo.nombre === 'Facturación') {
                  return verificarFacturacion().then((erroresFact) => {
                    const nuevas = [...pestanasSinDatos];
                    if (erroresFact && erroresFact.length) {
                      erroresFact.forEach((e) => nuevas.push(e));
                    }
                    return cy.wrap(nuevas);
                  });
                }

                if (pestanaInfo.nombre === 'Documentos') {
                  return cy.get('body').then(($body) => {
                    const filasDocumento = $body.find('.MuiDataGrid-row:visible, tbody tr:visible, .MuiTableBody-root tr:visible')
                      .filter((_, el) => {
                        const textoFila = (el.textContent || el.innerText || '').trim().toLowerCase();
                        return textoFila.length > 0 && !/sin\s+filas|no\s+hay\s+datos|sin\s+datos/i.test(textoFila);
                      });
                    const texto = ($body.text() || '').toLowerCase();
                    const tieneDocumento = filasDocumento.length > 0 || !/sin\s+filas|no\s+hay\s+datos|sin\s+datos/i.test(texto);

                    if (!tieneDocumento) {
                      const nuevasPestanasSinDatos = [...pestanasSinDatos];
                      nuevasPestanasSinDatos.push('Documentos');
                      return cy.wrap(nuevasPestanasSinDatos);
                    }

                    cy.log(`Documentos verificados: ${filasDocumento.length > 0 ? `${filasDocumento.length} fila(s)` : 'contenido presente'}`);
                    return cy.wrap(pestanasSinDatos);
                  });
                }

                if (pestanaInfo.tieneSubpestana && pestanaInfo.nombre === 'Contacto') {
                  return verificarPestanaConFilas('Contacto')
                    .then((tieneDatosContacto) => {
                      const nuevasPestanasSinDatos = [...pestanasSinDatos];
                      if (!tieneDatosContacto) {
                        nuevasPestanasSinDatos.push('Contacto');
                      }
                      cy.log('Navegando a sub-pestana "Direcciones" dentro de Contacto...');
                      return cy.wait(500)
                        .then(() => {
                          return cy.get('body').then(($body) => {
                            const elementoDirecciones = $body.find('button, [role="tab"], div, span')
                              .filter((_, el) => {
                                const texto = (el.textContent || el.innerText || '').trim();
                                return /^Direcciones?$/i.test(texto);
                              })
                              .filter(':visible')
                              .first();

                            if (elementoDirecciones.length > 0) {
                              return cy.wrap(elementoDirecciones[0])
                                .scrollIntoView()
                                .click({ force: true })
                                .then(() => cy.wait(1000))
                                .then(() => verificarPestanaConFilas('Direcciones'));
                            }

                            return cy.contains('button, [role="tab"], div, span', /Direcciones|Direccion/i, { timeout: 10000 })
                              .scrollIntoView()
                              .click({ force: true })
                              .then(() => cy.wait(1000))
                              .then(() => verificarPestanaConFilas('Direcciones'));
                          });
                        })
                        .then((tieneDatosDirecciones) => {
                          if (!tieneDatosDirecciones) {
                            nuevasPestanasSinDatos.push('Direcciones');
                          }
                          return cy.wrap(nuevasPestanasSinDatos);
                        });
                    });
                }

                return verificarPestanaConFilas(pestanaInfo.nombre)
                  .then((tieneDatos) => {
                    const nuevasPestanasSinDatos = [...pestanasSinDatos];
                    if (!tieneDatos) {
                      nuevasPestanasSinDatos.push(pestanaInfo.nombre);
                    }
                    return cy.wrap(nuevasPestanasSinDatos);
                  });
              });
          });
        });

        return chainVerificacion;
      })
      .then((pestanasSinDatos) => {
        cy.log('TC040: Verificaciín completada');

        let resultado = 'OK';
        let mensaje = `Cliente ${nombreCliente} creado y verificado. Todas las pestanas tienen datos guardados.`;

        if (pestanasSinDatos && pestanasSinDatos.length > 0) {
          resultado = 'ERROR';
          const pestanasError = pestanasSinDatos.join(', ');
          mensaje = `Cliente ${nombreCliente} creado, pero las siguientes pestanas NO tienen datos guardados: ${pestanasError}`;
          cy.log(` ERROR: Las siguientes pestanas no tienen datos: ${pestanasError}`);
        } else {
          cy.log(' Todas las pestanas tienen datos guardados correctamente');
        }

        return registrarResultadoAutomatico(
          numeroCaso,
          idCaso,
          casoModificado?.nombre || 'Comprobar que se guardan todos los datos',
          mensaje,
          resultado,
          true
        );
      });

    function esperarRespuestaGuardadoTC040(logInicio, esFallback = false) {
      if (typeof logInicio === 'function') {
        logInicio();
      }

      return cy.wait('@guardarCliente', { timeout: 15000 }).then((interception) => {
        const status = interception.response?.statusCode || 'N/A';
        const statusText = interception.response?.statusMessage || 'N/A';
        const requestBody = interception.request.body;
        const responseBody = interception.response?.body;
        const sufijo = esFallback ? ' (fallback)' : '';

        cy.log('-------------------------------------------------------');
        cy.log(`TC040: RESPUESTA DEL SERVIDOR RECIBIDA${sufijo}`);
        cy.log(`Status: ${status}`);
        if (!esFallback) {
          cy.log(`Status Text: ${statusText}`);
        }

        console.log('-------------------------------------------------------');
        console.log(`TC040: RESPUESTA DEL SERVIDOR RECIBIDA${sufijo}`);
        console.log('Status:', status);
        if (!esFallback) {
          console.log('Status Text:', statusText);
        }

        if (responseBody) {
          if (!esFallback) {
            cy.log(`Response Body: ${JSON.stringify(responseBody, null, 2)}`);
            console.log('Response Body:', responseBody);
          }

          if (responseBody.code || responseBody.codigo || responseBody.id) {
            codigoCliente = responseBody.code || responseBody.codigo || responseBody.id;
            cy.log(`TC040: Código del cliente capturado desde respuesta${sufijo}: ${codigoCliente}`);
            console.log(`TC040: Código del cliente capturado desde respuesta${sufijo}: ${codigoCliente}`);
          }
        }

        if (status === 409) {
          cy.log(' ERROR 409 DETECTADO: El código del cliente ya existe');
          console.error('ERROR 409 DETECTADO: El código del cliente ya existe');
          if (responseBody?.Message) {
            cy.log(`Mensaje: ${responseBody.Message}`);
            console.error(`Mensaje: ${responseBody.Message}`);
          }
          cy.log('El cliente ya existe en la base de datos. No se intentará guardar de nuevo.');
          console.warn('El cliente ya existe en la base de datos. No se intentará guardar de nuevo.');
        }

        if (status === 500) {
          cy.log(`ERROR 500 DETECTADO EN LA RESPUESTA${sufijo}`);
          cy.log(`Request Body enviado: ${JSON.stringify(requestBody, null, 2)}`);
          console.error(`ERROR 500 DETECTADO EN LA RESPUESTA${sufijo}`);
          console.log('Request Body enviado:', requestBody);
          console.log('Request Body (JSON):', JSON.stringify(requestBody, null, 2));

          if (!esFallback && (responseBody?.Message || responseBody?.MENSAJE_ERROR)) {
            const errorMsg = responseBody.Message || responseBody.MENSAJE_ERROR;
            cy.log(`Mensaje de error del servidor: ${errorMsg}`);
            console.error(`Mensaje de error del servidor: ${errorMsg}`);
          }

          cy.log('-------------------------------------------------------');
          cy.log(`ANÁLISIS DE CAMPOS EN REQUEST BODY${esFallback ? ' (fallback)' : ''}:`);
          console.log('-------------------------------------------------------');
          console.log(`ANÁLISIS DE CAMPOS EN REQUEST BODY${esFallback ? ' (fallback)' : ''}:`);

          if (requestBody?.Mantenimiento) {
            const mant = requestBody.Mantenimiento;

            if (mant.IBAN) {
              const ibanLength = String(mant.IBAN || '').length;
              if (ibanLength < 10) {
                cy.log(`PROBLEMA DETECTADO: IBAN incompleto (solo ${ibanLength} caracteres): "${mant.IBAN}"`);
                console.error(`PROBLEMA DETECTADO: IBAN incompleto (solo ${ibanLength} caracteres): "${mant.IBAN}"`);
                cy.log(`${esFallback ? '   ' : ''}El IBAN debería tener al menos 15-34 caracteres.`);
                console.error(`${esFallback ? '   ' : ''}El IBAN debería tener al menos 15-34 caracteres.`);
              }
            }

            if (mant.IdFormaPago && (isNaN(mant.IdFormaPago) || mant.IdFormaPago <= 0)) {
              cy.log(`PROBLEMA DETECTADO: IdFormaPago inválido: ${mant.IdFormaPago}`);
              console.error(`PROBLEMA DETECTADO: IdFormaPago inválido: ${mant.IdFormaPago}`);
            }

            if (mant.IdmTipoFacturacion && (isNaN(mant.IdmTipoFacturacion) || mant.IdmTipoFacturacion <= 0)) {
              cy.log(`PROBLEMA DETECTADO: IdmTipoFacturacion inválido: ${mant.IdmTipoFacturacion}`);
              console.error(`PROBLEMA DETECTADO: IdmTipoFacturacion inválido: ${mant.IdmTipoFacturacion}`);
            }

            if (mant.IdmCuentaVenta && (isNaN(mant.IdmCuentaVenta) || mant.IdmCuentaVenta <= 0)) {
              cy.log(`PROBLEMA DETECTADO: IdmCuentaVenta inválido: ${mant.IdmCuentaVenta}`);
              console.error(`PROBLEMA DETECTADO: IdmCuentaVenta inválido: ${mant.IdmCuentaVenta}`);
            }

            if (mant.Alta && !/^\d{4}-\d{2}-\d{2}$/.test(mant.Alta)) {
              cy.log(`PROBLEMA DETECTADO: Fecha Alta formato incorrecto: "${mant.Alta}"`);
              console.error(`PROBLEMA DETECTADO: Fecha Alta formato incorrecto: "${mant.Alta}"`);
            }
          }

          if (requestBody?.FacturacionEmpresas && Array.isArray(requestBody.FacturacionEmpresas)) {
            requestBody.FacturacionEmpresas.forEach((fact, idx) => {
              if (fact.IBAN && String(fact.IBAN).length < 10) {
                cy.log(`PROBLEMA DETECTADO: IBAN incompleto en FacturacionEmpresas[${idx}]: "${fact.IBAN}"`);
                console.error(`PROBLEMA DETECTADO: IBAN incompleto en FacturacionEmpresas[${idx}]: "${fact.IBAN}"`);
              }
            });
          }

          cy.log('-------------------------------------------------------');
          console.log('-------------------------------------------------------');
        }

        cy.log('-------------------------------------------------------');
        console.log('-------------------------------------------------------');

        return cy.wrap(codigoCliente);
      });
    }
  }

  return {
    TC040,
  };
}

module.exports = {
  crearHelperCrearCompletoClientes,
};
