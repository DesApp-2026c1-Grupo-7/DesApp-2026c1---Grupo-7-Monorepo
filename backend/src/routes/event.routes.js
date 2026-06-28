const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { auth } = require('../middlewares/auth');

router.use(auth);

router.get('/feed', eventController.getFeed);
router.post('/', eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
