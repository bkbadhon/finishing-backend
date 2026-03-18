const rawMaterialService = require('../services/rawMaterial.service');
const RawMaterialModel = require('../models/RawMaterial.model');

class RawMaterialController {
    async getAllMaterials(req, res, next) {
        try {
            const materials = await rawMaterialService.getAllMaterials();
            res.json(materials);
        } catch (error) {
            next(error);
        }
    }

    async getMaterialById(req, res, next) {
        try {
            const { id } = req.params;
            const material = await rawMaterialService.getMaterialById(id);

            if (!material) {
                return res.status(404).json({ 
                    success: false,
                    error: "Raw material not found" 
                });
            }

            res.json(material);
        } catch (error) {
            next(error);
        }
    }

    async createMaterial(req, res, next) {
        try {
            const validation = RawMaterialModel.validate(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ 
                    success: false,
                    error: validation.errors.join(', ') 
                });
            }

            const newMaterial = await rawMaterialService.createMaterial(req.body);
            res.status(201).json(newMaterial);
        } catch (error) {
            next(error);
        }
    }

    async updateMaterial(req, res, next) {
        try {
            const { id } = req.params;

            const { result, status } = await rawMaterialService.updateMaterial(id, req.body);

            if (result.matchedCount === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: "Raw material not found" 
                });
            }

            res.json({
                success: true,
                message: "Raw material updated successfully",
                modifiedCount: result.modifiedCount,
                status
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteMaterial(req, res, next) {
        try {
            const { id } = req.params;

            const result = await rawMaterialService.deleteMaterial(id);

            if (result.deletedCount === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: "Raw material not found" 
                });
            }

            res.json({
                success: true,
                message: "Raw material deleted successfully",
                deletedCount: result.deletedCount
            });
        } catch (error) {
            next(error);
        }
    }

    async getMaterialsByType(req, res, next) {
        try {
            const { type } = req.params;
            const materials = await rawMaterialService.getMaterialsByType(type);
            res.json(materials);
        } catch (error) {
            next(error);
        }
    }

    async getMaterialsBySupplier(req, res, next) {
        try {
            const { supplierName } = req.params;
            const materials = await rawMaterialService.getMaterialsBySupplier(supplierName);
            res.json(materials);
        } catch (error) {
            next(error);
        }
    }

    async getLowStockMaterials(req, res, next) {
        try {
            const materials = await rawMaterialService.getLowStockMaterials();
            res.json(materials);
        } catch (error) {
            next(error);
        }
    }

    async getOutOfStockMaterials(req, res, next) {
        try {
            const materials = await rawMaterialService.getOutOfStockMaterials();
            res.json(materials);
        } catch (error) {
            next(error);
        }
    }

    async getMaterialsByUnit(req, res, next) {
        try {
            const { unit } = req.params;
            const materials = await rawMaterialService.getMaterialsByUnit(unit);
            res.json(materials);
        } catch (error) {
            next(error);
        }
    }

    async getStats(req, res, next) {
        try {
            const stats = await rawMaterialService.getStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    async bulkStockUpdate(req, res, next) {
        try {
            const { materialIds, adjustmentType, adjustmentValue } = req.body;

            if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
                return res.status(400).json({ 
                    success: false,
                    error: "Material IDs array is required" 
                });
            }

            const modifiedCount = await rawMaterialService.bulkStockUpdate(
                materialIds, 
                adjustmentType, 
                adjustmentValue
            );

            res.json({
                success: true,
                message: "Bulk stock update completed",
                modifiedCount
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RawMaterialController();