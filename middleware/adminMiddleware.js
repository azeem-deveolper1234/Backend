const adminOnly = (req, res, next) => {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ 
      message: "Access denied — Super Admin only" 
    });
  }
  next();
};

const doctorOrAdmin = (req, res, next) => {
  if (req.user.role !== "doctor" && req.user.role !== "superadmin") {
    return res.status(403).json({ 
      message: "Access denied — Doctors and Super Admin only" 
    });
  }
  next();
};

const doctorOnly = (req, res, next) => {
  if (req.user.role !== "doctor") {
    return res.status(403).json({ 
      message: "Access denied — Doctors only" 
    });
  }
  next();
};

module.exports = { adminOnly, doctorOrAdmin, doctorOnly };