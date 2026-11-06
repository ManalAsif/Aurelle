const FAQModel = require("../models/FAQModel");
const FAQ = require("../../../domain/entities/FAQ");

class MongoFAQRepository {
  async getAll() {
    const faqs = await FAQModel.find();
    return faqs.map(f => new FAQ(f._id, f.question, f.answer, f.category));
  }

  async getByCategory(category) {
    const faqs = await FAQModel.find({ category });
    return faqs.map(f => new FAQ(f._id, f.question, f.answer, f.category));
  }

  async create(faqData) {
    const newFaq = new FAQModel(faqData);
    const saved = await newFaq.save();
    return new FAQ(saved._id, saved.question, saved.answer, saved.category);
  }
}

module.exports = MongoFAQRepository;
