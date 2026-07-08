# Flujo de login por teléfono (versión de desarrollo, sin Twilio, sin validación de código)

Este proyecto muestra el flujo: pedir el teléfono → escribir un código de
6 dígitos → pasar a la pantalla de bienvenida.

**Importante:** en esta versión, el código que la persona escriba **no se
valida contra el código real generado**. Solo se guarda lo que haya puesto
y se le deja pasar. Es útil para maquetar el flujo o hacer pruebas rápidas,
pero no ofrece ninguna seguridad real — cualquiera puede escribir cualquier
número y pasar. Cuando quieras que sí verifique de verdad, dímelo y
regresamos esa validación.

## 1. Instalar dependencias

```bash
npm init -y
npm install express
```

## 2. Correr el servidor

```bash
node server-sms-sin-twilio.js
```

## 3. Abrir en el navegador

```
http://localhost:3000/
```

## 4. Probar el flujo

1. Escribe cualquier número de 10 dígitos y dale **Continuar**.
2. En la pantalla de código, escribe **cualquier** 6 dígitos (no necesitas
   ver la terminal ni copiar el código real).
3. En cuanto llenes las 6 casillas, te lleva directo a `inicio.html`
   (la pantalla de bienvenida).
4. Se guarda en `usuarios.json`, con el código que hayas puesto (real o no):
   ```json
   [
     {
       "id": 1,
       "telefono": "+525512345678",
       "creadoEn": "2026-07-07T10:20:00.000Z",
       "ultimoAcceso": "2026-07-07T10:20:00.000Z",
       "ultimoCodigoUsado": "000000"
     }
   ]
   ```

## Ver todos los usuarios guardados (como tabla)

Con el servidor corriendo, abre en el navegador:

```
http://localhost:3000/usuarios
```

Ahí verás una tabla con todos los teléfonos que se han registrado, su
código usado, y fechas — sin tener que abrir el archivo `.json` a mano.
Cada vez que un teléfono nuevo complete el flujo, aparece como una fila
nueva; si el mismo teléfono vuelve a entrar, se actualiza su fila (no se
duplica).

## Dónde cambiar tu marca

- **Logo y color de acento**: arriba de `flujo-completo.html`.
- **Colores de cada componente**: dentro de `phone-login-step.js` y
  `otp-verification-step.js`, busca el comentario `AQUÍ SE PERSONALIZA
  LA MARCA`.
- **La pantalla de bienvenida** (`inicio.html`): edítala como cualquier
  HTML normal, ahí puedes poner el contenido real de tu app.

## Cuando quieras que sí valide el código (recomendado antes de usarlo con gente real)

Esta versión es útil para maquetar rápido, pero cualquiera puede "iniciar
sesión" con cualquier número sin dueño real de ese teléfono. Antes de
usarlo con usuarios reales, hay que regresar la validación real del código
(comparando contra el que se generó) y, más adelante, conectar un
proveedor de SMS real como Twilio para que el código sí llegue al teléfono
correcto.
