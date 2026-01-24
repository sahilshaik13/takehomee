import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, Plus, Minus, Trash2, Search, 
  CheckCircle2, X, Loader2, Save, ShoppingBag, 
  History, AlertTriangle, Layers, RefreshCw, AlertCircle,
  ToggleLeft, ToggleRight, Edit3, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '../utils/priceUtils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StockManager = () => {
  // Views: 'inventory' | 'history' | 'tiers'
  const [activeView, setActiveView] = useState('inventory');
  
  // Data State
  const [products, setProducts] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Inventory Edit State
  const [pendingChanges, setPendingChanges] = useState({}); 
  const [isSaving, setIsSaving] = useState(false);
  
  // Tiers Edit State
  const [selectedProductForTiers, setSelectedProductForTiers] = useState(null);
  const [tierEdits, setTierEdits] = useState([]); // Temporary state for editing tiers
  const [isTierSaving, setIsTierSaving] = useState(false);

  // UI State
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingViewSwitch, setPendingViewSwitch] = useState(null);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', category: 'Clothing', stock: 0, description: '', image: '📦',
    pricing_tiers: [] 
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- Data Fetching ---
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/products`);
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
      setError("Database schema mismatch detected. Please reset the database.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/stock/history`);
      setHistoryLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch history");
    } finally {
      setLoading(false);
    }
  };

  // --- FORCE RESET ---
  const handleForceReset = async () => {
    if(!window.confirm("This will delete ALL products and re-seed with the correct schema. Are you sure?")) return;
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API}/seed?force=true`); 
      await fetchProducts();
      alert("Database reset successfully!");
    } catch (err) {
      alert("Reset failed: " + err.message);
      setLoading(false);
    }
  };

  // --- Tier Management Logic ---
  const selectProductForTiers = (product) => {
    setSelectedProductForTiers(product);
    // Deep copy tiers to local edit state (ensure is_active exists)
    const tiers = (product.pricing_tiers || []).map(t => ({
      ...t,
      is_active: t.is_active !== undefined ? t.is_active : true
    }));
    setTierEdits(tiers);
  };

  const handleTierChange = (index, field, value) => {
    const updated = [...tierEdits];
    updated[index][field] = value;
    setTierEdits(updated);
  };

  const toggleTierActive = (index) => {
    const updated = [...tierEdits];
    updated[index].is_active = !updated[index].is_active;
    setTierEdits(updated);
  };

  const deleteTier = (index) => {
    setTierEdits(prev => prev.filter((_, i) => i !== index));
  };

  const addNewTierToEdit = () => {
    setTierEdits([...tierEdits, { min_quantity: 5, discount_percentage: 5, is_active: true }]);
  };

  const saveTierChanges = async () => {
    setIsTierSaving(true);
    try {
      await axios.put(`${API}/admin/products/${selectedProductForTiers.id}`, {
        pricing_tiers: tierEdits
      });
      
      // Update local product state
      setProducts(prev => prev.map(p => 
        p.id === selectedProductForTiers.id 
          ? { ...p, pricing_tiers: tierEdits }
          : p
      ));
      
      alert("Tiers updated successfully!");
    } catch (err) {
      alert("Failed to update tiers");
    } finally {
      setIsTierSaving(false);
    }
  };

  // --- Local Stock Manipulation (Inventory View) ---
  const handleLocalStockChange = (productId, amount) => {
    setPendingChanges(prev => {
      const currentChange = prev[productId] || 0;
      const newChange = currentChange + amount;
      if (newChange === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: newChange };
    });
  };

  const getEffectiveStock = (product) => {
    const pending = pendingChanges[product.id] || 0;
    return product.stock + pending;
  };

  const discardChanges = () => {
    setPendingChanges({});
    setShowUnsavedModal(false);
    if (pendingViewSwitch) {
      handleViewSwitch(pendingViewSwitch, true);
    }
  };

  const saveAllChanges = async () => {
    setIsSaving(true);
    try {
      const updatePromises = Object.entries(pendingChanges).map(([id, adjustment]) => 
        axios.post(`${API}/admin/stock/update`, {
          product_id: id,
          adjustment: adjustment
        })
      );
      await Promise.all(updatePromises);
      setPendingChanges({});
      await fetchProducts();
      alert("Inventory updated successfully!");
    } catch (err) {
      alert("Some updates failed. Please check connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewSwitch = (targetView, force = false) => {
    if (!force && Object.keys(pendingChanges).length > 0 && targetView !== activeView) {
      setPendingViewSwitch(targetView);
      setShowUnsavedModal(true);
    } else {
      setActiveView(targetView);
      setPendingViewSwitch(null);
      if (targetView === 'history') fetchHistory();
      if (targetView === 'inventory' || targetView === 'tiers') fetchProducts();
    }
  };

  // --- Add/Delete Product Logic ---
  const handleDeleteProduct = async (productId) => {
    try {
      await axios.delete(`${API}/admin/products/${productId}`);
      setProducts(prev => prev.filter(p => p.id !== productId));
      setDeleteConfirm(null);
      const { [productId]: _, ...rest } = pendingChanges;
      setPendingChanges(rest);
      if (selectedProductForTiers?.id === productId) setSelectedProductForTiers(null);
    } catch (err) {
      alert("Failed to delete product");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        pricing_tiers: newProduct.pricing_tiers.filter(t => t.min_quantity > 0 && t.discount_percentage > 0)
      };
      const res = await axios.post(`${API}/admin/products`, payload);
      if (res.data.success) {
        setProducts([res.data.product, ...products]);
        setIsAddModalOpen(false);
        setNewProduct({ name: '', price: '', category: 'Clothing', stock: 0, description: '', image: '📦', pricing_tiers: [] });
      }
    } catch (err) {
      alert("Failed to create product");
    } finally {
      setSubmitLoading(false);
    }
  };

  // --- Helpers for Add Modal Tiers ---
  const addModalPricingTier = () => {
    setNewProduct(prev => ({...prev, pricing_tiers: [...prev.pricing_tiers, { min_quantity: 5, discount_percentage: 5 }]}));
  };
  const updateModalPricingTier = (index, field, value) => {
    const updated = [...newProduct.pricing_tiers];
    updated[index][field] = parseFloat(value);
    setNewProduct(prev => ({ ...prev, pricing_tiers: updated }));
  };
  const removeModalPricingTier = (index) => {
    setNewProduct(prev => ({...prev, pricing_tiers: prev.pricing_tiers.filter((_, i) => i !== index)}));
  };

  const formatDateTime = (isoString) => new Date(isoString).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));
  const getStockColorClass = (stock) => stock === 0 ? 'text-red-600 bg-red-50' : stock < 10 ? 'text-amber-600 bg-amber-50' : 'text-zinc-700';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      
      {/* --- TOP NAV --- */}
      <div className="bg-white p-2 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-1 w-full sm:w-fit overflow-x-auto">
        <button onClick={() => handleViewSwitch('inventory')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeView === 'inventory' ? 'bg-zinc-900 text-white shadow' : 'text-zinc-500 hover:bg-zinc-100'}`}>
          <Package className="w-4 h-4" /> Manage Stock
        </button>
        <button onClick={() => handleViewSwitch('tiers')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeView === 'tiers' ? 'bg-zinc-900 text-white shadow' : 'text-zinc-500 hover:bg-zinc-100'}`}>
          <Layers className="w-4 h-4" /> Pricing Tiers
        </button>
        <button onClick={() => handleViewSwitch('history')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeView === 'history' ? 'bg-zinc-900 text-white shadow' : 'text-zinc-500 hover:bg-zinc-100'}`}>
          <History className="w-4 h-4" /> History
        </button>
      </div>

      {/* --- ERROR RECOVERY --- */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div><h3 className="font-bold text-red-700 text-sm">Data Mismatch</h3><p className="text-xs text-red-600">Old schema detected.</p></div>
          </div>
          <button onClick={handleForceReset} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 whitespace-nowrap shadow-sm"><RefreshCw className="w-4 h-4" /> Reset DB</button>
        </div>
      )}

      {/* --- VIEW: INVENTORY (Original) --- */}
      {activeView === 'inventory' && !error && (
        <>
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div><h2 className="font-bold text-zinc-900">Inventory Levels</h2><p className="text-xs text-zinc-500">{Object.keys(pendingChanges).length > 0 ? `${Object.keys(pendingChanges).length} unsaved changes` : 'All changes saved'}</p></div>
              <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors ml-auto sm:ml-4"><Plus className="w-4 h-4" /> New Product</button>
            </div>
            <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" /><input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-mono uppercase text-xs">
                  <tr><th className="px-6 py-3">Product</th><th className="px-6 py-3">Price</th><th className="px-6 py-3 text-center">Current</th><th className="px-6 py-3 text-center">Adjust</th><th className="px-6 py-3 text-center">New Total</th><th className="px-6 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (<tr><td colSpan="6" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-400"/></td></tr>) : filteredProducts.map((product) => {
                    const pendingAmt = pendingChanges[product.id] || 0;
                    const effectiveStock = getEffectiveStock(product);
                    const hasChanged = pendingAmt !== 0;
                    return (
                      <tr key={product.id} className={`transition-colors group ${hasChanged ? 'bg-blue-50/30' : 'hover:bg-zinc-50'}`}>
                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-xl">{product.image}</div><div><span className="font-medium text-zinc-900 block">{product.name}</span><div className="flex items-center gap-2 text-xs text-zinc-500"><span>{product.category}</span>{product.pricing_tiers?.some(t=>t.is_active!==false) && <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Bulk Deals</span>}</div></div></div></td>
                        <td className="px-6 py-4 text-zinc-600 font-mono">{formatPrice(product.price)}</td>
                        <td className="px-6 py-4 text-center"><span className={`font-mono font-bold px-2 py-1 rounded ${getStockColorClass(product.stock)}`}>{product.stock}</span></td>
                        <td className="px-6 py-4"><div className="flex items-center justify-center gap-2"><button onClick={() => handleLocalStockChange(product.id, -1)} disabled={effectiveStock <= 0} className="p-1 hover:bg-red-100 text-zinc-400 hover:text-red-600 rounded disabled:opacity-30"><Minus className="w-4 h-4" /></button><span className={`font-mono font-bold w-12 text-center text-sm ${pendingAmt > 0 ? 'text-emerald-600' : pendingAmt < 0 ? 'text-red-600' : 'text-zinc-300'}`}>{pendingAmt > 0 ? `+${pendingAmt}` : pendingAmt === 0 ? '-' : pendingAmt}</span><button onClick={() => handleLocalStockChange(product.id, 1)} className="p-1 hover:bg-emerald-100 text-zinc-400 hover:text-emerald-600 rounded"><Plus className="w-4 h-4" /></button></div></td>
                        <td className="px-6 py-4 text-center"><div className="flex flex-col items-center"><span className={`font-mono font-bold px-2 py-1 rounded ${hasChanged ? 'bg-blue-100 text-blue-700' : getStockColorClass(effectiveStock)}`}>{effectiveStock}</span>{effectiveStock < 5 && <span className="text-[9px] text-red-500 font-bold uppercase mt-1">Low Stock</span>}</div></td>
                        <td className="px-6 py-4 text-right relative">
                          <AnimatePresence mode='wait'>
                            {deleteConfirm === product.id ? (<motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex items-center justify-end gap-2"><button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 bg-red-600 text-white rounded"><CheckCircle2 className="w-4 h-4" /></button><button onClick={() => setDeleteConfirm(null)} className="p-1.5 bg-zinc-200 text-zinc-600 rounded"><X className="w-4 h-4" /></button></motion.div>) : (<button onClick={() => setDeleteConfirm(product.id)} className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>)}
                          </AnimatePresence>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- VIEW: TIERS MANAGEMENT (NEW) --- */}
      {activeView === 'tiers' && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Left: Product List */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50">
              <h3 className="font-bold text-zinc-900 mb-2">Select Product</h3>
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" /><input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-1.5 border border-zinc-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" /></div>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {filteredProducts.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => selectProductForTiers(p)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-all ${selectedProductForTiers?.id === p.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'hover:bg-zinc-50 border border-transparent'}`}
                >
                  <div className="w-8 h-8 bg-white border border-zinc-100 rounded flex items-center justify-center text-lg shadow-sm">{p.image}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${selectedProductForTiers?.id === p.id ? 'text-blue-900' : 'text-zinc-700'}`}>{p.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{p.pricing_tiers?.length || 0} active tiers</p>
                  </div>
                  {selectedProductForTiers?.id === p.id && <ArrowRight className="w-4 h-4 text-blue-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Tier Editor */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden relative">
            {!selectedProductForTiers ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-8 text-center">
                <Layers className="w-12 h-12 mb-3 text-zinc-200" />
                <p>Select a product on the left to manage its pricing tiers.</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-zinc-100 flex justify-between items-start bg-zinc-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl border border-zinc-100 shadow-sm flex items-center justify-center text-3xl">{selectedProductForTiers.image}</div>
                    <div>
                      <h2 className="text-xl font-heading font-extrabold text-zinc-900">{selectedProductForTiers.name}</h2>
                      <p className="text-sm text-zinc-500 font-mono">Base Price: {formatPrice(selectedProductForTiers.price)}</p>
                    </div>
                  </div>
                  <button onClick={saveTierChanges} disabled={isTierSaving} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 disabled:opacity-70 transition-colors">
                    {isTierSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save Changes
                  </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-zinc-700 flex items-center gap-2"><Layers className="w-4 h-4" /> Active Tiers</h3>
                    <button onClick={addNewTierToEdit} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"><Plus className="w-3 h-3" /> Add New Tier</button>
                  </div>

                  {tierEdits.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-zinc-100 rounded-xl">
                      <p className="text-zinc-400 text-sm">No bulk pricing configured.</p>
                      <button onClick={addNewTierToEdit} className="mt-2 text-brand-blue text-sm font-medium hover:underline">Add the first tier</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {tierEdits.map((tier, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${tier.is_active ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-50 border-zinc-100 opacity-70'}`}
                          >
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-zinc-500 w-16">Buy</span>
                                <input 
                                  type="number" 
                                  min="1"
                                  value={tier.min_quantity}
                                  onChange={(e) => handleTierChange(index, 'min_quantity', parseInt(e.target.value))}
                                  className="w-full border border-zinc-300 rounded-lg px-3 py-1.5 text-sm font-mono text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-zinc-500 w-16">Get</span>
                                <div className="relative w-full">
                                  <input 
                                    type="number" 
                                    min="1" max="100"
                                    value={tier.discount_percentage}
                                    onChange={(e) => handleTierChange(index, 'discount_percentage', parseFloat(e.target.value))}
                                    className="w-full border border-zinc-300 rounded-lg pl-3 pr-8 py-1.5 text-sm font-mono text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">%</span>
                                </div>
                                <span className="text-sm font-bold text-zinc-500">Off</span>
                              </div>
                            </div>

                            <div className="w-px h-8 bg-zinc-200 mx-2" />

                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => toggleTierActive(index)}
                                className={`p-2 rounded-lg transition-colors ${tier.is_active ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-zinc-400 bg-zinc-100 hover:bg-zinc-200'}`}
                                title={tier.is_active ? "Disable Tier" : "Enable Tier"}
                              >
                                {tier.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                              </button>
                              <button 
                                onClick={() => deleteTier(index)}
                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Tier"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- VIEW: HISTORY (Same as before) --- */}
      {activeView === 'history' && !error && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100"><h2 className="font-bold text-zinc-900">Stock Adjustment History</h2></div>
          <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-mono uppercase text-xs"><tr><th className="px-6 py-3">Date</th><th className="px-6 py-3">Product</th><th className="px-6 py-3 text-right">Change</th><th className="px-6 py-3 text-right">Result</th></tr></thead><tbody className="divide-y divide-zinc-100">{historyLogs.map((log) => (<tr key={log.id} className="hover:bg-zinc-50"><td className="px-6 py-4 text-zinc-500 font-mono text-xs">{formatDateTime(log.timestamp)}</td><td className="px-6 py-4 font-medium">{log.product_name}</td><td className={`px-6 py-4 text-right font-bold ${log.change_amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{log.change_amount > 0 ? '+' : ''}{log.change_amount}</td><td className="px-6 py-4 text-right font-mono">{log.new_stock_level}</td></tr>))}</tbody></table></div>
        </div>
      )}

      {/* Save Bar & Modals (Same as before) */}
      <AnimatePresence>{Object.keys(pendingChanges).length > 0 && activeView === 'inventory' && (<motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6"><span className="text-sm font-medium">{Object.keys(pendingChanges).length} pending changes</span><div className="flex items-center gap-2"><button onClick={discardChanges} className="text-xs text-zinc-400 hover:text-white px-2">Discard</button><button onClick={saveAllChanges} disabled={isSaving} className="flex items-center gap-2 bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-50 disabled:opacity-70">{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save</button></div></motion.div>)}</AnimatePresence>
      <AnimatePresence>{showUnsavedModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" /><motion.div className="bg-white rounded-xl shadow-xl w-full max-w-sm relative z-10 p-6"><h3 className="font-bold text-lg mb-2 text-center">Unsaved Changes</h3><div className="grid grid-cols-2 gap-3"><button onClick={() => setShowUnsavedModal(false)} className="py-2 rounded border">Stay</button><button onClick={discardChanges} className="py-2 rounded bg-red-600 text-white">Discard</button></div></motion.div></div>)}</AnimatePresence>

      {/* Add Modal (Updated) */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}/>
            <motion.div className="bg-white rounded-xl shadow-xl w-full max-w-lg relative z-10 flex flex-col max-h-[90vh]">
               <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50"><h3 className="font-bold text-lg flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-brand-blue" /> Add Product</h3><button onClick={() => setIsAddModalOpen(false)}><X className="w-5 h-5 text-zinc-400" /></button></div>
              <form onSubmit={handleAddProduct} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Name</label><input required className="w-full border border-zinc-300 rounded px-3 py-2 text-sm" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} /></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Emoji</label><input required className="w-full border border-zinc-300 rounded px-3 py-2 text-sm text-center" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} /></div></div>
                <div className="grid grid-cols-3 gap-4"><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label><select className="w-full border border-zinc-300 rounded px-3 py-2 text-sm" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}><option>Clothing</option><option>Tech</option><option>Accessories</option><option>Stationery</option></select></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Price</label><input required type="number" step="0.01" className="w-full border border-zinc-300 rounded px-3 py-2 text-sm" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} /></div><div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Stock</label><input required type="number" className="w-full border border-zinc-300 rounded px-3 py-2 text-sm" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} /></div></div>
                <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description</label><textarea required rows="2" className="w-full border border-zinc-300 rounded px-3 py-2 text-sm resize-none" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} /></div>
                
                {/* Add Modal Tiers */}
                <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                  <div className="flex items-center justify-between mb-3"><label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1"><Layers className="w-3 h-3" /> Pricing Tiers</label><button type="button" onClick={addModalPricingTier} className="text-xs text-brand-blue font-bold hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button></div>
                  {newProduct.pricing_tiers.length === 0 ? <p className="text-xs text-zinc-400 text-center py-2">No tiers set.</p> : (
                    <div className="space-y-2">{newProduct.pricing_tiers.map((tier, index) => (<div key={index} className="flex items-center gap-2"><span className="text-xs text-zinc-500">Buy</span><input type="number" min="1" className="w-16 border border-zinc-300 rounded px-2 py-1 text-xs text-center" value={tier.min_quantity} onChange={(e) => updateModalPricingTier(index, 'min_quantity', e.target.value)} /><span className="text-xs text-zinc-500">get</span><input type="number" min="1" max="100" className="w-16 border border-zinc-300 rounded px-2 py-1 text-xs text-center" value={tier.discount_percentage} onChange={(e) => updateModalPricingTier(index, 'discount_percentage', e.target.value)} /><span className="text-xs text-zinc-500">% off</span><button type="button" onClick={() => removeModalPricingTier(index)} className="ml-auto text-zinc-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button></div>))}</div>
                  )}
                </div>
                <button type="submit" disabled={submitLoading} className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-zinc-800 flex items-center justify-center gap-2">{submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create Product</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StockManager;