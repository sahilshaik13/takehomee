import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Ticket, Plus, Trash2, Calendar, Users, 
  CheckCircle2, X, Loader2, Save, Power, Edit2, User, Layers, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '../utils/priceUtils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [formData, setFormData] = useState(initialFormState());
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/coupons`);
      setCoupons(res.data);
    } catch (err) {
      console.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
      await axios.put(`${API}/admin/coupons/${coupon.id}`, { is_active: !coupon.is_active });
    } catch (err) {
      alert("Failed to update status");
      fetchCoupons(); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await axios.delete(`${API}/admin/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert("Failed to delete coupon");
    }
  };

  const openEditModal = (coupon) => {
    setEditingId(coupon.id);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_value: coupon.min_order_value || '',
      target_category: coupon.target_category || 'All',
      expiration_date: coupon.expiration_date ? coupon.expiration_date.split('T')[0] : '',
      usage_limit: coupon.usage_limit || '',
      limit_per_user: coupon.limit_per_user || '', 
      first_time_only: coupon.first_time_only || false, // <--- LOAD VALUE
      is_active: coupon.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    
    try {
      const payload = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : null,
        target_category: formData.target_category === 'All' ? null : formData.target_category,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        limit_per_user: formData.limit_per_user ? parseInt(formData.limit_per_user) : null,
        expiration_date: formData.expiration_date ? new Date(formData.expiration_date).toISOString() : null,
        first_time_only: formData.first_time_only // <--- SEND TO BACKEND
      };

      if (editingId) {
        await axios.put(`${API}/admin/coupons/${editingId}`, payload);
      } else {
        await axios.post(`${API}/admin/coupons`, payload);
      }
      
      await fetchCoupons();
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(initialFormState());
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  function initialFormState() {
    return {
      code: '', description: '', discount_type: 'percentage', discount_value: '',
      min_order_value: '', target_category: 'All', expiration_date: '', 
      usage_limit: '', limit_per_user: '', 
      first_time_only: false, // <--- DEFAULT
      is_active: true
    };
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-brand-blue"/></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-zinc-900">Coupon Management</h2>
            <p className="text-xs text-zinc-500">{coupons.length} active/inactive codes</p>
          </div>
        </div>
        
        <button 
          onClick={() => { setEditingId(null); setFormData(initialFormState()); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => (
          <div key={coupon.id} className={`bg-white rounded-xl border p-5 relative overflow-hidden transition-all ${!coupon.is_active ? 'border-zinc-200 opacity-75' : 'border-purple-100 shadow-sm'}`}>
            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider ${coupon.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
              {coupon.is_active ? 'Active' : 'Disabled'}
            </div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-mono font-bold text-lg text-zinc-900">{coupon.code}</h3>
                <p className="text-xs text-zinc-500 line-clamp-1">{coupon.description}</p>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mb-4 text-purple-600">
              <span className="text-2xl font-extrabold">
                {coupon.discount_type === 'fixed' ? '$' : ''}{coupon.discount_value}{coupon.discount_type === 'percentage' ? '%' : ''}
              </span>
              <span className="text-xs font-medium uppercase text-zinc-400">OFF</span>
            </div>

            <div className="space-y-2 text-xs text-zinc-600 mb-6 bg-zinc-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span>Category:</span>
                <span className={`font-bold ${coupon.target_category ? 'text-blue-600' : 'text-zinc-500'}`}>
                  {coupon.target_category || 'Storewide'}
                </span>
              </div>
              
              {/* --- NEW: First Time Only Label --- */}
              {coupon.first_time_only && (
                <div className="flex justify-between">
                   <span>Eligibility:</span>
                   <span className="font-bold text-purple-600 flex items-center gap-1">
                     <Sparkles className="w-3 h-3" /> New Users Only
                   </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Per User Limit:</span>
                <span className="font-medium text-purple-600">
                  {coupon.limit_per_user ? `${coupon.limit_per_user} uses` : 'Unlimited'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Global Usage:</span>
                <span className="font-medium">
                  {coupon.times_used} / {coupon.usage_limit ? coupon.usage_limit : '∞'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Min Order:</span>
                <span className="font-medium">{coupon.min_order_value ? formatPrice(coupon.min_order_value) : 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Expires:</span>
                <span className={`font-medium ${new Date(coupon.expiration_date) < new Date() ? 'text-red-500' : ''}`}>
                  {coupon.expiration_date ? new Date(coupon.expiration_date).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
              <button 
                onClick={() => handleToggleActive(coupon)}
                className={`p-2 rounded-lg transition-colors ${coupon.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-zinc-400 hover:bg-zinc-100'}`}
                title={coupon.is_active ? "Disable Coupon" : "Enable Coupon"}
              >
                <Power className="w-4 h-4" />
              </button>
              <button 
                onClick={() => openEditModal(coupon)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Coupon"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(coupon.id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg ml-auto transition-colors"
                title="Delete Permanently"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}/>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-purple-600" />
                  {editingId ? 'Edit Coupon' : 'Create New Coupon'}
                </h3>
                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-zinc-400 hover:text-zinc-600" /></button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* Core Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Coupon Code</label>
                    <input 
                      required 
                      className="w-full border border-zinc-300 rounded px-3 py-2 text-sm font-mono uppercase focus:border-purple-500 outline-none"
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="SUMMER25"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Target Category</label>
                    <select 
                      className="w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none"
                      value={formData.target_category}
                      onChange={e => setFormData({...formData, target_category: e.target.value})}
                    >
                      <option>All</option>
                      <option>Clothing</option>
                      <option>Tech</option>
                      <option>Accessories</option>
                      <option>Stationery</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description</label>
                  <input 
                    required 
                    className="w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="e.g., 20% off all Tech items for new users"
                  />
                </div>

                {/* Discount Logic */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-purple-700 uppercase mb-1">Type</label>
                    <select 
                      className="w-full border border-purple-200 rounded px-3 py-2 text-sm outline-none bg-white"
                      value={formData.discount_type}
                      onChange={e => setFormData({...formData, discount_type: e.target.value})}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-purple-700 uppercase mb-1">Value</label>
                    <input 
                      required type="number" min="0" step="0.01"
                      className="w-full border border-purple-200 rounded px-3 py-2 text-sm outline-none"
                      value={formData.discount_value}
                      onChange={e => setFormData({...formData, discount_value: e.target.value})}
                      placeholder="20"
                    />
                  </div>
                </div>

                {/* Constraints */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Global Limit</label>
                    <div className="relative">
                      <input 
                        type="number" min="1"
                        className="w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none pl-8"
                        value={formData.usage_limit}
                        onChange={e => setFormData({...formData, usage_limit: e.target.value})}
                        placeholder="∞"
                      />
                      <Users className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Per User Limit</label>
                    <div className="relative">
                      <input 
                        type="number" min="1"
                        className="w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none pl-8"
                        value={formData.limit_per_user}
                        onChange={e => setFormData({...formData, limit_per_user: e.target.value})}
                        placeholder="∞"
                      />
                      <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Min Order ($)</label>
                    <input 
                      type="number" min="0"
                      className="w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none"
                      value={formData.min_order_value}
                      onChange={e => setFormData({...formData, min_order_value: e.target.value})}
                      placeholder="None"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Expires On</label>
                    <input 
                      type="date"
                      className="w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none"
                      value={formData.expiration_date}
                      onChange={e => setFormData({...formData, expiration_date: e.target.value})}
                    />
                  </div>
                </div>

                {/* --- NEW CHECKBOX: FIRST TIME USERS ONLY --- */}
                <div 
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.first_time_only 
                      ? 'bg-purple-50 border-purple-200' 
                      : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                  }`}
                  onClick={() => setFormData({ ...formData, first_time_only: !formData.first_time_only })}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    formData.first_time_only 
                      ? 'bg-purple-600 border-purple-600' 
                      : 'bg-white border-zinc-300'
                  }`}>
                    {formData.first_time_only && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${formData.first_time_only ? 'text-purple-900' : 'text-zinc-700'}`}>
                      First-time customers only
                    </p>
                    <p className="text-xs text-zinc-500">
                      Only valid for users with 0 previous orders
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={submitLoading} className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
                    {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editingId ? 'Save Changes' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CouponManager;