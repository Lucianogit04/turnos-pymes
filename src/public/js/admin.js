// admin.js — lógica del panel de administración (admin.html)
const tbody = document.getElementById('tabla-turnos');
const fFecha = document.getElementById('f-fecha');
const fEstado = document.getElementById('f-estado');
const fQ = document.getElementById('f-q');
const toastEl = document.getElementById('toast');

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove('show'), 2500);
}

// Escapa texto para insertarlo seguro en HTML
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function linkWhatsapp(numero) {
  const limpio = numero.replace(/\D/g, '');
  return `<a href="https://wa.me/${limpio}" target="_blank" rel="noopener">${esc(numero)}</a>`;
}

function botonesAccion(t) {
  const btns = [];
  if (t.estado === 'Pendiente') {
    btns.push(`<button class="btn btn-sm" data-accion="Completado" data-id="${t._id}">✓ Completar</button>`);
    btns.push(`<button class="btn btn-sm btn-ghost" data-accion="Cancelado" data-id="${t._id}">Cancelar</button>`);
  } else {
    btns.push(`<button class="btn btn-sm btn-ghost" data-accion="Pendiente" data-id="${t._id}">↺ Reabrir</button>`);
  }
  btns.push(`<button class="btn btn-sm btn-danger" data-accion="eliminar" data-id="${t._id}" title="Eliminar">🗑</button>`);
  return `<div class="actions">${btns.join('')}</div>`;
}

function pintarTabla(turnos) {
  const cuenta = { Pendiente: 0, Completado: 0, Cancelado: 0 };
  turnos.forEach((t) => cuenta[t.estado]++);
  document.getElementById('st-total').textContent = turnos.length;
  document.getElementById('st-pend').textContent = cuenta.Pendiente;
  document.getElementById('st-comp').textContent = cuenta.Completado;
  document.getElementById('st-canc').textContent = cuenta.Cancelado;

  if (!turnos.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay turnos con estos filtros.</td></tr>';
    return;
  }

  tbody.innerHTML = turnos
    .map(
      (t) => `
      <tr>
        <td class="num">${formatearFecha(t.fecha)}</td>
        <td class="num">${t.hora}</td>
        <td>${esc(t.nombreCliente)}</td>
        <td class="num">${linkWhatsapp(t.whatsapp)}</td>
        <td><span class="badge ${t.estado}">${t.estado}</span></td>
        <td>${botonesAccion(t)}</td>
      </tr>`
    )
    .join('');
}

async function cargarTurnos() {
  const params = new URLSearchParams();
  if (fFecha.value) params.set('fecha', fFecha.value);
  if (fEstado.value) params.set('estado', fEstado.value);
  if (fQ.value.trim()) params.set('q', fQ.value.trim());

  try {
    const { data } = await API.get(`/api/turnos?${params}`);
    pintarTabla(data);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">Error: ${esc(err.message)}</td></tr>`;
  }
}

// Delegación de eventos para los botones de cada fila
tbody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-accion]');
  if (!btn) return;
  const { id, accion } = btn.dataset;

  try {
    if (accion === 'eliminar') {
      if (!confirm('¿Eliminar este turno definitivamente?')) return;
      await API.del(`/api/turnos/${id}`);
      toast('Turno eliminado');
    } else {
      const { mensaje } = await API.patch(`/api/turnos/${id}`, { estado: accion });
      toast(mensaje);
    }
    cargarTurnos();
  } catch (err) {
    toast(`⚠️ ${err.message}`);
  }
});

// Filtros
let debounce;
fFecha.addEventListener('change', cargarTurnos);
fEstado.addEventListener('change', cargarTurnos);
fQ.addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(cargarTurnos, 300);
});
document.getElementById('btn-hoy').addEventListener('click', () => {
  fFecha.value = fechaHoy();
  cargarTurnos();
});
document.getElementById('btn-limpiar').addEventListener('click', () => {
  fFecha.value = '';
  fEstado.value = '';
  fQ.value = '';
  cargarTurnos();
});

cargarTurnos();

// Sesión: usuario actual y cierre de sesión
document.getElementById('btn-logout').addEventListener('click', async () => {
  try {
    await API.post('/api/auth/logout');
  } finally {
    location.replace('/login.html');
  }
});
API.get('/api/auth/me')
  .then(({ usuario }) => (document.getElementById('admin-usuario').textContent = usuario))
  .catch(() => {});
