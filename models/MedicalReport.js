const mongoose = require("mongoose");

const medicalReportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },
    queue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Queue",
      required: true
    },
    diagnosis: {
      type: String,
      required: true
    },
    prescription: [
      {
        medicineName: String,
        dosage: String,      // "1 tablet"
        frequency: String,   // "3 times a day"
        duration: String     // "7 days"
      }
    ],
    symptoms: {
      type: String,
      default: ""
    },
    tests: [
      {
        testName: String,    // "Blood Test"
        result: String,      // "Normal"
        notes: String
      }
    ],
    bloodPressure: {
      type: String,
      default: ""
    },
    temperature: {
      type: String,
      default: ""
    },
    weight: {
      type: String,
      default: ""
    },
    nextAppointment: {
      type: Date,
      default: null
    },
    doctorNotes: {
      type: String,
      default: ""
    },
    followUp: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalReport", medicalReportSchema);