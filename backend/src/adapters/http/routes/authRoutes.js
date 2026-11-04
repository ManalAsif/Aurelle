const express = require("express");
const { protect } = require("../middleware/authMiddleware");

module.exports = (authController) => {
  const router = express.Router();
  router.post("/register", authController.register);
  router.post("/login",    authController.login);
  router.get("/me",        protect, authController.getMe);
  return router;
};
