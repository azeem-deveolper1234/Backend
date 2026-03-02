require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const queueRoutes = require("./routes/queueRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes"); // 👈 ADD

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

connectDB();

app.use(cors());
app.use(express.json());

app.set("io", io);

app.use("/api/auth", authRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/analytics", analyticsRoutes); // 👈 ADD

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Virtual Queue Management API Running...");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});