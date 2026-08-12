-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL DEFAULT 'Pcs',
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    current_stock INT NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    reorder_level INT NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(current_stock);
