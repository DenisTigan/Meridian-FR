import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/api/client';
import type { EmployeeDto } from '@/types/auth.types';
import { hasRole } from '@/utils/jwt';
import { Button } from '@/components/ui/button';

interface DepartmentDto {
  id: string;
  name: string;
}

export default function ProfilePage() {
  const { accessToken } = useAuthStore();
  const [profile, setProfile] = useState<EmployeeDto | null>(null);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    phoneNumber: '',
    profilePictureUrl: '',
    firstName: '',
    lastName: '',
    jobTitle: '',
    hireDate: '',
    departmentId: '',
    teamId: '',
    managerId: '',
    roleId: ''
  });
  
  const [workStatus, setWorkStatus] = useState<string>('0');

  const hasPrivilege = hasRole(accessToken, ['Admin', 'HR']);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, deptRes] = await Promise.all([
          apiClient.get<EmployeeDto>('/employees/me'),
          apiClient.get<DepartmentDto[]>('/departments')
        ]);
        
        const data = profileRes.data;
        setProfile(data);
        setDepartments(deptRes.data);
        setWorkStatus(data.workStatus?.toString() ?? '0');
        
        setFormData({
          phoneNumber: data.phoneNumber || '',
          profilePictureUrl: data.profilePictureUrl || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          jobTitle: data.jobTitle || '',
          hireDate: data.hireDate ? data.hireDate.split('T')[0] : '',
          departmentId: data.departmentId || '',
          teamId: data.teamId || '',
          managerId: data.managerId || '',
          roleId: data.roleId || ''
        });
      } catch (err) {
        setError('Eroare la încărcarea datelor de profil.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setWorkStatus(value);
    if (profile) {
      try {
        await apiClient.patch(`/employees/${profile.id}/work-status`, {
          workStatus: parseInt(value, 10)
        });
        setSuccess('Status de lucru actualizat cu succes!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Eroare la actualizarea statusului.');
        setWorkStatus(profile.workStatus?.toString() ?? '0');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const payload: any = {
        phoneNumber: formData.phoneNumber,
        profilePictureUrl: formData.profilePictureUrl
      };
      
      if (hasPrivilege) {
        payload.firstName = formData.firstName;
        payload.lastName = formData.lastName;
        payload.jobTitle = formData.jobTitle;
        if (formData.hireDate) payload.hireDate = new Date(formData.hireDate).toISOString();
        if (formData.departmentId) payload.departmentId = formData.departmentId;
        if (formData.teamId) payload.teamId = formData.teamId;
        if (formData.managerId) payload.managerId = formData.managerId;
        if (formData.roleId) payload.roleId = formData.roleId;
      }
      
      const res = await apiClient.put(`/employees/${profile.id}`, payload);
      setProfile(res.data);
      setSuccess('Profil actualizat cu succes!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Eroare la salvarea modificărilor.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Se încarcă...</div>;
  if (!profile) return <div className="p-6 text-red-500">{error}</div>;

  const departmentName = departments.find(d => d.id === profile.departmentId)?.name || 'N/A';
  const inputClass = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-500";
  const labelClass = "block text-sm font-medium mb-1 text-slate-700";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Profilul Meu</h1>
        
        <div className="flex items-center gap-3">
          <label className={labelClass}>Status Lucru:</label>
          <select 
            value={workStatus} 
            onChange={handleStatusChange}
            className="flex h-10 w-[140px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="0">La Birou</option>
            <option value="1">Remote</option>
            <option value="2">Concediu</option>
          </select>
        </div>
      </div>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-100">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-3 rounded-md border border-green-100">{success}</div>}
      
      <div className="border border-slate-200 rounded-lg shadow-sm bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">Informații Angajat</h2>
          <p className="text-sm text-slate-500">Vizualizează și actualizează detaliile profilului tău.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className={labelClass}>Cod Angajat</label>
                <div className="text-sm p-2 bg-slate-50 rounded-md border border-slate-200 text-slate-700">
                  {profile.employeeCode || 'N/A'}
                </div>
              </div>
              
              <div className="space-y-1">
                <label className={labelClass}>Email</label>
                <div className="text-sm p-2 bg-slate-50 rounded-md border border-slate-200 text-slate-700">
                  {profile.email}
                </div>
              </div>

              {hasPrivilege ? (
                <>
                  <div className="space-y-1">
                    <label htmlFor="firstName" className={labelClass}>Prenume</label>
                    <input id="firstName" className={inputClass} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="lastName" className={labelClass}>Nume</label>
                    <input id="lastName" className={inputClass} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="jobTitle" className={labelClass}>Funcție</label>
                    <input id="jobTitle" className={inputClass} value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="departmentId" className={labelClass}>Departament (ID)</label>
                    <input id="departmentId" className={inputClass} value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className={labelClass}>Nume Complet</label>
                    <div className="text-sm p-2 bg-slate-50 rounded-md border border-slate-200 text-slate-700">
                      {profile.firstName} {profile.lastName}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Funcție</label>
                    <div className="text-sm p-2 bg-slate-50 rounded-md border border-slate-200 text-slate-700">
                      {profile.jobTitle || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Departament</label>
                    <div className="text-sm p-2 bg-slate-50 rounded-md border border-slate-200 text-slate-700">
                      {departmentName}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Data Angajării</label>
                    <div className="text-sm p-2 bg-slate-50 rounded-md border border-slate-200 text-slate-700">
                      {profile.hireDate ? new Date(profile.hireDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </>
              )}
              
              <div className="space-y-1">
                <label htmlFor="phoneNumber" className={labelClass}>Număr Telefon</label>
                <input id="phoneNumber" className={inputClass} value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <label htmlFor="profilePictureUrl" className={labelClass}>URL Poză Profil</label>
                <input id="profilePictureUrl" className={inputClass} value={formData.profilePictureUrl} onChange={e => setFormData({...formData, profilePictureUrl: e.target.value})} />
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Se salvează...' : 'Salvează Modificările'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
