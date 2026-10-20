const express = require("express");
const { createRequest, getMatchingRequests, acceptRequest } = require("../controllers/requestcontroller");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

router.post("/", authenticate, createRequest);
router.get("/matching", authenticate, getMatchingRequests);
router.post("/:requestId/accept", authenticate, acceptRequest);

module.exports = router;
