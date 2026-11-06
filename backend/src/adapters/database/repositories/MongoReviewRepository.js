const IReviewRepository = require("../../../ports/ReviewRepository");
const ReviewModel = require("../models/ReviewModel");
const ProductModel = require("../models/ProductModel");

class MongoReviewRepository extends IReviewRepository {
  async findByProduct(productId) {
    return ReviewModel.find({ product: productId }).sort({ createdAt: -1 });
  }

  async create(data) {
    const review = await ReviewModel.create(data);
    // Update product rating
    const reviews = await ReviewModel.find({ product: data.product });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await ProductModel.findByIdAndUpdate(data.product, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: reviews.length,
    });
    return review;
  }

  async findByUserAndProduct(userId, productId) {
    return ReviewModel.findOne({ user: userId, product: productId });
  }
}

module.exports = MongoReviewRepository;
