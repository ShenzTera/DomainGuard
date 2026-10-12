import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Database,
  Key,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Loader2,
  RefreshCw,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AuthPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export const AuthPage: React.FC<AuthPageProps> = ({ isDark, onToggleTheme }) => {
  const { login, register, loginWithGoogle, forgotPassword, resetPassword, isLiveSupabase, supabaseUrl, configureSupabase } = useAuth();

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

  // Supabase config modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customUrl, setCustomUrl] = useState(supabaseUrl || '');
  const [customKey, setCustomKey] = useState('');
  const [configSuccess, setConfigSuccess] = useState('');

  // Google OAuth modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('shenz.terra@gmail.com');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
            message: `Verification code generated for ${cleanEmail}: ${res.resetCode || 'Check email'}. Enter your new password below.`,
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
      setFeedback({ type: 'error', message: err.message || 'Authentication error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleQuickSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = googleEmailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFeedback({ type: 'error', message: 'Please enter a valid Google email address.' });
      return;
    }

    setIsGoogleLoading(true);
    try {
      const res = await loginWithGoogle(cleanEmail);
      setFeedback({ type: 'success', message: res.message || 'Signed in with Google!' });
      setShowGoogleModal(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Google sign-in error.' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl || !customKey) return;
    const res = await configureSupabase(customUrl, customKey);
    if (res.success) {
      setConfigSuccess('Supabase credentials successfully linked.');
      setTimeout(() => {
        setShowConfigModal(false);
        setConfigSuccess('');
      }, 1200);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setMode('login');
    setFeedback(null);
  };

  const quickSignIn = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setMode('login');
    setFeedback(null);
    setIsLoading(true);
    try {
      const res = await login(demoEmail, demoPass);
      setFeedback({ type: 'success', message: res.message || 'Signed in successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to sign in.' });
    } finally {
      setIsLoading(false);
    }
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

        <div className="flex items-center gap-3">
          {/* Supabase status button */}
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors text-neutral-700 dark:text-neutral-300"
            title="Configure Supabase API Key & Backend"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">{isLiveSupabase ? 'Supabase Connected' : 'Supabase Config'}</span>
          </button>

          {/* Dark Mode toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 rounded-md text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full max-w-lg mx-auto px-3 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col justify-center">
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-9 shadow-sm rounded-lg">
          {/* Tabs: Sign In / Create Account */}
          <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setFeedback(null);
              }}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
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
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
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
                ? 'Enter your credentials to manage your domain portfolios and expiration alerts.'
                : mode === 'register'
                ? 'Register your company profile to monitor WHOIS status and automated 48-hour reminders.'
                : 'Enter your account email to receive a password reset code.'}
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

            {/* Password field (Login, Register, and Reset Step 2) */}
            {(mode === 'login' || mode === 'register' || (mode === 'forgot_password' && resetStep === 2)) && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
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
                      className="text-xs text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'register' && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Minimum 6 characters. Stored securely with scrypt cryptographic salt.
                  </p>
                )}
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
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-colors font-mono"
                  />
                </div>
              </div>
            )}

            {/* Reset Code Input (Forgot Password Step 2) */}
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
                className="w-full text-center text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white pt-1"
              >
                &larr; Back to Sign In
              </button>
            )}
          </form>

          {/* Social Sign-in Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div>
            </div>
            <span className="relative bg-white dark:bg-neutral-900 px-3 text-xs text-neutral-400 dark:text-neutral-500 uppercase">
              Or continue with
            </span>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={() => setShowGoogleModal(true)}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-950 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-sm font-semibold rounded-md transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* Quick Demo Pre-fill & 1-Click Login Box */}
          <div className="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                Demo credentials & 1-click test login:
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Cloudflare Ready
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickSignIn('admin@domainguard.io', 'Admin123!')}
                className="p-2 text-left text-xs bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer group"
              >
                <div className="font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                  <span>Admin Lead</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 group-hover:underline">1-Click Login &rarr;</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">admin@domainguard.io</div>
              </button>
              <button
                type="button"
                onClick={() => quickSignIn('demo@domainguard.io', 'Demo123!')}
                className="p-2 text-left text-xs bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer group"
              >
                <div className="font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                  <span>Demo Engineer</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 group-hover:underline">1-Click Login &rarr;</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">demo@domainguard.io</div>
              </button>
            </div>
          </div>

          {/* Security & Static Hosting footnote */}
          <div className="mt-5 space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Cryptographic session management with client & edge failover protection</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-neutral-400 dark:text-neutral-600">
        <span>DomainGuard Security & Portfolio Monitoring · Real-time ICANN RDAP & DNS Verification</span>
      </footer>

      {/* Google Sign-in Information & 1-Click Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-w-md w-full p-6 shadow-xl rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Google Account Sign-In
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            {/* Quick 1-Click Sign-In Form */}
            <form onSubmit={handleGoogleQuickSignIn} className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Google Account Email:
                </label>
                <input
                  type="email"
                  required
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>1-Click Sign In with this Google Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Production Cloud OAuth Explanation */}
            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
              <span className="font-semibold text-neutral-900 dark:text-white block">
                Production Google OAuth 2.0 Web Client Setup:
              </span>
              <p className="leading-relaxed">
                For custom domains with live Google OAuth popup consent, configure credentials in Google Cloud Console:
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-1 bg-neutral-50 dark:bg-neutral-950 p-3 rounded border border-neutral-200 dark:border-neutral-800">
                <li>Create an <strong>OAuth 2.0 Web Application</strong> in GCP APIs &amp; Services.</li>
                <li>Add your domain to <strong>Authorized JavaScript origins</strong>.</li>
                <li>Add your callback URL to <strong>Authorized redirect URIs</strong>.</li>
                <li>You can also sign up directly with standard email &amp; password above.</li>
              </ol>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="px-4 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase API Key Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-w-md w-full p-6 shadow-xl rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Supabase Cloud Synchronization
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
              DomainGuard includes full built-in authentication out of the box. You can also optionally connect your Supabase project for multi-region database replication.
            </p>

            {configSuccess && (
              <div className="mb-4 p-2.5 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800">
                {configSuccess}
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Supabase Anon API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded transition-colors"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
