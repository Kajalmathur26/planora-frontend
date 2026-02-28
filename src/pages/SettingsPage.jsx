import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services';
import { Sun, Moon, Palette, User, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const THEMES = ['dark', 'light'];
const ACCENTS = [
  { name: 'violet', color: '#8B5CF6' },
  { name: 'indigo', color: '#6366F1' },
  { name: 'blue', color: '#3B82F6' },
  { name: 'emerald', color: '#10B981' },
  { name: 'rose', color: '#F43F5E' },
  { name: 'amber', color: '#F59E0B' },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, accent, setTheme, setAccent } = useTheme();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await authService.updateProfile({ name: profile.name });
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">Customize your Planora experience</p>
      </div>

      {/* Profile */}
      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <User size={18} className="text-violet-400" />
          Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
            <input
              className="input-field"
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <input className="input-field opacity-60 cursor-not-allowed" value={profile.email} disabled />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>
          <button onClick={saveProfile} disabled={saving} className="neon-button flex items-center gap-2 disabled:opacity-50">
            {saving ? <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Palette size={18} className="text-violet-400" />
          Appearance
        </h2>

        <div className="space-y-5">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">Theme</label>
            <div className="flex gap-3">
              {THEMES.map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all capitalize text-sm
                    ${theme === t
                      ? 'border-violet-500/50 bg-violet-600/20 text-violet-300'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                    }`}
                >
                  {t === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">Accent Color</label>
            <div className="flex gap-3 flex-wrap">
              {ACCENTS.map(a => (
                <button
                  key={a.name}
                  onClick={() => setAccent(a.name)}
                  className={`flex flex-col items-center gap-1.5 transition-all`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl transition-all hover:scale-110 ${accent === a.name ? 'ring-2 ring-white scale-110' : ''}`}
                    style={{ background: a.color, boxShadow: accent === a.name ? `0 0 12px ${a.color}80` : 'none' }}
                  />
                  <span className="text-xs text-muted-foreground capitalize">{a.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-foreground mb-2">About Planora</h2>
        <p className="text-sm text-muted-foreground">
          Planora is your intelligent digital planner and journal. Built with React, Node.js, Supabase, and powered by Google Gemini AI.
        </p>
        <div className="flex gap-3 mt-4 flex-wrap">
          {['React', 'Node.js', 'Supabase', 'Gemini AI', 'Tailwind CSS'].map(tech => (
            <span key={tech} className="text-xs px-2 py-1 rounded-lg bg-secondary text-muted-foreground border border-border">{tech}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
