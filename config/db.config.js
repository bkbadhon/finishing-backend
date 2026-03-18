const { MongoClient, ServerApiVersion } = require('mongodb');

class DatabaseConfig {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        try {
            const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p5zgglk.mongodb.net/?appName=Cluster0`;
            
            this.client = new MongoClient(uri, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                }
            });

            await this.client.connect();
            console.log("✅ MongoDB connected successfully!");
            
            this.db = this.client.db("finishingDB");
            return this.db;
        } catch (error) {
            console.error("❌ MongoDB connection failed:", error);
            throw error;
        }
    }

    getDb() {
        if (!this.db) {
            throw new Error('Database not initialized. Call connect() first.');
        }
        return this.db;
    }

    getClient() {
        return this.client;
    }

    async close() {
        if (this.client) {
            await this.client.close();
            console.log("MongoDB connection closed");
        }
    }
}

module.exports = new DatabaseConfig();