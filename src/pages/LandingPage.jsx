import { Link } from 'react-router-dom';
import { CheckSquare, BookOpen, Target, Flame, Heart, Sparkles, ArrowRight, Calendar, DollarSign, Timer, Star, TrendingUp, Zap, Shield, Moon } from 'lucide-react';

const FEATURES = [
  { icon: CheckSquare, color: 'violet', title: 'Smart Task Management', desc: 'Kanban board with priority levels, status tracking, and AI-powered suggestions to keep you focused.' },
  { icon: BookOpen, color: 'rose', title: 'Rich Journal Editor', desc: 'Write beautifully formatted entries with images, stickers, font styles, and mood tracking.' },
  { icon: Target, color: 'amber', title: 'Goal Tracking', desc: 'Set nested sub-goals, track progress with visual bars, and follow a roadmap timeline to success.' },
  { icon: Flame, color: 'orange', title: 'Habit Streaks', desc: 'Build powerful daily habits with streak tracking, completion charts, and break-detection alerts.' },
  { icon: Heart, color: 'pink', title: 'Mood Analytics', desc: 'Log emotions daily, view 30-day trends, and discover how your mood correlates with productivity.' },
  { icon: DollarSign, color: 'emerald', title: 'Finance Manager', desc: 'Track income and expenses, visualize spending patterns, and set monthly budgets with alerts.' },
  { icon: Sparkles, color: 'indigo', title: 'AI Assistant', desc: 'Gemini-powered daily planner, smart task suggestions, and personalized productivity insights.' },
  { icon: Timer, color: 'blue', title: 'Focus Mode', desc: 'Pomodoro timer with task selection, session history and automatic break scheduling.' },
];

const STATS = [
  { value: '20+', label: 'Features' },
  { value: 'AI', label: 'Powered' },
  { value: '∞', label: 'Entries' },
  { value: '100%', label: 'Private' },
];

const COLOR_MAP = {
  violet: { bg: 'bg-violet-500/15', text: 'text-violet-400', shadow: 'shadow-violet-500/20' },
  rose: { bg: 'bg-rose-500/15', text: 'text-rose-400', shadow: 'shadow-rose-500/20' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', shadow: 'shadow-amber-500/20' },
  orange: { bg: 'bg-orange-500/15', text: 'text-orange-400', shadow: 'shadow-orange-500/20' },
  pink: { bg: 'bg-pink-500/15', text: 'text-pink-400', shadow: 'shadow-pink-500/20' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', shadow: 'shadow-emerald-500/20' },
  indigo: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', shadow: 'shadow-indigo-500/20' },
  blue: { bg: 'bg-blue-500/15', text: 'text-blue-400', shadow: 'shadow-blue-500/20' },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-border/30 backdrop-blur-xl" style={{ background: 'rgba(13,13,26,0.85)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_var(--primary-glow)]">
            <span className="text-white text-sm font-bold">P</span>
          </div>
          <span className="font-bold text-xl text-foreground tracking-tight">Planora</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link to="/register" className="text-sm px-4 py-2 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition-opacity shadow-[0_0_20px_var(--primary-glow)]">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.5) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-8">
            <Sparkles size={12} />
            Powered by Gemini AI
            <Sparkles size={12} />
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center shadow-[0_0_60px_var(--primary-glow)] animate-[float_3s_ease-in-out_infinite]">
              <span className="text-white text-5xl font-bold">P</span>
            </div>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Plan Better.{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Live Better.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Your all-in-one AI-powered digital planner, journal & life tracker — tasks, goals, habits, mood, finance, and more in one beautiful app.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-semibold text-lg hover:opacity-90 transition-all shadow-[0_0_30px_var(--primary-glow)] hover:shadow-[0_0_50px_rgba(var(--primary),0.6)] hover:scale-105"
            >
              GET STARTED — It's Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-border text-foreground font-semibold text-lg hover:bg-white/5 transition-all"
            >
              Sign In
            </Link>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-8 md:gap-16 mt-16 flex-wrap">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{value}</p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need, beautifully unified
            </h2>
            <p className="text-muted-foreground text-lg">All your productivity tools in one gorgeous workspace</p>
          </div>

          {/* Mock Dashboard Preview */}
          <div className="rounded-3xl border border-border/50 overflow-hidden shadow-2xl" style={{ background: 'hsl(224, 20%, 7%)' }}>
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50" style={{ background: 'hsl(224,20%,5%)' }}>
              <div className="w-3 h-3 rounded-full bg-rose-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <div className="flex-1 mx-4 h-5 rounded-md bg-white/5 flex items-center px-3">
                <span className="text-xs text-muted-foreground">planora.app/dashboard</span>
              </div>
            </div>
            <div className="flex min-h-[400px]">
              {/* Fake sidebar */}
              <div className="w-16 md:w-56 border-r border-border/50 p-3 md:p-4 flex flex-col gap-1 flex-shrink-0">
                <div className="flex items-center gap-3 p-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex-shrink-0 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                  <span className="hidden md:block font-bold text-sm text-foreground">Planora</span>
                </div>
                {[
                  { icon: '▪️', label: 'Dashboard', active: true },
                  { icon: '☑️', label: 'Tasks' },
                  { icon: '📖', label: 'Journal' },
                  { icon: '🎯', label: 'Goals' },
                  { icon: '🔥', label: 'Habits' },
                  { icon: '💰', label: 'Finance' },
                ].map(({ icon, label, active }) => (
                  <div key={label} className={`flex items-center gap-3 px-2 py-2 rounded-xl text-xs ${active ? 'bg-violet-600/20 text-violet-300' : 'text-muted-foreground'}`}>
                    <span>{icon}</span>
                    <span className="hidden md:block">{label}</span>
                  </div>
                ))}
              </div>
              {/* Fake main content */}
              <div className="flex-1 p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-5 w-48 rounded-lg bg-white/5 mb-2" />
                    <div className="h-3 w-32 rounded-lg bg-white/5" />
                  </div>
                  <div className="h-8 w-28 rounded-lg bg-violet-600/20" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['violet', 'emerald', 'rose', 'amber'].map((c, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/3 border border-border/30">
                      <div className={`w-8 h-8 rounded-lg bg-${c}-500/20 mb-2`} />
                      <div className="h-5 w-8 rounded bg-white/10 mb-1" />
                      <div className="h-3 w-16 rounded bg-white/5" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/3 border border-border/30 h-36">
                    <div className="h-4 w-32 rounded bg-white/10 mb-4" />
                    <div className="flex items-end gap-2 h-20">
                      {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-violet-600/60 to-indigo-600/40" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/3 border border-border/30 h-36 space-y-2">
                    <div className="h-4 w-24 rounded bg-white/10 mb-4" />
                    {[75, 50, 100].map((w, i) => (
                      <div key={i} className="space-y-1">
                        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500" style={{ width: `${w}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-600/10 text-violet-300 text-xs font-medium mb-4">
              <Zap size={12} />
              Feature-Rich
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built for serious achievers
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Every tool you need to organize your life, build habits, and reach your goals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, color, title, desc }) => {
              const c = COLOR_MAP[color];
              return (
                <div key={title} className="group glass-card p-5 hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-1">
                  <div className={`inline-flex p-3 rounded-xl ${c.bg} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon size={22} className={c.text} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Planora */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: '100% Private', desc: 'Your data stays secure with Row-Level Security. Only you can access your entries.', color: 'emerald' },
              { icon: Moon, title: 'Dark & Light Mode', desc: 'Switch between beautiful dark and light themes. Your eyes will thank you.', color: 'indigo' },
              { icon: TrendingUp, title: 'AI-Powered Insights', desc: 'Gemini AI analyzes your patterns and gives personalized productivity recommendations.', color: 'violet' },
            ].map(({ icon: Icon, title, desc, color }) => {
              const c = COLOR_MAP[color];
              return (
                <div key={title} className="text-center p-6 glass-card">
                  <div className={`inline-flex p-4 rounded-2xl ${c.bg} mb-4`}>
                    <Icon size={28} className={c.text} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">Loved by achievers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Arjun S.', role: 'CS Student', text: 'Finally an app that combines everything — tasks, journal, habits and AI. My productivity doubled!', rating: 5 },
              { name: 'Priya M.', role: 'Freelancer', text: 'The Finance Manager and AI Daily Planner are game-changers. I feel completely in control now.', rating: 5 },
              { name: 'Rahul K.', role: 'Entrepreneur', text: 'Goal tracking with sub-goals and the streak system keeps me motivated every single day.', rating: 5 },
            ].map(({ name, role, text, rating }) => (
              <div key={name} className="glass-card p-5">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{text}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(139,92,246,0.5)] animate-[float_3s_ease-in-out_infinite]">
            <span className="text-white text-4xl font-bold">P</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            Start planning your{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">best life</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of users who've transformed their productivity with Planora.
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xl hover:opacity-90 transition-all shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:shadow-[0_0_60px_rgba(139,92,246,0.6)] hover:scale-105"
          >
            GET STARTED — FREE
            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-sm text-muted-foreground mt-4">No credit card required · Free forever</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-bold text-foreground">Planora</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with React · Node.js · Supabase · Gemini AI
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
