import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Coffee,
  UtensilsCrossed,
  Receipt,
  Wallet,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';
import { cn, formatCurrency } from '../lib/utils';

export default function DailyReport() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  const [reports, setReports] = useState<any[]>([]);
  const [otherRevenue, setOtherRevenue] = useState<any | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    fetchDailyData();
  }, [date]);

  const fetchDailyData = async () => {
    setLoading(true);
    try {
      const { data: reportsData, error: reportsError } = await supabase
        .from('server_reports')
        .select('*')
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (reportsError) throw reportsError;

      const { data: otherData, error: otherError } = await supabase
        .from('other_revenues')
        .select('*')
        .eq('date', date)
        .maybeSingle();

      if (otherError) throw otherError;

      const { data: expensesData, error: expensesError } = await supabase
        .from('daily_expenses')
        .select('*')
        .eq('date', date)
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;

      setReports(reportsData || []);
      setOtherRevenue(otherData || null);
      setExpenses(expensesData || []);
    } catch (err) {
      console.error('Error fetching daily report:', err);
      setReports([]);
      setOtherRevenue(null);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;

    try {
      setDownloading(true);

      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f9fafb',
        skipFonts: false,
        style: {
          background: '#f9fafb',
        },
      });

      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(dataUrl);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(`rapport-journalier-${date}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const getDishTotal = (report: any) => {
    return (
      Number(report?.tajine_sghir_poulet_total || 0) +
      Number(report?.tajine_sghir_viande_total || 0) +
      Number(report?.m9la_viande_total || 0) +
      Number(report?.m9la_tayba_total || 0) +
      Number(report?.tajine_kbir_total || 0)
    );
  };

  const getDrinksTotal = (report: any) => Number(report?.total_drinks_breakfast || 0);
  const getExtraExpenses = (report: any) => Number(report?.extra_expenses || 0);

  const serverDrinksRevenue = useMemo(() => {
    return reports.reduce((acc, r) => acc + getDrinksTotal(r), 0);
  }, [reports]);

  const serverDishesRevenue = useMemo(() => {
    return reports.reduce((acc, r) => acc + getDishTotal(r), 0);
  }, [reports]);

  const otherRevenuesTotal = useMemo(() => {
    return Number(otherRevenue?.tyabat_revenue || 0) + Number(otherRevenue?.chwaya_revenue || 0);
  }, [otherRevenue]);

  const extraExpensesTotal = useMemo(() => {
    return reports.reduce((acc, r) => acc + getExtraExpenses(r), 0);
  }, [reports]);

  const dailyExpensesTotal = useMemo(() => {
    return expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  }, [expenses]);

  const totalRevenue = useMemo(() => {
    return serverDrinksRevenue + serverDishesRevenue + otherRevenuesTotal;
  }, [serverDrinksRevenue, serverDishesRevenue, otherRevenuesTotal]);

  const totalExpenses = useMemo(() => {
    return dailyExpensesTotal + extraExpensesTotal;
  }, [dailyExpensesTotal, extraExpensesTotal]);

  const netProfit = useMemo(() => {
    return totalRevenue - totalExpenses;
  }, [totalRevenue, totalExpenses]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-amber-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Rapport Journalier</h1>
            <p className="text-sm text-gray-500">
              Synthèse automatique des rapports serveurs, recettes et dépenses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            />
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={loading || downloading}
            className="inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            <Download className="mr-2 h-4 w-4" />
            {downloading ? 'Téléchargement...' : 'Télécharger PDF'}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6 bg-gray-50 p-1">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Rapport du {date}</h2>
                  <p className="text-sm text-gray-500">Résumé journalier complet</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Bénéfice Net</p>
                  <p className={cn('text-2xl font-black', netProfit >= 0 ? 'text-green-700' : 'text-red-700')}>
                    {formatCurrency(netProfit)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard
                title="Recettes Totales"
                value={totalRevenue}
                icon={TrendingUp}
                iconClass="text-green-600"
                bgClass="bg-green-50"
                valueClass="text-green-700"
              />
              <SummaryCard
                title="Dépenses Totales"
                value={totalExpenses}
                icon={TrendingDown}
                iconClass="text-red-600"
                bgClass="bg-red-50"
                valueClass="text-red-700"
              />
              <SummaryCard
                title="Bénéfice Net"
                value={netProfit}
                icon={DollarSign}
                iconClass={netProfit >= 0 ? 'text-amber-600' : 'text-red-600'}
                bgClass={netProfit >= 0 ? 'bg-amber-50' : 'bg-red-50'}
                valueClass={netProfit >= 0 ? 'text-amber-700' : 'text-red-700'}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                <h2 className="text-lg font-bold text-gray-900">Détail des Recettes</h2>

                <BreakdownRow
                  icon={Coffee}
                  label="Boissons + Café + Thé + Ftor"
                  value={serverDrinksRevenue}
                  valueClass="text-amber-700"
                />
                <BreakdownRow
                  icon={UtensilsCrossed}
                  label="Plats (Tajines / M9la)"
                  value={serverDishesRevenue}
                  valueClass="text-green-700"
                />
                <BreakdownRow
                  icon={Receipt}
                  label="Autres Recettes"
                  value={otherRevenuesTotal}
                  valueClass="text-blue-700"
                />

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900">Total Recettes</span>
                  <span className="text-lg font-black text-green-700">
                    {formatCurrency(totalRevenue)}
                  </span>
                </div>
              </section>

              <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                <h2 className="text-lg font-bold text-gray-900">Détail des Dépenses</h2>

                <BreakdownRow
                  icon={Wallet}
                  label="Dépenses Journalières"
                  value={dailyExpensesTotal}
                  valueClass="text-red-700"
                />
                <BreakdownRow
                  icon={Receipt}
                  label="Dépenses Supplémentaires"
                  value={extraExpensesTotal}
                  valueClass="text-red-700"
                />

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900">Total Dépenses</span>
                  <span className="text-lg font-black text-red-700">
                    {formatCurrency(totalExpenses)}
                  </span>
                </div>
              </section>
            </div>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Rapports des Serveurs</h2>

              <div className="space-y-4">
                {reports.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    Aucun rapport serveur pour cette date.
                  </p>
                ) : (
                  reports.map((report) => {
                    const drinks = getDrinksTotal(report);
                    const dishes = getDishTotal(report);
                    const extra = getExtraExpenses(report);
                    const total = drinks + dishes;

                    return (
                      <div
                        key={report.id}
                        className="border border-gray-100 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {report.server_name} - {report.shift === 'matin' ? 'Matin' : 'Soir'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {report.start_time || '--:--'} {'→'} {report.end_time || '--:--'}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-gray-500">Recette du serveur</p>
                            <p className="text-sm font-black text-green-700">
                              {formatCurrency(total)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Boissons / Ftor</p>
                            <p className="font-bold text-amber-700">{formatCurrency(drinks)}</p>
                          </div>

                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Plats</p>
                            <p className="font-bold text-green-700">{formatCurrency(dishes)}</p>
                          </div>

                          <div className="bg-red-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Dépenses supplémentaires</p>
                            <p className="font-bold text-red-700">{formatCurrency(extra)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Autres Recettes</h2>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Tyabat</span>
                    <span className="text-sm font-bold text-blue-700">
                      {formatCurrency(Number(otherRevenue?.tyabat_revenue || 0))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Chwaya</span>
                    <span className="text-sm font-bold text-blue-700">
                      {formatCurrency(Number(otherRevenue?.chwaya_revenue || 0))}
                    </span>
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Dépenses du Jour</h2>

                <div className="space-y-3 max-h-80 overflow-auto pr-1">
                  {expenses.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      Aucune dépense pour cette date.
                    </p>
                  ) : (
                    expenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {expense.category}
                          </p>
                          <p className="text-xs text-gray-500">
                            {expense.provider || 'Divers'}
                          </p>
                        </div>

                        <span className="text-sm font-bold text-red-700">
                          {formatCurrency(Number(expense.amount || 0))}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconClass,
  bgClass,
  valueClass,
}: {
  title: string;
  value: number;
  icon: any;
  iconClass: string;
  bgClass: string;
  valueClass: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('p-3 rounded-xl', bgClass)}>
          <Icon className={cn('h-6 w-6', iconClass)} />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={cn('text-2xl font-black mt-2', valueClass)}>{formatCurrency(value)}</p>
    </div>
  );
}

function BreakdownRow({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: any;
  label: string;
  value: number;
  valueClass: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white border border-gray-100">
          <Icon className="h-5 w-5 text-gray-600" />
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className={cn('text-sm font-bold', valueClass)}>{formatCurrency(value)}</span>
    </div>
  );
}