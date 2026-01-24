import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { calculateUnitPrice, formatPrice, isGettingBulkDiscount } from '../utils/priceUtils';
import CouponModal from '../components/CouponModal';
import { 
  ArrowLeft, ShoppingBag, Tag, Sparkles, Loader2, Package, CreditCard, Percent, X, Plus, Minus, Trash2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useUser();
  
  // Cart Context
  const { 
    cartItems, 
    cartTotalBase, 
    totalSavings, 
    cartCount, 
    clearCart, 
    updateQuantity, 
    removeFromCart 
  } = useCart();

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // --- DYNAMIC PRICING ENGINE ---
  
  // 1. Calculate "Real" Price (Subtotal - Bulk Savings)
  const priceAfterBulk = Math.max(0, cartTotalBase - totalSavings);

  // 2. Calculate Coupon Savings Dynamically (Recalculates when cart changes)
  const dynamicCouponSavings = useMemo(() => {
    if (!appliedCoupon) return 0;

    // A. Check Min Order Requirement
    if (appliedCoupon.min_order_value && priceAfterBulk < appliedCoupon.min_order_value) {
      return 0; // Coupon invalid if cart drops below limit
    }

    // B. Calculate Applicable Amount (Filter by Category)
    let applicableAmount = 0;
    cartItems.forEach(item => {
      // If coupon has NO target category (null), OR item matches the target category
      if (!appliedCoupon.target_category || item.product.category === appliedCoupon.target_category) {
        // Use the BULK unit price for calculation
        const unitPrice = calculateUnitPrice(item.product, item.quantity);
        applicableAmount += (unitPrice * item.quantity);
      }
    });

    // C. Apply Discount Math
    if (appliedCoupon.discount_type === 'percentage') {
      return applicableAmount * (appliedCoupon.discount_value / 100);
    } else {
      // Fixed discount cannot exceed applicable amount
      return Math.min(appliedCoupon.discount_value, applicableAmount);
    }
  }, [appliedCoupon, cartItems, priceAfterBulk]);

  // 3. Clamp final discount so it doesn't exceed total price
  const effectiveDiscount = Math.min(dynamicCouponSavings, priceAfterBulk);

  // 4. Final Total to Charge
  const finalTotal = priceAfterBulk - effectiveDiscount;

  // ------------------------------

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl mb-2">Please log in first</h2>
          <p className="text-zinc-500 mb-4">You need to be logged in to checkout.</p>
          <Link to="/" className="text-brand-blue hover:underline font-medium">Go to Home</Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <header className="bg-white border-b border-zinc-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link to="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to Shop</span>
            </Link>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <ShoppingBag className="w-20 h-20 text-zinc-200 mx-auto mb-6" />
          <h2 className="font-heading font-bold text-2xl text-zinc-900 mb-3">Your cart is empty</h2>
          <Link to="/" className="inline-flex items-center gap-2 bg-black text-white hover:bg-brand-blue transition-all duration-300 px-8 py-4 rounded-full font-heading font-bold uppercase tracking-widest text-xs">
            <ShoppingBag className="w-4 h-4" /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const handleApplyCoupon = (coupon) => setAppliedCoupon(coupon);
  const handleRemoveCoupon = () => setAppliedCoupon(null);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: calculateUnitPrice(item.product, item.quantity),
        category: item.product.category
      }));

      const response = await axios.post(`${API}/checkout`, {
        user_key: user.key,
        user_name: user.name,
        items: orderItems,
        coupon_code: appliedCoupon?.code || null,
        discount_amount: effectiveDiscount,
        subtotal: cartTotalBase,
        total_amount: finalTotal
      });

      if (response.data.success) {
        clearCart();
        navigate(`/checkout/success?order_id=${response.data.order_id}`);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.detail || 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <CouponModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        cartItems={cartItems}
        onApplyCoupon={handleApplyCoupon}
      />

      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Shop</span>
          </Link>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-blue" />
            <span className="font-heading font-bold">TAKE-HOME</span>
          </div>
          <div className="text-right text-sm hidden sm:block">
            <span className="text-zinc-500">Logged in as </span>
            <span className="font-medium text-zinc-900">{user?.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading font-extrabold text-3xl md:text-4xl tracking-tight text-zinc-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
                <h2 className="font-heading font-bold text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-brand-blue" />
                  Review Your Order
                </h2>
                <span className="text-sm text-zinc-500">{cartCount} items</span>
              </div>

              <ul className="divide-y divide-zinc-100">
                <AnimatePresence>
                  {cartItems.map((item) => {
                    const originalPrice = item.product.price;
                    const bulkPrice = calculateUnitPrice(item.product, item.quantity);
                    const lineTotalOriginal = originalPrice * item.quantity;
                    const lineTotalBulk = bulkPrice * item.quantity;
                    const hasBulkDiscount = isGettingBulkDiscount(item.product, item.quantity);
                    const isMaxStock = item.quantity >= item.product.stock;

                    return (
                      <motion.li 
                        key={item.product.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-6 py-6 flex flex-col sm:flex-row gap-6"
                      >
                        {/* Image */}
                        <div className="w-20 h-20 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-center flex-shrink-0 text-4xl shadow-sm">
                          {item.product.image}
                        </div>

                        {/* Info & Controls */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-heading font-bold text-zinc-900 text-lg">{item.product.name}</h3>
                              <p className="text-sm text-zinc-500 mb-1">{item.product.category}</p>
                              
                              {hasBulkDiscount && (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                                  <Sparkles className="w-3 h-3" />
                                  Bulk Pricing Active
                                </span>
                              )}
                            </div>

                            {/* Price Display */}
                            <div className="text-right">
                              {hasBulkDiscount ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-xs text-zinc-400 line-through decoration-zinc-400">
                                    {formatPrice(lineTotalOriginal)}
                                  </span>
                                  <span className="font-heading font-bold text-lg text-emerald-600">
                                    {formatPrice(lineTotalBulk)}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-heading font-bold text-lg text-zinc-900">
                                  {formatPrice(lineTotalOriginal)}
                                </span>
                              )}
                              <div className="text-xs text-zinc-400 mt-1">
                                {formatPrice(bulkPrice)} each
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-auto">
                            {/* Quantity Controls */}
                            <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-lg p-1">
                              <button 
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
                              >
                                <Minus className="w-4 h-4 text-zinc-600" />
                              </button>
                              <span className="w-10 text-center font-mono font-bold text-sm text-zinc-900">
                                {item.quantity}
                              </span>
                              <button 
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                disabled={isMaxStock}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
                              >
                                <Plus className="w-4 h-4 text-zinc-600" />
                              </button>
                            </div>

                            {/* Delete Button */}
                            <button 
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-sm text-zinc-400 hover:text-red-500 flex items-center gap-1.5 transition-colors group"
                            >
                              <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          </div>
                          
                          {isMaxStock && (
                            <p className="text-[10px] text-red-500 mt-2 font-medium">
                              Max stock reached ({item.product.stock} available)
                            </p>
                          )}
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
              
              {/* Savings Footer */}
              {totalSavings > 0 && (
                <div className="px-6 py-3 bg-emerald-50 border-t border-emerald-100">
                  <p className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Total Bulk Savings: {formatPrice(totalSavings)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-zinc-200 sticky top-24">
              <div className="px-6 py-4 border-b border-zinc-100">
                <h2 className="font-heading font-bold text-lg">Order Summary</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Coupon Section */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Discount Code</label>
                  {appliedCoupon ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-mono font-bold text-emerald-700">{appliedCoupon.code}</span>
                          <p className="text-xs text-emerald-600">
                            {/* DYNAMIC SAVINGS DISPLAY */}
                            Saving {formatPrice(effectiveDiscount)}
                          </p>
                        </div>
                      </div>
                      <button onClick={handleRemoveCoupon} className="p-1 hover:bg-emerald-100 rounded-full text-emerald-600">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ) : (
                    <button 
                      onClick={() => setShowCouponModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-zinc-300 rounded-lg text-zinc-600 hover:border-brand-blue hover:text-brand-blue transition-colors"
                    >
                      <Percent className="w-4 h-4" />
                      <span className="font-medium">View Available Coupons</span>
                    </button>
                  )}
                  {/* Warning if Coupon Logic invalidates it */}
                  {appliedCoupon && effectiveDiscount === 0 && (
                    <p className="text-xs text-red-500 mt-2">
                      Coupon criteria (e.g. min order) no longer met.
                    </p>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-3 pt-4 border-t border-zinc-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(cartTotalBase)}</span>
                  </div>
                  
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Bulk Savings</span>
                      <span>-{formatPrice(totalSavings)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Coupon Discount</span>
                    <span className={`font-medium ${effectiveDiscount > 0 ? 'text-red-600' : ''}`}>
                      {effectiveDiscount > 0 ? `-${formatPrice(effectiveDiscount)}` : '$0.00'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-heading font-bold text-lg">Total</span>
                    <span className="font-heading font-extrabold text-2xl text-zinc-900">{formatPrice(finalTotal)}</span>
                  </div>
                  {effectiveDiscount > 0 && (
                    <p className="text-right text-xs text-emerald-600 font-medium">
                      You saved {formatPrice(effectiveDiscount + totalSavings)} total!
                    </p>
                  )}
                </div>

                {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className={`w-full px-8 py-4 rounded-full font-heading font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all duration-300 ${
                    isProcessing ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed' : 'bg-brand-blue text-white hover:bg-black'
                  }`}
                >
                  {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><CreditCard className="w-4 h-4" /> Place Order</>}
                </button>
                
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 pt-2">
                  <CreditCard className="w-4 h-4" /> <span>Secure checkout powered by TAKE-HOME</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;