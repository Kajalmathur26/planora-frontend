import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService, aiService } from '../services';
import { format } from 'date-fns';
import {
  CheckSquare, Target, Flame, Heart, BookOpen, Calendar,
  TrendingUp, Sparkles, ArrowRight, Clock, AlertCircle, RefreshCw,
  BarChart2, StickyNote, Save, Plus, X, GripVertical, Maximize2, Minimize2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { useNotifications } from '../hooks/useNotifications';
import toast from 'react-hot-toast';

// DND Kit Imports
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function DashboardPage() {
  const { user } = useAuth();
  useNotifications(user);
  const [data, setData] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [notes, setNotes] = useState(() => localStorage.getItem('planora_sticky_notes') || '');
  const [activeWidgetId, setActiveWidgetId] = useState(null);

  // Widget ordering state
  const [widgetOrder, setWidgetOrder] = useState(() => {
    const saved = localStorage.getItem('planora_dashboard_order');
    return saved ? JSON.parse(saved) : [
      'moodTrend', 'todayEvents', 
      'habits', 'goals', 
      'aiInsights', 'aiPlan', 
      'weeklyReport', 'scratchpad', 
      'recentJournals'
    ];
  });

  // Widget sizes state (1 col vs 2 cols)
  const [widgetSizes, setWidgetSizes] = useState(() => {
    const saved = localStorage.getItem('planora_dashboard_sizes');
    return saved ? JSON.parse(saved) : {
      moodTrend: 'large',
      recentJournals: 'large'
    };
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [res, weeklyRes] = await Promise.all([
        dashboardService.getData(),
        dashboardService.getWeeklyReport()
      ]);
      setData(res.data);
      setWeeklyReport(weeklyRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = () => {
    localStorage.setItem('planora_sticky_notes', notes);
    toast.success('Notes saved');
  };

  const toggleWidgetSize = (id) => {
    setWidgetSizes(prev => {
      const newSizes = { ...prev, [id]: prev[id] === 'large' ? 'small' : 'large' };
      localStorage.setItem('planora_dashboard_sizes', JSON.stringify(newSizes));
      return newSizes;
    });
  };

  const getAIAnalysis = async () => {
    setLoadingAI(true);
    try {
      const res = await aiService.analyzeProductivity();
      setAiAnalysis(res.data.analysis);
    } catch (err) {
      toast.error('AI analysis unavailable');
    } finally {
      setLoadingAI(false);
    }
  };

  const getAIPlan = async () => {
    setLoadingPlan(true);
    try {
      const res = await aiService.planMyDay();
      setAiPlan(res.data.schedule);
      toast.success('Daily plan ready! 📅');
    } catch { toast.error('Failed to generate plan'); }
    finally { setLoadingPlan(false); }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const moodEmojis = { great: '😄', good: '🙂', okay: '😐', bad: '😕', terrible: '😢' };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveWidgetId(null);
    if (active.id !== over?.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('planora_dashboard_order', JSON.stringify(newOrder));
        return newOrder;
      });
      toast.success('Dashboard layout saved! 💾', { id: 'dnd-success' });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const { todayEvents, moodTrend, habits, goals, recentJournals, taskStats } = data || {};

  // Widget Renderers
  const renderWidget = (id) => {
    const isLarge = widgetSizes[id] === 'large';
    const wrapperProps = {
      id,
      title: WIDGET_TITLES[id] || id,
      icon: getWidgetIcon(id),
      link: getWidgetLink(id),
      isLarge,
      onToggleSize: () => toggleWidgetSize(id)
    };

    switch (id) {
      case 'moodTrend':
        return (
          <WidgetWrapper {...wrapperProps}>
            {moodTrend && moodTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={moodTrend}>
                  <XAxis 
                    dataKey="log_date" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} 
                    tickFormatter={d => format(new Date(d), 'MM/dd')} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    domain={[1, 10]} 
                    tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} 
                    width={20} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))', 
                      borderRadius: '8px', 
                      fontSize: '11px',
                      color: 'hsl(var(--foreground))'
                    }} 
                    formatter={(value, name, props) => [`Score: ${value} (${props.payload.mood_label})`, 'Mood']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="mood_score" 
                    stroke="#F43F5E" 
                    fill="#F43F5E" 
                    fillOpacity={0.1} 
                    strokeWidth={2} 
                    dot={{ fill: '#F43F5E', r: 2 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-center opacity-50 italic">
                <div><Heart size={32} className="mx-auto mb-2" /><p className="text-xs">No data yet</p></div>
              </div>
            )}
          </WidgetWrapper>
        );
      case 'todayEvents':
        return (
          <WidgetWrapper {...wrapperProps}>
            <div className="h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {todayEvents && todayEvents.length > 0 ? (
                <div className="space-y-2">
                  {todayEvents.map(event => (
                    <div key={event.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                      <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: event.color }} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{event.title}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Clock size={10} /> {format(new Date(event.start_time), 'h:mm a')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center opacity-50 italic text-xs">Free day! 🎉</div>
              )}
            </div>
          </WidgetWrapper>
        );
      case 'habits':
        return (
          <WidgetWrapper {...wrapperProps}>
            <div className="h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {habits && habits.length > 0 ? (
                <div className="space-y-2">
                  {habits.map(habit => (
                    <div key={habit.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${habit.completed_today ? 'bg-primary/5 border-primary/20 opacity-70' : 'bg-secondary/30 border-border/50'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${habit.completed_today ? 'bg-primary/20' : 'bg-white/5'}`}
                        style={{ border: habit.completed_today ? `1px solid ${habit.color}60` : '1px solid var(--border)' }}>
                        {habit.completed_today ? '✅' : habit.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${habit.completed_today ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{habit.name}</p>
                        <p className="text-[10px] text-muted-foreground">🔥 {habit.current_streak}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center italic opacity-50 text-xs">No habits logged</div>
              )}
            </div>
          </WidgetWrapper>
        );
      case 'goals':
        return (
          <WidgetWrapper {...wrapperProps}>
            <div className="h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {goals && goals.filter(g => g.status === 'active').length > 0 ? (
                <div className="space-y-4 pt-1">
                  {goals.filter(g => g.status === 'active').map(goal => {
                    const pct = Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);
                    return (
                      <div key={goal.id}>
                        <div className="flex justify-between items-center mb-1.5 px-1">
                          <p className="text-[11px] font-bold text-foreground truncate pr-4">{goal.title}</p>
                          <span className="text-[10px] font-mono text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary shadow-[0_0_10px_var(--primary-glow)]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center italic opacity-50 text-xs">No active goals</div>
              )}
            </div>
          </WidgetWrapper>
        );
      case 'aiInsights':
        return (
          <WidgetWrapper {...wrapperProps} customAction={
            <button onClick={getAIAnalysis} disabled={loadingAI} className="text-[10px] neon-button py-1 px-2.5 disabled:opacity-50">
              {loadingAI ? '...' : 'Analyze'}
            </button>
          }>
            <div className="h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {aiAnalysis ? <p className="text-[11px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p> : <div className="h-full flex flex-col items-center justify-center opacity-60"><Sparkles size={24} className="mb-2 text-primary" /><p className="text-[10px]">Get AI Insights</p></div>}
            </div>
          </WidgetWrapper>
        );
      case 'aiPlan':
        return (
          <WidgetWrapper {...wrapperProps} customAction={
            aiPlan ? <button onClick={() => setAiPlan(null)} className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground"><X size={12} /></button>
            : <button onClick={getAIPlan} disabled={loadingPlan} className="text-[10px] bg-primary/20 text-primary py-1 px-2.5 rounded-lg font-bold border border-primary/30">{loadingPlan ? '...' : 'Plan'}</button>
          }>
            <div className="h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {aiPlan ? (
                <div className="space-y-2">
                  {aiPlan.map((block, i) => <div key={i} className="flex gap-2.5 items-start border-l-2 border-primary/20 pl-2.5 py-0.5"><span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap pt-1">{block.time}</span><div className="min-w-0"><p className="text-xs font-bold text-foreground truncate">{block.emoji} {block.activity}</p></div></div>)}
                </div>
              ) : <div className="h-full flex items-center justify-center opacity-40 italic text-xs">No plan today</div>}
            </div>
          </WidgetWrapper>
        );
      case 'weeklyReport':
        return (
          <WidgetWrapper {...wrapperProps}>
             {weeklyReport && weeklyReport.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyReport.data} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={d => format(new Date(d), 'EEE')} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '9px' }} />
                  <Bar dataKey="completed" fill="#10b981" radius={[2, 2, 0, 0]} name="Done" barSize={12} />
                  <Bar dataKey="added" fill="#8b5cf6" radius={[2, 2, 0, 0]} name="New" barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-40 flex items-center justify-center italic opacity-50 text-xs">Limited activity</div>}
          </WidgetWrapper>
        );
      case 'scratchpad':
        return (
          <WidgetWrapper {...wrapperProps} customAction={<button onClick={saveNotes} className="p-1 rounded-lg hover:bg-amber-500/10 text-amber-500"><Save size={14} /></button>}>
            <textarea className="w-full h-[160px] bg-transparent border-none resize-none focus:outline-none focus:ring-0 text-xs text-foreground font-mono custom-scrollbar" placeholder="Notes..." value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes}/>
          </WidgetWrapper>
        );
      case 'recentJournals':
        return (
          <WidgetWrapper {...wrapperProps}>
            <div className={`grid gap-3 ${isLarge ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {recentJournals && recentJournals.slice(0, isLarge ? 3 : 2).map(entry => (
                <div key={entry.id} className="p-3 rounded-2xl bg-secondary/30 border border-border/50 flex items-start gap-4">
                  <div className="text-xl mt-1">{moodEmojis[entry.mood] || '📝'}</div>
                  <div className="min-w-0"><p className="text-xs font-bold text-foreground truncate">{entry.title}</p><p className="text-[10px] text-muted-foreground mt-1">{format(new Date(entry.entry_date), 'MMM d')}</p></div>
                </div>
              ))}
            </div>
          </WidgetWrapper>
        );
      default:
        return null;
    }
  };

  const WIDGET_TITLES = { moodTrend: 'Mood Trend', todayEvents: "Today's Events", habits: "Today's Habits", goals: 'Goals Progress', aiInsights: 'AI Insights', aiPlan: 'AI Plan', weeklyReport: 'Weekly Report', scratchpad: 'Scratchpad', recentJournals: 'Recent Journals' };
  const getWidgetIcon = (id) => {
    switch(id) {
      case 'moodTrend': return <TrendingUp size={18} className="text-primary" />;
      case 'todayEvents': return <Calendar size={18} className="text-blue-400" />;
      case 'habits': return <Flame size={18} className="text-orange-400" />;
      case 'goals': return <Target size={18} className="text-amber-400" />;
      case 'aiInsights': return <Sparkles size={18} className="text-primary" />;
      case 'aiPlan': return <Calendar size={18} className="text-indigo-400" />;
      case 'weeklyReport': return <BarChart2 size={18} className="text-emerald-400" />;
      case 'scratchpad': return <StickyNote size={18} className="text-amber-400" />;
      case 'recentJournals': return <BookOpen size={18} className="text-rose-400" />;
      default: return null;
    }
  };
  const getWidgetLink = (id) => {
    switch(id) {
      case 'moodTrend': return '/mood';
      case 'todayEvents': return '/calendar';
      case 'habits': return '/habits';
      case 'goals': return '/goals';
      case 'recentJournals': return '/journal';
      default: return null;
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(e) => setActiveWidgetId(e.active.id)} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div><h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{greeting()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> ✨</h1><p className="text-muted-foreground mt-1 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p></div>
          <button onClick={loadDashboard} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground border border-border/40"><RefreshCw size={18} className={loading ? 'animate-spin text-primary' : ''} /></button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ icon: CheckSquare, label: 'Tasks', value: taskStats?.total || 0, color: 'primary', link: '/tasks' }, { icon: Sparkles, label: 'Done', value: taskStats?.completed || 0, color: 'emerald', link: '/tasks' }, { icon: AlertCircle, label: 'Late', value: taskStats?.overdue || 0, color: 'rose', link: '/tasks' }, { icon: Target, label: 'Goals', value: goals?.filter(g => g.status === 'active').length || 0, color: 'amber', link: '/goals' }].map(({ icon: Icon, label, value, color, link }) => (
            <Link key={label} to={link} className="stat-card group hover:scale-[1.02] transition-transform"><div className={`p-2 rounded-xl mb-3 w-fit ${color === 'primary' ? 'bg-primary/10' : `bg-${color}-500/10`}`}><Icon size={18} className={color === 'primary' ? 'text-primary' : `text-${color}-400`} /></div><p className="text-2xl font-display font-bold text-foreground">{value}</p><p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 opacity-70">{label}</p></Link>
          ))}
        </div>

        <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {widgetOrder.map((id) => (
              <div key={id} className={widgetSizes[id] === 'large' ? 'lg:col-span-2' : ''}>
                {renderWidget(id)}
              </div>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeWidgetId ? <div className="opacity-80 scale-[1.02] rotate-1 shadow-2xl pointer-events-none w-full max-w-[500px]">{renderWidget(activeWidgetId)}</div> : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

function WidgetWrapper({ id, title, icon, link, customAction, isLarge, onToggleSize, children, className = "" }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.2 : 1, zIndex: isDragging ? 100 : 'auto' };

  return (
    <div ref={setNodeRef} style={style} className={`glass-card p-6 group flex flex-col min-h-[260px] ${className} relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground/20 hover:text-primary p-1 -ml-2"><GripVertical size={16} /></div>
          <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-2">{icon}{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {customAction}
          <button onClick={onToggleSize} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all" title={isLarge ? "Reduce Size" : "Expand Size"}>
            {isLarge ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          {link && <Link to={link} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary group-hover:scale-110"><ArrowRight size={14} /></Link>}
        </div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
      <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-primary/5 blur-2xl rounded-full" />
    </div>
  );
}
