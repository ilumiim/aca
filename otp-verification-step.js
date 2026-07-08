/**
 * <otp-verification-step>
 * Componente reutilizable para el paso de "verifica tu código" (OTP)
 * que sigue después de pedir el teléfono.
 *
 * Uso básico:
 *   <otp-verification-step telefono="+525512345678" digitos="6"></otp-verification-step>
 *
 * Atributos configurables:
 *   titulo            -> texto del <h1> (default: "Verifica tu teléfono")
 *   telefono          -> el número al que se envió el código (para mostrarlo)
 *   digitos           -> cantidad de casillas del código (default 6)
 *   segundos-espera   -> segundos del contador antes de poder reenviar (default 30)
 *   mostrar-whatsapp  -> "true"/"false", si se muestra el botón de WhatsApp (default true)
 *
 * Eventos que emite:
 *   "verify"        -> detail: { codigo }            (cuando se llenan todas las casillas)
 *   "resend"        -> detail: { canal: "sms"|"whatsapp" }
 *
 * Métodos públicos:
 *   .reset()          -> limpia las casillas
 *   .setError(msg)    -> muestra mensaje de error
 *   .clearError()     -> lo quita
 *   .reiniciarContador() -> vuelve a poner el contador desde el inicio
 */
class OtpVerificationStep extends HTMLElement {
  static get observedAttributes() {
    return ["titulo", "telefono", "digitos", "segundos-espera", "mostrar-whatsapp"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._segundosRestantes = 0;
    this._intervalo = null;
  }

  connectedCallback() {
    this._render();
    this._bindEvents();
    this._iniciarContador();
  }

  disconnectedCallback() {
    clearInterval(this._intervalo);
  }

  get _titulo() {
    return this.getAttribute("titulo") || "Verifica tu teléfono";
  }
  get _telefono() {
    return this.getAttribute("telefono") || "";
  }
  get _numDigitos() {
    return parseInt(this.getAttribute("digitos") || "6", 10);
  }
  get _segundosEspera() {
    return parseInt(this.getAttribute("segundos-espera") || "30", 10);
  }
  get _mostrarWhatsapp() {
    return this.getAttribute("mostrar-whatsapp") !== "false";
  }

  _render() {
    const casillas = Array.from(
      { length: this._numDigitos },
      (_, i) => `<input
        type="text"
        inputmode="numeric"
        maxlength="1"
        class="casilla"
        data-indice="${i}"
        autocomplete="one-time-code"
      />`
    ).join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          /* ---- AQUÍ SE PERSONALIZA LA MARCA (colores) ---- */
          --texto-principal: #1a1a1a;
          --texto-secundario: #4a4a4a;
          --acento: #3b7dd8;
          --gris-borde: #e0e0e0;
          --gris-fondo-boton: #f5f5f5;
          --gris-texto-boton: #8a8a8a;
          --color-error: #d64545;
          --fuente: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

          display: block;
          font-family: var(--fuente);
          color: var(--texto-principal);
          max-width: 360px;
        }

        * { box-sizing: border-box; }

        .titulo {
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 16px 0;
        }

        .subtitulo {
          font-size: 15px;
          line-height: 1.5;
          margin: 0 0 24px 0;
        }

        .telefono {
          font-weight: 700;
        }

        .etiqueta {
          display: block;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .casillas {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .casilla {
          width: 48px;
          height: 56px;
          text-align: center;
          font-size: 20px;
          border: 1px solid var(--gris-borde);
          border-radius: 10px;
          font-family: var(--fuente);
          color: var(--texto-principal);
        }

        .casilla:focus-visible {
          outline: 2px solid var(--acento);
          outline-offset: 1px;
        }

        .mensaje-error {
          font-size: 13px;
          color: var(--color-error);
          min-height: 18px;
          margin: 0 0 8px 0;
        }

        .contador {
          font-size: 14px;
          color: var(--texto-secundario);
          text-align: center;
          margin: 16px 0;
        }

        .boton-canal {
          width: 100%;
          height: 52px;
          border: 1px solid var(--gris-borde);
          border-radius: 26px;
          background: var(--gris-fondo-boton);
          color: var(--gris-texto-boton);
          font-size: 15px;
          font-family: var(--fuente);
          cursor: pointer;
          margin-bottom: 12px;
          transition: background 0.15s ease;
        }

        .boton-canal:not(:disabled):hover {
          background: #ececec;
        }

        .boton-canal:disabled {
          cursor: not-allowed;
        }
      </style>

      <h1 class="titulo">${this._titulo}</h1>
      <p class="subtitulo">
        Ingresa el código que enviamos a<br />
        <span class="telefono">${this._telefono}</span>
      </p>

      <label class="etiqueta">Código</label>
      <div class="casillas">${casillas}</div>
      <p class="mensaje-error" id="mensajeError"></p>

      <p class="contador" id="contador"></p>

      ${
        this._mostrarWhatsapp
          ? `<button type="button" class="boton-canal" id="btnWhatsapp" disabled>
              Enviar código por WhatsApp
            </button>`
          : ""
      }
      <button type="button" class="boton-canal" id="btnSms" disabled>
        Enviar código por SMS
      </button>
    `;

    this._casillas = Array.from(this.shadowRoot.querySelectorAll(".casilla"));
    this._mensajeError = this.shadowRoot.getElementById("mensajeError");
    this._contador = this.shadowRoot.getElementById("contador");
    this._btnSms = this.shadowRoot.getElementById("btnSms");
    this._btnWhatsapp = this.shadowRoot.getElementById("btnWhatsapp");
  }

  _bindEvents() {
    this._casillas.forEach((input, indice) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "").slice(0, 1);
        this.clearError();

        if (input.value && indice < this._casillas.length - 1) {
          this._casillas[indice + 1].focus();
        }

        this._revisarCompleto();
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && indice > 0) {
          this._casillas[indice - 1].focus();
        }
      });

      input.addEventListener("paste", (e) => {
        e.preventDefault();
        const texto = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
        texto
          .slice(0, this._casillas.length)
          .split("")
          .forEach((digito, i) => {
            if (this._casillas[i]) this._casillas[i].value = digito;
          });
        this._revisarCompleto();
      });
    });

    this._btnSms.addEventListener("click", () => {
      if (this._btnSms.disabled) return;
      this.dispatchEvent(
        new CustomEvent("resend", { detail: { canal: "sms" }, bubbles: true, composed: true })
      );
      this.reiniciarContador();
    });

    if (this._btnWhatsapp) {
      this._btnWhatsapp.addEventListener("click", () => {
        if (this._btnWhatsapp.disabled) return;
        this.dispatchEvent(
          new CustomEvent("resend", { detail: { canal: "whatsapp" }, bubbles: true, composed: true })
        );
        this.reiniciarContador();
      });
    }
  }

  _revisarCompleto() {
    const codigo = this._casillas.map((c) => c.value).join("");
    if (codigo.length === this._casillas.length) {
      this.dispatchEvent(
        new CustomEvent("verify", { detail: { codigo }, bubbles: true, composed: true })
      );
    }
  }

  _iniciarContador() {
    this._segundosRestantes = this._segundosEspera;
    this._actualizarBotones(false);
    clearInterval(this._intervalo);

    this._intervalo = setInterval(() => {
      this._segundosRestantes -= 1;

      if (this._segundosRestantes <= 0) {
        clearInterval(this._intervalo);
        this._actualizarBotones(true);
        return;
      }

      this._contador.textContent = `Reenviar código en ${this._segundosRestantes}`;
    }, 1000);

    this._contador.textContent = `Reenviar código en ${this._segundosRestantes}`;
  }

  _actualizarBotones(habilitados) {
    this._btnSms.disabled = !habilitados;
    if (this._btnWhatsapp) this._btnWhatsapp.disabled = !habilitados;
    this._contador.textContent = habilitados ? "" : this._contador.textContent;
  }

  // ---- API pública ----
  reset() {
    this._casillas.forEach((c) => (c.value = ""));
    this._casillas[0].focus();
    this.clearError();
  }

  setError(mensaje) {
    this._mensajeError.textContent = mensaje;
    this._casillas.forEach((c) => (c.style.borderColor = "var(--color-error)"));
  }

  clearError() {
    this._mensajeError.textContent = "";
    this._casillas.forEach((c) => (c.style.borderColor = ""));
  }

  reiniciarContador() {
    this._iniciarContador();
  }
}

customElements.define("otp-verification-step", OtpVerificationStep);
