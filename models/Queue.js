const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    serviceName: {
      type: String,
      required: true
    },
    tokenNumber: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["waiting", "serving", "completed", "cancelled"],
      default: "waiting"
    },
    priority: {
      type: String,
      enum: ["normal", "emergency"],
      default: "normal"
    },
    appointmentDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    estimatedTime: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Queue", queueSchema);
