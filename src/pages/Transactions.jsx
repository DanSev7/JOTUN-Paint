import React, { useState, useEffect } from 'react';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionDetails from '../components/transactions/TransactionDetails';
import { Plus, Search, TrendingUp, TrendingDown, Package, Eye, Edit, Trash2, ShoppingCart } from 'lucide-react';
import supabase from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';

const Transactions = () => {
  const { role, loading: authLoading } = useAuthStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

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

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTransactions.length) return;
    setDeleteLoading(true);

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', selectedTransactions.map(t => t.id));

      if (error) throw error;

      setTransactions(transactions.filter(t => !selectedTransactions.map(s => s.id).includes(t.id)));
      setSelectedTransactions([]);
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err.message || 'Failed to delete transactions');
    } finally {
      setDeleteLoading(false);
    }
  };

  const updateStockLevels = async (transaction, newStatus, oldStatus) => {
    if (!transaction.product_id || !transaction.base_id) return;

    // Logic for handling stock updates based on status change
    // This is a simplified version of what's in TransactionForm
    // We only care if meaningful status changes happen like pending <-> completed

    const isBecomingCompleted = newStatus === 'completed' && oldStatus !== 'completed';
    const wasCompleted = oldStatus === 'completed' && newStatus !== 'completed';

    if (!isBecomingCompleted && !wasCompleted) return;

    try {
      const { data: currentPrice, error: fetchError } = await supabase
        .from('product_prices')
        .select('stock_level')
        .eq('product_id', transaction.product_id)
        .eq('base_id', transaction.base_id)
        .single();

      if (fetchError) throw fetchError;

      let newStockLevel = currentPrice.stock_level || 0;
      const quantity = parseInt(transaction.quantity) || 0;

      // Calculate new stock level based on transaction type and direction
      const multiplier = isBecomingCompleted ? 1 : -1;

      switch (transaction.type) {
        case 'stock_in':
        case 'purchase':
          newStockLevel += (quantity * multiplier);
          break;
        case 'stock_out':
        case 'sale':
          newStockLevel -= (quantity * multiplier);
          break;
        default:
          break;
      }

      await supabase
        .from('product_prices')
        .update({ stock_level: newStockLevel })
        .eq('product_id', transaction.product_id)
        .eq('base_id', transaction.base_id);

    } catch (err) {
      console.error('Failed to update stock levels:', err);
    }
  };

  const handleStatusChange = async (transaction, newStatus) => {
    if (transaction.status === newStatus) return;
    const oldStatus = transaction.status;

    // Optimistic update
    setTransactions(prev => prev.map(t =>
      t.id === transaction.id ? { ...t, status: newStatus } : t
    ));

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', transaction.id);

      if (error) throw error;
      await updateStockLevels(transaction, newStatus, oldStatus);
    } catch (err) {
      // Revert on error
      setTransactions(prev => prev.map(t =>
        t.id === transaction.id ? { ...t, status: oldStatus } : t
      ));
      setError(err.message || 'Failed to update status');
    }
  };

  const toggleTransactionSelection = (transaction) => {
    setSelectedTransactions(prev => {
      if (prev.some(t => t.id === transaction.id)) {
        return prev.filter(t => t.id !== transaction.id);
      }
      return [...prev, transaction];
    });
  };

  const transactionTypes = [
    { id: 'all', name: 'All Transactions' },
    { id: 'sale', name: 'Sales' },
    { id: 'purchase', name: 'Purchases' },
    { id: 'stock_in', name: 'Stock In' },
    { id: 'stock_out', name: 'Stock Out' },
  ];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch =
      transaction.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    return matchesSearch && matchesType;
  });

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
    <div className="min-h-screen overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl mt-5 font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Paint Transactions
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-base md:text-lg">
            Track all paint sales, purchases, and stock movements
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {role && (role === 'admin' || role === 'store_manager') && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              New Transaction
            </button>
          )}
          {role === 'admin' && selectedTransactions.length > 0 && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="w-full sm:w-48 md:w-64">
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

      {!loading && !error && (
        <div className="grid grid-cols-1 xl:grid-cols-1 gap-6 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 sm:p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-700/50">
                <tr>
                  {role === 'admin' && (
                    <th className="w-[10%] px-3 py-2 sm:px-4 sm:py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                        onChange={() => {
                          if (selectedTransactions.length === filteredTransactions.length) {
                            setSelectedTransactions([]);
                          } else {
                            setSelectedTransactions([...filteredTransactions]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="w-[18%] px-3 py-2 sm:px-4 sm:py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Transaction
                  </th>
                  <th className="w-[18%] px-3 py-2 sm:px-4 sm:py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Product
                  </th>
                  <th className="w-[18%] px-3 py-2 sm:px-4 sm:py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Size
                  </th>
                  <th className="w-[14%] px-3 py-2 sm:px-4 sm:py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Base
                  </th>
                  <th className="w-[10%] px-3 py-2 sm:px-4 sm:py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Qty
                  </th>
                  <th className="w-[14%] px-3 py-2 sm:px-4 sm:py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Total
                  </th>
                  <th className="w-[14%] px-3 py-2 sm:px-4 sm:py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Date
                  </th>
                  <th className="w-[12%] px-3 py-2 sm:px-4 sm:py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Status
                  </th>
                  <th className="w-[14%] px-3 py-2 sm:px-4 sm:py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    {role === 'admin' && (
                      <td className="w-[10%] px-3 py-2 sm:px-4 sm:py-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.some(t => t.id === transaction.id)}
                          onChange={() => toggleTransactionSelection(transaction)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    <td className="w-[18%] px-3 py-2 sm:px-4 sm:py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(transaction.type)}
                        <div className="ml-2 truncate">
                          <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {transaction.reference}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 capitalize truncate">
                            {transaction.type.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="w-[18%] px-3 py-2 sm:px-4 sm:py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {transaction.products?.name}
                      </div>
                    </td>
                    <td className="w-[18%] px-3 py-2 sm:px-4 sm:py-2 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-white truncate">
                        {transaction.products?.size}
                      </div>
                    </td>
                    <td className="w-[14%] px-3 py-2 sm:px-4 sm:py-2 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-white truncate">
                        {transaction.bases?.name}
                      </div>
                    </td>
                    <td className="w-[10%] px-3 py-2 sm:px-4 sm:py-2 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-white">
                        {transaction.quantity}
                      </div>
                    </td>
                    <td className="w-[14%] px-3 py-2 sm:px-4 sm:py-2 whitespace-nowrap">
                      <div className={`text-sm font-medium truncate ${transaction.type === 'purchase' || transaction.type === 'stock_out'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-900 dark:text-white'
                        }`}>
                        {formatCurrency(transaction.total_amount)}
                      </div>
                    </td>
                    <td className="w-[14%] px-3 py-2 sm:px-4 sm:py-2 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-white truncate">
                        {formatDate(transaction.transaction_date)}
                      </div>
                    </td>
                    <td className="w-[12%] px-3 py-2 sm:px-4 sm:py-2 whitespace-nowrap">
                      <select
                        value={transaction.status}
                        onChange={(e) => handleStatusChange(transaction, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${getStatusColor(transaction.status)}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="w-[14%] px-3 py-2 sm:px-4 sm:py-2 whitespace-nowrap text-right text-sm font-medium flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowDetails(true);
                        }}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-md transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {role === 'admin' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowEditForm(true);
                            }}
                            className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                            title="Edit transaction"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTransactions([transaction]);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-1 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {!loading && !error && filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No transactions found</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Try adjusting your search criteria or add a new transaction.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Confirm Delete</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">This action cannot be undone</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete {selectedTransactions.length} transaction{selectedTransactions.length > 1 ? 's' : ''}?
                This will permanently remove the selected transaction{selectedTransactions.length > 1 ? 's' : ''}.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedTransactions([]);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-150"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-150"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Deleting...
                    </span>
                  ) : (
                    `Delete ${selectedTransactions.length} Transaction${selectedTransactions.length > 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;