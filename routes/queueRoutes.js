const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const { joinQueue, cancelQueue, callNextPatient, getQueueStatus, completeQueue, getPatientHistory, clearOldData } = require("../controllers/queueController");

router.post("/join", protect, joinQueue);
router.post("/cancel", protect, cancelQueue);        // 👈 naya
router.post("/call-next", protect, adminOnly, callNextPatient);
router.post("/complete", protect, adminOnly, completeQueue);
router.get("/status", protect, getQueueStatus);
router.get("/history", protect, getPatientHistory);
router.post("/clear-old", protect, adminOnly, clearOldData);

router.get("/patient/:userId", protect, adminOnly, async (req, res) => {
  try {
    const Queue = require("../models/Queue");
    const queue = await Queue.findOne({
      user: req.params.userId,
      status: { $in: ["waiting", "serving"] }
    });
    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;