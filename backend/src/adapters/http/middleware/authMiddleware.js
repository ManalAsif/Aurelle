const jwt = require("jsonwebtoken");
const UserModel = require("../../database/models/UserModel");

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
    res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await UserModel.findById(decoded.id).select("-password");
    } catch {}
  }
  next();
};

module.exports = { protect, optionalAuth };
