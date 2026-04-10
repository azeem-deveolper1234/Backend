const Payment = require("../models/Payment");
const Queue = require("../models/Queue");
const Doctor = require("../models/Doctor");

/** Sirf yeh teen DB / purani enum ke liye safe hain — kabhi easypaisa/jazzcash yahan na bhejo */
function safePaymentMethodForDb(rawMethod, explicitWallet) {
  const m = String(rawMethod || "cash").toLowerCase().trim();
  const w = explicitWallet
    ? String(explicitWallet).toLowerCase().trim()
    : null;
  if (m === "easypaisa" || m === "jazzcash") {
    return { paymentMethod: "online", walletChannel: m };
  }
  if (w === "easypaisa" || w === "jazzcash") {
    return { paymentMethod: "online", walletChannel: w };
  }
  if (m === "cash" || m === "card" || m === "online") {
    return { paymentMethod: m, walletChannel: null };
  }
  return { paymentMethod: "online", walletChannel: null };
}

// Advance payment karo
exports.createPayment = async (req, res) => {
  try {

    console.log("Payment request received:", req.body); // 👈 add karo
    
    const { queueId, doctorId, totalAmount, paymentMethod, walletChannel } =
      req.body;
    const userId = req.user.id;
    let { paymentMethod: methodToSave, walletChannel: wc } =
      safePaymentMethodForDb(paymentMethod, walletChannel);
    if (!["cash", "card", "online"].includes(methodToSave)) {
      methodToSave = "online";
    }

    const numAmount = Number(totalAmount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: "Maqsad raqam (totalAmount) darust nahi hai" });
    }

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
    const advanceAmount = numAmount / 2;
    const remainingAmount = numAmount - advanceAmount;

    const payment = await Payment.create({
      user: userId,
      queue: queueId,
      doctor: doctorId,
      totalAmount: numAmount,
      advanceAmount,
      remainingAmount,
      advanceStatus: "paid",
      paymentMethod: methodToSave,
      ...(wc ? { walletChannel: wc } : {})
    });

    res.status(201).json({
      message: "Advance payment successful",
      payment: {
        totalAmount: numAmount,
        advanceAmount,
        remainingAmount,
        advanceStatus: payment.advanceStatus,
        paymentMethod: payment.paymentMethod,
        walletChannel: payment.walletChannel || null
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
    const { method } = req.body; 

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment nahi mili" });
    }

    if (payment.finalStatus === "paid") {
      return res.status(400).json({ message: "Payment pehle se complete hai" });
    }

    payment.finalStatus = "paid";
    payment.paymentMethod = method || payment.paymentMethod; 

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
      .reduce((sum, p) => {
         let rev = p.advanceAmount;
         if (p.finalStatus === "paid") rev += p.remainingAmount;
         return sum + rev;
      }, 0);

    res.json({
      totalPayments: payments.length,
      totalRevenue,
      payments
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};