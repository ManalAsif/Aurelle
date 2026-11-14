import { createContext, useContext, useState, useEffect } from "react";
import {
  getCart, addToCart as apiAdd, removeFromCart as apiRemove, updateCartItem as apiUpdate,
} from "../utils/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [userCart, setCart] = useState([]);
  // Logged-out visitors never see a previous user's cart
  const cart = user ? userCart : [];
  const [cartBump, setCartBump] = useState(false);

  useEffect(() => {
    if (user) getCart().then(setCart).catch(() => setCart([]));
  }, [user]);

  const addToCart = async (productId, quantity = 1, size = "", color = "") => {
    const res = await apiAdd({ productId, quantity, size, color });
    setCart(res.cart);
    setCartBump(true);
    setTimeout(() => setCartBump(false), 300);
  };

  const updateQuantity = async (productId, quantity, size = "", color = "") => {
    const res = await apiUpdate({ productId, quantity, size, color });
    setCart(res.cart);
  };

  const removeFromCart = async (productId, size = "", color = "") => {
    const res = await apiRemove({ productId, size, color });
    setCart(res.cart);
  };

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, setCart, addToCart, updateQuantity, removeFromCart, cartCount, cartBump }}>
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);
