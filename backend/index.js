const express = require("express");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/authroutes");
const requestRoutes = require("./routes/requestroutes");
const db = require("./config/db");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "3mb" }));

// Health Check Route
app.get("/", (req, res) => {
  res.json({ message: "Blood Donation System API is running..." });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);

// JSON 404 handler for unmatched API routes.
// Without this, Express replies with an HTML "Cannot GET ..." page, which makes
// frontend error handling far harder to debug.
app.use("/api", (req, res) => {
  res.status(404).json({
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Port Listening
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await db.testConnection();
    await db.ensureProfileColumns();
    await db.ensureDonorDetailsTable();
    await db.ensureDonationRecordsTable();
    await db.ensureDonationCampsTable();
    await db.ensureBloodRequestsTable();

    // NOTE: the callback form of app.listen() is registered by Express as a
    // one-time *error* listener, so on EADDRINUSE it would still run and log a
    // misleading "Server running on port ..." message. Using the "listening"
    // event instead guarantees the success message is only printed when the
    // socket was actually bound.
    const server = app.listen(PORT);

    server.once("listening", () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Listen errors are emitted asynchronously, so they are NOT caught by the
    // try/catch above. Without this handler the process stays alive without
    // ever serving requests (e.g. when port 5000 is already taken).
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Stop the other server process or set a different PORT in backend/.env`,
        );
      } else {
        console.error("Server failed to start:", error.message);
      }
      process.exit(1);
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
