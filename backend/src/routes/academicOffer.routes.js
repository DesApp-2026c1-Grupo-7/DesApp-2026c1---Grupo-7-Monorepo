const { Router } = require('express');
const academicOfferController = require('../controllers/academicOffer.controller');
const { auth, authorize } = require('../middlewares/auth');

const router = Router();

router.get('/', auth, academicOfferController.listOffers);
router.post('/', auth, authorize('admin'), academicOfferController.upsertOffer);
router.delete('/:id', auth, authorize('admin'), academicOfferController.deleteOffer);

module.exports = router;
