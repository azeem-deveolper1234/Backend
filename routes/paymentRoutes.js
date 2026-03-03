const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const {
  createPayment,
  completeFinalPayment,
  cancelPayment,
  getPaymentHistory,
  getAllPayments
} = require("../controllers/paymentController");

router.post("/create", protect, createPayment);                    // Patient — advance pay
router.put("/:paymentId/complete", protect, adminOnly, completeFinalPayment); // Admin — final payment
router.put("/:paymentId/cancel", protect, cancelPayment);          // Patient — cancel
router.get("/history", protect, getPaymentHistory);                // Patient — history
router.get("/all", protect, adminOnly, getAllPayments);             // Admin — sab payments

module.exports = router;