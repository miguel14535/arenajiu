CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  "group" TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  barcode TEXT NOT NULL UNIQUE,
  price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  category TEXT NOT NULL DEFAULT 'outro',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products
  ALTER COLUMN category TYPE TEXT USING category::TEXT;

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  registration_number TEXT NOT NULL UNIQUE,
  phone TEXT,
  cep TEXT NOT NULL DEFAULT '',
  street TEXT NOT NULL DEFAULT '',
  house_number TEXT NOT NULL DEFAULT '',
  complement TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS cep TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS street TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS house_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS complement TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  payment_date DATE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE plans
  ALTER COLUMN plan_type TYPE TEXT USING plan_type::TEXT,
  ADD COLUMN IF NOT EXISTS payment_date DATE;

UPDATE plans
SET payment_date = start_date
WHERE payment_date IS NULL;

ALTER TABLE plans
  DROP CONSTRAINT IF EXISTS plans_plan_type_check,
  ADD CONSTRAINT plans_plan_type_check
    CHECK (plan_type IN ('mensal', 'trimestral', 'semestral', 'anual'));

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pago',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sales
  ALTER COLUMN payment_method TYPE TEXT USING payment_method::TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pago';

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0)
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_members_registration_number ON members(registration_number);
CREATE INDEX IF NOT EXISTS idx_plans_member ON plans(member_id);
CREATE INDEX IF NOT EXISTS idx_sales_member ON sales(member_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_categories" ON categories;
DROP POLICY IF EXISTS "public_insert_categories" ON categories;
DROP POLICY IF EXISTS "public_update_categories" ON categories;
DROP POLICY IF EXISTS "public_delete_categories" ON categories;
CREATE POLICY "public_select_categories" ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert_categories" ON categories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_update_categories" ON categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_categories" ON categories FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_products" ON products;
DROP POLICY IF EXISTS "public_insert_products" ON products;
DROP POLICY IF EXISTS "public_update_products" ON products;
DROP POLICY IF EXISTS "public_delete_products" ON products;
CREATE POLICY "public_select_products" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert_products" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_update_products" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_products" ON products FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_members" ON members;
DROP POLICY IF EXISTS "public_insert_members" ON members;
DROP POLICY IF EXISTS "public_update_members" ON members;
DROP POLICY IF EXISTS "public_delete_members" ON members;
CREATE POLICY "public_select_members" ON members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert_members" ON members FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_update_members" ON members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_members" ON members FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_plans" ON plans;
DROP POLICY IF EXISTS "public_insert_plans" ON plans;
DROP POLICY IF EXISTS "public_update_plans" ON plans;
DROP POLICY IF EXISTS "public_delete_plans" ON plans;
CREATE POLICY "public_select_plans" ON plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert_plans" ON plans FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_update_plans" ON plans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_plans" ON plans FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_sales" ON sales;
DROP POLICY IF EXISTS "public_insert_sales" ON sales;
DROP POLICY IF EXISTS "public_update_sales" ON sales;
DROP POLICY IF EXISTS "public_delete_sales" ON sales;
CREATE POLICY "public_select_sales" ON sales FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert_sales" ON sales FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_update_sales" ON sales FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_sales" ON sales FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_sale_items" ON sale_items;
DROP POLICY IF EXISTS "public_insert_sale_items" ON sale_items;
DROP POLICY IF EXISTS "public_update_sale_items" ON sale_items;
DROP POLICY IF EXISTS "public_delete_sale_items" ON sale_items;
CREATE POLICY "public_select_sale_items" ON sale_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert_sale_items" ON sale_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_update_sale_items" ON sale_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_sale_items" ON sale_items FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_suppliers" ON suppliers;
DROP POLICY IF EXISTS "public_insert_suppliers" ON suppliers;
DROP POLICY IF EXISTS "public_update_suppliers" ON suppliers;
DROP POLICY IF EXISTS "public_delete_suppliers" ON suppliers;
CREATE POLICY "public_select_suppliers" ON suppliers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert_suppliers" ON suppliers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_update_suppliers" ON suppliers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_suppliers" ON suppliers FOR DELETE TO anon, authenticated USING (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
