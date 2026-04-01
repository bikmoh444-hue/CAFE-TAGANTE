import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MONTHLY_CHARGE_CATEGORIES, formatCurrency, cn } from '../lib/utils';

export default function Charges() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [charges, setCharges] = useState<any[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [newCharge, setNewCharge] = useState({
    category: 'rent',
    amount: 0,
    note: ''
  });

  useEffect(() => {
    fetchCharges();
  }, [month, year]);

  const fetchCharges = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('monthly_charges')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .order('created_at', { ascending: false });
      setCharges(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('monthly_charges')
        .insert({ ...newCharge, month, year });
      
      if (error) throw error;
      
      setNewCharge({ category: 'rent', amount: 0, note: '' });
      fetchCharges();
      setMessage({ type: 'success', text: 'Charge ajoutée !' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de l\'ajout' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCharge = async (id: string) => {
    if (!confirm('Supprimer cette charge ?')) return;
    try {
      await supabase.from('monthly_charges').delete().eq('id', id);
      fetchCharges();
    } catch (err) {
      console.error(err);
    }
  };

  const calculateTotal = () => {
    return charges.reduce((sum, c) => sum + Number(c.amount), 0);
  };

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const changeMonth = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center text-white">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Charges Mensuelles Fixes</h3>
            <p className="text-sm text-slate-500">Loyer, CNSS, Électricité, Eau, Internet...</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-white rounded-lg transition shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="px-4 text-center min-w-[140px]">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{year}</p>
            <p className="font-bold text-slate-900">{months[month - 1]}</p>
          </div>
          <button 
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-white rounded-lg transition shadow-sm"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
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
        {/* Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAddCharge} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 sticky top-24">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-slate-400" />
              Nouvelle Charge
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Catégorie</label>
                <select 
                  value={newCharge.category}
                  onChange={(e) => setNewCharge({ ...newCharge, category: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition"
                >
                  {MONTHLY_CHARGE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Montant (DH)</label>
                <input 
                  type="number"
                  required
                  placeholder="0.00"
                  value={newCharge.amount || ''}
                  onChange={(e) => setNewCharge({ ...newCharge, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Note</label>
                <textarea 
                  placeholder="Détails..."
                  rows={2}
                  value={newCharge.note}
                  onChange={(e) => setNewCharge({ ...newCharge, note: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition resize-none"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Ajouter la charge
            </button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Charges de {months[month-1]} {year}</h4>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-widest">Total Mensuel</p>
                <p className="text-xl font-bold text-indigo-600">{formatCurrency(calculateTotal())}</p>
              </div>
            </div>
            
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-200 mx-auto" />
              </div>
            ) : charges.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarClock className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">Aucune charge enregistrée pour ce mois</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Catégorie</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Note</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Montant</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {charges.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                            {MONTHLY_CHARGE_CATEGORIES.find(cat => cat.id === c.category)?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{c.note || '-'}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(c.amount)}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDeleteCharge(c.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
