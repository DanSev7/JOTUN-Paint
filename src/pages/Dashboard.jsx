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
  TrendingDown,
  Edit3
} from 'lucide-react';
import supabase from '../services/supabase';
import { useToast } from '../contexts/ToastContext';

const Dashboard = () => {
  const [stockFilter, setStockFilter] = useState('both');
  const [stockPeriodFilter, setStockPeriodFilter] = useState('month');
  const [transactionFilter, setTransactionFilter] = useState('day');
  const [productsFilter, setProductsFilter] = useState('month');
  const [salesFilter, setSalesFilter] = useState('month');

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

  // Utility function to get start date for filters
  const getStartDate = (filter) => {
    const now = new Date();
    switch (filter) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        return new Date(now.getFullYear(), quarterStartMonth, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      case 'all':
        return new Date(0);
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  };

  // Helper function to get sales title based on filter
  const getSalesTitle = (filter) => {
    switch (filter) {
      case 'day': return 'Daily Sales';
      case 'week': return 'Weekly Sales';
      case 'month': return 'Monthly Sales';
      case 'year': return 'Yearly Sales';
      default: return 'Daily Sales';
    }
  };

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch products with prices and stock levels
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_prices:product_prices(
            unit_price,
            stock_level,
            bases:base_id(name)
          )
        `);
      
      if (productsError) throw productsError;

      // Process products to include base-specific stock info
      const processedProducts = (productsData || []).map(product => {
        // Calculate total stock from all bases
        const totalStock = (product.product_prices || []).reduce((sum, price) => sum + (price.stock_level || 0), 0);
        
        // Get all base prices and stock levels
        const basePrices = (product.product_prices || []).map(price => ({
          baseId: price.base_id,
          baseName: price.bases?.name || 'Unknown',
          unitPrice: price.unit_price || 0,
          stockLevel: price.stock_level || 0
        }));

        return {
          ...product,
          totalStock,
          basePrices
        };
      });

      // Fetch transactions with product and base info
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          products:product_id(name, size, unit, category),
          bases:base_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;

      setProducts(processedProducts || []);
      setTransactions(transactionsData || []);

      // Calculate KPIs and other data
      calculateKPIs(processedProducts || [], transactionsData || []);
      calculateLowStockItems(processedProducts || []);
      calculateRecentTransactions(transactionsData || []);
      calculateFrequentProducts(transactionsData || []);

    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPI data from real data
  const calculateKPIs = (processedProducts, transactionsData) => {
    // Total Products Count
    // const totalProducts = processedProducts.length;
    
    // Total Paint Stock - sum all base stock levels
    const totalStock = processedProducts.reduce((sum, product) => sum + (product.totalStock || 0), 0);
    
    // Sales based on selected period
    const salesStartDate = getStartDate(salesFilter);
    const currentSales = transactionsData
      .filter(t => t.type === 'sale' && new Date(t.created_at) >= salesStartDate)
      .reduce((sum, t) => sum + (t.total_amount || 0), 0);
    
    // Exterior Paints stock
    const exteriorPaints = processedProducts
      .filter(p => p.category?.toLowerCase().includes('exterior'))
      .reduce((sum, p) => sum + (p.totalStock || 0), 0);
    
    // Interior Paints stock
    const interiorPaints = processedProducts
      .filter(p => p.category?.toLowerCase().includes('interior'))
      .reduce((sum, p) => sum + (p.totalStock || 0), 0);
    
    // Low Stock Items count - count per base low stock instances
    const lowStockCount = processedProducts.reduce((count, p) => {
      return count + (p.basePrices || []).filter(b => 
        b.stockLevel <= p.min_stock_level && b.stockLevel > 0
      ).length;
    }, 0);

    // Mock percentage changes
    const kpis = [
      // {
      //   title: 'Total Products',
      //   value: totalProducts.toString(),
      //   unit: 'products',
      //   change: '+2.1%',
      //   changeType: 'positive',
      //   icon: <Package className="w-5 h-5" />,
      //   gradient: 'from-purple-500 to-purple-600'
      // },
      {
        title: 'Total Stock Quantity',
        value: totalStock.toLocaleString(),
        unit: 'pcs',
        change: '+12.5%',
        changeType: 'positive',
        icon: <Package className="w-5 h-5" />,
        gradient: 'from-indigo-500 to-indigo-600'
      },
      {
        title: getSalesTitle(salesFilter),
        value: `$${currentSales.toLocaleString()}`,
        unit: '',
        change: '+8.7%',
        changeType: 'positive',
        icon: <DollarSign className="w-5 h-5" />,
        gradient: 'from-green-500 to-green-600'
      },
      {
        title: 'Exterior Paints',
        value: exteriorPaints.toLocaleString(),
        unit: 'pcs',
        change: '+5.2%',
        changeType: 'positive',
        icon: <Paintbrush className="w-5 h-5" />,
        gradient: 'from-blue-500 to-blue-600'
      },
      {
        title: 'Interior Paints',
        value: interiorPaints.toLocaleString(),
        unit: 'pcs',
        change: '+7.8%',
        changeType: 'positive',
        icon: <Paintbrush className="w-5 h-5" />,
        gradient: 'from-emerald-500 to-emerald-600'
      },
      {
        title: 'Low Stock Items',
        value: lowStockCount.toString(),
        unit: 'items',
        change: '-5.2%',
        changeType: 'negative',
        icon: <AlertTriangle className="w-5 h-5" />,
        gradient: 'from-red-500 to-red-600'
      }
    ];

    setKpiData(kpis);
  };

  // Calculate low stock items with base-specific information
  const calculateLowStockItems = (processedProducts) => {
    const lowStockItemsList = [];
    
    processedProducts.forEach(product => {
      if (product.basePrices && product.basePrices.length > 0) {
        product.basePrices.forEach(base => {
          if (base.stockLevel <= product.min_stock_level && base.stockLevel > 0) {
            const stockPercentage = (base.stockLevel / product.min_stock_level) * 100;
            let urgency = 'low';
            if (stockPercentage <= 25) urgency = 'critical';
            else if (stockPercentage <= 50) urgency = 'warning';

            lowStockItemsList.push({
              id: `${product.id}-${base.baseId}`,
              name: product.name,
              baseName: base.baseName,
              currentStock: base.stockLevel,
              minStock: product.min_stock_level,
              unit: 'pcs',
              supplier: 'Jotun Ethiopia',
              category: product.category || 'Uncategorized',
              urgency,
              productId: product.id,
              baseId: base.baseId
            });
          }
        });
      }
    });

    // Sort by urgency and limit to top 10
    const sortedLowStock = lowStockItemsList
      .sort((a, b) => {
        const urgencyOrder = { critical: 0, warning: 1, low: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      })
      .slice(0, 10);

    setLowStockItems(sortedLowStock);
  };

  // Calculate recent transactions
  const calculateRecentTransactions = (transactionsData) => {
    const startDate = getStartDate(transactionFilter);
    const filteredTransactions = transactionsData.filter(transaction => new Date(transaction.created_at) >= startDate);
    const recent = filteredTransactions
      .slice(0, 8)
      .map(transaction => ({
        id: transaction.id,
        type: transaction.type,
        product: transaction.products?.name || 'Unknown Product',
        quantity: `${transaction.quantity} pcs`,
        amount: `$${(transaction.total_amount || 0).toFixed(2)}`,
        timestamp: formatTimeAgo(transaction.created_at),
        user: 'System'
      }));

    setRecentTransactions(recent);
  };

  // Calculate frequent products by base
  const calculateFrequentProducts = (transactionsData) => {
    const startDate = getStartDate(productsFilter);
    const filteredTransactions = transactionsData.filter(t => t.type === 'sale' && new Date(t.created_at) >= startDate);
    const baseStats = {};
    
    filteredTransactions.forEach(transaction => {
      const productName = transaction.products?.name;
      const baseId = transaction.base_id;
      const baseName = transaction.bases?.name;
      if (productName && baseId && baseName) {
        const key = `${productName}-${baseId}`;
        if (!baseStats[key]) {
          baseStats[key] = {
            soldQuantity: 0,
            revenue: 0,
            id: transaction.product_id,
            baseId: baseId,
            productName: productName,
            baseName: baseName
          };
        }
        baseStats[key].soldQuantity += transaction.quantity || 0;
        baseStats[key].revenue += transaction.total_amount || 0;
      }
    });

    const frequent = Object.entries(baseStats)
      .map(([key, stats]) => ({
        id: stats.id,
        name: stats.productName,
        baseId: stats.baseId,
        baseName: stats.baseName,
        soldQuantity: stats.soldQuantity,
        unit: 'pcs',
        revenue: `$${stats.revenue.toFixed(0)}`,
        trend: 'up'
      }))
      .sort((a, b) => parseFloat(b.revenue.replace('$', '')) - parseFloat(a.revenue.replace('$', '')))
      .slice(0, 4);

    setFrequentProducts(frequent);
  };

  // Utility function to format time ago
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} weeks ago`;
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Recalculate KPIs when sales filter changes
  useEffect(() => {
    if (products.length > 0 && transactions.length > 0) {
      calculateKPIs(products, transactions);
    }
  }, [salesFilter, products, transactions]);

  // Recalculate low stock items when products change
  useEffect(() => {
    if (products.length > 0) {
      calculateLowStockItems(products);
    }
  }, [products]);

  // Recalculate recent transactions when filter changes
  useEffect(() => {
    if (transactions.length > 0) {
      calculateRecentTransactions(transactions);
    }
  }, [transactionFilter, transactions]);

  // Recalculate frequent products when filter changes
  useEffect(() => {
    if (transactions.length > 0) {
      calculateFrequentProducts(transactions);
    }
  }, [productsFilter, transactions]);

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

  // Utility functions
  const getUrgencyStyle = (urgency) => {
    switch (urgency) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-700',
          text: 'text-red-700 dark:text-red-300',
          badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-200 dark:border-amber-700',
          text: 'text-amber-700 dark:text-amber-300',
          badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
        };
      default:
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-700',
          text: 'text-orange-700 dark:text-orange-300',
          badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
        };
    }
  };

  const getTransactionStyle = (type) => {
    return type === 'sale' 
      ? {
          icon: <DollarSign className="w-5 h-5" />,
          iconBg: 'bg-green-100 dark:bg-green-900/30',
          iconColor: 'text-green-600 dark:text-green-400',
          badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        }
      : {
          icon: <Truck className="w-5 h-5" />,
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
          badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
        };
  };

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
            onClick={fetchDashboardData}
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
              { id: 'day', name: 'Daily' },
              { id: 'week', name: 'Weekly' },
              { id: 'month', name: 'Monthly' },
              { id: 'year', name: 'Yearly' }
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
                Stock Movement - {stockPeriodFilter.charAt(0).toUpperCase() + stockPeriodFilter.slice(1)}ly
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
          
          {/* Stock Period Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Select time period for stock movement data
            </div>
            <div className="flex gap-2">
              {[
                { id: 'day', name: 'Daily' },
                { id: 'week', name: 'Weekly' },
                { id: 'month', name: 'Monthly' },
                { id: 'year', name: 'Yearly' }
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
              <h3 className="text-xl font-bold text-red-700 dark:text-red-300">Low Stock Alert</h3>
              <p className="text-sm text-red-600 dark:text-red-400">Items requiring immediate attention</p>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => {
                const urgencyStyle = getUrgencyStyle(item.urgency);
                const stockPercentage = (item.currentStock / item.minStock) * 100;
                
                return (
                  <div key={item.id} className={`p-4 rounded-xl ${urgencyStyle.bg} ${urgencyStyle.border} border shadow-sm hover:shadow-md transition-all duration-200 group`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{item.name}</h4>
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
                    
                    {/* Stock level bar */}
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
                        onClick={() => navigate(`/products?edit=${item.productId}`)}
                        className="flex-1 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 text-sky-500 font-semibold text-sm shadow hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                      >
                        <Package className="w-4 h-4" />
                        Reorder
                      </button>
                      <button 
                        onClick={() => navigate(`/products?edit=${item.productId}&base=${item.baseId}`)}
                        className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm shadow hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                      >
                        <Edit3 className="w-4 h-4" />
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
                <p className="text-sm text-slate-600 dark:text-slate-400">No low stock items to display</p>
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
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
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
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Most popular items by volume</p>
            </div>
            <select 
              value={productsFilter}
              onChange={(e) => setProductsFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
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
    </div>
  );
};

export default Dashboard;