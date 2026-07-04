import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { hasRole, getCurrentUserId } from '@/utils/jwt';

interface AnnouncementDto {
  id: number;
  title: string;
  content: string;
  category: number;
  authorId: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [category, setCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 0,
    isPublished: true
  });
  
  const { accessToken } = useAuthStore();
  
  const hasPrivilege = hasRole(accessToken, ['Admin', 'HR']);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      let url = `/announcements?page=${page}&pageSize=${pageSize}`;
      if (category) url += `&category=${category}`;
      const res = await apiClient.get(url);
      setAnnouncements(res.data.items || []);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [page, category]);

  const handleOpenModal = (ann?: AnnouncementDto) => {
    if (ann) {
      setEditingId(ann.id);
      setFormData({
        title: ann.title,
        content: ann.content,
        category: ann.category,
        isPublished: ann.isPublished
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', content: '', category: 0, isPublished: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/announcements/${editingId}`, formData);
      } else {
        await apiClient.post('/announcements', formData);
      }
      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      alert('Eroare la salvare.');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Ești sigur că vrei să ștergi acest anunț?')) {
      try {
        await apiClient.delete(`/announcements/${id}`);
        fetchAnnouncements();
      } catch (err) {
        alert('Eroare la ștergere.');
      }
    }
  };

  const canEdit = (ann: AnnouncementDto) => {
    return hasPrivilege || getCurrentUserId(accessToken) === ann.authorId;
  };

  const categories = ['General', 'HR', 'IT', 'Events', 'Urgent'];
  
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const inputClass = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600";
  const labelClass = "block text-sm font-medium mb-1 text-slate-700";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Anunțuri</h1>
          <p className="text-slate-600">Noutăți și comunicări interne</p>
        </div>
        <Button onClick={() => handleOpenModal()}>Anunț Nou</Button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Filtrează după categorie:</label>
        <select 
          className="flex h-10 w-[200px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          value={category}
          onChange={e => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Toate categoriile</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={idx}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Se încarcă...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">Nu există anunțuri în această categorie.</div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {categories[ann.category] || 'General'}
                    </span>
                    {!ann.isPublished && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">Draft</span>
                    )}
                    <span className="text-xs text-slate-500">
                      {new Date(ann.publishedAt || ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{ann.title}</h2>
                </div>
                {canEdit(ann) && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(ann)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(ann.id)}>Șterge</Button>
                  </div>
                )}
              </div>
              <p className="text-slate-700 whitespace-pre-wrap">{ann.content}</p>
            </div>
          ))
        )}
      </div>

      {!loading && announcements.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button 
            variant="outline" 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Înapoi
          </Button>
          <span className="text-sm text-slate-600">Pagina {page} din {totalPages}</span>
          <Button 
            variant="outline" 
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Înainte
          </Button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl flex flex-col max-h-full">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-semibold">{editingId ? 'Editează Anunț' : 'Adaugă Anunț'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className={labelClass}>Titlu</label>
                  <input required className={inputClass} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Conținut</label>
                  <textarea 
                    required 
                    rows={6}
                    className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none" 
                    value={formData.content} 
                    onChange={e => setFormData({...formData, content: e.target.value})} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Categorie</label>
                  <select 
                    className={inputClass} 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: parseInt(e.target.value, 10)})}
                  >
                    {categories.map((cat, idx) => (
                      <option key={idx} value={idx}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input 
                    type="checkbox" 
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={e => setFormData({...formData, isPublished: e.target.checked})}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <label htmlFor="isPublished" className="text-sm font-medium text-slate-700">Publicat (altfel va fi Draft)</label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Anulează</Button>
                <Button type="submit">Salvează</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
