const { PRODUCTION_STAGES, PRODUCT_CATEGORIES, STATUS } = require('../utils/constants.util');
const Helpers = require('../utils/helpers.util');

class ProductionProductModel {
    constructor(data) {
        this.productId = data.productId;
        this.productName = data.productName;
        this.productCode = data.productCode;
        this.category = data.category;
        this.productionStage = data.productionStage;
        this.quantity = parseFloat(data.quantity) || 0;
        this.unitCost = parseFloat(data.unitCost) || 0;
        this.totalCost = Helpers.calculateTotalValue(this.quantity, this.unitCost);
        this.assignedSupervisor = data.assignedSupervisor;
        this.status = data.status || STATUS.RUNNING;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    static validate(data) {
        const errors = [];

        if (!data.productName) errors.push('Product name is required');
        if (!data.productCode) errors.push('Product code is required');
        if (!data.category) errors.push('Category is required');
        if (!data.productionStage) errors.push('Production stage is required');
        if (!data.quantity) errors.push('Quantity is required');
        if (!data.unitCost) errors.push('Unit cost is required');
        if (!data.assignedSupervisor) errors.push('Assigned supervisor is required');

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ProductionProductModel;