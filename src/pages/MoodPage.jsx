import { useState, useEffect } from 'react';
import { moodService, aiService } from '../services';
import { Heart, TrendingUp, Edit3, X, Check, Sparkles } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import toast from 'react-hot-toast';

const MOODS = [
  { score: 10, label: 'amazing', emoji: '🤩', color: '#10B981' },
  { score: 8, label: 'great', emoji: '😄', color: '#34D399' },
  { score: 6, label: 'good', emoji: '🙂', color: '#60A5FA' },
  { score: 5, label: 'okay', emoji: '😐', color: '#A78BFA' },
  { score: 3, label: 'bad', emoji: '😕', color: '#F59E0B' },
  { score: 1, label: 'terrible', emoji: '😢', color: '#EF4444' },
];

const EMOTIONS = ['Happy', 'Calm', 'Anxious', 'Excited', 'Sad', 'Frustrated', 'Grateful', 'Tired', 'Focused', 'Hopeful'];

export default function MoodPage() {
  const [moods, setMoods] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [editMood, setEditMood] = useState(null);
  const [editEmotions, setEditEmotions] = useState([]);
  const [editNotes, setEditNotes] = useState('');
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const todayMood = moods.find(m => m.log_date === today);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [moodsRes, statsRes] = await Promise.all([
        moodService.getAll(),
        moodService.getStats()
      ]);
      setMoods(moodsRes.data.moods);
      setStats(statsRes.data);
    } catch { toast.error('Failed to load mood data'); }
    finally { setLoading(false); }
  };

  const loadAiInsight = async () => {
    setLoadingAi(true);
    try {
      const res = await aiService.analyzeProductivity();
      setAiInsight(res.data.analysis || null);
    } catch { toast.error('Failed to generate mood insight'); }
    finally { setLoadingAi(false); }
  };

  const logMood = async () => {
    if (!selectedMood) return toast.error('Please select a mood');
    setSaving(true);
    try {
      await moodService.log({
        mood_score: selectedMood.score,
        mood_label: selectedMood.label,
        emotions: selectedEmotions,
        notes
      });
      toast.success(`Mood logged! ${selectedMood.emoji}`);
      setSelectedMood(null);
      setSelectedEmotions([]);
      setNotes('');
      await loadData();
    } catch { toast.error('Failed to log mood'); }
    finally { setSaving(false); }
  };

  const toggleEmotion = (emotion) => {
    setSelectedEmotions(prev => prev.includes(emotion) ? prev.filter(e => e !== emotion) : [...prev, emotion]);
  };

  const startEdit = (mood) => {
    setEditEntry(mood);
    setEditMood(MOODS.find(m => m.label === mood.mood_label) || null);
    setEditEmotions(mood.emotions || []);
    setEditNotes(mood.notes || '');
  };

  const saveEdit = async () => {
    if (!editMood) return toast.error('Select a mood');
    setSaving(true);
    try {
      const res = await moodService.update(editEntry.id, {
        mood_score: editMood.score,
        mood_label: editMood.label,
        emotions: editEmotions,
        notes: editNotes,
      });
      setMoods(moods.map(m => m.id === editEntry.id ? res.data.mood : m));
      setEditEntry(null);
      toast.success('Mood updated! ✅');
    } catch { toast.error('Failed to update mood'); }
    finally { setSaving(false); }
  };

  const last30 = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
  const chartData = last30.map(day => {
    const d = format(day, 'yyyy-MM-dd');
    const log = moods.find(m => m.log_date === d);
    return { date: format(day, 'MM/dd'), score: log?.mood_score || null, label: log?.mood_label };
  }).filter(d => d.score !== null);

  const distributionData = stats?.distribution ? Object.entries(stats.distribution).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Mood Tracker</h1>
        <p className="text-muted-foreground text-sm">How are you feeling today?</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Today's Mood Logging */}
          {!todayMood ? (
            <div className="glass-card p-6 glow-border">
              <h2 className="font-display font-semibold text-foreground mb-5">Log Today's Mood</h2>

              <div className="flex justify-center gap-3 mb-6 flex-wrap">
                {MOODS.map(mood => (
                  <button
                    key={mood.label}
                    onClick={() => setSelectedMood(mood)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-200 hover:scale-110
                      ${selectedMood?.label === mood.label
                        ? 'scale-125 ring-2 bg-primary/10'
                        : 'opacity-60 hover:opacity-90'
                      }`}
                    style={selectedMood?.label === mood.label ? { ringColor: 'var(--primary)' } : {}}
                  >
                    <span className="text-4xl">{mood.emoji}</span>
                    <span className="text-xs capitalize text-muted-foreground">{mood.label}</span>
                  </button>
                ))}
              </div>

              {selectedMood && (
                <div className="space-y-4 animate-in">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">How are you feeling?</label>
                    <div className="flex flex-wrap gap-2">
                      {EMOTIONS.map(e => (
                        <button key={e} onClick={() => toggleEmotion(e)}
                          className={`text-xs px-3 py-1.5 rounded-full transition-all ${selectedEmotions.includes(e)
                            ? 'bg-primary text-white shadow-[0_0_10px_var(--primary-glow)]'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                            }`}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    className="input-field resize-none h-20 text-sm"
                    placeholder="Add notes about your day... (optional)"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />

                  <button onClick={logMood} disabled={saving} className="w-full neon-button py-3 flex items-center justify-center gap-2">
                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>
                      <Heart size={16} /> Save Mood {selectedMood.emoji}
                    </>}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-5 border" style={{ borderColor: MOODS.find(m => m.label === todayMood.mood_label)?.color + '20' }}>
              <div className="flex items-center gap-4">
                <span className="text-5xl">{MOODS.find(m => m.label === todayMood.mood_label)?.emoji || '😊'}</span>
                <div>
                  <p className="font-semibold text-foreground capitalize">Feeling {todayMood.mood_label} today</p>
                  <p className="text-sm text-muted-foreground">Score: {todayMood.mood_score}/10</p>
                  {todayMood.emotions?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {todayMood.emotions.map(e => <span key={e} className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{e}</span>)}
                    </div>
                  )}
                </div>
              </div>
              {todayMood.notes && <p className="mt-3 text-sm text-muted-foreground italic">&ldquo;{todayMood.notes}&rdquo;</p>}
            </div>
          )}

          {/* Stats Row */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <div className="stat-card text-center">
                <p className="text-3xl font-bold gradient-text">{stats.average || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg Score</p>
              </div>
              <div className="stat-card text-center">
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">Days Tracked</p>
              </div>
              <div className="stat-card text-center">
                <p className="text-3xl font-bold text-foreground">
                  {stats.average >= 7 ? '🌟' : stats.average >= 5 ? '😊' : '💙'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.average >= 7 ? 'Thriving' : stats.average >= 5 ? 'Stable' : 'Needs care'}
                </p>
              </div>
            </div>
          )}

          {/* Mood Chart */}
          {chartData.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                30-Day Mood Trend
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} 
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
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value, name, props) => [`Score: ${value} (${props.payload.label})`, 'Mood']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#F43F5E" 
                    fill="#F43F5E" 
                    fillOpacity={0.1}
                    strokeWidth={2} 
                    dot={{ fill: '#F43F5E', r: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* AI Mood vs Productivity Insight */}
          <div className="glass-card p-5 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                AI Mood Analysis
              </h2>
              {!aiInsight && !loadingAi && (
                <button onClick={loadAiInsight} className="neon-button text-xs py-1.5 px-3 flex items-center gap-1">
                  Analyze Data
                </button>
              )}
            </div>

            {loadingAi ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground animate-pulse">Gemini is looking for patterns...</p>
              </div>
            ) : aiInsight ? (
              <div className="space-y-4 animate-in">
                {aiInsight.patterns && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-sm text-foreground leading-relaxed">{aiInsight.patterns}</p>
                  </div>
                )}
                {aiInsight.recommendations && (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Recommendation</h4>
                    <p className="text-sm text-foreground leading-relaxed">{aiInsight.recommendations}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Click Analyze to find correlations between your mood, habits, and tasks.
              </p>
            )}
          </div>

          {/* Recent mood log */}
          <div className="glass-card p-5">
            <h2 className="font-display font-semibold text-foreground mb-4">Recent Entries</h2>
            <div className="space-y-3">
              {moods.slice(0, 10).map(mood => (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 group">
                  <span className="text-2xl">{MOODS.find(m => m.label === mood.mood_label)?.emoji || '😊'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground capitalize">{mood.mood_label}</span>
                      <span className="text-xs text-muted-foreground">Score: {mood.mood_score}/10</span>
                    </div>
                    {mood.emotions?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {mood.emotions.slice(0, 4).map(e => <span key={e} className="text-xs text-muted-foreground">{e}</span>).reduce((acc, el, i) => i === 0 ? [el] : [...acc, <span key={`s${i}`} className="text-muted-foreground">·</span>, el], [])}
                      </div>
                    )}
                    {mood.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate italic">"{mood.notes}"</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(mood.log_date), 'MMM d')}</span>
                  <button onClick={() => startEdit(mood)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-primary transition-all">
                    <Edit3 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Edit Mood Modal */}
      {editEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 glow-border animate-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-foreground">Edit Mood Entry</h2>
              <button onClick={() => setEditEntry(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground"><X size={18} /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{format(new Date(editEntry.log_date), 'MMMM d, yyyy')}</p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {MOODS.map(m => (
                <button key={m.label} onClick={() => setEditMood(m)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${editMood?.label === m.label 
                    ? 'border-primary/50 bg-primary/20' 
                    : 'border-border hover:border-primary/30'
                  }`}>
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-xs text-foreground capitalize">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-2 block">Emotions</label>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map(e => (
                  <button key={e} onClick={() => setEditEmotions(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])}
                    className={`text-xs px-3 py-1.5 rounded-full transition-all ${editEmotions.includes(e) ? 'bg-primary text-white border border-primary/30' : 'bg-secondary text-muted-foreground border border-border'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <textarea className="input-field resize-none mb-4" rows={3} placeholder="How are you feeling?..."
              value={editNotes} onChange={e => setEditNotes(e.target.value)} />

            <div className="flex gap-3">
              <button onClick={() => setEditEntry(null)} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground transition-all">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 neon-button py-2.5 disabled:opacity-50">
                {saving ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" /></span> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
