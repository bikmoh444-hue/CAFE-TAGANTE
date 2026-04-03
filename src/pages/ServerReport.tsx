import React, { useEffect, useMemo, useState } from 'react';
import { Save, Check, AlertCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Shift } from '../types';
import { cn } from '../lib/utils';

interface ServerReportPageProps {
  shift: Shift;
}

type ServerReportFormData = {
  id?: string;
  server_name: string;
  start_time: string;
  end_time: string;
  total_drinks_breakfast: number;
  extra_expenses: number;

  tajine_sghir_poulet_price: number;
  tajine_sghir_poulet_prepared: number;
  tajine_sghir_poulet_sold: number;
  tajine_sghir_poulet_remaining: number;
  tajine_sghir_poulet_total: number;

  tajine_sghir_viande_price: number;
  tajine_sghir_viande_prepared: number;
  tajine_sghir_viande_sold: number;
  tajine_sghir_viande_remaining: number;
  tajine_sghir_viande_total: number;

  m9la_viande_price: number;
  m9la_viande_prepared: number;
  m9la_viande_sold: number;
  m9la_viande_remaining: number;
  m9la_viande_total: number;

  m9la_tayba_price: number;
  m9la_tayba_prepared: number;
  m9la_tayba_sold: number;
  m9la_tayba_remaining: number;
  m9la_tayba_total: number;

  tajine_kbir_price: number;
  tajine_kbir_prepared: number;
  tajine_kbir_sold: number;
  tajine_kbir_remaining: number;
  tajine_kbir_total: number;
};

function getDefaultFormData(shift: Shift): ServerReportFormData {
  return {
    server_name: '',
    start_time: shift === 'matin' ? '07:00' : '15:00',
    end_time: shift === 'matin' ? '15:00' : '23:00',
    total_drinks_breakfast: 0,
    extra_expenses: 0,

    tajine_sghir_poulet_price: 0,
    tajine_sghir_poulet_prepared: 0,
    tajine_sghir_poulet_sold: 0,
    tajine_sghir_poulet_remaining: 0,
    tajine_sghir_poulet_total: 0,

    tajine_sghir_viande_price: 0,
    tajine_sghir_viande_prepared: 0,
    tajine_sghir_viande_sold: 0,
    tajine_sghir_viande_remaining: 0,
    tajine_sghir_viande_total: 0,

    m9la_viande_price: 0,
    m9la_viande_prepared: 0,
    m9la_viande_sold: 0,
    m9la_viande_remaining: 0,
    m9la_viande_total: 0,

    m9la_tayba_price: 0,
    m9la_tayba_prepared: 0,
    m9la_tayba_sold: 0,
    m9la_tayba_remaining: 0,
    m9la_tayba_total: 0,

    tajine_kbir_price: 0,
    tajine_kbir_prepared: 0,
    tajine_kbir_sold: 0,
    tajine_kbir_remaining: 0,
    tajine_kbir_total: 0,
  };
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function computeDishValues(price: number, prepared: number, remaining: number) {
  const safePrice = Math.max(0, toNumber(price));
  const safePrepared = Math.max(0, toNumber(prepared));
  const safeRemaining = Math.max(0, toNumber(remaining));

  const sold = Math.max(0, safePrepared - safeRemaining);
  const total = sold * safePrice;

  return {
    price: safePrice,
    prepared: safePrepared,
    remaining: safeRemaining,
    sold,
    total,
  };
}

function recalculateFormData(data: ServerReportFormData): ServerReportFormData {
  const poulet = computeDishValues(
    data.tajine_sghir_poulet_price,
    data.tajine_sghir_poulet_prepared,
    data.tajine_sghir_poulet_remaining
  );

  const viande = computeDishValues(
    data.tajine_sghir_viande_price,
    data.tajine_sghir_viande_prepared,
    data.tajine_sghir_viande_remaining
  );

  const m9laViande = computeDishValues(
    data.m9la_viande_price,
    data.m9la_viande_prepared,
    data.m9la_viande_remaining
  );

  const m9laTayba = computeDishValues(
    data.m9la_tayba_price,
    data.m9la_tayba_prepared,
    data.m9la_tayba_remaining
  );

  const kbir = computeDishValues(
    data.tajine_kbir_price,
    data.tajine_kbir_prepared,
    data.tajine_kbir_remaining
  );

  return {
    ...data,
    total_drinks_breakfast: Math.max(0, toNumber(data.total_drinks_breakfast)),
    extra_expenses: Math.max(0, toNumber(data.extra_expenses)),

    tajine_sghir_poulet_price: poulet.price,
    tajine_sghir_poulet_prepared: poulet.prepared,
    tajine_sghir_poulet_remaining: poulet.remaining,
    tajine_sghir_poulet_sold: poulet.sold,
    tajine_sghir_poulet_total: poulet.total,

    tajine_sghir_viande_price: viande.price,
    tajine_sghir_viande_prepared: viande.prepared,
    tajine_sghir_viande_remaining: viande.remaining,
    tajine_sghir_viande_sold: viande.sold,
    tajine_sghir_viande_total: viande.total,

    m9la_viande_price: m9laViande.price,
    m9la_viande_prepared: m9laViande.prepared,
    m9la_viande_remaining: m9laViande.remaining,
    m9la_viande_sold: m9laViande.sold,
    m9la_viande_total: m9laViande.total,

    m9la_tayba_price: m9laTayba.price,
    m9la_tayba_prepared: m9laTayba.prepared,
    m9la_tayba_remaining: m9laTayba.remaining,
    m9la_tayba_sold: m9laTayba.sold,
    m9la_tayba_total: m9laTayba.total,

    tajine_kbir_price: kbir.price,
    tajine_kbir_prepared: kbir.prepared,
    tajine_kbir_remaining: kbir.remaining,
    tajine_kbir_sold: kbir.sold,
    tajine_kbir_total: kbir.total,
  };
}

export default function ServerReportPage({ shift }: ServerReportPageProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<ServerReportFormData>(() =>
    getDefaultFormData(shift)
  );

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

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setFormData(
          recalculateFormData({
            ...getDefaultFormData(shift),
            ...data,
          })
        );
      } else {
        setFormData(getDefaultFormData(shift));
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setMessage({ type: 'error', text: 'Erreur lors du chargement du rapport.' });
    } finally {
      setLoading(false);
    }
  };

  const totalPlats = useMemo(() => {
    return (
      formData.tajine_sghir_poulet_total +
      formData.tajine_sghir_viande_total +
      formData.m9la_viande_total +
      formData.m9la_tayba_total +
      formData.tajine_kbir_total
    );
  }, [formData]);

  const grandRevenue = useMemo(() => {
    return totalPlats + toNumber(formData.total_drinks_breakfast);
  }, [totalPlats, formData.total_drinks_breakfast]);

  const netAfterExtraExpenses = useMemo(() => {
    return grandRevenue - toNumber(formData.extra_expenses);
  }, [grandRevenue, formData.extra_expenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const recalculated = recalculateFormData(formData);

      const payload = {
        ...recalculated,
        date,
        shift,
      };

      if (payload.id) {
        const { error } = await supabase
          .from('server_reports')
          .update(payload)
          .eq('id', payload.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('server_reports')
          .insert([payload]);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Rapport enregistré avec succès !' });
      await fetchReport();
    } catch (err) {
      console.error('Error saving report:', err);
      setMessage({ type: 'error', text: "Erreur lors de l'enregistrement." });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData((prev) => {
      const next: ServerReportFormData = {
        ...prev,
        [name]: type === 'number' ? toNumber(value) : value,
      } as ServerReportFormData;

      return recalculateFormData(next);
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Rapport Serveur - {shift === 'matin' ? 'Matin' : 'Soir'}
          </h2>
        </div>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="block border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
        />
      </div>

      {message && (
        <div
          className={cn(
            'p-4 rounded-xl flex items-center gap-3',
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-red-50 text-red-700 border border-red-100'
          )}
        >
          {message.type === 'success' ? (
            <Check className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Informations Générales
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du Serveur
              </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure Début
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure Fin
                </label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Boissons + Café + Thé + Ftor (MAD)
              </label>
              <input
                type="number"
                name="total_drinks_breakfast"
                step="0.01"
                min="0"
                required
                value={formData.total_drinks_breakfast}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm font-bold text-amber-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dépenses supplémentaires (MAD)
              </label>
              <input
                type="number"
                name="extra_expenses"
                step="0.01"
                min="0"
                value={formData.extra_expenses}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm font-bold text-red-600"
              />
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Total Plats</span>
                <span className="font-bold text-amber-700">{totalPlats.toFixed(2)} MAD</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Recette Totale</span>
                <span className="font-bold text-green-700">{grandRevenue.toFixed(2)} MAD</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Après Dépenses Supplémentaires</span>
                <span className="font-bold text-red-600">
                  {netAfterExtraExpenses.toFixed(2)} MAD
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Ventes des Plats
            </h3>

            <div className="space-y-4">
              <DishInput
                label="Tajine Sghir Poulet"
                priceName="tajine_sghir_poulet_price"
                preparedName="tajine_sghir_poulet_prepared"
                soldName="tajine_sghir_poulet_sold"
                remName="tajine_sghir_poulet_remaining"
                totalName="tajine_sghir_poulet_total"
                formData={formData}
                onChange={handleInputChange}
              />

              <DishInput
                label="Tajine Sghir Viande"
                priceName="tajine_sghir_viande_price"
                preparedName="tajine_sghir_viande_prepared"
                soldName="tajine_sghir_viande_sold"
                remName="tajine_sghir_viande_remaining"
                totalName="tajine_sghir_viande_total"
                formData={formData}
                onChange={handleInputChange}
              />

              <DishInput
                label="M9la Viande"
                priceName="m9la_viande_price"
                preparedName="m9la_viande_prepared"
                soldName="m9la_viande_sold"
                remName="m9la_viande_remaining"
                totalName="m9la_viande_total"
                formData={formData}
                onChange={handleInputChange}
              />

              <DishInput
                label="M9la Tayba"
                priceName="m9la_tayba_price"
                preparedName="m9la_tayba_prepared"
                soldName="m9la_tayba_sold"
                remName="m9la_tayba_remaining"
                totalName="m9la_tayba_total"
                formData={formData}
                onChange={handleInputChange}
              />

              <DishInput
                label="Tajine Kbir"
                priceName="tajine_kbir_price"
                preparedName="tajine_kbir_prepared"
                soldName="tajine_kbir_sold"
                remName="tajine_kbir_remaining"
                totalName="tajine_kbir_total"
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

type DishInputProps = {
  label: string;
  priceName: keyof ServerReportFormData;
  preparedName: keyof ServerReportFormData;
  soldName: keyof ServerReportFormData;
  remName: keyof ServerReportFormData;
  totalName: keyof ServerReportFormData;
  formData: ServerReportFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

function DishInput({
  label,
  priceName,
  preparedName,
  soldName,
  remName,
  totalName,
  formData,
  onChange,
}: DishInputProps) {
  const prepared = toNumber(formData[preparedName]);
  const remaining = toNumber(formData[remName]);
  const hasError = remaining > prepared;

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-bold text-green-700">
          {toNumber(formData[totalName]).toFixed(2)} MAD
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-[10px] text-gray-400 uppercase mb-1">Prix</label>
          <input
            type="number"
            min="0"
            step="0.01"
            name={String(priceName)}
            value={toNumber(formData[priceName])}
            onChange={onChange}
            className="block w-full px-2 py-2 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-[10px] text-gray-400 uppercase mb-1">Préparé</label>
          <input
            type="number"
            min="0"
            name={String(preparedName)}
            value={toNumber(formData[preparedName])}
            onChange={onChange}
            className="block w-full px-2 py-2 border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-[10px] text-gray-400 uppercase mb-1">Restant</label>
          <input
            type="number"
            min="0"
            name={String(remName)}
            value={toNumber(formData[remName])}
            onChange={onChange}
            className={cn(
              'block w-full px-2 py-2 border rounded focus:ring-amber-500 focus:border-amber-500 text-sm',
              hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
            )}
          />
        </div>

        <div>
          <label className="block text-[10px] text-gray-400 uppercase mb-1">Vendu</label>
          <input
            type="number"
            name={String(soldName)}
            value={toNumber(formData[soldName])}
            readOnly
            className="block w-full px-2 py-2 border border-gray-200 bg-gray-50 rounded text-sm font-semibold text-gray-700"
          />
        </div>

        <div>
          <label className="block text-[10px] text-gray-400 uppercase mb-1">Total</label>
          <input
            type="number"
            name={String(totalName)}
            value={toNumber(formData[totalName])}
            readOnly
            className="block w-full px-2 py-2 border border-gray-200 bg-gray-50 rounded text-sm font-semibold text-green-700"
          />
        </div>
      </div>

      {hasError && (
        <p className="text-xs text-red-600">
          Le restant ne peut pas être supérieur à la quantité préparée.
        </p>
      )}
    </div>
  );
}