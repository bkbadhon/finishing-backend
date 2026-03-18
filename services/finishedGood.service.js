const dbService = require('./db.service');
const IdGenerator = require('../utils/idGenerator.util');
const FinishedGoodModel = require('../models/FinishedGood.model');

class FinishedGoodService {
    constructor() {
        this.collection = null;
    }

    async initialize() {
        this.collection = await dbService.ensureCollection('finishedgoods');
    }

    async getAllGoods() {
        await this.initialize();
        return await this.collection.find().sort({ fgId: -1 }).toArray();
    }

    async getGoodById(id) {
        await this.initialize();
        return await this.collection.findOne({ fgId: id });
    }

    async getGoodsByCategory(category) {
        await this.initialize();
        return await this.collection.find({ category }).sort({ productName: 1 }).toArray();
    }

    async createGood(goodData) {
        await this.initialize();
        
        // Check for duplicate product code
        const existing = await this.collection.findOne({ productCode: goodData.productCode });
        if (existing) {
            throw new Error('Product code already exists');
        }

        const fgId = await IdGenerator.generateFgId(this.collection);
        
        const newGood = new FinishedGoodModel({
            ...goodData,
            fgId,
            lastUpdated: new Date().toISOString().split('T')[0]
        });

        const result = await this.collection.insertOne(newGood);
        return { ...newGood, _id: result.insertedId };
    }

    async updateGood(id, goodData) {
        await this.initialize();
        
        const existing = await this.getGoodById(id);
        if (!existing) {
            throw new Error('Finished goods not found');
        }

        // Check for duplicate product code
        if (goodData.productCode && goodData.productCode !== existing.productCode) {
            const duplicate = await this.collection.findOne({
                productCode: goodData.productCode,
                fgId: { $ne: id }
            });
            if (duplicate) {
                throw new Error('Product code already exists');
            }
        }

        const quantity = parseFloat(goodData.quantityAvailable) || existing.quantityAvailable;
        const unitPrice = parseFloat(goodData.unitPrice) || existing.unitPrice;

        const updateData = {
            ...goodData,
            quantityAvailable: quantity,
            unitPrice,
            totalValue: quantity * unitPrice,
            lastUpdated: new Date().toISOString().split('T')[0],
            updatedAt: new Date()
        };

        return await this.collection.updateOne(
            { fgId: id },
            { $set: updateData }
        );
    }

    async deleteGood(id) {
        await this.initialize();
        return await this.collection.deleteOne({ fgId: id });
    }

    async getLowStock(threshold) {
        await this.initialize();
        return await this.collection
            .find({ quantityAvailable: { $lte: parseInt(threshold) } })
            .sort({ quantityAvailable: 1 })
            .toArray();
    }

    async getStats() {
        await this.initialize();
        
        const stats = await this.collection.aggregate([
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: "$totalValue" },
                    totalItems: { $sum: 1 },
                    totalQuantity: { $sum: "$quantityAvailable" },
                    avgUnitPrice: { $avg: "$unitPrice" },
                    maxValue: { $max: "$totalValue" },
                    minValue: { $min: "$totalValue" }
                }
            }
        ]).toArray();

        const result = stats[0] || {
            totalValue: 0, totalItems: 0, totalQuantity: 0,
            avgUnitPrice: 0, maxValue: 0, minValue: 0
        };

        delete result._id;
        return result;
    }
}

module.exports = new FinishedGoodService();