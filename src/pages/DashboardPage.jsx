import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService, aiService } from '../services';
import { format } from 'date-fns';
import {
  CheckSquare, Target, Flame, Heart, BookOpen, Calendar,
  TrendingUp, Sparkles, ArrowRight, Clock, AlertCircle, RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await dashboardService.getData();
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
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

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const moodEmojis = { great: '😄', good: '🙂', okay: '😐', bad: '😕', terrible: '😢' };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );

  const { taskStats, todayEvents, moodTrend, habits, goals, recentJournals } = data || {};
  const completionRate = taskStats?.total ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {greeting()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> ✨
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <button
          onClick={loadDashboard}
          className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: CheckSquare, label: 'Total Tasks', value: taskStats?.total || 0, color: 'violet', link: '/tasks' },
          { icon: CheckSquare, label: 'Completed', value: taskStats?.completed || 0, color: 'emerald', link: '/tasks' },
          { icon: AlertCircle, label: 'Overdue', value: taskStats?.overdue || 0, color: 'rose', link: '/tasks' },
          { icon: Target, label: 'Active Goals', value: goals?.filter(g => g.status === 'active').length || 0, color: 'amber', link: '/goals' },
        ].map(({ icon: Icon, label, value, color, link }) => (
          <Link key={label} to={link} className="stat-card cursor-pointer">
            <div className={`inline-flex p-2 rounded-lg bg-${color}-500/15 mb-3`}>
              <Icon size={18} className={`text-${color}-400`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mood Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <TrendingUp size={18} className="text-violet-400" />
              Mood Trend
            </h2>
            <Link to="/mood" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {moodTrend && moodTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={moodTrend}>
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="log_date" tick={{ fontSize: 11, fill: '#666' }} tickFormatter={d => format(new Date(d), 'MM/dd')} />
                <YAxis domain={[1, 10]} tick={{ fontSize: 11, fill: '#666' }} width={20} />
                <Tooltip
                  contentStyle={{ background: 'hsl(224,20%,9%)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', fontSize: '12px' }}
                  labelFormatter={d => format(new Date(d), 'MMM d')}
                />
                <Area type="monotone" dataKey="mood_score" stroke="#8B5CF6" strokeWidth={2} fill="url(#moodGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="text-center">
                <Heart size={32} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No mood data yet</p>
                <Link to="/mood" className="text-xs text-violet-400 mt-1 block">Start tracking →</Link>
              </div>
            </div>
          )}
        </div>

        {/* Today's Events */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Calendar size={18} className="text-indigo-400" />
              Today
            </h2>
            <Link to="/calendar" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View <ArrowRight size={12} />
            </Link>
          </div>
          {todayEvents && todayEvents.length > 0 ? (
            <div className="space-y-3">
              {todayEvents.slice(0, 4).map(event => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <div className="w-2 h-full min-h-8 rounded-full flex-shrink-0" style={{ background: event.color }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={10} />
                      {format(new Date(event.start_time), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <div className="text-center">
                <Calendar size={28} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Free day! 🎉</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Habits + Goals row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habits Today */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Flame size={18} className="text-orange-400" />
              Today's Habits
            </h2>
            <Link to="/habits" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          {habits && habits.length > 0 ? (
            <div className="space-y-2">
              {habits.slice(0, 5).map(habit => (
                <div key={habit.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${habit.completed_today ? 'opacity-100' : 'opacity-50'}`}
                    style={{ background: habit.completed_today ? habit.color + '30' : 'transparent', border: `1px solid ${habit.color}40` }}>
                    {habit.completed_today ? '✅' : habit.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${habit.completed_today ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {habit.name}
                    </p>
                    <p className="text-xs text-muted-foreground">🔥 {habit.current_streak} day streak</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No habits yet</p>
                <Link to="/habits" className="text-xs text-violet-400 mt-1 block">Create habits →</Link>
              </div>
            </div>
          )}
        </div>

        {/* Goals Progress */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Target size={18} className="text-amber-400" />
              Goals Progress
            </h2>
            <Link to="/goals" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              All goals <ArrowRight size={12} />
            </Link>
          </div>
          {goals && goals.filter(g => g.status === 'active').length > 0 ? (
            <div className="space-y-4">
              {goals.filter(g => g.status === 'active').slice(0, 4).map(goal => {
                const pct = Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{goal.title}</p>
                      <span className="text-xs text-muted-foreground ml-2">{pct}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No active goals</p>
                <Link to="/goals" className="text-xs text-violet-400 mt-1 block">Set goals →</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Insight Panel */}
      <div className="glass-card p-5 glow-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Sparkles size={18} className="text-violet-400" />
            AI Productivity Insights
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/20">Powered by Gemini</span>
          </h2>
          <button
            onClick={getAIAnalysis}
            disabled={loadingAI}
            className="text-xs neon-button py-1.5 px-3 disabled:opacity-50"
          >
            {loadingAI ? (
              <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Analyze'}
          </button>
        </div>

        {aiAnalysis ? (
          <div className="prose prose-invert max-w-none">
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-violet-600/10 border border-violet-500/20">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 animate-[float_3s_ease-in-out_infinite]">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Get personalized insights</p>
              <p className="text-xs text-muted-foreground">Click Analyze to get AI-powered productivity analysis based on your data.</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Journal */}
      {recentJournals && recentJournals.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <BookOpen size={18} className="text-rose-400" />
              Recent Journal Entries
            </h2>
            <Link to="/journal" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentJournals.map(entry => (
              <div key={entry.id} className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
                <p className="text-sm font-medium text-foreground truncate">{entry.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(entry.entry_date), 'MMM d, yyyy')}</p>
                {entry.mood && <p className="text-lg mt-1">{moodEmojis[entry.mood] || '📝'}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
