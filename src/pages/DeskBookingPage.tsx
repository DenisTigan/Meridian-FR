import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { OfficeDto, DeskDto } from '@/types/office.types';
import type { DeskBookingDto, PagedBookingResponse } from '@/types/booking.types';
import { BookingStatus } from '@/types/booking.types';
import { hasRole } from '@/utils/jwt';

export default function DeskBookingPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(null);
  
  const token = localStorage.getItem('token');
  const isManagerOrAdmin = hasRole(token, ['Manager', 'HR', 'Admin']);

  const queryClient = useQueryClient();

  const { data: offices, isLoading: loadingOffices } = useQuery({
    queryKey: ['offices'],
    queryFn: async () => {
      const res = await apiClient.get<OfficeDto[]>('/offices');
      return res.data;
    }
  });

  // Default to first office if not selected
  React.useEffect(() => {
    if (offices && offices.length > 0 && !selectedOfficeId) {
      setSelectedOfficeId(offices[0].id);
    }
  }, [offices, selectedOfficeId]);

  const { data: desks, isLoading: loadingDesks } = useQuery({
    queryKey: ['desks', selectedDate, selectedOfficeId],
    queryFn: async () => {
      if (!selectedOfficeId || !selectedDate) return [];
      const res = await apiClient.get<DeskDto[]>(`/desks?date=${selectedDate}&officeId=${selectedOfficeId}`);
      return res.data;
    },
    enabled: !!selectedOfficeId && !!selectedDate
  });

  const { data: myBookings, isLoading: loadingMyBookings } = useQuery({
    queryKey: ['myBookings'],
    queryFn: async () => {
      const res = await apiClient.get<PagedBookingResponse>('/bookings?page=1&pageSize=100');
      return res.data.items;
    }
  });

  const { data: todayBookings } = useQuery({
    queryKey: ['todayBookings', selectedDate],
    queryFn: async () => {
      if (!isManagerOrAdmin) return [];
      const res = await apiClient.get<DeskBookingDto[]>(`/bookings/date/${selectedDate}`);
      return res.data;
    },
    enabled: isManagerOrAdmin && !!selectedDate
  });

  const bookDeskMutation = useMutation({
    mutationFn: async (deskId: number) => {
      const res = await apiClient.post<DeskBookingDto>('/bookings', { deskId, date: selectedDate });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['desks'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['todayBookings'] });
      alert('Birou rezervat cu succes!');
    },
    onError: (error: any) => {
      if (error.response?.status === 409 || error.response?.status === 400) {
        alert('Acest birou este deja rezervat pentru data selectată.');
      } else {
        alert('A apărut o eroare la rezervare.');
      }
    }
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/bookings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['desks'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['todayBookings'] });
    }
  });

  const handleBookDesk = (desk: DeskDto) => {
    if (!desk.isAvailable) return;
    if (window.confirm(`Doriți să rezervați biroul ${desk.deskCode} (Zona: ${desk.zone}) pentru data de ${selectedDate}?`)) {
      bookDeskMutation.mutate(desk.id);
    }
  };

  const handleCancelBooking = (booking: DeskBookingDto) => {
    if (window.confirm(`Anulați rezervarea pentru biroul ${booking.deskCode} din data de ${booking.bookingDate.split('T')[0]}?`)) {
      cancelBookingMutation.mutate(booking.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Desk Booking</h1>
          <p className="text-slate-600">Rezervă-ți biroul la oficiu</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Data rezervării</label>
            <input 
              type="date" 
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <label className="text-sm font-medium text-slate-700">Oficiu</label>
            <select 
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedOfficeId || ''}
              onChange={(e) => setSelectedOfficeId(Number(e.target.value))}
              disabled={loadingOffices}
            >
              <option value="" disabled>Selectează oficiu</option>
              {offices?.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loadingDesks ? (
          <div className="py-12 text-center text-slate-500">Se încarcă birourile...</div>
        ) : desks && desks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {desks.map(desk => (
              <div 
                key={desk.id}
                onClick={() => desk.isAvailable && handleBookDesk(desk)}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  desk.isAvailable 
                    ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 cursor-pointer' 
                    : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className={`text-lg font-bold ${desk.isAvailable ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {desk.deskCode}
                </div>
                <div className="text-xs text-slate-500 mt-1">Etaj: {desk.floor}</div>
                <div className="text-xs text-slate-500">Zona: {desk.zone}</div>
                <div className="mt-2">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                    desk.isAvailable ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {desk.isAvailable ? 'Disponibil' : 'Ocupat'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            Niciun birou găsit pentru selecția curentă.
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Rezervările mele</h2>
        {loadingMyBookings ? (
          <div className="text-slate-500">Se încarcă rezervările...</div>
        ) : myBookings && myBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3 rounded-tl-lg font-medium">Data</th>
                  <th className="p-3 font-medium">Birou</th>
                  <th className="p-3 font-medium">Oficiu</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 rounded-tr-lg font-medium text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myBookings.map(b => {
                  const isFuture = new Date(b.bookingDate) >= new Date(new Date().setHours(0,0,0,0));
                  const isActive = b.status === BookingStatus.Confirmed;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-medium">{b.bookingDate.split('T')[0]}</td>
                      <td className="p-3">{b.deskCode}</td>
                      <td className="p-3">{b.officeName}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isActive ? 'Confirmat' : 'Anulat'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {isActive && isFuture && (
                          <button
                            onClick={() => handleCancelBooking(b)}
                            className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                          >
                            Anulează
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-slate-500 py-4">Nu aveți nicio rezervare.</div>
        )}
      </div>

      {isManagerOrAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-indigo-500">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            Admin View: Cine e rezervat azi ({selectedDate})
          </h2>
          {todayBookings && todayBookings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {todayBookings.map(b => (
                <div key={b.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-slate-900">{b.employeeFullName}</div>
                    <div className="text-xs text-slate-500">{b.officeName} • {b.deskCode}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                    b.status === BookingStatus.Confirmed ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {b.status === BookingStatus.Confirmed ? 'Confirmat' : 'Anulat'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 text-sm">Nicio rezervare înregistrată pentru această dată.</div>
          )}
        </div>
      )}
    </div>
  );
}
