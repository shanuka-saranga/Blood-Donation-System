const express = require("express");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/authroutes");
const db = require("./config/db");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check Route
app.get("/", (req, res) => {
  res.json({ message: "Blood Donation System API is running..." });
});

// API Routes
app.use("/api/auth", authRoutes);

// Port Listening
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await db.testConnection();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exitCode = 1;
  }
};

module.exports = app;
module.exports.startServer = startServer;

if (require.main === module) {
  startServer();
}
