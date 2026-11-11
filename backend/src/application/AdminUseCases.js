const { ORDER_STATUSES } = require("../domain/entities/Order");
const { normalizeProductInput, LOW_STOCK_THRESHOLD, badRequest, notFound } = require("./stock");

// Statuses where the items are back on the shelf (or never left)
const RESTOCKED = ["cancelled", "returned"];
const REVENUE_STATUSES = ["processing", "shipped", "delivered", "return_requested"];

class AdminUseCases {
  constructor(userRepository, productRepository, orderRepository, contactRepository) {
    this.userRepo    = userRepository;
    this.productRepo = productRepository;
    this.orderRepo   = orderRepository;
    this.contactRepo = contactRepository;
  }

  async verifyAdmin(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error("User not found");
    if (!user.isAdmin) throw new Error("Not an admin");
    return user;
  }

  async getAllProducts() {
    return this.productRepo.findAll({});
  }

  async addProduct(data) {
    const required = ["name", "price", "category"];
    for (const field of required) {
      if (!data[field]) throw badRequest(`${field} is required`);
    }
    return this.productRepo.create(normalizeProductInput(data));
  }

  async updateProduct(productId, updates) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw notFound("Product not found");
    return this.productRepo.update(productId, normalizeProductInput(updates));
  }

  async deleteProduct(productId) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw notFound("Product not found");
    return this.productRepo.delete(productId);
  }

  // Sets stock for the whole product, or for one size/color when given
  async updateStock(productId, stock, { size, color } = {}) {
    if (!Number.isInteger(stock) || stock < 0) throw badRequest("Stock must be a whole number of 0 or more");
    const product = await this.productRepo.findById(productId);
    if (!product) throw notFound("Product not found");
    if (product.variants.length > 0) {
      if (size === undefined && color === undefined)
        throw badRequest("This product has size/color variants — update stock per variant");
      const variants = product.variants.map((v) => ({ size: v.size, color: v.color, stock: v.stock }));
      const v = variants.find((x) => x.size === (size || "") && x.color === (color || ""));
      if (!v) throw notFound("Variant not found");
      v.stock = stock;
      return this.productRepo.update(productId, normalizeProductInput({ variants }));
    }
    return this.productRepo.update(productId, { stock });
  }

  async getLowStock() {
    const products = await this.productRepo.findAll({});
    const alerts = [];
    for (const p of products) {
      if (p.variants.length > 0) {
        p.variants
          .filter((v) => v.stock <= LOW_STOCK_THRESHOLD)
          .forEach((v) => alerts.push({ productId: p._id, name: p.name, size: v.size, color: v.color, stock: v.stock }));
      } else if (p.stock <= LOW_STOCK_THRESHOLD) {
        alerts.push({ productId: p._id, name: p.name, size: "", color: "", stock: p.stock });
      }
    }
    return alerts.sort((a, b) => a.stock - b.stock);
  }

  async getAllOrders({ status, page = 1, limit = 0 } = {}) {
    return this.orderRepo.findAll({ status, page, limit });
  }

  async updateOrderStatus(orderId, status) {
    if (!ORDER_STATUSES.includes(status))
      throw badRequest(`Invalid status. Must be one of: ${ORDER_STATUSES.join(", ")}`);
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw notFound("Order not found");
    if (order.status === status) return order;

    const wasRestocked = RESTOCKED.includes(order.status);
    const willRestock  = RESTOCKED.includes(status);
    if (wasRestocked && !willRestock)
      throw badRequest(`A ${order.status} order cannot be reopened`);

    const extra = {};
    if (!wasRestocked && willRestock) {
      for (const item of order.items) {
        const productId = item.product?._id || item.product;
        if (productId) await this.productRepo.incrementStock(productId, item);
      }
      if (order.paymentStatus === "paid") extra.paymentStatus = "refunded";
      if (status === "cancelled") { extra.cancelledAt = new Date(); extra.cancelReason = order.cancelReason || "Cancelled by store"; }
    }
    if (status === "delivered") {
      if (!order.deliveredAt) extra.deliveredAt = new Date();
      if (order.paymentMethod === "cod") extra.paymentStatus = "paid";
    }
    return this.orderRepo.updateStatus(orderId, status, extra);
  }

  async getMessages(filters) {
    return this.contactRepo.findAll(filters);
  }

  async updateMessageStatus(id, status) {
    if (!["open", "resolved"].includes(status)) throw badRequest("Invalid status");
    const msg = await this.contactRepo.updateStatus(id, status);
    if (!msg) throw notFound("Message not found");
    return msg;
  }

  async getSalesReport({ month, year } = {}) {
    const allOrders = await this.orderRepo.findAll({});

    let filtered = allOrders;
    if (month && year) {
      filtered = allOrders.filter((o) => {
        const d = new Date(o.createdAt);
        return d.getMonth() + 1 === Number(month) && d.getFullYear() === Number(year);
      });
    }

    const sold       = filtered.filter((o) => REVENUE_STATUSES.includes(o.status));
    const delivered  = filtered.filter((o) => o.status === "delivered");
    const pending    = filtered.filter((o) => o.status === "pending");
    const cancelled  = filtered.filter((o) => o.status === "cancelled");
    const returns    = filtered.filter((o) => o.status === "return_requested" || o.status === "returned");
    const totalRevenue = sold.reduce((sum, o) => sum + (o.total || 0), 0);

    const dailySales = {};
    sold.forEach((o) => {
      const day = new Date(o.createdAt).toISOString().split("T")[0];
      dailySales[day] = (dailySales[day] || 0) + (o.total || 0);
    });

    const productSales = {};
    sold.forEach((o) => {
      (o.items || []).forEach((item) => {
        const key = item.name || item.product?.toString();
        if (!key) return;
        if (!productSales[key]) productSales[key] = { name: key, qty: 0, revenue: 0 };
        productSales[key].qty     += item.quantity || 0;
        productSales[key].revenue += (item.price || 0) * (item.quantity || 0);
      });
    });

    const paymentBreakdown = {};
    sold.forEach((o) => {
      const m = o.paymentMethod || "cod";
      paymentBreakdown[m] = (paymentBreakdown[m] || 0) + (o.total || 0);
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const totalUsers = await this.userRepo.countAll();

    return {
      summary: {
        totalOrders:    filtered.length,
        totalDelivered: delivered.length,
        totalPending:   pending.length,
        totalCancelled: cancelled.length,
        totalReturns:   returns.length,
        totalRevenue,
        averageOrderValue: sold.length ? Math.round(totalRevenue / sold.length) : 0,
        totalUsers,
      },
      dailySales: Object.entries(dailySales)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
      topProducts,
      paymentBreakdown: Object.entries(paymentBreakdown).map(([method, revenue]) => ({ method, revenue })),
    };
  }
}

module.exports = AdminUseCases;
