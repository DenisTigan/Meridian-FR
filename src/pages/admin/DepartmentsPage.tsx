import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import type { EmployeeDto } from '@/types/auth.types';

export interface DepartmentDto {
  id: number;
  name: string;
  description?: string;
  headEmployeeId?: number;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    headEmployeeId: '' as number | ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, empRes] = await Promise.all([
        apiClient.get<DepartmentDto[]>('/departments'),
        apiClient.get('/employees?pageSize=1000') // Simplification for resolving names
      ]);
      setDepartments(deptRes.data);
      setEmployees(empRes.data.items || []);
    } catch (err) {
      setError('Eroare la încărcarea datelor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (dept?: DepartmentDto) => {
    if (dept) {
      setEditingId(dept.id);
      setFormData({
        name: dept.name,
        description: dept.description || '',
        headEmployeeId: dept.headEmployeeId || ''
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', headEmployeeId: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/departments/${editingId}`, formData);
      } else {
        await apiClient.post('/departments', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Eroare la salvare.');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Ești sigur că vrei să ștergi acest departament?')) {
      try {
        await apiClient.delete(`/departments/${id}`);
        fetchData();
      } catch (err) {
        alert('Eroare la ștergere.');
      }
    }
  };

  const getEmployeeName = (id?: number | '') => {
    if (!id) return '—';
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : '—';
  };

  const inputClass = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600";
  const labelClass = "block text-sm font-medium mb-1 text-slate-700";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Departamente</h1>
          <p className="text-slate-600">Administrare departamente</p>
        </div>
        <Button onClick={() => handleOpenModal()}>Adaugă Departament</Button>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
            <tr>
              <th className="px-6 py-3 font-medium">Nume</th>
              <th className="px-6 py-3 font-medium">Descriere</th>
              <th className="px-6 py-3 font-medium">Head of Department</th>
              <th className="px-6 py-3 font-medium text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center">Se încarcă...</td></tr>
            ) : departments.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-slate-500">Nu există departamente.</td></tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-900">{dept.name}</td>
                  <td className="px-6 py-4 text-slate-600">{dept.description || '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{getEmployeeName(dept.headEmployeeId)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(dept)}>Editează</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(dept.id)}>Șterge</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{editingId ? 'Editează Departament' : 'Adaugă Departament'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>Nume</label>
                  <input required className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Descriere</label>
                  <input className={inputClass} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Head of Department (ID)</label>
                  <select 
                    className={inputClass} 
                    value={formData.headEmployeeId} 
                    onChange={e => setFormData({...formData, headEmployeeId: e.target.value ? parseInt(e.target.value) : ''})}
                  >
                    <option value="">Fără manager</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Anulează</Button>
                <Button type="submit">Salvează</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
