import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import type { BuddyAssignmentDto, AssignBuddyRequest, UpdateBuddyAssignmentRequest } from '@/types/buddy.types';
import { BuddyStatus } from '@/types/buddy.types';
import type { EmployeeDto } from '@/types/auth.types';
import { useAuthStore } from '@/store/authStore';
import { hasRole } from '@/utils/jwt';
import { Button } from '@/components/ui/button';

interface PagedEmployeeResponse {
  items: EmployeeDto[];
}

export default function BuddyAdminPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  
  const [assignments, setAssignments] = useState<BuddyAssignmentDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState<AssignBuddyRequest>({
    newEmployeeId: 0,
    buddyId: 0,
    notes: ''
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<UpdateBuddyAssignmentRequest>({
    buddyId: 0,
    notes: ''
  });

  const isHR = hasRole(accessToken, ['HR']);

  const fetchAssignments = async () => {
    try {
      const res = await apiClient.get<BuddyAssignmentDto[]>('/buddy/assignments');
      setAssignments(res.data);
    } catch (err) {
      setError('Eroare la încărcarea asignărilor.');
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get<PagedEmployeeResponse>('/employees?pageSize=1000');
      setEmployees(res.data.items);
    } catch (err) {
      console.error('Failed to fetch employees for dropdowns', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchAssignments(), fetchEmployees()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiClient.post('/buddy/assignments', assignForm);
      setSuccess('Buddy asignat cu succes!');
      setShowAssignModal(false);
      setAssignForm({ newEmployeeId: 0, buddyId: 0, notes: '' });
      fetchAssignments();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('Acest angajat are deja un buddy activ asignat.');
      } else {
        setError('Eroare la asignarea buddy-ului.');
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setError('');
    setSuccess('');
    try {
      await apiClient.put(`/buddy/assignments/${editingId}`, editForm);
      setSuccess('Asignare actualizată cu succes!');
      setShowEditModal(false);
      setEditingId(null);
      fetchAssignments();
    } catch (err) {
      setError('Eroare la actualizarea asignării.');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await apiClient.patch(`/buddy/assignments/${id}/complete`);
      setSuccess('Asignare marcată ca finalizată.');
      fetchAssignments();
    } catch (err) {
      setError('Eroare la finalizarea asignării.');
    }
  };

  if (loading) return <div className="p-6">Se încarcă...</div>;

  const inputClass = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600";
  const labelClass = "block text-sm font-medium mb-1 text-slate-700";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/buddy')}>Înapoi</Button>
          <h1 className="text-3xl font-bold text-slate-900">Administrare Buddy</h1>
        </div>
        <Button onClick={() => setShowAssignModal(true)}>Asignează Buddy Nou</Button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-100">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-3 rounded-md border border-green-100">{success}</div>}

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium">Angajat Nou</th>
              <th className="px-6 py-3 font-medium">Buddy Asignat</th>
              <th className="px-6 py-3 font-medium">Data</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-slate-500">Nu există asignări.</td>
              </tr>
            ) : (
              assignments.map(a => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{a.newEmployeeFullName}</td>
                  <td className="px-6 py-4 text-slate-700">{a.buddyFullName}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(a.assignedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      a.status === BuddyStatus.Active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {a.status === BuddyStatus.Active ? 'Activ' : 'Finalizat'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {a.status === BuddyStatus.Active && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleComplete(a.id)}>
                          Finalizează
                        </Button>
                        {isHR && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setEditingId(a.id);
                              setEditForm({ buddyId: a.buddyId, notes: a.notes || '' });
                              setShowEditModal(true);
                            }}
                          >
                            Editează
                          </Button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Modal (Simple rendering) */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold">Asignează Buddy Nou</h3>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Angajat Nou</label>
                <select 
                  required
                  className={inputClass}
                  value={assignForm.newEmployeeId || ''}
                  onChange={e => setAssignForm({...assignForm, newEmployeeId: Number(e.target.value)})}
                >
                  <option value="" disabled>Selectează angajat</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Buddy</label>
                <select 
                  required
                  className={inputClass}
                  value={assignForm.buddyId || ''}
                  onChange={e => setAssignForm({...assignForm, buddyId: Number(e.target.value)})}
                >
                  <option value="" disabled>Selectează buddy</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Notițe (Opțional)</label>
                <textarea 
                  className={`${inputClass} min-h-[80px] py-2`}
                  value={assignForm.notes || ''}
                  onChange={e => setAssignForm({...assignForm, notes: e.target.value})}
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAssignModal(false)}>Anulează</Button>
                <Button type="submit">Asignează</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold">Editează Asignare</h3>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Buddy Nou (Opțional)</label>
                <select 
                  className={inputClass}
                  value={editForm.buddyId || ''}
                  onChange={e => setEditForm({...editForm, buddyId: Number(e.target.value)})}
                >
                  <option value="">Nu schimba</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Notițe</label>
                <textarea 
                  className={`${inputClass} min-h-[80px] py-2`}
                  value={editForm.notes || ''}
                  onChange={e => setEditForm({...editForm, notes: e.target.value})}
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Anulează</Button>
                <Button type="submit">Salvează</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
