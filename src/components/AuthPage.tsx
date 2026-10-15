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
} from 'lucide-react';

interface AuthPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onNavigateToLookup?: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export const AuthPage: React.FC<AuthPageProps> = ({ isDark, onToggleTheme, onNavigateToLookup }) => {
  const { login, register, forgotPassword, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [resetCode, setResetCode] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Validation
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setFeedback({ type: 'error', message: 'Please provide your full name.' });
        return;
      }
      if (!password || password.length < 6) {
        setFeedback({ type: 'error', message: 'Password must be at least 6 characters long.' });
        return;
      }
      if (password !== confirmPassword) {
        setFeedback({ type: 'error', message: 'Passwords do not match. Please re-enter.' });
        return;
      }
    } else if (mode === 'login') {
      if (!password) {
        setFeedback({ type: 'error', message: 'Please enter your account password.' });
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        const res = await register(name, cleanEmail, password);
        setFeedback({
          type: 'success',
          message: `🎉 ${res.message || 'Account registered successfully!'} Welcome to DomainGuard.`,
        });
      } else if (mode === 'login') {
        const res = await login(cleanEmail, password);
        setFeedback({ type: 'success', message: res.message || 'Signed in successfully!' });
      } else if (mode === 'forgot_password') {
        if (resetStep === 1) {
          const res = await forgotPassword(cleanEmail);
          setResetStep(2);
          if (res.resetCode) {
            setResetCode(res.resetCode);
          }
          setFeedback({
            type: 'info',
            message: `Verification instructions generated for ${cleanEmail}. ${res.resetCode ? `Code: ${res.resetCode}` : 'Check your email.'} Enter your new password below.`,
          });
        } else {
          if (!resetCode.trim()) {
            setFeedback({ type: 'error', message: 'Please enter the reset verification code.' });
            setIsLoading(false);
            return;
          }
          if (!password || password.length < 6) {
            setFeedback({ type: 'error', message: 'New password must be at least 6 characters long.' });
            setIsLoading(false);
            return;
          }
          await resetPassword(resetCode, password);
          setFeedback({
            type: 'success',
            message: 'Password successfully updated! You can now sign in with your new password.',
          });
          setMode('login');
          setResetStep(1);
          setPassword('');
        }
      }
    } catch (err: any) {
      let msg = err.message || 'Authentication error occurred.';
      if (msg.toLowerCase().includes('rate limit')) {
        msg = 'Email rate limit reached on the auth provider. If you already created this account, please switch to Sign In with your email and password.';
      }
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setMode('login');
    setFeedback(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            DG
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-neutral-950 dark:text-white">
              DomainGuard
            </span>
            <span className="text-neutral-500 dark:text-neutral-400 text-xs font-mono ml-2 hidden sm:inline">
              Enterprise WHOIS & Expiration Monitor
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onNavigateToLookup && (
            <button
              type="button"
              onClick={onNavigateToLookup}
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Search domain expiry and registrar without logging in"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Expiry &amp; Registrar Finder</span>
            </button>
          )}

          {/* Dark Mode toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 rounded-md text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col justify-center">
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-9 shadow-sm rounded-lg">
          {/* Tabs: Sign In / Create Account */}
          <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setFeedback(null);
              }}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'border-neutral-950 dark:border-white text-neutral-950 dark:text-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
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
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'border-neutral-950 dark:border-white text-neutral-950 dark:text-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              Create Account
            </button>
            {mode === 'forgot_password' && (
              <span className="pb-3 px-4 text-sm font-semibold border-b-2 border-amber-600 text-amber-600 dark:text-amber-400">
                Reset Password
              </span>
            )}
          </div>

          {/* Header Title */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 dark:text-white mb-1.5">
              {mode === 'login'
                ? 'Welcome Back'
                : mode === 'register'
                ? 'Create Your Enterprise Account'
                : 'Reset Your Password'}
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
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
              className={`mb-5 p-3.5 text-sm flex items-start gap-2.5 rounded-md ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                  : feedback.type === 'info'
                  ? 'bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : feedback.type === 'info' ? (
                <HelpCircle className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              )}
              <span className="leading-relaxed">{feedback.message}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name field (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@enterprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
                />
              </div>
            </div>

            {/* Password input */}
            {(mode === 'login' || mode === 'register' || (mode === 'forgot_password' && resetStep === 2)) && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                    {mode === 'forgot_password' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setResetStep(1);
                        setFeedback(null);
                      }}
                      className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wide">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Verification Code input (Forgot Password Step 2) */}
            {mode === 'forgot_password' && resetStep === 2 && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wide">
                  Verification Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DG-123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-colors font-mono"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-semibold rounded-md transition-colors disabled:opacity-60 cursor-pointer shadow-xs mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? 'Sign In to Dashboard'
                      : mode === 'register'
                      ? 'Create Account & Sign In'
                      : resetStep === 1
                      ? 'Send Verification Code'
                      : 'Update Password & Sign In'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch mode links */}
            {mode === 'login' && (
              <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 pt-1">
                Don't have an enterprise account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setFeedback(null);
                  }}
                  className="font-semibold text-neutral-900 dark:text-white hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 pt-1">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setFeedback(null);
                  }}
                  className="font-semibold text-neutral-900 dark:text-white hover:underline cursor-pointer"
                >
                  Sign in with your credentials
                </button>
              </p>
            )}

            {/* Cancel / Back to Login if in Forgot Password mode */}
            {mode === 'forgot_password' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setResetStep(1);
                  setFeedback(null);
                }}
                className="w-full text-center text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white pt-1 cursor-pointer"
              >
                &larr; Back to Sign In
              </button>
            )}
          </form>

          {/* Quick Test Accounts Box */}
          <div className="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                Demo Accounts (Click to Fill &amp; Test):
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                Encrypted Auth
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@domainguard.io', 'Admin123!')}
                className="p-2 text-left text-xs bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer group"
              >
                <div className="font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                  <span>Admin Lead</span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 group-hover:underline">Fill &rarr;</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">admin@domainguard.io</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('demo@domainguard.io', 'Demo123!')}
                className="p-2 text-left text-xs bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer group"
              >
                <div className="font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                  <span>Demo Engineer</span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 group-hover:underline">Fill &rarr;</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">demo@domainguard.io</div>
              </button>
            </div>
          </div>

          {/* Privacy & multi-tenant isolation footnote */}
          <div className="mt-5 space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Personalized user isolation: Each account has its own private tracked portfolio</span>
            </div>
          </div>

          {/* Public lookup alternative link */}
          {onNavigateToLookup && (
            <div className="mt-4 pt-3.5 border-t border-neutral-100 dark:border-neutral-800 text-center">
              <button
                type="button"
                onClick={onNavigateToLookup}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5 text-neutral-400" />
                <span>Need a quick check? <strong>Search Expiry &amp; Registrar without signing in &rarr;</strong></span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-neutral-400 dark:text-neutral-600">
        <span>DomainGuard Security & Portfolio Monitoring · Real-time ICANN RDAP & DNS Verification</span>
      </footer>
    </div>
  );
};
