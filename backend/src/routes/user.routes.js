const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { auth, authorize } = require('../middlewares/auth');

const router = Router();

router.use(auth, authorize('admin'));

router.get('/', userController.listUsers);
router.post('/admins', userController.createAdmin);
router.put('/:id/suspender', userController.suspendUser);
router.put('/:id/reactivar', userController.reactivateUser);
router.put('/:id/hacer-admin', userController.promoteUserToAdmin);

module.exports = router;
