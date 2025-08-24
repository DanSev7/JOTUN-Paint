import { Package, DollarSign, Paintbrush, AlertTriangle } from 'lucide-react';

export const calculateKPIs = (processedProducts, transactionsData, salesFilter, getStartDate, getSalesTitle, setKpiData, getStockStatus) => {
  // Total Paint Stock - sum all base stock levels
  const totalStock = processedProducts.reduce((sum, product) => sum + (product.totalStock || 0), 0);
  
  // Sales based on selected period
  const salesStartDate = getStartDate(salesFilter);
  const currentSales = transactionsData
    .filter(t => t.type === 'sale' && new Date(t.created_at) >= salesStartDate)
    .reduce((sum, t) => sum + (t.total_amount || 0), 0);
  
  // Exterior Paints stock
  const exteriorPaints = processedProducts
    .filter(p => p.category?.toLowerCase().includes('exterior'))
    .reduce((sum, p) => sum + (p.totalStock || 0), 0);
  
  // Interior Paints stock
  const interiorPaints = processedProducts
    .filter(p => p.category?.toLowerCase().includes('interior'))
    .reduce((sum, p) => sum + (p.totalStock || 0), 0);
  
  // Low Stock Items count - count per base low stock instances
  const lowStockCount = processedProducts.reduce((count, p) => {
    return count + (p.basePrices || []).filter(b => {
      const { status } = getStockStatus(b.stockLevel, b.minStockLevel || p.min_stock_level);
      return status === 'low_stock';
    }).length;
  }, 0);

  // Mock percentage changes
  const kpis = [
    {
      title: 'Total Stock Quantity',
      value: totalStock.toLocaleString(),
      unit: 'pcs',
      // change: '+12.5%',
      changeType: 'positive',
      icon: <Package className="w-4 h-4" />,
      gradient: 'from-indigo-500 to-indigo-600'
    },
    {
      title: getSalesTitle(salesFilter),
      value: `ETB${currentSales.toLocaleString()}`,
      unit: '',
      // change: '+8.7%',
      changeType: 'positive',
      icon: <DollarSign className="w-4 h-4" />,
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Exterior Paints',
      value: exteriorPaints.toLocaleString(),
      unit: 'pcs',
      // change: '+5.2%',
      changeType: 'positive',
      icon: <Paintbrush className="w-4 h-4" />,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Interior Paints',
      value: interiorPaints.toLocaleString(),
      unit: 'pcs',
      // change: '+7.8%',
      changeType: 'positive',
      icon: <Paintbrush className="w-4 h-4" />,
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'Low Stock Items',
      value: lowStockCount.toString(),
      unit: 'items',
      // change: '-5.2%',
      changeType: 'negative',
      icon: <AlertTriangle className="w-4 h-4" />,
      gradient: 'from-red-500 to-red-600'
    }
  ];

  setKpiData(kpis);
};

export const calculateLowStockItems = (processedProducts, setLowStockItems, getStockStatus) => {
  console.log('calculateLowStockItems: Input processedProducts', processedProducts);

  const lowStockItemsList = [];
  
  processedProducts.forEach(product => {
    if (product.basePrices && product.basePrices.length > 0) {
      product.basePrices.forEach(base => {
        if (!base.stockLevel || !base.minStockLevel) {
          console.log(`Skipping base ${base.baseId} for product ${product.name}: Missing stockLevel or minStockLevel`, base);
          return;
        }

        const { status } = getStockStatus(base.stockLevel, base.minStockLevel || product.min_stock_level);
        console.log(`Base ${base.baseName} (ID: ${base.baseId}) - Stock: ${base.stockLevel}, Min: ${base.minStockLevel || product.min_stock_level}, Status: ${status}`);

        if (status === 'low_stock') {
          const stockPercentage = base.minStockLevel > 0 ? (base.stockLevel / base.minStockLevel) * 100 : 0;
          const urgency = stockPercentage <= 25 ? 'critical' : stockPercentage <= 50 ? 'warning' : 'low';

          lowStockItemsList.push({
            id: `${product.id}-${base.baseId}`,
            name: product.name,
            baseName: base.baseName,
            baseId: base.baseId,
            currentStock: base.stockLevel,
            minStock: base.minStockLevel || product.min_stock_level,
            unit: product.unit || 'pcs',
            size: product.size,
            supplier: product.supplier || 'Jotun Ethiopia',
            category: product.category || 'Uncategorized',
            urgency,
            productId: product.id
          });
        }
      });
    } else {
      console.log(`No basePrices for product ${product.name}`);
    }
  });

  // Sort by urgency and limit to top 10
  const sortedLowStock = lowStockItemsList
    .sort((a, b) => {
      const urgencyOrder = { critical: 0, warning: 1, low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    })
    .slice(0, 10);

  console.log('Calculated lowStockItems:', sortedLowStock);
  setLowStockItems(sortedLowStock);
};

export const calculateRecentTransactions = (transactionsData, transactionFilter, getStartDate, formatTimeAgo, setRecentTransactions) => {
  const startDate = getStartDate(transactionFilter);
  const filteredTransactions = transactionsData.filter(transaction => new Date(transaction.created_at) >= startDate);
  const recent = filteredTransactions
    .slice(0, 8)
    .map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      product: transaction.products?.name || 'Unknown Product',
      quantity: `${transaction.quantity} pcs`,
      amount: `$${(transaction.total_amount || 0).toFixed(2)}`,
      timestamp: formatTimeAgo(transaction.created_at),
      user: 'System'
    }));

  setRecentTransactions(recent);
};

export const calculateFrequentProducts = (transactionsData, productsFilter, topProductsFilter, getStartDate, setFrequentProducts) => {
  const startDate = getStartDate(productsFilter);
  const filteredTransactions = transactionsData.filter(t => t.type === 'sale' && new Date(t.created_at) >= startDate);
  const baseStats = {};
  
  filteredTransactions.forEach(transaction => {
    const productName = transaction.products?.name;
    const baseId = transaction.base_id;
    const baseName = transaction.bases?.name;
    if (productName && baseId && baseName) {
      const key = `${productName}-${baseId}`;
      if (!baseStats[key]) {
        baseStats[key] = {
          soldQuantity: 0,
          revenue: 0,
          id: transaction.product_id,
          baseId: baseId,
          productName: productName,
          baseName: baseName
        };
      }
      baseStats[key].soldQuantity += transaction.quantity || 0;
      baseStats[key].revenue += transaction.total_amount || 0;
    }
  });

  const frequent = Object.entries(baseStats)
    .map(([key, stats]) => ({
      id: stats.id,
      name: stats.productName,
      baseId: stats.baseId,
      baseName: stats.baseName,
      soldQuantity: stats.soldQuantity,
      unit: 'pcs',
      revenue: `$${stats.revenue.toFixed(0)}`,
      trend: 'up'
    }))
    .sort((a, b) => {
      if (topProductsFilter === 'revenue') {
        return parseFloat(b.revenue.replace('$', '')) - parseFloat(a.revenue.replace('$', ''));
      } else {
        return b.soldQuantity - a.soldQuantity;
      }
    })
    .slice(0, 4);

  setFrequentProducts(frequent);
};