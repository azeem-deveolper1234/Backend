const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const { joinQueue, cancelQueue, callNextPatient, getQueueStatus, completeQueue, getPatientHistory } = require("../controllers/queueController");

router.post("/join", protect, joinQueue);
router.post("/cancel", protect, cancelQueue);        // 👈 naya
router.post("/call-next", protect, adminOnly, callNextPatient);
router.post("/complete", protect, adminOnly, completeQueue);
router.get("/status", protect, getQueueStatus);
router.get("/history", protect, getPatientHistory);

module.exports = router;