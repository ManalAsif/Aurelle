# Aurelle Boutique – Women’s Clothing E-Commerce Platform

**BSCS 7A · Web Programming Project** — Manal Asif, Razan Siddique

## 📌 Project Overview

Aurelle Boutique is a web-based e-commerce platform designed for women’s clothing. Customers can browse, search, and purchase dresses online, while administrators manage products, inventory, and customer orders. The platform focuses on delivering a smooth, user-friendly shopping experience supported by efficient backend management.

## 🎯 Features

### 👤 User Features

* User registration and login
* Browse and search products
* Filter (price range, size, colour, in-stock) and sort products (price, popularity, newest, rating, name)
* View product details and stock availability per size and colour
* Add/remove items to cart and update cart quantity
* Wishlist management (add, remove, view, **share via public link**)
* Place orders and view order history with a status tracker
* Cancel orders (while pending/processing) and submit return requests (within 30 days of delivery)
* Submit and view product reviews
* Contact customer support (contact form, FAQs, and chat assistant)

### 🛒 Shopping Features

* Real-time stock visibility per size and colour
* Low-stock alerts (e.g., “Only 2 left”) and sold-out indicators
* Secure checkout — server-side validation, stock reserved atomically, card numbers never stored (only last 4 digits)
* Multiple payment methods: Cash on Delivery, Credit/Debit Card, JazzCash, EasyPaisa
* Order confirmation page with order number (e.g. `AUR-XXXXXXXX`)
* Free shipping on orders of Rs. 5,000+, otherwise Rs. 250

### 🧑‍💼 Admin Features

* Admin login
* Add, update, and delete products (with a size × colour stock grid)
* Manage inventory — inline stock edits per variant and a low-stock alert panel
* View and manage customer orders (payment details, shipping address, cancel/return reasons)
* Update order status, approve or reject returns (stock and refunds handled automatically)
* View customer support messages
* View sales reports (revenue, average order value, payment-method breakdown, top products)

## 🏗 System Architecture

The system follows a **Layered Architecture**:

* **Presentation Layer** – React frontend (`frontend/`)
* **Application Layer** – Express routes and controllers (`backend/src/adapters/http`)
* **Business Logic Layer** – Use cases for cart, orders, payments, admin (`backend/src/application`)
* **Data Access Layer** – Repositories (`backend/src/adapters/database/repositories`)
* **Database Layer** – MongoDB models for users, products, orders, reviews, FAQs and support messages

## 🧩 Technologies Used

* Frontend: React 19, React Router, Framer Motion, Vite
* Backend: Node.js, Express
* Database: MongoDB (Mongoose)
* Tools: Git, Draw.io, VS Code

## 🚀 Running Locally

Requirements: Node.js 18+ and a MongoDB database (local install, Docker, or MongoDB Atlas).

```bash
# 1. Backend
cd backend
cp .env.example .env        # then set MONGO_URI and JWT_SECRET
npm install
npm run seed                # optional: sample products, FAQs and an admin account
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

`frontend/.env` points the app at the API (`VITE_API_URL=http://localhost:5000/api`).

Seeded admin login: **admin@aurelle.com / admin123** (change this before deploying).

## ☁️ Deployment

The database runs on **MongoDB Atlas**, the backend on **Render** and the frontend on **Vercel**. Do the steps in this order, because each one needs a URL from the one before.

### 1. Database — MongoDB Atlas

1. Create a free **M0** cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access** → add a database user with a strong password.
3. **Network Access** → add `0.0.0.0/0` (Render's free tier has no fixed IP).
4. **Connect → Drivers** → copy the connection string and add the database name:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/aurelle?retryWrites=true&w=majority`
5. Optional: load sample data by putting this URI in `backend/.env` and running `npm run seed`.

### 2. Backend — Render

1. On [render.com](https://render.com): **New → Blueprint**, then pick this repository. Render reads [`render.yaml`](render.yaml) (root dir `backend`, `npm ci`, `npm start`, health check `/api/health`).
2. Fill in the environment variables it asks for:

   | Variable | Value |
   |---|---|
   | `MONGO_URI` | the Atlas connection string |
   | `CLIENT_URL` | the Vercel URL from step 3, e.g. `https://aurelle.vercel.app` (comma-separate several) |
   | `GROQ_API_KEY` | optional, for the support chatbot |

   `JWT_SECRET` is generated automatically and `NODE_ENV` is set to `production`.
3. When the deploy finishes, open `https://<service>.onrender.com/api/health`. It should return `{"status":"ok"}`.

> The free plan sleeps after 15 minutes without traffic. The first request after that takes about 30 seconds.

### 3. Frontend — Vercel

1. On [vercel.com](https://vercel.com): **Add New → Project**, import this repository and set the **Root Directory** to `frontend` (framework: Vite).
2. Add the environment variable `VITE_API_URL` = `https://<service>.onrender.com/api`.
3. Deploy. [`frontend/vercel.json`](frontend/vercel.json) rewrites every path to `index.html`, so React Router pages still load when refreshed.
4. Copy the Vercel URL into `CLIENT_URL` on Render and redeploy the backend.

### CORS

In production the API only accepts browser requests from the origins listed in `CLIENT_URL`. If the frontend shows network/CORS errors, check that `CLIENT_URL` exactly matches the Vercel URL (`https://`, no trailing path). In development, when `CLIENT_URL` is empty, every origin is allowed.

### Checklist

- [ ] `backend/.env` and `frontend/.env` are **not** committed (both are in `.gitignore`)
- [ ] Atlas user password and `JWT_SECRET` are strong and not shared in chat or code
- [ ] The seeded admin password has been changed
- [ ] `VITE_API_URL` changes only take effect after a Vercel redeploy, because Vite bakes it in at build time

## 📊 System Modules

* User Management
* Product Browsing
* Cart & Wishlist
* Order Processing
* Review Management
* Admin Management
