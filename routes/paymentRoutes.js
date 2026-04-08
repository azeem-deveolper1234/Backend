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
router.get("/queue/:queueId", protect, adminOnly, async (req, res) => {
  try {
    const Payment = require("../models/Payment");
    const payment = await Payment.findOne({ queue: req.params.queueId })
      .populate("user", "name email phone")
      .populate("doctor", "name specialization");
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;