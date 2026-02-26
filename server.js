require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db"); // 👈 add this
const authRoutes = require("./routes/authRoutes");

const app = express();

connectDB(); // 👈 database connect karo

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Virtual Queue Management API Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});