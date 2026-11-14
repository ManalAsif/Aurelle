// Stock helpers shared by catalogue, product, cart and admin pages.
export const LOW_STOCK_THRESHOLD = 5;

export const hasVariants = (product) => (product?.variants?.length || 0) > 0;

// Stock for one size/color, or the product total when no size/color is given
export function availableStock(product, size = "", color = "") {
  if (!product) return 0;
  if (!hasVariants(product)) return product.stock || 0;
  if (!size && !color) return product.stock || 0;
  return product.variants
    .filter((v) => (!size || v.size === size) && (!color || v.color === color))
    .reduce((sum, v) => sum + v.stock, 0);
}

// Exact stock for a cart line (both size and color known)
export function lineStock(product, size = "", color = "") {
  if (!product) return 0;
  if (!hasVariants(product)) return product.stock || 0;
  const v = product.variants.find((x) => x.size === (size || "") && x.color === (color || ""));
  return v ? v.stock : 0;
}

// Returns { text, level } for a badge, or null when stock is healthy
export function stockStatus(stock) {
  if (stock <= 0) return { text: "Sold out", level: "out" };
  if (stock <= LOW_STOCK_THRESHOLD) return { text: `Only ${stock} left`, level: "low" };
  return null;
}

export const PAYMENT_LABELS = {
  cod: "Cash on Delivery",
  card: "Credit / Debit Card",
  jazzcash: "JazzCash",
  easypaisa: "EasyPaisa",
};

export const STATUS_LABELS = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return Requested",
  returned: "Returned",
};

export const FREE_SHIPPING_FROM = 5000;
export const SHIPPING_FEE = 250;
export const shippingFor = (subtotal) => (subtotal >= FREE_SHIPPING_FROM || subtotal === 0 ? 0 : SHIPPING_FEE);

export const formatRs = (n) => `Rs. ${(n || 0).toLocaleString()}`;
