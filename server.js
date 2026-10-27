// server.js
// Punto de entrada: configura Express, sirve el frontend y conecta a MongoDB.

require('dotenv').config();

// Zona horaria del negocio: los hostings corren en UTC y eso correría los horarios 3 h.
process.env.TZ = process.env.TZ || 'America/Argentina/Buenos_Aires';

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('./src/config/db');
const { requireAuthPage } = require('./src/middlewares/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const ES_PRODUCCION = process.env.NODE_ENV === 'production';

// Detrás de un proxy (Render, Railway, Nginx) para que req.ip y las cookies "secure" funcionen
if (ES_PRODUCCION) app.set('trust proxy', 1);

// ---------- Middlewares globales ----------
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true }));

// ---------- Panel admin (protegido) ----------
// admin.html vive en /src/views (no es público): solo se sirve con sesión iniciada
app.get(['/admin', '/admin.html'], requireAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'views', 'admin.html'));
});

// Frontend público (index.html, login.html, css, js)
app.use(express.static(path.join(__dirname, 'src', 'public')));

// ---------- API ----------
app.get('/api/health', (req, res) => {
  const estados = ['desconectado', 'conectado', 'conectando', 'desconectando'];
  res.json({
    ok: true,
    entorno: process.env.NODE_ENV || 'development',
    baseDeDatos: estados[mongoose.connection.readyState] || 'desconocido',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/turnos', require('./src/routes/turno.routes'));

// 404 para rutas de API inexistentes
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Manejador central de errores
app.use(require('./src/middlewares/errorHandler'));

// ---------- Arranque ----------
async function start() {
  try {
    console.log(require('./src/config/admin').diagnosticoAdmin());

    await connectDB(process.env.MONGODB_URI);
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor en http://localhost:${PORT}`);
      console.log(`   Reservas: http://localhost:${PORT}`);
      console.log(`   Admin:    http://localhost:${PORT}/admin`);
    });

    // Cierre ordenado (Ctrl + C)
    const shutdown = () => {
      console.log('\n⏹️  Cerrando servidor...');
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ No se pudo iniciar la app:', error.message);
    process.exit(1);
  }
}

start();

module.exports = app;
