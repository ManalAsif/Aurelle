import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyOrders, cancelOrder, requestReturn } from "../utils/api";
import Toast from "../components/Toast";
import { formatRs, PAYMENT_LABELS, STATUS_LABELS } from "../utils/stock";
import { motion } from "framer-motion";
import "../styles/Pages.css";

const RETURN_WINDOW_DAYS = 30;
const TRACK_STEPS = ["pending", "processing", "shipped", "delivered"];
const RETURN_REASONS = ["Wrong size", "Item damaged or defective", "Colour differs from photo", "Received wrong item", "No longer needed"];

const canCancel = (o) => ["pending", "processing"].includes(o.status);
const canReturn = (o) => {
  if (o.status !== "delivered") return false;
  const delivered = new Date(o.deliveredAt || o.updatedAt);
  return (Date.now() - delivered.getTime()) / 86400000 <= RETURN_WINDOW_DAYS;
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: "cancel" | "return", order }
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getMyOrders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  const replaceOrder = (updated) =>
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? { ...o, ...updated } : o)));

  const handleSubmit = async (reason) => {
    const { type, order } = modal;
    try {
      const res = type === "cancel" ? await cancelOrder(order._id, reason) : await requestReturn(order._id, reason);
      replaceOrder(res.order);
      setToast({ message: res.message, type: "success" });
      setModal(null);
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {modal && <ReasonModal modal={modal} onClose={() => setModal(null)} onSubmit={handleSubmit} />}

      <div className="page-banner">
        <p className="page-banner__label">Account</p>
        <h1 className="page-banner__title">My Orders</h1>
        <div className="breadcrumb">
          <span onClick={() => navigate("/")}>🏠 HOME</span>
          <span>›</span><span>MY ORDERS</span>
        </div>
      </div>

      <div className="orders-page">
        {loading ? (
          <div className="loading-spinner">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="cart-empty">
            <p style={{ fontSize: 40, marginBottom: 12 }}>📦</p>
            <p>You haven't placed any orders yet.</p>
            <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate("/catalogue")}>Start Shopping</button>
          </div>
        ) : (
          orders.map((o, i) => (
            <motion.div key={o._id} className="order-card"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="order-card__head">
                <div>
                  <p className="order-card__number">{o.orderNumber || `#${o._id.slice(-6).toUpperCase()}`}</p>
                  <p className="order-card__date">
                    Placed {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    {" · "}{PAYMENT_LABELS[o.paymentMethod] || "Cash on Delivery"}
                  </p>
                </div>
                <span className={`order-status order-status--${o.status}`}>{STATUS_LABELS[o.status] || o.status}</span>
              </div>

              {TRACK_STEPS.includes(o.status) && <Tracker status={o.status} />}

              <div className="order-card__items">
                {o.items.map((it, idx) => (
                  <div key={idx} className="confirm-item">
                    <div className="confirm-item__img" onClick={() => it.product?._id && navigate(`/product/${it.product._id}`)}>
                      {(it.image || it.product?.images?.[0]) && <img src={it.image || it.product.images[0]} alt={it.name} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="confirm-item__name">{it.name || it.product?.name}</p>
                      <p className="confirm-item__meta">
                        {[it.color, it.size].filter(Boolean).join(" / ")}{(it.color || it.size) && " · "}Qty {it.quantity}
                      </p>
                    </div>
                    <span className="confirm-item__price">{formatRs(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>

              {o.status === "cancelled" && o.cancelReason && <p className="order-card__note">Cancelled: {o.cancelReason}</p>}
              {(o.status === "return_requested" || o.status === "returned") && (
                <p className="order-card__note">
                  {o.status === "returned" ? "Return approved — refund issued." : "Return requested — we'll review it within 2 business days."}
                  {o.returnReason && ` Reason: ${o.returnReason}`}
                </p>
              )}

              <div className="order-card__foot">
                <span className="order-card__total">
                  Total: <strong>{formatRs(o.total)}</strong>
                  {o.paymentStatus === "refunded" && <span className="pay-status pay-status--refunded">Refunded</span>}
                </span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn-outline btn-small" onClick={() => navigate(`/order-success/${o._id}`)}>Details</button>
                  {canCancel(o) && (
                    <button className="btn-outline btn-small btn-danger" onClick={() => setModal({ type: "cancel", order: o })}>Cancel Order</button>
                  )}
                  {canReturn(o) && (
                    <button className="btn-outline btn-small" onClick={() => setModal({ type: "return", order: o })}>Request Return</button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function Tracker({ status }) {
  const current = TRACK_STEPS.indexOf(status);
  return (
    <div className="tracker">
      {TRACK_STEPS.map((s, i) => (
        <div key={s} className={`tracker__step ${i <= current ? "tracker__step--done" : ""}`}>
          <span className="tracker__dot">{i < current ? "✓" : i + 1}</span>
          <span className="tracker__label">{STATUS_LABELS[s]}</span>
        </div>
      ))}
    </div>
  );
}

function ReasonModal({ modal, onClose, onSubmit }) {
  const isReturn = modal.type === "return";
  const [choice, setChoice] = useState(isReturn ? RETURN_REASONS[0] : "");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const reason = [choice, details.trim()].filter(Boolean).join(" — ");
    await onSubmit(reason);
    setBusy(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-box" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{isReturn ? "Request a Return" : "Cancel Order"}</h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
          {isReturn
            ? `Returns are accepted within ${RETURN_WINDOW_DAYS} days of delivery. Items must be unworn with tags attached.`
            : "Are you sure? Items will be released back to stock and any payment will be refunded."}
        </p>
        {isReturn && (
          <div className="checkout-field">
            <label>Reason*</label>
            <select value={choice} onChange={(e) => setChoice(e.target.value)} className="modal-select">
              {RETURN_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        )}
        <div className="checkout-field">
          <label>{isReturn ? "More details (optional)" : "Reason (optional)"}</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Tell us a bit more..." />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-outline" onClick={onClose}>Back</button>
          <button type="submit" className={isReturn ? "btn-purple" : "btn-purple btn-purple--danger"} disabled={busy}>
            {busy ? "Submitting..." : isReturn ? "Submit Return" : "Cancel Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
