import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTrending } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Toast from "../components/Toast";
import "../styles/Catalogue.css";

export default function TrendingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getTrending()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (e, productId) => {
    e.stopPropagation();
    if (!user) { navigate("/login", { replace: true }); return; }
    try {
      await addToCart(productId, 1);
      setToast({ message: "Added to cart!", type: "success" });
    } catch {
      setToast({ message: "Failed to add to cart", type: "error" });
    }
  };

  return (
    <div className="catalogue-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-banner">
        <p className="page-banner__label">Shop</p>
        <h1 className="page-banner__title">Trending</h1>
        <div className="breadcrumb">
          <span onClick={() => navigate("/")}>🏠 HOME</span>
          <span>›</span><span>TRENDING</span>
        </div>
      </div>

      <div className="catalogue-section">
        <p style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 20 }}>
          Top products ordered by our customers
        </p>

        {loading ? (
          <div className="loading-spinner">Loading trending products...</div>
        ) : products.length === 0 ? (
          <div className="catalogue-empty">No trending products yet.</div>
        ) : (
          <div className="catalogue-grid">
            {products.map((p, i) => (
              <div key={p._id} className="product-card">
                <div
                  className="product-card__img"
                  onClick={() => navigate(`/product/${p._id}`)}
                  style={{ position: "relative" }}
                >
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} /> : p.name}
                  <span style={{
                    position: "absolute", top: 10, left: 10,
                    background: i === 0 ? "#f5c518" : i === 1 ? "#aaa" : i === 2 ? "#cd7f32" : "var(--surface-3)",
                    color: i < 3 ? "#111" : "var(--text)",
                    fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 12
                  }}>
                    #{i + 1} Trending
                  </span>
                </div>
                <div className="product-card__body">
                  <p className="product-card__name">{p.name}</p>
                  <p className="product-card__price">Rs. {p.price}</p>
                  <p style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 8 }}>
                    {p.totalOrdered} orders
                  </p>
                  <div className="product-card__btns">
                    <button className="btn-outline" onClick={() => navigate(`/product/${p._id}`)}>View Details</button>
                    <button className="btn-primary" onClick={(e) => handleAddToCart(e, p._id)}>Add to Cart</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
