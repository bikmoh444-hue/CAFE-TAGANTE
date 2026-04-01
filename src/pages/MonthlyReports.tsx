import { useState, useEffect } from 'react';
import { 
  PieChart, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DISH_PRICES, formatCurrency, cn } from '../lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function MonthlyReports() {
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchMonthlyData();
  }, [month, year]);

  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];

      // Fetch all data for the month
      const [
        { data: reports },
        { data: expenses },
        { data: charges }
      ] = await Promise.all([
        supabase.from('server_reports').select('*').gte('date', startDate).lte('date', endDate),
        supabase.from('daily_expenses').select('*').gte('date', startDate).lte('date', endDate),
        supabase.from('monthly_charges').select('*').eq('month', month).eq('year', year)
      ]);

      // Calculate daily aggregates for the chart
      const dailyDataMap: any = {};
      
      reports?.forEach(r => {
        const dishSales = 
          (r.tajine_poulet_sold * DISH_PRICES.tajine_poulet) +
          (r.tajine_viande_sold * DISH_PRICES.tajine_viande) +
          (r.m9la_viande_sold * DISH_PRICES.m9la_viande) +
          (r.m9la_tayba_sold * DISH_PRICES.m9la_tayba) +
          (r.tajine_kbir_sold * DISH_PRICES.tajine_kbir);
        
        const day = new Date(r.date).getDate();
        if (!dailyDataMap[day]) dailyDataMap[day] = { day, recette: 0, depense: 0 };
        dailyDataMap[day].recette += Number(r.total_drinks_coffee_tea_ftor) + dishSales;
        dailyDataMap[day].depense += Number(r.total_small_expenses);
      });

      expenses?.forEach(e => {
        const day = new Date(e.date).getDate();
        if (!dailyDataMap[day]) dailyDataMap[day] = { day, recette: 0, depense: 0 };
        dailyDataMap[day].depense += Number(e.amount);
      });

      const chartData = Object.values(dailyDataMap).sort((a: any, b: any) => a.day - b.day);

      // Totals
      const totalRecette = chartData.reduce((sum: number, d: any) => sum + d.recette, 0);
      const totalDailyExpenses = chartData.reduce((sum: number, d: any) => sum + d.depense, 0);
      const totalChargesFixes = charges?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      
      const beneficeBrut = totalRecette - totalDailyExpenses;
      const beneficeNet = beneficeBrut - totalChargesFixes;

      setData({
        chartData,
        totalRecette,
        totalDailyExpenses,
        totalChargesFixes,
        beneficeBrut,
        beneficeNet
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const changeMonth = (delta: number) => {
    let newMonth = Number(month) + delta;
    let newYear = Number(year);
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    setMonth(newMonth);
    setYear(newYear);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Rapport Mensuel Consolidé</h3>
            <p className="text-sm text-slate-500">Performance financière du mois</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-lg transition shadow-sm">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="px-4 text-center min-w-[140px]">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{year}</p>
            <p className="font-bold text-slate-900">{months[month - 1]}</p>
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-lg transition shadow-sm">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Recettes</p>
          <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(data.totalRecette)}</h4>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-bold">
            <ArrowUpRight className="w-3 h-3" />
            Ventes du mois
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Dépenses Journalières</p>
          <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(data.totalDailyExpenses)}</h4>
          <div className="mt-2 flex items-center gap-1 text-xs text-red-600 font-bold">
            <ArrowDownRight className="w-3 h-3" />
            Achats & Petits frais
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Charges Fixes</p>
          <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(data.totalChargesFixes)}</h4>
          <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600 font-bold">
            <CalendarClock className="w-3 h-3" />
            Loyer, CNSS, etc.
          </div>
        </div>
        <div className={cn(
          "p-6 rounded-2xl border shadow-sm",
          data.beneficeNet >= 0 ? "bg-slate-900 text-white border-slate-900" : "bg-red-900 text-white border-red-900"
        )}>
          <p className="text-sm font-medium opacity-70 mb-1">Bénéfice Net Final</p>
          <h4 className="text-2xl font-bold">{formatCurrency(data.beneficeNet)}</h4>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold opacity-80">
            <DollarSign className="w-3 h-3" />
            Après toutes charges
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-bold text-slate-900">Évolution Recettes vs Dépenses</h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-900" />
              <span className="text-xs font-medium text-slate-500">Recettes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-xs font-medium text-slate-500">Dépenses</span>
            </div>
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData}>
              <defs>
                <linearGradient id="colorRecette" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDepense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="recette" 
                stroke="#0f172a" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRecette)" 
              />
              <Area 
                type="monotone" 
                dataKey="depense" 
                stroke="#f87171" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorDepense)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h4 className="font-bold text-slate-900">Résumé Financier</h4>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recettes & Bénéfice Brut</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-600">Total Recettes du mois</span>
                  <span className="font-bold text-slate-900">{formatCurrency(data.totalRecette)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-600">Dépenses Journalières (Total)</span>
                  <span className="font-bold text-red-600">-{formatCurrency(data.totalDailyExpenses)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-slate-50 px-4 rounded-xl">
                  <span className="font-bold text-slate-900">Bénéfice Brut</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(data.beneficeBrut)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Charges Fixes & Bénéfice Net</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-600">Bénéfice Brut (Reporté)</span>
                  <span className="font-bold text-slate-900">{formatCurrency(data.beneficeBrut)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-600">Total Charges Fixes</span>
                  <span className="font-bold text-red-600">-{formatCurrency(data.totalChargesFixes)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-slate-900 px-4 rounded-xl text-white">
                  <span className="font-bold">Bénéfice Net Mensuel</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(data.beneficeNet)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
