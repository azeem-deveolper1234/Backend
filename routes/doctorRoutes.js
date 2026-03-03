const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const { addDoctor, getAllDoctors, getDoctorSchedule, updateDoctor, deleteDoctor } = require("../controllers/doctorController");

router.post("/add", protect, adminOnly, addDoctor);           // Admin — doctor add
router.get("/all", protect, getAllDoctors);                    // Sab doctors dekho
router.get("/:doctorId/schedule", protect, getDoctorSchedule); // Doctor ka schedule
router.put("/:doctorId/update", protect, adminOnly, updateDoctor); // Admin — update
router.delete("/:doctorId/delete", protect, adminOnly, deleteDoctor); // Admin — delete

module.exports = router;