// cliente.js — lógica de la vista de reserva (index.html)
const form = document.getElementById('form-reserva');
const inputFecha = document.getElementById('fecha');
const contSlots = document.getElementById('slots');
const alerta = document.getElementById('alerta');
const btnReservar = document.getElementById('btn-reservar');

let horaSeleccionada = null;

function mostrarAlerta(tipo, mensaje) {
  alerta.className = `alert show ${tipo}`;
  alerta.textContent = mensaje;
  alerta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function ocultarAlerta() {
  alerta.className = 'alert';
}

// Carga los horarios del día elegido y los pinta como botones
async function cargarHorarios(fecha) {
  horaSeleccionada = null;
  contSlots.innerHTML = '<div class="slots-empty">Cargando horarios…</div>';
  try {
    const { data, cerrado } = await API.get(`/api/turnos/disponibles?fecha=${fecha}`);

    if (cerrado) {
      contSlots.innerHTML = '<div class="slots-empty">Ese día no atendemos. Probá con otra fecha.</div>';
      return;
    }
    if (!data.some((s) => s.disponible)) {
      contSlots.innerHTML = '<div class="slots-empty">No quedan horarios libres para este día.</div>';
      return;
    }

    contSlots.innerHTML = '';
    data.forEach(({ hora, disponible }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot';
      btn.textContent = hora;
      btn.disabled = !disponible;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => {
        contSlots.querySelectorAll('.slot').forEach((b) => {
          b.classList.remove('selected');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
        horaSeleccionada = hora;
      });
      contSlots.appendChild(btn);
    });
  } catch (err) {
    contSlots.innerHTML = '<div class="slots-empty">No se pudieron cargar los horarios.</div>';
    mostrarAlerta('error', err.message);
  }
}

inputFecha.addEventListener('change', () => {
  ocultarAlerta();
  if (inputFecha.value) cargarHorarios(inputFecha.value);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarAlerta();

  const datos = {
    fecha: inputFecha.value,
    hora: horaSeleccionada,
    nombreCliente: form.nombreCliente.value.trim(),
    whatsapp: form.whatsapp.value.trim(),
  };

  if (!datos.fecha) return mostrarAlerta('error', 'Elegí una fecha.');
  if (!datos.hora) return mostrarAlerta('error', 'Elegí un horario.');
  if (datos.nombreCliente.length < 2) return mostrarAlerta('error', 'Ingresá tu nombre.');
  if (datos.whatsapp.replace(/\D/g, '').length < 8) return mostrarAlerta('error', 'Ingresá un WhatsApp válido.');

  btnReservar.disabled = true;
  btnReservar.textContent = 'Reservando…';
  try {
    await API.post('/api/turnos', datos);
    mostrarAlerta('success', `✅ ¡Listo, ${datos.nombreCliente}! Tu turno quedó reservado para el ${formatearFecha(datos.fecha)} a las ${datos.hora}.`);
    form.nombreCliente.value = '';
    form.whatsapp.value = '';
    cargarHorarios(datos.fecha); // refresca: el horario ahora aparece ocupado
  } catch (err) {
    mostrarAlerta('error', err.message);
    cargarHorarios(datos.fecha); // por si alguien lo reservó antes
  } finally {
    btnReservar.disabled = false;
    btnReservar.textContent = 'Reservar';
  }
});

// Inicio: no se puede elegir una fecha pasada y mostramos el horario del negocio
(async function init() {
  inputFecha.min = fechaHoy();
  try {
    const { data } = await API.get('/api/turnos/config');
    document.getElementById('negocio-nombre').textContent = data.nombre;
    document.getElementById('horario-info').textContent =
      `Atendemos de ${data.horaApertura} a ${data.horaCierre} · turnos de ${data.duracionTurnoMin} min.`;
  } catch {
    /* si falla, quedan los textos por defecto */
  }
})();
