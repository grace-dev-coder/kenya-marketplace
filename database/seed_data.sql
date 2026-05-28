USE kenya_marketplace;

-- Insert default admin
-- Password: admin123 (hashed)
INSERT INTO users (email, full_name, phone, password_hash, role) VALUES 
('admin@kenyamarketplace.co.ke', 'System Administrator', '254712345678', 
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I1K', 'admin');

-- Insert categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Phones, laptops, and electronic accessories'),
('Fashion', 'Clothing, shoes, and accessories'),
('Home & Kitchen', 'Furniture, appliances, and kitchenware'),
('Beauty & Health', 'Cosmetics, skincare, and health products'),
('Automotive', 'Car parts and accessories'),
('Groceries', 'Food items and household supplies'),
('Sports & Outdoors', 'Sporting goods and outdoor equipment');

-- Insert sample vendor (password: vendor123)
INSERT INTO users (email, full_name, phone, password_hash, role) VALUES 
('vendor@example.com', 'Sample Vendor', '254723456789', 
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I1K', 'vendor');

INSERT INTO vendors (user_id, business_name, business_description, business_address, business_phone, kra_pin, is_verified) 
VALUES (2, 'Mama Njoro Shop', 'Quality products for Kenyan homes', 'Nairobi, Kenya', '254723456789', 'A123456789B', TRUE);

-- Insert sample products
INSERT INTO products (name, description, price, stock_quantity, category_id, vendor_id, sku) VALUES
('Samsung Galaxy A54', '6.4" AMOLED display, 128GB, 5000mAh battery', 45999.00, 50, 1, 1, 'SAMA54-001'),
('Nike Running Shoes', 'Comfortable running shoes for athletes', 8999.00, 100, 2, 1, 'NIKE-RUN-001'),
('Ramtons Blender', 'High-speed blender for smoothies', 3499.00, 30, 3, 1, 'RAM-BLEND-001'),
('Nivea Body Lotion', 'Moisturizing body lotion 400ml', 599.00, 200, 4, 1, 'NIV-LOT-001'),
('Toyota Brake Pads', 'Genuine Toyota brake pads - front', 4500.00, 25, 5, 1, 'TOY-BRAKE-001'),
('Mwea Pishori Rice 5kg', 'Premium Kenyan rice', 450.00, 500, 6, 1, 'RICE-MWE-001'),
('Adidas Football', 'Official size 5 football', 2499.00, 40, 7, 1, 'ADI-FB-001');

-- Insert sample customer (password: customer123)
INSERT INTO users (email, full_name, phone, password_hash, role) VALUES 
('customer@example.com', 'John Doe', '254734567890', 
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I1K', 'customer');