const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { adminOnly, doctorOrAdmin } = require("../middleware/adminMiddleware");
const {
  joinQueue,
  cancelQueue,
  callNextPatient,
  getQueueStatus,
  completeQueue,
  getPatientHistory,
  clearOldData,
  getPatientClinicHistory
} = require("../controllers/queueController");

router.post("/join", protect, joinQueue);
router.post("/cancel", protect, cancelQueue);        // 👈 naya
router.post("/call-next", protect, doctorOrAdmin, callNextPatient);
router.post("/complete", protect, doctorOrAdmin, completeQueue);
router.get("/status", protect, getQueueStatus);
router.get("/history", protect, getPatientHistory);
router.post("/clear-old", protect, adminOnly, clearOldData);

router.get("/patient/:userId/clinic-history", protect, doctorOrAdmin, getPatientClinicHistory);

router.get("/patient/:userId", protect, doctorOrAdmin, async (req, res) => {
  try {
    const Queue = require("../models/Queue");
    const User = require("../models/User");
    const Doctor = require("../models/Doctor");

    let query = { user: req.params.userId };

    // If logged-in user is a doctor, filter by their service name
    if (req.user.role === "doctor") {
      const actor = await User.findById(req.user.id);
      if (actor) {
        let doctorProfile = null;
        if (actor.doctorId) {
          doctorProfile = await Doctor.findById(actor.doctorId);
        }
        if (!doctorProfile) {
          doctorProfile = await Doctor.findOne({ email: actor.email });
        }
        if (doctorProfile) {
          query.serviceName = doctorProfile.name;
        }
      }
    }

    // Try finding active queue first (waiting/serving)
    let queue = await Queue.findOne({
      ...query,
      status: { $in: ["waiting", "serving"] }
    });

    // Fallback to most recent queue entry of any status
    if (!queue) {
      queue = await Queue.findOne(query).sort({ createdAt: -1 });
    }

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;