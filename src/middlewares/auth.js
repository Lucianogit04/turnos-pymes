// src/middlewares/auth.js
// Sesión del administrador con una cookie firmada (HMAC-SHA256).
// La cookie es HttpOnly: el JavaScript del navegador no puede leerla.

const crypto = require('crypto');

const COOKIE = 'admin_session';
const DURACION_HORAS = Number(process.env.SESSION_HOURS) || 8;

let SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('⚠️  Falta SESSION_SECRET en .env: las sesiones se cerrarán al reiniciar. Ejecutá "npm run setup".');
}

const b64 = (s) => Buffer.from(s).toString('base64url');
const firmar = (data) => crypto.createHmac('sha256', SECRET).update(data).digest('base64url');

function crearToken(usuario) {
  const payload = b64(JSON.stringify({ u: usuario, exp: Date.now() + DURACION_HORAS * 3600 * 1000 }));
  return `${payload}.${firmar(payload)}`;
}

function verificarToken(token) {
  if (!token || !token.includes('.')) return null;
  const [payload, firma] = token.split('.');
  const esperada = firmar(payload);
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return datos.exp > Date.now() ? datos : null;
  } catch {
    return null;
  }
}

function leerCookie(req, nombre) {
  const cookies = req.headers.cookie || '';
  const par = cookies.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${nombre}=`));
  return par ? decodeURIComponent(par.slice(nombre.length + 1)) : null;
}

function setSessionCookie(res, token) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production', // en producción solo por HTTPS
    maxAge: DURACION_HORAS * 3600 * 1000,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE, { path: '/' });
}

// Para rutas de la API: responde 401 si no hay sesión válida
function requireAuth(req, res, next) {
  const sesion = verificarToken(leerCookie(req, COOKIE));
  if (!sesion) return res.status(401).json({ ok: false, mensaje: 'Sesión expirada. Iniciá sesión nuevamente.' });
  req.admin = sesion.u;
  next();
}

// Para páginas HTML: redirige al login si no hay sesión
function requireAuthPage(req, res, next) {
  const sesion = verificarToken(leerCookie(req, COOKIE));
  if (!sesion) return res.redirect('/login.html');
  req.admin = sesion.u;
  next();
}

module.exports = {
  crearToken,
  verificarToken,
  leerCookie,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  requireAuthPage,
  COOKIE,
};
