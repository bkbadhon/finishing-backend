const express = require('express');
const router = express.Router();
const rawMaterialController = require('../controllers/rawMaterial.controller');

router.get('/', rawMaterialController.getAllMaterials);
router.post('/', rawMaterialController.createMaterial);
router.get('/stats/summary', rawMaterialController.getStats);
router.get('/type/:type', rawMaterialController.getMaterialsByType);
router.get('/supplier/:supplierName', rawMaterialController.getMaterialsBySupplier);
router.get('/low-stock', rawMaterialController.getLowStockMaterials);
router.get('/out-of-stock', rawMaterialController.getOutOfStockMaterials);
router.get('/unit/:unit', rawMaterialController.getMaterialsByUnit);
router.get('/:id', rawMaterialController.getMaterialById);
router.put('/:id', rawMaterialController.updateMaterial);
router.delete('/:id', rawMaterialController.deleteMaterial);
router.patch('/bulk/stock-update', rawMaterialController.bulkStockUpdate);

module.exports = router;