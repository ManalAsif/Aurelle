const mongoose = require("mongoose");

// One stock entry per size/color combination. Empty string means "not applicable"
// (e.g. jewelry has no size, a single-color suit has no color).
const variantSchema = new mongoose.Schema(
  {
    size:  { type: String, default: "" },
    color: { type: String, default: "" },
    stock: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true },
    description:  { type: String },
    price:        { type: Number, required: true },
    category:     { type: String, required: true },
    sizes:        [{ type: String, enum: ["XS","S","M","L","XL","XXL"] }],
    colors:       [{ type: String }],
    variants:     [variantSchema],
    images:       [{ type: String }],
    stock:        { type: Number, default: 0 },
    rating:       { type: Number, default: 0 },
    reviewCount:  { type: Number, default: 0 },
    isNewArrival: { type: Boolean, default: false },
    isTrending:   { type: Boolean, default: false },
    totalOrdered: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Keep total stock in sync with variant stock
productSchema.pre("save", function (next) {
  if (this.variants && this.variants.length > 0) {
    this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
  next();
});

productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
