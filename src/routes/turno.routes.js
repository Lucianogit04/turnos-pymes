// src/routes/turno.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/turno.controller');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// --- Públicas (las usa la página de reservas) ---
router.get('/config', ctrl.obtenerConfig);
router.get('/disponibles', ctrl.horariosDisponibles);
router.post('/', ctrl.crearTurno);

// --- Solo administrador (requieren sesión) ---
router.get('/', requireAuth, ctrl.listarTurnos);
router.patch('/:id', requireAuth, ctrl.actualizarEstado);
router.delete('/:id', requireAuth, ctrl.eliminarTurno);

module.exports = router;
