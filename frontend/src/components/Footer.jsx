import { Link } from "react-router-dom";
import Logo from "./Logo";
import "../styles/Pages.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div>
        <Logo color="#fff" />
        <p className="footer__brand">Elegant women's clothing and accessories, delivered across Pakistan.</p>
        <div className="footer__socials">
          {["f", "in"].map((s) => <div key={s} className="footer__social">{s}</div>)}
        </div>
      </div>
      <div>
        <p className="footer__heading">Shop</p>
        <p className="footer__info">
          <Link to="/catalogue">Catalogue</Link><br />
          <Link to="/trending">Trending</Link><br />
          <Link to="/orders">My Orders</Link>
        </p>
      </div>
      <div>
        <p className="footer__heading">Help</p>
        <p className="footer__info">
          <Link to="/contact">Contact Support</Link><br />
          support@aurelle.com<br />
          +92 300 1234567
        </p>
      </div>
    </footer>
  );
}
