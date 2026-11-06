class ReviewController {
  constructor(reviewUseCases) {
    this.reviewUseCases = reviewUseCases;
  }

  getProductReviews = async (req, res, next) => {
    try {
      const reviews = await this.reviewUseCases.getProductReviews(req.params.productId);
      res.json(reviews);
    } catch (err) { next(err); }
  };

  addReview = async (req, res, next) => {
    try {
      const { productId, rating, comment } = req.body;
      if (!productId || !rating || !comment)
        return res.status(400).json({ message: "productId, rating, and comment are required" });
      const review = await this.reviewUseCases.addReview(
        req.user._id,
        req.user.fullName,
        { productId, rating, comment }
      );
      res.status(201).json(review);
    } catch (err) { next(err); }
  };
}

module.exports = ReviewController;
