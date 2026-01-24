import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, Clock, ArrowRight } from 'lucide-react';

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-8 md:p-12 max-w-lg w-full text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Success Icon */}
        <motion.div
          className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </motion.div>

        {/* Title */}
        <motion.h1
          className="font-heading font-extrabold text-3xl text-zinc-900 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Order Confirmed!
        </motion.h1>

        <motion.p
          className="text-zinc-500 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Thank you for your purchase. Your swag is on its way!
        </motion.p>

        {/* Order ID */}
        {orderId && (
          <motion.div
            className="bg-zinc-50 rounded-lg px-6 py-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            data-testid="order-id-display"
          >
            <p className="text-sm text-zinc-500 mb-1">Order ID</p>
            <p className="font-mono font-bold text-lg text-zinc-900">
              #{orderId.slice(0, 8).toUpperCase()}
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link
            to="/"
            className="w-full bg-black text-white hover:bg-brand-blue transition-all duration-300 px-8 py-4 rounded-full font-heading font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2"
            data-testid="continue-shopping-btn"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </Link>

          <Link
            to="/orders"
            className="w-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-all duration-300 px-8 py-4 rounded-full font-heading font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2"
            data-testid="view-orders-btn"
          >
            <Clock className="w-4 h-4" />
            View Order History
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Footer Note */}
        <motion.p
          className="text-xs text-zinc-400 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          A confirmation email has been sent to your account.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default OrderSuccessPage;
