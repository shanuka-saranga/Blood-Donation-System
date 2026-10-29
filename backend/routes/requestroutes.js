const express = require("express");
const {
  createRequest,
  getMyRequests,
  updateMyRequest,
  deleteMyRequest,
  getMatchingRequests,
  acceptRequest,
  reviewRequest,
} = require("../controllers/requestcontroller");

const authenticate = require("../middleware/authenticate");
const authorizeAdmin = require("../middleware/authorizeAdmin");

const router = express.Router();

// 1. Specific Static Routes (උඩින්ම තියෙන්න ඕන)
router.post("/", authenticate, createRequest);
router.get("/mine", authenticate, getMyRequests);
router.get("/matching", authenticate, getMatchingRequests); // <-- meka udata gaththa

// 2. Dynamic Routes with Params (:requestId)
router.put("/:requestId", authenticate, updateMyRequest);
router.delete("/:requestId", authenticate, deleteMyRequest);
router.post("/:requestId/accept", authenticate, acceptRequest);

// 3. Admin Routes
router.patch(
  "/:requestId/:action",
  authenticate,
  authorizeAdmin,
  reviewRequest,
);

module.exports = router;
