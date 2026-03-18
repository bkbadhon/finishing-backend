const { STATUS, USER_ROLES } = require('../utils/constants.util');

class FactoryEmployeeModel {
    constructor(data) {
        this.employeeId = data.employeeId;
        this.fullName = data.fullName;
        this.userId = data.userId;
        this.role = data.role || USER_ROLES.USER;
        this.designation = data.designation;
        this.department = data.department;
        this.phone = data.phone;
        this.nid = data.nid;
        this.joiningDate = data.joiningDate || new Date();
        this.salary = parseFloat(data.salary) || 0;
        this.status = data.status || STATUS.ACTIVE;
        this.photo = data.photo || null;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    static validate(data) {
        const errors = [];

        if (!data.fullName) errors.push('Full name is required');
        if (!data.designation) errors.push('Designation is required');
        if (!data.department) errors.push('Department is required');
        if (!data.phone) errors.push('Phone is required');

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = FactoryEmployeeModel;