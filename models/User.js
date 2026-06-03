const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["user", "doctor", "superadmin", "admin"],
    default: "user"
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    default: null
  },
  phone: {
  type: String,
  default: ""
}
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);