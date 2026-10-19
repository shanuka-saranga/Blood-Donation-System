const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promisePool = pool.promise();

const testConnection = async () => {
  const connection = await promisePool.getConnection();

  try {
    await connection.query("SELECT 1");
    console.log("Database connected successfully.");
  } finally {
    connection.release();
  }
};

promisePool.testConnection = testConnection;

module.exports = promisePool;
