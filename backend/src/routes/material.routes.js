const express = require('express');
const router = express.Router();
const materialController = require('../controllers/material.controller');
const { auth } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.get('/', auth, materialController.getMaterials);
router.post('/', auth, upload.single('archivo'), materialController.createMaterial);
router.delete('/:id', auth, materialController.deleteMaterial);

module.exports = router;
