const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

/** Atlas / purane docs mein mixed-case email ho sakti hai — MongoDB default match case-sensitive hai */
const EMAIL_COLLATION = { locale: "en", strength: 2 };

async function findOneUserByEmail(emailNormalized) {
  return User.findOne({ email: emailNormalized }).collation(EMAIL_COLLATION);
}

function publicUserFields(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || ""
  };
}

// Register
exports.registerUser = async (req, res) => {
  try {
    const rawName = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const phone = String(req.body.phone || "").trim();

    if (!rawName || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const userExists = await findOneUserByEmail(email);
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: rawName,
      email,
      password: hashedPassword,
      phone
    });

    res.status(201).json({
      message: "User Registered Successfully",
      user: publicUserFields(user)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.loginUser = async (req, res) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await findOneUserByEmail(email);
    const isMatch = user && (await bcrypt.compare(password, user.password));

    if (!user || !isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, secret, {
      expiresIn: "7d"
    });

    res.json({
      message: "Login Successful",
      token,
      user: publicUserFields(user)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
