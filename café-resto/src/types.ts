export type Role = 'serveur' | 'cuisinier' | 'barman' | 'chway';
export type Shift = 'matin' | 'soir';
export type ExpenseCategory = 'viande' | 'poulet' | 'légumes' | 'lhanout' | 'personnel' | 'autre';
export type ChargeCategory = 'loyer' | 'CNSS' | 'électricité' | 'eau' | 'internet' | 'gaz' | 'autre';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

export interface Employee {
  id: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  remark: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  date: string;
  employee_id: string;
  is_present: boolean;
  shift: string | null;
  remark: string | null;
  created_at: string;
  employee?: Employee;
}

export interface ServerReport {
  id: string;
  date: string;
  server_name: string;
  shift: Shift;
  start_time: string | null;
  end_time: string | null;
  total_drinks_breakfast: number;
  
  tajine_sghir_poulet_sold: number;
  tajine_sghir_poulet_remaining: number;
  tajine_sghir_viande_sold: number;
  tajine_sghir_viande_remaining: number;
  m9la_viande_sold: number;
  m9la_viande_remaining: number;
  m9la_tayba_sold: number;
  m9la_tayba_remaining: number;
  tajine_kbir_sold: number;
  tajine_kbir_remaining: number;
  
  created_at: string;
}

export interface ServerHandover {
  id: string;
  date: string;
  source_server: string;
  destination_server: string;
  handover_time: string;
  
  tajine_sghir_poulet_transmitted: number;
  tajine_sghir_viande_transmitted: number;
  m9la_viande_transmitted: number;
  m9la_tayba_transmitted: number;
  tajine_kbir_transmitted: number;
  
  note: string | null;
  is_confirmed: boolean;
  created_at: string;
}

export interface OtherRevenue {
  id: string;
  date: string;
  tyabat_revenue: number;
  chwaya_revenue: number;
  created_at: string;
}

export interface DailyExpense {
  id: string;
  date: string;
  category: ExpenseCategory;
  provider: string | null;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface MonthlyCharge {
  id: string;
  month: number;
  year: number;
  category: ChargeCategory;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface DailyResult {
  date: string;
  total_revenue: number;
  total_expenses: number;
  profit: number;
}
