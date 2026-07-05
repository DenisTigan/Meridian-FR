import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { WikiCategoryTreeDto } from '@/types/wiki.types';

export default function WikiCategoriesAdminPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    parentCategoryId: 0,
    orderIndex: 0
  });

  const { data: categoryTree, isLoading } = useQuery({
    queryKey: ['wiki-categories'],
    queryFn: async () => {
      const res = await apiClient.get<WikiCategoryTreeDto[]>('/wiki/categories');
      return res.data;
    }
  });

  const flattenTree = (nodes: WikiCategoryTreeDto[], depth = 0): {id: number, name: string, depth: number}[] => {
    let result: {id: number, name: string, depth: number}[] = [];
    for (const node of nodes) {
      result.push({ id: node.id, name: node.name, depth });
      if (node.children) {
        result = result.concat(flattenTree(node.children, depth + 1));
      }
    }
    return result;
  };
  const flatCategories = categoryTree ? flattenTree(categoryTree) : [];

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiClient.post('/wiki/categories', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-categories'] });
      setIsModalOpen(false);
      setFormData({ name: '', parentCategoryId: 0, orderIndex: 0 });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/wiki/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-categories'] });
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      orderIndex: formData.orderIndex,
      parentCategoryId: formData.parentCategoryId || undefined
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Ștergi categoria "${name}"? Toate sub-categoriile și articolele ar putea fi afectate.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Wiki Categories</h1>
          <p className="text-slate-600">Gestionează arborele de categorii Wiki</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
        >
          + Categorie Nouă
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {isLoading ? (
          <div className="text-slate-500 py-4 text-center">Se încarcă...</div>
        ) : flatCategories.length > 0 ? (
          <div className="space-y-1">
            {flatCategories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded group border border-transparent hover:border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-mono text-xs">{'\u00A0'.repeat(cat.depth * 8)}|--</span>
                  <span className="font-medium text-slate-800">{cat.name}</span>
                </div>
                <button 
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Șterge
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-500 py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Nicio categorie găsită.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Categorie Nouă</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nume Categorie</label>
                <input required type="text" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categorie Părinte</label>
                <select className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.parentCategoryId} onChange={e => setFormData({...formData, parentCategoryId: Number(e.target.value)})}>
                  <option value={0}>-- Niciuna (Rădăcină) --</option>
                  {flatCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {'\u00A0'.repeat(cat.depth * 4)}{cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ordine (Index)</label>
                <input required type="number" min="0" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.orderIndex} onChange={e => setFormData({...formData, orderIndex: Number(e.target.value)})} />
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm">
                  Anulează
                </button>
                <button type="submit" disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium text-sm disabled:opacity-50">
                  Salvează
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
