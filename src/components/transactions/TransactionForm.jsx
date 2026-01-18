import React, { useState, useEffect } from 'react';
import { X, Save, TrendingUp, TrendingDown, Package, Trash2, DollarSign, Calendar, FileText, RefreshCw } from 'lucide-react';
import supabase from '../../services/supabase';

const TransactionForm = ({ onClose, transaction = null, onSave }) => {
  const [formData, setFormData] = useState({
    type: transaction?.type || 'sale',
    product_id: transaction?.product_id || '',
    base_id: transaction?.base_id || '',
    quantity: transaction?.quantity || 1,
    unit_price: (transaction?.type === 'stock_in' || transaction?.type === 'stock_out') ? '0.00' : (transaction?.unit_price || '0.00'),
    status: (transaction?.type === 'sale' || transaction?.type === 'purchase') ? 'pending' : (transaction?.status || 'pending'),
    transaction_date: transaction?.transaction_date || new Date().toISOString().split('T')[0],
    reference: transaction?.reference || '',
    notes: transaction?.notes || ''
  });
  
  const [products, setProducts] = useState([]);
  const [bases, setBases] = useState([]);
  const [productPrices, setProductPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, size');
        
        if (productsError) throw productsError;
        setProducts(productsData || []);

        const { data: basesData, error: basesError } = await supabase
          .from('bases')
          .select('id, name');
        
        if (basesError) throw basesError;
        setBases(basesData || []);

        if (transaction?.product_id) {
          fetchProductPrices(transaction.product_id);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [transaction]);

  const fetchProductPrices = async (productId) => {
    if (!productId) return;
    
    try {
      const { data: pricesData, error: pricesError } = await supabase
        .from('product_prices')
        .select('base_id, unit_price, stock_level, bases(name)')
        .eq('product_id', productId);
      
      if (pricesError) throw pricesError;
      setProductPrices(pricesData || []);
      
      if (transaction?.base_id) {
        const price = pricesData.find(p => p.base_id === transaction.base_id);
        if (price) {
          setFormData(prev => ({
            ...prev,
            unit_price: (formData.type === 'stock_in' || formData.type === 'stock_out') ? '0.00' : price.unit_price,
            base_id: transaction.base_id
          }));
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch product prices');
    }
  };

  const transactionTypes = [
    { id: 'sale', name: 'Sale', icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-600' },
    { id: 'purchase', name: 'Purchase', icon: <TrendingDown className="w-4 h-4" />, color: 'text-blue-600' },
    { id: 'stock_in', name: 'Stock In', icon: <Package className="w-4 h-4" />, color: 'text-purple-600' },
    { id: 'stock_out', name: 'Stock Out', icon: <Package className="w-4 h-4" />, color: 'text-orange-600' }
  ];

  const statuses = [
    { id: 'pending', name: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { id: 'completed', name: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    { id: 'cancelled', name: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'unit_price' && (formData.type === 'stock_in' || formData.type === 'stock_out')) {
      return;
    }

    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };

      if (name === 'product_id') {
        fetchProductPrices(value);
        updatedData.base_id = '';
        updatedData.unit_price = (formData.type === 'stock_in' || formData.type === 'stock_out') ? '0.00' : '0.00';
      }

      if (name === 'base_id') {
        const price = productPrices.find(p => p.base_id === value);
        updatedData.unit_price = (formData.type === 'stock_in' || formData.type === 'stock_out') ? '0.00' : (price ? price.unit_price : '0.00');
      }

      if (name === 'quantity' || name === 'unit_price') {
        const quantity = name === 'quantity' ? parseFloat(value) : parseFloat(prev.quantity);
        const unitPrice = (formData.type === 'stock_in' || formData.type === 'stock_out') 
          ? 0 
          : (name === 'unit_price' ? parseFloat(value) : parseFloat(prev.unit_price));
        updatedData.subtotal = quantity * unitPrice;
        updatedData.total_amount = (formData.type === 'purchase') 
          ? updatedData.subtotal * 1.12 
          : updatedData.subtotal;
      }

      if (name === 'type' && (value === 'stock_in' || value === 'stock_out')) {
        updatedData.unit_price = '0.00';
        updatedData.subtotal = 0;
        updatedData.total_amount = 0;
      }

      if (name === 'type' && value === 'purchase') {
        updatedData.status = 'pending';
      }

      return updatedData;
    });

    if (name === 'quantity' && (formData.type === 'sale' || formData.type === 'stock_out') && formData.base_id) {
      const selectedPrice = productPrices.find(p => p.base_id === formData.base_id);
      if (selectedPrice) {
        const currentStock = selectedPrice.stock_level || 0;
        const requestedQuantity = parseInt(value) || 0;
        
        if (requestedQuantity > currentStock) {
          setError(`⚠️ Insufficient stock! Base ${selectedPrice.bases?.name || 'Unknown'} only has ${currentStock} pcs available.`);
        } else {
          setError(null);
        }
      }
    }
  };

  const generateReference = () => {
    const type = formData.type.toUpperCase().substring(0, 3);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const timestamp = Date.now().toString().slice(-4);
    setFormData(prev => ({
      ...prev,
      reference: `${type}-${timestamp}-${random}`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if ((formData.type === 'sale' || formData.type === 'stock_out') && formData.product_id && formData.base_id) {
        const selectedPrice = productPrices.find(p => p.base_id === formData.base_id);
        if (selectedPrice) {
          const currentStock = selectedPrice.stock_level || 0;
          const requestedQuantity = parseInt(formData.quantity) || 0;
          
          if (requestedQuantity > currentStock) {
            throw new Error(`Insufficient stock! Base ${selectedPrice.bases?.name || 'Unknown'} only has ${currentStock} pcs available. Requested: ${requestedQuantity} pcs`);
          }
        }
      }
      
      const status = (formData.type === 'sale' || formData.type === 'purchase') ? 'completed' : formData.status;
      
      const transactionData = {
        ...formData,
        status,
        transaction_date: new Date(formData.transaction_date).toISOString(),
        total_amount: (formData.type === 'purchase') 
          ? parseFloat(formData.quantity) * parseFloat(formData.unit_price) * 1.12 
          : parseFloat(formData.quantity) * parseFloat(formData.unit_price)
      };

      let resp;
      if (transaction) {
        resp = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', transaction.id);
      } else {
        resp = await supabase
          .from('transactions')
          .insert([transactionData]);
      }

      if (resp.error) throw resp.error;

      // console.log('Transaction saved with status:', status);
      // console.log('Will update stock?', formData.product_id && formData.base_id && status === 'completed');

      if (formData.product_id && formData.base_id && status === 'completed') {
        // console.log('Updating stock levels...');
        await updateStockLevels();
      } else {
        console.log('Skipping stock update - status is:', status);
      }

      if (onSave) onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const updateStockLevels = async () => {
    try {
      const quantity = parseInt(formData.quantity);
      const baseId = formData.base_id;
      const productId = formData.product_id;

      const { data: currentPrice, error: fetchError } = await supabase
        .from('product_prices')
        .select('stock_level')
        .eq('product_id', productId)
        .eq('base_id', baseId)
        .single();

      if (fetchError) throw fetchError;

      let newStockLevel = currentPrice.stock_level || 0;

      switch (formData.type) {
        case 'sale':
        case 'stock_out':
          newStockLevel = Math.max(0, newStockLevel - quantity);
          break;
        case 'purchase':
        case 'stock_in':
          newStockLevel += quantity;
          break;
        default:
          break;
      }

      const { error: updateError } = await supabase
        .from('product_prices')
        .update({ stock_level: newStockLevel })
        .eq('product_id', productId)
        .eq('base_id', baseId);

      if (updateError) throw updateError;

    } catch (err) {
      console.error('Failed to update stock levels:', err);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);
      
      if (resp.error) throw resp.error;
      if (onSave) onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete transaction');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const selectedType = transactionTypes.find(t => t.id === formData.type);
  const selectedProduct = products.find(p => p.id === formData.product_id);
  const selectedBase = bases.find(b => b.id === formData.base_id);
  const subtotal = (formData.type === 'stock_in' || formData.type === 'stock_out') 
    ? 0 
    : parseFloat(formData.quantity) * parseFloat(formData.unit_price);
  const totalAmount = (formData.type === 'purchase') 
    ? subtotal * 1.12 
    : subtotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${selectedType?.color || 'text-blue-600'} bg-blue-50 dark:bg-blue-900/30`}>
                {selectedType?.icon || <TrendingUp className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {transaction ? 'Edit Transaction' : 'New Transaction'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {transaction ? 'Update transaction details' : 'Create a new transaction record'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Transaction Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Transaction Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {transactionTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <input
                      type="date"
                      name="transaction_date"
                      value={formData.transaction_date}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Reference *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="reference"
                      value={formData.reference}
                      onChange={handleChange}
                      required
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="e.g., SALE-2024-001"
                    />
                    <button
                      type="button"
                      onClick={generateReference}
                      className="px-4 py-3 text-blue-600 border border-blue-300 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product & Pricing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Product *
                  </label>
                  <select
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.size})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Base *
                  </label>
                  <select
                    name="base_id"
                    value={formData.base_id}
                    onChange={handleChange}
                    required
                    disabled={!formData.product_id || loading}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                  >
                    <option value="">Select a base</option>
                    {productPrices.map(price => (
                      <option key={price.base_id} value={price.base_id}>
                        {price.bases.name} - ${price.unit_price.toFixed(2)} (Stock: {price.stock_level || 0} pcs)
                      </option>
                    ))}
                  </select>
                  {formData.base_id && (() => {
                    const selectedPrice = productPrices.find(p => p.base_id === formData.base_id);
                    if (selectedPrice) {
                      const stockLevel = selectedPrice.stock_level || 0;
                      const isLowStock = stockLevel <= 10;
                      return (
                        <div className={`mt-2 px-3 py-2 rounded-lg text-sm ${isLowStock ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'}`}>
                          <span className="font-medium">Current Stock:</span> {stockLevel} pcs
                          {isLowStock && <span className="ml-2 font-semibold">⚠️ Low Stock</span>}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {error && formData.base_id && (formData.type === 'sale' || formData.type === 'stock_out') && (
                    <div className="mt-2 px-3 py-2 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700">
                      {error}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={formData.type === 'sale' || formData.type === 'purchase'}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                  >
                    {statuses.map(status => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={`grid ${formData.type === 'purchase' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6`}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    min="1"
                    step="1"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Unit Price *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <input
                      type="number"
                      name="unit_price"
                      value={formData.unit_price}
                      onChange={handleChange}
                      disabled={formData.type === 'stock_in' || formData.type === 'stock_out' || !formData.base_id}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                    />
                  </div>
                </div>

                {formData.type === 'purchase' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Subtotal
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={subtotal.toFixed(2)}
                        readOnly
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Total Amount
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={totalAmount.toFixed(2)}
                      readOnly
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Additional Information
              </h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Add any additional notes about this transaction..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
              <div>
                {transaction && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? (transaction ? 'Updating...' : 'Adding...') : transaction ? 'Update Transaction' : 'Add Transaction'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                Delete Transaction
              </h3>
              
              <p className="mb-8 text-gray-600 dark:text-gray-400 leading-relaxed">
                Are you sure you want to delete transaction <span className="font-semibold text-gray-900 dark:text-white">{transaction?.reference}</span>? 
                This action cannot be undone and will permanently remove all transaction data.
              </p>
              
              <div className="flex justify-center gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowDeleteConfirm(false)} 
                  disabled={loading}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleDelete} 
                  disabled={loading}
                  className="px-6 py-2 text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionForm;