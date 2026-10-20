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
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
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
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
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
