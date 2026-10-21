const express = require("express");
const router = express.Router();
const { register, login, updateProfile, updateDonorDetails, changePassword, checkEligibility, markDonation, getDonations, getLatestDonation, getDonationCamps, getDonorActivity, getAdminSummary, createDonationCamp } = require("../controllers/authcontroller");
const authenticate = require("../middleware/authenticate");
const authorizeAdmin = require("../middleware/authorizeAdmin");
const { updateAdminUser, deleteAdminUser } = require("../controllers/authcontroller");

router.post("/register", register);
router.post("/login", login);
router.put("/profile", authenticate, updateProfile);
router.put("/donor-details", authenticate, updateDonorDetails);
router.put("/change-password", authenticate, changePassword);
router.get("/eligibility", authenticate, checkEligibility);
router.post("/donations", authenticate, markDonation);
router.get("/donations", authenticate, getDonations);
router.get("/donations/latest", authenticate, getLatestDonation);
router.get("/camps", authenticate, getDonationCamps);
router.get("/activity", authenticate, getDonorActivity);
router.get("/admin-summary", authenticate, authorizeAdmin, getAdminSummary);
router.post("/admin/camps", authenticate, authorizeAdmin, createDonationCamp);
router.put("/admin/users/:userId", authenticate, authorizeAdmin, updateAdminUser);
router.delete("/admin/users/:userId", authenticate, authorizeAdmin, deleteAdminUser);

module.exports = router;
