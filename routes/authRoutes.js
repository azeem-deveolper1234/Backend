const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { doctorOrAdmin } = require("../middleware/adminMiddleware");
const User = require("../models/User");

router.post("/register", registerUser);
router.post("/login", loginUser);

// Admin / Doctor — sare users dekho
router.get("/users", protect, doctorOrAdmin, async (req, res) => {
  try {
    if (req.user.role === "doctor") {
      const Doctor = require("../models/Doctor");
      const Queue = require("../models/Queue");
      
      const actor = await User.findById(req.user.id);
      if (!actor) {
        return res.status(404).json({ message: "User not found" });
      }

      let doctorProfile = null;
      if (actor.doctorId) {
        doctorProfile = await Doctor.findById(actor.doctorId);
      }
      if (!doctorProfile) {
        doctorProfile = await Doctor.findOne({ email: actor.email });
      }

      if (!doctorProfile) {
        return res.json([]);
      }

      const escapedName = doctorProfile.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const queues = await Queue.find({
        serviceName: { $regex: new RegExp(`^${escapedName}$`, "i") }
      });
      const patientIds = [...new Set(queues.map((q) => String(q.user)).filter(Boolean))];

      if (patientIds.length === 0) {
        return res.json([]);
      }

      const users = await User.find({
        _id: { $in: patientIds },
        role: { $in: ["user"] }
      }).select("-password");
      return res.json(users);
    }

    // Superadmin: return all patients
    const users = await User.find({ role: "user" }).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;