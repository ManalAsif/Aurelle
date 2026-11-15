import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getProducts, getFilterOptions } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Toast from "../components/Toast";
import StockBadge from "../components/StockBadge";
import { formatRs } from "../utils/stock";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/Catalogue.css";
import "../styles/global.css";

const SORT_OPTIONS = [
  { label: "Newest First",         value: "newest" },
  { label: "Most Popular",         value: "popularity" },
  { label: "Top Rated",            value: "rating" },
  { label: "Price: Low to High",   value: "price_asc" },
  { label: "Price: High to Low",   value: "price_desc" },
  { label: "Alphabetical: A to Z", value: "name_asc" },
  { label: "Alphabetical: Z to A", value: "name_desc" },
];

const CATEGORIES = ["suits", "2-piece", "3-piece", "winter", "jewelry", "trending"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const EMPTY_FILTERS = { minPrice: "", maxPrice: "", size: "", color: "", inStock: false };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export default function CataloguePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loadedKey, setLoadedKey] = useState(null);
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [search, setSearch] = useState(searchInput);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, maxPrice: searchParams.get("maxPrice") || "" });
  const [colorOptions, setColorOptions] = useState([]);
  const [toast, setToast] = useState(null);

  // Debounce typing in the search box
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    getFilterOptions().then((o) => setColorOptions(o.colors || [])).catch(() => {});
  }, []);

  const requestKey = JSON.stringify({ category, sortBy, search, ...filters });
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    getProducts({ category, sortBy, search, ...filters })
      .then((data) => { if (!cancelled) setProducts(data); })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setLoadedKey(requestKey); });
    return () => { cancelled = true; };
  }, [requestKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    // Products with sizes/colors need a choice first
    if (product.sizes?.length || product.colors?.length) { navigate(`/product/${product._id}`); return; }
    if (!user) { navigate("/login"); return; }
    try {
      await addToCart(product._id, 1);
      setToast({ message: "Added to cart!", type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Failed to add to cart", type: "error" });
    }
  };

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const activeFilterCount = Object.entries(filters).filter(([, v]) => v !== "" && v !== false).length;

  // Group by collection only for the default browse view; otherwise keep the sort order in one grid
  const grouped = !category && sortBy === "newest" && !search && activeFilterCount === 0;
  const jewelry = products.filter((p) => p.category?.toLowerCase() === "jewelry");
  const suits   = products.filter((p) => ["suits", "2-piece", "3-piece"].includes(p.category?.toLowerCase()));
  const others  = products.filter((p) => !["jewelry", "suits", "2-piece", "3-piece"].includes(p.category?.toLowerCase()));

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Sort by";
  const card = (p) => <ProductCard key={p._id} product={p} navigate={navigate} onAddToCart={handleAddToCart} />;

  return (
    <div className="catalogue-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-banner">
        <p className="page-banner__label">Shop</p>
        <h1 className="page-banner__title">Catalogue</h1>
        <div className="breadcrumb">
          <span onClick={() => navigate("/")}>🏠 HOME</span>
          <span>›</span><span>CATALOGUE</span>
        </div>
      </div>

      <div className="catalogue-controls">
        <button
          className={`catalogue-controls__filter ${filtersOpen ? "catalogue-controls__filter--open" : ""}`}
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          ⚙ Filter{activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
        </button>
        <select className="catalogue-controls__select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          className="catalogue-controls__search"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <div className="catalogue-controls__sort-wrap">
          <button className="catalogue-controls__sort" onClick={() => setSortOpen(!sortOpen)}>
            ⇅ {sortLabel}
          </button>
          <AnimatePresence>
            {sortOpen && (
              <motion.div
                className="sort-dropdown"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <div key={opt.value}
                    className={`sort-dropdown__item ${sortBy === opt.value ? "sort-dropdown__item--active" : ""}`}
                    onClick={() => { setSortBy(opt.value); setSortOpen(false); }}>
                    {opt.label}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            className="filter-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="filter-panel__inner">
              <div className="filter-group">
                <p className="filter-group__label">Price (Rs.)</p>
                <div className="filter-price">
                  <input type="number" min="0" placeholder="Min" value={filters.minPrice}
                    onChange={(e) => setFilter("minPrice", e.target.value)} />
                  <span>–</span>
                  <input type="number" min="0" placeholder="Max" value={filters.maxPrice}
                    onChange={(e) => setFilter("maxPrice", e.target.value)} />
                </div>
              </div>
              <div className="filter-group">
                <p className="filter-group__label">Size</p>
                <div className="filter-chips">
                  {SIZES.map((s) => (
                    <button key={s} className={`filter-chip ${filters.size === s ? "filter-chip--active" : ""}`}
                      onClick={() => setFilter("size", filters.size === s ? "" : s)}>{s}</button>
                  ))}
                </div>
              </div>
              {colorOptions.length > 0 && (
                <div className="filter-group">
                  <p className="filter-group__label">Color</p>
                  <div className="filter-chips">
                    {colorOptions.map((c) => (
                      <button key={c} className={`filter-chip ${filters.color === c ? "filter-chip--active" : ""}`}
                        onClick={() => setFilter("color", filters.color === c ? "" : c)}>{c}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="filter-group">
                <p className="filter-group__label">Availability</p>
                <label className="filter-check">
                  <input type="checkbox" checked={filters.inStock} onChange={(e) => setFilter("inStock", e.target.checked)} />
                  In stock only
                </label>
                {activeFilterCount > 0 && (
                  <button className="filter-clear" onClick={() => setFilters(EMPTY_FILTERS)}>Clear all filters</button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="catalogue-grid catalogue-grid--padded">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="product-card skeleton">
              <div className="skeleton-img" />
              <div className="product-card__body">
                <div className="skeleton-line" />
                <div className="skeleton-line" style={{ width: '60%' }} />
                <div className="product-card__btns">
                  <div className="skeleton-btn" />
                  <div className="skeleton-btn" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="catalogue-empty">
          No products match your search.
          {activeFilterCount > 0 && (
            <div><button className="btn-outline" style={{ marginTop: 16 }} onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</button></div>
          )}
        </div>
      ) : grouped ? (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {suits.length > 0 && (
            <div className="catalogue-section" id="suits">
              <h2 className="section-title">Suits & 2-Piece/3-Piece</h2>
              <div className="catalogue-grid">{suits.map(card)}</div>
            </div>
          )}
          {others.length > 0 && (
            <div className="catalogue-section">
              <h2 className="section-title">Other Collections</h2>
              <div className="catalogue-grid">{others.map(card)}</div>
            </div>
          )}
          {jewelry.length > 0 && (
            <div className="catalogue-section" id="jewelry">
              <h2 className="section-title">Jewelry Collection</h2>
              <div className="catalogue-grid">{jewelry.map(card)}</div>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div className="catalogue-section" variants={containerVariants} initial="hidden" animate="visible">
          <p className="catalogue-count">{products.length} product{products.length !== 1 && "s"} · {sortLabel}</p>
          <div className="catalogue-grid">{products.map(card)}</div>
        </motion.div>
      )}
    </div>
  );
}

function ProductCard({ product, navigate, onAddToCart }) {
  const [isFlying, setIsFlying] = useState(false);
  const needsOptions = product.sizes?.length || product.colors?.length;
  const soldOut = product.stock <= 0;

  const handleAdd = (e) => {
    if (!needsOptions) {
      setIsFlying(true);
      setTimeout(() => setIsFlying(false), 800);
    }
    onAddToCart(e, product);
  };

  return (
    <motion.div
      className="product-card"
      variants={cardVariants}
      whileHover={{
        y: -10,
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.45)",
        transition: { duration: 0.3 }
      }}
    >
      <div className="product-card__img" onClick={() => navigate(`/product/${product._id}`)}>
        {product.images?.[0] ? <img src={product.images[0]} alt={product.name} /> : product.name}
        <StockBadge stock={product.stock} className="product-card__badge" />
      </div>
      <div className="product-card__body">
        <p className="product-card__name">{product.name}</p>
        <div className="product-card__meta">
          <p className="product-card__price">{formatRs(product.price)}</p>
          {product.rating > 0 && <span className="product-card__rating">★ {product.rating} ({product.reviewCount})</span>}
        </div>
        {product.colors?.length > 0 && (
          <p className="product-card__colors">{product.colors.length} colour{product.colors.length > 1 && "s"} · {product.colors.join(", ")}</p>
        )}
        <div className="product-card__btns">
          <button className="btn-outline" onClick={() => navigate(`/product/${product._id}`)}>View Details</button>
          <motion.button
            className="btn-primary"
            onClick={handleAdd}
            disabled={soldOut}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            style={{ position: 'relative' }}
          >
            {soldOut ? "Sold Out" : needsOptions ? "Select Options" : "Add to Cart"}
            <AnimatePresence>
              {isFlying && (
                <motion.div
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: [0, 100, 200],
                    y: [0, -200, -400],
                    opacity: [1, 1, 0],
                    scale: [1, 0.5, 0.2]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '20px',
                    height: '20px',
                    background: 'var(--primary)',
                    borderRadius: '50%',
                    zIndex: 1000,
                    pointerEvents: 'none'
                  }}
                />
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
