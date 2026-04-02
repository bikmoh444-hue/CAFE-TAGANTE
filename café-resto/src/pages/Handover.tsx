import React, { useEffect, useState } from 'react';
import { Save, Check, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { ServerHandover, ServerReport } from '../types';
import { cn } from '../lib/utils';

export default function HandoverPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState<Partial<ServerHandover>>({
    source_server: '',
    destination_server: '',
    handover_time: format(new Date(), 'HH:mm'),
    tajine_sghir_poulet_transmitted: 0,
    tajine_sghir_viande_transmitted: 0,
    m9la_viande_transmitted: 0,
    m9la_tayba_transmitted: 0,
    tajine_kbir_transmitted: 0,
    note: '',
    is_confirmed: false,
  });

  useEffect(() => {
    fetchHandover();
  }, [date]);

  const fetchHandover = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('server_handovers')
        .select('*')
        .eq('date', date)
        .single();

      if (data) {
        setFormData(data);
      } else {
        // Try to fetch morning report to pre-fill remaining stock
        const { data: morningReport } = await supabase
          .from('server_reports')
          .select('*')
          .eq('date', date)
          .eq('shift', 'matin')
          .single();

        setFormData({
          source_server: morningReport?.server_name || '',
          destination_server: '',
          handover_time: format(new Date(), 'HH:mm'),
          tajine_sghir_poulet_transmitted: morningReport?.tajine_sghir_poulet_remaining || 0,
          tajine_sghir_viande_transmitted: morningReport?.tajine_sghir_viande_remaining || 0,
          m9la_viande_transmitted: morningReport?.m9la_viande_remaining || 0,
          m9la_tayba_transmitted: morningReport?.m9la_tayba_remaining || 0,
          tajine_kbir_transmitted: morningReport?.tajine_kbir_remaining || 0,
          note: '',
          is_confirmed: false,
        });
      }
    } catch (err) {
      console.error('Error fetching handover:', err);
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
          .from('server_handovers')
          .update(payload)
          .eq('id', (formData as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('server_handovers')
          .insert([payload]);
        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Passation enregistrée avec succès !' });
      fetchHandover();
    } catch (err) {
      console.error('Error saving handover:', err);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement.' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="h-6 w-6 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900">Passation entre Serveurs</h2>
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Détails de Passation</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serveur Sortant (Matin)</label>
                <input
                  type="text"
                  name="source_server"
                  required
                  value={formData.source_server}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serveur Entrant (Soir)</label>
                <input
                  type="text"
                  name="destination_server"
                  required
                  value={formData.destination_server}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heure de Passation</label>
              <input
                type="time"
                name="handover_time"
                required
                value={formData.handover_time}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note / Remarque</label>
              <textarea
                name="note"
                rows={3}
                value={formData.note || ''}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                placeholder="Ex: Tout est en ordre, attention au gaz..."
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_confirmed"
                name="is_confirmed"
                checked={formData.is_confirmed}
                onChange={(e) => setFormData({ ...formData, is_confirmed: e.target.checked })}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              />
              <label htmlFor="is_confirmed" className="ml-2 block text-sm text-gray-900">
                Confirmation de réception par le serveur du soir
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Stock Transmis (Restant)</h3>
            <div className="space-y-3">
              <StockInput label="Tajine Sghir Poulet" name="tajine_sghir_poulet_transmitted" value={formData.tajine_sghir_poulet_transmitted} onChange={handleInputChange} />
              <StockInput label="Tajine Sghir Viande" name="tajine_sghir_viande_transmitted" value={formData.tajine_sghir_viande_transmitted} onChange={handleInputChange} />
              <StockInput label="M9la Viande" name="m9la_viande_transmitted" value={formData.m9la_viande_transmitted} onChange={handleInputChange} />
              <StockInput label="M9la Tayba" name="m9la_tayba_transmitted" value={formData.m9la_tayba_transmitted} onChange={handleInputChange} />
              <StockInput label="Tajine Kbir" name="tajine_kbir_transmitted" value={formData.tajine_kbir_transmitted} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50"
          >
            <Save className="mr-2 h-5 w-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer la passation'}
          </button>
        </div>
      </form>
    </div>
  );
}

function StockInput({ label, name, value, onChange }: any) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        className="block w-24 px-3 py-1 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm text-center"
      />
    </div>
  );
}
