import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Toast from "../components/Toast";
import StockBadge from "../components/StockBadge";
import { lineStock, shippingFor, formatRs, FREE_SHIPPING_FROM } from "../utils/stock";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/Pages.css";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart } = useCart();
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState(null);

  const subtotal = cart.reduce((sum, c) => sum + (c.product?.price || 0) * c.quantity, 0);
  const shipping = shippingFor(subtotal);
  const itemCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const overStock = cart.some((c) => c.quantity > lineStock(c.product, c.size, c.color));

  const lineKey = (item) => `${item.product?._id}-${item.size}-${item.color}`;

  const run = async (item, fn) => {
    setBusy(lineKey(item));
    try { await fn(); }
    catch (err) { setToast({ message: err.message, type: "error" }); }
    finally { setBusy(null); }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="page-banner">
        <p className="page-banner__label">Shop</p>
        <h1 className="page-banner__title">Your Cart</h1>
        <div className="breadcrumb">
          <span onClick={() => navigate("/")}>🏠 HOME</span>
          <span>›</span><span>CART</span>
        </div>
      </div>

      <div className="cart-page">
        {cart.length === 0 ? (
          <motion.div
            className="cart-empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p style={{ fontSize: 40, marginBottom: 12 }}>🛒</p>
            <p>Your cart is empty.</p>
            <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate("/catalogue")}>
              Continue Shopping
            </button>
          </motion.div>
        ) : (
          <>
            <motion.div
              className="cart-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {cart.map((item) => {
                  const p = item.product;
                  const stock = lineStock(p, item.size, item.color);
                  const isBusy = busy === lineKey(item);
                  return (
                    <motion.div
                      key={lineKey(item)}
                      className="cart-item"
                      variants={itemVariants}
                      exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                      layout
                    >
                      <div className="cart-item__img" onClick={() => navigate(`/product/${p?._id}`)}>
                        {p?.images?.[0] ? <img src={p.images[0]} alt={p.name} /> : p?.name || "Product"}
                      </div>
                      <div className="cart-item__info">
                        <p className="cart-item__name">{p?.name || "Product"}</p>
                        {(item.size || item.color) && (
                          <p className="cart-item__size">
                            {[item.color && `Colour: ${item.color}`, item.size && `Size: ${item.size}`].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        <p className="cart-item__price">
                          {formatRs(p?.price)} × {item.quantity}
                          <span style={{ marginLeft: 8, fontWeight: 400, color: "var(--text-faint)", fontSize: 12 }}>
                            = {formatRs((p?.price || 0) * item.quantity)}
                          </span>
                        </p>
                        {item.quantity > stock ? (
                          <p className="cart-item__warning">
                            {stock === 0 ? "This option just sold out — please remove it." : `Only ${stock} left — please reduce the quantity.`}
                          </p>
                        ) : (
                          <StockBadge stock={stock} />
                        )}
                      </div>
                      <div className="qty-stepper qty-stepper--small">
                        <button
                          disabled={isBusy || item.quantity <= 1}
                          onClick={() => run(item, () => updateQuantity(p._id, item.quantity - 1, item.size, item.color))}
                          aria-label="Decrease quantity">−</button>
                        <span>{item.quantity}</span>
                        <button
                          disabled={isBusy || item.quantity >= stock}
                          onClick={() => run(item, () => updateQuantity(p._id, item.quantity + 1, item.size, item.color))}
                          aria-label="Increase quantity">+</button>
                      </div>
                      <button className="cart-item__remove" title="Remove" disabled={isBusy}
                        onClick={() => run(item, () => removeFromCart(p?._id, item.size, item.color))}>✕</button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            <motion.div
              className="cart-summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="cart-summary__row">
                <span>Subtotal ({itemCount} item{itemCount !== 1 && "s"})</span>
                <span>{formatRs(subtotal)}</span>
              </div>
              <div className="cart-summary__row">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatRs(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="cart-summary__hint">Add {formatRs(FREE_SHIPPING_FROM - subtotal)} more for free shipping</p>
              )}
              <div className="cart-summary__row cart-summary__row--total">
                <span>Total</span>
                <span>{formatRs(subtotal + shipping)}</span>
              </div>
              <motion.button
                className="btn-purple cart-summary__btn"
                onClick={() => navigate("/checkout")}
                disabled={overStock}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Proceed to Checkout →
              </motion.button>
              {overStock && <p className="cart-item__warning" style={{ marginTop: 8 }}>Fix the highlighted items to continue.</p>}
              <button className="btn-outline cart-summary__btn" style={{ marginTop: 8 }} onClick={() => navigate("/catalogue")}>
                Continue Shopping
              </button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
