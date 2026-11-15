import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProduct, getReviews, addReview, addToWishlist, removeFromWishlist, getWishlist } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Toast from "../components/Toast";
import StockBadge from "../components/StockBadge";
import { availableStock, lineStock, hasVariants, stockStatus, formatRs, LOW_STOCK_THRESHOLD } from "../utils/stock";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/ProductDetail.css";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeThumb, setActiveThumb] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [toast, setToast] = useState(null);

  // Review form
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getProduct(id)
      .then((p) => {
        setProduct(p);
        // Preselect the only option when there is just one
        setSelectedColor(p.colors?.length === 1 ? p.colors[0] : "");
        setSelectedSize("");
        setQuantity(1);
      })
      .catch(() => navigate("/catalogue"));
    getReviews(id).then(setReviews).catch(() => {});
    if (user) {
      getWishlist().then((wl) => {
        setInWishlist(wl.some((p) => (p._id || p) === id));
      }).catch(() => {});
    }
  }, [id, user, navigate]);

  const [isFlying, setIsFlying] = useState(false);

  if (!product) return <div className="loading-spinner">Loading product...</div>;

  const sizes  = product.sizes || [];
  const colors = product.colors || [];
  const needsSize  = sizes.length > 0;
  const needsColor = colors.length > 0;
  const selectionComplete = (!needsSize || selectedSize) && (!needsColor || selectedColor);

  // Stock for the current selection (exact when complete, otherwise what's left across matching options)
  const selectedStock = selectionComplete
    ? lineStock(product, selectedSize, selectedColor)
    : availableStock(product, selectedSize, selectedColor);
  const inCartQty = cart
    .filter((c) => (c.product?._id || c.product) === id && (c.size || "") === selectedSize && (c.color || "") === selectedColor)
    .reduce((sum, c) => sum + c.quantity, 0);
  const canAddMax = Math.max(0, selectedStock - inCartQty);
  const status = stockStatus(selectedStock);

  const handleAddToCart = async () => {
    if (!user) { navigate("/login"); return; }
    if (needsColor && !selectedColor) { setToast({ message: "Please select a colour", type: "error" }); return; }
    if (needsSize && !selectedSize) { setToast({ message: "Please select a size", type: "error" }); return; }
    setIsFlying(true);
    try {
      await addToCart(id, quantity, selectedSize, selectedColor);
      setToast({ message: `Added ${quantity} to cart!`, type: "success" });
      setQuantity(1);
    } catch (err) {
      setToast({ message: err.message || "Failed to add to cart", type: "error" });
    }
    setTimeout(() => setIsFlying(false), 800);
  };

  const handleWishlist = async () => {
    if (!user) { navigate("/login"); return; }
    try {
      if (inWishlist) {
        await removeFromWishlist(id);
        setInWishlist(false);
        setToast({ message: "Removed from wishlist", type: "default" });
      } else {
        await addToWishlist(id);
        setInWishlist(true);
        setToast({ message: "Added to wishlist!", type: "success" });
      }
    } catch {
      setToast({ message: "Action failed", type: "error" });
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (!rating) { setToast({ message: "Please select a star rating", type: "error" }); return; }
    setSubmitting(true);
    try {
      const review = await addReview({ productId: id, rating, comment });
      setReviews((prev) => [review, ...prev]);
      setRating(0); setComment("");
      setToast({ message: "Review submitted!", type: "success" });
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const images = product.images?.length ? product.images : [];

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-banner">
        <p className="page-banner__label">Shop</p>
        <h1 className="page-banner__title">Product Details</h1>
        <div className="breadcrumb">
          <span onClick={() => navigate("/")}>🏠 HOME</span>
          <span>›</span>
          <span onClick={() => navigate("/catalogue")}>CATALOGUE</span>
          <span>›</span>
          <span>{product.name}</span>
        </div>
      </div>

      <div className="product-detail">
        {product.isNewArrival && (
          <div className="product-detail__header">
            <h2 className="product-detail__heading">New Arrival</h2>
          </div>
        )}

        <div className="product-detail__card">
          {/* Gallery */}
          <div className="gallery">
            <div className="gallery__thumbs">
              {images.length > 0
                ? images.map((img, i) => (
                    <div key={i} className={`gallery__thumb ${activeThumb === i ? "gallery__thumb--active" : ""}`} onClick={() => setActiveThumb(i)}>
                      <img src={img} alt={`thumb-${i}`} />
                    </div>
                  ))
                : ["Front", "Back", "Detail", "Style"].map((t, i) => (
                    <div key={t} className={`gallery__thumb ${activeThumb === i ? "gallery__thumb--active" : ""}`} onClick={() => setActiveThumb(i)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "var(--primary-dark)", fontWeight: 600 }}>
                      {t}
                    </div>
                  ))}
            </div>
            <div className="gallery__main">
              {images[activeThumb] ? <img src={images[activeThumb]} alt={product.name} /> : product.name}
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="product-info__name">{product.name}</h3>
            <div className="product-info__meta">
              <span className="product-info__price">{formatRs(product.price)}</span>
              <span className="product-info__stock">
                {product.rating > 0 ? `⭐ ${product.rating} (${product.reviewCount} review${product.reviewCount !== 1 ? "s" : ""})` : "No ratings yet"}
              </span>
            </div>

            {needsColor && (
              <div className="option-group">
                <p className="option-group__label">Colour: <strong>{selectedColor || "Select"}</strong></p>
                <div className="size-selector">
                  {colors.map((c) => {
                    const left = availableStock(product, selectedSize, c);
                    return (
                      <button key={c}
                        className={`size-btn ${selectedColor === c ? "size-btn--active" : ""} ${left === 0 ? "size-btn--soldout" : ""}`}
                        onClick={() => { setSelectedColor(c); setQuantity(1); }}
                        title={left === 0 ? "Sold out" : `${left} available`}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {needsSize && (
              <div className="option-group">
                <p className="option-group__label">Size: <strong>{selectedSize || "Select"}</strong></p>
                <div className="size-selector">
                  {sizes.map((s) => {
                    const left = availableStock(product, s, selectedColor);
                    return (
                      <button key={s}
                        className={`size-btn ${selectedSize === s ? "size-btn--active" : ""} ${left === 0 ? "size-btn--soldout" : ""}`}
                        disabled={left === 0}
                        onClick={() => { setSelectedSize(s); setQuantity(1); }}
                        title={left === 0 ? "Sold out" : `${left} available`}>
                        {s}
                        {left > 0 && left <= LOW_STOCK_THRESHOLD && <span className="size-btn__dot" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Real-time stock for the current selection */}
            <div className={`stock-line ${status ? `stock-line--${status.level}` : ""}`}>
              {selectionComplete ? (
                selectedStock === 0 ? "✕ Sold out in this option"
                  : status ? `⚠ Hurry! Only ${selectedStock} left in stock`
                  : `✓ In stock (${selectedStock} available)`
              ) : (
                <>
                  {product.stock === 0 ? "✕ Sold out" : `Select ${[needsColor && !selectedColor && "a colour", needsSize && !selectedSize && "a size"].filter(Boolean).join(" and ")} to check availability`}
                  {hasVariants(product) && product.stock > 0 && <StockBadge stock={product.stock} className="stock-line__badge" />}
                </>
              )}
            </div>

            <div className="product-desc">
              <strong>DESCRIPTION</strong>
              <p>{product.description || "Premium quality fabric. Comfortable fit for all occasions."}</p>
              <p style={{ marginTop: 6 }}>Category: {product.category}</p>
            </div>

            {selectionComplete && canAddMax > 0 && (
              <div className="qty-row">
                <span className="option-group__label">Quantity</span>
                <div className="qty-stepper">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>−</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(canAddMax, q + 1))} disabled={quantity >= canAddMax}>+</button>
                </div>
                {inCartQty > 0 && <span className="qty-row__note">{inCartQty} already in cart</span>}
              </div>
            )}

            <div className="product-actions">
              <motion.button
                className="btn-cart"
                onClick={handleAddToCart}
                disabled={product.stock === 0 || (selectionComplete && canAddMax === 0)}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                style={{ position: 'relative' }}
              >
                {product.stock === 0 ? "Sold Out"
                  : selectionComplete && selectedStock === 0 ? "Unavailable"
                  : selectionComplete && canAddMax === 0 ? "Max quantity in cart"
                  : "🛒 Add to cart"}
                <AnimatePresence>
                  {isFlying && (
                    <motion.div
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x: [0, 50, 100],
                        y: [0, -300, -600],
                        opacity: [1, 1, 0],
                        scale: [1, 0.5, 0.2]
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '24px',
                        height: '24px',
                        background: 'var(--primary)',
                        borderRadius: '50%',
                        zIndex: 1000,
                        pointerEvents: 'none'
                      }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
              <button className={`btn-wishlist ${inWishlist ? "btn-wishlist--active" : ""}`} onClick={handleWishlist} title="Wishlist">
                {inWishlist ? "♥" : "♡"}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="reviews">
          <h3 className="reviews__title">Product Reviews</h3>
          <p className="reviews__subtitle">
            {reviews.length > 0 ? `${reviews.length} review${reviews.length !== 1 ? "s" : ""} · average ${product.rating} / 5` : "Review Lists"}
          </p>

          {reviews.map((r) => (
            <div key={r._id} className="review-item">
              <div className="review-item__left">
                <div className="review-avatar">{r.userName?.[0]?.toUpperCase() || "U"}</div>
                <div>
                  <div className="review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  <p className="review-text">{r.comment}</p>
                  <p className="review-name">{r.userName} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}

          {reviews.length === 0 && <p style={{ fontSize: 13, color: "var(--text-faint)", padding: "12px 0" }}>No reviews yet. Be the first!</p>}

          {/* Add review form */}
          {user && (
            <form className="review-form" onSubmit={handleReviewSubmit}>
              <h4>Write a Review</h4>
              <div className="star-input">
                {[1,2,3,4,5].map((s) => (
                  <span key={s}
                    style={{ color: s <= (hoverRating || rating) ? "#f5c518" : "var(--border-strong)" }}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}>★</span>
                ))}
              </div>
              <textarea placeholder="Share your experience with this product..." value={comment} onChange={(e) => setComment(e.target.value)} required />
              <button className="btn-purple" type="submit" disabled={submitting} style={{ padding: "9px 24px", fontSize: 13 }}>
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
          {!user && <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 12 }}>
            <span style={{ color: "var(--primary-dark)", cursor: "pointer" }} onClick={() => navigate("/login")}>Login</span> to write a review.
          </p>}
        </div>
      </div>
    </div>
  );
}
