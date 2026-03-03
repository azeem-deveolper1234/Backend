const Queue = require("../models/Queue");

exports.joinQueue = async (req, res) => {
  try {
    const { serviceName, appointmentDate, priority, notes } = req.body;
    const userId = req.user.id;

    const existingQueue = await Queue.findOne({
      user: userId,
      status: { $in: ["waiting", "serving"] }
    });

    if (existingQueue) {
      return res.status(400).json({ message: "Already in queue" });
    }

    // Date validation — past date reject karo
    if (appointmentDate && new Date(appointmentDate) < new Date()) {
      return res.status(400).json({ message: "Past date nahi le sakte" });
    }

    // Aaj ka token reset
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lastToken = await Queue.findOne({
      serviceName,
      createdAt: { $gte: today, $lt: tomorrow }
    }).sort({ tokenNumber: -1 });

    const tokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    const queue = await Queue.create({
      user: userId,
      serviceName,
      tokenNumber,
      status: "waiting",
      priority: priority || "normal",
      appointmentDate: appointmentDate || Date.now(),
      notes: notes || ""
    });

    res.status(201).json({
      message: "Joined queue successfully",
      tokenNumber: queue.tokenNumber,
      serviceName: queue.serviceName,
      priority: queue.priority,
      appointmentDate: queue.appointmentDate
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelQueue = async (req, res) => {
  try {
    const userId = req.user.id;

    const queueEntry = await Queue.findOne({
      user: userId,
      status: { $in: ["waiting", "serving"] }
    });

    if (!queueEntry) {
      return res.status(404).json({ message: "Queue nahi mili" });
    }

    queueEntry.status = "cancelled";
    await queueEntry.save();

    const io = req.app.get("io");
    io.emit("queueCancelled", {
      message: "Queue cancelled",
      tokenNumber: queueEntry.tokenNumber,
      serviceName: queueEntry.serviceName
    });

    res.json({
      message: "Queue cancelled successfully",
      tokenNumber: queueEntry.tokenNumber
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.callNextPatient = async (req, res) => {
  try {
    const { serviceName } = req.body;

    const nextPatient = await Queue.findOne({
      serviceName,
      status: "waiting",
      priority: "emergency"
    }).sort({ tokenNumber: 1 });

    const patient = nextPatient || await Queue.findOne({
      serviceName,
      status: "waiting"
    }).sort({ tokenNumber: 1 });

    if (!patient) {
      return res.status(404).json({ message: "No patients waiting" });
    }

    patient.status = "serving";
    await patient.save();

    const io = req.app.get("io");
    io.emit("queueUpdated", {
      message: "Next patient called",
      tokenNumber: patient.tokenNumber,
      serviceName: patient.serviceName,
      priority: patient.priority
    });

    res.json({
      message: "Next patient called",
      tokenNumber: patient.tokenNumber,
      priority: patient.priority
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getQueueStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const userQueue = await Queue.findOne({
      user: userId,
      status: { $in: ["waiting", "serving"] }
    });
    if (!userQueue) {
      return res.status(404).json({ message: "Not in queue" });
    }
    const servingPatient = await Queue.findOne({
      serviceName: userQueue.serviceName,
      status: "serving"
    }).sort({ tokenNumber: 1 });
    const currentServing = servingPatient ? servingPatient.tokenNumber : 0;
    const peopleAhead = userQueue.tokenNumber - currentServing - 1;
    const estimatedTime = peopleAhead > 0 ? peopleAhead * 10 : 0;
    res.json({
      currentServing,
      yourToken: userQueue.tokenNumber,
      peopleAhead: peopleAhead > 0 ? peopleAhead : 0,
      estimatedTime,
      status: userQueue.status,
      priority: userQueue.priority,
      appointmentDate: userQueue.appointmentDate,
      notes: userQueue.notes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completeQueue = async (req, res) => {
  try {
    const { tokenNumber, serviceName } = req.body;

    const queueEntry = await Queue.findOne({
      tokenNumber,
      serviceName,
      status: "serving"
    });

    if (!queueEntry) {
      return res.status(404).json({ message: "No active serving found" });
    }

    queueEntry.status = "completed";
    await queueEntry.save();

    const io = req.app.get("io");
    io.emit("queueCompleted", {
      message: "Queue completed",
      tokenNumber: queueEntry.tokenNumber,
      serviceName: queueEntry.serviceName
    });

    res.json({
      message: "Queue completed successfully",
      tokenNumber: queueEntry.tokenNumber
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPatientHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await Queue.find({
      user: userId,
      status: "completed"
    }).sort({ createdAt: -1 });

    res.json({
      totalVisits: history.length,
      history
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
