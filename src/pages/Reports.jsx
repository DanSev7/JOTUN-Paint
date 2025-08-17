import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar, 
  Filter,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart,
  Activity,
  Target,
  Award,
  Clock,
  RefreshCw
} from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line
} from 'recharts';
import supabase from '../services/supabase';
import { useToast } from '../contexts/ToastContext';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [stockLevels, setStockLevels] = useState([]);
  const [summaryStats, setSummaryStats] = useState({});

  const { showError } = useToast();

  // Fetch all report data
  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch products with prices
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_prices:product_prices(
            unit_price,
            bases:base_id(name)
          )
        `);
      
      if (productsError) throw productsError;

      // Fetch transactions with product and base info
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          products:product_id(name, size, category),
          bases:base_id(name)
        `)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      setProducts(productsData || []);
      setTransactions(transactionsData || []);

      // Calculate all report data
      calculateSalesData(transactionsData || []);
      calculateTopProducts(transactionsData || []);
      calculateStockLevels(productsData || []);
      calculateSummaryStats(productsData || [], transactionsData || []);

    } catch (err) {
      setError(err.message || 'Failed to fetch report data');
      showError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate sales data for charts
  const calculateSalesData = (transactionsData) => {
    const monthlyData = {};
    
    transactionsData
      .filter(t => t.type === 'sale')
      .forEach(transaction => {
        const date = new Date(transaction.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        const monthYear = `${monthKey} ${year}`;
        
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = { sales: 0, units: 0 };
        }
        
        monthlyData[monthYear].sales += transaction.total_amount || 0;
        monthlyData[monthYear].units += transaction.quantity || 0;
      });

    const chartData = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        sales: Math.round(data.sales),
        units: Math.round(data.units)
      }))
      .sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const aMonth = a.month.split(' ')[0];
        const bMonth = b.month.split(' ')[0];
        return months.indexOf(aMonth) - months.indexOf(bMonth);
      })
      .slice(-6); // Last 6 months

    setSalesData(chartData);
  };

  // Calculate top selling products by base
  const calculateTopProducts = (transactionsData) => {
    const baseStats = {};
    
    transactionsData
      .filter(t => t.type === 'sale')
      .forEach(transaction => {
        const productName = transaction.products?.name;
        const baseId = transaction.base_id;
        const baseName = transaction.bases?.name;
        if (productName && baseId && baseName) {
          const key = `${productName}-${baseId}`;
          if (!baseStats[key]) {
            baseStats[key] = {
              sales: 0,
              units: 0,
              id: transaction.product_id,
              baseId: baseId,
              productName: productName,
              baseName: baseName
            };
          }
          baseStats[key].sales += transaction.total_amount || 0;
          baseStats[key].units += transaction.quantity || 0;
        }
      });

    const totalSales = Object.values(baseStats).reduce((sum, p) => sum + p.sales, 0);
    
    const topProductsData = Object.entries(baseStats)
      .map(([key, stats]) => ({
        name: stats.productName,
        baseName: stats.baseName,
        sales: Math.round(stats.sales),
        units: Math.round(stats.units),
        percentage: totalSales > 0 ? Math.round((stats.sales / totalSales) * 100) : 0,
        id: stats.id
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    setTopProducts(topProductsData);
  };

  // Calculate stock levels by category
  const calculateStockLevels = (productsData) => {
    const categoryStats = {};
    
    productsData.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          stock: 0,
          low: 0,
          critical: 0,
          total: 0
        };
      }
      
      categoryStats[category].stock += product.totalStock || 0;
      categoryStats[category].total += 1;
      
      if (product.totalStock <= product.min_stock_level && product.totalStock > 0) {
        categoryStats[category].low += 1;
      }
      if (product.totalStock <= (product.min_stock_level * 0.25)) {
        categoryStats[category].critical += 1;
      }
    });

    const stockLevelsData = Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        stock: Math.round(stats.stock),
        low: stats.low,
        critical: stats.critical,
        total: stats.total
      }))
      .sort((a, b) => b.stock - a.stock);

    setStockLevels(stockLevelsData);
  };

  // Calculate summary statistics
  const calculateSummaryStats = (productsData, transactionsData) => {
    const totalStock = productsData.reduce((sum, p) => sum + (p.totalStock || 0), 0);
    const lowStockCount = productsData.filter(p => 
      p.totalStock <= p.min_stock_level && p.totalStock > 0
    ).length;
    const criticalCount = productsData.filter(p => 
      p.totalStock <= (p.min_stock_level * 0.25)
    ).length;

    // Sales calculations
    const salesTransactions = transactionsData.filter(t => t.type === 'sale');
    const totalSales = salesTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    const totalUnits = salesTransactions.reduce((sum, t) => sum + (t.quantity || 0), 0);
    const avgOrderValue = salesTransactions.length > 0 ? totalSales / salesTransactions.length : 0;

    // Monthly comparison (mock for now)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlySales = salesTransactions
      .filter(t => new Date(t.created_at) >= thirtyDaysAgo)
      .reduce((sum, t) => sum + (t.total_amount || 0), 0);

    setSummaryStats({
      totalStock,
      lowStockCount,
      criticalCount,
      totalSales,
      totalUnits,
      avgOrderValue,
      monthlySales,
      totalProducts: productsData.length,
      totalTransactions: transactionsData.length
    });
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchReportData();
  }, []);

  const reports = [
    { 
      id: 'sales', 
      name: 'Sales Report', 
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Revenue and sales performance analytics'
    },
    { 
      id: 'inventory', 
      name: 'Inventory Report', 
      icon: <BarChart className="w-5 h-5" />,
      description: 'Stock levels and inventory management'
    },
    { 
      id: 'performance', 
      name: 'Performance Report', 
      icon: <Activity className="w-5 h-5" />,
      description: 'Business performance metrics and KPIs'
    }
  ];

  const periods = [
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'quarter', name: 'This Quarter' },
    { id: 'year', name: 'This Year' }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const getStockStatus = (stock, low, critical) => {
    if (critical > 0) return 'critical';
    if (low > 0) return 'low';
    return 'good';
  };

  const getStockColor = (status) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'low':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'low':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  // Chart colors
  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading reports...</p>
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
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Error Loading Reports</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchReportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderSalesReport = () => (
    <div className="space-y-6">
      {/* Sales Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Sales</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(summaryStats.totalSales)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            {formatCurrency(summaryStats.monthlySales)} this month
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Units Sold</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatNumber(summaryStats.totalUnits)} pcs
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
            {summaryStats.totalTransactions} transactions
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg. Order Value</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(summaryStats.avgOrderValue)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
            Per transaction
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Monthly Sales</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(summaryStats.monthlySales)}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
            Last 30 days
          </p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sales Trend</h3>
            <p className="text-slate-600 dark:text-slate-400">Monthly sales performance</p>
                </div>
              </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 13 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 13 }} />
              <Tooltip
                contentStyle={{ 
                  background: '#fff', 
                  borderRadius: 8, 
                  border: '1px solid #3b82f6',
                  color: '#334155' 
                }}
                formatter={(value, name) => [
                  name === 'sales' ? formatCurrency(value) : `${value} pcs`,
                  name === 'sales' ? 'Sales' : 'Units'
                ]}
              />
              <Legend />
              <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Sales" />
              <Bar dataKey="units" fill="#10B981" radius={[4, 4, 0, 0]} name="Units" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Top Selling Products</h3>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Award className="w-4 h-4" />
            By Revenue
          </div>
        </div>
        <div className="space-y-4">
          {topProducts.length > 0 ? (
            topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full text-white text-sm font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                  {product.name}
                    </p>
                                          <p className="text-sm text-slate-600 dark:text-slate-400">
                        {product.baseName} • {product.units} pcs sold
                      </p>
                  </div>
              </div>
              <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(product.sales)}
                </p>
                  {/* <p className="text-sm text-slate-600 dark:text-slate-400">
                  {product.percentage}% of total
                </p> */}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">No Sales Data</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Start making sales to see top products</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderInventoryReport = () => (
    <div className="space-y-6">
      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Stock</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatNumber(summaryStats.totalStock)}L
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
            {summaryStats.totalProducts} products
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Low Stock Items</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {summaryStats.lowStockCount}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
            Need attention
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Critical Items</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {summaryStats.criticalCount}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            Immediate action needed
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Stock Health</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {summaryStats.totalProducts > 0 ? 
                  Math.round(((summaryStats.totalProducts - summaryStats.lowStockCount) / summaryStats.totalProducts) * 100) : 0}%
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            Good stock levels
          </p>
        </div>
      </div>

      {/* Stock Levels Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Stock Levels by Category</h3>
            <p className="text-slate-600 dark:text-slate-400">Current inventory distribution</p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={stockLevels}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, stock }) => `${category}: ${stock} pcs`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="stock"
              >
                {stockLevels.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ 
                  background: '#fff', 
                  borderRadius: 8, 
                  border: '1px solid #3b82f6',
                  color: '#334155' 
                }}
                formatter={(value, name) => [`${value} pcs`, 'Stock']}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stock Levels Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Detailed Stock Analysis</h3>
        <div className="space-y-4">
          {stockLevels.length > 0 ? (
            stockLevels.map((item, index) => {
            const status = getStockStatus(item.stock, item.low, item.critical);
            return (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                    {item.category}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {item.total} products
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatNumber(item.stock)} pcs
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Total Stock</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        {item.low}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Low Stock</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        {item.critical}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Critical</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className={`text-sm font-medium ${getStockColor(status)}`}>
                        {status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">No Products Found</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Add products to see inventory analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPerformanceReport = () => (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(summaryStats.totalSales)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            All time sales
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Inventory Value</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(summaryStats.totalStock * 25)} {/* Assuming $25/pc average */}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
            Estimated value
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Transaction Count</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatNumber(summaryStats.totalTransactions)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
            Total transactions
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Key Performance Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {summaryStats.totalProducts > 0 ? Math.round((summaryStats.totalTransactions / summaryStats.totalProducts) * 100) : 0}%
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Product Turnover</p>
          </div>

          <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(summaryStats.avgOrderValue)}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Avg. Order Value</p>
          </div>

          <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {summaryStats.lowStockCount}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Low Stock Items</p>
              </div>

          <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {topProducts.length}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Top Products</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReport = () => {
    switch (selectedReport) {
      case 'sales':
        return renderSalesReport();
      case 'inventory':
        return renderInventoryReport();
      case 'performance':
        return renderPerformanceReport();
      default:
        return renderSalesReport();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Paint Analytics & Reports
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-base md:text-lg">
            Comprehensive insights into your paint business performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchReportData}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Report Type */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
              Report Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {reports.map(report => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedReport === report.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:scale-105'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    selectedReport === report.id
                      ? 'bg-white/20'
                      : 'bg-slate-200/50 dark:bg-slate-600/50'
                  }`}>
                  {report.icon}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{report.name}</p>
                    <p className={`text-xs mt-1 ${
                      selectedReport === report.id
                        ? 'text-white/80'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {report.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Period */}
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Time Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
            >
              {periods.map(period => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {renderReport()}
    </div>
  );
};

export default Reports;