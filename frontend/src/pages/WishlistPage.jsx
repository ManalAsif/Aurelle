import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getWishlist, removeFromWishlist } from "../utils/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import StockBadge from "../components/StockBadge";
import { formatRs } from "../utils/stock";
import Toast from "../components/Toast";
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
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 }
};

export default function WishlistPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getWishlist()
      .then(setWishlist)
      .catch(() => setWishlist([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      setWishlist((prev) => prev.filter((p) => (p._id || p) !== productId));
      setToast({ message: "Removed from wishlist", type: "default" });
    } catch {
      setToast({ message: "Failed to remove", type: "error" });
    }
  };

  const handleAddToCart = async (product) => {
    // Sizes/colours must be picked on the product page
    if (product.sizes?.length || product.colors?.length) { navigate(`/product/${product._id}`); return; }
    try {
      await addToCart(product._id, 1);
      setToast({ message: "Added to cart!", type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Failed to add to cart", type: "error" });
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/wishlist/shared/${user.id || user._id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Aurelle Boutique wishlist", url });
      } else {
        await navigator.clipboard.writeText(url);
        setToast({ message: "Wishlist link copied — share it with friends!", type: "success" });
      }
    } catch (err) {
      // User closed the share sheet — not an error worth showing
      if (err?.name !== "AbortError") window.prompt("Copy your wishlist link:", url);
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-banner">
        <p className="page-banner__label">Shop</p>
        <h1 className="page-banner__title">WishList</h1>
        <div className="breadcrumb">
          <span onClick={() => navigate("/")}>🏠 HOME</span>
          <span>›</span><span>WISHLIST</span>
        </div>
      </div>

      <div className="wishlist-page">
        {!loading && wishlist.length > 0 && (
          <div className="wishlist-toolbar">
            <span>{wishlist.length} saved item{wishlist.length !== 1 && "s"}</span>
            <button className="btn-outline btn-small" onClick={handleShare}>🔗 Share Wishlist</button>
          </div>
        )}
        {loading ? (
          <div className="loading-spinner">Loading wishlist...</div>
        ) : wishlist.length === 0 ? (
          <motion.div 
            className="cart-empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p style={{ fontSize: 40, marginBottom: 12 }}>♡</p>
            <p>Your wishlist is empty.</p>
            <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate("/catalogue")}>
              Browse Products
            </button>
          </motion.div>
        ) : (
          <motion.div 
            className="wishlist-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {wishlist.map((p) => {
                const product = p;
                const pid = product._id || product;
                return (
                  <motion.div 
                    key={pid} 
                    className="product-card"
                    variants={itemVariants}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    layout
                  >
                    <div className="product-card__img" onClick={() => navigate(`/product/${pid}`)}>
                      {product.images?.[0] ? <img src={product.images[0]} alt={product.name} /> : product.name || "Product"}
                      <StockBadge stock={product.stock} className="product-card__badge" />
                    </div>
                    <div className="product-card__body">
                      <p className="product-card__name">{product.name || "Product"}</p>
                      <p className="product-card__price">{formatRs(product.price)}</p>
                      <div className="product-card__btns">
                        <button className="btn-primary" disabled={product.stock <= 0} onClick={() => handleAddToCart(product)}>
                          {product.stock <= 0 ? "Sold Out" : product.sizes?.length || product.colors?.length ? "Select Options" : "Add to Cart"}
                        </button>
                        <button className="btn-outline" onClick={() => navigate(`/product/${pid}`)}>View Details</button>
                        <button className="btn-outline" style={{ borderColor: "#ef4444", color: "#ef4444" }} onClick={() => handleRemove(pid)}>
                          Remove ♡
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
