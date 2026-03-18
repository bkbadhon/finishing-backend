const { ObjectId } = require('mongodb');
const { VALID_ROLES, VALID_PRODUCTION_STAGES } = require('../utils/constants.util');

class ValidationMiddleware {
    validateObjectId(req, res, next) {
        const { id } = req.params;
        
        if (id && !ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID format'
            });
        }
        
        next();
    }

    validateUserRole(req, res, next) {
        const { role } = req.body;
        
        if (role && !VALID_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be one of: ' + VALID_ROLES.join(', ')
            });
        }
        
        next();
    }

    validateProductionStage(req, res, next) {
        const { productionStage } = req.body;
        
        if (productionStage && !VALID_PRODUCTION_STAGES.includes(productionStage)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid production stage. Must be one of: ' + VALID_PRODUCTION_STAGES.join(', ')
            });
        }
        
        next();
    }

    validateRequiredFields(fields) {
        return (req, res, next) => {
            const missingFields = [];
            
            for (const field of fields) {
                if (!req.body[field]) {
                    missingFields.push(field);
                }
            }
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: `Missing required fields: ${missingFields.join(', ')}`
                });
            }
            
            next();
        };
    }

    validateLogin(req, res, next) {
        const { userId, password } = req.body;
        
        if (!userId || !password) {
            return res.status(400).json({
                success: false,
                error: 'User ID and password are required'
            });
        }
        
        next();
    }
}

module.exports = new ValidationMiddleware();