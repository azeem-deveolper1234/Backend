const MedicalReport = require("../models/MedicalReport");
const Queue = require("../models/Queue");

// Report banao — Admin/Doctor only
exports.createReport = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      queueId,
      diagnosis,
      prescription,
      symptoms,
      tests,
      bloodPressure,
      temperature,
      weight,
      nextAppointment,
      doctorNotes,
      followUp
    } = req.body;

    const report = await MedicalReport.create({
      patient: patientId,
      doctor: doctorId,
      queue: queueId,
      diagnosis,
      prescription,
      symptoms,
      tests,
      bloodPressure,
      temperature,
      weight,
      nextAppointment,
      doctorNotes,
      followUp
    });

    res.status(201).json({
      message: "Medical report created successfully",
      report
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Patient ki apni reports dekho
exports.getMyReports = async (req, res) => {
  try {
    const userId = req.user.id;

    const reports = await MedicalReport.find({ patient: userId })
      .populate("doctor", "name specialization")
      .populate("queue", "serviceName tokenNumber")
      .sort({ createdAt: -1 });

    res.json({
      totalReports: reports.length,
      reports
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Single report dekho
exports.getSingleReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await MedicalReport.findById(reportId)
      .populate("doctor", "name specialization phone")
      .populate("patient", "name email")
      .populate("queue", "serviceName tokenNumber appointmentDate");

    if (!report) {
      return res.status(404).json({ message: "Report nahi mili" });
    }

    res.json(report);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin — kisi bhi patient ki reports dekho
exports.getPatientReports = async (req, res) => {
  try {
    const { patientId } = req.params;

    const reports = await MedicalReport.find({ patient: patientId })
      .populate("doctor", "name specialization")
      .populate("queue", "serviceName tokenNumber appointmentDate")
      .sort({ createdAt: -1 });

    res.json({
      totalReports: reports.length,
      reports
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Report update karo
exports.updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await MedicalReport.findByIdAndUpdate(
      reportId,
      req.body,
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Report nahi mili" });
    }

    res.json({
      message: "Report updated successfully",
      report
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};