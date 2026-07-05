import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Link } from 'react-router-dom';
import type { TrainingCourseDto } from '@/types/training.types';
import { TrainingCategory } from '@/types/training.types';
import { hasRole } from '@/utils/jwt';

const CATEGORY_NAMES: Record<TrainingCategory, string> = {
  [TrainingCategory.Mandatory]: 'Obligatoriu',
  [TrainingCategory.Technical]: 'Tehnic',
  [TrainingCategory.Optional]: 'Opțional',
};

const CATEGORY_COLORS: Record<TrainingCategory, string> = {
  [TrainingCategory.Mandatory]: 'bg-red-100 text-red-800 border-red-200',
  [TrainingCategory.Technical]: 'bg-blue-100 text-blue-800 border-blue-200',
  [TrainingCategory.Optional]: 'bg-slate-100 text-slate-800 border-slate-200',
};

export default function TrainingPage() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');
  const isHrOrAdmin = hasRole(token, ['HR', 'Admin']);
  const isAdmin = hasRole(token, ['Admin']);

  const [filterCategory, setFilterCategory] = useState<number | ''>('');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: TrainingCategory.Optional as number,
    estimatedMinutes: 30,
    thumbnailUrl: '',
    isMandatoryForNewHires: false
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', filterCategory, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterCategory !== '') params.append('category', filterCategory.toString());
      if (search.trim()) params.append('search', search.trim());
      const res = await apiClient.get<TrainingCourseDto[]>(`/courses?${params.toString()}`);
      return res.data;
    }
  });

  const createCourseMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiClient.post('/courses', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsModalOpen(false);
      setFormData({
        title: '', description: '', category: TrainingCategory.Optional, 
        estimatedMinutes: 30, thumbnailUrl: '', isMandatoryForNewHires: false
      });
    }
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCourseMutation.mutate({
      ...formData,
      thumbnailUrl: formData.thumbnailUrl.trim() || undefined
    });
  };

  const handleDelete = (id: number, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Ești sigur că vrei să ștergi cursul "${title}"?`)) {
      deleteCourseMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Training Center</h1>
          <p className="text-slate-600">Cursuri și module de dezvoltare profesională</p>
        </div>
        {isHrOrAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
          >
            + Curs Nou
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <label className="text-xs font-semibold text-slate-500 uppercase">Caută curs</label>
            <input 
              type="text" 
              placeholder="Ex: Securitate..." 
              className="border border-slate-300 rounded-md px-3 py-1.5 text-sm md:w-64"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Filtru Categorie</label>
            <select 
              className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">Toate</option>
              {Object.entries(CATEGORY_NAMES).map(([val, name]) => (
                <option key={val} value={val}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-slate-500 py-4 text-center">Se încarcă cursurile...</div>
        ) : courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map(course => (
              <Link key={course.id} to={`/training/${course.id}`} className="group relative block bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <div className="h-40 bg-slate-100 relative">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                  {course.isMandatoryForNewHires && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      OBLIGATORIU NOU-ANGAJAȚI
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${CATEGORY_COLORS[course.category as TrainingCategory]}`}>
                      {CATEGORY_NAMES[course.category as TrainingCategory]}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">~{course.estimatedMinutes} min</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">
                    {course.description}
                  </p>
                  
                  {isAdmin && (
                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <button 
                        onClick={(e) => handleDelete(course.id, course.title, e)}
                        className="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
                      >
                        Șterge Curs
                      </button>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-slate-500 py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Niciun curs găsit.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Creare Curs Nou</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titlu curs</label>
                <input required type="text" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descriere</label>
                <textarea required rows={3} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categorie</label>
                  <select className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.category} onChange={e => setFormData({...formData, category: Number(e.target.value)})}>
                    {Object.entries(CATEGORY_NAMES).map(([val, name]) => (
                      <option key={val} value={val}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Durată est. (minute)</label>
                  <input required type="number" min="1" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.estimatedMinutes} onChange={e => setFormData({...formData, estimatedMinutes: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL Imagine (Thumbnail) - Opțional</label>
                <input type="url" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..."
                  value={formData.thumbnailUrl} onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})} />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="isMandatory" className="w-4 h-4 text-blue-600"
                  checked={formData.isMandatoryForNewHires} onChange={e => setFormData({...formData, isMandatoryForNewHires: e.target.checked})} />
                <label htmlFor="isMandatory" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Asignare obligatorie pentru noii angajați
                </label>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm">
                  Anulează
                </button>
                <button type="submit" disabled={createCourseMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium text-sm disabled:opacity-50">
                  {createCourseMutation.isPending ? 'Se creează...' : 'Creează Curs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
