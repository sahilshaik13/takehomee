import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, LogOut, LayoutDashboard, PieChart, 
  PackageOpen, Ticket, Calendar
} from 'lucide-react';

// Import Components
import AdminOverview from '../../components/AdminOverview';
import AdminAnalysis from '../../components/AdminAnalysis';
import StockManager from '../../components/StockManager';
import CouponManager from '../../components/CouponManager';
import AdminChatBot from '../../components/AdminChatBot'; // <--- New Import

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); 
  
  // --- DATE PRESET LOGIC ---
  const PRESETS = [
    { label: '7D', days: 7 },
    { label: '15D', days: 15 },
    { label: '1M', days: 30 },
    { label: '3M', days: 90 },
    { label: '6M', days: 180 },
    { label: '1Y', days: 365 },
  ];

  const [globalDateRange, setGlobalDateRange] = useState(() => {
    // Default to 1 Month
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return { start: start.toISOString(), end: end.toISOString() };
  });

  const [activePreset, setActivePreset] = useState('1M'); // Track which button is active

  const handlePresetChange = (days, label) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setGlobalDateRange({
      start: start.toISOString(),
      end: end.toISOString()
    });
    setActivePreset(label);
  };

  const handleManualDateChange = (key, value) => {
    setGlobalDateRange(prev => ({ ...prev, [key]: new Date(value).toISOString() }));
    setActivePreset('custom'); // Deselect presets if manually changing
  };
  // -------------------------

  // Auth Check
  useEffect(() => {
    const isAdmin = localStorage.getItem('admin_auth') === 'true';
    if (!isAdmin) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-zinc-100 pb-20 relative">
      {/* Header - Always Visible */}
      <header className="bg-zinc-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-brand-blue" />
              <span className="font-heading font-bold text-xl">Admin Portal</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs transition-colors"
              data-testid="admin-logout-btn"
            >
              <LogOut className="w-3 h-3" />
              Logout
            </button>
          </div>
          
          {/* Tabs Navigation */}
          <div className="flex items-center gap-6 mt-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'overview' 
                  ? 'border-brand-blue text-white' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'analysis' 
                  ? 'border-brand-blue text-white' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <PieChart className="w-4 h-4" />
              Advanced Analysis
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'inventory' 
                  ? 'border-brand-blue text-white' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <PackageOpen className="w-4 h-4" />
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'coupons' 
                  ? 'border-brand-blue text-white' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Ticket className="w-4 h-4" />
              Coupons
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 1. OVERVIEW */}
        {activeTab === 'overview' && <AdminOverview />}

        {/* 2. ANALYSIS */}
        {activeTab === 'analysis' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Global Filter Bar */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-8 shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Left: Label */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="w-10 h-10 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-brand-blue" />
                  </div>
                  <div>
                    <h2 className="font-bold text-zinc-900">Analytics Timeline</h2>
                    <p className="text-xs text-zinc-500">Filter all charts by date</p>
                  </div>
                </div>

                {/* Right: Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                  
                  {/* Preset Buttons */}
                  <div className="flex bg-zinc-100 p-1 rounded-lg">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handlePresetChange(preset.days, preset.label)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                          activePreset === preset.label 
                            ? 'bg-white text-brand-blue shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Pickers */}
                  <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg p-1 pl-3">
                    <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider mr-1">Range</span>
                    <input 
                      type="date" 
                      value={globalDateRange.start.split('T')[0]}
                      onChange={(e) => handleManualDateChange('start', e.target.value)}
                      className="text-sm text-zinc-700 outline-none w-32"
                    />
                    <span className="text-zinc-300">to</span>
                    <input 
                      type="date" 
                      value={globalDateRange.end.split('T')[0]}
                      onChange={(e) => handleManualDateChange('end', e.target.value)}
                      className="text-sm text-zinc-700 outline-none w-32"
                    />
                  </div>

                </div>
              </div>
            </div>

            <AdminAnalysis globalDateRange={globalDateRange} />
          </motion.div>
        )}

        {/* 3. INVENTORY */}
        {activeTab === 'inventory' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StockManager />
          </motion.div>
        )}

        {/* 4. COUPONS */}
        {activeTab === 'coupons' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CouponManager />
          </motion.div>
        )}

      </main>

      {/* --- CHATBOT FLOATING COMPONENT --- */}
      <AdminChatBot />
    </div>
  );
};

export default AdminDashboardPage;