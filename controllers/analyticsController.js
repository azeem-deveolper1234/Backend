const Queue = require("../models/Queue");
const User = require("../models/User");
const Doctor = require("../models/Doctor");

// Aaj ki analytics
exports.getTodayAnalytics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const user = await User.findById(req.user.id);
    let filter = {
      appointmentDate: { $gte: today, $lt: tomorrow }
    };

    if (user && user.role === "doctor" && user.doctorId) {
      const doctorDoc = await Doctor.findById(user.doctorId);
      if (doctorDoc) {
        filter.serviceName = doctorDoc.name;
      }
    }

    // 1. Aaj ka poora data fetch karo (User details ke sath)
    const allQueueToday = await Queue.find(filter).populate('user', 'name email').sort({ tokenNumber: 1 });

    // 2. Data array se counts nikaalo
    const totalPatients = allQueueToday.length;
    const completedPatients = allQueueToday.filter(q => q.status === "completed").length;
    const waitingPatients = allQueueToday.filter(q => q.status === "waiting").length;
    const emergencyPatients = allQueueToday.filter(q => q.priority === "emergency").length;

    const avgWaitTime = waitingPatients * 10;

    res.json({
      date: today,
      totalPatients,
      completedPatients,
      waitingPatients,
      emergencyPatients,
      allQueueToday, // Frontend table ke liye
      averageWaitTime: `${avgWaitTime} minutes`
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Overall analytics
exports.getOverallAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let filter = {};

    if (user && user.role === "doctor" && user.doctorId) {
      const doctorDoc = await Doctor.findById(user.doctorId);
      if (doctorDoc) {
        filter.serviceName = doctorDoc.name;
      }
    }

    // 1. Database se saare patients (Ever) ka data nikaalo
    const allQueueHistory = await Queue.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const totalPatients = allQueueHistory.length;
    const completedPatients = allQueueHistory.filter(q => q.status === "completed").length;
    const emergencyPatients = allQueueHistory.filter(q => q.priority === "emergency").length;
    const normalPatients = allQueueHistory.filter(q => q.priority === "normal").length;

    // Sabse busy service logic
    let busyServiceFilter = {};
    if (user && user.role === "doctor" && user.doctorId) {
      const doctorDoc = await Doctor.findById(user.doctorId);
      if (doctorDoc) {
        busyServiceFilter.serviceName = doctorDoc.name;
      }
    }

    const busyService = await Queue.aggregate([
      { $match: busyServiceFilter },
      { $group: { _id: "$serviceName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    res.json({
      totalPatients,
      completedPatients,
      emergencyPatients,
      normalPatients,
      allQueueHistory, // Frontend "Total Patient Ever" card ke liye
      mostBusyService: busyService[0]?._id || "N/A",
      completionRate: totalPatients > 0 ? `${Math.round((completedPatients / totalPatients) * 100)}%` : "0%"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};