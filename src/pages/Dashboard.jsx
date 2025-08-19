import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KPICard from '../components/dashbaord/KPICard';
import StockChart from '../components/dashbaord/StockChart';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign,
  Paintbrush,
  Palette,
  Truck,
  Plus,
  ShoppingCart,
  BarChart3,
  TrendingDown
} from 'lucide-react';
import { ReorderModal, handleReorder, handleReorderSubmit } from '../utils/reorderUtils';
import { fetchDashboardData } from '../utils/dataFetchers';
import { 
  calculateKPIs, 
  calculateLowStockItems, 
  calculateRecentTransactions, 
  calculateFrequentProducts 
} from '../utils/dashboardCalculations';
import { 
  getStartDate, 
  getSalesTitle, 
  getUrgencyStyle, 
  getTransactionStyle, 
  formatTimeAgo 
} from '../utils/dashboardUtils';
import { useToast } from '../contexts/ToastContext';
import supabase from '../services/supabase';

const Dashboard = () => {
  const [stockFilter, setStockFilter] = useState('both');
  const [stockPeriodFilter, setStockPeriodFilter] = useState('month');
  const [transactionFilter, setTransactionFilter] = useState('today');
  const [productsFilter, setProductsFilter] = useState('month');
  const [salesFilter, setSalesFilter] = useState('month');
  const [topProductsFilter, setTopProductsFilter] = useState('revenue');
  const [reorderItem, setReorderItem] = useState(null);
  const [showReorderModal, setShowReorderModal] = useState(false);

  // Data states
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // KPI states
  const [kpiData, setKpiData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [frequentProducts, setFrequentProducts] = useState([]);

  const { showError } = useToast();
  const navigate = useNavigate();

  const quickActions = [
    {
      label: 'Add Stock',
      icon: <Plus className="w-5 h-5" />,
      gradient: 'from-blue-500 to-indigo-600',
      hoverGradient: 'hover:from-blue-600 hover:to-indigo-700',
      action: () => navigate('/transactions?type=stock_in')
    },
    {
      label: 'New Sale',
      icon: <ShoppingCart className="w-5 h-5" />,
      gradient: 'from-emerald-500 to-teal-600',
      hoverGradient: 'hover:from-emerald-600 hover:to-teal-700',
      action: () => navigate('/transactions?type=sale')
    },
    {
      label: 'Add Product',
      icon: <Palette className="w-5 h-5" />,
      gradient: 'from-purple-500 to-violet-600',
      hoverGradient: 'hover:from-purple-600 hover:to-violet-700',
      action: () => navigate('/products?add=true')
    },
    {
      label: 'View Reports',
      icon: <BarChart3 className="w-5 h-5" />,
      gradient: 'from-amber-500 to-orange-600',
      hoverGradient: 'hover:from-amber-600 hover:to-orange-700',
      action: () => navigate('/reports')
    }
  ];

  // Stock status logic (aligned with Products.jsx)
  const getStockStatus = (stockLevel, minStockLevel) => {
    if ((stockLevel || 0) === 0) {
      return { status: 'out_of_stock', label: 'Out of Stock', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-700' };
    }
    if (stockLevel <= minStockLevel) {
      return { status: 'low_stock', label: 'Low Stock', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700' };
    }
    return { status: 'in_stock', label: 'In Stock', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700' };
  };

  // Fetch data on component mount
  useEffect(() => {
    if (!setKpiData || !setLowStockItems || !setRecentTransactions || !setFrequentProducts) {
      console.error('One or more state setters are undefined in Dashboard.jsx');
      setError('Configuration error: State setters are not available');
      setLoading(false);
      return;
    }
    fetchDashboardData(
      setLoading,
      setError,
      setProducts,
      setTransactions,
      showError,
      calculateKPIs,
      calculateLowStockItems,
      calculateRecentTransactions,
      calculateFrequentProducts,
      salesFilter,
      transactionFilter,
      productsFilter,
      topProductsFilter,
      getStartDate,
      getSalesTitle,
      formatTimeAgo,
      setKpiData,
      setLowStockItems,
      setRecentTransactions,
      setFrequentProducts,
      getStockStatus
    );
  }, []);

  // Recalculate KPIs when sales filter changes
  useEffect(() => {
    if (products.length > 0 && transactions.length > 0) {
      calculateKPIs(products, transactions, salesFilter, getStartDate, getSalesTitle, setKpiData, getStockStatus);
    }
  }, [salesFilter, products, transactions]);

  // Recalculate low stock items when products change
  useEffect(() => {
    if (products.length > 0) {
      calculateLowStockItems(products, setLowStockItems, getStockStatus);
    }
  }, [products]);

  // Recalculate recent transactions when filter changes
  useEffect(() => {
    if (transactions.length > 0) {
      calculateRecentTransactions(transactions, transactionFilter, getStartDate, formatTimeAgo, setRecentTransactions);
    }
  }, [transactionFilter, transactions]);

  // Recalculate frequent products when filter changes
  useEffect(() => {
    if (transactions.length > 0) {
      calculateFrequentProducts(transactions, productsFilter, topProductsFilter, getStartDate, setFrequentProducts);
    }
  }, [productsFilter, topProductsFilter, transactions]);

  // Log lowStockItems for debugging
  useEffect(() => {
    console.log('Current lowStockItems state:', lowStockItems);
  }, [lowStockItems]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData(
              setLoading,
              setError,
              setProducts,
              setTransactions,
              showError,
              calculateKPIs,
              calculateLowStockItems,
              calculateRecentTransactions,
              calculateFrequentProducts,
              salesFilter,
              transactionFilter,
              productsFilter,
              topProductsFilter,
              getStartDate,
              getSalesTitle,
              formatTimeAgo,
              setKpiData,
              setLowStockItems,
              setRecentTransactions,
              setFrequentProducts,
              getStockStatus
            )}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Paint Management Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-base md:text-lg">
            Monitor your Jotun paint inventory and sales performance
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Paintbrush className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Jotun Paint
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">Inventory Management</p>
          </div>
        </div>
      </div>

      {/* Sales Filter */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Sales Period Filter</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Select time period for sales calculations
            </p>
          </div>
          <div className="flex gap-2">
            {[
              { id: 'today', name: 'Today' },
              { id: 'yesterday', name: 'Yesterday' },
              { id: 'week', name: 'This Week' },
              { id: 'month', name: 'This Month' },
              { id: 'quarter', name: 'This Quarter' },
              { id: 'year', name: 'This Year' }
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => setSalesFilter(period.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  salesFilter === period.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {period.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Stock Movement Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Stock Movement - {stockPeriodFilter === 'today' ? 'Today' : 
                                  stockPeriodFilter === 'yesterday' ? 'Yesterday' : 
                                  stockPeriodFilter === 'week' ? 'This Week' : 
                                  stockPeriodFilter === 'month' ? 'This Month' : 
                                  stockPeriodFilter === 'quarter' ? 'This Quarter' : 
                                  stockPeriodFilter === 'year' ? 'This Year' : 'Monthly'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                Track inward and outward stock flow
              </p>
            </div>
            <div className="flex gap-2">
              {['inward', 'outward', 'both'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStockFilter(filter)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    stockFilter === filter
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Select time period for stock movement data
            </div>
            <div className="flex gap-2">
              {[
                { id: 'today', name: 'Today' },
                { id: 'yesterday', name: 'Yesterday' },
                { id: 'week', name: 'This Week' },
                { id: 'month', name: 'This Month' },
                { id: 'quarter', name: 'This Quarter' },
                { id: 'year', name: 'This Year' }
              ].map((period) => (
                <button
                  key={period.id}
                  onClick={() => setStockPeriodFilter(period.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    stockPeriodFilter === period.id
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {period.name}
                </button>
              ))}
            </div>
          </div>
          
          <StockChart filter={stockFilter} transactions={transactions} period={stockPeriodFilter} />
        </div>

        {/* Low Stock Items */}
        <div className="bg-gradient-to-br from-red-50 via-white to-red-25 dark:from-red-900/10 dark:via-slate-800 dark:to-slate-800 rounded-2xl shadow-lg border border-red-100 dark:border-red-800 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-700 dark:text-red-300">Low Stock Alert (Bases)</h3>
              <p className="text-sm text-red-600 dark:text-red-400">Base items requiring immediate attention</p>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => {
                const urgencyStyle = getUrgencyStyle(item.urgency);
                const stockPercentage = item.minStock > 0 ? (item.currentStock / item.minStock) * 100 : 0;
                
                return (
                  <div key={`${item.productId}-${item.baseId}`} className={`p-4 rounded-xl ${urgencyStyle.bg} ${urgencyStyle.border} border shadow-sm hover:shadow-md transition-all duration-200 group`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{item.name} ({item.baseName})</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                            {item.baseName}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${urgencyStyle.badge} uppercase`}>
                            {item.urgency}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`font-medium ${urgencyStyle.text}`}>
                            {item.currentStock}{item.unit} left
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">
                            Min: {item.minStock}{item.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                          <span>{item.category}</span>
                          <span>{item.supplier}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            stockPercentage < 25 ? 'bg-red-500' : stockPercentage < 50 ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>Current</span>
                        <span>{Math.round(stockPercentage)}% of minimum</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleReorder(item, products, setReorderItem, setShowReorderModal)}
                        className="flex-1 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 text-sky-500 font-semibold text-sm shadow hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                      >
                        <Package className="w-4 h-4" />
                        Reorder
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">All Stock Levels Good</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">No low stock bases to display</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Debug: Check console for products and lowStockItems data
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Latest inventory movements</p>
            </div>
            <select 
              value={transactionFilter}
              onChange={(e) => setTransactionFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => {
                const style = getTransactionStyle(transaction.type);
                return (
                  <div key={transaction.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${style.iconBg} ${style.iconColor} group-hover:scale-110 transition-transform duration-200`}>
                        {style.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {transaction.product}
                          </p>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {transaction.amount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">
                            {transaction.quantity} • {transaction.user}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {transaction.timestamp}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${style.badge} uppercase`}>
                        {transaction.type === 'sale' ? 'Sale' : 'Stock In'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">No Recent Transactions</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Start by creating your first transaction</p>
              </div>
            )}
          </div>
        </div>

        {/* Frequently Sold Products */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Top Selling Products</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Most popular items by {topProductsFilter === 'revenue' ? 'revenue' : 'quantity'}</p>
            </div>
            <div className="flex gap-2">
              <select 
                value={topProductsFilter}
                onChange={(e) => setTopProductsFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
              >
                <option value="revenue">By Revenue</option>
                <option value="quantity">By Quantity</option>
              </select>
              
              <select 
                value={productsFilter}
                onChange={(e) => setProductsFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto">
            {frequentProducts.length > 0 ? (
              frequentProducts.map((product, index) => (
                <div key={product.id} className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-slate-800 border border-emerald-100 dark:border-emerald-800 hover:shadow-md transition-all duration-200 group">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        #{index + 1}
                      </div>
                      <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-1">
                          {product.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {product.revenue}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>{product.baseName} • {product.soldQuantity}{product.unit} sold</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300`}>
                          Top Seller
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">No Sales Data</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Start making sales to see top products</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Quick Actions
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Frequently used operations for faster workflow
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`group relative overflow-hidden p-6 rounded-xl bg-gradient-to-br ${action.gradient} ${action.hoverGradient} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-white/20 rounded-xl mb-3 group-hover:bg-white/30 transition-colors duration-200">
                  {action.icon}
                </div>
                <span className="font-semibold text-sm">{action.label}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12"></div>
            </button>
          ))}
        </div>
      </div>

      {/* Reorder Modal */}
      <ReorderModal
        show={showReorderModal}
        item={reorderItem}
        onClose={() => {
          setShowReorderModal(false);
          setReorderItem(null);
        }}
        onSubmit={(formData) => handleReorderSubmit(formData, reorderItem, supabase, showError, fetchDashboardData, setShowReorderModal, setReorderItem)}
      />
    </div>
  );
};

export default Dashboard;