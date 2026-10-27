#!/usr/bin/env node
// scripts/setup.js
// Asistente de instalación: crea o actualiza el archivo .env haciendo preguntas.
//   npm run setup             → configuración completa
//   npm run cambiar-password  → solo cambia usuario y contraseña del admin

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const dotenv = require('dotenv');
const { hashPassword } = require('../src/utils/password');

const ENV_PATH = path.join(__dirname, '..', '.env');
const SOLO_PASSWORD = process.argv.includes('--solo-password');

const actual = fs.existsSync(ENV_PATH) ? dotenv.parse(fs.readFileSync(ENV_PATH)) : {};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
let ocultar = false;
// Mientras se escribe la contraseña, se muestran asteriscos en lugar de los caracteres
rl._writeToOutput = function (s) {
  if (!ocultar) return rl.output.write(s);
  if (s === '\r\n' || s === '\n' || s === '\r') return rl.output.write('\n');
  if (s.length === 1) rl.output.write('*');
};

// Cola de líneas: funciona tanto escribiendo en la terminal como con respuestas por tubería
const cola = [];
let esperando = null;
rl.on('line', (linea) => {
  if (esperando) {
    const r = esperando;
    esperando = null;
    r(linea);
  } else cola.push(linea);
});
const leerLinea = () => (cola.length ? Promise.resolve(cola.shift()) : new Promise((r) => (esperando = r)));

async function preguntar(texto, porDefecto = '') {
  const sufijo = porDefecto ? ` [${porDefecto}]` : '';
  rl.output.write(`${texto}${sufijo}: `);
  const r = (await leerLinea()).trim();
  return r || porDefecto;
}

async function preguntarOculto(texto) {
  rl.output.write(`${texto}: `);
  ocultar = true;
  const r = await leerLinea();
  ocultar = false;
  if (!process.stdin.isTTY) rl.output.write('\n');
  return r;
}

const ocultarUri = (uri) => (uri ? uri.replace(/\/\/([^:]+):[^@]+@/, '//$1:****@') : '');
const validarHora = (h) => /^([01]\d|2[0-3]):[0-5]\d$/.test(h);

async function pedirPassword() {
  while (true) {
    const p1 = await preguntarOculto('Contraseña del administrador (mín. 8 caracteres)');
    if (p1.length < 8) {
      console.log('  ✖ Muy corta, probá de nuevo.');
      continue;
    }
    const p2 = await preguntarOculto('Repetí la contraseña');
    if (p1 !== p2) {
      console.log('  ✖ No coinciden, probá de nuevo.');
      continue;
    }
    return p1;
  }
}

async function main() {
  console.log('\n=== Configuración del Sistema de Turnos ===');
  console.log('Enter = dejar el valor entre corchetes.\n');

  const env = { ...actual };

  if (!SOLO_PASSWORD) {
    env.NEGOCIO_NOMBRE = await preguntar('Nombre del negocio', actual.NEGOCIO_NOMBRE || 'Mi Negocio');

    let uri = '';
    while (!uri.startsWith('mongodb')) {
      const r = await preguntar(
        'URI de MongoDB (Atlas o local)',
        actual.MONGODB_URI ? ocultarUri(actual.MONGODB_URI) : 'mongodb://127.0.0.1:27017/turnos_pymes'
      );
      // Si apretó Enter sobre la URI existente (mostrada con ****), se conserva la original
      uri = r === ocultarUri(actual.MONGODB_URI) ? actual.MONGODB_URI : r;
      if (!uri.startsWith('mongodb')) console.log('  ✖ Debe empezar con mongodb:// o mongodb+srv://');
    }
    env.MONGODB_URI = uri;

    env.PORT = await preguntar('Puerto', actual.PORT || '3000');

    do env.HORA_APERTURA = await preguntar('Hora de apertura (HH:mm)', actual.HORA_APERTURA || '09:00');
    while (!validarHora(env.HORA_APERTURA));
    do env.HORA_CIERRE = await preguntar('Hora de cierre (HH:mm)', actual.HORA_CIERRE || '18:00');
    while (!validarHora(env.HORA_CIERRE));

    env.DURACION_TURNO_MIN = await preguntar('Duración de cada turno en minutos', actual.DURACION_TURNO_MIN || '30');
    env.DIAS_LABORABLES = await preguntar(
      'Días de atención (0=dom, 1=lun ... 6=sáb, separados por coma)',
      actual.DIAS_LABORABLES || '1,2,3,4,5,6'
    );
    env.NODE_ENV = await preguntar('Entorno (development / production)', actual.NODE_ENV || 'development');
  }

  console.log('\n--- Acceso al panel de administración ---');
  env.ADMIN_USER = await preguntar('Usuario administrador', actual.ADMIN_USER || 'admin');
  env.ADMIN_PASSWORD_HASH = hashPassword(await pedirPassword());

  // Secreto de sesión: se genera una vez. Al cambiar la contraseña se renueva
  // para cerrar todas las sesiones abiertas.
  env.SESSION_SECRET = SOLO_PASSWORD || !actual.SESSION_SECRET ? crypto.randomBytes(32).toString('hex') : actual.SESSION_SECRET;

  const orden = [
    'NEGOCIO_NOMBRE', 'PORT', 'NODE_ENV', 'MONGODB_URI',
    'HORA_APERTURA', 'HORA_CIERRE', 'DURACION_TURNO_MIN', 'DIAS_LABORABLES',
    'ADMIN_USER', 'ADMIN_PASSWORD_HASH', 'SESSION_SECRET',
  ];
  const extras = Object.keys(env).filter((k) => !orden.includes(k));
  const lineas = [...orden, ...extras]
    .filter((k) => env[k] !== undefined && env[k] !== '')
    .map((k) => `${k}=${/[\s#"']/.test(env[k]) ? `"${env[k].replace(/"/g, '\\"')}"` : env[k]}`);

  const contenido = `# Generado por "npm run setup" — ${new Date().toLocaleString('es-AR')}\n# ⚠️ No compartas este archivo: contiene contraseñas.\n${lineas.join('\n')}\n`;

  if (fs.existsSync(ENV_PATH)) fs.copyFileSync(ENV_PATH, `${ENV_PATH}.backup`);
  fs.writeFileSync(ENV_PATH, contenido, 'utf8');

  console.log('\n✅ Configuración guardada en .env');
  if (fs.existsSync(`${ENV_PATH}.backup`)) console.log('   (la versión anterior quedó en .env.backup)');
  console.log('   Iniciá el sistema con:  npm start\n');
  rl.close();
}

main().catch((err) => {
  console.error('❌', err.message);
  rl.close();
  process.exit(1);
});
