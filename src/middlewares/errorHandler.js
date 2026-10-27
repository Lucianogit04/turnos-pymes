// src/middlewares/errorHandler.js
// Traduce cualquier error a una respuesta JSON clara para el frontend.

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let mensaje = err.message || 'Error interno del servidor';

  // Errores de validación de Mongoose (campos requeridos, formato, etc.)
  if (err.name === 'ValidationError') {
    status = 400;
    mensaje = Object.values(err.errors).map((e) => e.message).join('. ');
  }

  // Índice único: dos reservas simultáneas para el mismo horario
  if (err.code === 11000) {
    status = 409;
    mensaje = 'Ese horario acaba de ser reservado. Elegí otro.';
  }

  // JSON mal formado en el body
  if (err.type === 'entity.parse.failed') {
    status = 400;
    mensaje = 'El cuerpo de la petición no es un JSON válido';
  }

  if (status >= 500) console.error('💥', err);

  res.status(status).json({ ok: false, mensaje });
}

module.exports = errorHandler;
