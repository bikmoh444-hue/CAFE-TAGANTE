# Supabase Database Schema

## Tables

### 1. profiles
```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text default 'admin',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);
```

### 2. employees
```sql
create table employees (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  role text not null, -- 'serveur', 'cuisinier', 'barman', 'chway'
  is_active boolean default true,
  remark text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table employees enable row level security;
create policy "Authenticated users can manage employees" on employees
  for all using (auth.role() = 'authenticated');
```

### 3. attendance
```sql
create table attendance (
  id uuid default gen_random_uuid() primary key,
  date date not null default current_date,
  employee_id uuid references employees(id) on delete cascade,
  is_present boolean default true,
  shift text, -- 'matin', 'soir', 'toute la journée'
  remark text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table attendance enable row level security;
create policy "Authenticated users can manage attendance" on attendance
  for all using (auth.role() = 'authenticated');
```

### 4. server_reports
```sql
create table server_reports (
  id uuid default gen_random_uuid() primary key,
  date date not null default current_date,
  server_name text not null,
  shift text not null, -- 'matin', 'soir'
  start_time time,
  end_time time,
  total_drinks_breakfast decimal(10,2) default 0,
  
  -- Dishes
  tajine_sghir_poulet_sold int default 0,
  tajine_sghir_poulet_remaining int default 0,
  tajine_sghir_viande_sold int default 0,
  tajine_sghir_viande_remaining int default 0,
  m9la_viande_sold int default 0,
  m9la_viande_remaining int default 0,
  m9la_tayba_sold int default 0,
  m9la_tayba_remaining int default 0,
  tajine_kbir_sold int default 0,
  tajine_kbir_remaining int default 0,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table server_reports enable row level security;
create policy "Authenticated users can manage server reports" on server_reports
  for all using (auth.role() = 'authenticated');
```

### 5. server_handovers
```sql
create table server_handovers (
  id uuid default gen_random_uuid() primary key,
  date date not null default current_date,
  source_server text not null,
  destination_server text not null,
  handover_time time not null,
  
  -- Remaining stock transmitted
  tajine_sghir_poulet_transmitted int default 0,
  tajine_sghir_viande_transmitted int default 0,
  m9la_viande_transmitted int default 0,
  m9la_tayba_transmitted int default 0,
  tajine_kbir_transmitted int default 0,
  
  note text,
  is_confirmed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table server_handovers enable row level security;
create policy "Authenticated users can manage handovers" on server_handovers
  for all using (auth.role() = 'authenticated');
```

### 6. other_revenues
```sql
create table other_revenues (
  id uuid default gen_random_uuid() primary key,
  date date not null default current_date,
  tyabat_revenue decimal(10,2) default 0,
  chwaya_revenue decimal(10,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table other_revenues enable row level security;
create policy "Authenticated users can manage other revenues" on other_revenues
  for all using (auth.role() = 'authenticated');
```

### 7. daily_expenses
```sql
create table daily_expenses (
  id uuid default gen_random_uuid() primary key,
  date date not null default current_date,
  category text not null, -- 'viande', 'poulet', 'légumes', 'lhanout', 'personnel', 'autre'
  provider text,
  amount decimal(10,2) not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table daily_expenses enable row level security;
create policy "Authenticated users can manage daily expenses" on daily_expenses
  for all using (auth.role() = 'authenticated');
```

### 8. monthly_charges
```sql
create table monthly_charges (
  id uuid default gen_random_uuid() primary key,
  month int not null, -- 1-12
  year int not null,
  category text not null, -- 'loyer', 'CNSS', 'électricité', 'eau', 'internet', 'gaz', 'autre'
  amount decimal(10,2) not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table monthly_charges enable row level security;
create policy "Authenticated users can manage monthly charges" on monthly_charges
  for all using (auth.role() = 'authenticated');
```

This must be created manually in the Supabase Auth dashboard or via a script.
