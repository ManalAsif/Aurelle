import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSharedWishlist } from "../utils/api";
import StockBadge from "../components/StockBadge";
import { formatRs } from "../utils/stock";
import "../styles/Pages.css";
import "../styles/Catalogue.css";

// Read-only wishlist opened from a share link — no login required
export default function SharedWishlistPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSharedWishlist(userId).then(setData).catch((err) => setError(err.message));
  }, [userId]);

  return (
    <div>
      <div className="page-banner">
        <p className="page-banner__label">Shared with you</p>
        <h1 className="page-banner__title">{data ? `${data.ownerName}'s Wishlist` : "Wishlist"}</h1>
        <div className="breadcrumb">
          <span onClick={() => navigate("/")}>🏠 HOME</span>
          <span>›</span><span>SHARED WISHLIST</span>
        </div>
      </div>
      <div className="wishlist-page">
        {error ? (
          <div className="cart-empty">This wishlist link is invalid or no longer available.</div>
        ) : !data ? (
          <div className="loading-spinner">Loading wishlist...</div>
        ) : data.products.length === 0 ? (
          <div className="cart-empty">
            <p style={{ fontSize: 40, marginBottom: 12 }}>♡</p>
            <p>{data.ownerName}'s wishlist is empty for now.</p>
          </div>
        ) : (
          <div className="wishlist-grid">
            {data.products.map((p) => (
              <div key={p._id} className="product-card">
                <div className="product-card__img" onClick={() => navigate(`/product/${p._id}`)}>
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} /> : p.name}
                  <StockBadge stock={p.stock} className="product-card__badge" />
                </div>
                <div className="product-card__body">
                  <p className="product-card__name">{p.name}</p>
                  <p className="product-card__price">{formatRs(p.price)}</p>
                  <div className="product-card__btns">
                    <button className="btn-primary" onClick={() => navigate(`/product/${p._id}`)}>View Product</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button className="btn-outline" onClick={() => navigate("/catalogue")}>Browse the full catalogue</button>
        </div>
      </div>
    </div>
  );
}
