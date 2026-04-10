const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    queue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Queue",
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    advanceAmount: {
      type: Number,
      required: true
    },
    remainingAmount: {
      type: Number,
      required: true
    },
    advanceStatus: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending"
    },
    finalStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    },
    paymentMethod: {
      type: String,
      default: "cash"
    },
    // DB / purani enum sirf cash|card|online ho to bhi save ho sake; asal channel yahan
    walletChannel: {
      type: String,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    refundable: {
      type: Boolean,
      default: false  // cancel pe refund nahi hoga
    }
  },
  { timestamps: true }
);

if (mongoose.models.Payment) {
  delete mongoose.models.Payment;
}

module.exports = mongoose.model("Payment", paymentSchema);