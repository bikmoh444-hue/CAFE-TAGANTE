import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Wallet, Calendar, Tag, User, CreditCard, AlertCircle, Check } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { DailyExpense, ExpenseCategory } from '../types';
import { cn, formatCurrency } from '../lib/utils';

const categories: { value: ExpenseCategory; label: string; icon: any }[] = [
  { value: 'viande', label: 'Viande', icon: CreditCard },
  { value: 'poulet', label: 'Poulet', icon: CreditCard },
  { value: 'légumes', label: 'Légumes', icon: Tag },
  { value: 'lhanout', label: 'Lhanout / Épicerie', icon: Tag },
  { value: 'personnel', label: 'Paiement Personnel', icon: User },
  { value: 'autre', label: 'Autre', icon: Plus },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState<Partial<DailyExpense>>({
    category: 'viande',
    provider: '',
    amount: 0,
    note: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, [date]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_expenses')
        .select('*')
        .eq('date', date)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('daily_expenses')
        .insert([{ ...formData, date }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Dépense ajoutée avec succès !' });
      setIsModalOpen(false);
      setFormData({ category: 'viande', provider: '', amount: 0, note: '' });
      fetchExpenses();
    } catch (err) {
      console.error('Error adding expense:', err);
      setMessage({ type: 'error', text: 'Erreur lors de l\'ajout.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    
    try {
      const { error } = await supabase
        .from('daily_expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  const total = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900">Dépenses Journalières</h2>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          />
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
          >
            <Plus className="mr-2 h-5 w-5" />
            Ajouter une dépense
          </button>
        </div>
      </div>

      {message && (
        <div className={cn(
          "p-4 rounded-xl flex items-center gap-3",
          message.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
        )}>
          {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Chargement...</td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Aucune dépense pour ce jour.</td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-amber-50 rounded-lg mr-3">
                            {React.createElement(categories.find(c => c.value === expense.category)?.icon || Tag, { className: "h-4 w-4 text-amber-600" })}
                          </div>
                          <span className="text-sm font-medium text-gray-900 capitalize">{expense.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.provider || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-amber-600 p-6 rounded-2xl shadow-lg text-white">
            <h3 className="text-lg font-medium opacity-90">Total Dépenses</h3>
            <p className="text-3xl font-black mt-2">{formatCurrency(total)}</p>
            <div className="mt-4 pt-4 border-t border-amber-500/30">
              <p className="text-xs opacity-75 uppercase tracking-wider font-bold">Aujourd'hui</p>
              <p className="text-sm font-medium mt-1">{format(new Date(date), 'dd MMMM yyyy')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Répartition</h3>
            <div className="space-y-3">
              {categories.map(cat => {
                const catTotal = expenses.filter(e => e.category === cat.value).reduce((acc, e) => acc + Number(e.amount), 0);
                const percentage = total > 0 ? (catTotal / total) * 100 : 0;
                return (
                  <div key={cat.value}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{cat.label}</span>
                      <span className="text-gray-900 font-bold">{formatCurrency(catTotal)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div 
                        className="bg-amber-500 h-1.5 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-amber-50">
              <h3 className="text-lg font-bold text-amber-900">Ajouter une dépense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur / Bénéficiaire</label>
                <input
                  type="text"
                  value={formData.provider || ''}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                  placeholder="Ex: Boucherie Omar, Hanout..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (MAD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  value={formData.note || ''}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
