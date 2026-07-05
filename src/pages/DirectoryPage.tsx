import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import type { EmployeeDto } from '@/types/auth.types';
import { useAuthStore } from '@/store/authStore';
import { hasRole } from '@/utils/jwt';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface DepartmentDto {
  id: string;
  name: string;
}

interface PagedEmployeeResponse {
  items: EmployeeDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function DirectoryPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const isPrivileged = hasRole(accessToken, ['HR', 'Admin']);

  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [roles, setRoles] = useState<{id: number, name: string}[]>([]);
  const [createForm, setCreateForm] = useState({
    firstName: '', lastName: '', email: '', jobTitle: '', password: '', roleId: ''
  });
  const [createError, setCreateError] = useState('');
  const [createSuccessParital, setCreateSuccessPartial] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (isPrivileged) {
      apiClient.get<{id: number, name: string}[]>('/roles')
        .then(res => setRoles(res.data))
        .catch(err => console.error('Failed to load roles', err));
    }
  }, [isPrivileged]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccessPartial('');
    
    if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.jobTitle || !createForm.password || !createForm.roleId) {
      setCreateError('Toate câmpurile sunt obligatorii.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createForm.email)) {
      setCreateError('Format email invalid.');
      return;
    }

    setIsCreating(true);
    let newEmployeeId: number | null = null;
    
    try {
      // 1. Create employee
      const postRes = await apiClient.post<EmployeeDto>('/employees', {
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        email: createForm.email,
        jobTitle: createForm.jobTitle,
        password: createForm.password
      });
      
      newEmployeeId = postRes.data.id;
      
      // 2. Set role
      await apiClient.put(`/employees/${newEmployeeId}`, {
        roleId: Number(createForm.roleId)
      });
      
      // Full Success
      setIsCreateDialogOpen(false);
      setCreateForm({ firstName: '', lastName: '', email: '', jobTitle: '', password: '', roleId: '' });
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      if (!newEmployeeId) {
        // Failed at POST
        setCreateError(err.response?.data?.message || err.response?.data?.title || 'Eroare la crearea angajatului.');
      } else {
        // Failed at PUT
        setCreateSuccessPartial(`Angajatul ${createForm.firstName} ${createForm.lastName} a fost creat, dar setarea rolului a eșuat. Editează angajatul din listă pentru a seta rolul corect.`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await apiClient.get<DepartmentDto[]>('/departments');
        setDepartments(res.data);
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError('');
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
        });
        if (debouncedSearch) queryParams.append('search', debouncedSearch);
        if (selectedDept) queryParams.append('departmentId', selectedDept);

        const res = await apiClient.get<PagedEmployeeResponse>(`/employees?${queryParams.toString()}`);
        setEmployees(res.data.items);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        setError('Eroare la încărcarea directorului de angajați.');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [debouncedSearch, selectedDept, page, refreshTrigger]);

  const getWorkStatusBadge = (status?: number) => {
    switch (status) {
      case 0: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">La Birou</span>;
      case 1: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Remote</span>;
      case 2: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Concediu</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Necunoscut</span>;
    }
  };

  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return 'N/A';
    return departments.find(d => d.id === deptId)?.name || 'N/A';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Director Angajați</h1>
        {isPrivileged && (
          <button 
            onClick={() => {
              setCreateForm({ firstName: '', lastName: '', email: '', jobTitle: '', password: '', roleId: '' });
              setCreateError('');
              setCreateSuccessPartial('');
              setIsCreateDialogOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Adaugă Angajat
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Caută angajat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex h-10 w-full md:max-w-sm rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <select
          value={selectedDept}
          onChange={(e) => {
            setSelectedDept(e.target.value);
            setPage(1);
          }}
          className="flex h-10 w-full md:max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">Toate departamentele</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Nume Angajat</th>
                <th className="px-6 py-3 font-medium">Funcție</th>
                <th className="px-6 py-3 font-medium">Departament</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-slate-500">Se încarcă...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-slate-500">Nu am găsit angajați.</td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr 
                    key={emp.id} 
                    onClick={() => navigate(`/directory/${emp.id}`)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">{emp.firstName} {emp.lastName}</td>
                    <td className="px-6 py-4 text-slate-600">{emp.jobTitle || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{getDepartmentName(emp.departmentId)}</td>
                    <td className="px-6 py-4">{getWorkStatusBadge(emp.workStatus)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 rounded text-sm font-medium bg-white border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              Înapoi
            </button>
            <span className="text-sm text-slate-600">Pagina {page} din {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded text-sm font-medium bg-white border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              Înainte
            </button>
          </div>
        )}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Adaugă Angajat Nou</DialogTitle>
            <DialogDescription>
              Completează datele de mai jos.
            </DialogDescription>
          </DialogHeader>
          {createSuccessParital ? (
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-200">
              <p className="font-medium mb-1">Atenție</p>
              <p className="text-sm">{createSuccessParital}</p>
              <div className="mt-4 flex justify-end">
                <button onClick={() => {
                   setIsCreateDialogOpen(false); 
                   setCreateSuccessPartial('');
                   setRefreshTrigger(prev => prev + 1);
                }} className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm font-medium">Închide</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
              {createError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">{createError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Prenume</label>
                  <input 
                    required type="text"
                    value={createForm.firstName} onChange={e => setCreateForm(f => ({...f, firstName: e.target.value}))}
                    className="flex h-9 w-full rounded-md border border-slate-200 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nume</label>
                  <input 
                    required type="text"
                    value={createForm.lastName} onChange={e => setCreateForm(f => ({...f, lastName: e.target.value}))}
                    className="flex h-9 w-full rounded-md border border-slate-200 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input 
                  required type="email"
                  value={createForm.email} onChange={e => setCreateForm(f => ({...f, email: e.target.value}))}
                  className="flex h-9 w-full rounded-md border border-slate-200 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Funcție</label>
                <input 
                  required type="text"
                  value={createForm.jobTitle} onChange={e => setCreateForm(f => ({...f, jobTitle: e.target.value}))}
                  className="flex h-9 w-full rounded-md border border-slate-200 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Parolă temporară</label>
                <input 
                  required type="password"
                  value={createForm.password} onChange={e => setCreateForm(f => ({...f, password: e.target.value}))}
                  className="flex h-9 w-full rounded-md border border-slate-200 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-xs text-slate-500">Angajatul va fi rugat să schimbe parola la primul login.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Rol</label>
                <select 
                  required
                  value={createForm.roleId} onChange={e => setCreateForm(f => ({...f, roleId: e.target.value}))}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Selectează un rol</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end pt-4 space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                  disabled={isCreating}
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isCreating}
                >
                  {isCreating ? 'Se salvează...' : 'Creează Angajat'}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
