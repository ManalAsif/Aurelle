const express = require("express");
const { protect } = require("../middleware/authMiddleware");

module.exports = (reviewController) => {
  const router = express.Router();
  router.get("/:productId",  reviewController.getProductReviews);
  router.post("/",           protect, reviewController.addReview);
  return router;
};
