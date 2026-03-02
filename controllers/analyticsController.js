const Queue = require("../models/Queue");

// Aaj ki analytics
exports.getTodayAnalytics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Aaj ke sare patients
    const totalPatients = await Queue.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Completed patients
    const completedPatients = await Queue.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
      status: "completed"
    });

    // Waiting patients
    const waitingPatients = await Queue.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
      status: "waiting"
    });

    // Emergency patients
    const emergencyPatients = await Queue.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
      priority: "emergency"
    });

    // Average wait time
    const avgWaitTime = waitingPatients * 10;

    res.json({
      date: today,
      totalPatients,
      completedPatients,
      waitingPatients,
      emergencyPatients,
      averageWaitTime: `${avgWaitTime} minutes`
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Overall analytics
exports.getOverallAnalytics = async (req, res) => {
  try {
    const totalPatients = await Queue.countDocuments();
    const completedPatients = await Queue.countDocuments({ status: "completed" });
    const emergencyPatients = await Queue.countDocuments({ priority: "emergency" });
    const normalPatients = await Queue.countDocuments({ priority: "normal" });

    // Sabse busy service
    const busyService = await Queue.aggregate([
      { $group: { _id: "$serviceName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    res.json({
      totalPatients,
      completedPatients,
      emergencyPatients,
      normalPatients,
      mostBusyService: busyService[0]?._id || "N/A",
      completionRate: `${Math.round((completedPatients / totalPatients) * 100)}%`
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};