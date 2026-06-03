const Doctor = require("../models/Doctor");
const Queue = require("../models/Queue");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Doctor add karo (Admin only)
exports.addDoctor = async (req, res) => {
  try {
    const { name, specialization, email, phone, schedule, slotDuration, maxPatientsPerDay, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required to create doctor login credentials." });
    }

    const doctorExists = await Doctor.findOne({ email });
    const userExists = await User.findOne({ email });
    if (doctorExists || userExists) {
      return res.status(400).json({ message: "A doctor or user account with this email already exists" });
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const doctorUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "doctor",
      phone,
      doctorId: doctor._id
    });

    res.status(201).json({
      message: "Doctor and login account created successfully",
      doctor,
      doctorUser: {
        id: doctorUser._id,
        name: doctorUser.name,
        email: doctorUser.email,
        role: doctorUser.role
      }
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
      return res.status(404).json({ message: "Doctor not found" });
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
      return res.status(404).json({ message: "Doctor not found" });
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
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Associated login user's role ko demote karo to "user" and remove doctorId link
    await User.findOneAndUpdate(
      { doctorId: doctor._id },
      { role: "user", doctorId: null }
    );

    res.json({ message: "Doctor removed successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};