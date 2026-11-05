class WishlistCartController {
  constructor(wishlistCartUseCases) {
    this.wishlistCartUseCases = wishlistCartUseCases;
  }

  // Wishlist
  getWishlist = async (req, res, next) => {
    try {
      const wishlist = await this.wishlistCartUseCases.getWishlist(req.user._id);
      res.json(wishlist);
    } catch (err) { next(err); }
  };

  addToWishlist = async (req, res, next) => {
    try {
      const result = await this.wishlistCartUseCases.addToWishlist(req.user._id, req.params.productId);
      res.json({ message: "Added to wishlist", wishlist: result.wishlist });
    } catch (err) { next(err); }
  };

  removeFromWishlist = async (req, res, next) => {
    try {
      const result = await this.wishlistCartUseCases.removeFromWishlist(req.user._id, req.params.productId);
      res.json({ message: "Removed from wishlist", wishlist: result.wishlist });
    } catch (err) { next(err); }
  };

  getSharedWishlist = async (req, res, next) => {
    try {
      const result = await this.wishlistCartUseCases.getSharedWishlist(req.params.userId);
      res.json(result);
    } catch (err) {
      if (err.name === "CastError") err = Object.assign(new Error("Wishlist not found"), { status: 404 });
      next(err);
    }
  };

  // Cart
  getCart = async (req, res, next) => {
    try {
      const cart = await this.wishlistCartUseCases.getCart(req.user._id);
      res.json(cart);
    } catch (err) { next(err); }
  };

  addToCart = async (req, res, next) => {
    try {
      const { productId, quantity, size, color } = req.body;
      const cart = await this.wishlistCartUseCases.addToCart(req.user._id, { productId, quantity, size, color });
      res.json({ message: "Added to cart", cart });
    } catch (err) { next(err); }
  };

  updateCartQuantity = async (req, res, next) => {
    try {
      const { productId, quantity, size, color } = req.body;
      const cart = await this.wishlistCartUseCases.updateCartQuantity(req.user._id, { productId, quantity, size, color });
      res.json({ message: "Cart updated", cart });
    } catch (err) { next(err); }
  };

  removeFromCart = async (req, res, next) => {
    try {
      const { productId, size, color } = req.body;
      const cart = await this.wishlistCartUseCases.removeFromCart(req.user._id, productId, size, color);
      res.json({ message: "Removed from cart", cart });
    } catch (err) { next(err); }
  };
}

module.exports = WishlistCartController;
