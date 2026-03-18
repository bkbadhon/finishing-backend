const { MATERIAL_TYPES, MATERIAL_UNITS, STATUS } = require('../utils/constants.util');
const Helpers = require('../utils/helpers.util');

class RawMaterialModel {
    constructor(data) {
        this.materialId = data.materialId;
        this.materialName = data.materialName;
        this.type = data.type;
        this.thicknessSize = data.thicknessSize;
        this.supplierName = data.supplierName;
        this.purchaseDate = data.purchaseDate;
        this.quantity = parseFloat(data.quantity) || 0;
        this.unit = data.unit;
        this.unitPrice = parseFloat(data.unitPrice) || 0;
        this.totalValue = Helpers.calculateTotalValue(this.quantity, this.unitPrice);
        this.currentStock = parseFloat(data.currentStock) || 0;
        this.minimumStockLevel = parseFloat(data.minimumStockLevel) || 0;
        this.status = Helpers.determineStockStatus(this.currentStock, this.minimumStockLevel);
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    static validate(data) {
        const errors = [];

        if (!data.materialName) errors.push('Material name is required');
        if (!data.type) errors.push('Type is required');
        if (!data.thicknessSize) errors.push('Thickness/Size is required');
        if (!data.supplierName) errors.push('Supplier name is required');
        if (!data.purchaseDate) errors.push('Purchase date is required');
        if (!data.quantity) errors.push('Quantity is required');
        if (!data.unit) errors.push('Unit is required');
        if (!data.unitPrice) errors.push('Unit price is required');
        if (!data.currentStock) errors.push('Current stock is required');
        if (!data.minimumStockLevel) errors.push('Minimum stock level is required');

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = RawMaterialModel;