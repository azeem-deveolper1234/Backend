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
    consultationFee: {
      type: Number,
      default: 1000  // 👈 default fee Rs. 1000
    },
    degree: {
      type: String,
      default: "M.B.B.S."
    },
    experience: {
      type: Number,
      default: 5
    },
    specializedFrom: {
      type: String,
      default: "City Medical University"
    },
    about: {
      type: String,
      default: "Experienced clinical specialist."
    },
    isActive: {
      type: Boolean,
      default: true
    },
    consecutiveNormals: {
      type: Number,
      default: 0
    },
    consecutiveEmergencies: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);