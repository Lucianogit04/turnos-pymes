// src/routes/auth.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/auth.controller');

const router = Router();

router.post('/login', ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', ctrl.me);

module.exports = router;
