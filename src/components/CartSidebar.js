import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { X, Trash2, Minus, Plus, ShoppingBag, ArrowRight, Tag, Sparkles } from 'lucide-react';
import { calculateUnitPrice, formatPrice, isGettingBulkDiscount } from '../utils/priceUtils';

const CartSidebar = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    cartCount,
    cartTotal,
    totalSavings,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            data-testid="cart-backdrop"
          />

          {/* Sidebar */}
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            data-testid="cart-sidebar"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-brand-blue" />
                <h2 className="font-heading font-bold text-xl" data-testid="cart-title">
                  Your Cart
                </h2>
                <span className="bg-zinc-100 px-2 py-0.5 rounded-full font-mono text-xs text-zinc-600">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                data-testid="close-cart-btn"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 py-12">
                  <ShoppingBag className="w-16 h-16 text-zinc-200 mb-4" />
                  <h3 className="font-heading font-bold text-lg text-zinc-900 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-zinc-500 text-center text-sm">
                    Add some awesome swag to get started!
                  </p>
                  <button
                    onClick={closeCart}
                    className="mt-6 text-brand-blue hover:underline font-medium text-sm"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100" data-testid="cart-items-list">
                  {cartItems.map((item) => {
                    const unitPrice = calculateUnitPrice(item.product, item.quantity);
                    const lineTotal = unitPrice * item.quantity;
                    const hasBulkDiscount = isGettingBulkDiscount(item.product, item.quantity);
                    const originalPrice = item.product.price;
                    
                    return (
                      <motion.li
                        key={item.product.id}
                        className="p-4 hover:bg-zinc-50 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        layout
                        data-testid={`cart-item-${item.product.id}`}
                      >
                        <div className="flex gap-4">
                          {/* Product Image/Emoji */}
                          <div className="w-16 h-16 bg-zinc-100 flex items-center justify-center flex-shrink-0 relative">
                            <span className="text-3xl">{item.product.image}</span>
                            {hasBulkDiscount && (
                              <div className="absolute -top-1 -right-1 bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                                <Tag className="w-3 h-3" />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-heading font-bold text-sm text-zinc-900 truncate">
                              {item.product.name}
                            </h4>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-xs text-zinc-500">
                                {item.product.category}
                              </span>
                              {hasBulkDiscount && (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 text-[10px] font-mono uppercase">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Bulk Price
                                </span>
                              )}
                            </div>

                            {/* Price per unit */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-xs text-zinc-900">
                                {formatPrice(unitPrice)} each
                              </span>
                              {hasBulkDiscount && unitPrice < originalPrice && (
                                <span className="font-mono text-xs text-zinc-400 line-through">
                                  {formatPrice(originalPrice)}
                                </span>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  className="w-7 h-7 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 transition-colors"
                                  data-testid={`decrease-qty-${item.product.id}`}
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span 
                                  className="w-8 text-center font-mono text-sm font-bold"
                                  data-testid={`qty-${item.product.id}`}
                                >
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  className="w-7 h-7 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 transition-colors"
                                  data-testid={`increase-qty-${item.product.id}`}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <span className="font-heading font-bold text-sm">
                                {formatPrice(lineTotal)}
                              </span>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-2 text-zinc-400 hover:text-brand-red hover:bg-red-50 rounded-full transition-colors self-start"
                            data-testid={`remove-item-${item.product.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-zinc-100 p-6 space-y-4 bg-white">
                {/* Clear Cart */}
                <button
                  onClick={clearCart}
                  className="text-sm text-zinc-500 hover:text-brand-red transition-colors"
                  data-testid="clear-cart-btn"
                >
                  Clear cart
                </button>

                {/* Savings Banner */}
                {totalSavings > 0 && (
                  <motion.div 
                    className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    data-testid="savings-banner"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 text-sm font-medium">
                      You're saving {formatPrice(totalSavings)} with bulk pricing!
                    </span>
                  </motion.div>
                )}

                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="font-body text-zinc-600">Subtotal</span>
                  <span 
                    className="font-heading font-extrabold text-2xl text-zinc-900"
                    data-testid="cart-subtotal"
                  >
                    {formatPrice(cartTotal)}
                  </span>
                </div>

                <p className="text-xs text-zinc-400">
                  Shipping and taxes calculated at checkout
                </p>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-black text-white hover:bg-brand-blue transition-all duration-300 px-8 py-4 rounded-full font-heading font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 group"
                  data-testid="checkout-btn"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
