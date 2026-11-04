const { normalizeProductInput, badRequest, notFound } = require("./stock");

class ProductUseCases {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async getAllProducts(filters = {}) {
    const clean = { ...filters };
    for (const k of ["minPrice", "maxPrice"]) {
      if (clean[k] === undefined || clean[k] === "") delete clean[k];
      else {
        clean[k] = Number(clean[k]);
        if (Number.isNaN(clean[k])) delete clean[k];
      }
    }
    clean.inStock = clean.inStock === "true" || clean.inStock === true;
    return this.productRepository.findAll(clean);
  }

  async getFilterOptions() {
    return this.productRepository.getFilterOptions();
  }

  async getProductById(id) {
    const product = await this.productRepository.findById(id);
    if (!product) throw notFound("Product not found");
    return product;
  }

  async getTrending(limit = 10) {
    return this.productRepository.findTrending(limit);
  }

  async getNewArrivals(limit = 6) {
    return this.productRepository.findNewArrivals(limit);
  }

  async searchProducts(query) {
    if (!query || query.trim() === "") throw badRequest("Search query required");
    return this.productRepository.search(query);
  }

  async createProduct(data) {
    return this.productRepository.create(normalizeProductInput(data));
  }
}

module.exports = ProductUseCases;
