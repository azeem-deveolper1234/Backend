require('dotenv').config();
const { sendAppointmentSMS } = require('./services/smsService');

async function testSMS() {
  console.log("Testing SMS...");
  const phone = process.argv[2] || "+923000000000"; // Fake default
  const result = await sendAppointmentSMS(phone, {
    tokenNumber: 99,
    doctorName: "Dr. Test",
    appointmentDate: "2026-04-26",
    timeSlot: "09:00 AM",
    advanceAmount: 500
  });
  console.log("Result:", result);
}

testSMS();
