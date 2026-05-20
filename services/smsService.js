const twilio = require("twilio");

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

// Phone number formatter for Twilio (E.164 format)
const formatPhone = (phone) => {
  if (phone == null) return null;
  const raw = String(phone).trim();
  if (!raw) return null;
  if (raw.startsWith("+")) {
    const digits = raw.slice(1).replace(/\D/g, "");
    if (!digits) return null;
    return "+" + digits;
  }
  const p = raw.replace(/\D/g, "");
  if (!p) return null;
  if (p.startsWith("03") && p.length === 11) return "+92" + p.slice(1);
  if (p.startsWith("3") && p.length === 10) return "+92" + p;
  if (/^\d{10,15}$/.test(p)) return "+" + p;
  return null;
};

async function sendTwilioSms(to, body) {
  const client = getTwilioClient();
  if (!client) {
    console.warn("SMS skipped: set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN");
    return { success: false, error: "SMS not configured (missing Twilio credentials)" };
  }
  if (!to || !/^\+[1-9]\d{1,14}$/.test(to)) {
    return { success: false, error: "Invalid phone number for SMS" };
  }
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) {
    console.warn("SMS skipped: TWILIO_PHONE_NUMBER is not set");
    return { success: false, error: "SMS not configured (missing TWILIO_PHONE_NUMBER)" };
  }
  try {
    const message = await client.messages.create({ body, from, to });
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error("SMS error:", error.message);
    return { success: false, error: error.message };
  }
}

// Appointment confirmation SMS
exports.sendAppointmentSMS = async (phone, data) => {
  const body = `🏥 City Medical Clinic\n\nAppointment Confirmed!\nToken: ${data.tokenNumber}\nDoctor: ${data.doctorName}\nDate: ${data.appointmentDate}\nTime: ${data.timeSlot}\n\nPlease arrive 10 mins early.\nAdvance Paid: Rs.${data.advanceAmount}`;
  const result = await sendTwilioSms(formatPhone(phone), body);
  if (result.success) console.log("SMS sent:", result.sid);
  return result;
};

// Queue update SMS — jab turn aaye
exports.sendQueueUpdateSMS = async (phone, data) => {
  const body = `🏥 City Medical Clinic\n\nQueue Update!\nToken: ${data.tokenNumber}\nCurrent Serving: ${data.currentServing}\nPeople Ahead: ${data.peopleAhead}\nEstimated Wait: ${data.estimatedTime} mins\n\nPlease be ready!`;
  const result = await sendTwilioSms(formatPhone(phone), body);
  if (result.success) console.log("SMS sent:", result.sid);
  return result;
};

// Turn aane pe SMS
exports.sendTurnSMS = async (phone, data) => {
  const body = `🏥 City Medical Clinic\n\nYour Turn!\nToken No: ${data.tokenNumber}\nDoctor: ${data.doctorName}\n\nPlease come to the clinic now!`;
  const result = await sendTwilioSms(formatPhone(phone), body);
  if (result.success) console.log("SMS sent:", result.sid);
  return result;
};

// Cancellation SMS
exports.sendCancellationSMS = async (phone, data) => {
  const body = `🏥 City Medical Clinic\n\nAppointment Cancelled\nToken: ${data.tokenNumber}\nAdvance Rs.${data.advanceAmount} has been forfeited.\n\nFor queries call: 042-1234567`;
  const result = await sendTwilioSms(formatPhone(phone), body);
  if (result.success) console.log("SMS sent:", result.sid);
  return result;
};

// Approaching Turn SMS
exports.sendApproachingSMS = async (phone, data) => {
  const body = `🏥 City Medical Clinic\n\nAlert! Your turn is approaching.\nToken: ${data.tokenNumber}\nExpected Wait: ${data.estimatedWait} mins.\n\nPlease proceed to the clinic immediately.`;
  const result = await sendTwilioSms(formatPhone(phone), body);
  if (result.success) console.log("Approaching SMS sent:", result.sid);
  return result;
};