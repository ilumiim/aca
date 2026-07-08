# phone-login-step

Componente reutilizable (Web Component nativo) del paso de "número celular"
para flujos de login o registro. No depende de ningún framework — funciona
en HTML plano, React, Vue, Angular, etc.

## Por qué esto es "un componente" y no solo una página

- **Encapsulado**: usa Shadow DOM, así que su CSS nunca choca con los estilos
  del proyecto donde se inserte.
- **Configurable por atributos**: título, subtítulo, país, placeholder,
  cantidad de dígitos y texto del botón se pueden cambiar sin tocar el código.
- **Emite eventos estándar** (`continue`, `change`) para que lo conecten a
  cualquier backend o lógica de negocio propia.
- **Tiene API pública** (`.valor()`, `.reset()`, `.setError()`,
  `.clearError()`) para integrarlo en flujos más grandes (ej. mostrar error
  si el backend rechaza el número).

Esto es justamente lo que se cobra aparte de una página estática: la
posibilidad de reusarlo en múltiples pantallas/proyectos sin reescribir nada.

## Instalación

Solo copia `phone-login-step.js` a tu proyecto e impórtalo:

```html
<script src="phone-login-step.js"></script>
```

## Uso básico

```html
<phone-login-step></phone-login-step>
```

## Uso con atributos personalizados

```html
<phone-login-step
  titulo="Bienvenido de nuevo"
  subtitulo="Ingresa tu número para continuar"
  codigo-pais="+1"
  iso-pais="US"
  bandera="🇺🇸"
  placeholder="000-000-0000"
  min-digitos="10"
  texto-boton="Enviar código"
></phone-login-step>
```

## Escuchar eventos

```js
const paso = document.querySelector("phone-login-step");

paso.addEventListener("continue", (evento) => {
  console.log(evento.detail.telefonoCompleto); // ej. "+525512345678"
  // Aquí conectas tu backend real (enviar OTP, crear cuenta, etc.)
});

paso.addEventListener("change", (evento) => {
  console.log(evento.detail.valido); // true/false mientras el usuario escribe
});
```

## Mostrar un error desde el backend

```js
paso.setError("Este número ya está registrado");
// luego, cuando el usuario corrija:
paso.clearError();
```

## Personalizar colores (theming)

El componente expone variables CSS que puedes sobreescribir desde afuera:

```css
phone-login-step {
  --texto-principal: #111111;
  --azul-etiqueta: #0057ff;
  --gris-boton-desactivado: #eeeeee;
}
```

## Archivos

- `phone-login-step.js` — el componente (todo en un solo archivo, sin dependencias)
- `demo.html` — pantalla final, ya conectada al backend de envío de SMS
- `backend/` — servidor que envía y verifica el código OTP con Twilio Verify

## Configurar el envío real de SMS (Twilio Verify)

No se recomienda generar y guardar los códigos OTP manualmente — es un riesgo
de seguridad y hay que manejar expiración, reintentos, límites, etc. Por eso
este backend usa **Twilio Verify**, que hace todo eso por ti.

### 1. Crear la cuenta y obtener credenciales

1. Crea una cuenta gratuita en [twilio.com](https://www.twilio.com) (el trial
   incluye crédito para pruebas).
2. En el **Dashboard** copia tu `Account SID` y tu `Auth Token`.
3. Ve a **Verify → Services** en el menú lateral, crea un servicio nuevo
   (ej. "Login App") y copia su `Service SID` (empieza con `VA...`).

### 2. Configurar el backend

```bash
cd backend
npm install
cp .env.example .env
```

Abre `.env` y pega tus valores reales:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_real
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Correr el servidor

```bash
npm start
```

Esto levanta el backend en `http://localhost:3000` con dos rutas:

- `POST /api/enviar-otp` — recibe `{ telefonoCompleto }` y manda el SMS
- `POST /api/verificar-otp` — recibe `{ telefonoCompleto, codigo }` y confirma si es correcto

### 4. Probarlo desde el navegador

Abre `demo.html` (con Live Server, por ejemplo). Al llenar el teléfono y dar
clic en "Continuar", se llama automáticamente a `/api/enviar-otp` y el
usuario recibirá el SMS real en su celular.

### Notas importantes

- **Nunca subas el archivo `.env` real a git** — solo `.env.example`.
- En el trial de Twilio solo puedes mandar SMS a números que hayas
  verificado manualmente en tu cuenta; para producción necesitas
  activar la cuenta de pago.
- Cuando despliegues el backend (Render, Railway, un VPS, etc.), cambia
  `URL_BACKEND` en `demo.html` por la URL pública real.
