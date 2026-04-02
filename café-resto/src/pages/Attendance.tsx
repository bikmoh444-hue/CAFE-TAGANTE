import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Save, Check, X, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Employee, Attendance } from '../types';
import { cn } from '../lib/utils';

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Partial<Attendance>>>({});
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch active employees
      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('full_name');
      
      setEmployees(empData || []);

      // Fetch existing attendance for this date
      const { data: attData } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', date);

      const attMap: Record<string, Partial<Attendance>> = {};
      empData?.forEach(emp => {
        const existing = attData?.find(a => a.employee_id === emp.id);
        attMap[emp.id] = existing || {
          employee_id: emp.id,
          date: date,
          is_present: true,
          shift: 'toute la journée',
          remark: '',
        };
      });
      setAttendance(attMap);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePresence = (empId: string) => {
    setAttendance(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        is_present: !prev[empId].is_present
      }
    }));
  };

  const handleUpdateField = (empId: string, field: string, value: any) => {
    setAttendance(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const records = Object.keys(attendance).map(empId => {
        const att = attendance[empId];
        return {
          id: att.id,
          employee_id: att.employee_id,
          is_present: att.is_present,
          shift: att.shift,
          remark: att.remark,
          date: date,
        };
      });

      // Upsert records
      for (const record of records) {
        const r = record as any;
        const id = r.id;
        const data = {
          date: r.date,
          employee_id: r.employee_id,
          is_present: r.is_present,
          shift: r.shift,
          remark: r.remark
        };
        if (id) {
          await supabase.from('attendance').update(data).eq('id', id);
        } else {
          await supabase.from('attendance').insert([data]);
        }
      }

      setMessage({ type: 'success', text: 'Présence enregistrée avec succès !' });
      fetchData();
    } catch (err) {
      console.error('Error saving attendance:', err);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-amber-600" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          />
          <span className="text-sm font-medium text-gray-500">
            {format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr })}
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50"
        >
          <Save className="mr-2 h-5 w-5" />
          {saving ? 'Enregistrement...' : 'Enregistrer la présence'}
        </button>
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

      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employé</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Présent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarque</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Chargement...</td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Aucun employé actif trouvé.</td>
              </tr>
            ) : (
              employees.map((emp) => {
                const att = attendance[emp.id] || {};
                return (
                  <tr key={emp.id} className={cn("transition-colors", !att.is_present && "bg-gray-50")}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{emp.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-500 capitalize">{emp.role}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleTogglePresence(emp.id)}
                        className={cn(
                          "inline-flex items-center justify-center p-2 rounded-full transition-colors",
                          att.is_present ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}
                      >
                        {att.is_present ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        disabled={!att.is_present}
                        value={att.shift || 'toute la journée'}
                        onChange={(e) => handleUpdateField(emp.id, 'shift', e.target.value)}
                        className="block w-full text-sm border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50 disabled:bg-gray-100"
                      >
                        <option value="matin">Matin</option>
                        <option value="soir">Soir</option>
                        <option value="toute la journée">Toute la journée</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        placeholder="Note..."
                        value={att.remark || ''}
                        onChange={(e) => handleUpdateField(emp.id, 'remark', e.target.value)}
                        className="block w-full text-sm border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
