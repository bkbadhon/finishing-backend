const userService = require('../services/user.service');
const { ObjectId } = require('mongodb');

class UserController {
    async getAllUsers(req, res, next) {
        try {
            const users = await userService.getAllUsers();
            res.json(users);
        } catch (error) {
            next(error);
        }
    }

    async createUser(req, res, next) {
        try {
            const newUser = await userService.createUser(req.body);
            res.status(201).json(newUser);
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false,
                    error: "Invalid user ID format" 
                });
            }

            const result = await userService.deleteUser(id);

            if (result.deletedCount === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: "User not found" 
                });
            }

            res.json({
                success: true,
                message: "User deleted successfully",
                deletedId: id
            });
        } catch (error) {
            next(error);
        }
    }

    async updateUserRole(req, res, next) {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false,
                    error: "Invalid user ID format" 
                });
            }

            const result = await userService.updateUserRole(id, role);

            if (result.matchedCount === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: "User not found" 
                });
            }

            res.json({
                success: true,
                message: "Role updated successfully",
                role
            });
        } catch (error) {
            next(error);
        }
    }

    async getEmployeeStats(req, res, next) {
        try {
            const stats = await userService.getEmployeeStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();