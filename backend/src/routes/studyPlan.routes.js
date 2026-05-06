const express = require('express');
const router = express.Router();
const studyPlanController = require('../controllers/studyPlan.controller');
const { auth, authorize } = require('../middlewares/auth');

router.get('/', studyPlanController.getStudyPlans);
router.get('/:id', studyPlanController.getStudyPlanById);

router.post('/', auth, authorize('admin'), studyPlanController.createStudyPlan);
router.put('/:id', auth, authorize('admin'), studyPlanController.updateStudyPlan);
router.delete('/:id', auth, authorize('admin'), studyPlanController.deleteStudyPlan);

module.exports = router;
