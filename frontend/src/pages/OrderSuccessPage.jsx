import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrder } from "../utils/api";
import { formatRs, PAYMENT_LABELS } from "../utils/stock";
import "../styles/Pages.css";

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getOrder(id).then(setOrder).catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="order-success">
        <h2 className="order-success__title">Order not found</h2>
        <button className="btn-primary" onClick={() => navigate("/orders")}>View My Orders</button>
      </div>
    );
  }
  if (!order) return <div className="loading-spinner">Loading your order...</div>;

  const b = order.billingDetails || {};
  const paid = order.paymentStatus === "paid";

  return (
    <div className="order-confirm">
      <div className="order-confirm__head">
        <div className="order-success__icon">✅</div>
        <h2 className="order-success__title">THANK YOU, {b.firstName?.toUpperCase()}!</h2>
        <p className="order-success__sub">
          Your order has been placed. We'll keep you updated at <strong>{b.email}</strong>.
        </p>
        <p className="order-success__id">Order number: {order.orderNumber || order._id}</p>
      </div>

      <div className="order-confirm__grid">
        <div className="checkout-card">
          <h3 className="checkout-card__title">Items</h3>
          {order.items.map((it, i) => (
            <div key={i} className="confirm-item">
              <div className="confirm-item__img">{it.image ? <img src={it.image} alt={it.name} /> : null}</div>
              <div style={{ flex: 1 }}>
                <p className="confirm-item__name">{it.name}</p>
                <p className="confirm-item__meta">
                  {[it.color, it.size].filter(Boolean).join(" / ")}{(it.color || it.size) && " · "}Qty {it.quantity}
                </p>
              </div>
              <span className="confirm-item__price">{formatRs(it.price * it.quantity)}</span>
            </div>
          ))}
          <div className="order-totals" style={{ marginTop: 12 }}>
            <div className="order-totals__row"><span>Subtotal</span><span>{formatRs(order.subtotal)}</span></div>
            <div className="order-totals__row"><span>Shipping</span><span>{order.shippingFee ? formatRs(order.shippingFee) : "Free"}</span></div>
            <div className="order-totals__row order-totals__row--bold"><span>Total</span><span>{formatRs(order.total)}</span></div>
          </div>
        </div>

        <div>
          <div className="checkout-card">
            <h3 className="checkout-card__title">Delivery Address</h3>
            <p className="confirm-text">
              {b.firstName} {b.lastName}<br />
              {b.streetAddress}<br />
              {b.city}, {b.state}, {b.country}<br />
              {b.phone}
            </p>
          </div>
          <div className="checkout-card" style={{ marginTop: 16 }}>
            <h3 className="checkout-card__title">Payment</h3>
            <p className="confirm-text">
              {PAYMENT_LABELS[order.paymentMethod] || "Cash on Delivery"}
              {order.paymentDetails?.cardLast4 && ` ending in ${order.paymentDetails.cardLast4}`}
              <br />
              <span className={`pay-status pay-status--${order.paymentStatus}`}>
                {paid ? "Paid" : `Pay ${formatRs(order.total)} on delivery`}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
        <button className="btn-primary" onClick={() => navigate("/orders")}>Track My Orders</button>
        <button className="btn-outline" onClick={() => navigate("/catalogue")}>Continue Shopping</button>
      </div>
    </div>
  );
}
