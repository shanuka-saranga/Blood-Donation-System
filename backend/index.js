const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();
const authRoutes = require("./routes/authroutes");
const requestRoutes = require("./routes/requestroutes");
const db = require("./config/db");

const app = express();

// 1. Helmet Security Middleware (HTTP Headers Secure කිරීමට)
app.use(helmet());

// 2. Restricted CORS Middleware (Frontend URL එකට පමණක් Access ලබාදීමට)
const allowedOrigins = [
  "https://blood-care-sl.vercel.app", // ඔයාගේ Live Frontend URL එක මෙතනට දාන්න
  "http://localhost:5173",                     // Local React App එක සඳහා
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Postman හෝ Server-to-Server requests සඳහා origin නොමැත, live frontend සඳහා origin පරීක්ෂා කෙරේ
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS Policy: Direct or Unauthorized access blocked."));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "3mb" }));

// 3. Direct Browser Access Block (Direct Root URL එකෙන් 403 Forbidden පෙන්වයි)
app.get("/", (req, res) => {
  res.status(403).json({
    status: "Forbidden",
    message: "Access Denied: Direct browser access to Backend API is not allowed.",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);

// JSON 404 handler for unmatched API routes
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

    const server = app.listen(PORT);

    server.once("listening", () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Stop the other server process or set a different PORT in backend/.env`
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