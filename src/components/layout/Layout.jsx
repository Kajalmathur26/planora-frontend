import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard, CheckSquare, BookOpen, Calendar, Target, Flame,
  Heart, Sparkles, Settings, LogOut, Menu, X, Bell, Moon, Sun,
  ChevronRight, DollarSign, Timer, Search, Shield
} from 'lucide-react';
import { searchService } from '../../services';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/mood', icon: Heart, label: 'Mood' },
  { to: '/finance', icon: DollarSign, label: 'Finance' },
  { to: '/focus', icon: Timer, label: 'Focus Mode' },
  { to: '/ai', icon: Sparkles, label: 'AI Assistant' },
];

// ─── Search Modal ─────────────────────────────────────────────────────────── //
function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = (q) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setResults(null); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchService.search(q);
        setResults(res.data.results);
      } catch { toast.error('Search failed'); }
      finally { setSearching(false); }
    }, 350);
  };

  const goTo = (path) => { navigate(path); onClose(); };

  const totalResults = results ? Object.values(results).reduce((s, a) => s + a.length, 0) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 px-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl glass-card p-4 glow-border animate-in" onClick={e => e.stopPropagation()}>
        <div className="relative mb-3">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          {searching && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
          <input
            ref={inputRef}
            className="input-field pl-10 pr-10"
            placeholder="Search tasks, goals, journal..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        {results && totalResults === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">No results for "{query}"</p>
        )}

        {results && (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {results.tasks?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-1">✅ Tasks</p>
                {results.tasks.map(t => (
                  <button key={t.id} onClick={() => goTo('/tasks')}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/10 transition-colors">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 capitalize">{t.status}</span>
                    <span className="text-sm text-foreground truncate">{t.title}</span>
                  </button>
                ))}
              </div>
            )}
            {results.goals?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-1">🎯 Goals</p>
                {results.goals.map(g => (
                  <button key={g.id} onClick={() => goTo('/goals')}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/10 transition-colors">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 capitalize">{g.category}</span>
                    <span className="text-sm text-foreground truncate">{g.title}</span>
                  </button>
                ))}
              </div>
            )}
            {results.journal?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-1">📖 Journal</p>
                {results.journal.map(j => (
                  <button key={j.id} onClick={() => goTo('/journal')}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/10 transition-colors">
                    <span className="text-sm text-foreground truncate">{j.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-3 text-center">Press Esc to close</p>
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────── //
export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(s => !s);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-6 border-b border-border/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/40 flex-shrink-0">
          <span className="text-white text-sm font-bold">P</span>
        </div>
        {sidebarOpen && (
          <div>
            <h1 className="font-display font-bold text-lg text-foreground leading-none">Planora</h1>
            <p className="text-xs text-muted-foreground">Your life, organized</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group
              ${isActive
                ? 'bg-primary/20 text-primary border border-primary/20 shadow-lg shadow-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group border-t border-border/20 pt-4 mt-4
              ${isActive
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/10'
                : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10'
              }`
            }
          >
            <Shield size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Admin Panel</span>}
          </NavLink>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-border/50 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer
            ${isActive ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'}`
          }
        >
          <Settings size={18} className="flex-shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium">Settings</span>}
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
        </button>

        {sidebarOpen && (
          <div className="flex items-center gap-3 px-3 py-3 mt-2 glass-card rounded-xl">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 border-r border-border/50 transition-all duration-300 relative bg-card
          ${sidebarOpen ? 'w-64' : 'w-16'}`}
      >
        <SidebarContent />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary border border-primary/20 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity z-10 text-primary-foreground"
        >
          <ChevronRight size={12} className={`text-white transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-64 flex flex-col border-r border-border/50 z-10 bg-card">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-40 flex-shrink-0">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent/10 text-muted-foreground"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowSearch(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <Search size={14} />
              <span>Search</span>
              <kbd className="text-xs bg-background px-1.5 py-0.5 rounded border border-border/50 ml-1">⌘K</kbd>
            </button>
            <button
              onClick={() => setShowSearch(true)}
              className="md:hidden p-2 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search size={18} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="p-2 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={18} />
            </button>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-lg object-cover cursor-pointer" onClick={() => navigate('/settings')} />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center cursor-pointer text-primary-foreground" onClick={() => navigate('/settings')}>
                <span className="text-white text-xs font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          <div className="page-transition max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </div>
  );
}