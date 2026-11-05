const IOrderRepository = require("../../../ports/OrderRepository");
const OrderModel = require("../models/OrderModel");

class MongoOrderRepository extends IOrderRepository {
  async create(data) {
    return OrderModel.create(data);
  }

  async findById(id) {
    return OrderModel.findById(id).populate("items.product").populate("user", "fullName email");
  }

  async findByUser(userId) {
    return OrderModel.find({ user: userId }).populate("items.product").sort({ createdAt: -1 });
  }

  // FR37 — admin: find all orders with optional status filter + pagination
  async findAll({ status, page = 1, limit = 0 } = {}) {
    const query = status ? { status } : {};
    let q = OrderModel.find(query)
      .populate("user", "fullName email")
      .populate("items.product", "name price")
      .sort({ createdAt: -1 });
    if (limit) q = q.skip((page - 1) * limit).limit(limit);
    return q;
  }

  async updateStatus(id, status, extra = {}) {
    return OrderModel.findByIdAndUpdate(id, { status, ...extra }, { new: true })
      .populate("user", "fullName email")
      .populate("items.product", "name price");
  }

  async update(id, data) {
    return OrderModel.findByIdAndUpdate(id, data, { new: true }).populate("items.product");
  }

  async countAll() {
    return OrderModel.countDocuments();
  }
}

module.exports = MongoOrderRepository;
