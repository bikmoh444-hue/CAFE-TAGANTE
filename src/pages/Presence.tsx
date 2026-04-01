import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ROLES, cn } from '../lib/utils';

export default function Presence() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [presence, setPresence] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch employees
      const { data: empData } = await supabase.from('employees').select('*').eq('active', true);
      setEmployees(empData || []);

      // Fetch today's presence
      const { data: presData } = await supabase.from('daily_presence').select('*').eq('date', date);
      setPresence(presData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePresence = (employee: any) => {
    const existing = presence.find(p => p.employee_id === employee.id);
    if (existing) {
      setPresence(presence.filter(p => p.employee_id !== employee.id));
    } else {
      setPresence([...presence, {
        employee_id: employee.id,
        name: employee.name,
        role: employee.role,
        date: date,
        shift: 'full',
        note: ''
      }]);
    }
  };

  const handleUpdatePresence = (employeeId: string, field: string, value: string) => {
    setPresence(presence.map(p => 
      p.employee_id === employeeId ? { ...p, [field]: value } : p
    ));
  };

  const savePresence = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Delete existing for this date
      await supabase.from('daily_presence').delete().eq('date', date);
      
      // Insert new
      if (presence.length > 0) {
        const { error } = await supabase.from('daily_presence').insert(
          presence.map(p => ({
            date: p.date,
            employee_id: p.employee_id,
            role: p.role,
            shift: p.shift,
            note: p.note
          }))
        );
        if (error) throw error;
      }
      
      setMessage({ type: 'success', text: 'Présence enregistrée avec succès !' });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Présence du Personnel</h3>
          <p className="text-sm text-slate-500">Gérez les employés présents pour chaque journée</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition"
          />
          <button 
            onClick={savePresence}
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
        {/* Employee List */}
        <div className="lg:col-span-1 space-y-4">
          <h4 className="font-bold text-slate-900 px-2">Liste des employés</h4>
          <div className="space-y-2">
            {employees.map((emp) => {
              const isPresent = presence.some(p => p.employee_id === emp.id);
              return (
                <button
                  key={emp.id}
                  onClick={() => handleTogglePresence(emp)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200",
                    isPresent 
                      ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200" 
                      : "bg-white border-slate-100 text-slate-600 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                      isPresent ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    )}>
                      {emp.name[0]}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{emp.name}</p>
                      <p className={cn("text-xs", isPresent ? "text-slate-300" : "text-slate-400")}>
                        {ROLES.find(r => r.id === emp.role)?.label}
                      </p>
                    </div>
                  </div>
                  {isPresent && <CheckCircle2 className="w-5 h-5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Presence Details */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="font-bold text-slate-900 px-2">Détails de présence ({presence.length})</h4>
          {presence.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
              <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Aucun employé sélectionné pour cette date</p>
              <p className="text-xs text-slate-300 mt-1">Cliquez sur un employé à gauche pour l'ajouter</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employé</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Shift</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Remarque</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {presence.map((p) => (
                    <tr key={p.employee_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500">{ROLES.find(r => r.id === p.role)?.label}</p>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={p.shift}
                          onChange={(e) => handleUpdatePresence(p.employee_id, 'shift', e.target.value)}
                          className="bg-slate-100 border-none rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-slate-900 outline-none"
                        >
                          <option value="morning">Matin</option>
                          <option value="evening">Soir</option>
                          <option value="full">Journée</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="text"
                          placeholder="Note..."
                          value={p.note}
                          onChange={(e) => handleUpdatePresence(p.employee_id, 'note', e.target.value)}
                          className="w-full bg-transparent border-b border-slate-100 focus:border-slate-900 outline-none py-1 text-sm text-slate-600 placeholder:text-slate-300 transition"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleTogglePresence({ id: p.employee_id })}
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
  );
}
