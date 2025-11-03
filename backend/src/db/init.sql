DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS forecasts CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- ======================================================
-- 1. Stores Table
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    state VARCHAR(255),
    pincode VARCHAR(20),
    manager_name VARCHAR(255),
    contact_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    store_id INTEGER REFERENCES stores(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- Create tables
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2),
    quantity INTEGER,
    min_stock_level INTEGER,
    reorder_point INTEGER,
    safety_stock INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    store_id INTEGER REFERENCES stores(id),
    status VARCHAR(50),
    total_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER,
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS automated_order_rules (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    trigger_type VARCHAR(50),
    threshold_value DECIMAL(10,2),
    action_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forecast_data (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    forecast_date DATE,
    predicted_sales DECIMAL(10,2),
    confidence_interval_lower DECIMAL(10,2),
    confidence_interval_upper DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -- Insert initial product data
-- INSERT INTO products (name, sku, category, price, quantity, min_stock_level, reorder_point, safety_stock) VALUES
-- ('Wireless Keyboard', 'KB001', 'Electronics', 49.99, 100, 20, 30, 10),
-- ('LED Monitor', 'MON001', 'Electronics', 199.99, 50, 10, 15, 5),
-- ('Wireless Mouse', 'MS001', 'Electronics', 29.99, 150, 30, 40, 15),
-- ('USB Cable', 'USB001', 'Accessories', 9.99, 200, 40, 50, 20),
-- ('Laptop Stand', 'LS001', 'Accessories', 39.99, 75, 15, 20, 8),
-- ('Mechanical Keyboard', 'KB002', 'Electronics', 89.99, 60, 12, 18, 6),
-- ('Gaming Mouse', 'MS002', 'Electronics', 59.99, 80, 16, 24, 8),
-- ('HDMI Cable', 'HDMI001', 'Accessories', 14.99, 120, 24, 30, 12),
-- ('Webcam', 'WC001', 'Electronics', 69.99, 40, 8, 12, 4),
-- ('Headset', 'HS001', 'Electronics', 79.99, 90, 18, 25, 10);

-- -- Insert some initial orders
-- INSERT INTO orders (customer_id, status, total_amount) VALUES
-- (1, 'completed', 249.98),
-- (2, 'pending', 119.98),
-- (3, 'completed', 89.97);

-- -- Insert order items
-- INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
-- (1, 1, 2, 49.99),
-- (1, 3, 1, 29.99),
-- (2, 2, 1, 199.99),
-- (3, 4, 3, 9.99);

-- -- Insert automated order rules
-- INSERT INTO automated_order_rules (product_id, trigger_type, threshold_value, action_type) VALUES
-- (1, 'stock_level', 20, 'reorder'),
-- (2, 'stock_level', 10, 'reorder'),
-- (3, 'stock_level', 30, 'reorder'),
-- (4, 'stock_level', 40, 'reorder'),
-- (5, 'stock_level', 15, 'reorder');

-- -- Insert some forecast data
-- INSERT INTO forecast_data (product_id, forecast_date, predicted_sales, confidence_interval_lower, confidence_interval_upper) VALUES
-- (1, CURRENT_DATE + INTERVAL '1 day', 5, 3, 7),
-- (1, CURRENT_DATE + INTERVAL '2 days', 6, 4, 8),
-- (1, CURRENT_DATE + INTERVAL '3 days', 7, 5, 9),
-- (2, CURRENT_DATE + INTERVAL '1 day', 2, 1, 3),
-- (2, CURRENT_DATE + INTERVAL '2 days', 3, 2, 4),
-- (2, CURRENT_DATE + INTERVAL '3 days', 2, 1, 3); 