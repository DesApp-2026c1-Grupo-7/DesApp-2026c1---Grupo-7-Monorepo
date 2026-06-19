const { Router } = require('express');
const { register, login, loginGoogle } = require('../controllers/auth.controller');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', loginGoogle);

module.exports = router;
