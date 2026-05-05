const { Router } = require('express');
const healthRoutes = require('./health.routes');

const router = Router();

router.use('/health', healthRoutes);

// Aca se montan los routers de cada modulo a medida que se agregan:
// router.use('/auth', require('./auth.routes'));
// router.use('/usuarios', require('./usuarios.routes'));
// router.use('/carreras', require('./carreras.routes'));
// router.use('/planes', require('./planes.routes'));
// router.use('/materias', require('./materias.routes'));

module.exports = router;
