import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService, exportService } from '../services';
import { Sun, Moon, Palette, User, Save, Camera, Phone, Download, Trash2, AlertTriangle } from 'lucide-react';
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
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef(null);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await authService.updateProfile({
        name: profile.name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
      });
      updateUser(res.data.user);
      toast.success('Profile updated! ✅');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Convert image to base64 data URL (stores in profile as data URL for simplicity)
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target.result;
      try {
        const res = await authService.updateProfile({ avatar_url: dataUrl });
        updateUser(res.data.user);
        setProfile(p => ({ ...p, avatar_url: dataUrl }));
        toast.success('Profile photo updated! 📸');
      } catch {
        toast.error('Failed to upload photo');
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const exportData = async (type) => {
    const toastId = toast.loading(`Exporting ${type}...`);
    try {
      let response;
      let filename = 'export.txt';
      if (type === 'Finance CSV') {
        response = await exportService.exportFinance();
        filename = 'finance_export.csv';
      } else if (type === 'Journal Text') {
        response = await exportService.exportJournal();
        filename = 'journal_export.txt';
      } else if (type === 'Productivity Report') {
        response = await exportService.exportProductivity();
        filename = 'productivity_report.json';
      }

      if (response && response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success(`${type} exported successfully!`, { id: toastId });
      } else {
        throw new Error('No data received');
      }
    } catch (error) {
      toast.error(`Failed to export ${type}`, { id: toastId });
    }
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm('Are you absolutely sure? This will permanently delete your account and all your data (tasks, goals, journal, etc.).');
    if (!confirm1) return;

    const confirm2 = window.prompt('To confirm, please type "DELETE" below:');
    if (confirm2 !== 'DELETE') return;

    setSaving(true);
    try {
      await authService.deleteAccount();
      toast.success('Account deleted. We are sorry to see you go.');
      updateUser(null);
      // AuthContext/Layout will handle redirect to login
    } catch {
      toast.error('Failed to delete account');
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
        <h2 className="font-display font-semibold text-foreground mb-5 flex items-center gap-2">
          <User size={18} className="text-primary" />
          Profile
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {profile.name?.charAt(0)?.toUpperCase() || 'P'}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary border-2 border-background flex items-center justify-center hover:opacity-90 transition-colors"
              title="Upload photo"
            >
              {uploadingAvatar
                ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                : <Camera size={12} className="text-white" />}
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{profile.name || 'Your Name'}</p>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
            <button onClick={() => fileRef.current?.click()} className="text-xs text-primary hover:opacity-80 mt-1 transition-colors">
              Change photo
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
            <input
              className="input-field"
              placeholder="Your name"
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <input className="input-field opacity-60 cursor-not-allowed" value={profile.email} disabled />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
              <Phone size={11} /> Phone Number (optional)
            </label>
            <input
              className="input-field"
              placeholder="+91 98765 43210"
              value={profile.phone}
              onChange={e => setProfile({ ...profile, phone: e.target.value })}
              type="tel"
            />
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
          <Palette size={18} className="text-primary" />
          Appearance
        </h2>
        <div className="space-y-5">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">Theme</label>
            <div className="flex gap-3">
              {THEMES.map(t => (
                <button key={t} onClick={() => setTheme(t)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all capitalize text-sm
                    ${theme === t ? 'border-primary/50 bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'}`}
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
                <button key={a.name} onClick={() => setAccent(a.name)} className="flex flex-col items-center gap-1.5 transition-all">
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

      {/* Export Data */}
      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Download size={18} className="text-primary" />
          Export Data
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Download your data in various formats.</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => exportData('Finance CSV')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm border border-emerald-500/20 hover:bg-emerald-500/30 transition-colors">
            <Download size={14} /> Finance CSV
          </button>
          <button onClick={() => exportData('Journal Text')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 text-primary text-sm border border-primary/20 hover:bg-primary/30 transition-colors">
            <Download size={14} /> Journal Text
          </button>
          <button onClick={() => exportData('Productivity Report')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 text-sm border border-blue-500/20 hover:bg-blue-500/30 transition-colors">
            <Download size={14} /> Productivity Report
          </button>
        </div>
      </div>

      {/* About */}
      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-foreground mb-2">About HabitHarbor</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Your intelligent digital planner and journal. Built with React, Node.js, Supabase, and powered by Google Gemini AI.
        </p>
        <div className="flex gap-2 flex-wrap">
          {['React', 'Node.js', 'Supabase', 'Gemini AI', 'Tailwind CSS'].map(tech => (
            <span key={tech} className="text-xs px-2 py-1 rounded-lg bg-secondary text-muted-foreground border border-border">{tech}</span>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 border-red-500/20 bg-red-500/5">
        <h2 className="font-display font-semibold text-rose-400 mb-2 flex items-center gap-2">
          <AlertTriangle size={18} /> Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all your associated data. This action is irreversible.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-500 text-sm border border-red-500/20 hover:bg-red-500/30 transition-colors font-semibold"
        >
          <Trash2 size={14} /> Delete Account
        </button>
      </div>
    </div>
  );
}
