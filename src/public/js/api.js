// api.js — pequeño cliente para hablar con la API (compartido por cliente y admin)
const API = {
  async request(url, options = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const body = await res.json().catch(() => ({}));
    // Sesión vencida dentro del panel → volver al login
    if (res.status === 401 && location.pathname.startsWith('/admin')) {
      location.replace('/login.html');
    }
    if (!res.ok || body.ok === false) {
      throw new Error(body.mensaje || `Error ${res.status}`);
    }
    return body;
  },
  get: (url) => API.request(url),
  post: (url, data) => API.request(url, { method: 'POST', body: JSON.stringify(data) }),
  patch: (url, data) => API.request(url, { method: 'PATCH', body: JSON.stringify(data) }),
  del: (url) => API.request(url, { method: 'DELETE' }),
};

// Fecha local de hoy en formato YYYY-MM-DD
function fechaHoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// "2026-10-27" -> "mar 27/10/2026"
function formatearFecha(fecha) {
  const [a, m, d] = fecha.split('-').map(Number);
  const dia = new Date(a, m - 1, d).toLocaleDateString('es-AR', { weekday: 'short' });
  return `${dia} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`;
}
