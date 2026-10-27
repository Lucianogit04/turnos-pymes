// src/utils/fechas.js
// Helpers de fecha/hora con Date nativo (sin librerías).
// Trabajamos con strings "YYYY-MM-DD" y "HH:mm" para evitar problemas de zona horaria.

const REGEX_FECHA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const aMinutos = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

const aHora = (minutos) => {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0');
  const m = String(minutos % 60).padStart(2, '0');
  return `${h}:${m}`;
};

// Verifica que la fecha exista de verdad (ej: rechaza 2026-02-30)
const esFechaValida = (fecha) => {
  if (!REGEX_FECHA.test(fecha)) return false;
  const [a, m, d] = fecha.split('-').map(Number);
  const date = new Date(a, m - 1, d);
  return date.getFullYear() === a && date.getMonth() === m - 1 && date.getDate() === d;
};

const diaDeSemana = (fecha) => {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(a, m - 1, d).getDay();
};

// Fecha y hora actuales en formato local del servidor
const hoy = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};
const ahoraEnMinutos = () => {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
};

// Genera los horarios del día según apertura, cierre y duración
const generarHorarios = (apertura, cierre, duracion) => {
  const horarios = [];
  for (let t = aMinutos(apertura); t + duracion <= aMinutos(cierre); t += duracion) {
    horarios.push(aHora(t));
  }
  return horarios;
};

module.exports = {
  REGEX_FECHA,
  REGEX_HORA,
  aMinutos,
  esFechaValida,
  diaDeSemana,
  hoy,
  ahoraEnMinutos,
  generarHorarios,
};
