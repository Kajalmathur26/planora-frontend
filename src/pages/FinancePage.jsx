import { useState, useEffect } from 'react';
import { authService, financeService } from '../services';
import { useAuth } from '../context/AuthContext';
import {
    DollarSign, Plus, Trash2, Edit3, X, TrendingUp, TrendingDown,
    PieChart as PieIcon, BarChart2, Calendar, Filter, ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import toast from 'react-hot-toast';

const CATEGORIES_EXPENSE = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Bills', 'Rent', 'Other'];
const CATEGORIES_INCOME = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'];
const PIE_COLORS = ['#8B5CF6', '#F43F5E', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];
const PERIODS = [
    { label: '7 days', days: 7 },
    { label: '30 days', days: 30 },
    { label: '3 months', days: 90 },
];

const INR = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FinancePage() {
    const { user, updateUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0, todayIncome: 0, todayExpense: 0 });
    const [analytics, setAnalytics] = useState({ categoryBreakdown: [], dailyTrend: [], weeklySummary: [] });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editTx, setEditTx] = useState(null);
    const [period, setPeriod] = useState(30);
    const [filter, setFilter] = useState('');
    const [activeChart, setActiveChart] = useState('trend');
    const [budget, setBudget] = useState(user?.preferences?.finance_budget || 0);
    const [budgetInput, setBudgetInput] = useState('');
    const [form, setForm] = useState({ type: 'expense', amount: '', category: 'Food', description: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => { loadAll(); }, [period, filter]);

    const loadAll = async () => {
        try {
            const [txRes, analyticsRes] = await Promise.all([
                financeService.getAll({ days: period, ...(filter ? { type: filter } : {}) }),
                financeService.getAnalytics({ days: period }),
            ]);
            setTransactions(txRes.data.transactions);
            setSummary(txRes.data.summary);
            setAnalytics(analyticsRes.data);
        } catch { toast.error('Failed to load finance data'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Enter a valid amount');
        try {
            if (editTx) {
                const res = await financeService.update(editTx.id, form);
                setTransactions(transactions.map(t => t.id === editTx.id ? res.data.transaction : t));
                toast.success('Updated!');
            } else {
                const res = await financeService.create(form);
                setTransactions([res.data.transaction, ...transactions]);
                toast.success(`${form.type === 'income' ? '💰 Income' : '💸 Expense'} added!`);
            }
            resetForm();
            loadAll();
        } catch { toast.error('Failed to save transaction'); }
    };

    const deleteTx = async (id) => {
        if (!confirm('Delete this transaction?')) return;
        try {
            await financeService.delete(id);
            setTransactions(transactions.filter(t => t.id !== id));
            toast.success('Deleted');
            loadAll();
        } catch { toast.error('Failed to delete'); }
    };

    const startEdit = (tx) => {
        setEditTx(tx);
        setForm({ type: tx.type, amount: String(tx.amount), category: tx.category, description: tx.description || '', date: tx.date });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditTx(null);
        setForm({ type: 'expense', amount: '', category: 'Food', description: '', date: new Date().toISOString().split('T')[0] });
    };

    const saveBudget = async () => {
        const val = parseFloat(budgetInput);
        if (isNaN(val) || val <= 0) return toast.error('Enter valid budget');
        try {
            const updatedProfile = await authService.updateProfile({ 
                preferences: { ...user.preferences, finance_budget: val } 
            });
            updateUser(updatedProfile.data.user);
            setBudget(val);
            setBudgetInput('');
            toast.success('Budget saved to profile! 🏦');
        } catch {
            toast.error('Failed to save budget');
        }
    };

    const budgetUsed = budget > 0 ? Math.min((summary.totalExpense / budget) * 100, 100) : 0;
    const budgetAlert = budget > 0 && summary.totalExpense >= budget * 0.8;

    if (loading) return (
        <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-foreground">Finance</h1>
                    <p className="text-muted-foreground text-sm">Track your income & expenses</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Period selector */}
                    <div className="flex gap-1">
                        {PERIODS.map(p => (
                            <button key={p.days} onClick={() => setPeriod(p.days)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p.days ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowForm(true)} className="neon-button flex items-center gap-2">
                        <Plus size={16} /> Add Entry
                    </button>
                </div>
            </div>

            {/* Budget Alert */}
            {budgetAlert && (
                <div className="glass-card p-4 border border-rose-500/30 bg-rose-500/5">
                    <p className="text-sm text-rose-400 flex items-center gap-2">
                        ⚠️ You've used {Math.round(budgetUsed)}% of your ₹{budget.toLocaleString('en-IN')} monthly budget!
                    </p>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="inline-flex p-2 rounded-lg bg-emerald-500/15 mb-3">
                        <TrendingUp size={18} className="text-emerald-400" />
                    </div>
                    <p className="text-xl font-bold text-emerald-400">{INR(summary.totalIncome)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Total Income</p>
                </div>
                <div className="stat-card">
                    <div className="inline-flex p-2 rounded-lg bg-rose-500/15 mb-3">
                        <TrendingDown size={18} className="text-rose-400" />
                    </div>
                    <p className="text-xl font-bold text-rose-400">{INR(summary.totalExpense)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Total Spent</p>
                </div>
                <div className="stat-card">
                    <div className="inline-flex p-2 rounded-lg bg-primary/15 mb-3">
                        <DollarSign size={18} className="text-primary" />
                    </div>
                    <p className={`text-xl font-bold ${summary.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{INR(summary.balance)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Net Balance</p>
                </div>
                <div className="stat-card">
                    <div className="inline-flex p-2 rounded-lg bg-amber-500/15 mb-3">
                        <Calendar size={18} className="text-amber-400" />
                    </div>
                    <p className="text-xl font-bold text-amber-400">{INR(summary.todayExpense)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Spent Today</p>
                </div>
            </div>

            {/* Budget Section */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-foreground text-sm">Monthly Budget</h2>
                    <div className="flex items-center gap-2">
                        <input
                            type="number" placeholder="Set budget (₹)"
                            className="input-field text-xs py-1.5 w-32"
                            value={budgetInput}
                            onChange={e => setBudgetInput(e.target.value)}
                        />
                        <button onClick={saveBudget} className="text-xs neon-button py-1.5 px-3">Set</button>
                    </div>
                </div>
                {budget > 0 ? (
                    <>
                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span>{INR(summary.totalExpense)} spent</span>
                            <span className={budgetAlert ? 'text-rose-400' : ''}>Budget: {INR(budget)}</span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${budgetAlert ? 'bg-gradient-to-r from-rose-500 to-red-400' : 'bg-primary'}`}
                                style={{ width: `${budgetUsed}%` }}
                            />
                        </div>
                    </>
                ) : (
                    <p className="text-xs text-muted-foreground">Set a monthly budget to track spending limits.</p>
                )}
            </div>

            {/* Charts */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                        <BarChart2 size={18} className="text-primary" />
                        Analytics
                    </h2>
                    <div className="flex gap-2">
                        {/* Charts selector */}
                        {[
                            { key: 'trend', label: 'Trend' },
                            { key: 'category', label: 'Categories' },
                            { key: 'weekly', label: 'Weekly' },
                        ].map(({ key, label }) => (
                            <button key={key} onClick={() => setActiveChart(key)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${activeChart === key ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {activeChart === 'trend' && analytics.dailyTrend.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={analytics.dailyTrend}>
                            <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} 
                                tickFormatter={d => format(new Date(d + 'T00:00:00'), 'MM/dd')}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis 
                                tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} 
                                width={40} 
                                tickFormatter={v => `₹${v}`}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'hsl(var(--card))', 
                                    border: '1px solid hsl(var(--border))', 
                                    borderRadius: '8px', 
                                    fontSize: '12px',
                                    color: 'hsl(var(--foreground))'
                                }} 
                                formatter={v => [`₹${v}`, '']}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="income" 
                                stroke="#10B981" 
                                fill="#10B981" 
                                fillOpacity={0.1}
                                name="Income" 
                                dot={false}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="expense" 
                                stroke="#EF4444" 
                                fill="#EF4444" 
                                fillOpacity={0.1}
                                name="Expense" 
                                dot={false}
                            />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', color: 'hsl(var(--foreground))' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}

                {activeChart === 'category' && analytics.categoryBreakdown.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={analytics.categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                {analytics.categoryBreakdown.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={v => [`₹${v}`, '']} 
                                contentStyle={{ 
                                    backgroundColor: 'hsl(var(--card))', 
                                    border: '1px solid hsl(var(--border))', 
                                    borderRadius: '8px', 
                                    fontSize: '12px',
                                    color: 'hsl(var(--foreground))'
                                }} 
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}

                {activeChart === 'weekly' && analytics.weeklySummary.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={analytics.weeklySummary}>
                            <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} tickFormatter={d => format(new Date(d + 'T00:00:00'), 'MMM d')} />
                            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} width={40} tickFormatter={v => `₹${v}`} />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'hsl(var(--card))', 
                                    border: '1px solid hsl(var(--border))', 
                                    borderRadius: '8px', 
                                    fontSize: '12px',
                                    color: 'hsl(var(--foreground))'
                                }} 
                                formatter={v => [`₹${v}`, '']} 
                            />
                            <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="Income" />
                            <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expense" />
                            <Legend wrapperStyle={{ paddingTop: '10px', color: 'hsl(var(--foreground))' }} />
                        </BarChart>
                    </ResponsiveContainer>
                )}

                {analytics.dailyTrend.length === 0 && (
                    <div className="h-40 flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">No data for this period. Add some transactions!</p>
                    </div>
                )}
            </div>

            {/* Transaction List */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-semibold text-foreground">Transactions</h2>
                    <div className="flex gap-2">
                        {['', 'income', 'expense'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                                {f || 'All'}
                            </button>
                        ))}
                    </div>
                </div>

                {transactions.length === 0 ? (
                    <div className="text-center py-12">
                        <DollarSign size={40} className="text-muted-foreground mx-auto mb-3" />
                        <p className="text-foreground font-medium">No transactions yet</p>
                        <button onClick={() => setShowForm(true)} className="neon-button mt-4 inline-flex items-center gap-2">
                            <Plus size={16} /> Add First Entry
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {transactions.map(tx => (
                            <div key={tx.id} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all group">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'income' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                                    {tx.type === 'income' ? <TrendingUp size={18} className="text-emerald-400" /> : <TrendingDown size={18} className="text-rose-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-foreground truncate">{tx.category}</p>
                                        {tx.description && <p className="text-xs text-muted-foreground truncate">· {tx.description}</p>}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{format(new Date(tx.date + 'T00:00:00'), 'dd MMM yyyy')}</p>
                                </div>
                                <p className={`text-sm font-bold flex-shrink-0 ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {tx.type === 'income' ? '+' : '-'}{INR(tx.amount)}
                                </p>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(tx)} className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground">
                                        <Edit3 size={13} />
                                    </button>
                                    <button onClick={() => deleteTx(tx.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-rose-400">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-md p-6 glow-border animate-in">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-display text-lg font-semibold text-foreground">{editTx ? 'Edit Transaction' : 'Add Transaction'}</h2>
                            <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Type toggle */}
                            <div className="flex gap-2">
                                {['income', 'expense'].map(t => (
                                    <button type="button" key={t} onClick={() => setForm({ ...form, type: t, category: t === 'income' ? 'Salary' : 'Food' })}
                                        className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all ${form.type === t ? (t === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30') : 'bg-secondary text-muted-foreground'}`}>
                                        {t === 'income' ? '💰' : '💸'} {t}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Amount (₹) *</label>
                                    <input type="number" min="0" step="0.01" className="input-field" placeholder="0.00"
                                        value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                                    <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        {(form.type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                                <input className="input-field" placeholder="Optional description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                                <input type="date" className="input-field" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={resetForm} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground transition-all">Cancel</button>
                                <button type="submit" className="flex-1 neon-button py-2.5">{editTx ? 'Update' : 'Add'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
