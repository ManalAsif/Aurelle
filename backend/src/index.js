require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const connectDB    = require("./config/db");
const errorHandler = require("./adapters/http/middleware/errorHandler");

const MongoUserRepository    = require("./adapters/database/repositories/MongoUserRepository");
const MongoProductRepository = require("./adapters/database/repositories/MongoProductRepository");
const MongoOrderRepository   = require("./adapters/database/repositories/MongoOrderRepository");
const MongoReviewRepository  = require("./adapters/database/repositories/MongoReviewRepository");
const MongoFAQRepository     = require("./adapters/database/repositories/MongoFAQRepository");
const MongoContactRepository = require("./adapters/database/repositories/MongoContactRepository");

const AuthUseCases         = require("./application/AuthUseCases");
const ProductUseCases      = require("./application/ProductUseCases");
const OrderUseCases        = require("./application/OrderUseCases");
const WishlistCartUseCases = require("./application/WishlistCartUseCases");
const ReviewUseCases       = require("./application/ReviewUseCases");
const SupportUseCases      = require("./application/SupportUseCases");
const AdminUseCases        = require("./application/AdminUseCases");

const AuthController         = require("./adapters/http/controllers/AuthController");
const ProductController      = require("./adapters/http/controllers/ProductController");
const OrderController        = require("./adapters/http/controllers/OrderController");
const WishlistCartController = require("./adapters/http/controllers/WishlistCartController");
const ReviewController       = require("./adapters/http/controllers/ReviewController");
const SupportController      = require("./adapters/http/controllers/SupportController");
const AdminController        = require("./adapters/http/controllers/AdminController");

const authRoutes    = require("./adapters/http/routes/authRoutes");
const productRoutes = require("./adapters/http/routes/productRoutes");
const orderRoutes   = require("./adapters/http/routes/orderRoutes");
const userRoutes    = require("./adapters/http/routes/userRoutes");
const reviewRoutes  = require("./adapters/http/routes/reviewRoutes");
const supportRoutes = require("./adapters/http/routes/supportRoutes");
const adminRoutes   = require("./adapters/http/routes/adminRoutes");

// Dependency injection
const userRepo    = new MongoUserRepository();
const productRepo = new MongoProductRepository();
const orderRepo   = new MongoOrderRepository();
const reviewRepo  = new MongoReviewRepository();
const faqRepo     = new MongoFAQRepository();
const contactRepo = new MongoContactRepository();

const authUseCases         = new AuthUseCases(userRepo);
const productUseCases      = new ProductUseCases(productRepo);
const orderUseCases        = new OrderUseCases(orderRepo, productRepo, userRepo);
const wishlistCartUseCases = new WishlistCartUseCases(userRepo, productRepo);
const reviewUseCases       = new ReviewUseCases(reviewRepo);
const supportUseCases      = new SupportUseCases(faqRepo, contactRepo);
const adminUseCases        = new AdminUseCases(userRepo, productRepo, orderRepo, contactRepo);

const authController         = new AuthController(authUseCases);
const productController      = new ProductController(productUseCases);
const orderController        = new OrderController(orderUseCases);
const wishlistCartController = new WishlistCartController(wishlistCartUseCases);
const reviewController       = new ReviewController(reviewUseCases);
const supportController      = new SupportController(supportUseCases);
const adminController        = new AdminController(adminUseCases);

const app = express();

// CLIENT_URL may be one URL or a comma-separated list (trailing slashes ignored),
// e.g. https://aurelle.vercel.app. In production only those origins may call the
// API. When unset in development any origin is allowed — a literal "*" in an
// origin list never matches, which blocked every browser request.
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

if (isProduction && !allowedOrigins.length) {
  console.warn("CLIENT_URL is not set — cross-origin requests will be rejected in production.");
}

const corsOptions = {
  origin: allowedOrigins.length ? allowedOrigins : !isProduction,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());

// Redirect root-level requests to /api/ if they are missing the prefix
app.use((req, res, next) => {
  const prefixes = ["/products", "/auth", "/orders", "/reviews", "/support", "/user", "/admin"];
  if (prefixes.some(p => req.url.startsWith(p))) {
    req.url = `/api${req.url}`;
  }
  next();
});

app.use("/images", express.static("public/images"));

app.use("/api/auth",     authRoutes(authController));
app.use("/api/products", productRoutes(productController));
app.use("/api/orders",   orderRoutes(orderController));
app.use("/api/user",     userRoutes(wishlistCartController));
app.use("/api/reviews",  reviewRoutes(reviewController));
app.use("/api/support",  supportRoutes(supportController));
app.use("/api/admin",    adminRoutes(adminController));

// Used by Render to check the service is up
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/", (req, res) => {
  res.json({ message: "Aurelle Boutique API is running smoothly!" });
});

app.use(errorHandler);

connectDB().then(() => {
  console.log("Database connected successfully");
  const PORT = process.env.PORT || 5000;
  if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }
}).catch(err => {
  console.error("Database connection error:", err);
});

module.exports = app;
