const IProductRepository = require("../../../ports/ProductRepository");
const ProductModel = require("../models/ProductModel");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class MongoProductRepository extends IProductRepository {
  async findAll({ category, search, sortBy, minPrice, maxPrice, size, color, inStock } = {}) {
    let query = {};
    if (category) {
      if (category.toLowerCase() === "trending") {
        query.isTrending = true;
      } else {
        query.category = { $regex: new RegExp(`^${escapeRegex(category)}$`, "i") };
      }
    }
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: rx }, { description: rx }];
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }
    if (size)  query.sizes  = size;
    if (color) query.colors = { $regex: new RegExp(`^${escapeRegex(color)}$`, "i") };
    if (inStock) query.stock = { $gt: 0 };

    let sort = {};
    if (sortBy === "price_asc")       sort.price = 1;
    else if (sortBy === "price_desc") sort.price = -1;
    else if (sortBy === "name_asc")   sort.name  = 1;
    else if (sortBy === "name_desc")  sort.name  = -1;
    else if (sortBy === "popularity") { sort.totalOrdered = -1; sort.rating = -1; }
    else if (sortBy === "rating")     { sort.rating = -1; sort.reviewCount = -1; }
    else sort.createdAt = -1; // "newest" (default)
    return ProductModel.find(query).sort(sort);
  }
  async findById(id) { return ProductModel.findById(id); }
  async findTrending(limit = 10) { return ProductModel.find().sort({ totalOrdered: -1 }).limit(limit); }
  async findNewArrivals(limit = 6) {
    const products = await ProductModel.find({ isNewArrival: true }).sort({ createdAt: -1 }).limit(limit);
    if (products.length > 0) return products;
    // Fallback: return the latest products if none are marked as new arrivals
    return ProductModel.find().sort({ createdAt: -1 }).limit(limit);
  }
  async search(query) {
    const rx = new RegExp(escapeRegex(query), "i");
    return ProductModel.find({ $or: [{ name: rx }, { description: rx }] }).limit(10);
  }
  async getFilterOptions() {
    const [colors, priceRange] = await Promise.all([
      ProductModel.distinct("colors"),
      ProductModel.aggregate([{ $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } }]),
    ]);
    return {
      colors: colors.filter(Boolean).sort(),
      minPrice: priceRange[0]?.min || 0,
      maxPrice: priceRange[0]?.max || 0,
    };
  }
  async create(data) { return ProductModel.create(data); }
  async update(id, data) { return ProductModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }); }
  async delete(id) { return ProductModel.findByIdAndDelete(id); }
  async incrementOrderCount(id, qty = 1) { return ProductModel.findByIdAndUpdate(id, { $inc: { totalOrdered: qty } }); }
  async findByIds(ids) { return ProductModel.find({ _id: { $in: ids } }); }

  // Atomically take stock for one size/color. Returns false if not enough stock.
  async decrementStock(id, { size = "", color = "", quantity }) {
    const product = await ProductModel.findById(id).select("variants");
    if (!product) return false;
    let res;
    if (product.variants.length > 0) {
      res = await ProductModel.updateOne(
        { _id: id, variants: { $elemMatch: { size, color, stock: { $gte: quantity } } } },
        { $inc: { "variants.$.stock": -quantity, stock: -quantity } }
      );
    } else {
      res = await ProductModel.updateOne(
        { _id: id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } }
      );
    }
    return res.modifiedCount === 1;
  }

  // Put stock back (order cancelled / returned)
  async incrementStock(id, { size = "", color = "", quantity }) {
    const product = await ProductModel.findById(id).select("variants");
    if (!product) return;
    if (product.variants.length > 0) {
      await ProductModel.updateOne(
        { _id: id, variants: { $elemMatch: { size, color } } },
        { $inc: { "variants.$.stock": quantity, stock: quantity } }
      );
    } else {
      await ProductModel.updateOne({ _id: id }, { $inc: { stock: quantity } });
    }
  }
}

module.exports = MongoProductRepository;
