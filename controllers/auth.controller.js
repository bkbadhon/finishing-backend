const userService = require('../services/user.service');
const Helpers = require('../utils/helpers.util');

class AuthController {
    async login(req, res, next) {
        try {
            const { userId, password } = req.body;

            const user = await userService.getUserByUserId(userId);

            if (!user || user.password !== password) {
                return res.status(401).json({ 
                    success: false,
                    message: "Invalid User ID or Password" 
                });
            }

            const token = Helpers.generateSimpleToken(user.userId);
            const userWithoutPassword = Helpers.removePassword(user);

            res.json({
                success: true,
                message: "Login successful",
                token,
                user: userWithoutPassword
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();