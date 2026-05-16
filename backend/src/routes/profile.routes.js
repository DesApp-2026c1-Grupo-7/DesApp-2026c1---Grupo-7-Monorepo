const { Router } = require('express');
const profileController = require('../controllers/profile.controller');
const { auth } = require('../middlewares/auth');

const router = Router();

// Todas las rutas de perfil requieren autenticación
router.use(auth);

router.get('/me', profileController.getProfile);
router.put('/me', profileController.updateProfile);
router.get('/search', profileController.searchUsers);
router.get('/:id', profileController.getPublicProfile);

module.exports = router;
