const { Router } = require('express');
const healthRoutes = require('./health.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', require('./auth.routes'));
router.use('/carreras', require('./career.routes'));
router.use('/materias', require('./subject.routes'));
router.use('/planes', require('./studyPlan.routes'));
router.use('/academico', require('./grade.routes'));
router.use('/finales', require('./final.routes'));
router.use('/usuarios', require('./user.routes'));
router.use('/ofertas', require('./academicOffer.routes'));

module.exports = router;
