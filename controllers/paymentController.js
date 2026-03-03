const Payment = require("../models/Payment");
const Queue = require("../models/Queue");
const Doctor = require("../models/Doctor");

// Advance payment karo
exports.createPayment = async (req, res) => {
  try {
    const { queueId, doctorId, totalAmount, paymentMethod } = req.body;
    const userId = req.user.id;

    // Queue check karo
    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({ message: "Queue nahi mili" });
    }

    // Doctor check karo
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor nahi mila" });
    }

    // Advance 50% hogi
    const advanceAmount = totalAmount / 2;
    const remainingAmount = totalAmount - advanceAmount;

    const payment = await Payment.create({
      user: userId,
      queue: queueId,
      doctor: doctorId,
      totalAmount,
      advanceAmount,
      remainingAmount,
      advanceStatus: "paid",
      paymentMethod: paymentMethod || "cash"
    });

    res.status(201).json({
      message: "Advance payment successful",
      payment: {
        totalAmount,
        advanceAmount,
        remainingAmount,
        advanceStatus: payment.advanceStatus,
        paymentMethod: payment.paymentMethod
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Final payment karo
exports.completeFinalPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment nahi mili" });
    }

    if (payment.finalStatus === "paid") {
      return res.status(400).json({ message: "Payment pehle se complete hai" });
    }

    payment.finalStatus = "paid";
    payment.remainingAmount = 0;
    await payment.save();

    res.json({
      message: "Final payment complete",
      totalPaid: payment.totalAmount,
      paymentStatus: "fully paid"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Payment cancel karo — advance zaya jayega
exports.cancelPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment nahi mili" });
    }

    if (payment.advanceStatus === "cancelled") {
      return res.status(400).json({ message: "Payment pehle se cancel hai" });
    }

    payment.advanceStatus = "cancelled";
    payment.refundable = false;
    payment.cancelledAt = new Date();
    await payment.save();

    res.json({
      message: "Payment cancelled — advance refund nahi hoga",
      lostAmount: payment.advanceAmount,
      cancelledAt: payment.cancelledAt
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Payment history dekho
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const payments = await Payment.find({ user: userId })
      .populate("doctor", "name specialization")
      .populate("queue", "serviceName tokenNumber status")
      .sort({ createdAt: -1 });

    res.json({
      totalPayments: payments.length,
      payments
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin — sari payments dekho
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "name email")
      .populate("doctor", "name specialization")
      .populate("queue", "serviceName tokenNumber status")
      .sort({ createdAt: -1 });

    const totalRevenue = payments
      .filter(p => p.advanceStatus === "paid")
      .reduce((sum, p) => sum + p.advanceAmount, 0);

    res.json({
      totalPayments: payments.length,
      totalRevenue,
      payments
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};