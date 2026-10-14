import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const CartContext = createContext(null);

const DEMO_USER_ID = 'demo-user-001';

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getCart(DEMO_USER_ID);
      setCartItems(response.data.items || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    try {
      const response = await api.addToCart(DEMO_USER_ID, productId, quantity);
      setCartItems(response.data.items || []);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      const response = await api.updateCartItem(DEMO_USER_ID, productId, quantity);
      setCartItems(response.data.items || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    try {
      const response = await api.removeFromCart(DEMO_USER_ID, productId);
      setCartItems(response.data.items || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      await api.clearCart(DEMO_USER_ID);
      setCartItems([]);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const cartTotal = cartItems.reduce((sum, item) => {
    if (item.product) return sum + item.product.price * item.quantity;
    return sum;
  }, 0);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    cartItems,
    cartTotal,
    cartCount,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,
    userId: DEMO_USER_ID,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
