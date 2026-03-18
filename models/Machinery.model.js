const { STATUS } = require('../utils/constants.util');

class MachineryModel {
    constructor(data) {
        this.machineId = data.machineId;
        this.machineName = data.machineName;
        this.brand = data.brand;
        this.model = data.model;
        this.serialNumber = data.serialNumber;
        this.purchaseDate = data.purchaseDate;
        this.purchasePrice = parseFloat(data.purchasePrice) || 0;
        this.condition = data.condition || STATUS.GOOD;
        this.location = data.location;
        this.maintenanceDate = data.maintenanceDate;
        this.status = data.status || STATUS.ACTIVE;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    static validate(data) {
        const errors = [];

        if (!data.machineName) errors.push('Machine name is required');
        if (!data.brand) errors.push('Brand is required');
        if (!data.model) errors.push('Model is required');
        if (!data.serialNumber) errors.push('Serial number is required');
        if (!data.purchaseDate) errors.push('Purchase date is required');
        if (!data.purchasePrice) errors.push('Purchase price is required');
        if (!data.location) errors.push('Location is required');
        if (!data.maintenanceDate) errors.push('Maintenance date is required');

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = MachineryModel;