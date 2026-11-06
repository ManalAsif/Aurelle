const { badRequest } = require("./stock");

class ReviewUseCases {
  constructor(reviewRepository) {
    this.reviewRepository = reviewRepository;
  }

  async getProductReviews(productId) {
    return this.reviewRepository.findByProduct(productId);
  }

  async addReview(userId, userName, { productId, rating, comment }) {
    const already = await this.reviewRepository.findByUserAndProduct(userId, productId);
    if (already) throw badRequest("You have already reviewed this product");
    return this.reviewRepository.create({
      product: productId,
      user: userId,
      userName,
      rating,
      comment,
    });
  }
}

module.exports = ReviewUseCases;
