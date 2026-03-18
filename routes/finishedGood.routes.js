const express = require('express');
const router = express.Router();
const finishedGoodController = require('../controllers/finishedGood.controller');

router.get('/', finishedGoodController.getAllGoods);
router.post('/', finishedGoodController.createGood);
router.get('/stats/total-value', finishedGoodController.getStats);
router.get('/category/:category', finishedGoodController.getGoodsByCategory);
router.get('/low-stock/:threshold', finishedGoodController.getLowStock);
router.get('/:id', finishedGoodController.getGoodById);
router.put('/:id', finishedGoodController.updateGood);
router.delete('/:id', finishedGoodController.deleteGood);

module.exports = router;