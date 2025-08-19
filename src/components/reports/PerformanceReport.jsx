import React, { useState, useEffect } from 'react';
import { Activity, Target, Award, AlertTriangle, DollarSign, Package, TrendingUp } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/reportUtils';
import supabase from '../../services/supabase';

const PerformanceReport = ({ products, transactions }) => {
  const [summaryStats, setSummaryStats] = useState({
    totalStock: 0,
    lowStockCount: 0,
    criticalCount: 0,
    totalSales: 0,
    totalUnits: 0,
    avgOrderValue: 0,
    monthlySales: 0,
    totalProducts: 0,
    totalTransactions: 0,
    topProducts: []
  });
  const [baseStockData, setBaseStockData] = useState({}); // Store base-specific stock data

  useEffect(() => {
    async function fetchBaseStockData() {
      const productIds = products.map(p => p.id);
      if (productIds.length === 0) {
        calculateSummaryStats([]);
        return;
      }

      const { data: priceData, error } = await supabase
        .from('product_prices')
        .select(`
          product_id, 
          base_id, 
          unit_price, 
          stock_level, 
          min_stock_level, 
          max_stock_level, 
          bases(name)
        `)
        .in('product_id', productIds);

      if (error) {
        console.error('Error fetching product prices:', error.message);
        calculateSummaryStats([]);
        return;
      }

      // Group price data by product_id
      const baseStockByProduct = priceData.reduce((acc, price) => {
        if (!acc[price.product_id]) {
          acc[price.product_id] = [];
        }
        acc[price.product_id].push({
          base_id: price.base_id,
          base_name: price.bases.name,
          unit_price: price.unit_price || 0,
          stock_level: price.stock_level || 0,
          min_stock_level: price.min_stock_level || 0,
          max_stock_level: price.max_stock_level || 0
        });
        return acc;
      }, {});

      setBaseStockData(baseStockByProduct);
      calculateSummaryStats(baseStockByProduct);
    }
    fetchBaseStockData();
  }, [products, transactions]);

  const calculateSummaryStats = (baseStockByProduct) => {
    // Calculate stock metrics
    let totalStock = 0;
    let lowStockCount = 0;
    let criticalCount = 0;
    let inventoryValue = 0;

    products.forEach(product => {
      const basePrices = baseStockByProduct[product.id] || [];
      const productStock = basePrices.reduce((sum, base) => sum + base.stock_level, 0);
      const productMinStock = basePrices.reduce((sum, base) => sum + base.min_stock_level, 0);
      const avgUnitPrice = basePrices.length > 0 
        ? basePrices.reduce((sum, base) => sum + base.unit_price, 0) / basePrices.length
        : 0;

      totalStock += productStock;
      inventoryValue += productStock * avgUnitPrice;

      if (productStock <= productMinStock && productStock > 0) {
        lowStockCount += 1;
      }
      if (productStock <= (productMinStock * 0.25)) {
        criticalCount += 1;
      }
    });

    // Calculate sales metrics
    const salesTransactions = transactions.filter(t => t.type === 'sale');
    const totalSales = salesTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    const totalUnits = salesTransactions.reduce((sum, t) => sum + (t.quantity || 0), 0);
    const avgOrderValue = salesTransactions.length > 0 ? totalSales / salesTransactions.length : 0;

    // Monthly sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlySales = salesTransactions
      .filter(t => new Date(t.created_at) >= thirtyDaysAgo)
      .reduce((sum, t) => sum + (t.total_amount || 0), 0);

    // Calculate top products
    const productSales = salesTransactions.reduce((acc, t) => {
      const product = products.find(p => p.id === t.product_id);
      if (product) {
        const productName = product.name || 'Unknown';
        if (!acc[product.id]) {
          acc[product.id] = { name: productName, unitsSold: 0 };
        }
        acc[product.id].unitsSold += t.quantity || 0;
      }
      return acc;
    }, {});
    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5); // Top 5 products

    setSummaryStats({
      totalStock,
      lowStockCount,
      criticalCount,
      totalSales,
      totalUnits,
      avgOrderValue,
      monthlySales,
      totalProducts: products.length,
      totalTransactions: transactions.length,
      topProducts
    });
  };

  return (
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
                {formatCurrency(summaryStats.inventoryValue || 0)}
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
              {summaryStats.totalProducts > 0 ? 
                Math.round((summaryStats.totalTransactions / summaryStats.totalProducts) * 100) : 0}%
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
              {summaryStats.topProducts.length}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Top Products</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceReport;