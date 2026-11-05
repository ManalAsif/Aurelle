
class IOrderRepository {
  async create(orderData) { throw new Error("Not implemented"); }
  async findById(id) { throw new Error("Not implemented"); }
  async findByUser(userId) { throw new Error("Not implemented"); }
  async updateStatus(id, status) { throw new Error("Not implemented"); }
}

module.exports = IOrderRepository;
