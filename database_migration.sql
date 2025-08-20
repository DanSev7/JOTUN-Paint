-- Database Migration Script for JOTUN Paint Management System
-- This script adds stock_level column to product_prices table

-- Add stock_level column to product_prices table
ALTER TABLE product_prices 
ADD COLUMN stock_level INTEGER NOT NULL DEFAULT 0;

-- Update existing product_prices to have stock_level based on product's current_stock
-- This distributes the current stock evenly across all bases for existing products
UPDATE product_prices 
SET stock_level = (
  SELECT p.current_stock / COUNT(pp.id) 
  FROM products p 
  WHERE p.id = product_prices.product_id
)
WHERE EXISTS (
  SELECT 1 FROM products p 
  WHERE p.id = product_prices.product_id 
  AND p.current_stock > 0
);

-- For products with no stock, set stock_level to 0
UPDATE product_prices 
SET stock_level = 0 
WHERE stock_level IS NULL;

-- Add comment to document the new column
COMMENT ON COLUMN product_prices.stock_level IS 'Individual stock level for this product-base combination';

-- Verify the migration
SELECT 
  p.name as product_name,
  b.name as base_name,
  pp.unit_price,
  pp.stock_level,
  p.current_stock as total_product_stock
FROM product_prices pp
JOIN products p ON pp.product_id = p.id
JOIN bases b ON pp.base_id = b.id
ORDER BY p.name, b.name;

