-- Add buying_price to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS buying_price DECIMAL(12, 2) DEFAULT 0;

-- Add buying_price to order_items to track historical profit
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS buying_price DECIMAL(12, 2) DEFAULT 0;