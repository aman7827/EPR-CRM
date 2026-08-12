-- Enable pgcrypto extension for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sequence for Sales Challan numbers
CREATE SEQUENCE IF NOT EXISTS challan_number_seq START 1;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Refresh Tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NOT NULL,
    gst_number VARCHAR(50) NULL,
    address TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Customer Follow-ups table
CREATE TABLE IF NOT EXISTS customer_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    followup_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

-- Stock Movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('ADJUSTMENT', 'CHALLAN_CONFIRM', 'CHALLAN_CANCEL')),
    reference_id UUID NULL,
    movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
    quantity INT NOT NULL CHECK (quantity > 0),
    stock_before INT NOT NULL CHECK (stock_before >= 0),
    stock_after INT NOT NULL CHECK (stock_after >= 0),
    notes TEXT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sales Challans table
CREATE TABLE IF NOT EXISTS sales_challans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challan_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    notes TEXT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    confirmed_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    cancelled_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMPTZ NULL,
    cancelled_at TIMESTAMPTZ NULL
);

-- Sales Challan Items table
CREATE TABLE IF NOT EXISTS sales_challan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challan_id UUID NOT NULL REFERENCES sales_challans(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(current_stock);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_followups_customer_id ON customer_followups(customer_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON customer_followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_date ON customer_followups(followup_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_challans_number ON sales_challans(challan_number);
CREATE INDEX IF NOT EXISTS idx_sales_challans_customer ON sales_challans(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_challans_status ON sales_challans(status);
CREATE INDEX IF NOT EXISTS idx_sales_challan_items_challan ON sales_challan_items(challan_id);
