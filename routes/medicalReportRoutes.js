const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const {
  createReport,
  getMyReports,
  getSingleReport,
  getPatientReports,
  updateReport
} = require("../controllers/medicalReportController");

router.post("/create", protect, adminOnly, createReport);              // Admin — report banao
router.get("/my-reports", protect, getMyReports);                      // Patient — apni reports
router.get("/:reportId", protect, getSingleReport);                    // Single report
router.get("/patient/:patientId", protect, adminOnly, getPatientReports); // Admin — patient ki reports
router.put("/:reportId/update", protect, adminOnly, updateReport);     // Admin — update

module.exports = router;