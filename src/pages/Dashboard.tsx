import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  BarChart3,
  CalendarClock
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  color: string;
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-xl", color)}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend.positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    </div>
  );
}

import { cn } from '../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayRecette: 0,
    todayDepenses: 0,
    todayBenefice: 0,
    monthRecette: 0,
    monthDepenses: 0,
    monthBeneficeBrut: 0,
    monthChargesFixes: 0,
    monthBeneficeNet: 0,
  });

  const [recentPresence, setRecentPresence] = useState<any[]>([]);

  useEffect(() => {
    // Fetch dashboard data
    // For now, we'll use some mock data to show the UI
    setStats({
      todayRecette: 2450,
      todayDepenses: 850,
      todayBenefice: 1600,
      monthRecette: 45000,
      monthDepenses: 12000,
      monthBeneficeBrut: 33000,
      monthChargesFixes: 15000,
      monthBeneficeNet: 18000,
    });

    setRecentPresence([
      { name: 'Ahmed', role: 'Serveur Matin', status: 'Présent' },
      { name: 'Said', role: 'Serveur Soir', status: 'Présent' },
      { name: 'Fatima', role: 'Cuisinier 1', status: 'Présent' },
      { name: 'Youssef', role: 'Barman', status: 'Présent' },
    ]);
  }, []);

  const chartData = [
    { name: 'Lun', recette: 2100, depense: 800 },
    { name: 'Mar', recette: 1800, depense: 950 },
    { name: 'Mer', recette: 2400, depense: 700 },
    { name: 'Jeu', recette: 2200, depense: 850 },
    { name: 'Ven', recette: 3100, depense: 1200 },
    { name: 'Sam', recette: 3800, depense: 1500 },
    { name: 'Dim', recette: 3400, depense: 1100 },
  ];

  const seedData = async () => {
    try {
      // 1. Seed Employees
      const { data: existingEmp } = await supabase.from('employees').select('id').limit(1);
      if (!existingEmp || existingEmp.length === 0) {
        await supabase.from('employees').insert([
          { name: 'Ahmed', role: 'server_morning' },
          { name: 'Said', role: 'server_evening' },
          { name: 'Fatima', role: 'cook_1' },
          { name: 'Youssef', role: 'barman' },
          { name: 'Karim', role: 'manager' },
        ]);
        alert('Données de test (employés) initialisées !');
      } else {
        alert('Les données existent déjà.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'initialisation');
    }
  };

  return (
    <div className="space-y-8">
      {/* Today's Overview */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Aujourd'hui
          </h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={seedData}
              className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors"
            >
              Initialiser données test
            </button>
            <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-100">
              {new Date().toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Recette du jour" 
            value={formatCurrency(stats.todayRecette)}
            icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
            trend={{ value: "+12%", positive: true }}
            color="bg-emerald-50"
          />
          <StatCard 
            title="Dépenses du jour" 
            value={formatCurrency(stats.todayDepenses)}
            icon={<TrendingDown className="w-6 h-6 text-red-600" />}
            trend={{ value: "-5%", positive: false }}
            color="bg-red-50"
          />
          <StatCard 
            title="Bénéfice du jour" 
            value={formatCurrency(stats.todayBenefice)}
            icon={<DollarSign className="w-6 h-6 text-blue-600" />}
            color="bg-blue-50"
          />
        </div>
      </section>

      {/* Monthly Overview */}
      <section>
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-slate-400" />
          Ce mois-ci
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl text-white col-span-1 md:col-span-2 lg:col-span-1">
            <p className="text-slate-400 text-sm mb-1">Bénéfice Net Mensuel</p>
            <h4 className="text-3xl font-bold mb-4">{formatCurrency(stats.monthBeneficeNet)}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Brut</span>
                <span>{formatCurrency(stats.monthBeneficeBrut)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Charges Fixes</span>
                <span className="text-red-400">-{formatCurrency(stats.monthChargesFixes)}</span>
              </div>
            </div>
          </div>
          <StatCard 
            title="Recettes Mensuelles" 
            value={formatCurrency(stats.monthRecette)}
            icon={<ShoppingBag className="w-6 h-6 text-amber-600" />}
            color="bg-amber-50"
          />
          <StatCard 
            title="Dépenses Mensuelles" 
            value={formatCurrency(stats.monthDepenses)}
            icon={<TrendingDown className="w-6 h-6 text-rose-600" />}
            color="bg-rose-50"
          />
          <StatCard 
            title="Charges Fixes" 
            value={formatCurrency(stats.monthChargesFixes)}
            icon={<CalendarClock className="w-6 h-6 text-indigo-600" />}
            color="bg-indigo-50"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900">Performance de la semaine</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-900" />
                <span className="text-slate-500">Recettes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <span className="text-slate-500">Dépenses</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
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
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="recette" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="depense" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Presence */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Personnel aujourd'hui</h3>
          <div className="space-y-4">
            {recentPresence.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-600 font-bold border border-slate-200 shadow-sm">
                    {p.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.role}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors border border-dashed border-slate-200">
            Voir toute la liste
          </button>
        </div>
      </div>
    </div>
  );
}
