import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, ShieldCheck, Database, Key, CheckCircle2, AlertCircle, Sun, Moon } from 'lucide-react';

interface AuthPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ isDark, onToggleTheme }) => {
  const { loginWithEmail, isLiveSupabase, supabaseUrl, configureSupabase } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Supabase config modal state
  const [customUrl, setCustomUrl] = useState(supabaseUrl || '');
  const [customKey, setCustomKey] = useState('');
  const [configSuccess, setConfigSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setFeedback({ type: 'error', message: 'Please enter a valid business or personal email address.' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await loginWithEmail(email);
      setFeedback({ type: 'success', message: res.message });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Authentication failed. Please retry.' });
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen flex flex-col justify-between bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold text-sm tracking-tight">
            DG
          </div>
          <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
            DomainGuard
          </span>
          <span className="text-neutral-400 dark:text-neutral-600 text-xs font-mono ml-1 hidden sm:inline">
            WHOIS & Expiry Engine
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Supabase backend status button */}
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors text-neutral-600 dark:text-neutral-400"
            title="Configure Supabase API Key & Backend"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isLiveSupabase ? 'Supabase Connected' : 'Supabase API Key'}</span>
          </button>

          {/* Dark Mode toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 rounded text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Authentication Center Box */}
      <main className="w-full max-w-md mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-xs">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white mb-1.5">
              Access Domain Monitor
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Sign in with your email to manage your enterprise domain portfolio and receive expiration alerts.
            </p>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`mb-5 p-3.5 text-xs flex items-start gap-2.5 rounded ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              )}
              <span className="leading-relaxed">{feedback.message}</span>
            </div>
          )}

          {/* Clean Email-Only Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 tracking-wide"
              >
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@enterprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-semibold rounded transition-colors disabled:opacity-60 cursor-pointer"
            >
              <span>{isLoading ? 'Verifying Session...' : 'Continue with Email'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Pre-fill for Testing */}
          <div className="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <span className="text-neutral-400 dark:text-neutral-500 block mb-2">Quick test accounts:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEmail('shenz.terra@gmail.com')}
                className="px-2 py-1 text-xs font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
              >
                shenz.terra@gmail.com
              </button>
              <button
                type="button"
                onClick={() => setEmail('devops@paycloud.io')}
                className="px-2 py-1 text-xs font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
              >
                devops@paycloud.io
              </button>
            </div>
          </div>

          {/* Security footnote */}
          <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
            <span>Supabase Auth helper session protection</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs text-neutral-400 dark:text-neutral-600">
        <span>DomainGuard Security & Portfolio Monitoring · Real-time ICANN RDAP & DNS Verification</span>
      </footer>

      {/* Supabase API Key Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 max-w-md w-full p-6 shadow-xl rounded">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  Supabase Backend Settings
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
              Connect your Supabase project to enforce cloud session tokens and manage multi-tenant domain databases.
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
