import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { exportToExcel, formatCurrency } from '../../utils/reportUtils';

const StockInAnalysisReport = ({ transactions }) => {
  const [analysisRows, setAnalysisRows] = useState([]);
  const [analysisTotal, setAnalysisTotal] = useState(0);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    computeStockInAnalysis();
  }, [transactions, startDate, endDate]);

  const computeStockInAnalysis = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1); // Include end date in range

    const rows = [];
    const filtered = transactions.filter(t => {
      if (t.type !== 'purchase') return false;
      const ts = new Date(t.transaction_date || t.created_at);
      return ts >= start && ts < end;
    });

    let total = 0;
    filtered.forEach(t => {
      rows.push({
        'Date': new Date(t.transaction_date || t.created_at).toISOString().split('T')[0],
        'Product Name': t.products?.name || 'Unknown',
        'Size': t.products?.size || 'Unknown',
        'Base': t.bases?.name || 'Unknown',
        'Quantity Received': t.quantity || 0,
        'Total Cost': (t.total_amount || 0).toFixed(2)
      });
      total += (t.total_amount || 0);
    });

    setAnalysisRows(rows);
    setAnalysisTotal(total);
  };

  const headers = ['Date', 'Product Name', 'Size', 'Base', 'Quantity Received', 'Total Cost'];
  const exportAnalysis = () => exportToExcel(`Purchase${startDate}_to_${endDate}.xlsx`, headers, analysisRows, formatCurrency(analysisTotal));

  const renderTable = (rows) => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs sm:text-sm">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-700/50">
            {headers.map(h => (
              <th key={h} className="px-2 py-1 sm:px-4 sm:py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-2 py-4 sm:px-4 sm:py-6 text-center text-slate-500 dark:text-slate-400">
                No rows
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-100 dark:border-slate-700">
                {headers.map(h => (
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
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Stock-In Analysis</h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Stock received data for the selected date range</p>
          </div>
          <div className="flex items-center gap-3 flex-col sm:flex-row">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm w-full sm:w-auto"
              />
            </div>
            <span className="text-slate-600 dark:text-slate-400 text-sm hidden mt-4 sm:block">to</span>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm w-full sm:w-auto"
              />
            </div>
            <button
              onClick={exportAnalysis}
              disabled={analysisRows.length === 0}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg ${
                analysisRows.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Download className="w-4 h-4" /> Export XLSX
            </button>
          </div>
        </div>
        <div className="md:hidden">
          {renderTable(analysisRows)}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700/50">
                {headers.map(h => (
                  <th key={h} className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analysisRows.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No rows
                  </td>
                </tr>
              ) : (
                analysisRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-700">
                    {headers.map(h => (
                      <td key={h} className="px-4 py-2 whitespace-nowrap text-slate-800 dark:text-slate-200">
                        {row[h]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end mt-4">
          <div className="text-right">
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Cost</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(analysisTotal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockInAnalysisReport;