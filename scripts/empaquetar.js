#!/usr/bin/env node
// scripts/empaquetar.js
// Crea dist/turnos-pymes-v<version>.zip listo para entregar a un cliente.
// Excluye node_modules, .env (tus contraseñas), backups y la propia carpeta dist.
// Sin dependencias: arma el ZIP con zlib de Node.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const RAIZ = path.join(__dirname, '..');
const { name, version } = require('../package.json');
const EXCLUIR = new Set(['node_modules', '.env', '.env.backup', 'dist', '.git', '.vscode', '.cursor', '.DS_Store', 'VENDER.md', 'PUBLICAR.md', 'render.yaml']);

// --- CRC32 (requerido por el formato ZIP) ---
const TABLA = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = TABLA[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function listarArchivos(dir, base = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (EXCLUIR.has(e.name) || e.name.endsWith('.zip') || e.name.endsWith('.log')) return [];
    const rel = base ? `${base}/${e.name}` : e.name;
    const abs = path.join(dir, e.name);
    return e.isDirectory() ? listarArchivos(abs, rel) : [rel];
  });
}

function fechaDos(d) {
  const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const fecha = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { hora, fecha };
}

function crearZip(archivos, carpetaRaiz) {
  const locales = [];
  const centrales = [];
  let offset = 0;

  for (const rel of archivos) {
    const datos = fs.readFileSync(path.join(RAIZ, rel));
    const comprimido = zlib.deflateRawSync(datos, { level: 9 });
    const nombre = Buffer.from(`${carpetaRaiz}/${rel}`, 'utf8');
    const crc = crc32(datos);
    const { hora, fecha } = fechaDos(fs.statSync(path.join(RAIZ, rel)).mtime);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // versión necesaria
    local.writeUInt16LE(0x0800, 6); // nombres en UTF-8
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(hora, 10);
    local.writeUInt16LE(fecha, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comprimido.length, 18);
    local.writeUInt32LE(datos.length, 22);
    local.writeUInt16LE(nombre.length, 26);
    local.writeUInt16LE(0, 28);
    locales.push(local, nombre, comprimido);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(hora, 12);
    central.writeUInt16LE(fecha, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(comprimido.length, 20);
    central.writeUInt32LE(datos.length, 24);
    central.writeUInt16LE(nombre.length, 28);
    central.writeUInt32LE(offset, 42);
    centrales.push(central, nombre);

    offset += local.length + nombre.length + comprimido.length;
  }

  const tamCentral = centrales.reduce((s, b) => s + b.length, 0);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(archivos.length, 8);
  fin.writeUInt16LE(archivos.length, 10);
  fin.writeUInt32LE(tamCentral, 12);
  fin.writeUInt32LE(offset, 16);

  return Buffer.concat([...locales, ...centrales, fin]);
}

const archivos = listarArchivos(RAIZ);
const nombreZip = `${name}-v${version}.zip`;
fs.mkdirSync(path.join(RAIZ, 'dist'), { recursive: true });
const destino = path.join(RAIZ, 'dist', nombreZip);
fs.writeFileSync(destino, crearZip(archivos, name));

console.log(`\n📦 Paquete creado: dist/${nombreZip}  (${archivos.length} archivos)`);
console.log('   Sin node_modules ni .env: tus contraseñas no viajan en el ZIP.\n');
