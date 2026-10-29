const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 1. User Registration
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

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

    // User ව Save කිරීම (Default role is 'donor')
    const userRole = role === "admin" ? "admin" : "donor";
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, userRole],
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
              donor_details.age, donor_details.gender, donor_details.city,
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
          gender: user.gender,
          city: user.city,
          lastDonatedDate: user.last_donated_date || "",
          isEligible: Boolean(user.is_eligible),
        } : null,
        donorDetailsComplete: Boolean(user.donor_details_id),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateDonorDetails = async (req, res) => {
  const {
    bloodGroup, phone, nic, age, gender, city, lastDonatedDate,
  } = req.body;
  const numericAge = Number(age);

  if (!bloodGroup || !phone?.trim() || !nic?.trim() || !gender || !city?.trim()
    || !Number.isInteger(numericAge) || numericAge < 18 || numericAge > 100) {
    return res.status(400).json({ message: "Please provide valid donor details. Donors must be between 18 and 100 years old." });
  }

  try {
    await db.query(
      `INSERT INTO donor_details
        (user_id, blood_group, phone, nic, age, gender, city, last_donated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        blood_group = VALUES(blood_group), phone = VALUES(phone), nic = VALUES(nic),
        age = VALUES(age), gender = VALUES(gender), city = VALUES(city),
        last_donated_date = VALUES(last_donated_date)`,
      [
        req.user.id,
        bloodGroup,
        phone.trim(),
        nic.trim(),
        numericAge,
        gender,
        city.trim(),
        lastDonatedDate || null,
      ],
    );

    return res.status(200).json({
      message: "Donor details updated successfully.",
      donorDetails: {
        bloodGroup, phone: phone.trim(), nic: nic.trim(), age: numericAge,
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

    const [donorDetails] = await db.query(
      "SELECT user_id FROM donor_details WHERE user_id = ?",
      [req.user.id],
    );
    if (donorDetails.length === 0) {
      return res.status(404).json({ message: "Complete your donor details before checking eligibility." });
    }

    const lastDonatedDate = rows[0]?.last_donated_date || null;
    if (!lastDonatedDate) {
      await db.query(
        "UPDATE donor_details SET is_eligible = TRUE WHERE user_id = ?",
        [req.user.id],
      );

      return res.status(200).json({
        isEligible: true,
        lastDonatedDate: "",
        message: "You can donate blood.",
      });
    }

    const eligibility = new Date(lastDonatedDate) <= new Date(
      new Date().setMonth(new Date().getMonth() - 3),
    );
    await db.query("UPDATE donor_details SET is_eligible = ? WHERE user_id = ?", [eligibility, req.user.id]);

    return res.status(200).json({
      isEligible: eligibility,
      lastDonatedDate,
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
      `SELECT donated_date
       FROM donation_records
       WHERE donor_id = ?
       ORDER BY donated_date DESC, id DESC
       LIMIT 1`,
      [req.user.id],
    );

    return res.status(200).json({
      lastDonatedDate: donations[0]?.donated_date || "",
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
              contact_number, description
       FROM donation_camps
       WHERE camp_date >= CURDATE()
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
    const [[users], [donations], [requests], [camps], [eligibleDonors], [userList], [donorList], [eligibleDonorList], [requestList], [campList], [recentDonations]] = await Promise.all([
      db.query("SELECT COUNT(*) AS total, SUM(role = 'donor') AS donors FROM users"),
      db.query("SELECT COUNT(*) AS total FROM donation_records"),
      db.query("SELECT SUM(LOWER(status) IN ('pending', 'open', 'active')) AS active, SUM(LOWER(status) = 'accepted') AS accepted FROM blood_requests"),
      db.query("SELECT COUNT(*) AS total FROM donation_camps WHERE camp_date >= CURDATE()"),
      db.query("SELECT COUNT(*) AS total FROM donor_details WHERE is_eligible = TRUE"),
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
                requests.required_date, users.name AS requester_name,
                users.email AS requester_email
         FROM blood_requests AS requests
         LEFT JOIN users ON users.id = requests.requester_id
         WHERE LOWER(requests.status) IN ('pending', 'open', 'active')
         ORDER BY requests.required_date ASC, requests.created_at DESC`,
      ),
      db.query(
        `SELECT id, title, organizer, location, city, camp_date, start_time, end_time
         FROM donation_camps WHERE camp_date >= CURDATE()
         ORDER BY camp_date ASC, start_time ASC, id ASC`,
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
        eligibleDonors: Number(eligibleDonors[0]?.total || 0),
      },
      users: userList,
      donors: donorList,
      eligibleDonors: eligibleDonorList,
      activeRequests: requestList,
      upcomingCamps: campList,
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

  if (
    !title?.trim() || !organizer?.trim() || !location?.trim() || !city?.trim()
    || !campDate || !startTime || !endTime || !contactNumber?.trim()
  ) {
    return res.status(400).json({ message: "Please complete all donation camp details." });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO donation_camps
        (created_by, title, organizer, location, city, camp_date, start_time,
         end_time, contact_number, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, title.trim(), organizer.trim(), location.trim(), city.trim(),
        campDate, startTime, endTime, contactNumber.trim(), description?.trim() || null,
      ],
    );

    return res.status(201).json({ message: "Donation camp added successfully.", campId: result.insertId });
  } catch (error) {
    return res.status(500).json({ message: "Unable to add donation camp.", error: error.message });
  }
};

exports.updateAdminUser = async (req, res) => {
  const { name, email, role } = req.body;
  if (!name?.trim() || !email?.trim() || !["donor", "admin"].includes(role)) {
    return res.status(400).json({ message: "Name, email, and a valid role are required." });
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
