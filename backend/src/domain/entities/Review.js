class Review {
  constructor({ id, product, user, userName, rating, comment, createdAt }) {
    this.id = id;
    this.product = product;
    this.user = user;
    this.userName = userName;
    this.rating = rating;
    this.comment = comment;
    this.createdAt = createdAt;
  }
}

module.exports = Review;
