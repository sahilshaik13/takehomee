import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { calculateUnitPrice, calculateLineTotal } from '../utils/priceUtils';

const CART_STORAGE_KEY = 'swag_cart';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load cart from localStorage:', err);
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (err) {
        console.error('Failed to save cart to localStorage:', err);
      }
    }
  }, [cartItems, isLoaded]);

  // Add item to cart
  const addToCart = useCallback((product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        // Increment quantity if already in cart
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item
        return [...prevItems, { product, quantity: 1 }];
      }
    });
    
    // Open cart sidebar when adding
    setIsCartOpen(true);
  }, []);

  // Remove item from cart completely
  const removeFromCart = useCallback((productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId)
    );
  }, []);

  // Update quantity for specific item
  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeFromCart]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Open/close cart sidebar
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  // Computed values - NOW WITH TIERED PRICING
  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  // Cart total using tiered pricing calculation
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      return total + calculateLineTotal(item.product, item.quantity);
    }, 0);
  }, [cartItems]);

  // Cart total at base prices (without discounts) for comparison
  const cartTotalBase = useMemo(() => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  }, [cartItems]);

  // Total savings from bulk discounts
  const totalSavings = useMemo(() => {
    return Math.max(0, cartTotalBase - cartTotal);
  }, [cartTotalBase, cartTotal]);

  // Helper to get unit price for an item in cart
  const getItemUnitPrice = useCallback((productId) => {
    const item = cartItems.find((i) => i.product.id === productId);
    if (!item) return 0;
    return calculateUnitPrice(item.product, item.quantity);
  }, [cartItems]);

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    cartTotalBase,
    totalSavings,
    isCartOpen,
    isLoaded,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    getItemUnitPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
