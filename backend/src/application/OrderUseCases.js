const { PAYMENT_METHODS } = require("../domain/entities/Order");
const { badRequest, notFound } = require("./stock");

const REQUIRED_BILLING = ["firstName", "lastName", "country", "streetAddress", "city", "state", "phone", "email"];
const RETURN_WINDOW_DAYS = 30;
const FREE_SHIPPING_FROM = 5000;
const SHIPPING_FEE = 250;

const generateOrderNumber = () =>
  "AUR-" + Date.now().toString(36).toUpperCase().slice(-5) + Math.random().toString(36).slice(2, 5).toUpperCase();

class OrderUseCases {
  constructor(orderRepository, productRepository, userRepository) {
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
    this.userRepository = userRepository;
  }

  _validateBilling(billing) {
    if (!billing) throw badRequest("Billing details required");
    for (const f of REQUIRED_BILLING) {
      if (!billing[f] || !String(billing[f]).trim()) throw badRequest(`${f} is required`);
    }
    if (!/^\S+@\S+\.\S+$/.test(billing.email)) throw badRequest("Please enter a valid email address");
    if (!/^[+\d][\d\s-]{6,}$/.test(billing.phone)) throw badRequest("Please enter a valid phone number");
  }

  // Validates the payment choice and returns only the safe-to-store details
  _validatePayment(paymentMethod, paymentDetails = {}) {
    if (!PAYMENT_METHODS.includes(paymentMethod)) throw badRequest("Please select a valid payment method");
    if (paymentMethod === "card") {
      if (!/^\d{4}$/.test(paymentDetails.cardLast4 || "")) throw badRequest("Invalid card details");
      if (!paymentDetails.cardHolder?.trim()) throw badRequest("Card holder name is required");
      return { cardLast4: paymentDetails.cardLast4, cardHolder: paymentDetails.cardHolder.trim() };
    }
    if (paymentMethod === "jazzcash" || paymentMethod === "easypaisa") {
      if (!/^03\d{9}$/.test((paymentDetails.walletNumber || "").replace(/[\s-]/g, "")))
        throw badRequest("Enter a valid mobile wallet number (03XXXXXXXXX)");
      return { walletNumber: paymentDetails.walletNumber.replace(/[\s-]/g, "") };
    }
    return {};
  }

  async placeOrder({ userId, billingDetails, paymentMethod = "cod", paymentDetails }) {
    this._validateBilling(billingDetails);
    const safePayment = this._validatePayment(paymentMethod, paymentDetails);

    const cart = await this.userRepository.getCart(userId);
    if (!cart || cart.length === 0) throw badRequest("Cart is empty");

    const items = cart.map((c) => ({
      product: c.product._id,
      name: c.product.name,
      image: c.product.images?.[0],
      quantity: c.quantity,
      size: c.size || "",
      color: c.color || "",
      price: c.product.price,
    }));

    // Reserve stock; roll back everything if any line is short
    const reserved = [];
    for (const item of items) {
      const ok = await this.productRepository.decrementStock(item.product, item);
      if (!ok) {
        for (const r of reserved) await this.productRepository.incrementStock(r.product, r);
        const option = [item.size, item.color].filter(Boolean).join(" / ");
        throw badRequest(`Sorry, "${item.name}"${option ? ` (${option})` : ""} no longer has enough stock`);
      }
      reserved.push(item);
    }

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingFee = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;

    let order;
    try {
      order = await this.orderRepository.create({
        orderNumber: generateOrderNumber(),
        user: userId,
        items,
        billingDetails,
        paymentMethod,
        // Card and wallet payments are simulated as captured at checkout
        paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
        paymentDetails: safePayment,
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
        status: "pending",
      });
    } catch (err) {
      for (const r of reserved) await this.productRepository.incrementStock(r.product, r);
      throw err;
    }

    for (const item of items) {
      await this.productRepository.incrementOrderCount(item.product, item.quantity);
    }
    await this.userRepository.clearCart(userId);
    return order;
  }

  async getUserOrders(userId) {
    return this.orderRepository.findByUser(userId);
  }

  async getOrderById(orderId, requester) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw notFound("Order not found");
    const ownerId = order.user?._id?.toString() || order.user?.toString();
    if (!requester.isAdmin && ownerId !== requester._id.toString()) throw notFound("Order not found");
    return order;
  }

  async _restock(order) {
    for (const item of order.items) {
      const productId = item.product?._id || item.product;
      if (productId) await this.productRepository.incrementStock(productId, item);
    }
  }

  async cancelOrder(userId, orderId, reason) {
    const order = await this.getOrderById(orderId, { _id: userId, isAdmin: false });
    if (!["pending", "processing"].includes(order.status))
      throw badRequest("Only pending or processing orders can be cancelled");
    await this._restock(order);
    return this.orderRepository.update(orderId, {
      status: "cancelled",
      cancelReason: reason?.trim() || "Cancelled by customer",
      cancelledAt: new Date(),
      paymentStatus: order.paymentStatus === "paid" ? "refunded" : order.paymentStatus,
    });
  }

  async requestReturn(userId, orderId, reason) {
    if (!reason || !reason.trim()) throw badRequest("Please tell us why you are returning this order");
    const order = await this.getOrderById(orderId, { _id: userId, isAdmin: false });
    if (order.status !== "delivered") throw badRequest("Only delivered orders can be returned");
    const deliveredAt = order.deliveredAt || order.updatedAt;
    const days = (Date.now() - new Date(deliveredAt).getTime()) / 86400000;
    if (days > RETURN_WINDOW_DAYS) throw badRequest(`Returns are only accepted within ${RETURN_WINDOW_DAYS} days of delivery`);
    return this.orderRepository.update(orderId, {
      status: "return_requested",
      returnReason: reason.trim(),
      returnRequestedAt: new Date(),
    });
  }
}

module.exports = OrderUseCases;
