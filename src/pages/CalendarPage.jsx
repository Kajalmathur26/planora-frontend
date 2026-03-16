import { useState, useEffect, useCallback, useMemo } from 'react';
import { eventService } from '../services';
import { Plus, X, MapPin, ChevronLeft, ChevronRight, Search, Loader2, Calendar as CalendarIcon, List, Clock } from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, 
  isToday, isSameMonth, addMonths, subMonths, addWeeks, subWeeks, 
  startOfWeek, endOfWeek, addDays, subDays, startOfDay, endOfDay,
  eachHourOfInterval
} from 'date-fns';
import toast from 'react-hot-toast';

const EVENT_COLORS = ['#8B5CF6', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#F97316'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const [form, setForm] = useState({
    title: '', description: '', start_time: '', end_time: '', color: '#8B5CF6',
    location: '', city: '', reminder: '15'
  });

  useEffect(() => { loadEvents(); }, [currentDate, viewMode]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      events.forEach(ev => {
        const start = new Date(ev.start_time);
        const reminderTime = new Date(start.getTime() - (ev.reminder_minutes || 0) * 60000);
        if (now >= reminderTime && now < start && !ev.notified) {
          toast(`🔔 Reminder: ${ev.title} starts at ${format(start, 'h:mm a')}`, {
            duration: 5000, icon: '📅', style: { borderRadius: '12px', background: 'var(--card)', color: 'var(--foreground)', border: `1px solid ${ev.color || 'var(--primary)'}` }
          });
          ev.notified = true;
        }
      });
    };
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [events]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      let start, end;
      if (viewMode === 'month') {
        start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      } else if (viewMode === 'week') {
        start = format(startOfWeek(currentDate), 'yyyy-MM-dd');
        end = format(endOfWeek(currentDate), 'yyyy-MM-dd');
      } else {
        start = format(startOfDay(currentDate), 'yyyy-MM-dd');
        end = format(endOfDay(currentDate), 'yyyy-MM-dd');
      }
      const res = await eventService.getAll({ start_date: start, end_date: end });
      setEvents(res.data.events);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  const searchLocation = useCallback((query) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    if (!query.trim() || query.length < 3) { setLocationResults([]); return; }
    const t = setTimeout(async () => {
      setLocationLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`);
        const data = await res.json();
        setLocationResults(data);
      } catch { toast.error('Location search unavailable'); }
      finally { setLocationLoading(false); }
    }, 600);
    setSearchTimeout(t);
  }, [searchTimeout]);

  const selectLocation = (result) => {
    const city = result.address?.city || result.address?.town || result.address?.village || '';
    const display = result.display_name.split(',').slice(0, 2).join(',').trim();
    setForm(f => ({ ...f, location: display, city: city || result.display_name.split(',')[0].trim() }));
    setLocationSearch(display);
    setLocationResults([]);
    setShowLocationPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title required');
    if (!form.start_time) return toast.error('Start time required');
    try {
      const payload = {
        ...form,
        start_time: new Date(form.start_time).toISOString(),
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
        reminder_minutes: parseInt(form.reminder)
      };
      await eventService.create(payload);
      toast.success('Event created! 📅');
      resetForm();
      loadEvents();
    } catch { toast.error('Failed to create event'); }
  };

  const deleteEvent = async (id) => {
    if (!confirm('Delete event?')) return;
    try {
      await eventService.delete(id);
      setEvents(events.filter(e => e.id !== id));
      toast.success('Event deleted');
    } catch { toast.error('Failed to delete event'); }
  };

  const resetForm = () => {
    setShowForm(false);
    setForm({ title: '', description: '', start_time: '', end_time: '', color: '#8B5CF6', location: '', city: '', reminder: '15' });
    setLocationSearch(''); setLocationResults([]);
  };

  const dayEvents = (day) => events.filter(e => isSameDay(new Date(e.start_time), day));

  const navigate = (direction) => {
    if (viewMode === 'month') setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    else if (viewMode === 'week') setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
    else setCurrentDate(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1));
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPad = getDay(monthStart);

    return (
      <div className="animate-in fade-in duration-300">
        <div className="grid grid-cols-7 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array(startPad).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
          {calDays.map(day => {
            const evs = dayEvents(day);
            const selected = isSameDay(day, selectedDay);
            const today = isToday(day);
            return (
              <button key={day.toISOString()} onClick={() => setSelectedDay(day)} onDoubleClick={() => { setSelectedDay(day); const dt = format(day, "yyyy-MM-dd'T'12:00"); setForm(f => ({ ...f, start_time: dt })); setShowForm(true); }}
                className={`aspect-square flex flex-col items-center justify-between p-1 rounded-xl transition-all relative text-sm ${selected ? 'bg-primary text-white shadow-[0_0_15px_var(--primary-glow)]' : today ? 'border border-primary/40 text-primary bg-primary/10' : 'hover:bg-white/5 text-foreground hover:scale-105'}`}>
                <span className={`text-xs font-medium ${!selected && !today && !isSameMonth(day, currentDate) ? 'opacity-30' : ''}`}>{format(day, 'd')}</span>
                {evs.length > 0 && <div className="flex gap-0.5 justify-center flex-wrap max-w-full">{evs.slice(0, 3).map((ev, i) => <span key={i} className="w-1 h-1 rounded-full" style={{ background: ev.color || 'var(--primary)' }} />)}</div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = eachHourOfInterval({ start: startOfDay(currentDate), end: endOfDay(currentDate) });

    return (
      <div className="animate-in fade-in duration-300 overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-8 border-b border-border/50 pb-2 mb-2">
            <div className="w-16" />
            {weekDays.map(day => (
              <div key={day.toISOString()} className={`text-center py-2 rounded-xl ${isToday(day) ? 'bg-primary/10 text-primary' : ''}`}>
                <p className="text-[10px] uppercase font-bold opacity-60">{format(day, 'EEE')}</p>
                <p className="text-sm font-bold">{format(day, 'd')}</p>
              </div>
            ))}
          </div>
          <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {hours.map(hour => (
              <div key={hour.toISOString()} className="grid grid-cols-8 border-b border-border/5 h-16 relative">
                <div className="text-[10px] text-muted-foreground pt-1 pr-2 text-right font-mono border-r border-border/20">{format(hour, 'hh:mm a')}</div>
                {weekDays.map(day => {
                  const evs = events.filter(ev => {
                    const start = new Date(ev.start_time);
                    return isSameDay(start, day) && start.getHours() === hour.getHours();
                  });
                  return (
                    <div key={`${day.toISOString()}-${hour.getHours()}`} className="relative border-r border-border/10 last:border-0 hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => { setSelectedDay(day); const dt = format(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour.getHours()), "yyyy-MM-dd'T'HH:mm"); setForm(f => ({ ...f, start_time: dt })); setShowForm(true); }}>
                      {evs.map(ev => <div key={ev.id} className="absolute inset-x-1 top-1 rounded-lg p-1 text-[9px] font-medium text-white shadow line-clamp-2" style={{ background: ev.color || 'var(--primary)', height: 'calc(100% - 4px)' }}>{ev.title}</div>)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = eachHourOfInterval({ start: startOfDay(currentDate), end: endOfDay(currentDate) });
    const evsForDay = dayEvents(currentDate);
    return (
      <div className="animate-in fade-in duration-300">
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-secondary/30">
          <div className="w-14 h-14 rounded-xl bg-primary/20 flex flex-col items-center justify-center text-primary">
            <span className="text-[10px] font-bold uppercase">{format(currentDate, 'EEE')}</span>
            <span className="text-xl font-bold">{format(currentDate, 'd')}</span>
          </div>
          <div><h2 className="font-bold text-foreground">{format(currentDate, 'MMMM yyyy')}</h2><p className="text-xs text-muted-foreground">{evsForDay.length} events</p></div>
        </div>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {hours.map(hour => {
            const hourEvs = evsForDay.filter(ev => new Date(ev.start_time).getHours() === hour.getHours());
            return (
              <div key={hour.toISOString()} className="flex gap-4 group">
                <div className="w-16 text-right text-[10px] font-mono text-muted-foreground pt-1">{format(hour, 'hh:mm a')}</div>
                <div className="flex-1 min-h-[40px] relative border-l-2 border-border/30 pl-4 group-hover:border-primary/50 transition-colors">
                  {hourEvs.length > 0 ? (
                    <div className="space-y-2">{hourEvs.map(ev => (
                      <div key={ev.id} className="p-3 rounded-lg border border-border/50 bg-card shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: ev.color }} /><span className="font-semibold text-xs">{ev.title}</span></div>
                          <button onClick={() => deleteEvent(ev.id)} className="text-muted-foreground hover:text-rose-500"><X size={12} /></button>
                        </div>
                      </div>
                    ))}</div>
                  ) : <button onClick={() => { const dt = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour.getHours()), "yyyy-MM-dd'T'HH:mm"); setForm(f => ({ ...f, start_time: dt })); setShowForm(true); }} className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">+ Add Event</button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="font-display text-2xl font-bold text-foreground">Calendar</h1><p className="text-muted-foreground text-sm">{format(currentDate, viewMode === 'day' ? 'MMMM d, yyyy' : 'MMMM yyyy')} · {events.length} events</p></div>
        <div className="flex items-center gap-2">
          <div className="bg-secondary/50 p-1 rounded-xl flex">
            {['month', 'week', 'day'].map(v => (
              <button key={v} onClick={() => setViewMode(v)} className={`px-4 py-1 rounded-lg text-xs font-medium transition-all ${viewMode === v ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
            ))}
          </div>
          <button onClick={() => setShowForm(true)} className="neon-button flex items-center gap-2 py-2"><Plus size={16} /> Add Event</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 glass-card p-6 shadow-xl relative overflow-hidden">
          {loading && <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4"><button onClick={() => navigate('prev')} className="p-2 rounded-xl hover:bg-white/5 border border-border/50 text-muted-foreground"><ChevronLeft size={18} /></button><h2 className="font-display font-bold text-foreground">{viewMode === 'week' ? `Week of ${format(startOfWeek(currentDate), 'MMM d')}` : format(currentDate, viewMode === 'day' ? 'MMMM d' : 'MMMM yyyy')}</h2><button onClick={() => navigate('next')} className="p-2 rounded-xl hover:bg-white/5 border border-border/50 text-muted-foreground"><ChevronRight size={18} /></button></div>
            <button onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()); }} className="text-xs font-bold text-primary">Today</button>
          </div>
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>
        <div className="space-y-6">
          <div className="glass-card p-5 border-l-4 border-primary"><h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-4"><Clock size={14} className="text-primary" /> Upcoming Today</h3>
            <div className="space-y-3">{dayEvents(new Date()).length > 0 ? dayEvents(new Date()).slice(0, 3).map(ev => (<div key={ev.id} className="flex gap-3"><div className="w-1 rounded-full" style={{ background: ev.color }} /><div className="min-w-0"><p className="text-[10px] font-semibold truncate">{ev.title}</p><p className="text-[9px] text-muted-foreground">{format(new Date(ev.start_time), 'h:mm a')}</p></div></div>)) : <p className="text-[10px] text-muted-foreground text-center italic">No events</p>}</div>
          </div>
          <div className="glass-card p-5 border-l-4 border-primary shadow-xl"><h3 className="text-xs font-bold text-foreground mb-4">Day Details</h3><p className="text-[10px] text-muted-foreground font-medium mb-3">{format(selectedDay, 'EEEE, MMM d')}</p>
            <div className="space-y-3">{dayEvents(selectedDay).length > 0 ? dayEvents(selectedDay).map(ev => (<div key={ev.id} className="flex gap-3"><div className="w-1 rounded-full" style={{ background: ev.color }} /><div className="min-w-0"><p className="text-[10px] font-semibold truncate">{ev.title}</p><p className="text-[9px] text-muted-foreground">{format(new Date(ev.start_time), 'h:mm a')}</p></div></div>)) : <p className="text-[10px] text-muted-foreground text-center italic">No events</p>}</div>
          </div>
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6 glow-border animate-in zoom-in-95 duration-200"><h2 className="font-display text-lg font-bold mb-6">Schedule Event</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input className="input-field" placeholder="Event title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <textarea className="input-field resize-none h-20 text-sm" placeholder="Details" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Starts</label><input type="datetime-local" className="input-field" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div><div><label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Ends</label><input type="datetime-local" className="input-field" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Reminder</label><select className="input-field text-xs" value={form.reminder} onChange={e => setForm({ ...form, reminder: e.target.value })}><option value="0">At time</option><option value="15">15m before</option><option value="60">1h before</option></select></div><div><label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Color</label><div className="flex gap-2 h-8">{EVENT_COLORS.map(c => (<button type="button" key={c} onClick={() => setForm({ ...form, color: c })} className={`w-5 h-5 rounded-lg ${form.color === c ? 'ring-2 ring-white scale-110' : ''}`} style={{ background: c }} />))}</div></div></div>
              <div className="flex gap-2"><button type="button" onClick={resetForm} className="flex-1 py-2 rounded-xl border border-border text-xs">Discard</button><button type="submit" className="flex-1 neon-button py-2 text-xs">Create</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
