import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { CalendarEventDto } from '@/types/calendar.types';
import { EventCategory } from '@/types/calendar.types';
import { getCurrentUserId, hasRole } from '@/utils/jwt';

// Helper to get days in a month
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Helper to get first day index (0 = Monday, 6 = Sunday)
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; 
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  [EventCategory.General]: 'bg-slate-200 text-slate-800',
  [EventCategory.Meeting]: 'bg-blue-200 text-blue-800',
  [EventCategory.Holiday]: 'bg-emerald-200 text-emerald-800',
  [EventCategory.Training]: 'bg-purple-200 text-purple-800',
  [EventCategory.SocialEvent]: 'bg-amber-200 text-amber-800',
  [EventCategory.Deadline]: 'bg-red-200 text-red-800',
  [EventCategory.Other]: 'bg-gray-200 text-gray-800',
};

const CATEGORY_NAMES: Record<EventCategory, string> = {
  [EventCategory.General]: 'General',
  [EventCategory.Meeting]: 'Meeting',
  [EventCategory.Holiday]: 'Holiday',
  [EventCategory.Training]: 'Training',
  [EventCategory.SocialEvent]: 'Social Event',
  [EventCategory.Deadline]: 'Deadline',
  [EventCategory.Other]: 'Other',
};

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');
  const currentUserId = getCurrentUserId(token);
  const isManagerOrAdmin = hasRole(token, ['Manager', 'HR', 'Admin']);
  const isAdmin = hasRole(token, ['Admin']);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventDto | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    isAllDay: false,
    category: EventCategory.General as number,
    location: '',
    meetingUrl: ''
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fromDate = new Date(year, month, 1).toISOString().split('T')[0];
  const toDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const { data: events } = useQuery({
    queryKey: ['events', fromDate, toDate, selectedCategory],
    queryFn: async () => {
      const categoryParam = selectedCategory !== '' ? `&category=${selectedCategory}` : '';
      const res = await apiClient.get<CalendarEventDto[]>(`/calendar/events?from=${fromDate}&to=${toDate}${categoryParam}`);
      return res.data;
    }
  });

  const saveEventMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingEvent) {
        await apiClient.put(`/calendar/events/${editingEvent.id}`, payload);
      } else {
        await apiClient.post('/calendar/events', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsModalOpen(false);
      resetForm();
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/calendar/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEventDto[]>();
    events?.forEach(ev => {
      // Very simple parsing, assuming startDateTime is ISO
      const datePart = ev.startDateTime.split('T')[0];
      const evDate = new Date(datePart);
      if (evDate.getFullYear() === year && evDate.getMonth() === month) {
        const d = evDate.getDate();
        if (!map.has(d)) map.set(d, []);
        map.get(d)!.push(ev);
      }
    });
    return map;
  }, [events, year, month]);

  const resetForm = () => {
    setEditingEvent(null);
    setFormData({
      title: '', description: '', startDate: '', startTime: '', endDate: '', endTime: '',
      isAllDay: false, category: EventCategory.General, location: '', meetingUrl: ''
    });
  };

  const openNewEventModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (ev: CalendarEventDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(ev);
    const startStr = ev.startDateTime.split('T');
    const endStr = ev.endDateTime.split('T');
    setFormData({
      title: ev.title,
      description: ev.description,
      startDate: startStr[0] || '',
      startTime: startStr[1]?.substring(0, 5) || '',
      endDate: endStr[0] || '',
      endTime: endStr[1]?.substring(0, 5) || '',
      isAllDay: ev.isAllDay,
      category: ev.category,
      location: ev.location || '',
      meetingUrl: ev.meetingUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Ești sigur că vrei să ștergi acest eveniment?')) {
      deleteEventMutation.mutate(id);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const startDateTime = formData.isAllDay ? `${formData.startDate}T00:00:00` : `${formData.startDate}T${formData.startTime}:00`;
    const endDateTime = formData.isAllDay ? `${formData.endDate || formData.startDate}T23:59:59` : `${formData.endDate}T${formData.endTime}:00`;
    
    saveEventMutation.mutate({
      title: formData.title,
      description: formData.description,
      startDateTime,
      endDateTime,
      isAllDay: formData.isAllDay,
      category: Number(formData.category),
      location: formData.location,
      meetingUrl: formData.meetingUrl
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Calendar Companie</h1>
          <p className="text-slate-600">Evenimente, ședințe și sărbători</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Toate categoriile</option>
            {Object.entries(CATEGORY_NAMES).map(([val, name]) => (
              <option key={val} value={val}>{name}</option>
            ))}
          </select>
          {isManagerOrAdmin && (
            <button 
              onClick={openNewEventModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
            >
              + Eveniment Nou
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <button onClick={prevMonth} className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-sm font-medium text-slate-700">
            Luna precedentă
          </button>
          <h2 className="text-xl font-bold text-slate-800">
            {currentDate.toLocaleString('ro-RO', { month: 'long', year: 'numeric' }).toUpperCase()}
          </h2>
          <button onClick={nextMonth} className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-sm font-medium text-slate-700">
            Luna următoare
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100">
          {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 bg-slate-200 gap-[1px]">
          {emptyDays.map(i => (
            <div key={`empty-${i}`} className="bg-white min-h-[120px]" />
          ))}
          {daysArray.map(day => {
            const dayEvents = eventsByDay.get(day) || [];
            return (
              <div key={day} className={`bg-white min-h-[120px] p-2 flex flex-col ${isToday(day) ? 'bg-blue-50/30' : ''}`}>
                <div className={`text-right text-sm font-medium mb-1 ${isToday(day) ? 'text-blue-600' : 'text-slate-500'}`}>
                  {day}
                </div>
                <div className="space-y-1 overflow-y-auto flex-1">
                  {dayEvents.map(ev => {
                    const canEdit = isAdmin || currentUserId === ev.createdBy;
                    return (
                      <div 
                        key={ev.id}
                        className={`text-xs p-1.5 rounded border border-transparent truncate group relative cursor-pointer ${CATEGORY_COLORS[ev.category as EventCategory] || CATEGORY_COLORS[EventCategory.Other]}`}
                        title={`${ev.title}\n${ev.description}`}
                        onClick={(e) => canEdit && openEditModal(ev, e)}
                      >
                        <div className="font-semibold truncate">{ev.title}</div>
                        {!ev.isAllDay && <div className="text-[10px] opacity-80">{ev.startDateTime.split('T')[1].substring(0,5)}</div>}
                        
                        {canEdit && (
                          <div className="absolute top-1 right-1 hidden group-hover:flex gap-1 bg-white/90 rounded px-1 shadow-sm">
                            <button 
                              onClick={(e) => handleDelete(ev.id, e)}
                              className="text-red-600 hover:text-red-800 p-0.5"
                              title="Șterge"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {/* Fill remaining cells */}
          {Array.from({ length: (7 - ((daysInMonth + firstDay) % 7)) % 7 }).map((_, i) => (
            <div key={`end-empty-${i}`} className="bg-white min-h-[120px]" />
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">{editingEvent ? 'Editează Eveniment' : 'Eveniment Nou'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titlu</label>
                <input required type="text" className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descriere</label>
                <textarea className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" rows={3}
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" id="isAllDay" checked={formData.isAllDay} 
                  onChange={e => setFormData({...formData, isAllDay: e.target.checked})} />
                <label htmlFor="isAllDay" className="text-sm font-medium text-slate-700">Toată ziua</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data Început</label>
                  <input required type="date" className="w-full border border-slate-300 rounded p-2 text-sm" 
                    value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                {!formData.isAllDay && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ora Început</label>
                    <input required type="time" className="w-full border border-slate-300 rounded p-2 text-sm" 
                      value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data Sfârșit</label>
                  <input required type="date" className="w-full border border-slate-300 rounded p-2 text-sm" 
                    value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
                {!formData.isAllDay && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ora Sfârșit</label>
                    <input required type="time" className="w-full border border-slate-300 rounded p-2 text-sm" 
                      value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Locație</label>
                  <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm" 
                    value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Link Meeting (opțional)</label>
                <input type="url" className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="https://..."
                  value={formData.meetingUrl} onChange={e => setFormData({...formData, meetingUrl: e.target.value})} />
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm">
                  Anulează
                </button>
                <button type="submit" disabled={saveEventMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium text-sm disabled:opacity-50">
                  {saveEventMutation.isPending ? 'Se salvează...' : 'Salvează'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
