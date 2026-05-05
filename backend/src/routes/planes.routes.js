const { Router } = require('express');
const { list, getById, create, update, remove } = require('../controllers/planes.controller');
const { verifyToken, requireRole } = require('../middlewares/auth');

const router = Router();

router.get('/', verifyToken, list);
router.get('/:id', verifyToken, getById);
router.post('/', verifyToken, requireRole('admin'), create);
router.put('/:id', verifyToken, requireRole('admin'), update);
router.delete('/:id', verifyToken, requireRole('admin'), remove);

module.exports = router;
