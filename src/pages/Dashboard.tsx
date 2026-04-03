import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { cn, formatCurrency } from '../lib/utils';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayExpenses: 0,
    todayProfit: 0,
    monthRevenue: 0,
    monthExpenses: 0,
    monthCharges: 0,
    monthNetProfit: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [loadingPersonnel, setLoadingPersonnel] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchTodayPersonnel();
  }, []);

  const getReportDishTotal = (report: any) => {
    return (
      Number(report?.tajine_sghir_poulet_total || 0) +
      Number(report?.tajine_sghir_viande_total || 0) +
      Number(report?.m9la_viande_total || 0) +
      Number(report?.m9la_tayba_total || 0) +
      Number(report?.tajine_kbir_total || 0)
    );
  };

  const getReportDrinksTotal = (report: any) => {
    return Number(report?.total_drinks_breakfast || 0);
  };

  const getReportTotal = (report: any) => {
    return getReportDishTotal(report) + getReportDrinksTotal(report);
  };

  const fetchTodayPersonnel = async () => {
    setLoadingPersonnel(true);
    const today = format(new Date(), 'yyyy-MM-dd');

    try {
      const { data } = await supabase
        .from('attendance')
        .select('*, employees(*)')
        .eq('date', today);

      setTodayAttendance(data || []);
    } catch (err) {
      console.error('Error fetching personnel:', err);
    } finally {
      setLoadingPersonnel(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const startMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const endMonth = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    try {
      const { data: serverReportsToday } = await supabase
        .from('server_reports')
        .select('*')
        .eq('date', today);

      const { data: otherRevenuesToday } = await supabase
        .from('other_revenues')
        .select('*')
        .eq('date', today)
        .single();

      const { data: expensesToday } = await supabase
        .from('daily_expenses')
        .select('*')
        .eq('date', today);

      const { data: serverReportsMonth } = await supabase
        .from('server_reports')
        .select('*')
        .gte('date', startMonth)
        .lte('date', endMonth);

      const { data: otherRevenuesMonth } = await supabase
        .from('other_revenues')
        .select('*')
        .gte('date', startMonth)
        .lte('date', endMonth);

      const { data: expensesMonth } = await supabase
        .from('daily_expenses')
        .select('*')
        .gte('date', startMonth)
        .lte('date', endMonth);

      const { data: chargesMonth } = await supabase
        .from('monthly_charges')
        .select('*')
        .eq('month', new Date().getMonth() + 1)
        .eq('year', new Date().getFullYear());

      const todayServerRev = (serverReportsToday || []).reduce(
        (acc, r) => acc + getReportTotal(r),
        0
      );
      const todayOtherRev =
        Number(otherRevenuesToday?.tyabat_revenue || 0) +
        Number(otherRevenuesToday?.chwaya_revenue || 0);
      const todayTotalRev = todayServerRev + todayOtherRev;
      const todayTotalExp = (expensesToday || []).reduce(
        (acc, e) => acc + Number(e.amount || 0),
        0
      );

      const monthServerRev = (serverReportsMonth || []).reduce(
        (acc, r) => acc + getReportTotal(r),
        0
      );
      const monthOtherRev = (otherRevenuesMonth || []).reduce(
        (acc, r) => acc + Number(r.tyabat_revenue || 0) + Number(r.chwaya_revenue || 0),
        0
      );
      const monthTotalRev = monthServerRev + monthOtherRev;
      const monthTotalExp = (expensesMonth || []).reduce(
        (acc, e) => acc + Number(e.amount || 0),
        0
      );
      const monthTotalCharges = (chargesMonth || []).reduce(
        (acc, c) => acc + Number(c.amount || 0),
        0
      );

      setStats({
        todayRevenue: todayTotalRev,
        todayExpenses: todayTotalExp,
        todayProfit: todayTotalRev - todayTotalExp,
        monthRevenue: monthTotalRev,
        monthExpenses: monthTotalExp,
        monthCharges: monthTotalCharges,
        monthNetProfit: monthTotalRev - monthTotalExp - monthTotalCharges,
      });

      const last7Days = eachDayOfInterval({
        start: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        end: new Date(),
      });

      const chartDataArr = last7Days.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayReports = (serverReportsMonth || []).filter((r) => r.date === dayStr);
        const dayOther = (otherRevenuesMonth || []).find((r) => r.date === dayStr);
        const dayExp = (expensesMonth || []).filter((e) => e.date === dayStr);

        const rev =
          dayReports.reduce((acc, r) => acc + getReportTotal(r), 0) +
          Number(dayOther?.tyabat_revenue || 0) +
          Number(dayOther?.chwaya_revenue || 0);

        const exp = dayExp.reduce((acc, e) => acc + Number(e.amount || 0), 0);

        return {
          name: format(day, 'EEE', { locale: fr }),
          recette: rev,
          depense: exp,
          profit: rev - exp,
        };
      });

      setChartData(chartDataArr);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            Aujourd&apos;hui
          </h2>
          <span className="text-sm font-medium text-gray-500">
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Recette du jour"
            value={stats.todayRevenue}
            icon={TrendingUp}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            title="Dépenses du jour"
            value={stats.todayExpenses}
            icon={TrendingDown}
            color="text-red-600"
            bgColor="bg-red-50"
          />
          <StatCard
            title="Bénéfice du jour"
            value={stats.todayProfit}
            icon={DollarSign}
            color="text-amber-600"
            bgColor="bg-amber-50"
            isProfit
          />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            Personnel présent aujourd&apos;hui
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {loadingPersonnel ? (
              <p className="col-span-full text-center text-gray-400 py-4">Chargement...</p>
            ) : todayAttendance.length === 0 ? (
              <p className="col-span-full text-center text-gray-400 py-4 italic">
                Aucune présence enregistrée pour aujourd&apos;hui.
              </p>
            ) : (
              todayAttendance.map((att: any) => (
                <div
                  key={att.id}
                  className="flex flex-col items-center p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center mb-2',
                      att.is_present ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    )}
                  >
                    <Users className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-gray-900 text-center truncate w-full">
                    {att.employees?.full_name}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase">{att.employees?.role}</p>
                  <span
                    className={cn(
                      'mt-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase',
                      att.is_present ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    )}
                  >
                    {att.is_present ? att.shift : 'Absent'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          Ce Mois
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Recettes Mensuelles"
            value={stats.monthRevenue}
            icon={TrendingUp}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            title="Dépenses Mensuelles"
            value={stats.monthExpenses}
            icon={TrendingDown}
            color="text-red-600"
            bgColor="bg-red-50"
          />
          <StatCard
            title="Charges Fixes"
            value={stats.monthCharges}
            icon={CalendarClock}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Bénéfice Net"
            value={stats.monthNetProfit}
            icon={DollarSign}
            color="text-amber-600"
            bgColor="bg-amber-50"
            isProfit
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Performance des 7 derniers jours</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRecette" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: any) => formatCurrency(Number(value || 0))}
                />
                <Area
                  type="monotone"
                  dataKey="recette"
                  stroke="#059669"
                  fillOpacity={1}
                  fill="url(#colorRecette)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Recettes vs Dépenses</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: any) => formatCurrency(Number(value || 0))}
                />
                <Bar dataKey="recette" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="depense" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor, isProfit }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={cn('p-3 rounded-xl', bgColor)}>
          <Icon className={cn('h-6 w-6', color)} />
        </div>
        {isProfit && (
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              value >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            )}
          >
            {value >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {value >= 0 ? 'Positif' : 'Négatif'}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(value)}</p>
    </div>
  );
}

function CalendarClock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h5" />
      <path d="M17.5 17.5 16 16.25V14" />
      <circle cx="16" cy="16" r="6" />
    </svg>
  );
}