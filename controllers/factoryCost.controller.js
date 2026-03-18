const factoryCostService = require('../services/factoryCost.service');
const FactoryCostModel = require('../models/FactoryCost.model');

class FactoryCostController {
    async getAllCosts(req, res, next) {
        try {
            const { month } = req.query;
            const costs = await factoryCostService.getAllCosts(month);
            res.json(costs);
        } catch (error) {
            next(error);
        }
    }

    async createCost(req, res, next) {
        try {
            const validation = FactoryCostModel.validate(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ 
                    success: false,
                    error: validation.errors.join(', ') 
                });
            }

            const newCost = await factoryCostService.createCost(req.body);
            res.status(201).json(newCost);
        } catch (error) {
            next(error);
        }
    }

    async updateCost(req, res, next) {
        try {
            const { id } = req.params;

            const result = await factoryCostService.updateCost(id, req.body);

            if (result.matchedCount === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: "Cost not found" 
                });
            }

            res.json({ 
                success: true, 
                message: "Cost updated successfully" 
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteCost(req, res, next) {
        try {
            const { id } = req.params;

            const result = await factoryCostService.deleteCost(id);

            if (result.deletedCount === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: "Cost not found" 
                });
            }

            res.json({ 
                success: true, 
                message: "Cost deleted successfully" 
            });
        } catch (error) {
            next(error);
        }
    }

    async exportCosts(req, res, next) {
        try {
            const { month, format } = req.query;
            const costs = await factoryCostService.getAllCosts(month);
            
            res.json({
                success: true,
                message: "Export successful",
                format,
                month,
                data: costs
            });
        } catch (error) {
            next(error);
        }
    }

    async getCostSummary(req, res, next) {
        try {
            const { month } = req.query;
            const summary = await factoryCostService.getCostSummary(month);
            res.json(summary);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new FactoryCostController();