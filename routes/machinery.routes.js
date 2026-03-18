const express = require('express');
const router = express.Router();
const machineryController = require('../controllers/machinery.controller');

router.get('/', machineryController.getAllMachinery);
router.post('/', machineryController.createMachinery);
router.get('/stats/total-value', machineryController.getStats);
router.get('/condition/:condition', machineryController.getMachineryByCondition);
router.get('/status/:status', machineryController.getMachineryByStatus);
router.get('/location/:location', machineryController.getMachineryByLocation);
router.get('/maintenance/due', machineryController.getMaintenanceDue);
router.get('/date-range', machineryController.getMachineryByDateRange);
router.get('/:id', machineryController.getMachineryById);
router.put('/:id', machineryController.updateMachinery);
router.delete('/:id', machineryController.deleteMachinery);
router.patch('/bulk/status', machineryController.bulkUpdateStatus);

module.exports = router;