import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  LogIn, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldAlert,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import firebaseConfig from '../../firebase-applet-config.json';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: Props) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [domainCopied, setDomainCopied] = useState(false);

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const projectId = firebaseConfig.projectId || 'tokyo-vault-q0z9n';
  const authorizedDomainsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;
  const providersUrl = `https://console.firebase.google.com/project/${projectId}/authentication/providers`;

  const handleCopyDomain = () => {
    if (!currentHost) return;
    navigator.clipboard.writeText(currentHost);
    setDomainCopied(true);
    setTimeout(() => setDomainCopied(false), 2500);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setErrorCode(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      const code = err?.code || '';
      const msg = err?.message || '';

      if (code === 'auth/unauthorized-domain' || msg.includes('auth/unauthorized-domain')) {
        setErrorCode('auth/unauthorized-domain');
        setError(`This domain (${currentHost}) is not authorized yet in your Firebase Console project.`);
      } else if (code === 'auth/popup-blocked' || msg.includes('auth/popup-blocked')) {
        setErrorCode('auth/popup-blocked');
        setError('The Google sign-in popup was blocked by your mobile browser. Please allow popups or tap Continue with Google again.');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled before completing.');
      } else {
        setErrorCode(code);
        setError(msg || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError('Please provide your full name or nickname');
          setLoading(false);
          return;
        }
        await signUpWithEmail(email.trim(), password, name.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
      onClose();
    } catch (err: any) {
      console.error('Email Auth error:', err);
      const code = err?.code || '';
      const msg = err?.message || '';

      if (code === 'auth/operation-not-allowed' || msg.includes('auth/operation-not-allowed')) {
        setErrorCode('auth/operation-not-allowed');
        setError('Email/Password provider is currently disabled in your Firebase project.');
      } else if (code === 'auth/unauthorized-domain' || msg.includes('auth/unauthorized-domain')) {
        setErrorCode('auth/unauthorized-domain');
        setError(`Domain ${currentHost} must be authorized in Firebase Console.`);
      } else if (code === 'auth/invalid-credential' || msg.includes('auth/invalid-credential') || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('Invalid email or password. Please verify your credentials.');
      } else if (code === 'auth/email-already-in-use') {
        setError('This email address is already registered. Please sign in instead.');
      } else if (code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else {
        setErrorCode(code);
        setError(msg || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-slate-900 dark:text-white my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white text-xs">
              BCC
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold">
              {isSignUp ? 'Create Workspace Account' : 'Sign In to BCC: Reload'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Access the shared ministry ledger, offering records, & comments
            </p>
          </div>
        </div>

        {/* Actionable Diagnostic Card for auth/unauthorized-domain */}
        {errorCode === 'auth/unauthorized-domain' && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 text-xs space-y-3">
            <div className="flex items-start gap-2.5 font-bold text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <div className="text-xs">Action Required: Authorize Domain in Firebase</div>
                <div className="text-[11px] font-normal text-amber-700 dark:text-amber-300/90 mt-0.5">
                  Firebase blocks sign-ins on new domains until added to your project allowlist.
                </div>
              </div>
            </div>

            {/* Hostname Copy Box */}
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-slate-400">Your Current Domain</div>
                <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 truncate select-all">
                  {currentHost}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 shrink-0 shadow-xs transition active:scale-95"
              >
                {domainCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {domainCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* 3 Step Quick Instructions */}
            <div className="space-y-1 text-[11px] text-amber-800/90 dark:text-amber-200/90">
              <div className="font-semibold text-slate-700 dark:text-slate-300">How to fix in 30 seconds:</div>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Tap <strong>Open Firebase Settings</strong> below.</li>
                <li>Scroll to <strong>Authorized domains</strong> & click <strong>Add domain</strong>.</li>
                <li>Paste the copied domain and click <strong>Save</strong>.</li>
              </ol>
            </div>

            <a
              href={authorizedDomainsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98"
            >
              <span>Open Firebase Authorized Domains</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Actionable Diagnostic Card for auth/operation-not-allowed */}
        {errorCode === 'auth/operation-not-allowed' && (
          <div className="mb-5 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-200 text-xs space-y-3">
            <div className="flex items-start gap-2.5 font-bold text-indigo-800 dark:text-indigo-300">
              <Settings className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              <div>
                <div className="text-xs">Action Required: Enable Email/Password Provider</div>
                <div className="text-[11px] font-normal text-indigo-700 dark:text-indigo-300/90 mt-0.5">
                  Email/Password accounts are disabled by default in new Firebase projects.
                </div>
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-indigo-900/90 dark:text-indigo-200/90">
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Click <strong>Open Sign-in Providers</strong> below.</li>
                <li>Click <strong>Email/Password</strong> and switch the toggle to <strong>Enable</strong>.</li>
                <li>Click <strong>Save</strong>.</li>
              </ol>
            </div>

            <a
              href={providersUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98"
            >
              <span>Open Sign-in Providers in Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* General Error Message */}
        {error && errorCode !== 'auth/unauthorized-domain' && errorCode !== 'auth/operation-not-allowed' && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google One-Click Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-center gap-3 transition active:scale-98 disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
          <span className="bg-white dark:bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
            or with email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Full Name / Nickname
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bem Lagat"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@church.org"
                required
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : isSignUp ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Create Workspace Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setErrorCode(null);
            }}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register here"}
          </button>
        </div>
      </div>
    </div>
  );
}
