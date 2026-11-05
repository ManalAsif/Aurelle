class OrderController {
  constructor(orderUseCases) {
    this.orderUseCases = orderUseCases;
  }

  placeOrder = async (req, res, next) => {
    try {
      const { billingDetails, paymentMethod, paymentDetails } = req.body;
      if (!billingDetails) return res.status(400).json({ message: "Billing details required" });
      const order = await this.orderUseCases.placeOrder({
        userId: req.user._id,
        billingDetails,
        paymentMethod,
        paymentDetails,
      });
      res.status(201).json({ message: "Order placed successfully", order });
    } catch (err) { next(err); }
  };

  getMyOrders = async (req, res, next) => {
    try {
      const orders = await this.orderUseCases.getUserOrders(req.user._id);
      res.json(orders);
    } catch (err) { next(err); }
  };

  getOrderById = async (req, res, next) => {
    try {
      const order = await this.orderUseCases.getOrderById(req.params.id, req.user);
      res.json(order);
    } catch (err) { next(err); }
  };

  cancelOrder = async (req, res, next) => {
    try {
      const order = await this.orderUseCases.cancelOrder(req.user._id, req.params.id, req.body?.reason);
      res.json({ message: "Order cancelled", order });
    } catch (err) { next(err); }
  };

  requestReturn = async (req, res, next) => {
    try {
      const order = await this.orderUseCases.requestReturn(req.user._id, req.params.id, req.body?.reason);
      res.json({ message: "Return request submitted", order });
    } catch (err) { next(err); }
  };
}

module.exports = OrderController;
