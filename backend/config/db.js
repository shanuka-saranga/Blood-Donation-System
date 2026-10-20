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

const ensureProfileColumns = async () => {
  const columns = [
    ["phone", "VARCHAR(30) NULL"],
    ["blood_group", "VARCHAR(5) NULL"],
    ["location", "VARCHAR(120) NULL"],
    ["profile_picture", "MEDIUMTEXT NULL"],
  ];

  for (const [name, definition] of columns) {
    const [existingColumns] = await promisePool.query(
      `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
      [name],
    );

    if (existingColumns[0].count === 0) {
      await promisePool.query(`ALTER TABLE users ADD COLUMN ${name} ${definition}`);
    }
  }
};

const ensureDonorDetailsTable = async () => {
  await promisePool.query(`
    CREATE TABLE IF NOT EXISTS donor_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      blood_group VARCHAR(5) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      nic VARCHAR(20) NOT NULL,
      age TINYINT UNSIGNED NOT NULL,
      gender VARCHAR(20) NOT NULL,
      city VARCHAR(100) NOT NULL,
      last_donated_date DATE NULL,
      is_eligible BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_donor_details_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
};

promisePool.testConnection = testConnection;
promisePool.ensureProfileColumns = ensureProfileColumns;
promisePool.ensureDonorDetailsTable = ensureDonorDetailsTable;

module.exports = promisePool;
