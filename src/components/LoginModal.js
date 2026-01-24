import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';

const LoginModal = ({ isOpen }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    await login(name);
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="login-modal-overlay"
        >
          <motion.div
            className="bg-white/95 backdrop-blur-xl border border-zinc-200 shadow-2xl p-8 md:p-12 max-w-md w-full relative overflow-hidden"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            data-testid="login-modal"
          >
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-bl-full" />
            
            {/* Header */}
            <div className="relative mb-10">
              <motion.div
                className="flex items-center gap-2 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ShoppingBag className="w-5 h-5 text-brand-blue" />
                <span className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-400">
                  Exclusive Access
                </span>
              </motion.div>

              <motion.h2
                className="font-heading font-extrabold text-4xl md:text-5xl tracking-tighter leading-[0.95] text-zinc-900"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                JOIN THE
                <br />
                <span className="text-brand-blue">DROP</span>
              </motion.h2>
            </div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="mb-8">
                <label
                  htmlFor="guest-name"
                  className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-400 mb-3 block"
                >
                  Your Name
                </label>
                <input
                  id="guest-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-transparent border-b-2 border-zinc-200 focus:border-brand-blue outline-none py-4 text-xl md:text-2xl font-heading font-bold placeholder:text-zinc-300 transition-colors duration-300"
                  data-testid="guest-name-input"
                  autoComplete="off"
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <motion.p
                  className="text-brand-red text-sm mb-4 font-medium"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  data-testid="login-error"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={!name.trim() || isSubmitting}
                className="w-full bg-black text-white hover:bg-brand-blue disabled:bg-zinc-300 disabled:cursor-not-allowed transition-all duration-300 px-8 py-4 rounded-full font-heading font-bold uppercase tracking-widest text-xs shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:hover:translate-y-0 disabled:hover:shadow-lg flex items-center justify-center gap-3 group"
                data-testid="guest-login-btn"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Start Shopping</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </motion.form>

            {/* Footer note */}
            <motion.p
              className="text-center text-zinc-400 text-xs mt-8 font-body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              No account needed. Just your name.
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
