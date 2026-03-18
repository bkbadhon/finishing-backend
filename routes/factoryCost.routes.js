const express = require('express');
const router = express.Router();
const factoryCostController = require('../controllers/factoryCost.controller');

router.get('/', factoryCostController.getAllCosts);
router.post('/', factoryCostController.createCost);
router.put('/:id', factoryCostController.updateCost);
router.delete('/:id', factoryCostController.deleteCost);
router.get('/export', factoryCostController.exportCosts);
router.get('/summary', factoryCostController.getCostSummary);

module.exports = router;