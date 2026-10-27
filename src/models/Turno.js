// src/models/Turno.js
const mongoose = require('mongoose');
const { REGEX_FECHA, REGEX_HORA } = require('../utils/fechas');

const ESTADOS = ['Pendiente', 'Completado', 'Cancelado'];

const turnoSchema = new mongoose.Schema(
  {
    nombreCliente: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [80, 'El nombre no puede superar 80 caracteres'],
    },
    whatsapp: {
      type: String,
      required: [true, 'El WhatsApp es obligatorio'],
      trim: true,
      // Acepta +54 9 11 1234-5678, 1112345678, etc. Se guarda solo con dígitos (y + inicial).
      set: (v) => (typeof v === 'string' ? v.replace(/(?!^\+)[^\d]/g, '') : v),
      match: [/^\+?\d{8,15}$/, 'El WhatsApp debe tener entre 8 y 15 dígitos'],
    },
    fecha: {
      type: String, // YYYY-MM-DD
      required: [true, 'La fecha es obligatoria'],
      match: [REGEX_FECHA, 'La fecha debe tener formato YYYY-MM-DD'],
    },
    hora: {
      type: String, // HH:mm
      required: [true, 'La hora es obligatoria'],
      match: [REGEX_HORA, 'La hora debe tener formato HH:mm'],
    },
    estado: {
      type: String,
      enum: { values: ESTADOS, message: 'Estado inválido: {VALUE}' },
      default: 'Pendiente',
    },
  },
  {
    timestamps: true, // createdAt y updatedAt
    versionKey: false,
  }
);

// 🔒 Garantía a nivel base de datos: no puede haber dos turnos ACTIVOS
// (Pendiente o Completado) en la misma fecha y hora.
// Los cancelados no cuentan, así ese horario vuelve a quedar libre.
turnoSchema.index(
  { fecha: 1, hora: 1 },
  {
    unique: true,
    partialFilterExpression: { estado: { $in: ['Pendiente', 'Completado'] } },
    name: 'turno_unico_por_horario',
  }
);

turnoSchema.statics.ESTADOS = ESTADOS;

module.exports = mongoose.model('Turno', turnoSchema);
