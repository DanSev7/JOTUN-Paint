-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create BASES table
CREATE TABLE IF NOT EXISTS bases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create PRODUCTS table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE, -- SKU
    category TEXT NOT NULL,
    size TEXT NOT NULL,
    unit TEXT, -- Added unit column as requested by dataFetchers.jsx
    image_url TEXT,
    description TEXT,
    min_stock_level INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0, -- Kept for compatibility with migration scripts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create PRODUCT_PRICES table (Join table for Product <-> Base with pricing and stock)
CREATE TABLE IF NOT EXISTS product_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    base_id UUID REFERENCES bases(id) ON DELETE RESTRICT,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    stock_level INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, base_id) -- Ensure unique combination
);

-- 4. Create TRANSACTIONS table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('sale', 'purchase', 'stock_in', 'stock_out')),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    base_id UUID REFERENCES bases(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) DEFAULT 0.00,
    subtotal NUMERIC(10, 2) DEFAULT 0.00, -- Added subtotal as requested by frontend
    total_amount NUMERIC(10, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reference TEXT UNIQUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create SUPPLIERS table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create USER_PROFILES table (Custom Auth)
-- Note: This is separate from Supabase Auth (auth.users) as the app seems to handle its own hashing.
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- Hashed password (bcrypt)
    role TEXT NOT NULL CHECK (role IN ('admin', 'store_manager', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE bases IS 'Paint bases (e.g. White, Clear)';
COMMENT ON TABLE products IS 'Main product definitions';
COMMENT ON COLUMN products.unit IS 'Unit of measurement for the product size (e.g., L, kg)';
COMMENT ON TABLE product_prices IS 'Links products to bases with specific pricing and stock levels';
COMMENT ON COLUMN product_prices.stock_level IS 'Individual stock level for this product-base combination';
COMMENT ON TABLE transactions IS 'Sales, purchases, and stock adjustments';
COMMENT ON COLUMN transactions.subtotal IS 'Quantity * Unit Price before tax/discounts';
COMMENT ON TABLE suppliers IS 'Product suppliers';
COMMENT ON TABLE user_profiles IS 'Application users with roles';

-- Optional: Initial Seed Data for Bases (Common in paint stores)
INSERT INTO bases (name) VALUES 
('White'),
('Base A'),
('Base B'),
('Base C')
ON CONFLICT (name) DO NOTHING;
