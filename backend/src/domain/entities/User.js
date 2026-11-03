class User {
  constructor({ id, fullName, email, password, isAdmin = false, wishlist = [], cart = [], createdAt }) {
    this.id       = id;
    this.fullName = fullName;
    this.email    = email;
    this.password = password;
    this.isAdmin  = isAdmin;
    this.wishlist = wishlist;
    this.cart     = cart;
    this.createdAt = createdAt;
  }
}

module.exports = User;
