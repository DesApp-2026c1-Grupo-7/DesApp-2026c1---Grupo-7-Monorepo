const express = require('express');
const router = express.Router();
const materialController = require('../controllers/material.controller');
const { auth, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.get('/', auth, materialController.getMaterials);
router.get('/admin/materias-top', auth, authorize('admin'), materialController.getTopSubjectsByMaterials);
router.get('/admin/materiales-top-valorados', auth, authorize('admin'), materialController.getTopRatedMaterials);
router.get('/discord-info', auth, materialController.getDiscordInfo);
router.post('/', auth, upload.single('archivo'), materialController.createMaterial);
router.post('/:id/valorar', auth, materialController.rateMaterial);
router.delete('/:id', auth, materialController.deleteMaterial);

module.exports = router;
