import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import type { OnboardingChecklistDto, OnboardingTaskDto } from '@/types/onboarding.types';
import { OnboardingPhase } from '@/types/onboarding.types';
import { useAuthStore } from '@/store/authStore';
import { hasRole } from '@/utils/jwt';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  const { employeeId } = useParams<{ employeeId?: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  
  const [checklist, setChecklist] = useState<OnboardingChecklistDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isReadOnly = !!employeeId;

  useEffect(() => {
    if (isReadOnly && !hasRole(accessToken, ['Admin', 'HR', 'Manager'])) {
      setError('Nu ai permisiunea de a vizualiza acest onboarding.');
      setLoading(false);
      return;
    }

    const fetchChecklist = async () => {
      try {
        const endpoint = isReadOnly 
          ? `/onboarding/checklist/${employeeId}` 
          : '/onboarding/checklist';
        const res = await apiClient.get<OnboardingChecklistDto>(endpoint);
        setChecklist(res.data);
      } catch (err) {
        setError('Eroare la încărcarea checklist-ului de onboarding.');
      } finally {
        setLoading(false);
      }
    };
    fetchChecklist();
  }, [employeeId, isReadOnly, accessToken]);

  const handleCompleteTask = async (taskId: number) => {
    if (isReadOnly) return; // Prevent completion if read-only
    try {
      await apiClient.patch<OnboardingTaskDto>(`/onboarding/tasks/${taskId}/complete`);
      // Update task in local state
      if (checklist) {

        // We might want to refresh the overall progress by fetching again, or manually recalculating.
        // It's safer to re-fetch the checklist to get the updated overallProgress from backend.
        const checklistRes = await apiClient.get<OnboardingChecklistDto>('/onboarding/checklist');
        setChecklist(checklistRes.data);
      }
    } catch (err) {
      console.error('Failed to complete task', err);
      alert('A apărut o eroare la marcarea task-ului. Încearcă din nou.');
    }
  };

  if (loading) return <div className="p-6">Se încarcă...</div>;
  if (error || !checklist) return <div className="p-6 text-red-500">{error || 'Nu s-a putut încărca onboarding-ul.'}</div>;

  const groupedTasks = {
    [OnboardingPhase.DayOne]: checklist.tasks.filter(t => t.phase === OnboardingPhase.DayOne).sort((a, b) => a.orderIndex - b.orderIndex),
    [OnboardingPhase.WeekOne]: checklist.tasks.filter(t => t.phase === OnboardingPhase.WeekOne).sort((a, b) => a.orderIndex - b.orderIndex),
    [OnboardingPhase.FirstMonth]: checklist.tasks.filter(t => t.phase === OnboardingPhase.FirstMonth).sort((a, b) => a.orderIndex - b.orderIndex),
  };

  const getPhaseName = (phase: OnboardingPhase) => {
    switch (phase) {
      case OnboardingPhase.DayOne: return 'Ziua 1';
      case OnboardingPhase.WeekOne: return 'Săptămâna 1';
      case OnboardingPhase.FirstMonth: return 'Prima Lună';
      default: return 'Alte Task-uri';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">
          {isReadOnly ? 'Onboarding Angajat' : 'Onboarding-ul Meu'}
        </h1>
        {isReadOnly && (
          <Button variant="outline" onClick={() => navigate(`/directory/${employeeId}`)}>
            Înapoi la Profil
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Progres General</span>
          <span className="text-sm font-bold text-blue-600">{checklist.overallProgress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${checklist.overallProgress}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-6">
        {[OnboardingPhase.DayOne, OnboardingPhase.WeekOne, OnboardingPhase.FirstMonth].map((phase) => {
          const tasks = groupedTasks[phase];
          if (!tasks || tasks.length === 0) return null;

          return (
            <div key={phase} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">{getPhaseName(phase)}</h2>
              </div>
              <ul className="divide-y divide-slate-100">
                {tasks.map(task => {
                  const isAuto = !!task.autoTriggerType;
                  const isInteractive = !isReadOnly && !isAuto && !task.isCompleted;

                  return (
                    <li key={task.id} className={`p-6 flex items-start gap-4 transition-colors ${task.isCompleted ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                      <div className="pt-0.5">
                        <input 
                          type="checkbox" 
                          checked={task.isCompleted}
                          disabled={!isInteractive}
                          onChange={() => handleCompleteTask(task.id)}
                          className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium ${task.isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {task.title}
                          </h3>
                          {isAuto && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Automat
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${task.isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
                          {task.description}
                        </p>
                        {task.isCompleted && task.completedAt && (
                          <p className="text-xs text-slate-400 mt-2">
                            Finalizat la: {new Date(task.completedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
