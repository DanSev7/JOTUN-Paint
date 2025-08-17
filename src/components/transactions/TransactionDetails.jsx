// src/components/transactions/TransactionDetails.js
import React from 'react';
import { X, TrendingUp, TrendingDown, Package } from 'lucide-react';

const TransactionDetails = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'sale': return <TrendingUp className="w-6 h-6 text-green-500" />;
      case 'purchase': return <TrendingDown className="w-6 h-6 text-blue-500" />;
      case 'stock_in': return <Package className="w-6 h-6 text-purple-500" />;
      case 'stock_out': return <Package className="w-6 h-6 text-orange-500" />;
      case 'return': return <TrendingDown className="w-6 h-6 text-red-500" />;
      default: return <Package className="w-6 h-6 text-gray-500" />;
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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Transaction Details</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-700">
          {getTypeIcon(transaction.type)}
          <div>
            <p className="text-xl font-semibold text-slate-900 dark:text-white capitalize">{transaction.type.replace('_', ' ')}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ref: {transaction.reference}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Product</p>
            <p className="text-lg text-slate-900 dark:text-white">{transaction.products?.name} ({transaction.products?.size})</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Base</p>
            <p className="text-lg text-slate-900 dark:text-white">{transaction.bases?.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Quantity</p>
            <p className="text-lg text-slate-900 dark:text-white">{transaction.quantity}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Amount</p>
            <p className={`text-lg font-bold ${
              ['purchase', 'stock_out'].includes(transaction.type) ? 'text-red-600' : 'text-green-600'
            }`}>{formatCurrency(transaction.total_amount)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Date</p>
            <p className="text-lg text-slate-900 dark:text-white">{formatDate(transaction.transaction_date)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </span>
          </div>
        </div>

        {transaction.notes && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Notes</p>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{transaction.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionDetails;