-- Product categories enum
CREATE TYPE product_category AS ENUM ('cerveja', 'refrigerante', 'água', 'destilado', 'vinho', 'petisco', 'outro');

-- Payment methods enum
CREATE TYPE payment_method AS ENUM ('dinheiro', 'cartão', 'pix');

-- Plan types enum
CREATE TYPE plan_type AS ENUM ('mensal', 'trimestral', 'anual');

-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  barcode TEXT UNIQUE NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category product_category NOT NULL DEFAULT 'outro',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_products" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_products" ON products FOR DELETE TO authenticated USING (true);

-- Members table
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_members" ON members FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_members" ON members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_members" ON members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_members" ON members FOR DELETE TO authenticated USING (true);

-- Plans table
CREATE TABLE plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_type plan_type NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_plans" ON plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_plans" ON plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_plans" ON plans FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_plans" ON plans FOR DELETE TO authenticated USING (true);

-- Sales table
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  payment_method payment_method NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_sales" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_sales" ON sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_sales" ON sales FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_sales" ON sales FOR DELETE TO authenticated USING (true);

-- Sale items table
CREATE TABLE sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0)
);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_sale_items" ON sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_sale_items" ON sale_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_sale_items" ON sale_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_sale_items" ON sale_items FOR DELETE TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_sales_member ON sales(member_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_plans_member ON plans(member_id);
