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
      enum: ["cash", "card", "online"],
      default: "cash"
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

module.exports = mongoose.model("Payment", paymentSchema);