import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  DollarSign, ShoppingCart, Tag, TrendingUp, 
  AlertTriangle, Package, BarChart3, Calendar as CalendarIcon, 
  User, Loader2, ChevronLeft, ChevronRight, RefreshCw, Filter
} from 'lucide-react';
import { formatPrice } from '../utils/priceUtils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminOverview = () => {
  // --- State Management ---
  const [data, setData] = useState(null); // Dashboard Data (Orders list)
  const [analytics, setAnalytics] = useState(null); // Analytics (KPIs, Charts)
  const [loading, setLoading] = useState(true); // Global Loading
  const [transactionsLoading, setTransactionsLoading] = useState(false); // Table specific loading

  // Filter & Pagination State
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12, 
    total: 0
  });

  // --- 1. API Helper: Fetch Transaction Data ---
  const fetchDashboardData = useCallback((page, limit, startDate, endDate) => {
    const params = new URLSearchParams({ page, limit });
    if (startDate) params.append('start_date', new Date(startDate).toISOString());
    if (endDate) params.append('end_date', new Date(endDate).toISOString());
    return axios.get(`${API}/admin/dashboard-data?${params.toString()}`);
  }, []);

  // --- 2. Initial Data Load ---
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [dashboardRes, analyticsRes] = await Promise.all([
          fetchDashboardData(1, 12), 
          axios.get(`${API}/admin/analytics`)
        ]);
        
        setData(dashboardRes.data);
        setPagination(prev => ({ ...prev, total: dashboardRes.data.total_orders_count }));
        setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [fetchDashboardData]); 

  // --- 3. Refresh Transactions (On Filter/Pagination Change) ---
  const fetchTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const response = await fetchDashboardData(
        pagination.page, 
        pagination.limit, 
        dateFilter.start, 
        dateFilter.end
      );
      setData(prev => ({ ...prev, orders: response.data.orders }));
      setPagination(prev => ({ ...prev, total: response.data.total_orders_count }));
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  }, [fetchDashboardData, pagination.page, pagination.limit, dateFilter.start, dateFilter.end]);

  // Effect: Trigger fetch when page/limit changes
  useEffect(() => {
    if (!loading) { 
        fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]); 

  // --- Handlers ---
  const handleFilterApply = () => {
    setPagination(prev => ({ ...prev, page: 1 })); 
    fetchTransactions();
  };

  const handleFilterReset = () => {
    setDateFilter({ start: '', end: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
    // Small timeout to allow state to settle before fetch, or pass explicit nulls
    setTimeout(() => {
        // We call fetch directly here with empty strings to bypass the stale state closure if any
        // But since fetchTransactions depends on state, we rely on the state update + timeout or direct call
        // For safety, force a reload:
        window.location.reload(); // Simplest reset for admin dashboard
    }, 100);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (e) => {
    setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }));
  };

  // --- Formatting Helpers ---
  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getTotalItems = (items) => items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const maxRevenue = analytics?.revenue_trends ? Math.max(...analytics.revenue_trends.map(d => d.revenue), 1) : 1;
  const formatDateShort = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Pagination Math
  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-10 h-10 text-brand-blue animate-spin" /></div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* ==================== KPI CARDS ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard 
          title="Total Revenue" 
          value={formatPrice(data?.analytics?.total_revenue || 0)} 
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />} 
          bg="bg-emerald-100" 
        />
        <KPICard 
          title="Total Orders" 
          value={data?.analytics?.total_orders || 0} 
          icon={<ShoppingCart className="w-6 h-6 text-blue-600" />} 
          bg="bg-blue-100" 
        />
        <KPICard 
          title="Total Discounts" 
          value={formatPrice(data?.analytics?.total_discounts || 0)} 
          icon={<Tag className="w-6 h-6 text-red-600" />} 
          bg="bg-red-100" 
        />
        <KPICard 
          title="Avg. Order Value" 
          value={formatPrice(analytics?.performance?.average_order_value || 0)} 
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />} 
          bg="bg-purple-100" 
        />
      </div>

      {/* ==================== ALERTS & CHARTS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Alerts Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-80">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/50">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-heading font-bold text-lg text-zinc-900">Stock Alerts</h2>
          </div>
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            {analytics?.stock_alerts?.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 h-full flex flex-col items-center justify-center">
                <Package className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
                <p>All products are well stocked!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {analytics?.stock_alerts?.map((item) => (
                  <div key={item.product_id} className={`flex items-center justify-between p-3 rounded-lg border ${item.stock <= 3 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`w-4 h-4 ${item.stock <= 3 ? 'text-red-500' : 'text-amber-500'}`} />
                      <div>
                        <p className="font-bold text-sm text-zinc-900 leading-tight">{item.name}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.category}</p>
                      </div>
                    </div>
                    <span className={`font-mono font-bold text-sm ${item.stock <= 3 ? 'text-red-600' : 'text-amber-600'}`}>
                      {item.stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden h-80 flex flex-col">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/50">
            <BarChart3 className="w-5 h-5 text-brand-blue" />
            <h2 className="font-heading font-bold text-lg text-zinc-900">Revenue Trend</h2>
          </div>
          <div className="p-6 flex-1 flex items-end justify-between gap-2">
            {analytics?.revenue_trends?.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center group h-full justify-end">
                <div className="w-full flex flex-col items-center relative h-full justify-end">
                  {/* Tooltip */}
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-8 text-[10px] font-bold bg-zinc-800 text-white px-2 py-1 rounded transition-opacity whitespace-nowrap z-10 pointer-events-none mb-2">
                    {formatPrice(day.revenue)}
                  </span>
                  {/* Bar */}
                  <div
                    className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 ${day.revenue > 0 ? 'bg-brand-blue group-hover:bg-blue-600' : 'bg-zinc-100'}`}
                    style={{ height: `${Math.max((day.revenue / maxRevenue) * 100, 4)}%`, minHeight: '4px' }}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 mt-2 truncate w-full text-center font-mono">
                  {formatDateShort(day.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== TRANSACTION LOG ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        {/* Header & Filter Controls */}
        <div className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/30">
          <div>
            <h2 className="font-heading font-bold text-lg text-zinc-900">Transaction Log</h2>
            <p className="text-sm text-zinc-500">Financial breakdown & order history</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Start Date */}
            <div className="relative group">
                <CalendarIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-brand-blue transition-colors" />
                <input 
                  type="datetime-local"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                  className="pl-9 pr-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none text-zinc-600 bg-white shadow-sm"
                />
            </div>
            <span className="text-zinc-300 font-bold">-</span>
            {/* End Date */}
            <div className="relative group">
                <CalendarIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-brand-blue transition-colors" />
                <input 
                  type="datetime-local"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                  className="pl-9 pr-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none text-zinc-600 bg-white shadow-sm"
                />
            </div>
            
            {/* Actions */}
            <button 
                onClick={handleFilterApply}
                disabled={!dateFilter.start && !dateFilter.end}
                className="flex items-center gap-1 bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:translate-y-0.5"
            >
                <Filter className="w-4 h-4" /> Apply
            </button>
            {(dateFilter.start || dateFilter.end) && (
                <button 
                  onClick={handleFilterReset}
                  className="text-sm text-zinc-500 hover:text-zinc-800 font-medium underline decoration-zinc-300 hover:decoration-zinc-800 underline-offset-4 px-2"
                >
                  Reset
                </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="relative">
          {transactionsLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
                <span className="text-xs font-bold text-brand-blue uppercase tracking-widest">Refreshing...</span>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="px-6 py-3 text-left text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold">Date/Time</th>
                  <th className="px-6 py-3 text-left text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold">Items</th>
                  {/* Financial Columns */}
                  <th className="px-6 py-3 text-right text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold bg-zinc-50/50">Sale Price</th>
                  <th className="px-6 py-3 text-right text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold">Bulk Disc.</th>
                  <th className="px-6 py-3 text-right text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold">Coupon</th>
                  <th className="px-6 py-3 text-right text-xs font-mono uppercase tracking-wider text-zinc-900 font-extrabold bg-zinc-100/50">Net Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {(!data?.orders || data.orders.length === 0) ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center text-zinc-400">
                      <div className="flex flex-col items-center gap-2">
                        <User className="w-8 h-8 opacity-20" />
                        <p>No transactions found for this period.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.orders.map((order) => {
                    // --- Financial Breakdown Calculation ---
                    // Note: 'bulk_discount_amount' might be undefined for old legacy orders, default to 0
                    const coupon = order.discount_amount || 0;
                    const bulk = order.bulk_discount_amount || 0;
                    const netTotal = order.total_amount;
                    
                    // Reconstruct Original Price (MSRP)
                    const salePrice = netTotal + coupon + bulk;

                    return (
                        <tr key={order.order_id} className="hover:bg-blue-50/30 transition-colors group">
                          {/* Metadata */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 font-mono">
                            {formatDateTime(order.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-bold text-zinc-800">{order.user_name}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                            <span className="bg-zinc-100 px-2 py-1 rounded text-xs font-bold text-zinc-700">
                              {getTotalItems(order.items)} items
                            </span>
                          </td>
                          
                          {/* Sale Price (MSRP) */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-zinc-400 font-mono line-through decoration-zinc-300">
                              {formatPrice(salePrice)}
                          </td>

                          {/* Bulk Discount */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              {bulk > 0 ? (
                                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded text-xs">
                                  -{formatPrice(bulk)}
                                </span>
                              ) : <span className="text-zinc-300">-</span>}
                          </td>

                          {/* Coupon */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              {coupon > 0 ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-xs mb-1">
                                    -{formatPrice(coupon)}
                                  </span>
                                  {order.coupon_code_used && (
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-400 border border-zinc-200 px-1 rounded">
                                      {order.coupon_code_used}
                                    </span>
                                  )}
                                </div>
                              ) : <span className="text-zinc-300">-</span>}
                          </td>

                          {/* Net Total */}
                          <td className="px-6 py-4 whitespace-nowrap text-right bg-zinc-50/30 group-hover:bg-blue-50/10">
                              <span className="font-heading font-extrabold text-zinc-900 text-base">
                                {formatPrice(netTotal)}
                              </span>
                          </td>
                        </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Pagination Controls --- */}
        <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end gap-4 text-sm text-zinc-600 bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase">Rows:</span>
            <select 
              value={pagination.limit} 
              onChange={handleLimitChange}
              className="border border-zinc-200 rounded px-2 py-1 focus:ring-2 focus:ring-brand-blue outline-none bg-white text-xs font-bold"
            >
              <option value={12}>12</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-zinc-400">|</span>
            <span className="font-mono text-zinc-700">
              {pagination.total === 0 ? '0-0' : `${startItem}-${endItem}`}
            </span>
            <span className="text-zinc-400">of</span>
            <span className="font-bold text-zinc-900">{pagination.total}</span>
          </div>

          <div className="flex items-center gap-1 ml-4">
            <button 
              onClick={fetchTransactions}
              title="Refresh data"
              className="p-1.5 hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 rounded text-zinc-500 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${transactionsLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="h-4 w-px bg-zinc-300 mx-1" />
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || transactionsLoading}
              className="p-1.5 hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 rounded text-zinc-500 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages || transactionsLoading}
              className="p-1.5 hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 rounded text-zinc-500 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

// --- Helper Components ---
const KPICard = ({ title, value, icon, bg }) => (
  <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
    <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{title}</p>
      <p className="font-heading font-extrabold text-2xl text-zinc-900">{value}</p>
    </div>
  </div>
);

export default AdminOverview;