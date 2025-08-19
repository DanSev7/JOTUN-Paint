import React, { useState, useEffect } from 'react';
import StockStatusReport from '../components/reports/StockStatusReport';
import SalesAnalysisReport from '../components/reports/SalesAnalysisReport';
import { 
  BarChart3, 
  LineChart, 
  RefreshCw 
} from 'lucide-react';
import supabase from '../services/supabase';
import { useToast } from '../contexts/ToastContext';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('stock_status');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const { showError } = useToast();

  // Fetch all report data
  const fetchReportData = async () => {
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

    } catch (err) {
      setError(err.message || 'Failed to fetch report data');
      showError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchReportData();
  }, []);

  const reports = [
    { 
      id: 'stock_status', 
      name: 'Stock Status (Daily)', 
      icon: <BarChart3 className="w-5 h-5" />, 
      description: 'Daily Interior/Exterior stock status' 
    },
    { 
      id: 'analysis', 
      name: 'Sales Analysis', 
      icon: <LineChart className="w-5 h-5" />, 
      description: 'Custom date range sales analysis' 
    }
  ];

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
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
        <div className="flex flex-col gap-6">
          {/* Report Type */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
              Report Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  <div className="p-2 rounded-lg bg-white/20">
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
        </div>
      </div>

      {/* Report Content */}
      {selectedReport === 'stock_status' && <StockStatusReport products={products} transactions={transactions} />}
      {selectedReport === 'analysis' && <SalesAnalysisReport transactions={transactions} />}
    </div>
  );
};

export default Reports;