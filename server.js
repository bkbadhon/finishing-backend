const express = require("express");
const cors = require("cors");
require('dotenv').config();

const dbConfig = require('./config/db.config');
const corsOptions = require('./config/cors.config');
const loggerMiddleware = require('./middleware/logger.middleware');
const errorMiddleware = require('./middleware/error.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const factoryCostRoutes = require('./routes/factoryCost.routes');
const factoryEmployeeRoutes = require('./routes/factoryEmployee.routes');
const machineryRoutes = require('./routes/machinery.routes');
const productionProductRoutes = require('./routes/productionProduct.routes');
const finishedGoodRoutes = require('./routes/finishedGood.routes');
const rawMaterialRoutes = require('./routes/rawMaterial.routes');
const stockMovementRoutes = require('./routes/stockMovement.routes');

const app = express();
const Port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors(corsOptions));
app.use(loggerMiddleware.logRequest);

// Test route
app.get("/api/test", (req, res) => {
    res.json({ 
        success: true,
        message: "Server is running!", 
        timestamp: new Date() 
    });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/factory-costs", factoryCostRoutes);
app.use("/api/factory-employees", factoryEmployeeRoutes);
app.use("/api/machinery", machineryRoutes);
app.use("/api/production-products", productionProductRoutes);
app.use("/api/finished-goods", finishedGoodRoutes);
app.use("/api/raw-materials", rawMaterialRoutes);
app.use("/api/stock-movements", stockMovementRoutes);

// Root route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to Finishing Management System API",
        status: "running",
        timestamp: new Date(),
        version: "1.0.0",
        documentation: "/api/test",
        endpoints: {
            auth: "/api/auth",
            users: "/api/users",
            factoryCosts: "/api/factory-costs",
            factoryEmployees: "/api/factory-employees",
            machinery: "/api/machinery",
            productionProducts: "/api/production-products",
            finishedGoods: "/api/finished-goods",
            rawMaterials: "/api/raw-materials",
            stockMovements: "/api/stock-movements"
        }
    });
});

// Error handling
app.use(errorMiddleware.handle404);
app.use(loggerMiddleware.logError);
app.use(errorMiddleware.handleError);

// Database connection and server start
async function startServer() {
    try {
        // Connect to MongoDB
        await dbConfig.connect();
        console.log("✅ Database connected successfully!");

        // Start server
        app.listen(Port, () => {
            console.log(`✅ Server is running at http://localhost:${Port}`);
            console.log(`📝 Test the server: http://localhost:${Port}/api/test`);
            console.log(`📚 API Documentation: http://localhost:${Port}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
    process.exit(1);
});

// Start the server
startServer();