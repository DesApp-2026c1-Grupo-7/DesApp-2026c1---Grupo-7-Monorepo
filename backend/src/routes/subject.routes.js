const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');

router.get('/', subjectController.getSubjects);
router.post('/', subjectController.createSubject);

module.exports = router;
