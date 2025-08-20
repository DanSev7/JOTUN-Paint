import React, { useState, useEffect } from 'react';
import { Package, DollarSign } from 'lucide-react';

// Handler to initiate reorder
export const handleReorder = (item, products, setReorderItem, setShowReorderModal) => {
  // Find the current unit price for this base
  const product = products.find(p => p.id === item.productId);
  const basePrice = product?.basePrices?.find(bp => bp.baseId === item.baseId);
  const currentUnitPrice = basePrice?.unitPrice || 0;

  // Add current unit price to the item
  const itemWithPrice = {
    ...item,
    currentUnitPrice: currentUnitPrice
  };

  setReorderItem(itemWithPrice);
  setShowReorderModal(true);
};

// Handler to submit reorder
export const handleReorderSubmit = async (formData, reorderItem, supabase, showSuccess, showError, fetchDashboardData, setShowReorderModal, setReorderItem) => {
  if (!reorderItem) {
    console.error('No reorder item provided');
    showError('No item selected for reorder', 3000);
    return;
  }

  try {
    console.log('Submitting reorder with formData:', formData, 'reorderItem:', reorderItem);

    // Validate form data
    if (formData.quantity <= 0) {
      console.log('Form validation failed: Invalid quantity');
      showError('Quantity must be greater than 0', 3000);
      return;
    }
    if (formData.type === 'purchase' && formData.unit_price <= 0) {
      console.log('Form validation failed: Invalid unit price for purchase');
      showError('Unit price must be greater than 0 for purchases', 3000);
      return;
    }

    // Prepare transaction data
    const transactionData = {
      type: formData.type, // 'stock_in' or 'purchase'
      product_id: reorderItem.productId,
      base_id: reorderItem.baseId,
      size: reorderItem.size,
      quantity: formData.quantity,
      unit_price: formData.type === 'stock_in' ? 0 : formData.unit_price, // Force 0 for stock_in
      total_amount: formData.type === 'stock_in' ? 0 : formData.total_amount, // Use provided total_amount for purchase
      status: formData.status,
      transaction_date: new Date(formData.transaction_date).toISOString(),
      reference: formData.reference
    };

    console.log('Inserting transaction:', transactionData);

    // Insert transaction into Supabase
    const { data: transactionDataResult, error: transactionError } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (transactionError) {
      console.error('Supabase transaction insert error:', transactionError);
      throw new Error(`Failed to submit reorder: ${transactionError.message}`);
    }

    console.log('Supabase transaction insert successful, data:', transactionDataResult);

    // Update product_prices table if status is completed
    if (formData.status === 'completed') {
      const { data: productPrice, error: fetchError } = await supabase
        .from('product_prices')
        .select('stock_level')
        .eq('product_id', reorderItem.productId)
        .eq('base_id', reorderItem.baseId)
        .single();

      if (fetchError) {
        console.error('Supabase product_prices fetch error:', fetchError);
        throw new Error(`Failed to fetch product price record: ${fetchError.message}`);
      }

      if (!productPrice) {
        console.error('No product price record found for:', { product_id: reorderItem.productId, base_id: reorderItem.baseId });
        throw new Error('Product price record not found');
      }

      const newStock = (productPrice.stock_level || 0) + formData.quantity;

      const { error: updateError } = await supabase
        .from('product_prices')
        .update({ stock_level: newStock })
        .eq('product_id', reorderItem.productId)
        .eq('base_id', reorderItem.baseId);

      if (updateError) {
        console.error('Supabase product_prices update error:', updateError);
        throw new Error(`Failed to update stock: ${updateError.message}`);
      }

      console.log(`Updated product_prices stock_level to ${newStock} for product_id: ${reorderItem.productId}, base_id: ${reorderItem.baseId}`);
    } else {
      console.log(`Skipping stock update for ${formData.type} transaction with status: ${formData.status}`);
    }

    // Trigger success toast
    console.log('Triggering success toast with type: success');
    showSuccess(`Reorder (${formData.type === 'stock_in' ? 'Stock In' : 'Purchase'}) submitted successfully!`, 3000);

    // Refresh dashboard data
    await fetchDashboardData();

    // Close modal and reset state
    setShowReorderModal(false);
    setReorderItem(null);
  } catch (err) {
    console.error('Reorder submission error:', err);
    showError(err.message || 'Failed to submit reorder', 3000);
  }
};

// Reorder Modal Component
export const ReorderModal = ({ show, item, onClose, onSubmit }) => {
  const [transactionType, setTransactionType] = useState('purchase');
  const [status, setStatus] = useState('pending');
  const [totalAmount, setTotalAmount] = useState('0.00');

  // Update status and form fields when transaction type changes
  useEffect(() => {
    setStatus(transactionType === 'stock_in' ? 'completed' : 'pending');
    const referenceInput = document.getElementById('reorderReference');
    if (referenceInput) {
      referenceInput.value = `${transactionType === 'stock_in' ? 'STOCKIN' : 'PURCHASE'}-${Date.now()}`;
    }
    const quantityInput = document.getElementById('reorderQuantity');
    const unitPriceInput = document.getElementById('reorderUnitPrice');
    const quantity = quantityInput ? parseInt(quantityInput.value) || 0 : 0;
    const unitPrice = transactionType === 'stock_in' ? 0 : (unitPriceInput ? parseFloat(unitPriceInput.value) || 0 : 0);
    const newTotalAmount = (quantity * unitPrice).toFixed(2);
    setTotalAmount(transactionType === 'stock_in' ? '0.00' : newTotalAmount);
  }, [transactionType]);

  if (!show || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
              {transactionType === 'stock_in' ? (
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              ) : (
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400">Reorder Item</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Submit reorder for low stock item ({transactionType === 'stock_in' ? 'Warehouse' : 'Purchase'})
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
              {item.name} - {item.baseName}
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Current Stock: {item.currentStock} pcs | Min Required: {item.minStock} pcs
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const quantityInput = document.getElementById('reorderQuantity');
              const unitPriceInput = document.getElementById('reorderUnitPrice');
              const quantity = quantityInput ? parseInt(quantityInput.value) || 0 : 0;
              const unitPrice = transactionType === 'stock_in' ? 0 : (unitPriceInput ? parseFloat(unitPriceInput.value) || 0 : 0);
              const totalAmountCalc = transactionType === 'stock_in' ? 0 : quantity * unitPrice;

              const formData = {
                type: transactionType,
                quantity: quantity,
                unit_price: unitPrice,
                total_amount: totalAmountCalc,
                status: document.getElementById('reorderStatus').value,
                transaction_date: document.getElementById('reorderDate').value,
                reference: document.getElementById('reorderReference').value
              };

              console.log('Form validation - quantity:', quantity, 'unitPrice:', unitPrice, 'type:', transactionType);
              if (formData.quantity <= 0 || (formData.type === 'purchase' && formData.unit_price <= 0)) {
                console.log('Form validation failed, triggering error toast');
                document.dispatchEvent(
                  new CustomEvent('showToast', {
                    detail: {
                      message: formData.quantity <= 0 ? 'Quantity must be greater than 0' : 'Unit price must be greater than 0 for purchases',
                      type: 'error',
                      duration: 3000
                    }
                  })
                );
                return;
              }

              console.log('Form validated, submitting:', formData);
              onSubmit(formData);
            }}
            className="space-y-6"
          >
            {/* Transaction Type, Reorder Date, and Reference */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Transaction Type *
                </label>
                <select
                  id="reorderType"
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="purchase">Purchase (JOTUN Ethiopia)</option>
                  <option value="stock_in">Stock In (Warehouse)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Reorder Date *
                </label>
                <input
                  type="date"
                  id="reorderDate"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Reference *
                </label>
                <input
                  type="text"
                  id="reorderReference"
                  defaultValue={`PURCHASE-${Date.now()}`}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="e.g., PURCHASE-2025-001"
                />
              </div>
            </div>

            {/* Quantity and Unit Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Reorder Quantity *
                </label>
                <input
                  type="number"
                  id="reorderQuantity"
                  min="1"
                  defaultValue={item.minStock * 2}
                  required
                  onChange={() => {
                    const quantityInput = document.getElementById('reorderQuantity');
                    const unitPriceInput = document.getElementById('reorderUnitPrice');
                    const quantity = quantityInput ? parseInt(quantityInput.value) || 0 : 0;
                    const unitPrice = transactionType === 'stock_in' ? 0 : (unitPriceInput ? parseFloat(unitPriceInput.value) || 0 : 0);
                    const newTotalAmount = (quantity * unitPrice).toFixed(2);
                    setTotalAmount(transactionType === 'stock_in' ? '0.00' : newTotalAmount);
                  }}
                  onFocus={() => {
                    const quantityInput = document.getElementById('reorderQuantity');
                    const unitPriceInput = document.getElementById('reorderUnitPrice');
                    const quantity = quantityInput ? parseInt(quantityInput.value) || 0 : 0;
                    const unitPrice = transactionType === 'stock_in' ? 0 : (unitPriceInput ? parseFloat(unitPriceInput.value) || 0 : 0);
                    const newTotalAmount = (quantity * unitPrice).toFixed(2);
                    setTotalAmount(transactionType === 'stock_in' ? '0.00' : newTotalAmount);
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Unit Price *
                </label>
                <input
                  type="number"
                  id="reorderUnitPrice"
                  min="0"
                  step="0.01"
                  defaultValue={transactionType === 'stock_in' ? '0.00' : (item.currentUnitPrice || '0.00')}
                  disabled={transactionType === 'stock_in'}
                  required={transactionType === 'purchase'}
                  onChange={() => {
                    if (transactionType === 'purchase') {
                      const quantityInput = document.getElementById('reorderQuantity');
                      const unitPriceInput = document.getElementById('reorderUnitPrice');
                      const quantity = quantityInput ? parseInt(quantityInput.value) || 0 : 0;
                      const unitPrice = unitPriceInput ? parseFloat(unitPriceInput.value) || 0 : 0;
                      const newTotalAmount = (quantity * unitPrice).toFixed(2);
                      setTotalAmount(newTotalAmount);
                    }
                  }}
                  onFocus={() => {
                    if (transactionType === 'purchase') {
                      const quantityInput = document.getElementById('reorderQuantity');
                      const unitPriceInput = document.getElementById('reorderUnitPrice');
                      const quantity = quantityInput ? parseInt(quantityInput.value) || 0 : 0;
                      const unitPrice = unitPriceInput ? parseFloat(unitPriceInput.value) || 0 : 0;
                      const newTotalAmount = (quantity * unitPrice).toFixed(2);
                      setTotalAmount(newTotalAmount);
                    }
                  }}
                  className={`w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                    transactionType === 'stock_in' ? 'bg-slate-100 dark:bg-slate-700 opacity-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Current price: ${item.currentUnitPrice || '0.00'} per pc
                </p>
              </div>
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Total Amount
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  id="reorderTotalAmount"
                  value={totalAmount}
                  readOnly
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                id="reorderStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-150"
              >
                Submit Reorder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};