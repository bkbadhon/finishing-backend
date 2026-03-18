const dbService = require('./db.service');
const userService = require('./user.service');
const Helpers = require('../utils/helpers.util');

class FactoryEmployeeService {
    async getAllEmployees() {
        const users = await userService.getAllUsers();
        
        return users.map((user, index) => Helpers.transformUserToEmployee(user, index));
    }

    async getEmployeeById(id) {
        const user = await userService.getUserById(id);
        
        if (!user) return null;
        
        return Helpers.transformUserToEmployee(user, 0);
    }

    async updateEmployee(id, employeeData) {
        const updateData = {
            fullName: employeeData.fullName,
            designation: employeeData.designation,
            department: employeeData.department,
            phone: employeeData.phone,
            nid: employeeData.nid,
            joiningDate: employeeData.joiningDate ? new Date(employeeData.joiningDate) : null,
            salary: parseFloat(employeeData.salary) || 0,
            status: employeeData.status || 'Active'
        };

        // Remove undefined fields
        Object.keys(updateData).forEach(key =>
            updateData[key] === undefined && delete updateData[key]
        );

        return await userService.updateUser(id, updateData);
    }

    async getEmployeeStats() {
        return await userService.getEmployeeStats();
    }

    async searchEmployees(searchTerm, filters = {}) {
        const users = await userService.searchUsers(searchTerm, filters);
        
        return users.map((user, index) => Helpers.transformUserToEmployee(user, index));
    }

    async bulkUpdateEmployees(employeeIds, updateData) {
        return await userService.bulkUpdateUsers(employeeIds, updateData);
    }

    async exportEmployees(format = 'json', filters = {}) {
        const users = await userService.searchUsers('', filters);
        
        const exportData = users.map(user => ({
            'Employee ID': user.userId || 'N/A',
            'Full Name': user.fullName || 'N/A',
            'Role': user.role || 'user',
            'Designation': user.designation || 'N/A',
            'Department': user.department || 'N/A',
            'Phone': user.phone || 'N/A',
            'NID': user.nid || 'N/A',
            'Joining Date': user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A',
            'Salary': user.salary || 0,
            'Status': user.status || 'Active'
        }));

        return exportData;
    }
}

module.exports = new FactoryEmployeeService();