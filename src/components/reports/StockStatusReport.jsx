import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { exportToExcel } from '../../utils/reportUtils';
import supabase from '../../services/supabase';

const StockStatusReport = ({ products, transactions }) => {
  const [stockStatusDate, setStockStatusDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [stockStatusInterior, setStockStatusInterior] = useState([]);
  const [stockStatusExterior, setStockStatusExterior] = useState([]);
  const [baseStockData, setBaseStockData] = useState({}); // Store base-specific stock data

  useEffect(() => {
    async function fetchBaseStockData() {
      const productIds = products.map(p => p.id);
      if (productIds.length === 0) {
        computeDailyStockStatus(new Date(stockStatusDate), []);
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
        computeDailyStockStatus(new Date(stockStatusDate), []);
        return;
      }

      // Group price data by product_id
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
      computeDailyStockStatus(new Date(stockStatusDate), baseStockByProduct);
    }
    fetchBaseStockData();
  }, [stockStatusDate, products, transactions]);

  const computeDailyStockStatus = (dateObj, baseStockByProduct) => {
    const dayStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const rowsInterior = [];
    const rowsExterior = [];

    // Precompute recent average sales per base (last 7 days) for EOQ heuristic
    const sevenDaysAgo = new Date(dayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSales = {};
    transactions
      .filter(t => t.type === 'sale' && new Date(t.transaction_date || t.created_at) >= sevenDaysAgo)
      .forEach(t => {
        const key = `${t.product_id}-${t.base_id}`;
        recentSales[key] = (recentSales[key] || 0) + (t.quantity || 0);
      });

    const txToday = transactions.filter(t => {
      const ts = new Date(t.transaction_date || t.created_at);
      return ts >= dayStart && ts < dayEnd;
    });

    products.forEach(product => {
      const category = (product.category || '').toLowerCase();
      const isInterior = category.includes('interior');
      const isExterior = category.includes('exterior');

      const basePrices = baseStockByProduct[product.id] || [];
      basePrices.forEach(price => {
        const key = `${product.id}-${price.base_id}`;
        const receiving = txToday
          .filter(t => t.product_id === product.id && t.base_id === price.base_id && (t.type === 'stock_in' || t.type === 'purchase'))
          .reduce((sum, t) => sum + (t.quantity || 0), 0);
        const issuance = txToday
          .filter(t => t.product_id === product.id && t.base_id === price.base_id && (t.type === 'sale' || t.type === 'stock_out'))
          .reduce((sum, t) => sum + (t.quantity || 0), 0);

        const ending = price.stock_level || 0; // Current stock level
        const beginning = ending - receiving + issuance; // Approximation for start of day
        const reorderPoint = price.min_stock_level || 0; // Use base-specific min_stock_level
        const avgDaily = (recentSales[key] || 0) / 7; // Last 7 days average
        const eoq = price.max_stock_level - price.min_stock_level || 0;
        const maxStock = price.max_stock_level || reorderPoint + eoq; // Use max_stock_level, fallback to EOQ
        const qtyToOrder = Math.max(0, maxStock - ending);
        const variation = ending - reorderPoint; // Positive means above reorder point

        const row = {
          'Product name': product.name,
          'Size': product.size || 'N/A', // Add Size field
          'Base': price.base_name,
          'Begining balance': Math.max(0, beginning),
          'Daily receiving(pcs)': receiving,
          'Daily issuance(pcs)': issuance,
          'Ending Balance(pcs)': ending,
          'Re-order Point (pcs)': reorderPoint,
          'Variation (pcs)': variation,
          'Economic Order Quantity (pcs)': eoq,
          'Maximum Stock (pcs)': maxStock,
          'Quantity to be ordered(pcs)': qtyToOrder
        };

        if (isInterior) rowsInterior.push(row);
        if (isExterior) rowsExterior.push(row);
      });
    });

    setStockStatusInterior(rowsInterior);
    setStockStatusExterior(rowsExterior);
  };

  const headers = [
    'Product name',
    'Size',
    'Base',
    'Begining balance',
    'Daily receiving(pcs)',
    'Daily issuance(pcs)',
    'Ending Balance(pcs)',
    'Re-order Point (pcs)',
    'Variation (pcs)',
    'Economic Order Quantity (pcs)',
    'Maximum Stock (pcs)',
    'Quantity to be ordered(pcs)'
  ];

  const exportInterior = () => exportToExcel(`stock_status_interior_${stockStatusDate}.xlsx`, headers, stockStatusInterior);
  const exportExterior = () => exportToExcel(`stock_status_exterior_${stockStatusDate}.xlsx`, headers, stockStatusExterior);

  const renderTable = (rows) => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-700/50">
            {headers.map(h => (
              <th key={h} className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">No rows</td>
            </tr>
          ) : (
            rows.map((row, idx) => (
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
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Daily Stock Status</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Interior and Exterior stock movement for the selected day</p>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={stockStatusDate}
                onChange={(e) => setStockStatusDate(e.target.value)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Interior */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Interior</h4>
            <button
              onClick={exportInterior}
              disabled={stockStatusInterior.length === 0}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg ${
                stockStatusInterior.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Download className="w-4 h-4" /> Export XLSX
            </button>
          </div>
          {renderTable(stockStatusInterior)}
        </div>

        {/* Exterior */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Exterior</h4>
            <button
              onClick={exportExterior}
              disabled={stockStatusExterior.length === 0}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg ${
                stockStatusExterior.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Download className="w-4 h-4" /> Export XLSX
            </button>
          </div>
          {renderTable(stockStatusExterior)}
        </div>
      </div>
    </div>
  );
};

export default StockStatusReport;