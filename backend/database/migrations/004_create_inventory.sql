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

-- Indexes for stock movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
