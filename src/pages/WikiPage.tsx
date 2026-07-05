import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import type { WikiCategoryTreeDto, WikiArticleDto } from '@/types/wiki.types';
import { hasRole } from '@/utils/jwt';

// Helper component for recursive tree rendering
const CategoryNode = ({ 
  node, 
  onSelect, 
  selectedId 
}: { 
  node: WikiCategoryTreeDto; 
  onSelect: (id: number, name: string) => void;
  selectedId: number | null;
}) => {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="ml-4 first:ml-0 mt-1">
      <div className={`flex items-center gap-1 p-1.5 rounded-md ${isSelected ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100'}`}>
        {hasChildren ? (
          <button 
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            {expanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className="w-5 inline-block"></span>
        )}
        <button 
          className={`text-sm flex-1 text-left ${isSelected ? 'font-bold' : 'font-medium text-slate-700'}`}
          onClick={() => onSelect(node.id, node.name)}
        >
          {node.name}
        </button>
      </div>
      {expanded && hasChildren && (
        <div className="border-l border-slate-200 ml-2.5 mt-1">
          {node.children.map(child => (
            <CategoryNode key={child.id} node={child} onSelect={onSelect} selectedId={selectedId} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function WikiPage() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');
  const canCreate = hasRole(token, ['Manager', 'HR', 'Admin']);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: 0,
    isPublished: true
  });

  const { data: categoryTree, isLoading: loadingTree } = useQuery({
    queryKey: ['wiki-categories'],
    queryFn: async () => {
      const res = await apiClient.get<WikiCategoryTreeDto[]>('/wiki/categories');
      return res.data;
    }
  });

  // Flat list for dropdown
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

  const { data: articles, isLoading: loadingArticles } = useQuery({
    queryKey: ['wiki-articles', selectedCategoryId, appliedSearch],
    queryFn: async () => {
      if (appliedSearch) {
        const res = await apiClient.get<WikiArticleDto[]>(`/wiki/search?q=${encodeURIComponent(appliedSearch)}&skip=0&take=50`);
        return res.data;
      }
      if (selectedCategoryId) {
        const res = await apiClient.get<WikiArticleDto[]>(`/wiki/articles?categoryId=${selectedCategoryId}&skip=0&take=50`);
        return res.data;
      }
      return [];
    },
    enabled: !!selectedCategoryId || !!appliedSearch
  });

  const createArticleMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiClient.post('/wiki/articles', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-articles'] });
      setIsModalOpen(false);
      setFormData({ title: '', content: '', categoryId: flatCategories[0]?.id || 0, isPublished: true });
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedCategoryId(null);
    setSelectedCategoryName('');
    setAppliedSearch(searchQuery);
  };

  const handleSelectCategory = (id: number, name: string) => {
    setSearchQuery('');
    setAppliedSearch('');
    setSelectedCategoryId(id);
    setSelectedCategoryName(name);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 flex flex-col md:flex-row gap-6">
      {/* Sidebar - Category Tree */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Categorii Wiki</h2>
          {loadingTree ? (
            <div className="text-sm text-slate-500">Se încarcă...</div>
          ) : categoryTree && categoryTree.length > 0 ? (
            <div className="-ml-4">
              {categoryTree.map(node => (
                <CategoryNode 
                  key={node.id} 
                  node={node} 
                  onSelect={handleSelectCategory} 
                  selectedId={selectedCategoryId} 
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">Nu există categorii.</div>
          )}
        </div>
      </div>

      {/* Main content - Search & Article List */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Knowledge Base</h1>
            <p className="text-slate-600">Documentație internă și proceduri</p>
          </div>
          {canCreate && (
            <button 
              onClick={() => {
                setFormData(prev => ({ ...prev, categoryId: selectedCategoryId || (flatCategories[0]?.id || 0) }));
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
            >
              + Articol Nou
            </button>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Caută în tot wiki-ul..." 
            className="flex-1 border border-slate-300 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors">
            Caută
          </button>
        </form>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[400px]">
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
            {appliedSearch ? `Rezultate căutare pentru: "${appliedSearch}"` : 
             selectedCategoryId ? `Articole în categoria: ${selectedCategoryName}` : 
             'Selectează o categorie sau caută pentru a vedea articolele.'}
          </h2>

          {loadingArticles ? (
            <div className="text-center py-8 text-slate-500">Se încarcă articolele...</div>
          ) : (selectedCategoryId || appliedSearch) ? (
            articles && articles.length > 0 ? (
              <div className="space-y-3">
                {articles.map(article => (
                  <Link 
                    key={article.id} 
                    to={`/wiki/${article.categoryName ? article.categoryName.toLowerCase().replace(/\s+/g, '-') : 'cat'}/${article.slug}`}
                    className="block p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-700 text-lg transition-colors">
                        {article.title}
                      </h3>
                      {!article.isPublished && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">Draft</span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>Cat: <span className="font-medium text-slate-700">{article.categoryName}</span></span>
                      <span>Autor: <span className="font-medium text-slate-700">{article.authorName}</span></span>
                      <span>👁 {article.viewCount} vizualizări</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                Nu am găsit articole care să corespundă criteriilor.
              </div>
            )
          ) : null}
        </div>
      </div>

      {/* Modal Creare */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Articol Wiki Nou</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createArticleMutation.mutate(formData); }} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titlu articol</label>
                <input required type="text" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categorie</label>
                <select className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: Number(e.target.value)})}>
                  {flatCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {'\u00A0'.repeat(cat.depth * 4)}{cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 flex flex-col min-h-[300px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">Conținut (Markdown suportat nativ)</label>
                <textarea required className="w-full flex-1 border border-slate-300 rounded p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none whitespace-pre-wrap" 
                  value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isPublished" className="w-4 h-4 text-blue-600"
                  checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} />
                <label htmlFor="isPublished" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Publică imediat (Draft dacă nu e bifat)
                </label>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm">
                  Anulează
                </button>
                <button type="submit" disabled={createArticleMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium text-sm disabled:opacity-50">
                  {createArticleMutation.isPending ? 'Se salvează...' : 'Salvează Articol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
