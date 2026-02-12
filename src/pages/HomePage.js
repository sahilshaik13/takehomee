import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { useCart } from '../context/CartContext';
import { 
  ShoppingBag, ShoppingCart, LogOut, Package, 
  Loader2, Clock, AlertCircle, RefreshCw 
} from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import FilterBar from '../components/FilterBar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const { user, isLoggedIn, logout } = useUser();
  const { cartCount, openCart } = useCart();
  
  // Product state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Seed Logic (Runs silently in background)
  const seedProducts = useCallback(async () => {
    try {
      await axios.post(`${API}/seed`);
    } catch (err) {
      console.error('Seed check failed:', err);
    }
  }, []);

  // Fetch Logic
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (debouncedSearch) params.append('search', debouncedSearch);
      
      const response = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(response.data);
    } catch (err) {
      console.error('Fetch products error:', err);
      
      // Detect 500 error (likely schema mismatch)
      if (err.response?.status === 500) {
        setError('Database schema mismatch detected. The data needs to be reset to the new format.');
      } else {
        setError('Failed to load products. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, debouncedSearch]);

  // Force Reset Handler
  const handleForceReset = async () => {
    if(!window.confirm("This will delete all current products and re-seed the database with the correct data. Continue?")) return;
    
    setLoading(true);
    setError(null);
    try {
      // Calls seed with force=true to wipe old data
      await axios.post(`${API}/seed?force=true`);
      await fetchProducts(); // Reload fresh data
    } catch (err) {
      alert("Reset failed: " + (err.response?.data?.detail || err.message));
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    if (isLoggedIn) {
      // Try to seed first, then fetch
      seedProducts().then(() => fetchProducts());
    }
  }, [isLoggedIn, seedProducts, fetchProducts]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header
        className="border-b border-zinc-100 sticky top-0 bg-white/95 backdrop-blur-sm z-40"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-brand-blue" />
            <span className="font-heading font-extrabold text-xl tracking-tight">TAKE-HOME</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/orders" className="hidden sm:flex items-center gap-2 px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors">
              <Clock className="w-4 h-4" /><span className="text-sm font-medium">My Orders</span>
            </Link>
            <button onClick={openCart} className="relative p-2 hover:bg-zinc-100 rounded-full transition-colors">
              <ShoppingCart className="w-5 h-5 text-zinc-700" />
              {cartCount > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={cartCount} className="absolute -top-1 -right-1 bg-brand-blue text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </motion.span>
              )}
            </button>
            <div className="text-right hidden sm:block">
              <p className="font-mono text-xs tracking-widest uppercase text-zinc-400">Welcome back</p>
              <p className="font-heading font-bold text-lg text-zinc-900">{user?.name}</p>
            </div>
            <button onClick={logout} className="p-2 rounded-full hover:bg-zinc-100 transition-colors" title="Logout">
              <LogOut className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-8">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-brand-blue mb-2">Exclusive Collection</p>
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl tracking-tighter text-zinc-900">SWAG CATALOG</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <FilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} productCount={products.length} />
        </motion.div>

        {/* --- ERROR STATE WITH RECOVERY --- */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
            <div className="bg-red-50 p-8 rounded-2xl border border-red-100 text-center max-w-lg shadow-sm">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-heading font-bold text-xl text-red-900 mb-2">System Error</h3>
              <p className="text-sm text-red-600 mb-6 px-4">{error}</p>
              
              <button 
                onClick={handleForceReset}
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto shadow-md hover:shadow-lg transform active:scale-95"
              >
                <RefreshCw className="w-4 h-4" /> 
                Fix & Reset Database
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
              <span className="font-mono text-xs tracking-widest uppercase text-zinc-400">Loading products...</span>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && (
          <motion.div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <AnimatePresence mode="popLayout">
              {products.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-400">
                  <Package className="w-16 h-16 mb-4 opacity-50" />
                  <p>No products found matching your filters.</p>
                  <button onClick={() => {setSearchQuery(''); setSelectedCategory('');}} className="mt-4 text-brand-blue hover:underline text-sm font-medium">Clear Filters</button>
                </div>
              ) : (
                products.map((product, index) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.05 }}>
                    <ProductCard product={product} />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <footer className="border-t border-zinc-100 mt-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-400 text-sm">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span className="font-mono text-xs tracking-widest uppercase">TAKE-HOME 2026</span>
            </div>
            {/* --- ADDED CREDIT HERE --- */}
            <span className="hidden md:block text-zinc-300">|</span>
            <span className="font-mono text-xs text-zinc-500">Made by Mohammed Shaik Sahil</span>
          </div>
          
          <p className="font-body">Your session key: <code className="text-xs bg-zinc-100 px-2 py-1 rounded font-mono">{user?.key?.slice(0, 8)}...</code></p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
