import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard, CheckSquare, BookOpen, Calendar, Target, Flame,
  Heart, Sparkles, Settings, LogOut, Menu, X, Bell, Moon, Sun, ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/mood', icon: Heart, label: 'Mood' },
  { to: '/ai', icon: Sparkles, label: 'AI Assistant' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-border/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] flex-shrink-0">
          <span className="text-white text-sm font-bold">P</span>
        </div>
        {sidebarOpen && (
          <div>
            <h1 className="font-display font-bold text-lg text-foreground leading-none">Planora</h1>
            <p className="text-xs text-muted-foreground">Your life, organized</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group
              ${isActive
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-border/50 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer
            ${isActive ? 'bg-violet-600/20 text-violet-300' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`
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

        {/* User info */}
        {sidebarOpen && (
          <div className="flex items-center gap-3 px-3 py-3 mt-2 glass-card rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 border-r border-border/50 transition-all duration-300 relative
          ${sidebarOpen ? 'w-64' : 'w-16'}`}
        style={{ background: 'hsl(224, 20%, 7%)' }}
      >
        <SidebarContent />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-violet-600 border border-violet-500 flex items-center justify-center cursor-pointer hover:bg-violet-500 transition-colors z-10"
        >
          <ChevronRight size={12} className={`text-white transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Sidebar - Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-64 flex flex-col border-r border-border/50 z-10" style={{ background: 'hsl(224, 20%, 7%)' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border/50 flex-shrink-0" style={{ background: 'hsl(224, 20%, 7%)' }}>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-muted-foreground"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center cursor-pointer">
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="page-transition max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
