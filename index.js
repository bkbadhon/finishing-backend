const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const Port = process.env.PORT || 5000;

// More permissive CORS for development
const corsOptions = {
    origin: ['http://localhost:5173','https://finishing-admin.vercel.app', 'http://localhost:5174', 'http://127.0.0.1:5173'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(express.json());
app.use(cors(corsOptions));

// Add this middleware for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p5zgglk.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        console.log("✅ MongoDB client connected successfully!");
        
        const db = client.db("finishingDB");
        const usersCollection = db.collection("users");

        // Test route to check if server is running
        app.get("/api/test", (req, res) => {
            res.json({ message: "Server is running!", timestamp: new Date() });
        });

        // Get all users
        app.get("/users", async (req, res) => {
            try {
                const users = await usersCollection.find().toArray();
                res.json(users);
            } catch (error) {
                console.error("Error fetching users:", error);
                res.status(500).json({ error: "Failed to fetch users" });
            }
        });

        // Create new user
        app.post("/users", async (req, res) => {
            try {
                const latestUser = await usersCollection
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
                
                const userId = nextSlNo + dateStr + timeStr;
                const password = Math.random().toString(36).substring(2, 10) + 
                               Math.random().toString(36).substring(2, 10).toUpperCase();

                const newUser = {
                    slNo: nextSlNo,
                    userId: userId,
                    password: password,
                    registeredAt: now,
                    createdAt: now
                };

                const result = await usersCollection.insertOne(newUser);
                
                res.status(201).json({
                    _id: result.insertedId,
                    ...newUser,
                    registeredAt: now.toLocaleString()
                });

            } catch (error) {
                console.error("Error creating user:", error);
                res.status(500).json({ error: "Failed to create user" });
            }
        });

        // Delete user by ID
        app.delete("/users/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log("Attempting to delete user with ID:", id);
                
                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: "Invalid user ID format" });
                }

                const result = await usersCollection.deleteOne({ 
                    _id: new ObjectId(id) 
                });

                if (result.deletedCount === 0) {
                    return res.status(404).json({ error: "User not found" });
                }

                console.log("User deleted successfully:", id);
                res.json({ 
                    success: true, 
                    message: "User deleted successfully",
                    deletedId: id 
                });

            } catch (error) {
                console.error("Error deleting user:", error);
                res.status(500).json({ error: "Failed to delete user" });
            }
        });

        console.log("✅ Routes are ready!");
        
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error);
    }
}

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send({ 
        message: "Welcome to our server", 
        status: "running",
        timestamp: new Date(),
        endpoints: {
            users: "GET /users",
            createUser: "POST /users",
            deleteUser: "DELETE /users/:id",
            test: "GET /api/test"
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
});

app.listen(Port, () => {
    console.log(`✅ Server is running at http://localhost:${Port}`);
    console.log(`📝 Test the server: http://localhost:${Port}/api/test`);
});