const { norm, availableStock, validateOptions, badRequest, notFound } = require("./stock");

class WishlistCartUseCases {
  constructor(userRepository, productRepository) {
    this.userRepository = userRepository;
    this.productRepository = productRepository;
  }

  // --- Wishlist ---
  async getWishlist(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("User not found");
    return user.wishlist;
  }

  async addToWishlist(userId, productId) {
    return this.userRepository.addToWishlist(userId, productId);
  }

  async removeFromWishlist(userId, productId) {
    return this.userRepository.removeFromWishlist(userId, productId);
  }

  // Public, read-only view of someone's wishlist (used by share links)
  async getSharedWishlist(userId) {
    const result = await this.userRepository.getPublicWishlist(userId);
    if (!result) throw notFound("Wishlist not found");
    return result;
  }

  // --- Cart ---
  async getCart(userId) {
    return this.userRepository.getCart(userId);
  }

  async _loadProduct(productId) {
    const product = await this.productRepository.findById(productId);
    if (!product) throw notFound("Product not found");
    return product;
  }

  async addToCart(userId, { productId, quantity = 1, size, color }) {
    quantity = Number(quantity);
    if (!Number.isInteger(quantity) || quantity < 1) throw badRequest("Quantity must be at least 1");
    const product = await this._loadProduct(productId);
    validateOptions(product, size, color);

    const inCart = await this.userRepository.getCartLine(userId, productId, norm(size), norm(color));
    const wanted = quantity + (inCart ? inCart.quantity : 0);
    const stock = availableStock(product, size, color);
    if (stock === 0) throw badRequest("This item is out of stock");
    if (wanted > stock) throw badRequest(`Only ${stock} left in stock`);

    return this.userRepository.addToCart(userId, {
      product: productId,
      quantity,
      size: norm(size),
      color: norm(color),
    });
  }

  async updateCartQuantity(userId, { productId, size, color, quantity }) {
    quantity = Number(quantity);
    if (!Number.isInteger(quantity) || quantity < 1) throw badRequest("Quantity must be at least 1");
    const product = await this._loadProduct(productId);
    const stock = availableStock(product, size, color);
    if (quantity > stock) throw badRequest(stock === 0 ? "This item is out of stock" : `Only ${stock} left in stock`);
    return this.userRepository.updateCartQuantity(userId, { productId, size: norm(size), color: norm(color), quantity });
  }

  async removeFromCart(userId, productId, size, color) {
    return this.userRepository.removeFromCart(userId, productId, norm(size), norm(color));
  }

  async clearCart(userId) {
    return this.userRepository.clearCart(userId);
  }
}

module.exports = WishlistCartUseCases;
