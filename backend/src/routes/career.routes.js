const express = require('express');
const router = express.Router();
const careerController = require('../controllers/career.controller');
const { auth, authorize } = require('../middlewares/auth');

// Lectura pública (cualquier user logueado o no, depende de la app)
router.get('/', careerController.getCareers);
router.get('/:id', careerController.getCareerById);

// Escritura solo admin
router.post('/', auth, authorize('admin'), careerController.createCareer);
router.put('/:id', auth, authorize('admin'), careerController.updateCareer);
router.delete('/:id', auth, authorize('admin'), careerController.deleteCareer);

// Admin — estadísticas de comunidad
router.get('/admin/comunidad-activa', auth, authorize('admin'), careerController.getComunidadActiva);

module.exports = router;
