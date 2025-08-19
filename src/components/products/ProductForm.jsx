import React, { useState, useEffect } from 'react';
import { X, Save, Package, Trash2, DollarSign, Hash, Tag, TrendingUp, Paintbrush, AlertTriangle, Plus, Minus, Eye } from 'lucide-react';
import supabase from '../../services/supabase';

const ProductForm = ({ onClose, product = null, onSave, viewMode = false }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    code: product?.code || '',
    category: product?.category || '',
    size: product?.size || '3L',
    image_url: product?.image_url || '',
  });
  const [basePrices, setBasePrices] = useState([]); // [{base_id, unit_price, stock_level, min_stock_level, max_stock_level}]
  const [selectedBase, setSelectedBase] = useState('');
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const sizes = ['3L', '10L'];

  const categories = [
    { id: 'Interior', name: 'Interior Paints', icon: <Paintbrush className="w-4 h-4" /> },
    { id: 'Exterior', name: 'Exterior Paints', icon: <Paintbrush className="w-4 h-4" /> },
  ];

  // Fetch bases and product prices from Supabase
  useEffect(() => {
    async function fetchBases() {
      const { data: baseData, error: baseError } = await supabase
        .from('bases')
        .select('id, name')
        .order('name');
      if (baseError) {
        setError(baseError.message);
        return;
      }
      setBases(baseData || []);

      // If editing or viewing, fetch product_prices with stock levels and min/max
      if (product) {
        const { data: priceData, error: priceError } = await supabase
          .from('product_prices')
          .select(`
            base_id, 
            unit_price, 
            stock_level,
            min_stock_level,
            max_stock_level,
            bases(name)
          `)
          .eq('product_id', product.id);
        if (priceError) {
          setError(priceError.message);
          return;
        }
        setBasePrices(priceData || []);
      }
    }
    fetchBases();
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBasePriceChange = (base_id, field, value) => {
    setBasePrices(prev => {
      const exists = prev.find(b => b.base_id === base_id);
      if (exists) {
        return prev.map(b => b.base_id === base_id ? { 
          ...b, 
          [field]: field === 'unit_price' ? parseFloat(value) || 0 : parseInt(value) || 0 
        } : b);
      }
      return [...prev, { 
        base_id, 
        unit_price: field === 'unit_price' ? parseFloat(value) || 0 : 0,
        stock_level: field === 'stock_level' ? parseInt(value) || 0 : 0,
        min_stock_level: field === 'min_stock_level' ? parseInt(value) || 0 : 0,
        max_stock_level: field === 'max_stock_level' ? parseInt(value) || 0 : 0
      }];
    });
  };

  const addBasePrice = () => {
    if (selectedBase && !basePrices.find(b => b.base_id === selectedBase)) {
      const priceInput = document.getElementById('newBasePrice');
      const stockInput = document.getElementById('newBaseStock');
      const minStockInput = document.getElementById('newBaseMinStock');
      const maxStockInput = document.getElementById('newBaseMaxStock');
      const price = parseFloat(priceInput.value) || 0;
      const stock = parseInt(stockInput.value) || 0;
      const minStock = parseInt(minStockInput.value) || 0;
      const maxStock = parseInt(maxStockInput.value) || 0;
      
      setBasePrices(prev => [...prev, { 
        base_id: selectedBase, 
        unit_price: price,
        stock_level: stock,
        min_stock_level: minStock,
        max_stock_level: maxStock
      }]);
      setSelectedBase('');
      priceInput.value = '';
      stockInput.value = '';
      minStockInput.value = '';
      maxStockInput.value = '';
    }
  };

  const removeBasePrice = (base_id) => {
    setBasePrices(prev => prev.filter(b => b.base_id !== base_id));
  };

  const getAvailableBases = () => {
    const usedBases = basePrices.map(b => b.base_id);
    return bases.filter(base => !usedBases.includes(base.id));
  };

  const getTotalStock = () => {
    return basePrices.reduce((total, base) => total + (base.stock_level || 0), 0);
  };

  const getStockStatus = (stockLevel, minStockLevel) => {
    if ((stockLevel || 0) === 0) {
      return { status: 'out', label: 'Out of Stock', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
    }
    if (stockLevel <= minStockLevel) {
      return { status: 'low', label: 'Low Stock', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' };
    }
    if (stockLevel <= minStockLevel * 2) {
      return { status: 'medium', label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' };
    }
    return { status: 'good', label: 'In Stock', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' };
  };

  const getTotalStockStatus = () => {
    const totalStock = getTotalStock();
    const totalMinStock = basePrices.reduce((total, base) => total + (base.min_stock_level || 0), 0);
    return getStockStatus(totalStock, totalMinStock);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let resp, prodId;
      if (product) {
        // Update existing product
        resp = await supabase
          .from('products')
          .update({ 
            ...formData, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', product.id)
          .select();
        prodId = product.id;
      } else {
        // Insert new product
        resp = await supabase
          .from('products')
          .insert([{ 
            ...formData, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();
        prodId = resp.data?.[0]?.id;
      }

      if (resp.error) throw resp.error;

      // Handle product_prices with stock levels and min/max
      if (basePrices.length > 0) {
        // First, delete existing prices for this product
        if (product) {
          await supabase
            .from('product_prices')
            .delete()
            .eq('product_id', prodId);
        }

        // Then insert new prices with stock levels and min/max
        const priceInserts = basePrices
          .filter(price => price.unit_price > 0)
          .map(price => ({
            product_id: prodId,
            base_id: price.base_id,
            unit_price: price.unit_price,
            stock_level: price.stock_level || 0,
            min_stock_level: price.min_stock_level || 0,
            max_stock_level: price.max_stock_level || 0
          }));

        if (priceInserts.length > 0) {
          const { error: priceError } = await supabase
            .from('product_prices')
            .insert(priceInserts);
          
          if (priceError) throw priceError;
        }
      }

      if (onSave) onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      // Delete product (cascades to product_prices due to ON DELETE CASCADE)
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);
      if (error) throw error;
      if (onSave) onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const generateSKU = () => {
    const category = formData.category ? formData.category.toUpperCase().substring(0, 3) : 'PRO';
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setFormData(prev => ({
      ...prev,
      code: `${category}-${random}`
    }));
  };

  const stockStatus = getTotalStockStatus();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-5xl w-full max-h-[90vh] overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {viewMode ? 'Product Details' : product ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {viewMode ? 'View product information' : product ? 'Update product information' : 'Create a new product in your inventory'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-150"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
        {viewMode && (
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm">
              {formData.image_url ? (
                <img src={formData.image_url} alt={formData.name} className="w-full h-56 object-cover" />
              ) : (
                <div className="w-full h-56 bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-gray-400">No Image</div>
              )}
            </div>
            <div className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Product</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{formData.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Category</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{formData.category || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Size</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{formData.size}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Stock</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{getTotalStock()} pcs</p>
                </div>
              </div>
              {product?.description && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{product.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center gap-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 border border-red-200 dark:border-red-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3 mb-6">
              <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Package className="w-4 h-4" />
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  maxLength="100"
                  disabled={viewMode}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., Wonderwall Lux 10L"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Paintbrush className="w-4 h-4" />
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  disabled={viewMode}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Package className="w-4 h-4" />
                  Size <span className="text-red-500">*</span>
                </label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  required
                  disabled={viewMode}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Size</option>
                  {sizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Hash className="w-4 h-4" />
                  SKU <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    maxLength="50"
                    disabled={viewMode}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g., INT-001"
                  />
                  {!viewMode && (
                    <button
                      type="button"
                      onClick={generateSKU}
                      className="px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition"
                    >
                      Generate
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!viewMode && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Base Configuration</h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Add different prices and stock levels for each base color
                </span>
              </div>

              {/* Add New Base Price */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Tag className="w-4 h-4" />
                    Select Base
                  </label>
                  <select
                    value={selectedBase}
                    onChange={(e) => setSelectedBase(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                  >
                    <option value="">Select Base</option>
                    {getAvailableBases().map((base) => (
                      <option key={base.id} value={base.id}>
                        {base.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="w-4 h-4" />
                    Unit Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                      placeholder="0.00"
                      id="newBasePrice"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Package className="w-4 h-4" />
                    Stock Level
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-md">
                      Qty
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                      placeholder="0"
                      id="newBaseStock"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Min Stock
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-md">
                      Qty
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                      placeholder="0"
                      id="newBaseMinStock"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    Max Stock
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-md">
                      Qty
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                      placeholder="0"
                      id="newBaseMaxStock"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addBasePrice}
                  disabled={!selectedBase}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Base
                </button>
              </div>
            </div>
          )}

          {/* Current Base Prices - Show in both view and edit modes */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {viewMode ? 'Base Configuration' : 'Configured Bases'} ({basePrices.length})
              </h3>
            </div>
            
            {basePrices.length > 0 ? (
              <div className="space-y-3">
                {basePrices.map((price) => {
                  const base = bases.find(b => b.id === price.base_id);
                  const status = getStockStatus(price.stock_level, price.min_stock_level);
                  return (
                    <div
                      key={price.base_id}
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {base?.name || 'Unknown Base'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Base ID: {price.base_id}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">$</span>
                            <input
                              type="number"
                              value={price.unit_price}
                              onChange={(e) => handleBasePriceChange(price.base_id, 'unit_price', e.target.value)}
                              min="0"
                              step="0.01"
                              disabled={viewMode}
                              className="w-32 pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            per {formData.size}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">Qty</span>
                            <input
                              type="number"
                              value={price.stock_level}
                              onChange={(e) => handleBasePriceChange(price.base_id, 'stock_level', e.target.value)}
                              min="0"
                              step="1"
                              disabled={viewMode}
                              className="w-32 pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Stock
                            </p>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                              {status.label}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">Qty</span>
                            <input
                              type="number"
                              value={price.min_stock_level}
                              onChange={(e) => handleBasePriceChange(price.base_id, 'min_stock_level', e.target.value)}
                              min="0"
                              step="1"
                              disabled={viewMode}
                              className="w-32 pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Min Stock
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">Qty</span>
                            <input
                              type="number"
                              value={price.max_stock_level}
                              onChange={(e) => handleBasePriceChange(price.base_id, 'max_stock_level', e.target.value)}
                              min="0"
                              step="1"
                              disabled={viewMode}
                              className="w-32 pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Max Stock
                          </p>
                        </div>
                        
                        {!viewMode && (
                          <button
                            type="button"
                            onClick={() => removeBasePrice(price.base_id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove this base price"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {viewMode ? 'No Bases Configured' : 'No Bases Configured'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {viewMode ? 'This product has no base configurations' : 'Add bases above to set different pricing and stock levels for each base color'}
                </p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory Summary</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <Package className="w-4 h-4" />
                  Total Stock (Auto-calculated)
                </label>
                <input
                  type="number"
                  value={getTotalStock()}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors cursor-not-allowed"
                  placeholder="0"
                />
                {getTotalStock() > 0 && (
                  <div className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                    Stock Level: {stockStatus.status === 'low' ? 'Low' : stockStatus.status === 'medium' ? 'Medium' : 'Good'}
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Sum of all base stock levels
                </p>
              </div>
            </div>
          </div>

          {!viewMode && (
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                {product && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-150"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Product
                  </button>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-150"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loading}
                >
                  <Save className="w-4 h-4" />
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {product ? 'Updating...' : 'Adding...'}
                    </span>
                  ) : (
                    product ? 'Update Product' : 'Add Product'
                  )}
                </button>
              </div>
            </div>
          )}

          {viewMode && (
            <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-150"
              >
                Close
              </button>
            </div>
          )}
        </form>

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
                  Are you sure you want to delete <strong>{formData.name}</strong>? This will permanently remove the product and its prices.
                </p>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-150"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-150"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Deleting...
                      </span>
                    ) : (
                      'Delete Product'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductForm;