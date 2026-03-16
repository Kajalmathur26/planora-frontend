import { useState, useEffect } from 'react';
import { taskService, aiService } from '../services';
import { CheckCircle2, Circle, Clock, Tag, Trash2, Plus, Calendar as CalIcon, Edit3, X, Filter, BarChart2, Star, Sparkles, AlertTriangle, GripVertical, Check, RefreshCw } from 'lucide-react';
import { format, isPast, isToday, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

// DND Kit Imports
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const CATEGORIES = ['all', 'work', 'personal', 'health', 'learning', 'hobbies'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState({ category: 'all', status: '', priority: '' });
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'personal', priority: 'medium', status: 'pending', due_date: '', tags: '' });

  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { loadTasks(); }, [filter]);

  const loadTasks = async () => {
    try {
      const params = {};
      if (filter.category !== 'all') params.category = filter.category;
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      const res = await taskService.getAll(params);
      setTasks(res.data?.tasks || []);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
      setSaving(false);
    }
  };

  const loadAiSuggestions = async () => {
    setLoadingAi(true);
    try {
      const res = await aiService.suggestTasks();
      setAiSuggestions(res.data.suggestions || []);
      if (res.data.suggestions?.length > 0) toast.success('AI found some great task ideas!');
    } catch {
      toast.error('AI suggestions unavailable');
    } finally {
      setLoadingAi(false);
    }
  };

  const acceptAiSuggestion = (suggestion) => {
    setForm({
      title: suggestion.title,
      description: suggestion.reason || suggestion.description || '',
      due_date: new Date().toISOString().split('T')[0],
      priority: 'medium',
      category: suggestion.category || 'personal',
      status: 'pending',
      tags: ''
    });
    setAiSuggestions(aiSuggestions.filter(s => s.title !== suggestion.title));
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Task title required');
    try {
      const data = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] };
      if (editTask) {
        const res = await taskService.update(editTask.id, data);
        setTasks(tasks.map(t => t.id === editTask.id ? res.data.task : t));
        toast.success('Task updated');
      } else {
        const res = await taskService.create(data);
        setTasks([res.data.task, ...tasks]);
        toast.success('Task created! ✅');
      }
      resetForm();
    } catch {
      toast.error('Failed to save task');
    }
  };

  const toggleComplete = async (task) => {
    if (saving) return;
    setSaving(true);
    try {
      let newStatus = 'pending';
      if (task.status === 'pending') newStatus = 'in_progress';
      else if (task.status === 'in_progress') newStatus = 'completed';
      
      const res = await taskService.update(task.id, { status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? res.data.task : t));
      
      const msg = newStatus === 'completed' ? 'Success! 🎉' : 
                  newStatus === 'in_progress' ? 'Started! 🔄' : 
                  'Reset to pending';
      toast.success(msg);
    } catch (err) {
      toast.error('Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskService.delete(id);
      setTasks(tasks.filter(t => t.id !== id));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const startEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      status: task.status || 'pending',
      due_date: task.due_date || '',
      tags: task.tags?.join(', ') || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditTask(null);
    setForm({ title: '', description: '', category: 'personal', priority: 'medium', status: 'pending', due_date: '', tags: '' });
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    let overId = over.id;
    const overTask = tasks.find(t => t.id === overId);
    
    const newStatus = ['pending', 'in_progress', 'completed'].includes(overId) 
      ? overId 
      : overTask?.status;

    if (newStatus && activeTask.status !== newStatus) {
      setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: newStatus } : t));
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    const newStatus = ['pending', 'in_progress', 'completed'].includes(over.id) 
      ? over.id 
      : tasks.find(t => t.id === over.id)?.status;

    if (newStatus) {
      try {
        await taskService.update(active.id, { status: newStatus });
      } catch {
        toast.error('Sync failed');
        loadTasks();
      }
    }
  };

  const groupedTasks = {
    pending: (tasks || []).filter(t => t.status === 'pending'),
    in_progress: (tasks || []).filter(t => t.status === 'in_progress'),
    completed: (tasks || []).filter(t => t.status === 'completed'),
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Task Board</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">
              {(tasks || []).filter(t => t.status === 'pending').length} remaining · {(tasks || []).filter(t => t.status === 'completed').length} completed
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={loadAiSuggestions} disabled={loadingAi} className="neon-button-secondary flex items-center gap-2 px-4 py-2 text-sm bg-primary/10 border border-primary/20 text-primary rounded-xl font-bold hover:bg-primary/20 transition-all">
              {loadingAi ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              AI Suggestions
            </button>
            <button onClick={() => setShowForm(true)} className="neon-button flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-[0_0_20px_var(--primary-glow)]">
              <Plus size={18} /> New Task
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(f => ({ ...f, category: cat }))}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filter.category === cat
                ? 'bg-primary text-white shadow-[0_4px_15px_var(--primary-glow)]'
                : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* AI Suggestions Section */}
        {aiSuggestions.length > 0 && (
          <div className="glass-card p-6 border-l-4 border-primary bg-primary/5 animate-in slide-in-from-top duration-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-foreground flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                Suggested for You
              </h2>
              <button onClick={() => setAiSuggestions([])} className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiSuggestions.map((suggestion, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-card border border-primary/20 hover:border-primary/40 transition-all flex flex-col justify-between group">
                  <div>
                    <h3 className="text-xs font-bold text-foreground mb-1 pr-6">{suggestion.title}</h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{suggestion.reason || suggestion.description}</p>
                  </div>
                  <button
                    onClick={() => acceptAiSuggestion(suggestion)}
                    className="mt-4 w-full py-1.5 rounded-lg text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all border border-primary/20"
                  >
                    Add Task
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
            <div className="glass-card w-full max-w-lg p-8 glow-border animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{editTask ? 'Edit Task' : 'Create Task'}</h2>
                <button onClick={resetForm} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block tracking-widest">Title</label>
                  <input className="input-field" placeholder="What needs to be done?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block tracking-widest">Description</label>
                  <textarea className="input-field resize-none h-24 text-sm" placeholder="Any extra details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block tracking-widest">Category</label>
                    <select className="input-field text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block tracking-widest">Priority</label>
                    <select className="input-field text-sm" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block tracking-widest">Due Date</label>
                    <input type="date" className="input-field text-sm" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block tracking-widest">Status</label>
                    <select className="input-field text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="pending">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={resetForm} className="flex-1 py-3 rounded-2xl border border-border text-muted-foreground font-bold hover:bg-white/5 transition-all">Cancel</button>
                  <button type="submit" className="flex-1 neon-button py-3 shadow-[0_4px_20px_var(--primary-glow)] uppercase tracking-widest font-bold">{editTask ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Kanban Board */}
        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw size={32} className="text-primary animate-spin opacity-50" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TaskColumn id="pending" label="To Do" count={groupedTasks.pending.length} color="bg-amber-400" tasks={groupedTasks.pending} onToggle={toggleComplete} onEdit={startEdit} onDelete={deleteTask} />
            <TaskColumn id="in_progress" label="In Progress" count={groupedTasks.in_progress.length} color="bg-blue-400 border-2 border-primary/20" tasks={groupedTasks.in_progress} onToggle={toggleComplete} onEdit={startEdit} onDelete={deleteTask} />
            <TaskColumn id="completed" label="Completed" count={groupedTasks.completed.length} color="bg-emerald-400" tasks={groupedTasks.completed} onToggle={toggleComplete} onEdit={startEdit} onDelete={deleteTask} />
          </div>
        )}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-[320px] shadow-2xl rotate-2 scale-105 pointer-events-none opacity-90">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function TaskColumn({ id, label, count, color, tasks, onToggle, onEdit, onDelete }) {
  return (
    <div className="flex flex-col gap-6 min-h-[600px] group/col">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-3 h-3 rounded-full ${color.includes('border') ? color.split(' ')[0] : color} shadow-[0_0_8px_currentColor]`} style={{color: color.includes('amber') ? '#fbbf24' : color.includes('blue') ? '#60a5fa' : '#34d399'}} />
          <h3 className="font-display font-bold text-sm tracking-wide text-foreground uppercase">{label}</h3>
        </div>
        <span className="text-[10px] font-bold bg-secondary/50 px-2 py-0.5 rounded-lg border border-border/40 text-muted-foreground">{count}</span>
      </div>
      
      <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4 flex-1 p-3 rounded-3xl bg-secondary/40 border-2 border-border/30 group-hover/col:border-primary/20 transition-all bg-gradient-to-b from-secondary/20 to-secondary/5 min-h-[500px] shadow-inner">
          {tasks.map(task => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {tasks.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-border/60 bg-secondary/30 mt-10">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/60 mb-4 animate-pulse bg-primary/10 flex items-center justify-center">
                <Plus size={24} className="text-primary/60" />
              </div>
              <p className="text-sm uppercase font-black tracking-widest text-foreground">Empty Column</p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Drop tasks or click +</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableTaskCard({ task, onToggle, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.2 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="touch-none group/sortable">
      <TaskCard task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} dragHandlers={{ ...attributes, ...listeners }} />
    </div>
  );
}

function TaskCard({ task, onToggle, onEdit, onDelete, dragHandlers }) {
  const isOverdue = task.due_date && task.due_date < new Date().toISOString().split('T')[0] && task.status !== 'completed';

  return (
    <div className={`relative p-5 rounded-3xl bg-card border transition-all hover:bg-secondary/40 ${isOverdue ? 'border-rose-500/30 bg-rose-500/[0.02]' : 'border-border/60 hover:border-primary/40'} hover:shadow-2xl hover:-translate-y-1 group`}>
      {/* Interactive Grip Area */}
      {dragHandlers && (
        <div {...dragHandlers} className="absolute top-4 left-4 cursor-grab active:cursor-grabbing text-muted-foreground/20 hover:text-primary transition-colors">
          <GripVertical size={16} />
        </div>
      )}

      {/* Success Indicator / Status Toggle */}
      <button 
        onClick={() => onToggle && onToggle(task)}
        className={`absolute top-4 right-4 w-6 h-6 rounded-xl flex items-center justify-center transition-all ${
          task.status === 'completed' ? 'bg-emerald-500 text-white shadow-lg' :
          task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' :
          'bg-secondary/80 text-muted-foreground hover:bg-primary/20 hover:text-primary border border-border'
        }`}
      >
        {task.status === 'completed' ? <Check size={14} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
      </button>

      <div className="mt-4">
        <h4 className={`text-sm font-bold leading-tight mb-2 pr-8 ${task.status === 'completed' ? 'text-muted-foreground line-through decoration-emerald-500/50' : 'text-foreground'}`}>
          {task.title}
        </h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-4 opacity-80">
          {task.description || 'No additional details provided...'}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider ${
            task.priority === 'urgent' ? 'text-rose-400 bg-rose-400/10' :
            task.priority === 'high' ? 'text-orange-400 bg-orange-400/10' :
            task.priority === 'medium' ? 'text-amber-400 bg-amber-400/10' :
            'text-emerald-400 bg-emerald-400/10'
          }`}>
            {task.priority}
            </span>
          <span className="text-[9px] px-2 py-0.5 rounded-lg bg-secondary/50 text-muted-foreground font-bold uppercase border border-border/20">
            {task.category}
          </span>
          {task.due_date && (
            <div className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-tighter ${isOverdue ? 'text-rose-400' : 'text-muted-foreground'}`}>
              <Clock size={10} />
              {format(new Date(task.due_date + 'T00:00:00'), 'MMM dd')}
            </div>
          )}
        </div>
      </div>

      {/* Action Overlay */}
      <div className="flex gap-2 mt-5 pt-4 border-t border-border/10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit && onEdit(task)} className="flex-1 py-1.5 rounded-xl bg-primary/5 hover:bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center gap-2 border border-primary/20 transition-all">
          <Edit3 size={12} /> EDIT
        </button>
        <button onClick={() => onDelete && onDelete(task.id)} className="p-1.5 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-all">
          <Trash2 size={14} />
        </button>
      </div>
      
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none rounded-3xl" />
    </div>
  );
}
