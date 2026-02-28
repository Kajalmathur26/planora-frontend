import { useState, useEffect } from 'react';
import { journalService, aiService } from '../services';
import { Plus, BookOpen, Trash2, Edit3, Search, Sparkles, X, Calendar, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const MOODS = ['great', 'good', 'okay', 'bad', 'terrible'];
const MOOD_EMOJIS = { great: '😄', good: '🙂', okay: '😐', bad: '😕', terrible: '😢' };

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list, editor
  const [current, setCurrent] = useState(null);
  const [search, setSearch] = useState('');
  const [aiPrompts, setAiPrompts] = useState([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    mood: '',
    tags: '',
    entry_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { loadEntries(); }, [search]);

  const loadEntries = async () => {
    try {
      const params = search ? { search } : {};
      const res = await journalService.getAll(params);
      setEntries(res.data.entries);
    } catch {
      toast.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const newEntry = () => {
    setCurrent(null);
    setForm({ title: '', content: '', mood: '', tags: '', entry_date: new Date().toISOString().split('T')[0] });
    setView('editor');
  };

  const editEntry = async (entry) => {
    const res = await journalService.getOne(entry.id);
    const e = res.data.entry;
    setCurrent(e);
    setForm({
      title: e.title,
      content: e.content,
      mood: e.mood || '',
      tags: e.tags?.join(', ') || '',
      entry_date: e.entry_date
    });
    setView('editor');
  };

  const saveEntry = async () => {
    if (!form.title.trim()) return toast.error('Title required');
    try {
      const data = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] };
      if (current) {
        const res = await journalService.update(current.id, data);
        setEntries(entries.map(e => e.id === current.id ? res.data.entry : e));
        toast.success('Entry updated');
      } else {
        const res = await journalService.create(data);
        setEntries([res.data.entry, ...entries]);
        toast.success('Journal entry saved ✨');
      }
      setView('list');
    } catch {
      toast.error('Failed to save entry');
    }
  };

  const deleteEntry = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await journalService.delete(id);
      setEntries(entries.filter(e => e.id !== id));
      toast.success('Entry deleted');
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  const getAIPrompts = async () => {
    setLoadingPrompts(true);
    try {
      const res = await aiService.generateJournalPrompts({ mood: form.mood || 'reflective' });
      setAiPrompts(res.data.prompts);
    } catch {
      toast.error('AI prompts unavailable');
    } finally {
      setLoadingPrompts(false);
    }
  };

  const usePrompt = (prompt) => {
    setForm(f => ({ ...f, content: f.content + (f.content ? '\n\n' : '') + prompt }));
    setAiPrompts([]);
    toast.success('Prompt added!');
  };

  if (view === 'editor') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('list')} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground">
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-display text-2xl font-bold text-foreground">{current ? 'Edit Entry' : 'New Entry'}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-4">
            <input
              className="input-field text-lg font-semibold"
              placeholder="Entry title..."
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />

            <textarea
              className="input-field resize-none min-h-[400px] font-body text-sm leading-relaxed"
              placeholder="Write your thoughts, feelings, ideas, reflections..."
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
            />

            <button onClick={saveEntry} className="neon-button w-full py-3 flex items-center justify-center gap-2">
              <BookOpen size={16} />
              {current ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="glass-card p-4">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">Entry Details</label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                  <input type="date" className="input-field text-sm" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Mood</label>
                  <div className="flex gap-2 flex-wrap">
                    {MOODS.map(m => (
                      <button
                        key={m}
                        onClick={() => setForm({ ...form, mood: m })}
                        className={`text-2xl transition-all hover:scale-110 ${form.mood === m ? 'scale-125 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]' : 'opacity-60'}`}
                      >
                        {MOOD_EMOJIS[m]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tags</label>
                  <input className="input-field text-sm" placeholder="tag1, tag2..." value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>
            </div>

            {/* AI Prompts */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={12} className="text-violet-400" />
                  AI Prompts
                </label>
                <button
                  onClick={getAIPrompts}
                  disabled={loadingPrompts}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {loadingPrompts ? '...' : 'Generate'}
                </button>
              </div>

              {aiPrompts.length > 0 ? (
                <div className="space-y-2">
                  {aiPrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => usePrompt(p.prompt)}
                      className="w-full text-left p-3 rounded-xl bg-violet-600/10 border border-violet-500/20 hover:border-violet-500/40 transition-all"
                    >
                      <p className="text-xs text-foreground leading-relaxed">{p.prompt}</p>
                      <span className="text-xs text-violet-400 mt-1 block">{p.category}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Click Generate to get AI-powered writing prompts based on your mood.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Journal</h1>
          <p className="text-muted-foreground text-sm">{entries.length} entries</p>
        </div>
        <button onClick={newEntry} className="neon-button flex items-center gap-2">
          <Plus size={16} /> New Entry
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="input-field pl-10"
          placeholder="Search entries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">Your journal is empty</p>
          <p className="text-sm text-muted-foreground mt-1">Start writing your first entry</p>
          <button onClick={newEntry} className="neon-button mt-4 inline-flex items-center gap-2">
            <Plus size={16} /> Write Something
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {entries.map(entry => (
            <div
              key={entry.id}
              className="glass-card-hover p-5 cursor-pointer group"
              onClick={() => editEntry(entry)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{format(new Date(entry.entry_date), 'MMM d, yyyy')}</span>
                </div>
                {entry.mood && <span className="text-xl">{MOOD_EMOJIS[entry.mood]}</span>}
              </div>
              <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{entry.title}</h3>
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-1 flex-wrap">
                  {entry.tags?.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded bg-violet-600/20 text-violet-300">{tag}</span>
                  ))}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteEntry(entry.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-rose-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
