const factoryEmployeeService = require('../services/factoryEmployee.service');
const { ObjectId } = require('mongodb');

class FactoryEmployeeController {
    async getAllEmployees(req, res, next) {
        try {
            const employees = await factoryEmployeeService.getAllEmployees();
            res.json(employees);
        } catch (error) {
            next(error);
        }
    }

    async getEmployeeById(req, res, next) {
        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false,
                    error: "Invalid ID format" 
                });
            }

            const employee = await factoryEmployeeService.getEmployeeById(id);

            if (!employee) {
                return res.status(404).json({ 
                    success: false,
                    error: "Employee not found" 
                });
            }

            res.json(employee);
        } catch (error) {
            next(error);
        }
    }

    async updateEmployee(req, res, next) {
        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false,
                    error: "Invalid ID format" 
                });
            }

            const result = await factoryEmployeeService.updateEmployee(id, req.body);

            if (result.matchedCount === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: "Employee not found" 
                });
            }

            res.json({
                success: true,
                message: "Employee updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    async getEmployeeStats(req, res, next) {
        try {
            const stats = await factoryEmployeeService.getEmployeeStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    async searchEmployees(req, res, next) {
        try {
            const { searchTerm, department, role, status } = req.body;
            
            const employees = await factoryEmployeeService.searchEmployees(
                searchTerm, 
                { department, role, status }
            );

            res.json({
                success: true,
                total: employees.length,
                employees
            });
        } catch (error) {
            next(error);
        }
    }

    async bulkUpdateEmployees(req, res, next) {
        try {
            const { employeeIds, updateData } = req.body;

            if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
                return res.status(400).json({ 
                    success: false,
                    error: "Employee IDs are required" 
                });
            }

            const result = await factoryEmployeeService.bulkUpdateEmployees(employeeIds, updateData);

            res.json({
                success: true,
                message: `Updated ${result.modifiedCount} employees`,
                modifiedCount: result.modifiedCount
            });
        } catch (error) {
            next(error);
        }
    }

    async exportEmployees(req, res, next) {
        try {
            const { format } = req.params;
            const { department, role, status } = req.query;

            const exportData = await factoryEmployeeService.exportEmployees(
                format, 
                { department, role, status }
            );

            if (format === 'json') {
                res.json(exportData);
            } else if (format === 'csv') {
                // Convert to CSV
                const csvRows = [];
                const headers = Object.keys(exportData[0] || {});
                csvRows.push(headers.join(','));

                for (const row of exportData) {
                    const values = headers.map(header => {
                        const escaped = String(row[header]).replace(/"/g, '\\"');
                        return `"${escaped}"`;
                    });
                    csvRows.push(values.join(','));
                }

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
                res.send(csvRows.join('\n'));
            } else {
                res.status(400).json({ 
                    success: false,
                    error: "Unsupported export format" 
                });
            }
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new FactoryEmployeeController();