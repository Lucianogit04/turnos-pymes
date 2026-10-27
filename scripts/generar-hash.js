#!/usr/bin/env node
// scripts/generar-hash.js
// Genera el valor de ADMIN_PASSWORD_HASH para pegar en un hosting (Render, Railway...).
//   npm run generar-hash

const readline = require('readline');
const { hashPassword } = require('../src/utils/password');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
let ocultar = false;
rl._writeToOutput = (s) => {
  if (!ocultar) return rl.output.write(s);
  if (/[\r\n]/.test(s)) return rl.output.write('\n');
  if (s.length === 1) rl.output.write('*');
};

rl.output.write('Contraseña para el panel (mín. 8 caracteres): ');
ocultar = true;
rl.once('line', (pass) => {
  ocultar = false;
  if (pass.length < 8) {
    console.log('\n✖ Muy corta. Volvé a ejecutar el comando.');
    process.exit(1);
  }
  console.log('\n\nCopiá este valor completo en ADMIN_PASSWORD_HASH:\n');
  console.log(hashPassword(pass));
  console.log('');
  rl.close();
});
