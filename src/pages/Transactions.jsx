import React, { useState, useEffect } from 'react';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionDetails from '../components/transactions/TransactionDetails';
import { Plus, Search, Download, TrendingUp, TrendingDown, Package, Eye, Edit } from 'lucide-react';
import supabase from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore'; // Updated to use the correct store

const Transactions = () => {
  const { role, loading: authLoading } = useAuthStore(); // Updated to use role instead of userRole
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch transactions on component mount
    fetchTransactions();
  }, []);

  // Fetch transactions with product and base information
  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          products:product_id(name, size),
          bases:base_id(name)
        `)
        .order('created_at', { ascending: false });
        console.log("role", role);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // Transaction types for filtering
  const transactionTypes = [
    { id: 'all', name: 'All Transactions' },
    { id: 'sale', name: 'Sales' },
    { id: 'purchase', name: 'Purchases' },
    { id: 'stock_in', name: 'Stock In' },
    { id: 'stock_out', name: 'Stock Out' },
    { id: 'return', name: 'Returns' }
  ];

  // Filter transactions based on search and type
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Helper functions
  const getTypeIcon = (type) => {
    switch (type) {
      case 'sale': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'purchase': return <TrendingDown className="w-4 h-4 text-blue-500" />;
      case 'stock_in': return <Package className="w-4 h-4 text-purple-500" />;
      case 'stock_out': return <Package className="w-4 h-4 text-orange-500" />;
      case 'return': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate summary stats
  const summaryStats = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'sale') {
      acc.sales += transaction.total_amount;
      acc.profit += transaction.total_amount;
    } else if (transaction.type === 'purchase') {
      acc.purchases += transaction.total_amount;
      acc.profit -= transaction.total_amount;
    }
    if (['stock_in', 'stock_out'].includes(transaction.type)) {
      acc.stockMovements += 1;
    }
    return acc;
  }, { sales: 0, purchases: 0, stockMovements: 0, profit: 0 });

  return (
    <div className="md:ml-32 min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Paint Transactions
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-base md:text-lg">
            Track all paint sales, purchases, and stock movements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          {/* Only show "Add New Transaction" if the user is an admin or store manager */}
          {role && (role === 'admin' || role === 'store_manager') && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              New Transaction
            </button>
          )}
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Sales</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(summaryStats.sales)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <TrendingDown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Purchases</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(summaryStats.purchases)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Stock Movements</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {summaryStats.stockMovements}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Net Profit</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(summaryStats.profit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions by product or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white placeholder-slate-400 transition-all duration-200"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="md:w-64">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              {transactionTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading/Error State */}
      {(loading || authLoading) && (
        <div className="flex justify-center items-center py-12">
          <span className="text-lg text-slate-500 dark:text-slate-400 animate-pulse">Loading transactions...</span>
        </div>
      )}
      {error && (
        <div className="flex justify-center items-center py-12">
          <span className="text-lg text-red-500 dark:text-red-400">{error}</span>
        </div>
      )}

      {/* Transactions Table */}
      {!loading && !error && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Base
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(transaction.type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {transaction.reference}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                            {transaction.type.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {transaction.products?.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {transaction.products?.size}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-white">
                        {transaction.bases?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-white">
                        {transaction.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        transaction.type === 'purchase' || transaction.type === 'stock_out' 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {formatCurrency(transaction.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-white">
                        {formatDate(transaction.transaction_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center gap-2">
                      {/* View Button with Icon */}
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowDetails(true);
                        }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-md transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {/* Edit Button with Icon - Conditionally rendered for 'admin' role */}
                      {role === 'admin' && (
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowEditForm(true);
                          }}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          title="Edit transaction"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <TransactionForm
              onClose={() => setShowAddForm(false)}
              onSave={fetchTransactions}
            />
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditForm && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <TransactionForm
              transaction={selectedTransaction}
              onClose={() => {
                setShowEditForm(false);
                setSelectedTransaction(null);
              }}
              onSave={fetchTransactions}
            />
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <TransactionDetails
            transaction={selectedTransaction}
            onClose={() => {
              setShowDetails(false);
              setSelectedTransaction(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Transactions;