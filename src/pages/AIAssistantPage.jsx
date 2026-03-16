import { useState, useRef, useEffect } from 'react';
import { aiService } from '../services';
import { Sparkles, Send, Bot, User, RefreshCw, Zap, BookOpen, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const QUICK_ACTIONS = [
  { icon: '📊', label: 'Analyze my productivity', message: 'Analyze my productivity based on my recent data and give me insights.' },
  { icon: '🎯', label: 'Suggest goals', message: 'Suggest some SMART goals for me to work on this quarter.' },
  { icon: '📝', label: 'Journal prompt', message: 'Give me a deep journaling prompt for today.' },
  { icon: '💪', label: 'Habit advice', message: 'What habits should I build to improve my productivity and wellbeing?' },
  { icon: '🧘', label: 'Stress management', message: 'Give me practical tips for managing stress and anxiety.' },
  { icon: '⏰', label: 'Time management', message: 'How can I better manage my time and avoid procrastination?' },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hi! I'm Plora, your AI productivity assistant powered by Gemini. I can help you with tasks, goals, habits, journaling, and more. What would you like to explore today? ✨",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: messageText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.chat({ message: messageText });
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.data.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please check your Gemini API key configuration and try again.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 1,
      role: 'assistant',
      content: "Chat cleared! I'm ready to help you again. What's on your mind? ✨",
      timestamp: new Date()
    }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_20px_var(--primary-glow)] animate-[float_3s_ease-in-out_infinite]">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              Plora AI
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/20">Gemini</span>
            </h1>
            <p className="text-xs text-muted-foreground">Your personal productivity assistant</p>
          </div>
        </div>
        <button onClick={clearChat} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" title="Clear chat">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0 scrollbar-none">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.label}
            onClick={() => sendMessage(action.message)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all text-xs whitespace-nowrap border border-border hover:border-primary/30 flex-shrink-0"
          >
            <span>{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_12px_var(--primary-glow)]">
                <Sparkles size={14} className="text-white" />
              </div>
            )}

            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-sm shadow-[0_0_15px_var(--primary-glow)]'
                  : msg.isError
                    ? 'glass-card border border-rose-500/30 text-foreground/80 rounded-tl-sm'
                    : 'glass-card border border-border text-foreground/90 rounded-tl-sm'
                }`}>
                {msg.content}
              </div>
              <span className="text-xs text-muted-foreground px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={14} className="text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start animate-in">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="glass-card border border-border p-3.5 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                {[0, 150, 300].map(delay => (
                  <div key={delay} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 glass-card p-2 glow-border">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none outline-none py-2 px-2 max-h-24 min-h-[40px]"
            placeholder="Ask Plora anything... (Enter to send)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all hover:shadow-[0_0_15px_var(--primary-glow)] active:scale-95 flex-shrink-0"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
