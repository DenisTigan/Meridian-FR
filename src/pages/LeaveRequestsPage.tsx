import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { LeaveBalanceDto, LeaveRequestDto } from '@/types/hr.types';
import { LeaveType, LeaveRequestStatus } from '@/types/hr.types';
import { hasRole } from '@/utils/jwt';

const LEAVE_TYPE_NAMES: Record<LeaveType, string> = {
  [LeaveType.Annual]: 'Concediu de Odihnă',
  [LeaveType.Sick]: 'Concediu Medical',
  [LeaveType.Personal]: 'Învoire Personală',
  [LeaveType.Maternity]: 'Maternitate',
  [LeaveType.Paternity]: 'Paternitate',
};

const STATUS_NAMES: Record<LeaveRequestStatus, string> = {
  [LeaveRequestStatus.Pending]: 'În Așteptare',
  [LeaveRequestStatus.Approved]: 'Aprobat',
  [LeaveRequestStatus.Rejected]: 'Respins',
};

const STATUS_COLORS: Record<LeaveRequestStatus, string> = {
  [LeaveRequestStatus.Pending]: 'bg-amber-100 text-amber-800 border-amber-200',
  [LeaveRequestStatus.Approved]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [LeaveRequestStatus.Rejected]: 'bg-red-100 text-red-800 border-red-200',
};

export default function LeaveRequestsPage() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');
  
  const isHrOrAdmin = hasRole(token, ['HR', 'Admin']);
  const isManager = hasRole(token, ['Manager']);
  
  let sectionTitle = 'Cererile mele';
  if (isHrOrAdmin) {
    sectionTitle = 'Toate cererile';
  } else if (isManager) {
    sectionTitle = 'Cererile echipei';
  }

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: LeaveType.Annual as number,
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [reviewingRequest, setReviewingRequest] = useState<LeaveRequestDto | null>(null);
  const [reviewForm, setReviewForm] = useState({
    status: LeaveRequestStatus.Approved as number,
    managerComment: ''
  });

  const { data: balances, isLoading: loadingBalances } = useQuery({
    queryKey: ['leave-balance-me'],
    queryFn: async () => {
      const res = await apiClient.get<LeaveBalanceDto[]>('/hr/leave-balance/me');
      return res.data;
    }
  });

  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      const res = await apiClient.get<LeaveRequestDto[]>('/hr/leave-requests');
      return res.data;
    }
  });

  const createRequestMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiClient.post('/hr/leave-requests', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance-me'] });
      setIsNewModalOpen(false);
      setFormData({ leaveType: LeaveType.Annual, startDate: '', endDate: '', reason: '' });
      alert('Cererea a fost trimisă cu succes!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Eroare la crearea cererii.');
    }
  });

  const reviewRequestMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number, payload: any }) => {
      await apiClient.patch(`/hr/leave-requests/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setReviewingRequest(null);
      setReviewForm({ status: LeaveRequestStatus.Approved, managerComment: '' });
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createRequestMutation.mutate(formData);
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewingRequest) {
      reviewRequestMutation.mutate({ id: reviewingRequest.id, payload: reviewForm });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Leave Management</h1>
          <p className="text-slate-600">Gestionează concediile și învoirile</p>
        </div>
        <button 
          onClick={() => setIsNewModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
        >
          + Cerere Nouă
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Balanța mea</h2>
        {loadingBalances ? (
          <div className="text-slate-500 py-2">Se încarcă balanța...</div>
        ) : balances && balances.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {balances.map(b => {
              const percent = b.allottedDays > 0 ? (b.usedDays / b.allottedDays) * 100 : 0;
              return (
                <div key={b.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative overflow-hidden">
                  <div className="text-sm font-semibold text-slate-700 mb-2">{LEAVE_TYPE_NAMES[b.leaveType as LeaveType]}</div>
                  <div className="text-2xl font-bold text-slate-900">{b.remainingDays} <span className="text-sm font-normal text-slate-500">zile rămase</span></div>
                  <div className="text-xs text-slate-500 mt-1">
                    {b.usedDays} folosite din {b.allottedDays} total
                  </div>
                  <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-slate-500 py-2 border border-dashed border-slate-200 rounded-lg p-4 text-center">
            Nu s-au găsit date despre balanța de concediu.
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">{sectionTitle}</h2>
        
        {loadingRequests ? (
          <div className="text-slate-500 py-4 text-center">Se încarcă cererile...</div>
        ) : requests && requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {(isManager || isHrOrAdmin) && <th className="p-3 border-b border-slate-200">Angajat</th>}
                  <th className="p-3 border-b border-slate-200">Tip Concediu</th>
                  <th className="p-3 border-b border-slate-200">Perioadă</th>
                  <th className="p-3 border-b border-slate-200 text-center">Zile</th>
                  <th className="p-3 border-b border-slate-200">Status & Review</th>
                  {(isManager || isHrOrAdmin) && <th className="p-3 border-b border-slate-200 w-32">Acțiuni</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map(req => {
                  const canReview = (isManager || isHrOrAdmin) && req.status === LeaveRequestStatus.Pending;
                  
                  return (
                    <tr key={req.id} className="hover:bg-slate-50">
                      {(isManager || isHrOrAdmin) && (
                        <td className="p-3 font-medium text-slate-900">{req.employeeName}</td>
                      )}
                      <td className="p-3 font-medium text-slate-800">
                        {LEAVE_TYPE_NAMES[req.leaveType as LeaveType]}
                        {req.reason && <div className="text-xs text-slate-500 font-normal mt-0.5 line-clamp-1">{req.reason}</div>}
                      </td>
                      <td className="p-3 text-slate-700">
                        {req.startDate.split('T')[0]} <span className="text-slate-400 mx-1">→</span> {req.endDate.split('T')[0]}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700">{req.totalDays}</td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[req.status as LeaveRequestStatus]}`}>
                            {STATUS_NAMES[req.status as LeaveRequestStatus]}
                          </span>
                          {req.status !== LeaveRequestStatus.Pending && req.reviewedByName && (
                            <div className="text-[10px] text-slate-500 max-w-[200px]">
                              Revizuit de {req.reviewedByName}
                              {req.managerComment && <div className="italic mt-0.5">"{req.managerComment}"</div>}
                            </div>
                          )}
                        </div>
                      </td>
                      {(isManager || isHrOrAdmin) && (
                        <td className="p-3 text-right">
                          {canReview && (
                            <button
                              onClick={() => {
                                setReviewingRequest(req);
                                setReviewForm({ status: LeaveRequestStatus.Approved, managerComment: '' });
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-2 py-1 rounded border border-blue-100 transition-colors"
                            >
                              Revizuiește
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-slate-500 py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Nicio cerere găsită.
          </div>
        )}
      </div>

      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Creare Cerere Concediu</h2>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tip Concediu</label>
                <select className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.leaveType} onChange={e => setFormData({...formData, leaveType: Number(e.target.value)})}>
                  {Object.entries(LEAVE_TYPE_NAMES).map(([val, name]) => (
                    <option key={val} value={val}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data Început</label>
                  <input required type="date" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data Sfârșit</label>
                  <input required type="date" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Motiv (Opțional)</label>
                <textarea rows={3} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm">
                  Anulează
                </button>
                <button type="submit" disabled={createRequestMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium text-sm disabled:opacity-50">
                  {createRequestMutation.isPending ? 'Se trimite...' : 'Trimite Cerere'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reviewingRequest && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Revizuire Cerere</h2>
              <button onClick={() => setReviewingRequest(null)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleReview} className="p-6 space-y-4">
              <div className="text-sm bg-slate-50 p-3 rounded border border-slate-200">
                <div className="font-semibold">{reviewingRequest.employeeName}</div>
                <div className="text-slate-600">{LEAVE_TYPE_NAMES[reviewingRequest.leaveType as LeaveType]} ({reviewingRequest.totalDays} zile)</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Decizie</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" checked={reviewForm.status === LeaveRequestStatus.Approved}
                      onChange={() => setReviewForm({...reviewForm, status: LeaveRequestStatus.Approved})} />
                    <span className="text-sm font-medium text-emerald-700">Aprobă</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" checked={reviewForm.status === LeaveRequestStatus.Rejected}
                      onChange={() => setReviewForm({...reviewForm, status: LeaveRequestStatus.Rejected})} />
                    <span className="text-sm font-medium text-red-700">Respinge</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Comentariu Manager (Opțional)</label>
                <textarea rows={3} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={reviewForm.managerComment} onChange={e => setReviewForm({...reviewForm, managerComment: e.target.value})} />
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setReviewingRequest(null)} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm">
                  Anulează
                </button>
                <button type="submit" disabled={reviewRequestMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium text-sm disabled:opacity-50">
                  Salvează Decizia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
