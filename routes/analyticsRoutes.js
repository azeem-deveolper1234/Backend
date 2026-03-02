const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const { getTodayAnalytics, getOverallAnalytics } = require("../controllers/analyticsController");

router.get("/today", protect, adminOnly, getTodayAnalytics);
router.get("/overall", protect, adminOnly, getOverallAnalytics);

module.exports = router;
