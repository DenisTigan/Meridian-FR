import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import type { QuickLinkDto } from './QuickLinksPage';

export default function DashboardPage() {
  const [quickLinks, setQuickLinks] = useState<QuickLinkDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await apiClient.get<QuickLinkDto[]>('/quick-links');
        // Filter active, sort by orderIndex, take first 6
        const filtered = res.data
          .filter(l => l.isActive)
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .slice(0, 6);
        setQuickLinks(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Bun venit în Meridian Hub!</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Widget Quick Links */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-lg">Quick Links</h2>
            <a href="/links" className="text-sm font-medium text-blue-600 hover:text-blue-700">Vezi toate</a>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="text-center py-4 text-slate-500 text-sm">Se încarcă...</div>
            ) : quickLinks.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-sm">Nu există link-uri rapide.</div>
            ) : (
              <div className="space-y-3">
                {quickLinks.map(link => (
                  <a 
                    key={link.id} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
                  >
                    <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-100 transition-colors">
                      {link.name.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-medium text-slate-800 text-sm truncate">{link.name}</h3>
                      <p className="text-xs text-slate-500 truncate">{link.url}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Placeholder for future widgets */}
        <div className="lg:col-span-2 bg-slate-50 border border-slate-200 border-dashed rounded-xl flex items-center justify-center p-12">
          <p className="text-slate-400 font-medium">Spațiu pentru viitoare widget-uri</p>
        </div>
      </div>
    </div>
  );
}
