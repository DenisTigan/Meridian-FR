import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { HRTicketDto } from '@/types/hr.types';
import { TicketCategory, TicketStatus } from '@/types/hr.types';
import { hasRole } from '@/utils/jwt';

const CATEGORY_NAMES: Record<TicketCategory, string> = {
  [TicketCategory.Certificate]: 'Certificate',
  [TicketCategory.PayrollQuery]: 'Payroll Query',
  [TicketCategory.InfoUpdate]: 'Info Update',
  [TicketCategory.General]: 'General',
};

const STATUS_NAMES: Record<TicketStatus, string> = {
  [TicketStatus.Open]: 'Open',
  [TicketStatus.InProgress]: 'In Progress',
  [TicketStatus.Resolved]: 'Resolved',
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  [TicketStatus.Open]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [TicketStatus.InProgress]: 'bg-blue-100 text-blue-800 border-blue-200',
  [TicketStatus.Resolved]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function HRTicketsPage() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');
  const isHrOrAdmin = hasRole(token, ['HR', 'Admin']);

  const [filterCategory, setFilterCategory] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<number | ''>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: TicketCategory.General as number,
    subject: '',
    description: ''
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['hr-tickets', filterCategory, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterCategory !== '') params.append('category', filterCategory.toString());
      if (filterStatus !== '') params.append('status', filterStatus.toString());
      const res = await apiClient.get<HRTicketDto[]>(`/hr/tickets?${params.toString()}`);
      return res.data;
    }
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const res = await apiClient.get<{ items: { id: number; firstName: string; lastName: string }[] }>('/employees?pageSize=1000');
      return res.data.items;
    },
    enabled: isHrOrAdmin
  });

  const createTicketMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiClient.post('/hr/tickets', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-tickets'] });
      setIsModalOpen(false);
      setFormData({ category: TicketCategory.General, subject: '', description: '' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: number }) => {
      await apiClient.patch(`/hr/tickets/${id}/status`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr-tickets'] })
  });

  const assignTicketMutation = useMutation({
    mutationFn: async ({ id, assignedToId }: { id: number, assignedToId: number }) => {
      await apiClient.patch(`/hr/tickets/${id}/assign`, { assignedToId });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr-tickets'] })
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createTicketMutation.mutate(formData);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">HR Tickets</h1>
          <p className="text-slate-600">Gestionează tichetele de HR</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
        >
          + Ticket Nou
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex flex-wrap gap-4">
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
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Filtru Status</label>
            <select 
              className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">Toate</option>
              {Object.entries(STATUS_NAMES).map(([val, name]) => (
                <option key={val} value={val}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-slate-500 py-4 text-center">Se încarcă ticketele...</div>
        ) : tickets && tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3 border-b border-slate-200">ID / Date</th>
                  <th className="p-3 border-b border-slate-200">Detalii Ticket</th>
                  <th className="p-3 border-b border-slate-200">Angajat</th>
                  <th className="p-3 border-b border-slate-200">Status</th>
                  {isHrOrAdmin && <th className="p-3 border-b border-slate-200 w-48">Acțiuni HR</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-slate-50">
                    <td className="p-3 align-top">
                      <div className="font-semibold text-slate-800">{ticket.ticketNumber}</div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="font-medium text-slate-900 mb-1">{ticket.subject}</div>
                      <div className="text-xs text-slate-600 mb-2 line-clamp-2">{ticket.description}</div>
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">
                        {CATEGORY_NAMES[ticket.category as TicketCategory]}
                      </span>
                    </td>
                    <td className="p-3 align-top">
                      <div className="font-medium">{ticket.employeeName}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Asignat la: {ticket.assignedToName || 'Neasignat'}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[ticket.status as TicketStatus]}`}>
                        {STATUS_NAMES[ticket.status as TicketStatus]}
                      </span>
                    </td>
                    {isHrOrAdmin && (
                      <td className="p-3 align-top space-y-2">
                        <select
                          className="w-full border border-slate-300 rounded text-xs py-1 px-2"
                          value={ticket.status}
                          onChange={(e) => updateStatusMutation.mutate({ id: ticket.id, status: Number(e.target.value) })}
                        >
                          {Object.entries(STATUS_NAMES).map(([val, name]) => (
                            <option key={val} value={val}>{name}</option>
                          ))}
                        </select>
                        <select
                          className="w-full border border-slate-300 rounded text-xs py-1 px-2"
                          value={ticket.assignedToId || ''}
                          onChange={(e) => assignTicketMutation.mutate({ id: ticket.id, assignedToId: Number(e.target.value) })}
                        >
                          <option value="">-- Neasignat --</option>
                          {employees?.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                          ))}
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-slate-500 py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Nu s-au găsit tickete conform filtrelor curente.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Creare Ticket Nou</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categorie</label>
                <select className="w-full border border-slate-300 rounded p-2 text-sm" 
                  value={formData.category} onChange={e => setFormData({...formData, category: Number(e.target.value)})}>
                  {Object.entries(CATEGORY_NAMES).map(([val, name]) => (
                    <option key={val} value={val}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subiect</label>
                <input required type="text" className="w-full border border-slate-300 rounded p-2 text-sm" 
                  value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descriere detaliată</label>
                <textarea required rows={4} className="w-full border border-slate-300 rounded p-2 text-sm" 
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm">
                  Anulează
                </button>
                <button type="submit" disabled={createTicketMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium text-sm disabled:opacity-50">
                  {createTicketMutation.isPending ? 'Se trimite...' : 'Trimite Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
