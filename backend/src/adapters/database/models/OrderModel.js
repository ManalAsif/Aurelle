const mongoose = require("mongoose");

const { ORDER_STATUSES, PAYMENT_METHODS } = require("../../../domain/entities/Order");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, sparse: true }, // sparse: older orders have none
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name:     { type: String },
        image:    { type: String },
        quantity: { type: Number, required: true },
        size:     { type: String, default: "" },
        color:    { type: String, default: "" },
        price:    { type: Number, required: true },
      },
    ],
    billingDetails: {
      firstName:   String,
      lastName:    String,
      company:     String,
      country:     String,
      streetAddress: String,
      city:        String,
      state:       String,
      phone:       String,
      email:       String,
      notes:       String,
    },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: "cod" },
    paymentStatus: { type: String, enum: ["pending","paid","refunded"], default: "pending" },
    // Only non-sensitive references are stored — never full card numbers or CVV
    paymentDetails: {
      cardLast4:    String,
      cardHolder:   String,
      walletNumber: String,
    },
    subtotal:     { type: Number, required: true },
    shippingFee:  { type: Number, default: 0 },
    total:        { type: Number, required: true },
    status:       { type: String, enum: ORDER_STATUSES, default: "pending" },
    cancelReason: { type: String },
    cancelledAt:  { type: Date },
    returnReason: { type: String },
    returnRequestedAt: { type: Date },
    deliveredAt:  { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
