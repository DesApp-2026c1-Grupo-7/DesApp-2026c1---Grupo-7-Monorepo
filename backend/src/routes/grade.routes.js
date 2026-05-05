const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/grade.controller');
const { auth } = require('../middlewares/auth');

router.get('/situacion', auth, gradeController.getStudentSituation);
router.post('/situacion', auth, gradeController.updateGrade);

module.exports = router;
