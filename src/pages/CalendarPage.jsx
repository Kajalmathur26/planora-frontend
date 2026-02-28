import { useState, useEffect } from 'react';
import { eventService } from '../services';
import { ChevronLeft, ChevronRight, Plus, X, Clock, MapPin } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isToday } from 'date-fns';
import toast from 'react-hot-toast';

const EVENT_COLORS = ['#8B5CF6', '#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState('month');
  const [form, setForm] = useState({
    title: '', description: '', start_time: '', end_time: '',
    color: '#8B5CF6', location: '', is_all_day: false
  });

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      const start = format(startOfMonth(currentDate), "yyyy-MM-dd'T'00:00:00");
      const end = format(endOfMonth(currentDate), "yyyy-MM-dd'T'23:59:59");
      const res = await eventService.getAll({ start_date: start, end_date: end });
      setEvents(res.data.events);
    } catch {
      toast.error('Failed to load events');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!form.title || !form.start_time) return toast.error('Title and start time required');
    try {
      const res = await eventService.create(form);
      setEvents([...events, res.data.event]);
      toast.success('Event created!');
      setShowForm(false);
      setForm({ title: '', description: '', start_time: '', end_time: '', color: '#8B5CF6', location: '', is_all_day: false });
    } catch {
      toast.error('Failed to create event');
    }
  };

  const deleteEvent = async (id) => {
    try {
      await eventService.delete(id);
      setEvents(events.filter(e => e.id !== id));
      toast.success('Event deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const calDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate))
  });

  const dayEvents = (day) => events.filter(e => isSameDay(new Date(e.start_time), day));
  const selectedDayEvents = events.filter(e => isSameDay(new Date(e.start_time), selectedDay));

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const openFormForDay = (day) => {
    setSelectedDay(day);
    const dateStr = format(day, "yyyy-MM-dd'T'09:00");
    setForm(f => ({ ...f, start_time: dateStr }));
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground text-sm">{events.length} events this month</p>
        </div>
        <button onClick={() => setShowForm(true)} className="neon-button flex items-center gap-2">
          <Plus size={16} /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="xl:col-span-3 glass-card p-5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-semibold text-foreground">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 rounded-lg text-xs bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 transition-colors">
                Today
              </button>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-xs text-muted-foreground text-center py-2 font-medium">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {calDays.map(day => {
              const dayEvts = dayEvents(day);
              const isSelected = isSameDay(day, selectedDay);
              const isCurrent = isToday(day);
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  onDoubleClick={() => openFormForDay(day)}
                  className={`min-h-[72px] p-1.5 rounded-xl cursor-pointer transition-all group
                    ${isSelected ? 'bg-violet-600/20 ring-1 ring-violet-500/40' : 'hover:bg-white/5'}
                    ${!isCurrentMonth ? 'opacity-30' : ''}`}
                >
                  <div className={`text-xs font-medium w-7 h-7 flex items-center justify-center rounded-lg mb-1
                    ${isCurrent ? 'bg-violet-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvts.slice(0, 2).map(evt => (
                      <div
                        key={evt.id}
                        className="text-xs px-1 py-0.5 rounded truncate"
                        style={{ background: evt.color + '30', color: evt.color, border: `1px solid ${evt.color}40` }}
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayEvts.length > 2 && (
                      <div className="text-xs text-muted-foreground pl-1">+{dayEvts.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Sidebar */}
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">
            {format(selectedDay, 'MMMM d')}
          </h3>
          {selectedDayEvents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No events</p>
              <button onClick={() => openFormForDay(selectedDay)} className="text-xs text-violet-400 mt-2">
                + Add event
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayEvents.map(evt => (
                <div key={evt.id} className="p-3 rounded-xl" style={{ background: evt.color + '15', border: `1px solid ${evt.color}30` }}>
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-foreground">{evt.title}</p>
                    <button onClick={() => deleteEvent(evt.id)} className="text-muted-foreground hover:text-rose-400 transition-colors ml-2">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={11} />
                      {format(new Date(evt.start_time), 'h:mm a')}
                      {evt.end_time && ` - ${format(new Date(evt.end_time), 'h:mm a')}`}
                    </p>
                    {evt.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={11} />{evt.location}</p>}
                  </div>
                  {evt.description && <p className="text-xs text-muted-foreground mt-2">{evt.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 glow-border animate-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-foreground">New Event</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <input className="input-field" placeholder="Event title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <textarea className="input-field resize-none h-16 text-sm" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <input className="input-field" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Start *</label>
                  <input type="datetime-local" className="input-field text-sm" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">End</label>
                  <input type="datetime-local" className="input-field text-sm" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Color</label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map(c => (
                    <button type="button" key={c} onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-all text-sm">Cancel</button>
                <button type="submit" className="flex-1 neon-button py-2.5">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
