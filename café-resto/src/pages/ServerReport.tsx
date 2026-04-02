import React, { useEffect, useState } from 'react';
import { Save, Check, AlertCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { ServerReport, Shift } from '../types';
import { cn } from '../lib/utils';

interface ServerReportPageProps {
  shift: Shift;
}

export default function ServerReportPage({ shift }: ServerReportPageProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState<Partial<ServerReport>>({
    server_name: '',
    start_time: shift === 'matin' ? '07:00' : '15:00',
    end_time: shift === 'matin' ? '15:00' : '23:00',
    total_drinks_breakfast: 0,
    tajine_sghir_poulet_sold: 0,
    tajine_sghir_poulet_remaining: 0,
    tajine_sghir_viande_sold: 0,
    tajine_sghir_viande_remaining: 0,
    m9la_viande_sold: 0,
    m9la_viande_remaining: 0,
    m9la_tayba_sold: 0,
    m9la_tayba_remaining: 0,
    tajine_kbir_sold: 0,
    tajine_kbir_remaining: 0,
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
        setFormData(data);
      } else {
        // Reset form for new entry
        setFormData({
          server_name: '',
          start_time: shift === 'matin' ? '07:00' : '15:00',
          end_time: shift === 'matin' ? '15:00' : '23:00',
          total_drinks_breakfast: 0,
          tajine_sghir_poulet_sold: 0,
          tajine_sghir_poulet_remaining: 0,
          tajine_sghir_viande_sold: 0,
          tajine_sghir_viande_remaining: 0,
          m9la_viande_sold: 0,
          m9la_viande_remaining: 0,
          m9la_tayba_sold: 0,
          m9la_tayba_remaining: 0,
          tajine_kbir_sold: 0,
          tajine_kbir_remaining: 0,
        });
      }
    } catch (err) {
      console.error('Error fetching report:', err);
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
        shift,
      };

      if ((formData as any).id) {
        const { error } = await supabase
          .from('server_reports')
          .update(payload)
          .eq('id', (formData as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('server_reports')
          .insert([payload]);
        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Rapport enregistré avec succès !' });
      fetchReport();
    } catch (err) {
      console.error('Error saving report:', err);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement.' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
          <FileText className="h-6 w-6 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900">Rapport Serveur - {shift === 'matin' ? 'Matin' : 'Soir'}</h2>
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
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informations Générales</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Serveur</label>
              <input
                type="text"
                name="server_name"
                required
                value={formData.server_name}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure Début</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time || ''}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure Fin</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time || ''}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Boissons + Café + Thé + Ftor (MAD)</label>
              <input
                type="number"
                name="total_drinks_breakfast"
                step="0.01"
                required
                value={formData.total_drinks_breakfast}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm font-bold text-amber-700"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Ventes des Plats</h3>
            <div className="space-y-3">
              <DishInput 
                label="Tajine Sghir Poulet" 
                soldName="tajine_sghir_poulet_sold" 
                remName="tajine_sghir_poulet_remaining" 
                formData={formData} 
                onChange={handleInputChange} 
              />
              <DishInput 
                label="Tajine Sghir Viande" 
                soldName="tajine_sghir_viande_sold" 
                remName="tajine_sghir_viande_remaining" 
                formData={formData} 
                onChange={handleInputChange} 
              />
              <DishInput 
                label="M9la Viande" 
                soldName="m9la_viande_sold" 
                remName="m9la_viande_remaining" 
                formData={formData} 
                onChange={handleInputChange} 
              />
              <DishInput 
                label="M9la Tayba" 
                soldName="m9la_tayba_sold" 
                remName="m9la_tayba_remaining" 
                formData={formData} 
                onChange={handleInputChange} 
              />
              <DishInput 
                label="Tajine Kbir" 
                soldName="tajine_kbir_sold" 
                remName="tajine_kbir_remaining" 
                formData={formData} 
                onChange={handleInputChange} 
              />
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
            {saving ? 'Enregistrement...' : 'Enregistrer le rapport'}
          </button>
        </div>
      </form>
    </div>
  );
}

function DishInput({ label, soldName, remName, formData, onChange }: any) {
  return (
    <div className="grid grid-cols-2 gap-4 items-center">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-[10px] text-gray-400 uppercase">Vendu</label>
          <input
            type="number"
            name={soldName}
            value={formData[soldName]}
            onChange={onChange}
            className="block w-full px-2 py-1 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] text-gray-400 uppercase">Restant</label>
          <input
            type="number"
            name={remName}
            value={formData[remName]}
            onChange={onChange}
            className="block w-full px-2 py-1 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
