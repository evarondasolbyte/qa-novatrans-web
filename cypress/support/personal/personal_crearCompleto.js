function crearHelperCrearCompletoPersonal(config) {
  const {
    HOJA_EXCEL,
    MENU,
    SUBMENU,
    URL_PATH,
    UI,
    abrirFormularioNuevoPersonal,
    llenarFormularioDatosPersonalesDesdeExcel,
    deducirSeccionDesdeCaso,
    navegarSeccionFormulario,
    abrirModalSeccion,
    llenarFormularioSeccion,
    guardarModalSeccion,
    llenarCamposFormulario,
    llenarFormularioDocumentos,
    asegurarGestorDocumentosAbierto,
    seleccionarTelefono,
    anadirPersonal,
    registrarResultadoAutomatico,
    escapeRegex,
  } = config;

  function TC056(caso, numero, casoId) {
    const numeroCaso = numero || 56;
    const idCaso = casoId || `TC${String(numeroCaso).padStart(3, '0')}`;
    const nombre = caso?.nombre || 'Comprobar que se quedan guardados todos los registros';

    return cy.obtenerDatosExcel(HOJA_EXCEL).then((todosLosCasos) => {
      const caso24 = todosLosCasos.find((c) => parseInt(String(c.caso || '').replace(/\D/g, ''), 10) === 24);
      const caso25 = todosLosCasos.find((c) => parseInt(String(c.caso || '').replace(/\D/g, ''), 10) === 25);
      const caso56 = todosLosCasos.find((c) => parseInt(String(c.caso || '').replace(/\D/g, ''), 10) === 56);
      const casoBase = caso25 || caso24 || caso56 || caso;
      const numeroAleatorio = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      let codigoPersonal = null;
      let nombrePersonalReal = `prueba${numeroAleatorio}`;
      let ignorarCasoPorAlerta = false;
      let motivoIgnorar = '';
      let documentosDisponibles = false;
      let nombrePestanaDocumentos = 'Documentos';
      const GESTOR_DOCUMENTOS_SENTINEL = '__GESTOR_DOCUMENTOS__';
      const nombreDocumentoEsperado = (Cypress.env('DOCUMENTO_PRUEBA_FILENAME') || 'documento prueba.txt').toString();
      const PATH_ICONO_DOCUMENTO = 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8zm2 16H8v-2h8zm0-4H8v-2h8zm-3-5V3.5L18.5 9z';

      const escribirEnCampoPorLabelExacto = (labelExacto, valor) => {
        return cy.get('body').then(($body) => {
          const objetivo = String(labelExacto).trim().toLowerCase();
          const $label = $body.find('label').filter((_, el) => {
            const t = (el.textContent || el.innerText || '').trim().toLowerCase();
            if (!(t === objetivo || t.startsWith(`${objetivo} `) || t.startsWith(objetivo))) return false;
            if (objetivo === 'nombre' && t.includes('propietario')) return false;
            const $el = Cypress.$(el);
            const estaEnModal = $el.closest('.MuiDrawer-root, .MuiModal-root, [role="dialog"]').length > 0;
            return !estaEnModal;
          }).first();

          if (!$label.length) return cy.wrap(false);

          const forAttr = $label.attr('for');
          if (forAttr) {
            const sel = forAttr.includes('.') ? `[id="${forAttr}"]` : `#${forAttr}`;
            return cy.get(sel, { timeout: 5000 })
              .should('exist')
              .scrollIntoView()
              .click({ force: true })
              .clear({ force: true })
              .type(String(valor), { force: true, delay: 0 })
              .blur({ force: true })
              .then(() => true);
          }

          const cont = $label.closest('.MuiFormControl-root, .MuiTextField-root, .MuiInputBase-root');
          const input = cont.find('input, textarea').not('input[type="hidden"]').first();
          if (input.length) {
            return cy.wrap(input[0])
              .scrollIntoView()
              .click({ force: true })
              .clear({ force: true })
              .type(String(valor), { force: true, delay: 0 })
              .blur({ force: true })
              .then(() => true);
          }

          if (objetivo === 'nombre') {
            const input2 = $body.find('input[name="client.name"], textarea[name="client.name"], input[name="name"]').first();
            if (input2.length) {
              return cy.wrap(input2[0])
                .scrollIntoView()
                .click({ force: true })
                .clear({ force: true })
                .type(String(valor), { force: true, delay: 0 })
                .blur({ force: true })
                .then(() => true);
            }
          }

          return cy.wrap(false);
        });
      };

      const leerValorCampoPorLabelExacto = (labelExacto) => {
        return cy.get('body').then(($body) => {
          const $label = $body.find('label').filter((_, el) => {
            const t = (el.textContent || el.innerText || '').trim().toLowerCase();
            if (t !== String(labelExacto).trim().toLowerCase()) return false;
            const $el = Cypress.$(el);
            const estaEnModal = $el.closest('.MuiDrawer-root, .MuiModal-root, [role="dialog"]').length > 0;
            return !estaEnModal;
          }).first();
          if (!$label.length) return cy.wrap(null);

          const forAttr = $label.attr('for');
          if (forAttr) {
            const sel = forAttr.includes('.') ? `[id="${forAttr}"]` : `#${forAttr}`;
            const v = $body.find(sel).first().val();
            return cy.wrap(v ? String(v).trim() : null);
          }

          const cont = $label.closest('.MuiFormControl-root, .MuiTextField-root, .MuiInputBase-root');
          const input = cont.find('input, textarea').not('input[type="hidden"]').first();
          if (input.length) return cy.wrap(String(input.val() || '').trim() || null);
          return cy.wrap(null);
        });
      };

      const verificarPestanaTieneDatos = (nombrePestana) => {
        return cy.get('body').then(($body) => {
          const tabActiva = $body.find('[role="tab"][aria-selected="true"]').first();
          const ariaControls = tabActiva.attr('aria-controls');
          const panelActivo = ariaControls ? $body.find(`[id="${ariaControls}"]`) : $body.find('[role="tabpanel"]:not([hidden])').first();
          const $scope = (panelActivo && panelActivo.length) ? panelActivo : $body;
          const regexSinDatos = /sin\s+filas|no\s+hay\s+datos|sin\s+datos|no\s+rows|no\s+results/i;
          const resultado = (ok, detalles = []) => ({ ok, detalles });
          const textoLimpio = (v = '') => String(v || '').trim();
          const tieneTextoReal = (v = '') => {
            const txt = textoLimpio(v);
            if (!txt) return false;
            if (/^0$/.test(txt)) return false;
            if (/^(dd|mm|yyyy)(\/|-)?(dd|mm|yyyy)?/i.test(txt)) return false;
            return true;
          };
          const obtenerLabelCampo = (el) => {
            const $el = Cypress.$(el);
            const id = $el.attr('id');
            if (id) {
              const $label = $scope.find(`label[for="${id}"]`).first();
              const txt = textoLimpio($label.text());
              if (txt) return txt;
            }

            const ariaLabel = textoLimpio($el.attr('aria-label'));
            if (ariaLabel) return ariaLabel;

            const name = textoLimpio($el.attr('name'));
            if (name) return name;

            const $control = $el.closest('.MuiFormControl-root, .MuiTextField-root, .MuiPickersTextField-root');
            if ($control.length) {
              const $label = $control.find('label').first();
              const txt = textoLimpio($label.text());
              if (txt) return txt;
            }

            const placeholder = textoLimpio($el.attr('placeholder'));
            if (placeholder) return placeholder;

            return 'Campo sin nombre';
          };
          const valorCombo = (el) => textoLimpio(el.innerText || el.textContent || '');

          const err = $scope.find('.MuiFormHelperText-root.Mui-error:visible, .Mui-error:visible').filter((_, el) => {
            const t = (el.textContent || '').trim();
            return t.length > 0;
          });
          if (err.length > 0) return cy.wrap(resultado(false, ['Errores de validación visibles']));

          const tabla = $scope.find('.MuiDataGrid-root:visible, .MuiTableContainer:visible, table:visible').first();
          if (tabla.length > 0) {
            const filas = tabla.find('.MuiDataGrid-row:visible, tbody tr:visible, .MuiTableBody-root tr:visible').filter((_, el) => {
              const textoFila = (el.textContent || el.innerText || '').trim().toLowerCase();
              return textoFila.length > 0 && !regexSinDatos.test(textoFila);
            });
            if (filas.length > 0) return cy.wrap(resultado(true));

            const celdasConTexto = tabla.find('.MuiDataGrid-cell:visible, td:visible').filter((_, el) => {
              const texto = (el.textContent || el.innerText || '').trim().toLowerCase();
              return texto.length > 0 && !regexSinDatos.test(texto);
            });
            if (celdasConTexto.length > 0) return cy.wrap(resultado(true));
          }

          const dg = $scope.find('.MuiDataGrid-root').first();
          if (dg.length) {
            const grid = dg.find('[role="grid"]').first();
            const rc = parseInt(String(grid.attr('aria-rowcount') || ''), 10);
            if (Number.isFinite(rc) && rc > 1) return cy.wrap(resultado(true));

            const filasDG = dg.find('.MuiDataGrid-row[data-rowindex], [role="row"][data-rowindex]').filter((_, el) => {
              const textoFila = (el.textContent || el.innerText || '').trim().toLowerCase();
              return textoFila.length > 0 && !regexSinDatos.test(textoFila);
            });
            if (filasDG.length > 0) return cy.wrap(resultado(true));

            const txt = (dg.text() || '').toLowerCase();
            if (regexSinDatos.test(txt)) {
              return cy.wrap(resultado(false));
            }
          }

          const filasTabla = $scope.find('table tbody tr, tbody tr').filter((_, el) => {
            const textoFila = (el.textContent || '').trim().toLowerCase();
            return textoFila.length > 0 && !regexSinDatos.test(textoFila);
          });
          if (filasTabla.length > 0) return cy.wrap(resultado(true));

          const esPestanaConFormulario = /datos\s+personales|direcci[oó]n|datos\s+econ[oó]micos/i.test(nombrePestana);
          if (esPestanaConFormulario) {
            const inputs = $scope.find('input:visible, textarea:visible');
            const combos = $scope.find('[role="combobox"]:visible, .MuiSelect-select:visible, [aria-haspopup="listbox"]:visible');
            const hayControles = inputs.length > 0 || combos.length > 0;
            const hayValorInput = Array.from(inputs).some((el) => tieneTextoReal(el.value));
            const hayValorCombo = Array.from(combos).some((el) => {
              const t = valorCombo(el);
              if (!t) return false;
              if (/selecciona|select|elige|choose/i.test(t)) return false;
              return true;
            });

            if (/datos\s+personales|direcci[oó]n|datos\s+econ[oó]micos/i.test(nombrePestana)) {
              const inputsVacios = Array.from(inputs).filter((el) => !tieneTextoReal(el.value));
              const combosVacios = Array.from(combos).filter((el) => {
                const t = valorCombo(el);
                return !t || /selecciona|select|elige|choose/i.test(t);
              });

              if (hayControles && (inputsVacios.length > 0 || combosVacios.length > 0)) {
                const detalles = [
                  ...inputsVacios.map((el) => obtenerLabelCampo(el)),
                  ...combosVacios.map((el) => obtenerLabelCampo(el)),
                ].filter(Boolean);
                const detallesUnicos = Array.from(new Set(detalles));
                return cy.wrap(resultado(false, detallesUnicos));
              }
            }

            if (hayValorInput || hayValorCombo) return cy.wrap(resultado(true));
          }

          const radiosMarcados = $scope.find('input[type="radio"]:checked:visible, input[type="checkbox"]:checked:visible');
          if (radiosMarcados.length > 0) return cy.wrap(resultado(true));

          const textosSignificativos = $scope.find('input:visible, textarea:visible, [role="combobox"]:visible, .MuiSelect-select:visible, [aria-haspopup="listbox"]:visible, .MuiChip-label:visible, .MuiTypography-root:visible, span:visible, div:visible')
            .filter((_, el) => {
              const texto = (el.value || el.textContent || el.innerText || '').trim().toLowerCase();
              if (!texto) return false;
              if (regexSinDatos.test(texto)) return false;
              if (/selecciona|select|elige|choose|buscar|search|guardar|cancelar|cancel|nuevo|new/i.test(texto)) return false;
              return texto.length > 1;
            });
          if (textosSignificativos.length > 0) return cy.wrap(resultado(true));

          return cy.wrap(resultado(false));
        });
      };

      const existePestanaFormulario = (nombrePestana) => {
        const regex = nombrePestana instanceof RegExp
          ? nombrePestana
          : new RegExp(escapeRegex(String(nombrePestana || '')), 'i');

        const buscarVisible = () => {
          return cy.get('body').then(($body) => {
            const tabs = $body
              .find('[role="tab"], .MuiTab-root, button[role="tab"], [data-testid*="tab"]')
              .filter(':visible')
              .filter((_, el) => regex.test((el.textContent || el.innerText || '').trim()));

            return tabs.length > 0;
          });
        };

        const clickScrollDerecha = () => {
          return cy.get('body').then(($body) => {
            const $btn = $body.find('.MuiTabScrollButton-root:not(.Mui-disabled)').filter(':visible').last();
            if ($btn.length) {
              return cy.wrap($btn[0]).click({ force: true }).then(() => cy.wait(250)).then(() => true);
            }
            return cy.wrap(false);
          });
        };

        const loop = (intento = 0) => {
          if (intento > 8) return cy.wrap(false);
          return buscarVisible().then((ok) => {
            if (ok) return cy.wrap(true);
            return clickScrollDerecha().then((movio) => {
              if (!movio) return cy.wrap(false);
              return loop(intento + 1);
            });
          });
        };

        return loop(0);
      };

      const abrirPestanaFormularioSiExiste = (nombrePestana) => {
        const regex = nombrePestana instanceof RegExp
          ? nombrePestana
          : new RegExp(escapeRegex(String(nombrePestana || '')), 'i');

        const buscarYClick = () => {
          return cy.get('body').then(($body) => {
            const $tab = $body
              .find('[role="tab"], .MuiTab-root, button[role="tab"], [data-testid*="tab"]')
              .filter(':visible')
              .filter((_, el) => regex.test((el.textContent || el.innerText || '').trim()))
              .first();

            if ($tab.length) {
              const texto = ($tab.text() || $tab[0]?.innerText || '').trim();
              return cy.wrap($tab[0])
                .click({ force: true })
                .then(() => cy.wait(600))
                .then(() => cy.wrap({ abierta: true, texto }));
            }

            return cy.wrap({ abierta: false, texto: '' });
          });
        };

        const clickScrollDerecha = () => {
          return cy.get('body').then(($body) => {
            const $btn = $body.find('.MuiTabScrollButton-root:not(.Mui-disabled)').filter(':visible').last();
            if ($btn.length) {
              return cy.wrap($btn[0]).click({ force: true }).then(() => cy.wait(250)).then(() => true);
            }
            return cy.wrap(false);
          });
        };

        const loop = (intento = 0) => {
          if (intento > 8) return cy.wrap({ abierta: false, texto: '' });
          return buscarYClick().then((res) => {
            if (res.abierta) return cy.wrap(res);
            return clickScrollDerecha().then((movio) => {
              if (!movio) return cy.wrap({ abierta: false, texto: '' });
              return loop(intento + 1);
            });
          });
        };

        return loop(0);
      };

      const existeGestorDocumentosPorIcono = () => {
        return cy.get('body').then(($body) => {
          const $btn = $body
            .find('button.css-wjdcvk')
            .filter((_, el) => {
              const d = el.querySelector('svg path')?.getAttribute('d') || '';
              return d === PATH_ICONO_DOCUMENTO;
            })
            .filter(':visible')
            .first();

          return cy.wrap($btn.length > 0);
        });
      };

      const esperarResultadoBusquedaCodigo = (codigoBuscar, timeoutMs = 15000) => {
        const inicio = Date.now();
        const reFila = new RegExp(escapeRegex(codigoBuscar), 'i');

        const loop = () => {
          return cy.get('body').then(($body) => {
            const $filas = $body.find('.MuiDataGrid-row:visible');
            const hayFilaCoincidente = Array.from($filas).some((el) => reFila.test(el.innerText || el.textContent || ''));
            const texto = ($body.text() || '').toLowerCase();
            const sinFilas = /sin\s+filas|no\s+rows/i.test(texto);

            if (hayFilaCoincidente || sinFilas) {
              return cy.wrap({ hayFilaCoincidente, sinFilas });
            }

            if (Date.now() - inicio >= timeoutMs) {
              return cy.wrap({ hayFilaCoincidente: false, sinFilas: false });
            }

            return cy.wait(500).then(() => loop());
          });
        };

        return loop();
      };

      const seleccionarColumnaFiltroSiExiste = (nombreColumna) => {
        const objetivo = (nombreColumna || '').toString().trim();
        if (!objetivo) return cy.wrap(null);

        const normalizar = (t = '') => t.toString().trim().toLowerCase();
        const coincide = (a, b) => {
          const A = normalizar(a);
          const B = normalizar(b);
          return A === B || A.includes(B) || B.includes(A);
        };

        return cy.get('body').then(($b) => {
          const $sel = $b.find('select[name="column"], select#column').filter(':visible').first();
          if ($sel.length) {
            const opts = Array.from($sel[0].options || []).map((o) => (o.text || '').trim());
            const found = opts.find((t) => coincide(t, objetivo));
            if (found) return cy.wrap($sel).select(found, { force: true }).then(() => cy.wait(300));
            return cy.wrap($sel).select(1, { force: true }).then(() => cy.wait(300));
          }

          let $btn = null;
          const $inputBuscar = $b.find('input[type="text"], input[placeholder*="Buscar"], input[placeholder*="Search"]').filter(':visible').first();
          if ($inputBuscar.length) {
            const $contFiltro = $inputBuscar.closest('.MuiBox-root, .MuiFormControl-root, div').parent();
            $btn = $contFiltro.find('button, [role="button"]').filter(':visible').first();
          }

          if (!$btn || !$btn.length) {
            $btn = $b.find('button, [role="button"]')
              .filter(':visible')
              .filter((_, el) => {
                const $el = Cypress.$(el);
                const cercaInput = $el.siblings('input').length > 0 || $el.closest('div').find('input').length > 0;
                const texto = (el.textContent || '').trim();
                return cercaInput || texto.length === 0 || /c[oó]digo|nombre|todos|all/i.test(texto.toLowerCase());
              })
              .first();
          }

          if (!$btn || !$btn.length) return cy.wrap(null);

          return cy.wrap($btn[0])
            .click({ force: true })
            .then(() => cy.wait(500))
            .then(() => {
              return cy.get('body').then(($b2) => {
                const $items = $b2.find('li[role="option"], li[role="menuitem"], [role="option"]').filter(':visible');
                if (!$items.length) return cy.wrap(null);
                const match = Array.from($items).find((el) => coincide(el.textContent || '', objetivo));
                if (match) return cy.wrap(match).click({ force: true }).then(() => cy.wait(300));
                return cy.wrap($items[0]).click({ force: true }).then(() => cy.wait(300));
              });
            });
        });
      };


      const manejarModalConfirmacionTelefono = (timeoutMs = 10000) => {
        const startTime = Date.now();
        const checkModal = () => {
          return cy.get('body').then(($body) => {
            const $modal = $body
              .find('.MuiDialog-root:visible, [role="dialog"]:visible, [role="alertdialog"]:visible')
              .filter((_, el) => {
                const texto = (el.textContent || el.innerText || '').trim();
                return /NovaTrans\s*-\s*Informaci[oó]n/i.test(texto) &&
                  /tel[eé]fono.*asignado/i.test(texto) &&
                  /desea continuar/i.test(texto);
              })
              .first();

            if ($modal && $modal.length) {
              return cy.wrap($modal).within(() => {
                return cy.contains('button', /^S[ií]$/i, { timeout: 5000 })
                  .should('be.visible')
                  .click({ force: true })
                  .then(() => cy.wait(1000))
                  .then(() => cy.wrap(true));
              });
            }

            if (Date.now() - startTime < timeoutMs) {
              return cy.wait(500).then(() => checkModal());
            }

            return cy.wrap(false);
          });
        };

        return checkModal();
      };


      const generarCodigoAleatorio = () => Math.floor(Math.random() * 10000).toString().padStart(4, '0');

      const detectarModalCodigoDuplicado = () => {
        return cy.get('body').then(($body) => {
          const $dlg = $body
            .find('.MuiDialog-root:visible, [role="dialog"]:visible, [role="alertdialog"]:visible')
            .filter((_, el) => {
              const texto = (el.textContent || el.innerText || '').trim().toLowerCase();
              return /c[oó]digo|codigo|code/.test(texto) &&
                (/ya existe|existe|duplic|already exists/.test(texto));
            })
            .first();

          if ($dlg && $dlg.length) {
            const texto = ($dlg.text() || $dlg[0]?.innerText || '').trim();
            return cy.wrap({ visible: true, texto }, { log: false });
          }

          return cy.wrap({ visible: false, texto: '' }, { log: false });
        });
      };

      const cerrarModalInformativoVisible = () => {
        return cy.get('body').then(($body) => {
          const $dlg = $body
            .find('.MuiDialog-root:visible, [role="dialog"]:visible, [role="alertdialog"]:visible')
            .first();

          if (!$dlg.length) return cy.wrap(null);

          const $btn = $dlg.find('button:visible').filter((_, el) => {
            const texto = (el.textContent || el.innerText || '').trim().toLowerCase();
            return /aceptar|ok|cerrar|close|cancelar|cancel|no/.test(texto);
          }).first();

          if ($btn.length) {
            return cy.wrap($btn[0]).click({ force: true }).then(() => cy.wait(500));
          }

          return cy.get('body').type('{esc}', { force: true }).then(() => cy.wait(500));
        });
      };

      const detectarGuardadoCorrecto = (timeoutMs = 6000, intervalMs = 300) => {
        const start = Date.now();
        const loop = () => {
          return cy.get('body').then(($body) => {
            const texto = ($body.text() || '').toLowerCase();
            const tieneExito = texto.includes('guardado correctamente') ||
              texto.includes('guardado exitosamente') ||
              texto.includes('saved successfully') ||
              $body.find('[class*="success"], [class*="Success"], [role="alert"]').filter((_, el) => {
                const t = (el.textContent || '').toLowerCase();
                return t.includes('guardado') || t.includes('correcto') || t.includes('exitoso') || t.includes('saved');
              }).length > 0;

            if (tieneExito) return true;
            if (Date.now() - start >= timeoutMs) return false;
            return Cypress.Promise.delay(intervalMs).then(loop);
          });
        };
        return loop();
      };

      const actualizarCodigoYReintentar = (intentoActual) => {
        const nuevoCodigo = generarCodigoAleatorio();
        codigoPersonal = nuevoCodigo;
        Cypress.env('TC056_SUFFIX', nuevoCodigo);
        cy.log(`TC056: código duplicado detectado. Reintentando con nuevo Código "${nuevoCodigo}" (intento ${intentoActual + 1})`);

        return escribirEnCampoPorLabelExacto('Código', nuevoCodigo).then((ok) => {
          if (!ok) {
            return escribirEnCampoPorLabelExacto('Codigo', nuevoCodigo);
          }
          return cy.wrap(ok);
        }).then(() => cy.wait(500));
      };

      const guardarFormularioConReintento = (intento = 0, maxIntentos = 6) => {
        return cy.window().then((win) => {
          win.scrollTo(0, 0);
          return cy.wait(500);
        })
          .then(() => {
            return cy.contains('button, [type="submit"]', /Guardar/i, { timeout: 10000 })
              .scrollIntoView()
              .click({ force: true })
              .then(() => cy.wait(1000));
          })
          .then(() => manejarModalConfirmacionTelefono(10000))
          .then((manejadoTelefono) => {
            if (manejadoTelefono) return cy.wait(3000);
            return cy.wait(1500);
          })
          .then(() => detectarModalCodigoDuplicado())
          .then((modalDuplicado) => {
            if (modalDuplicado?.visible) {
              if (intento >= maxIntentos - 1) {
                return cy.wrap({
                  resultado: 'ERROR',
                  error: `El código del personal ya existe en base de datos tras ${maxIntentos} intentos. Último mensaje: ${modalDuplicado.texto}`,
                });
              }

              return cerrarModalInformativoVisible()
                .then(() => actualizarCodigoYReintentar(intento))
                .then(() => guardarFormularioConReintento(intento + 1, maxIntentos));
            }

            return detectarGuardadoCorrecto().then((guardadoOk) => {
              if (!guardadoOk) {
                cy.log('TC056: no se detectó mensaje explícito de guardado correcto, se continúa con la validación en lista.');
              } else {
                cy.log('TC056: mensaje de guardado correcto detectado.');
              }

              return cy.visit(URL_PATH).then(() => cy.wait(2000)).then(() => {
                return cy.wrap({ resultado: 'OK', guardado: true, yaEnLista: true });
              });
            });
          });
      };

      const casoMod = { ...casoBase };

      return cy.login()
        .then(() => cy.navegarAMenu(MENU, SUBMENU, { expectedPath: URL_PATH }))
        .then(() => UI.esperarTabla())
        .then(() => abrirFormularioNuevoPersonal())
        .then(() => cy.url().should('include', '/dashboard/personnel/form'))
        .then(() => {
          Cypress.env('TC056_SUFFIX', numeroAleatorio);
          return cy.wrap(null);
        })
        .then(() => {
          const numBase = caso25 ? 25 : (caso24 ? 24 : 56);
          return llenarFormularioDatosPersonalesDesdeExcel(casoMod, numBase, false, { modoCompleto: true });
        })
        .then(() => {
          return leerValorCampoPorLabelExacto('Código').then((v) => {
            if (v) {
              codigoPersonal = String(v).replace(/\D/g, '');
              const suf = (codigoPersonal.padStart(4, '0')).slice(-4);
              Cypress.env('TC056_SUFFIX', suf);
            }
            return cy.wrap(null);
          });
        })
        .then(() => {
          const suf = Cypress.env('TC056_SUFFIX') || numeroAleatorio;
          const nombreFinal = `prueba${suf}`;
          return escribirEnCampoPorLabelExacto('Nombre', nombreFinal).then((ok) => {
            if (ok) nombrePersonalReal = nombreFinal;
            return cy.wrap(null);
          });
        })
        .then(() => cy.wrap(null))
        .then(() => {
          const casosPestanas = todosLosCasos
            .filter((c) => {
              const n = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
              return n >= 27 && n <= 34;
            })
            .sort((a, b) => {
              const na = parseInt(String(a.caso || '').replace(/\D/g, ''), 10);
              const nb = parseInt(String(b.caso || '').replace(/\D/g, ''), 10);
              return na - nb;
            });

          let chain = cy.wrap(null);
          let esUltimaPestana = false;
          casosPestanas.forEach((c, index) => {
            const n = parseInt(String(c.caso || '').replace(/\D/g, ''), 10);
            const seccion = deducirSeccionDesdeCaso(c);
            const esConModal = /formaci|experienc|asistenc|material|contrat|incidenc|hist|tel[eé]f/i.test(seccion);
            esUltimaPestana = (index === casosPestanas.length - 1);

            chain = chain.then(() => {
              if (n === 34) {
                return anadirPersonal(c, 34, 'TC034').then(() => {
                  if (false && esUltimaPestana) return cy.wrap({ resultado: 'OK', guardado: true, yaEnLista: true });
                  return cy.wrap(null);
                });
              }

              if ((n === 32) || (seccion && /tel[eé]fon/i.test(seccion) && !/hist/i.test(seccion))) {
                return seleccionarTelefono(c, 32, 'TC032');
              }
              if (esConModal) {
                return navegarSeccionFormulario(seccion)
                  .then(() => abrirModalSeccion(seccion))
                  .then(() => llenarFormularioSeccion(c, n, seccion))
                  .then(() => guardarModalSeccion(seccion));
              }
              return navegarSeccionFormulario(seccion).then(() => llenarCamposFormulario(c));
            });
          });
          return chain;
        })
        .then(() => {
          return existePestanaFormulario(/documentos?|documentaci[oó]n/i).then((existe) => {
            if (existe) {
              documentosDisponibles = true;
              return abrirPestanaFormularioSiExiste(/documentos?|documentaci[oó]n/i)
                .then((resTab) => {
                  if (resTab?.texto) nombrePestanaDocumentos = resTab.texto;
                  if (!resTab?.abierta) {
                    cy.log('TC056: No se pudo abrir la pestaña de documentos aunque existe en el formulario.');
                    documentosDisponibles = false;
                    return cy.wrap(null);
                  }
                  return llenarFormularioDocumentos({}, numeroCaso);
                })
                .then(() => cy.wait(1000));
            }

            return existeGestorDocumentosPorIcono().then((existeIcono) => {
              documentosDisponibles = !!existeIcono;
              if (!documentosDisponibles) return cy.wrap(null);
              nombrePestanaDocumentos = GESTOR_DOCUMENTOS_SENTINEL;
              return asegurarGestorDocumentosAbierto()
                .then(() => llenarFormularioDocumentos({}, numeroCaso))
                .then(() => cy.wait(1000));
            });
          });
        })
        .then(() => {
          return guardarFormularioConReintento();
        })
        .then((resGuardado) => {
          if (resGuardado && resGuardado.resultado === 'ERROR') {
            Cypress.env('TC056_SUFFIX', null);
            const obs = resGuardado.error || 'Error al guardar el personal';
            return registrarResultadoAutomatico(
              numeroCaso,
              idCaso,
              nombre,
              obs,
              'ERROR',
              true
            ).then(() => cy.wrap({ __resultado: 'STOP' }));
          }

          if (resGuardado && resGuardado.guardado && !resGuardado.yaEnLista) {
            return UI.abrirPantalla().then(() => cy.wrap(null));
          }

          if (ignorarCasoPorAlerta) {
            Cypress.env('TC056_SUFFIX', null);
            return cy.wrap({ __resultado: 'ERROR', obtenido: motivoIgnorar || 'Alerta incorrecta (mal escrita) y no se ha podido guardar/crear el personal' });
          }

          return cy.url().then((urlActual) => {
            if (!urlActual.includes('/personnel') || urlActual.includes('/form')) {
              return cy.visit(URL_PATH).then(() => cy.wait(2000));
            }
            return cy.wrap(null);
          })
            .then(() => UI.esperarTabla())
            .then(() => {
              const codigoBuscar = codigoPersonal || Cypress.env('TC056_SUFFIX') || numeroAleatorio;
              if (!codigoBuscar) {
                const obs = 'No se pudo capturar el código del personal para buscar y verificar.';
                return registrarResultadoAutomatico(numeroCaso, idCaso, nombre, obs, 'ERROR', true)
                  .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
              }

              return cy.get('body').then(($body) => {
                const $btnMultifiltro = $body
                  .find('button, [role="button"]')
                  .filter((_, el) => {
                    const texto = (el.textContent || el.innerText || '').trim().toLowerCase();
                    return /multifiltro|multi.*filtro/i.test(texto);
                  })
                  .filter(':visible')
                  .first();

                if ($btnMultifiltro.length) {
                  return cy.wrap($btnMultifiltro[0])
                    .click({ force: true })
                    .then(() => cy.wait(500))
                    .then(() => {
                      return cy.get('body').then(($b2) => {
                        const $items = $b2.find('li[role="option"], li[role="menuitem"], [role="option"]').filter(':visible');
                        if ($items.length) {
                          const match = Array.from($items).find((el) => {
                            const texto = (el.textContent || el.innerText || '').trim().toLowerCase();
                            return /^c[oó]digo$/i.test(texto) || texto === 'código' || texto === 'codigo' || texto === 'code';
                          });
                          if (match) return cy.wrap(match).click({ force: true }).then(() => cy.wait(300));
                          return cy.wrap($items[0]).click({ force: true }).then(() => cy.wait(300));
                        }
                        return cy.wrap(null);
                      });
                    })
                    .then(() => {
                      return UI.buscar(codigoBuscar)
                        .then(() => esperarResultadoBusquedaCodigo(codigoBuscar, 20000))
                        .then(({ hayFilaCoincidente, sinFilas }) => {
                          if (!hayFilaCoincidente && sinFilas) {
                              const obs = `No se encontró el personal creado al buscar por código "${codigoBuscar}".`;
                              return registrarResultadoAutomatico(
                                numeroCaso,
                                idCaso,
                                nombre,
                                obs,
                                'ERROR',
                                true
                              ).then(() => cy.wrap({ __resultado: 'STOP' }));
                          }
                          return cy.wrap(null);
                        });
                    });
                }

                return seleccionarColumnaFiltroSiExiste('Código')
                  .then(() => {
                    return UI.buscar(codigoBuscar)
                      .then(() => esperarResultadoBusquedaCodigo(codigoBuscar, 20000))
                      .then(({ hayFilaCoincidente, sinFilas }) => {
                          if (!hayFilaCoincidente && sinFilas) {
                            const obs = `No se encontró el personal creado al buscar por código "${codigoBuscar}".`;
                            return registrarResultadoAutomatico(
                              numeroCaso,
                              idCaso,
                              nombre,
                              obs,
                              'ERROR',
                              true
                            ).then(() => cy.wrap({ __resultado: 'STOP' }));
                          }
                          return cy.wrap(null);
                      });
                  });
              });
            })
            .then((resPrev) => {
              if (resPrev && (resPrev.__resultado === 'STOP' || resPrev.resultado === 'ERROR')) return cy.wrap(resPrev);

              const codigoBuscar = codigoPersonal || Cypress.env('TC056_SUFFIX') || numeroAleatorio;
              const reFila = new RegExp(escapeRegex(codigoBuscar), 'i');
              return esperarResultadoBusquedaCodigo(codigoBuscar, 20000)
                .then(({ hayFilaCoincidente }) => {
                  if (!hayFilaCoincidente) {
                    throw new Error(`TC056: la tabla no mostró a tiempo el personal con código "${codigoBuscar}"`);
                  }
                  return cy.contains('.MuiDataGrid-row:visible', reFila, { timeout: 15000 });
                })
                .first()
                .then(($row) => {
                  const $cell = Cypress.$($row).find('.MuiDataGrid-cell').not('[data-field="__check__"]').first();
                  if ($cell.length) return cy.wrap($cell[0]).click({ force: true });
                  return cy.wrap($row).click({ force: true });
                })
                .then(() => cy.wait(800))
                .then(() => cy.url().should('include', '/dashboard/personnel/form'));
            })
            .then((resFila) => {
              if (resFila && (resFila.__resultado === 'STOP' || resFila.__resultado === 'ERROR')) return cy.wrap(resFila);

              const pestanasAVerificar = [
                'Dirección',
                'Datos Económicos',
                'Formación',
                'Experiencia',
                'Asistencia',
                'Material',
                'Contratos',
                'Teléfonos',
                'Hist. Telefónico',
                'Incidencias',
              ];

              if (documentosDisponibles) pestanasAVerificar.push(nombrePestanaDocumentos);

              let chainVer = cy.wrap([]);
              pestanasAVerificar.forEach((p) => {
                chainVer = chainVer.then((sinDatos) => {
                  const prepararVista = () => {
                    if (documentosDisponibles && p === nombrePestanaDocumentos) {
                      if (p === GESTOR_DOCUMENTOS_SENTINEL) {
                        return asegurarGestorDocumentosAbierto().then(() => cy.wait(600));
                      }
                      return navegarSeccionFormulario(p).then(() => cy.wait(600));
                    }
                    return navegarSeccionFormulario(p).then(() => cy.wait(600));
                  };

                  return prepararVista()
                    .then(() => {
                      if (documentosDisponibles && p === nombrePestanaDocumentos) {
                        return cy.get('body').then(($body) => {
                          const filasDocumento = $body.find('.MuiDataGrid-row:visible, tbody tr:visible, .MuiTableBody-root tr:visible')
                            .filter((_, el) => {
                              const textoFila = (el.textContent || el.innerText || '').trim().toLowerCase();
                              return textoFila.length > 0 && !/sin\s+filas|no\s+hay\s+datos|sin\s+datos|no\s+rows|no\s+results/i.test(textoFila);
                            });
                          const texto = ($body.text() || '').toLowerCase();
                          const sinFilas = /sin\s+filas|no\s+hay\s+datos|sin\s+datos|no\s+rows|no\s+results/i.test(texto);
                          const tieneDocumento = !sinFilas && (filasDocumento.length > 0 || texto.includes(nombreDocumentoEsperado.toLowerCase()));

                          if (tieneDocumento) {
                            cy.log(`TC056: Documentos verificados correctamente (${filasDocumento.length > 0 ? `${filasDocumento.length} fila(s)` : nombreDocumentoEsperado})`);
                          } else {
                            cy.log(`TC056: No se detectó documento guardado en ${p === GESTOR_DOCUMENTOS_SENTINEL ? 'el gestor de documentos' : `la pestaña ${nombrePestanaDocumentos}`}`);
                          }

                          return cy.wrap(tieneDocumento);
                        });
                      }

                    return verificarPestanaTieneDatos(p);
                  })
                    .then((resVer) => {
                      const next = [...sinDatos];
                      const ok = typeof resVer === 'object' ? !!resVer.ok : !!resVer;
                      const detalles = (resVer && Array.isArray(resVer.detalles)) ? resVer.detalles : [];
                      if (!ok) {
                        if (detalles.length > 0) {
                          next.push(`${p} -> ${detalles.join(', ')}`);
                        } else {
                          next.push(p);
                        }
                      }
                      return cy.wrap(next);
                    });
                });
              });
              return chainVer;
            })
            .then((pestanasSinDatos) => {
              if (pestanasSinDatos && (pestanasSinDatos.__resultado === 'STOP' || pestanasSinDatos.__resultado === 'ERROR')) {
                Cypress.env('TC056_SUFFIX', null);
                return cy.wrap(pestanasSinDatos);
              }
              Cypress.env('TC056_SUFFIX', null);
              const status = (pestanasSinDatos && pestanasSinDatos.length > 0) ? 'ERROR' : 'OK';
              const obs = (pestanasSinDatos && pestanasSinDatos.length > 0)
                ? `Personal ${nombrePersonalReal} creado, pero estas pestañas no tienen datos: ${pestanasSinDatos.join(', ')}`
                : `Personal ${nombrePersonalReal} creado y verificado. Todas las pestañas tienen datos.`;

              return registrarResultadoAutomatico(
                numeroCaso,
                idCaso,
                nombre,
                obs,
                status,
                true
              );
            });
        });
    });
  }

  return {
    TC056,
  };
}

module.exports = {
  crearHelperCrearCompletoPersonal,
};
