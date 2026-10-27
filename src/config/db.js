// src/config/db.js
// Conexión a MongoDB con Mongoose (sirve tanto para local como para Atlas).

const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) {
    throw new Error('Falta la variable MONGODB_URI en el archivo .env');
  }

  // Muestra solo el host, nunca el usuario/contraseña.
  const safeHost = uri.replace(/\/\/([^@]+@)?/, '//').split('/')[2];

  mongoose.connection.on('connected', () => {
    console.log(`✅ MongoDB conectado (${safeHost})`);
  });
  mongoose.connection.on('error', (err) => {
    console.error('❌ Error de MongoDB:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB desconectado');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000, // falla rápido si Mongo no está levantado
  });

  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.connection.close();
}

module.exports = { connectDB, disconnectDB };
