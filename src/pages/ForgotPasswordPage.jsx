import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return toast.error('Please enter your email');
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email: email.trim() });
            setSent(true);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-mesh-gradient opacity-40 pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative animate-in">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
                    <ArrowLeft size={16} />
                    Back to Sign In
                </Link>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-[0_0_40px_var(--primary-glow)] mb-4 animate-[float_3s_ease-in-out_infinite]">
                        <span className="text-white text-2xl font-bold">P</span>
                    </div>
                    <h1 className="font-display text-3xl font-bold text-foreground mb-1">
                        {sent ? 'Check Your Email' : 'Reset Password'}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {sent ? `We sent a reset link to ${email}` : 'Enter your email to get a reset link'}
                    </p>
                </div>

                <div className="glass-card p-8 glow-border">
                    {sent ? (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                                <CheckCircle size={32} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-foreground font-medium mb-2">Reset link sent!</p>
                                <p className="text-sm text-muted-foreground">
                                    Please check your inbox and click the link to reset your password. The link expires in 1 hour.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <button
                                    onClick={() => { setSent(false); setEmail(''); }}
                                    className="w-full py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all text-sm"
                                >
                                    Try a different email
                                </button>
                                <Link to="/login" className="block w-full text-center neon-button py-2.5">
                                    Back to Sign In
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="email"
                                        className="input-field pl-10"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full neon-button flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : 'Send Reset Link'}
                            </button>

                            <div className="text-center">
                                <p className="text-muted-foreground text-sm">
                                    Remember your password?{' '}
                                    <Link to="/login" disable-tw-text-color="true" className="text-primary hover:opacity-80 font-medium transition-colors">
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
