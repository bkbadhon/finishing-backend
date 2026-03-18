const dbService = require('./db.service');
const IdGenerator = require('../utils/idGenerator.util');
const ProductionProductModel = require('../models/ProductionProduct.model');

class ProductionProductService {
    constructor() {
        this.collection = null;
    }

    async initialize() {
        this.collection = await dbService.ensureCollection('productionproducts');
    }

    async getAllProducts() {
        await this.initialize();
        return await this.collection.find().sort({ productId: -1 }).toArray();
    }

    async getProductById(id) {
        await this.initialize();
        return await this.collection.findOne({ productId: id });
    }

    async getProductsByCategory(category) {
        await this.initialize();
        return await this.collection.find({ category }).sort({ productId: -1 }).toArray();
    }

    async getProductsByStage(stage) {
        await this.initialize();
        return await this.collection.find({ productionStage: stage }).sort({ productId: -1 }).toArray();
    }

    async getProductsByStatus(status) {
        await this.initialize();
        return await this.collection.find({ status }).sort({ productId: -1 }).toArray();
    }

    async getProductsBySupervisor(supervisorName) {
        await this.initialize();
        return await this.collection
            .find({ assignedSupervisor: { $regex: supervisorName, $options: 'i' } })
            .sort({ productId: -1 })
            .toArray();
    }

    async createProduct(productData) {
        await this.initialize();
        
        // Check for duplicate product code
        const existing = await this.collection.findOne({ productCode: productData.productCode });
        if (existing) {
            throw new Error('Product code already exists');
        }

        const productId = await IdGenerator.generateProductId(this.collection);
        
        const newProduct = new ProductionProductModel({
            ...productData,
            productId
        });

        const result = await this.collection.insertOne(newProduct);
        const stats = await this.getStats();
        
        return { ...newProduct, _id: result.insertedId, stats };
    }

    async updateProduct(id, productData) {
        await this.initialize();
        
        const existing = await this.getProductById(id);
        if (!existing) {
            throw new Error('Product not found');
        }

        // Check for duplicate product code
        if (productData.productCode && productData.productCode !== existing.productCode) {
            const duplicate = await this.collection.findOne({
                productCode: productData.productCode,
                productId: { $ne: id }
            });
            if (duplicate) {
                throw new Error('Product code already exists');
            }
        }

        const quantity = parseFloat(productData.quantity) || existing.quantity;
        const unitCost = parseFloat(productData.unitCost) || existing.unitCost;

        const updateData = {
            ...productData,
            quantity,
            unitCost,
            totalCost: quantity * unitCost,
            updatedAt: new Date()
        };

        const result = await this.collection.updateOne(
            { productId: id },
            { $set: updateData }
        );

        const stats = await this.getStats();
        
        return { result, stats };
    }

    async deleteProduct(id) {
        await this.initialize();
        
        const result = await this.collection.deleteOne({ productId: id });
        const stats = await this.getStats();
        
        return { result, stats };
    }

    async getStats() {
        await this.initialize();
        
        const stats = await this.collection.aggregate([
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    runningCount: {
                        $sum: { $cond: [{ $eq: ["$status", "Running"] }, 1, 0] }
                    },
                    completedCount: {
                        $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
                    },
                    totalCost: { $sum: "$totalCost" },
                    totalQuantity: { $sum: "$quantity" },
                    avgUnitCost: { $avg: "$unitCost" },
                    doorCount: {
                        $sum: { $cond: [{ $eq: ["$category", "Door"] }, 1, 0] }
                    },
                    cabinetCount: {
                        $sum: { $cond: [{ $eq: ["$category", "Cabinet"] }, 1, 0] }
                    },
                    bedCount: {
                        $sum: { $cond: [{ $eq: ["$category", "Bed"] }, 1, 0] }
                    },
                    customCount: {
                        $sum: { $cond: [{ $eq: ["$category", "Custom"] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0
                }
            }
        ]).toArray();

        return stats[0] || {
            totalProducts: 0, runningCount: 0, completedCount: 0,
            totalCost: 0, totalQuantity: 0, avgUnitCost: 0,
            doorCount: 0, cabinetCount: 0, bedCount: 0, customCount: 0
        };
    }

    async bulkUpdateStage(productIds, productionStage) {
        await this.initialize();
        
        const updateData = {
            productionStage,
            updatedAt: new Date()
        };

        if (productionStage === 'Complete') {
            updateData.status = 'Completed';
        }

        const result = await this.collection.updateMany(
            { productId: { $in: productIds } },
            { $set: updateData }
        );

        const stats = await this.getStats();
        
        return { result, stats };
    }
}

module.exports = new ProductionProductService();