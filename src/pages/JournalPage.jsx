import { useState, useEffect, useRef, useCallback } from 'react';
import { journalService, aiService } from '../services';
import {
  Plus, Trash2, Edit3, X, Search, Image, Bold, Italic,
  List, Quote, Heading2, Calendar, Tag, Lock, Save, Loader2,
  ChevronDown, ChevronUp, Sparkles, Palette, Smile
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const MOODS = ['😊', '😢', '😡', '😌', '🤔', '🥳', '😰', '😴', '🥰', '😤'];
const BG_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Violet', value: '#1e1533' },
  { label: 'Teal', value: '#0f2723' },
  { label: 'Rose', value: '#2a1025' },
  { label: 'Amber', value: '#241b08' },
  { label: 'Light Blue', value: 'hsl(210, 100%, 98%)' },
  { label: 'Soft Yellow', value: 'hsl(60, 100%, 98%)' },
  { label: 'Mint', value: 'hsl(140, 100%, 98%)' },
  { label: 'White', value: '#ffffff' },
];

const FONTS = [
  { label: 'Default Font', value: '' },
  { label: 'Serif (Merriweather)', value: '"Merriweather", serif' },
  { label: 'Monospace (Fira Code)', value: '"Fira Code", monospace' },
  { label: 'Cursive (Caveat)', value: '"Caveat", cursive' },
  { label: 'Sans (Inter)', value: '"Inter", sans-serif' },
];

// ── Rich Text Toolbar ──────────────────────────────────────────────────── //
function RichToolbar({ editorRef, onImageUpload, uploading, onAiSuggest, loadingAi, onEmojiToggle }) {
  const cmd = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border/50 bg-secondary/30">
      <ToolBtn title="Bold" onClick={() => cmd('bold')}><Bold size={14} /></ToolBtn>
      <ToolBtn title="Italic" onClick={() => cmd('italic')}><Italic size={14} /></ToolBtn>

      <div className="flex items-center gap-1 bg-background/50 rounded-lg px-1 border border-border/50">
        <select
          className="bg-secondary text-foreground text-[10px] font-medium py-1 px-2 rounded outline-none cursor-pointer border border-border/50"
          onChange={(e) => cmd('formatBlock', e.target.value)}
          defaultValue="p"
        >
          <option value="p" className="bg-secondary text-foreground">Normal Text</option>
          <option value="h1" className="bg-secondary text-foreground">Heading 1</option>
          <option value="h2" className="bg-secondary text-foreground">Heading 2</option>
          <option value="h3" className="bg-secondary text-foreground">Heading 3</option>
          <option value="h4" className="bg-secondary text-foreground">Heading 4</option>
          <option value="h5" className="bg-secondary text-foreground">Heading 5</option>
          <option value="h6" className="bg-secondary text-foreground">Heading 6</option>
        </select>
      </div>

      <ToolBtn title="Bullet List" onClick={() => cmd('insertUnorderedList')}>
        <List size={14} />
      </ToolBtn>
      <ToolBtn title="Blockquote" onClick={() => cmd('formatBlock', 'blockquote')}>
        <Quote size={14} />
      </ToolBtn>

      <div className="relative flex items-center group cursor-pointer border border-border/50 rounded-lg px-1.5 py-0.5 ml-1">
        <Palette size={14} className="text-muted-foreground mr-1" />
        <input 
          type="color" 
          onChange={(e) => cmd('foreColor', e.target.value)}
          className="w-4 h-4 p-0 border-0 rounded cursor-pointer pointer-events-auto"
          title="Text Color"
        />
      </div>

      <div className="w-px h-4 bg-border/50 mx-1" />

      {/* Emoji Button in Toolbar */}
      <button
        type="button"
        title="Emojis"
        onClick={onEmojiToggle} // Passed from parent
        className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Smile size={16} />
      </button>

      <div className="w-px h-4 bg-border/50 mx-1" />
      <label
        className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
        title="Insert Image"
      >
        {uploading
          ? <Loader2 size={14} className="animate-spin text-primary" />
          : <Image size={14} />
        }
        <span className="hidden sm:inline text-xs">{uploading ? 'Uploading…' : 'Image'}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onImageUpload}
          disabled={uploading}
        />
      </label>
    </div>
  );
}

function ToolBtn({ children, onClick, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────── //
export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const editorRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    entry_date: new Date().toISOString().split('T')[0],
    mood: '',
    tags: '',
    is_private: true,
    bg_color: '',
    bg_image_url: '',
    font_style: '',
  });

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    try {
      const res = await journalService.getAll();
      setEntries(res.data?.entries || []);
    } catch {
      toast.error('Failed to load journal');
    } finally {
      setLoading(false);
    }
  };

  // ── Image upload via Supabase Storage ──
  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5 MB)');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const base64 = evt.target.result;
        try {
          const res = await journalService.uploadImage(base64, file.name, file.type);
          const url = res.data.url;
          // Insert image into the editor at cursor position
          editorRef.current?.focus();
          document.execCommand('insertImage', false, url);
          toast.success('Image uploaded!');
        } catch {
          toast.error('Failed to upload image');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast.error('Failed to read file');
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, []);

  const handleAiSuggest = async () => {
    setLoadingAi(true);
    try {
      const res = await aiService.generateJournalPrompts();
      const prompts = res.data.prompts || [];
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

      if (randomPrompt && editorRef.current) {
        const promptText = typeof randomPrompt === 'object' ? randomPrompt.prompt : randomPrompt;
        const promptHtml = `<p><i><strong>AI Prompt:</strong> ${promptText}</i></p><p><br></p>`;
        // Prepend prompt
        editorRef.current.innerHTML = promptHtml + editorRef.current.innerHTML;
        toast.success('AI Prompt added!');
      }
    } catch {
      toast.error('Failed to get AI prompt');
    } finally {
      setLoadingAi(false);
    }
  };

  const openNew = () => {
    setEditEntry(null);
    setForm({
      title: '',
      entry_date: new Date().toISOString().split('T')[0],
      mood: '',
      tags: '',
      is_private: true,
      bg_color: '',
      bg_image_url: '',
      font_style: '',
    });
    setShowForm(true);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = '';
    }, 50);
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setForm({
      title: entry.title,
      entry_date: entry.entry_date,
      mood: entry.mood || '',
      tags: (entry.tags || []).join(', '),
      is_private: entry.is_private,
      bg_color: entry.bg_color || '',
      bg_image_url: entry.image_url || '',
      font_style: entry.font_style || '',
    });
    setShowForm(true);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = entry.content || '';
    }, 50);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditEntry(null);
    if (editorRef.current) editorRef.current.innerHTML = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const content = editorRef.current?.innerHTML || '';
      const payload = {
        title: form.title,
        entry_date: form.entry_date,
        mood: form.mood || null,
        is_private: form.is_private,
        content,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        bg_color: form.bg_color || null,
        font_style: form.font_style || null,
        image_url: form.bg_image_url || null,
      };

      if (editEntry) {
        const res = await journalService.update(editEntry.id, payload);
        setEntries(entries.map(e => e.id === editEntry.id ? res.data.entry : e));
        toast.success('Entry updated ✏️');
      } else {
        const res = await journalService.create(payload);
        setEntries([res.data.entry, ...entries]);
        toast.success('Entry saved 📖');
      }
      closeForm();
    } catch {
      toast.error('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await journalService.delete(id);
      setEntries(entries.filter(e => e.id !== id));
      toast.success('Entry deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const onEmojiClick = (emojiObj) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertText', false, emojiObj.emoji);
      setShowEmojiPicker(false);
    }
  };

  const filtered = entries.filter(e =>
    e.title?.toLowerCase().includes(search.toLowerCase()) ||
    (e.content || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Journal</h1>
          <p className="text-muted-foreground text-sm">{entries.length} entries</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleAiSuggest} 
            disabled={loadingAi} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all text-sm disabled:opacity-50 shadow-sm shadow-primary/10"
          >
            {loadingAi ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            AI Suggest
          </button>
          <button onClick={openNew} className="neon-button flex items-center gap-2">
            <Plus size={16} /> New Entry
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="input-field pl-9"
          placeholder="Search entries…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card w-full max-w-2xl p-0 glow-border animate-in overflow-hidden mb-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {editEntry ? 'Edit Entry' : 'New Journal Entry'}
              </h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div className="px-5 pt-4">
                <input
                  className="input-field text-lg font-medium"
                  placeholder="Entry title…"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              {/* Meta Row */}
              <div className="px-5 pt-3 flex flex-wrap gap-3">
                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground"><Calendar size={13} /></span>
                  <input
                    type="date"
                    className="bg-secondary text-foreground rounded px-2 py-1 border-none outline-none text-xs cursor-pointer [color-scheme:light] dark:[color-scheme:dark] shadow-sm"
                    value={form.entry_date}
                    onChange={e => setForm({ ...form, entry_date: e.target.value })}
                  />
                </div>

                {/* Mood */}
                <div className="flex gap-1 flex-wrap">
                  {MOODS.map(m => (
                    <button
                      type="button" key={m}
                      onClick={() => setForm({ ...form, mood: form.mood === m ? '' : m })}
                      className={`text-lg p-0.5 rounded transition-all hover:scale-110 ${form.mood === m ? 'ring-1 ring-primary bg-primary/10' : 'opacity-50 hover:opacity-100'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Private toggle */}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_private: !form.is_private })}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all ${form.is_private ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}
                >
                  <Lock size={11} /> {form.is_private ? 'Private' : 'Public'}
                </button>

                {/* Background Color */}
                <div className="flex items-center gap-1">
                  {BG_COLORS.map(bg => (
                    <button
                      type="button" key={bg.value}
                      onClick={() => setForm({ ...form, bg_color: bg.value })}
                      title={bg.label}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${form.bg_color === bg.value ? 'border-primary scale-110 shadow-lg' : 'border-border/50 hover:scale-105'}`}
                      style={{ background: bg.value || '#1f2937' }}
                    />
                  ))}
                </div>

                {/* Font Style */}
                <select
                  className="bg-secondary text-foreground rounded px-2 py-1 border-none outline-none text-xs cursor-pointer shadow-sm font-medium"
                  value={form.font_style}
                  onChange={e => setForm({ ...form, font_style: e.target.value })}
                >
                  {FONTS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
                </select>
                
                {/* Background Image URL */}
                <div className="flex-1 min-w-[150px]">
                  <input
                     className="bg-secondary text-foreground rounded px-2 py-1 w-full border-none outline-none text-xs placeholder:text-muted-foreground shadow-sm"
                     placeholder="Bg Image URL (optional)"
                     value={form.bg_image_url}
                     onChange={e => setForm({ ...form, bg_image_url: e.target.value })}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="px-5 pt-2 flex items-center gap-2">
                <Tag size={13} className="text-muted-foreground flex-shrink-0" />
                <input
                  className="flex-1 bg-transparent border-none outline-none text-xs text-muted-foreground placeholder:text-muted-foreground/50"
                  placeholder="Tags (comma separated)…"
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                />
              </div>

              {/* Rich Text Editor */}
              <div className="mx-5 mt-3 rounded-xl overflow-hidden border border-border/50 relative">
                <RichToolbar
                  editorRef={editorRef}
                  onImageUpload={handleImageUpload}
                  uploading={uploading}
                  onEmojiToggle={() => setShowEmojiPicker(!showEmojiPicker)}
                />
                
                {/* Embedded Emoji Picker */}
                {showEmojiPicker && (
                  <div className="absolute top-12 left-2 shadow-2xl z-50 animate-in">
                      <EmojiPicker 
                        onEmojiClick={onEmojiClick}
                        theme="auto"
                        lazyLoadEmojis={true}
                        width={300}
                        height={400}
                      />
                  </div>
                )}

                {/* Editor Container with optional Background Image */}
                <div className="relative min-h-[12rem] max-h-96 overflow-y-auto">
                   {form.bg_image_url && (
                     <div 
                        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay blur-[2px]"
                        style={{ backgroundImage: `url(${form.bg_image_url})` }}
                     />
                   )}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className={`relative z-10 w-full min-h-[12rem] p-4 text-sm outline-none leading-relaxed prose-journal ${form.bg_color && form.bg_color.includes('hsl') ? 'text-slate-900' : 'text-foreground'}`}
                    style={{ background: form.bg_color || undefined, fontFamily: form.font_style || undefined }}
                    data-placeholder="Write your thoughts…"
                    onInput={() => { /* handled on submit via innerHTML */ }}
                    onClick={(e) => {
                      if (e.target.tagName === 'IMG') {
                        const newWidth = prompt('Enter image width (e.g. 50% or 300px):', e.target.style.width || '100%');
                        if (newWidth) e.target.style.width = newWidth;
                      }
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-5 py-4">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving || uploading} className="flex-1 neon-button py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? 'Saving…' : editEntry ? 'Update' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entries List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Edit3 size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">{search ? 'No entries match your search' : 'No entries yet'}</p>
          {!search && (
            <button onClick={openNew} className="neon-button mt-4 inline-flex items-center gap-2">
              <Plus size={15} /> Start Writing
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              onEdit={() => openEdit(entry)}
              onDelete={() => deleteEntry(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Editor placeholder CSS */}
      <style>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: hsl(215 20% 45%);
          pointer-events: none;
        }
        [contenteditable] img { 
          max-width: 100%; 
          border-radius: 12px; 
          margin: 12px 0; 
          border: 1px solid var(--border); 
          transition: all 0.3s; 
          cursor: pointer;
        }
        [contenteditable] img.selected {
          outline: 3px solid var(--primary);
          outline-offset: 4px;
        }
        [contenteditable] blockquote { border-left: 3px solid var(--primary); padding-left: 12px; color: hsl(215 20% 65%); margin: 8px 0; font-style: italic; }
        [contenteditable] h1 { font-size: 1.5rem; font-weight: 800; margin: 16px 0 8px; font-family: 'Clash Display', sans-serif; }
        [contenteditable] h2 { font-size: 1.25rem; font-weight: 700; margin: 12px 0 6px; font-family: 'Clash Display', sans-serif; }
        [contenteditable] h3 { font-size: 1.1rem; font-weight: 700; margin: 8px 0 4px; }
        [contenteditable] h4 { font-size: 1rem; font-weight: 700; margin: 6px 0 3px; }
        [contenteditable] h5 { font-size: 0.9rem; font-weight: 700; margin: 4px 0 2px; }
        [contenteditable] h6 { font-size: 0.85rem; font-weight: 700; margin: 2px 0 1px; }
        [contenteditable] ul { list-style: disc; padding-left: 18px; }
        [contenteditable] ol { list-style: decimal; padding-left: 18px; }
        .prose-journal p { margin-bottom: 0.5rem; }
      `}</style>
    </div>
  );
}

// ── Entry Card ─────────────────────────────────────────────────────────── //
function EntryCard({ entry, expanded, onToggle, onEdit, onDelete }) {
  return (
    <div
      className="glass-card overflow-hidden group transition-all relative"
      style={{ background: entry.bg_color || undefined }}
    >
      {entry.bg_image_url && (
         <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-overlay blur-[3px]"
            style={{ backgroundImage: `url(${entry.bg_image_url})` }}
         />
      )}
      {/* Header */}
      <div className="flex items-start gap-3 p-4 cursor-pointer relative z-10" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {entry.mood && <span className="text-lg">{entry.mood}</span>}
            <h3 className="font-semibold text-foreground truncate">{entry.title}</h3>
            {entry.is_private && <Lock size={11} className="text-muted-foreground flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground">
              {entry.entry_date ? format(parseISO(entry.entry_date), 'EEE, MMM d, yyyy') : ''}
            </span>
            {entry.tags?.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {entry.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onEdit(); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all">
            <Edit3 size={13} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-rose-400 transition-all">
            <Trash2 size={13} />
          </button>
          <button className="p-1 text-muted-foreground">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && entry.content && (
        <div
          className="px-4 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/30 prose-journal relative z-10"
          style={{ fontFamily: entry.font_style || undefined }}
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />
      )}
    </div>
  );
}
