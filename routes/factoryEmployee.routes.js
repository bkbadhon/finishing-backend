const express = require('express');
const router = express.Router();
const factoryEmployeeController = require('../controllers/factoryEmployee.controller');
const validationMiddleware = require('../middleware/validation.middleware');

router.get('/', factoryEmployeeController.getAllEmployees);
router.get('/stats/summary', factoryEmployeeController.getEmployeeStats);
router.get('/:id', validationMiddleware.validateObjectId, factoryEmployeeController.getEmployeeById);
router.put('/:id', validationMiddleware.validateObjectId, factoryEmployeeController.updateEmployee);
router.post('/search', factoryEmployeeController.searchEmployees);
router.patch('/bulk', factoryEmployeeController.bulkUpdateEmployees);
router.get('/export/:format', factoryEmployeeController.exportEmployees);

module.exports = router;