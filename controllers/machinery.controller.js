const machineryService = require('../services/machinery.service');
const MachineryModel = require('../models/Machinery.model');

class MachineryController {
    async getAllMachinery(req, res, next) {
        try {
            const machinery = await machineryService.getAllMachinery();
            res.json(machinery);
        } catch (error) {
            next(error);
        }
    }

    async getMachineryById(req, res, next) {
        try {
            const { id } = req.params;
            const machinery = await machineryService.getMachineryById(id);

            if (!machinery) {
                return res.status(404).json({ 
                    success: false,
                    error: "Machinery not found" 
                });
            }

            res.json(machinery);
        } catch (error) {
            next(error);
        }
    }

    async createMachinery(req, res, next) {
        try {
            const validation = MachineryModel.validate(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ 
                    success: false,
                    error: validation.errors.join(', ') 
                });
            }

            const newMachinery = await machineryService.createMachinery(req.body);
            
            // Calculate total value
            const stats = await machineryService.getStats();
            
            res.status(201).json({
                ...newMachinery,
                totalValue: stats.totalValue
            });
        } catch (error) {
            if (error.message === 'Serial number already exists') {
                return res.status(400).json({ 
                    success: false,
                    error: error.message 
                });
            }
            next(error);
        }
    }

    async updateMachinery(req, res, next) {
        try {
            const { id } = req.params;

            const result = await machineryService.updateMachinery(id, req.body);
            
            const stats = await machineryService.getStats();

            res.json({
                success: true,
                message: "Machinery updated successfully",
                modifiedCount: result.modifiedCount,
                totalValue: stats.totalValue
            });
        } catch (error) {
            if (error.message === 'Serial number already exists') {
                return res.status(400).json({ 
                    success: false,
                    error: error.message 
                });
            }
            if (error.message === 'Machinery not found') {
                return res.status(404).json({ 
                    success: false,
                    error: error.message 
                });
            }
            next(error);
        }
    }

    async deleteMachinery(req, res, next) {
        try {
            const { id } = req.params;

            const result = await machineryService.deleteMachinery(id);

            if (result.deletedCount === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: "Machinery not found" 
                });
            }

            const stats = await machineryService.getStats();

            res.json({
                success: true,
                message: "Machinery deleted successfully",
                deletedCount: result.deletedCount,
                totalValue: stats.totalValue
            });
        } catch (error) {
            next(error);
        }
    }

    async getMachineryByCondition(req, res, next) {
        try {
            const { condition } = req.params;
            const machinery = await machineryService.getMachineryByCondition(condition);
            res.json(machinery);
        } catch (error) {
            next(error);
        }
    }

    async getMachineryByStatus(req, res, next) {
        try {
            const { status } = req.params;
            const machinery = await machineryService.getMachineryByStatus(status);
            res.json(machinery);
        } catch (error) {
            next(error);
        }
    }

    async getMachineryByLocation(req, res, next) {
        try {
            const { location } = req.params;
            const machinery = await machineryService.getMachineryByLocation(location);
            res.json(machinery);
        } catch (error) {
            next(error);
        }
    }

    async getMaintenanceDue(req, res, next) {
        try {
            const machinery = await machineryService.getMaintenanceDue();
            res.json(machinery);
        } catch (error) {
            next(error);
        }
    }

    async getStats(req, res, next) {
        try {
            const stats = await machineryService.getStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    async bulkUpdateStatus(req, res, next) {
        try {
            const { machineIds, status } = req.body;

            if (!machineIds || !Array.isArray(machineIds) || machineIds.length === 0) {
                return res.status(400).json({ 
                    success: false,
                    error: "Machine IDs array is required" 
                });
            }

            const result = await machineryService.bulkUpdateStatus(machineIds, status);

            res.json({
                success: true,
                message: "Bulk status update completed",
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            });
        } catch (error) {
            next(error);
        }
    }

    async getMachineryByDateRange(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const machinery = await machineryService.getMachineryByDateRange(startDate, endDate);
            res.json(machinery);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MachineryController();