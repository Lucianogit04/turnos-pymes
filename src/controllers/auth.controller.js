// src/controllers/auth.controller.js
const crypto = require('crypto');
const { verifyPassword } = require('../utils/password');
const {
  crearToken,
  verificarToken,
  leerCookie,
  setSessionCookie,
  clearSessionCookie,
  COOKIE,
} = require('../middlewares/auth');

// Freno simple contra fuerza bruta: 5 intentos fallidos por IP cada 15 minutos
const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;
const intentos = new Map(); // ip -> { count, desde }

function bloqueado(ip) {
  const r = intentos.get(ip);
  if (!r) return false;
  if (Date.now() - r.desde > VENTANA_MS) {
    intentos.delete(ip);
    return false;
  }
  return r.count >= MAX_INTENTOS;
}
function registrarFallo(ip) {
  const r = intentos.get(ip);
  if (!r || Date.now() - r.desde > VENTANA_MS) intentos.set(ip, { count: 1, desde: Date.now() });
  else r.count++;
}

// Compara strings sin filtrar información por el tiempo de respuesta
const igualSeguro = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

// POST /api/auth/login  body: { usuario, password }
function login(req, res) {
  const ip = req.ip;
  if (bloqueado(ip)) {
    return res.status(429).json({ ok: false, mensaje: 'Demasiados intentos. Esperá 15 minutos.' });
  }

  const { ADMIN_USER, ADMIN_PASSWORD_HASH } = process.env;
  if (!ADMIN_USER || !ADMIN_PASSWORD_HASH) {
    return res.status(503).json({
      ok: false,
      mensaje: 'El administrador no está configurado. Ejecutá "npm run setup" en el servidor.',
    });
  }

  const { usuario = '', password = '' } = req.body || {};
  const usuarioOk = igualSeguro(usuario.trim(), ADMIN_USER);
  const passOk = verifyPassword(String(password), ADMIN_PASSWORD_HASH);

  if (!usuarioOk || !passOk) {
    registrarFallo(ip);
    return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos' });
  }

  intentos.delete(ip);
  setSessionCookie(res, crearToken(ADMIN_USER));
  res.json({ ok: true, mensaje: 'Sesión iniciada', usuario: ADMIN_USER });
}

// POST /api/auth/logout
function logout(req, res) {
  clearSessionCookie(res);
  res.json({ ok: true, mensaje: 'Sesión cerrada' });
}

// GET /api/auth/me — ¿hay sesión activa?
function me(req, res) {
  const sesion = verificarToken(leerCookie(req, COOKIE));
  if (!sesion) return res.status(401).json({ ok: false, mensaje: 'Sin sesión' });
  res.json({ ok: true, usuario: sesion.u });
}

module.exports = { login, logout, me };
