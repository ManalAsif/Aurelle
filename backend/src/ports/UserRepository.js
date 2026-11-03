
class IUserRepository {
  async findById(id) { throw new Error("Not implemented"); }
  async findByEmail(email) { throw new Error("Not implemented"); }
  async create(userData) { throw new Error("Not implemented"); }
  async update(id, data) { throw new Error("Not implemented"); }
  async addToWishlist(userId, productId) { throw new Error("Not implemented"); }
  async removeFromWishlist(userId, productId) { throw new Error("Not implemented"); }
}

module.exports = IUserRepository;
