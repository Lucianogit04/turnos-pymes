// src/controllers/turno.controller.js
const mongoose = require('mongoose');
const Turno = require('../models/Turno');
const negocio = require('../config/negocio');
const {
  esFechaValida,
  diaDeSemana,
  hoy,
  ahoraEnMinutos,
  aMinutos,
  generarHorarios,
} = require('../utils/fechas');

const ESTADOS_ACTIVOS = ['Pendiente', 'Completado'];

// Error con código HTTP para el manejador central
const httpError = (status, mensaje) => Object.assign(new Error(mensaje), { status });

// Horarios del día según la configuración del negocio
const horariosDelDia = () =>
  generarHorarios(negocio.horaApertura, negocio.horaCierre, negocio.duracionTurnoMin);

// Valida que fecha + hora sean reservables (formato, día laborable, horario, no pasado)
function validarHorario(fecha, hora) {
  if (!esFechaValida(fecha)) throw httpError(400, 'La fecha no es válida (formato YYYY-MM-DD)');
  if (!negocio.diasLaborables.includes(diaDeSemana(fecha))) {
    throw httpError(400, 'Ese día no hay atención');
  }
  if (!horariosDelDia().includes(hora)) {
    throw httpError(400, `Horario no disponible. Atendemos de ${negocio.horaApertura} a ${negocio.horaCierre}`);
  }
  const fechaHoy = hoy();
  if (fecha < fechaHoy || (fecha === fechaHoy && aMinutos(hora) <= ahoraEnMinutos())) {
    throw httpError(400, 'No se puede reservar en una fecha u hora pasada');
  }
}

// POST /api/turnos
async function crearTurno(req, res, next) {
  try {
    const { nombreCliente, whatsapp, fecha, hora } = req.body;
    if (!nombreCliente || !whatsapp || !fecha || !hora) {
      throw httpError(400, 'Completá nombre, WhatsApp, fecha y hora');
    }

    validarHorario(fecha, hora);

    // ✅ Validación crítica: ¿ya hay un turno activo en esa fecha y hora?
    const ocupado = await Turno.exists({ fecha, hora, estado: { $in: ESTADOS_ACTIVOS } });
    if (ocupado) {
      throw httpError(409, `El horario ${hora} del ${fecha} ya está reservado. Elegí otro.`);
    }

    // El índice único cubre el caso de dos reservas simultáneas (ver manejo de E11000 abajo)
    const turno = await Turno.create({ nombreCliente, whatsapp, fecha, hora });
    res.status(201).json({ ok: true, mensaje: '¡Turno reservado con éxito!', data: turno });
  } catch (err) {
    next(err);
  }
}

// GET /api/turnos?fecha=YYYY-MM-DD&estado=Pendiente&desde=...&hasta=...&q=texto
async function listarTurnos(req, res, next) {
  try {
    const { fecha, estado, desde, hasta, q } = req.query;
    const filtro = {};

    if (fecha) filtro.fecha = fecha;
    else if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = desde;
      if (hasta) filtro.fecha.$lte = hasta;
    }

    if (estado) {
      if (!Turno.ESTADOS.includes(estado)) throw httpError(400, `Estado inválido: ${estado}`);
      filtro.estado = estado;
    }

    if (q) {
      const texto = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // evita regex inyectada
      filtro.$or = [
        { nombreCliente: { $regex: texto, $options: 'i' } },
        { whatsapp: { $regex: texto } },
      ];
    }

    const turnos = await Turno.find(filtro).sort({ fecha: 1, hora: 1 }).lean();
    res.json({ ok: true, total: turnos.length, data: turnos });
  } catch (err) {
    next(err);
  }
}

// GET /api/turnos/disponibles?fecha=YYYY-MM-DD
// Devuelve los horarios del día marcando cuáles están libres (lo usa el formulario del cliente)
async function horariosDisponibles(req, res, next) {
  try {
    const { fecha } = req.query;
    if (!fecha || !esFechaValida(fecha)) throw httpError(400, 'Indicá una fecha válida (YYYY-MM-DD)');

    if (!negocio.diasLaborables.includes(diaDeSemana(fecha))) {
      return res.json({ ok: true, fecha, cerrado: true, data: [] });
    }

    const ocupados = await Turno.find({ fecha, estado: { $in: ESTADOS_ACTIVOS } })
      .select('hora -_id')
      .lean();
    const setOcupados = new Set(ocupados.map((t) => t.hora));

    const esHoy = fecha === hoy();
    const ahora = ahoraEnMinutos();
    const pasada = fecha < hoy();

    const data = horariosDelDia().map((hora) => ({
      hora,
      disponible: !pasada && !setOcupados.has(hora) && !(esHoy && aMinutos(hora) <= ahora),
    }));

    res.json({ ok: true, fecha, cerrado: false, data });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/turnos/:id   body: { estado: "Completado" | "Cancelado" | "Pendiente" }
async function actualizarEstado(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!mongoose.isValidObjectId(id)) throw httpError(400, 'ID inválido');
    if (!Turno.ESTADOS.includes(estado)) {
      throw httpError(400, `Estado inválido. Usá: ${Turno.ESTADOS.join(', ')}`);
    }

    const turno = await Turno.findByIdAndUpdate(id, { estado }, { new: true, runValidators: true });
    if (!turno) throw httpError(404, 'Turno no encontrado');

    res.json({ ok: true, mensaje: `Turno marcado como ${estado}`, data: turno });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/turnos/:id
async function eliminarTurno(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw httpError(400, 'ID inválido');

    const turno = await Turno.findByIdAndDelete(id);
    if (!turno) throw httpError(404, 'Turno no encontrado');

    res.json({ ok: true, mensaje: 'Turno eliminado', data: turno });
  } catch (err) {
    next(err);
  }
}

// GET /api/turnos/config — horario del negocio para el frontend
function obtenerConfig(req, res) {
  res.json({ ok: true, data: { ...negocio, horarios: horariosDelDia() } });
}

module.exports = {
  crearTurno,
  listarTurnos,
  horariosDisponibles,
  actualizarEstado,
  eliminarTurno,
  obtenerConfig,
};
