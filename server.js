require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const queueRoutes = require("./routes/queueRoutes");

const app = express();
const server = http.createServer(app); // 👈 HTTP server bana
const io = new Server(server, {       // 👈 Socket.io HTTP server pe
  cors: { origin: "*", methods: ["GET", "POST"] }
});

connectDB();

app.use(cors());
app.use(express.json());

app.set("io", io); // 👈 io globally available

app.use("/api/auth", authRoutes);
app.use("/api/queue", queueRoutes);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id); // 👈 jab koi connect ho
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Virtual Queue Management API Running...");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {           // 👈 app.listen ki jagah server.listen
  console.log(`Server running on port ${PORT}`);
});