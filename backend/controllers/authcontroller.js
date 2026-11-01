const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 1. User Registration
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  const allowedRoles = ["donor", "camp_organizer", "medical_staff"];

  if (!name?.trim() || !email?.trim() || !password || !allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Please provide valid registration details and account type." });
  }

  try {
    // Email එක කලින් අරන් තිබේදැයි බලන්න
    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already registered!" });
    }

    // Password එක Encrypt කිරීම
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name.trim(), email.trim(), hashedPassword, role],
    );

    res.status(201).json({
      message: "User registered successfully!",
      userId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 2. User Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // User ඉන්නවාදැයි පරීක්ෂා කිරීම
    const [users] = await db.query(
      `SELECT users.*, donor_details.blood_group AS donor_blood_group,
              donor_details.phone AS donor_phone, donor_details.nic,
              donor_details.age, donor_details.date_of_birth,
              donor_details.health_questionnaire, donor_details.gender, donor_details.city,
              donor_details.last_donated_date, donor_details.is_eligible,
              donor_details.id AS donor_details_id
       FROM users
       LEFT JOIN donor_details ON donor_details.user_id = users.id
       WHERE users.email = ?`,
      [
      email,
      ],
    );
    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid Email or Password!" });
    }

    const user = users[0];

    // Password නිවැරදිදැයි පරීක්ෂා කිරීම
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Email or Password!" });
    }

    // JWT Token එක නිර්මාණය කිරීම
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "1d" },
    );

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        bloodGroup: user.blood_group || "",
        location: user.location || "",
        profilePicture: user.profile_picture || "",
        donorDetails: user.donor_details_id ? {
          bloodGroup: user.donor_blood_group,
          phone: user.donor_phone,
          nic: user.nic,
          age: user.age,
          dateOfBirth: user.date_of_birth || "",
          healthQuestionnaire: user.health_questionnaire || "",
          gender: user.gender,
          city: user.city,
          lastDonatedDate: user.last_donated_date || "",
          isEligible: Boolean(user.is_eligible),
        } : null,
        donorDetailsComplete: Boolean(
          user.donor_details_id && user.health_questionnaire?.trim(),
        ),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateDonorDetails = async (req, res) => {
  const {
    bloodGroup, phone, nic, age, dateOfBirth, healthQuestionnaire, gender, city, lastDonatedDate,
  } = req.body;
  const numericAge = Number(age);

  if (!bloodGroup || !phone?.trim() || !nic?.trim() || !gender || !city?.trim()
    || !dateOfBirth || !healthQuestionnaire?.trim()
    || !Number.isInteger(numericAge) || numericAge < 18 || numericAge > 100) {
    return res.status(400).json({ message: "Health questionnaire, date of birth, and valid donor details are required." });
  }

  try {
    await db.query(
      `INSERT INTO donor_details
        (user_id, blood_group, phone, nic, age, date_of_birth, health_questionnaire,
         gender, city, last_donated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        blood_group = VALUES(blood_group), phone = VALUES(phone), nic = VALUES(nic),
        age = VALUES(age), date_of_birth = VALUES(date_of_birth),
        health_questionnaire = VALUES(health_questionnaire),
        gender = VALUES(gender), city = VALUES(city),
        last_donated_date = VALUES(last_donated_date)`,
      [
        req.user.id,
        bloodGroup,
        phone.trim(),
        nic.trim(),
        numericAge,
        dateOfBirth || null,
        healthQuestionnaire?.trim() || null,
        gender,
        city.trim(),
        lastDonatedDate || null,
      ],
    );

    return res.status(200).json({
      message: "Donor details updated successfully.",
      donorDetails: {
        bloodGroup, phone: phone.trim(), nic: nic.trim(), age: numericAge,
        dateOfBirth: dateOfBirth || "", healthQuestionnaire: healthQuestionnaire?.trim() || "",
        gender, city: city.trim(), lastDonatedDate: lastDonatedDate || "",
        isEligible: true,
      },
      donorDetailsComplete: true,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to save donor details.", error: error.message });
  }
};

exports.checkEligibility = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT MAX(donated_date) AS last_donated_date
       FROM donation_records
       WHERE donor_id = ?`,
      [req.user.id],
    );

    const lastDonatedDate = rows[0]?.last_donated_date || null;
    if (!lastDonatedDate) {
      await db.query(
        "UPDATE donor_details SET is_eligible = TRUE WHERE user_id = ?",
        [req.user.id],
      );

      return res.status(200).json({
        isEligible: true,
        lastDonatedDate: "",
        nextEligibleDate: "",
        message: "You can donate blood.",
      });
    }

    const nextEligibleDate = lastDonatedDate
      ? new Date(new Date(lastDonatedDate).setMonth(new Date(lastDonatedDate).getMonth() + 3))
      : null;
    const eligibility = !nextEligibleDate || nextEligibleDate <= new Date();
    await db.query(
      "UPDATE donor_details SET is_eligible = ?, next_eligible_date = ? WHERE user_id = ?",
      [eligibility, nextEligibleDate?.toISOString().slice(0, 10) || null, req.user.id],
    );

    return res.status(200).json({
      isEligible: eligibility,
      lastDonatedDate,
      nextEligibleDate: nextEligibleDate?.toISOString().slice(0, 10) || "",
      message: eligibility
        ? "You can donate blood."
        : "You are not eligible to donate yet.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to check eligibility.", error: error.message });
  }
};

exports.markDonation = async (req, res) => {
  const {
    requestId, donatedDate, unitsDonated, hospitalName, status = "completed",
  } = req.body;
  const units = Number(unitsDonated);

  if (!donatedDate || !hospitalName?.trim() || !Number.isFinite(units) || units <= 0 || units > 5) {
    return res.status(400).json({ message: "Please provide a valid donation date, hospital, and units between 0 and 5." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO donation_records
        (donor_id, request_id, donated_date, units_donated, hospital_name, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        requestId || null,
        donatedDate,
        units,
        hospitalName.trim(),
        status,
      ],
    );
    await connection.query(
      `UPDATE donor_details
       SET last_donated_date = ?, is_eligible = FALSE
       WHERE user_id = ?`,
      [donatedDate, req.user.id],
    );
    await connection.commit();

    return res.status(201).json({
      message: "Donation recorded successfully.",
      donation: {
        donatedDate,
        unitsDonated: units,
        hospitalName: hospitalName.trim(),
        status,
      },
      isEligible: false,
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: "Unable to record donation.", error: error.message });
  } finally {
    connection.release();
  }
};

exports.getDonations = async (req, res) => {
  try {
    const [donations] = await db.query(
      `SELECT id, donor_id, request_id, donated_date, units_donated,
              hospital_name, status, created_at, updated_at
       FROM donation_records
       WHERE donor_id = ?
       ORDER BY donated_date DESC, id DESC`,
      [req.user.id],
    );

    return res.status(200).json({ donations });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load donation history.",
      error: error.message,
    });
  }
};

exports.getLatestDonation = async (req, res) => {
  try {
    const [donations] = await db.query(
      `SELECT DATE_FORMAT(assessments.assessment_date, '%Y-%m-%d') AS donated_date,
              DATE_FORMAT(donor_details.next_eligible_date, '%Y-%m-%d') AS next_eligible_date,
              assessments.eligibility AS assessment_eligibility
       FROM medical_assessments assessments
       LEFT JOIN donor_details ON donor_details.user_id = assessments.donor_id
       WHERE assessments.donor_id = ?
         AND assessments.eligibility <> 'review'
         AND assessments.id = (
           SELECT latest.id
           FROM medical_assessments latest
           WHERE latest.donor_id = assessments.donor_id
             AND latest.eligibility <> 'review'
           ORDER BY latest.created_at DESC, latest.id DESC
           LIMIT 1
         )`,
      [req.user.id],
    );

    return res.status(200).json({
      lastDonatedDate: donations[0]?.donated_date || "",
      nextEligibleDate: donations[0]?.next_eligible_date || "",
      assessmentEligibility: donations[0]?.assessment_eligibility || "",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load the last donation date.",
      error: error.message,
    });
  }
};

exports.getDonationCamps = async (req, res) => {
  try {
    const [camps] = await db.query(
      `SELECT id, title AS name, organizer, location,
              CONCAT(location, ', ', city) AS address,
              city, camp_date, start_time, end_time,
              contact_number, description, slot_duration_minutes, slot_capacity
       FROM donation_camps
       WHERE camp_date >= CURDATE()
         AND COALESCE(approval_status, 'approved') = 'approved'
       ORDER BY camp_date ASC, start_time ASC, id ASC`,
    );

    return res.status(200).json({ camps });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load donation camps.",
      error: error.message,
    });
  }
};

exports.bookCampAppointment = async (req, res) => {
  const { campId } = req.params;
  const { appointmentTime, phone, notes } = req.body;

  if (!Number.isInteger(Number(campId)) || !appointmentTime || !phone?.trim()) {
    return res.status(400).json({ message: "Appointment time and phone number are required." });
  }

  try {
    const [camps] = await db.query(
      `SELECT id, camp_date, start_time, end_time, slot_duration_minutes, slot_capacity
       FROM donation_camps
       WHERE id = ? AND camp_date >= CURDATE()
         AND COALESCE(approval_status, 'approved') = 'approved'`,
      [campId],
    );
    if (!camps.length) {
      return res.status(404).json({ message: "Donation camp not found or has already ended." });
    }

    const camp = camps[0];
    const startTime = String(camp.start_time).slice(0, 5);
    const endTime = String(camp.end_time).slice(0, 5);
    if (appointmentTime < startTime || appointmentTime >= endTime) {
      return res.status(400).json({ message: "Please choose a time within the camp hours." });
    }
    const slotDuration = Number(camp.slot_duration_minutes || 60);
    const [hours, minutes] = appointmentTime.split(":").map(Number);
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const selectedMinutes = hours * 60 + minutes;
    const campStartMinutes = startHours * 60 + startMinutes;
    if ((selectedMinutes - campStartMinutes) % slotDuration !== 0) {
      return res.status(400).json({ message: "Please choose one of the available appointment slots." });
    }
    const [slotUsage] = await db.query(
      `SELECT COUNT(*) AS booked
       FROM camp_appointments
       WHERE camp_id = ? AND appointment_time = ? AND status <> 'cancelled'`,
      [campId, appointmentTime],
    );
    if (Number(slotUsage[0]?.booked || 0) >= Number(camp.slot_capacity || 10)) {
      return res.status(409).json({ message: "That appointment slot is full. Please choose another slot." });
    }

    await db.query(
      `INSERT INTO camp_appointments (camp_id, donor_id, appointment_time, phone, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [campId, req.user.id, appointmentTime, phone.trim(), notes?.trim() || null],
    );

    return res.status(201).json({ message: "Appointment booked successfully." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "You already have an appointment for this camp." });
    }
    return res.status(500).json({ message: "Unable to book appointment.", error: error.message });
  }
};

exports.getMyCampAppointments = async (req, res) => {
  try {
    const [appointments] = await db.query(
      `SELECT appointments.id, appointments.appointment_time, appointments.phone,
              appointments.notes, appointments.status, appointments.created_at,
              camps.title AS camp_title, camps.organizer, camps.location, camps.city,
              camps.camp_date, camps.start_time, camps.end_time
       FROM camp_appointments AS appointments
       INNER JOIN donation_camps AS camps ON camps.id = appointments.camp_id
       WHERE appointments.donor_id = ?
       ORDER BY camps.camp_date ASC, appointments.appointment_time ASC, appointments.id DESC`,
      [req.user.id],
    );

    return res.status(200).json({ appointments });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load your appointments.",
      error: error.message,
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const [notifications] = await db.query(
      `SELECT id, title, message, is_read, created_at
       FROM notifications
       WHERE recipient_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 30`,
      [req.user.id],
    );
    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load notifications.", error: error.message });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    await db.query(
      "UPDATE notifications SET is_read = TRUE WHERE recipient_id = ?",
      [req.user.id],
    );
    return res.status(200).json({ message: "Notifications marked as read." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update notifications.", error: error.message });
  }
};

exports.createAdminNotification = async (req, res) => {
  const { title, message, role } = req.body;
  const allowedRecipientRoles = ["donor", "camp_organizer", "medical_staff", "admin"];
  if (!title?.trim() || !message?.trim() || !allowedRecipientRoles.includes(role)) {
    return res.status(400).json({ message: "Choose a valid recipient role and provide a title and message." });
  }

  try {
    const [recipients] = await db.query(
      "SELECT id FROM users WHERE role = ?",
      [role],
    );
    if (!recipients.length) {
      return res.status(404).json({ message: `No ${role.replace("_", " ")} accounts are available.` });
    }
    const values = recipients.map((recipient) => [
      recipient.id, title.trim(), message.trim(),
    ]);
    await db.query(
      "INSERT INTO notifications (recipient_id, title, message) VALUES ?",
      [values],
    );
    return res.status(201).json({
      message: `Notification sent to ${recipients.length} ${role.replace("_", " ")} account${recipients.length === 1 ? "" : "s"}.`,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to send notification.", error: error.message });
  }
};

exports.updateBloodInventory = async (req, res) => {
  const { availableUnits } = req.body;
  const units = Number(availableUnits);
  const allowedGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const lowStockThreshold = 5;

  if (!allowedGroups.includes(req.params.bloodGroup)
    || !Number.isInteger(units) || units < 0) {
    return res.status(400).json({ message: "Provide a valid blood group and non-negative bag count." });
  }

  try {
    const [currentRows] = await db.query(
      "SELECT available_units FROM blood_inventory WHERE blood_group = ?",
      [req.params.bloodGroup],
    );
    if (!currentRows.length) {
      return res.status(404).json({ message: "Blood group inventory was not found." });
    }

    const previousUnits = Number(currentRows[0].available_units);
    await db.query(
      "UPDATE blood_inventory SET available_units = ? WHERE blood_group = ?",
      [units, req.params.bloodGroup],
    );

    if (previousUnits > lowStockThreshold && units <= lowStockThreshold) {
      const [donors] = await db.query(
        `SELECT users.id
         FROM users
         INNER JOIN donor_details ON donor_details.user_id = users.id
         WHERE users.role = 'donor' AND donor_details.blood_group = ?`,
        [req.params.bloodGroup],
      );
      if (donors.length) {
        await db.query(
          "INSERT INTO notifications (recipient_id, title, message) VALUES ?",
          [donors.map((donor) => [
            donor.id,
            `${req.params.bloodGroup} blood shortage`,
            `The ${req.params.bloodGroup} blood stock is low (${units} bags). Please consider donating if you are eligible.`,
          ])],
        );
      }
    }

    return res.status(200).json({
      message: "Blood inventory updated successfully.",
      notifiedDonors: previousUnits > lowStockThreshold && units <= lowStockThreshold,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update blood inventory.", error: error.message });
  }
};

exports.updateCampAppointment = async (req, res) => {
  const { appointmentTime, phone, notes } = req.body;

  if (!appointmentTime || !phone?.trim()) {
    return res.status(400).json({ message: "Appointment time and phone number are required." });
  }

  try {
    const [appointments] = await db.query(
      `SELECT appointments.id, camps.start_time, camps.end_time, camps.camp_date
       FROM camp_appointments AS appointments
       INNER JOIN donation_camps AS camps ON camps.id = appointments.camp_id
       WHERE appointments.id = ? AND appointments.donor_id = ?`,
      [req.params.appointmentId, req.user.id],
    );
    if (!appointments.length) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const appointment = appointments[0];
    const startTime = String(appointment.start_time).slice(0, 5);
    const endTime = String(appointment.end_time).slice(0, 5);
    if (appointment.camp_date < new Date().toISOString().slice(0, 10)
      || appointmentTime < startTime || appointmentTime > endTime) {
      return res.status(400).json({ message: "Please choose a time within the upcoming camp hours." });
    }

    await db.query(
      `UPDATE camp_appointments
       SET appointment_time = ?, phone = ?, notes = ?, status = status
       WHERE id = ? AND donor_id = ?`,
      [appointmentTime, phone.trim(), notes?.trim() || null, req.params.appointmentId, req.user.id],
    );
    return res.status(200).json({ message: "Booking updated successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update booking.", error: error.message });
  }
};

exports.deleteCampAppointment = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM camp_appointments WHERE id = ? AND donor_id = ?",
      [req.params.appointmentId, req.user.id],
    );
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Booking not found." });
    }
    return res.status(200).json({ message: "Booking deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete booking.", error: error.message });
  }
};

exports.reviewCampAppointment = async (req, res) => {
  const { status } = req.body;
  if (!["confirmed", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Choose approve or reject." });
  }

  try {
    const [appointments] = await db.query(
      `SELECT appointments.donor_id, camps.title AS camp_title
       FROM camp_appointments AS appointments
       INNER JOIN donation_camps AS camps ON camps.id = appointments.camp_id
       WHERE appointments.id = ?`,
      [req.params.appointmentId],
    );
    if (!appointments.length) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    const appointment = appointments[0];
    await db.query(
      "UPDATE camp_appointments SET status = ? WHERE id = ?",
      [status, req.params.appointmentId],
    );
    await db.query(
      `INSERT INTO notifications (recipient_id, title, message)
       VALUES (?, ?, ?)`,
      [
        appointment.donor_id,
        status === "confirmed" ? "Appointment approved" : "Appointment rejected",
        status === "confirmed"
          ? `Your appointment for ${appointment.camp_title} has been approved.`
          : `Your appointment for ${appointment.camp_title} has been rejected.`,
      ],
    );
    return res.status(200).json({ message: "Appointment status updated." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update appointment status.", error: error.message });
  }
};

exports.getDonorActivity = async (req, res) => {
  try {
    const [donations] = await db.query(
      `SELECT donated_date AS activity_date, hospital_name
       FROM donation_records
       WHERE donor_id = ?
       ORDER BY donated_date DESC, id DESC
       LIMIT 5`,
      [req.user.id],
    );
    const [acceptedRequests] = await db.query(
      `SELECT accepted_at AS activity_date, hospital_name, blood_group
       FROM blood_requests
       WHERE accepted_by = ? AND accepted_at IS NOT NULL
       ORDER BY accepted_at DESC
       LIMIT 5`,
      [req.user.id],
    );
    const activities = [
      ...donations.map((item) => ({
        type: "donation",
        title: "Donation completed",
        description: `Your donation at ${item.hospital_name} was recorded successfully.`,
        date: item.activity_date,
      })),
      ...acceptedRequests.map((item) => ({
        type: "request",
        title: "Blood request accepted",
        description: `You accepted a ${item.blood_group} blood request for ${item.hospital_name}.`,
        date: item.activity_date,
      })),
    ]
      .sort((first, second) => new Date(second.date) - new Date(first.date))
      .slice(0, 5);

    return res.status(200).json({ activities });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load recent activity.",
      error: error.message,
    });
  }
};

exports.getAdminSummary = async (req, res) => {
  try {
    const [[users], [donations], [requests], [camps], [appointments], [eligibleDonors], [inventory], [userList], [donorList], [eligibleDonorList], [requestList], [campList], [appointmentList], [recentDonations]] = await Promise.all([
      db.query("SELECT COUNT(*) AS total, SUM(role = 'donor') AS donors FROM users"),
      db.query("SELECT COUNT(*) AS total FROM donation_records"),
      db.query("SELECT SUM(LOWER(status) IN ('pending', 'open', 'active')) AS active, SUM(LOWER(status) IN ('accepted', 'approved', 'dispatched')) AS accepted FROM blood_requests"),
      db.query("SELECT COUNT(*) AS total FROM donation_camps WHERE camp_date >= CURDATE() AND COALESCE(approval_status, 'approved') = 'approved'"),
      db.query("SELECT COUNT(*) AS total FROM camp_appointments WHERE status != 'cancelled'"),
      db.query("SELECT COUNT(*) AS total FROM donor_details WHERE is_eligible = TRUE"),
      db.query(
        `SELECT id, blood_group, available_units, last_updated
         FROM blood_inventory
         ORDER BY FIELD(blood_group, 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`,
      ),
      db.query("SELECT id, name, email, role FROM users ORDER BY name ASC"),
      db.query(
        `SELECT users.id, users.name, users.email, donor_details.blood_group, donor_details.city
         FROM users INNER JOIN donor_details ON donor_details.user_id = users.id
         WHERE users.role = 'donor' ORDER BY users.name ASC`,
      ),
      db.query(
        `SELECT users.id, users.name, users.email, donor_details.blood_group, donor_details.city
         FROM users INNER JOIN donor_details ON donor_details.user_id = users.id
         WHERE users.role = 'donor' AND donor_details.is_eligible = TRUE
         ORDER BY users.name ASC`,
      ),
      db.query(
        `SELECT requests.id, requests.requester_id, requests.patient_name,
                requests.blood_group, requests.hospital_name, requests.city,
                requests.units_required, requests.urgency, requests.status,
                requests.required_date, requests.dispatched_at,
                inventory.available_units,
                (inventory.available_units >= requests.units_required) AS inventory_available,
                users.name AS requester_name,
                users.email AS requester_email
         FROM blood_requests AS requests
         LEFT JOIN users ON users.id = requests.requester_id
         LEFT JOIN blood_inventory AS inventory
           ON inventory.blood_group = requests.blood_group
         WHERE LOWER(requests.status) IN ('pending', 'open', 'active')
         ORDER BY requests.required_date ASC, requests.created_at DESC`,
      ),
      db.query(
        `SELECT id, title, organizer, location, city, camp_date, start_time, end_time,
                approval_status, slot_duration_minutes, slot_capacity, collected_bags,
                'camp' AS record_type
         FROM donation_camps
         WHERE camp_date >= CURDATE()
         UNION ALL
         SELECT id, title, organizer, location, city, camp_date, start_time, end_time,
                status AS approval_status, slot_duration_minutes, slot_capacity,
                0 AS collected_bags, 'request' AS record_type
         FROM camp_requests
         WHERE status = 'pending'
         ORDER BY camp_date ASC, start_time ASC, id ASC`,
      ),
      db.query(
        `SELECT appointments.id, appointments.appointment_time, appointments.phone,
                appointments.notes, appointments.status, appointments.created_at,
                camps.title AS camp_title, camps.camp_date, camps.location,
                users.name AS donor_name, users.email AS donor_email
         FROM camp_appointments AS appointments
         INNER JOIN donation_camps AS camps ON camps.id = appointments.camp_id
         INNER JOIN users ON users.id = appointments.donor_id
         ORDER BY camps.camp_date ASC, appointments.appointment_time ASC, appointments.id DESC`,
      ),
      db.query(
        `SELECT donations.id, donations.donated_date, donations.units_donated,
                donations.hospital_name, donations.status, users.name AS donor_name
         FROM donation_records AS donations
         INNER JOIN users ON users.id = donations.donor_id
         ORDER BY donations.donated_date DESC, donations.id DESC
         LIMIT 8`,
      ),
    ]);

    return res.status(200).json({
      stats: {
        users: Number(users[0]?.total || 0),
        donors: Number(users[0]?.donors || 0),
        donations: Number(donations[0]?.total || 0),
        activeRequests: Number(requests[0]?.active || 0),
        acceptedRequests: Number(requests[0]?.accepted || 0),
        upcomingCamps: Number(camps[0]?.total || 0),
        appointments: Number(appointments[0]?.total || 0),
        eligibleDonors: Number(eligibleDonors[0]?.total || 0),
      },
      users: userList,
      donors: donorList,
      eligibleDonors: eligibleDonorList,
      inventory,
      activeRequests: requestList,
      upcomingCamps: campList,
      appointments: appointmentList,
      recentDonations,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load admin dashboard data.",
      error: error.message,
    });
  }
};

exports.createDonationCamp = async (req, res) => {
  const {
    title, organizer, location, city, campDate, startTime, endTime,
    contactNumber, description,
  } = req.body;

  const slotDurationMinutes = Number(req.body.slotDurationMinutes || 60);
  const slotCapacity = Number(req.body.slotCapacity || 10);
  if (
    !title?.trim() || !organizer?.trim() || !location?.trim() || !city?.trim()
    || !campDate || !startTime || !endTime || !contactNumber?.trim()
    || !Number.isInteger(slotDurationMinutes) || slotDurationMinutes < 15
    || !Number.isInteger(slotCapacity) || slotCapacity < 1
  ) {
    return res.status(400).json({ message: "Please complete camp details and provide valid slot settings." });
  }

  try {
    if (req.user.role !== "admin") {
      const [result] = await db.query(
        `INSERT INTO camp_requests
          (created_by, title, organizer, location, city, camp_date, start_time,
           end_time, contact_number, description, slot_duration_minutes, slot_capacity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id, title.trim(), organizer.trim(), location.trim(), city.trim(),
          campDate, startTime, endTime, contactNumber.trim(), description?.trim() || null,
          slotDurationMinutes, slotCapacity,
        ],
      );
      return res.status(201).json({
        message: "Camp request submitted for admin approval.",
        requestId: result.insertId,
      });
    }

    const [result] = await db.query(
      `INSERT INTO donation_camps
        (created_by, title, organizer, location, city, camp_date, start_time,
         end_time, contact_number, description, approval_status,
         slot_duration_minutes, slot_capacity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, title.trim(), organizer.trim(), location.trim(), city.trim(),
        campDate, startTime, endTime, contactNumber.trim(), description?.trim() || null,
        "approved",
        slotDurationMinutes, slotCapacity,
      ],
    );

    return res.status(201).json({
      message: req.user.role === "admin"
        ? "Donation camp added successfully."
        : "Camp request submitted for admin approval.",
      campId: result.insertId,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to add donation camp.", error: error.message });
  }
};

exports.getCampOrganizerSummary = async (req, res) => {
  try {
    const [camps] = await db.query(
      `SELECT camps.id, camps.title, camps.organizer, camps.location, camps.city,
              DATE_FORMAT(camps.camp_date, '%Y-%m-%d') AS camp_date,
              camps.start_time, camps.end_time, camps.contact_number,
              camps.approval_status, camps.slot_duration_minutes, camps.slot_capacity,
              camps.collected_bags,
              COUNT(appointments.id) AS appointment_count,
              SUM(appointments.status = 'confirmed') AS confirmed_count,
              SUM(appointments.status = 'completed') AS completed_count
       FROM donation_camps camps
       LEFT JOIN camp_appointments appointments ON appointments.camp_id = camps.id
       WHERE camps.created_by = ?
          OR EXISTS (
            SELECT 1 FROM camp_requests requests
            WHERE requests.created_by = ?
              AND requests.title = camps.title
              AND requests.camp_date = camps.camp_date
              AND requests.location = camps.location
              AND requests.status = 'approved'
          )
       GROUP BY camps.id
       ORDER BY camps.camp_date ASC, camps.start_time ASC`,
      [req.user.id, req.user.id],
    );
    const [requests] = await db.query(
      `SELECT requests.id, requests.title, requests.organizer, requests.location,
              requests.city, DATE_FORMAT(requests.camp_date, '%Y-%m-%d') AS camp_date,
              requests.start_time, requests.end_time, requests.contact_number,
              requests.slot_duration_minutes, requests.slot_capacity,
              requests.status AS approval_status, 'request' AS record_type
       FROM camp_requests requests
       WHERE requests.created_by = ?
         AND requests.status = 'pending'
         AND NOT EXISTS (
           SELECT 1
           FROM donation_camps camps
           WHERE camps.created_by = requests.created_by
             AND camps.title = requests.title
             AND camps.camp_date = requests.camp_date
         )
       ORDER BY requests.camp_date ASC, requests.start_time ASC`,
      [req.user.id],
    );
    const [appointments] = await db.query(
      `SELECT appointments.id, appointments.camp_id, appointments.appointment_time,
              appointments.phone, appointments.notes, appointments.volunteer_name,
              appointments.status, users.name AS donor_name, users.email AS donor_email,
              camps.title AS camp_title, DATE_FORMAT(camps.camp_date, '%Y-%m-%d') AS camp_date
       FROM camp_appointments appointments
       INNER JOIN donation_camps camps ON camps.id = appointments.camp_id
       INNER JOIN users ON users.id = appointments.donor_id
       WHERE camps.created_by = ?
          OR EXISTS (
            SELECT 1 FROM camp_requests requests
            WHERE requests.created_by = ?
              AND requests.title = camps.title
              AND requests.camp_date = camps.camp_date
              AND requests.location = camps.location
              AND requests.status = 'approved'
          )
       ORDER BY camps.camp_date ASC, appointments.appointment_time ASC`,
      [req.user.id, req.user.id],
    );
    const [volunteers] = await db.query(
      `SELECT volunteers.id, volunteers.camp_id, volunteers.name,
              volunteers.phone, volunteers.role
       FROM camp_volunteers volunteers
       INNER JOIN donation_camps camps ON camps.id = volunteers.camp_id
       WHERE camps.created_by = ?
          OR EXISTS (
            SELECT 1 FROM camp_requests requests
            WHERE requests.created_by = ?
              AND requests.title = camps.title
              AND requests.camp_date = camps.camp_date
              AND requests.location = camps.location
              AND requests.status = 'approved'
          )
       ORDER BY volunteers.name ASC`,
      [req.user.id, req.user.id],
    );
    const [metrics] = await db.query(
      `SELECT COUNT(DISTINCT camps.id) AS total_camps,
              COUNT(appointments.id) AS total_bookings,
              SUM(appointments.status = 'confirmed') AS confirmed_bookings,
              SUM(appointments.status = 'completed') AS completed_bookings,
              COALESCE(SUM(camps.collected_bags), 0) AS total_collected_bags
       FROM donation_camps camps
       LEFT JOIN camp_appointments appointments ON appointments.camp_id = camps.id
       WHERE camps.created_by = ?
          OR EXISTS (
            SELECT 1 FROM camp_requests requests
            WHERE requests.created_by = ?
              AND requests.title = camps.title
              AND requests.camp_date = camps.camp_date
              AND requests.location = camps.location
              AND requests.status = 'approved'
          )`,
      [req.user.id, req.user.id],
    );
    return res.status(200).json({
      camps: [...camps, ...requests],
      appointments,
      volunteers,
      metrics: metrics[0] || {},
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load camp organizer dashboard.", error: error.message });
  }
};

exports.createOrganizerCamp = async (req, res) => {
  return exports.createDonationCamp(req, res);
};

exports.updateOrganizerAppointment = async (req, res) => {
  const { status, volunteerName } = req.body;
  if (status && !["pending", "confirmed", "cancelled", "completed"].includes(status)) {
    return res.status(400).json({ message: "Invalid appointment status." });
  }
  try {
    const [result] = await db.query(
      `UPDATE camp_appointments appointments
       INNER JOIN donation_camps camps ON camps.id = appointments.camp_id
       SET appointments.status = COALESCE(?, appointments.status),
           appointments.volunteer_name = ?
       WHERE appointments.id = ? AND camps.created_by = ?`,
      [status || null, volunteerName?.trim() || null, req.params.appointmentId, req.user.id],
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Appointment not found." });
    return res.status(200).json({ message: "Appointment updated successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update appointment.", error: error.message });
  }
};

exports.addCampVolunteer = async (req, res) => {
  const { name, phone, role } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Volunteer name is required." });
  try {
    const [camp] = await db.query(
      "SELECT id FROM donation_camps WHERE id = ? AND created_by = ?",
      [req.params.campId, req.user.id],
    );
    if (!camp.length) return res.status(404).json({ message: "Camp not found." });
    await db.query(
      "INSERT INTO camp_volunteers (camp_id, name, phone, role) VALUES (?, ?, ?, ?)",
      [req.params.campId, name.trim(), phone?.trim() || null, role?.trim() || null],
    );
    return res.status(201).json({ message: "Volunteer added successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to add volunteer.", error: error.message });
  }
};

exports.updateCampMetrics = async (req, res) => {
  const collectedBags = Number(req.body.collectedBags);
  if (!Number.isInteger(collectedBags) || collectedBags < 0) {
    return res.status(400).json({ message: "Collected bags must be a non-negative whole number." });
  }
  try {
    const [result] = await db.query(
      "UPDATE donation_camps SET collected_bags = ? WHERE id = ? AND created_by = ?",
      [collectedBags, req.params.campId, req.user.id],
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Camp not found." });
    return res.status(200).json({ message: "Camp performance metrics updated." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update camp metrics.", error: error.message });
  }
};

exports.reviewOrganizerCamp = async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid camp approval status." });
  }
  try {
    const [result] = await db.query(
      "UPDATE donation_camps SET approval_status = ? WHERE id = ?",
      [status, req.params.campId],
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Camp not found." });
    return res.status(200).json({ message: `Camp ${status} successfully.` });
  } catch (error) {
    return res.status(500).json({ message: "Unable to review camp.", error: error.message });
  }
};

exports.reviewCampRequest = async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid camp approval status." });
  }
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [requests] = await connection.query(
      "SELECT * FROM camp_requests WHERE id = ? AND status = 'pending'",
      [req.params.requestId],
    );
    if (!requests.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Camp request not found." });
    }
    const request = requests[0];
    if (status === "approved") {
      const [existingCamps] = await connection.query(
        `SELECT id
         FROM donation_camps
         WHERE title = ? AND camp_date = ? AND location = ?
         ORDER BY created_by IS NULL DESC, id ASC
         LIMIT 1`,
        [request.title, request.camp_date, request.location],
      );
      if (existingCamps.length) {
        await connection.query(
          `UPDATE donation_camps
           SET created_by = ?, organizer = ?, city = ?, start_time = ?, end_time = ?,
               contact_number = ?, description = ?, approval_status = 'approved',
               slot_duration_minutes = ?, slot_capacity = ?
           WHERE id = ?`,
          [
            request.created_by, request.organizer, request.city, request.start_time,
            request.end_time, request.contact_number, request.description,
            request.slot_duration_minutes, request.slot_capacity, existingCamps[0].id,
          ],
        );
      } else {
        await connection.query(
          `INSERT INTO donation_camps
            (created_by, title, organizer, location, city, camp_date, start_time,
             end_time, contact_number, description, approval_status,
             slot_duration_minutes, slot_capacity)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)`,
          [
            request.created_by, request.title, request.organizer, request.location,
            request.city, request.camp_date, request.start_time, request.end_time,
            request.contact_number, request.description, request.slot_duration_minutes,
            request.slot_capacity,
          ],
        );
      }
    }
    await connection.query(
      "UPDATE camp_requests SET status = ? WHERE id = ?",
      [status, request.id],
    );
    await connection.commit();
    return res.status(200).json({ message: `Camp request ${status}.` });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: "Unable to review camp request.", error: error.message });
  } finally {
    connection.release();
  }
};

exports.updateAdminUser = async (req, res) => {
  const { name, email, role } = req.body;
  if (!name?.trim() || !email?.trim() || !["donor", "admin", "camp_organizer", "medical_staff"].includes(role)) {
    return res.status(400).json({ message: "Name, email, and a valid role are required." });
  }
  if (Number(req.params.userId) === Number(req.user.id) && role !== "admin") {
    return res.status(400).json({ message: "You cannot remove your own admin role." });
  }
  try {
    await db.query(
      "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?",
      [name.trim(), email.trim(), role, req.params.userId],
    );
    return res.status(200).json({ message: "User updated successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update user.", error: error.message });
  }
};

exports.deleteAdminUser = async (req, res) => {
  if (Number(req.params.userId) === Number(req.user.id)) {
    return res.status(400).json({ message: "You cannot delete your own admin account." });
  }
  try {
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [req.params.userId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found." });
    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete user.", error: error.message });
  }
};

exports.getMedicalSummary = async (req, res) => {
  try {
    const [donors] = await db.query(
      `SELECT users.id, users.name, users.email, donor_details.blood_group, donor_details.city,
              donor_details.nic, donor_details.age, donor_details.date_of_birth,
              donor_details.health_questionnaire, donor_details.phone,
              donor_details.gender, donor_details.is_eligible,
              donor_details.next_eligible_date,
              COALESCE(
                donor_details.last_donated_date,
                (SELECT MAX(donated_date) FROM donation_records WHERE donor_id = users.id)
              ) AS last_donation_date
       FROM users LEFT JOIN donor_details ON donor_details.user_id = users.id
       WHERE users.role = 'donor' ORDER BY users.name ASC`,
    );
    const [assessments] = await db.query(
      `SELECT assessments.id, assessments.donor_id, assessments.staff_id,
              DATE_FORMAT(assessments.assessment_date, '%Y-%m-%d') AS assessment_date,
              assessments.pre_screening, assessments.hemoglobin, assessments.weight,
              assessments.blood_bag_barcode, assessments.eligibility, assessments.notes,
              assessments.created_at, assessments.updated_at,
              donors.name AS donor_name, donors.email AS donor_email,
              donor_details.blood_group, donor_details.next_eligible_date,
              donations.volume_ml, donations.created_at AS donation_created_at,
              inventory.available_units
       FROM medical_assessments assessments
       INNER JOIN users donors ON donors.id = assessments.donor_id
       INNER JOIN users staff ON staff.id = assessments.staff_id
       LEFT JOIN donor_details ON donor_details.user_id = assessments.donor_id
       LEFT JOIN donation_records donations
         ON donations.donor_id = assessments.donor_id
        AND donations.donated_date = assessments.assessment_date
        AND donations.blood_bag_barcode = assessments.blood_bag_barcode
       LEFT JOIN blood_inventory inventory
         ON inventory.blood_group = donor_details.blood_group
       ORDER BY assessments.created_at DESC LIMIT 25`,
    );
    return res.status(200).json({ donors, assessments });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load medical staff data.", error: error.message });
  }
};

exports.deleteMedicalAssessment = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [[assessment]] = await connection.query(
      `SELECT assessments.id, assessments.donor_id, assessments.assessment_date,
              assessments.blood_bag_barcode, assessments.eligibility,
              donor_details.blood_group
       FROM medical_assessments assessments
       INNER JOIN donor_details ON donor_details.user_id = assessments.donor_id
       WHERE assessments.id = ?
       FOR UPDATE`,
      [req.params.assessmentId],
    );
    if (!assessment) {
      await connection.rollback();
      return res.status(404).json({ message: "Assessment not found." });
    }

    if (assessment.eligibility === "eligible") {
      await connection.query(
        `UPDATE blood_inventory
         SET available_units = GREATEST(available_units - 1, 0)
         WHERE blood_group = ?`,
        [assessment.blood_group],
      );
    }
    await connection.query(
      `DELETE FROM donation_records
       WHERE donor_id = ? AND donated_date = ? AND blood_bag_barcode = ?
       LIMIT 1`,
      [assessment.donor_id, assessment.assessment_date, assessment.blood_bag_barcode],
    );
    await connection.query(
      "DELETE FROM medical_assessments WHERE id = ?",
      [assessment.id],
    );

    const [[latest]] = await connection.query(
      `SELECT MAX(donated_date) AS last_donated_date
       FROM donation_records WHERE donor_id = ?`,
      [assessment.donor_id],
    );
    const lastDate = latest.last_donated_date;
    const nextDate = lastDate
      ? new Date(new Date(lastDate).setMonth(new Date(lastDate).getMonth() + 3))
        .toISOString().slice(0, 10)
      : null;
    await connection.query(
      `UPDATE donor_details
       SET last_donated_date = ?, next_eligible_date = ?, is_eligible = ?
       WHERE user_id = ?`,
      [lastDate, nextDate, !lastDate || new Date(nextDate) <= new Date(), assessment.donor_id],
    );
    await connection.commit();
    return res.status(200).json({ message: "Assessment deleted and stock restored." });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: "Unable to delete assessment.", error: error.message });
  } finally {
    connection.release();
  }
};

exports.createMedicalAssessment = async (req, res) => {
  const {
    donorId, assessmentDate, preScreening, hemoglobin, weight,
    bloodBagBarcode, eligibility, notes,
  } = req.body;
  const validEligibility = ["eligible", "ineligible", "review"].includes(eligibility);
  if (!Number.isInteger(Number(donorId)) || !assessmentDate || !preScreening?.trim()
    || !validEligibility || !bloodBagBarcode?.trim()
    || (hemoglobin !== "" && hemoglobin != null && !Number.isFinite(Number(hemoglobin)))
    || (weight !== "" && weight != null && !Number.isFinite(Number(weight)))) {
    return res.status(400).json({ message: "Please provide valid screening and donation details." });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(assessmentDate)) {
    return res.status(400).json({ message: "Invalid assessment date." });
  }
  const donationDate = assessmentDate;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [donor] = await connection.query(
      "SELECT id FROM users WHERE id = ? AND role = 'donor'",
      [donorId],
    );
    if (!donor.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Donor not found." });
    }
    const [result] = await connection.query(
      `INSERT INTO medical_assessments
       (donor_id, staff_id, assessment_date, pre_screening, hemoglobin, weight,
        blood_bag_barcode, eligibility, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        donorId, req.user.id, donationDate, preScreening.trim(),
        hemoglobin === "" ? null : hemoglobin, weight === "" ? null : weight,
        bloodBagBarcode?.trim() || null, eligibility, notes?.trim() || null,
      ],
    );
    let nextEligibleDate = null;
    if (eligibility !== "review") {
      await connection.query(
        `INSERT INTO donation_records
         (donor_id, donated_date, units_donated, blood_bag_barcode, volume_ml,
          hospital_name, status)
         VALUES (?, ?, 1, ?, 450, 'BloodCare donation camp', 'completed')`,
        [donorId, donationDate, bloodBagBarcode.trim()],
      );
      nextEligibleDate = new Date(
        new Date(`${donationDate}T00:00:00`).setMonth(
          new Date(`${donationDate}T00:00:00`).getMonth() + 3,
        ),
      ).toISOString().slice(0, 10);
      await connection.query(
        "UPDATE donor_details SET last_donated_date = ?, next_eligible_date = ?, is_eligible = FALSE WHERE user_id = ?",
        [donationDate, nextEligibleDate, donorId],
      );
    }
    if (eligibility === "eligible") {
      await connection.query(
        `UPDATE blood_inventory inventory
         INNER JOIN donor_details details ON details.blood_group = inventory.blood_group
         SET inventory.available_units = inventory.available_units + 1
         WHERE details.user_id = ?`,
        [donorId],
      );
    }
    if (eligibility !== "review") {
      await connection.query(
        `UPDATE camp_appointments
         SET status = 'completed'
         WHERE donor_id = ? AND status IN ('pending', 'confirmed')
         ORDER BY camp_id DESC, id DESC
         LIMIT 1`,
        [donorId],
      );
    }
    await connection.commit();
    return res.status(201).json({
      message: "Medical assessment and donation record saved.",
      assessmentId: result.insertId,
      donationDate,
      nextEligibleDate: nextEligibleDate || "",
      inventoryAdded: eligibility === "eligible",
      pendingReview: eligibility === "review",
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: "Unable to save medical assessment.", error: error.message });
  } finally {
    connection.release();
  }
};

exports.updateProfile = async (req, res) => {
  const { name, email, phone, bloodGroup, location, profilePicture } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ message: "Name and email are required." });
  }

  if (profilePicture && !/^data:image\/(jpeg|png|webp|gif);base64,/.test(profilePicture)) {
    return res.status(400).json({ message: "Profile picture must be a supported image." });
  }

  if (profilePicture && profilePicture.length > 2.5 * 1024 * 1024) {
    return res.status(413).json({ message: "Profile picture must be smaller than 2 MB." });
  }

  try {
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id <> ?",
      [email.trim(), req.user.id],
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already registered!" });
    }

    await db.query(
      `UPDATE users
       SET name = ?, email = ?, phone = ?, blood_group = ?, location = ?, profile_picture = ?
       WHERE id = ?`,
      [
        name.trim(),
        email.trim(),
        phone?.trim() || null,
        bloodGroup || null,
        location?.trim() || null,
        profilePicture || null,
        req.user.id,
      ],
    );

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: req.user.id,
        name: name.trim(),
        email: email.trim(),
        role: req.user.role,
        phone: phone?.trim() || "",
        bloodGroup: bloodGroup || "",
        location: location?.trim() || "",
        profilePicture: profilePicture || "",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update profile.", error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: "Current password and a new password of at least 8 characters are required." });
  }

  try {
    const [users] = await db.query("SELECT password FROM users WHERE id = ?", [req.user.id]);
    if (users.length === 0 || !(await bcrypt.compare(currentPassword, users[0].password))) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.user.id]);
    return res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to change password.", error: error.message });
  }
};
