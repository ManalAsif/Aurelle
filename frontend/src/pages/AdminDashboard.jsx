import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  adminGetProducts, adminAddProduct, adminUpdateProduct,
  adminDeleteProduct, adminUpdateStock, adminGetLowStock,
  adminGetOrders, adminUpdateOrderStatus,
  adminGetMessages, adminUpdateMessageStatus,
  adminGetReports,
} from "../utils/adminApi";
import Toast from "../components/Toast";
import { LOW_STOCK_THRESHOLD, PAYMENT_LABELS, STATUS_LABELS, formatRs } from "../utils/stock";
import "../styles/Admin.css";

const STATUS_LIST = ["pending", "processing", "shipped", "delivered", "cancelled", "return_requested", "returned"];
const FINAL_STATUSES = ["cancelled", "returned"];
const CATEGORIES  = ["suits", "2-piece", "3-piece", "winter", "jewelry", "accessories"];
const SIZES_ALL   = ["XS", "S", "M", "L", "XL", "XXL"];

const variantKey = (size, color) => `${size}|${color}`;

// ── Sub-components ────────────────────────────────────────────────────────────

const ProductModal = ({ product, onClose, onSave }) => {
  const blank = { name: "", price: "", category: "suits", description: "", stock: "", sizes: [], colors: [], images: [], isNewArrival: true, isTrending: false };
  const [form, setForm] = useState(product
    ? { ...blank, ...product, sizes: product.sizes || [], colors: product.colors || [] }
    : blank);
  const [colorInput, setColorInput] = useState("");
  // Stock per size/color combination, keyed "size|color"
  const [variantStock, setVariantStock] = useState(() => {
    const map = {};
    (product?.variants || []).forEach((v) => { map[variantKey(v.size, v.color)] = v.stock; });
    return map;
  });

  const toggle = (e) => setForm({ ...form, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const toggleSize = (s) => {
    const sizes = form.sizes.includes(s) ? form.sizes.filter((x) => x !== s) : SIZES_ALL.filter((x) => x === s || form.sizes.includes(x));
    setForm({ ...form, sizes });
  };

  const addColor = () => {
    const c = colorInput.trim();
    if (c && !form.colors.some((x) => x.toLowerCase() === c.toLowerCase())) setForm({ ...form, colors: [...form.colors, c] });
    setColorInput("");
  };
  const removeColor = (c) => setForm({ ...form, colors: form.colors.filter((x) => x !== c) });

  const useVariants = form.sizes.length > 0 || form.colors.length > 0;
  const rowSizes  = form.sizes.length ? form.sizes : [""];
  const colColors = form.colors.length ? form.colors : [""];
  const variantTotal = rowSizes.reduce((sum, s) => sum + colColors.reduce((n, c) => n + (Number(variantStock[variantKey(s, c)]) || 0), 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, price: Number(form.price) };
    if (useVariants) {
      data.variants = rowSizes.flatMap((s) => colColors.map((c) => ({ size: s, color: c, stock: Number(variantStock[variantKey(s, c)]) || 0 })));
    } else {
      data.variants = [];
      data.stock = Number(form.stock) || 0;
    }
    onSave(data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--wide" onClick={(e) => e.stopPropagation()}>
        <h3>{product ? "Edit Product" : "Add New Product"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="modal-row">
            <div className="modal-field">
              <label>Product Name*</label>
              <input name="name" value={form.name} onChange={toggle} required />
            </div>
            <div className="modal-field">
              <label>Price (Rs)*</label>
              <input name="price" type="number" value={form.price} onChange={toggle} required min="0" />
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label>Category*</label>
              <select name="category" value={form.category} onChange={toggle}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="modal-field">
              <label>Image URL</label>
              <input name="images" value={form.images?.[0] || ""} onChange={(e) => setForm({ ...form, images: e.target.value ? [e.target.value] : [] })} placeholder="/suit1.jpg or https://..." />
            </div>
          </div>
          <div className="modal-field">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={toggle} />
          </div>
          <div className="modal-field">
            <label>Sizes</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {SIZES_ALL.map((s) => (
                <button key={s} type="button"
                  className={`chip-btn ${form.sizes.includes(s) ? "chip-btn--active" : ""}`}
                  onClick={() => toggleSize(s)}>{s}</button>
              ))}
            </div>
          </div>
          <div className="modal-field">
            <label>Colours</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {form.colors.map((c) => (
                <span key={c} className="chip-btn chip-btn--active">
                  {c} <button type="button" className="chip-x" onClick={() => removeColor(c)}>×</button>
                </span>
              ))}
              <input value={colorInput} onChange={(e) => setColorInput(e.target.value)} placeholder="Add colour, press Enter"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }}
                style={{ flex: 1, minWidth: 140 }} />
              <button type="button" className="chip-btn" onClick={addColor}>Add</button>
            </div>
          </div>

          {useVariants ? (
            <div className="modal-field">
              <label>Stock per size / colour <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>— total {variantTotal}</span></label>
              <div className="variant-grid-wrap">
                <table className="variant-grid">
                  <thead>
                    <tr>
                      <th></th>
                      {colColors.map((c) => <th key={c}>{c || "Stock"}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rowSizes.map((s) => (
                      <tr key={s}>
                        <th>{s || "—"}</th>
                        {colColors.map((c) => {
                          const k = variantKey(s, c);
                          const val = variantStock[k] ?? "";
                          const low = val !== "" && Number(val) <= LOW_STOCK_THRESHOLD;
                          return (
                            <td key={c}>
                              <input type="number" min="0" value={val} className={low ? "variant-input--low" : ""}
                                onChange={(e) => setVariantStock({ ...variantStock, [k]: e.target.value })} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="modal-field">
              <label>Stock*</label>
              <input name="stock" type="number" value={form.stock} onChange={toggle} required min="0" />
            </div>
          )}

          <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" name="isNewArrival" checked={form.isNewArrival} onChange={toggle} />
              New Arrival
            </label>
            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" name="isTrending" checked={form.isTrending} onChange={toggle} />
              Trending
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-outline" onClick={onClose} style={{ padding: "9px 20px", fontSize: 13 }}>Cancel</button>
            <button type="submit" className="btn-purple" style={{ padding: "9px 20px", fontSize: 13 }}>
              {product ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Products Tab ──────────────────────────────────────────────────────────────
const ProductsTab = ({ toast }) => {
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | "add" | product object
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    adminGetLowStock().then(setLowStock).catch(() => {});
    return adminGetProducts().then(setProducts).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    try {
      if (modal === "add") await adminAddProduct(data);
      else await adminUpdateProduct(modal._id, data);
      toast("Saved successfully!", "success");
      setModal(null); load();
    } catch (err) { toast(err.message, "error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await adminDeleteProduct(id);
      toast("Product deleted", "default");
      load();
    } catch (err) { toast(err.message, "error"); }
  };

  // Save inline stock edits when the field loses focus
  const handleStockSave = async (product, val, variant) => {
    const stock = Number(val);
    if (!Number.isInteger(stock) || stock < 0) { toast("Stock must be a whole number", "error"); return; }
    try {
      const updated = await adminUpdateStock(product._id, stock, variant);
      setProducts((prev) => prev.map((p) => p._id === product._id ? updated : p));
      adminGetLowStock().then(setLowStock).catch(() => {});
    } catch (err) { toast(err.message, "error"); }
  };

  if (loading) return <div style={{ padding: 40, color: "var(--text-faint)" }}>Loading products...</div>;

  const outCount = lowStock.filter((l) => l.stock === 0).length;

  return (
    <>
      {modal && (
        <ProductModal
          product={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {lowStock.length > 0 && (
        <div className="low-stock-panel">
          <p className="low-stock-panel__title">
            ⚠ Inventory alerts — {lowStock.length} option{lowStock.length !== 1 && "s"} at or below {LOW_STOCK_THRESHOLD} units
            {outCount > 0 && ` (${outCount} sold out)`}
          </p>
          <div className="low-stock-panel__list">
            {lowStock.slice(0, 12).map((l, i) => (
              <span key={i} className={`low-stock-chip ${l.stock === 0 ? "low-stock-chip--out" : ""}`}>
                {l.name}{(l.size || l.color) && ` · ${[l.color, l.size].filter(Boolean).join(" / ")}`}: <strong>{l.stock}</strong>
              </span>
            ))}
            {lowStock.length > 12 && <span className="low-stock-chip">+{lowStock.length - 12} more</span>}
          </div>
        </div>
      )}

      <button className="btn-add-product" onClick={() => setModal("add")}>
        + Add New Product
      </button>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 52 }}></th>
              <th>PRODUCT</th>
              <th>CATEGORY</th>
              <th>PRICE</th>
              <th>STOCK</th>
              <th>SIZES / COLOURS</th>
              <th>SOLD</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const hasVariants = p.variants?.length > 0;
              const low = p.stock <= LOW_STOCK_THRESHOLD;
              return (
                <Fragment key={p._id}>
                  <tr>
                    <td>
                      <div className="admin-product-img">
                        {p.images?.[0] ? <img src={p.images[0]} alt={p.name} /> : "📦"}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: "var(--text-muted)" }}>{p.category}</td>
                    <td>{formatRs(p.price)}</td>
                    <td>
                      {hasVariants ? (
                        <button className={`stock-toggle ${low ? "stock-toggle--low" : ""}`} onClick={() => setExpanded(expanded === p._id ? null : p._id)}>
                          {p.stock} {expanded === p._id ? "▴" : "▾"}
                        </button>
                      ) : (
                        <input type="number" defaultValue={p.stock} min="0" key={`${p._id}-${p.stock}`}
                          className={`stock-input ${low ? "stock-input--low" : ""}`}
                          onBlur={(e) => e.target.value !== String(p.stock) && handleStockSave(p, e.target.value)} />
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 220 }}>
                        {(p.sizes || []).map((s) => <span key={s} className="size-pill">{s}</span>)}
                        {(p.colors || []).map((c) => <span key={c} className="size-pill size-pill--color">{c}</span>)}
                        {!p.sizes?.length && !p.colors?.length && "—"}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{p.totalOrdered || 0}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn-icon btn-icon--edit" title="Edit" onClick={() => setModal(p)}>✏️</button>
                        <button className="btn-icon btn-icon--delete" title="Delete" onClick={() => handleDelete(p._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                  {expanded === p._id && hasVariants && (
                    <tr className="variant-row">
                      <td colSpan={8}>
                        <div className="variant-inline">
                          {p.variants.map((v) => (
                            <label key={variantKey(v.size, v.color)} className="variant-inline__item">
                              <span>{[v.color, v.size].filter(Boolean).join(" / ") || "Default"}</span>
                              <input type="number" min="0" defaultValue={v.stock} key={`${v.size}-${v.color}-${v.stock}`}
                                className={`stock-input ${v.stock <= LOW_STOCK_THRESHOLD ? "stock-input--low" : ""}`}
                                onBlur={(e) => e.target.value !== String(v.stock) && handleStockSave(p, e.target.value, { size: v.size, color: v.color })} />
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────
const OrdersTab = ({ toast }) => {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("");
  const [open,    setOpen]    = useState(null);

  useEffect(() => {
    adminGetOrders(filter ? { status: filter } : {})
      .then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  const handleStatus = async (order, status) => {
    if (FINAL_STATUSES.includes(status) &&
        !window.confirm(`Mark order ${order.orderNumber || ""} as ${STATUS_LABELS[status]}? Stock will be restored and this can't be undone.`)) return;
    try {
      const updated = await adminUpdateOrderStatus(order._id, status);
      setOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, ...updated } : o));
      toast("Status updated", "success");
    } catch (err) { toast(err.message, "error"); }
  };

  if (loading) return <div style={{ padding: 40, color: "var(--text-faint)" }}>Loading orders...</div>;

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["", ...STATUS_LIST].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`filter-pill ${filter === s ? "filter-pill--active" : ""}`}>
            {s ? STATUS_LABELS[s] : "All"}
          </button>
        ))}
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>ITEMS</th><th>TOTAL</th><th>PAYMENT</th><th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <Fragment key={o._id}>
                <tr onClick={() => setOpen(open === o._id ? null : o._id)} style={{ cursor: "pointer" }}>
                  <td style={{ fontWeight: 600 }}>{o.orderNumber || `#${o._id.slice(-6).toUpperCase()}`}</td>
                  <td>
                    {o.user?.fullName || o.billingDetails?.firstName || "—"}
                    <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{o.billingDetails?.city}</div>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-faint)" }}>
                    {new Date(o.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-faint)" }}>{o.items?.reduce((n, it) => n + it.quantity, 0)} item(s)</td>
                  <td style={{ fontWeight: 600 }}>{formatRs(o.total)}</td>
                  <td style={{ fontSize: 12 }}>
                    {PAYMENT_LABELS[o.paymentMethod] || "Cash on Delivery"}
                    <div><span className={`pay-status pay-status--${o.paymentStatus || "pending"}`}>{o.paymentStatus || "pending"}</span></div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select className={`status-select status-select--${o.status}`} value={o.status}
                      disabled={FINAL_STATUSES.includes(o.status)}
                      onChange={(e) => handleStatus(o, e.target.value)}>
                      {STATUS_LIST.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                    {o.status === "return_requested" && <div className="return-flag">Return requested</div>}
                  </td>
                </tr>
                {open === o._id && (
                  <tr className="variant-row">
                    <td colSpan={7}>
                      <div className="order-detail">
                        <div>
                          <p className="order-detail__label">Items</p>
                          {o.items.map((it, i) => (
                            <p key={i} className="order-detail__line">
                              {it.name || it.product?.name} {[it.color, it.size].filter(Boolean).length > 0 && `(${[it.color, it.size].filter(Boolean).join(" / ")})`} × {it.quantity} — {formatRs(it.price * it.quantity)}
                            </p>
                          ))}
                          <p className="order-detail__line">Shipping: {o.shippingFee ? formatRs(o.shippingFee) : "Free"}</p>
                        </div>
                        <div>
                          <p className="order-detail__label">Ship to</p>
                          <p className="order-detail__line">
                            {o.billingDetails?.firstName} {o.billingDetails?.lastName}<br />
                            {o.billingDetails?.streetAddress}, {o.billingDetails?.city}, {o.billingDetails?.state}<br />
                            {o.billingDetails?.phone} · {o.billingDetails?.email}
                          </p>
                          {o.billingDetails?.notes && <p className="order-detail__line">Notes: {o.billingDetails.notes}</p>}
                        </div>
                        <div>
                          {o.paymentDetails?.cardLast4 && <p className="order-detail__line">Card •••• {o.paymentDetails.cardLast4}</p>}
                          {o.paymentDetails?.walletNumber && <p className="order-detail__line">Wallet {o.paymentDetails.walletNumber}</p>}
                          {o.cancelReason && <p className="order-detail__line"><strong>Cancel reason:</strong> {o.cancelReason}</p>}
                          {o.returnReason && <p className="order-detail__line"><strong>Return reason:</strong> {o.returnReason}</p>}
                          {o.status === "return_requested" && (
                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                              <button className="btn-purple btn-small" onClick={() => handleStatus(o, "returned")}>Approve Return</button>
                              <button className="btn-outline btn-small" onClick={() => handleStatus(o, "delivered")}>Reject</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-faint)" }}>No orders found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Messages Tab ──────────────────────────────────────────────────────────────
const MessagesTab = ({ toast }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetMessages().then(setMessages).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const setStatus = async (id, status) => {
    try {
      const updated = await adminUpdateMessageStatus(id, status);
      setMessages((prev) => prev.map((m) => m._id === id ? updated : m));
    } catch (err) { toast(err.message, "error"); }
  };

  if (loading) return <div style={{ padding: 40, color: "var(--text-faint)" }}>Loading messages...</div>;
  if (messages.length === 0) return <div className="admin-table-wrap" style={{ padding: 32, textAlign: "center", color: "var(--text-faint)" }}>No support messages yet.</div>;

  return (
    <div className="messages-list">
      {messages.map((m) => (
        <div key={m._id} className={`message-card ${m.status === "resolved" ? "message-card--resolved" : ""}`}>
          <div className="message-card__head">
            <div>
              <p className="message-card__subject">{m.subject}{m.orderNumber && <span className="message-card__order"> · {m.orderNumber}</span>}</p>
              <p className="message-card__from">{m.name} · <a href={`mailto:${m.email}`}>{m.email}</a> · {new Date(m.createdAt).toLocaleString()}</p>
            </div>
            {m.status === "open"
              ? <button className="btn-purple btn-small" onClick={() => setStatus(m._id, "resolved")}>Mark Resolved</button>
              : <button className="btn-outline btn-small" onClick={() => setStatus(m._id, "open")}>Reopen</button>}
          </div>
          <p className="message-card__body">{m.message}</p>
        </div>
      ))}
    </div>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────
const ReportsTab = () => {
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [month,   setMonth]   = useState(new Date().getMonth() + 1);
  const [year,    setYear]    = useState(new Date().getFullYear());

  useEffect(() => {
    adminGetReports({ month, year })
      .then(setReport).catch(() => {}).finally(() => setLoading(false));
  }, [month, year]);

  if (loading) return <div style={{ padding: 40, color: "var(--text-faint)" }}>Loading reports...</div>;
  if (!report)  return <div style={{ padding: 40, color: "var(--text-faint)" }}>No report data.</div>;

  const { summary, dailySales, topProducts, paymentBreakdown = [] } = report;
  const maxRevenue = Math.max(...(dailySales.map((d) => d.revenue)), 1);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const thisYear = new Date().getFullYear();
  const YEARS = [thisYear - 2, thisYear - 1, thisYear];

  const cards = [
    { label: "Total Orders",       value: summary.totalOrders,    note: "Placed this period",  icon: "🧾", bg: "rgba(14,165,233,0.16)" },
    { label: "Orders Delivered",   value: summary.totalDelivered, note: "Completed",           icon: "📦", bg: "rgba(245,158,11,0.15)" },
    { label: "Pending Orders",     value: summary.totalPending,   note: "Needs attention",     icon: "⏳", bg: "rgba(249,115,22,0.18)", warn: true },
    { label: "Cancelled",          value: summary.totalCancelled, note: "This period",         icon: "✕",  bg: "rgba(239,68,68,0.15)" },
    { label: "Returns",            value: summary.totalReturns || 0, note: "Requested or approved", icon: "↩", bg: "rgba(139,92,246,0.16)" },
    { label: "Total Users",        value: summary.totalUsers,     note: "Registered users",    icon: "👥", bg: "rgba(168,85,247,0.18)" },
  ];

  return (
    <>
      {/* Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <select value={month} onChange={(e) => { setLoading(true); setMonth(Number(e.target.value)); }} className="report-select">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => { setLoading(true); setYear(Number(e.target.value)); }} className="report-select">
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      <div className="reports-grid">
        {cards.map((c) => (
          <div key={c.label} className="report-card">
            <div>
              <p className="report-card__label">{c.label}</p>
              <p className="report-card__value">{c.value.toLocaleString()}</p>
              <p className="report-card__change" style={c.warn ? { color: "#f59e0b" } : undefined}>{c.note}</p>
            </div>
            <div className="report-card__icon" style={{ background: c.bg }}>{c.icon}</div>
          </div>
        ))}
      </div>

      {/* Revenue cards */}
      <div className="reports-grid reports-grid--two">
        <div className="report-card">
          <div>
            <p className="report-card__label">Total Revenue</p>
            <p className="report-card__value" style={{ color: "#c77dcc" }}>{formatRs(summary.totalRevenue)}</p>
            <p className="report-card__change">Excludes cancelled & returned orders</p>
          </div>
          <div className="report-card__icon" style={{ background: "rgba(199,125,204,0.18)" }}>💰</div>
        </div>
        <div className="report-card">
          <div>
            <p className="report-card__label">Average Order Value</p>
            <p className="report-card__value">{formatRs(summary.averageOrderValue || 0)}</p>
            <p className="report-card__change">
              {paymentBreakdown.length > 0
                ? paymentBreakdown.map((p) => `${PAYMENT_LABELS[p.method] || p.method}: ${formatRs(p.revenue)}`).join(" · ")
                : "No sales yet"}
            </p>
          </div>
          <div className="report-card__icon" style={{ background: "rgba(34,197,94,0.15)" }}>📈</div>
        </div>
      </div>

      {/* Daily sales chart */}
      <div className="chart-card">
        <div className="chart-card__header">
          <p className="chart-card__title">Sales Details — {MONTHS[month - 1]} {year}</p>
        </div>
        {dailySales.length === 0 ? (
          <p style={{ color: "var(--text-faint)", fontSize: 13, textAlign: "center", padding: 32 }}>No sales data for this period</p>
        ) : (
          <div className="chart-bar-wrap">
            {dailySales.map((d) => (
              <div key={d.date} className="chart-bar-col">
                <div className="chart-bar" style={{ height: `${Math.round((d.revenue / maxRevenue) * 100)}%` }}
                  title={formatRs(d.revenue)} />
                <span className="chart-bar-label">{d.date.slice(8)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top products */}
      {topProducts.length > 0 && (
        <div className="chart-card">
          <p className="chart-card__title" style={{ marginBottom: 14 }}>Top Products by Revenue</p>
          <table className="top-products-table">
            <thead><tr><th>#</th><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={p.name}>
                  <td style={{ color: "var(--text-faint)", fontWeight: 700 }}>#{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.qty}</td>
                  <td style={{ color: "#c77dcc", fontWeight: 600 }}>{formatRs(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("products");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "default") => setToast({ message, type });

  return (
    <div className="admin-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top bar */}
      <div className="admin-topbar">
        <button className="admin-topbar__logout" onClick={() => { logout(); navigate("/login"); }}>
          Logout
        </button>
      </div>

      {/* Banner */}
      <div className="admin-banner">
        <p className="admin-banner__label">Aurelle Boutique</p>
        <h1 className="admin-banner__title">ADMIN DASHBOARD</h1>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {[
          { id: "products", icon: "📦", label: "Products & Inventory" },
          { id: "orders",   icon: "🛒", label: "Orders" },
          { id: "messages", icon: "✉️", label: "Support" },
          { id: "reports",  icon: "📊", label: "Reports" },
        ].map((t) => (
          <button key={t.id} className={`admin-tab ${tab === t.id ? "admin-tab--active" : ""}`}
            onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="admin-content">
        {tab === "products" && <ProductsTab toast={showToast} />}
        {tab === "orders"   && <OrdersTab   toast={showToast} />}
        {tab === "messages" && <MessagesTab toast={showToast} />}
        {tab === "reports"  && <ReportsTab />}
      </div>
    </div>
  );
}

export default AdminDashboard;
