class Helpers {
    static calculateTotalValue(quantity, unitPrice) {
        return quantity * unitPrice;
    }

    static determineStockStatus(currentStock, minStock) {
        if (currentStock === 0) return 'Out of Stock';
        if (currentStock <= minStock) return 'Low';
        return 'Available';
    }

    static createDateRangeQuery(month) {
        if (!month) return {};
        
        const [year, monthNum] = month.split('-');
        const startDate = new Date(year, parseInt(monthNum) - 1, 1);
        const endDate = new Date(year, parseInt(monthNum), 0, 23, 59, 59);
        
        return { date: { $gte: startDate, $lte: endDate } };
    }

    static createDateRangeQueryFromDates(startDate, endDate) {
        if (!startDate || !endDate) return {};
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        return { timestamp: { $gte: start, $lte: end } };
    }

    static generateSimpleToken(userId) {
        return Buffer.from(`${userId}-${Date.now()}`).toString('base64');
    }

    static removePassword(user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    static formatDateForResponse(date) {
        return date ? new Date(date).toLocaleString() : null;
    }

    static transformUserToEmployee(user, index) {
        return {
            _id: user._id,
            employeeId: `EMP-${String(index + 1).padStart(3, '0')}`,
            fullName: user.fullName || user.userId || 'N/A',
            userId: user.userId,
            role: user.role || 'user',
            designation: user.designation || 'General Worker',
            department: user.department || 'Production',
            phone: user.phone || 'N/A',
            nid: user.nid || 'N/A',
            joiningDate: user.joiningDate || user.createdAt || user.registeredAt,
            salary: user.salary || 0,
            status: user.status || 'Active',
            photo: user.photo || null
        };
    }
}

module.exports = Helpers;