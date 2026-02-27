const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log("Token:", token);
  console.log("SECRET:", process.env.JWT_SECRET);

  if (!token) {
    return res.status(401).json({ message: "No token, access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("Error:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { protect };