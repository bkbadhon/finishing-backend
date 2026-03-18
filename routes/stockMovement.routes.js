const express = require('express');
const router = express.Router();
const stockMovementController = require('../controllers/stockMovement.controller');

router.get('/', stockMovementController.getAllMovements);
router.post('/', stockMovementController.createMovement);
router.get('/summary/date-range', stockMovementController.getMovementSummary);
router.get('/recent/:limit', stockMovementController.getRecentMovements);
router.get('/product/:productName', stockMovementController.getMovementsByProduct);
router.get('/stats/overview', stockMovementController.getStats);
router.get('/:fgId', stockMovementController.getMovementsByFgId);

module.exports = router;