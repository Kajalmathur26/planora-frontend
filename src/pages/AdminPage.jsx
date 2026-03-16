import { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Shield, PieChart, Search, UserCheck, UserX, Loader2, ArrowUpRight, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats')
      ]);
      setUsers(usersRes.data.users || []);
      setStats(statsRes.data.stats || null);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await api.put(`/admin/users/${user.id}/role`, { role: newRole });
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      toast.success(`Role updated for ${user.name}`);
    } catch {
      toast.error('Failed to update role');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 size={40} className="animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">Loading Admin Terminal...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Admin Control Panel</h1>
        <p className="text-muted-foreground text-sm">System monitoring and user management</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats?.totalUsers} icon={<Users className="text-primary" />} />
        <StatCard title="Total Tasks" value={stats?.totalTasks} icon={<ArrowUpRight className="text-emerald-400" />} />
        <StatCard title="Journal Entries" value={stats?.totalJournalEntries} icon={<Shield className="text-primary" />} />
        <StatCard title="Total Goals" value={stats?.totalGoals} icon={<TrendingUp className="text-amber-400" />} />
      </div>

      {/* User Management */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-border/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-primary" />
            <h2 className="font-display font-semibold text-lg">User Directory</h2>
          </div>
          <div className="relative w-full max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input-field pl-10"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-xs font-bold uppercase">
                          {user.name?.charAt(0)}
                        </div>
                      )}
                      <span className="text-sm font-medium text-foreground">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-500' : 'bg-secondary text-muted-foreground'
                      }`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleRole(user)}
                      className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-primary transition-all group"
                      title={user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                    >
                      {user.role === 'admin' ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">
              No users found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="glass-card p-6 flex items-start justify-between">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-foreground">{value ?? '...'}</h3>
      </div>
      <div className="p-3 rounded-2xl bg-secondary/50">
        {icon}
      </div>
    </div>
  );
}
