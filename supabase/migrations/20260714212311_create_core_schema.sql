/*
# SKT Takip - Core Database Schema

Multi-tenant expiry date tracking system for retail/supermarket chains.
Supports three organization types: multi-branch (premium), single-branch (premium), and local-only (no DB).

## Tables
1. organizations - top-level company (multi_branch, single_branch, local)
2. branches - sub-units of multi-branch orgs
3. profiles - extends auth.users with role, org membership, branch assignment
4. locations - hierarchical storage (reyon, palet, depo, dolap, raf) with parent_id and level
5. brands - product brands with return_accepts flag
6. products - product definitions scoped to org/branch
7. stock_items - individual stock entries (product + location + expiry_date + quantity)
8. import_templates - dynamic column mapping for bulk import

## Security
- RLS enabled on all tables, scoped to authenticated users
- Ownership/membership checked via org_id relationships
- user_id columns default to auth.uid()

## Notes
1. Tables created first, then RLS policies (to resolve cross-table references)
2. All timestamps use timestamptz DEFAULT now()
3. UUIDs for all primary keys
4. Foreign keys use ON DELETE CASCADE where appropriate
*/

-- ============================================================
-- CREATE ALL TABLES FIRST
-- ============================================================

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'single_branch' CHECK (type IN ('multi_branch', 'single_branch', 'local')),
  plan text NOT NULL DEFAULT 'premium' CHECK (plan IN ('premium', 'free', 'local')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_branches_org_id ON branches(org_id);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  full_name text,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'owner', 'branch_manager', 'staff')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, org_id)
);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON profiles(branch_id);

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'reyon' CHECK (type IN ('reyon', 'palet', 'depo', 'dolap', 'raf')),
  parent_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  level int DEFAULT 1 CHECK (level >= 1 AND level <= 5),
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_locations_org_id ON locations(org_id);
CREATE INDEX IF NOT EXISTS idx_locations_branch_id ON locations(branch_id);
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON locations(parent_id);

CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  return_accepts boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, name)
);
CREATE INDEX IF NOT EXISTS idx_brands_org_id ON brands(org_id);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  stock_code text,
  barcode text,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  return_accepts boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_org_id ON products(org_id);
CREATE INDEX IF NOT EXISTS idx_products_branch_id ON products(branch_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

CREATE TABLE IF NOT EXISTS stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  expiry_date date NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_items_org_id ON stock_items(org_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_product_id ON stock_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_location_id ON stock_items(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_expiry_date ON stock_items(expiry_date);

CREATE TABLE IF NOT EXISTS import_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default Template',
  column_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_import_templates_org_id ON import_templates(org_id);

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ORGANIZATIONS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_own_org" ON organizations;
CREATE POLICY "select_own_org" ON organizations FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = organizations.id)
  );

DROP POLICY IF EXISTS "insert_org" ON organizations;
CREATE POLICY "insert_org" ON organizations FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_own_org" ON organizations;
CREATE POLICY "update_own_org" ON organizations FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = organizations.id AND profiles.role IN ('super_admin', 'owner'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = organizations.id AND profiles.role IN ('super_admin', 'owner'))
  );

-- ============================================================
-- BRANCHES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_branch" ON branches;
CREATE POLICY "select_branch" ON branches FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = branches.org_id)
  );

DROP POLICY IF EXISTS "insert_branch" ON branches;
CREATE POLICY "insert_branch" ON branches FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = branches.org_id AND profiles.role = 'super_admin')
  );

DROP POLICY IF EXISTS "update_branch" ON branches;
CREATE POLICY "update_branch" ON branches FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = branches.org_id AND profiles.role = 'super_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = branches.org_id AND profiles.role = 'super_admin')
  );

DROP POLICY IF EXISTS "delete_branch" ON branches;
CREATE POLICY "delete_branch" ON branches FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = branches.org_id AND profiles.role = 'super_admin')
  );

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_profile" ON profiles;
CREATE POLICY "select_profile" ON profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR (
      org_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.org_id = profiles.org_id
      )
    )
  );

DROP POLICY IF EXISTS "insert_profile" ON profiles;
CREATE POLICY "insert_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR (
      org_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.org_id = profiles.org_id AND p.role IN ('super_admin', 'owner', 'branch_manager')
      )
    )
  );

DROP POLICY IF EXISTS "update_profile" ON profiles;
CREATE POLICY "update_profile" ON profiles FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id
    OR (
      org_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.org_id = profiles.org_id AND p.role IN ('super_admin', 'owner', 'branch_manager')
      )
    )
  ) WITH CHECK (
    auth.uid() = user_id
    OR (
      org_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.org_id = profiles.org_id AND p.role IN ('super_admin', 'owner', 'branch_manager')
      )
    )
  );

DROP POLICY IF EXISTS "delete_profile" ON profiles;
CREATE POLICY "delete_profile" ON profiles FOR DELETE
  TO authenticated USING (
    org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.org_id = profiles.org_id AND p.role IN ('super_admin', 'owner', 'branch_manager')
    )
  );

-- ============================================================
-- LOCATIONS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_location" ON locations;
CREATE POLICY "select_location" ON locations FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = locations.org_id)
  );

DROP POLICY IF EXISTS "insert_location" ON locations;
CREATE POLICY "insert_location" ON locations FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = locations.org_id)
  );

DROP POLICY IF EXISTS "update_location" ON locations;
CREATE POLICY "update_location" ON locations FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = locations.org_id)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = locations.org_id)
  );

DROP POLICY IF EXISTS "delete_location" ON locations;
CREATE POLICY "delete_location" ON locations FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = locations.org_id)
  );

-- ============================================================
-- BRANDS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_brand" ON brands;
CREATE POLICY "select_brand" ON brands FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = brands.org_id)
  );

DROP POLICY IF EXISTS "insert_brand" ON brands;
CREATE POLICY "insert_brand" ON brands FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = brands.org_id)
  );

DROP POLICY IF EXISTS "update_brand" ON brands;
CREATE POLICY "update_brand" ON brands FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = brands.org_id)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = brands.org_id)
  );

DROP POLICY IF EXISTS "delete_brand" ON brands;
CREATE POLICY "delete_brand" ON brands FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = brands.org_id)
  );

-- ============================================================
-- PRODUCTS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_product" ON products;
CREATE POLICY "select_product" ON products FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = products.org_id)
  );

DROP POLICY IF EXISTS "insert_product" ON products;
CREATE POLICY "insert_product" ON products FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = products.org_id)
  );

DROP POLICY IF EXISTS "update_product" ON products;
CREATE POLICY "update_product" ON products FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = products.org_id)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = products.org_id)
  );

DROP POLICY IF EXISTS "delete_product" ON products;
CREATE POLICY "delete_product" ON products FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = products.org_id AND profiles.role IN ('super_admin', 'owner', 'branch_manager'))
  );

-- ============================================================
-- STOCK ITEMS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_stock" ON stock_items;
CREATE POLICY "select_stock" ON stock_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = stock_items.org_id)
  );

DROP POLICY IF EXISTS "insert_stock" ON stock_items;
CREATE POLICY "insert_stock" ON stock_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = stock_items.org_id)
  );

DROP POLICY IF EXISTS "update_stock" ON stock_items;
CREATE POLICY "update_stock" ON stock_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = stock_items.org_id)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = stock_items.org_id)
  );

DROP POLICY IF EXISTS "delete_stock" ON stock_items;
CREATE POLICY "delete_stock" ON stock_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = stock_items.org_id AND profiles.role IN ('super_admin', 'owner', 'branch_manager'))
  );

-- ============================================================
-- IMPORT TEMPLATES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_template" ON import_templates;
CREATE POLICY "select_template" ON import_templates FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = import_templates.org_id)
  );

DROP POLICY IF EXISTS "insert_template" ON import_templates;
CREATE POLICY "insert_template" ON import_templates FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = import_templates.org_id)
  );

DROP POLICY IF EXISTS "update_template" ON import_templates;
CREATE POLICY "update_template" ON import_templates FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = import_templates.org_id)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = import_templates.org_id)
  );

DROP POLICY IF EXISTS "delete_template" ON import_templates;
CREATE POLICY "delete_template" ON import_templates FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.org_id = import_templates.org_id)
  );
