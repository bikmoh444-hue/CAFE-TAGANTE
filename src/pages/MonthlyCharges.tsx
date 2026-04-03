import React, { useEffect, useState } from 'react';
import { Plus, Trash2, CalendarClock, CreditCard, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MonthlyCharge, ChargeCategory } from '../types';
import { cn, formatCurrency } from '../lib/utils';

const categories: { value: ChargeCategory; label: string }[] = [
  { value: 'loyer', label: 'Loyer du local' },
  { value: 'CNSS', label: 'CNSS des employés' },
  { value: 'électricité', label: 'Électricité' },
  { value: 'eau', label: 'Eau' },
  { value: 'internet', label: 'Internet' },
  { value: 'gaz', label: 'Gaz' },
  { value: 'autre', label: 'Autres charges' },
];

export default function MonthlyChargesPage() {
  const [charges, setCharges] = useState<MonthlyCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState<Partial<MonthlyCharge>>({
    category: 'loyer',
    amount: 0,
    note: '',
  });

  useEffect(() => {
    fetchCharges();
  }, [month, year]);

  const fetchCharges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('monthly_charges')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCharges(data || []);
    } catch (err) {
      console.error('Error fetching charges:', err);
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
        .from('monthly_charges')
        .insert([{ ...formData, month, year }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Charge ajoutée avec succès !' });
      setIsModalOpen(false);
      setFormData({ category: 'loyer', amount: 0, note: '' });
      fetchCharges();
    } catch (err) {
      console.error('Error adding charge:', err);
      setMessage({ type: 'error', text: 'Erreur lors de l\'ajout.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette charge ?')) return;
    
    try {
      const { error } = await supabase
        .from('monthly_charges')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchCharges();
    } catch (err) {
      console.error('Error deleting charge:', err);
    }
  };

  const total = charges.reduce((acc, c) => acc + Number(c.amount), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-6 w-6 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900">Charges Mensuelles Fixes</h2>
        </div>
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
          >
            <Plus className="mr-2 h-5 w-5" />
            Ajouter
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Chargement...</td>
                  </tr>
                ) : charges.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Aucune charge pour ce mois.</td>
                  </tr>
                ) : (
                  charges.map((charge) => (
                    <tr key={charge.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-50 rounded-lg mr-3">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 capitalize">{charge.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                        {formatCurrency(charge.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {charge.note || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleDelete(charge.id)}
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

        <div className="bg-blue-600 p-8 rounded-2xl shadow-lg text-white h-fit">
          <h3 className="text-lg font-medium opacity-90">Total Charges Fixes</h3>
          <p className="text-4xl font-black mt-2">{formatCurrency(total)}</p>
          <div className="mt-6 pt-6 border-t border-blue-500/30">
            <p className="text-xs opacity-75 uppercase tracking-wider font-bold">Période</p>
            <p className="text-lg font-medium mt-1 capitalize">
              {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1))}
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-blue-50">
              <h3 className="text-lg font-bold text-blue-900">Ajouter une charge fixe</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ChargeCategory })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (MAD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  value={formData.note || ''}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  className="flex-1 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
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
