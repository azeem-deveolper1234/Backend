const Queue = require("../models/Queue");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Payment = require("../models/Payment");
const MedicalReport = require("../models/MedicalReport");
const { sendAppointmentSMS, sendTurnSMS, sendCancellationSMS, sendApproachingSMS } = require("../services/smsService");

/** HTML date (YYYY-MM-DD) ko server ke local calendar day se map karo — sirf `new Date("YYYY-MM-DD")` UTC midnight se "aaj" galat reject hota tha */
function localMidnightFromAppointmentInput(appointmentDate) {
  if (appointmentDate == null || appointmentDate === "") return null;
  const s = String(appointmentDate).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, mo, d] = s.split("-").map((x) => parseInt(x, 10));
    return new Date(y, mo - 1, d, 0, 0, 0, 0);
  }
  const dt = new Date(appointmentDate);
  if (Number.isNaN(dt.getTime())) return dt;
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function startOfTodayLocal() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

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

    let targetDate;
    if (appointmentDate) {
      const apptDay = localMidnightFromAppointmentInput(appointmentDate);
      if (Number.isNaN(apptDay.getTime())) {
        return res.status(400).json({ message: "The specified appointment date is invalid" });
      }
      const today = startOfTodayLocal();
      if (apptDay < today) {
        return res.status(400).json({ message: "Appointment cannot be booked for a past date" });
      }
      targetDate = apptDay;
    } else {
      targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);
    }
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const lastToken = await Queue.findOne({
      serviceName,
      appointmentDate: { $gte: targetDate, $lt: nextDay },
      status: { $in: ["waiting", "serving", "completed"] } 
    }).sort({ tokenNumber: -1 });

    const todayPatients = await Queue.countDocuments({
      serviceName,
      appointmentDate: { $gte: targetDate, $lt: nextDay },
      status: { $nin: ["cancelled"] }
    });

    const doctor = await Doctor.findOne({ name: serviceName });
    if (doctor && todayPatients >= doctor.maxPatientsPerDay) {
      return res.status(400).json({ 
        message: "All slots for this day are fully booked. Please try another date!" 
      });
    }

    const tokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    const queue = await Queue.create({
      user: userId,
      serviceName,
      tokenNumber,
      status: "waiting",
      priority: priority || "normal",
      appointmentDate: targetDate,
      notes: notes || ""
    });

    // SMS bhejo — appointment confirm
    const user = await User.findById(userId);
    if (user && user.phone) {
      await sendAppointmentSMS(user.phone, {
        tokenNumber: queue.tokenNumber,
        doctorName: serviceName,
        appointmentDate: queue.appointmentDate.toDateString(),
        timeSlot: "09:00 AM - 05:00 PM",
        advanceAmount: 0
      });
    }

    res.status(201).json({
      message: "Joined queue successfully",
      _id: queue._id,
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
      return res.status(404).json({ message: "Queue record not found" });
    }

    queueEntry.status = "cancelled";
    await queueEntry.save();

    // SMS bhejo — cancel
    const user = await User.findById(userId);
    if (user && user.phone) {
      await sendCancellationSMS(user.phone, {
        tokenNumber: queueEntry.tokenNumber,
        advanceAmount: 0
      });
    }

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextPatient = await Queue.findOne({
      serviceName,
      status: "waiting",
      priority: "emergency",
      appointmentDate: { $gte: today, $lt: tomorrow }
    }).sort({ tokenNumber: 1 });

    const patient = nextPatient || await Queue.findOne({
      serviceName,
      status: "waiting",
      appointmentDate: { $gte: today, $lt: tomorrow }
    }).sort({ tokenNumber: 1 });

    if (!patient) {
      return res.status(404).json({ message: "No patients waiting for today" });
    }

    patient.status = "serving";
    await patient.save();


// Time validation — 9am to 5pm
// const now = new Date();
// const hours = now.getHours();
// if (hours < 9 || hours >= 5) {
//   return res.status(400).json({ 
//     message: "Clinic hours 9:00 AM to 5:00 PM hain — is waqt appointment nahi ho sakti!" 
//   });
// }

// Removed buggy max patients check since it's already handled during queue booking

    // SMS bhejo — turn aa gaya
    const user = await User.findById(patient.user);
    if (user && user.phone) {
      await sendTurnSMS(user.phone, {
        tokenNumber: patient.tokenNumber,
        doctorName: patient.serviceName
      });
    }

    // NEW LOGIC: Proactive Twilio Notification (Approaching Turn)
    const upcomingPatients = await Queue.find({
      serviceName,
      status: "waiting",
    }).sort({ priority: 1, tokenNumber: 1 }).limit(3); 
    // note: 'emergency' comes before 'normal' in sort usually, but simplest is just waiting list 

    if (upcomingPatients.length >= 3) {
      const targetPatient = upcomingPatients[2]; // 3rd in line — warn when queue has 3+ waiting
      const targetUser = await User.findById(targetPatient.user);
      const doctorDetails = await Doctor.findOne({ name: serviceName });
      
      if (targetUser && targetUser.phone) {
        const estimatedWait = (doctorDetails?.slotDuration || 15) * 3;
        await sendApproachingSMS(targetUser.phone, {
          tokenNumber: targetPatient.tokenNumber,
          estimatedWait: estimatedWait
        });
      }
    }

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
    const targetDate = new Date(userQueue.appointmentDate);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const servingPatient = await Queue.findOne({
      serviceName: userQueue.serviceName,
      status: "serving",
      appointmentDate: { $gte: targetDate, $lt: nextDay }
    }).sort({ tokenNumber: 1 });
    
    const currentServing = servingPatient ? servingPatient.tokenNumber : 0;

    const peopleAhead = await Queue.countDocuments({
      serviceName: userQueue.serviceName,
      status: "waiting",
      appointmentDate: { $gte: targetDate, $lt: nextDay },
      tokenNumber: { $lt: userQueue.tokenNumber }
    });

    const doctor = await Doctor.findOne({ name: userQueue.serviceName });
    const slotDuration = doctor?.slotDuration || 15;
    const estimatedTime = peopleAhead > 0 ? peopleAhead * slotDuration : 0;

    res.json({
       _id: userQueue._id,
      serviceName: userQueue.serviceName,
      currentServing,
      yourToken: userQueue.tokenNumber,
      peopleAhead,
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
      status: { $in: ["completed", "cancelled"] }
    }).sort({ createdAt: -1 });

    res.json({
      totalVisits: history.length,
      history
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Admin / doctor — patient ki saari clinic visits + reports + payments (pehli dafa / doosri dafa history) */
exports.getPatientClinicHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const patient = await User.findById(userId).select("name email phone createdAt");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const visits = await Queue.find({ user: userId })
      .sort({ appointmentDate: -1, createdAt: -1 })
      .select(
        "tokenNumber serviceName status priority notes appointmentDate createdAt updatedAt"
      )
      .lean();

    const reports = await MedicalReport.find({ patient: userId })
      .populate("doctor", "name specialization")
      .populate("queue", "serviceName tokenNumber appointmentDate status")
      .sort({ createdAt: -1 })
      .lean();

    const payments = await Payment.find({ user: userId })
      .populate("doctor", "name specialization")
      .populate("queue", "serviceName tokenNumber appointmentDate")
      .sort({ createdAt: -1 })
      .select(
        "totalAmount advanceAmount remainingAmount advanceStatus finalStatus paymentMethod walletChannel finalSettlementMethod finalSettlementWallet createdAt doctor queue"
      )
      .lean();

    res.json({
      patient,
      visits,
      reports,
      payments,
      totalVisits: visits.length,
      totalReports: reports.length,
      totalPayments: payments.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Purana queue/payment cleanup — `days` se kam se kam 14 hona chahiye (pehle 14 din ka data protect). */
const MIN_CLEAR_RETENTION_DAYS = 14;
const MAX_CLEAR_RETENTION_DAYS = 365;

exports.clearOldData = async (req, res) => {
  try {
    const requested = parseInt(String(req.body.days), 10);
    const days = Math.max(
      MIN_CLEAR_RETENTION_DAYS,
      Math.min(Number.isFinite(requested) && requested > 0 ? requested : MIN_CLEAR_RETENTION_DAYS, MAX_CLEAR_RETENTION_DAYS)
    );
    const cutoffDate = new Date();
    cutoffDate.setHours(0, 0, 0, 0);
    cutoffDate.setDate(cutoffDate.getDate() - days);

    /**
     * Pehle sirf completed/cancelled + createdAt — zyada tar test rows `waiting` reh jati thin,
     * ya appointmentDate purani / createdAt naya — ab dono clock se "purana" data nikalta hai.
     */
    const result = await Queue.deleteMany({
      $or: [
        { createdAt: { $lt: cutoffDate } },
        { appointmentDate: { $lt: cutoffDate } }
      ]
    });

    const existingQueueIds = await Queue.distinct("_id");
    let payResult = { deletedCount: 0 };
    if (existingQueueIds.length > 0) {
      payResult = await Payment.deleteMany({
        queue: { $nin: existingQueueIds }
      });
    }

    const hint =
      result.deletedCount === 0 && payResult.deletedCount === 0
        ? `No matching records found — all queue records are after the cutoff date (${cutoffDate.toDateString()}). Enforce at least ${MIN_CLEAR_RETENTION_DAYS} days retention to protect active data.`
        : null;

    const parts = [`Deleted ${result.deletedCount} queue record(s)`];
    if (payResult.deletedCount > 0) {
      parts.push(`${payResult.deletedCount} orphan payment(s) removed`);
    }

    res.json({
      message: parts.join(" — "),
      deletedCount: result.deletedCount,
      paymentsRemoved: payResult.deletedCount,
      cutoffDate: cutoffDate.toISOString(),
      retentionDays: days,
      minRetentionDays: MIN_CLEAR_RETENTION_DAYS,
      hint
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};