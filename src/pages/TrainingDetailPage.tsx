import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { TrainingCourseDto, CourseEnrollmentDto } from '@/types/training.types';
import { TrainingModuleType } from '@/types/training.types';
import { hasRole } from '@/utils/jwt';

export default function TrainingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');
  const isHrOrAdmin = hasRole(token, ['HR', 'Admin']);

  const [expandedModuleId, setExpandedModuleId] = useState<number | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    moduleType: TrainingModuleType.Article as number,
    orderIndex: 1,
    durationMinutes: 10
  });

  const [progressInput, setProgressInput] = useState<number>(0);

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const res = await apiClient.get<TrainingCourseDto>(`/courses/${id}`);
      return res.data;
    },
    enabled: !!id
  });

  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async () => {
      const res = await apiClient.get<CourseEnrollmentDto[]>('/enrollments/me');
      return res.data;
    }
  });

  const myEnrollment = enrollments?.find(e => e.courseId === Number(id));

  // Initialize progress input when enrollment is loaded
  React.useEffect(() => {
    if (myEnrollment) {
      setProgressInput(myEnrollment.progressPercent);
    }
  }, [myEnrollment]);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/enrollments', { courseId: Number(id) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
    }
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (progressPercent: number) => {
      await apiClient.patch(`/enrollments/${myEnrollment?.id}/progress`, { progressPercent });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
    }
  });

  const createModuleMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiClient.post(`/courses/${id}/modules`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      setIsModalOpen(false);
      setFormData({ title: '', content: '', moduleType: TrainingModuleType.Article, orderIndex: (course?.modules?.length || 0) + 1, durationMinutes: 10 });
    }
  });

  const [certificateData, setCertificateData] = useState<{ message?: string } | null>(null);
  const fetchCertificate = async () => {
    try {
      const res = await apiClient.get(`/enrollments/${myEnrollment?.id}/certificate`);
      setCertificateData(res.data);
    } catch (e) {
      setCertificateData({ message: 'Eroare la obținerea certificatului.' });
    }
  };

  if (loadingCourse || loadingEnrollments) {
    return <div className="p-8 text-center text-slate-500">Se încarcă...</div>;
  }

  if (!course) {
    return <div className="p-8 text-center text-red-500">Cursul nu a fost găsit.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link to="/training" className="text-sm font-medium text-blue-600 hover:underline mb-2 inline-block">
        &larr; Înapoi la cursuri
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {course.thumbnailUrl && (
          <div className="h-48 w-full bg-slate-100">
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">{course.title}</h1>
          <p className="text-slate-700 whitespace-pre-wrap mb-6">{course.description}</p>
          <div className="flex gap-4 text-sm text-slate-500 font-medium">
            <span>Durată estimată: {course.estimatedMinutes} min</span>
            <span>Module: {course.modules?.length || 0}</span>
          </div>
        </div>
        
        <div className="bg-slate-50 p-6 border-t border-slate-200">
          {!myEnrollment ? (
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">Nu ești înscris la acest curs.</span>
              <button 
                onClick={() => enrollMutation.mutate()}
                disabled={enrollMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-bold transition-colors"
              >
                {enrollMutation.isPending ? 'Se înscrie...' : 'Înscrie-te la curs'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-1">
                <h3 className="font-bold text-slate-900">Progresul tău</h3>
                <span className="text-sm font-bold text-blue-600">{myEnrollment.progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${myEnrollment.progressPercent}%` }}></div>
              </div>
              
              {!myEnrollment.isCompleted ? (
                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="range" min="0" max="100" 
                    value={progressInput} 
                    onChange={e => setProgressInput(Number(e.target.value))}
                    className="flex-1 cursor-pointer"
                  />
                  <span className="w-12 text-sm text-slate-600 font-medium">{progressInput}%</span>
                  <button 
                    onClick={() => updateProgressMutation.mutate(progressInput)}
                    disabled={updateProgressMutation.isPending || progressInput === myEnrollment.progressPercent}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50"
                  >
                    Actualizează manual
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-md flex items-center justify-between">
                    <span className="font-semibold">Felicitări! Ai finalizat acest curs.</span>
                    {!certificateData && (
                      <button 
                        onClick={fetchCertificate}
                        className="text-emerald-700 hover:text-emerald-900 text-sm font-bold underline"
                      >
                        Vezi certificat
                      </button>
                    )}
                  </div>
                  {certificateData && (
                    <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md text-sm">
                      {certificateData.message || 'Certificatul tău este generat (MVP Placeholder).'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Modulele Cursului</h2>
          {isHrOrAdmin && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-sm font-medium border border-slate-300"
            >
              + Adaugă Modul
            </button>
          )}
        </div>

        {course.modules && course.modules.length > 0 ? (
          <div className="space-y-3">
            {[...course.modules].sort((a, b) => a.orderIndex - b.orderIndex).map((mod, idx) => {
              const isExpanded = expandedModuleId === mod.id;
              return (
                <div key={mod.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-slate-800">{mod.title}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-slate-300 text-slate-500 bg-white">
                        {mod.moduleType === TrainingModuleType.Video ? 'Video' : mod.moduleType === TrainingModuleType.Quiz ? 'Quiz' : 'Articol'}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 font-medium">
                      {mod.durationMinutes} min
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="p-4 bg-white border-t border-slate-200">
                      {mod.moduleType === TrainingModuleType.Video ? (
                        <div className="aspect-video w-full max-w-2xl bg-slate-900 rounded overflow-hidden">
                          <iframe 
                            src={mod.content} 
                            title={mod.title}
                            className="w-full h-full border-0"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className="prose prose-slate max-w-none whitespace-pre-wrap text-sm text-slate-700">
                          {mod.content}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-4">Nu există module pentru acest curs.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Adaugă Modul Nou</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createModuleMutation.mutate(formData); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titlu modul</label>
                <input required type="text" className="w-full border border-slate-300 rounded p-2 text-sm" 
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tip Modul</label>
                  <select className="w-full border border-slate-300 rounded p-2 text-sm" 
                    value={formData.moduleType} onChange={e => setFormData({...formData, moduleType: Number(e.target.value)})}>
                    <option value={TrainingModuleType.Article}>Articol (Text)</option>
                    <option value={TrainingModuleType.Video}>Video (Embed URL)</option>
                    <option value={TrainingModuleType.Quiz}>Quiz (Text simplu)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Durată (min)</label>
                  <input required type="number" min="1" className="w-full border border-slate-300 rounded p-2 text-sm" 
                    value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ordine (Index)</label>
                <input required type="number" min="1" className="w-full border border-slate-300 rounded p-2 text-sm" 
                  value={formData.orderIndex} onChange={e => setFormData({...formData, orderIndex: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {formData.moduleType === TrainingModuleType.Video ? 'URL Video (ex: embed link YouTube)' : 'Conținut'}
                </label>
                {formData.moduleType === TrainingModuleType.Video ? (
                  <input required type="url" className="w-full border border-slate-300 rounded p-2 text-sm" 
                    value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                ) : (
                  <textarea required rows={5} className="w-full border border-slate-300 rounded p-2 text-sm whitespace-pre-wrap" 
                    value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                )}
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm">
                  Anulează
                </button>
                <button type="submit" disabled={createModuleMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium text-sm disabled:opacity-50">
                  Salvează Modul
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
