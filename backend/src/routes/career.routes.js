const express = require('express');
const router = express.Router();
const careerController = require('../controllers/career.controller');

router.get('/', careerController.getCareers);
router.post('/', careerController.createCareer);

module.exports = router;
