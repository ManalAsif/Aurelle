import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getFAQs, sendContactMessage } from "../utils/api";
import "../styles/Pages.css";

const SUBJECTS = ["Order enquiry", "Returns & refunds", "Sizing help", "Payment issue", "Product question", "Other"];

export default function ContactPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.fullName || "", email: user?.email || "", subject: SUBJECTS[0], orderNumber: "", message: "",
  });
  const [faqs, setFaqs] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getFAQs().then(setFaqs).catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus({ type: "", text: "" });
    try {
      const res = await sendContactMessage(form);
      setStatus({ type: "success", text: res.message });
      setForm((f) => ({ ...f, orderNumber: "", message: "" }));
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="page-banner">
        <p className="page-banner__label">Help</p>
        <h1 className="page-banner__title">Contact Support</h1>
        <div className="breadcrumb">
          <span onClick={() => navigate("/")}>🏠 HOME</span>
          <span>›</span><span>CONTACT</span>
        </div>
      </div>

      <div className="contact-page">
        <div className="contact-layout">
          <form className="checkout-card" onSubmit={handleSubmit}>
            <h3 className="checkout-card__title">Send us a message</h3>
            {status.text && <div className={status.type === "success" ? "form-success" : "auth-error"}>{status.text}</div>}
            <div className="checkout-row">
              <div className="checkout-field">
                <label>Your Name*</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="checkout-field">
                <label>Email*</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
            </div>
            <div className="checkout-row">
              <div className="checkout-field">
                <label>Subject*</label>
                <select name="subject" value={form.subject} onChange={handleChange} className="modal-select">
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="checkout-field">
                <label>Order Number (optional)</label>
                <input name="orderNumber" placeholder="AUR-XXXXXXXX" value={form.orderNumber} onChange={handleChange} />
              </div>
            </div>
            <div className="checkout-field">
              <label>Message*</label>
              <textarea name="message" style={{ height: 120 }} value={form.message} onChange={handleChange} required
                placeholder="How can we help?" />
            </div>
            <button className="btn-place-order" type="submit" disabled={sending}>
              {sending ? "Sending..." : "SEND MESSAGE"}
            </button>
          </form>

          <div>
            <div className="checkout-card">
              <h3 className="checkout-card__title">Other ways to reach us</h3>
              <p className="confirm-text">
                📧 support@aurelle.com<br />
                📞 +92 300 1234567<br />
                🕘 Mon–Sat, 9am – 6pm<br />
                💬 Or use the chat button at the bottom right
              </p>
            </div>
            {faqs.length > 0 && (
              <div className="checkout-card" style={{ marginTop: 16 }}>
                <h3 className="checkout-card__title">Frequently Asked Questions</h3>
                {faqs.map((f) => (
                  <div key={f.id} className="faq-row">
                    <button type="button" className="faq-row__q" onClick={() => setOpenFaq(openFaq === f.id ? null : f.id)}>
                      {f.question}<span>{openFaq === f.id ? "−" : "+"}</span>
                    </button>
                    {openFaq === f.id && <p className="faq-row__a">{f.answer}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
