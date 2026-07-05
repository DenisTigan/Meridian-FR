import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { WikiArticleDto, WikiCategoryTreeDto } from '@/types/wiki.types';
import { hasRole, getCurrentUserId } from '@/utils/jwt';

export default function WikiArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');
  const currentUserId = getCurrentUserId(token);
  const isAdmin = hasRole(token, ['Admin']);
  const isHrOrAdmin = hasRole(token, ['HR', 'Admin']);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    categoryId: 0,
    isPublished: true
  });

  const { data: article, isLoading } = useQuery({
    queryKey: ['wiki-article', slug],
    queryFn: async () => {
      const res = await apiClient.get<WikiArticleDto>(`/wiki/articles/${slug}`);
      return res.data;
    },
    enabled: !!slug
  });

  const { data: categoryTree } = useQuery({
    queryKey: ['wiki-categories'],
    queryFn: async () => {
      const res = await apiClient.get<WikiCategoryTreeDto[]>('/wiki/categories');
      return res.data;
    },
    enabled: isEditMode // only load categories if editing
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

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.put<WikiArticleDto>(`/wiki/articles/${slug}`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wiki-article', slug] });
      setIsEditMode(false);
      // If slug changed, navigate to new URL
      if (data.slug !== slug) {
        navigate(`/wiki/${data.categoryName.toLowerCase().replace(/\s+/g, '-')}/${data.slug}`, { replace: true });
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/wiki/articles/${slug}`);
    },
    onSuccess: () => {
      navigate('/wiki');
    }
  });

  const handleEditInit = () => {
    if (article) {
      setEditForm({
        title: article.title,
        content: article.content,
        categoryId: article.categoryId,
        isPublished: article.isPublished
      });
      setIsEditMode(true);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(editForm);
  };

  const handleDelete = () => {
    if (window.confirm('Ești sigur că vrei să ștergi definitiv acest articol?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Se încarcă articolul...</div>;
  if (!article) return <div className="p-8 text-center text-red-500">Articolul nu a fost găsit.</div>;

  const canEdit = currentUserId === article.authorId || isHrOrAdmin;
  const canDelete = isAdmin; // Delete Admin strict

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link to="/wiki" className="text-sm font-medium text-blue-600 hover:underline mb-2 inline-block">
        &larr; Înapoi la Wiki
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isEditMode ? (
          <form onSubmit={handleUpdate} className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-xl font-bold text-slate-800">Editare Articol</h2>
              <button type="button" onClick={() => setIsEditMode(false)} className="text-sm text-slate-500 hover:text-slate-800">Anulează</button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Titlu</label>
              <input required type="text" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categorie</label>
              <select className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                value={editForm.categoryId} onChange={e => setEditForm({...editForm, categoryId: Number(e.target.value)})}>
                {flatCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {'\u00A0'.repeat(cat.depth * 4)}{cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-h-[400px] flex flex-col">
              <label className="block text-sm font-medium text-slate-700 mb-1">Conținut (Markdown)</label>
              <textarea required className="w-full flex-1 border border-slate-300 rounded p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none whitespace-pre-wrap min-h-[400px]" 
                value={editForm.content} onChange={e => setEditForm({...editForm, content: e.target.value})} />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="isPublished" className="w-4 h-4 text-blue-600"
                checked={editForm.isPublished} onChange={e => setEditForm({...editForm, isPublished: e.target.checked})} />
              <label htmlFor="isPublished" className="text-sm font-medium text-slate-700 cursor-pointer">
                Publicat
              </label>
            </div>
            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium text-sm disabled:opacity-50">
                {updateMutation.isPending ? 'Se salvează...' : 'Salvează Modificări'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50 relative">
              {!article.isPublished && (
                <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full uppercase border border-yellow-200">
                  Draft Necorespunzător
                </div>
              )}
              <h1 className="text-3xl font-bold text-slate-900 mb-4 pr-24">{article.title}</h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                <span className="flex items-center gap-1">📁 <span className="font-medium text-slate-800">{article.categoryName}</span></span>
                <span className="flex items-center gap-1">👤 <span className="font-medium text-slate-800">{article.authorName}</span></span>
                <span className="flex items-center gap-1">🕒 Actualizat {new Date(article.updatedAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1">👁 {article.viewCount} vizualizări</span>
              </div>
            </div>
            
            <div className="p-6 md:p-8">
              <div className="prose prose-slate max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800">
                {article.content}
              </div>
            </div>

            {(canEdit || canDelete) && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                {canDelete && (
                  <button onClick={handleDelete} className="text-red-600 hover:bg-red-50 px-4 py-2 rounded text-sm font-medium transition-colors">
                    Șterge Articol
                  </button>
                )}
                {canEdit && (
                  <button onClick={handleEditInit} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-2 rounded text-sm font-medium transition-colors shadow-sm border border-slate-300">
                    Editează Articol
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
