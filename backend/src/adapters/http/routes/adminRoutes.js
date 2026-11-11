const express = require("express");
const { protect, adminOnly } = require("../middleware/adminMiddleware");

module.exports = (adminController) => {
  const router = express.Router();

  
  router.use(protect, adminOnly);

  // Products 
  router.get("/products",              adminController.getAllProducts);
  router.post("/products",             adminController.addProduct);
  router.put("/products/:id",          adminController.updateProduct);
  router.delete("/products/:id",       adminController.deleteProduct);
  router.patch("/products/:id/stock",  adminController.updateStock);
  router.get("/low-stock",             adminController.getLowStock);

  // Orders 
  router.get("/orders",                adminController.getAllOrders);
  router.patch("/orders/:id/status",   adminController.updateOrderStatus);

  // Support messages
  router.get("/messages",              adminController.getMessages);
  router.patch("/messages/:id",        adminController.updateMessageStatus);

  // Reports
  router.get("/reports",               adminController.getSalesReport);

  return router;
};
