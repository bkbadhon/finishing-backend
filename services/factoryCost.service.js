const dbService = require('./db.service');
const IdGenerator = require('../utils/idGenerator.util');
const FactoryCostModel = require('../models/FactoryCost.model');
const Helpers = require('../utils/helpers.util');

class FactoryCostService {
    constructor() {
        this.collection = null;
    }

    async initialize() {
        this.collection = await dbService.ensureCollection('factorycosts');
    }

    async getAllCosts(month = null) {
        await this.initialize();
        
        const query = month ? Helpers.createDateRangeQuery(month) : {};
        return await this.collection.find(query).sort({ date: -1 }).toArray();
    }

    async getCostById(id) {
        await this.initialize();
        return await this.collection.findOne({ costId: id });
    }

    async createCost(costData) {
        await this.initialize();
        
        const costId = await IdGenerator.generateCostId(this.collection);
        
        const newCost = new FactoryCostModel({
            ...costData,
            costId,
            date: new Date(costData.date)
        });

        const result = await this.collection.insertOne(newCost);
        return { ...newCost, _id: result.insertedId };
    }

    async updateCost(id, costData) {
        await this.initialize();
        
        const updateData = {
            ...costData,
            date: new Date(costData.date),
            amount: parseFloat(costData.amount) || 0,
            updatedAt: new Date()
        };

        return await this.collection.updateOne(
            { costId: id },
            { $set: updateData }
        );
    }

    async deleteCost(id) {
        await this.initialize();
        return await this.collection.deleteOne({ costId: id });
    }

    async getCostsByDateRange(startDate, endDate) {
        await this.initialize();
        
        const query = {
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        return await this.collection.find(query).sort({ date: -1 }).toArray();
    }

    async getCostSummary(month = null) {
        await this.initialize();
        
        const matchStage = month ? { $match: Helpers.createDateRangeQuery(month) } : { $match: {} };

        const summary = await this.collection.aggregate([
            matchStage,
            {
                $group: {
                    _id: "$costCategory",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 },
                    avgAmount: { $avg: "$amount" }
                }
            }
        ]).toArray();

        const totalStats = await this.collection.aggregate([
            matchStage,
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" },
                    totalCount: { $sum: 1 },
                    avgAmount: { $avg: "$amount" },
                    maxAmount: { $max: "$amount" },
                    minAmount: { $min: "$amount" }
                }
            }
        ]).toArray();

        return {
            byCategory: summary,
            overall: totalStats[0] || { totalAmount: 0, totalCount: 0, avgAmount: 0, maxAmount: 0, minAmount: 0 }
        };
    }
}

module.exports = new FactoryCostService();