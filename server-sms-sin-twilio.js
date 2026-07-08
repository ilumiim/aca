/**
 * server-sms-sin-twilio.js
 * Versión de desarrollo: el código se genera aquí mismo y se muestra en la
 * terminal (no se manda SMS real). A diferencia de versiones anteriores,
 * este archivo YA NO verifica que el código escrito sea el correcto —
 * simplemente guarda el que el usuario haya puesto y confirma.
 *
 * Instala con:
 *   npm install express
 *
 * Corre con:
 *   node server-sms-sin-twilio.js
 *
 * Abre en el navegador:
 *   http://localhost:3000/
 */

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // sirve flujo-completo.html y los componentes

// Ahora http://localhost:3000/ (sin nada más) abre directo el flujo
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "flujo-completo.html"));
});

// ---- AQUÍ CAMBIAS LA DIRECCIÓN QUE QUIERAS ----
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "flujo-completo.html"));
});

// ---- Códigos generados en memoria (solo para mostrarlos en consola) ----
const codigosActivos = {}; // { "+525512345678": "483920" }

function generarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
}

// ---- "Base de datos" mínima en un archivo JSON (para desarrollo) ----
const RUTA_DB = path.join(__dirname, "usuarios.json");

function leerUsuarios() {
  if (!fs.existsSync(RUTA_DB)) return [];
  return JSON.parse(fs.readFileSync(RUTA_DB, "utf-8"));
}

function guardarUsuarioVerificado(telefono, codigo) {
  const usuarios = leerUsuarios();
  const existente = usuarios.find((u) => u.telefono === telefono);

  if (existente) {
    existente.ultimoAcceso = new Date().toISOString();
    existente.ultimoCodigoUsado = codigo;
  } else {
    const siguienteId = usuarios.length > 0 ? Math.max(...usuarios.map((u) => u.id)) + 1 : 1;
    usuarios.push({
      id: siguienteId,
      telefono,
      creadoEn: new Date().toISOString(),
      ultimoAcceso: new Date().toISOString(),
      ultimoCodigoUsado: codigo,
    });
  }

  fs.writeFileSync(RUTA_DB, JSON.stringify(usuarios, null, 2));
}

// Paso 1: el usuario llena su teléfono y pide el código
app.post("/api/enviar-otp", (req, res) => {
  const { telefono, canal } = req.body;

  if (!telefono) {
    return res.status(400).json({ error: "Falta el número de teléfono" });
  }

  const codigo = generarCodigo();
  codigosActivos[telefono] = codigo;

  console.log(`>>> Código para ${telefono} (canal: ${canal || "sms"}): ${codigo}`);

  res.json({ ok: true });
});

// Paso 2: el usuario escribe cualquier código en las casillas.
// YA NO SE VALIDA contra el código real — se guarda tal cual y se confirma.
app.post("/api/verificar-otp", (req, res) => {
  const { telefono, codigo } = req.body;

  if (!telefono || !codigo) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  guardarUsuarioVerificado(telefono, codigo);
  delete codigosActivos[telefono];

  res.json({ ok: true });
});

const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});

// ---- Página para ver todos los usuarios guardados como una tabla ----
// Ábrela en: http://localhost:3000/usuarios
app.get("/usuarios", (req, res) => {
  const usuarios = leerUsuarios();

  const filas = usuarios
    .map(
      (u) => `
        <tr>
          <td>${u.id}</td>
          <td>${u.telefono}</td>
          <td>${u.ultimoCodigoUsado}</td>
          <td>${new Date(u.creadoEn).toLocaleString("es-MX")}</td>
          <td>${new Date(u.ultimoAcceso).toLocaleString("es-MX")}</td>
        </tr>`
    )
    .join("");

  res.send(`
    <!DOCTYPE html>
    <html lang="es-MX">
    <head>
      <meta charset="UTF-8" />
      <title>Usuarios registrados</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 32px; }
        h1 { font-size: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 16px; }
        th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; font-size: 14px; }
        th { background: #f5f5f5; }
        tr:nth-child(even) { background: #fafafa; }
      </style>
    </head>
    <body>
      <h1>Usuarios registrados (${usuarios.length})</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Teléfono</th>
            <th>Último código usado</th>
            <th>Creado</th>
            <th>Último acceso</th>
          </tr>
        </thead>
        <tbody>
          ${filas || `<tr><td colspan="5">Aún no hay usuarios guardados</td></tr>`}
        </tbody>
      </table>
    </body>
    </html>
  `);
});
