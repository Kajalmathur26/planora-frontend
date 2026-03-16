import { useState, useEffect } from 'react';
import { goalService, aiService, taskService } from '../services';
import {
  Target, Plus, Trash2, ChevronDown, ChevronUp, Sparkles, Check,
  X, Zap, Calendar, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CATEGORIES = ['personal', 'work', 'health', 'education', 'finance', 'relationships', 'other'];
const STATUS_COLORS = { 
  active: 'text-primary', 
  completed: 'text-emerald-400', 
  paused: 'text-amber-400' 
};

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState({});
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [suggestingAI, setSuggestingAI] = useState(false);
  const [milestoneInputs, setMilestoneInputs] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', category: 'personal', target_date: '', target_value: 100, unit: '%' });

  useEffect(() => { loadGoals(); }, []);

  const loadGoals = async () => {
    try {
      const res = await goalService.getAll();
      setGoals(res.data.goals);
    } catch { toast.error('Failed to load goals'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error('Title is required');
    try {
      const res = await goalService.create(form);
      setGoals([res.data.goal, ...goals]);
      setShowForm(false);
      setForm({ title: '', description: '', category: 'personal', target_date: '', target_value: 100, unit: '%' });
      toast.success('Goal created! 🎯');
    } catch { toast.error('Failed to create goal'); }
  };

  const handleUpdateStatus = async (goal, newStatus) => {
    try {
      const res = await goalService.update(goal.id, { status: newStatus });
      setGoals(goals.map(g => g.id === goal.id ? { ...g, ...res.data.goal } : g));
      toast.success(`Goal ${newStatus}!`);
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await goalService.delete(id);
      setGoals(goals.filter(g => g.id !== id));
      toast.success('Goal deleted');
    } catch { toast.error('Failed to delete goal'); }
  };

  const handleAddMilestone = async (goalId) => {
    const title = milestoneInputs[goalId]?.trim();
    if (!title) return;
    try {
      const res = await goalService.addMilestone(goalId, { title });
      updateGoalWithMilestones(goalId, (g) => [...(g.goal_milestones || []), res.data.milestone]);
      setMilestoneInputs({ ...milestoneInputs, [goalId]: '' });
      toast.success('Sub-goal added!');
    } catch { toast.error('Failed to add sub-goal'); }
  };

  const handleToggleMilestone = async (goalId, milestoneId, currentCompleted) => {
    try {
      await goalService.toggleMilestone(milestoneId, !currentCompleted);
      updateGoalWithMilestones(goalId, (g) => 
        g.goal_milestones.map(m => m.id === milestoneId ? { ...m, completed: !currentCompleted } : m)
      );
    } catch { toast.error('Failed to update'); }
  };

  const handleDeleteMilestone = async (goalId, milestoneId) => {
    try {
      await goalService.deleteMilestone(milestoneId);
      updateGoalWithMilestones(goalId, (g) => 
        g.goal_milestones.filter(m => m.id !== milestoneId)
      );
    } catch { toast.error('Failed to delete sub-goal'); }
  };

  const updateGoalWithMilestones = (goalId, milestoneUpdater) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const milestones = milestoneUpdater(g);
      const total = milestones.length;
      const completed = milestones.filter(m => m.completed).length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      const newStatus = progress >= 100 ? 'completed' : 'active';
      const statusChanged = g.status !== newStatus;

      if (statusChanged && newStatus === 'completed') {
        toast.success('🎉 Goal completed by milestones!');
      } else if (statusChanged && newStatus === 'active' && g.status === 'completed') {
        toast.success('Goal reactivated (sub-goal unchecked)');
      }

      return { 
        ...g, 
        goal_milestones: milestones, 
        milestone_count: total, 
        milestone_completed: completed, 
        milestone_progress: progress,
        current_value: progress,
        status: newStatus
      };
    }));
  };

  const handleAISuggest = async () => {
    setSuggestingAI(true);
    try {
      const tasksRes = await taskService.getAll({ status: 'pending' });
      const aiRes = await aiService.suggestGoals({ 
        context: 'suggest 3 new goals', 
        current_goals: goals.map(g => g.title), 
        tasks: tasksRes.data.tasks.map(t => t.title) 
      });
      setAiSuggestions(aiRes.data.goals || []);
    } catch { toast.error('AI failed to suggest goals'); }
    finally { setSuggestingAI(false); }
  };

  const addSuggestedGoal = async (suggestion) => {
    try {
      const res = await goalService.create({ 
        title: suggestion.title, 
        description: suggestion.description || '', 
        category: suggestion.category || 'personal', 
        target_value: 100, 
        unit: '%' 
      });
      setGoals([res.data.goal, ...goals]);
      setAiSuggestions(aiSuggestions.filter(s => s.title !== suggestion.title));
      toast.success('Goal added! 🎯');
    } catch { toast.error('Failed to add goal'); }
  };

  const toggleExpand = (id) => setExpandedGoals(prev => ({ ...prev, [id]: !prev[id] }));

  const progressPercent = (g) => {
    if (g.milestone_count > 0) return Math.min(Math.round((g.milestone_completed / g.milestone_count) * 100), 100);
    return Math.min(Math.round((g.current_value / g.target_value) * 100), 100);
  };

  const filteredGoals = activeTab === 'all' ? goals : goals.filter(g => g.status === activeTab);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Goals</h1>
          <p className="text-muted-foreground text-sm">Automated tracking across {goals.length} objectives</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAISuggest} disabled={suggestingAI}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all text-sm disabled:opacity-50">
            {suggestingAI ? <TrendingUp size={15} className="animate-pulse" /> : <Sparkles size={15} />}
            AI Suggest
          </button>
          <button onClick={() => setShowForm(true)} className="neon-button flex items-center gap-2">
            <Plus size={16} /> New Goal
          </button>
        </div>
      </div>

      {aiSuggestions.length > 0 && (
        <div className="glass-card p-5 border border-primary/20 animate-in">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
            <Sparkles size={16} className="text-primary" /> AI Suggested Goals
          </h2>
          <div className="space-y-2">
            {aiSuggestions.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                </div>
                <button onClick={() => addSuggestedGoal(s)} className="ml-3 flex-shrink-0 p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/40 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="inline-flex p-2 rounded-lg bg-primary/10 mb-3">
            <Target size={18} className="text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{goals.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Goals</p>
        </div>
        <div className="stat-card">
          <div className="inline-flex p-2 rounded-lg bg-amber-500/10 mb-3">
            <Zap size={18} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{goals.filter(g => g.status === 'active').length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Active</p>
        </div>
        <div className="stat-card">
          <div className="inline-flex p-2 rounded-lg bg-emerald-500/10 mb-3">
            <Check size={18} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{goals.filter(g => g.status === 'completed').length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
        </div>
        <div className="stat-card">
          <div className="inline-flex p-2 rounded-lg bg-primary/10 mb-3">
            <TrendingUp size={18} className="text-primary" />
          </div>
          <p className="text-2xl font-bold text-primary">
            {goals.length > 0 
              ? Math.round(goals.reduce((acc, g) => acc + progressPercent(g), 0) / goals.length) 
              : 0}%
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Avg. Progress</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border/50 pb-1">
        {[
          { id: 'all', label: 'All Goals' },
          { id: 'active', label: 'Active' },
          { id: 'completed', label: 'Completed' },
          { id: 'paused', label: 'Paused' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-all relative ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
        ))}
      </div>

      {filteredGoals.length === 0 ? (
        <div className="text-center py-16 glass-card">
          <Target size={48} className="text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-foreground font-medium mb-1">No goals found</p>
          <p className="text-xs text-muted-foreground">Start by defining what you want to achieve.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGoals.map(goal => {
            const isExpanded = expandedGoals[goal.id];
            const milestones = goal.goal_milestones || [];
            const progress = progressPercent(goal);
            
            return (
              <div key={goal.id} className="glass-card overflow-hidden group hover:border-primary/20 transition-all border-border/50">
                <div className="p-5">
                  <div className="flex flex-col gap-1 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 ${STATUS_COLORS[goal.status] || 'text-primary'}`}>
                        {goal.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full capitalize">{goal.category}</span>
                      {goal.target_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                          <Calendar size={10} />{format(new Date(goal.target_date + 'T00:00:00'), 'dd MMM yyyy')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{goal.title}</h3>
                        {goal.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>}
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleUpdateStatus(goal, goal.status === 'paused' ? 'active' : 'paused')}
                          className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${goal.status === 'paused' ? 'text-emerald-400' : 'text-muted-foreground hover:text-amber-400'}`}
                          title={goal.status === 'paused' ? 'Resume Goal' : 'Pause Goal'}>
                          <Zap size={14} />
                        </button>
                        <button onClick={() => toggleExpand(goal.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-rose-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex justify-between items-end mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                          {milestones.slice(0, 5).map((m, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full border border-background ${m.completed ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
                          ))}
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-tight ml-1">
                          {goal.milestone_count > 0 
                            ? `${goal.milestone_completed}/${goal.milestone_count} Sub-goals` 
                            : `${goal.current_value}/${goal.target_value} ${goal.unit}`}
                        </span>
                      </div>
                      <span className={`text-xs font-bold ${progress >= 100 ? 'text-primary' : 'text-muted-foreground'}`}>{progress}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border/10">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-gradient-to-r from-primary to-accent' : 'bg-primary'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border/50 animate-in">
                      <div className="flex items-center justify-between mb-3 text-[10px]">
                        <p className="text-muted-foreground font-bold uppercase tracking-wider">Sub-Goals (Automated)</p>
                      </div>

                      {milestones.length > 0 ? (
                        <div className="space-y-2 mb-4">
                          {milestones.map((m) => (
                            <div key={m.id} className="flex items-center gap-3 group px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                              <button
                                onClick={() => handleToggleMilestone(goal.id, m.id, m.completed)}
                                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${m.completed ? 'border-primary bg-primary/20' : 'border-border hover:border-primary'}`}
                              >
                                {m.completed && <Check size={10} className="text-primary" />}
                              </button>
                              <span className={`text-sm flex-1 ${m.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {m.title}
                              </span>
                              <button onClick={() => handleDeleteMilestone(goal.id, m.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-rose-400 transition-all">
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-secondary/30 p-4 rounded-xl text-center mb-4 border border-dashed border-border/50">
                          <p className="text-xs text-muted-foreground">Add sub-goals to enable automatic progress</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          className="input-field text-sm py-2 px-3 grow"
                          placeholder="Add a milestone..."
                          value={milestoneInputs[goal.id] || ''}
                          onChange={e => setMilestoneInputs({ ...milestoneInputs, [goal.id]: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && handleAddMilestone(goal.id)}
                        />
                        <button onClick={() => handleAddMilestone(goal.id)}
                          className="flex-shrink-0 p-2.5 rounded-xl bg-primary text-white hover:opacity-90 transition-all">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-card w-full max-w-md p-6 glow-border animate-in scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-foreground">New Goal</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Goal Title *</label>
                <input className="input-field" placeholder="What is your objective?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Target Date</label>
                  <input type="date" className="input-field" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:text-foreground transition-all">Cancel</button>
                <button type="submit" className="flex-1 neon-button py-3">Create Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
