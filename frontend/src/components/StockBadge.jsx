import { stockStatus } from "../utils/stock";

// "Only 2 left" / "Sold out" pill. Renders nothing when stock is healthy.
export default function StockBadge({ stock, className = "" }) {
  const status = stockStatus(stock);
  if (!status) return null;
  return <span className={`stock-badge stock-badge--${status.level} ${className}`}>{status.text}</span>;
}
