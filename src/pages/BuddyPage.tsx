import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import type { BuddyAssignmentDto } from '@/types/buddy.types';
import { BuddyStatus } from '@/types/buddy.types';
import { useAuthStore } from '@/store/authStore';
import { hasRole } from '@/utils/jwt';
import { Button } from '@/components/ui/button';

export default function BuddyPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  
  const [assignment, setAssignment] = useState<BuddyAssignmentDto | null>(null);
  const [loading, setLoading] = useState(true);

  const canManageBuddies = hasRole(accessToken, ['Admin', 'HR']);

  useEffect(() => {
    const fetchMyBuddy = async () => {
      try {
        const res = await apiClient.get<BuddyAssignmentDto>('/buddy/my-assignment');
        // Backend returns either the object or empty/404 if not found.
        if (res.data) {
          setAssignment(res.data);
        }
      } catch (err: any) {
        // If 404, just means no buddy assigned, not an error we need to display as red text.
        if (err.response?.status !== 404) {
          console.error('Failed to load buddy assignment', err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMyBuddy();
  }, []);

  if (loading) return <div className="p-6">Se încarcă...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Buddy-ul Meu</h1>
        {canManageBuddies && (
          <Button onClick={() => navigate('/buddy/admin')}>
            Administrare Buddy (HR/Admin)
          </Button>
        )}
      </div>

      {!assignment ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Nu ai un buddy asignat momentan</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Sistemul de buddy te ajută să te integrezi mai ușor. Când HR-ul îți va asigna un buddy, informațiile lui vor apărea aici.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-800">Informații Buddy</h2>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              assignment.status === BuddyStatus.Active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {assignment.status === BuddyStatus.Active ? 'Activ' : 'Finalizat'}
            </span>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <span className="block text-sm font-medium text-slate-500 mb-1">Nume Buddy</span>
              <div className="text-lg font-medium text-slate-900">{assignment.buddyFullName}</div>
            </div>
            <div>
              <span className="block text-sm font-medium text-slate-500 mb-1">Data Asignării</span>
              <div className="text-slate-900">
                {new Date(assignment.assignedAt).toLocaleDateString()}
              </div>
            </div>
            {assignment.notes && (
              <div>
                <span className="block text-sm font-medium text-slate-500 mb-1">Notițe</span>
                <div className="text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-100">
                  {assignment.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
