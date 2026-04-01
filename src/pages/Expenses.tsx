import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EXPENSE_CATEGORIES, formatCurrency, cn } from '../lib/utils';

export default function Expenses() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [newExpense, setNewExpense] = useState({
    category: 'vegetables',
    supplier: '',
    amount: 0,
    note: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, [date]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('daily_expenses')
        .select('*')
        .eq('date', date)
        .order('created_at', { ascending: false });
      setExpenses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('daily_expenses')
        .insert({ ...newExpense, date });
      
      if (error) throw error;
      
      setNewExpense({ category: 'vegetables', supplier: '', amount: 0, note: '' });
      fetchExpenses();
      setMessage({ type: 'success', text: 'Dépense ajoutée !' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de l\'ajout' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    try {
      await supabase.from('daily_expenses').delete().eq('id', id);
      fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const calculateTotal = () => {
    return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center text-white">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Grandes Dépenses Journalières</h3>
            <p className="text-sm text-slate-500">Achats importants (Légumes, Viande, Épicerie...)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition"
          />
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
          <form onSubmit={handleAddExpense} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 sticky top-24">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-slate-400" />
              Nouvelle Dépense
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Catégorie</label>
                <select 
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fournisseur</label>
                <input 
                  type="text"
                  placeholder="Ex: Boucher Ahmed..."
                  value={newExpense.supplier}
                  onChange={(e) => setNewExpense({ ...newExpense, supplier: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Montant (DH)</label>
                <input 
                  type="number"
                  required
                  placeholder="0.00"
                  value={newExpense.amount || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Note</label>
                <textarea 
                  placeholder="Détails..."
                  rows={2}
                  value={newExpense.note}
                  onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
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
              Ajouter la dépense
            </button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Dépenses du {new Date(date).toLocaleDateString('fr-FR')}</h4>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-widest">Total Journalier</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(calculateTotal())}</p>
              </div>
            </div>
            
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-200 mx-auto" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="p-12 text-center">
                <Wallet className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">Aucune dépense enregistrée pour cette date</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Catégorie</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fournisseur</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Note</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Montant</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                            {EXPENSE_CATEGORIES.find(c => c.id === exp.category)?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{exp.supplier || '-'}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{exp.note || '-'}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(exp.amount)}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDeleteExpense(exp.id)}
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
