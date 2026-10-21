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

const ensureDonationRecordsTable = async () => {
  await promisePool.query(`
    CREATE TABLE IF NOT EXISTS donation_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      donor_id INT NOT NULL,
      request_id INT NULL,
      donated_date DATE NOT NULL,
      units_donated DECIMAL(4, 2) NOT NULL,
      hospital_name VARCHAR(150) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'completed',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_donation_records_donor
        FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
};

const ensureDonationCampsTable = async () => {
  await promisePool.query(`
    CREATE TABLE IF NOT EXISTS donation_camps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      created_by INT NULL,
      title VARCHAR(150) NOT NULL,
      organizer VARCHAR(150) NOT NULL,
      location VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL,
      camp_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      contact_number VARCHAR(30) NOT NULL,
      description TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_donation_camps_creator
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
};

const ensureBloodRequestsTable = async () => {
  await promisePool.query(`
    CREATE TABLE IF NOT EXISTS blood_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requester_id INT NULL,
      blood_group VARCHAR(5) NOT NULL,
      hospital_name VARCHAR(150) NOT NULL,
      units_required DECIMAL(4, 2) NOT NULL,
      urgency VARCHAR(20) NOT NULL DEFAULT 'standard',
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      accepted_by INT NULL,
      accepted_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_blood_requests_requester
        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_blood_requests_acceptor
        FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  const columns = [
    ["requester_id", "INT NULL"],
    ["patient_name", "VARCHAR(150) NULL"],
    ["blood_group", "VARCHAR(5) NULL"],
    ["hospital_name", "VARCHAR(150) NULL"],
    ["city", "VARCHAR(100) NULL"],
    ["contact_number", "VARCHAR(30) NULL"],
    ["units_required", "DECIMAL(4, 2) NULL"],
    ["urgency_level", "VARCHAR(20) NULL"],
    ["urgency", "VARCHAR(20) NOT NULL DEFAULT 'standard'"],
    ["status", "VARCHAR(30) NOT NULL DEFAULT 'pending'"],
    ["required_date", "DATE NULL"],
    ["accepted_by", "INT NULL"],
    ["accepted_at", "TIMESTAMP NULL"],
    ["created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"],
    ["updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"],
  ];

  for (const [name, definition] of columns) {
    const [existingColumns] = await promisePool.query(
      `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blood_requests' AND COLUMN_NAME = ?`,
      [name],
    );

    if (existingColumns[0].count === 0) {
      await promisePool.query(`ALTER TABLE blood_requests ADD COLUMN ${name} ${definition}`);
    }
  }
};

promisePool.testConnection = testConnection;
promisePool.ensureProfileColumns = ensureProfileColumns;
promisePool.ensureDonorDetailsTable = ensureDonorDetailsTable;
promisePool.ensureDonationRecordsTable = ensureDonationRecordsTable;
promisePool.ensureDonationCampsTable = ensureDonationCampsTable;
promisePool.ensureBloodRequestsTable = ensureBloodRequestsTable;

module.exports = promisePool;
