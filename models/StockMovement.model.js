const { CHANGE_TYPES } = require('../utils/constants.util');

class StockMovementModel {
    constructor(data) {
        this.movementId = data.movementId;
        this.fgId = data.fgId;
        this.productName = data.productName;
        this.previousQuantity = data.previousQuantity || null;
        this.newQuantity = data.newQuantity || null;
        this.quantity = data.quantity || null;
        this.changeType = data.changeType || CHANGE_TYPES.UPDATE;
        this.changedBy = data.changedBy || 'Admin';
        this.timestamp = data.timestamp || new Date();
        this.createdAt = data.createdAt || new Date();
    }

    static validate(data) {
        const errors = [];

        if (!data.fgId) errors.push('Finished goods ID is required');
        if (!data.productName) errors.push('Product name is required');
        if (!data.changedBy) errors.push('Changed by is required');

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = StockMovementModel;