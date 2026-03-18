const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const validationMiddleware = require('../middleware/validation.middleware');

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.delete('/:id', validationMiddleware.validateObjectId, userController.deleteUser);
router.patch('/:id/role', validationMiddleware.validateObjectId, validationMiddleware.validateUserRole, userController.updateUserRole);
router.get('/stats/employees', userController.getEmployeeStats);

module.exports = router;