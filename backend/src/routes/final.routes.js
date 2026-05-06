const express = require('express');
const router = express.Router();
const finalController = require('../controllers/final.controller');
const { auth } = require('../middlewares/auth');

router.get('/', auth, finalController.getFinales);
router.get('/pendientes', auth, finalController.getFinalesPendientes);
router.post('/', auth, finalController.inscribirseAFinal);
router.put('/:id/resultado', auth, finalController.registrarResultadoFinal);

module.exports = router;
