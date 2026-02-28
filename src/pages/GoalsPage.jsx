import { useState, useEffect } from 'react';
import { goalService, aiService } from '../services';
import { Plus, Target, Trash2, Edit3, Sparkles, X, ChevronDown, CheckCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CATEGORIES = ['personal', 'career', 'health', 'learning', 'financial'];
const CAT_ICONS = { personal: '🌟', career: '💼', health: '💪', learning: '📚', financial: '💰' };

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState(null);
  const [updateModal, setUpdateModal] = useState(null);
  const [updateValue, setUpdateValue] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'personal', target_date: '', target_value: 100, unit: '%' });

  useEffect(() => { loadGoals(); }, []);

  const loadGoals = async () => {
    try {
      const res = await goalService.getAll();
      setGoals(res.data.goals);
    } catch { toast.error('Failed to load goals'); }
    finally { setLoading(false); }
  };

  const createGoal = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error('Title required');
    try {
      const res = await goalService.create(form);
      setGoals([res.data.goal, ...goals]);
      toast.success('Goal set! 🎯');
      setShowForm(false);
      setForm({ title: '', description: '', category: 'personal', target_date: '', target_value: 100, unit: '%' });
    } catch { toast.error('Failed to create goal'); }
  };

  const updateProgress = async () => {
    if (!updateValue) return;
    try {
      const res = await goalService.update(updateModal.id, {
        current_value: Math.min(parseFloat(updateValue), updateModal.target_value),
        status: parseFloat(updateValue) >= updateModal.target_value ? 'completed' : 'active'
      });
      setGoals(goals.map(g => g.id === updateModal.id ? res.data.goal : g));
      toast.success('Progress updated! 💪');
      setUpdateModal(null);
      setUpdateValue('');
    } catch { toast.error('Failed to update'); }
  };

  const deleteGoal = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await goalService.delete(id);
      setGoals(goals.filter(g => g.id !== id));
      toast.success('Goal deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const getAISuggestions = async () => {
    setLoadingAI(true);
    try {
      const res = await aiService.suggestGoals({ timeframe: '3-month' });
      setAiSuggestions(res.data.goals);
    } catch { toast.error('AI suggestions unavailable'); }
    finally { setLoadingAI(false); }
  };

  const adoptGoal = async (suggestion) => {
    try {
      const res = await goalService.create({
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        target_value: suggestion.target_value,
        unit: suggestion.unit
      });
      setGoals([res.data.goal, ...goals]);
      toast.success('Goal adopted! 🎯');
    } catch { toast.error('Failed to adopt goal'); }
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Goals</h1>
          <p className="text-muted-foreground text-sm">{activeGoals.length} active · {completedGoals.length} completed</p>
        </div>
        <div className="flex gap-2">
          <button onClick={getAISuggestions} disabled={loadingAI} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-violet-500/30 text-violet-400 hover:bg-violet-600/10 transition-all text-sm disabled:opacity-50">
            {loadingAI ? <div className="w-4 h-4 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin" /> : <Sparkles size={15} />}
            AI Suggest
          </button>
          <button onClick={() => setShowForm(true)} className="neon-button flex items-center gap-2">
            <Plus size={16} /> New Goal
          </button>
        </div>
      </div>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <div className="glass-card p-5 border border-violet-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Sparkles size={16} className="text-violet-400" /> AI Suggested Goals</h3>
            <button onClick={() => setAiSuggestions([])} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiSuggestions.map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-violet-600/10 border border-violet-500/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">{CAT_ICONS[s.category]} {s.category}</span>
                    </div>
                  </div>
                  <button onClick={() => adoptGoal(s)} className="ml-2 text-xs text-violet-400 hover:text-violet-300 whitespace-nowrap">+ Adopt</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>
      ) : goals.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Target size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No goals yet</p>
          <button onClick={() => setShowForm(true)} className="neon-button mt-4 inline-flex items-center gap-2"><Plus size={16} /> Set a Goal</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map(goal => {
            const pct = Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);
            const isCompleted = goal.status === 'completed';
            return (
              <div key={goal.id} className={`glass-card p-5 group ${isCompleted ? 'opacity-70' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{CAT_ICONS[goal.category] || '🎯'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {isCompleted ? '✅ Done' : goal.category}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isCompleted && (
                      <button onClick={() => { setUpdateModal(goal); setUpdateValue(String(goal.current_value)); }}
                        className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground">
                        <TrendingUp size={14} />
                      </button>
                    )}
                    <button onClick={() => deleteGoal(goal.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-rose-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-foreground mb-1">{goal.title}</h3>
                {goal.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{goal.description}</p>}

                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">{goal.current_value} / {goal.target_value} {goal.unit}</span>
                    <span className={`text-sm font-bold ${isCompleted ? 'text-emerald-400' : 'text-violet-400'}`}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-violet-600 to-indigo-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {goal.target_date && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Update Modal */}
      {updateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm p-6 glow-border animate-in">
            <h2 className="font-display text-lg font-semibold text-foreground mb-1">Update Progress</h2>
            <p className="text-sm text-muted-foreground mb-5">{updateModal.title}</p>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block">Current value ({updateModal.unit})</label>
              <input type="number" className="input-field" value={updateValue} onChange={e => setUpdateValue(e.target.value)}
                min="0" max={updateModal.target_value} />
              <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all"
                  style={{ width: `${Math.min((parseFloat(updateValue || 0) / updateModal.target_value) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setUpdateModal(null)} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground transition-all">Cancel</button>
              <button onClick={updateProgress} className="flex-1 neon-button py-2.5">Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 glow-border animate-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-foreground">New Goal</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={createGoal} className="space-y-4">
              <input className="input-field" placeholder="Goal title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <textarea className="input-field resize-none h-16 text-sm" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                </select>
                <input type="date" className="input-field" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Target Value</label>
                  <input type="number" className="input-field" value={form.target_value} onChange={e => setForm({ ...form, target_value: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
                  <input className="input-field" placeholder="%, km, books..." value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground transition-all">Cancel</button>
                <button type="submit" className="flex-1 neon-button py-2.5">Set Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
