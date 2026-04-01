import { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  User,
  MessageSquare,
  Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

export default function Handover() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [handover, setHandover] = useState({
    from_server: '',
    to_server: '',
    handover_time: new Date().toTimeString().substring(0, 5),
    tajine_poulet_transferred: 0,
    tajine_viande_transferred: 0,
    m9la_viande_transferred: 0,
    m9la_tayba_transferred: 0,
    tajine_kbir_transferred: 0,
    note: '',
    confirmed: false
  });

  useEffect(() => {
    fetchHandover();
  }, [date]);

  const fetchHandover = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('handovers')
        .select('*')
        .eq('date', date)
        .single();

      if (data) {
        setHandover({
          ...data,
          handover_time: data.handover_time.substring(0, 5),
        });
      } else {
        // Try to fetch morning report to pre-fill stock
        const { data: morningReport } = await supabase
          .from('server_reports')
          .select('*')
          .eq('date', date)
          .eq('shift', 'morning')
          .single();

        if (morningReport) {
          setHandover(prev => ({
            ...prev,
            from_server: morningReport.server_name,
            tajine_poulet_transferred: morningReport.tajine_poulet_remaining,
            tajine_viande_transferred: morningReport.tajine_viande_remaining,
            m9la_viande_transferred: morningReport.m9la_viande_remaining,
            m9la_tayba_transferred: morningReport.m9la_tayba_remaining,
            tajine_kbir_transferred: morningReport.tajine_kbir_remaining,
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setHandover(prev => ({ ...prev, [field]: value }));
  };

  const saveHandover = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...handover,
        date
      };

      const { data: existing } = await supabase
        .from('handovers')
        .select('id')
        .eq('date', date)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('handovers')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('handovers')
          .insert(payload);
        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Passation enregistrée avec succès !' });
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
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Passation entre Serveurs</h3>
            <p className="text-sm text-slate-500">Transfert du stock restant entre shifts</p>
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
            onClick={saveHandover}
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
        {/* Left Column: Info */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" />
              Acteurs & Heure
            </h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Serveur Source (Matin)</label>
                <input 
                  type="text"
                  placeholder="Nom..."
                  value={handover.from_server}
                  onChange={(e) => handleInputChange('from_server', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Serveur Destination (Soir)</label>
                <input 
                  type="text"
                  placeholder="Nom..."
                  value={handover.to_server}
                  onChange={(e) => handleInputChange('to_server', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Heure de Passation</label>
                <div className="relative">
                  <input 
                    type="time"
                    value={handover.handover_time}
                    onChange={(e) => handleInputChange('handover_time', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-slate-400" />
              Note & Confirmation
            </h4>
            <textarea 
              placeholder="Notes éventuelles..."
              rows={3}
              value={handover.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition resize-none"
            />
            <button 
              onClick={() => handleInputChange('confirmed', !handover.confirmed)}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition",
                handover.confirmed 
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                  : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
              )}
            >
              <Check className={cn("w-5 h-5", handover.confirmed ? "opacity-100" : "opacity-30")} />
              {handover.confirmed ? "Réception Confirmée" : "Confirmer Réception"}
            </button>
          </div>
        </div>

        {/* Right Column: Stock */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-8">Stock Transmis</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { id: 'tajine_poulet_transferred', label: 'Tajine Sghir Poulet' },
              { id: 'tajine_viande_transferred', label: 'Tajine Sghir Viande' },
              { id: 'm9la_viande_transferred', label: 'M9la Viande' },
              { id: 'm9la_tayba_transferred', label: 'M9la Tayba' },
              { id: 'tajine_kbir_transferred', label: 'Tajine Kbir' },
            ].map((item) => (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-slate-700">{item.label}</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleInputChange(item.id, Math.max(0, (handover as any)[item.id] - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white transition"
                  >
                    -
                  </button>
                  <input 
                    type="number"
                    value={(handover as any)[item.id]}
                    onChange={(e) => handleInputChange(item.id, parseInt(e.target.value) || 0)}
                    className="w-12 text-center bg-transparent font-bold text-slate-900 outline-none"
                  />
                  <button 
                    onClick={() => handleInputChange(item.id, (handover as any)[item.id] + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white transition"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 rounded-2xl bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-700 leading-relaxed">
              <strong>Note :</strong> Le serveur du soir verra ce stock reçu comme son stock de départ. 
              Assurez-vous que les quantités correspondent au stock physique restant à la fin du shift matin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
