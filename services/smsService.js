const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Appointment confirmation SMS
exports.sendAppointmentSMS = async (phone, data) => {
  try {
    const message = await client.messages.create({
      body: `🏥 City Medical Clinic\n\nAppointment Confirmed!\nToken: ${data.tokenNumber}\nDoctor: ${data.doctorName}\nDate: ${data.appointmentDate}\nTime: ${data.timeSlot}\n\nPlease arrive 10 mins early.\nAdvance Paid: Rs.${data.advanceAmount}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    console.log("SMS sent:", message.sid);
    return { success: true, sid: message.sid };

  } catch (error) {
    console.error("SMS error:", error.message);
    return { success: false, error: error.message };
  }
};

// Queue update SMS — jab turn aaye
exports.sendQueueUpdateSMS = async (phone, data) => {
  try {
    const message = await client.messages.create({
      body: `🏥 City Medical Clinic\n\nQueue Update!\nToken: ${data.tokenNumber}\nCurrent Serving: ${data.currentServing}\nPeople Ahead: ${data.peopleAhead}\nEstimated Wait: ${data.estimatedTime} mins\n\nPlease be ready!`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    console.log("SMS sent:", message.sid);
    return { success: true, sid: message.sid };

  } catch (error) {
    console.error("SMS error:", error.message);
    return { success: false, error: error.message };
  }
};

// Turn aane pe SMS
exports.sendTurnSMS = async (phone, data) => {
  try {
    const message = await client.messages.create({
      body: `🏥 City Medical Clinic\n\nYour Turn!\nToken No: ${data.tokenNumber}\nDoctor: ${data.doctorName}\n\nPlease come to the clinic now!`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    console.log("SMS sent:", message.sid);
    return { success: true, sid: message.sid };

  } catch (error) {
    console.error("SMS error:", error.message);
    return { success: false, error: error.message };
  }
};

// Cancellation SMS
exports.sendCancellationSMS = async (phone, data) => {
  try {
    const message = await client.messages.create({
      body: `🏥 City Medical Clinic\n\nAppointment Cancelled\nToken: ${data.tokenNumber}\nAdvance Rs.${data.advanceAmount} has been forfeited.\n\nFor queries call: 042-1234567`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    console.log("SMS sent:", message.sid);
    return { success: true, sid: message.sid };

  } catch (error) {
    console.error("SMS error:", error.message);
    return { success: false, error: error.message };
  }
};