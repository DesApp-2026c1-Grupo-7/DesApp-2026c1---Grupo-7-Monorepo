const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const { auth, authorize } = require('../middlewares/auth');

router.get('/', subjectController.getSubjects);
router.get('/:id', subjectController.getSubjectById);

router.post('/', auth, authorize('admin'), subjectController.createSubject);
router.put('/:id', auth, authorize('admin'), subjectController.updateSubject);
router.delete('/:id', auth, authorize('admin'), subjectController.deleteSubject);

module.exports = router;
