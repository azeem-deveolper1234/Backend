const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { doctorOrAdmin } = require("../middleware/adminMiddleware");
const { getTodayAnalytics, getOverallAnalytics } = require("../controllers/analyticsController");

router.get("/today", protect, doctorOrAdmin, getTodayAnalytics);
router.get("/overall", protect, doctorOrAdmin, getOverallAnalytics);

module.exports = router;
