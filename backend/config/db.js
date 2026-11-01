const mysql = require("mysql2");
require("dotenv").config();

/*
// Cloud (Aiven) Database Pool Configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 25534),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false, // Aiven SSL Connection සඳහා අනිවාර්යයි
  },
});
*/

//local db configuration

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "blood_donation_db",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
});

const db = pool.promise();

const testConnection = async () => {
  const connection = await db.getConnection();

  try {
    const [rows] = await connection.query(
      "SELECT DATABASE() AS current_db, @@hostname AS host",
    );
    console.log("Connected to Database:", rows[0].current_db);
    console.log("Connected Host:", rows[0].host);
  } finally {
    connection.release();
  }
};

const ensureUserRoles = async () => {
  await db.query(
    "ALTER TABLE users MODIFY COLUMN role ENUM('admin','donor','camp_organizer','medical_staff') NOT NULL DEFAULT 'donor'",
  );
};

const ensureAppointmentTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS camp_appointments (
      id INT NOT NULL AUTO_INCREMENT,
      camp_id INT NOT NULL,
      donor_id INT NOT NULL,
      appointment_time TIME NOT NULL,
      phone VARCHAR(30) NOT NULL,
      notes TEXT NULL,
      status ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY unique_donor_camp (camp_id, donor_id),
      KEY appointment_camp (camp_id),
      KEY appointment_donor (donor_id),
      CONSTRAINT fk_appointment_camp FOREIGN KEY (camp_id) REFERENCES donation_camps(id) ON DELETE CASCADE,
      CONSTRAINT fk_appointment_donor FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [columns] = await db.query("SHOW COLUMNS FROM camp_appointments");
  const idColumn = columns.find((column) => column.Field === "id");
  const [indexes] = await db.query("SHOW INDEX FROM camp_appointments");
  const hasPrimaryKey = indexes.some((index) => index.Key_name === "PRIMARY");

  if (!idColumn?.Extra?.includes("auto_increment") || !hasPrimaryKey) {
    await db.query(
      "ALTER TABLE camp_appointments ADD COLUMN appointment_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST",
    );
    await db.query("ALTER TABLE camp_appointments DROP COLUMN id");
    await db.query(
      "ALTER TABLE camp_appointments CHANGE appointment_id id INT NOT NULL AUTO_INCREMENT",
    );
  }
};

const ensureNotificationTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT NOT NULL AUTO_INCREMENT,
      recipient_id INT NOT NULL,
      title VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY notification_recipient (recipient_id),
      CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_id)
        REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const ensureBloodRequestTable = async () => {
  const [columns] = await db.query("SHOW COLUMNS FROM blood_requests");
  const statusColumn = columns.find((column) => column.Field === "status");
  if (statusColumn && !String(statusColumn.Type).startsWith("varchar")) {
    await db.query(
      "ALTER TABLE blood_requests MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'pending'",
    );
  }
  if (!columns.some((column) => column.Field === "approved_by")) {
    await db.query(
      "ALTER TABLE blood_requests ADD COLUMN approved_by INT NULL AFTER accepted_at",
    );
  }
  if (!columns.some((column) => column.Field === "dispatched_at")) {
    await db.query(
      "ALTER TABLE blood_requests ADD COLUMN dispatched_at TIMESTAMP NULL AFTER approved_by",
    );
  }
  await db.query(
    "UPDATE blood_requests SET status = 'pending' WHERE TRIM(status) = '' OR status IS NULL",
  );
};

const ensureDonorScreeningFields = async () => {
  const [columns] = await db.query("SHOW COLUMNS FROM donor_details");
  if (!columns.some((column) => column.Field === "date_of_birth")) {
    await db.query(
      "ALTER TABLE donor_details ADD COLUMN date_of_birth DATE NULL AFTER age",
    );
  }
  if (!columns.some((column) => column.Field === "health_questionnaire")) {
    await db.query(
      "ALTER TABLE donor_details ADD COLUMN health_questionnaire TEXT NULL AFTER date_of_birth",
    );
  }
  if (!columns.some((column) => column.Field === "next_eligible_date")) {
    await db.query(
      "ALTER TABLE donor_details ADD COLUMN next_eligible_date DATE NULL AFTER last_donated_date",
    );
  }
};

const ensureDonationFields = async () => {
  const [columns] = await db.query("SHOW COLUMNS FROM donation_records");
  if (!columns.some((column) => column.Field === "blood_bag_barcode")) {
    await db.query(
      "ALTER TABLE donation_records ADD COLUMN blood_bag_barcode VARCHAR(100) NULL AFTER units_donated",
    );
  }
  if (!columns.some((column) => column.Field === "volume_ml")) {
    await db.query(
      "ALTER TABLE donation_records ADD COLUMN volume_ml INT NULL AFTER blood_bag_barcode",
    );
  }
};

const ensureAppointmentStatus = async () => {
  await db.query(
    "ALTER TABLE camp_appointments MODIFY COLUMN status ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending'",
  );
};

const ensureVolunteerAssignment = async () => {
  const [columns] = await db.query("SHOW COLUMNS FROM camp_appointments");
  if (!columns.some((column) => column.Field === "volunteer_name")) {
    await db.query(
      "ALTER TABLE camp_appointments ADD COLUMN volunteer_name VARCHAR(150) NULL AFTER notes",
    );
  }
};

const ensureCampOrganizerFields = async () => {
  const [campColumns] = await db.query("SHOW COLUMNS FROM donation_camps");
  if (!campColumns.some((column) => column.Field === "approval_status")) {
    await db.query(
      "ALTER TABLE donation_camps ADD COLUMN approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' AFTER description",
    );
    await db.query(
      "UPDATE donation_camps SET approval_status = 'approved'",
    );
  }
  if (!campColumns.some((column) => column.Field === "slot_duration_minutes")) {
    await db.query(
      "ALTER TABLE donation_camps ADD COLUMN slot_duration_minutes INT NOT NULL DEFAULT 60 AFTER end_time",
    );
  }
  if (!campColumns.some((column) => column.Field === "slot_capacity")) {
    await db.query(
      "ALTER TABLE donation_camps ADD COLUMN slot_capacity INT NOT NULL DEFAULT 10 AFTER slot_duration_minutes",
    );
  }
  if (!campColumns.some((column) => column.Field === "collected_bags")) {
    await db.query(
      "ALTER TABLE donation_camps ADD COLUMN collected_bags INT NOT NULL DEFAULT 0 AFTER slot_capacity",
    );
  }
  await db.query(`
    CREATE TABLE IF NOT EXISTS camp_requests (
      id INT NOT NULL AUTO_INCREMENT,
      created_by INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      organizer VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL,
      camp_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      contact_number VARCHAR(15) NOT NULL,
      description TEXT NULL,
      slot_duration_minutes INT NOT NULL DEFAULT 60,
      slot_capacity INT NOT NULL DEFAULT 10,
      status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY camp_request_creator (created_by),
      CONSTRAINT fk_camp_request_creator FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await db.query(
    "ALTER TABLE camp_requests MODIFY COLUMN status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending'",
  );
  await db.query(`
    CREATE TABLE IF NOT EXISTS camp_volunteers (
      id INT NOT NULL AUTO_INCREMENT,
      camp_id INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      phone VARCHAR(30) NULL,
      role VARCHAR(100) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY volunteer_camp (camp_id),
      CONSTRAINT fk_volunteer_camp FOREIGN KEY (camp_id)
        REFERENCES donation_camps(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

db.testConnection = testConnection;
db.ensureUserRoles = ensureUserRoles;
db.ensureAppointmentTable = ensureAppointmentTable;
db.ensureNotificationTable = ensureNotificationTable;
db.ensureBloodRequestTable = ensureBloodRequestTable;
db.ensureDonorScreeningFields = ensureDonorScreeningFields;
db.ensureDonationFields = ensureDonationFields;
db.ensureAppointmentStatus = ensureAppointmentStatus;
db.ensureVolunteerAssignment = ensureVolunteerAssignment;
db.ensureCampOrganizerFields = ensureCampOrganizerFields;

module.exports = db;
