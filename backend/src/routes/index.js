const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const carrerasRoutes = require('./carreras.routes');
const materiasRoutes = require('./materias.routes');
const planesRoutes = require('./planes.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/carreras', carrerasRoutes);
router.use('/materias', materiasRoutes);
router.use('/planes', planesRoutes);

module.exports = router;
