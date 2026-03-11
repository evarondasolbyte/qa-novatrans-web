function crearHelpersFacturacionClientes(config) {
  const {
    escribirPorName,
  } = config;

  function llenarFormularioFacturacion(caso, numeroCaso) {
    // --- util: buscar en Excel por fragmento del selector/etiqueta ---
    const obtenerDatoPorSelectorExcel = (needle) => {
      if (!needle) return null;
      const n = (needle || '').toString().toLowerCase().trim();
      const total = Number(caso?.__totalCamposExcel) || 30;

      for (let i = 1; i <= total; i++) {
        const sel = (caso?.[`valor_etiqueta_${i}`] || '').toString().toLowerCase().trim();
        const val = caso?.[`dato_${i}`];

        // Normalizar: quitar espacios y mantener guiones bajos tal cual
        const selSinEspacios = sel.replace(/\s+/g, '');
        const nSinEspacios = n.replace(/\s+/g, '');

        // Buscar coincidencia exacta, por fragmento, o sin espacios
        // También buscar si el needle está contenido en el selector o viceversa
        const coincide = sel === n ||
          selSinEspacios === nSinEspacios ||
          sel.includes(n) ||
          n.includes(sel) ||
          selSinEspacios.includes(nSinEspacios) ||
          nSinEspacios.includes(selSinEspacios);

        // Log de depuración solo para IBAN parte 1
        if (needle.includes('17p') || needle.includes('iban')) {
          cy.log(`   IBAN DEBUG campo ${i}: buscando "${n}", encontrado "${sel}", coincide=${coincide}, valor="${val || '(vacío)'}"`);
        }

        if (sel && coincide && val !== undefined && val !== null && `${val}` !== '') {
          return val;
        }
      }
      return null;
    };

    const seleccionarEmpresaFacturacion = (empresaTxt) => {
      return seleccionarComboFacturacionPorLabel('Empresas', empresaTxt);
    };

    // --- util: buscar en Excel por name attribute ---
    const obtenerDatoPorNameExcel = (nameAttr) => {
      if (!nameAttr) return null;
      const total = Number(caso?.__totalCamposExcel) || 30;
      const nameAttrLower = (nameAttr || '').toString().toLowerCase().trim();

      for (let i = 1; i <= total; i++) {
        const tipo = (caso?.[`etiqueta_${i}`] || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
        const selector = (caso?.[`valor_etiqueta_${i}`] || '').toString().toLowerCase().trim();
        const val = caso?.[`dato_${i}`];

        // Verificar que sea de tipo "name" (puede tener espacios: "name " o "name")
        if (!tipo.includes('name')) continue;

        // Buscar coincidencia exacta o por fragmento
        // También buscar por el nombre del campo sin el prefijo "client."
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

    // --- datos según el mapeo del Excel TC010 ---
    // Leer siempre por value/name real antes de depender de ids dinámicos.
    const empresas = obtenerDatoPorNameExcel('client.companyId') ||
      obtenerDatoPorSelectorExcel('client.companyId') ||
      obtenerDatoPorSelectorExcel('_r_17g_') ||
      obtenerDatoPorSelectorExcel('_r_17g_-label') ||
      obtenerDatoPorSelectorExcel('Empresas');
    // Diseño Factura
    const disenoFactura = obtenerDatoPorSelectorExcel('_r_17j_') ||
      obtenerDatoPorSelectorExcel('_r_17j_-label') ||
      obtenerDatoPorSelectorExcel('Diseño Factura');
    // Banco (name client.bankName -> "prueba")
    const banco = obtenerDatoPorNameExcel('client.bankName');
    // Forma de Pago: el Excel puede venir con descripción o con el id visible
    const formaPago = obtenerDatoPorNameExcel('client.paymentMethodDesc') || obtenerDatoPorNameExcel('client.paymentMethodId');
    if (formaPago) {
      cy.log(` Forma de Pago encontrada en Excel: "${formaPago}" (se escribirá como número)`);
    } else {
      cy.log(` Forma de Pago NO encontrada en Excel`);
    }
    // Swift (name client.swift -> "eeeeee44")
    const swift = obtenerDatoPorNameExcel('client.swift');
    // IBAN - leer los 5 campos separados del Excel
    // Campo 1: código país (puede venir como id _r_17p_-label o name client.iban-iban -> "EE11")
    const ibanParte1 = obtenerDatoPorSelectorExcel('_r_17p_-label') ||
      obtenerDatoPorSelectorExcel('_r_17p_') ||
      obtenerDatoPorSelectorExcel('r_17p') ||
      obtenerDatoPorSelectorExcel('17p') ||
      obtenerDatoPorNameExcel('client.iban-iban') ||
      obtenerDatoPorNameExcel('client.iban-country');
    // Campo 2: office (puede venir como name client.iban-office o client.iban-entity -> "1111")
    const ibanOffice = obtenerDatoPorNameExcel('client.iban-office') ||
      obtenerDatoPorNameExcel('client.iban-entity');
    // Campo 3: control (name client.iban-control -> "11")
    const ibanControl = obtenerDatoPorNameExcel('client.iban-control');
    // Campo 4: account (name client.iban-account -> "1111111111")
    const ibanAccount = obtenerDatoPorNameExcel('client.iban-account');
    // IBAN parte 2 (name client.iban -> "11111111111111111111") - para compatibilidad con versiones antiguas
    const ibanParte2 = obtenerDatoPorNameExcel('client.iban');

    // Logs de depuración detallados
    cy.log(`-------------------------------------------------------`);
    cy.log(` IBAN - LECTURA DEL EXCEL:`);
    cy.log(`   País (ibanParte1): ${ibanParte1 || '(NO ENCONTRADO)'}`);
    cy.log(`   Office: ${ibanOffice || '(NO ENCONTRADO)'}`);
    cy.log(`   Control: ${ibanControl || '(NO ENCONTRADO)'}`);
    cy.log(`   Account: ${ibanAccount || '(NO ENCONTRADO)'}`);
    cy.log(`   Parte 2 (legacy): ${ibanParte2 || '(NO ENCONTRADO)'}`);

    // Debug: buscar manualmente en el Excel para ver qué hay
    const totalCamposIban = Number(caso?.__totalCamposExcel) || 30;
    cy.log(` DEBUG IBAN: Buscando en ${totalCamposIban} campos del Excel...`);
    for (let i = 1; i <= Math.min(totalCamposIban, 30); i++) {
      const etiqueta = caso?.[`etiqueta_${i}`];
      const valorEtiqueta = caso?.[`valor_etiqueta_${i}`];
      const dato = caso?.[`dato_${i}`];
      if (etiqueta && valorEtiqueta && (valorEtiqueta.includes('iban') || valorEtiqueta.includes('IBAN'))) {
        cy.log(`   Campo ${i}: etiqueta="${etiqueta}", valor="${valorEtiqueta}", dato="${dato}"`);
      }
    }
    cy.log(`-------------------------------------------------------`);
    // C. Contable (name client.CuentaContable -> "prueba", pero en HTML es client.bankAccount)
    const cContable = obtenerDatoPorNameExcel('client.CuentaContable') || obtenerDatoPorNameExcel('client.bankAccount');
    // IVA (name client.defaultTax -> "20")
    const iva = obtenerDatoPorNameExcel('client.defaultTax');
    // Días Cobro
    const diaCobro1 = obtenerDatoPorNameExcel('client.diaCobro1');
    const diaCobro2 = obtenerDatoPorNameExcel('client.diaCobro2');
    // Riesgo Asegurado (name client.RiesgoAsegurado -> "prueba", pero en HTML es client.insuredRisk)
    const riesgoAsegurado = obtenerDatoPorNameExcel('client.RiesgoAsegurado') || obtenerDatoPorNameExcel('client.insuredRisk');
    // Dto (name client.discount -> "2")
    const dto = obtenerDatoPorNameExcel('client.discount');
    // Tipo Facturación
    const tipoFacturacion = obtenerDatoPorSelectorExcel('_r_17i_') ||
      obtenerDatoPorSelectorExcel('_r_17i_-label') ||
      obtenerDatoPorSelectorExcel('_r_17h_') ||
      obtenerDatoPorSelectorExcel('_r_17h_-label') ||
      obtenerDatoPorSelectorExcel('r_5t_') ||
      obtenerDatoPorSelectorExcel('_r_5t_') ||
      obtenerDatoPorSelectorExcel('_r_8i_') ||
      obtenerDatoPorSelectorExcel('_r_8i_-label') ||
      obtenerDatoPorSelectorExcel('_r_8j_') ||
      obtenerDatoPorSelectorExcel('_r_8j_-label') ||
      obtenerDatoPorSelectorExcel('Tipo Facturación');

    // C. Venta (autocomplete) - buscar por selector o name
    // Puede venir como id _r_48 o _r_1an_ o por name client.salesAccount
    const cVenta = obtenerDatoPorSelectorExcel('_r_48') ||
      obtenerDatoPorSelectorExcel('_r_1an_') ||
      obtenerDatoPorSelectorExcel('C. Venta') ||
      obtenerDatoPorNameExcel('client.salesAccount') ||
      null;
    if (cVenta) {
      cy.log(` C. Venta encontrada en Excel: "${cVenta}"`);
    } else {
      cy.log(` C. Venta NO encontrada en Excel`);
    }

    // CCC Empresa - buscar por selector (puede no estar en Excel)
    const cccEmpresa = obtenerDatoPorSelectorExcel('_r_1ab_') || obtenerDatoPorSelectorExcel('CCC Empresa') || null;

    const cobroFinMes = leerBooleanoExcel(
      obtenerDatoPorNameExcel('client.cobroFinMes'),
      obtenerDatoPorSelectorExcel('Cobro fin mes')
    );
    const conRiesgo = leerBooleanoExcel(
      obtenerDatoPorNameExcel('client.withRiskB'),
      obtenerDatoPorSelectorExcel('Con Riesgo')
    );

    // Construir IBAN completo manualmente: concatenar las 5 partes sin espacios
    // Formato: EE11 + 1111 + 1111 + 11 + 1111111111 = EE1111111111111111111111
    let iban = null;
    if (ibanParte1 && ibanOffice && ibanControl && ibanAccount) {
      // Construir IBAN completo concatenando las 5 partes
      iban = `${String(ibanParte1).trim()}${String(ibanOffice).trim()}${String(ibanControl).trim()}${String(ibanAccount).trim()}`;
      cy.log(`IBAN completo construido manualmente: "${iban}" (${iban.length} caracteres)`);
      console.log(`IBAN completo construido manualmente: "${iban}" (${iban.length} caracteres)`);
    } else if (ibanParte1 && ibanParte2) {
      // Fallback: usar partes antiguas si no tenemos las 5 partes separadas
      iban = `${String(ibanParte1).trim()}${String(ibanParte2).trim()}`;
      cy.log(`IBAN construido con partes antiguas: "${iban}" (${iban.length} caracteres)`);
    } else if (ibanParte1) {
      // Solo tenemos la primera parte (país)
      iban = String(ibanParte1).trim();
      cy.log(`ADVERTENCIA: Solo se tiene la primera parte del IBAN: "${iban}"`);
    } else if (ibanParte2) {
      iban = String(ibanParte2).trim();
    }

    // Log de depuración completo
    cy.log(`-------------------------------------------------------`);
    cy.log(` DATOS LEÍDOS DEL EXCEL (TC010):`);
    cy.log(`   Empresas: ${empresas || '(vacío)'}`);
    cy.log(`   Diseño Factura: ${disenoFactura || '(vacío)'}`);
    cy.log(`   Tipo Facturación: ${tipoFacturacion || '(vacío)'}`);
    cy.log(`   Banco: ${banco || '(vacío)'}`);
    cy.log(`   Forma de Pago: ${formaPago || '(vacío)'}`);
    cy.log(`   Swift: ${swift || '(vacío)'}`);
    cy.log(`   IBAN País: ${ibanParte1 || '(vacío)'}`);
    cy.log(`   IBAN Office: ${ibanOffice || '(vacío)'}`);
    cy.log(`   IBAN Control: ${ibanControl || '(vacío)'}`);
    cy.log(`   IBAN Account: ${ibanAccount || '(vacío)'}`);
    cy.log(`   IBAN Parte 2 (legacy): ${ibanParte2 || '(vacío)'}`);
    cy.log(`   IBAN Completo: ${iban || '(vacío)'}`);
    cy.log(`   C. Contable: ${cContable || '(vacío)'}`);
    cy.log(`   C. Venta: ${cVenta || '(vacío)'}`);
    cy.log(`   CCC Empresa: ${cccEmpresa || '(vacío)'}`);
    cy.log(`   IVA: ${iva || '(vacío)'}`);
    cy.log(`   Día Cobro 1: ${diaCobro1 || '(vacío)'}`);
    cy.log(`   Día Cobro 2: ${diaCobro2 || '(vacío)'}`);
    cy.log(`   Riesgo Asegurado: ${riesgoAsegurado || '(vacío)'}`);
    cy.log(`   Dto: ${dto || '(vacío)'}`);
    cy.log(`   Cobro fin mes: ${cobroFinMes === null ? '(vacío)' : cobroFinMes}`);
    cy.log(`   Con Riesgo: ${conRiesgo === null ? '(vacío)' : conRiesgo}`);
    cy.log(`-------------------------------------------------------`);

    // Log de depuración del Excel completo para ver qué hay
    const totalCampos = Number(caso?.__totalCamposExcel) || 30;
    cy.log(` DEBUG: Total campos en Excel: ${totalCampos}`);
    for (let i = 1; i <= Math.min(totalCampos, 20); i++) {
      const etiqueta = caso?.[`etiqueta_${i}`];
      const valorEtiqueta = caso?.[`valor_etiqueta_${i}`];
      const dato = caso?.[`dato_${i}`];
      if (etiqueta || valorEtiqueta || dato) {
        cy.log(`   Campo ${i}: etiqueta="${etiqueta || ''}", valor_etiqueta="${valorEtiqueta || ''}", dato="${dato || ''}"`);
      }
    }

    // Resumen de campos encontrados vs no encontrados
    cy.log(` RESUMEN DE CAMPOS:`);
    cy.log(`Encontrados: Empresas=${!!empresas}, Diseño=${!!disenoFactura}, Tipo Fact=${!!tipoFacturacion}, Banco=${!!banco}, FormaPago=${!!formaPago}, Swift=${!!swift}`);
    cy.log(`IBAN: País=${!!ibanParte1}, Office=${!!ibanOffice}, Control=${!!ibanControl}, Account=${!!ibanAccount}, Parte2=${!!ibanParte2}`);
    cy.log(`Otros: C.Contable=${!!cContable}, IVA=${!!iva}, DíaCobro1=${!!diaCobro1}, DíaCobro2=${!!diaCobro2}, Riesgo=${!!riesgoAsegurado}, Dto=${!!dto}`);
    cy.log(`No en Excel: CCC Empresa=${!cccEmpresa}, C.Venta=${!cVenta}`);

    // ---------------- helpers ----------------
    const escapeRegex = (s) => Cypress._.escapeRegExp(String(s));
    const normalizarTextoSeleccion = (s) => String(s || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[-–—]/g, '');

    // Helper: seleccionar opción de una lista de elementos jQuery
    const seleccionarOpcionDeLista = ($opts, valor, regexExacto, regexParcial) => {
      const valorNormalizado = normalizarTextoSeleccion(valor);

      // Buscar opción exacta
      const exacta = Array.from($opts).find((el) => {
        const texto = (el.textContent || el.innerText || '').trim();
        return regexExacto.test(texto) || normalizarTextoSeleccion(texto) === valorNormalizado;
      });

      if (exacta) {
        cy.log(`Opción exacta encontrada: "${(exacta.textContent || '').trim()}"`);
        return cy.wrap(exacta)
          .scrollIntoView()
          .click({ force: true })
          .then(() => {
            cy.wait(300);
            cy.log(` Empresa "${valor}" seleccionada`);
          });
      }

      // Buscar opción parcial
      cy.log(` No se encontró opción exacta "${valor}", buscando opción que contenga el texto...`);
      const parcial = Array.from($opts).find((el) => {
        const texto = (el.textContent || el.innerText || '').trim();
        return regexParcial.test(texto) || normalizarTextoSeleccion(texto).includes(valorNormalizado);
      });

      if (parcial) {
        cy.log(`Opción parcial encontrada: "${(parcial.textContent || '').trim()}"`);
        return cy.wrap(parcial)
          .scrollIntoView()
          .click({ force: true })
          .then(() => {
            cy.wait(300);
            cy.log(` Empresa "${valor}" seleccionada (opción parcial)`);
          });
      }

      // Buscar primera opción válida (que no sea "- TODAS -")
      cy.log(` No se encontró opción que contenga "${valor}", seleccionando primera opción válida...`);
      const valida = Array.from($opts).find((el) => {
        const texto = (el.textContent || el.innerText || '').trim();
        return texto !== '- TODAS -' && texto !== '';
      });

      if (valida) {
        cy.log(`Primera opción válida encontrada: "${(valida.textContent || '').trim()}"`);
        return cy.wrap(valida)
          .scrollIntoView()
          .click({ force: true })
          .then(() => {
            cy.wait(300);
            cy.log(' Primera opción válida de Empresa seleccionada (fallback)');
          });
      }

      // último recurso: primera opción
      cy.log(' Seleccionando primera opción disponible...');
      if ($opts.length > 0) {
        return cy.wrap($opts[0])
          .scrollIntoView()
          .click({ force: true })
          .then(() => {
            cy.wait(300);
            cy.log(' Primera opción de Empresa seleccionada (último fallback)');
          });
      }

      cy.log('ERROR: No se encontró ninguna opción para seleccionar');
      return cy.wrap(null);
    };

    //  Empresas: click + seleccionar opción (como antes). NO usa id.
    const seleccionarComboFacturacionPorLabel = (labelTxt, valorInput) => {
      const valor = String(valorInput).trim();
      const regexExacto = new RegExp(`^${escapeRegex(valor)}$`, 'i');
      const regexParcial = new RegExp(escapeRegex(valor), 'i');
      const valorNormalizado = normalizarTextoSeleccion(valor);

      cy.log(`Seleccionando Empresa (Facturación): "${valor}"`);

      return cy.contains('label', new RegExp(`^${escapeRegex(labelTxt)}$`, 'i'), { timeout: 10000 })
        .should('exist')
        .scrollIntoView()
        .parents('.MuiFormControl-root')
        .first()
        .within(() => {
          cy.get('[role="combobox"]', { timeout: 10000 })
            .should('be.visible')
            .then(($combo) => {
              const actual = ($combo.text() || $combo.val() || '').toString().trim();
              if (normalizarTextoSeleccion(actual) === valorNormalizado) {
                cy.log(`${labelTxt} ya seleccionado: "${actual}"`);
                return cy.wrap($combo);
              }
              return cy.wrap($combo).click({ force: true });
            })
        })
        .then(() => {
          cy.wait(800); // Esperar a que se abra el listbox (más tiempo para caso 43)

          // Buscar el listbox directamente con cy.get (más robusto que wrap de jQuery)
          // Esperar a que el listbox está presente y tenga opciones
          return cy.get('[role="listbox"]', { timeout: 15000 })
            .first()
            .should('exist')
            .should(($listbox) => {
              // Verificar que el listbox tenga opciones antes de continuar
              const $options = $listbox.find('[role="option"]');
              expect($options.length).to.be.greaterThan(0, 'El listbox debe tener al menos una opción');
            })
            .then(($listbox) => {
              const numOpciones = $listbox.find('[role="option"]').length;
              cy.log(`Listbox encontrado con ${numOpciones} opciones`);

              // Buscar todas las opciones en el body (más robusto que within)
              return cy.get('body').then(($body) => {
                const $opts = $body.find('[role="option"]').filter(':visible');
                cy.log(`Encontradas ${$opts.length} opciones visibles en el body`);

                if (!$opts.length) {
                  cy.log('No hay opciones visibles, esperando...');
                  cy.wait(500);
                  // Reintentar
                  const $optsRetry = $body.find('[role="option"]').filter(':visible');
                  if (!$optsRetry.length) {
                    cy.log('Aún no hay opciones después de esperar');
                    return cy.wrap(null);
                  }
                  return seleccionarOpcionDeLista($optsRetry, valor, regexExacto, regexParcial);
                }

                return seleccionarOpcionDeLista($opts, valor, regexExacto, regexParcial);
              });
            });
        });
    };

    const seleccionarPrimeraOpcionComboFacturacionPorLabel = (labelTxt) => {
      cy.log(`Seleccionando primera opcion disponible en ${labelTxt}`);

      return cy.contains('label', new RegExp(`^${escapeRegex(labelTxt)}$`, 'i'), { timeout: 10000 })
        .should('exist')
        .scrollIntoView()
        .parents('.MuiFormControl-root')
        .first()
        .within(() => {
          cy.get('[role="combobox"]', { timeout: 10000 })
            .should('be.visible')
            .then(($combo) => {
              const actual = ($combo.text() || $combo.val() || '').toString().trim();
              if (actual) {
                cy.log(`${labelTxt} ya tiene valor: "${actual}"`);
                return cy.wrap($combo);
              }
              return cy.wrap($combo).click({ force: true });
            });
        })
        .then(() => {
          return cy.get('[role="listbox"]', { timeout: 15000 })
            .first()
            .should('exist')
            .then(() => cy.get('body'))
            .then(($body) => {
              const $opts = $body.find('[role="option"]').filter(':visible');
              if (!$opts.length) {
                cy.log(`No se encontraron opciones visibles para ${labelTxt}`);
                return cy.wrap(null);
              }

              return cy.wrap($opts[0])
                .scrollIntoView()
                .click({ force: true })
                .then(() => cy.wait(300));
            });
        });
    };

    //  modal "Aplicar a todas las empresas" -> Sí, aplicar
    const aceptarModalAplicarSiExiste = () => {
      return cy.get('body').then(($body) => {
        const $dlg = $body.find('[role="dialog"]:visible');
        if (!$dlg.length) return cy.esperarUIEstable(15000).then(() => cy.wait(500));

        // Tu modal tiene botón: "Sí, aplicar"
        return cy.contains('[role="dialog"] button', /sí,\s*aplicar/i, { timeout: 5000 })
          .should('be.visible')
          .click({ force: true })
          .then(() => cy.esperarUIEstable(15000))
          .then(() => cy.wait(500));
      });
    };

    //  Autocomplete por label (sin ids dinámicos), selecciona opción exacta si strictExact
    const seleccionarAutocompletePorLabel = (label, valor, { strictExact = false } = {}) => {
      const valorTxt = String(valor).trim();
      const regexValor = new RegExp(`^${escapeRegex(valorTxt)}$`, 'i');
      const valorNormalizado = normalizarTextoSeleccion(valorTxt);
      if (
        /tipo\s+factur/i.test(label) ||
        /dise.*factura/i.test(label) ||
        /ccc\s+empresa/i.test(label) ||
        /c\.\s*venta/i.test(label)
      ) {
        return seleccionarComboFacturacionPorLabel(label, valorTxt);
      }

      cy.log(`Autocomplete "${label}" => "${valorTxt}"`);

      return cy.esperarUIEstable(15000)
        .then(() => cy.contains('label', new RegExp(`^${escapeRegex(label)}$`, 'i'), { timeout: 10000 }).should('be.visible'))
        .then(($label) => {
          const $contenedor = Cypress.$($label).closest('.MuiFormControl-root');
          return cy.wrap($contenedor.length ? $contenedor[0] : $label[0]);
        })
        .scrollIntoView()
        .within(() => {
          cy.get('button[type="button"]').then(($buttons) => {
            const $clear = $buttons.filter((_, el) => {
              const $el = Cypress.$(el);
              const aria = ($el.attr('aria-label') || '').toLowerCase();
              const title = ($el.attr('title') || '').toLowerCase();
              const cls = ($el.attr('class') || '').toLowerCase();
              const tieneSvg = $el.find('svg').length > 0;
              return $el.is(':visible') && tieneSvg && (
                aria.includes('clear') ||
                aria.includes('limpiar') ||
                title.includes('clear') ||
                title.includes('limpiar') ||
                cls.includes('iconbutton')
              );
            }).first();

            if ($clear.length) {
              cy.wrap($clear).click({ force: true });
              cy.wait(100);
            }
          });

          cy.get('input[role="combobox"], input[aria-autocomplete="list"], input', { timeout: 10000 })
            .first()
            .should('be.visible')
            .click({ force: true })
            .type('{selectall}{backspace}', { force: true })
            .clear({ force: true })
            .type(valorTxt, { force: true });
        })
        .then(() => cy.wait(200))
        .then(() => {
          return cy.get('body').then(($body) => {
            const $opts = $body.find('[role="option"]').filter(':visible');
            if (!$opts.length) {
              cy.log(`No hay opciones visibles para "${label}", se mantiene el valor escrito`);
              return cy.contains('label', new RegExp(`^${escapeRegex(label)}$`, 'i'), { timeout: 10000 })
                .parents('.MuiFormControl-root')
                .first()
                .find('input[role="combobox"], input[aria-autocomplete="list"], input')
                .first()
                .blur({ force: true })
                .then(() => cy.wrap(null));
            }

            const exacta = Array.from($opts).find((el) => regexValor.test((el.textContent || '').trim()));
            if (exacta) {
              return cy.wrap(exacta).click({ force: true });
            }

            const parcial = Array.from($opts).find((el) => {
              const texto = (el.textContent || '').trim();
              return normalizarTextoSeleccion(texto).includes(valorNormalizado);
            });
            if (parcial) {
              return cy.wrap(parcial).click({ force: true });
            }

            if (strictExact) {
              cy.log(` No exacta para "${label}" con "${valorTxt}" (strict). No se selecciona fallback.`);
              return cy.get('body').type('{esc}', { force: true }).then(() => cy.wrap(null));
            }

            return cy.wrap($opts[0]).click({ force: true });
          });
        });
    };

    const ajustarSwitchPorName = (nameAttr, activar, etiqueta) => {
      if (activar === null || activar === undefined) {
        return cy.wrap(null);
      }

      return cy.get('body').then(($body) => {
        const $switch = $body.find(`input[name="${nameAttr}"]`).filter(':visible').first();
        if (!$switch.length) {
          cy.log(`(SKIP) No existe switch visible: ${etiqueta || nameAttr}`);
          return cy.wrap(null);
        }

        const estaMarcado = Boolean($switch.prop('checked'));
        if (estaMarcado === activar) {
          cy.log(`${etiqueta || nameAttr}: ya está ${activar ? 'marcado' : 'desmarcado'}`);
          return cy.wrap(null);
        }

        return cy.wrap($switch)
          .scrollIntoView()
          .click({ force: true });
      });
    };

    // IBAN en el HTML viene en 5 campos separados
    const escribirIbanSiSePuede = (ibanCompleto, ibanParte1, ibanParte2, ibanOffice, ibanControl, ibanAccount) => {
      // Si tenemos partes separadas, usarlas directamente
      if (ibanParte1 || ibanParte2) {
        // Si solo tenemos una parte, intentar escribirla en el input correspondiente
        if (ibanParte1 && !ibanParte2) {
          cy.log(`Escribiendo solo IBAN parte 1: ${ibanParte1}`);
          return cy.get('body').then(($body) => {
            const $input1 = $body.find('input#_r_1af_, input[id="_r_1af_"]').filter(':visible').first();
            if ($input1.length) {
              cy.wrap($input1[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
              return cy.wrap(null);
            }
            // Buscar por label
            const $label = $body.find('label').filter((_, el) => /^IBAN$/i.test((el.textContent || '').trim())).filter(':visible').first();
            if ($label.length) {
              return cy.wrap($label).parents('.MuiBox-root, .MuiFormControl-root').first().then(($container) => {
                const $inputs = $container.find('input').filter(':visible');
                if ($inputs.length >= 1) {
                  cy.wrap($inputs[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
                }
                return cy.wrap(null);
              });
            }
            return cy.wrap(null);
          });
        }

        if (ibanParte2 && !ibanParte1) {
          cy.log(`Escribiendo solo IBAN parte 2: ${ibanParte2}`);
          return cy.get('body').then(($body) => {
            const $input2 = $body.find('input#_r_1ag_, input[id="_r_1ag_"]').filter(':visible').first();
            if ($input2.length) {
              cy.wrap($input2[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte2), { force: true, delay: 0 });
              return cy.wrap(null);
            }
            // Buscar por label
            const $label = $body.find('label').filter((_, el) => /^IBAN$/i.test((el.textContent || '').trim())).filter(':visible').first();
            if ($label.length) {
              return cy.wrap($label).parents('.MuiBox-root, .MuiFormControl-root').first().then(($container) => {
                const $inputs = $container.find('input').filter(':visible');
                if ($inputs.length >= 2) {
                  cy.wrap($inputs[1]).scrollIntoView().clear({ force: true }).type(String(ibanParte2), { force: true, delay: 0 });
                }
                return cy.wrap(null);
              });
            }
            return cy.wrap(null);
          });
        }

        // PRIORIDAD 1: Si tenemos los campos separados del Excel, usarlos directamente
        // No requerimos que están todos, escribimos los que tengamos
        if (ibanParte1 || ibanOffice || ibanControl || ibanAccount) {
          cy.log(`Escribiendo IBAN desde Excel: país="${ibanParte1 || '(vacío)'}", office="${ibanOffice || '(vacío)'}", control="${ibanControl || '(vacío)'}", account="${ibanAccount || '(vacío)'}"`);

          return cy.get('body').then(($body) => {
            // Buscar inputs por name attributes (más robusto)
            const $input1 = $body.find('input[name="client.iban-country"], input[name="client.iban-iban"], input[name*="iban-country"], input[name*="iban-iban"]').filter(':visible').first();
            const $input2 = $body.find('input[name="client.iban-office"], input[name="client.iban-entity"], input[name*="iban-office"], input[name*="iban-entity"]').filter(':visible').first();
            const $input3 = $body.find('input[name="client.iban-control"], input[name*="iban-control"]').filter(':visible').first();
            const $input4 = $body.find('input[name="client.iban-account"], input[name*="iban-account"]').filter(':visible').first();

            cy.log(`IBAN DEBUG: Input1 encontrado=${$input1.length > 0}, Input2 encontrado=${$input2.length > 0}, Input3 encontrado=${$input3.length > 0}, Input4 encontrado=${$input4.length > 0}`);

            // Escribir en los campos que encontremos y tengamos datos
            let camposEscritos = 0;
            let chainIban = cy.wrap(null);

            if ($input1.length && ibanParte1) {
              cy.log('Escribiendo IBAN campo 1 (país)');
              chainIban = chainIban.then(() => {
                return cy.wrap($input1[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
              }).then(() => cy.wait(100));
              camposEscritos++;
            }
            if ($input2.length && ibanOffice) {
              cy.log('Escribiendo IBAN campo 2 (office)');
              chainIban = chainIban.then(() => {
                return cy.wrap($input2[0]).scrollIntoView().clear({ force: true }).type(String(ibanOffice), { force: true, delay: 0 });
              }).then(() => cy.wait(100));
              camposEscritos++;
            }
            if ($input3.length && ibanControl) {
              cy.log('Escribiendo IBAN campo 3 (control)');
              chainIban = chainIban.then(() => {
                return cy.wrap($input3[0]).scrollIntoView().clear({ force: true }).type(String(ibanControl), { force: true, delay: 0 });
              }).then(() => cy.wait(100));
              camposEscritos++;
            }
            if ($input4.length && ibanAccount) {
              cy.log('Escribiendo IBAN campo 4 (account)');
              chainIban = chainIban.then(() => {
                return cy.wrap($input4[0]).scrollIntoView().clear({ force: true }).type(String(ibanAccount), { force: true, delay: 0 });
              }).then(() => cy.wait(100));
              camposEscritos++;
            }

            if (camposEscritos > 0) {
              cy.log(`IBAN: Se escribieron ${camposEscritos} campos por name attributes`);
              return chainIban.then(() => {
                // Verificar que los valores se hayan escrito correctamente
                return cy.wait(200).then(() => {
                  return cy.get('body').then($body => {
                    const valores = [];
                    if ($input1.length) valores.push(`campo1="${$input1[0].value || '(vacío)'}"`);
                    if ($input2.length) valores.push(`campo2="${$input2[0].value || '(vacío)'}"`);
                    if ($input3.length) valores.push(`campo3="${$input3[0].value || '(vacío)'}"`);
                    if ($input4.length) valores.push(`campo4="${$input4[0].value || '(vacío)'}"`);
                    cy.log(`IBAN: Valores después de escribir: ${valores.join(', ')}`);
                  });
                });
              });
            }

            // Si no encontramos por name, intentar por label y posición

            // PRIORIDAD 2: Buscar por label IBAN y luego por orden/posición
            const $label = $body.find('label').filter((_, el) => {
              const texto = (el.textContent || el.innerText || '').trim();
              return /^IBAN$/i.test(texto);
            }).filter(':visible').first();

            if ($label.length) {
              cy.log('IBAN encontrado por label, buscando inputs...');
              return cy.wrap($label)
                .parents('.MuiBox-root, .MuiFormControl-root')
                .first()
                .then(($container) => {
                  const $inputs = $container.find('input').filter(':visible');
                  cy.log(`IBAN DEBUG por label: Encontrados ${$inputs.length} inputs visibles en el contenedor`);

                  // Escribir en los inputs disponibles según los datos que tengamos
                  let camposEscritosLabel = 0;
                  let chainIbanLabel = cy.wrap(null);

                  if ($inputs.length >= 1 && ibanParte1) {
                    cy.log('Escribiendo IBAN campo 1 (país) por posición');
                    chainIbanLabel = chainIbanLabel.then(() => {
                      return cy.wrap($inputs[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
                    }).then(() => cy.wait(100));
                    camposEscritosLabel++;
                  }
                  if ($inputs.length >= 2 && ibanOffice) {
                    cy.log('Escribiendo IBAN campo 2 (office) por posición');
                    chainIbanLabel = chainIbanLabel.then(() => {
                      return cy.wrap($inputs[1]).scrollIntoView().clear({ force: true }).type(String(ibanOffice), { force: true, delay: 0 });
                    }).then(() => cy.wait(100));
                    camposEscritosLabel++;
                  }
                  if ($inputs.length >= 3 && ibanControl) {
                    cy.log('Escribiendo IBAN campo 3 (control) por posición');
                    chainIbanLabel = chainIbanLabel.then(() => {
                      return cy.wrap($inputs[2]).scrollIntoView().clear({ force: true }).type(String(ibanControl), { force: true, delay: 0 });
                    }).then(() => cy.wait(100));
                    camposEscritosLabel++;
                  }
                  if ($inputs.length >= 4 && ibanAccount) {
                    cy.log('Escribiendo IBAN campo 4 (account) por posición');
                    chainIbanLabel = chainIbanLabel.then(() => {
                      return cy.wrap($inputs[3]).scrollIntoView().clear({ force: true }).type(String(ibanAccount), { force: true, delay: 0 });
                    }).then(() => cy.wait(100));
                    camposEscritosLabel++;
                  }

                  if (camposEscritosLabel > 0) {
                    cy.log(`IBAN: Se escribieron ${camposEscritosLabel} campos por posición`);
                    return chainIbanLabel.then(() => {
                      // Verificar que los valores se hayan escrito correctamente
                      return cy.wait(200).then(() => {
                        return cy.get('body').then($body => {
                          const valores = [];
                          if ($inputs.length >= 1) valores.push(`campo1="${$inputs[0].value || '(vacío)'}"`);
                          if ($inputs.length >= 2) valores.push(`campo2="${$inputs[1].value || '(vacío)'}"`);
                          if ($inputs.length >= 3) valores.push(`campo3="${$inputs[2].value || '(vacío)'}"`);
                          if ($inputs.length >= 4) valores.push(`campo4="${$inputs[3].value || '(vacío)'}"`);
                          cy.log(`IBAN: Valores después de escribir (por posición): ${valores.join(', ')}`);
                        });
                      });
                    });
                  }

                  // Si hay menos de 4 inputs pero tenemos datos, intentar escribir lo que podamos
                  if ($inputs.length >= 2 && (ibanParte1 || ibanOffice || ibanControl || ibanAccount)) {
                    cy.log(`IBAN: Solo se encontraron ${$inputs.length} inputs, escribiendo en los disponibles`);
                    if (ibanParte1) {
                      cy.wrap($inputs[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
                    }
                    if ($inputs.length >= 2 && (ibanOffice || ibanControl || ibanAccount)) {
                      cy.wait(50);
                      const resto = (ibanOffice || '') + (ibanControl || '') + (ibanAccount || '');
                      if (resto) {
                        cy.wrap($inputs[1]).scrollIntoView().clear({ force: true }).type(resto, { force: true, delay: 0 });
                      }
                    }
                    return cy.wrap(null);
                  }

                  cy.log('No se detectaron suficientes inputs IBAN. Se omite.');
                  return cy.wrap(null);
                });
            }

            cy.log('No se encontraron inputs IBAN. Se omite.');
            return cy.wrap(null);
          });
        }

        // PRIORIDAD 2: Si tenemos ambas partes (legacy), dividir en 5 campos
        if (ibanParte1 && ibanParte2) {
          // Dividir ibanParte2 en los campos 2, 3 y 4
          const parte2Str = String(ibanParte2);
          const campo2 = parte2Str.slice(0, 4);   // Primeros 4 caracteres
          const campo3 = parte2Str.slice(4, 6);   // Siguientes 2 caracteres
          const campo4 = parte2Str.slice(6, 16);  // Resto (máximo 10 caracteres)

          cy.log(`Escribiendo IBAN en 5 campos (legacy): ${ibanParte1} / ${campo2} / ${campo3} / ${campo4}`);

          return cy.get('body').then(($body) => {
            // Buscar inputs por name attributes (más robusto)
            const $input1 = $body.find('input[name="client.iban-country"], input[name="client.iban-iban"], input[name*="iban-country"], input[name*="iban-iban"]').filter(':visible').first();
            const $input2 = $body.find('input[name="client.iban-office"], input[name="client.iban-entity"], input[name*="iban-office"], input[name*="iban-entity"]').filter(':visible').first();
            const $input3 = $body.find('input[name="client.iban-control"], input[name*="iban-control"]').filter(':visible').first();
            const $input4 = $body.find('input[name="client.iban-account"], input[name*="iban-account"]').filter(':visible').first();

            // Si encontramos los 4 campos por name, escribir directamente
            if ($input1.length && $input2.length && $input3.length && $input4.length) {
              cy.log('IBAN encontrado por name attributes (5 campos desde partes)');
              cy.wrap($input1[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
              cy.wait(50);
              cy.wrap($input2[0]).scrollIntoView().clear({ force: true }).type(campo2, { force: true, delay: 0 });
              cy.wait(50);
              cy.wrap($input3[0]).scrollIntoView().clear({ force: true }).type(campo3, { force: true, delay: 0 });
              cy.wait(50);
              cy.wrap($input4[0]).scrollIntoView().clear({ force: true }).type(campo4, { force: true, delay: 0 });
              return cy.wrap(null);
            }

            // PRIORIDAD 2: Buscar por label IBAN y luego por orden/posición
            const $label = $body.find('label').filter((_, el) => {
              const texto = (el.textContent || el.innerText || '').trim();
              return /^IBAN$/i.test(texto);
            }).filter(':visible').first();

            if ($label.length) {
              cy.log('IBAN encontrado por label, buscando inputs...');
              return cy.wrap($label)
                .parents('.MuiBox-root, .MuiFormControl-root')
                .first()
                .then(($container) => {
                  const $inputs = $container.find('input').filter(':visible');
                  cy.log(`IBAN DEBUG por label: Encontrados ${$inputs.length} inputs visibles en el contenedor`);

                  // Si hay 4 o más inputs, escribir en los primeros 4
                  if ($inputs.length >= 4) {
                    cy.log('Escribiendo IBAN en 4 campos por posición (desde partes)');
                    cy.wrap($inputs[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
                    cy.wait(50);
                    cy.wrap($inputs[1]).scrollIntoView().clear({ force: true }).type(campo2, { force: true, delay: 0 });
                    cy.wait(50);
                    cy.wrap($inputs[2]).scrollIntoView().clear({ force: true }).type(campo3, { force: true, delay: 0 });
                    cy.wait(50);
                    cy.wrap($inputs[3]).scrollIntoView().clear({ force: true }).type(campo4, { force: true, delay: 0 });
                    return cy.wrap(null);
                  }

                  // Si hay menos de 4 inputs, intentar con los que hay
                  if ($inputs.length >= 2) {
                    cy.log(`IBAN: Solo se encontraron ${$inputs.length} inputs, escribiendo en los disponibles`);
                    cy.wrap($inputs[0]).scrollIntoView().clear({ force: true }).type(String(ibanParte1).toUpperCase(), { force: true, delay: 0 });
                    if ($inputs.length >= 2) {
                      cy.wait(50);
                      cy.wrap($inputs[1]).scrollIntoView().clear({ force: true }).type(campo2 + campo3 + campo4, { force: true, delay: 0 });
                    }
                    return cy.wrap(null);
                  }

                  cy.log('No se detectaron suficientes inputs IBAN. Se omite.');
                  return cy.wrap(null);
                });
            }

            cy.log('No se encontraron inputs IBAN. Se omite.');
            return cy.wrap(null);
          });
        }
      }

      // Si tenemos IBAN completo, hacer split en 5 campos
      if (!ibanCompleto) return cy.wrap(null);
      const ibanTxt = String(ibanCompleto).replace(/\s+/g, '').toUpperCase();

      // Split del IBAN en 5 campos según la estructura:
      // Campo 1: 4 caracteres (código país, ej: "EE11")
      // Campo 2: 4 caracteres (office, ej: "1111")
      // Campo 3: 2 caracteres (control, ej: "11")
      // Campo 4: 10 caracteres (account, ej: "1111111111")
      const campo1 = ibanTxt.slice(0, 4);   // "EE11"
      const campo2 = ibanTxt.slice(4, 8);   // "1111"
      const campo3 = ibanTxt.slice(8, 10);   // "11"
      const campo4 = ibanTxt.slice(10, 20); // "1111111111" (máximo 10 chars)

      cy.log(`Escribiendo IBAN completo (split en 5 campos): ${campo1} / ${campo2} / ${campo3} / ${campo4}`);

      return cy.get('body').then(($body) => {
        // Buscar inputs por name attributes (más robusto que por ID)
        const $input1 = $body.find('input[name="client.iban-country"], input[name*="iban-country"]').filter(':visible').first();
        const $input2 = $body.find('input[name="client.iban-office"], input[name*="iban-office"]').filter(':visible').first();
        const $input3 = $body.find('input[name="client.iban-control"], input[name*="iban-control"]').filter(':visible').first();
        const $input4 = $body.find('input[name="client.iban-account"], input[name*="iban-account"]').filter(':visible').first();

        // Si encontramos los 4 campos por name, escribir directamente
        if ($input1.length && $input2.length && $input3.length && $input4.length) {
          cy.log('IBAN encontrado por name attributes (5 campos)');
          cy.wrap($input1[0]).scrollIntoView().clear({ force: true }).type(campo1, { force: true, delay: 0 });
          cy.wait(50);
          cy.wrap($input2[0]).scrollIntoView().clear({ force: true }).type(campo2, { force: true, delay: 0 });
          cy.wait(50);
          cy.wrap($input3[0]).scrollIntoView().clear({ force: true }).type(campo3, { force: true, delay: 0 });
          cy.wait(50);
          cy.wrap($input4[0]).scrollIntoView().clear({ force: true }).type(campo4, { force: true, delay: 0 });
          return cy.wrap(null);
        }

        // PRIORIDAD 2: Buscar por label IBAN y luego por orden/posición
        const $label = $body.find('label').filter((_, el) => {
          const texto = (el.textContent || el.innerText || '').trim();
          return /^IBAN$/i.test(texto);
        }).filter(':visible').first();

        if ($label.length) {
          return cy.wrap($label)
            .parents('.MuiBox-root, .MuiFormControl-root')
            .first()
            .then(($container) => {
              const $inputs = $container.find('input').filter(':visible');
              cy.log(`IBAN DEBUG: Encontrados ${$inputs.length} inputs en el contenedor`);

              // Si hay 4 o más inputs, escribir en los primeros 4
              if ($inputs.length >= 4) {
                cy.log('Escribiendo IBAN en 4 campos por posición');
                cy.wrap($inputs[0]).scrollIntoView().clear({ force: true }).type(campo1, { force: true, delay: 0 });
                cy.wait(50);
                cy.wrap($inputs[1]).scrollIntoView().clear({ force: true }).type(campo2, { force: true, delay: 0 });
                cy.wait(50);
                cy.wrap($inputs[2]).scrollIntoView().clear({ force: true }).type(campo3, { force: true, delay: 0 });
                cy.wait(50);
                cy.wrap($inputs[3]).scrollIntoView().clear({ force: true }).type(campo4, { force: true, delay: 0 });
                return cy.wrap(null);
              }

              // Si hay menos de 4 inputs, intentar con los que hay
              if ($inputs.length >= 2) {
                cy.log(`IBAN: Solo se encontraron ${$inputs.length} inputs, escribiendo en los disponibles`);
                cy.wrap($inputs[0]).scrollIntoView().clear({ force: true }).type(campo1, { force: true, delay: 0 });
                if ($inputs.length >= 2) {
                  cy.wait(50);
                  cy.wrap($inputs[1]).scrollIntoView().clear({ force: true }).type(campo2 + campo3 + campo4, { force: true, delay: 0 });
                }
                return cy.wrap(null);
              }

              cy.log('No se detectaron suficientes inputs IBAN. Se omite.');
              return cy.wrap(null);
            });
        }

        cy.log('IBAN label no visible. Se omite.');
        return cy.wrap(null);
      });
    };

    // ---------------- ejecución ----------------
    let chain = cy.wrap(null);

    //  1) EMPRESAS: como antes (click + seleccionar) + modal si aparece
    if (empresas) {
      chain = chain
        .then(() => seleccionarEmpresaFacturacion(empresas))
        .then(() => aceptarModalAplicarSiExiste());
    }

    //  2) CCC Empresa (select dentro Configuración de Factura)
    if (cccEmpresa) {
      chain = chain.then(() => seleccionarComboFacturacionPorLabel('CCC Empresa', cccEmpresa));
    } else {
      chain = chain.then(() => seleccionarPrimeraOpcionComboFacturacionPorLabel('CCC Empresa'));
    }

    //  3) Tipo Facturación + Diseño Factura (autocompletes)
    if (tipoFacturacion) {
      chain = chain.then(() => seleccionarComboFacturacionPorLabel('Tipo Facturación', tipoFacturacion));
    }
    if (disenoFactura) {
      chain = chain.then(() => seleccionarComboFacturacionPorLabel('Diseño Factura', disenoFactura));
    }

    //  4) IVA (tiene name="client.defaultTax")
    if (iva !== undefined && iva !== null && `${iva}` !== '') {
      chain = chain.then(() => escribirPorName('client.defaultTax', iva, 'IVA'));
    }

    //  5) Banco + Swift
    if (banco) chain = chain.then(() => escribirPorName('client.bankName', banco, 'Banco'));
    if (swift) chain = chain.then(() => escribirPorName('client.swift', swift, 'Swift'));

    //  6) Forma de Pago
    if (formaPago) {
      chain = chain.then(() => escribirPorName('client.paymentMethodId', formaPago, 'Forma de Pago'));
    }

    //  7) Días cobro
    if (diaCobro1 !== undefined && diaCobro1 !== null && `${diaCobro1}` !== '') {
      chain = chain.then(() => escribirPorName('client.diaCobro1', diaCobro1, 'Días Cobro 1'));
    }
    if (diaCobro2 !== undefined && diaCobro2 !== null && `${diaCobro2}` !== '') {
      chain = chain.then(() => escribirPorName('client.diaCobro2', diaCobro2, 'Días Cobro 2'));
    }

    //  8) Cobro fin mes (switch checkbox)
    if (cobroFinMes !== null) {
      chain = chain.then(() => ajustarSwitchPorName('client.cobroFinMes', cobroFinMes, 'Cobro fin mes'));
    }

    //  9) C. Contable (name="client.bankAccount")
    if (cContable) {
      chain = chain.then(() => escribirPorName('client.bankAccount', cContable, 'C. Contable'));
    }

    //  10) C. Venta (autocomplete)
    if (cVenta) {
      chain = chain.then(() => seleccionarComboFacturacionPorLabel('C. Venta', cVenta));
    }

    //  11) IBAN (especial; 5 campos separados)
    if (ibanParte1 || ibanOffice || ibanControl || ibanAccount || ibanParte2 || iban) {
      chain = chain.then(() => {
        cy.log(`Ejecutando escritura de IBAN: país="${ibanParte1 || '(vacío)'}", office="${ibanOffice || '(vacío)'}", control="${ibanControl || '(vacío)'}", account="${ibanAccount || '(vacío)'}", parte2="${ibanParte2 || '(vacío)'}", completo="${iban || '(vacío)'}"`);
        return escribirIbanSiSePuede(iban, ibanParte1, ibanParte2, ibanOffice, ibanControl, ibanAccount);
      })
        .then(() => {
          // Esperar un momento adicional después de escribir el IBAN para asegurar que se procese
          cy.wait(500);

          // Construir IBAN completo manualmente si tenemos todas las partes
          const ibanCompletoManual = (ibanParte1 && ibanOffice && ibanControl && ibanAccount)
            ? `${String(ibanParte1).trim()}${String(ibanOffice).trim()}${String(ibanControl).trim()}${String(ibanAccount).trim()}`
            : (iban || null);

          if (ibanCompletoManual && ibanCompletoManual.length >= 15) {
            cy.log(`IBAN completo construido manualmente: "${ibanCompletoManual}" (${ibanCompletoManual.length} caracteres)`);
            console.log(`IBAN completo construido manualmente: "${ibanCompletoManual}" (${ibanCompletoManual.length} caracteres)`);

            // Guardar el IBAN completo en una variable global para que el intercept pueda usarlo
            cy.window().then((win) => {
              win.ibanCompletoGlobal = ibanCompletoManual;
              cy.log(`IBAN completo guardado globalmente: "${ibanCompletoManual}"`);
              console.log(`IBAN completo guardado globalmente: "${ibanCompletoManual}"`);
            });

            // Buscar y escribir el IBAN completo en un campo oculto o principal
            return cy.get('body').then($body => {
              // Buscar campo oculto o principal para el IBAN completo (múltiples estrategias)
              let $ibanCompleto = $body.find('input[name="client.iban"]').first();

              if (!$ibanCompleto.length) {
                $ibanCompleto = $body.find('input[name*="iban"][type="hidden"]').first();
              }
              if (!$ibanCompleto.length) {
                $ibanCompleto = $body.find('input[id*="iban"][type="hidden"]').first();
              }
              if (!$ibanCompleto.length) {
                $ibanCompleto = $body.find('input[name*="IBAN"]').first();
              }
              if (!$ibanCompleto.length) {
                // Buscar cualquier input que contenga "iban" en su nombre o id (visible u oculto)
                $ibanCompleto = $body.find('input[name*="iban"], input[id*="iban"]').not('input[name*="iban-country"], input[name*="iban-iban"], input[name*="iban-office"], input[name*="iban-entity"], input[name*="iban-control"], input[name*="iban-account"]').first();
              }

              if ($ibanCompleto.length) {
                const campoName = $ibanCompleto.attr('name') || $ibanCompleto.attr('id') || 'sin nombre';
                cy.log(`Escribiendo IBAN completo en campo "${campoName}": "${ibanCompletoManual}"`);
                console.log(`Escribiendo IBAN completo en campo "${campoName}": "${ibanCompletoManual}"`);

                // Usar jQuery para establecer el valor directamente y disparar eventos
                const $input = Cypress.$($ibanCompleto[0]);
                const valorAnterior = $input.val() || '';
                $input.val(ibanCompletoManual);
                $input.trigger('input');
                $input.trigger('change');
                $input.trigger('blur');

                const valorDespues = $input.val() || '';
                cy.log(`IBAN completo: antes="${valorAnterior}", después="${valorDespues}"`);
                console.log(`IBAN completo: antes="${valorAnterior}", después="${valorDespues}"`);

                return cy.wait(300);
              } else {
                cy.log('No se encontró campo oculto para IBAN completo. El formulario debería construirlo automáticamente desde los 5 campos individuales.');
                console.warn('No se encontró campo oculto para IBAN completo. El formulario debería construirlo automáticamente desde los 5 campos individuales.');

                // Intentar buscar todos los inputs relacionados con IBAN para debug
                const $todosIban = $body.find('input[name*="iban"], input[id*="iban"]');
                cy.log(`DEBUG: Se encontraron ${$todosIban.length} inputs relacionados con IBAN:`);
                $todosIban.each((i, el) => {
                  const $el = Cypress.$(el);
                  const name = $el.attr('name') || '';
                  const id = $el.attr('id') || '';
                  const type = $el.attr('type') || 'text';
                  const valor = $el.val() || '';
                  cy.log(`  Input ${i + 1}: name="${name}", id="${id}", type="${type}", valor="${valor}"`);
                });
              }

              // Verificar que los campos del IBAN se hayan rellenado correctamente
              const $ibanInputs = $body.find('input[name*="iban"], input[id*="iban"]').filter(':visible');
              cy.log(`IBAN: Verificando ${$ibanInputs.length} campos IBAN después de escribir...`);
              let ibanCompletoVerificado = '';
              $ibanInputs.each((i, el) => {
                const valor = (el.value || '').trim();
                const name = el.name || el.id || 'sin nombre';
                cy.log(`  Campo IBAN ${i + 1} (${name}): valor="${valor}"`);
                if (valor) {
                  ibanCompletoVerificado += valor;
                }
              });
              if (ibanCompletoVerificado) {
                cy.log(`IBAN completo verificado desde campos visibles: "${ibanCompletoVerificado}" (${ibanCompletoVerificado.length} caracteres)`);
                console.log(`IBAN completo verificado desde campos visibles: "${ibanCompletoVerificado}" (${ibanCompletoVerificado.length} caracteres)`);
              }

              return cy.wrap(null);
            });
          } else {
            cy.log(`ADVERTENCIA: No se pudo construir IBAN completo (faltan partes): país=${!!ibanParte1}, office=${!!ibanOffice}, control=${!!ibanControl}, account=${!!ibanAccount}`);
            console.warn(`? ADVERTENCIA: No se pudo construir IBAN completo (faltan partes): país=${!!ibanParte1}, office=${!!ibanOffice}, control=${!!ibanControl}, account=${!!ibanAccount}`);
            return cy.wrap(null);
          }
        });
    } else {
      cy.log(`IBAN no se ejecutará: país=${!!ibanParte1}, office=${!!ibanOffice}, control=${!!ibanControl}, account=${!!ibanAccount}, parte2=${!!ibanParte2}, completo=${!!iban}`);
    }

    //  12) Dto (name="client.discount")
    if (dto !== undefined && dto !== null && `${dto}` !== '') {
      chain = chain.then(() => escribirPorName('client.discount', dto, 'Dto'));
    }

    //  13) Con Riesgo (switch: name="client.withRiskB") y Riesgo asegurado (name="client.insuredRisk")
    if (conRiesgo !== null) {
      chain = chain.then(() => ajustarSwitchPorName('client.withRiskB', conRiesgo, 'Con Riesgo'));
    }

    if (riesgoAsegurado !== undefined && riesgoAsegurado !== null && `${riesgoAsegurado}` !== '') {
      chain = chain.then(() => {
        // Solo escribir si el input está visible (evita fallos si UI lo oculta)
        return cy.get('body').then(($body) => {
          const $inp = $body.find('input[name="client.insuredRisk"]').filter(':visible');
          if (!$inp.length) {
            cy.log('Riesgo Asegurado no visible, se omite');
            return cy.wrap(null);
          }
          return escribirPorName('client.insuredRisk', riesgoAsegurado, 'Riesgo Asegurado');
        });
      });
    }

    return chain.then(() => {
      const etiquetaCaso = numeroCaso ? `TC${String(numeroCaso).padStart(3, '0')} - ` : '';
      cy.log(`${etiquetaCaso}Formulario Facturación rellenado (corregido)`);
    });
  }

  return {
    llenarFormularioFacturacion,
  };
}

module.exports = { crearHelpersFacturacionClientes };
