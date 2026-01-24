import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Check, AlertCircle, Sparkles, Loader2, Clock, Users } from 'lucide-react';
import { formatPrice } from '../utils/priceUtils';
import axios from 'axios';
import { useUser } from '../context/UserContext'; 

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CouponModal = ({ isOpen, onClose, cartItems, onApplyCoupon }) => {
  const { user } = useUser(); 
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch available coupons
  const analyzeCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cartData = cartItems.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        category: item.product.category
      }));

      const response = await axios.post(`${API}/coupons/analyze`, {
        cart_items: cartData,
        user_key: user?.key || null 
      });

      setCoupons(response.data);
    } catch (err) {
      console.error('Failed to analyze coupons:', err);
      setError('Failed to load available coupons. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [cartItems, user?.key]);

  // 2. Trigger fetch on open
  useEffect(() => {
    if (isOpen && cartItems.length > 0) {
      analyzeCoupons();
    }
  }, [isOpen, cartItems, analyzeCoupons]);

  // 3. Apply Coupon Logic (Updated to pass rules)
  const handleApply = (coupon) => {
    onApplyCoupon({
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      // --- CRITICAL UPDATES FOR DYNAMIC PRICING ---
      target_category: coupon.target_category || null, 
      min_order_value: coupon.min_order_value || 0,
      savings: coupon.potential_savings // Initial value, recalculated by parent
    });
    onClose();
  };

  const formatExpirationDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            data-testid="coupon-modal-backdrop"
          />

          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              data-testid="coupon-modal"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-blue/10 rounded-full flex items-center justify-center">
                    <Tag className="w-5 h-5 text-brand-blue" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-lg">Available Coupons</h2>
                    <p className="text-sm text-zinc-500">Select a coupon to apply</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                  data-testid="close-coupon-modal"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-brand-blue animate-spin mb-4" />
                    <p className="text-zinc-500 text-sm">Analyzing your cart...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-zinc-300 mb-4" />
                    <p className="text-zinc-600 mb-4">{error}</p>
                    <button
                      onClick={analyzeCoupons}
                      className="text-brand-blue hover:underline font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                ) : coupons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Tag className="w-12 h-12 text-zinc-300 mb-4" />
                    <p className="text-zinc-600">No coupons available at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="coupon-list">
                    {coupons.map((coupon) => {
                      const expirationFormatted = formatExpirationDate(coupon.expiration_date);
                      const usesLeft = coupon.uses_left;
                      const isExpiredOrUsedUp = !coupon.is_applicable && 
                        (coupon.error_reason?.includes('Expired') || coupon.error_reason?.includes('No uses'));
                      
                      return (
                        <motion.div
                          key={coupon.code}
                          className={`border rounded-lg p-4 transition-all ${
                            coupon.is_applicable
                              ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300'
                              : isExpiredOrUsedUp
                                ? 'border-zinc-200 bg-zinc-100/50 opacity-60'
                                : 'border-zinc-200 bg-zinc-50/50'
                          }`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          data-testid={`coupon-card-${coupon.code}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Left: Coupon Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
                                  coupon.is_applicable
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-zinc-200 text-zinc-600'
                                }`}>
                                  {coupon.code}
                                </span>
                                {coupon.discount_type === 'percentage' ? (
                                  <span className="text-xs text-zinc-500">
                                    {coupon.discount_value}% off
                                  </span>
                                ) : (
                                  <span className="text-xs text-zinc-500">
                                    ${coupon.discount_value} off
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm mb-2 ${
                                coupon.is_applicable ? 'text-zinc-700' : 'text-zinc-500'
                              }`}>
                                {coupon.description}
                              </p>
                              
                              {/* Expiration & Usage Info */}
                              <div className="flex flex-wrap gap-3 text-xs">
                                {expirationFormatted && (
                                  <div className={`flex items-center gap-1 ${
                                    coupon.error_reason?.includes('Expired') 
                                      ? 'text-red-500' 
                                      : 'text-zinc-500'
                                  }`}>
                                    <Clock className="w-3 h-3" />
                                    <span>Expires: {expirationFormatted}</span>
                                  </div>
                                )}
                                {coupon.usage_limit !== null && coupon.usage_limit !== undefined && (
                                  <div className={`flex items-center gap-1 ${
                                    usesLeft === 0 
                                      ? 'text-red-500' 
                                      : usesLeft !== null && usesLeft <= 5
                                        ? 'text-amber-600'
                                        : 'text-zinc-500'
                                  }`}>
                                    <Users className="w-3 h-3" />
                                    <span>
                                      {usesLeft !== null && usesLeft !== undefined
                                        ? `${usesLeft} uses left`
                                        : `${coupon.usage_limit - coupon.times_used} uses left`
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right: Status / Action */}
                            <div className="flex-shrink-0 text-right">
                              {coupon.is_applicable ? (
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center gap-1 text-emerald-600">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="font-bold text-lg" data-testid={`savings-${coupon.code}`}>
                                      Save {formatPrice(coupon.potential_savings)}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleApply(coupon)}
                                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
                                    data-testid={`apply-coupon-${coupon.code}`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Apply
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2 text-zinc-500">
                                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  <span className="text-xs text-left" data-testid={`error-${coupon.code}`}>
                                    {coupon.error_reason}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50">
                <p className="text-xs text-zinc-500 text-center">
                  Only one coupon can be applied per order
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CouponModal;