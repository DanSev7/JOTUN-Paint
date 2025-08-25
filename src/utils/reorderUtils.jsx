import React, { useState, useEffect } from 'react';
import { Package, DollarSign, FileText } from 'lucide-react';

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
      total_amount: formData.type === 'stock_in' ? 0 : (formData.quantity * formData.unit_price * 1.12), // Apply 1.12 multiplier for purchase
      status: formData.status,
      transaction_date: new Date(formData.transaction_date).toISOString(),
      reference: formData.reference,
      notes: formData.notes // Include notes field
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
  const [subtotal, setSubtotal] = useState('0.00');
  const [totalAmount, setTotalAmount] = useState('0.00');
  const [notes, setNotes] = useState('');

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
    const newSubtotal = (quantity * unitPrice).toFixed(2);
    const newTotalAmount = transactionType === 'stock_in' ? 0 : (quantity * unitPrice * 1.12);
    setSubtotal(newSubtotal);
    setTotalAmount(newTotalAmount.toFixed(2));
  }, [transactionType]);

  if (!show || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="p-2 sm:p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1 sm:p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              {transactionType === 'stock_in' ? (
                <Package className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <DollarSign className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-blue-700 dark:text-blue-400">Reorder Item</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Submit reorder for low stock item ({transactionType === 'stock_in' ? 'Warehouse' : 'Purchase'})
              </p>
            </div>
          </div>
        </div>

        <div className="p-2 sm:p-4">
          <div className="mb-2 sm:mb-4">
            <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white mb-1 sm:mb-2">
              {item.name} - {item.baseName}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
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
              const subtotalCalc = quantity * unitPrice;
              const totalAmountCalc = transactionType === 'stock_in' ? 0 : (subtotalCalc * 1.12);

              const formData = {
                type: transactionType,
                quantity: quantity,
                unit_price: unitPrice,
                total_amount: totalAmountCalc,
                status: document.getElementById('reorderStatus').value,
                transaction_date: document.getElementById('reorderDate').value,
                reference: document.getElementById('reorderReference').value,
                notes: notes
              };

              console.log('Form validation - quantity:', quantity, 'unitPrice:', unitPrice, 'type:', transactionType, 'notes:', notes);
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
            className="space-y-2 sm:space-y-4"
          >
            {/* Transaction Type, Reorder Date, and Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Type *
                </label>
                <select
                  id="reorderType"
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs"
                >
                  <option value="purchase">Purchase (JOTUN Ethiopia)</option>
                  <option value="stock_in">Stock In (Warehouse)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reorder Date *
                </label>
                <input
                  type="date"
                  id="reorderDate"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reference *
                </label>
                <input
                  type="text"
                  id="reorderReference"
                  defaultValue={`PURCHASE-${Date.now()}`}
                  required
                  className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs"
                  placeholder="e.g., PURCHASE-2025-001"
                />
              </div>
            </div>

            {/* Quantity and Unit Price */}
            <div className={`grid ${transactionType === 'purchase' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2 sm:gap-3`}>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                    const newSubtotal = (quantity * unitPrice).toFixed(2);
                    const newTotalAmount = transactionType === 'stock_in' ? 0 : (quantity * unitPrice * 1.12);
                    setSubtotal(newSubtotal);
                    setTotalAmount(newTotalAmount.toFixed(2));
                  }}
                  onFocus={() => {
                    const quantityInput = document.getElementById('reorderQuantity');
                    const unitPriceInput = document.getElementById('reorderUnitPrice');
                    const quantity = quantityInput ? parseInt(quantityInput.value) || 0 : 0;
                    const unitPrice = transactionType === 'stock_in' ? 0 : (unitPriceInput ? parseFloat(unitPriceInput.value) || 0 : 0);
                    const newSubtotal = (quantity * unitPrice).toFixed(2);
                    const newTotalAmount = transactionType === 'stock_in' ? 0 : (quantity * unitPrice * 1.12);
                    setSubtotal(newSubtotal);
                    setTotalAmount(newTotalAmount.toFixed(2));
                  }}
                  className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                      const newSubtotal = (quantity * unitPrice).toFixed(2);
                      const newTotalAmount = (quantity * unitPrice * 1.12);
                      setSubtotal(newSubtotal);
                      setTotalAmount(newTotalAmount.toFixed(2));
                    }
                  }}
                  onFocus={() => {
                    if (transactionType === 'purchase') {
                      const quantityInput = document.getElementById('reorderQuantity');
                      const unitPriceInput = document.getElementById('reorderUnitPrice');
                      const quantity = quantityInput ? parseInt(quantityInput.value) || 0 : 0;
                      const unitPrice = unitPriceInput ? parseFloat(unitPriceInput.value) || 0 : 0;
                      const newSubtotal = (quantity * unitPrice).toFixed(2);
                      const newTotalAmount = (quantity * unitPrice * 1.12);
                      setSubtotal(newSubtotal);
                      setTotalAmount(newTotalAmount.toFixed(2));
                    }
                  }}
                  className={`w-full px-2 py-1 sm:px-3 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs ${
                    transactionType === 'stock_in' ? 'bg-slate-100 dark:bg-slate-700 opacity-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Current price: ${item.currentUnitPrice || '0.00'} per pc
                </p>
              </div>

              {transactionType === 'purchase' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subtotal
                  </label>
                  <div className="relative">
                    <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                      <DollarSign className="w-3 sm:w-4 h-3 sm:h-4" />
                    </div>
                    <input
                      type="text"
                      id="reorderSubtotal"
                      value={subtotal}
                      readOnly
                      className="w-full pl-6 sm:pl-8 pr-2 sm:pr-3 py-1 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Total Amount
              </label>
              <div className="relative">
                <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <DollarSign className="w-3 sm:w-4 h-3 sm:h-4" />
                </div>
                <input
                  type="text"
                  id="reorderTotalAmount"
                  value={totalAmount}
                  readOnly
                  className="w-full pl-6 sm:pl-8 pr-2 sm:pr-3 py-1 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                id="reorderStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Additional Information (Notes) */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Additional Information
              </label>
              <div className="relative">
                <div className="absolute left-2 sm:left-3 top-2 sm:top-3 text-slate-400">
                  <FileText className="w-3 sm:w-4 h-3 sm:h-4" />
                </div>
                <textarea
                  id="reorderNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={100}
                  rows="3"
                  className="w-full pl-6 sm:pl-8 pr-2 sm:pr-3 py-1 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs resize-none"
                  placeholder="Add notes (max 100 characters)"
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {notes.length}/100 characters
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-150"
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