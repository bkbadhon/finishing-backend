class IdGenerator {
    static generateUserId(collection) {
        return async () => {
            const latestUser = await collection
                .find()
                .sort({ slNo: -1 })
                .limit(1)
                .toArray();

            let nextSlNo = "01";
            if (latestUser.length > 0) {
                const lastSlNo = parseInt(latestUser[0].slNo);
                nextSlNo = (lastSlNo + 1).toString().padStart(2, '0');
            }

            const now = new Date();
            const dateStr = now.getDate().toString().padStart(2, '0') +
                (now.getMonth() + 1).toString().padStart(2, '0') +
                now.getFullYear();
            const timeStr = now.getHours().toString().padStart(2, '0') +
                now.getMinutes().toString().padStart(2, '0') +
                now.getSeconds().toString().padStart(2, '0');

            return {
                slNo: nextSlNo,
                userId: nextSlNo + dateStr + timeStr,
                password: this.generateRandomPassword()
            };
        };
    }

    static generateRandomPassword() {
        return Math.random().toString(36).substring(2, 10) +
            Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    static async generateCostId(collection) {
        const latestCost = await collection
            .find()
            .sort({ costId: -1 })
            .limit(1)
            .toArray();

        let nextCostId = "COST-001";
        if (latestCost.length > 0 && latestCost[0].costId) {
            const lastId = latestCost[0].costId;
            const lastNumber = parseInt(lastId.split('-')[1]);
            if (!isNaN(lastNumber)) {
                nextCostId = `COST-${String(lastNumber + 1).padStart(3, '0')}`;
            }
        }
        return nextCostId;
    }

    static async generateEmployeeId(collection) {
        const latestEmployee = await collection
            .find()
            .sort({ employeeId: -1 })
            .limit(1)
            .toArray();

        let nextEmployeeId = "EMP-001";
        if (latestEmployee.length > 0 && latestEmployee[0].employeeId) {
            const lastId = latestEmployee[0].employeeId;
            const lastNumber = parseInt(lastId.split('-')[1]);
            if (!isNaN(lastNumber)) {
                nextEmployeeId = `EMP-${String(lastNumber + 1).padStart(3, '0')}`;
            }
        }
        return nextEmployeeId;
    }

    static async generateMachineId(collection) {
        const latestMachine = await collection
            .find()
            .sort({ machineId: -1 })
            .limit(1)
            .toArray();

        let nextMachineId = "MCH-001";
        if (latestMachine.length > 0 && latestMachine[0].machineId) {
            const lastId = latestMachine[0].machineId;
            const lastNumber = parseInt(lastId.split('-')[1]);
            if (!isNaN(lastNumber)) {
                nextMachineId = `MCH-${String(lastNumber + 1).padStart(3, '0')}`;
            }
        }
        return nextMachineId;
    }

    static async generateProductId(collection) {
        const latestProduct = await collection
            .find()
            .sort({ productId: -1 })
            .limit(1)
            .toArray();

        let nextProductId = "PRD-001";
        if (latestProduct.length > 0 && latestProduct[0].productId) {
            const lastId = latestProduct[0].productId;
            const lastNumber = parseInt(lastId.split('-')[1]);
            if (!isNaN(lastNumber)) {
                nextProductId = `PRD-${String(lastNumber + 1).padStart(3, '0')}`;
            }
        }
        return nextProductId;
    }

    static async generateFgId(collection) {
        const latestItem = await collection
            .find()
            .sort({ fgId: -1 })
            .limit(1)
            .toArray();

        let nextFgId = "FG-001";
        if (latestItem.length > 0 && latestItem[0].fgId) {
            const lastId = latestItem[0].fgId;
            const lastNumber = parseInt(lastId.split('-')[1]);
            if (!isNaN(lastNumber)) {
                nextFgId = `FG-${String(lastNumber + 1).padStart(3, '0')}`;
            }
        }
        return nextFgId;
    }

    static async generateMaterialId(collection) {
        const latestItem = await collection
            .find()
            .sort({ materialId: -1 })
            .limit(1)
            .toArray();

        let nextMaterialId = "RM-001";
        if (latestItem.length > 0 && latestItem[0].materialId) {
            const lastId = latestItem[0].materialId;
            const lastNumber = parseInt(lastId.split('-')[1]);
            if (!isNaN(lastNumber)) {
                nextMaterialId = `RM-${String(lastNumber + 1).padStart(3, '0')}`;
            }
        }
        return nextMaterialId;
    }

    static async generateMovementId(collection) {
        const latestMovement = await collection
            .find()
            .sort({ movementId: -1 })
            .limit(1)
            .toArray();

        let nextMovementId = "MOV-001";
        if (latestMovement.length > 0 && latestMovement[0].movementId) {
            const lastId = latestMovement[0].movementId;
            const lastNumber = parseInt(lastId.split('-')[1]);
            if (!isNaN(lastNumber)) {
                nextMovementId = `MOV-${String(lastNumber + 1).padStart(3, '0')}`;
            }
        }
        return nextMovementId;
    }
}

module.exports = IdGenerator;