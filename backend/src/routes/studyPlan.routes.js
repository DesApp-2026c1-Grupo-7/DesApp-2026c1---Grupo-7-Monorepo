const express = require('express');
const router = express.Router();
const studyPlanController = require('../controllers/studyPlan.controller');

router.get('/', studyPlanController.getStudyPlans);
router.post('/', studyPlanController.createStudyPlan);

module.exports = router;
