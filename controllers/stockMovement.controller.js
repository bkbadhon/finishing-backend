const stockMovementService = require('../services/stockMovement.service');
const StockMovementModel = require('../models/StockMovement.model');

class StockMovementController {
    async getAllMovements(req, res, next) {
        try {
            const movements = await stockMovementService.getAllMovements();
            res.json(movements);
        } catch (error) {
            next(error);
        }
    }

    async getMovementsByFgId(req, res, next) {
        try {
            const { fgId } = req.params;
            const movements = await stockMovementService.getMovementsByFgId(fgId);
            res.json(movements);
        } catch (error) {
            next(error);
        }
    }

    async createMovement(req, res, next) {
        try {
            const validation = StockMovementModel.validate(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ 
                    success: false,
                    error: validation.errors.join(', ') 
                });
            }

            const newMovement = await stockMovementService.createMovement(req.body);
            res.status(201).json(newMovement);
        } catch (error) {
            next(error);
        }
    }

    async getMovementSummary(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const summary = await stockMovementService.getMovementSummary(startDate, endDate);
            res.json(summary);
        } catch (error) {
            next(error);
        }
    }

    async getRecentMovements(req, res, next) {
        try {
            const limit = parseInt(req.params.limit) || 10;
            const movements = await stockMovementService.getRecentMovements(limit);
            res.json(movements);
        } catch (error) {
            next(error);
        }
    }

    async getMovementsByProduct(req, res, next) {
        try {
            const { productName } = req.params;
            const movements = await stockMovementService.getMovementsByProduct(productName);
            res.json(movements);
        } catch (error) {
            next(error);
        }
    }

    async getStats(req, res, next) {
        try {
            const stats = await stockMovementService.getStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new StockMovementController();