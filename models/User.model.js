const { ObjectId } = require('mongodb');
const { USER_ROLES, STATUS } = require('../utils/constants.util');
const Helpers = require('../utils/helpers.util');

class UserModel {
    constructor(data) {
        this.slNo = data.slNo;
        this.userId = data.userId;
        this.password = data.password;
        this.fullName = data.fullName || null;
        this.role = data.role || USER_ROLES.USER;
        this.designation = data.designation || null;
        this.department = data.department || null;
        this.phone = data.phone || null;
        this.nid = data.nid || null;
        this.salary = data.salary || 0;
        this.status = data.status || STATUS.ACTIVE;
        this.photo = data.photo || null;
        this.registeredAt = data.registeredAt || new Date();
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    toJSON() {
        return Helpers.removePassword(this);
    }

    static validate(userData) {
        const errors = [];

        if (!userData.userId) errors.push('User ID is required');
        if (!userData.password) errors.push('Password is required');

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = UserModel;