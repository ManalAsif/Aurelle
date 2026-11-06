const ContactMessageModel = require("../models/ContactMessageModel");

class MongoContactRepository {
  async create(data) {
    return ContactMessageModel.create(data);
  }

  async findAll({ status } = {}) {
    const query = status ? { status } : {};
    return ContactMessageModel.find(query).sort({ createdAt: -1 });
  }

  async updateStatus(id, status) {
    return ContactMessageModel.findByIdAndUpdate(id, { status }, { new: true });
  }
}

module.exports = MongoContactRepository;
