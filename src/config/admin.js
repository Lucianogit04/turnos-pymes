// src/config/admin.js
// Lee usuario y hash del admin desde las variables de entorno, tolerando errores
// típicos al copiarlos en un hosting: espacios, comillas o el nombre de la variable pegado.

const limpiar = (valor, nombre) => {
  let v = String(valor || '').trim();
  if (v.startsWith(`${nombre}=`)) v = v.slice(nombre.length + 1).trim(); // pegó "ADMIN_USER=admin"
  if (/^(["']).*\1$/.test(v)) v = v.slice(1, -1).trim(); // pegó con comillas
  return v;
};

function getAdmin() {
  return {
    usuario: limpiar(process.env.ADMIN_USER, 'ADMIN_USER'),
    hash: limpiar(process.env.ADMIN_PASSWORD_HASH, 'ADMIN_PASSWORD_HASH'),
  };
}

// Diagnóstico para los logs (nunca muestra la contraseña ni el hash)
function diagnosticoAdmin() {
  const { usuario, hash } = getAdmin();
  if (!usuario || !hash) {
    return '⚠️  Admin SIN configurar: faltan ADMIN_USER y/o ADMIN_PASSWORD_HASH.';
  }
  const partes = hash.split('$');
  const hashOk = partes.length === 3 && partes[0] === 'scrypt' && /^[0-9a-f]{32}$/.test(partes[1]) && /^[0-9a-f]{128}$/.test(partes[2]);
  return hashOk
    ? `🔐 Admin configurado: usuario "${usuario}" · contraseña: formato válido ✓`
    : `❌ Admin "${usuario}": ADMIN_PASSWORD_HASH mal pegado (debe empezar con "scrypt$" y tener ${32 + 128 + 8} caracteres; tiene ${hash.length}). Generalo de nuevo con "npm run generar-hash".`;
}

module.exports = { getAdmin, diagnosticoAdmin };
