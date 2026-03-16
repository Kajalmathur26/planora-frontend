import { useState, useEffect, useRef } from 'react';
import { taskService } from '../services';
import { Play, Pause, RotateCcw, Coffee, Timer, CheckCircle, History, AlertTriangle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const FOCUS_DURATION = 25 * 60;  // 25 minutes in seconds
const BREAK_DURATION = 5 * 60;   // 5 minutes

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FocusModePage() {
    const [mode, setMode] = useState('focus'); // 'focus' | 'break'
    const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
    const [running, setRunning] = useState(false);
    const [sessions, setSessions] = useState(() => {
        try { return JSON.parse(localStorage.getItem('planora_focus_sessions') || '[]'); } catch { return []; }
    });
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [strictMode, setStrictMode] = useState(false);
    const [strictViolation, setStrictViolation] = useState(false);
    const intervalRef = useRef(null);
    const totalTime = mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;

    useEffect(() => {
        taskService.getAll({ status: 'pending' }).then(r => setTasks(r.data?.tasks || [])).catch(() => { });
    }, []);

    // Store onSessionEnd in a ref so useEffect always has the latest version
    // without needing to restart the timer interval on every re-render
    const onSessionEndRef = useRef(null);
    onSessionEndRef.current = () => {
        if (mode === 'focus') {
            const session = {
                id: Date.now(),
                task: selectedTask?.title || 'Free focus',
                duration: 25,
                completedAt: new Date().toISOString(),
            };
            setSessions(prev => {
                const updated = [session, ...prev.slice(0, 19)];
                localStorage.setItem('planora_focus_sessions', JSON.stringify(updated));
                return updated;
            });
            setMode('break');
            setTimeLeft(BREAK_DURATION);
        } else {
            setMode('focus');
            setTimeLeft(FOCUS_DURATION);
        }
    };

    useEffect(() => {
        if (running && !strictViolation) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) {
                        clearInterval(intervalRef.current);
                        setRunning(false);
                        onSessionEndRef.current();
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [running, strictViolation]);

    // Update browser tab title
    useEffect(() => {
        const original = document.title;
        if (running) {
            document.title = `${formatTime(timeLeft)} ${mode === 'focus' ? '🎯 Focus' : '☕ Break'} – Planora`;
        } else {
            document.title = original;
        }
        return () => { document.title = 'Planora'; };
    }, [timeLeft, running, mode]);

    // Strict Mode: Visibility Change Detection
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && running && strictMode && mode === 'focus') {
                // User left the tab
                setStrictViolation(true);
                toast.error('Stay focused! Strict mode is active.', {
                    icon: '⚠️',
                    duration: 5000
                });
            }
        };

        const handleBeforeUnload = (e) => {
            if (running && strictMode && mode === 'focus') {
                e.preventDefault();
                e.returnValue = 'You are in strict focus mode! Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [running, strictMode, mode]);


    const toggleTimer = () => setRunning(r => !r);

    const reset = () => {
        setRunning(false);
        setTimeLeft(mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION);
    };

    const switchMode = (m) => {
        setRunning(false);
        setMode(m);
        setTimeLeft(m === 'focus' ? FOCUS_DURATION : BREAK_DURATION);
    };

    const progress = (totalTime - timeLeft) / totalTime;
    const strokeOffset = CIRCUMFERENCE * (1 - progress);

    return (
        <div className="space-y-6 max-w-2xl mx-auto relative">
            
            {/* Strict Mode Overlay */}
            {strictViolation && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="text-center space-y-6 max-w-sm">
                        <div className="w-24 h-24 mx-auto rounded-full bg-rose-500/20 flex items-center justify-center animate-pulse border border-rose-500/50">
                            <AlertTriangle size={48} className="text-rose-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-display font-bold text-rose-500 mb-2">Focus Lost!</h2>
                            <p className="text-lg text-foreground/80">You switched tabs during strict mode.</p>
                        </div>
                        <button
                            onClick={() => setStrictViolation(false)}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 px-8 rounded-2xl w-full text-lg shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all active:scale-95"
                        >
                            I will stay focused
                        </button>
                    </div>
                </div>
            )}

            <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Focus Mode</h1>
                <p className="text-muted-foreground text-sm">Deep work with the Pomodoro technique</p>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-2">
                <button onClick={() => switchMode('focus')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'focus' ? 'bg-primary text-white shadow-[0_0_15px_var(--primary-glow)]' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                    <Timer size={15} /> Focus (25 min)
                </button>
                <button onClick={() => switchMode('break')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'break' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                    <Coffee size={15} /> Break (5 min)
                </button>
            </div>

            {/* Timer Circle */}
            <div className="glass-card p-8 text-center">
                <div className="relative inline-flex items-center justify-center">
                    <svg width="200" height="200" className="rotate-[-90deg]">
                        <circle cx="100" cy="100" r={RADIUS} stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                        <circle
                            cx="100" cy="100" r={RADIUS}
                            stroke={mode === 'focus' ? 'var(--primary)' : '#10B981'}
                            strokeWidth="8" fill="none"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={strokeOffset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 8px ${mode === 'focus' ? 'var(--primary-glow)' : 'rgba(16,185,129,0.4)'})` }}
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="font-mono text-4xl font-bold text-foreground">{formatTime(timeLeft)}</span>
                        <span className="text-xs text-muted-foreground mt-1 capitalize">{mode === 'focus' ? '🎯 Focus time' : '☕ Take a break'}</span>
                    </div>
                </div>

                {/* Strict Mode Toggle */}
                {mode === 'focus' && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setStrictMode(!strictMode)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${strictMode ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-secondary text-muted-foreground hover:bg-white/5 border border-transparent'}`}
                        >
                            <AlertTriangle size={14} />
                            Strict Mode: {strictMode ? 'ON' : 'OFF'}
                        </button>
                    </div>
                )}

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mt-6">
                    <button onClick={reset} className="p-3 rounded-xl bg-secondary hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all">
                        <RotateCcw size={20} />
                    </button>
                    <button
                        onClick={toggleTimer}
                        className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-semibold text-white transition-all hover:scale-105 ${mode === 'focus'
                            ? 'bg-primary shadow-[0_0_20px_var(--primary-glow)]'
                            : 'bg-gradient-to-r from-emerald-600 to-green-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                            }`}
                    >
                        {running ? <Pause size={20} /> : <Play size={20} />}
                        {running ? 'Pause' : 'Start'}
                    </button>
                </div>

                {/* Task selector */}
                <div className="mt-6 flex flex-col items-center">
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">Focusing on:</label>
                    <select
                        className="input-field text-sm max-w-xs text-center"
                        value={selectedTask?.id || ''}
                        onChange={e => setSelectedTask(tasks.find(t => t.id === e.target.value) || null)}
                    >
                        <option value="">Free focus session</option>
                        {tasks.map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                    </select>
                    {strictMode && running && (
                        <p className="text-[10px] text-amber-500 mt-2 flex items-center gap-1 animate-pulse">
                            <Lock size={10} /> Tab lock active (Strict Mode)
                        </p>
                    )}
                </div>
            </div>

            {/* Session History */}
            {sessions.length > 0 && (
                <div className="glass-card p-5">
                    <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                        <History size={18} className="text-primary" />
                        Session History
                    </h2>
                    <div className="space-y-2">
                        {sessions.slice(0, 10).map(s => (
                            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle size={16} className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{s.task}</p>
                                    <p className="text-xs text-muted-foreground">{s.duration} min focus</p>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {new Date(s.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">
                            Total: <span className="text-primary font-semibold">{sessions.length} sessions</span> · {sessions.length * 25} min focused
                        </p>
                    </div>
                </div>
            )}

            {/* Tips */}
            <div className="glass-card p-5">
                <h3 className="font-semibold text-foreground mb-3 text-sm">💡 Pomodoro Tips</h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                    <li>• Focus deeply for 25 minutes, then take a 5-minute break</li>
                    <li>• After 4 pomodoros, take a longer break (15-30 minutes)</li>
                    <li>• <b>Strict Mode:</b> Turn this on to get warned if you leave this tab!</li>
                    <li>• Put your phone away and close unrelated tabs during focus time</li>
                    <li>• Track what you worked on to see your daily productivity!</li>
                </ul>
            </div>
        </div>
    );
}
