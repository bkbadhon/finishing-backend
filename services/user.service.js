const { ObjectId } = require('mongodb');
const dbService = require('./db.service');
const IdGenerator = require('../utils/idGenerator.util');
const Helpers = require('../utils/helpers.util');
const UserModel = require('../models/User.model');

class UserService {
    constructor() {
        this.collection = null;
    }

    async initialize() {
        this.collection = await dbService.ensureCollection('users');
    }

    async getAllUsers() {
        await this.initialize();
        return await this.collection.find().toArray();
    }

    async getUserById(id) {
        await this.initialize();
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async getUserByUserId(userId) {
        await this.initialize();
        return await this.collection.findOne({ userId });
    }

    async createUser(userData) {
        await this.initialize();
        
        const idGenerator = IdGenerator.generateUserId(this.collection);
        const { slNo, userId, password } = await idGenerator();

        const newUser = new UserModel({
            slNo,
            userId,
            password,
            registeredAt: new Date(),
            createdAt: new Date()
        });

        const result = await this.collection.insertOne(newUser);
        return { ...newUser, _id: result.insertedId };
    }

    async updateUser(id, updateData) {
        await this.initialize();
        
        const updateFields = {
            ...updateData,
            updatedAt: new Date()
        };

        const result = await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateFields }
        );

        return result;
    }

    async updateUserRole(id, role) {
        await this.initialize();
        
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { 
                $set: { 
                    role, 
                    updatedAt: new Date() 
                } 
            }
        );
    }

    async deleteUser(id) {
        await this.initialize();
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }

    async searchUsers(searchTerm, filters = {}) {
        await this.initialize();
        
        let query = {};

        if (searchTerm) {
            query.$or = [
                { fullName: { $regex: searchTerm, $options: 'i' } },
                { userId: { $regex: searchTerm, $options: 'i' } },
                { phone: { $regex: searchTerm, $options: 'i' } },
                { nid: { $regex: searchTerm, $options: 'i' } },
                { designation: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        if (filters.department) query.department = filters.department;
        if (filters.role) query.role = filters.role;
        if (filters.status) query.status = filters.status;

        return await this.collection.find(query).toArray();
    }

    async getEmployeeStats() {
        await this.initialize();
        
        const stats = await this.collection.aggregate([
            {
                $group: {
                    _id: null,
                    totalEmployees: { $sum: 1 },
                    activeEmployees: {
                        $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] }
                    },
                    totalSalary: {
                        $sum: { $ifNull: ["$salary", 0] }
                    },
                    avgSalary: {
                        $avg: { $ifNull: ["$salary", 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalEmployees: 1,
                    activeEmployees: 1,
                    totalSalary: 1,
                    avgSalary: { $round: ["$avgSalary", 2] }
                }
            }
        ]).toArray();

        const deptStats = await this.collection.aggregate([
            {
                $group: {
                    _id: "$department",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    department: "$_id",
                    count: 1,
                    _id: 0
                }
            }
        ]).toArray();

        const roleStats = await this.collection.aggregate([
            {
                $group: {
                    _id: "$role",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    role: "$_id",
                    count: 1,
                    _id: 0
                }
            }
        ]).toArray();

        return {
            overview: stats[0] || { totalEmployees: 0, activeEmployees: 0, totalSalary: 0, avgSalary: 0 },
            byDepartment: deptStats,
            byRole: roleStats
        };
    }

    async bulkUpdateUsers(userIds, updateData) {
        await this.initialize();
        
        const objectIds = userIds
            .filter(id => ObjectId.isValid(id))
            .map(id => new ObjectId(id));

        if (objectIds.length === 0) return { modifiedCount: 0 };

        return await this.collection.updateMany(
            { _id: { $in: objectIds } },
            { $set: { ...updateData, updatedAt: new Date() } }
        );
    }
}

module.exports = new UserService();