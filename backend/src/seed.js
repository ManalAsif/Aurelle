require("dotenv").config();
require("dotenv").config({ path: "../.env" });
const mongoose  = require("mongoose");
const UserModel    = require("./adapters/database/models/UserModel");
const ProductModel = require("./adapters/database/models/ProductModel");
const FAQModel     = require("./adapters/database/models/FAQModel");
const ReviewModel  = require("./adapters/database/models/ReviewModel");
const OrderModel   = require("./adapters/database/models/OrderModel");
const ContactMessageModel = require("./adapters/database/models/ContactMessageModel");

// Builds one stock entry per size/color. `stock` is a number (same for all) or a map keyed "size|color".
const variants = (sizes, colors, stock) => {
  const out = [];
  for (const size of sizes.length ? sizes : [""]) {
    for (const color of colors.length ? colors : [""]) {
      const s = typeof stock === "number" ? stock : (stock[`${size}|${color}`] ?? stock.default ?? 0);
      out.push({ size, color, stock: s });
    }
  }
  return out;
};

const product = ({ sizes = [], colors = [], stock, ...rest }) => {
  // Products with no size/colour options just use a single stock number
  if (!sizes.length && !colors.length) return { ...rest, sizes, colors, variants: [], stock };
  const v = variants(sizes, colors, stock);
  return { ...rest, sizes, colors, variants: v, stock: v.reduce((n, x) => n + x.stock, 0) };
};

// Images are served by the frontend from /public, so relative paths work on any port/domain
const PRODUCTS = [
  product({ name: "2 Piece Embroidered Suit", description: "Premium lawn fabric with hand embroidery.", price: 4500, category: "suits",
    sizes: ["XS","S","M","L","XL"], colors: ["Ivory","Mint"], stock: { default: 10, "M|Ivory": 2, "XL|Mint": 0 },
    isNewArrival: true, isTrending: false, totalOrdered: 42, images: ["/suit1.jpg"] }),
  product({ name: "3 Piece Embroidered Red", description: "Luxurious 3-piece suit in vibrant red.", price: 6800, category: "3-piece",
    sizes: ["S","M","L","XL","XXL"], colors: ["Red"], stock: { default: 8, "L|Red": 1 },
    isNewArrival: true, isTrending: true, totalOrdered: 78, images: ["/suit2.jpg"] }),
  product({ name: "2 Piece Embroidered Blue", description: "Royal blue fabric with floral embroidery.", price: 5200, category: "2-piece",
    sizes: ["XS","S","M","L"], colors: ["Royal Blue","Navy"], stock: { default: 12, "S|Navy": 2 },
    isNewArrival: true, isTrending: true, totalOrdered: 65, images: ["/suit3.jpg"] }),
  product({ name: "Winter 2 Piece Suit", description: "Warm khaddar 2 piece for winters.", price: 3200, category: "winter",
    sizes: ["S","M","L","XL","XXL"], colors: ["Maroon","Olive"], stock: 10,
    isNewArrival: false, isTrending: true, totalOrdered: 55, images: ["/suit4.jpg"] }),
  product({ name: "Gold Hoop Earrings", description: "18k gold plated hoop earrings.", price: 1800, category: "jewelry",
    colors: ["Gold","Silver"], stock: { "|Gold": 20, "|Silver": 4 },
    isNewArrival: false, isTrending: true, totalOrdered: 90, images: ["/j1.jpg"] }),
  product({ name: "Pearl Necklace Set", description: "Faux pearl necklace with matching earrings.", price: 2400, category: "jewelry",
    stock: 18, isNewArrival: true, isTrending: false, totalOrdered: 33, images: ["/j2.jpg"] }),
  product({ name: "Pink Diamond Pendant", description: "Crystal pendant with rose gold chain.", price: 3100, category: "jewelry",
    stock: 2, isNewArrival: true, isTrending: false, totalOrdered: 28, images: ["/j3.jpg"] }),
  product({ name: "Floral Printed 3 Piece", description: "Floral print cotton with contrast dupatta.", price: 5500, category: "3-piece",
    sizes: ["XS","S","M","L","XL"], colors: ["Peach","Lilac"], stock: { default: 9, "XS|Lilac": 0, "M|Peach": 1 },
    isNewArrival: false, isTrending: false, totalOrdered: 21, images: ["/suit5.jpg"] }),
  product({ name: "Embroidered Kameez", description: "Loose fit embroidered cotton kameez.", price: 2900, category: "2-piece",
    sizes: ["L","XL","XXL"], colors: ["White"], stock: { default: 9, "XXL|White": 1 },
    isNewArrival: false, isTrending: false, totalOrdered: 19, images: ["/suit6.jpg"] }),
];

const FAQS = [
  { question: "What is your shipping policy?", answer: "We offer standard shipping (3-5 days) and express shipping (1-2 days) across Pakistan.", category: "Shipping" },
  { question: "How can I return an item?", answer: "You can request a return within 30 days of delivery from the My Orders page, as long as items are in original condition.", category: "Returns" },
  { question: "Do you offer international shipping?", answer: "Currently, we only ship within Pakistan. We plan to expand to international shipping soon!", category: "Shipping" },
  { question: "What payment methods do you accept?", answer: "We accept Cash on Delivery, Credit/Debit Cards, JazzCash and EasyPaisa.", category: "Payment" },
  { question: "Can I cancel my order?", answer: "Yes — orders that are still pending or processing can be cancelled from the My Orders page.", category: "Orders" },
  { question: "How much is shipping?", answer: "Shipping is free on orders of Rs. 5,000 or more. Otherwise a flat Rs. 250 is charged.", category: "Shipping" },
  { question: "How do I track my order?", answer: "Once your order is shipped, you will receive a tracking number via SMS and email.", category: "Orders" }
];

// Customer accounts (all use password "password123")
const CUSTOMERS = [
  { fullName: "Ayesha Khan",    email: "ayesha@example.com",  city: "Lahore",     phone: "03001234567" },
  { fullName: "Fatima Ali",     email: "fatima@example.com",  city: "Karachi",    phone: "03111234567" },
  { fullName: "Zainab Ahmed",   email: "zainab@example.com",  city: "Islamabad",  phone: "03211234567" },
  { fullName: "Hira Siddiqui",  email: "hira@example.com",    city: "Rawalpindi", phone: "03331234567" },
  { fullName: "Mahnoor Raza",   email: "mahnoor@example.com", city: "Faisalabad", phone: "03451234567" },
  { fullName: "Sana Malik",     email: "sana@example.com",    city: "Multan",     phone: "03021234567" },
  { fullName: "Iqra Hussain",   email: "iqra@example.com",    city: "Peshawar",   phone: "03121234567" },
];

// [customer index, product index, rating, comment]
const REVIEWS = [
  [0, 0, 5, "Beautiful embroidery and the fabric is so soft. Exactly as pictured!"],
  [1, 0, 4, "Lovely suit, runs slightly large so size down."],
  [2, 1, 5, "The red colour is stunning. Got so many compliments at the wedding."],
  [3, 2, 4, "Great quality for the price, delivery was quick."],
  [4, 4, 5, "These hoops are gorgeous and have not tarnished at all."],
  [5, 5, 3, "Nice set but the earrings are a little heavy."],
  [6, 3, 4, "Very warm and comfortable for winter."],
  [0, 6, 5, "Perfect gift, my sister loved the pendant."],
];

const DAY = 86400000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);

// [customer index, [[product index, qty, size, color]], paymentMethod, status, days ago]
const ORDERS = [
  [0, [[0, 1, "S", "Ivory"], [4, 1, "", "Gold"]],  "cod",       "delivered",        20],
  [1, [[1, 1, "M", "Red"]],                        "card",      "delivered",        5],
  [2, [[2, 2, "L", "Navy"]],                       "jazzcash",  "shipped",          3],
  [3, [[5, 1, "", ""]],                            "cod",       "pending",          1],
  [4, [[3, 1, "M", "Maroon"], [6, 1, "", ""]],     "easypaisa", "processing",       2],
  [5, [[8, 1, "XL", "White"]],                     "cod",       "cancelled",        10],
  [6, [[7, 1, "L", "Peach"]],                      "card",      "return_requested", 15],
  [0, [[4, 2, "", "Silver"]],                      "cod",       "pending",          0],
];

// [customer index, subject, message, status]
const MESSAGES = [
  [0, "Order status",     "Hi, when will my order be shipped?", "open"],
  [1, "Size exchange",    "Can I exchange my suit for a smaller size?", "open"],
  [2, "Payment issue",    "My JazzCash payment went through twice, please check.", "resolved"],
  [3, "Product inquiry",  "Will the Pearl Necklace Set be restocked soon?", "open"],
  [4, "Delivery address", "I need to change the delivery address for my order.", "resolved"],
  [5, "Wholesale",        "Do you offer discounts on bulk orders for a boutique?", "open"],
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // Create admin user
  const existing = await UserModel.findOne({ email: "admin@aurelle.com" });
if (!existing) {
  await UserModel.create({
    fullName: "Admin",
    email: "admin@aurelle.com",
    password: "admin123",  // plain text — model will hash it automatically
    isAdmin: true,
  });
  console.log("Admin user created: admin@aurelle.com / admin123");
}
  // Seed products
  await ProductModel.deleteMany({});
  const products = await ProductModel.insertMany(PRODUCTS);
  console.log(`Seeded ${PRODUCTS.length} products`);

  // Seed FAQs
  await FAQModel.deleteMany({});
  await FAQModel.insertMany(FAQS);
  console.log(`Seeded ${FAQS.length} FAQs`);

  // Seed customers — create() (not insertMany) so the password hook hashes each one
  await UserModel.deleteMany({ email: { $in: CUSTOMERS.map((c) => c.email) } });
  const users = [];
  for (const [i, c] of CUSTOMERS.entries()) {
    users.push(await UserModel.create({
      fullName: c.fullName, email: c.email, password: "password123",
      wishlist: [products[i % products.length]._id, products[(i + 3) % products.length]._id],
      // Leave the pearl set (no size/color) in a few carts
      cart: i % 3 === 0 ? [{ product: products[5]._id, quantity: 1 }] : [],
    }));
  }
  console.log(`Seeded ${users.length} customers (password: password123)`);

  // Seed reviews and keep product rating / reviewCount in sync
  await ReviewModel.deleteMany({});
  await ReviewModel.insertMany(REVIEWS.map(([u, p, rating, comment]) => ({
    user: users[u]._id, userName: users[u].fullName, product: products[p]._id, rating, comment,
  })));
  for (const [pi, p] of products.entries()) {
    const ratings = REVIEWS.filter((r) => r[1] === pi).map((r) => r[2]);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    await ProductModel.updateOne({ _id: p._id }, { rating: Math.round(avg * 10) / 10, reviewCount: ratings.length });
  }
  console.log(`Seeded ${REVIEWS.length} reviews`);

  // Seed orders covering every status
  await OrderModel.deleteMany({});
  const orders = ORDERS.map(([u, lines, paymentMethod, status, ago], n) => {
    const c = CUSTOMERS[u];
    const [firstName, lastName] = c.fullName.split(" ");
    const items = lines.map(([pi, quantity, size, color]) => ({
      product: products[pi]._id, name: products[pi].name, image: products[pi].images[0],
      quantity, size, color, price: products[pi].price,
    }));
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingFee = subtotal >= 5000 ? 0 : 250;
    const delivered = ["delivered", "return_requested"].includes(status);
    const paid = paymentMethod !== "cod" || delivered;
    return {
      orderNumber: `AUR-SEED${String(n + 1).padStart(2, "0")}`,
      user: users[u]._id, items,
      billingDetails: { firstName, lastName, country: "Pakistan", streetAddress: `House ${10 + n}, Street ${n + 2}`,
        city: c.city, state: "Punjab", phone: c.phone, email: c.email },
      paymentMethod,
      paymentStatus: status === "cancelled" ? (paid ? "refunded" : "pending") : paid ? "paid" : "pending",
      paymentDetails: paymentMethod === "card" ? { cardLast4: "4242", cardHolder: c.fullName }
        : paymentMethod === "cod" ? {} : { walletNumber: c.phone },
      subtotal, shippingFee, total: subtotal + shippingFee, status,
      ...(delivered && { deliveredAt: daysAgo(Math.max(ago - 3, 0)) }),
      ...(status === "cancelled" && { cancelReason: "Ordered the wrong size", cancelledAt: daysAgo(ago - 1) }),
      ...(status === "return_requested" && { returnReason: "Colour different from picture", returnRequestedAt: daysAgo(2) }),
      createdAt: daysAgo(ago), updatedAt: daysAgo(ago),
    };
  });
  await OrderModel.insertMany(orders);
  console.log(`Seeded ${orders.length} orders`);

  // Seed support messages
  await ContactMessageModel.deleteMany({});
  await ContactMessageModel.insertMany(MESSAGES.map(([u, subject, message, status], n) => ({
    user: users[u]._id, name: users[u].fullName, email: users[u].email, subject, message, status,
    ...(n < 2 && { orderNumber: orders[n].orderNumber }),
  })));
  console.log(`Seeded ${MESSAGES.length} support messages`);

  await mongoose.disconnect();
  console.log("Done!");
}

seed().catch((err) => { console.error(err); process.exit(1); });
