import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { formatPrice } from '../utils/priceUtils';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Package, 
  Clock, 
  Tag,
  CheckCircle,
  Loader2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrderHistoryPage = () => {
  const { isLoggedIn, user } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Wrap fetchOrders in useCallback to stabilize the function reference
  const fetchOrders = useCallback(async () => {
    if (!user?.key) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API}/orders/history?user_key=${user.key}`);
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load order history');
    } finally {
      setLoading(false);
    }
  }, [user?.key]); // Re-create only if user.key changes

  // 2. Add fetchOrders to the useEffect dependency array
  useEffect(() => {
    if (isLoggedIn && user?.key) {
      fetchOrders();
    }
  }, [isLoggedIn, user, fetchOrders]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Package className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl mb-2">Please log in</h2>
          <p className="text-zinc-500 mb-4">You need to be logged in to view your orders.</p>
          <Link to="/" className="text-brand-blue hover:underline font-medium">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors"
            data-testid="back-to-shop"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Shop</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-blue" />
            <span className="font-heading font-bold">TAKE-HOME</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading font-extrabold text-3xl text-zinc-900 mb-2">
            Order History
          </h1>
          <p className="text-zinc-500">
            View all your past orders and their details
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchOrders}
              className="text-brand-blue hover:underline font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && orders.length === 0 && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Package className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
            <h3 className="font-heading font-bold text-xl text-zinc-900 mb-2">
              No orders yet
            </h3>
            <p className="text-zinc-500 mb-6">
              Start shopping to see your order history here.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-black text-white hover:bg-brand-blue transition-all duration-300 px-8 py-4 rounded-full font-heading font-bold uppercase tracking-widest text-xs"
              data-testid="start-shopping-btn"
            >
              <ShoppingBag className="w-4 h-4" />
              Start Shopping
            </Link>
          </motion.div>
        )}

        {/* Orders List */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4" data-testid="orders-list">
            {orders.map((order, index) => (
              <motion.div
                key={order.order_id}
                className="bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                data-testid={`order-${order.order_id}`}
              >
                {/* Order Header */}
                <div className="px-6 py-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-mono text-sm text-zinc-500">
                        Order #{order.order_id.slice(0, 8).toUpperCase()}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(order.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium uppercase">
                      {order.status || 'Completed'}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  <ul className="space-y-3">
                    {order.items.map((item, itemIndex) => (
                      <li 
                        key={itemIndex}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-400">×{item.quantity}</span>
                          <span className="text-zinc-900">{item.name}</span>
                        </div>
                        <span className="text-zinc-600">
                          {formatPrice(item.price_at_purchase * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Order Footer */}
                <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {order.discount_amount > 0 && (
                        <div className="flex items-center gap-1 text-red-600 text-sm">
                          <Tag className="w-3 h-3" />
                          <span>
                            Discount: -{formatPrice(order.discount_amount)}
                            {order.coupon_code_used && (
                              <span className="ml-1 text-zinc-500">
                                ({order.coupon_code_used})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 text-sm mr-2">Total:</span>
                      <span className="font-heading font-bold text-lg text-zinc-900">
                        {formatPrice(order.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderHistoryPage;