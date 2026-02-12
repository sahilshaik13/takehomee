import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { ShoppingBag, Sparkles, ArrowRight, Cookie, ShieldAlert, Check } from 'lucide-react';

const LoginModal = ({ isOpen }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [showConsentWarning, setShowConsentWarning] = useState(false);
  
  const { login, error } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    // 1. Check Consent
    if (!hasConsented) {
      setShowConsentWarning(true);
      return;
    }

    setIsSubmitting(true);
    await login(name);
    setIsSubmitting(false);
  };

  const handleAgree = () => {
    setHasConsented(true);
    setShowConsentWarning(false);
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="login-modal-overlay"
        >
          {/* --- MAIN MODAL CONTAINER --- */}
          <motion.div
            className="bg-white/95 backdrop-blur-xl border border-zinc-200 shadow-2xl p-8 md:p-12 max-w-md w-full relative overflow-hidden rounded-2xl"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            data-testid="login-modal"
          >
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-bl-full" />

            {/* --- CONSENT WARNING OVERLAY (The "Main Popup" if they tried to skip) --- */}
            <AnimatePresence>
              {showConsentWarning && (
                <motion.div 
                  className="absolute inset-0 z-20 bg-white/98 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="font-heading font-bold text-2xl text-zinc-900 mb-2">
                    Action Required
                  </h3>
                  <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                    To provide you with a secure shopping session, we need to store a temporary key on your device. Without this permission, we cannot create your cart.
                  </p>
                  <div className="flex flex-col gap-3 w-full">
                    <button
                      onClick={handleAgree}
                      className="w-full bg-brand-blue text-white py-3 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-brand-blue/90 transition-colors"
                    >
                      I Agree & Continue
                    </button>
                    <button
                      onClick={() => setShowConsentWarning(false)}
                      className="w-full text-zinc-400 py-3 text-xs hover:text-zinc-600 font-medium"
                    >
                      Back
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- STANDARD LOGIN FORM --- */}
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

            <motion.p
              className="text-center text-zinc-400 text-xs mt-8 font-body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              No account needed. Just your name.
              <br />
              {/* --- ADDED NOTE HERE --- */}
              <span className="block mt-2 opacity-50 font-mono tracking-wide">
                Made by Mohammed Shaik Sahil
              </span>
            </motion.p>
          </motion.div>

          {/* --- BOTTOM LEFT CONSENT TOAST (The initial prompt) --- */}
          <AnimatePresence>
            {!hasConsented && !showConsentWarning && (
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50, scale: 0.9 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="fixed bottom-4 left-4 z-[60] max-w-[280px] md:max-w-sm bg-white border border-zinc-200 shadow-2xl p-4 rounded-xl flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-zinc-100 rounded-lg shrink-0">
                    <Cookie className="w-5 h-5 text-zinc-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 mb-1">Session Rights</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      We use local storage to save your cart items and session key. This is required to shop.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-1">
                  <button 
                     onClick={handleAgree}
                     className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors flex items-center gap-2"
                  >
                    <Check className="w-3 h-3" />
                    Agree & Proceed
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
