import React, { useState, useEffect } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Package, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { formatNumber } from '../../utils/reportUtils';
import supabase from '../../services/supabase';

const InventoryReport = ({ products }) => {
  const [stockLevels, setStockLevels] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalStock: 0,
    totalProducts: 0,
    lowStockCount: 0,
    criticalCount: 0
  });
  const [baseStockData, setBaseStockData] = useState({});

  useEffect(() => {
    async function fetchBaseStockData() {
      const productIds = products.map(p => p.id);
      if (productIds.length === 0) {
        calculateStockLevels([]);
        return;
      }

      const { data: priceData, error } = await supabase
        .from('product_prices')
        .select(`
          product_id, 
          base_id, 
          stock_level, 
          min_stock_level, 
          max_stock_level, 
          bases(name)
        `)
        .in('product_id', productIds);

      if (error) {
        console.error('Error fetching product prices:', error.message);
        calculateStockLevels([]);
        return;
      }

      const baseStockByProduct = priceData.reduce((acc, price) => {
        if (!acc[price.product_id]) {
          acc[price.product_id] = [];
        }
        acc[price.product_id].push({
          base_id: price.base_id,
          base_name: price.bases.name || 'Unknown',
          stock_level: price.stock_level || 0,
          min_stock_level: price.min_stock_level || 0,
          max_stock_level: price.max_stock_level || 0
        });
        return acc;
      }, {});

      setBaseStockData(baseStockByProduct);
      calculateStockLevels(baseStockByProduct);
    }
    fetchBaseStockData();
  }, [products]);

  const calculateStockLevels = (baseStockByProduct) => {
    const categoryStats = {};
    let totalStock = 0;
    let totalProducts = 0;
    let lowStockCount = 0;
    let criticalCount = 0;

    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          stock: 0,
          low: 0,
          critical: 0,
          total: 0
        };
      }

      const basePrices = baseStockByProduct[product.id] || [];
      const productStock = basePrices.reduce((sum, base) => sum + base.stock_level, 0);
      const productMinStock = basePrices.reduce((sum, base) => sum + base.min_stock_level, 0);

      categoryStats[category].stock += productStock;
      categoryStats[category].total += 1;

      if (productStock <= productMinStock && productStock > 0) {
        categoryStats[category].low += 1;
        lowStockCount += 1;
      }
      if (productStock <= (productMinStock * 0.25)) {
        categoryStats[category].critical += 1;
        criticalCount += 1;
      }

      totalStock += productStock;
      totalProducts += 1;
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
    setSummaryStats({
      totalStock,
      totalProducts,
      lowStockCount,
      criticalCount
    });
  };

  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

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

  return (
    <div className="space-y-6">
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
};

export default InventoryReport;