import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import type { EmployeeDto } from '@/types/auth.types';
import { useAuthStore } from '@/store/authStore';
import { hasRole } from '@/utils/jwt';
import { Button } from '@/components/ui/button';

interface DepartmentDto {
  id: string;
  name: string;
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  
  const [employee, setEmployee] = useState<EmployeeDto | null>(null);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canViewOnboarding = hasRole(accessToken, ['Admin', 'HR', 'Manager']);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, deptRes] = await Promise.all([
          apiClient.get<EmployeeDto>(`/employees/${id}`),
          apiClient.get<DepartmentDto[]>('/departments')
        ]);
        setEmployee(empRes.data);
        setDepartments(deptRes.data);
      } catch (err) {
        setError('Eroare la încărcarea datelor angajatului.');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchData();
    }
  }, [id]);

  const getWorkStatusBadge = (status?: number) => {
    switch (status) {
      case 0: return <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">La Birou</span>;
      case 1: return <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">Remote</span>;
      case 2: return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Concediu</span>;
      default: return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">Necunoscut</span>;
    }
  };

  if (loading) return <div className="p-6">Se încarcă...</div>;
  if (error || !employee) return <div className="p-6 text-red-500">{error || 'Angajat negăsit.'}</div>;

  const departmentName = departments.find(d => d.id === employee.departmentId)?.name || 'N/A';
  const labelClass = "block text-sm font-medium mb-1 text-slate-500";
  const valueClass = "text-base font-medium text-slate-900";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">
          Detalii Angajat: {employee.firstName} {employee.lastName}
        </h1>
        {canViewOnboarding && (
          <Button onClick={() => navigate(`/directory/${employee.id}/onboarding`)}>
            Vezi Onboarding
          </Button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">Informații Generale</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className={labelClass}>Nume Complet</span>
            <div className={valueClass}>{employee.firstName} {employee.lastName}</div>
          </div>
          <div>
            <span className={labelClass}>Cod Angajat</span>
            <div className={valueClass}>{employee.employeeCode || 'N/A'}</div>
          </div>
          <div>
            <span className={labelClass}>Email</span>
            <div className={valueClass}>{employee.email}</div>
          </div>
          <div>
            <span className={labelClass}>Telefon</span>
            <div className={valueClass}>{employee.phoneNumber || 'N/A'}</div>
          </div>
          <div>
            <span className={labelClass}>Funcție</span>
            <div className={valueClass}>{employee.jobTitle || 'N/A'}</div>
          </div>
          <div>
            <span className={labelClass}>Departament</span>
            <div className={valueClass}>{departmentName}</div>
          </div>
          <div>
            <span className={labelClass}>Data Angajării</span>
            <div className={valueClass}>{employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}</div>
          </div>
          <div>
            <span className={labelClass}>Status Lucru</span>
            <div className="mt-1">{getWorkStatusBadge(employee.workStatus)}</div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate('/directory')}>Înapoi la Director</Button>
      </div>
    </div>
  );
}
