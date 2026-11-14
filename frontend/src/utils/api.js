// Set VITE_API_URL in frontend/.env locally and in the Vercel project settings in production
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    // Some responses like 204 No Content might not have a JSON body
    data = null;
  }

  if (!response.ok) {
    throw new Error((data && data.message) || "An error occurred");
  }
  return data;
};

// Auth
export const registerUser = async ({ fullName, email, password }) => {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ fullName, email, password }),
  });
  localStorage.setItem("token", data.token);
  return data;
};

export const loginUser = async ({ email, password }) => {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("token", data.token);
  return data;
};

export const getMe = async () => {
  return await apiFetch("/auth/me");
};

// Products
export const getProducts = async ({ category, search, sortBy, minPrice, maxPrice, size, color, inStock } = {}) => {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (search) params.append("search", search);
  if (sortBy) params.append("sortBy", sortBy);
  if (minPrice !== undefined && minPrice !== "") params.append("minPrice", minPrice);
  if (maxPrice !== undefined && maxPrice !== "") params.append("maxPrice", maxPrice);
  if (size) params.append("size", size);
  if (color) params.append("color", color);
  if (inStock) params.append("inStock", "true");
  const queryString = params.toString();
  return await apiFetch(`/products${queryString ? `?${queryString}` : ""}`);
};

export const getFilterOptions = async () => {
  return await apiFetch("/products/filters");
};

export const getProduct = async (id) => {
  return await apiFetch(`/products/${id}`);
};

export const getTrending = async () => {
  return await apiFetch("/products/trending");
};

export const getNewArrivals = async () => {
  return await apiFetch("/products/new-arrivals");
};

export const searchProducts = async (q) => {
  return await apiFetch(`/products/search?q=${encodeURIComponent(q)}`);
};

// Wishlist
export const getWishlist = async () => {
  return await apiFetch("/user/wishlist");
};

export const addToWishlist = async (productId) => {
  return await apiFetch(`/user/wishlist/${productId}`, {
    method: "POST",
  });
};

export const removeFromWishlist = async (productId) => {
  return await apiFetch(`/user/wishlist/${productId}`, {
    method: "DELETE",
  });
};

export const getSharedWishlist = async (userId) => {
  return await apiFetch(`/user/wishlist/shared/${userId}`);
};

// Cart
export const getCart = async () => {
  return await apiFetch("/user/cart");
};

export const addToCart = async ({ productId, quantity = 1, size = "", color = "" }) => {
  return await apiFetch("/user/cart", {
    method: "POST",
    body: JSON.stringify({ productId, quantity, size, color }),
  });
};

export const updateCartItem = async ({ productId, quantity, size = "", color = "" }) => {
  return await apiFetch("/user/cart", {
    method: "PUT",
    body: JSON.stringify({ productId, quantity, size, color }),
  });
};

export const removeFromCart = async ({ productId, size = "", color = "" }) => {
  // fetch supports a body in DELETE
  return await apiFetch("/user/cart", {
    method: "DELETE",
    body: JSON.stringify({ productId, size, color }),
  });
};

// Orders
export const placeOrder = async ({ billingDetails, paymentMethod, paymentDetails }) => {
  return await apiFetch("/orders", {
    method: "POST",
    body: JSON.stringify({ billingDetails, paymentMethod, paymentDetails }),
  });
};

export const getMyOrders = async () => {
  return await apiFetch("/orders");
};

export const getOrder = async (id) => {
  return await apiFetch(`/orders/${id}`);
};

export const cancelOrder = async (id, reason) => {
  return await apiFetch(`/orders/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
};

export const requestReturn = async (id, reason) => {
  return await apiFetch(`/orders/${id}/return`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
};

// Reviews
export const getReviews = async (productId) => {
  return await apiFetch(`/reviews/${productId}`);
};

export const addReview = async ({ productId, rating, comment }) => {
  return await apiFetch("/reviews", {
    method: "POST",
    body: JSON.stringify({ productId, rating, comment }),
  });
};

// Support
export const getFAQs = async () => {
  return await apiFetch("/support/faqs");
};

export const sendContactMessage = async ({ name, email, subject, orderNumber, message }) => {
  return await apiFetch("/support/contact", {
    method: "POST",
    body: JSON.stringify({ name, email, subject, orderNumber, message }),
  });
};

export const sendChatMessage = async (message) => {
  return await apiFetch("/support/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
};
