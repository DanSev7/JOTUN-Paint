import React from 'react';
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
export const handleReorderSubmit = async (formData, reorderItem, supabase, showSuccess, fetchDashboardData, setShowReorderModal, setReorderItem) => {
  if (!reorderItem) return;
  
  try {
    // Create a stock_in transaction for the reorder
    const { error } = await supabase
      .from('transactions')
      .insert([{
        type: 'stock_in',
        product_id: reorderItem.productId,
        base_id: reorderItem.baseId, // Include base_id in the transaction
        size: reorderItem.size,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        total_amount: formData.total_amount,
        status: formData.status,
        transaction_date: new Date(formData.transaction_date).toISOString(),
        reference: formData.reference
      }]);

    if (error) throw error;

    // Show success message
    showSuccess('Reorder submitted successfully!', 'success');
    
    // Refresh data
    await fetchDashboardData();
    
    // Close modal
    setShowReorderModal(false);
    setReorderItem(null);
  } catch (err) {
    showError('Failed to submit reorder: ' + err.message);
  }
};

// Reorder Modal Component
export const ReorderModal = ({ show, item, onClose, onSubmit }) => {
  if (!show || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400">Reorder Item</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Submit reorder for low stock item</p>
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
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const quantity = parseInt(document.getElementById('reorderQuantity').value) || 0;
            const unitPrice = parseFloat(document.getElementById('reorderUnitPrice').value) || 0;
            const totalAmount = quantity * unitPrice;
            
            const formData = {
              quantity: quantity,
              unit_price: unitPrice,
              total_amount: totalAmount,
              status: document.getElementById('reorderStatus').value,
              transaction_date: document.getElementById('reorderDate').value,
              reference: document.getElementById('reorderReference').value
            };
            
            if (formData.quantity > 0 && formData.unit_price > 0) {
              onSubmit(formData);
            }
          }} className="space-y-6">
            
            {/* Date and Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  defaultValue={`REORDER-${Date.now()}`}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="e.g., REORDER-2024-001"
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
                    const quantity = parseInt(document.getElementById('reorderQuantity').value) || 0;
                    const unitPrice = parseFloat(document.getElementById('reorderUnitPrice').value) || 0;
                    const total = quantity * unitPrice;
                    document.getElementById('reorderTotalAmount').value = total.toFixed(2);
                  }}
                  onFocus={() => {
                    const quantity = parseInt(document.getElementById('reorderQuantity').value) || 0;
                    const unitPrice = parseFloat(document.getElementById('reorderUnitPrice').value) || 0;
                    const total = quantity * unitPrice;
                    document.getElementById('reorderTotalAmount').value = total.toFixed(2);
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
                  defaultValue={item.currentUnitPrice || "0.00"}
                  required
                  onChange={() => {
                    const quantity = parseInt(document.getElementById('reorderQuantity').value) || 0;
                    const unitPrice = parseFloat(document.getElementById('reorderUnitPrice').value) || 0;
                    const total = quantity * unitPrice;
                    document.getElementById('reorderTotalAmount').value = total.toFixed(2);
                  }}
                  onFocus={() => {
                    const quantity = parseInt(document.getElementById('reorderQuantity').value) || 0;
                    const unitPrice = parseFloat(document.getElementById('reorderUnitPrice').value) || 0;
                    const total = quantity * unitPrice;
                    document.getElementById('reorderTotalAmount').value = total.toFixed(2);
                  }}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
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
                  value="0.00"
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
                defaultValue="pending"
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