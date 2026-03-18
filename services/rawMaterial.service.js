const dbService = require('./db.service');
const IdGenerator = require('../utils/idGenerator.util');
const RawMaterialModel = require('../models/RawMaterial.model');
const Helpers = require('../utils/helpers.util');

class RawMaterialService {
    constructor() {
        this.collection = null;
    }

    async initialize() {
        this.collection = await dbService.ensureCollection('rawmaterials');
    }

    async getAllMaterials() {
        await this.initialize();
        return await this.collection.find().sort({ materialId: -1 }).toArray();
    }

    async getMaterialById(id) {
        await this.initialize();
        return await this.collection.findOne({ materialId: id });
    }

    async getMaterialsByType(type) {
        await this.initialize();
        return await this.collection.find({ type }).sort({ materialName: 1 }).toArray();
    }

    async getMaterialsBySupplier(supplierName) {
        await this.initialize();
        return await this.collection
            .find({ supplierName: { $regex: supplierName, $options: 'i' } })
            .sort({ purchaseDate: -1 })
            .toArray();
    }

    async createMaterial(materialData) {
        await this.initialize();
        
        const materialId = await IdGenerator.generateMaterialId(this.collection);
        
        const newMaterial = new RawMaterialModel({
            ...materialData,
            materialId
        });

        const result = await this.collection.insertOne(newMaterial);
        
        // Alert for low stock
        if (newMaterial.status === 'Low') {
            console.log(`⚠️ LOW STOCK ALERT: ${newMaterial.materialName} (${newMaterial.materialId})`);
        } else if (newMaterial.status === 'Out of Stock') {
            console.log(`🔴 OUT OF STOCK ALERT: ${newMaterial.materialName} (${newMaterial.materialId})`);
        }

        return { ...newMaterial, _id: result.insertedId };
    }

    async updateMaterial(id, materialData) {
        await this.initialize();
        
        const existing = await this.getMaterialById(id);
        if (!existing) {
            throw new Error('Raw material not found');
        }

        const quantity = parseFloat(materialData.quantity) || existing.quantity;
        const unitPrice = parseFloat(materialData.unitPrice) || existing.unitPrice;
        const currentStock = parseFloat(materialData.currentStock) !== undefined ?
            parseFloat(materialData.currentStock) : existing.currentStock;
        const minStock = parseFloat(materialData.minimumStockLevel) !== undefined ?
            parseFloat(materialData.minimumStockLevel) : existing.minimumStockLevel;

        const status = Helpers.determineStockStatus(currentStock, minStock);

        const updateData = {
            ...materialData,
            quantity,
            unitPrice,
            totalValue: quantity * unitPrice,
            currentStock,
            minimumStockLevel: minStock,
            status,
            updatedAt: new Date()
        };

        const result = await this.collection.updateOne(
            { materialId: id },
            { $set: updateData }
        );

        // Alert for low stock
        if (status === 'Low') {
            console.log(`⚠️ LOW STOCK ALERT: ${updateData.materialName || existing.materialName} (${id})`);
        } else if (status === 'Out of Stock') {
            console.log(`🔴 OUT OF STOCK ALERT: ${updateData.materialName || existing.materialName} (${id})`);
        }

        return { result, status };
    }

    async deleteMaterial(id) {
        await this.initialize();
        return await this.collection.deleteOne({ materialId: id });
    }

    async getLowStockMaterials() {
        await this.initialize();
        return await this.collection
            .find({
                $expr: { $lte: ["$currentStock", "$minimumStockLevel"] },
                currentStock: { $gt: 0 }
            })
            .sort({ currentStock: 1 })
            .toArray();
    }

    async getOutOfStockMaterials() {
        await this.initialize();
        return await this.collection
            .find({ currentStock: 0 })
            .sort({ materialName: 1 })
            .toArray();
    }

    async getMaterialsByUnit(unit) {
        await this.initialize();
        return await this.collection
            .find({ unit })
            .sort({ materialName: 1 })
            .toArray();
    }

    async getStats() {
        await this.initialize();
        
        const stats = await this.collection.aggregate([
            {
                $group: {
                    _id: null,
                    totalMaterials: { $sum: 1 },
                    totalValue: { $sum: "$totalValue" },
                    totalQuantity: { $sum: "$quantity" },
                    lowStockCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $lte: ["$currentStock", "$minimumStockLevel"] },
                                        { $gt: ["$currentStock", 0] }
                                    ]
                                },
                                1, 0
                            ]
                        }
                    },
                    outOfStockCount: {
                        $sum: {
                            $cond: [{ $eq: ["$currentStock", 0] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0
                }
            }
        ]).toArray();

        const typeStats = await this.collection.aggregate([
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        const result = stats[0] || {
            totalMaterials: 0, totalValue: 0, totalQuantity: 0,
            lowStockCount: 0, outOfStockCount: 0
        };

        result.byType = typeStats;

        return result;
    }

    async bulkStockUpdate(materialIds, adjustmentType, adjustmentValue) {
        await this.initialize();
        
        const results = [];
        const value = parseFloat(adjustmentValue) || 0;

        for (const id of materialIds) {
            const material = await this.getMaterialById(id);
            if (material) {
                let newStock;
                if (adjustmentType === 'increase') {
                    newStock = material.currentStock + value;
                } else if (adjustmentType === 'decrease') {
                    newStock = Math.max(0, material.currentStock - value);
                }

                const newStatus = Helpers.determineStockStatus(newStock, material.minimumStockLevel);

                const result = await this.collection.updateOne(
                    { materialId: id },
                    {
                        $set: {
                            currentStock: newStock,
                            status: newStatus,
                            updatedAt: new Date()
                        }
                    }
                );

                if (result.modifiedCount > 0) {
                    results.push(id);
                }
            }
        }

        return results.length;
    }
}

module.exports = new RawMaterialService();