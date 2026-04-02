import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  FileText,
  Users,
  ArrowRightLeft
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { cn, formatCurrency, DISH_PRICES } from '../lib/utils';
import { 
  DailyExpense, 
  ServerReport, 
  OtherRevenue, 
  MonthlyCharge, 
  Attendance, 
  ServerHandover 
} from '../types';

export default function Statistics() {
  const [view, setView] = useState<'daily' | 'monthly'>('daily');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const [dailyData, setDailyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);

  useEffect(() => {
    if (view === 'daily') fetchDailyReport();
    else fetchMonthlyReport();
  }, [view, date, month, year]);

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      const { data: reports } = await supabase.from('server_reports').select('*').eq('date', date);
      const { data: other } = await supabase.from('other_revenues').select('*').eq('date', date).single();
      const { data: expenses } = await supabase.from('daily_expenses').select('*').eq('date', date);
      const { data: attendance } = await supabase.from('attendance').select('*, employees(*)').eq('date', date);
      const { data: handover } = await supabase.from('server_handovers').select('*').eq('date', date).single();

      // Calculate dish revenues
      const dishRev = (reports || []).reduce((acc, r) => {
        return acc + 
          (r.tajine_sghir_poulet_sold * DISH_PRICES.tajine_sghir_poulet) +
          (r.tajine_sghir_viande_sold * DISH_PRICES.tajine_sghir_viande) +
          (r.m9la_viande_sold * DISH_PRICES.m9la_viande) +
          (r.m9la_tayba_sold * DISH_PRICES.m9la_tayba) +
          (r.tajine_kbir_sold * DISH_PRICES.tajine_kbir);
      }, 0);

      const drinksRev = (reports || []).reduce((acc, r) => acc + Number(r.total_drinks_breakfast), 0);
      const otherRev = (other?.tyabat_revenue || 0) + (other?.chwaya_revenue || 0);
      const totalRev = drinksRev + dishRev + otherRev;
      const totalExp = (expenses || []).reduce((acc, e) => acc + Number(e.amount), 0);

      setDailyData({
        reports,
        other,
        expenses,
        attendance,
        handover,
        drinksRev,
        dishRev,
        otherRev,
        totalRev,
        totalExp,
        profit: totalRev - totalExp
      });
    } catch (err) {
      console.error('Error fetching daily report:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    setLoading(true);
    const start = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
    const end = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');

    try {
      const { data: reports } = await supabase.from('server_reports').select('*').gte('date', start).lte('date', end);
      const { data: other } = await supabase.from('other_revenues').select('*').gte('date', start).lte('date', end);
      const { data: expenses } = await supabase.from('daily_expenses').select('*').gte('date', start).lte('date', end);
      const { data: charges } = await supabase.from('monthly_charges').select('*').eq('month', month).eq('year', year);

      const drinksRev = (reports || []).reduce((acc, r) => acc + Number(r.total_drinks_breakfast), 0);
      const dishRev = (reports || []).reduce((acc, r) => {
        return acc + 
          (r.tajine_sghir_poulet_sold * DISH_PRICES.tajine_sghir_poulet) +
          (r.tajine_sghir_viande_sold * DISH_PRICES.tajine_sghir_viande) +
          (r.m9la_viande_sold * DISH_PRICES.m9la_viande) +
          (r.m9la_tayba_sold * DISH_PRICES.m9la_tayba) +
          (r.tajine_kbir_sold * DISH_PRICES.tajine_kbir);
      }, 0);
      const otherRev = (other || []).reduce((acc, r) => acc + Number(r.tyabat_revenue) + Number(r.chwaya_revenue), 0);
      
      const totalRev = drinksRev + dishRev + otherRev;
      const totalDailyExp = (expenses || []).reduce((acc, e) => acc + Number(e.amount), 0);
      const totalCharges = (charges || []).reduce((acc, c) => acc + Number(c.amount), 0);
      const grossProfit = totalRev - totalDailyExp;
      const netProfit = grossProfit - totalCharges;

      setMonthlyData({
        totalRev,
        totalDailyExp,
        totalCharges,
        grossProfit,
        netProfit,
        drinksRev,
        dishRev,
        otherRev
      });
    } catch (err) {
      console.error('Error fetching monthly report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setView('daily')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all",
              view === 'daily' ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Rapport Journalier
          </button>
          <button
            onClick={() => setView('monthly')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all",
              view === 'monthly' ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Rapport Mensuel
          </button>
        </div>

        <div className="flex items-center gap-3">
          {view === 'daily' ? (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            />
          ) : (
            <div className="flex gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="block border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(2000, i))}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="block border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <option key={i} value={new Date().getFullYear() - 2 + i}>
                    {new Date().getFullYear() - 2 + i}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      ) : view === 'daily' ? (
        <DailyReport data={dailyData} date={date} />
      ) : (
        <MonthlyReport data={monthlyData} month={month} year={year} />
      )}
    </div>
  );
}

function DailyReport({ data, date }: { data: any, date: string }) {
  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-500">Recette Totale</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalRev)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-gray-500">Dépense Totale</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalExp)}</p>
        </div>
        <div className={cn(
          "p-6 rounded-2xl shadow-sm border",
          data.profit >= 0 ? "bg-amber-600 text-white border-amber-500" : "bg-red-600 text-white border-red-500"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 opacity-80" />
            <span className="text-sm font-medium opacity-80">Bénéfice Net</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(data.profit)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personnel Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            Personnel Présent
          </h3>
          <div className="space-y-2">
            {data.attendance?.length > 0 ? (
              data.attendance.map((att: any) => (
                <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{att.employees?.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{att.employees?.role}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                    att.is_present ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {att.is_present ? att.shift : 'Absent'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">Aucune donnée de présence.</p>
            )}
          </div>
        </section>

        {/* Reports Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            Rapports Serveurs
          </h3>
          <div className="space-y-4">
            {data.reports?.map((report: any) => (
              <div key={report.id} className="p-4 border border-gray-100 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900 capitalize">Shift {report.shift} - {report.server_name}</span>
                  <span className="text-sm font-black text-amber-600">{formatCurrency(report.total_drinks_breakfast)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <p>T.S Poulet: {report.tajine_sghir_poulet_sold} vendus</p>
                  <p>T.S Viande: {report.tajine_sghir_viande_sold} vendus</p>
                  <p>M9la Viande: {report.m9la_viande_sold} vendus</p>
                  <p>M9la Tayba: {report.m9la_tayba_sold} vendus</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Handover Section */}
      {data.handover && (
        <section className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
          <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Passation du jour
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-amber-800">De <span className="font-bold">{data.handover.source_server}</span> à <span className="font-bold">{data.handover.destination_server}</span></p>
              <p className="text-xs text-amber-600 mt-1">Heure: {data.handover.handover_time}</p>
              {data.handover.note && <p className="text-sm text-amber-700 mt-2 italic">"{data.handover.note}"</p>}
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase">Stock Transmis</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <p className="text-gray-600">T.S Poulet: <span className="font-bold text-gray-900">{data.handover.tajine_sghir_poulet_transmitted}</span></p>
                <p className="text-gray-600">T.S Viande: <span className="font-bold text-gray-900">{data.handover.tajine_sghir_viande_transmitted}</span></p>
                <p className="text-gray-600">M9la Viande: <span className="font-bold text-gray-900">{data.handover.m9la_viande_transmitted}</span></p>
                <p className="text-gray-600">Tajine Kbir: <span className="font-bold text-gray-900">{data.handover.tajine_kbir_transmitted}</span></p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Expenses Breakdown */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Détail des Dépenses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.expenses?.map((exp: any) => (
            <div key={exp.id} className="flex justify-between p-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-bold text-gray-900 capitalize">{exp.category}</p>
                <p className="text-xs text-gray-500">{exp.provider || 'Divers'}</p>
              </div>
              <span className="text-sm font-bold text-red-600">{formatCurrency(exp.amount)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MonthlyReport({ data, month, year }: { data: any, month: number, year: number }) {
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Recettes Totales</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalRev)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Dépenses Journalières</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalDailyExp)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Bénéfice Brut</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.grossProfit)}</p>
        </div>
        <div className="bg-amber-600 p-6 rounded-2xl shadow-lg text-white">
          <p className="text-sm font-medium opacity-80 mb-1">Bénéfice Net</p>
          <p className="text-2xl font-bold">{formatCurrency(data.netProfit)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Répartition des Recettes</h3>
          <div className="space-y-4">
            <ProgressBar label="Boissons & Ftor" value={data.drinksRev} total={data.totalRev} color="bg-amber-500" />
            <ProgressBar label="Plats (Tajines/M9la)" value={data.dishRev} total={data.totalRev} color="bg-orange-500" />
            <ProgressBar label="Tyabat & Chwaya" value={data.otherRev} total={data.totalRev} color="bg-amber-700" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Charges Fixes du Mois</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
              <span className="text-sm font-medium text-blue-900">Total Charges Fixes</span>
              <span className="text-lg font-bold text-blue-700">{formatCurrency(data.totalCharges)}</span>
            </div>
            <p className="text-xs text-gray-500 italic">
              Ces charges sont déduites du bénéfice brut pour obtenir le bénéfice net mensuel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, color }: any) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-bold text-gray-900">{formatCurrency(value)} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={cn("h-2 rounded-full", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
