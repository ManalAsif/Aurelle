// Stock helpers shared by cart, order and admin use cases.

const LOW_STOCK_THRESHOLD = 5;

const norm = (v) => (v || "").trim();

// Stock available for a given size/color of a product
function availableStock(product, size = "", color = "") {
  if (product.variants && product.variants.length > 0) {
    const v = product.variants.find((x) => (x.size || "") === norm(size) && (x.color || "") === norm(color));
    return v ? v.stock : 0;
  }
  return product.stock || 0;
}

// Throws if the product needs a size/color the caller did not pick
function validateOptions(product, size = "", color = "") {
  if (product.sizes?.length && !norm(size)) throw badRequest("Please select a size");
  if (product.colors?.length && !norm(color)) throw badRequest("Please select a color");
  if (norm(size) && product.sizes?.length && !product.sizes.includes(norm(size)))
    throw badRequest("Selected size is not available");
  if (norm(color) && product.colors?.length && !product.colors.includes(norm(color)))
    throw badRequest("Selected color is not available");
}

// Normalises admin product input: builds sizes/colors from variants and totals stock
function normalizeProductInput(data) {
  const out = { ...data };
  if (out.price !== undefined) out.price = Number(out.price);
  if (Array.isArray(out.variants)) {
    out.variants = out.variants
      .map((v) => ({ size: norm(v.size), color: norm(v.color), stock: Math.max(0, Number(v.stock) || 0) }));
    if (out.variants.length > 0) {
      out.sizes  = [...new Set(out.variants.map((v) => v.size).filter(Boolean))];
      out.colors = [...new Set(out.variants.map((v) => v.color).filter(Boolean))];
      out.stock  = out.variants.reduce((sum, v) => sum + v.stock, 0);
    }
  }
  if (out.stock !== undefined) out.stock = Math.max(0, Number(out.stock) || 0);
  return out;
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}

module.exports = { LOW_STOCK_THRESHOLD, norm, availableStock, validateOptions, normalizeProductInput, badRequest, notFound };
