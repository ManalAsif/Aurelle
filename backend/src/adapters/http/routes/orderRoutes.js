const express = require("express");
const { protect } = require("../middleware/authMiddleware");

module.exports = (orderController) => {
  const router = express.Router();
  router.post("/",    protect, orderController.placeOrder);
  router.get("/",     protect, orderController.getMyOrders);
  router.get("/:id",  protect, orderController.getOrderById);
  router.patch("/:id/cancel", protect, orderController.cancelOrder);
  router.post("/:id/return",  protect, orderController.requestReturn);
  return router;
};
