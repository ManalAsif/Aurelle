const ORDER_STATUSES  = ["pending", "processing", "shipped", "delivered", "cancelled", "return_requested", "returned"];
const PAYMENT_METHODS = ["cod", "card", "jazzcash", "easypaisa"];

class Order {
  constructor({ id, orderNumber, user, items, billingDetails, paymentMethod, paymentStatus, subtotal, shippingFee, total, status, createdAt }) {
    this.id = id;
    this.orderNumber = orderNumber;
    this.user = user;
    this.items = items; // [{ product, quantity, size, color, price }]
    this.billingDetails = billingDetails;
    this.paymentMethod = paymentMethod || "cod";
    this.paymentStatus = paymentStatus || "pending";
    this.subtotal = subtotal;
    this.shippingFee = shippingFee || 0;
    this.total = total;
    this.status = status || "pending";
    this.createdAt = createdAt;
  }
}

module.exports = Order;
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
