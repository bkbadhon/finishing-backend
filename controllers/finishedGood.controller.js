const finishedGoodService = require('../services/finishedGood.service');
const FinishedGoodModel = require('../models/FinishedGood.model');

class FinishedGoodController {
    async getAllGoods(req, res, next) {
        try {
            const goods = await finishedGoodService.getAllGoods();
            res.json(goods);
        } catch (error) {
            next(error);
        }
    }

    async getGoodById(req, res, next) {
        try {
            const { id } = req.params;
            const good = await finishedGoodService.getGoodById(id);

            if (!good) {
                return res.status(404).json({ 
                    success: false,
                    error: "Finished goods not found" 
                });
            }

            res.json(good);
        } catch (error) {
            next(error);
        }
    }

    async createGood(req, res, next) {
        try {
            const validation = FinishedGoodModel.validate(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ 
                    success: false,
                    error: validation.errors.join(', ') 
                });
            }

            const newGood = await finishedGoodService.createGood(req.body);
            res.status(201).json(newGood);
        } catch (error) {
            if (error.message === 'Product code already exists') {
                return res.status(400).json({ 
                    success: false,
                    error: error.message 
                });
            }
            next(error);
        }
    }

    async updateGood(req, res, next) {
        try {
            const { id } = req.params;

            const result = await finishedGoodService.updateGood(id, req.body);

            if (result.matchedCount === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: "Finished goods not found" 
                });
            }

            res.json({
                success: true,
                message: "Finished goods updated successfully",
                modifiedCount: result.modifiedCount
            });
        } catch (error) {
            if (error.message === 'Product code already exists') {
                return res.status(400).json({ 
                    success: false,
                    error: error.message 
                });
            }
            next(error);
        }
    }

    async deleteGood(req, res, next) {
        try {
            const { id } = req.params;

            const result = await finishedGoodService.deleteGood(id);

            if (result.deletedCount === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: "Finished goods not found" 
                });
            }

            res.json({
                success: true,
                message: "Finished goods deleted successfully",
                deletedCount: result.deletedCount
            });
        } catch (error) {
            next(error);
        }
    }

    async getGoodsByCategory(req, res, next) {
        try {
            const { category } = req.params;
            const goods = await finishedGoodService.getGoodsByCategory(category);
            res.json(goods);
        } catch (error) {
            next(error);
        }
    }

    async getLowStock(req, res, next) {
        try {
            const { threshold } = req.params;
            const items = await finishedGoodService.getLowStock(threshold);
            res.json(items);
        } catch (error) {
            next(error);
        }
    }

    async getStats(req, res, next) {
        try {
            const stats = await finishedGoodService.getStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new FinishedGoodController();