// src/utils/password.js
// Hash de contraseñas con scrypt (incluido en Node, sin dependencias externas).
// Formato guardado: scrypt$<salt hex>$<hash hex>

const crypto = require('crypto');

const KEYLEN = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEYLEN).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.startsWith('scrypt$')) return false;
  const [, salt, hashHex] = stored.split('$');
  if (!salt || !/^[0-9a-f]{128}$/.test(hashHex || '')) return false; // hash incompleto o mal copiado
  const esperado = Buffer.from(hashHex, 'hex');
  const calculado = crypto.scryptSync(password, salt, esperado.length);
  return esperado.length === calculado.length && crypto.timingSafeEqual(esperado, calculado);
}

module.exports = { hashPassword, verifyPassword };
