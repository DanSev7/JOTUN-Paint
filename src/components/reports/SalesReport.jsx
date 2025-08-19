import React, { useState, useEffect } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
//   Award
} from 'recharts';
import { Award, Target } from "lucide-react";
import { TrendingUp, DollarSign, Package } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/reportUtils';

const SalesReport = ({ transactions }) => {
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [summaryStats, setSummaryStats] = useState({});

  useEffect(() => {
    calculateSalesData();
    calculateTopProducts();
    calculateSummaryStats();
  }, [transactions]);

  const calculateSalesData = () => {
    const monthlyData = {};
    
    transactions
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

  const calculateTopProducts = () => {
    const baseStats = {};
    
    transactions
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

  const calculateSummaryStats = () => {
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

    setSummaryStats({
      totalSales,
      totalUnits,
      avgOrderValue,
      monthlySales,
      totalTransactions: salesTransactions.length
    });
  };

  const chartColors = ['#3B82F6', '#10B981'];

  return (
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
              <Bar dataKey="sales" fill={chartColors[0]} radius={[4, 4, 0, 0]} name="Sales" />
              <Bar dataKey="units" fill={chartColors[1]} radius={[4, 4, 0, 0]} name="Units" />
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
};

export default SalesReport;