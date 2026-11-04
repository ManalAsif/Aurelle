const jwt = require("jsonwebtoken");
const UserModel = require("../../database/models/UserModel");

// Verifies JWT and attaches user to req
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ message: "Not authorized, no token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await UserModel.findById(decoded.id).select("-password");
    next();
  } catch {
    res.status(401).json({ message: "Token invalid or expired" });
  }
};

// Must be used AFTER protect — rejects non-admins
const adminOnly = (req, res, next) => {
  if (req.user && req.user.isAdmin) return next();
  res.status(403).json({ message: "Access denied: admins only" });
};

module.exports = { protect, adminOnly };
