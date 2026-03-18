const { PAYMENT_METHODS, STATUS } = require('../utils/constants.util');

class FactoryCostModel {
    constructor(data) {
        this.costId = data.costId;
        this.date = data.date || new Date();
        this.costCategory = data.costCategory;
        this.description = data.description;
        this.amount = parseFloat(data.amount) || 0;
        this.paymentMethod = data.paymentMethod || PAYMENT_METHODS.CASH;
        this.approvedBy = data.approvedBy || '';
        this.attachment = data.attachment || '';
        this.status = data.status || STATUS.ACTIVE;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    static validate(data) {
        const errors = [];

        if (!data.date) errors.push('Date is required');
        if (!data.costCategory) errors.push('Cost category is required');
        if (!data.description) errors.push('Description is required');
        if (!data.amount) errors.push('Amount is required');

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = FactoryCostModel;