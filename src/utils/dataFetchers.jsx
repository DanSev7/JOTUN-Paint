import supabase from '../services/supabase';

export const fetchDashboardData = async (
  setLoading,
  setError,
  setProducts,
  setTransactions,
  showError,
  calculateKPIs,
  calculateLowStockItems,
  calculateRecentTransactions,
  calculateFrequentProducts,
  salesFilter,
  transactionFilter,
  productsFilter,
  topProductsFilter,
  getStartDate,
  getSalesTitle,
  formatTimeAgo,
  setKpiData,
  setLowStockItems,
  setRecentTransactions,
  setFrequentProducts,
  getStockStatus
) => {
  setLoading(true);
  setError(null);
  
  try {
    // Validate required functions
    if (!setKpiData || !setLowStockItems || !setRecentTransactions || !setFrequentProducts || !getStartDate || !getStockStatus) {
      throw new Error('One or more required functions are undefined');
    }

    // Fetch products with prices and stock levels
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

    console.log('Fetched products:', productsData);

    // Process products to include base-specific stock info
    const processedProducts = (productsData || []).map(product => {
      // Calculate total stock from all bases
      const totalStock = (product.product_prices || []).reduce((sum, price) => sum + (price.stock_level || 0), 0);
      
      // Get all base prices and stock levels
      const basePrices = (product.product_prices || []).map(price => ({
        baseId: price.base_id,
        baseName: price.bases?.name || 'Unknown',
        unitPrice: price.unit_price || 0,
        stockLevel: price.stock_level || 0,
        minStockLevel: price.min_stock_level || product.min_stock_level || 0
      }));

      return {
        ...product,
        totalStock,
        basePrices
      };
    });

    // Fetch transactions with product and base info
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        *,
        products:product_id(name, size, unit, category),
        bases:base_id(name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (transactionsError) throw transactionsError;

    console.log('Fetched transactions:', transactionsData);

    setProducts(processedProducts || []);
    setTransactions(transactionsData || []);

    // Calculate KPIs and other data
    calculateKPIs(
      processedProducts || [], 
      transactionsData || [], 
      salesFilter, 
      getStartDate, 
      getSalesTitle, 
      setKpiData,
      getStockStatus
    );
    calculateLowStockItems(processedProducts || [], setLowStockItems, getStockStatus);
    calculateRecentTransactions(transactionsData || [], transactionFilter, getStartDate, formatTimeAgo, setRecentTransactions);
    calculateFrequentProducts(transactionsData || [], productsFilter, topProductsFilter, getStartDate, setFrequentProducts);

  } catch (err) {
    console.error('Error in fetchDashboardData:', err);
    setError(err.message || 'Failed to fetch dashboard data');
    showError('Failed to load dashboard data');
  } finally {
    setLoading(false);
  }
};