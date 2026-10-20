import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Loader2,
  HelpCircle,
  Eye,
  EyeOff,
  Search,
  Shield,
} from 'lucide-react';

interface AuthPageProps {
  onNavigateToLookup?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onNavigateToLookup,
  isDark = false,
  onToggleTheme,
}) => {
  const { login, register, forgotPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setFeedback({ type: 'error', message: res.message || 'Invalid email or password.' });
        }
      } else if (mode === 'register') {
        if (password.length < 6) {
          setFeedback({ type: 'error', message: 'Password must be at least 6 characters.' });
          setIsSubmitting(false);
          return;
        }
        const res = await register(name || email.split('@')[0], email, password);
        if (!res.success) {
          setFeedback({ type: 'error', message: res.message || 'Registration failed.' });
        }
      } else if (mode === 'forgot_password') {
        const res = await forgotPassword(email);
        setFeedback({
          type: res.success ? 'success' : 'error',
          message: res.message,
        });
        if (res.success) {
          setTimeout(() => setMode('login'), 3500);
        }
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'An unexpected authentication error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setMode('login');
    setFeedback(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F3F4F8] dark:bg-[#0B0E23] text-[#101432] dark:text-white transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#101432] text-[#D6F24B] border border-[#1B2050] flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
            <Shield className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-display text-[19px] font-extrabold tracking-tight text-[#101432] dark:text-white">
              DomainGuard
            </span>
            <span className="text-[#5B6178] text-xs font-mono ml-2.5 hidden sm:inline">
              Portfolio Ledger
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {onNavigateToLookup && (
            <button
              type="button"
              onClick={onNavigateToLookup}
              className="btn-neutral-surface flex items-center gap-2 cursor-pointer text-xs"
              title="Search domain expiry and registrar without logging in"
            >
              <Search className="w-3.5 h-3.5 text-[#2A3AF0]" />
              <span>WHOIS Finder</span>
            </button>
          )}

          {/* Dark Mode toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle dark mode"
              className="btn-neutral-surface p-2 cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-[#FFC21A]" /> : <Moon className="w-4 h-4 text-[#101432]" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col justify-center">
        <div className="border border-[#E2E4EE] dark:border-[#1F2756] bg-white dark:bg-[#101432] p-6 sm:p-8 shadow-xs rounded-[14px]">
          {/* Tabs: Sign In / Create Account */}
          <div className="flex items-center p-1 bg-[#F3F4F8] dark:bg-[#0E122B] rounded-full mb-6 text-xs font-medium border border-[#E2E4EE] dark:border-[#1F2756]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setFeedback(null);
              }}
              className={`flex-1 py-2 rounded-full transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#101432] text-white dark:bg-white dark:text-[#101432] shadow-xs'
                  : 'text-[#5B6178] hover:text-[#101432] dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setFeedback(null);
              }}
              className={`flex-1 py-2 rounded-full transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#101432] text-white dark:bg-white dark:text-[#101432] shadow-xs'
                  : 'text-[#5B6178] hover:text-[#101432] dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
            {mode === 'forgot_password' && (
              <span className="flex-1 py-2 text-center rounded-full bg-[#101432] text-white dark:bg-white dark:text-[#101432] shadow-xs">
                Reset
              </span>
            )}
          </div>

          {/* Header Title */}
          <div className="mb-6">
            <h1 className="font-display text-[24px] font-extrabold tracking-[-0.025em] text-[#101432] dark:text-white mb-1 leading-tight">
              {mode === 'login'
                ? 'Welcome Back'
                : mode === 'register'
                ? 'Create Your Account'
                : 'Reset Your Password'}
            </h1>
            <p className="text-[13px] text-[#5B6178] leading-relaxed">
              {mode === 'login'
                ? 'Enter your credentials to access your private domain portfolio and alerts.'
                : mode === 'register'
                ? 'Register your account to manage WHOIS data, notifications, and personalized monitoring.'
                : 'Enter your account email to receive verification instructions.'}
            </p>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3.5 mb-5 rounded-[10px] text-xs flex items-center gap-2.5 border ${
                feedback.type === 'error'
                  ? 'bg-[#FFF4F2] text-[#D63A2C] border-[#FCDAD7]'
                  : 'bg-[#D7F4E6] text-[#0B7A57] border-[#A2EAD1]'
              }`}
            >
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span className="leading-normal">{feedback.message}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#101432] dark:text-white mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6178]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white placeholder:text-[#5B6178] focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0] transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#101432] dark:text-white mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6178]" />
                <input
                  type="email"
                  required
                  placeholder="admin@domainguard.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white placeholder:text-[#5B6178] focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0] transition-all font-mono"
                />
              </div>
            </div>

            {mode !== 'forgot_password' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#101432] dark:text-white">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setFeedback(null);
                      }}
                      className="text-xs text-[#2A3AF0] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6178]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-[13px] bg-[#F3F4F8] dark:bg-[#0E122B] border border-[#E2E4EE] dark:border-[#1F2756] rounded-[10px] text-[#101432] dark:text-white placeholder:text-[#5B6178] focus:outline-none focus:border-[#2A3AF0] focus:ring-1 focus:ring-[#2A3AF0] transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5B6178] hover:text-[#101432] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-ultramarine w-full flex items-center justify-center gap-2 py-2.5 px-5 disabled:opacity-60 cursor-pointer shadow-sm mt-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === 'register' ? (
                <>
                  <span>Create Account &amp; Setup Portfolio</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Send Password Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill Accounts */}
          <div className="mt-6 pt-5 border-t border-[#E2E4EE] dark:border-[#1F2756]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="eyebrow-label text-[#5B6178]">
                Instant Demo Access
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E6E8FF] text-[#2A3AF0] font-semibold">
                Pre-Seeded
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@domainguard.io', 'Admin123!')}
                className="p-2.5 rounded-[10px] border border-[#E2E4EE] dark:border-[#1F2756] bg-[#F3F4F8] dark:bg-[#0E122B] hover:border-[#2A3AF0] text-left transition-all group cursor-pointer"
              >
                <div className="font-semibold text-[#101432] dark:text-white flex items-center justify-between">
                  <span>Administrator</span>
                  <span className="text-[10px] text-[#2A3AF0] group-hover:underline">Fill &rarr;</span>
                </div>
                <div className="font-mono text-[11px] text-[#5B6178] truncate mt-0.5">
                  admin@domainguard.io
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('demo@domainguard.io', 'Demo123!')}
                className="p-2.5 rounded-[10px] border border-[#E2E4EE] dark:border-[#1F2756] bg-[#F3F4F8] dark:bg-[#0E122B] hover:border-[#2A3AF0] text-left transition-all group cursor-pointer"
              >
                <div className="font-semibold text-[#101432] dark:text-white flex items-center justify-between">
                  <span>Demo Engineer</span>
                  <span className="text-[10px] text-[#2A3AF0] group-hover:underline">Fill &rarr;</span>
                </div>
                <div className="font-mono text-[11px] text-[#5B6178] truncate mt-0.5">
                  demo@domainguard.io
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-[#5B6178] font-mono">
        DomainGuard · ICANN WHOIS &amp; RDAP Portfolio Ledger
      </footer>
    </div>
  );
};
