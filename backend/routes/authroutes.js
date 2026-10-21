const express = require("express");
const router = express.Router();
const { register, login, updateProfile, updateDonorDetails, changePassword, checkEligibility, markDonation, getDonations } = require("../controllers/authcontroller");
const authenticate = require("../middleware/authenticate");

router.post("/register", register);
router.post("/login", login);
router.put("/profile", authenticate, updateProfile);
router.put("/donor-details", authenticate, updateDonorDetails);
router.put("/change-password", authenticate, changePassword);
router.get("/eligibility", authenticate, checkEligibility);
router.post("/donations", authenticate, markDonation);
router.get("/donations", authenticate, getDonations);

module.exports = router;
