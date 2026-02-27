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
      enum: ["waiting", "serving", "completed"],
      default: "waiting"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Queue", queueSchema);
