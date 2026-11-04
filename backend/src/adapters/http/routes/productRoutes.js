const express = require("express");
const { protect, adminOnly } = require("../middleware/adminMiddleware");

module.exports = (productController) => {
  const router = express.Router();
  router.get("/",            productController.getAll);
  router.get("/trending",    productController.getTrending);
  router.get("/new-arrivals",productController.getNewArrivals);
  router.get("/search",      productController.search);
  router.get("/filters",     productController.getFilterOptions);
  router.get("/:id",         productController.getById);
  router.post("/",           protect, adminOnly, productController.create);
  return router;
};
