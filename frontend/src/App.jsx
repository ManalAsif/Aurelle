import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import SupportWidget from "./components/Support/SupportWidget";
import BackgroundEffects from "./components/BackgroundEffects";
import { useAuth } from "./context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

import HomePage          from "./pages/HomePage";
import LoginPage         from "./pages/LoginPage";
import SignupPage        from "./pages/SignupPage";
import CataloguePage     from "./pages/CataloguePage";
import TrendingPage      from "./pages/TrendingPage";
import ProductDetailPage from "./pages/ProductDetailsPage";
import WishlistPage      from "./pages/WishlistPage";
import CartPage          from "./pages/CartPage";
import CheckoutPage      from "./pages/CheckoutPage";
import OrderSuccessPage  from "./pages/OrderSuccessPage";
import AdminDashboard    from "./pages/AdminDashboard";
import OrdersPage        from "./pages/OrdersPage";
import ContactPage       from "./pages/ContactPage";
import SharedWishlistPage from "./pages/SharedWishlistPage";

import "./styles/variables.css";
import "./styles/global.css";
import "./styles/Features.css";

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3, ease: "easeIn" } }
};

function Layout({ children }) {
  const location = useLocation();
  const hideSupport = ["/login", "/signup"].includes(location.pathname);

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ minHeight: "80vh" }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <Footer />
      {!hideSupport && <SupportWidget />}
      <BackgroundEffects />
    </>
  );
}

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;
  return children;
};


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
       <CartProvider>
          <Layout>
            <Routes>
              {/* Public */}
              <Route path="/"           element={<HomePage />} />
              <Route path="/login"      element={<LoginPage />} />
              <Route path="/signup"     element={<SignupPage />} />
              <Route path="/catalogue"  element={<CataloguePage />} />
              <Route path="/trending"   element={<TrendingPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/contact"    element={<ContactPage />} />
              <Route path="/wishlist/shared/:userId" element={<SharedWishlistPage />} />
              <Route path="/admin"       element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              
              {/* Protected */}
              <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
              <Route path="/cart"     element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
              <Route path="/orders"   element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="*"         element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}



