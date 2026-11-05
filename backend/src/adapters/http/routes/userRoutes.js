const express = require("express");
const { protect } = require("../middleware/authMiddleware");

module.exports = (wishlistCartController) => {
  const router = express.Router();
  // Wishlist
  router.get("/wishlist",                        protect, wishlistCartController.getWishlist);
  router.get("/wishlist/shared/:userId",         wishlistCartController.getSharedWishlist);
  router.post("/wishlist/:productId",            protect, wishlistCartController.addToWishlist);
  router.delete("/wishlist/:productId",          protect, wishlistCartController.removeFromWishlist);
  // Cart
  router.get("/cart",                            protect, wishlistCartController.getCart);
  router.post("/cart",                           protect, wishlistCartController.addToCart);
  router.put("/cart",                            protect, wishlistCartController.updateCartQuantity);
  router.delete("/cart",                         protect, wishlistCartController.removeFromCart);
  return router;
};
