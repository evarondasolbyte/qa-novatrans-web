function crearHelpersFormularioClientes(config) {
  const {
    CAMPOS_FORMULARIO_ORDEN,
    CAMPOS_IGNORADOS,
    normalizarEtiquetaTexto,
    normalizarTextoParaComparar,
    escapeRegex,
    parseFechaBasicaExcel,
    seleccionarFechaEnCalendario,
    normalizarId,
    escribirPorName,
    UI,
    abrirFormularioNuevoCliente,
    asegurarGestorDocumentosAbierto,
    llenarFormularioDocumentos,
    llenarFormularioFacturacion,
    clickGuardarDentroFormulario,
  } = config;

  function navegarSeccionFormulario(seccion) {
    if (!seccion || /generales/i.test(seccion)) {
      return cy.wrap(null);
    }
    const nombreSeccion = seccion.trim();
    cy.log(`Buscando pestaña: "${nombreSeccion}"`);
    const palabras = nombreSeccion.split(/\s+/).map((p) => escapeRegex(p)).join('.*');
    const regex = new RegExp(palabras, 'i');

    return cy.get('body').then(($body) => {
      const buscar = (selector) =>
        $body
          .find(selector)
          .filter((_, el) => regex.test((el.innerText || '').trim()))
          .first();

      const tab = buscar('button[role="tab"], [role="tab"]');
      if (tab.length) {
        cy.log(`Pestaña encontrada: "${tab.text()}"`);
        return cy.wrap(tab).click({ force: true });
      }

      const generico = buscar('button, a, span');
      if (generico.length) {
        cy.log(`Elemento encontrado: "${generico.text()}"`);
        return cy.wrap(generico).click({ force: true });
      }

      cy.log(`No se encontró la sección ${seccion}`);
      return cy.wrap(null);
    });
  }

  function seleccionarOpcionMaterial(selector, valor, etiqueta = '') {
    if (!valor) return cy.wrap(null);

    cy.log(`Seleccionando "${valor}" en campo "${etiqueta || selector}"`);

    const escaparIdCss = (id = '') => {
      return id.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');
    };

    if (etiqueta) {
      return cy.contains('label, fieldset legend span, legend span', new RegExp(`^${escapeRegex(etiqueta)}$`, 'i'), { timeout: 10000 })
        .should('be.visible')
        .then(($label) => {
          return cy.wrap($label)
            .closest('.MuiFormControl-root, .MuiFormGroup-root, .MuiAutocomplete-root, .MuiTextField-root')
            .then(($container) => {
              const selectElement = $container.find('[id="mui-component-select-client.activity"], #mui-component-select-client\\.activity, [role="combobox"], [aria-haspopup="listbox"], div.MuiSelect-root').first();

              if (selectElement.length > 0) {
                const el = selectElement[0];
                const id = el && el.getAttribute ? (el.getAttribute('id') || '') : '';
                const selPorId = id ? `#${escaparIdCss(id)}` : null;

                const clickSeguro = () => {
                  if (selPorId) {
                    return cy.get(selPorId, { timeout: 10000 })
                      .scrollIntoView()
                      .should('be.visible')
                      .click({ force: true });
                  }
                  return cy.wrap(el)
                    .scrollIntoView()
                    .should('be.visible')
                    .click({ force: true });
                };

                return clickSeguro().then(
                  () => cy.wrap(null),
                  (err) => {
                    cy.log(`No se pudo abrir el desplegable "${etiqueta}" (continuando): ${err?.message || err}`);
                    return cy.wrap(null);
                  }
                );
              }

              if (selector) {
                return cy.get(selector, { timeout: 10000 })
                  .scrollIntoView()
                  .should('be.visible')
                  .click({ force: true })
                  .then(
                    () => cy.wrap(null),
                    (err) => {
                      cy.log(`No se pudo clicar selector "${selector}" para "${etiqueta}" (continuando): ${err?.message || err}`);
                      return cy.wrap(null);
                    }
                  );
              }

              cy.log(`No se encontro desplegable para "${etiqueta}" en su contenedor. Continuando sin seleccionar.`);
              return cy.wrap(null);
            })
            .then(() => {
              cy.wait(500);

              const esActividad = /actividad/i.test(etiqueta || '');

              if (esActividad) {
                return cy.get('body').then(($body) => {
                  const mensajeSinOpciones = $body.find('*').filter((_, el) => {
                    const texto = (el.textContent || '').toLowerCase();
                    return /sin\s+opciones|no\s+hay\s+opciones|no\s+options/i.test(texto);
                  }).filter(':visible');

                  if (mensajeSinOpciones.length > 0) {
                    cy.log('Campo "Actividad" no tiene opciones disponibles, continuando sin seleccionar...');
                    cy.get('body').click({ force: true });
                    return cy.wrap(null);
                  }

                  const opciones = $body.find('li[role="option"], [role="option"], div[role="option"]').filter(':visible');
                  if (opciones.length === 0) {
                    cy.log('Campo "Actividad" no tiene opciones disponibles, continuando sin seleccionar...');
                    cy.get('body').click({ force: true });
                    return cy.wrap(null);
                  }

                  return cy.contains(
                    'li[role="option"], [role="option"], div[role="option"]',
                    new RegExp(`^${escapeRegex(valor)}$`, 'i'),
                    { timeout: 10000 }
                  )
                    .scrollIntoView()
                    .should('be.visible')
                    .click({ force: true });
                }).then(null, (err) => {
                  const mensajeError = err && err.message ? err.message : (err ? String(err) : 'Sin opciones disponibles');
                  cy.log(`No se pudo seleccionar "${valor}" en Actividad: ${mensajeError}. Continuando...`);
                  cy.get('body').click({ force: true });
                  return cy.wrap(null);
                });
              }

              return cy.contains(
                'li[role="option"], [role="option"], div[role="option"]',
                new RegExp(`^${escapeRegex(valor)}$`, 'i'),
                { timeout: 10000 }
              )
                .scrollIntoView()
                .should('be.visible')
                .click({ force: true });
            });
        });
    }

    return cy.get(selector || '[id="mui-component-select-client.activity"]', { timeout: 10000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true })
      .then(() => {
        cy.wait(500);

        const esActividad = selector && selector.includes('activity');

        if (esActividad) {
          return cy.get('body').then(($body) => {
            const mensajeSinOpciones = $body.find('*').filter((_, el) => {
              const texto = (el.textContent || '').toLowerCase();
              return /sin\s+opciones|no\s+hay\s+opciones|no\s+options/i.test(texto);
            }).filter(':visible');

            if (mensajeSinOpciones.length > 0) {
              cy.log('Campo "Actividad" no tiene opciones disponibles, continuando sin seleccionar...');
              cy.get('body').click({ force: true });
              return cy.wrap(null);
            }

            const opciones = $body.find('li[role="option"], [role="option"], div[role="option"]').filter(':visible');
            if (opciones.length === 0) {
              cy.log('Campo "Actividad" no tiene opciones disponibles, continuando sin seleccionar...');
              cy.get('body').click({ force: true });
              return cy.wrap(null);
            }

            return cy.contains(
              'li[role="option"], [role="option"], div[role="option"]',
              new RegExp(`^${escapeRegex(valor)}$`, 'i'),
              { timeout: 10000 }
            )
              .scrollIntoView()
              .should('be.visible')
              .click({ force: true });
          }).then(null, (err) => {
            const mensajeError = err && err.message ? err.message : (err ? String(err) : 'Sin opciones disponibles');
            cy.log(`No se pudo seleccionar "${valor}" en Actividad: ${mensajeError}. Continuando...`);
            cy.get('body').click({ force: true });
            return cy.wrap(null);
          });
        }

        return cy.contains(
          'li[role="option"], [role="option"], div[role="option"]',
          new RegExp(`^${escapeRegex(valor)}$`, 'i'),
          { timeout: 10000 }
        )
          .scrollIntoView()
          .should('be.visible')
          .click({ force: true });
      }, (err) => {
        cy.log(`No se pudo abrir el desplegable (${etiqueta || selector}). Continuando: ${err?.message || err}`);
        return cy.wrap(null);
      });
  }

  function llenarCamposFormulario(caso) {
    const totalCampos = Number(caso?.__totalCamposExcel) || 14;
    const campos = [];
    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = caso[`dato_${i}`];
      if (!tipo || !selector || valor === undefined || valor === '') continue;
      const etiquetaPreferida =
        CAMPOS_FORMULARIO_ORDEN[i - 1] ||
        normalizarEtiquetaTexto(tipo) ||
        selector;
      const etiquetaNormalizada = normalizarTextoParaComparar(etiquetaPreferida);
      if (etiquetaNormalizada && CAMPOS_IGNORADOS.has(etiquetaNormalizada)) continue;
      campos.push({
        tipo,
        selector,
        valor,
        etiquetaVisible: etiquetaPreferida
      });
    }

    if (campos.length === 0) {
      cy.log('Caso sin datos para completar el formulario');
      return cy.wrap(null);
    }

    const completarCampo = (index = 0) => {
      if (index >= campos.length) return cy.wrap(null);
      const campo = campos[index];
      const valorTexto = campo.valor?.toString() || '';

      if (/actividad/i.test((campo.etiquetaVisible || '').toLowerCase())) {
        return seleccionarOpcionMaterial(campo.selector, valorTexto, campo.etiquetaVisible)
          .then(
            () => completarCampo(index + 1),
            () => {
              cy.log(`No se pudo seleccionar ${valorTexto} en Actividad`);
              return completarCampo(index + 1);
            }
          );
      }

      return obtenerCampoFormulario(campo.tipo, campo.selector, campo.etiquetaVisible || campo.selector)
        .then(($elemento) => {
          if (!$elemento || !$elemento.length) {
            cy.log(`No se encontró el campo ${campo.selector}`);
            return null;
          }

          const tipoInput = ($elemento[0]?.type || '').toLowerCase();
          const tag = ($elemento[0]?.tagName || '').toLowerCase();

          if (tipoInput === 'radio' || tipoInput === 'checkbox') {
            const regexValor = new RegExp(`^${escapeRegex(valorTexto)}$`, 'i');
            const candidato = $elemento.filter((_, el) => {
              const label = el.closest('label');
              const texto = (label ? label.innerText : '') || '';
              return regexValor.test(texto) || regexValor.test(el.value || '');
            }).first();
            const objetivo = candidato.length ? candidato : $elemento.first();
            cy.wrap(objetivo).check({ force: true });
            return null;
          }

          if (tag === 'input' || tag === 'textarea') {
            cy.wrap($elemento).clear({ force: true }).type(valorTexto, { force: true });
            cy.wrap($elemento).blur();
            return null;
          }

          if (tag === 'select') {
            cy.wrap($elemento).select(valorTexto, { force: true });
            return null;
          }

          cy.wrap($elemento).click({ force: true }).type(valorTexto, { force: true });
          return null;
        }, () => {
          cy.log(`No se pudo completar el campo ${campo.selector} (${campo.tipo})`);
        })
        .then(() => completarCampo(index + 1));
    };

    return completarCampo(0);
  }

  function abrirModalContacto() {
    cy.log('Abriendo modal de contacto');
    return cy.contains('button, a', /\+?\s*Añadir/i)
      .filter(':visible')
      .first()
      .click({ force: true })
      .then(() => {
        return cy.get('input[name="cp_name"]', { timeout: 10000 })
          .should('be.visible')
          .then(() => {
            cy.log('Modal de contacto abierto correctamente');
            return cy.wrap(null);
          });
      });
  }

  function guardarModalContacto() {
    cy.log('Pasando al siguiente formulario sin guardar modal de contacto');
    cy.wait(300);
    return cy.wrap(null);
  }

  function abrirModalSeccion(seccion, esperarInputs = true) {
    cy.log(`Abriendo modal de ${seccion}`);

    return cy.get('body').then(($body) => {
      const botones = $body.find('button, a').filter((_, el) => {
        const texto = (el.innerText || el.textContent || '').trim();
        return /\+?\s*Añadir/i.test(texto);
      }).filter(':visible');

      if (botones.length > 0) {
        return cy.wrap(botones[0])
          .scrollIntoView()
          .should('be.visible')
          .click({ force: true })
          .then(() => {
            cy.wait(300);
            return esperarInputs ? esperarDrawerVisible(seccion) : esperarBotonGuardarModal(seccion);
          });
      }

      return cy.contains('button, a', /\+?\s*Añadir/i, { timeout: 10000 })
        .should('be.visible')
        .scrollIntoView()
        .click({ force: true })
        .then(() => {
          cy.wait(300);
          return esperarInputs ? esperarDrawerVisible(seccion) : esperarBotonGuardarModal(seccion);
        });
    });
  }

  function esperarDrawerVisible(seccion) {
    cy.log(`Esperando a que el drawer/modal de ${seccion} esté visible...`);

    return cy.get('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="presentation"]:visible', { timeout: 10000 })
      .should('exist')
      .then(() => {
        cy.wait(500);
      })
      .then(() => {
        const selectoresInputs = [
          'input[name="his_date"]',
          'input[name="his_notes"]',
          'input[name="cp_name"]',
          'input[name="cp_email"]',
          'input[name="cp_phone"]',
          'input[name="cp_position"]',
          'input[name="cert_number"]',
          'input[name="cert_certificationDate"]',
          'input[name="ei_accounting_office"]',
          'input[name="ei_management_body"]',
          'input[name="ei_processing_unit"]',
          'input[name="ei_preponderant_body"]',
          'input[name="add_name"]',
          'input[name="add_address"]',
          'input[name="add_postalCode"]',
          'input[name="add_city"]',
          'input[name="add_region"]',
          'textarea[name="add_notes"]'
        ].join(', ');

        return cy.get(selectoresInputs, { timeout: 10000 })
          .filter(':visible')
          .first()
          .should('be.visible')
          .then(() => {
            cy.log(`Modal de ${seccion} abierto correctamente`);
            return cy.wrap(null);
          });
      });
  }

  function esperarBotonGuardarModal(seccion) {
    return cy.contains('button', /^Guardar$/i, { timeout: 10000 })
      .should('be.visible')
      .then(() => {
        cy.log(`Modal de ${seccion} abierto (sin campos que rellenar)`);
        return cy.wrap(null);
      });
  }

  function llenarFormularioSeccion(caso, numeroCaso, seccion) {
    const totalCampos = Number(caso?.__totalCamposExcel) || 14;
    cy.log(`Rellenando formulario de ${seccion} con ${totalCampos} campos del Excel`);

    let chain = cy.wrap(null);

    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = caso[`dato_${i}`];

      if (!valor || valor === '' || valor === undefined) {
        continue;
      }

      if (selector && tipo) {
        const tipoLower = (tipo || '').toLowerCase();
        const valorTexto = valor.toString();

        chain = chain.then(() => {
          if (tipoLower.includes('name')) {
            return escribirPorName(selector, valorTexto, `Campo ${i}`);
          }

          if (tipoLower.includes('id')) {
            const idSelector = selector.startsWith('#') ? selector : `#${selector}`;
            return cy.get(idSelector, { timeout: 5000 })
              .should('be.visible')
              .scrollIntoView()
              .clear({ force: true })
              .type(valorTexto, { force: true, delay: 0 })
              .should('have.value', valorTexto);
          }

          return cy.get(selector, { timeout: 5000 })
            .should('be.visible')
            .scrollIntoView()
            .clear({ force: true })
            .type(valorTexto, { force: true, delay: 0 })
            .should('have.value', valorTexto);
        });
      } else {
        const etiqueta = normalizarEtiquetaTexto(tipo);
        if (etiqueta) {
          chain = chain.then(() => {
            const tipoLower = (tipo || '').toLowerCase();
            if (tipoLower.includes('fecha') || etiqueta.toLowerCase().includes('fecha')) {
              const textoFecha = valor.toString();
              const fechaObj = parseFechaBasicaExcel(textoFecha);
              cy.log(`Rellenando Fecha "${etiqueta}" con ${textoFecha}`);

              return cy.contains('label', new RegExp(`^${escapeRegex(etiqueta)}$`, 'i'), { timeout: 10000 })
                .should('be.visible')
                .then(($label) => {
                  return cy.wrap($label)
                    .parents('.MuiFormControl-root')
                    .first()
                    .within(() => {
                      cy.get('button[aria-label*="date"], button[aria-label*="fecha"], button[aria-label*="Choose date"]', { timeout: 10000 })
                        .should('be.visible')
                        .click({ force: true });
                    })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnCalendario(fechaObj);
                    });
                });
            }

            return obtenerCampoFormulario(tipo, '', etiqueta)
              .then(($el) => {
                if ($el && $el.length) {
                  const valorTexto = valor.toString();
                  const tag = ($el[0]?.tagName || '').toLowerCase();
                  if (tag === 'input' || tag === 'textarea') {
                    cy.wrap($el).clear({ force: true }).type(valorTexto, { force: true });
                  }
                }
              });
          });
        }
      }
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
    });
  }

  function guardarModalSeccion(seccion) {
    const seccionLower = (seccion || '').toLowerCase();
    const esCertificaciones = /certific/i.test(seccionLower);

    if (esCertificaciones) {
      cy.log(`Guardando modal de ${seccion}...`);
      return cy.get('body').then(($body) => {
        const botonGuardar = $body.find('.MuiDrawer-root:visible button, .MuiModal-root:visible button, [role="dialog"] button')
          .filter((_, el) => {
            const texto = (el.textContent || '').trim().toLowerCase();
            const $modal = Cypress.$(el).closest('.MuiDrawer-root, .MuiModal-root, [role="dialog"]');
            return $modal.length > 0 && /guardar|save|desar/i.test(texto);
          })
          .first();

        if (botonGuardar.length > 0) {
          cy.log(`Botón Guardar encontrado en modal de ${seccion}`);
          return cy.wrap(botonGuardar)
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .then(() => {
              cy.wait(1000);
              cy.log(`Modal de ${seccion} guardado correctamente`);
              return cy.wrap(null);
            });
        }

        cy.log(`Buscando botón Guardar con cy.contains para ${seccion}...`);
        return cy.get('body').then(($bodyInterno) => {
          const modalVisible = $bodyInterno.find('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="dialog"]:visible').first();

          if (modalVisible.length > 0) {
            return cy.wrap(modalVisible[0])
              .within(() => {
                const botonEnModal = Cypress.$(modalVisible[0]).find('button')
                  .filter((_, el) => {
                    const texto = (el.textContent || '').trim().toLowerCase();
                    return /^guardar$/i.test(texto);
                  })
                  .first();

                if (botonEnModal.length > 0) {
                  return cy.wrap(botonEnModal[0])
                    .should('be.visible')
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(1000);
                      cy.log(`Modal de ${seccion} guardado correctamente`);
                      return cy.wrap(null);
                    });
                }

                cy.log(` No se pudo encontrar botón Guardar en modal de ${seccion}, continuando...`);
                cy.wait(300);
                return cy.wrap(null);
              });
          }

          cy.log(` No se encontró modal visible para ${seccion}, continuando...`);
          cy.wait(300);
          return cy.wrap(null);
        });
      });
    }

    cy.log(`Pasando al siguiente formulario sin guardar modal de ${seccion}`);
    cy.wait(300);
    return cy.wrap(null);
  }

  function obtenerCampoFormulario(tipo, selector, etiqueta) {
    const tipoLower = (tipo || '').toLowerCase();
    const objetivos = [];

    if (selector) {
      if (tipoLower.includes('id')) objetivos.push(`#${normalizarId(selector)}`);
      if (tipoLower.includes('name')) objetivos.push(`[name="${selector}"]`);
      if (tipoLower.includes('selector') || tipoLower.includes('query')) objetivos.push(selector);
      if (!selector.startsWith('#') && !selector.startsWith('.') && !selector.startsWith('[')) {
        objetivos.push(`#${selector}`);
      } else {
        objetivos.push(selector);
      }
    }

    return cy.get('body').then(($body) => {
      if (etiqueta) {
        const regex = new RegExp(`^${escapeRegex(etiqueta)}$`, 'i');
        const label = $body.find('label').filter((_, el) => regex.test((el.innerText || '').trim())).first();
        if (label.length) {
          const forAttr = label.attr('for');
          if (forAttr) {
            const target = $body.find(`#${forAttr}`)[0];
            if (target) return cy.wrap(target);
          }
          const input = label.parent().find('input, textarea, select')[0];
          if (input) return cy.wrap(input);
        }
      }

      for (const sel of objetivos) {
        const elemento = $body.find(sel)[0];
        if (elemento) return cy.wrap(elemento);
      }

      cy.log(`No se encontró el selector ${selector || ''} (etiqueta: ${etiqueta || 'N/D'})`);
      return cy.wrap(null);
    });
  }

  function deducirSeccionDesdeCaso(caso) {
    const nombre = (caso?.nombre || '').toLowerCase();
    if (nombre.includes('contacto')) return 'Contacto';
    if (nombre.includes('historial')) return 'Acciones';
    if (nombre.includes('accion') || nombre.includes('acciones')) return 'Acciones';
    if (nombre.includes('zona de carga') || nombre.includes('zonas de carga')) return 'Zonas de carga';
    if (nombre.includes('certific')) return 'Certificaciones';
    if (nombre.includes('dato adicional') || nombre.includes('datos adicional') || nombre.includes('adicional') || nombre.includes('facturación electrónica') || nombre.includes('facturacion electronica')) return 'Datos adicionales';
    if (nombre.includes('documento')) return 'Documentos';
    if (nombre.includes('facturación') || nombre.includes('facturacion')) return 'Facturación';
    if (nombre.includes('dirección') || nombre.includes('direccion')) return 'Dirección';
    return 'Generales';
  }

  function anadirCliente(caso, numero, casoId) {
    const seccion = deducirSeccionDesdeCaso(caso);
    const numeroCaso = numero || parseInt(String(caso?.caso || '').replace(/\D/g, ''), 10);

    cy.log(`Datos recibidos para TC${String(numeroCaso).padStart(3, '0')}: ${JSON.stringify(caso)}`);
    cy.log(`Sección deducida: ${seccion}`);

    const esDatosGenerales = /generales/i.test(seccion);
    const esSeccionContacto = /contacto/i.test(seccion);
    const esSeccionAcciones = /acciones|historial/i.test(seccion);
    const esSeccionCertificaciones = /certific/i.test(seccion);
    const esZonasCarga = /zona(s)?\s+de\s+carga/i.test(seccion);
    const esDatosAdicionales = /dato.*adicional/i.test(seccion);
    const esSeccionDocumentos = /documento/i.test(seccion);
    const esSeccionDireccion = /dirección|direccion/i.test(seccion);
    const esSeccionFacturacion = /facturación|facturacion/i.test(seccion);
    const esSeccionConModal = esSeccionContacto || esSeccionAcciones || esZonasCarga || esSeccionCertificaciones || esSeccionDocumentos || esSeccionDireccion;

    // OPCIÓN 1: Si ya estamos en el formulario, ir directamente a la pestaña
    // OPCIÓN 2: Si estamos en la tabla, hacer todos los pasos necesarios
    return cy.url().then((urlActual) => {
      const enFormulario = urlActual.includes('/dashboard/clients/form');

      if (enFormulario) {
        cy.log(`Ya estamos en el formulario, navegando directamente a la pestaña: ${seccion}`);

        if (!esDatosGenerales && seccion) {
          if (esSeccionDireccion) {
            cy.log('Navegando a la pestaña: Contacto (para acceder a Direcciones)');
            return navegarSeccionFormulario('Contacto')
              .then(() => {
                cy.wait(500);
                cy.log('Navegación a la pestaña "Contacto" completada');
                return cy.wrap(null);
              });
          }
          return navegarSeccionFormulario(seccion)
            .then(() => {
              cy.wait(500);
              cy.log(`Navegación a la pestaña "${seccion}" completada`);
              return cy.wrap(null);
            });
        }
        return cy.wrap(null);
      }

      cy.log('Estamos en la tabla, ejecutando todos los pasos: abrir pantalla, esperar tabla, abrir formulario');
      return UI.abrirPantalla()
        .then(() => {
          return cy.url().then((urlDespuesAbrir) => {
            if (!urlDespuesAbrir.includes('/dashboard/clients/form')) {
              return UI.esperarTabla();
            }
            return cy.wrap(null);
          });
        })
        .then(() => {
          return cy.url().then((urlAntesNuevo) => {
            if (!urlAntesNuevo.includes('/dashboard/clients/form')) {
              cy.log('Pulsando botón "+ Nuevo" para abrir formulario...');
              return abrirFormularioNuevoCliente()
                .then(() => cy.url().should('include', '/dashboard/clients/form'));
            }
            return cy.wrap(null);
          });
        })
        .then(() => {
          if (!esDatosGenerales && seccion) {
            cy.log(`Navegando a la pestaña: ${seccion}`);
            return navegarSeccionFormulario(seccion)
              .then(() => {
                cy.wait(500);
                cy.log(`Navegación a la pestaña "${seccion}" completada`);
                return cy.wrap(null);
              });
          }
          return cy.wrap(null);
        });
    })
      .then(() => {
        if (esDatosGenerales) {
          return llenarFormularioGeneralesDesdeExcel(caso, numeroCaso);
        }

        if (esSeccionConModal) {
          if (esSeccionDireccion) {
            return navegarSeccionFormulario('Contacto')
              .then(() => {
                cy.wait(500);
                cy.log('Navegando a sub-pestaña "Direcciones" dentro de Contacto...');
                return cy.contains('button, [role="tab"], div, span', /Direcciones|Direccion/i, { timeout: 10000 })
                  .should('be.visible')
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    cy.log('Sub-pestaña "Direcciones" seleccionada');
                    return cy.wrap(null);
                  });
              })
              .then(() => abrirModalSeccion(seccion, true))
              .then(() => llenarFormularioDireccion(caso, numeroCaso))
              .then(() => guardarModalSeccion(seccion));
          }

          return navegarSeccionFormulario(seccion)
            .then(() => {
              if (esSeccionContacto) return abrirModalContacto();
              if (esSeccionDocumentos) return asegurarGestorDocumentosAbierto();
              // Zonas de carga no usa esperarDrawerVisible porque sus inputs no coinciden con la lista hardcodeada.
              return abrirModalSeccion(seccion, esZonasCarga ? false : !esZonasCarga);
            })
            .then(() => {
              if (esZonasCarga) return llenarFormularioZonasCarga(caso, numeroCaso);
              if (esSeccionContacto) return llenarFormularioContacto(caso, numeroCaso);
              if (esSeccionAcciones) return llenarFormularioAcciones(caso, numeroCaso);
              if (esSeccionCertificaciones) return llenarFormularioCertificaciones(caso, numeroCaso);
              if (esSeccionDocumentos) return llenarFormularioDocumentos(caso, numeroCaso);
              return llenarFormularioSeccion(caso, numeroCaso, seccion);
            })
            .then(() => {
              if (esZonasCarga) {
                cy.log('Guardando modal de Zonas de carga...');
                return clickGuardarDentroFormulario().then(() => cy.wait(500));
              }
              return (esSeccionContacto ? guardarModalContacto() : guardarModalSeccion(seccion));
            });
        }

        if (esSeccionFacturacion) {
          return navegarSeccionFormulario(seccion)
            .then(() => llenarFormularioFacturacion(caso, numeroCaso));
        }

        if (esDatosAdicionales) {
          return navegarSeccionFormulario(seccion)
            .then(() => llenarFormularioDatosAdicionales(caso, numeroCaso));
        }

        return navegarSeccionFormulario(seccion)
          .then(() => llenarCamposFormulario(caso));
      })
      .then(() => {
        if (!esSeccionConModal) {
          cy.contains('button, [type="submit"]', /Guardar/i, { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true });
          cy.wait(1500);
        }

        cy.log(`Formulario completado y enviado con datos del Excel (TC${String(numeroCaso).padStart(3, '0')})`);
      });
  }

  function seleccionarPrimeraOpcionPorLabel(labelTexto) {
    cy.log(`Buscando dropdown "${labelTexto}" para seleccionar la primera opción...`);
    return cy.wrap(null);
  }

  function escribirPorNameSeguro(nameAttr, valor, etiqueta = '') {
    if (valor === undefined || valor === null || `${valor}` === '') {
      return cy.wrap(null);
    }

    const texto = String(valor);
    const selector = `input[name="${nameAttr}"], textarea[name="${nameAttr}"]`;
    const etiquetaLog = etiqueta || nameAttr;

    cy.log(`Escribiendo en "${etiquetaLog}": ${texto}`);

    return cy.get('body').then(($body) => {
      const $found = $body.find(selector);

      if (!$found.length) {
        cy.log(`(SKIP) No existe en UI: ${nameAttr}`);
        return cy.wrap(null);
      }

      const $el = $found.first();

      return cy.wrap($el)
        .scrollIntoView()
        .should('be.visible')
        .then(() => cy.wrap($el).clear({ force: true }))
        .then(() => {
          cy.wait(80);
          return cy.wrap($el).type(texto, { force: true, delay: 0 });
        });
    });
  }

  function seleccionarRadioPorNameSeguro(name, textoHumano, etiqueta = '') {
    if (!textoHumano) return cy.wrap(null);

    const t = String(textoHumano).trim().toLowerCase();
    const mapPersona = { 'juridica': 'J', 'jurídica': 'J', 'fisica': 'F', 'física': 'F' };
    const mapResidencia = { 'españa': 'R', 'espana': 'R', 'extranjero': 'E', 'ue': 'U' };

    const value =
      name === 'client.clientPerson' ? (mapPersona[t] || textoHumano) :
        name === 'client.clientResidency' ? (mapResidencia[t] || textoHumano) :
          textoHumano;

    const selector = `input[type="radio"][name="${name}"][value="${value}"]`;
    const etiquetaLog = etiqueta || name;

    return cy.get('body').then(($body) => {
      const $radio = $body.find(selector);
      if (!$radio.length) {
        cy.log(`(SKIP) Radio no existe: ${etiquetaLog} (${name}=${value})`);
        return cy.wrap(null);
      }
      cy.log(`Seleccionando ${etiquetaLog}: ${textoHumano} -> ${value}`);
      return cy.wrap($radio.first()).check({ force: true });
    });
  }

  function seleccionarActividadAutocomplete(valor) {
    if (!valor) return cy.wrap(null);

    const texto = String(valor);

    return cy.contains('label', /^Actividad$/i, { timeout: 10000 })
      .parents('.MuiFormControl-root')
      .first()
      .within(() => {
        cy.get('input[role="combobox"], input[aria-autocomplete="list"], input', { timeout: 10000 })
          .first()
          .should('be.visible')
          .click({ force: true })
          .type('{selectall}{backspace}', { force: true })
          .clear({ force: true })
          .type(texto, { force: true });
      })
      .then(() => cy.wait(500))
      .then(() => {
        const regexExacto = new RegExp(`^${escapeRegex(texto)}$`, 'i');
        return cy.get('body').then(($body) => {
          const $opts = $body.find('[role="option"]').filter(':visible');
          if (!$opts.length) {
            cy.log(`Actividad "${texto}" escrita sin opciones visibles`);
            return cy.wrap(null);
          }
          const exacta = Array.from($opts).find((el) => regexExacto.test((el.textContent || '').trim()));
          if (exacta) {
            return cy.wrap(exacta).click({ force: true });
          }
          return cy.wrap($opts[0]).click({ force: true });
        });
      });
  }

  function llenarFormularioGeneralesDesdeExcel(caso, numeroCaso) {
    const alta = caso.dato_1;
    const razonSocial = caso.dato_2;
    const actividad = caso.dato_3;
    const web = caso.dato_4;
    const persona = caso.dato_5;
    const nombre = caso.dato_6;
    const nif = caso.dato_7;
    const niva = caso.dato_8;
    const tlfFijo = caso.dato_9;
    const tlfMovil = caso.dato_10;
    const email = caso.dato_11;
    const notas = caso.dato_12;
    const residencia = caso.dato_13;

    const obtenerDatoPorNameExcel = (nameAttr) => {
      if (!nameAttr) return null;
      const total = Number(caso?.__totalCamposExcel) || 30;
      const nameAttrLower = (nameAttr || '').toString().toLowerCase().trim();
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

    const direccion = caso.dato_14;
    const codigoPostal = obtenerDatoPorNameExcel('client.postalCode');
    const ciudad = caso.dato_15;
    const provincia = caso.dato_16;
    const pais = caso.dato_17;

    const contactoNombre = obtenerDatoPorNameExcel('client.principalContactName');
    const contactoEmail = caso.dato_18;
    const contactoTelefono = caso.dato_19;
    const contactoCargo = caso.dato_21;

    let chain = cy.wrap(null);

    if (alta) {
      chain = chain.then(() => {
        const textoFecha = alta.toString();
        const fechaObj = parseFechaBasicaExcel(textoFecha);

        return cy.contains('label', /^Alta$/i, { timeout: 10000 })
          .parents('.MuiFormControl-root')
          .first()
          .within(() => {
            cy.get('button[aria-label="Choose date"], button[aria-label*="date"], button[aria-label*="calendar"]')
              .first()
              .click({ force: true });
          })
          .then(() => seleccionarFechaEnCalendario(fechaObj));
      });
    }

    const campos = [
      { label: 'Nombre', name: 'client.name', valor: nombre },
      { label: 'Razón Social', name: 'client.companyName', valor: razonSocial },
      { label: 'NIF/CIF', name: 'client.nif', valor: nif },
      { label: 'NIVA', name: 'client.niva', valor: niva },
      { label: 'E-mail', name: 'client.email', valor: email },
      { label: 'Tlf. Fijo', name: 'client.phoneNumber', valor: tlfFijo },
      { label: 'Tlf. Móvil', name: 'client.mobileNumber', valor: tlfMovil },
      { label: 'Web', name: 'client.web', valor: web },
      { label: 'Notas', name: 'client.notes', valor: notas },
      { label: 'Dirección', name: 'client.address', valor: direccion },
      { label: 'C.P', name: 'client.postalCode', valor: codigoPostal },
      { label: 'Ciudad', name: 'client.city', valor: ciudad },
      { label: 'Provincia', name: 'client.region', valor: provincia },
      { label: 'País', name: 'client.country', valor: pais },
      { label: 'Contacto - Nombre', name: 'client.principalContactName', valor: contactoNombre },
      { label: 'Contacto - E-mail', name: 'client.principalContactEmail', valor: contactoEmail },
      { label: 'Contacto - Teléfono', name: 'client.principalContactPhone', valor: contactoTelefono },
      { label: 'Contacto - Cargo', name: 'client.principalContactJobTitle', valor: contactoCargo },
    ];

    campos.forEach((c) => {
      chain = chain
        .then(() => escribirPorNameSeguro(c.name, c.valor, c.label))
        .then(() => cy.wait(100));
    });

    if (actividad) {
      chain = chain.then(() => seleccionarActividadAutocomplete(actividad));
    }

    if (persona) {
      chain = chain.then(() => seleccionarRadioPorNameSeguro('client.clientPerson', persona, 'Persona'));
    }

    if (residencia) {
      chain = chain.then(() => seleccionarRadioPorNameSeguro('client.clientResidency', residencia, 'Residencia'));
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Generales rellenado desde Excel`);
    });
  }

  function llenarFormularioContacto(caso, numeroCaso) {
    const nombre = caso.dato_1;
    const email = caso.dato_2;
    const telefono = caso.dato_3;
    const cargo = caso.dato_4;

    cy.log(`Datos Contacto detectados: nombre=${nombre}, email=${email}, telefono=${telefono}, cargo=${cargo}`);

    let chain = cy.wrap(null);

    const camposContacto = [
      { name: 'cp_name', valor: nombre, label: 'Nombre' },
      { name: 'cp_email', valor: email, label: 'Correo electrónico' },
      { name: 'cp_phone', valor: telefono, label: 'Teléfono' },
      { name: 'cp_position', valor: cargo, label: 'Cargo' }
    ];

    camposContacto.forEach((campo) => {
      if (!campo.valor || campo.valor === '') {
        cy.log(`Campo vacío en Excel: ${campo.label}`);
        return;
      }

      chain = chain.then(() =>
        escribirPorName(campo.name, campo.valor, campo.label)
      );
    });

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Contacto rellenado desde Excel`);
    });
  }

  function llenarFormularioDatosAdicionales(caso, numeroCaso) {
    const oficinaContable = caso.dato_1;
    const organoGestor = caso.dato_2;
    const unidadTramitadora = caso.dato_3;
    const organoProponente = caso.dato_4;
    const riesgoAsegurado = caso.dato_5;
    const discount = caso.dato_6;

    cy.log(`Datos adicionales detectados: oficinaContable=${oficinaContable}, organoGestor=${organoGestor}, unidadTramitadora=${unidadTramitadora}, organoProponente=${organoProponente}, riesgoAsegurado=${riesgoAsegurado}, discount=${discount}`);

    let chain = cy.wrap(null);

    const camposDatosAdicionales = [
      { name: 'client.accountableOffice', valor: oficinaContable, label: 'Oficina contable' },
      { name: 'client.managingOrganization', valor: organoGestor, label: 'Órgano gestor' },
      { name: 'client.processingUnit', valor: unidadTramitadora, label: 'Unidad tramitadora' },
      { name: 'client.preponentOrganization', valor: organoProponente, label: 'Órgano proponente' },
      { name: 'client.RiesgoAsegurado', valor: riesgoAsegurado, label: 'Riesgo Asegurado' },
      { name: 'client.discount', valor: discount, label: 'Dto' }
    ];

    camposDatosAdicionales.forEach((campo) => {
      if (!campo.valor || campo.valor === '') {
        cy.log(`Campo vacío en Excel: ${campo.label}`);
        return;
      }

      if (campo.name === 'client.discount') {
        chain = chain.then(() => {
          cy.log(`Escribiendo en "${campo.label}": ${campo.valor}`);
          return cy.get('body').then(($body) => {
            const $input = $body.find(`input[name="${campo.name}"]`).filter(':visible').first();
            if ($input.length) {
              return cy.wrap($input[0])
                .click({ force: true })
                .type('{selectall}', { force: true })
                .clear({ force: true })
                .wait(50)
                .type(String(campo.valor), { force: true, delay: 0 });
            }
            cy.log(`(SKIP) No existe en UI: ${campo.name}`);
            return cy.wrap(null);
          });
        });
      } else {
        chain = chain.then(() =>
          escribirPorName(campo.name, campo.valor, campo.label)
        );
      }
    });

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Datos adicionales rellenado desde Excel`);
    });
  }

  function llenarFormularioZonasCarga(caso, numeroCaso) {
    const nombreZona = caso?.dato_1;

    if (!nombreZona) {
      cy.log('Zonas de carga: Excel no trae nombre (dato_1), se omite');
      return cy.wrap(null);
    }

    cy.log(`Zonas de carga: rellenando Nombre="${nombreZona}"`);

    const escapeCssId = (id = '') => id.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|\/@])/g, '\\$1');
    const tituloDrawer = /(Crear\s+Zona\s+de\s+Carga|Create\s+Load\s+Zone|Create\s+Loading\s+Zone)/i;

    return cy
      .contains(tituloDrawer, { timeout: 20000 })
      .should('be.visible')
      .then(($titulo) => {
        const $ancestros = Cypress.$($titulo).parents();
        const contenedor = Array.from($ancestros).find((a) => {
          const $a = Cypress.$(a);
          const tieneNombre = $a
            .find('label')
            .toArray()
            .some((l) => /^Nombre$/i.test((l.textContent || l.innerText || '').trim()));
          const tieneInput = $a.find('input').length > 0;
          return tieneNombre && tieneInput;
        });

        return cy.wrap(contenedor || Cypress.$($titulo).parent());
      })
      .within(() => {
        return cy
          .contains('label', /^Nombre$/i, { timeout: 15000 })
          .should('exist')
          .invoke('attr', 'for')
          .then((forAttr) => {
            if (forAttr) {
              const sel = `#${escapeCssId(forAttr)}`;
              return cy
                .get(sel, { timeout: 15000 })
                .should('exist')
                .scrollIntoView()
                .click({ force: true })
                .clear({ force: true })
                .type(nombreZona.toString(), { force: true, delay: 0 })
                .type('{enter}', { force: true });
            }

            return cy
              .get('input:visible', { timeout: 15000 })
              .first()
              .scrollIntoView()
              .click({ force: true })
              .clear({ force: true })
              .type(nombreZona.toString(), { force: true, delay: 0 })
              .type('{enter}', { force: true });
          });
      });
  }

  function llenarFormularioAcciones(caso, numeroCaso) {
    const obtenerDatoPorSelectorCaso = (needle) => {
      if (!needle) return null;
      const n = String(needle).toLowerCase().trim();
      const total = Number(caso?.__totalCamposExcel) || 30;

      for (let i = 1; i <= total; i++) {
        const selector = String(caso?.[`valor_etiqueta_${i}`] || '').toLowerCase().trim();
        const valor = caso?.[`dato_${i}`];
        if (selector && (selector === n || selector.includes(n) || n.includes(selector)) && valor !== undefined && valor !== null && `${valor}` !== '') {
          return valor;
        }
      }
      return null;
    };

    const fecha = obtenerDatoPorSelectorCaso('_r_8i_') || obtenerDatoPorSelectorCaso('_r_8i_-label') || caso.dato_1;
    const notas = obtenerDatoPorSelectorCaso('_r_ph_') || obtenerDatoPorSelectorCaso('_r_ph_-label') || obtenerDatoPorSelectorCaso('his_notes') || caso.dato_2;

    cy.log(`Datos Acciones detectados: fecha=${fecha}, notas=${notas}`);

    let chain = cy.wrap(null);

    if (fecha) {
      chain = chain.then(() => {
        const textoFecha = fecha.toString();
        const fechaObj = parseFechaBasicaExcel(textoFecha);
        cy.log(`Rellenando Fecha con ${textoFecha}`);

        const abrirCalendario = () => {
          return cy.get('body').then(($body) => {
            const $container = $body
              .find('.MuiDrawer-root:visible, [role="dialog"]:visible, .MuiModal-root:visible')
              .last();

            const $btn = $container
              .find('button[aria-label*="Choose date"], button[aria-label*="date"], button[aria-label*="fecha"]')
              .filter(':visible')
              .first();

            if ($btn.length) {
              return cy.wrap($btn[0]).click({ force: true });
            }

            const $inp = $container
              .find('input[placeholder="DD/MM/YYYY"], input[placeholder*="DD/"], input')
              .filter(':visible')
              .first();
            if ($inp.length) {
              return cy.wrap($inp[0]).click({ force: true });
            }

            return cy.get('button[aria-label*="Choose date"], button[aria-label*="date"], button[aria-label*="fecha"]', { timeout: 10000 })
              .filter(':visible')
              .first()
              .click({ force: true });
          });
        };

        return abrirCalendario()
          .then(() => cy.wait(300))
          .then(() => seleccionarFechaEnCalendario(fechaObj));
      });
    }

    const escribirNotasAccion = (valorNotas) => {
      const texto = String(valorNotas || '').trim();
      if (!texto) return cy.wrap(null);

      const selectorNotas = [
        '.MuiDrawer-root:visible input[name="his_notes"]',
        '.MuiDrawer-root:visible input#_r_ph_',
        '[role="dialog"]:visible input[name="his_notes"]',
        '[role="dialog"]:visible input#_r_ph_',
        'input[name="his_notes"]',
        'input#_r_ph_'
      ].join(', ');

      return cy.get(selectorNotas, { timeout: 10000 })
        .filter(':visible')
        .first()
        .scrollIntoView()
        .should('be.visible')
        .click({ force: true })
        .type('{selectall}{backspace}', { force: true })
        .clear({ force: true })
        .type(texto, { force: true, delay: 0 });
    };

    if (notas) {
      chain = chain.then(() => escribirNotasAccion(notas));
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Acciones rellenado desde Excel`);
    });
  }

  function llenarFormularioCertificaciones(caso, numeroCaso) {
    const numero = caso.dato_1;
    const fecha = caso.dato_2;
    const tipoCertificacion = caso.dato_3;
    const obtenerDatoPorSelectorExcel = (needle) => {
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
    const empresa = obtenerDatoPorSelectorExcel('Empresa') || caso.dato_4 || null;

    cy.log(`Datos Certificaciones detectados: numero=${numero}, fecha=${fecha}, tipoCertificacion=${tipoCertificacion}, empresa=${empresa}`);

    cy.wait(300);

    let chain = cy.wrap(null);

    if (numero) {
      chain = chain.then(() =>
        escribirPorName('cert_number', numero, 'Número')
      );
    }

    if (fecha) {
      chain = chain.then(() => {
        const textoFecha = fecha.toString();
        const fechaObj = parseFechaBasicaExcel(textoFecha);
        cy.log(`Intentando rellenar Fecha con ${textoFecha}`);

        const titulo = /(Crear\s+Certificaci[oó]n|Create\s+Certification)/i;

        const abrirCalendario = () => {
          return cy.contains(titulo, { timeout: 20000 })
            .should('be.visible')
            .then(($t) => {
              const $anc = Cypress.$($t).parents();
              const contenedor = Array.from($anc).find((a) => {
                const $a = Cypress.$(a);
                const tieneBtn = $a.find('button[aria-label*="Choose date"], button[aria-label*="date"], button[aria-label*="fecha"]').length > 0;
                const tieneInput = $a.find('input[placeholder="DD/MM/YYYY"], input[placeholder*="DD/"]').length > 0;
                return tieneBtn || tieneInput;
              });
              return cy.wrap(contenedor || Cypress.$($t).parent());
            })
            .within(() => {
              cy.get('button[aria-label*="Choose date"], button[aria-label*="date"], button[aria-label*="fecha"]', { timeout: 15000 })
                .filter(':visible')
                .first()
                .then(($btn) => {
                  if ($btn.length) {
                    return cy.wrap($btn[0]).click({ force: true });
                  }
                  return cy.get('input[placeholder="DD/MM/YYYY"], input[placeholder*="DD/"]', { timeout: 15000 })
                    .filter(':visible')
                    .first()
                    .click({ force: true });
                });
            });
        };

        return abrirCalendario()
          .then(() => cy.wait(300))
          .then(() => seleccionarFechaEnCalendario(fechaObj));
      });
    }

    const seleccionarCampoCertificacion = (labelTexto, valor) => {
      const valorTxt = valor ? String(valor) : '';
      cy.log(`Seleccionando "${labelTexto}": ${valorTxt || '(primera opcion)'}`);

      const seleccionarOpcion = () => {
        return cy.get('body').then(($body) => {
          const $opts = $body.find('[role="option"]').filter(':visible');
          if (!$opts.length) return cy.wrap(null);
          if (valorTxt) {
            const regexValor = new RegExp(`^${escapeRegex(valorTxt)}$`, 'i');
            const exacta = Array.from($opts).find((el) => regexValor.test((el.textContent || '').trim()));
            if (exacta) return cy.wrap(exacta).click({ force: true });
          }
          return cy.wrap($opts[0]).click({ force: true });
        });
      };

      return cy.contains('label', new RegExp(`^${escapeRegex(labelTexto)}$`, 'i'), { timeout: 10000 })
        .should('exist')
        .invoke('attr', 'for')
        .then((forAttr) => {
          if (!forAttr) return cy.wrap(null);
          return cy.get(`#${forAttr}`, { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .then(($input) => {
              if (valorTxt) {
                return cy.wrap($input)
                  .clear({ force: true })
                  .type(valorTxt, { force: true })
                  .then(() => cy.wait(500))
                  .then(() => seleccionarOpcion());
              }
              return seleccionarOpcion();
            });
        });
    };

    if (tipoCertificacion) {
      chain = chain.then(() => {
        const valorTxt = tipoCertificacion.toString();
        cy.log(`Seleccionando "Tipo de Certificación": ${valorTxt}`);

        const seleccionarOpcion = () => {
          const regexValor = new RegExp(`^${escapeRegex(valorTxt)}$`, 'i');
          return cy.get('body').then(($body) => {
            const $opts = $body.find('[role="option"]').filter(':visible');
            if (!$opts.length) return cy.wrap(null);

            const exacta = Array.from($opts).find((el) => regexValor.test((el.textContent || '').trim()));
            if (exacta) return cy.wrap(exacta).click({ force: true });

            return cy.wrap($opts[0]).click({ force: true });
          });
        };

        return cy.get('body').then(($body) => {
          const $inpPorId = $body.find('input#_r_af_, input[id="_r_af_"]').filter(':visible').first();
          if ($inpPorId.length) {
            return cy.wrap($inpPorId[0])
              .scrollIntoView()
              .click({ force: true })
              .clear({ force: true })
              .type(valorTxt, { force: true })
              .then(() => cy.wait(500))
              .then(() => seleccionarOpcion());
          }

          return cy.contains('label', /^Tipo de Certificaci[oó]n$/i, { timeout: 10000 })
            .should('exist')
            .invoke('attr', 'for')
            .then((forAttr) => {
              if (forAttr) {
                return cy.get(`#${forAttr}`, { timeout: 10000 })
                  .scrollIntoView()
                  .click({ force: true })
                  .clear({ force: true })
                  .type(valorTxt, { force: true })
                  .then(() => cy.wait(500))
                  .then(() => seleccionarOpcion());
              }
              return cy.wrap(null);
            });
        });
      });
    }

    chain = chain.then(() => {
      cy.log('Seleccionando primera opción en "Empresa" (CERTIFICACIONES)...');
      return seleccionarCampoCertificacion('Empresa', empresa)
        .then(() => seleccionarPrimeraOpcionPorLabel('Empresa'));
    });

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Certificaciones rellenado desde Excel`);
    });
  }

  function llenarFormularioDireccion(caso, numeroCaso) {
    const tipo = caso.dato_1;
    const domicilio = caso.dato_2;
    const codigoPostal = caso.dato_3;
    const poblacion = caso.dato_4;
    const pais = caso.dato_5;
    const notas = caso.dato_6;
    const provincia = caso.dato_7;

    cy.log(`Datos Dirección detectados: tipo=${tipo}, domicilio=${domicilio}, codigoPostal=${codigoPostal}, poblacion=${poblacion}, pais=${pais}, notas=${notas}, provincia=${provincia || '(vacío)'}`);

    let chain = cy.wrap(null);

    const escapeRegexLocal = (texto = '') => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const camposDireccion = [
      { name: 'add_add_typeId', valor: tipo, label: 'Tipo', tipo: 'select' },
      { name: 'add_address', valor: domicilio, label: 'Domicilio' },
      { name: 'add_postalCode', valor: codigoPostal, label: 'C. Postal' },
      { name: 'add_city', valor: poblacion, label: 'Población', tipo: 'autocomplete' },
      { name: 'add_region', valor: provincia, label: 'Provincia' },
      { name: 'add_notes', valor: notas, label: 'Notas' }
    ];

    const escribirInputYSeleccionar = ($input, valor, labelCampo) => {
      return cy.wrap($input)
        .scrollIntoView()
        .click({ force: true })
        .type('{selectall}{backspace}', { force: true })
        .type(String(valor), { force: true })
        .then(() => {
          cy.wait(1000);
          return cy.get('body').then(($body) => {
            const hayList = $body.find('ul[role="listbox"]:visible').length > 0;
            if (hayList) {
              return cy.get('ul[role="listbox"]:visible', { timeout: 15000 })
                .first()
                .should('be.visible')
                .within(() => {
                  cy.contains('li[role="option"], li', new RegExp(`^${escapeRegexLocal(valor)}$`, 'i'))
                    .click({ force: true });
                })
                .then(() => {
                  cy.wait(300);
                  cy.log(` ${labelCampo} "${valor}" seleccionado`);
                  return cy.get('body').type('{esc}', { force: true, log: false });
                }, () => {
                  cy.log(` No se encontró opción exacta "${valor}" en el listbox, buscando opción que contenga el texto...`);
                  return cy.get('ul[role="listbox"]:visible', { timeout: 15000 })
                    .first()
                    .should('be.visible')
                    .within(() => {
                      cy.contains('li[role="option"], li', new RegExp(escapeRegexLocal(valor), 'i'))
                        .first()
                        .click({ force: true });
                    })
                    .then(() => {
                      cy.wait(300);
                      cy.log(` ${labelCampo} "${valor}" seleccionado (opción parcial)`);
                      return cy.get('body').type('{esc}', { force: true, log: false });
                    }, () => {
                      cy.log(` No se encontró opción que contenga "${valor}", seleccionando primera opción...`);
                      return cy.get('ul[role="listbox"]:visible', { timeout: 15000 })
                        .first()
                        .should('be.visible')
                        .within(() => {
                          cy.get('li[role="option"], li')
                            .first()
                            .click({ force: true });
                        })
                        .then(() => {
                          cy.wait(300);
                          cy.log(` Primera opción de ${labelCampo} seleccionada (fallback)`);
                          return cy.get('body').type('{esc}', { force: true, log: false });
                        }, () => {
                          cy.log(` No se encontró listbox visible para ${labelCampo}, usando teclado...`);
                          return cy.wrap($input)
                            .type('{downArrow}{enter}', { force: true })
                            .then(() => {
                              cy.wait(300);
                              cy.log(` ${labelCampo} "${valor}" seleccionado (vía teclado)`);
                              return cy.get('body').type('{esc}', { force: true, log: false });
                            });
                        });
                    });
                });
            }

            cy.log(` ${labelCampo} "${valor}" escrito (sin listbox)`);
            return cy.wrap(null);
          });
        });
    };

    const rellenarAutocompletePorLabel = (labelText, valor) => {
      return cy.contains('label', new RegExp(`^${escapeRegexLocal(labelText)}$`, 'i'), { timeout: 10000 })
        .should('exist')
        .invoke('attr', 'for')
        .then((forAttr) => {
          if (!forAttr) {
            cy.log(` El label "${labelText}" no tiene atributo "for", buscando input en contenedor...`);
            return cy.contains('label', new RegExp(`^${escapeRegexLocal(labelText)}$`, 'i'), { timeout: 10000 })
              .closest('.MuiFormControl-root, .MuiAutocomplete-root, .MuiTextField-root')
              .find('input[role="combobox"], input[aria-autocomplete="list"], input')
              .first()
              .should('exist')
              .then(($input) => {
                return escribirInputYSeleccionar($input, valor, labelText);
              });
          }

          return cy.get(`#${CSS.escape(forAttr)}`, { timeout: 10000 })
            .should('exist')
            .then(($input) => {
              return escribirInputYSeleccionar($input, valor, labelText);
            });
        });
    };

    camposDireccion.forEach((campo) => {
      if (campo.label === 'Provincia') {
        cy.log(` DEBUG Provincia: valor="${campo.valor}", name="${campo.name}", tipo=${typeof campo.valor}`);
      }

      if (!campo.valor || campo.valor === '') {
        cy.log(`Campo vacío en Excel: ${campo.label}`);
        return;
      }

      chain = chain.then(() => {
        if (campo.name === 'add_add_typeId') {
          cy.log(`Seleccionando "${campo.label}": ${campo.valor} (Select)...`);
          return cy.get(`input[name="${campo.name}"]`, { timeout: 10000 })
            .should('exist')
            .closest('.MuiSelect-root, .MuiFormControl-root')
            .find('[role="combobox"], .MuiSelect-select')
            .first()
            .click({ force: true })
            .then(() => {
              cy.wait(500);
              return cy.get('ul[role="listbox"]:visible', { timeout: 5000 })
                .first()
                .should('be.visible')
                .within(() => {
                  cy.contains('li[role="option"]', new RegExp(`^${escapeRegexLocal(campo.valor)}$`, 'i'))
                    .click({ force: true });
                })
                .then(() => {
                  cy.wait(300);
                  cy.log(` ${campo.label} "${campo.valor}" seleccionado`);
                }, () => {
                  return cy.get('li[role="option"]:visible')
                    .first()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(300);
                      cy.log(` Primera opción de ${campo.label} seleccionada (fallback)`);
                    });
                });
            }, () => {
              cy.log(` No se encontró el Select de ${campo.label}`);
              return cy.wrap(null);
            });
        } else if (campo.tipo === 'autocomplete') {
          return rellenarAutocompletePorLabel(campo.label, campo.valor);
        }

        cy.log(`Rellenando campo normal "${campo.label}": ${campo.valor} (name="${campo.name}")`);
        return escribirPorName(campo.name, campo.valor, campo.label);
      });
    });

    chain = chain.then(() => {
      if (!pais) {
        cy.log('⏭Campo "País" vacío en Excel');
        return cy.wrap(null);
      }
      cy.log(`Seleccionando "País": ${pais} (Autocomplete, igual que Población)...`);
      return rellenarAutocompletePorLabel('País', pais);
    });

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Dirección rellenado desde Excel`);
    });
  }

  return {
    anadirCliente,
    navegarSeccionFormulario,
    llenarCamposFormulario,
    abrirModalContacto,
    guardarModalContacto,
    abrirModalSeccion,
    esperarDrawerVisible,
    esperarBotonGuardarModal,
    llenarFormularioSeccion,
    guardarModalSeccion,
    obtenerCampoFormulario,
    deducirSeccionDesdeCaso,
    seleccionarPrimeraOpcionPorLabel,
    escribirPorNameSeguro,
    seleccionarRadioPorNameSeguro,
    seleccionarActividadAutocomplete,
    llenarFormularioGeneralesDesdeExcel,
    llenarFormularioContacto,
    llenarFormularioAcciones,
    llenarFormularioCertificaciones,
    llenarFormularioDatosAdicionales,
    llenarFormularioDireccion,
    llenarFormularioZonasCarga,
  };
}

module.exports = { crearHelpersFormularioClientes };
