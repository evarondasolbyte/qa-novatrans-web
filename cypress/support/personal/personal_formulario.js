function crearHelpersFormularioPersonal(config) {
  const {
    UI,
    URL_PATH,
    escapeRegex,
    normalizarId,
    normalizarEtiquetaTexto,
    normalizarTextoParaComparar,
    procesarValorAleatorio,
    escribirPorName,
    parseFechaBasicaExcel,
    CAMPOS_IGNORADOS: camposIgnoradosBase = new Set(),
    registrarResultadoAutomatico,
  } = config;

  function parseMesAnio(labelText) {
    const mesesMap = {
      enero: 0, january: 0,
      febrero: 1, february: 1,
      marzo: 2, march: 2,
      abril: 3, april: 3,
      mayo: 4, may: 4,
      junio: 5, june: 5,
      julio: 6, july: 6,
      agosto: 7, august: 7,
      septiembre: 8, september: 8,
      octubre: 9, october: 9,
      noviembre: 10, november: 10,
      diciembre: 11, december: 11,
    };
    const t = String(labelText || '').toLowerCase().trim();
    const [mesStr, anioStr] = t.split(/\s+/);
    const mes = mesesMap[mesStr];
    const anio = parseInt(anioStr, 10);
    if (mes === undefined || Number.isNaN(anio)) {
      throw new Error(`No pude parsear mes/año del label: "${labelText}"`);
    }
    return { mes, anio };
  }

  function getPopoverCalendario() {
    return cy.get('div[role="dialog"], .MuiPopover-root, .MuiPickersPopper-root')
      .filter(':visible')
      .last();
  }

  function seleccionarFechaEnPopover(anio, mesIndex, dia) {
    return getPopoverCalendario().within(() => {
      cy.get('.MuiPickersCalendarHeader-switchViewButton', { timeout: 2000 })
        .then(($btn) => {
          if ($btn && $btn.length) {
            cy.wrap($btn[0]).click({ force: true });
            cy.wait(150);
            cy.contains('button', new RegExp(`^${anio}$`), { timeout: 5000 })
              .scrollIntoView()
              .click({ force: true });
            cy.wait(150);
          }
        }, () => cy.wrap(null));

      const stepMes = () => {
        return cy.get('.MuiPickersCalendarHeader-label', { timeout: 5000 })
          .first()
          .invoke('text')
          .then((txt) => {
            const { mes, anio: anioActual } = parseMesAnio(txt);
            if (anioActual !== anio) {
              return cy.get('.MuiPickersCalendarHeader-switchViewButton', { timeout: 2000 })
                .then(($btn) => {
                  if ($btn && $btn.length) {
                    cy.wrap($btn[0]).click({ force: true });
                    cy.wait(150);
                    cy.contains('button', new RegExp(`^${anio}$`), { timeout: 5000 })
                      .scrollIntoView()
                      .click({ force: true });
                    cy.wait(150);
                  }
                }, () => cy.wrap(null))
                .then(() => stepMes());
            }

            if (mes === mesIndex) return cy.wrap(null);
            const goPrev = mes > mesIndex;
            const btnSel = goPrev
              ? 'button[aria-label*="Previous month"], button[title*="Previous month"], button[aria-label*="Mes anterior"], button[title*="Mes anterior"]'
              : 'button[aria-label*="Next month"], button[title*="Next month"], button[aria-label*="Mes siguiente"], button[title*="Mes siguiente"]';
            return cy.get(btnSel, { timeout: 5000 }).first().click({ force: true }).wait(150).then(() => stepMes());
          });
      };

        return stepMes().then(() => {
          return cy.contains('button.MuiPickersDay-root:not([disabled]), button.MuiPickersDay-root, button', new RegExp(`^${dia}$`), { timeout: 5000 })
            .filter(':visible')
            .first()
            .click({ force: true });
        });
      });
  }

  function escribirFechaEnContenedor(contenedor, fechaObj) {
    const dia = fechaObj.getDate();
    const mesIndex = fechaObj.getMonth();
    const anio = fechaObj.getFullYear();

    return cy.wrap(contenedor).then(($cont) => {
      return cy.wrap($cont[0]).then(($contEl) => {
        const botonCal = $contEl.find('button[aria-label*="date"], button[aria-label*="fecha"], button[aria-label*="calendar"], button[aria-label*="Choose date"], button[aria-label*="Seleccionar fecha"], button.MuiIconButton-root')
          .filter(':visible')
          .first();

        if (botonCal.length > 0) {
          return cy.wrap(botonCal)
            .should('be.visible')
            .click({ force: true })
            .wait(500)
            .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
        }

        const contenedorPadre = $contEl.closest('.MuiFormControl-root, .MuiPickersTextField-root');
        if (contenedorPadre.length) {
          const botonPadre = contenedorPadre.find('button[aria-label*="date"], button[aria-label*="fecha"], button[aria-label*="calendar"], button.MuiIconButton-root')
            .filter(':visible')
            .first();

          if (botonPadre.length > 0) {
            return cy.wrap(botonPadre)
              .should('be.visible')
              .click({ force: true })
              .wait(500)
              .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
          }
        }

        return cy.wrap($contEl).within(() => {
          cy.get('button', { timeout: 10000 })
            .filter((_, el) => {
              const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
              const className = (el.className || '').toLowerCase();
              return (ariaLabel.includes('date') || ariaLabel.includes('fecha') || ariaLabel.includes('calendar') ||
                className.includes('muiiconbutton')) &&
                Cypress.$(el).is(':visible');
            })
            .first()
            .should('be.visible')
            .click({ force: true });
        }).wait(500).then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
      });
    });
  }

  function escribirFechaPorClickYType(etiquetaFecha, fechaTexto, tipo = null, selector = null, indiceFecha = 0) {
    const fecha = (fechaTexto || '').toString().trim();
    if (!fecha) return cy.wrap(null);

    const etiquetaLower = (etiquetaFecha || '').toString().toLowerCase();
    if (etiquetaLower.includes('nacionalidad') || etiquetaLower.includes('nationality')) {
      cy.log('Campo "Nacionalidad" no debe rellenarse como fecha, se omite');
      return cy.wrap(null);
    }

    const fechaObj = parseFechaBasicaExcel(fecha);
    cy.log(`Rellenando ${etiquetaFecha} con ${fecha} (índice ${indiceFecha})`);

    return cy.get('body').then(($body) => {
      if (etiquetaFecha && etiquetaFecha.includes('MuiPickers')) {
        const contenedores = $body.find('.MuiPickersInputBase-root, .MuiPickersSectionList-root').closest('.MuiFormControl-root, .MuiTextField-root');
        if (contenedores.length > 0) {
          return escribirFechaEnContenedor(contenedores.first(), fechaObj);
        }
      }

      let label = null;

      if (tipo || selector) {
        const textoBuscar = (tipo || selector || '').toLowerCase();
        const keywords = [];
        if (/expedici|drivinglicenseissue/i.test(textoBuscar)) {
          keywords.push(/^expedici[oó]n$/i);
        } else if (/vencim|drivinglicenseexpiry/i.test(textoBuscar) && !/expedici/i.test(textoBuscar)) {
          keywords.push(/^vencimiento$/i);
        } else if (/fecha alta|start date|alta/i.test(textoBuscar)) {
          keywords.push(/^fecha alta$/i);
        } else if (/nacim|birth/i.test(textoBuscar)) {
          keywords.push(/^nacimiento$/i);
        }

        if (keywords.length > 0) {
          const labelsEspecificos = $body.find('label').filter((_, el) => {
            const text = (el.innerText || '').trim();
            return keywords.some((keyword) => keyword.test(text)) &&
              !/nacionalidad|nationality|años nacimiento hijos/i.test(text);
          });

          if (labelsEspecificos.length > 0) {
            label = labelsEspecificos.first();
          }
        }
      }

      if (!label || !label.length) {
        const todosLabelsFecha = $body.find('label').filter((_, el) => {
          const text = (el.innerText || '').trim().toLowerCase();
          if (/nacionalidad|nationality|años nacimiento hijos/i.test(text)) return false;
          return /^(nacimiento|expedici[oó]n|vencimiento|fecha alta|fecha baja)$/i.test(text) ||
            /birth|expiration|start date|end date/i.test(text);
        });

        if (todosLabelsFecha.length > indiceFecha) {
          label = todosLabelsFecha.eq(indiceFecha);
        } else if (todosLabelsFecha.length > 0) {
          label = todosLabelsFecha.last();
        } else {
          return cy.wrap(null);
        }
      }

      const contenedorPadre = label.closest('.MuiFormControl-root, .MuiTextField-root, .MuiPickersTextField-root');
      if (contenedorPadre.length) {
        return escribirFechaEnContenedor(contenedorPadre, fechaObj);
      }

      return cy.wrap(null);
    });
  }

  function seleccionarOpcionMuiSelect(combo, valorTexto) {
    const texto = String(valorTexto || '').trim();
    if (!texto) return cy.wrap(null);

    const $combo = combo && combo.jquery ? combo : Cypress.$(combo);

    return cy.wrap($combo)
      .should('be.visible')
      .click({ force: true })
      .then(() => cy.wait(300))
      .then(() => {
        return cy.contains(
          'li[role="option"], [role="option"], .MuiMenuItem-root',
          new RegExp(escapeRegex(texto), 'i'),
          { timeout: 10000 }
        )
          .should('be.visible')
          .click({ force: true })
          .then(() => cy.wait(300));
      });
  }

  function seleccionarOpcionMaterial(selector, valor, etiqueta = '') {
    if (!valor) return cy.wrap(null);

    if (etiqueta) {
      return cy.contains('label', new RegExp(`^${escapeRegex(etiqueta)}$`, 'i'), { timeout: 10000 })
        .should('be.visible')
        .then(($label) => {
          const contenedor = $label.closest('.MuiFormControl-root, .MuiTextField-root, .MuiInputBase-root');
          if (contenedor.length) {
            const combo = contenedor.find('[role="combobox"], .MuiSelect-select').first()[0];
            if (combo) return seleccionarOpcionMuiSelect(combo, valor);
          }

          const forAttr = $label.attr('for');
          if (forAttr) {
            const selFor = forAttr.includes('.') ? `[id="${forAttr}"]` : `#${forAttr}`;
            return cy.get(selFor, { timeout: 5000 }).then(($el) => {
              if ($el && $el.length) return seleccionarOpcionMuiSelect($el[0], valor);
              return cy.wrap(null);
            });
          }
          return cy.wrap(null);
        });
    }

    if (!selector) return cy.wrap(null);
    const selectorFinal = selector.includes('.') ? `[id="${selector}"]` : selector;
    return cy.get(selectorFinal, { timeout: 10000 }).then(($el) => {
      if ($el && $el.length) return seleccionarOpcionMuiSelect($el[0], valor);
      return cy.wrap(null);
    });
  }

  function obtenerCampoFormulario(tipo, selector, etiqueta) {
    const tipoLower = String(tipo || '').toLowerCase();
    const sel = String(selector || '');

    return cy.get('body').then(($body) => {
      if (sel) {
        const candidates = [];
        if (tipoLower.includes('id')) {
          const idNorm = normalizarId(sel);
          candidates.push(idNorm.includes('.') ? `[id="${idNorm}"]` : `#${idNorm}`);
        }
        if (tipoLower.includes('name')) candidates.push(`input[name="${sel}"], textarea[name="${sel}"]`);
        if (tipoLower.includes('selector') || tipoLower.includes('query')) candidates.push(sel);
        if (!sel.startsWith('#') && !sel.startsWith('.') && !sel.startsWith('[')) {
          candidates.push(sel.includes('.') ? `[id="${sel}"]` : `#${sel}`);
          candidates.push(`input[name="${sel}"], textarea[name="${sel}"]`);
        } else {
          candidates.push(sel);
        }

        for (const c of candidates) {
          const el = $body.find(c).filter('input, textarea, select, [role="combobox"], [role="textbox"], .MuiSelect-select').first();
          if (el.length) return cy.wrap(el[0]);
        }
      }

      if (etiqueta) {
        const re = new RegExp(`^${escapeRegex(etiqueta)}$`, 'i');
        let $label = $body.find('label').filter((_, el) => re.test((el.textContent || el.innerText || '').trim())).first();
        if (!$label.length) {
          const re2 = new RegExp(escapeRegex(etiqueta), 'i');
          $label = $body.find('label').filter((_, el) => re2.test((el.textContent || el.innerText || '').trim())).first();
        }
        if ($label.length) {
          const forAttr = $label.attr('for');
          if (forAttr) {
            const selFor = forAttr.includes('.') ? `[id="${forAttr}"]` : `#${forAttr}`;
            const target = $body.find(selFor).first();
            if (target.length) return cy.wrap(target[0]);
          }
          const cont = $label.closest('.MuiFormControl-root, .MuiTextField-root, .MuiInputBase-root, .MuiPickersInputBase-root');
          if (cont.length) {
            const target = cont.find('input, textarea, select, [role="combobox"], .MuiSelect-select').not('input[type="hidden"]').first();
            if (target.length) return cy.wrap(target[0]);
          }
        }
      }

      return cy.wrap(null);
    });
  }

  function esSelectorEmpresaPrincipal(selector = '') {
    const texto = String(selector || '');
    return (
      texto.includes('idEmpresa') ||
      texto.includes('mui-component-select-client.idEmpresa') ||
      /^_r_kh_-label$/i.test(texto) ||
      /^_r_kh_$/i.test(texto)
    );
  }

  function esSelectorEstadoCivil(selector = '') {
    const texto = String(selector || '');
    return (
      texto.includes('civilStatus') ||
      texto.includes('mui-component-select-client.civilStatus') ||
      /^_r_jr_-label$/i.test(texto) ||
      /^_r_jr_$/i.test(texto)
    );
  }

  function abrirModalSeccion(seccion) {
    cy.log(`Abriendo modal de ${seccion}`);
    return cy.get('body').then(($body) => {
      const tabActiva = $body.find('[role="tab"][aria-selected="true"]').first();
      const ariaControls = tabActiva.attr('aria-controls');
      const panelActivo = ariaControls ? $body.find(`[id="${ariaControls}"]`) : $body.find('[role="tabpanel"]:not([hidden])').first();
      const $scope = (panelActivo && panelActivo.length) ? panelActivo : $body;

      const $btn = $scope
        .find('button, a')
        .filter(':visible')
        .filter((_, el) => /\+?\s*a[nñ]adir/i.test((el.innerText || el.textContent || '').trim()))
        .first();

      if ($btn.length) {
        return cy.wrap($btn[0]).scrollIntoView().click({ force: true }).then(() => esperarDrawerVisible(seccion));
      }

      return cy.contains('button, a', /\+?\s*a[nñ]adir/i, { timeout: 10000 })
        .should('be.visible')
        .scrollIntoView()
        .click({ force: true })
        .then(() => esperarDrawerVisible(seccion));
    });
  }

  function esperarDrawerVisible(seccion) {
    return cy.get('body', { timeout: 15000 }).then(($body) => {
      const hay = $body.find('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="dialog"]:visible').length > 0;
      if (hay) return cy.wrap(null);
      return cy.wait(400).then(() => cy.get('body')).then(($b2) => {
        const hay2 = $b2.find('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="dialog"]:visible').length > 0;
        if (hay2) return cy.wrap(null);
        cy.log(`No se detectó modal/drawer visible para ${seccion} (se continúa)`);
        return cy.wrap(null);
      });
    });
  }

  function guardarModalSeccion(seccion) {
    cy.log(`Guardando modal de ${seccion}`);
    return cy.get('body').then(($body) => {
      const $modal = $body.find('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="dialog"]:visible').first();
      if (!$modal.length) {
        cy.log(`No hay modal visible para ${seccion} (OK)`);
        return cy.wrap(null);
      }
      const $btn = $modal
        .find('button:visible')
        .filter((_, el) => /^Guardar$/i.test((el.textContent || el.innerText || '').trim()))
        .last();

      if ($btn.length) return cy.wrap($btn[0]).click({ force: true }).then(() => cy.wait(800));

      cy.log(`No encontré botón Guardar dentro del modal de ${seccion} (OK)`);
      return cy.wrap(null);
    });
  }

  function llenarFormularioDatosPersonalesDesdeExcel(caso, numeroCaso, guardar = true, opciones = {}) {
    const totalCampos = Number(caso?.__totalCamposExcel) || 20;
    cy.log(`Rellenando formulario de Datos Personales con ${totalCampos} campos del Excel`);

    const modoCompleto = !!opciones?.modoCompleto;
    const esCaso25 = numeroCaso === 25;
    const camposIgnoradosParaEsteCaso = esCaso25
      ? new Set(['nacionalidad', 'nationality'])
      : (modoCompleto ? new Set() : camposIgnoradosBase);

    const esCampoFechaPorEtiqueta = (txt) => {
      if (!txt) return false;
      const t = (txt || '').toString().toLowerCase();
      return (
        t.includes('fecha') ||
        t.includes('nacimiento') ||
        t.includes('expedicion') ||
        t.includes('expedición') ||
        t.includes('vencimiento') ||
        t.includes('alta') ||
        t.includes('baja') ||
        t.includes('date') ||
        t.includes('birth') ||
        /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(t.trim())
      );
    };

    const detectarErrorAplicacionYAbortar = (paso) => {
      if (numeroCaso !== 24) return cy.wrap(null);

      return cy.get('body', { timeout: 1500 }).then(($body) => {
        const txt = ($body.text() || '').toLowerCase();
        const hayAppError =
          txt.includes('application error') ||
          txt.includes('unexpected application error') ||
          txt.includes('something went wrong') ||
          txt.includes('unexpected error');

        if (hayAppError) {
          const msg = `Error de aplicacion detectado tras "${paso}" (TC${String(numeroCaso).padStart(3, '0')})`;
          throw new Error(msg);
        }

        return cy.wrap(null);
      });
    };

    const camposOtrasPestanasDireccion = [
      'client.address', 'client.city', 'client.postalCode', 'client.country', 'client.region', 'client.adressNotes',
      'address', 'city', 'postal', 'country', 'region', 'provincia', 'dirección', 'direccion',
      'adressnotes', 'addressnotes', 'notas',
    ];

    const camposOtrasPestanasEconomicos = [
      'ccc', 'cccpart1', 'cccpart2', 'cccpart3', 'cccpart4',
      'client.cccpart1', 'client.cccpart2', 'client.cccpart3', 'client.cccpart4',
      'client.cccPart1', 'client.cccPart2', 'client.cccPart3', 'client.cccPart4',
      'iban', 'ibanpart1', 'ibanpart2', 'ibanpart3', 'ibanpart4', 'ibanpart5',
      'client.ibanpart1', 'client.ibanpart2', 'client.ibanpart3', 'client.ibanpart4', 'client.ibanpart5',
      'client.ibanPart1', 'client.ibanPart2', 'client.ibanPart3', 'client.ibanPart4', 'client.ibanPart5',
      'perfil de pago', 'perfilpago', 'paymentprofileid', 'client.paymentprofileid', 'client.paymentProfileId',
      'mui-component-select-client.paymentprofileid', 'mui-component-select-client.paymentProfileId',
      'precio', 'priceperhour', 'client.priceperhour', 'client.pricePerHour',
      'cuenta contable', 'cuentacontable', 'accountingaccount', 'client.accountingaccount', 'client.accountingAccount',
      'accounting', 'client.accounting', 'clientaccounting',
      'economicnotes', 'client.economicnotes', 'client.economicNotes',
      'notas', 'client.bankAccount', 'client.iban', 'client.paymentProfile',
    ];

    const camposNormales = [];
    const camposFechas = [];
    const camposDireccion = [];
    const camposEconomicos = [];
    const camposPropietario = [];

    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = caso[`dato_${i}`];

      if (valor === null || valor === undefined || String(valor).trim() === '') continue;

      const etiquetaPreferida = normalizarEtiquetaTexto(tipo) || selector || '';
      const etiquetaNorm = normalizarTextoParaComparar(etiquetaPreferida);
      if (etiquetaNorm && camposIgnoradosParaEsteCaso.has(etiquetaNorm)) continue;

      const selectorLower = (selector || '').toLowerCase();
      const tipoLower2 = (tipo || '').toLowerCase();
      const etiquetaLower2 = etiquetaPreferida.toLowerCase();

      const esCampoDireccion = camposOtrasPestanasDireccion.some((campo) =>
        selectorLower.includes(campo.toLowerCase()) ||
        tipoLower2.includes(campo.toLowerCase()) ||
        etiquetaLower2.includes(campo.toLowerCase())
      );
      if (esCampoDireccion) {
        camposDireccion.push({ tipo, selector, valor: procesarValorAleatorio(valor), i });
        continue;
      }

      const esCampoEconomicos = camposOtrasPestanasEconomicos.some((campo) =>
        selectorLower.includes(campo.toLowerCase()) ||
        tipoLower2.includes(campo.toLowerCase()) ||
        etiquetaLower2.includes(campo.toLowerCase())
      );
      if (esCampoEconomicos) {
        camposEconomicos.push({ tipo, selector, valor: procesarValorAleatorio(valor), i });
        continue;
      }

      if (!modoCompleto) {
        const camposOtrasSecciones = [
          'formación', 'formacion', 'curso', 'centro',
          'experiencia', 'labor', 'meses',
          'asistencia', 'dias', 'días',
          'material', 'cantidad',
          'contrato', 'tipocontrato', 'motivocese', 'kmrecorridos', 'pruebameses',
          'teléfono', 'telefono', 'numero',
          'hist. telefónico', 'hist telefonico',
          'incidencia', 'incidencias',
        ];
        const esCampoOtraSeccion = camposOtrasSecciones.some((campo) =>
          selectorLower.includes(campo.toLowerCase()) ||
          tipoLower2.includes(campo.toLowerCase()) ||
          etiquetaLower2.includes(campo.toLowerCase())
        );
        if (esCampoOtraSeccion) continue;
      }

      const valorTexto = procesarValorAleatorio(valor);
      const tipoLower = (tipo || '').toLowerCase();
      const etiquetaLower = etiquetaPreferida.toLowerCase();

      const esPropietario =
        tipoLower.includes('propietario') &&
        !tipoLower.includes('código propietario') &&
        !tipoLower.includes('codigo propietario') &&
        !tipoLower.includes('nombre propietario') &&
        !selectorLower.includes('codigopropietario') &&
        !selectorLower.includes('nombrepropietario');

      if (esPropietario) {
        camposPropietario.push({ tipo, selector, valor: valorTexto, i });
        continue;
      }

      const esNacionalidad =
        tipoLower.includes('nacionalidad') ||
        selectorLower.includes('nacionalidad') ||
        etiquetaLower.includes('nacionalidad') ||
        tipoLower.includes('nationality') ||
        selectorLower.includes('nationality');

      const esAnosNacimientoHijos =
        tipoLower.includes('años nacimiento hijos') ||
        selectorLower.includes('childrenbirthyears') ||
        selectorLower.includes('children.birthyears') ||
        etiquetaLower.includes('años nacimiento hijos');

      const esIdLabelFecha =
        tipoLower.includes('id') &&
        selector &&
        (selector.includes('-label') || selector.includes('_label')) &&
        /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valorTexto).trim());

      const esFecha = !esNacionalidad && !esAnosNacimientoHijos && (
        esCampoFechaPorEtiqueta(tipo) ||
        esCampoFechaPorEtiqueta(selector) ||
        /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valorTexto).trim()) ||
        (tipoLower.includes('class') && selector && selector.includes('MuiPickers')) ||
        esIdLabelFecha
      );

      if (esFecha) camposFechas.push({ tipo, selector, valor: valorTexto, i });
      else camposNormales.push({ tipo, selector, valor: valorTexto, i });
    }

    let chain = cy.wrap(null);

    camposPropietario.forEach((campo) => {
      const { valor: valorTexto } = campo;
      chain = chain.then(() => {
        return cy.contains('label', /^Propietario$/i, { timeout: 10000 })
          .should('be.visible')
          .then(($label) => {
            const contenedor = $label.closest('.MuiFormControl-root, .MuiFormGroup-root, form, div').first();
            if (!contenedor.length) return cy.wrap(null);

            return cy.wrap(contenedor[0]).within(() => {
              const regexValor = new RegExp(escapeRegex(valorTexto), 'i');
              return cy.get('input[type="radio"]', { timeout: 5000 }).then(($radios) => {
                const radioEncontrado = Array.from($radios).find((radio) => {
                  const lbl = radio.closest('label');
                  const texto = (lbl ? lbl.innerText : '') || '';
                  return regexValor.test(texto.trim());
                });
                if (radioEncontrado) return cy.wrap(radioEncontrado).should('be.visible').check({ force: true });
                return cy.wrap(null);
              });
            });
          });
      });
    });

    camposNormales.forEach((campo) => {
      const { tipo, selector, valor: valorTexto, i } = campo;
      const tipoLower = (tipo || '').toLowerCase();
      const selectorLower = (selector || '').toLowerCase();

      chain = chain.then(() => {
        if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valorTexto).trim())) {
          const etiquetaFecha = tipo || selector || `Campo ${i}`;
          return escribirFechaPorClickYType(etiquetaFecha, valorTexto, tipo, selector);
        }

        if (tipoLower.includes('name')) {
          if (selector === 'client.code') {
            return cy.get(`input[name="${selector}"], textarea[name="${selector}"]`, { timeout: 10000 })
              .should('be.visible')
              .click({ force: true })
              .type(valorTexto, { force: true, delay: 0 })
              .then(() => detectarErrorAplicacionYAbortar('rellenar Expedicion'));
          }
          return escribirPorName(selector, valorTexto, selector).then(() => {
            const esExpedicion = selectorLower.includes('expedicion') || tipoLower.includes('expedicion');
            if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedicion');
            return cy.wrap(null);
          });
        }

        if (tipoLower.includes('id')) {
          if (esSelectorEmpresaPrincipal(selector)) {
            return seleccionarOpcionMaterial(null, String(valorTexto), 'Empresa').then(() => {
              const esExpedicion = selectorLower.includes('expedicion') || tipoLower.includes('expedicion');
              if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedicion');
              return cy.wrap(null);
            });
          }

          if (esSelectorEstadoCivil(selector)) {
            return seleccionarOpcionMaterial(null, String(valorTexto), 'Estado civil').then(() => {
              const esExpedicion = selectorLower.includes('expedicion') || tipoLower.includes('expedicion');
              if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedicion');
              return cy.wrap(null);
            });
          }

          const esIdLabelFecha =
            selector &&
            (selector.includes('-label') || selector.includes('_label')) &&
            /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valorTexto).trim());

          if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valorTexto).trim()) || esIdLabelFecha) {
            const etiquetaFecha = tipo || selector || `Campo ${i}`;
            return escribirFechaPorClickYType(etiquetaFecha, valorTexto, tipo, selector)
              .then(() => {
                const esExpedicion = selectorLower.includes('expedicion') || tipoLower.includes('expedicion');
                if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedicion');
                return cy.wrap(null);
              });
          }

          const idSinHash = selector && selector.startsWith('#') ? selector.substring(1) : selector;
          const idSelector = idSinHash && idSinHash.includes('.') ? `[id="${idSinHash}"]` : `#${idSinHash}`;

          return cy.get(idSelector, { timeout: 10000 }).then(($el) => {
            if (!$el || !$el.length) {
              throw new Error(`No se encontró elemento con ID ${idSelector}`);
            }
            return procesarElementoNormal($el[0], valorTexto, tipo, selector)
              .then(() => {
                const esExpedicion = selectorLower.includes('expedicion') || tipoLower.includes('expedicion');
                if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedicion');
                return cy.wrap(null);
              });
          });
        }

        if (selector && !selector.startsWith('#') && !selector.startsWith('.') && !selector.startsWith('[') && selector.includes('.')) {
          const selectorLower2 = selector.toLowerCase();

          if (selectorLower2.includes('catname') || tipoLower.includes('categoría laboral') || tipoLower.includes('categoria laboral')) {
            return seleccionarOpcionMaterial('', valorTexto, 'Categoría laboral');
          }

          return cy.get(`input[name="${selector}"], textarea[name="${selector}"]`, { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .type(valorTexto, { force: true, delay: 0 })
            .then(() => {
              const esExpedicion = selectorLower2.includes('expedicion') || tipoLower.includes('expedicion');
              if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedicion');
              return cy.wrap(null);
            });
        }

        if (tipoLower.includes('class') && selector && selector.includes('MuiPickers')) {
          const etiquetaFecha = tipo || selector || `Campo ${i}`;
          return escribirFechaPorClickYType(etiquetaFecha, valorTexto)
            .then(() => {
              const esExpedicion = selectorLower.includes('expedicion') || tipoLower.includes('expedicion');
              if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedicion');
              return cy.wrap(null);
            });
        }

        const etiquetaParaBuscar =
          selector && esSelectorEmpresaPrincipal(selector)
            ? null
            : tipo;

        return obtenerCampoFormulario(tipo, selector, etiquetaParaBuscar).then(($el) => {
          if (!$el || !$el.length) {
            if (selector && (selector.includes('client.') || (selector.includes('.') && !selector.startsWith('#') && !selector.startsWith('.')))) {
              return cy.get(`input[name="${selector}"], textarea[name="${selector}"]`, { timeout: 5000 })
                .should('be.visible')
                .then(($input) => {
                  const valorProcesado = procesarValorAleatorio(valorTexto);
                  return cy.wrap($input[0]).click({ force: true }).clear({ force: true }).type(valorProcesado, { force: true, delay: 0 });
                })
                .then(() => {
                  const esExpedicion = (selector || '').toLowerCase().includes('expedicion') || (tipo || '').toLowerCase().includes('expedicion');
                  if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedicion');
                  return cy.wrap(null);
                });
            }

            const selStr = String(selector || '');
            const tipoStr = String(tipo || '');
            const pareceLabel =
              /MuiFormLabel-root/i.test(selStr) ||
              /MuiFormLabel-root/i.test(tipoStr) ||
              /MuiFormLabel/i.test(selStr) ||
              /MuiFormLabel/i.test(tipoStr) ||
              /label/i.test(tipoStr);

            if (pareceLabel) return cy.wrap(null);
            cy.log(`No se encontró el campo: tipo="${tipo}", selector="${selector}". Se omite y se continúa.`);
            return cy.wrap(null);
          }

          return procesarElementoNormal($el[0], valorTexto, tipo, selector)
            .then(() => {
              const esExpedicion = selectorLower.includes('expedicion') || tipoLower.includes('expedicion');
              if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedicion');
              return cy.wrap(null);
            });
        });
      });

      function procesarElementoNormal(elemento, valor, tipoCampo, selectorCampo) {
        const $el = cy.$$(elemento);
        const tag = (elemento?.tagName || '').toLowerCase();
        const role = $el.attr('role') || '';
        const valorProcesado = procesarValorAleatorio(valor);

        if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valorProcesado).trim())) {
          const etiquetaFecha = tipoCampo || selectorCampo || '';
          return escribirFechaPorClickYType(etiquetaFecha, valor);
        }

        const elementoId = elemento.id || '';
        const selectorLowerLocal = (selectorCampo || '').toLowerCase();
        const isCombobox =
          role === 'combobox' ||
          (selectorCampo && (selectorCampo.includes('Empresa') || esSelectorEmpresaPrincipal(selectorCampo) || selectorLowerLocal.includes('civilstatus') || esSelectorEstadoCivil(selectorCampo))) ||
          esSelectorEmpresaPrincipal(elementoId) ||
          esSelectorEstadoCivil(elementoId);

        if (isCombobox) return seleccionarOpcionMuiSelect(elemento, valor);

        const tipoInput = ($el.attr('type') || '').toLowerCase();
        if (tipoInput === 'radio' || tipoInput === 'checkbox') {
          return cy.get('body').then(($body) => {
            const nameAttr = $el.attr('name');
            let $inputs = $body.find(`input[type="${tipoInput}"]`);
            if (nameAttr) $inputs = $inputs.filter(`[name="${nameAttr}"]`);

            const regexValor = new RegExp(escapeRegex(valor), 'i');
            const $candidato = $inputs.filter((_, el) => {
              const lbl = el.closest('label');
              const texto = (lbl ? lbl.innerText : '') || '';
              const value = el.value || '';
              return regexValor.test(texto.trim()) || regexValor.test(value);
            }).first();

            if ($candidato.length > 0) return cy.wrap($candidato[0]).should('be.visible').check({ force: true });
            if ($inputs.length > 0) return cy.wrap($inputs[0]).should('be.visible').check({ force: true });
            return cy.wrap(null);
          });
        }

        if (tag === 'input' || tag === 'textarea') {
          return cy.wrap(elemento).should('be.visible').click({ force: true }).type(valorProcesado, { force: true, delay: 0 });
        }

        if (tag === 'select') {
          return cy.wrap(elemento).should('be.visible').select(valorProcesado, { force: true });
        }

        return cy.wrap(elemento).should('be.visible').click({ force: true }).type(valorProcesado, { force: true, delay: 0 });
      }
    });

    let indiceFecha = 0;
    camposFechas.forEach((campo) => {
      const { tipo, selector, valor: valorTexto, i } = campo;
      const indiceActual = indiceFecha++;
      const etiquetaFecha = normalizarEtiquetaTexto(tipo) || tipo || selector || `Campo ${i}`;

      chain = chain.then(() => {
        return escribirFechaPorClickYType(etiquetaFecha, valorTexto, tipo, selector, indiceActual)
          .then(() => {
            const s = (selector || '').toLowerCase();
            const t = (tipo || '').toLowerCase();
            const esExpedicion = etiquetaFecha.toLowerCase().includes('expedicion') || s.includes('expedicion') || t.includes('expedicion');
            if (esExpedicion) return detectarErrorAplicacionYAbortar('rellenar Expedicion');
            return cy.wrap(null);
          });
      });
    });

    if (camposDireccion.length > 0) {
      chain = chain.then(() => navegarSeccionFormulario('DIRECCIÓN').then(() => cy.wait(500)));

      const mapeoLabels = {
        address: 'Dirección',
        'dirección': 'Dirección',
        direccion: 'Dirección',
        'client.address': 'Dirección',
        city: 'Ciudad',
        ciudad: 'Ciudad',
        'client.city': 'Ciudad',
        postal: 'C. Postal',
        postalcode: 'C. Postal',
        'client.postalcode': 'C. Postal',
        country: 'País',
        'país': 'País',
        pais: 'País',
        'client.country': 'País',
        region: 'Provincia',
        provincia: 'Provincia',
        'client.region': 'Provincia',
        adressnotes: 'Notas',
        addressnotes: 'Notas',
        'client.adressnotes': 'Notas',
        'client.addressnotes': 'Notas',
        notas: 'Notas',
      };

      camposDireccion.forEach((campo) => {
        const { tipo, selector, valor: valorTexto } = campo;
        const selectorLower = (selector || '').toLowerCase();
        const tipoLower = (tipo || '').toLowerCase();

        let nombreLabel = mapeoLabels[selectorLower] || mapeoLabels[tipoLower] || null;
        if (!nombreLabel) {
          if (selectorLower.includes('address') || tipoLower.includes('address') || tipoLower.includes('dirección')) nombreLabel = 'Dirección';
          else if (selectorLower.includes('city') || tipoLower.includes('city') || tipoLower.includes('ciudad')) nombreLabel = 'Ciudad';
          else if (selectorLower.includes('postal') || tipoLower.includes('postal')) nombreLabel = 'C. Postal';
          else if (selectorLower.includes('country') || tipoLower.includes('country') || tipoLower.includes('país')) nombreLabel = 'País';
          else if (selectorLower.includes('region') || tipoLower.includes('region') || tipoLower.includes('provincia')) nombreLabel = 'Provincia';
          else if (selectorLower.includes('adressnotes') || selectorLower.includes('addressnotes') || tipoLower.includes('notas')) nombreLabel = 'Notas';
        }

        chain = chain.then(() => {
          if (!nombreLabel) return cy.wrap(null);

          const valorProcesado = procesarValorAleatorio(valorTexto);
          return cy.get('body').then(($body) => {
            const $labels = $body.find('label').filter((_, el) => {
              const text = (el.innerText || '').trim();
              return new RegExp(`^${escapeRegex(nombreLabel)}$`, 'i').test(text);
            });

            if ($labels.length > 0) {
              const $label = $labels.first();
              const forAttr = $label.attr('for');
              if (forAttr) {
                const inputSelector = forAttr.includes('.') ? `[id="${forAttr}"]` : `#${forAttr}`;
                return cy.get(inputSelector, { timeout: 5000 })
                  .should('be.visible')
                  .scrollIntoView()
                  .click({ force: true })
                  .clear({ force: true })
                  .type(valorProcesado, { force: true, delay: 0 });
              }

              const contenedor = $label.closest('.MuiFormControl-root, .MuiTextField-root');
              if (contenedor.length) {
                return cy.wrap(contenedor[0]).within(() => {
                  cy.get('input, textarea', { timeout: 5000 })
                    .first()
                    .should('be.visible')
                    .scrollIntoView()
                    .click({ force: true })
                    .clear({ force: true })
                    .type(valorProcesado, { force: true, delay: 0 });
                });
              }
            }

            if (selector && (selector.includes('client.') || selector.includes('.'))) {
              return cy.get(`input[name="${selector}"], textarea[name="${selector}"]`, { timeout: 5000 })
                .should('be.visible')
                .scrollIntoView()
                .click({ force: true })
                .clear({ force: true })
                .type(valorProcesado, { force: true, delay: 0 });
            }

            return cy.wrap(null);
          });
        });
      });
    }

    if (camposEconomicos.length > 0) {
      chain = chain.then(() => navegarSeccionFormulario('DATOS ECONÓMICOS').then(() => cy.wait(500)));

      const ajustarValorParaInput = (el, valor) => {
        let v = String(valor ?? '');
        const inputMode = (el?.getAttribute && el.getAttribute('inputmode')) || '';
        const tipo = (el?.getAttribute && el.getAttribute('type')) || el?.type || '';
        const esNumerico = String(inputMode).toLowerCase() === 'numeric' || String(tipo).toLowerCase() === 'number';
        if (esNumerico) v = v.replace(/\D+/g, '');
        const maxAttr = (el?.getAttribute && el.getAttribute('maxlength')) || '';
        const maxLen = Number(maxAttr || el?.maxLength || 0);
        if (Number.isFinite(maxLen) && maxLen > 0 && v.length > maxLen) v = v.slice(0, maxLen);
        return v;
      };

      camposEconomicos.forEach((campo) => {
        const { tipo, selector, valor: valorTexto, i } = campo;
        const valorProcesado = procesarValorAleatorio(valorTexto);

        chain = chain.then(() => {
          const esCombobox = selector && (selector.includes('paymentProfileId') || selector.includes('mui-component-select-client.paymentProfileId'));
          if (esCombobox) {
            return cy.contains('label', /^Perfil de pago$/i, { timeout: 10000 })
              .should('be.visible')
              .then(($label) => {
                const contenedor = $label.closest('.MuiFormControl-root, .MuiTextField-root, .MuiInputBase-root');
                if (contenedor.length) {
                  const combobox = contenedor.find('[role="combobox"], div[role="combobox"], .MuiSelect-select').first()[0];
                  if (combobox) return seleccionarOpcionMuiSelect(combobox, valorProcesado);
                }
                return cy.wrap(null);
              });
          }

          if (selector && (selector.includes('client.') || selector.includes('.'))) {
            return cy.get(`input[name="${selector}"], textarea[name="${selector}"]`, { timeout: 10000 })
              .should('be.visible')
              .then(($el) => {
                const el = $el[0];
                const v = ajustarValorParaInput(el, valorProcesado);
                return cy.wrap(el).click({ force: true }).clear({ force: true }).type(v, { force: true, delay: 0 });
              });
          }

          const etiquetaParaBuscar = normalizarEtiquetaTexto(tipo) || selector || `Campo ${i}`;
          return obtenerCampoFormulario(tipo, selector, etiquetaParaBuscar).then(($el) => {
            if (!$el || !$el.length) return cy.wrap(null);
            const elemento = $el[0];
            const tag = (elemento?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea') {
              const v = ajustarValorParaInput(elemento, valorProcesado);
              return cy.wrap(elemento)
                .should('be.visible')
                .scrollIntoView()
                .click({ force: true })
                .clear({ force: true })
                .type(v, { force: true, delay: 0 });
            }
            return cy.wrap(null);
          });
        });
      });
    }

    if (guardar) {
      chain = chain.then(() => {
        return cy.contains('button, [type="submit"]', /(Guardar|Save)/i, { timeout: 10000 })
          .should('be.visible')
          .scrollIntoView()
          .click({ force: true })
          .then(() => cy.wait(1500));
      });
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(
        `${etiquetaCaso}Formulario completado: ${camposNormales.length} campos normales, ${camposFechas.length} fechas, ` +
        `${camposDireccion.length} campos DIRECCIÓN, ${camposEconomicos.length} campos DATOS ECONÓMICOS`
      );
    });
  }

  function llenarFormularioSeccion(caso, numeroCaso, seccion) {
    const totalCampos = Number(caso?.__totalCamposExcel) || 14;
    cy.log(`Rellenando formulario de ${seccion} con ${totalCampos} campos del Excel`);

    const esFormacion = seccion && (seccion.toLowerCase().includes('formación') || seccion.toLowerCase().includes('formacion'));
    const esExperiencia = seccion && seccion.toLowerCase().includes('experiencia');
    const esAsistencia = seccion && seccion.toLowerCase().includes('asistencia');
    const esMaterial = seccion && seccion.toLowerCase().includes('material');
    const esContratos = seccion && seccion.toLowerCase().includes('contrato');
    const esHistTelefonico = seccion && (seccion.toLowerCase().includes('hist. telefónico') || seccion.toLowerCase().includes('hist telefonico') || seccion.toLowerCase().includes('hist.telefónico'));
    const esTelefonos = seccion && (seccion.toLowerCase().includes('teléfono') || seccion.toLowerCase().includes('telefono')) && !seccion.toLowerCase().includes('hist');
    const esIncidencia = seccion && (seccion.toLowerCase().includes('incidencia') || seccion.toLowerCase().includes('incidencias'));
    let chain = cy.wrap(null);

    // Manejo específico para ASISTENCIA: Nombre (desplegable), Inicio y Fin (calendario), Días y Notas (texto)
    if (esAsistencia) {
      let nombreValor = null;
      let inicioValor = null;
      let finValor = null;
      let diasValor = null;
      let notasValor = null;

      // Buscar los valores en el Excel
      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        // Identificar qué campo es según el selector, tipo o formato del valor
        // Nombre: puede venir por ID (_r_bu_, _r_jn_) o por name
        if (!nombreValor && (selector.includes('_r_bu_') || selector.includes('_r_jn_') || selector.includes('nombre') || tipo.includes('nombre'))) {
          nombreValor = valor;
        }
        // Inicio: puede venir por ID (_r_c1_, _r_jq_) o por name o por tipo
        else if (!inicioValor && (selector.includes('_r_c1_') || selector.includes('_r_jq_') || selector.includes('inicio') || tipo.includes('inicio'))) {
          inicioValor = valor;
        }
        // Fin: puede venir por ID (_r_c2_, _r_jt_) o por name o por tipo
        else if (!finValor && (selector.includes('_r_c2_') || selector.includes('_r_jt_') || selector.includes('fin') || tipo.includes('fin'))) {
          finValor = valor;
        }
        // Días: por name
        else if (!diasValor && (selector.includes('dias') || selector.includes('días') || tipo.includes('dias') || tipo.includes('días'))) {
          diasValor = valor;
        }
        // Notas: por name
        else if (!notasValor && (selector.includes('notas') || tipo.includes('notas'))) {
          notasValor = valor;
        }
      }

      // Rellenar Nombre (desplegable/autocomplete) - buscar por ID _r_jn_ o por name
      if (nombreValor) {
        const nombreTexto = procesarValorAleatorio(nombreValor);
        chain = chain.then(() => {
          return cy.get('body').then(($body) => {
            // Intentar primero por ID _r_jn_ (ID real del HTML)
            const inputPorId = $body.find('input#_r_jn_').first();
            if (inputPorId.length) {
              return seleccionarOpcionMuiSelect(inputPorId, nombreTexto);
            }
            // Intentar por ID _r_bu_ (del Excel)
            const inputPorId2 = $body.find('input#_r_bu_').first();
            if (inputPorId2.length) {
              return seleccionarOpcionMuiSelect(inputPorId2, nombreTexto);
            }
            // Fallback: buscar por name o por label
            const inputPorName = $body.find('input[name="Nombre"]').first();
            if (inputPorName.length) {
              return seleccionarOpcionMuiSelect(inputPorName, nombreTexto);
            }
            // Buscar por label "Nombre"
            const labelNombre = $body.find('label').filter((_, el) => /^nombre$/i.test((el.innerText || '').trim())).first();
            if (labelNombre.length) {
              const forAttr = labelNombre.attr('for');
              if (forAttr) {
                const inputPorFor = $body.find(`input#${forAttr}`).first();
                if (inputPorFor.length) {
                  return seleccionarOpcionMuiSelect(inputPorFor, nombreTexto);
                }
              }
            }
            return cy.wrap(null);
          });
        });
      }

      // Rellenar Inicio (calendario) - buscar por label "Inicio" y luego el botón del calendario
      if (inicioValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(inicioValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          return cy.get('body').then(($body) => {
            // Buscar por label "Inicio"
            const labelInicio = $body.find('label').filter((_, el) => /^inicio$/i.test((el.innerText || '').trim())).first();
            if (labelInicio.length) {
              const contenedor = Cypress.$(labelInicio).closest('.MuiFormControl-root').parent();
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
              }
            }
            // Intentar por ID _r_jq_ (ID real del input oculto)
            const inputPorId = $body.find('input#_r_jq_').first();
            if (inputPorId.length) {
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root, .MuiFormControl-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
              }
            }
            // Fallback: buscar todos los botones "Choose date" y usar el primero (Inicio)
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .first()
              .scrollIntoView()
              .click({ force: true })
              .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
          });
        });
      }

      // Rellenar Fin (calendario) - buscar por label "Fin" y luego el botón del calendario
      if (finValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(finValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          return cy.get('body').then(($body) => {
            // Buscar por label "Fin"
            const labelFin = $body.find('label').filter((_, el) => /^fin$/i.test((el.innerText || '').trim())).first();
            if (labelFin.length) {
              const contenedor = Cypress.$(labelFin).closest('.MuiFormControl-root').parent();
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
              }
            }
            // Intentar por ID _r_jt_ (ID real del input oculto)
            const inputPorId = $body.find('input#_r_jt_').first();
            if (inputPorId.length) {
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root, .MuiFormControl-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
              }
            }
            // Fallback: buscar todos los botones "Choose date" y usar el segundo (Fin)
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .eq(1)
              .scrollIntoView()
              .click({ force: true })
              .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
          });
        });
      }

      // Rellenar Días
      if (diasValor) {
        const diasTexto = procesarValorAleatorio(diasValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="Dias"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(diasTexto, { force: true, delay: 0 });
        });
      }

      // Rellenar Notas
      if (notasValor) {
        const notasTexto = procesarValorAleatorio(notasValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="Notas"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(notasTexto, { force: true, delay: 0 });
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Manejo específico para EXPERIENCIA: rellenar campos por nombre (Empresa, Labor, Meses, Motivo cese)
    if (esExperiencia) {
      let empresaValor = null;
      let laborValor = null;
      let mesesValor = null;
      let motivoCeseValor = null;

      // Buscar los valores en el Excel
      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        // Identificar qué campo es según el selector o tipo
        if (!empresaValor && (selector.includes('empresa') || tipo.includes('empresa'))) {
          empresaValor = valor;
        } else if (!laborValor && (selector.includes('labor') || tipo.includes('labor'))) {
          laborValor = valor;
        } else if (!mesesValor && (selector.includes('meses') || tipo.includes('meses'))) {
          mesesValor = valor;
        } else if (!motivoCeseValor && (selector.includes('motivo') || selector.includes('cese') || tipo.includes('motivo') || tipo.includes('cese'))) {
          motivoCeseValor = valor;
        }
      }

      // Rellenar Empresa
      if (empresaValor) {
        const empresaTexto = procesarValorAleatorio(empresaValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="Empresa"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(empresaTexto, { force: true, delay: 0 });
        });
      }

      // Rellenar Labor
      if (laborValor) {
        const laborTexto = procesarValorAleatorio(laborValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="Labor"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(laborTexto, { force: true, delay: 0 });
        });
      }

      // Rellenar Meses
      if (mesesValor) {
        const mesesTexto = procesarValorAleatorio(mesesValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="Meses"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(mesesTexto, { force: true, delay: 0 });
        });
      }

      // Rellenar Motivo cese (el name es "MotivoCese" en camelCase)
      if (motivoCeseValor) {
        const motivoCeseTexto = procesarValorAleatorio(motivoCeseValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="MotivoCese"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(motivoCeseTexto, { force: true, delay: 0 });
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Manejo específico para FORMACIÓN: obtener valores del Excel y rellenar Fecha -> Curso -> Horas
    if (esFormacion) {
      let fechaValor = null;
      let cursoValor = null;
      let horasValor = null;

      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];
        if (valor === undefined || valor === null || valor === '') continue;

        // FECHA: a veces viene solo como "DD/MM/YYYY" (tipo id / selector raro). Detectar por formato también.
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());
        if (!fechaValor && (tipo.includes('fecha') || selector.includes('fecha') || selector.includes('date') || esFormatoFecha)) {
          fechaValor = valor;
          continue;
        }
        if (!cursoValor && (tipo.includes('curso') || selector.includes('curso'))) {
          cursoValor = valor;
          continue;
        }
        if (!horasValor && (tipo.includes('hora') || selector.includes('hora'))) {
          horasValor = valor;
          continue;
        }
      }

      if (fechaValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(fechaValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();

          // Intento 1: calendario clásico
          return cy.get('body').then(($body) => {
            const $btn = $body.find('button[aria-label="Choose date"]').filter(':visible').first();
            if ($btn.length) {
              return cy.wrap($btn[0])
                .scrollIntoView()
                .click({ force: true })
                .then(() => seleccionarFechaEnPopover(anio, mesIndex, dia));
            }

            // Intento 2 (fallback): usar el helper de fechas por label "Fecha"
            cy.log('No se encontró botón "Choose date" en Formación. Fallback: escribirFechaPorClickYType("Fecha")');
            return escribirFechaPorClickYType('Fecha', String(fechaValor));
          });
        });
      }

      if (cursoValor) {
        const cursoTexto = procesarValorAleatorio(cursoValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="Curso"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(cursoTexto, { force: true, delay: 0 });
        });
      }

      if (horasValor) {
        const horasTexto = procesarValorAleatorio(horasValor);
        chain = chain.then(() => {
          return cy
            .get('input[name="Horas"]', { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(horasTexto, { force: true, delay: 0 });
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Manejo específico para MATERIAL: Fecha, Material, Cantidad, Notas
    if (esMaterial) {
      let fechaValor = null;
      let materialValor = null;
      let cantidadValor = null;
      let notasValor = null;

      // Buscar los valores en el Excel
      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        // Identificar qué campo es según el selector, tipo o formato del valor
        if (!fechaValor && (tipo.includes('fecha') || selector.includes('fecha') || selector.includes('date') || /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim()))) {
          fechaValor = valor;
        } else if (!materialValor && (selector.includes('material') || tipo.includes('material'))) {
          materialValor = valor;
        } else if (!cantidadValor && (selector.includes('cantidad') || tipo.includes('cantidad'))) {
          cantidadValor = valor;
        } else if (!notasValor && (selector.includes('notas') || tipo.includes('notas'))) {
          notasValor = valor;
        }
      }

      // Rellenar Fecha usando el calendario (date picker)
      if (fechaValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(fechaValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Fecha en Material: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Buscar el label "Fecha" en el modal de Material
            const labelFecha = $body.find('label').filter((_, el) => {
              const texto = (el.innerText || '').trim();
              return /^fecha$/i.test(texto);
            }).first();

            if (labelFecha.length) {
              cy.log('Label "Fecha" encontrado, buscando botón del calendario');
              // Buscar el contenedor del date picker (MuiPickersTextField-root)
              const contenedorFecha = Cypress.$(labelFecha).closest('.MuiFormControl-root').next('.MuiPickersTextField-root, .MuiFormControl-root').first();
              if (!contenedorFecha.length) {
                // Si no está en next, buscar en el mismo contenedor padre
                const contenedorPadre = Cypress.$(labelFecha).closest('.MuiFormControl-root').parent();
                const contenedorFecha2 = contenedorPadre.find('.MuiPickersTextField-root').first();
                if (contenedorFecha2.length) {
                  const btnCal = contenedorFecha2.find('button[aria-label="Choose date"]').first();
                  if (btnCal.length) {
                    return cy.wrap(btnCal[0])
                      .scrollIntoView()
                      .should('be.visible')
                      .click({ force: true })
                      .then(() => {
                        cy.wait(500);
                        return seleccionarFechaEnPopover(anio, mesIndex, dia);
                      });
                  }
                }
              } else {
                const btnCal = contenedorFecha.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .should('be.visible')
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Buscar el input oculto del date picker (tiene id que empieza con _r_ y está dentro de MuiPickersTextField-root)
            const inputFecha = $body.find('.MuiPickersTextField-root input[aria-hidden="true"][tabindex="-1"]').first();
            if (inputFecha.length) {
              cy.log('Input del date picker encontrado, buscando botón del calendario');
              const contenedor = Cypress.$(inputFecha).closest('.MuiPickersTextField-root, .MuiFormControl-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .should('be.visible')
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Fallback: buscar el primer botón "Choose date" visible en el modal
            cy.log('Buscando botón "Choose date" como fallback');
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .first()
              .scrollIntoView()
              .should('be.visible')
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          });
        });
      }

      // Rellenar Material escribiendo en el input
      if (materialValor) {
        const materialTexto = procesarValorAleatorio(materialValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Material escribiendo: "${materialTexto}"`);
          return cy
            .get('input[name="Material"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(materialTexto, { force: true, delay: 0 })
            .should('have.value', materialTexto);
        });
      }

      // Rellenar Cantidad escribiendo en el input
      if (cantidadValor) {
        const cantidadTexto = procesarValorAleatorio(cantidadValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Cantidad escribiendo: "${cantidadTexto}"`);
          return cy
            .get('input[name="Cantidad"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(cantidadTexto, { force: true, delay: 0 })
            .should('have.value', cantidadTexto);
        });
      }

      // Rellenar Notas escribiendo en el input
      if (notasValor) {
        const notasTexto = procesarValorAleatorio(notasValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Notas escribiendo: "${notasTexto}"`);
          return cy.get('body').then(($body) => {
            const $inputNotas = $body.find('input[name="Notas"], textarea[name="Notas"]').filter(':visible').first();
            if (!$inputNotas.length) {
              cy.log('Campo "Notas" ya no existe en Material, se omite');
              return cy.wrap(null);
            }

            return cy
              .wrap($inputNotas[0])
              .scrollIntoView()
              .click({ force: true })
              .clear({ force: true })
              .type(notasTexto, { force: true, delay: 0 })
              .should('have.value', notasTexto);
          });
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Manejo específico para CONTRATOS: Fecha alta, Fecha fin, Tipo de contrato, Motivo cese, Km recorridos, Meses prueba
    if (esContratos) {
      let fechaAltaValor = null;
      let fechaFinValor = null;
      let tipoContratoValor = null;
      let motivoCeseValor = null;
      let kmRecorridosValor = null;
      let mesesPruebaValor = null;

      // Buscar los valores en el Excel
      cy.log(`Buscando valores en Excel para CONTRATOS (totalCampos: ${totalCampos})`);

      // Detectar fechas primero (pueden tener selectores genéricos como "r_dr", "r_ds_")
      const fechasEncontradas = [];

      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        cy.log(`Campo ${i}: tipo="${tipo}", selector="${selector}", valor="${valor}"`);

        // Detectar fechas por formato (DD/MM/YYYY, DD-MM-YYYY, etc.)
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());

        if (esFormatoFecha && tipo === 'id') {
          // Si es una fecha con tipo "id", guardarla para asignar después
          fechasEncontradas.push({ valor, selector, indice: i });
        }
      }

      // Asignar fechas: la primera es Fecha alta, la segunda es Fecha fin
      if (fechasEncontradas.length > 0 && !fechaAltaValor) {
        fechaAltaValor = fechasEncontradas[0].valor;
        cy.log(`✓ Fecha alta detectada (por formato): ${fechaAltaValor}`);
      }
      if (fechasEncontradas.length > 1 && !fechaFinValor) {
        fechaFinValor = fechasEncontradas[1].valor;
        cy.log(`✓ Fecha fin detectada (por formato): ${fechaFinValor}`);
      }

      // Ahora buscar los demás campos
      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        // Si ya es una fecha detectada, saltarla
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());
        if (esFormatoFecha && tipo === 'id') continue;

        // Identificar qué campo es según el selector, tipo o formato del valor
        if (!fechaAltaValor && (
          tipo.includes('fecha alta') ||
          selector.includes('fecha alta') ||
          selector.includes('fechaalta') ||
          (tipo.includes('fecha') && selector.includes('alta'))
        )) {
          fechaAltaValor = valor;
          cy.log(`✓ Fecha alta detectada: ${valor}`);
        } else if (!fechaFinValor && (
          tipo.includes('fecha fin') ||
          selector.includes('fecha fin') ||
          selector.includes('fechafin') ||
          (tipo.includes('fecha') && selector.includes('fin'))
        )) {
          fechaFinValor = valor;
          cy.log(`✓ Fecha fin detectada: ${valor}`);
        } else if (!tipoContratoValor && (selector.includes('tipocontrato') || selector.includes('tipo contrato') || tipo.includes('tipo de contrato') || tipo.includes('tipo contrato'))) {
          tipoContratoValor = valor;
        } else if (!motivoCeseValor && (selector.includes('motivocese') || selector.includes('motivo cese') || tipo.includes('motivo cese'))) {
          motivoCeseValor = valor;
        } else if (!kmRecorridosValor && (selector.includes('kmrecorridos') || selector.includes('km recorridos') || tipo.includes('km recorridos'))) {
          kmRecorridosValor = valor;
        } else if (!mesesPruebaValor && (selector.includes('pruebameses') || selector.includes('mesesprueba') || selector.includes('meses prueba') || tipo.includes('meses prueba'))) {
          mesesPruebaValor = valor;
          cy.log(`✓ Meses prueba detectado: ${valor}`);
        }
      }

      cy.log(`Valores detectados - Fecha alta: ${fechaAltaValor || 'NO'}, Fecha fin: ${fechaFinValor || 'NO'}, Tipo contrato: ${tipoContratoValor || 'NO'}, Motivo cese: ${motivoCeseValor || 'NO'}, Km recorridos: ${kmRecorridosValor || 'NO'}, Meses prueba: ${mesesPruebaValor || 'NO'}`);

      // Rellenar Fecha alta usando el calendario (date picker)
      if (fechaAltaValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(fechaAltaValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Fecha alta en Contratos: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Estrategia 1: Buscar directamente por ID del input oculto (_r_4dj_)
            const inputPorId = $body.find('input#_r_4dj_').first();
            if (inputPorId.length) {
              cy.log('Input oculto _r_4dj_ encontrado para Fecha alta');
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Estrategia 2: Buscar por label "Fecha alta"
            cy.log('Intentando buscar Fecha alta por label...');
            const labelFechaAlta = $body.find('label').filter((_, el) => /^fecha alta$/i.test((el.innerText || '').trim())).first();
            if (labelFechaAlta.length) {
              const contenedorPadre = Cypress.$(labelFechaAlta).closest('.MuiFormControl-root');
              const datePickerContainer = contenedorPadre.find('.MuiPickersTextField-root').first();
              if (datePickerContainer.length) {
                const btnCal = datePickerContainer.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Estrategia 3: Fallback - primer botón "Choose date"
            cy.log('Usando fallback: primer botón Choose date');
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .first()
              .scrollIntoView()
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          });
        });
      }

      // Rellenar Fecha fin usando el calendario (date picker)
      if (fechaFinValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(fechaFinValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Fecha fin en Contratos: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Estrategia 1: Buscar directamente por ID del input oculto (_r_4dm_)
            const inputPorId = $body.find('input#_r_4dm_').first();
            if (inputPorId.length) {
              cy.log('Input oculto _r_4dm_ encontrado para Fecha fin');
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Estrategia 2: Buscar por label "Fecha fin"
            cy.log('Intentando buscar Fecha fin por label...');
            const labelFechaFin = $body.find('label').filter((_, el) => /^fecha fin$/i.test((el.innerText || '').trim())).first();
            if (labelFechaFin.length) {
              const contenedorPadre = Cypress.$(labelFechaFin).closest('.MuiFormControl-root');
              const datePickerContainer = contenedorPadre.find('.MuiPickersTextField-root').first();
              if (datePickerContainer.length) {
                const btnCal = datePickerContainer.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Estrategia 3: Fallback - segundo botón "Choose date" (después de Fecha alta)
            cy.log('Usando fallback: segundo botón Choose date');
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .eq(1)
              .scrollIntoView()
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          });
        });
      }

      // Rellenar Tipo de contrato escribiendo en el input
      if (tipoContratoValor) {
        const tipoContratoTexto = procesarValorAleatorio(tipoContratoValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Tipo de contrato escribiendo: "${tipoContratoTexto}"`);
          return cy
            .get('input[name="TipoContrato"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(tipoContratoTexto, { force: true, delay: 0 })
            .should('have.value', tipoContratoTexto);
        });
      }

      // Rellenar Motivo cese escribiendo en el input
      if (motivoCeseValor) {
        const motivoCeseTexto = procesarValorAleatorio(motivoCeseValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Motivo cese escribiendo: "${motivoCeseTexto}"`);
          return cy
            .get('input[name="MotivoCese"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(motivoCeseTexto, { force: true, delay: 0 })
            .should('have.value', motivoCeseTexto);
        });
      }

      // Rellenar Km recorridos escribiendo en el input
      if (kmRecorridosValor) {
        const kmRecorridosTexto = procesarValorAleatorio(kmRecorridosValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Km recorridos escribiendo: "${kmRecorridosTexto}"`);
          return cy
            .get('input[name="KmRecorridos"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(kmRecorridosTexto, { force: true, delay: 0 })
            .should('have.value', kmRecorridosTexto);
        });
      }

      // Rellenar Meses prueba escribiendo en el input
      if (mesesPruebaValor) {
        const mesesPruebaTexto = procesarValorAleatorio(mesesPruebaValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Meses prueba escribiendo: "${mesesPruebaTexto}"`);
          return cy
            .get('input[name="PruebaMeses"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(mesesPruebaTexto, { force: true, delay: 0 })
            .should('have.value', mesesPruebaTexto);
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Manejo específico para TELÉFONOS: Teléfono, Inicio y Fin
    if (esTelefonos) {
      let telefonoValor = null;
      let inicioValor = null;
      let finValor = null;

      // Buscar los valores en el Excel
      cy.log(`Buscando valores en Excel para TELÉFONOS (totalCampos: ${totalCampos})`);

      // Detectar fechas primero (pueden tener selectores genéricos)
      const fechasEncontradas = [];

      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        cy.log(`Campo ${i}: tipo="${tipo}", selector="${selector}", valor="${valor}"`);

        // Detectar fechas por formato (DD/MM/YYYY, DD-MM-YYYY, etc.)
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());

        if (esFormatoFecha && tipo === 'id') {
          // Si es una fecha con tipo "id", guardarla para asignar después
          fechasEncontradas.push({ valor, selector, indice: i });
        }
      }

      // Asignar fechas: la primera es Inicio, la segunda es Fin
      if (fechasEncontradas.length > 0 && !inicioValor) {
        inicioValor = fechasEncontradas[0].valor;
        cy.log(` Inicio detectado (por formato): ${inicioValor}`);
      }
      if (fechasEncontradas.length > 1 && !finValor) {
        finValor = fechasEncontradas[1].valor;
        cy.log(` Fin detectado (por formato): ${finValor}`);
      }

      // Ahora buscar los demás campos
      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        // Si ya es una fecha detectada, saltarla
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());
        if (esFormatoFecha && tipo === 'id') continue;

        // Identificar qué campo es según el selector, tipo o formato del valor
        if (!telefonoValor && (
          selector.includes('numero') ||
          selector.includes('teléfono') ||
          selector.includes('telefono') ||
          tipo.includes('teléfono') ||
          tipo.includes('telefono')
        )) {
          telefonoValor = valor;
          cy.log(`✓ Teléfono detectado: ${valor}`);
        } else if (!inicioValor && (
          tipo.includes('inicio') ||
          selector.includes('inicio')
        )) {
          inicioValor = valor;
          cy.log(`✓ Inicio detectado: ${valor}`);
        } else if (!finValor && (
          tipo.includes('fin') ||
          selector.includes('fin')
        )) {
          finValor = valor;
          cy.log(`✓ Fin detectado: ${valor}`);
        }
      }

      cy.log(`Valores detectados - Teléfono: ${telefonoValor || 'NO'}, Inicio: ${inicioValor || 'NO'}, Fin: ${finValor || 'NO'}`);

      // Rellenar Teléfono usando el visor azul y seleccionando un número existente
      if (telefonoValor) {
        const telefonoTexto = procesarValorAleatorio(telefonoValor);
        chain = chain.then(() => {
          const idCasoHist = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')}` : 'TC Hist. Telefónico';
          cy.log(`Rellenando Teléfono desde visor azul con número existente: "${telefonoTexto}"`);

          return cy.get('body').then(($body) => {
            const $inputNumero = $body.find('input[name="Numero"]:visible').first();
            if (!$inputNumero.length) {
              throw new Error(`${idCasoHist}: no se encontró el input "Numero" en Hist. Telefónico`);
            }

            const $wrapper = $inputNumero.closest('.MuiTextField-root, .MuiFormControl-root').parent();
            let $botonVisor = $inputNumero
              .closest('div[style*="display: flex"], .MuiGrid-root, .MuiFormControl-root')
              .find('button:visible')
              .filter((_, el) => {
                const $el = Cypress.$(el);
                const esBotonJuntoATelefono =
                  $el.nextAll().find('input[name="Numero"]').length > 0 ||
                  $el.parent().find('input[name="Numero"]').length > 0;
                return esBotonJuntoATelefono;
              })
              .first();

            if (!$botonVisor.length) {
              $botonVisor = $wrapper
                .find('button:visible')
                .filter((_, el) => {
                  const $el = Cypress.$(el);
                  return $el.parent().find('input[name="Numero"]').length > 0;
                })
                .first();
            }

            if (!$botonVisor.length) {
              $botonVisor = $body.find('button:visible').filter((_, el) => {
                const $el = Cypress.$(el);
                const cercaNumero = $el
                  .closest('div[style*="display: flex"], .MuiGrid-root, .MuiFormControl-root')
                  .find('input[name="Numero"]').length > 0;
                return cercaNumero && ($el.hasClass('css-zlrwcm') || $el.find('svg').length > 0);
              }).first();
            }

            if (!$botonVisor.length) {
              throw new Error(`${idCasoHist}: no se encontró el botón azul/visor junto a "Numero"`);
            }

            return cy.wrap($botonVisor[0])
              .scrollIntoView()
              .click({ force: true })
              .then(() => cy.wait(500))
              .then(() => seleccionarTelefonoEnDialog({ idCaso: idCasoHist, numeroTelefono: telefonoTexto }));
          });
        });
      }

      // Rellenar Inicio usando el calendario (date picker)
      if (inicioValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(inicioValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Inicio en Teléfonos: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Estrategia 1: Buscar directamente por ID del input oculto (_r_4im_)
            const inputPorId = $body.find('input#_r_4im_').first();
            if (inputPorId.length) {
              cy.log('Input oculto _r_4im_ encontrado para Inicio');
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Estrategia 2: Buscar por label "Inicio"
            cy.log('Intentando buscar Inicio por label...');
            const labelInicio = $body.find('label').filter((_, el) => /^inicio$/i.test((el.innerText || '').trim())).first();
            if (labelInicio.length) {
              const contenedorPadre = Cypress.$(labelInicio).closest('.MuiFormControl-root');
              const datePickerContainer = contenedorPadre.find('.MuiPickersTextField-root').first();
              if (datePickerContainer.length) {
                const btnCal = datePickerContainer.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Estrategia 3: Fallback - primer botón "Choose date"
            cy.log('Usando fallback: primer botón Choose date');
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .first()
              .scrollIntoView()
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          });
        });
      }

      // Rellenar Fin usando el calendario (date picker)
      if (finValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(finValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Fin en Teléfonos: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Estrategia 1: Buscar directamente por ID del input oculto (_r_4ip_)
            const inputPorId = $body.find('input#_r_4ip_').first();
            if (inputPorId.length) {
              cy.log('Input oculto _r_4ip_ encontrado para Fin');
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Estrategia 2: Buscar por label "Fin"
            cy.log('Intentando buscar Fin por label...');
            const labelFin = $body.find('label').filter((_, el) => /^fin$/i.test((el.innerText || '').trim())).first();
            if (labelFin.length) {
              const contenedorPadre = Cypress.$(labelFin).closest('.MuiFormControl-root');
              const datePickerContainer = contenedorPadre.find('.MuiPickersTextField-root').first();
              if (datePickerContainer.length) {
                const btnCal = datePickerContainer.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Estrategia 3: Fallback - segundo botón "Choose date" (después de Inicio)
            cy.log('Usando fallback: segundo botón Choose date');
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .eq(1)
              .scrollIntoView()
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          });
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Manejo específico para HIST. TELEFÓNICO: Teléfono, Inicio y Fin (igual que TELÉFONOS)
    if (esHistTelefonico) {
      let telefonoValor = null;
      let inicioValor = null;
      let finValor = null;

      // Buscar los valores en el Excel
      cy.log(`Buscando valores en Excel para HIST. TELEFÓNICO (totalCampos: ${totalCampos})`);

      // Detectar fechas primero (pueden tener selectores genéricos)
      const fechasEncontradas = [];

      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        cy.log(`Campo ${i}: tipo="${tipo}", selector="${selector}", valor="${valor}"`);

        // Detectar fechas por formato (DD/MM/YYYY, DD-MM-YYYY, etc.)
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());

        if (esFormatoFecha && tipo === 'id') {
          // Si es una fecha con tipo "id", guardarla para asignar después
          fechasEncontradas.push({ valor, selector, indice: i });
        }
      }

      // Asignar fechas: la primera es Inicio, la segunda es Fin
      if (fechasEncontradas.length > 0 && !inicioValor) {
        inicioValor = fechasEncontradas[0].valor;
        cy.log(`✓ Inicio detectado (por formato): ${inicioValor}`);
      }
      if (fechasEncontradas.length > 1 && !finValor) {
        finValor = fechasEncontradas[1].valor;
        cy.log(`✓ Fin detectado (por formato): ${finValor}`);
      }

      // Ahora buscar los demás campos
      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        // Si ya es una fecha detectada, saltarla
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());
        if (esFormatoFecha && tipo === 'id') continue;

        // Identificar qué campo es según el selector, tipo o formato del valor
        if (!telefonoValor && (
          selector.includes('numero') ||
          selector.includes('teléfono') ||
          selector.includes('telefono') ||
          tipo.includes('teléfono') ||
          tipo.includes('telefono')
        )) {
          telefonoValor = valor;
          cy.log(`✓ Teléfono detectado: ${valor}`);
        } else if (!inicioValor && (
          tipo.includes('inicio') ||
          selector.includes('inicio')
        )) {
          inicioValor = valor;
          cy.log(`✓ Inicio detectado: ${valor}`);
        } else if (!finValor && (
          tipo.includes('fin') ||
          selector.includes('fin')
        )) {
          finValor = valor;
          cy.log(`✓ Fin detectado: ${valor}`);
        }
      }

      cy.log(`Valores detectados - Teléfono: ${telefonoValor || 'NO'}, Inicio: ${inicioValor || 'NO'}, Fin: ${finValor || 'NO'}`);

      // Seleccionar Teléfono desde el visor/tabla. Si Excel trae un número, se intenta ese.
      chain = chain.then(() => {
        const telefonoTexto = telefonoValor ? procesarValorAleatorio(telefonoValor) : null;
        const idCasoHist = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')}` : 'TC Hist. Telefónico';
        cy.log(`Hist. Telefónico: seleccionando teléfono desde visor${telefonoTexto ? ` (${telefonoTexto})` : ''}`);

        return cy.get('body').then(($body) => {
          const $inputNumero = $body.find('input[name="Numero"]:visible').first();
          if (!$inputNumero.length) {
            throw new Error(`${idCasoHist}: no se encontró el input "Numero" en Hist. Telefónico`);
          }

          let $botonVisor = $inputNumero
            .closest('div[style*="display: flex"]')
            .find('button:visible')
            .first();

          if (!$botonVisor.length) {
            $botonVisor = $inputNumero
              .closest('.sc-ctAsvE, .MuiGrid-root, .MuiFormControl-root')
              .find('button:visible')
              .first();
          }

          if (!$botonVisor.length) {
            throw new Error(`${idCasoHist}: no se encontró el botón visor junto a "Numero"`);
          }

          return cy.wrap($botonVisor[0])
            .scrollIntoView()
            .click({ force: true })
            .then(() => cy.wait(500))
            .then(() => seleccionarTelefonoEnDialog({ idCaso: idCasoHist, numeroTelefono: telefonoTexto }));
        });
      });

      // Rellenar Inicio usando el calendario (date picker)
      if (inicioValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(inicioValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Inicio en Hist. Telefónico: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Estrategia 1: Buscar directamente por ID del input oculto (_r_4im_)
            const inputPorId = $body.find('input#_r_4im_').first();
            if (inputPorId.length) {
              cy.log('Input oculto _r_4im_ encontrado para Inicio');
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Estrategia 2: Buscar por label "Inicio"
            cy.log('Intentando buscar Inicio por label...');
            const labelInicio = $body.find('label').filter((_, el) => /^inicio$/i.test((el.innerText || '').trim())).first();
            if (labelInicio.length) {
              const contenedorPadre = Cypress.$(labelInicio).closest('.MuiFormControl-root');
              const datePickerContainer = contenedorPadre.find('.MuiPickersTextField-root').first();
              if (datePickerContainer.length) {
                const btnCal = datePickerContainer.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Estrategia 3: Fallback - primer botón "Choose date"
            cy.log('Usando fallback: primer botón Choose date');
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .first()
              .scrollIntoView()
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          });
        });
      }

      // Rellenar Fin usando el calendario (date picker)
      if (finValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(finValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Fin en Hist. Telefónico: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Estrategia 1: Buscar directamente por ID del input oculto (_r_4ip_)
            const inputPorId = $body.find('input#_r_4ip_').first();
            if (inputPorId.length) {
              cy.log('Input oculto _r_4ip_ encontrado para Fin');
              const contenedor = Cypress.$(inputPorId).closest('.MuiPickersTextField-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Estrategia 2: Buscar por label "Fin"
            cy.log('Intentando buscar Fin por label...');
            const labelFin = $body.find('label').filter((_, el) => /^fin$/i.test((el.innerText || '').trim())).first();
            if (labelFin.length) {
              const contenedorPadre = Cypress.$(labelFin).closest('.MuiFormControl-root');
              const datePickerContainer = contenedorPadre.find('.MuiPickersTextField-root').first();
              if (datePickerContainer.length) {
                const btnCal = datePickerContainer.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Estrategia 3: Fallback - segundo botón "Choose date" (después de Inicio)
            cy.log('Usando fallback: segundo botón Choose date');
            return cy
              .get('button[aria-label="Choose date"]', { timeout: 10000 })
              .eq(1)
              .scrollIntoView()
              .click({ force: true })
              .then(() => {
                cy.wait(500);
                return seleccionarFechaEnPopover(anio, mesIndex, dia);
              });
          });
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Manejo específico para INCIDENCIAS: Fecha/Inicio, Incidencia y Notas
    if (esIncidencia) {
      let fechaValor = null;
      let inicioValor = null;
      let incidenciaValor = null;
      let notasValor = null;

      // Buscar los valores en el Excel
      cy.log(`Buscando valores en Excel para INCIDENCIAS (totalCampos: ${totalCampos})`);

      for (let i = 1; i <= totalCampos; i++) {
        const tipo = (caso[`etiqueta_${i}`] || '').toLowerCase();
        const selector = (caso[`valor_etiqueta_${i}`] || '').toLowerCase();
        const valor = caso[`dato_${i}`];

        if (valor === undefined || valor === null || valor === '') continue;

        cy.log(`Campo ${i}: tipo="${tipo}", selector="${selector}", valor="${valor}"`);

        // Detectar fechas por formato (DD/MM/YYYY, DD-MM-YYYY, etc.)
        const esFormatoFecha = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(String(valor).trim());

        // Identificar qué campo es según el selector, tipo o formato del valor
        // Inicio: campo obligatorio que puede venir como "inicio" o como fecha si no hay otro campo fecha
        if (!inicioValor && (
          selector.includes('inicio') ||
          tipo.includes('inicio') ||
          (tipo === 'name' && selector === 'inicio') ||
          (tipo === 'id' && selector.includes('inicio'))
        )) {
          inicioValor = valor;
          cy.log(` Inicio detectado: ${valor}`);
        }
        // Fecha: puede venir por formato de fecha o por selector/tipo "fecha"
        else if (!fechaValor && (
          esFormatoFecha ||
          tipo.includes('fecha') ||
          selector.includes('fecha') ||
          (tipo === 'name' && selector === 'fecha')
        )) {
          fechaValor = valor;
          cy.log(` Fecha detectada: ${valor}`);
        }
        // Si hay una fecha pero no hay "Inicio", usar la fecha también para "Inicio" (puede ser el mismo campo)
        else if (!inicioValor && esFormatoFecha && fechaValor) {
          inicioValor = fechaValor;
          cy.log(` Inicio se rellenará con la misma fecha: ${fechaValor}`);
        }
        // Incidencia: por selector o tipo que incluya "incidencia"
        else if (!incidenciaValor && (
          selector.includes('incidencia') ||
          tipo.includes('incidencia') ||
          (tipo === 'name' && selector === 'incidencia')
        )) {
          incidenciaValor = valor;
          cy.log(` Incidencia detectada: ${valor}`);
        }
        // Notas: por selector o tipo que incluya "notas"
        else if (!notasValor && (
          selector.includes('notas') ||
          tipo.includes('notas') ||
          (tipo === 'name' && selector === 'notas')
        )) {
          notasValor = valor;
          cy.log(` Notas detectada: ${valor}`);
        }
      }

      // Si tenemos fecha pero no inicio, usar la fecha para inicio también
      if (fechaValor && !inicioValor) {
        inicioValor = fechaValor;
        cy.log(`Inicio se rellenará con la misma fecha que Fecha: ${fechaValor}`);
      }

      cy.log(`Valores detectados - Fecha: ${fechaValor || 'NO'}, Inicio: ${inicioValor || 'NO'}, Incidencia: ${incidenciaValor || 'NO'}, Notas: ${notasValor || 'NO'}`);

      // Rellenar Fecha usando el calendario (date picker)
      if (fechaValor) {
        chain = chain.then(() => {
          const fechaObj = parseFechaBasicaExcel(fechaValor);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Fecha en Incidencias: ${dia}/${mesIndex + 1}/${anio}`);

          return cy.get('body').then(($body) => {
            // Estrategia 1: Buscar directamente por ID del input oculto (puede variar: _r_4jn_, _r_1tc_, etc.)
            // Buscar inputs ocultos que tengan IDs con patrón _r_XXX_
            const inputsOcultos = $body.find('input[type="hidden"], input[aria-hidden="true"]').filter((_, el) => {
              const id = (el.id || '').toLowerCase();
              return id.includes('_r_') && (id.includes('fecha') || id.includes('inicio') || /_r_\w{3}_/.test(id));
            });
            
            if (inputsOcultos.length) {
              cy.log(`Encontrados ${inputsOcultos.length} inputs ocultos con patrón _r_XXX_, usando el primero para Fecha/Inicio`);
              const inputPorId = Cypress.$(inputsOcultos[0]);
              const contenedor = inputPorId.closest('.MuiPickersTextField-root, .MuiFormControl-root');
              if (contenedor.length) {
                const btnCal = contenedor.find('button[aria-label="Choose date"], button[aria-label*="date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }
            
            // También buscar específicamente por _r_1tc_ (ID que aparece en el HTML del modal)
            const inputEspecifico = $body.find('input#_r_1tc_, input[id*="_r_1tc"]').first();
            if (inputEspecifico.length) {
              cy.log('Input oculto _r_1tc_ encontrado para Fecha/Inicio');
              const contenedor = Cypress.$(inputEspecifico).closest('.MuiPickersTextField-root, .MuiFormControl-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"], button[aria-label*="date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  })
                  .then(() => {
                    // IMPORTANTE: Verificar y establecer el valor en el input oculto
                    // El campo "Fecha" visible debe mapearse a "Inicio" en la BD
                    cy.wait(1000); // Esperar más tiempo para que se actualice
                    return cy.get('body').then(($b) => {
                      const inputOculto = $b.find('input#_r_1tc_, input[id*="_r_1tc"], input[aria-hidden="true"][id*="_r_"]').first();
                      if (inputOculto.length) {
                        const valor = inputOculto.val();
                        cy.log(`TC056: Valor en input oculto después de seleccionar fecha: "${valor}"`);
                        
                        // Formato ISO para la fecha: YYYY-MM-DDTHH:mm:ss
                        const fechaISO = `${anio}-${String(mesIndex + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}T00:00:00`;
                        
                        // Si el valor está vacío o no coincide, establecerlo directamente
                        if (!valor || valor === '' || !valor.includes(fechaISO.split('T')[0])) {
                          cy.log(`TC056: Estableciendo valor directamente en input oculto: ${fechaISO}`);
                          // Intentar múltiples formas de establecer el valor
                          cy.wrap(inputOculto[0])
                            .invoke('val', fechaISO)
                            .invoke('attr', 'value', fechaISO)
                            .trigger('change', { force: true })
                            .trigger('input', { force: true })
                            .trigger('blur', { force: true });
                          
                          // También intentar establecer el valor en el input visible del date picker
                          const inputVisible = contenedor.find('input[type="text"], input[contenteditable="true"]').first();
                          if (inputVisible.length) {
                            const fechaFormato = `${String(dia).padStart(2, '0')}/${String(mesIndex + 1).padStart(2, '0')}/${anio}`;
                            cy.wrap(inputVisible[0]).invoke('val', fechaFormato).trigger('change', { force: true });
                          }
                        } else {
                          cy.log(`TC056: Valor ya está establecido correctamente: "${valor}"`);
                        }
                      } else {
                        cy.log('TC056: WARNING - No se encontró input oculto para establecer el valor');
                      }
                      return cy.wrap(null);
                    });
                  });
              }
            }

            // Estrategia 2: Buscar por label "Fecha"
            cy.log('Intentando buscar Fecha por label...');
            const labelFecha = $body.find('label').filter((_, el) => /^fecha$/i.test((el.innerText || '').trim())).first();
            if (labelFecha.length) {
              const contenedorPadre = Cypress.$(labelFecha).closest('.MuiFormControl-root');
              const datePickerContainer = contenedorPadre.find('.MuiPickersTextField-root').first();
              if (datePickerContainer.length) {
                const btnCal = datePickerContainer.find('button[aria-label="Choose date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Estrategia 3: Fallback - buscar dentro del modal/drawer primero
            cy.log('Usando fallback: buscando date picker en el modal/drawer');
            return cy.get('[role="dialog"]:visible, .MuiDrawer-root:visible, .MuiModal-root:visible', { timeout: 10000 })
              .first()
              .within(() => {
                return cy
                  .get('button[aria-label="Choose date"], button[aria-label*="date"]', { timeout: 10000 })
                  .first()
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              })
              .catch(() => {
                // Si falla dentro del modal, buscar globalmente
                cy.log('Fallback global: primer botón Choose date');
                return cy
                  .get('button[aria-label="Choose date"], button[aria-label*="date"]', { timeout: 10000 })
                  .first()
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              });
          });
        });
      }

      // NOTA: "Inicio" es obligatorio en la BD pero NO hay campo visible separado
      // El campo "Fecha" visible se mapea a "Inicio" en la BD, así que ya está rellenado arriba
      // No necesitamos rellenar "Inicio" por separado si ya se rellenó "Fecha"
      // Solo intentar rellenar "Inicio" si hay un campo separado explícito
      if (inicioValor && inicioValor !== fechaValor) {
        chain = chain.then(() => {
          const valorParaInicio = inicioValor || fechaValor;
          const fechaObj = parseFechaBasicaExcel(valorParaInicio);
          const dia = fechaObj.getDate();
          const mesIndex = fechaObj.getMonth();
          const anio = fechaObj.getFullYear();
          cy.log(`Rellenando Inicio en Incidencias: ${dia}/${mesIndex + 1}/${anio} (valor: ${valorParaInicio})`);

          return cy.get('body').then(($body) => {
            // Estrategia 1: Buscar por label "Inicio" (case insensitive, puede tener espacios)
            cy.log('Intentando buscar Inicio por label...');
            const labelInicio = $body.find('label').filter((_, el) => {
              const texto = (el.innerText || el.textContent || '').trim().toLowerCase();
              return /^inicio$/i.test(texto);
            }).first();
            if (labelInicio.length) {
              const contenedorPadre = Cypress.$(labelInicio).closest('.MuiFormControl-root');
              const datePickerContainer = contenedorPadre.find('.MuiPickersTextField-root').first();
              if (datePickerContainer.length) {
                const btnCal = datePickerContainer.find('button[aria-label="Choose date"], button[aria-label*="date"]').first();
                if (btnCal.length) {
                  return cy.wrap(btnCal[0])
                    .scrollIntoView()
                    .click({ force: true })
                    .then(() => {
                      cy.wait(500);
                      return seleccionarFechaEnPopover(anio, mesIndex, dia);
                    });
                }
              }
            }

            // Estrategia 2: Buscar por name="Inicio" o id que contenga "inicio"
            cy.log('Intentando buscar Inicio por name o id...');
            const inputInicio = $body.find('input[name="Inicio"], input[name*="inicio"], input[id*="inicio"], input[id*="Inicio"]').first();
            if (inputInicio.length) {
              const contenedor = Cypress.$(inputInicio).closest('.MuiPickersTextField-root, .MuiFormControl-root');
              const btnCal = contenedor.find('button[aria-label="Choose date"], button[aria-label*="date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Estrategia 3: Buscar todos los date pickers visibles en el modal/drawer
            // Si hay más de uno, rellenar todos (Fecha e Inicio pueden ser campos separados)
            cy.log('Intentando buscar todos los date pickers en el modal...');
            const datePickers = $body.find('.MuiPickersTextField-root, .MuiDatePicker-root').filter(':visible');
            cy.log(`Encontrados ${datePickers.length} date pickers visibles`);
            
            if (datePickers.length >= 2) {
              // Si hay dos o más, rellenar el segundo (el primero ya se rellenó como Fecha)
              cy.log('Rellenando segundo date picker como Inicio...');
              const segundoDatePicker = Cypress.$(datePickers[1]);
              const btnCal = segundoDatePicker.find('button[aria-label="Choose date"], button[aria-label*="date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            } else if (datePickers.length === 1 && !fechaValor) {
              // Si solo hay uno y no se rellenó Fecha, rellenarlo como Inicio
              cy.log('Solo hay un date picker, rellenándolo como Inicio...');
              const datePicker = Cypress.$(datePickers[0]);
              const btnCal = datePicker.find('button[aria-label="Choose date"], button[aria-label*="date"]').first();
              if (btnCal.length) {
                return cy.wrap(btnCal[0])
                  .scrollIntoView()
                  .click({ force: true })
                  .then(() => {
                    cy.wait(500);
                    return seleccionarFechaEnPopover(anio, mesIndex, dia);
                  });
              }
            }

            // Estrategia 4: Si ya se rellenó Fecha y no se encontró Inicio separado, 
            // puede que Inicio sea el mismo campo que Fecha, así que no hacer nada
            if (fechaValor) {
              cy.log('No se encontró campo Inicio separado, puede que sea el mismo que Fecha (ya rellenado)');
            } else {
              cy.log('WARNING: No se pudo encontrar campo Inicio para rellenar');
            }
            return cy.wrap(null);
          });
        });
      }

      // Rellenar Incidencia escribiendo en el input
      if (incidenciaValor) {
        const incidenciaTexto = procesarValorAleatorio(incidenciaValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Incidencia escribiendo: "${incidenciaTexto}"`);
          return cy
            .get('input[name="Incidencia"]', { timeout: 10000 })
            .should('be.visible')
            .scrollIntoView()
            .click({ force: true })
            .clear({ force: true })
            .type(incidenciaTexto, { force: true, delay: 0 })
            .should('have.value', incidenciaTexto);
        });
      }

      // Rellenar Notas escribiendo en el input
      if (notasValor) {
        const notasTexto = procesarValorAleatorio(notasValor);
        chain = chain.then(() => {
          cy.log(`Rellenando Notas escribiendo: "${notasTexto}"`);
          return cy.get('body').then(($body) => {
            const $inputNotas = $body.find('input[name="Notas"], textarea[name="Notas"]').filter(':visible').first();
            if (!$inputNotas.length) {
              cy.log('Campo "Notas" ya no existe en Incidencias, se omite');
              return cy.wrap(null);
            }

            return cy
              .wrap($inputNotas[0])
              .scrollIntoView()
              .click({ force: true })
              .clear({ force: true })
              .type(notasTexto, { force: true, delay: 0 })
              .should('have.value', notasTexto);
          });
        });
      }

      chain = chain.then(() => {
        // Priorizar el botón "Guardar" interno del formulario (clase css-1b9fx3e)
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy
              .wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }
          // Fallback: último botón visible con texto Guardar dentro del formulario
          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      });

      return chain.then(() => {
        const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
        cy.log(`${etiquetaCaso}Formulario ${seccion} rellenado desde Excel`);
      });
    }

    // Recorrer todos los datos del Excel y rellenar los campos (flujo general)
    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = caso[`dato_${i}`];

      if (!valor || valor === '' || valor === undefined) {
        continue;
      }

      // Si hay un selector específico (name, id, etc.), usarlo
      if (selector && tipo) {
        const tipoLower = (tipo || '').toLowerCase();
        const valorTexto = procesarValorAleatorio(valor);

        chain = chain.then(() => {
          // Si el selector es un name attribute, usarlo directamente
          if (tipoLower.includes('name')) {
            return escribirPorName(selector, valorTexto, `Campo ${i}`);
          }

          // Si es un id, buscar por id
          if (tipoLower.includes('id')) {
            const idSelector = selector.startsWith('#') ? selector : `#${selector}`;
            return cy.get(idSelector, { timeout: 5000 })
              .should('be.visible')
              .scrollIntoView()
              .clear({ force: true })
              .type(valorTexto, { force: true, delay: 0 })
              .should('have.value', valorTexto);
          }

          // Intentar buscar por selector genérico
          return cy.get(selector, { timeout: 5000 })
            .should('be.visible')
            .scrollIntoView()
            .clear({ force: true })
            .type(valorTexto, { force: true, delay: 0 })
            .should('have.value', valorTexto);
        });
      } else {
        // Si no hay selector, intentar buscar por etiqueta
        const etiqueta = normalizarEtiquetaTexto(tipo);
        if (etiqueta) {
          chain = chain.then(() => {
            return obtenerCampoFormulario(tipo, '', etiqueta)
              .then(($el) => {
                if ($el && $el.length) {
                  const valorTexto = procesarValorAleatorio(valor);
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



  function llenarCamposFormulario(caso) {
    const totalCampos = Number(caso?.__totalCamposExcel) || 14;
    const campos = [];

    for (let i = 1; i <= totalCampos; i++) {
      const tipo = caso[`etiqueta_${i}`];
      const selector = caso[`valor_etiqueta_${i}`];
      const valor = caso[`dato_${i}`];
      if (!tipo || !selector || valor === undefined || valor === '') continue;

      const etiquetaPreferida = normalizarEtiquetaTexto(tipo) || selector;
      const etiquetaNormalizada = normalizarTextoParaComparar(etiquetaPreferida);
      if (etiquetaNormalizada && camposIgnoradosBase.has(etiquetaNormalizada)) continue;

      campos.push({ tipo, selector, valor, etiquetaVisible: etiquetaPreferida });
    }

    if (campos.length === 0) {
      cy.log('Caso sin datos para completar el formulario');
      return cy.wrap(null);
    }

    const completarCampo = (index = 0) => {
      if (index >= campos.length) return cy.wrap(null);

      const campo = campos[index];
      const valorTexto = procesarValorAleatorio(campo.valor) || '';

      if (campo.selector && esSelectorEmpresaPrincipal(campo.selector)) {
        cy.log(`Haciendo click en Empresa y seleccionando: "${valorTexto}"`);
        return seleccionarOpcionMaterial(
          null,
          valorTexto.toString(),
          'Empresa'
        ).then(
          () => completarCampo(index + 1),
          () => {
            cy.log(`No se pudo seleccionar "${valorTexto}" en Empresa (se continúa)`);
            return completarCampo(index + 1);
          }
        );
      }

      const etiquetaParaBuscar = campo.etiquetaVisible || campo.selector;

      return obtenerCampoFormulario(campo.tipo, campo.selector, etiquetaParaBuscar)
        .then(($elemento) => {
          if (!$elemento) return null;
          const el = $elemento.length ? $elemento[0] : $elemento;
          if (!el) return null;

          const tag = (el.tagName || '').toLowerCase();
          const tipoInput = (el.type || '').toLowerCase();

          if (tipoInput === 'checkbox' || tipoInput === 'radio') {
            return cy.wrap(el).check({ force: true }).then(() => null);
          }

          const role = (el.getAttribute && el.getAttribute('role')) ? el.getAttribute('role') : '';
          if (String(role).toLowerCase() === 'combobox') {
            return seleccionarOpcionMuiSelect(el, valorTexto).then(() => null);
          }

          if (tag === 'input' || tag === 'textarea') {
            return cy
              .wrap(el)
              .should('be.visible')
              .click({ force: true })
              .clear({ force: true })
              .type(String(valorTexto), { force: true, delay: 0 })
              .blur({ force: true })
              .then(() => null);
          }

          if (tag === 'select') {
            return cy.wrap(el).select(String(valorTexto), { force: true }).then(() => null);
          }

          return cy.wrap(el).click({ force: true }).type(String(valorTexto), { force: true, delay: 0 }).then(() => null);
        })
        .then(() => completarCampo(index + 1));
    };

    return completarCampo(0);
  }

  function abrirFormularioNuevoPersonal() {
    const regexNuevo = /(\+?\s*(Nuevo|New|Nou)\s*$)|(\+?\s*(A[ñn]adir|Add|Afegir)\s*$)/i;

    const asegurarFormularioCargado = () => {
      return cy.get('body', { timeout: 15000 }).then(($body) => {
        const hayTabs = $body.find('[role="tablist"]').length > 0;
        const haySubmit = $body.find('button[type="submit"], [type="submit"]').length > 0;
        const hayInputs = $body.find('input, textarea, [role="textbox"]').filter(':visible').length > 0;
        if (hayTabs || haySubmit || hayInputs) return cy.wrap(null);
        return cy.wait(800);
      });
    };

    const yaEstamosEnFormulario = () => {
      return cy.url().then((url) => {
        if (url.includes('/dashboard/personnel/form')) return cy.wrap(true);
        return cy.get('body').then(($body) => {
          const hayTituloFormulario =
            $body.find('*').filter((_, el) => /nuevo personal|editar personal|new personnel|edit personnel|nou personal/i.test((el.textContent || ''))).length > 0;
          const hayTabsFormulario = $body.find('[role="tablist"]').length > 0;
          const hayBotonCancelar = $body.find('button').filter((_, el) => /cancelar|cancel|close|tancar/i.test((el.textContent || '').trim())).length > 0;
          const hayBotonGuardar = $body.find('button').filter((_, el) => /guardar|save|desar/i.test((el.textContent || '').trim())).length > 0;
          return cy.wrap(!!(hayTituloFormulario && hayTabsFormulario && hayBotonCancelar && hayBotonGuardar));
        });
      });
    };

    const intentarAbrir = (intento = 0) => {
      const maxIntentos = 3;

      cy.log(`Intento ${intento + 1}/${maxIntentos}: abrir formulario con "+ Nuevo / Añadir"...`);

      return cy.get('body').then(($body) => {
        try {
          if ($body.find('[role="dialog"]:visible, .MuiPopover-root:visible, .MuiModal-root:visible').length) {
            cy.log('Overlay detectado, intentando cerrarlo con ESC...');
            cy.get('body').type('{esc}', { force: true });
            cy.wait(300);
          }
        } catch (e) {
        }

        const $candidatos = $body
          .find('button, a')
          .filter(':visible')
          .filter((_, el) => regexNuevo.test((el.innerText || el.textContent || '').trim()));

        if ($candidatos.length) {
          return cy.wrap($candidatos.last())
            .scrollIntoView()
            .click({ force: true })
            .then(() => cy.wait(700));
        }

        return cy.contains('button, a', regexNuevo, { timeout: 5000 })
          .should('be.visible')
          .scrollIntoView()
          .click({ force: true })
          .then(() => cy.wait(700));
      })
        .then(() => {
          return cy.url({ timeout: 15000 }).then((url) => {
            if (url.includes('/dashboard/personnel/form')) return cy.wrap(null);

            if (intento + 1 >= maxIntentos) {
              cy.log('No se pudo abrir el formulario por click. Fallback: visit directo a /form ...');
              return cy.visit(`${URL_PATH}/form`)
                .then(() => cy.wait(800))
                .then(() => cy.url().should('include', '/dashboard/personnel/form'));
            }

            return intentarAbrir(intento + 1);
          });
        })
        .then(() => {
          return cy.url().then((url) => {
            if (url.includes('/dashboard/personnel/form')) {
              return asegurarFormularioCargado();
            }
            return cy.wrap(null);
          });
        });
    };

    return yaEstamosEnFormulario().then((enForm) => {
      if (enForm) {
        cy.log('Ya estamos en el formulario. No se pulsa "+ Nuevo/Añadir".');
        return asegurarFormularioCargado();
      }
      return intentarAbrir(0);
    });
  }

  function abrirFormularioCrearPersonal(caso, numero, casoId) {
    const id = casoId || `TC${String(numero).padStart(3, '0')}`;
    cy.log(`${id}: abrir formulario crear (Nuevo)`);

    return UI.abrirPantalla()
      .then(() => UI.esperarTabla())
      .then(() => abrirFormularioNuevoPersonal())
      .then(() => {
        return cy.url().then((url) => {
          if (url.includes('/dashboard/personnel/form')) return cy.wrap(null);
          return cy.wrap(null);
        });
      });
  }

  function deducirSeccionDesdeCaso(caso) {
    const nombre = (caso?.nombre || '').toLowerCase();
    cy.log(`Deduciendo sección desde caso. Nombre del caso: "${caso?.nombre}" (lowercase: "${nombre}")`);

    if (nombre.includes('incidencia') || nombre.includes('incidencias')) return 'Incidencias';
    if (nombre.includes('formación') || nombre.includes('formacion')) return 'Formación';
    if (nombre.includes('experiencia')) return 'Experiencia';
    if (nombre.includes('asistencia')) return 'Asistencia';
    if (nombre.includes('material')) return 'Material';
    if (nombre.includes('contrato')) return 'Contratos';
    if (nombre.includes('hist. telefónico') || nombre.includes('hist telefonico')) return 'Hist. Telefónico';
    if (nombre.includes('teléfono') || nombre.includes('telefono')) return 'Teléfonos';
    return 'Datos Personales';
  }

  function navegarSeccionFormulario(seccion) {
    if (!seccion || /personales/i.test(seccion)) return cy.wrap(null);

    const nombreSeccion = seccion.trim();
    cy.log(`Buscando pestaña: "${nombreSeccion}"`);

    const esIncidencia = nombreSeccion.toLowerCase().includes('incidencia') || nombreSeccion.toLowerCase().includes('incidencias');

    if (esIncidencia) {
      cy.log('INCIDENCIAS es la última pestaña, haciendo clic en el botón de scroll...');
      return cy
        .get('.MuiTabScrollButton-root:not(.Mui-disabled)', { timeout: 10000 })
        .last()
        .should('be.visible')
        .click({ force: true })
        .then(() => {
          cy.wait(500);
          const palabras = nombreSeccion.split(/\s+/).map((p) => escapeRegex(p)).join('.*');
          const regex = new RegExp(palabras, 'i');
          return cy.get('body').then(($body) => {
            const tab = $body.find('button[role="tab"], [role="tab"]').filter((_, el) => {
              const texto = (el.innerText || el.textContent || '').trim();
              return regex.test(texto);
            }).first();

            if (tab.length) {
              return cy
                .wrap(tab[0])
                .scrollIntoView()
                .should('be.visible')
                .click({ force: true })
                .then(() => cy.wait(300));
            }

            cy.log(`No se encontró la pestaña "${nombreSeccion}"`);
            return cy.wrap(null);
          });
        });
    }

    const palabras = nombreSeccion.split(/\s+/).map((p) => escapeRegex(p)).join('.*');
    const regex = new RegExp(palabras, 'i');

    const buscarEnBody = () => {
      return cy.get('body').then(($body) => {
        const buscar = (selector) =>
          $body
            .find(selector)
            .filter((_, el) => regex.test((el.innerText || el.textContent || '').trim()))
            .first();

        const tab = buscar('button[role="tab"], [role="tab"]');
        if (tab.length) {
          return cy
            .wrap(tab)
            .click({ force: true })
            .then(() => cy.wait(300))
            .then(() => true);
        }

        const generico = buscar('button, a, span');
        if (generico.length) {
          return cy
            .wrap(generico)
            .click({ force: true })
            .then(() => cy.wait(300))
            .then(() => true);
        }

        return false;
      });
    };

    const clickScrollDerecha = () => {
      return cy.get('body').then(($body) => {
        const $btn = $body.find('.MuiTabScrollButton-root:not(.Mui-disabled)').filter(':visible').last();
        if ($btn.length) {
          return cy.wrap($btn[0]).click({ force: true }).then(() => cy.wait(250));
        }
        return cy.wrap(null);
      });
    };

    const intentarConScroll = (intento = 0) => {
      const max = 6;
      return buscarEnBody().then((ok) => {
        if (ok) return cy.wrap(null);
        if (intento >= max) {
          cy.log(`No se encontró la sección ${seccion} (tras scroll)`);
          return cy.wrap(null);
        }
        return clickScrollDerecha().then(() => intentarConScroll(intento + 1));
      });
    };

    return intentarConScroll(0);
  }

  function anadirPersonal(caso, numero, casoId) {
    let seccion = deducirSeccionDesdeCaso(caso);
    const numeroCaso = numero || parseInt(String(caso?.caso || '').replace(/\D/g, ''), 10);

    if (numeroCaso === 34) {
      seccion = 'Incidencias';
      cy.log(`Caso 34 detectado, forzando sección: ${seccion}`);
    }

    cy.log(`Datos recibidos para TC${String(numeroCaso).padStart(3, '0')}: ${JSON.stringify(caso)}`);
    cy.log(`Sección deducida: ${seccion}`);

    const esDatosPersonales = /personales/i.test(seccion);
    const esSeccionConModal = !esDatosPersonales;

    return cy.url()
      .then((urlActual) => {
        const enFormulario = urlActual.includes('/dashboard/personnel/form');

        if (enFormulario) {
          cy.log(`Ya estamos en el formulario (caso ${numeroCaso}), verificando estado...`);
          return cy.url().should('include', '/dashboard/personnel/form', { timeout: 5000 })
            .then(() => {
              cy.wait(500);
              if (!esDatosPersonales && seccion) {
                return navegarSeccionFormulario(seccion).then(() => {
                  cy.wait(500);
                  return cy.wrap(null);
                });
              }
              return cy.wrap(null);
            });
        }

        cy.log('Estamos en la tabla, ejecutando todos los pasos: abrir pantalla, esperar tabla, abrir formulario');
        return UI.abrirPantalla()
          .then(() => {
            return cy.url().then((urlDespuesAbrir) => {
              if (!urlDespuesAbrir.includes('/dashboard/personnel/form')) {
                return UI.esperarTabla();
              }
              return cy.wrap(null);
            });
          })
          .then(() => {
            return cy.url().then((urlAntesNuevo) => {
              if (!urlAntesNuevo.includes('/dashboard/personnel/form')) {
                cy.log('Pulsando botón "+ Nuevo" para abrir formulario...');
                return abrirFormularioNuevoPersonal().then(() =>
                  cy.url().should('include', '/dashboard/personnel/form')
                );
              }
              return cy.wrap(null);
            });
          })
          .then(() => {
            if (!esDatosPersonales && seccion) {
              return navegarSeccionFormulario(seccion).then(() => {
                cy.wait(500);
                return cy.wrap(null);
              });
            }
            return cy.wrap(null);
          });
      })
      .then(() => {
        cy.wait(500);

        const esIncidenciaExplicita = seccion && (seccion.toLowerCase().includes('incidencia') || seccion.toLowerCase().includes('incidencias'));

        if (esDatosPersonales && !esIncidenciaExplicita) {
          return llenarFormularioDatosPersonalesDesdeExcel(caso, numeroCaso, false);
        }

        if (esSeccionConModal || esIncidenciaExplicita) {
          return navegarSeccionFormulario(seccion)
            .then(() => {
              cy.wait(500);
              return abrirModalSeccion(seccion);
            })
            .then(() => llenarFormularioSeccion(caso, numeroCaso, seccion))
            .then(() => guardarModalSeccion(seccion));
        }

        return navegarSeccionFormulario(seccion).then(() => llenarCamposFormulario(caso));
      })
      .then(() => {
        if (!esSeccionConModal) {
          return cy
            .contains('button, [type="submit"]', /Guardar/i, { timeout: 10000 })
            .scrollIntoView()
            .click({ force: true })
            .then(() => cy.wait(1500));
        }
        return cy.wrap(null);
      })
      .then(() => {
        cy.log(`Formulario completado y enviado con datos del Excel (TC${String(numeroCaso).padStart(3, '0')})`);
      });
  }

  function guardarSeccionSinRellenarPersonal(caso, numero, casoId) {
    const numeroCaso = numero || 57;
    const idCaso = casoId || `TC${String(numeroCaso).padStart(3, '0')}`;
    const nombreCaso = caso?.nombre || 'Guardar sección sin rellenar ningún campo';

    const mapeoSecciones = {
      57: 'Formación',
      58: 'Experiencia',
      59: 'Asistencia',
      60: 'Material',
      61: 'Contratos',
      62: 'Hist. Telefónico',
      63: 'Incidencias'
    };

    const nombreSeccion = mapeoSecciones[numeroCaso];
    if (!nombreSeccion) {
      const obs = `No se encontró mapeo para el caso ${numeroCaso}`;
      return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'ERROR', true)
        .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
    }

    return cy.url().then((u) => {
      if (!/\/form/i.test(u)) {
        return abrirFormularioNuevoPersonal();
      }
      return cy.wrap(null);
    })
      .then(() => cy.url().should('include', '/dashboard/personnel/form'))
      .then(() => navegarSeccionFormulario(nombreSeccion))
      .then(() => cy.wait(1000))
      .then(() => abrirModalSeccion(nombreSeccion))
      .then(() => cy.wait(1000))
      .then(() => {
        return cy.get('button.css-1b9fx3e:visible', { timeout: 10000 }).then(($btns) => {
          if ($btns.length) {
            return cy.wrap($btns.last())
              .scrollIntoView()
              .click({ force: true });
          }

          return cy
            .contains('button', /(Guardar|Save|Desar)/i, { timeout: 10000 })
            .filter(':visible')
            .last()
            .scrollIntoView()
            .click({ force: true });
        });
      })
      .then(() => cy.wait(1200))
      .then(() => {
        const detectarAvisoCamposObligatorios = (timeoutMs = 8000) => {
          const inicio = Date.now();
          const regexCamposObligatorios = /campos obligatorios|obligatorio|required/i;

          const loop = () => {
            return cy.get('body').then(($body) => {
              const avisosVisiblesEnPantalla = $body
                .find('[role="alert"], .MuiAlert-root, .MuiSnackbar-root, [class*="error"], [class*="Error"], [class*="warning"], [class*="Warning"], [class*="alert"], [class*="Alert"]')
                .filter(':visible')
                .map((_, el) => (el.textContent || el.innerText || '').trim())
                .get()
                .filter(Boolean);

              const textoVisible = ($body.text() || '').trim();
              const avisoPantallaCamposObligatorios = avisosVisiblesEnPantalla.find((texto) => regexCamposObligatorios.test(texto))
                || (regexCamposObligatorios.test(textoVisible) ? textoVisible : null);

              if (avisoPantallaCamposObligatorios) {
                return cy.wrap({
                  encontrado: true,
                  texto: String(avisoPantallaCamposObligatorios).trim(),
                });
              }

              if (Date.now() - inicio >= timeoutMs) {
                return cy.wrap({ encontrado: false, texto: '' });
              }

              return cy.wait(400).then(() => loop());
            });
          };

          return loop();
        };

        return detectarAvisoCamposObligatorios(8000).then((avisoDetectado) => {
          if (avisoDetectado.encontrado) {
            const obs = 'Aparece aviso de campos obligatorios. Esto es correcto.';
            return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'OK', true)
              .then(() => cy.wrap({ resultado: 'OK', obtenido: obs }, { log: false }));
          }

          return cy.get('body').then(($body) => {
          const regexCamposObligatorios = /campos obligatorios|obligatorio|required/i;
          const avisosVisiblesEnPantalla = $body
            .find('[role="alert"], .MuiAlert-root, .MuiSnackbar-root, [class*="error"], [class*="Error"], [class*="warning"], [class*="Warning"], [class*="alert"], [class*="Alert"]')
            .filter(':visible')
            .map((_, el) => (el.textContent || el.innerText || '').trim())
            .get()
            .filter(Boolean);

          const textoPantalla = ($body.text() || '').trim();
          const avisoPantalla = avisosVisiblesEnPantalla.find((texto) => regexCamposObligatorios.test(texto))
            || (regexCamposObligatorios.test(textoPantalla) ? textoPantalla : null);

          if (avisoPantalla) {
            const obs = 'Aparece aviso de campos obligatorios. Esto es correcto.';
            return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'OK', true)
              .then(() => cy.wrap({ resultado: 'OK', obtenido: obs }, { log: false }));
          }

          const modal = $body.find('.MuiDrawer-root:visible, .MuiModal-root:visible, [role="dialog"]:visible').first();

          if (modal.length === 0) {
            const obs = 'El modal se cerró sin mostrar aviso de campos obligatorios. Se guardó en blanco sin validación. Esto es un ERROR.';
            return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'ERROR', true)
              .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
          }

          const textoModal = (Cypress.$(modal[0]).text() || '').trim();
          const tieneTituloCamposObligatorios = /^campos obligatorios$|^campos obligatorios\s*$/i.test(textoModal) ||
            /campos obligatorios/i.test(textoModal) &&
            (textoModal.includes('es obligatorio') || textoModal.includes('obligatorio') || textoModal.includes('required'));

          const avisosEnModal = Cypress.$(modal[0]).find('[role="alert"], .MuiAlert-root, .MuiSnackbar-root, [class*="error"], [class*="Error"], [class*="warning"], [class*="Warning"], [class*="alert"], [class*="Alert"]')
            .filter(':visible')
            .map((_, el) => {
              const texto = (el.textContent || el.innerText || '').trim();
              const tieneTitulo = /campos obligatorios/i.test(texto);
              return { texto, tieneTitulo, elemento: el };
            })
            .get();

          const avisoValido = avisosEnModal.find((aviso) => aviso.tieneTitulo) ||
            (tieneTituloCamposObligatorios && avisosEnModal.length > 0);

          if (avisoValido) {
            const obs = 'Aparece aviso de campos obligatorios. Esto es correcto.';
            return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'OK', true)
              .then(() => cy.wrap({ resultado: 'OK', obtenido: obs }, { log: false }));
          }

          const tieneTextoRelacionado = /campo.*obligatorio|obligatorio.*campo|required.*field|field.*required/i.test(textoModal);
          if (tieneTextoRelacionado && avisosEnModal.length === 0) {
            const obs = 'Se detectó texto relacionado con campos obligatorios pero no aparece como aviso visual. El modal no se cerró pero no hay alerta visible.';
            return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'ERROR', true)
              .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
          }

          const obs = 'No aparece aviso de campos obligatorios al intentar guardar sin rellenar campos. Esto es un ERROR.';
          return registrarResultadoAutomatico(numeroCaso, idCaso, nombreCaso, obs, 'ERROR', true)
            .then(() => cy.wrap({ resultado: 'ERROR', obtenido: obs }, { log: false }));
        });
        });
      });
  }

  function seleccionarTelefonoEnDialog({ idCaso, numeroTelefono = null }) {
    const reTitulo = /Seleccionar\s+Tel[eé]fono/i;

    return cy
      .contains(reTitulo, { timeout: 15000 })
      .should('be.visible')
      .then(($titulo) => {
        const $t = Cypress.$($titulo);
        const parents = $t.parents();
        const tieneBotonSeleccionar = ($el) =>
          $el.find('button').filter((__, b) => /^seleccionar$/i.test((b.textContent || b.innerText || '').trim())).length > 0 ||
          $el.find('button.css-1u8p2ef').length > 0;

        let $scope = parents
          .filter((_, el) => {
            const $el = Cypress.$(el);
            return $el.find('.MuiDataGrid-root').length > 0 && tieneBotonSeleccionar($el);
          })
          .first();

        if (!$scope.length) {
          $scope = parents
            .filter((_, el) => Cypress.$(el).find('.MuiDataGrid-root').length > 0)
            .first();
        }

        if (!$scope.length) {
          $scope = $t.closest('[role="dialog"], .MuiDialog-root, .MuiModal-root, .MuiPopover-root');
        }

        if (!$scope.length) {
          throw new Error(`${idCaso}: no pude localizar el contenedor del modal de teléfonos`);
        }

        return cy.wrap($scope).as('telefonoModal');
      })
      .then(() => {
        if (!numeroTelefono) return cy.wrap(null);

        cy.log(`${idCaso}: filtrando teléfono en el visor con "${numeroTelefono}"...`);
        return cy.get('@telefonoModal').then(($modal) => {
          const $buscar = Cypress.$($modal)
            .find('input[placeholder*="Buscar"], input[placeholder*="search"], input[type="text"]')
            .filter(':visible')
            .first();

          if (!$buscar.length) return cy.wrap(null);

          return cy.wrap($buscar[0])
            .click({ force: true })
            .clear({ force: true })
            .type(String(numeroTelefono), { force: true, delay: 0 })
            .then(() => cy.wait(800));
        });
      })
      .then(() => {
        cy.log(`${idCaso}: seleccionando fila en modal de teléfonos...`);
        return cy.get('@telefonoModal').then(($modal) => {
          const $dgRoot = Cypress.$($modal).find('.MuiDataGrid-root').first();
          const hasDG = $dgRoot.length > 0;

          if (hasDG) {
            return cy.wrap($dgRoot)
              .find('[role="grid"]', { timeout: 15000 })
              .should(($g) => {
                const rc = parseInt(String($g.attr('aria-rowcount') || '0'), 10);
                expect(rc, 'aria-rowcount (cabecera + filas)').to.be.greaterThan(1);
              })
              .then(() => {
                return cy.wrap($dgRoot)
                  .find('.MuiDataGrid-virtualScrollerRenderZone [role="row"][data-rowindex], div[role="row"][data-rowindex], .MuiDataGrid-row[data-rowindex]', { timeout: 15000 })
                  .should('have.length.greaterThan', 0)
                  .then(($rows) => {
                    if (!numeroTelefono) return cy.wrap($rows.first());

                    const match = Array.from($rows).find((row) => {
                      const texto = (row.textContent || row.innerText || '').trim();
                      return texto.includes(String(numeroTelefono));
                    });

                    return cy.wrap(match || $rows.first());
                  });
              })
              .then(($row) => {
                const $rowJq = Cypress.$($row);
                const $cellPreferida = $rowJq.find('div[role="gridcell"][data-field="number"]').first();
                const $cell = $cellPreferida.length
                  ? $cellPreferida
                  : $rowJq
                    .find('.MuiDataGrid-cell, [role="gridcell"]')
                    .not('.MuiDataGrid-cellCheckbox,[data-field="__check__"]')
                    .first();
                const target = $cell.length ? $cell[0] : $rowJq[0];
                return cy.wrap(target).scrollIntoView().click({ force: true }).then(() => cy.wait(200));
              });
          }

          return cy.wrap($modal)
            .find('table tbody tr, tbody tr', { timeout: 15000 })
            .should('have.length.greaterThan', 0)
            .then(($rows) => {
              if (!numeroTelefono) return cy.wrap($rows.first());

              const match = Array.from($rows).find((row) => {
                const texto = (row.textContent || row.innerText || '').trim();
                return texto.includes(String(numeroTelefono));
              });

              return cy.wrap(match || $rows.first());
            })
            .then(($row) => {
              const $cell = Cypress.$($row).find('td').first();
              const target = $cell.length ? $cell[0] : $row[0];
              return cy.wrap(target).scrollIntoView().click({ force: true }).then(() => cy.wait(200));
            });
        });
      })
      .then(() => {
        cy.log(`${idCaso}: pulsando "Seleccionar" en el modal...`);
        return cy.get('@telefonoModal').within(() => {
          return cy.contains('button', /^Seleccionar$/i, { timeout: 10000 })
            .should('be.visible')
            .click({ force: true });
        });
      })
      .then(() => cy.wait(600))
      .then(() => {
        cy.log(`${idCaso}: verificando si aparece modal de confirmación de teléfono...`);
        return cy.get('body', { timeout: 5000 }).then(($body) => {
          const $modal = $body
            .find('.MuiDialog-root:visible, [role="dialog"]:visible')
            .filter((_, el) => {
              const texto = (el.textContent || el.innerText || '').trim();
              return /NovaTrans\s*-\s*Informaci[oó]n/i.test(texto) &&
                /tel[eé]fono.*asignado/i.test(texto) &&
                /desea continuar/i.test(texto);
            })
            .first();

          if ($modal && $modal.length) {
            cy.log(`${idCaso}: Modal de confirmación detectado, haciendo clic en "Sí"...`);
            return cy.wrap($modal).within(() => {
              return cy.contains('button', /^S[ií]$/i, { timeout: 5000 })
                .should('be.visible')
                .click({ force: true })
                .then(() => cy.wait(500));
            });
          }
          return cy.wrap(null);
        });
      })
      .then(() => {
        return cy.get('body', { timeout: 15000 }).then(($body) => {
          const visible = $body
            .find('*:visible')
            .get()
            .some((el) => reTitulo.test((el.textContent || el.innerText || '').trim()));
          if (visible) {
            throw new Error(`${idCaso}: el modal "Seleccionar Teléfono" sigue abierto tras pulsar Seleccionar`);
          }
          return cy.wrap(null);
        });
      });
  }

  function seleccionarTelefono(caso, numero, casoId) {
    const numeroCaso = numero || parseInt(String(caso?.caso || '').replace(/\D/g, ''), 10) || 32;
    const idCaso = casoId || `TC${String(numeroCaso).padStart(3, '0')}`;

    cy.log(`${idCaso}: Seleccionar teléfono (NO Añadir)`);

    return cy.url().then((url) => {
      if (!url.includes('/dashboard/personnel/form')) {
        cy.log(`${idCaso}: no estamos en /form, abriendo formulario nuevo...`);
        return UI.abrirPantalla()
          .then(() => abrirFormularioNuevoPersonal())
          .then(() => cy.url().should('include', '/dashboard/personnel/form'));
      }
      return cy.wrap(null);
    })
      .then(() => navegarSeccionFormulario('TELÉFONOS'))
      .then(() => cy.wait(500))
      .then(() => {
        cy.log(`${idCaso}: pulsando "Seleccionar teléfono"...`);
        return cy.contains('button', /seleccionar tel[eé]fono/i, { timeout: 15000 })
          .should('be.visible')
          .scrollIntoView()
          .click({ force: true });
      })
      .then(() => {
        cy.log(`${idCaso}: esperando listado/modal de teléfonos...`);
        return cy.get('.MuiDataGrid-root, [role="dialog"] .MuiDataGrid-root', { timeout: 15000 })
          .should('be.visible')
          .then(() => cy.wait(1000));
      })
      .then(() => {
        cy.log(`${idCaso}: clic en primera fila del modal...`);
        return cy.get('.MuiDataGrid-row:visible, div[role="row"][data-rowindex]', { timeout: 15000 })
          .first()
          .should('be.visible')
          .click({ force: true })
          .then(() => cy.wait(300));
      })
      .then(() => {
        cy.log(`${idCaso}: pulsando "Seleccionar"...`);
        return cy.contains('button', /^Seleccionar$/i, { timeout: 15000 })
          .should('be.visible')
          .click({ force: true })
          .then(() => cy.wait(600));
      })
      .then(() => {
        cy.log(`${idCaso}: verificando si aparece modal de confirmación de teléfono...`);
        return cy.get('body', { timeout: 5000 }).then(($body) => {
          const $modal = $body
            .find('.MuiDialog-root:visible, [role="dialog"]:visible')
            .filter((_, el) => {
              const texto = (el.textContent || el.innerText || '').trim();
              return /NovaTrans\s*-\s*Informaci[oó]n/i.test(texto) &&
                /tel[eé]fono.*asignado/i.test(texto) &&
                /desea continuar/i.test(texto);
            })
            .first();

          if ($modal && $modal.length) {
            cy.log(`${idCaso}: Modal de confirmación detectado, haciendo clic en "Sí"...`);
            return cy.wrap($modal).within(() => {
              return cy.contains('button', /^S[ií]$/i, { timeout: 5000 })
                .should('be.visible')
                .click({ force: true })
                .then(() => cy.wait(500));
            });
          }
          return cy.wrap(null);
        });
      })
      .then(() => {
        cy.log(`${idCaso}: teléfono seleccionado (si había lista).`);
        return cy.wrap(null);
      });
  }

  return {
    abrirFormularioNuevoPersonal,
    abrirFormularioCrearPersonal,
    deducirSeccionDesdeCaso,
    navegarSeccionFormulario,
    parseMesAnio,
    getPopoverCalendario,
    seleccionarFechaEnPopover,
    escribirFechaEnContenedor,
    escribirFechaPorClickYType,
    llenarFormularioDatosPersonalesDesdeExcel,
    llenarFormularioSeccion,
    llenarCamposFormulario,
    seleccionarOpcionMuiSelect,
    seleccionarOpcionMaterial,
    obtenerCampoFormulario,
    abrirModalSeccion,
    esperarDrawerVisible,
    guardarModalSeccion,
    anadirPersonal,
    guardarSeccionSinRellenarPersonal,
    seleccionarTelefonoEnDialog,
    seleccionarTelefono,
  };
}

module.exports = {
  crearHelpersFormularioPersonal,
};
