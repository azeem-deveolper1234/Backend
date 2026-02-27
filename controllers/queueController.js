const Queue = require("../models/Queue");

exports.joinQueue = async (req, res) => {
  try {
    const { serviceName } = req.body;
    const userId = req.user.id;

    const existingQueue = await Queue.findOne({
      user: userId,
      status: { $in: ["waiting", "serving"] }
    });

    if (existingQueue) {
      return res.status(400).json({ message: "Already in queue" });
    }

    const lastToken = await Queue.findOne({ serviceName })
      .sort({ tokenNumber: -1 });

    const tokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    const queue = await Queue.create({
      user: userId,
      serviceName,
      tokenNumber,
      status: "waiting"
    });

    res.status(201).json({
      message: "Joined queue successfully",
      tokenNumber: queue.tokenNumber,
      serviceName: queue.serviceName
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
      status: "waiting"
    }).sort({ tokenNumber: 1 });

    if (!nextPatient) {
      return res.status(404).json({ message: "No patients waiting" });
    }

    nextPatient.status = "serving";
    await nextPatient.save();

    res.json({
      message: "Next patient called",
      tokenNumber: nextPatient.tokenNumber
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
      status: userQueue.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

