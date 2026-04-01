import { useState, useEffect } from 'react';
import { 
  FileText, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Coffee, 
  Utensils, 
  Wallet, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DISH_PRICES, formatCurrency, cn } from '../lib/utils';

interface ServerReportProps {
  shift: 'morning' | 'evening';
}

export default function ServerReport({ shift }: ServerReportProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [report, setReport] = useState({
    server_name: '',
    start_time: shift === 'morning' ? '07:00' : '15:00',
    end_time: shift === 'morning' ? '15:00' : '23:00',
    total_drinks_coffee_tea_ftor: 0,
    
    tajine_poulet_sold: 0,
    tajine_poulet_remaining: 0,
    tajine_viande_sold: 0,
    tajine_viande_remaining: 0,
    m9la_viande_sold: 0,
    m9la_viande_remaining: 0,
    m9la_tayba_sold: 0,
    m9la_tayba_remaining: 0,
    tajine_kbir_sold: 0,
    tajine_kbir_remaining: 0,
    
    staff_payment: 0,
    other_small_expenses: 0,
  });

  useEffect(() => {
    fetchReport();
  }, [date, shift]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('server_reports')
        .select('*')
        .eq('date', date)
        .eq('shift', shift)
        .single();

      if (data) {
        setReport({
          ...data,
          start_time: data.start_time.substring(0, 5),
          end_time: data.end_time.substring(0, 5),
        });
      } else {
        // Reset to default if no report found
        setReport({
          server_name: '',
          start_time: shift === 'morning' ? '07:00' : '15:00',
          end_time: shift === 'morning' ? '15:00' : '23:00',
          total_drinks_coffee_tea_ftor: 0,
          tajine_poulet_sold: 0,
          tajine_poulet_remaining: 0,
          tajine_viande_sold: 0,
          tajine_viande_remaining: 0,
          m9la_viande_sold: 0,
          m9la_viande_remaining: 0,
          m9la_tayba_sold: 0,
          m9la_tayba_remaining: 0,
          tajine_kbir_sold: 0,
          tajine_kbir_remaining: 0,
          staff_payment: 0,
          other_small_expenses: 0,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setReport(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotalSales = () => {
    const dishSales = 
      (report.tajine_poulet_sold * DISH_PRICES.tajine_poulet) +
      (report.tajine_viande_sold * DISH_PRICES.tajine_viande) +
      (report.m9la_viande_sold * DISH_PRICES.m9la_viande) +
      (report.m9la_tayba_sold * DISH_PRICES.m9la_tayba) +
      (report.tajine_kbir_sold * DISH_PRICES.tajine_kbir);
    
    return Number(report.total_drinks_coffee_tea_ftor) + dishSales;
  };

  const calculateTotalSmallExpenses = () => {
    return Number(report.staff_payment) + Number(report.other_small_expenses);
  };

  const saveReport = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const total_small_expenses = calculateTotalSmallExpenses();
      
      const payload = {
        ...report,
        date,
        shift,
        total_small_expenses,
      };

      const { data: existing } = await supabase
        .from('server_reports')
        .select('id')
        .eq('date', date)
        .eq('shift', shift)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('server_reports')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('server_reports')
          .insert(payload);
        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Rapport enregistré avec succès !' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de l\'enregistrement' });
    } finally {
      setSaving(false);
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
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-white",
            shift === 'morning' ? "bg-amber-500" : "bg-indigo-600"
          )}>
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Rapport Serveur {shift === 'morning' ? 'Matin' : 'Soir'}</h3>
            <p className="text-sm text-slate-500">Saisie des ventes et dépenses du shift</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition"
          />
          <button 
            onClick={saveReport}
            disabled={saving}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-xl font-semibold hover:bg-slate-800 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </div>

      {message && (
        <div className={cn(
          "p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
          message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
        )}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info & Drinks */}
        <div className="space-y-8">
          {/* General Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-slate-400" />
              Informations Shift
            </h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nom du Serveur</label>
                <input 
                  type="text"
                  placeholder="Nom..."
                  value={report.server_name}
                  onChange={(e) => handleInputChange('server_name', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Début</label>
                  <input 
                    type="time"
                    value={report.start_time}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fin</label>
                  <input 
                    type="time"
                    value={report.end_time}
                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Drinks & Ftor */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Coffee className="w-5 h-5 text-slate-400" />
              Boissons & Ftor
            </h4>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Total Global (Café, Thé, Boissons, Ftor)</label>
              <div className="relative">
                <input 
                  type="number"
                  placeholder="0.00"
                  value={report.total_drinks_coffee_tea_ftor}
                  onChange={(e) => handleInputChange('total_drinks_coffee_tea_ftor', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition font-bold text-lg"
                />
                <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Small Expenses */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-slate-400" />
              Petites Dépenses
            </h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Paiement Personnel (Khlas lkhdama)</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={report.staff_payment}
                  onChange={(e) => handleInputChange('staff_payment', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Autres petits frais</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={report.other_small_expenses}
                  onChange={(e) => handleInputChange('other_small_expenses', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition"
                />
              </div>
              <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Total Petits Frais</span>
                <span className="text-lg font-bold text-red-600">{formatCurrency(calculateTotalSmallExpenses())}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dish Sales */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-8">
              <Utensils className="w-5 h-5 text-slate-400" />
              Ventes des Plats
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Tajine Sghir Poulet */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-bold text-slate-900">Tajine Sghir Poulet</h5>
                  <span className="text-xs font-bold bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-500">
                    {DISH_PRICES.tajine_poulet} DH
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Vendu</label>
                    <input 
                      type="number"
                      value={report.tajine_poulet_sold}
                      onChange={(e) => handleInputChange('tajine_poulet_sold', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Restant</label>
                    <input 
                      type="number"
                      value={report.tajine_poulet_remaining}
                      onChange={(e) => handleInputChange('tajine_poulet_remaining', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition font-bold text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tajine Sghir Viande */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-bold text-slate-900">Tajine Sghir Viande</h5>
                  <span className="text-xs font-bold bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-500">
                    {DISH_PRICES.tajine_viande} DH
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Vendu</label>
                    <input 
                      type="number"
                      value={report.tajine_viande_sold}
                      onChange={(e) => handleInputChange('tajine_viande_sold', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Restant</label>
                    <input 
                      type="number"
                      value={report.tajine_viande_remaining}
                      onChange={(e) => handleInputChange('tajine_viande_remaining', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition font-bold text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* M9la Viande */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-bold text-slate-900">M9la Viande</h5>
                  <span className="text-xs font-bold bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-500">
                    {DISH_PRICES.m9la_viande} DH
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Vendue</label>
                    <input 
                      type="number"
                      value={report.m9la_viande_sold}
                      onChange={(e) => handleInputChange('m9la_viande_sold', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Restante</label>
                    <input 
                      type="number"
                      value={report.m9la_viande_remaining}
                      onChange={(e) => handleInputChange('m9la_viande_remaining', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition font-bold text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* M9la Tayba */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-bold text-slate-900">M9la Tayba</h5>
                  <span className="text-xs font-bold bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-500">
                    {DISH_PRICES.m9la_tayba} DH
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Vendue</label>
                    <input 
                      type="number"
                      value={report.m9la_tayba_sold}
                      onChange={(e) => handleInputChange('m9la_tayba_sold', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Restante</label>
                    <input 
                      type="number"
                      value={report.m9la_tayba_remaining}
                      onChange={(e) => handleInputChange('m9la_tayba_remaining', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition font-bold text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tajine Kbir */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4 md:col-span-2">
                <div className="flex justify-between items-center">
                  <h5 className="font-bold text-slate-900">Tajine Kbir</h5>
                  <span className="text-xs font-bold bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-500">
                    {DISH_PRICES.tajine_kbir} DH
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Vendu</label>
                    <input 
                      type="number"
                      value={report.tajine_kbir_sold}
                      onChange={(e) => handleInputChange('tajine_kbir_sold', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Restant</label>
                    <input 
                      type="number"
                      value={report.tajine_kbir_remaining}
                      onChange={(e) => handleInputChange('tajine_kbir_remaining', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition font-bold text-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className="mt-12 bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Recette du Shift</p>
                <h4 className="text-4xl font-bold">{formatCurrency(calculateTotalSales())}</h4>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Shift</p>
                  <p className="font-bold">{shift === 'morning' ? 'Matin' : 'Soir'}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { DollarSign } from 'lucide-react';
