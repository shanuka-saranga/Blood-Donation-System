const express = require("express");
const router = express.Router();
const { register, login, updateProfile } = require("../controllers/authcontroller");
const authenticate = require("../middleware/authenticate");

router.post("/register", register);
router.post("/login", login);
router.put("/profile", authenticate, updateProfile);

module.exports = router;
