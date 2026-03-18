const dbService = require('./db.service');
const IdGenerator = require('../utils/idGenerator.util');
const StockMovementModel = require('../models/StockMovement.model');
const Helpers = require('../utils/helpers.util');

class StockMovementService {
    constructor() {
        this.collection = null;
    }

    async initialize() {
        this.collection = await dbService.ensureCollection('stockmovements');
    }

    async getAllMovements() {
        await this.initialize();
        return await this.collection.find().sort({ timestamp: -1 }).toArray();
    }

    async getMovementsByFgId(fgId) {
        await this.initialize();
        return await this.collection
            .find({ fgId })
            .sort({ timestamp: -1 })
            .toArray();
    }

    async createMovement(movementData) {
        await this.initialize();
        
        const movementId = await IdGenerator.generateMovementId(this.collection);
        
        const newMovement = new StockMovementModel({
            ...movementData,
            movementId,
            timestamp: movementData.timestamp || new Date()
        });

        const result = await this.collection.insertOne(newMovement);
        return { ...newMovement, _id: result.insertedId };
    }

    async getMovementsByDateRange(startDate, endDate) {
        await this.initialize();
        
        const query = Helpers.createDateRangeQueryFromDates(startDate, endDate);
        
        return await this.collection
            .find(query)
            .sort({ timestamp: -1 })
            .toArray();
    }

    async getRecentMovements(limit = 10) {
        await this.initialize();
        return await this.collection
            .find()
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
    }

    async getMovementsByProduct(productName) {
        await this.initialize();
        return await this.collection
            .find({
                productName: { $regex: productName, $options: 'i' }
            })
            .sort({ timestamp: -1 })
            .toArray();
    }

    async getMovementSummary(startDate, endDate) {
        await this.initialize();
        
        const query = startDate && endDate ? 
            Helpers.createDateRangeQueryFromDates(startDate, endDate) : {};

        const summary = await this.collection.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$changeType",
                    count: { $sum: 1 },
                    totalQuantity: { $sum: "$quantity" }
                }
            }
        ]).toArray();

        return summary;
    }

    async getStats() {
        await this.initialize();
        
        const stats = await this.collection.aggregate([
            {
                $group: {
                    _id: null,
                    totalMovements: { $sum: 1 },
                    totalAdded: {
                        $sum: {
                            $cond: [{ $eq: ["$changeType", "Added"] }, "$quantity", 0]
                        }
                    },
                    totalRemoved: {
                        $sum: {
                            $cond: [{ $eq: ["$changeType", "Removed"] }, "$quantity", 0]
                        }
                    },
                    totalUpdates: {
                        $sum: {
                            $cond: [{ $eq: ["$changeType", "Update"] }, 1, 0]
                        }
                    },
                    uniqueProducts: { $addToSet: "$productName" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalMovements: 1,
                    totalAdded: 1,
                    totalRemoved: 1,
                    totalUpdates: 1,
                    uniqueProductsCount: { $size: "$uniqueProducts" }
                }
            }
        ]).toArray();

        return stats[0] || {
            totalMovements: 0, totalAdded: 0, totalRemoved: 0,
            totalUpdates: 0, uniqueProductsCount: 0
        };
    }
}

module.exports = new StockMovementService();