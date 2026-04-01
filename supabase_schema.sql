-- SQL Schema for Café-Resto Manager

-- 1. Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'staff', -- 'admin' or 'staff'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Employees
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'server_morning', 'server_evening', 'cook', 'barman', 'manager'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Daily Presence
CREATE TABLE IF NOT EXISTS daily_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  employee_id UUID REFERENCES employees(id),
  role TEXT NOT NULL,
  shift TEXT, -- 'morning', 'evening', 'full'
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Server Reports
CREATE TABLE IF NOT EXISTS server_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  server_name TEXT NOT NULL,
  shift TEXT NOT NULL, -- 'morning', 'evening'
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Drinks/Breakfast totals
  total_drinks_coffee_tea_ftor DECIMAL(10, 2) DEFAULT 0,
  
  -- Dish Sales (Sold/Remaining)
  tajine_poulet_sold INTEGER DEFAULT 0,
  tajine_poulet_remaining INTEGER DEFAULT 0,
  tajine_viande_sold INTEGER DEFAULT 0,
  tajine_viande_remaining INTEGER DEFAULT 0,
  m9la_viande_sold INTEGER DEFAULT 0,
  m9la_viande_remaining INTEGER DEFAULT 0,
  m9la_tayba_sold INTEGER DEFAULT 0,
  m9la_tayba_remaining INTEGER DEFAULT 0,
  tajine_kbir_sold INTEGER DEFAULT 0,
  tajine_kbir_remaining INTEGER DEFAULT 0,
  
  -- Small Expenses
  staff_payment DECIMAL(10, 2) DEFAULT 0,
  other_small_expenses DECIMAL(10, 2) DEFAULT 0,
  total_small_expenses DECIMAL(10, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Handovers
CREATE TABLE IF NOT EXISTS handovers (
  id UUID DEFAULT_gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  from_server TEXT NOT NULL,
  to_server TEXT NOT NULL,
  handover_time TIME NOT NULL,
  
  -- Transferred Stock
  tajine_poulet_transferred INTEGER DEFAULT 0,
  tajine_viande_transferred INTEGER DEFAULT 0,
  m9la_viande_transferred INTEGER DEFAULT 0,
  m9la_tayba_transferred INTEGER DEFAULT 0,
  tajine_kbir_transferred INTEGER DEFAULT 0,
  
  note TEXT,
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Large Daily Expenses
CREATE TABLE IF NOT EXISTS daily_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  category TEXT NOT NULL, -- 'vegetables', 'meat', 'grocery', 'other'
  supplier TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Monthly Fixed Charges
CREATE TABLE IF NOT EXISTS monthly_charges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  category TEXT NOT NULL, -- 'rent', 'cnss', 'electricity', 'water', 'internet', 'gas', 'other'
  amount DECIMAL(10, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS (Row Level Security) - Basic Setup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_charges ENABLE ROW LEVEL SECURITY;

-- Policies (Allow all for authenticated users for now, can be refined)
CREATE POLICY "Allow all for authenticated users" ON profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON employees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON daily_presence FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON server_reports FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON handovers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON daily_expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON monthly_charges FOR ALL USING (auth.role() = 'authenticated');
