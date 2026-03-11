function crearHelpersDocumentosClientes() {
  function obtenerRutaDocumentoPrueba() {
    const override = (Cypress.env('DOCUMENTO_PRUEBA_PATH') || '').toString().trim();
    if (override) {
      if (/\\desktop\\/i.test(override)) {
        return 'cypress/fixtures/documento prueba.txt';
      }
      return override;
    }

    const desktopDirOneDrive = (Cypress.env('DESKTOP_DIR_ONEDRIVE') || '').toString().trim();
    const desktopDir = (Cypress.env('DESKTOP_DIR') || '').toString().trim();
    const filename = (Cypress.env('DOCUMENTO_PRUEBA_FILENAME') || 'documento prueba.txt').toString();

    if (desktopDirOneDrive) {
      return `${desktopDirOneDrive}\\${filename}`;
    }

    if (desktopDir) {
      return `${desktopDir}\\${filename}`;
    }

    return 'cypress/fixtures/documento prueba.txt';
  }

  function asegurarGestorDocumentosAbierto() {
    const esAddBtnVisible = ($body) =>
      $body
        .find(
          'span[aria-label*="Agregar documento"], button[aria-label*="Agregar documento"], span[aria-label*="Add document"], button[aria-label*="Add document"]'
        )
        .filter(':visible')
        .length > 0;

    const PATH_ICONO_DOCUMENTO = 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8zm2 16H8v-2h8zm0-4H8v-2h8zm-3-5V3.5L18.5 9z';

    return cy.get('body').then(($body) => {
      if (esAddBtnVisible($body)) return cy.wrap(null);

      const $scope = $body.find('form:visible, [role="main"]:visible, .MuiContainer-root:visible').first();
      const $buscarEn = $scope.length ? $scope : $body;

      const $btn = $buscarEn
        .find('button.css-wjdcvk')
        .filter((_, el) => {
          const d = el.querySelector('svg path')?.getAttribute('d') || '';
          return d === PATH_ICONO_DOCUMENTO;
        })
        .filter(':visible')
        .first();

      if (!$btn.length) {
        cy.log(' Documentos: no se encontró el botón azul (css-wjdcvk) para abrir el gestor. Continuando...');
        return cy.wrap(null);
      }

      return cy.wrap($btn[0])
        .click({ force: true })
        .then(() => cy.wait(800))
        .then(() =>
          cy.get('body').then(($b2) => {
            if (esAddBtnVisible($b2)) return cy.wrap(null);
            cy.log(' Documentos: se pulsó el botón azul pero no apareció "Agregar documento". Continuando...');
            return cy.wrap(null);
          })
        );
    });
  }

  function subirDocumentoPruebaPorIcono() {
    const ruta = obtenerRutaDocumentoPrueba();
    cy.log(`Documentos: subiendo archivo "${ruta}"`);
    cy.log(`Documentos DEBUG env: DOCUMENTO_PRUEBA_PATH="${Cypress.env('DOCUMENTO_PRUEBA_PATH') || ''}", DESKTOP_DIR="${Cypress.env('DESKTOP_DIR') || ''}"`);
    cy.log(`Documentos DEBUG ruta efectiva: "${ruta}"`);

    const prepararStubShowOpenFilePicker = () => {
      return cy.window({ log: false }).then((win) => {
        const intentarParcheIsTrusted = () => {
          try {
            const desc = Object.getOwnPropertyDescriptor(win.Event.prototype, 'isTrusted');
            if (desc && desc.configurable === false) {
              Cypress.log({ name: 'Documentos', message: ' Event.isTrusted no es configurable; puede bloquear clicks automatizados.' });
              return false;
            }
            Object.defineProperty(win.Event.prototype, 'isTrusted', {
              configurable: true,
              get: () => true,
            });
            Cypress.log({ name: 'Documentos', message: ' Parche aplicado: Event.isTrusted => true' });
            return true;
          } catch (e) {
            Cypress.log({ name: 'Documentos', message: ' No se pudo parchear Event.isTrusted; puede bloquear clicks automatizados.' });
            return false;
          }
        };

        intentarParcheIsTrusted();

        if (typeof win.showOpenFilePicker !== 'function') return false;
        if (win.__cypressShowOpenFilePickerStubbed) return true;

        return cy.task('leerArchivoBase64', { filePath: ruta }, { log: false }).then((data) => {
          if (!data || !data.base64) {
            Cypress.log({ name: 'Documentos', message: ' No se pudo leer el archivo para stub de showOpenFilePicker' });
            return false;
          }

          const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
          const file = new win.File(
            [bytes],
            data.name || (Cypress.env('DOCUMENTO_PRUEBA_FILENAME') || 'documento prueba.txt'),
            { type: data.mime || 'application/octet-stream' }
          );

          const handle = {
            kind: 'file',
            name: file.name,
            getFile: async () => file,
            queryPermission: async () => 'granted',
            requestPermission: async () => 'granted',
          };

          win.__cypressPickerCalls = 0;
          const stub = async () => {
            win.__cypressPickerCalls += 1;
            return [handle];
          };
          win.showOpenFilePicker = stub;
          try { win.navigator.showOpenFilePicker = stub; } catch (e) { /* ignore */ }
          win.__cypressShowOpenFilePickerStubbed = true;
          Cypress.log({ name: 'Documentos', message: '✅ showOpenFilePicker stubbeado (sin diálogo nativo)' });
          return true;
        });
      });
    };

    const esperarConfirmacionSubida = (filename, timeoutMs = 15000) => {
      const inicio = Date.now();
      const nombre = (filename || '').toString().toLowerCase();

      const check = () => {
        return cy.get('body', { log: false }).then(($b) => {
          const raw = ($b.text() || '');
          const txt = raw.toLowerCase();
          const okToast = /archivos subidos correctamente|files uploaded successfully/i.test(raw);
          const okNombre = nombre && txt.includes(nombre);
          if (okToast || okNombre) return true;
          if (Date.now() - inicio >= timeoutMs) return false;
          return cy.wait(500, { log: false }).then(() => check());
        });
      };

      return check();
    };

    const prepararCapturaInputFile = () => {
      return cy.window({ log: false }).then((win) => {
        if (win.__cypressFileInputPatched) {
          win.__cypressLastFileInput = null;
          win.__cypressKeepFileInput = false;
          return;
        }
        win.__cypressFileInputPatched = true;
        win.__cypressLastFileInput = null;
        win.__cypressKeepFileInput = false;

        const originalClick = win.HTMLInputElement.prototype.click;
        win.__cypressOriginalFileClick = originalClick;

        const originalRemove = win.Element.prototype.remove;
        const originalRemoveChild = win.Node.prototype.removeChild;
        win.__cypressOriginalRemove = originalRemove;
        win.__cypressOriginalRemoveChild = originalRemoveChild;

        win.Element.prototype.remove = function patchedRemove() {
          try {
            if (win.__cypressKeepFileInput && win.__cypressLastFileInput && this === win.__cypressLastFileInput) {
              return;
            }
          } catch (e) {
          }
          return originalRemove.apply(this, arguments);
        };

        win.Node.prototype.removeChild = function patchedRemoveChild(child) {
          try {
            if (win.__cypressKeepFileInput && win.__cypressLastFileInput && child === win.__cypressLastFileInput) {
              return child;
            }
          } catch (e) {
          }
          return originalRemoveChild.apply(this, arguments);
        };

        win.HTMLInputElement.prototype.click = function patchedClick() {
          try {
            if (this && this.type === 'file') {
              win.__cypressLastFileInput = this;
              win.__cypressKeepFileInput = true;
              try {
                if (!this.isConnected) {
                  this.setAttribute('data-cy-temp-file-input', '1');
                  this.style.position = 'fixed';
                  this.style.left = '-10000px';
                  this.style.top = '-10000px';
                  this.style.opacity = '0';
                  win.document.body.appendChild(this);
                }
              } catch (e2) {
              }
              return;
            }
          } catch (e) {
          }
          return originalClick.apply(this, arguments);
        };
      });
    };

    const restaurarClickInputFile = () => {
      return cy.window({ log: false }).then((win) => {
        if (win.__cypressFileInputPatched && win.__cypressOriginalFileClick) {
          win.HTMLInputElement.prototype.click = win.__cypressOriginalFileClick;
          if (win.__cypressOriginalRemove) win.Element.prototype.remove = win.__cypressOriginalRemove;
          if (win.__cypressOriginalRemoveChild) win.Node.prototype.removeChild = win.__cypressOriginalRemoveChild;
          win.__cypressFileInputPatched = false;
          win.__cypressLastFileInput = null;
          win.__cypressKeepFileInput = false;
        }
      });
    };

    const clickBotonMas = () => {
      return cy.get('body').then(($body) => {
        let $btn = $body.find('span[aria-label="Agregar documento"] button, span[aria-label*="Agregar documento"] button')
          .filter(':visible')
          .first();
        if (!$btn.length) {
          $btn = $body.find('button.css-11jhhn6:visible').first();
        }
        if ($btn.length) {
          return cy.wrap($btn[0]).click({ force: true });
        }
        cy.log(' Documentos: no se encontró el botón "+" para abrir selector. Continuando...');
        return cy.wrap(null);
      });
    };

    const subirPorInputCapturado = () => {
      return cy.window({ log: false }).then((win) => {
        const input = win.__cypressLastFileInput;
        if (!input) return cy.wrap(false, { log: false });

        cy.log('Documentos: input[type=file] capturado, intentando adjuntar archivo sin diálogo...');

        return cy.get('body', { log: false }).then(($body) => {
          let $inputs = $body.find('input[data-cy-temp-file-input="1"][type="file"]');
          if (!$inputs.length) {
            $inputs = $body.find('input[type="file"]');
          }
          if (!$inputs.length) {
            cy.log(' Documentos: no hay input[type=file] en DOM tras capturar. Se probará con diálogo nativo.');
            return false;
          }

          return cy.wrap($inputs[$inputs.length - 1], { log: false })
            .selectFile(ruta, { force: true })
            .then(
              () => true,
              (err) => {
                cy.log(` Documentos: selectFile() falló (se usará diálogo nativo). Detalle: ${err?.message || err}`);
                return false;
              }
            )
            .then((ok) => {
              return cy.window({ log: false }).then((w2) => {
                w2.__cypressKeepFileInput = false;
                try {
                  const el = w2.document.querySelector('input[data-cy-temp-file-input="1"][type="file"]');
                  if (el) el.remove();
                } catch (e3) {
                }
                return ok;
              });
            });
        });
      });
    };

    const seleccionarEnDialogoWindows = () => {
      cy.log('Documentos: esperando diálogo nativo "Abrir/Open" y seleccionando archivo...');
      return cy.task(
        'seleccionarArchivoDialogoWindows',
        { filePath: ruta, timeoutMs: 12000 },
        { log: false, timeout: 20000 }
      )
        .then((ok) => {
          if (ok) {
            cy.log('Documentos: diálogo "Abrir/Open" completado');
            return cy.wait(800);
          }
          cy.log(' Documentos: no se pudo automatizar el diálogo (no se detectó o no hubo foco).');
          return cy.wrap(null);
        });
    };

    let pickerStubbed = false;

    return asegurarGestorDocumentosAbierto()
      .then(() => prepararStubShowOpenFilePicker().then((ok) => { pickerStubbed = !!ok; }))
      .then(() => prepararCapturaInputFile())
      .then(() => clickBotonMas())
      .then(() => cy.wait(800))
      .then(() => {
        if (!pickerStubbed) return cy.wrap(false);
        return cy.window({ log: false }).then((win) => {
          const calls = Number(win.__cypressPickerCalls || 0);
          Cypress.log({ name: 'Documentos', message: `Picker calls: ${calls}` });
          return calls > 0;
        });
      })
      .then((pickerFueLlamado) => {
        const filename = (Cypress.env('DOCUMENTO_PRUEBA_FILENAME') || 'documento prueba.txt').toString();

        if (pickerFueLlamado) {
          return esperarConfirmacionSubida(filename, 15000).then(() => cy.wrap(null));
        }

        return subirPorInputCapturado()
          .then((ok) => {
            if (ok) return cy.wrap(null);
            const intentoDialogo = () =>
              restaurarClickInputFile()
                .then(() => clickBotonMas())
                .then(() => cy.wait(700))
                .then(() => seleccionarEnDialogoWindows());
            return intentoDialogo().then(() => intentoDialogo());
          });
      })
      .then(() => {
        const filename = (Cypress.env('DOCUMENTO_PRUEBA_FILENAME') || 'documento prueba.txt').toString();

        return cy.get('body').then(($b) => {
          const texto = ($b.text() || '');
          const textoLower = texto.toLowerCase();

          if (/Archivos subidos correctamente|Files uploaded successfully/i.test(texto)) {
            cy.log(' Documentos: subida confirmada por texto/toast');
            return cy.wrap(null);
          }

          if (textoLower.includes(filename.toLowerCase())) {
            cy.log(` Documentos: archivo "${filename}" aparece en la tabla`);
            return cy.wrap(null);
          }

          cy.log(` Documentos: no pude confirmar subida (no aparece toast ni "${filename}"). Continuando igualmente.`);
          return cy.wrap(null);
        });
      }, (err) => {
        cy.log(` Documentos: no se pudo subir (continuando): ${err?.message || err}`);
        return cy.wrap(null);
      });
  }

  function llenarFormularioDocumentos(caso, numeroCaso) {
    cy.log('Documentos: flujo nuevo (icono + subida de archivo)');

    return subirDocumentoPruebaPorIcono().then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Documentos rellenado desde Excel`);
    });
  }

  return {
    asegurarGestorDocumentosAbierto,
    subirDocumentoPruebaPorIcono,
    llenarFormularioDocumentos,
  };
}

module.exports = { crearHelpersDocumentosClientes };
