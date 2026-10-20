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
