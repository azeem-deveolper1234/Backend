const Doctor = require("../models/Doctor");
const Queue = require("../models/Queue");

// Doctor add karo (Admin only)
exports.addDoctor = async (req, res) => {
  try {
    const { name, specialization, email, phone, schedule, slotDuration, maxPatientsPerDay } = req.body;

    const doctorExists = await Doctor.findOne({ email });
    if (doctorExists) {
      return res.status(400).json({ message: "Doctor already exists" });
    }

    const doctor = await Doctor.create({
      name,
      specialization,
      email,
      phone,
      schedule,
      slotDuration: slotDuration || 15,
      maxPatientsPerDay: maxPatientsPerDay || 20
    });

    res.status(201).json({
      message: "Doctor added successfully",
      doctor
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sare doctors dekho
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Doctor ka schedule dekho
exports.getDoctorSchedule = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor nahi mila" });
    }

    // Aaj ke patients
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPatients = await Queue.countDocuments({
      serviceName: doctor.name,
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $in: ["waiting", "serving"] }
    });

    const availableSlots = doctor.maxPatientsPerDay - todayPatients;

    res.json({
      doctor: doctor.name,
      specialization: doctor.specialization,
      schedule: doctor.schedule,
      slotDuration: doctor.slotDuration,
      todayPatients,
      availableSlots,
      maxPatientsPerDay: doctor.maxPatientsPerDay
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Doctor update karo
exports.updateDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      req.body,
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor nahi mila" });
    }

    res.json({
      message: "Doctor updated successfully",
      doctor
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Doctor delete karo
exports.deleteDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { isActive: false },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor nahi mila" });
    }

    res.json({ message: "Doctor removed successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};