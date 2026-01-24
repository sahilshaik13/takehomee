import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Calendar, Filter, TrendingUp, DollarSign, Tag, PieChart as PieIcon, Layers } from 'lucide-react';
import { formatPrice } from '../utils/priceUtils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AdminAnalysis = ({ globalDateRange }) => {
  // Local state for each chart (defaults to global range)
  const [trendRange, setTrendRange] = useState(globalDateRange);
  const [productRange, setProductRange] = useState(globalDateRange);
  const [couponRange, setCouponRange] = useState(globalDateRange);
  const [categoryRange, setCategoryRange] = useState(globalDateRange); // <--- NEW

  // Data States
  const [trendData, setTrendData] = useState(null);
  const [productData, setProductData] = useState(null);
  const [couponData, setCouponData] = useState(null);
  const [categoryData, setCategoryData] = useState(null); // <--- NEW
  const [plData, setPlData] = useState(null);

  // Update local ranges when global changes
  useEffect(() => {
    setTrendRange(globalDateRange);
    setProductRange(globalDateRange);
    setCouponRange(globalDateRange);
    setCategoryRange(globalDateRange); // <--- SYNC
  }, [globalDateRange]);

  // Fetch Logic
  const fetchAnalysis = async (range, setDataCallback) => {
    try {
      const res = await axios.post(`${API}/admin/analysis/advanced`, {
        start_date: range.start,
        end_date: range.end
      });
      setDataCallback(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Initial Fetches
  useEffect(() => { fetchAnalysis(trendRange, setTrendData); }, [trendRange]);
  useEffect(() => { fetchAnalysis(productRange, setProductData); }, [productRange]);
  useEffect(() => { fetchAnalysis(categoryRange, setCategoryData); }, [categoryRange]); // <--- FETCH
  useEffect(() => { 
    fetchAnalysis(couponRange, (data) => {
      setCouponData(data);
      setPlData(data.pl_statement); // P&L shares range with coupon logic
    }); 
  }, [couponRange]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. P&L Statement */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-xl flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Profit & Loss Statement
          </h2>
          <div className="text-sm text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
            Net Margin: <span className="font-bold text-emerald-600">{plData?.margin_percent}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
            <p className="text-sm text-zinc-500 mb-1">Gross Sales</p>
            <p className="text-2xl font-heading font-extrabold text-zinc-900">
              {formatPrice(plData?.gross_sales || 0)}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-100 relative">
            <div className="absolute top-3 right-3 text-red-400">
               <Tag className="w-4 h-4" />
            </div>
            <p className="text-sm text-red-600 mb-1">Discounts (Loss)</p>
            <p className="text-2xl font-heading font-extrabold text-red-600">
              -{formatPrice(plData?.total_discounts || 0)}
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <p className="text-sm text-emerald-600 mb-1">Net Revenue</p>
            <p className="text-2xl font-heading font-extrabold text-emerald-700">
              {formatPrice(plData?.net_sales || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 2. Sales Trend Chart */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <ChartHeader 
            title="Sales Trend" 
            icon={<TrendingUp className="w-5 h-5 text-brand-blue" />}
            range={trendRange} 
            setRange={setTrendRange} 
          />
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData?.sales_trend || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                  tick={{fontSize: 12}}
                />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip 
                  formatter={(value) => formatPrice(value)}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Top Products Chart */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <ChartHeader 
            title="Top Performing Products" 
            icon={<Filter className="w-5 h-5 text-amber-500" />}
            range={productRange} 
            setRange={setProductRange} 
          />
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData?.top_products || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="quantity" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. NEW: Revenue by Category */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <ChartHeader 
            title="Revenue by Category" 
            icon={<Layers className="w-5 h-5 text-indigo-500" />}
            range={categoryRange} 
            setRange={setCategoryRange} 
          />
          <div className="h-[300px] w-full mt-4 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData?.category_performance || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData?.category_performance?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatPrice(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Coupon Usage Pie Chart */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <ChartHeader 
            title="Coupon Usage" 
            icon={<PieIcon className="w-5 h-5 text-purple-600" />}
            range={couponRange} 
            setRange={setCouponRange} 
          />
          <div className="h-[300px] w-full mt-4 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={couponData?.coupon_usage || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {couponData?.coupon_usage?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

// Helper Component for Individual Chart Date Pickers
const ChartHeader = ({ title, icon, range, setRange }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-50 pb-4">
    <h3 className="font-bold text-lg flex items-center gap-2">
      {icon}
      {title}
    </h3>
    <div className="flex items-center gap-2">
      <input 
        type="date" 
        value={range.start ? range.start.split('T')[0] : ''}
        onChange={(e) => setRange({ ...range, start: new Date(e.target.value).toISOString() })}
        className="text-xs border border-zinc-200 rounded px-2 py-1 bg-zinc-50"
      />
      <span className="text-zinc-400">-</span>
      <input 
        type="date" 
        value={range.end ? range.end.split('T')[0] : ''}
        onChange={(e) => setRange({ ...range, end: new Date(e.target.value).toISOString() })}
        className="text-xs border border-zinc-200 rounded px-2 py-1 bg-zinc-50"
      />
    </div>
  </div>
);

export default AdminAnalysis;