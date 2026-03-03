const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    specialization: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phone: {
      type: String,
      required: true
    },
    schedule: [
      {
        day: {
          type: String,
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        },
        startTime: {
          type: String
        },
        endTime: {
          type: String
        },
        isAvailable: {
          type: Boolean,
          default: true
        }
      }
    ],
    slotDuration: {
      type: Number,
      default: 15
    },
    maxPatientsPerDay: {
      type: Number,
      default: 20
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);