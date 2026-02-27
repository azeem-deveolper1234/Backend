const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { joinQueue, callNextPatient, getQueueStatus } = require("../controllers/queueController");

router.post("/join", protect, joinQueue);
router.post("/call-next", protect, callNextPatient);
router.get("/status", protect, getQueueStatus);

module.exports = router;

