import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { searchProducts } from "../utils/api";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import "../styles/Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount, cartBump } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const isDark = location.pathname === "/login" || location.pathname === "/signup";

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const term = searchTerm.trim();
    const t = setTimeout(async () => {
      if (!term) { setSuggestions([]); return; }
      try {
        const data = await searchProducts(searchTerm);
        setSuggestions(data.slice(0, 5));
      } catch { setSuggestions([]); }
    }, term ? 300 : 0);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setSuggestions([]);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/catalogue?search=${encodeURIComponent(searchTerm)}`);
      setSuggestions([]);
      setSearchTerm("");
    }
  };

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { label: "CATALOGUE", path: "/catalogue" },
    { label: "TRENDING",  path: "/trending" },
    { label: "WISHLIST",  path: "/wishlist" },
    ...(user ? [{ label: "ORDERS", path: "/orders" }] : []),
    { label: "CONTACT",   path: "/contact" },
  ];

  return (
    <>
      <nav className={`navbar ${isDark ? "navbar--dark" : ""}`}>
        <motion.div className="scroll-progress" style={{ scaleX }} />
        <div onClick={() => navigate("/")} className="navbar__logo">
          <Logo color="#ece7f2" />
        </div>

        {!isDark && (
          <div className="navbar__center">
            {navLinks.map(({ label, path }) => (
              <motion.div key={label} whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 400 }}>
                <Link to={path} className={`navbar__link ${isActive(path) ? "navbar__link--active" : ""}`}>
                  {label}
                </Link>
              </motion.div>
            ))}
            {/* Show ADMIN link only to admin users */}
            {user?.isAdmin && (
              <Link to="/admin"
                className={`navbar__link ${isActive("/admin") ? "navbar__link--active" : ""}`}
                style={{ color: "#c77dcc", fontWeight: 700 }}>
                ⚙ ADMIN
              </Link>
            )}
          </div>
        )}

        <div className="navbar__right">
          {!isDark && user && (
            <div className="navbar__search-wrap" ref={searchRef}>
              <form onSubmit={handleSearch}>
                <input
                  className="navbar__search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.ul 
                    className="navbar__suggestions"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {suggestions.map((p) => (
                      <li key={p._id} onClick={() => { navigate(`/product/${p._id}`); setSuggestions([]); setSearchTerm(""); }}>
                        {p.name} — Rs. {p.price}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}

          {!isDark && user && (
            <motion.button 
              className="navbar__cart-btn" 
              onClick={() => navigate("/cart")}
              animate={cartBump ? { 
                scale: [1, 1.3, 1],
                rotate: [0, -10, 10, 0]
              } : {}}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              🛒
              {cartCount > 0 && <span className="navbar__cart-count">{cartCount}</span>}
            </motion.button>
          )}

          {!isDark && !user && (
            <>
              <Link to="/login"  className="navbar__link">Login</Link>
              <button className="navbar__btn" onClick={() => navigate("/signup")}>SIGN UP</button>
            </>
          )}

          {!isDark && user && (
            <button className="navbar__btn" onClick={logout}>LOGOUT</button>
          )}

          {isDark && (
            <button className="navbar__btn--outline" onClick={() => navigate(location.pathname === "/login" ? "/signup" : "/login")}>
              {location.pathname === "/login" ? "SIGN UP" : "LOG IN"}
            </button>
          )}
        </div>

        {/* Hamburger Menu Button */}
        {!isDark && (
          <button 
            className={`navbar__hamburger ${mobileMenuOpen ? "navbar__hamburger--active" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {!isDark && mobileMenuOpen && (
          <>
            <motion.div 
              className="navbar__mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0,0,0,0.6)',
                zIndex: 999
              }}
            />
            <motion.div 
              className="navbar__mobile-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ zIndex: 1000 }}
            >
              {navLinks.map(({ label, path }) => (
                <button
                  key={label}
                  className={`navbar__mobile-link ${isActive(path) ? "navbar__mobile-link--active" : ""}`}
                  onClick={() => handleNavClick(path)}
                >
                  {label}
                </button>
              ))}
              {user?.isAdmin && (
                <button
                  className={`navbar__mobile-link ${isActive("/admin") ? "navbar__mobile-link--active" : ""}`}
                  style={{ color: "#c77dcc", fontWeight: 700 }}
                  onClick={() => handleNavClick("/admin")}
                >
                  ⚙ ADMIN
                </button>
              )}
              {user ? (
                <button
                  className="navbar__mobile-link"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  LOGOUT
                </button>
              ) : (
                <>
                  <button className="navbar__mobile-link" onClick={() => handleNavClick("/login")}>LOGIN</button>
                  <button className="navbar__mobile-link" onClick={() => handleNavClick("/signup")}>SIGN UP</button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
