// StockChart.js
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';

// Recharts-based StockChart with real data support

const StockChart = ({ filter = 'both', transactions = [], period = 'month' }) => {
  // Generate chart data from real transactions with period filtering
  const generateChartData = () => {
    if (!transactions || transactions.length === 0) {
      // Fallback to mock data if no transactions
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
      const inwardData = [120, 150, 100, 180, 90, 130, 160, 110];
      const outwardData = [80, 110, 70, 120, 60, 90, 100, 85];

      return months.map((month, idx) => ({
        period: month,
        Inward: inwardData[idx],
        Outward: outwardData[idx],
      }));
    }

    // Filter transactions based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredTransactions = transactions.filter(t => new Date(t.created_at) >= startDate);

    if (filteredTransactions.length === 0) {
      return [{ month: 'No Data', Inward: 0, Outward: 0 }];
    }

    // Group transactions by appropriate time period
    let groupedData = {};
    
    if (period === 'today') {
      // Group by hours for daily view
      filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.created_at);
        const hour = date.getHours();
        const hourKey = `${hour}:00`;
        
        if (!groupedData[hourKey]) {
          groupedData[hourKey] = { Inward: 0, Outward: 0 };
        }
        
        if (['stock_in', 'purchase'].includes(transaction.type)) {
          groupedData[hourKey].Inward += transaction.quantity || 0;
        } else if (['stock_out', 'sale'].includes(transaction.type)) {
          groupedData[hourKey].Outward += transaction.quantity || 0;
        }
      });
    } else if (period === 'yesterday') {
      // Group by hours for yesterday view
      filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.created_at);
        const hour = date.getHours();
        const hourKey = `${hour}:00`;
        
        if (!groupedData[hourKey]) {
          groupedData[hourKey] = { Inward: 0, Outward: 0 };
        }
        
        if (['stock_in', 'purchase'].includes(transaction.type)) {
          groupedData[hourKey].Inward += transaction.quantity || 0;
        } else if (['stock_out', 'sale'].includes(transaction.type)) {
          groupedData[hourKey].Outward += transaction.quantity || 0;
        }
      });
    } else if (period === 'week') {
      // Group by days for weekly view
      filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.created_at);
        const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (!groupedData[dayKey]) {
          groupedData[dayKey] = { Inward: 0, Outward: 0 };
        }
        
        if (['stock_in', 'purchase'].includes(transaction.type)) {
          groupedData[dayKey].Inward += transaction.quantity || 0;
        } else if (['stock_out', 'sale'].includes(transaction.type)) {
          groupedData[dayKey].Outward += transaction.quantity || 0;
        }
      });
    } else {
      // Group by months for monthly/quarterly/yearly view
      filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        const monthYear = `${monthKey} ${year}`;
        
        if (!groupedData[monthYear]) {
          groupedData[monthYear] = { Inward: 0, Outward: 0 };
        }
        
        if (['stock_in', 'purchase'].includes(transaction.type)) {
          groupedData[monthYear].Inward += transaction.quantity || 0;
        } else if (['stock_out', 'sale'].includes(transaction.type)) {
          groupedData[monthYear].Outward += transaction.quantity || 0;
        }
      });
    }

    // Convert to array format for recharts
    const chartData = Object.entries(groupedData)
      .map(([period, data]) => ({
        period,
        Inward: Math.round(data.Inward),
        Outward: Math.round(data.Outward),
      }))
      .sort((a, b) => {
        if (period === 'today' || period === 'yesterday') {
          // Sort by hour
          return parseInt(a.period.split(':')[0]) - parseInt(b.period.split(':')[0]);
        } else if (period === 'week') {
          // Sort by day of week
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          return days.indexOf(a.period) - days.indexOf(b.period);
        } else {
          // Sort by month
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const aMonth = a.period.split(' ')[0];
          const bMonth = b.period.split(' ')[0];
          return months.indexOf(aMonth) - months.indexOf(bMonth);
        }
      });

    return chartData.length > 0 ? chartData : [
      { period: 'No Data', Inward: 0, Outward: 0 }
    ];
  };

  const chartData = generateChartData();

  // Filter logic for bars
  const showInward = filter === 'inward' || filter === 'both';
  const showOutward = filter === 'outward' || filter === 'both';

  // Calculate summary values from real data
  const summary = {
    inward: chartData.reduce((sum, item) => sum + (item.Inward || 0), 0),
    outward: chartData.reduce((sum, item) => sum + (item.Outward || 0), 0),
    months: chartData.length,
    peakInward: Math.max(...chartData.map(item => item.Inward || 0)),
  };

  return (
    <div className="space-y-6">
      <div className="max-h-96 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/10 dark:to-emerald-900/10 rounded-2xl p-4 shadow-inner">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barGap={8} barCategoryGap={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 13 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 13 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#fff', borderRadius: 8, border: '1px solid #3b82f6', color: '#334155' }}
              labelStyle={{ color: '#334155', fontWeight: 600 }}
              itemStyle={{ fontWeight: 500 }}
              cursor={{ fill: 'rgba(59,130,246,0.08)' }}
              formatter={(value, name) => [`${value} pcs`, name]}
            />
            <Legend
              wrapperStyle={{ paddingTop: 12 }}
              iconType="circle"
              formatter={(value) => <span style={{ color: '#334155', fontWeight: 600 }}>{value}</span>}
            />
            {showInward && <Bar dataKey="Inward" fill="#3b82f6" radius={[8, 8, 0, 0]} />}
            {showOutward && <Bar dataKey="Outward" fill="#10b981" radius={[8, 8, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {showInward && (
          <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.inward} pcs
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Inward</p>
          </div>
        )}
        {showOutward && (
          <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.outward} pcs
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Outward</p>
          </div>
        )}
        <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summary.months}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Months</p>
        </div>
        {showInward && (
          <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary.peakInward} pcs
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Peak Inward</p>
          </div>
        )}
      </div>

      {/* Status Legend */}
      <div className="flex justify-center mt-4">
        <div className="flex items-center gap-6 text-sm">
          {showInward && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-slate-600 dark:text-slate-400">Inward</span>
            </div>
          )}
          {showOutward && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-slate-600 dark:text-slate-400">Outward</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockChart;