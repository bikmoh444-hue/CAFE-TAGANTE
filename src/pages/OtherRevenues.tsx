import React, { useEffect, useState } from 'react';
import { Save, Check, AlertCircle, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { OtherRevenue } from '../types';
import { cn, formatCurrency } from '../lib/utils';

export default function OtherRevenuesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState<Partial<OtherRevenue>>({
    tyabat_revenue: 0,
    chwaya_revenue: 0,
  });

  useEffect(() => {
    fetchRevenues();
  }, [date]);

  const fetchRevenues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('other_revenues')
        .select('*')
        .eq('date', date)
        .single();

      if (data) {
        setFormData(data);
      } else {
        setFormData({ tyabat_revenue: 0, chwaya_revenue: 0 });
      }
    } catch (err) {
      console.error('Error fetching revenues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        ...formData,
        date,
      };

      if ((formData as any).id) {
        const { error } = await supabase
          .from('other_revenues')
          .update(payload)
          .eq('id', (formData as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('other_revenues')
          .insert([payload]);
        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Recettes enregistrées avec succès !' });
      fetchRevenues();
    } catch (err) {
      console.error('Error saving revenues:', err);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement.' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const total = (formData.tyabat_revenue || 0) + (formData.chwaya_revenue || 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PlusCircle className="h-6 w-6 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900">Autres Recettes Journalières</h2>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="block border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
        />
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recette Tyabat (MAD)</label>
              <input
                type="number"
                name="tyabat_revenue"
                step="0.01"
                required
                value={formData.tyabat_revenue}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-amber-500 focus:border-amber-500 text-lg font-semibold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recette Chwaya (MAD)</label>
              <input
                type="number"
                name="chwaya_revenue"
                step="0.01"
                required
                value={formData.chwaya_revenue}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-amber-500 focus:border-amber-500 text-lg font-semibold"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">Total Autres Recettes</span>
            <span className="text-2xl font-black text-amber-600">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50"
          >
            <Save className="mr-2 h-5 w-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer les recettes'}
          </button>
        </div>
      </form>
    </div>
  );
}
