const Helpers = require('../utils/helpers.util');

class FinishedGoodModel {
    constructor(data) {
        this.fgId = data.fgId;
        this.productName = data.productName;
        this.productCode = data.productCode;
        this.category = data.category;
        this.quantityAvailable = parseFloat(data.quantityAvailable) || 0;
        this.unitPrice = parseFloat(data.unitPrice) || 0;
        this.totalValue = Helpers.calculateTotalValue(this.quantityAvailable, this.unitPrice);
        this.warehouseLocation = data.warehouseLocation;
        this.lastUpdated = data.lastUpdated || new Date().toISOString().split('T')[0];
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    static validate(data) {
        const errors = [];

        if (!data.productName) errors.push('Product name is required');
        if (!data.productCode) errors.push('Product code is required');
        if (!data.category) errors.push('Category is required');
        if (!data.quantityAvailable) errors.push('Quantity available is required');
        if (!data.unitPrice) errors.push('Unit price is required');
        if (!data.warehouseLocation) errors.push('Warehouse location is required');

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = FinishedGoodModel;