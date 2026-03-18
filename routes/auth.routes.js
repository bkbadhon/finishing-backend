const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validationMiddleware = require('../middleware/validation.middleware');

router.post('/login', validationMiddleware.validateLogin, authController.login);

module.exports = router;