import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { placeOrder } from "../utils/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { shippingFor, formatRs, PAYMENT_LABELS } from "../utils/stock";
import "../styles/Pages.css";

const PAYMENT_OPTIONS = [
  { id: "cod",       icon: "💵", hint: "Pay in cash when your order arrives" },
  { id: "card",      icon: "💳", hint: "Visa, Mastercard, UnionPay" },
  { id: "jazzcash",  icon: "📱", hint: "Pay from your JazzCash wallet" },
  { id: "easypaisa", icon: "📲", hint: "Pay from your EasyPaisa wallet" },
];

// Luhn checksum — catches typos in card numbers
const luhnValid = (num) => {
  let sum = 0, double = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (double) { d *= 2; if (d > 9) d -= 9; }
    sum += d; double = !double;
  }
  return num.length >= 13 && sum % 10 === 0;
};

const expiryValid = (mmYY) => {
  const m = /^(\d{2})\/(\d{2})$/.exec(mmYY);
  if (!m) return false;
  const month = Number(m[1]), year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, setCart } = useCart();
  const [nameFirst, ...nameRest] = (user?.fullName || "").split(" ");
  const [billing, setBilling] = useState({
    firstName: nameFirst || "", lastName: nameRest.join(" "), company: "", country: "Pakistan",
    streetAddress: "", city: "", state: "", phone: "", email: user?.email || "", notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [card, setCard] = useState({ number: "", holder: "", expiry: "", cvv: "" });
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = cart.reduce((sum, c) => sum + (c.product?.price || 0) * c.quantity, 0);
  const shipping = shippingFor(subtotal);

  const handleChange = (e) => setBilling({ ...billing, [e.target.name]: e.target.value });

  const handleCardChange = (e) => {
    let { name, value } = e.target;
    if (name === "number") value = value.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
    if (name === "expiry") {
      value = value.replace(/\D/g, "").slice(0, 4);
      if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    if (name === "cvv") value = value.replace(/\D/g, "").slice(0, 4);
    setCard({ ...card, [name]: value });
  };

  // Returns an error message, or the payment details safe to send to the server
  const buildPayment = () => {
    if (paymentMethod === "card") {
      const digits = card.number.replace(/\s/g, "");
      if (!luhnValid(digits)) return { error: "Please enter a valid card number" };
      if (!card.holder.trim()) return { error: "Please enter the name on the card" };
      if (!expiryValid(card.expiry)) return { error: "Card expiry date is invalid or in the past" };
      if (!/^\d{3,4}$/.test(card.cvv)) return { error: "Please enter a valid CVV" };
      // Only the last 4 digits ever leave the browser
      return { details: { cardLast4: digits.slice(-4), cardHolder: card.holder.trim() } };
    }
    if (paymentMethod === "jazzcash" || paymentMethod === "easypaisa") {
      const num = wallet.replace(/[\s-]/g, "");
      if (!/^03\d{9}$/.test(num)) return { error: "Enter your wallet number as 03XXXXXXXXX" };
      return { details: { walletNumber: num } };
    }
    return { details: {} };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payment = buildPayment();
    if (payment.error) { setError(payment.error); return; }
    setLoading(true);
    try {
      const res = await placeOrder({ billingDetails: billing, paymentMethod, paymentDetails: payment.details });
      setCart([]);
      navigate(`/order-success/${res.order._id}`, { replace: true });
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="order-success">
        <p className="order-success__icon">🛒</p>
        <h2 className="order-success__title">Cart is Empty</h2>
        <button className="btn-primary" onClick={() => navigate("/catalogue")}>Shop Now</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-banner">
        <p className="page-banner__label">Shop</p>
        <h1 className="page-banner__title">Checkout</h1>
        <div className="breadcrumb">
          <span onClick={() => navigate("/")}>🏠 HOME</span>
          <span>›</span>
          <span onClick={() => navigate("/cart")}>CART</span>
          <span>/</span>
          <span>CHECKOUT</span>
        </div>
      </div>

      <div className="checkout-page">
        {error && <div className="auth-error" style={{ maxWidth: 920, margin: "0 auto 16px" }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="checkout-layout">
            <div>
              <div className="checkout-card">
                <h3 className="checkout-card__title">Billing Details</h3>
                <div className="checkout-row">
                  <div className="checkout-field">
                    <label>First Name*</label>
                    <input name="firstName" placeholder="First Name" value={billing.firstName} onChange={handleChange} required />
                  </div>
                  <div className="checkout-field">
                    <label>Last Name*</label>
                    <input name="lastName" placeholder="Last Name" value={billing.lastName} onChange={handleChange} required />
                  </div>
                </div>
                {[
                  { name: "company",       label: "Company Name (optional)" },
                  { name: "country",       label: "Country / Region*",    required: true },
                  { name: "streetAddress", label: "Street Address*",      required: true },
                  { name: "city",          label: "Town / City*",         required: true },
                  { name: "state",         label: "Province / State*",    required: true },
                  { name: "phone",         label: "Phone*",               required: true, type: "tel", placeholder: "03XX XXXXXXX" },
                  { name: "email",         label: "Email Address*",       required: true, type: "email" },
                ].map((f) => (
                  <div key={f.name} className="checkout-field">
                    <label>{f.label}</label>
                    <input name={f.name} type={f.type || "text"} placeholder={f.placeholder || f.label.replace("*", "")}
                      value={billing[f.name]} onChange={handleChange} required={f.required} />
                  </div>
                ))}
                <div className="checkout-field">
                  <label>Order Notes (optional)</label>
                  <textarea name="notes" placeholder="Notes about your order" value={billing.notes} onChange={handleChange} />
                </div>
              </div>

              <div className="checkout-card" style={{ marginTop: 20 }}>
                <h3 className="checkout-card__title">Payment Method</h3>
                <div className="payment-options">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <label key={opt.id} className={`payment-option ${paymentMethod === opt.id ? "payment-option--active" : ""}`}>
                      <input type="radio" name="paymentMethod" value={opt.id}
                        checked={paymentMethod === opt.id} onChange={() => setPaymentMethod(opt.id)} />
                      <span className="payment-option__icon">{opt.icon}</span>
                      <span>
                        <span className="payment-option__label">{PAYMENT_LABELS[opt.id]}</span>
                        <span className="payment-option__hint">{opt.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>

                {paymentMethod === "card" && (
                  <div className="payment-details">
                    <div className="checkout-field">
                      <label>Card Number*</label>
                      <input name="number" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456"
                        value={card.number} onChange={handleCardChange} />
                    </div>
                    <div className="checkout-field">
                      <label>Name on Card*</label>
                      <input name="holder" autoComplete="cc-name" placeholder="As printed on the card"
                        value={card.holder} onChange={handleCardChange} />
                    </div>
                    <div className="checkout-row">
                      <div className="checkout-field">
                        <label>Expiry (MM/YY)*</label>
                        <input name="expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY"
                          value={card.expiry} onChange={handleCardChange} />
                      </div>
                      <div className="checkout-field">
                        <label>CVV*</label>
                        <input name="cvv" type="password" inputMode="numeric" autoComplete="cc-csc" placeholder="•••"
                          value={card.cvv} onChange={handleCardChange} />
                      </div>
                    </div>
                  </div>
                )}

                {(paymentMethod === "jazzcash" || paymentMethod === "easypaisa") && (
                  <div className="payment-details">
                    <div className="checkout-field">
                      <label>{PAYMENT_LABELS[paymentMethod]} Mobile Number*</label>
                      <input inputMode="tel" placeholder="03XXXXXXXXX" value={wallet} onChange={(e) => setWallet(e.target.value)} />
                    </div>
                    <p className="payment-note">You'll receive a prompt on your phone to approve the payment.</p>
                  </div>
                )}

                <p className="secure-note">🔒 Secure checkout — card details are checked in your browser and never stored on our servers.</p>
              </div>
            </div>

            <div className="order-summary-card">
              <h3 className="order-summary-card__title">Your Order</h3>
              <table className="order-table">
                <thead><tr><th>Product</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {cart.map((item, i) => (
                    <tr key={i}>
                      <td>
                        {item.product?.name} ×{item.quantity}
                        {(item.size || item.color) && (
                          <span className="order-table__variant">{[item.color, item.size].filter(Boolean).join(" / ")}</span>
                        )}
                      </td>
                      <td>{formatRs((item.product?.price || 0) * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="order-totals">
                <div className="order-totals__row"><span>Subtotal</span><span>{formatRs(subtotal)}</span></div>
                <div className="order-totals__row"><span>Shipping</span><span>{shipping === 0 ? "Free" : formatRs(shipping)}</span></div>
                <div className="order-totals__row order-totals__row--bold"><span>Total</span><span>{formatRs(subtotal + shipping)}</span></div>
              </div>
              <div className="coupon-bar">Paying with: <strong>{PAYMENT_LABELS[paymentMethod]}</strong></div>
              <button className="btn-place-order" type="submit" disabled={loading}>
                {loading ? "Placing Order..." : `PLACE ORDER · ${formatRs(subtotal + shipping)}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
