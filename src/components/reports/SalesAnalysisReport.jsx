import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { exportToExcel, formatCurrency } from '../../utils/reportUtils';

const SalesAnalysisReport = ({ transactions }) => {
  const [salesRows, setSalesRows] = useState([]);
  const [analysisTotal, setAnalysisTotal] = useState(0);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    computeAnalysis();
  }, [transactions, startDate, endDate]);

  const computeAnalysis = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1); // Include end date in range

    // Sales Transactions
    const filteredSales = transactions.filter(t => {
      if (t.type !== 'sale') return false;
      const ts = new Date(t.transaction_date || t.created_at);
      return ts >= start && ts < end;
    });

    const salesRows = filteredSales.map(t => ({
      'Date': new Date(t.transaction_date || t.created_at).toISOString().split('T')[0],
      'Product Name': t.products?.name || 'Unknown',
      'Size': t.products?.size || 'Unknown',
      'Base': t.bases?.name || 'Unknown',
      'Quantity sold': t.quantity || 0,
      'Total Sales': formatCurrency(t.total_amount || 0)
    }));

    const totalSales = filteredSales.reduce((sum, t) => sum + (t.total_amount || 0), 0);

    setSalesRows(salesRows);
    setAnalysisTotal(totalSales);
    computeMonthlySummary(transactions.filter(t => ['sale', 'purchase'].includes(t.type) && new Date(t.transaction_date || t.created_at) >= start && new Date(t.transaction_date || t.created_at) < end));
  };

  const computeMonthlySummary = (filteredTransactions) => {
    const months = {};
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    filteredTransactions.forEach(t => {
      const date = new Date(t.transaction_date || t.created_at);
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthKey = `${monthNames[month]} ${year}`;

      if (!months[monthKey]) {
        months[monthKey] = {
          sales: 0,
          cost: 0,
          productQuantities: {}
        };
      }

      if (t.type === 'sale') {
        months[monthKey].sales += t.total_amount || 0;
        const productKey = `${t.products?.name || 'Unknown'} (${t.bases?.name || 'Unknown'})`;
        months[monthKey].productQuantities[productKey] = (months[monthKey].productQuantities[productKey] || 0) + (t.quantity || 0);
      } else if (t.type === 'purchase') {
        months[monthKey].cost += t.total_amount || 0;
      }
    });

    const summary = Object.entries(months).map(([month, data]) => {
      const profit = data.sales - data.cost;

      // Find top and lowest selling products by quantity
      const sortedProducts = Object.entries(data.productQuantities).sort((a, b) => b[1] - a[1]);
      
      // Find lowest selling product (products with 0 or minimal quantity)
      let lowestProduct = 'N/A';
      if (sortedProducts.length > 0) {
        // Check for products with 0 quantity first
        const zeroQuantityProducts = sortedProducts.filter(([, qty]) => qty === 0);
        if (zeroQuantityProducts.length > 0) {
          lowestProduct = zeroQuantityProducts[0][0];
        } else {
          // If no 0 quantity products, take the product with lowest non-zero quantity
          lowestProduct = sortedProducts[sortedProducts.length - 1][0];
        }
      }

      const topProduct = sortedProducts.length > 0 ? sortedProducts[0][0] : 'N/A';

      return {
        Month: month,
        'Total Sales (ETB)': formatCurrency(data.sales),
        'Total Cost (ETB)': formatCurrency(data.cost),
        'Total Profit (ETB)': formatCurrency(profit),
        'Top-Selling Product (Qty)': topProduct,
        'Lowest-Selling Product (Qty)': lowestProduct,
        Comments: ''
      };
    });

    setMonthlySummary(summary);
  };

  const salesHeaders = ['Date', 'Product Name', 'Size', 'Base', 'Quantity sold', 'Total Sales'];
  const monthlyHeaders = [
    'Month', 
    'Total Sales (ETB)', 
    'Total Cost (ETB)', 
    'Total Profit (ETB)', 
    'Top-Selling Product (Qty)', 
    'Lowest-Selling Product (Qty)', 
    'Comments'
  ];

  const exportSalesAnalysis = () => exportToExcel(`sales_analysis_${startDate}_to_${endDate}.xlsx`, salesHeaders, salesRows, `Total: ${formatCurrency(analysisTotal)}`);
  const exportMonthlySummary = () => exportToExcel(`monthly_sales_summary_${startDate}_to_${endDate}.xlsx`, monthlyHeaders, monthlySummary);

  const renderTable = (rows, tableHeaders, title) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6">
      <h4 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h4>
      <div className="overflow-x-auto">
        <table className="min-w-[900px] text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700/50">
              {tableHeaders.map(h => (
                <th key={h} className="px-2 py-1 sm:px-4 sm:py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={tableHeaders.length} className="px-2 py-4 sm:px-4 sm:py-6 text-center text-slate-500 dark:text-slate-400">
                  No data available
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 dark:border-slate-700">
                  {tableHeaders.map(h => (
                    <td key={h} className="px-2 py-1 sm:px-4 sm:py-2 whitespace-nowrap text-slate-800 dark:text-slate-200">
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Sales Analysis Dashboard</h4>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Comprehensive sales data with monthly summaries</p>
        </div>
        <div className="flex items-center gap-3 flex-col sm:flex-row">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm w-full sm:w-auto transition-all duration-200"
            />
          </div>
          <span className="text-slate-600 dark:text-slate-400 text-sm hidden mt-4 sm:block">to</span>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm w-full sm:w-auto transition-all duration-200"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <button
            onClick={exportSalesAnalysis}
            disabled={salesRows.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl transition-all duration-200 ${
              salesRows.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Download className="w-4 h-4" /> Export Sales
          </button>
          <button
            onClick={exportMonthlySummary}
            disabled={monthlySummary.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl transition-all duration-200 ${
              monthlySummary.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <Download className="w-4 h-4" /> Export Monthly Summary
          </button>
        </div>
      </div>

      {/* Sales Transactions Table */}
      {renderTable(salesRows, salesHeaders, 'Detailed Sales Report')}

      {/* Total Sales */}
      <div className="flex items-center justify-end mb-6">
        <div className="text-right">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Sales</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(analysisTotal)}</p>
        </div>
      </div>

      {/* Monthly Summary Table */}
      {renderTable(monthlySummary, monthlyHeaders, 'Monthly Sales Summary')}
    </div>
  );
};

export default SalesAnalysisReport;