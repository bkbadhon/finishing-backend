const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const Port = process.env.PORT || 5000;

// More permissive CORS for development
const corsOptions = {
    origin: ['http://localhost:5173', 'https://finishing-admin.vercel.app', 'http://localhost:5174', 'http://127.0.0.1:5173'],
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

        // Update user role - Add this route
        app.patch("/users/:id/role", async (req, res) => {
            try {
                const { id } = req.params;
                const { role } = req.body;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: "Invalid user ID format" });
                }

                const validRoles = ['user', 'admin', 'asp', 'manager'];
                if (!validRoles.includes(role)) {
                    return res.status(400).json({ error: "Invalid role" });
                }

                const result = await usersCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { role: role, updatedAt: new Date() } }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: "User not found" });
                }

                res.json({
                    success: true,
                    message: "Role updated successfully",
                    role: role
                });

            } catch (error) {
                console.error("Error updating user role:", error);
                res.status(500).json({ error: "Failed to update user role" });
            }
        });

        // Simple login route for existing users
        app.post("/login", async (req, res) => {
            try {
                const { userId, password } = req.body;

                // Find user by userId
                const user = await usersCollection.findOne({ userId: userId });

                if (!user) {
                    return res.status(401).json({ message: "Invalid User ID or Password" });
                }

                // Check password (plain text as per your existing system)
                if (user.password !== password) {
                    return res.status(401).json({ message: "Invalid User ID or Password" });
                }

                // Create simple token
                const token = Buffer.from(`${user.userId}-${Date.now()}`).toString('base64');

                // Remove password from response
                const { password: pwd, ...userWithoutPassword } = user;

                res.json({
                    message: "Login successful",
                    token: token,
                    user: userWithoutPassword
                });

            } catch (error) {
                console.error("Login error:", error);
                res.status(500).json({ message: "Server error during login" });
            }
        });



        // ============ FACTORY COSTS ROUTES ============

        // Get all factory costs with month filter
        app.get("/factory-costs", async (req, res) => {
            try {
                const { month } = req.query;
                const db = client.db("finishingDB");

                // Check if collection exists, if not create it
                const collections = await db.listCollections({ name: "factorycosts" }).toArray();
                if (collections.length === 0) {
                    await db.createCollection("factorycosts");
                    console.log("Created factorycosts collection");
                }

                const costsCollection = db.collection("factorycosts");

                let query = {};
                if (month) {
                    const [year, monthNum] = month.split('-');
                    const startDate = new Date(year, parseInt(monthNum) - 1, 1);
                    const endDate = new Date(year, parseInt(monthNum), 0, 23, 59, 59);
                    query.date = { $gte: startDate, $lte: endDate };
                }

                const costs = await costsCollection.find(query).sort({ date: -1 }).toArray();
                console.log(`Found ${costs.length} costs for month ${month}`);
                res.json(costs);
            } catch (error) {
                console.error("Error fetching costs:", error);
                res.status(500).json({ error: "Failed to fetch costs" });
            }
        });

        // Add new factory cost
        app.post("/factory-costs", async (req, res) => {
            try {
                console.log("Received POST request to /factory-costs with data:", req.body);

                const db = client.db("finishingDB");

                // Check if collection exists, if not create it
                const collections = await db.listCollections({ name: "factorycosts" }).toArray();
                if (collections.length === 0) {
                    await db.createCollection("factorycosts");
                    console.log("Created factorycosts collection");
                }

                const costsCollection = db.collection("factorycosts");

                // Validate required fields
                if (!req.body.date || !req.body.costCategory || !req.body.description || !req.body.amount) {
                    return res.status(400).json({ error: "Missing required fields" });
                }

                // Generate Cost ID
                const latestCost = await costsCollection
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

                const newCost = {
                    costId: nextCostId,
                    date: new Date(req.body.date),
                    costCategory: req.body.costCategory,
                    description: req.body.description,
                    amount: parseFloat(req.body.amount) || 0,
                    paymentMethod: req.body.paymentMethod || 'Cash',
                    approvedBy: req.body.approvedBy || '',
                    attachment: req.body.attachment || '',
                    status: req.body.status || 'Active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                console.log("Saving new cost:", newCost);
                const result = await costsCollection.insertOne(newCost);
                console.log("Cost saved with ID:", result.insertedId);

                res.status(201).json({ ...newCost, _id: result.insertedId });
            } catch (error) {
                console.error("Error adding cost:", error);
                res.status(500).json({ error: "Failed to add cost", details: error.message });
            }
        });

        // Update factory cost
        app.put("/factory-costs/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Updating cost with ID: ${id}`, req.body);

                const db = client.db("finishingDB");
                const costsCollection = db.collection("factorycosts");

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: "Invalid ID format" });
                }

                const updateData = {
                    date: new Date(req.body.date),
                    costCategory: req.body.costCategory,
                    description: req.body.description,
                    amount: parseFloat(req.body.amount) || 0,
                    paymentMethod: req.body.paymentMethod,
                    approvedBy: req.body.approvedBy || '',
                    status: req.body.status || 'Active',
                    updatedAt: new Date()
                };

                const result = await costsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: "Cost not found" });
                }

                console.log("Cost updated successfully");
                res.json({ success: true, message: "Cost updated successfully" });
            } catch (error) {
                console.error("Error updating cost:", error);
                res.status(500).json({ error: "Failed to update cost" });
            }
        });

        // Delete factory cost
        app.delete("/factory-costs/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Deleting cost with ID: ${id}`);

                const db = client.db("finishingDB");
                const costsCollection = db.collection("factorycosts");

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: "Invalid ID format" });
                }

                const result = await costsCollection.deleteOne({ _id: new ObjectId(id) });

                if (result.deletedCount === 0) {
                    return res.status(404).json({ error: "Cost not found" });
                }

                console.log("Cost deleted successfully");
                res.json({ success: true, message: "Cost deleted successfully" });
            } catch (error) {
                console.error("Error deleting cost:", error);
                res.status(500).json({ error: "Failed to delete cost" });
            }
        });

        // Export factory costs
        app.get("/factory-costs/export", async (req, res) => {
            try {
                const { month, format } = req.query;
                console.log(`Exporting costs for month ${month} in ${format} format`);

                const db = client.db("finishingDB");
                const costsCollection = db.collection("factorycosts");

                let query = {};
                if (month) {
                    const [year, monthNum] = month.split('-');
                    const startDate = new Date(year, parseInt(monthNum) - 1, 1);
                    const endDate = new Date(year, parseInt(monthNum), 0, 23, 59, 59);
                    query.date = { $gte: startDate, $lte: endDate };
                }

                const costs = await costsCollection.find(query).sort({ date: -1 }).toArray();

                // Simple JSON export for now
                res.json({
                    message: "Export successful",
                    format: format,
                    month: month,
                    data: costs
                });

            } catch (error) {
                console.error("Error exporting costs:", error);
                res.status(500).json({ error: "Failed to export costs" });
            }
        });




        // ============ FACTORY EMPLOYEES ROUTES ============

        // Get all employees
        app.get("/factory-employees", async (req, res) => {
            try {
                const db = client.db("finishingDB");

                // Check if collection exists
                const collections = await db.listCollections({ name: "factoryemployees" }).toArray();
                if (collections.length === 0) {
                    await db.createCollection("factoryemployees");
                    console.log("Created factoryemployees collection");
                }

                const employeesCollection = db.collection("factoryemployees");
                const employees = await employeesCollection.find().sort({ joiningDate: -1 }).toArray();
                console.log(`Found ${employees.length} employees`);
                res.json(employees);
            } catch (error) {
                console.error("Error fetching employees:", error);
                res.status(500).json({ error: "Failed to fetch employees" });
            }
        });

        // Add new employee
        app.post("/factory-employees", async (req, res) => {
            try {
                console.log("Received POST request to /factory-employees with data:", req.body);

                const db = client.db("finishingDB");
                const employeesCollection = db.collection("factoryemployees");

                // Generate Employee ID
                const latestEmployee = await employeesCollection
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

                const newEmployee = {
                    employeeId: nextEmployeeId,
                    fullName: req.body.fullName,
                    designation: req.body.designation,
                    department: req.body.department,
                    phone: req.body.phone,
                    nid: req.body.nid,
                    joiningDate: new Date(req.body.joiningDate),
                    salary: parseFloat(req.body.salary) || 0,
                    status: req.body.status || 'Active',
                    photo: req.body.photo || '',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                console.log("Saving new employee:", newEmployee);
                const result = await employeesCollection.insertOne(newEmployee);
                console.log("Employee saved with ID:", result.insertedId);

                res.status(201).json({ ...newEmployee, _id: result.insertedId });
            } catch (error) {
                console.error("Error adding employee:", error);
                res.status(500).json({ error: "Failed to add employee", details: error.message });
            }
        });

        // Sync users to factoryemployees (একবার Run করবেন)
        app.post("/factory-employees/sync-from-users", async (req, res) => {
            try {
                const db = client.db("finishingDB");
                const usersCollection = db.collection("users");
                const employeesCollection = db.collection("factoryemployees");

                // Get all users
                const users = await usersCollection.find().toArray();

                // Clear existing employees
                await employeesCollection.deleteMany({});

                // Transform and insert users as employees
                const employees = users.map((user, index) => ({
                    _id: user._id, // Same _id as users collection
                    employeeId: `EMP-${String(index + 1).padStart(3, '0')}`,
                    fullName: user.fullName || user.userId || 'N/A',
                    userId: user.userId,
                    role: user.role || 'user',
                    designation: user.designation || 'General Worker',
                    department: user.department || 'Production',
                    phone: user.phone || 'N/A',
                    nid: user.nid || 'N/A',
                    joiningDate: user.joiningDate || user.createdAt || user.registeredAt || new Date(),
                    salary: user.salary || 0,
                    status: user.status || 'Active',
                    photo: user.photo || null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }));

                if (employees.length > 0) {
                    await employeesCollection.insertMany(employees);
                }

                console.log(`Synced ${employees.length} users to factoryemployees collection`);
                res.json({
                    success: true,
                    message: `Synced ${employees.length} employees`,
                    count: employees.length
                });
            } catch (error) {
                console.error("Error syncing employees:", error);
                res.status(500).json({ error: "Failed to sync employees" });
            }
        });

        // Update employee - MODIFIED to work with same _id as users
        app.put("/factory-employees/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Updating employee with ID: ${id}`, req.body);

                const db = client.db("finishingDB");
                const employeesCollection = db.collection("factoryemployees");

                // Try to find by _id (which is same as users _id)
                let query = {};

                // Check if it's a valid ObjectId
                if (ObjectId.isValid(id)) {
                    query = { _id: new ObjectId(id) };
                } else {
                    query = { _id: id }; // Try as string
                }

                const updateData = {
                    fullName: req.body.fullName,
                    designation: req.body.designation,
                    department: req.body.department,
                    phone: req.body.phone,
                    nid: req.body.nid,
                    joiningDate: new Date(req.body.joiningDate),
                    salary: parseFloat(req.body.salary) || 0,
                    status: req.body.status || 'Active',
                    updatedAt: new Date()
                };

                const result = await employeesCollection.updateOne(
                    query,
                    { $set: updateData }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: "Employee not found in factoryemployees collection" });
                }

                console.log("Employee updated successfully");
                res.json({ success: true, message: "Employee updated successfully" });
            } catch (error) {
                console.error("Error updating employee:", error);
                res.status(500).json({ error: "Failed to update employee" });
            }
        });

        // Delete employee
        app.delete("/factory-employees/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Deleting employee with ID: ${id}`);

                const db = client.db("finishingDB");
                const employeesCollection = db.collection("factoryemployees");

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: "Invalid ID format" });
                }

                const result = await employeesCollection.deleteOne({ _id: new ObjectId(id) });

                if (result.deletedCount === 0) {
                    return res.status(404).json({ error: "Employee not found" });
                }

                console.log("Employee deleted successfully");
                res.json({ success: true, message: "Employee deleted successfully" });
            } catch (error) {
                console.error("Error deleting employee:", error);
                res.status(500).json({ error: "Failed to delete employee" });
            }
        });


        // ============ FACTORY EMPLOYEES ROUTES (USING USERS COLLECTION) ============

        // Get all employees (from users collection)
        app.get("/factory-employees", async (req, res) => {
            try {
                const db = client.db("finishingDB");
                const usersCollection = db.collection("users");

                // Get all users from database
                const users = await usersCollection.find().toArray();

                // Transform users to employee format
                const employees = users.map((user, index) => ({
                    _id: user._id,
                    employeeId: `EMP-${String(index + 1).padStart(3, '0')}`,
                    fullName: user.fullName || user.userId || 'N/A',
                    userId: user.userId,
                    role: user.role || 'user',
                    designation: user.designation || 'General Worker',
                    department: user.department || 'Production',
                    phone: user.phone || 'N/A',
                    nid: user.nid || 'N/A',
                    joiningDate: user.joiningDate || user.createdAt || user.registeredAt || new Date(),
                    salary: user.salary || 0,
                    status: user.status || 'Active',
                    photo: user.photo || null
                }));

                console.log(`Found ${employees.length} employees`);
                res.json(employees);
            } catch (error) {
                console.error("Error fetching employees:", error);
                res.status(500).json({ error: "Failed to fetch employees" });
            }
        });

        // Get single employee by ID
        app.get("/factory-employees/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const db = client.db("finishingDB");
                const usersCollection = db.collection("users");

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: "Invalid ID format" });
                }

                const user = await usersCollection.findOne({ _id: new ObjectId(id) });

                if (!user) {
                    return res.status(404).json({ error: "Employee not found" });
                }

                // Transform to employee format
                const employee = {
                    _id: user._id,
                    employeeId: `EMP-${String(id).slice(-3)}`,
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

                res.json(employee);
            } catch (error) {
                console.error("Error fetching employee:", error);
                res.status(500).json({ error: "Failed to fetch employee" });
            }
        });

        // Update employee (user) information
        app.put("/factory-employees/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Updating employee with ID: ${id}`, req.body);

                const db = client.db("finishingDB");
                const usersCollection = db.collection("users");

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: "Invalid ID format" });
                }

                // Update only employee-related fields in users collection
                const updateData = {
                    fullName: req.body.fullName,
                    designation: req.body.designation,
                    department: req.body.department,
                    phone: req.body.phone,
                    nid: req.body.nid,
                    joiningDate: req.body.joiningDate ? new Date(req.body.joiningDate) : null,
                    salary: parseFloat(req.body.salary) || 0,
                    status: req.body.status || 'Active',
                    updatedAt: new Date()
                };

                // Remove undefined fields
                Object.keys(updateData).forEach(key =>
                    updateData[key] === undefined && delete updateData[key]
                );

                const result = await usersCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: "Employee not found" });
                }

                console.log("Employee updated successfully");
                res.json({
                    success: true,
                    message: "Employee updated successfully",
                    updatedFields: updateData
                });
            } catch (error) {
                console.error("Error updating employee:", error);
                res.status(500).json({ error: "Failed to update employee" });
            }
        });

        // Bulk update employees (e.g., department change)
        app.patch("/factory-employees/bulk", async (req, res) => {
            try {
                const { employeeIds, updateData } = req.body;

                if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
                    return res.status(400).json({ error: "Employee IDs are required" });
                }

                const db = client.db("finishingDB");
                const usersCollection = db.collection("users");

                // Convert string IDs to ObjectId
                const objectIds = employeeIds
                    .filter(id => ObjectId.isValid(id))
                    .map(id => new ObjectId(id));

                if (objectIds.length === 0) {
                    return res.status(400).json({ error: "No valid employee IDs provided" });
                }

                const result = await usersCollection.updateMany(
                    { _id: { $in: objectIds } },
                    { $set: { ...updateData, updatedAt: new Date() } }
                );

                res.json({
                    success: true,
                    message: `Updated ${result.modifiedCount} employees`,
                    modifiedCount: result.modifiedCount
                });
            } catch (error) {
                console.error("Error bulk updating employees:", error);
                res.status(500).json({ error: "Failed to bulk update employees" });
            }
        });

        // Get employee statistics
        app.get("/factory-employees/stats/summary", async (req, res) => {
            try {
                const db = client.db("finishingDB");
                const usersCollection = db.collection("users");

                const stats = await usersCollection.aggregate([
                    {
                        $group: {
                            _id: null,
                            totalEmployees: { $sum: 1 },
                            activeEmployees: {
                                $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] }
                            },
                            totalSalary: {
                                $sum: { $ifNull: ["$salary", 0] }
                            },
                            avgSalary: {
                                $avg: { $ifNull: ["$salary", 0] }
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            totalEmployees: 1,
                            activeEmployees: 1,
                            totalSalary: 1,
                            avgSalary: { $round: ["$avgSalary", 2] }
                        }
                    }
                ]).toArray();

                // Department wise count
                const deptStats = await usersCollection.aggregate([
                    {
                        $group: {
                            _id: "$department",
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            department: "$_id",
                            count: 1,
                            _id: 0
                        }
                    }
                ]).toArray();

                // Role wise count
                const roleStats = await usersCollection.aggregate([
                    {
                        $group: {
                            _id: "$role",
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            role: "$_id",
                            count: 1,
                            _id: 0
                        }
                    }
                ]).toArray();

                res.json({
                    overview: stats[0] || { totalEmployees: 0, activeEmployees: 0, totalSalary: 0, avgSalary: 0 },
                    byDepartment: deptStats,
                    byRole: roleStats
                });
            } catch (error) {
                console.error("Error fetching employee stats:", error);
                res.status(500).json({ error: "Failed to fetch employee statistics" });
            }
        });

        // Search employees with filters
        app.post("/factory-employees/search", async (req, res) => {
            try {
                const { searchTerm, department, role, status } = req.body;

                const db = client.db("finishingDB");
                const usersCollection = db.collection("users");

                // Build search query
                let query = {};

                if (searchTerm) {
                    query.$or = [
                        { fullName: { $regex: searchTerm, $options: 'i' } },
                        { userId: { $regex: searchTerm, $options: 'i' } },
                        { phone: { $regex: searchTerm, $options: 'i' } },
                        { nid: { $regex: searchTerm, $options: 'i' } },
                        { designation: { $regex: searchTerm, $options: 'i' } }
                    ];
                }

                if (department) {
                    query.department = department;
                }

                if (role) {
                    query.role = role;
                }

                if (status) {
                    query.status = status;
                }

                const users = await usersCollection.find(query).toArray();

                // Transform to employee format
                const employees = users.map((user, index) => ({
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
                    status: user.status || 'Active'
                }));

                res.json({
                    total: employees.length,
                    employees: employees
                });
            } catch (error) {
                console.error("Error searching employees:", error);
                res.status(500).json({ error: "Failed to search employees" });
            }
        });

        // Export employees data
        app.get("/factory-employees/export/:format", async (req, res) => {
            try {
                const { format } = req.params;
                const { department, role, status } = req.query;

                const db = client.db("finishingDB");
                const usersCollection = db.collection("users");

                // Build filter query
                let query = {};
                if (department) query.department = department;
                if (role) query.role = role;
                if (status) query.status = status;

                const users = await usersCollection.find(query).toArray();

                // Transform to export format
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
                    res.status(400).json({ error: "Unsupported export format" });
                }
            } catch (error) {
                console.error("Error exporting employees:", error);
                res.status(500).json({ error: "Failed to export employees" });
            }
        });



        // Get all machinery
        app.get("/machinery", async (req, res) => {
            try {
                const db = client.db("inventoryDB");

                // Check if collection exists, if not create it
                const collections = await db.listCollections({ name: "machinery" }).toArray();
                if (collections.length === 0) {
                    await db.createCollection("machinery");
                    console.log("Created machinery collection");
                }

                const machineryCollection = db.collection("machinery");
                const machinery = await machineryCollection.find().sort({ machineId: -1 }).toArray();

                console.log(`Found ${machinery.length} machinery items`);
                res.json(machinery);
            } catch (error) {
                console.error("Error fetching machinery:", error);
                res.status(500).json({ error: "Failed to fetch machinery" });
            }
        });

        // Add new machinery
        app.post("/machinery", async (req, res) => {
            try {
                console.log("Received POST request to /machinery with data:", req.body);

                const db = client.db("inventoryDB");

                // Check if collection exists, if not create it
                const collections = await db.listCollections({ name: "machinery" }).toArray();
                if (collections.length === 0) {
                    await db.createCollection("machinery");
                    console.log("Created machinery collection");
                }

                const machineryCollection = db.collection("machinery");

                // Validate required fields
                if (!req.body.machineName || !req.body.brand || !req.body.model ||
                    !req.body.serialNumber || !req.body.purchaseDate || !req.body.purchasePrice ||
                    !req.body.location || !req.body.maintenanceDate) {
                    return res.status(400).json({ error: "Missing required fields" });
                }

                // Check for duplicate serial number
                const existingMachine = await machineryCollection.findOne({ serialNumber: req.body.serialNumber });
                if (existingMachine) {
                    return res.status(400).json({ error: "Serial number already exists" });
                }

                // Generate Machine ID (Auto)
                const latestMachine = await machineryCollection
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

                const newMachinery = {
                    machineId: nextMachineId,
                    machineName: req.body.machineName,
                    brand: req.body.brand,
                    model: req.body.model,
                    serialNumber: req.body.serialNumber,
                    purchaseDate: req.body.purchaseDate,
                    purchasePrice: parseFloat(req.body.purchasePrice) || 0,
                    condition: req.body.condition || 'Good',
                    location: req.body.location,
                    maintenanceDate: req.body.maintenanceDate,
                    status: req.body.status || 'Active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                console.log("Saving new machinery:", newMachinery);
                const result = await machineryCollection.insertOne(newMachinery);
                console.log("Machinery saved with ID:", result.insertedId);

                // Calculate total machinery value after adding
                const totalValueResult = await machineryCollection.aggregate([
                    { $group: { _id: null, total: { $sum: "$purchasePrice" } } }
                ]).toArray();

                const totalValue = totalValueResult.length > 0 ? totalValueResult[0].total : 0;

                res.status(201).json({
                    ...newMachinery,
                    _id: result.insertedId,
                    totalValue: totalValue
                });
            } catch (error) {
                console.error("Error adding machinery:", error);
                res.status(500).json({ error: "Failed to add machinery", details: error.message });
            }
        });

        // Update machinery
        app.put("/machinery/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Received PUT request to /machinery/${id} with data:`, req.body);

                const db = client.db("inventoryDB");
                const machineryCollection = db.collection("machinery");

                // Check if machinery exists
                const existingMachine = await machineryCollection.findOne({ machineId: id });
                if (!existingMachine) {
                    return res.status(404).json({ error: "Machinery not found" });
                }

                // Check for duplicate serial number (if serial number is being updated)
                if (req.body.serialNumber && req.body.serialNumber !== existingMachine.serialNumber) {
                    const duplicateSerial = await machineryCollection.findOne({
                        serialNumber: req.body.serialNumber,
                        machineId: { $ne: id }
                    });
                    if (duplicateSerial) {
                        return res.status(400).json({ error: "Serial number already exists" });
                    }
                }

                const updateData = {
                    machineName: req.body.machineName || existingMachine.machineName,
                    brand: req.body.brand || existingMachine.brand,
                    model: req.body.model || existingMachine.model,
                    serialNumber: req.body.serialNumber || existingMachine.serialNumber,
                    purchaseDate: req.body.purchaseDate || existingMachine.purchaseDate,
                    purchasePrice: req.body.purchasePrice ? parseFloat(req.body.purchasePrice) : existingMachine.purchasePrice,
                    condition: req.body.condition || existingMachine.condition,
                    location: req.body.location || existingMachine.location,
                    maintenanceDate: req.body.maintenanceDate || existingMachine.maintenanceDate,
                    status: req.body.status || existingMachine.status,
                    updatedAt: new Date()
                };

                const result = await machineryCollection.updateOne(
                    { machineId: id },
                    { $set: updateData }
                );

                console.log("Machinery updated:", result.modifiedCount, "document(s) modified");

                // Calculate total machinery value after update
                const totalValueResult = await machineryCollection.aggregate([
                    { $group: { _id: null, total: { $sum: "$purchasePrice" } } }
                ]).toArray();

                const totalValue = totalValueResult.length > 0 ? totalValueResult[0].total : 0;

                res.json({
                    message: "Machinery updated successfully",
                    modifiedCount: result.modifiedCount,
                    totalValue: totalValue
                });
            } catch (error) {
                console.error("Error updating machinery:", error);
                res.status(500).json({ error: "Failed to update machinery", details: error.message });
            }
        });

        // Delete machinery
        app.delete("/machinery/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Received DELETE request to /machinery/${id}`);

                const db = client.db("inventoryDB");
                const machineryCollection = db.collection("machinery");

                const result = await machineryCollection.deleteOne({ machineId: id });

                if (result.deletedCount === 0) {
                    return res.status(404).json({ error: "Machinery not found" });
                }

                console.log("Machinery deleted:", result.deletedCount, "document(s) deleted");

                // Calculate total machinery value after deletion
                const totalValueResult = await machineryCollection.aggregate([
                    { $group: { _id: null, total: { $sum: "$purchasePrice" } } }
                ]).toArray();

                const totalValue = totalValueResult.length > 0 ? totalValueResult[0].total : 0;

                res.json({
                    message: "Machinery deleted successfully",
                    deletedCount: result.deletedCount,
                    totalValue: totalValue
                });
            } catch (error) {
                console.error("Error deleting machinery:", error);
                res.status(500).json({ error: "Failed to delete machinery", details: error.message });
            }
        });

        // Get single machinery
        app.get("/machinery/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Received GET request to /machinery/${id}`);

                const db = client.db("inventoryDB");
                const machineryCollection = db.collection("machinery");

                const machinery = await machineryCollection.findOne({ machineId: id });

                if (!machinery) {
                    return res.status(404).json({ error: "Machinery not found" });
                }

                res.json(machinery);
            } catch (error) {
                console.error("Error fetching machinery:", error);
                res.status(500).json({ error: "Failed to fetch machinery", details: error.message });
            }
        });

        // Get machinery by condition
        app.get("/machinery/condition/:condition", async (req, res) => {
            try {
                const { condition } = req.params;
                console.log(`Received GET request to /machinery/condition/${condition}`);

                const db = client.db("inventoryDB");
                const machineryCollection = db.collection("machinery");

                const machinery = await machineryCollection
                    .find({ condition: condition })
                    .sort({ machineId: -1 })
                    .toArray();

                console.log(`Found ${machinery.length} machinery with condition: ${condition}`);
                res.json(machinery);
            } catch (error) {
                console.error("Error fetching machinery by condition:", error);
                res.status(500).json({ error: "Failed to fetch machinery by condition", details: error.message });
            }
        });

        // Get machinery by status
        app.get("/machinery/status/:status", async (req, res) => {
            try {
                const { status } = req.params;
                console.log(`Received GET request to /machinery/status/${status}`);

                const db = client.db("inventoryDB");
                const machineryCollection = db.collection("machinery");

                const machinery = await machineryCollection
                    .find({ status: status })
                    .sort({ machineId: -1 })
                    .toArray();

                console.log(`Found ${machinery.length} machinery with status: ${status}`);
                res.json(machinery);
            } catch (error) {
                console.error("Error fetching machinery by status:", error);
                res.status(500).json({ error: "Failed to fetch machinery by status", details: error.message });
            }
        });

        // Get machinery by location
        app.get("/machinery/location/:location", async (req, res) => {
            try {
                const { location } = req.params;
                console.log(`Received GET request to /machinery/location/${location}`);

                const db = client.db("inventoryDB");
                const machineryCollection = db.collection("machinery");

                const machinery = await machineryCollection
                    .find({ location: { $regex: location, $options: 'i' } })
                    .sort({ machineId: -1 })
                    .toArray();

                console.log(`Found ${machinery.length} machinery at location: ${location}`);
                res.json(machinery);
            } catch (error) {
                console.error("Error fetching machinery by location:", error);
                res.status(500).json({ error: "Failed to fetch machinery by location", details: error.message });
            }
        });

        // Get maintenance due machinery (next 7 days)
        app.get("/machinery/maintenance/due", async (req, res) => {
            try {
                console.log("Received GET request to /machinery/maintenance/due");

                const db = client.db("inventoryDB");
                const machineryCollection = db.collection("machinery");

                const today = new Date();
                const nextWeek = new Date();
                nextWeek.setDate(today.getDate() + 7);

                const todayStr = today.toISOString().split('T')[0];
                const nextWeekStr = nextWeek.toISOString().split('T')[0];

                const machinery = await machineryCollection
                    .find({
                        maintenanceDate: {
                            $gte: todayStr,
                            $lte: nextWeekStr
                        },
                        status: "Active"
                    })
                    .sort({ maintenanceDate: 1 })
                    .toArray();

                console.log(`Found ${machinery.length} machinery due for maintenance in next 7 days`);

                // Add days remaining to each machine
                const machineryWithRemaining = machinery.map(machine => {
                    const maintDate = new Date(machine.maintenanceDate);
                    const diffTime = maintDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return {
                        ...machine,
                        daysRemaining: diffDays
                    };
                });

                res.json(machineryWithRemaining);
            } catch (error) {
                console.error("Error fetching maintenance due machinery:", error);
                res.status(500).json({ error: "Failed to fetch maintenance due machinery", details: error.message });
            }
        });

        // Get total machinery value and stats
        app.get("/machinery/stats/total-value", async (req, res) => {
            try {
                console.log("Received GET request to /machinery/stats/total-value");

                const db = client.db("inventoryDB");
                const machineryCollection = db.collection("machinery");

                const stats = await machineryCollection.aggregate([
                    {
                        $group: {
                            _id: null,
                            totalValue: { $sum: "$purchasePrice" },
                            count: { $sum: 1 },
                            activeCount: {
                                $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] }
                            },
                            inactiveCount: {
                                $sum: { $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0] }
                            },
                            goodCount: {
                                $sum: { $cond: [{ $eq: ["$condition", "Good"] }, 1, 0] }
                            },
                            repairCount: {
                                $sum: { $cond: [{ $eq: ["$condition", "Repair"] }, 1, 0] }
                            },
                            damagedCount: {
                                $sum: { $cond: [{ $eq: ["$condition", "Damaged"] }, 1, 0] }
                            },
                            avgValue: { $avg: "$purchasePrice" },
                            maxValue: { $max: "$purchasePrice" },
                            minValue: { $min: "$purchasePrice" }
                        }
                    }
                ]).toArray();

                const result = stats.length > 0 ? stats[0] : {
                    totalValue: 0,
                    count: 0,
                    activeCount: 0,
                    inactiveCount: 0,
                    goodCount: 0,
                    repairCount: 0,
                    damagedCount: 0,
                    avgValue: 0,
                    maxValue: 0,
                    minValue: 0
                };

                delete result._id;

                console.log("Stats calculated:", result);
                res.json(result);
            } catch (error) {
                console.error("Error calculating stats:", error);
                res.status(500).json({ error: "Failed to calculate stats", details: error.message });
            }
        });

        // Bulk update status
        app.patch("/machinery/bulk/status", async (req, res) => {
            try {
                console.log("Received PATCH request to /machinery/bulk/status with data:", req.body);

                const { machineIds, status } = req.body;

                if (!machineIds || !Array.isArray(machineIds) || machineIds.length === 0) {
                    return res.status(400).json({ error: "Machine IDs array is required" });
                }

                if (!status || !['Active', 'Inactive'].includes(status)) {
                    return res.status(400).json({ error: "Valid status (Active/Inactive) is required" });
                }

                const db = client.db("inventoryDB");
                const machineryCollection = db.collection("machinery");

                const result = await machineryCollection.updateMany(
                    { machineId: { $in: machineIds } },
                    {
                        $set: {
                            status: status,
                            updatedAt: new Date()
                        }
                    }
                );

                console.log("Bulk status update completed:", result);

                res.json({
                    message: "Bulk status update completed",
                    matchedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount
                });
            } catch (error) {
                console.error("Error in bulk status update:", error);
                res.status(500).json({ error: "Failed to update statuses", details: error.message });
            }
        });

        // Get machinery by date range
        app.get("/machinery/date-range", async (req, res) => {
            try {
                const { startDate, endDate } = req.query;
                console.log(`Received GET request to /machinery/date-range with start: ${startDate}, end: ${endDate}`);

                const db = client.db("inventoryDB");
                const machineryCollection = db.collection("machinery");

                let query = {};
                if (startDate && endDate) {
                    query.purchaseDate = {
                        $gte: startDate,
                        $lte: endDate
                    };
                }

                const machinery = await machineryCollection
                    .find(query)
                    .sort({ purchaseDate: -1 })
                    .toArray();

                console.log(`Found ${machinery.length} machinery in date range`);
                res.json(machinery);
            } catch (error) {
                console.error("Error fetching machinery by date range:", error);
                res.status(500).json({ error: "Failed to fetch machinery by date range", details: error.message });
            }
        });



        // Get all production products
        app.get("/production-products", async (req, res) => {
            try {
                const db = client.db("inventoryDB");

                // Check if collection exists
                const collections = await db.listCollections({ name: "productionproducts" }).toArray();
                if (collections.length === 0) {
                    await db.createCollection("productionproducts");
                    console.log("Created productionproducts collection");
                }

                const productsCollection = db.collection("productionproducts");
                const products = await productsCollection.find().sort({ productId: -1 }).toArray();

                console.log(`Found ${products.length} production products`);
                res.json(products);
            } catch (error) {
                console.error("Error fetching products:", error);
                res.status(500).json({ error: "Failed to fetch products" });
            }
        });

        // Add new production product
        app.post("/production-products", async (req, res) => {
            try {
                console.log("Received POST request to /production-products with data:", req.body);

                const db = client.db("inventoryDB");

                // Check if collection exists
                const collections = await db.listCollections({ name: "productionproducts" }).toArray();
                if (collections.length === 0) {
                    await db.createCollection("productionproducts");
                    console.log("Created productionproducts collection");
                }

                const productsCollection = db.collection("productionproducts");

                // Validate required fields
                if (!req.body.productName || !req.body.productCode || !req.body.category ||
                    !req.body.productionStage || !req.body.quantity || !req.body.unitCost ||
                    !req.body.assignedSupervisor) {
                    return res.status(400).json({ error: "Missing required fields" });
                }

                // Check for duplicate product code
                const existingProduct = await productsCollection.findOne({ productCode: req.body.productCode });
                if (existingProduct) {
                    return res.status(400).json({ error: "Product code already exists" });
                }

                // Generate Product ID (Auto)
                const latestProduct = await productsCollection
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

                // Calculate total cost
                const quantity = parseFloat(req.body.quantity) || 0;
                const unitCost = parseFloat(req.body.unitCost) || 0;
                const totalCost = quantity * unitCost;

                const newProduct = {
                    productId: nextProductId,
                    productName: req.body.productName,
                    productCode: req.body.productCode,
                    category: req.body.category,
                    productionStage: req.body.productionStage,
                    quantity: quantity,
                    unitCost: unitCost,
                    totalCost: totalCost,
                    assignedSupervisor: req.body.assignedSupervisor,
                    status: req.body.status || 'Running',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                console.log("Saving new product:", newProduct);
                const result = await productsCollection.insertOne(newProduct);
                console.log("Product saved with ID:", result.insertedId);

                // Calculate stats after adding
                const stats = await calculateProductStats(productsCollection);

                res.status(201).json({
                    ...newProduct,
                    _id: result.insertedId,
                    stats: stats
                });
            } catch (error) {
                console.error("Error adding product:", error);
                res.status(500).json({ error: "Failed to add product", details: error.message });
            }
        });

        // Update production product
        app.put("/production-products/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Received PUT request to /production-products/${id} with data:`, req.body);

                const db = client.db("inventoryDB");
                const productsCollection = db.collection("productionproducts");

                // Check if product exists
                const existingProduct = await productsCollection.findOne({ productId: id });
                if (!existingProduct) {
                    return res.status(404).json({ error: "Product not found" });
                }

                // Check for duplicate product code
                if (req.body.productCode && req.body.productCode !== existingProduct.productCode) {
                    const duplicateCode = await productsCollection.findOne({
                        productCode: req.body.productCode,
                        productId: { $ne: id }
                    });
                    if (duplicateCode) {
                        return res.status(400).json({ error: "Product code already exists" });
                    }
                }

                // Calculate total cost
                const quantity = parseFloat(req.body.quantity) || existingProduct.quantity;
                const unitCost = parseFloat(req.body.unitCost) || existingProduct.unitCost;
                const totalCost = quantity * unitCost;

                const updateData = {
                    productName: req.body.productName || existingProduct.productName,
                    productCode: req.body.productCode || existingProduct.productCode,
                    category: req.body.category || existingProduct.category,
                    productionStage: req.body.productionStage || existingProduct.productionStage,
                    quantity: quantity,
                    unitCost: unitCost,
                    totalCost: totalCost,
                    assignedSupervisor: req.body.assignedSupervisor || existingProduct.assignedSupervisor,
                    status: req.body.status || existingProduct.status,
                    updatedAt: new Date()
                };

                const result = await productsCollection.updateOne(
                    { productId: id },
                    { $set: updateData }
                );

                console.log("Product updated:", result.modifiedCount, "document(s) modified");

                // Calculate stats after update
                const stats = await calculateProductStats(productsCollection);

                res.json({
                    message: "Product updated successfully",
                    modifiedCount: result.modifiedCount,
                    stats: stats
                });
            } catch (error) {
                console.error("Error updating product:", error);
                res.status(500).json({ error: "Failed to update product", details: error.message });
            }
        });

        // Delete production product
        app.delete("/production-products/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Received DELETE request to /production-products/${id}`);

                const db = client.db("inventoryDB");
                const productsCollection = db.collection("productionproducts");

                const result = await productsCollection.deleteOne({ productId: id });

                if (result.deletedCount === 0) {
                    return res.status(404).json({ error: "Product not found" });
                }

                console.log("Product deleted:", result.deletedCount, "document(s) deleted");

                // Calculate stats after deletion
                const stats = await calculateProductStats(productsCollection);

                res.json({
                    message: "Product deleted successfully",
                    deletedCount: result.deletedCount,
                    stats: stats
                });
            } catch (error) {
                console.error("Error deleting product:", error);
                res.status(500).json({ error: "Failed to delete product", details: error.message });
            }
        });

        // Get single production product
        app.get("/production-products/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Received GET request to /production-products/${id}`);

                const db = client.db("inventoryDB");
                const productsCollection = db.collection("productionproducts");

                const product = await productsCollection.findOne({ productId: id });

                if (!product) {
                    return res.status(404).json({ error: "Product not found" });
                }

                res.json(product);
            } catch (error) {
                console.error("Error fetching product:", error);
                res.status(500).json({ error: "Failed to fetch product", details: error.message });
            }
        });

        // Get products by category
        app.get("/production-products/category/:category", async (req, res) => {
            try {
                const { category } = req.params;
                console.log(`Received GET request to /production-products/category/${category}`);

                const db = client.db("inventoryDB");
                const productsCollection = db.collection("productionproducts");

                const products = await productsCollection
                    .find({ category: category })
                    .sort({ productId: -1 })
                    .toArray();

                console.log(`Found ${products.length} products in category: ${category}`);
                res.json(products);
            } catch (error) {
                console.error("Error fetching products by category:", error);
                res.status(500).json({ error: "Failed to fetch products by category", details: error.message });
            }
        });

        // Get products by production stage
        app.get("/production-products/stage/:stage", async (req, res) => {
            try {
                const { stage } = req.params;
                console.log(`Received GET request to /production-products/stage/${stage}`);

                const db = client.db("inventoryDB");
                const productsCollection = db.collection("productionproducts");

                const products = await productsCollection
                    .find({ productionStage: stage })
                    .sort({ productId: -1 })
                    .toArray();

                console.log(`Found ${products.length} products in stage: ${stage}`);
                res.json(products);
            } catch (error) {
                console.error("Error fetching products by stage:", error);
                res.status(500).json({ error: "Failed to fetch products by stage", details: error.message });
            }
        });

        // Get products by status
        app.get("/production-products/status/:status", async (req, res) => {
            try {
                const { status } = req.params;
                console.log(`Received GET request to /production-products/status/${status}`);

                const db = client.db("inventoryDB");
                const productsCollection = db.collection("productionproducts");

                const products = await productsCollection
                    .find({ status: status })
                    .sort({ productId: -1 })
                    .toArray();

                console.log(`Found ${products.length} products with status: ${status}`);
                res.json(products);
            } catch (error) {
                console.error("Error fetching products by status:", error);
                res.status(500).json({ error: "Failed to fetch products by status", details: error.message });
            }
        });

        // Get products by supervisor
        app.get("/production-products/supervisor/:name", async (req, res) => {
            try {
                const { name } = req.params;
                console.log(`Received GET request to /production-products/supervisor/${name}`);

                const db = client.db("inventoryDB");
                const productsCollection = db.collection("productionproducts");

                const products = await productsCollection
                    .find({ assignedSupervisor: { $regex: name, $options: 'i' } })
                    .sort({ productId: -1 })
                    .toArray();

                console.log(`Found ${products.length} products for supervisor: ${name}`);
                res.json(products);
            } catch (error) {
                console.error("Error fetching products by supervisor:", error);
                res.status(500).json({ error: "Failed to fetch products by supervisor", details: error.message });
            }
        });

        // Get production stats
        app.get("/production-products/stats/overview", async (req, res) => {
            try {
                console.log("Received GET request to /production-products/stats/overview");

                const db = client.db("inventoryDB");
                const productsCollection = db.collection("productionproducts");

                const stats = await calculateProductStats(productsCollection);

                console.log("Stats calculated:", stats);
                res.json(stats);
            } catch (error) {
                console.error("Error calculating stats:", error);
                res.status(500).json({ error: "Failed to calculate stats", details: error.message });
            }
        });

        // Helper function to calculate product stats
        async function calculateProductStats(collection) {
            const stats = await collection.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        runningCount: {
                            $sum: { $cond: [{ $eq: ["$status", "Running"] }, 1, 0] }
                        },
                        completedCount: {
                            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
                        },
                        totalCost: { $sum: "$totalCost" },
                        totalQuantity: { $sum: "$quantity" },
                        avgUnitCost: { $avg: "$unitCost" },
                        doorCount: {
                            $sum: { $cond: [{ $eq: ["$category", "Door"] }, 1, 0] }
                        },
                        cabinetCount: {
                            $sum: { $cond: [{ $eq: ["$category", "Cabinet"] }, 1, 0] }
                        },
                        bedCount: {
                            $sum: { $cond: [{ $eq: ["$category", "Bed"] }, 1, 0] }
                        },
                        customCount: {
                            $sum: { $cond: [{ $eq: ["$category", "Custom"] }, 1, 0] }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0
                    }
                }
            ]).toArray();

            return stats.length > 0 ? stats[0] : {
                totalProducts: 0,
                runningCount: 0,
                completedCount: 0,
                totalCost: 0,
                totalQuantity: 0,
                avgUnitCost: 0,
                doorCount: 0,
                cabinetCount: 0,
                bedCount: 0,
                customCount: 0
            };
        }

        // Bulk update production stage
        app.patch("/production-products/bulk/stage", async (req, res) => {
            try {
                console.log("Received PATCH request to /production-products/bulk/stage with data:", req.body);

                const { productIds, productionStage } = req.body;

                if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
                    return res.status(400).json({ error: "Product IDs array is required" });
                }

                if (!productionStage || !['Cutting', 'CNC', 'Polish', 'Assembly', 'Complete'].includes(productionStage)) {
                    return res.status(400).json({ error: "Valid production stage is required" });
                }

                const db = client.db("inventoryDB");
                const productsCollection = db.collection("productionproducts");

                // If stage is Complete, also update status to Completed
                const updateData = {
                    productionStage: productionStage,
                    updatedAt: new Date()
                };

                if (productionStage === 'Complete') {
                    updateData.status = 'Completed';
                }

                const result = await productsCollection.updateMany(
                    { productId: { $in: productIds } },
                    { $set: updateData }
                );

                console.log("Bulk stage update completed:", result);

                // Calculate updated stats
                const stats = await calculateProductStats(productsCollection);

                res.json({
                    message: "Bulk stage update completed",
                    matchedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount,
                    stats: stats
                });
            } catch (error) {
                console.error("Error in bulk stage update:", error);
                res.status(500).json({ error: "Failed to update stages", details: error.message });
            }
        });


        // Get all finished goods
        app.get("/finished-goods", async (req, res) => {
            try {
                const db = client.db("inventoryDB");

                // Check if collection exists
                const collections = await db.listCollections({ name: "finishedgoods" }).toArray();
                if (collections.length === 0) {
                    await db.createCollection("finishedgoods");
                    console.log("Created finishedgoods collection");
                }

                const finishedGoodsCollection = db.collection("finishedgoods");
                const finishedGoods = await finishedGoodsCollection.find().sort({ fgId: -1 }).toArray();

                console.log(`Found ${finishedGoods.length} finished goods`);
                res.json(finishedGoods);
            } catch (error) {
                console.error("Error fetching finished goods:", error);
                res.status(500).json({ error: "Failed to fetch finished goods" });
            }
        });

        // Add new finished goods
        app.post("/finished-goods", async (req, res) => {
            try {
                console.log("Received POST request to /finished-goods with data:", req.body);

                const db = client.db("inventoryDB");

                // Check if collection exists
                const collections = await db.listCollections({ name: "finishedgoods" }).toArray();
                if (collections.length === 0) {
                    await db.createCollection("finishedgoods");
                    console.log("Created finishedgoods collection");
                }

                const finishedGoodsCollection = db.collection("finishedgoods");

                // Validate required fields
                if (!req.body.productName || !req.body.productCode || !req.body.category ||
                    !req.body.quantityAvailable || !req.body.unitPrice || !req.body.warehouseLocation) {
                    return res.status(400).json({ error: "Missing required fields" });
                }

                // Check for duplicate product code
                const existingProduct = await finishedGoodsCollection.findOne({ productCode: req.body.productCode });
                if (existingProduct) {
                    return res.status(400).json({ error: "Product code already exists" });
                }

                // Generate FG ID (Auto)
                const latestItem = await finishedGoodsCollection
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

                // Calculate total value
                const quantity = parseFloat(req.body.quantityAvailable) || 0;
                const unitPrice = parseFloat(req.body.unitPrice) || 0;
                const totalValue = quantity * unitPrice;

                const newItem = {
                    fgId: nextFgId,
                    productName: req.body.productName,
                    productCode: req.body.productCode,
                    category: req.body.category,
                    quantityAvailable: quantity,
                    unitPrice: unitPrice,
                    totalValue: totalValue,
                    warehouseLocation: req.body.warehouseLocation,
                    lastUpdated: req.body.lastUpdated || new Date().toISOString().split('T')[0],
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                console.log("Saving new finished goods:", newItem);
                const result = await finishedGoodsCollection.insertOne(newItem);
                console.log("Finished goods saved with ID:", result.insertedId);

                res.status(201).json({ ...newItem, _id: result.insertedId });
            } catch (error) {
                console.error("Error adding finished goods:", error);
                res.status(500).json({ error: "Failed to add finished goods", details: error.message });
            }
        });

        // Update finished goods
        app.put("/finished-goods/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Received PUT request to /finished-goods/${id} with data:`, req.body);

                const db = client.db("inventoryDB");
                const finishedGoodsCollection = db.collection("finishedgoods");

                // Check if item exists
                const existingItem = await finishedGoodsCollection.findOne({ fgId: id });
                if (!existingItem) {
                    return res.status(404).json({ error: "Finished goods not found" });
                }

                // Check for duplicate product code
                if (req.body.productCode && req.body.productCode !== existingItem.productCode) {
                    const duplicateCode = await finishedGoodsCollection.findOne({
                        productCode: req.body.productCode,
                        fgId: { $ne: id }
                    });
                    if (duplicateCode) {
                        return res.status(400).json({ error: "Product code already exists" });
                    }
                }

                // Calculate total value
                const quantity = parseFloat(req.body.quantityAvailable) || existingItem.quantityAvailable;
                const unitPrice = parseFloat(req.body.unitPrice) || existingItem.unitPrice;
                const totalValue = quantity * unitPrice;

                const updateData = {
                    productName: req.body.productName || existingItem.productName,
                    productCode: req.body.productCode || existingItem.productCode,
                    category: req.body.category || existingItem.category,
                    quantityAvailable: quantity,
                    unitPrice: unitPrice,
                    totalValue: totalValue,
                    warehouseLocation: req.body.warehouseLocation || existingItem.warehouseLocation,
                    lastUpdated: new Date().toISOString().split('T')[0],
                    updatedAt: new Date()
                };

                const result = await finishedGoodsCollection.updateOne(
                    { fgId: id },
                    { $set: updateData }
                );

                console.log("Finished goods updated:", result.modifiedCount, "document(s) modified");

                res.json({
                    message: "Finished goods updated successfully",
                    modifiedCount: result.modifiedCount
                });
            } catch (error) {
                console.error("Error updating finished goods:", error);
                res.status(500).json({ error: "Failed to update finished goods", details: error.message });
            }
        });

        // Delete finished goods
        app.delete("/finished-goods/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Received DELETE request to /finished-goods/${id}`);

                const db = client.db("inventoryDB");
                const finishedGoodsCollection = db.collection("finishedgoods");

                const result = await finishedGoodsCollection.deleteOne({ fgId: id });

                if (result.deletedCount === 0) {
                    return res.status(404).json({ error: "Finished goods not found" });
                }

                console.log("Finished goods deleted:", result.deletedCount, "document(s) deleted");

                res.json({
                    message: "Finished goods deleted successfully",
                    deletedCount: result.deletedCount
                });
            } catch (error) {
                console.error("Error deleting finished goods:", error);
                res.status(500).json({ error: "Failed to delete finished goods", details: error.message });
            }
        });

        // Get single finished goods
        app.get("/finished-goods/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Received GET request to /finished-goods/${id}`);

                const db = client.db("inventoryDB");
                const finishedGoodsCollection = db.collection("finishedgoods");

                const item = await finishedGoodsCollection.findOne({ fgId: id });

                if (!item) {
                    return res.status(404).json({ error: "Finished goods not found" });
                }

                res.json(item);
            } catch (error) {
                console.error("Error fetching finished goods:", error);
                res.status(500).json({ error: "Failed to fetch finished goods", details: error.message });
            }
        });

        // Get low stock items
        app.get("/finished-goods/low-stock/:threshold", async (req, res) => {
            try {
                const { threshold } = req.params;
                console.log(`Received GET request to /finished-goods/low-stock/${threshold}`);

                const db = client.db("inventoryDB");
                const finishedGoodsCollection = db.collection("finishedgoods");

                const items = await finishedGoodsCollection
                    .find({ quantityAvailable: { $lte: parseInt(threshold) } })
                    .sort({ quantityAvailable: 1 })
                    .toArray();

                console.log(`Found ${items.length} low stock items`);
                res.json(items);
            } catch (error) {
                console.error("Error fetching low stock items:", error);
                res.status(500).json({ error: "Failed to fetch low stock items", details: error.message });
            }
        });

        // Get items by category
        app.get("/finished-goods/category/:category", async (req, res) => {
            try {
                const { category } = req.params;
                console.log(`Received GET request to /finished-goods/category/${category}`);

                const db = client.db("inventoryDB");
                const finishedGoodsCollection = db.collection("finishedgoods");

                const items = await finishedGoodsCollection
                    .find({ category: category })
                    .sort({ productName: 1 })
                    .toArray();

                console.log(`Found ${items.length} items in category: ${category}`);
                res.json(items);
            } catch (error) {
                console.error("Error fetching items by category:", error);
                res.status(500).json({ error: "Failed to fetch items by category", details: error.message });
            }
        });

        // Get total inventory value
        app.get("/finished-goods/stats/total-value", async (req, res) => {
            try {
                console.log("Received GET request to /finished-goods/stats/total-value");

                const db = client.db("inventoryDB");
                const finishedGoodsCollection = db.collection("finishedgoods");

                const stats = await finishedGoodsCollection.aggregate([
                    {
                        $group: {
                            _id: null,
                            totalValue: { $sum: "$totalValue" },
                            totalItems: { $sum: 1 },
                            totalQuantity: { $sum: "$quantityAvailable" },
                            avgUnitPrice: { $avg: "$unitPrice" },
                            maxValue: { $max: "$totalValue" },
                            minValue: { $min: "$totalValue" }
                        }
                    }
                ]).toArray();

                const result = stats.length > 0 ? stats[0] : {
                    totalValue: 0,
                    totalItems: 0,
                    totalQuantity: 0,
                    avgUnitPrice: 0,
                    maxValue: 0,
                    minValue: 0
                };

                delete result._id;

                console.log("Stats calculated:", result);
                res.json(result);
            } catch (error) {
                console.error("Error calculating stats:", error);
                res.status(500).json({ error: "Failed to calculate stats", details: error.message });
            }
        });

        // ========== STOCK MOVEMENT LOGS ==========

        // Get all stock movements
        app.get("/stock-movements", async (req, res) => {
            try {
                const db = client.db("inventoryDB");

                // Check if collection exists
                const collections = await db.listCollections({ name: "stockmovements" }).toArray();
                if (collections.length === 0) {
                    await db.createCollection("stockmovements");
                    console.log("Created stockmovements collection");
                }

                const movementsCollection = db.collection("stockmovements");
                const movements = await movementsCollection.find().sort({ timestamp: -1 }).toArray();

                console.log(`Found ${movements.length} stock movements`);
                res.json(movements);
            } catch (error) {
                console.error("Error fetching stock movements:", error);
                res.status(500).json({ error: "Failed to fetch stock movements" });
            }
        });

        // Get stock movements by FG ID
        app.get("/stock-movements/:fgId", async (req, res) => {
            try {
                const { fgId } = req.params;
                console.log(`Received GET request to /stock-movements/${fgId}`);

                const db = client.db("inventoryDB");

                // Check if collection exists
                const collections = await db.listCollections({ name: "stockmovements" }).toArray();
                if (collections.length === 0) {
                    await db.createCollection("stockmovements");
                    console.log("Created stockmovements collection");
                }

                const movementsCollection = db.collection("stockmovements");
                const movements = await movementsCollection
                    .find({ fgId: fgId })
                    .sort({ timestamp: -1 })
                    .toArray();

                console.log(`Found ${movements.length} movements for FG ID: ${fgId}`);
                res.json(movements);
            } catch (error) {
                console.error("Error fetching stock movements:", error);
                res.status(500).json({ error: "Failed to fetch stock movements", details: error.message });
            }
        });

        // Add stock movement
        app.post("/stock-movements", async (req, res) => {
            try {
                console.log("Received POST request to /stock-movements with data:", req.body);

                const db = client.db("inventoryDB");

                // Check if collection exists
                const collections = await db.listCollections({ name: "stockmovements" }).toArray();
                if (collections.length === 0) {
                    await db.createCollection("stockmovements");
                    console.log("Created stockmovements collection");
                }

                const movementsCollection = db.collection("stockmovements");

                // Generate Movement ID
                const latestMovement = await movementsCollection
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

                const newMovement = {
                    movementId: nextMovementId,
                    fgId: req.body.fgId,
                    productName: req.body.productName,
                    previousQuantity: req.body.previousQuantity || null,
                    newQuantity: req.body.newQuantity || null,
                    quantity: req.body.quantity || null,
                    changeType: req.body.changeType || 'Update',
                    changedBy: req.body.changedBy || 'Admin',
                    timestamp: req.body.timestamp || new Date(),
                    createdAt: new Date()
                };

                console.log("Saving new stock movement:", newMovement);
                const result = await movementsCollection.insertOne(newMovement);
                console.log("Stock movement saved with ID:", result.insertedId);

                res.status(201).json({ ...newMovement, _id: result.insertedId });
            } catch (error) {
                console.error("Error adding stock movement:", error);
                res.status(500).json({ error: "Failed to add stock movement", details: error.message });
            }
        });

        // Get movement summary by date range
        app.get("/stock-movements/summary/date-range", async (req, res) => {
            try {
                const { startDate, endDate } = req.query;
                console.log(`Received GET request to /stock-movements/summary/date-range with start: ${startDate}, end: ${endDate}`);

                const db = client.db("inventoryDB");
                const movementsCollection = db.collection("stockmovements");

                let query = {};
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);

                    query.timestamp = {
                        $gte: start,
                        $lte: end
                    };
                }

                const summary = await movementsCollection.aggregate([
                    { $match: query },
                    {
                        $group: {
                            _id: "$changeType",
                            count: { $sum: 1 },
                            totalQuantity: { $sum: "$quantity" }
                        }
                    }
                ]).toArray();

                console.log("Movement summary calculated:", summary);
                res.json(summary);
            } catch (error) {
                console.error("Error fetching movement summary:", error);
                res.status(500).json({ error: "Failed to fetch movement summary", details: error.message });
            }
        });

        // Get recent movements (last 10)
        app.get("/stock-movements/recent/:limit", async (req, res) => {
            try {
                const limit = parseInt(req.params.limit) || 10;
                console.log(`Received GET request to /stock-movements/recent/${limit}`);

                const db = client.db("inventoryDB");
                const movementsCollection = db.collection("stockmovements");

                const movements = await movementsCollection
                    .find()
                    .sort({ timestamp: -1 })
                    .limit(limit)
                    .toArray();

                console.log(`Found ${movements.length} recent movements`);
                res.json(movements);
            } catch (error) {
                console.error("Error fetching recent movements:", error);
                res.status(500).json({ error: "Failed to fetch recent movements", details: error.message });
            }
        });

        // Get movements by product
        app.get("/stock-movements/product/:productName", async (req, res) => {
            try {
                const { productName } = req.params;
                console.log(`Received GET request to /stock-movements/product/${productName}`);

                const db = client.db("inventoryDB");
                const movementsCollection = db.collection("stockmovements");

                const movements = await movementsCollection
                    .find({
                        productName: { $regex: productName, $options: 'i' }
                    })
                    .sort({ timestamp: -1 })
                    .toArray();

                console.log(`Found ${movements.length} movements for product: ${productName}`);
                res.json(movements);
            } catch (error) {
                console.error("Error fetching product movements:", error);
                res.status(500).json({ error: "Failed to fetch product movements", details: error.message });
            }
        });

        // Get movement statistics
        app.get("/stock-movements/stats/overview", async (req, res) => {
            try {
                console.log("Received GET request to /stock-movements/stats/overview");

                const db = client.db("inventoryDB");
                const movementsCollection = db.collection("stockmovements");

                const stats = await movementsCollection.aggregate([
                    {
                        $group: {
                            _id: null,
                            totalMovements: { $sum: 1 },
                            totalAdded: {
                                $sum: {
                                    $cond: [{ $eq: ["$changeType", "Added"] }, "$quantity", 0]
                                }
                            },
                            totalRemoved: {
                                $sum: {
                                    $cond: [{ $eq: ["$changeType", "Removed"] }, "$quantity", 0]
                                }
                            },
                            totalUpdates: {
                                $sum: {
                                    $cond: [{ $eq: ["$changeType", "Update"] }, 1, 0]
                                }
                            },
                            uniqueProducts: { $addToSet: "$productName" }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            totalMovements: 1,
                            totalAdded: 1,
                            totalRemoved: 1,
                            totalUpdates: 1,
                            uniqueProductsCount: { $size: "$uniqueProducts" }
                        }
                    }
                ]).toArray();

                const result = stats.length > 0 ? stats[0] : {
                    totalMovements: 0,
                    totalAdded: 0,
                    totalRemoved: 0,
                    totalUpdates: 0,
                    uniqueProductsCount: 0
                };

                console.log("Movement stats calculated:", result);
                res.json(result);
            } catch (error) {
                console.error("Error calculating movement stats:", error);
                res.status(500).json({ error: "Failed to calculate movement stats", details: error.message });
            }
        });



        // Get all raw materials
        app.get("/raw-materials", async (req, res) => {
            try {
                const db = client.db("inventoryDB");

                // Check if collection exists
                const collections = await db.listCollections({ name: "rawmaterials" }).toArray();
                if (collections.length === 0) {
                    await db.createCollection("rawmaterials");
                    console.log("Created rawmaterials collection");
                }

                const materialsCollection = db.collection("rawmaterials");
                const materials = await materialsCollection.find().sort({ materialId: -1 }).toArray();

                console.log(`Found ${materials.length} raw materials`);
                res.json(materials);
            } catch (error) {
                console.error("Error fetching raw materials:", error);
                res.status(500).json({ error: "Failed to fetch raw materials" });
            }
        });

        // Add new raw material
        app.post("/raw-materials", async (req, res) => {
            try {
                console.log("Received POST request to /raw-materials with data:", req.body);

                const db = client.db("inventoryDB");

                // Check if collection exists
                const collections = await db.listCollections({ name: "rawmaterials" }).toArray();
                if (collections.length === 0) {
                    await db.createCollection("rawmaterials");
                    console.log("Created rawmaterials collection");
                }

                const materialsCollection = db.collection("rawmaterials");

                // Validate required fields
                if (!req.body.materialName || !req.body.type || !req.body.thicknessSize ||
                    !req.body.supplierName || !req.body.purchaseDate || !req.body.quantity ||
                    !req.body.unit || !req.body.unitPrice || !req.body.currentStock ||
                    !req.body.minimumStockLevel) {
                    return res.status(400).json({ error: "Missing required fields" });
                }

                // Generate Material ID (Auto)
                const latestItem = await materialsCollection
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

                // Calculate total value
                const quantity = parseFloat(req.body.quantity) || 0;
                const unitPrice = parseFloat(req.body.unitPrice) || 0;
                const totalValue = quantity * unitPrice;

                // Auto-determine status
                const currentStock = parseFloat(req.body.currentStock) || 0;
                const minStock = parseFloat(req.body.minimumStockLevel) || 0;

                let status = 'Available';
                if (currentStock === 0) {
                    status = 'Out of Stock';
                } else if (currentStock <= minStock) {
                    status = 'Low';
                }

                const newItem = {
                    materialId: nextMaterialId,
                    materialName: req.body.materialName,
                    type: req.body.type,
                    thicknessSize: req.body.thicknessSize,
                    supplierName: req.body.supplierName,
                    purchaseDate: req.body.purchaseDate,
                    quantity: quantity,
                    unit: req.body.unit,
                    unitPrice: unitPrice,
                    totalValue: totalValue,
                    currentStock: currentStock,
                    minimumStockLevel: minStock,
                    status: status,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                console.log("Saving new raw material:", newItem);
                const result = await materialsCollection.insertOne(newItem);
                console.log("Raw material saved with ID:", result.insertedId);

                // Check for low stock alert
                if (status === 'Low') {
                    console.log(`⚠️ LOW STOCK ALERT: ${newItem.materialName} (${newItem.materialId}) - Current: ${currentStock}, Min: ${minStock}`);
                } else if (status === 'Out of Stock') {
                    console.log(`🔴 OUT OF STOCK ALERT: ${newItem.materialName} (${newItem.materialId})`);
                }

                res.status(201).json({ ...newItem, _id: result.insertedId });
            } catch (error) {
                console.error("Error adding raw material:", error);
                res.status(500).json({ error: "Failed to add raw material", details: error.message });
            }
        });

        // Update raw material
        app.put("/raw-materials/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Received PUT request to /raw-materials/${id} with data:`, req.body);

                const db = client.db("inventoryDB");
                const materialsCollection = db.collection("rawmaterials");

                // Check if item exists
                const existingItem = await materialsCollection.findOne({ materialId: id });
                if (!existingItem) {
                    return res.status(404).json({ error: "Raw material not found" });
                }

                // Calculate total value
                const quantity = parseFloat(req.body.quantity) || existingItem.quantity;
                const unitPrice = parseFloat(req.body.unitPrice) || existingItem.unitPrice;
                const totalValue = quantity * unitPrice;

                // Auto-determine status
                const currentStock = parseFloat(req.body.currentStock) !== undefined ?
                    parseFloat(req.body.currentStock) : existingItem.currentStock;
                const minStock = parseFloat(req.body.minimumStockLevel) !== undefined ?
                    parseFloat(req.body.minimumStockLevel) : existingItem.minimumStockLevel;

                let status = 'Available';
                if (currentStock === 0) {
                    status = 'Out of Stock';
                } else if (currentStock <= minStock) {
                    status = 'Low';
                }

                const updateData = {
                    materialName: req.body.materialName || existingItem.materialName,
                    type: req.body.type || existingItem.type,
                    thicknessSize: req.body.thicknessSize || existingItem.thicknessSize,
                    supplierName: req.body.supplierName || existingItem.supplierName,
                    purchaseDate: req.body.purchaseDate || existingItem.purchaseDate,
                    quantity: quantity,
                    unit: req.body.unit || existingItem.unit,
                    unitPrice: unitPrice,
                    totalValue: totalValue,
                    currentStock: currentStock,
                    minimumStockLevel: minStock,
                    status: status,
                    updatedAt: new Date()
                };

                const result = await materialsCollection.updateOne(
                    { materialId: id },
                    { $set: updateData }
                );

                console.log("Raw material updated:", result.modifiedCount, "document(s) modified");

                // Check for low stock alert after update
                if (status === 'Low') {
                    console.log(`⚠️ LOW STOCK ALERT: ${updateData.materialName} (${id}) - Current: ${currentStock}, Min: ${minStock}`);
                } else if (status === 'Out of Stock') {
                    console.log(`🔴 OUT OF STOCK ALERT: ${updateData.materialName} (${id})`);
                }

                res.json({
                    message: "Raw material updated successfully",
                    modifiedCount: result.modifiedCount,
                    status: status
                });
            } catch (error) {
                console.error("Error updating raw material:", error);
                res.status(500).json({ error: "Failed to update raw material", details: error.message });
            }
        });

        // Delete raw material
        app.delete("/raw-materials/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Received DELETE request to /raw-materials/${id}`);

                const db = client.db("inventoryDB");
                const materialsCollection = db.collection("rawmaterials");

                const result = await materialsCollection.deleteOne({ materialId: id });

                if (result.deletedCount === 0) {
                    return res.status(404).json({ error: "Raw material not found" });
                }

                console.log("Raw material deleted:", result.deletedCount, "document(s) deleted");

                res.json({
                    message: "Raw material deleted successfully",
                    deletedCount: result.deletedCount
                });
            } catch (error) {
                console.error("Error deleting raw material:", error);
                res.status(500).json({ error: "Failed to delete raw material", details: error.message });
            }
        });

        // Get single raw material
        app.get("/raw-materials/:id", async (req, res) => {
            try {
                const { id } = req.params;
                console.log(`Received GET request to /raw-materials/${id}`);

                const db = client.db("inventoryDB");
                const materialsCollection = db.collection("rawmaterials");

                const item = await materialsCollection.findOne({ materialId: id });

                if (!item) {
                    return res.status(404).json({ error: "Raw material not found" });
                }

                res.json(item);
            } catch (error) {
                console.error("Error fetching raw material:", error);
                res.status(500).json({ error: "Failed to fetch raw material", details: error.message });
            }
        });

        // Get materials by type
        app.get("/raw-materials/type/:type", async (req, res) => {
            try {
                const { type } = req.params;
                console.log(`Received GET request to /raw-materials/type/${type}`);

                const db = client.db("inventoryDB");
                const materialsCollection = db.collection("rawmaterials");

                const items = await materialsCollection
                    .find({ type: type })
                    .sort({ materialName: 1 })
                    .toArray();

                console.log(`Found ${items.length} materials of type: ${type}`);
                res.json(items);
            } catch (error) {
                console.error("Error fetching materials by type:", error);
                res.status(500).json({ error: "Failed to fetch materials by type", details: error.message });
            }
        });

        // Get materials by supplier
        app.get("/raw-materials/supplier/:supplierName", async (req, res) => {
            try {
                const { supplierName } = req.params;
                console.log(`Received GET request to /raw-materials/supplier/${supplierName}`);

                const db = client.db("inventoryDB");
                const materialsCollection = db.collection("rawmaterials");

                const items = await materialsCollection
                    .find({ supplierName: { $regex: supplierName, $options: 'i' } })
                    .sort({ purchaseDate: -1 })
                    .toArray();

                console.log(`Found ${items.length} materials from supplier: ${supplierName}`);
                res.json(items);
            } catch (error) {
                console.error("Error fetching materials by supplier:", error);
                res.status(500).json({ error: "Failed to fetch materials by supplier", details: error.message });
            }
        });

        // Get low stock materials (auto alert)
        app.get("/raw-materials/low-stock", async (req, res) => {
            try {
                console.log("Received GET request to /raw-materials/low-stock");

                const db = client.db("inventoryDB");
                const materialsCollection = db.collection("rawmaterials");

                const lowStockItems = await materialsCollection
                    .find({
                        $expr: { $lte: ["$currentStock", "$minimumStockLevel"] },
                        currentStock: { $gt: 0 }
                    })
                    .sort({ currentStock: 1 })
                    .toArray();

                console.log(`Found ${lowStockItems.length} low stock materials`);
                res.json(lowStockItems);
            } catch (error) {
                console.error("Error fetching low stock materials:", error);
                res.status(500).json({ error: "Failed to fetch low stock materials", details: error.message });
            }
        });

        // Get out of stock materials
        app.get("/raw-materials/out-of-stock", async (req, res) => {
            try {
                console.log("Received GET request to /raw-materials/out-of-stock");

                const db = client.db("inventoryDB");
                const materialsCollection = db.collection("rawmaterials");

                const outOfStockItems = await materialsCollection
                    .find({ currentStock: 0 })
                    .sort({ materialName: 1 })
                    .toArray();

                console.log(`Found ${outOfStockItems.length} out of stock materials`);
                res.json(outOfStockItems);
            } catch (error) {
                console.error("Error fetching out of stock materials:", error);
                res.status(500).json({ error: "Failed to fetch out of stock materials", details: error.message });
            }
        });

        // Get materials by unit
        app.get("/raw-materials/unit/:unit", async (req, res) => {
            try {
                const { unit } = req.params;
                console.log(`Received GET request to /raw-materials/unit/${unit}`);

                const db = client.db("inventoryDB");
                const materialsCollection = db.collection("rawmaterials");

                const items = await materialsCollection
                    .find({ unit: unit })
                    .sort({ materialName: 1 })
                    .toArray();

                console.log(`Found ${items.length} materials with unit: ${unit}`);
                res.json(items);
            } catch (error) {
                console.error("Error fetching materials by unit:", error);
                res.status(500).json({ error: "Failed to fetch materials by unit", details: error.message });
            }
        });

        // Get inventory summary/stats
        app.get("/raw-materials/stats/summary", async (req, res) => {
            try {
                console.log("Received GET request to /raw-materials/stats/summary");

                const db = client.db("inventoryDB");
                const materialsCollection = db.collection("rawmaterials");

                const stats = await materialsCollection.aggregate([
                    {
                        $group: {
                            _id: null,
                            totalMaterials: { $sum: 1 },
                            totalValue: { $sum: "$totalValue" },
                            totalQuantity: { $sum: "$quantity" },
                            lowStockCount: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $lte: ["$currentStock", "$minimumStockLevel"] },
                                                { $gt: ["$currentStock", 0] }
                                            ]
                                        },
                                        1, 0
                                    ]
                                }
                            },
                            outOfStockCount: {
                                $sum: {
                                    $cond: [{ $eq: ["$currentStock", 0] }, 1, 0]
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0
                        }
                    }
                ]).toArray();

                // Get counts by type
                const typeStats = await materialsCollection.aggregate([
                    {
                        $group: {
                            _id: "$type",
                            count: { $sum: 1 }
                        }
                    }
                ]).toArray();

                const result = stats.length > 0 ? stats[0] : {
                    totalMaterials: 0,
                    totalValue: 0,
                    totalQuantity: 0,
                    lowStockCount: 0,
                    outOfStockCount: 0
                };

                result.byType = typeStats;

                console.log("Stats calculated:", result);
                res.json(result);
            } catch (error) {
                console.error("Error calculating stats:", error);
                res.status(500).json({ error: "Failed to calculate stats", details: error.message });
            }
        });

        // Bulk update stock levels
        app.patch("/raw-materials/bulk/stock-update", async (req, res) => {
            try {
                console.log("Received PATCH request to /raw-materials/bulk/stock-update with data:", req.body);

                const { materialIds, adjustmentType, adjustmentValue } = req.body;

                if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
                    return res.status(400).json({ error: "Material IDs array is required" });
                }

                const db = client.db("inventoryDB");
                const materialsCollection = db.collection("rawmaterials");

                let updatePromises = [];

                if (adjustmentType === 'increase') {
                    updatePromises = materialIds.map(async (id) => {
                        const material = await materialsCollection.findOne({ materialId: id });
                        if (material) {
                            const newStock = material.currentStock + parseFloat(adjustmentValue);
                            const newStatus = newStock === 0 ? 'Out of Stock' :
                                newStock <= material.minimumStockLevel ? 'Low' : 'Available';

                            return materialsCollection.updateOne(
                                { materialId: id },
                                {
                                    $set: {
                                        currentStock: newStock,
                                        status: newStatus,
                                        updatedAt: new Date()
                                    }
                                }
                            );
                        }
                    });
                } else if (adjustmentType === 'decrease') {
                    updatePromises = materialIds.map(async (id) => {
                        const material = await materialsCollection.findOne({ materialId: id });
                        if (material) {
                            const newStock = Math.max(0, material.currentStock - parseFloat(adjustmentValue));
                            const newStatus = newStock === 0 ? 'Out of Stock' :
                                newStock <= material.minimumStockLevel ? 'Low' : 'Available';

                            return materialsCollection.updateOne(
                                { materialId: id },
                                {
                                    $set: {
                                        currentStock: newStock,
                                        status: newStatus,
                                        updatedAt: new Date()
                                    }
                                }
                            );
                        }
                    });
                }

                const results = await Promise.all(updatePromises);
                const modifiedCount = results.filter(r => r && r.modifiedCount > 0).length;

                console.log(`Bulk stock update completed for ${modifiedCount} materials`);

                res.json({
                    message: "Bulk stock update completed",
                    modifiedCount: modifiedCount
                });
            } catch (error) {
                console.error("Error in bulk stock update:", error);
                res.status(500).json({ error: "Failed to update stocks", details: error.message });
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