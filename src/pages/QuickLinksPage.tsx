import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { hasRole } from '@/utils/jwt';

export interface QuickLinkDto {
  id: number;
  name: string;
  url: string;
  iconName?: string;
  category?: string;
  orderIndex: number;
  isActive: boolean;
}

export default function QuickLinksPage() {
  const [links, setLinks] = useState<QuickLinkDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    iconName: '',
    category: '',
    orderIndex: 0,
    isActive: true
  });
  
  const { accessToken } = useAuthStore();
  
  const hasAdmin = hasRole(accessToken, ['Admin']);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<QuickLinkDto[]>('/quick-links');
      setLinks(res.data.sort((a, b) => a.orderIndex - b.orderIndex));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleOpenModal = (link?: QuickLinkDto) => {
    if (link) {
      setEditingId(link.id);
      setFormData({
        name: link.name,
        url: link.url,
        iconName: link.iconName || '',
        category: link.category || '',
        orderIndex: link.orderIndex,
        isActive: link.isActive
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', url: '', iconName: '', category: '', orderIndex: links.length, isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/quick-links/${editingId}`, formData);
      } else {
        await apiClient.post('/quick-links', formData);
      }
      setIsModalOpen(false);
      fetchLinks();
    } catch (err) {
      alert('Eroare la salvare.');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Ești sigur că vrei să ștergi acest link?')) {
      try {
        await apiClient.delete(`/quick-links/${id}`);
        fetchLinks();
      } catch (err) {
        alert('Eroare la ștergere.');
      }
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === links.length - 1) return;

    const newLinks = [...links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap orderIndex
    const tempOrder = newLinks[index].orderIndex;
    newLinks[index].orderIndex = newLinks[targetIndex].orderIndex;
    newLinks[targetIndex].orderIndex = tempOrder;
    
    // Swap array position
    const temp = newLinks[index];
    newLinks[index] = newLinks[targetIndex];
    newLinks[targetIndex] = temp;
    
    setLinks(newLinks); // optimistically update UI
    
    try {
      await apiClient.patch('/quick-links/reorder', {
        orderedIds: newLinks.map(l => l.id) // backend assumes we send ordered array of IDs or objects
      });
    } catch (err) {
      alert('Eroare la reordonare.');
      fetchLinks(); // revert on fail
    }
  };

  const inputClass = "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600";
  const labelClass = "block text-sm font-medium mb-1 text-slate-700";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quick Links</h1>
          <p className="text-slate-600">Link-uri utile pentru angajați</p>
        </div>
        {hasAdmin && <Button onClick={() => handleOpenModal()}>Adaugă Link</Button>}
      </div>

      {loading ? (
        <div className="text-center py-8">Se încarcă...</div>
      ) : links.length === 0 ? (
        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">Nu există link-uri disponibile.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link, idx) => (
            <div key={link.id} className={`flex flex-col bg-white border rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md ${!link.isActive ? 'opacity-60' : 'border-slate-200'}`}>
              <a 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 p-5 block hover:bg-slate-50/50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                    {link.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 line-clamp-1">{link.name}</h3>
                    {link.category && <span className="text-xs text-slate-500">{link.category}</span>}
                  </div>
                </div>
                <p className="text-sm text-blue-600 truncate">{link.url}</p>
              </a>
              
              {hasAdmin && (
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7 px-2" disabled={idx === 0} onClick={() => handleMove(idx, 'up')}>↑</Button>
                    <Button variant="outline" size="sm" className="h-7 px-2" disabled={idx === links.length - 1} onClick={() => handleMove(idx, 'down')}>↓</Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7" onClick={() => handleOpenModal(link)}>Edit</Button>
                    <Button variant="destructive" size="sm" className="h-7" onClick={() => handleDelete(link.id)}>Del</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{editingId ? 'Editează Link' : 'Adaugă Link'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>Nume</label>
                  <input required className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>URL</label>
                  <input required type="url" className={inputClass} value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Categorie</label>
                  <input className={inputClass} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Activ (vizibil pentru toți)</label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
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
