// src/config/negocio.js
// Reglas del negocio: horario de atención y duración de cada turno.
// Se pueden ajustar desde el .env sin tocar código.

const negocio = {
  nombre: process.env.NEGOCIO_NOMBRE || 'Mi Negocio',
  horaApertura: process.env.HORA_APERTURA || '09:00', // HH:mm
  horaCierre: process.env.HORA_CIERRE || '18:00', // HH:mm (último turno empieza antes de esta hora)
  duracionTurnoMin: Number(process.env.DURACION_TURNO_MIN) || 30,
  // 0 = domingo, 6 = sábado. Por defecto: lunes a sábado.
  diasLaborables: (process.env.DIAS_LABORABLES || '1,2,3,4,5,6').split(',').map(Number),
};

module.exports = negocio;
