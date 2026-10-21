const express = require("express");
const { createRequest, getMatchingRequests, acceptRequest } = require("../controllers/requestcontroller");
const authenticate = require("../middleware/authenticate");
const authorizeAdmin = require("../middleware/authorizeAdmin");
const { reviewRequest } = require("../controllers/requestcontroller");

const router = express.Router();

router.post("/", authenticate, createRequest);
router.get("/matching", authenticate, getMatchingRequests);
router.post("/:requestId/accept", authenticate, acceptRequest);
router.patch("/:requestId/:action", authenticate, authorizeAdmin, reviewRequest);

module.exports = router;
