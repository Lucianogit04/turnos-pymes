// login.js — inicio de sesión del administrador
const form = document.getElementById('form-login');
const alerta = document.getElementById('alerta');
const btn = document.getElementById('btn-login');

// Si ya hay sesión, ir directo al panel
API.get('/api/auth/me').then(() => location.replace('/admin')).catch(() => {});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alerta.className = 'alert';

  const usuario = form.usuario.value.trim();
  const password = form.password.value;
  if (!usuario || !password) {
    alerta.className = 'alert show error';
    alerta.textContent = 'Completá usuario y contraseña.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Ingresando…';
  try {
    await API.post('/api/auth/login', { usuario, password });
    location.replace('/admin');
  } catch (err) {
    alerta.className = 'alert show error';
    alerta.textContent = err.message;
    form.password.value = '';
    form.password.focus();
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ingresar';
  }
});
