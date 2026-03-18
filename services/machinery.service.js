const dbService = require('./db.service');
const IdGenerator = require('../utils/idGenerator.util');
const MachineryModel = require('../models/Machinery.model');

class MachineryService {
    constructor() {
        this.collection = null;
    }

    async initialize() {
        this.collection = await dbService.ensureCollection('machinery');
    }

    async getAllMachinery() {
        await this.initialize();
        return await this.collection.find().sort({ machineId: -1 }).toArray();
    }

    async getMachineryById(id) {
        await this.initialize();
        return await this.collection.findOne({ machineId: id });
    }

    async getMachineryByCondition(condition) {
        await this.initialize();
        return await this.collection.find({ condition }).sort({ machineId: -1 }).toArray();
    }

    async getMachineryByStatus(status) {
        await this.initialize();
        return await this.collection.find({ status }).sort({ machineId: -1 }).toArray();
    }

    async getMachineryByLocation(location) {
        await this.initialize();
        return await this.collection
            .find({ location: { $regex: location, $options: 'i' } })
            .sort({ machineId: -1 })
            .toArray();
    }

    async createMachinery(machineryData) {
        await this.initialize();
        
        // Check for duplicate serial number
        const existing = await this.collection.findOne({ serialNumber: machineryData.serialNumber });
        if (existing) {
            throw new Error('Serial number already exists');
        }

        const machineId = await IdGenerator.generateMachineId(this.collection);
        
        const newMachinery = new MachineryModel({
            ...machineryData,
            machineId
        });

        const result = await this.collection.insertOne(newMachinery);
        return { ...newMachinery, _id: result.insertedId };
    }

    async updateMachinery(id, machineryData) {
        await this.initialize();
        
        const existing = await this.getMachineryById(id);
        if (!existing) {
            throw new Error('Machinery not found');
        }

        // Check for duplicate serial number
        if (machineryData.serialNumber && machineryData.serialNumber !== existing.serialNumber) {
            const duplicate = await this.collection.findOne({
                serialNumber: machineryData.serialNumber,
                machineId: { $ne: id }
            });
            if (duplicate) {
                throw new Error('Serial number already exists');
            }
        }

        const updateData = {
            ...machineryData,
            purchasePrice: parseFloat(machineryData.purchasePrice) || existing.purchasePrice,
            updatedAt: new Date()
        };

        return await this.collection.updateOne(
            { machineId: id },
            { $set: updateData }
        );
    }

    async deleteMachinery(id) {
        await this.initialize();
        return await this.collection.deleteOne({ machineId: id });
    }

    async getMaintenanceDue() {
        await this.initialize();
        
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const todayStr = today.toISOString().split('T')[0];
        const nextWeekStr = nextWeek.toISOString().split('T')[0];

        const machinery = await this.collection
            .find({
                maintenanceDate: {
                    $gte: todayStr,
                    $lte: nextWeekStr
                },
                status: "Active"
            })
            .sort({ maintenanceDate: 1 })
            .toArray();

        // Add days remaining
        return machinery.map(machine => {
            const maintDate = new Date(machine.maintenanceDate);
            const diffTime = maintDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return {
                ...machine,
                daysRemaining: diffDays
            };
        });
    }

    async getStats() {
        await this.initialize();
        
        const stats = await this.collection.aggregate([
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: "$purchasePrice" },
                    count: { $sum: 1 },
                    activeCount: {
                        $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] }
                    },
                    inactiveCount: {
                        $sum: { $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0] }
                    },
                    goodCount: {
                        $sum: { $cond: [{ $eq: ["$condition", "Good"] }, 1, 0] }
                    },
                    repairCount: {
                        $sum: { $cond: [{ $eq: ["$condition", "Repair"] }, 1, 0] }
                    },
                    damagedCount: {
                        $sum: { $cond: [{ $eq: ["$condition", "Damaged"] }, 1, 0] }
                    },
                    avgValue: { $avg: "$purchasePrice" },
                    maxValue: { $max: "$purchasePrice" },
                    minValue: { $min: "$purchasePrice" }
                }
            }
        ]).toArray();

        const result = stats[0] || {
            totalValue: 0, count: 0, activeCount: 0, inactiveCount: 0,
            goodCount: 0, repairCount: 0, damagedCount: 0,
            avgValue: 0, maxValue: 0, minValue: 0
        };

        delete result._id;
        return result;
    }

    async bulkUpdateStatus(machineIds, status) {
        await this.initialize();
        
        return await this.collection.updateMany(
            { machineId: { $in: machineIds } },
            {
                $set: {
                    status,
                    updatedAt: new Date()
                }
            }
        );
    }

    async getMachineryByDateRange(startDate, endDate) {
        await this.initialize();
        
        const query = {
            purchaseDate: {
                $gte: startDate,
                $lte: endDate
            }
        };

        return await this.collection
            .find(query)
            .sort({ purchaseDate: -1 })
            .toArray();
    }
}

module.exports = new MachineryService();