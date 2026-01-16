import React, { useState, useEffect } from 'react';
import ProductForm from '../components/products/ProductForm';
import { 
  Plus, 
  Search, 
  Package, 
  Edit3, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  Paintbrush,
  Tag,
  DollarSign,
  Grid3X3,
  List
} from 'lucide-react';
import supabase from '../services/supabase';

const Products = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stock status logic from ProductForm.jsx
  const getStockStatus = (stockLevel, minStockLevel) => {
    if ((stockLevel || 0) === 0) {
      return { status: 'out_of_stock', label: 'Out of Stock', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-700' };
    }
    if (stockLevel <= minStockLevel) {
      return { status: 'low_stock', label: 'Low Stock', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700' };
    }
    return { status: 'in_stock', label: 'In Stock', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700' };
  };

  const getTotalStockStatus = (totalStock, totalMinStock) => {
    return getStockStatus(totalStock, totalMinStock);
  };

  // Fetch all necessary data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_prices:product_prices(
            unit_price,
            stock_level,
            min_stock_level,
            max_stock_level,
            base_id,
            bases:base_id(name)
          )
        `);
      
      if (productsError) throw productsError;

      const processedProducts = (productsData || []).map(product => {
        const totalStock = (product.product_prices || []).reduce((sum, price) => sum + (price.stock_level || 0), 0);
        const totalMinStock = (product.product_prices || []).reduce((sum, price) => sum + (price.min_stock_level || 0), 0);
        const { status } = getTotalStockStatus(totalStock, totalMinStock);

        const basePrices = (product.product_prices || []).map(price => {
          const baseStatus = getStockStatus(price.stock_level, price.min_stock_level);
          return {
            baseId: price.base_id,
            baseName: price.bases?.name || 'Unknown',
            unitPrice: price.unit_price || 0,
            stockLevel: price.stock_level || 0,
            minStockLevel: price.min_stock_level || 0,
            maxStockLevel: price.max_stock_level || 0,
            status: baseStatus.status,
            statusLabel: baseStatus.label
          };
        });

        return {
          ...product,
          status,
          totalStock,
          totalMinStock,
          basePrices,
          unit_price: basePrices[0]?.unitPrice || 0,
          base_name: basePrices[0]?.baseName || ''
        };
      });

      setProducts(processedProducts);
      const uniqueCategories = [...new Set(productsData.map(p => p.category).filter(Boolean))];
      const categoryOptions = uniqueCategories.map(cat => ({
        id: cat.toLowerCase().replace(/\s+/g, '_'),
        name: cat,
        icon: <Paintbrush className="w-4 h-4" />
      }));

      setCategories([
        { id: 'all', name: 'All Products', icon: <Package className="w-4 h-4" /> },
        ...categoryOptions
      ]);

    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusFilters = [
    { id: 'all', name: 'All Status' },
    { id: 'in_stock', name: 'In Stock' },
    { id: 'low_stock', name: 'Low Stock' },
    { id: 'out_of_stock', name: 'Out of Stock' }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                          product.category?.toLowerCase() === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || 
                         product.status === selectedStatus ||
                         product.basePrices.some(bp => bp.status === selectedStatus);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'in_stock':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-700',
          icon: <CheckCircle className="w-3 h-3" />
        };
      case 'low_stock':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-200 dark:border-amber-700',
          icon: <AlertTriangle className="w-3 h-3" />
        };
      case 'out_of_stock':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-red-200 dark:border-red-700',
          icon: <XCircle className="w-3 h-3" />
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-200 dark:border-slate-700',
          icon: <Package className="w-3 h-3" />
        };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return 'Unknown';
    }
  };

  const getStockLevel = (stock, minStock) => {
    if (minStock <= 0) return 100;
    const percentage = (stock / minStock) * 100;
    return Math.min(percentage, 100);
  };

  const { totalProducts, inStockCount, lowStockCount, outOfStockCount } = (() => {
    const totalProducts = products.length;
    const inStockCount = products.filter(p => p.status === 'in_stock').length;
    const lowStockCount = products.reduce((count, p) => 
      count + p.basePrices.filter(bp => bp.status === 'low_stock').length, 0);
    const outOfStockCount = products.reduce((count, p) => 
      count + p.basePrices.filter(bp => bp.status === 'out_of_stock').length, 0);
    return { totalProducts, inStockCount, lowStockCount, outOfStockCount };
  })();

  // View Details Component
  const ProductDetails = ({ product, onClose }) => {
    const statusStyle = getStatusStyle(product.status);
    const stockLevel = getStockLevel(product.totalStock, product.totalMinStock);

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl">
              <Paintbrush className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{product.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">SKU: {product.code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Category</p>
                <p className="text-base font-medium text-slate-900 dark:text-white">{product.category || 'Uncategorized'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Size</p>
                <p className="text-base font-medium text-slate-900 dark:text-white">{product.size || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Stock Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Total Stock</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                    {statusStyle.icon} {getStatusText(product.status)}
                  </span>
                </div>
                <p className="text-base font-medium text-slate-900 dark:text-white">{product.totalStock} / {product.totalMinStock} pcs</p>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    stockLevel < 25 ? 'bg-red-500' : 
                    stockLevel < 50 ? 'bg-amber-500' : 
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${stockLevel}%` }}
                ></div>
              </div>
            </div>
          </div>

          {product.basePrices && product.basePrices.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Base Prices & Stock
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.basePrices.map((base, index) => {
                  const baseStatusStyle = getStatusStyle(base.status);
                  const baseStockLevel = getStockLevel(base.stockLevel, base.minStockLevel);
                  return (
                    <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-base font-medium text-slate-900 dark:text-white">{base.baseName}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${baseStatusStyle.bg} ${baseStatusStyle.text} ${baseStatusStyle.border}`}>
                          {base.statusLabel}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Unit Price</span>
                          <span className="font-medium text-slate-900 dark:text-white">${base.unitPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Stock Level</span>
                          <span className="font-medium text-slate-900 dark:text-white">{base.stockLevel} pcs</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Min Stock</span>
                          <span className="font-medium text-slate-900 dark:text-white">{base.minStockLevel} pcs</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Max Stock</span>
                          <span className="font-medium text-slate-900 dark:text-white">{base.maxStockLevel} pcs</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              baseStockLevel < 25 ? 'bg-red-500' : 
                              baseStockLevel < 50 ? 'bg-amber-500' : 
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${baseStockLevel}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {product.description && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Description
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-6 space-y-6 md:space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl mt-5 font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Paint Products
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-base md:text-lg">
            Manage your paint inventory and product catalog
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedProduct(null);
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalProducts}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Products</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-700 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{inStockCount}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">In Stock</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-amber-200 dark:border-amber-700 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{lowStockCount}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Low Stock (Bases)</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-700 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{outOfStockCount}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Out of Stock (Bases)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white placeholder-slate-400 transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white min-w-[180px]"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white min-w-[140px]"
            >
              {statusFilters.map(status => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-3 text-sm font-medium ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-3 text-sm font-medium ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-slate-600 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredProducts.length}</span> of{' '}
          <span className="font-semibold text-slate-900 dark:text-white">{products.length}</span> products
        </p>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <span className="text-lg text-slate-500 dark:text-slate-400 animate-pulse">Loading products...</span>
        </div>
      )}
      {error && (
        <div className="flex justify-center items-center py-12">
          <span className="text-lg text-red-500 dark:text-red-400">{error}</span>
        </div>
      )}

      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredProducts.map(product => {
          const statusStyle = getStatusStyle(product.status);
          const stockLevel = getStockLevel(product.totalStock, product.totalMinStock);
          
          if (viewMode === 'list') {
            return (
              <div key={product.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center">
                    <Paintbrush className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{product.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">SKU: {product.code}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-600 dark:text-slate-400">Category</p>
                      <p className="font-medium text-slate-900 dark:text-white">{product.category || 'Uncategorized'}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-600 dark:text-slate-400">Total Stock</p>
                      <p className="font-medium text-slate-900 dark:text-white">{product.totalStock} pcs</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-600 dark:text-slate-400">Bases</p>
                      <p className="font-medium text-slate-900 dark:text-white">{product.basePrices?.length || 0} bases</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                      {statusStyle.icon}
                      {getStatusText(product.status)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowEditForm(true);
                        }}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowViewForm(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={product.id} className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Paintbrush className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{product.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Tag className="w-3 h-3" />
                        {product.code}
                      </div>
                    </div>
                  </div>
                </div>
                <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                  {statusStyle.icon}
                  {getStatusText(product.status)}
                </span>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Total Stock Level</span>
                  <span className="font-medium text-slate-900 dark:text-white">{product.totalStock} / {product.totalMinStock} pcs</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      stockLevel < 25 ? 'bg-red-500' : 
                      stockLevel < 50 ? 'bg-amber-500' : 
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${stockLevel}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Package className="w-4 h-4" />
                    Category:
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">{product.category || 'Uncategorized'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Package className="w-4 h-4" />
                    Size:
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">{product.size}</span>
                </div>
              </div>
              {product.basePrices && product.basePrices.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
                    <DollarSign className="w-4 h-4" />
                    Base Prices & Stock:
                  </div>
                  <div className="space-y-2">
                    {product.basePrices.map((base, index) => {
                      const baseStatusStyle = getStatusStyle(base.status);
                      return (
                        <div key={index} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{base.baseName}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-600 dark:text-slate-400">${base.unitPrice.toFixed(2)}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${baseStatusStyle.bg} ${baseStatusStyle.text}`}>
                              {base.stockLevel} pcs ({base.statusLabel})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{product.description || 'No description available'}</p>
              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 group-hover:scale-105"
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowEditForm(true);
                  }}
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200 group-hover:scale-105"
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowViewForm(true);
                  }}
                >
                  <Eye className="w-4 h-4" />
                  Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No products found</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Try adjusting your search criteria or add a new product.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <ProductForm
              onClose={() => setShowAddForm(false)}
              onSave={fetchData}
            />
          </div>
        </div>
      )}

      {showEditForm && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <ProductForm
              product={selectedProduct}
              onClose={() => {
                setShowEditForm(false);
                setSelectedProduct(null);
              }}
              onSave={fetchData}
            />
          </div>
        </div>
      )}

      {showViewForm && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <ProductDetails
            product={selectedProduct}
            onClose={() => {
              setShowViewForm(false);
              setSelectedProduct(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Products;