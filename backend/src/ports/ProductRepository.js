
class IProductRepository {
  async findAll(filters) { throw new Error("Not implemented"); }
  async findById(id) { throw new Error("Not implemented"); }
  async findTrending(limit) { throw new Error("Not implemented"); }
  async findNewArrivals(limit) { throw new Error("Not implemented"); }
  async search(query) { throw new Error("Not implemented"); }
  async create(productData) { throw new Error("Not implemented"); }
  async update(id, data) { throw new Error("Not implemented"); }
  async incrementOrderCount(id, qty) { throw new Error("Not implemented"); }
}

module.exports = IProductRepository;
