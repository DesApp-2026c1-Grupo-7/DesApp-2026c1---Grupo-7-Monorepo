const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { auth, authorize } = require('../middlewares/auth');

// Rutas para estudiantes y admins
router.get('/reasons', auth, reportController.getReasons);
router.get('/config', auth, reportController.getReportConfig);
router.post('/', auth, reportController.createReport);

// Rutas solo para admins
router.get('/', auth, authorize('admin'), reportController.getAllReports);
router.patch('/config', auth, authorize('admin'), reportController.updateReportConfig);
router.patch('/:id/status', auth, authorize('admin'), reportController.updateReportStatus);

// CRUD de motivos para admins
router.post('/reasons', auth, authorize('admin'), reportController.createReason);
router.put('/reasons/:id', auth, authorize('admin'), reportController.updateReason);

module.exports = router;
