/**
 * <phone-login-step>
 * Componente reutilizable de "número celular" para flujos de login/registro.
 *
 * Uso básico:
 *   <phone-login-step></phone-login-step>
 *
 * Atributos configurables:
 *   titulo            -> texto del <h1>
 *   subtitulo         -> texto de descripción
 *   codigo-pais       -> ej. "+52"
 *   iso-pais          -> ej. "MX"
 *   bandera           -> emoji o url de imagen
 *   placeholder       -> ej. "00-0000-0000"
 *   min-digitos       -> cantidad de dígitos requeridos (default 10)
 *   texto-boton       -> texto del botón (default "Continuar")
 *
 * Eventos que emite:
 *   "continue"  -> detail: { codigoPais, isoPais, telefono, telefonoCompleto }
 *   "change"    -> detail: { valido, digitos }
 *
 * Métodos públicos:
 *   .valor()        -> regresa el teléfono formateado actual
 *   .reset()        -> limpia el input
 *   .setError(msg)  -> muestra un mensaje de error debajo del input
 *   .clearError()   -> quita el mensaje de error
 */
class PhoneLoginStep extends HTMLElement {
  static get observedAttributes() {
    return [
      "titulo",
      "subtitulo",
      "codigo-pais",
      "iso-pais",
      "bandera",
      "placeholder",
      "min-digitos",
      "texto-boton",
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._minDigitos = 10;
  }

  connectedCallback() {
    this._render();
    this._bindEvents();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) this._render();
  }

  get _titulo() {
    return (
      this.getAttribute("titulo") ||
      "Compra ahora con tu tarjeta virtual y paga a plazos"
    );
  }
  get _subtitulo() {
    return (
      this.getAttribute("subtitulo") ||
      "Inicia sesión o crea tu cuenta con tu teléfono celular"
    );
  }
  get _codigoPais() {
    return this.getAttribute("codigo-pais") || "+52";
  }
  get _isoPais() {
    return this.getAttribute("iso-pais") || "";
  }
  get _bandera() {
    return this.getAttribute("bandera") || "🇲🇽";
  }
  get _placeholder() {
    return this.getAttribute("placeholder") || "00-0000-0000";
  }
  get _minDigitosAttr() {
    return parseInt(this.getAttribute("min-digitos") || "10", 10);
  }
  get _textoBoton() {
    return this.getAttribute("texto-boton") || "Continuar";
  }

  get _textoProteccionGris() {
    return (
      this.getAttribute("texto-proteccion-gris") ||
      "Este sitio está protegido por reCAPTCHA y Google. Consulta el "
    );
  }
  get _textoProteccionAzul() {
    return (
      this.getAttribute("texto-proteccion-azul") ||
      "Aviso de privacidad y Términos de servicio."
    );
  }

  _render() {
    this._minDigitos = this._minDigitosAttr;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --texto-principal: #1a1a1a;
          --texto-secundario: #4a4a4a;
          --azul-etiqueta: #3b7dd8;
          --gris-borde: #e0e0e0;
          --gris-fondo-input: #fafafa;
          --gris-placeholder: #9a9a9a;
          --gris-boton-desactivado: #e2e2e2;
          --gris-texto-boton: #a8a8a8;
          --color-error: #d64545;
          --fuente: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

          display: block;
          font-family: var(--fuente);
          color: var(--texto-principal);
          max-width: 360px;
        }

        * { box-sizing: border-box; }

        .titulo {
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
          margin: 0 0 20px 0;
        }

        .subtitulo {
          font-size: 15px;
          line-height: 1.5;
          margin: 0 0 28px 0;
        }

        .etiqueta {
          display: block;
          font-size: 13px;
          color: var(--azul-etiqueta);
          margin-bottom: 6px;
        }

        .campo-telefono {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .selector-pais,
        .input-telefono {
          height: 52px;
        }

        .selector-pais {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          background: var(--gris-fondo-input);
          border: 1px solid var(--gris-borde);
          border-radius: 10px;
          padding: 0 14px;
          font-size: 14px;
          color: var(--texto-secundario);
          cursor: pointer;
          font-family: var(--fuente);
        }

        .selector-pais:hover { background: #f2f2f2; }

        .input-telefono {
          flex: 1;
          min-width: 0;
          background: var(--gris-fondo-input);
          border: 1px solid var(--gris-borde);
          border-radius: 10px;
          padding: 0 16px;
          font-size: 15px;
          color: var(--texto-principal);
          font-family: var(--fuente);
        }

        .input-telefono::placeholder { color: var(--gris-placeholder); }

        .selector-pais:focus-visible,
        .input-telefono:focus-visible {
          outline: 2px solid var(--azul-etiqueta);
          outline-offset: 1px;
        }

        .mensaje-error {
          font-size: 13px;
          color: var(--color-error);
          min-height: 18px;
          margin: 0 0 16px 0;
        }

        .boton-continuar {
          width: 100%;
          height: 52px;
          border: none;
          border-radius: 26px;
          font-size: 16px;
          font-weight: 500;
          font-family: var(--fuente);
          cursor: not-allowed;
          background: var(--gris-boton-desactivado);
          color: var(--gris-texto-boton);
          transition: background 0.15s ease, color 0.15s ease;
        }

        .boton-continuar:not(:disabled) {
          background: var(--texto-principal);
          color: #ffffff;
          cursor: pointer;
        }

        .boton-continuar:not(:disabled):hover { background: #333333; }

        .texto-proteccion {
          font-size: 12px;
          line-height: 1.5;
          color: var(--texto-secundario);
          margin-top: 16px;
        }

        .texto-proteccion .enlace {
          color: var(--azul-etiqueta);
        }

        @media (max-width: 400px) {
          .titulo { font-size: 24px; }
        }
      </style>

      <h1 class="titulo">${this._titulo}</h1>
      <p class="subtitulo">${this._subtitulo}</p>

      <form novalidate>
        <label class="etiqueta" for="telefono">Número celular</label>

        <div class="campo-telefono">
          <button type="button" class="selector-pais" aria-haspopup="listbox">
            <span aria-hidden="true">${this._bandera}</span>
            <span>${this._isoPais} (${this._codigoPais})</span>
          </button>

          <input
            type="tel"
            id="telefono"
            class="input-telefono"
            placeholder="${this._placeholder}"
            inputmode="numeric"
            autocomplete="tel-national"
          />
        </div>

        <p class="mensaje-error" id="mensajeError"></p>

        <button type="submit" class="boton-continuar" id="btnContinuar" disabled>
          ${this._textoBoton}
        </button>

        <p class="texto-proteccion">
          ${this._textoProteccionGris}<span class="enlace">${this._textoProteccionAzul}</span>
        </p>
      </form>
    `;

    this._input = this.shadowRoot.getElementById("telefono");
    this._boton = this.shadowRoot.getElementById("btnContinuar");
    this._form = this.shadowRoot.querySelector("form");
    this._mensajeError = this.shadowRoot.getElementById("mensajeError");
  }

  _formatear(digitos) {
    let f = digitos;
    if (digitos.length > 2) f = `${digitos.slice(0, 2)}-${digitos.slice(2)}`;
    if (digitos.length > 6)
      f = `${digitos.slice(0, 2)}-${digitos.slice(2, 6)}-${digitos.slice(6)}`;
    return f;
  }

  _bindEvents() {
    this._input.addEventListener("input", () => {
      const digitos = this._input.value
        .replace(/\D/g, "")
        .slice(0, this._minDigitos);
      this._input.value = this._formatear(digitos);

      const valido = digitos.length === this._minDigitos;
      this._boton.disabled = !valido;
      this.clearError();

      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { valido, digitos },
          bubbles: true,
          composed: true,
        }),
      );
    });

    this._form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (this._boton.disabled) return;

      this.dispatchEvent(
        new CustomEvent("continue", {
          detail: {
            codigoPais: this._codigoPais,
            isoPais: this._isoPais,
            telefono: this._input.value,
            telefonoCompleto: `${this._codigoPais}${this._input.value.replace(/\D/g, "")}`,
          },
          bubbles: true,
          composed: true,
        }),
      );
    });
  }

  // ---- API pública ----
  valor() {
    return this._input.value;
  }

  reset() {
    this._input.value = "";
    this._boton.disabled = true;
    this.clearError();
  }

  setError(mensaje) {
    this._mensajeError.textContent = mensaje;
    this._input.style.borderColor = "var(--color-error)";
  }

  clearError() {
    this._mensajeError.textContent = "";
    this._input.style.borderColor = "";
  }
}

customElements.define("phone-login-step", PhoneLoginStep);
