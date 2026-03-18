const dbConfig = require('../config/db.config');

class DatabaseService {
    constructor() {
        this.db = null;
        this.collections = {};
    }

    async initialize() {
        this.db = await dbConfig.connect();
        this.initializeCollections();
        return this.db;
    }

    initializeCollections() {
        this.collections = {
            users: this.db.collection('users'),
            factoryCosts: this.db.collection('factorycosts'),
            factoryEmployees: this.db.collection('factoryemployees'),
            machinery: this.db.collection('machinery'),
            productionProducts: this.db.collection('productionproducts'),
            finishedGoods: this.db.collection('finishedgoods'),
            rawMaterials: this.db.collection('rawmaterials'),
            stockMovements: this.db.collection('stockmovements')
        };
    }

    getCollection(name) {
        if (!this.collections[name]) {
            throw new Error(`Collection ${name} not found`);
        }
        return this.collections[name];
    }

    async ensureCollection(name) {
        const collections = await this.db.listCollections({ name }).toArray();
        if (collections.length === 0) {
            await this.db.createCollection(name);
            console.log(`Created ${name} collection`);
        }
        return this.db.collection(name);
    }
}

module.exports = new DatabaseService();