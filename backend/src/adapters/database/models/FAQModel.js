const mongoose = require("mongoose");

const FAQSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, default: "General" }
}, { timestamps: true });

module.exports = mongoose.model("FAQ", FAQSchema);
