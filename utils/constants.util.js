const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    ASP: 'asp',
    MANAGER: 'manager'
};

const VALID_ROLES = Object.values(USER_ROLES);

const PRODUCTION_STAGES = {
    CUTTING: 'Cutting',
    CNC: 'CNC',
    POLISH: 'Polish',
    ASSEMBLY: 'Assembly',
    COMPLETE: 'Complete'
};

const VALID_PRODUCTION_STAGES = Object.values(PRODUCTION_STAGES);

const PRODUCT_CATEGORIES = {
    DOOR: 'Door',
    CABINET: 'Cabinet',
    BED: 'Bed',
    CUSTOM: 'Custom'
};

const MATERIAL_TYPES = {
    PLYWOOD: 'Plywood',
    HARDWARE: 'Hardware',
    FINISHING: 'Finishing',
    PACKAGING: 'Packaging'
};

const MATERIAL_UNITS = {
    PIECES: 'Pieces',
    SHEETS: 'Sheets',
    KG: 'KG',
    LITERS: 'Liters',
    METERS: 'Meters'
};

const STATUS = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    RUNNING: 'Running',
    COMPLETED: 'Completed',
    AVAILABLE: 'Available',
    LOW: 'Low',
    OUT_OF_STOCK: 'Out of Stock',
    GOOD: 'Good',
    REPAIR: 'Repair',
    DAMAGED: 'Damaged'
};

const CHANGE_TYPES = {
    ADDED: 'Added',
    REMOVED: 'Removed',
    UPDATE: 'Update'
};

const PAYMENT_METHODS = {
    CASH: 'Cash',
    BANK: 'Bank',
    MOBILE: 'Mobile Banking'
};

module.exports = {
    USER_ROLES,
    VALID_ROLES,
    PRODUCTION_STAGES,
    VALID_PRODUCTION_STAGES,
    PRODUCT_CATEGORIES,
    MATERIAL_TYPES,
    MATERIAL_UNITS,
    STATUS,
    CHANGE_TYPES,
    PAYMENT_METHODS
};