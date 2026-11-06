
class IReviewRepository {
  async findByProduct(productId) { throw new Error("Not implemented"); }
  async create(reviewData) { throw new Error("Not implemented"); }
  async findByUserAndProduct(userId, productId) { throw new Error("Not implemented"); }
}

module.exports = IReviewRepository;
