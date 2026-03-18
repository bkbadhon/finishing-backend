const express = require('express');
const router = express.Router();
const productionProductController = require('../controllers/productionProduct.controller');
const validationMiddleware = require('../middleware/validation.middleware');

router.get('/', productionProductController.getAllProducts);
router.post('/', productionProductController.createProduct);
router.get('/stats/overview', productionProductController.getStats);
router.get('/category/:category', productionProductController.getProductsByCategory);
router.get('/stage/:stage', validationMiddleware.validateProductionStage, productionProductController.getProductsByStage);
router.get('/status/:status', productionProductController.getProductsByStatus);
router.get('/supervisor/:name', productionProductController.getProductsBySupervisor);
router.get('/:id', productionProductController.getProductById);
router.put('/:id', productionProductController.updateProduct);
router.delete('/:id', productionProductController.deleteProduct);
router.patch('/bulk/stage', productionProductController.bulkUpdateStage);

module.exports = router;