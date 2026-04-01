import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Users,
  FileText,
  ArrowRightLeft,
  Wallet,
  Utensils
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DISH_PRICES, formatCurrency, cn } from '../lib/utils';

export default function DailyReports() {
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchDailyData();
  }, [date]);

  const fetchDailyData = async () => {
    setLoading(true);
    try {
      // Fetch all data for the selected date
      const [
        { data: presence },
        { data: reports },
        { data: handover },
        { data: expenses }
      ] = await Promise.all([
        supabase.from('daily_presence').select('*').eq('date', date),
        supabase.from('server_reports').select('*').eq('date', date),
        supabase.from('handovers').select('*').eq('date', date).single(),
        supabase.from('daily_expenses').select('*').eq('date', date)
      ]);

      const morningReport = reports?.find(r => r.shift === 'morning');
      const eveningReport = reports?.find(r => r.shift === 'evening');

      // Calculate totals
      const calculateDishSales = (report: any) => {
        if (!report) return 0;
        return (
          (report.tajine_poulet_sold * DISH_PRICES.tajine_poulet) +
          (report.tajine_viande_sold * DISH_PRICES.tajine_viande) +
          (report.m9la_viande_sold * DISH_PRICES.m9la_viande) +
          (report.m9la_tayba_sold * DISH_PRICES.m9la_tayba) +
          (report.tajine_kbir_sold * DISH_PRICES.tajine_kbir)
        );
      };

      const morningDishSales = calculateDishSales(morningReport);
      const eveningDishSales = calculateDishSales(eveningReport);
      const drinksSales = (Number(morningReport?.total_drinks_coffee_tea_ftor) || 0) + (Number(eveningReport?.total_drinks_coffee_tea_ftor) || 0);
      
      const totalRecette = drinksSales + morningDishSales + eveningDishSales;
      
      const smallExpenses = (Number(morningReport?.total_small_expenses) || 0) + (Number(eveningReport?.total_small_expenses) || 0);
      const largeExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalExpenses = smallExpenses + largeExpenses;

      setData({
        presence,
        morningReport,
        eveningReport,
        handover,
        expenses,
        morningDishSales,
        eveningDishSales,
        drinksSales,
        totalRecette,
        smallExpenses,
        largeExpenses,
        totalExpenses,
        benefice: totalRecette - totalExpenses
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Rapport Journalier Complet</h3>
            <p className="text-sm text-slate-500">Vue d'ensemble consolidée de la journée</p>
          </div>
        </div>
        <input 
          type="date" 
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-500">Recette Totale</p>
          </div>
          <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(data.totalRecette)}</h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <TrendingDown className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-500">Dépenses Totales</p>
          </div>
          <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(data.totalExpenses)}</h4>
        </div>
        <div className={cn(
          "p-6 rounded-2xl border shadow-sm",
          data.benefice >= 0 ? "bg-slate-900 text-white border-slate-900" : "bg-red-900 text-white border-red-900"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-white/10">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium opacity-70">Bénéfice du Jour</p>
          </div>
          <h4 className="text-2xl font-bold">{formatCurrency(data.benefice)}</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personnel & Stock */}
        <div className="space-y-8">
          {/* Personnel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-slate-400" />
              Personnel Présent
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {data.presence?.length > 0 ? data.presence.map((p: any) => (
                <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-bold text-slate-900">{p.employee_id ? 'Employé' : p.role}</p>
                  <p className="text-xs text-slate-500 capitalize">{p.shift === 'morning' ? 'Matin' : p.shift === 'evening' ? 'Soir' : 'Journée'}</p>
                </div>
              )) : (
                <p className="col-span-2 text-center py-4 text-slate-400 text-sm">Aucune présence enregistrée</p>
              )}
            </div>
          </div>

          {/* Stock Transfer */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
              <ArrowRightLeft className="w-5 h-5 text-slate-400" />
              Passation de Stock
            </h4>
            {data.handover ? (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">De {data.handover.from_server} à {data.handover.to_server}</span>
                  <span className="font-bold text-slate-900">{data.handover.handover_time}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 text-xs flex justify-between">
                    <span>Tajine Poulet</span>
                    <span className="font-bold">{data.handover.tajine_poulet_transferred}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 text-xs flex justify-between">
                    <span>Tajine Viande</span>
                    <span className="font-bold">{data.handover.tajine_viande_transferred}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 text-xs flex justify-between">
                    <span>M9la Viande</span>
                    <span className="font-bold">{data.handover.m9la_viande_transferred}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 text-xs flex justify-between">
                    <span>M9la Tayba</span>
                    <span className="font-bold">{data.handover.m9la_tayba_transferred}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center py-4 text-slate-400 text-sm">Aucune passation enregistrée</p>
            )}
          </div>
        </div>

        {/* Sales & Expenses Details */}
        <div className="space-y-8">
          {/* Sales Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Utensils className="w-5 h-5 text-slate-400" />
              Détail des Ventes
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                <span className="text-sm font-medium text-slate-600">Boissons / Café / Ftor</span>
                <span className="font-bold text-slate-900">{formatCurrency(data.drinksSales)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                <span className="text-sm font-medium text-slate-600">Ventes Plats (Matin)</span>
                <span className="font-bold text-slate-900">{formatCurrency(data.morningDishSales)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                <span className="text-sm font-medium text-slate-600">Ventes Plats (Soir)</span>
                <span className="font-bold text-slate-900">{formatCurrency(data.eveningDishSales)}</span>
              </div>
            </div>
          </div>

          {/* Expenses Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Wallet className="w-5 h-5 text-slate-400" />
              Détail des Dépenses
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                <span className="text-sm font-medium text-slate-600">Petits Frais (Rapports)</span>
                <span className="font-bold text-red-600">-{formatCurrency(data.smallExpenses)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                <span className="text-sm font-medium text-slate-600">Grandes Dépenses</span>
                <span className="font-bold text-red-600">-{formatCurrency(data.largeExpenses)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
