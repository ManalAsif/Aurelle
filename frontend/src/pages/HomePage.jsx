import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getNewArrivals } from "../utils/api";
import { motion } from "framer-motion";
import "../styles/Home.css";

const FAVOURITES = [
  { name: "Trending", tag: "Explore Now!", path: "/trending", image: "/suit3.jpg" },
  { name: "All Under Rs. 4000", tag: "Explore Now!", path: "/catalogue?maxPrice=4000&sort=price_asc", image: "/suit2.jpg" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export default function HomePage() {
  const navigate = useNavigate();
  const [arrivals, setArrivals] = useState([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    getNewArrivals()
      .then(setArrivals)
      .catch(() => setArrivals([]));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <motion.div 
          className="hero__content"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="hero__title">
            LET'S EXPLORE <span className="hero__highlight">UNIQUE</span> CLOTHES.
          </h1>
          <p className="hero__subtitle">Live for influential and innovative fashion!</p>
          <motion.button 
            className="btn-primary" 
            onClick={() => navigate("/catalogue")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Shop Now
          </motion.button>
        </motion.div>
        <motion.div 
          className="hero__img"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <img src="/suit6.jpg" alt="Hero" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </motion.div>
      </section>

      <div className="accent-bar" />

      {/* New Arrivals */}
      <section className="home-section">
        <h2 className="section-title">NEW ARRIVALS</h2>
        <motion.div 
          className="arrivals-grid"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {arrivals.length > 0
            ? arrivals.map((p) => (
                <motion.div 
                  key={p._id} 
                  className="arrival-card" 
                  onClick={() => navigate(`/product/${p._id}`)}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                >
                  <div className="arrival-card__img">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.name} /> : p.name}
                  </div>
                  <div className="arrival-card__footer">
                    <div>
                      <p className="arrival-card__name">{p.name}</p>
                      <p className="arrival-card__tag">Explore Now!</p>
                    </div>
                    <span>→</span>
                  </div>
                </motion.div>
              ))
            : ["Embroided 2 Piece", "3 Piece Dresses", "Winter"].map((name) => (
                <motion.div 
                  key={name} 
                  className="arrival-card" 
                  onClick={() => navigate("/catalogue")}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                >
                  <div className="arrival-card__img">{name}</div>
                  <div className="arrival-card__footer">
                    <div>
                      <p className="arrival-card__name">{name}</p>
                      <p className="arrival-card__tag">Explore Now!</p>
                    </div>
                    <span>→</span>
                  </div>
                </motion.div>
              ))}
        </motion.div>
      </section>

      {/* Payday Sale */}
      <section className="sale-banner">
        <motion.div 
          className="sale-banner__img"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img src="/suit2.jpg" alt="Sale" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </motion.div>
        <motion.div 
          className="sale-banner__content"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="sale-banner__title">PAYDAY<br />SALE NOW</h2>
          <p className="sale-banner__desc">Spend minimal Rs. 5000 get 30% off voucher code for your next purchase</p>
          <p className="sale-banner__dates">1 June – 10 June 2025<br /><span style={{ fontWeight: 400 }}>*Terms & Conditions apply</span></p>
          <button className="btn-primary" onClick={() => navigate("/catalogue")}>SHOP NOW</button>
        </motion.div>
      </section>

      {/* Young's Favourite */}
      <section className="home-section">
        <h2 className="favourites-title">Young's <span className="favourites-cursive">Favourite</span></h2>
        <div className="favourites-grid">
          {FAVOURITES.map((item) => (
            <motion.div 
              key={item.name} 
              className="arrival-card" 
              onClick={() => navigate(item.path)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
            >
              <div className="arrival-card__img" style={{ height: 220 }}>
                <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div className="arrival-card__footer">
                <div>
                  <p className="arrival-card__name">{item.name}</p>
                  <p className="arrival-card__tag">{item.tag}</p>
                </div>
                <span>→</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="newsletter__title">JOIN SHOPPING COMMUNITY TO GET MONTHLY PROMO</h2>
          <p className="newsletter__subtitle">Type your email down below and be young wild generation.</p>
          <div className="newsletter__form">
            <input className="newsletter__input" type="email" placeholder="Add your email here" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="newsletter__btn">SEND</button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
