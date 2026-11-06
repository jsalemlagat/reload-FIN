import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { 
  Sun, 
  Moon, 
  RefreshCw, 
  Users, 
  Share2, 
  Check, 
  Copy,
  ChevronDown,
  AlertCircle,
  LogIn,
  LogOut,
  Shield,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AuthModal } from './AuthModal';
import { NotificationCenter } from './NotificationCenter';

export default function TopBar() {
  const { 
    teamData, 
    darkMode, 
    setDarkMode, 
    syncStatus, 
    lastSynced,
    syncWithCloud, 
    joinTeamCode,
    currentMember,
    setCurrentMember,
    addMember,
    workspaceMembers
  } = useFinance();

  const { currentUser, currentMember: authMember, logout } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamCodeInput, setTeamCodeInput] = useState(teamData.teamCode);
  const [copied, setCopied] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(teamData.teamCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCodeInput.trim()) return;
    await joinTeamCode(teamCodeInput.trim());
    setShowTeamModal(false);
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    addMember(newMemberName.trim());
    setCurrentMember(newMemberName.trim());
    setNewMemberName('');
    setIsAddingMember(false);
    setShowMemberDropdown(false);
  };

  const role = authMember?.role || 'encoder';

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Brand & Team */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-extrabold flex items-center justify-center text-xs shadow-md shadow-indigo-600/30 tracking-tight">
              BCC
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                BCC: Reload
              </span>
              <button
                onClick={() => setShowTeamModal(true)}
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-left flex items-center gap-1 transition-colors"
                title="Single Shared Firestore Workspace"
              >
                <span className="truncate max-w-[120px]">Workspace: {teamData.teamCode}</span>
                <Share2 className="w-2.5 h-2.5 opacity-70" />
              </button>
            </div>
          </div>

          {/* Member Profile & Roles */}
          <div className="relative">
            <button
              onClick={() => setShowMemberDropdown(!showMemberDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors max-w-[160px] sm:max-w-[200px]"
            >
              <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">{currentMember}</span>
              <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
            </button>

            {showMemberDropdown && (
              <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2.5 z-50 text-xs">
                <div className="font-semibold text-slate-400 dark:text-slate-400 px-2 py-1 uppercase tracking-wider text-[10px] flex items-center justify-between">
                  <span>Workspace Members</span>
                  <span className="text-indigo-500 font-bold">{workspaceMembers.length} active</span>
                </div>
                <div className="max-h-48 overflow-y-auto my-1 space-y-1">
                  {workspaceMembers.length > 0 ? (
                    workspaceMembers.map((m) => (
                      <button
                        key={m.uid}
                        onClick={() => {
                          setCurrentMember(m.displayName || m.email);
                          setShowMemberDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between ${
                          currentMember === (m.displayName || m.email)
                            ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="truncate min-w-0 pr-2">
                          <div className="font-medium truncate">{m.displayName || m.email}</div>
                          <div className="text-[10px] text-slate-400 truncate">{m.email}</div>
                        </div>
                        <span className={`px-1.5 py-0.5 text-[9px] uppercase font-bold rounded-md shrink-0 ${
                          m.role === 'admin'
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                            : m.role === 'encoder'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {m.role}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-2 py-2 text-slate-400 text-xs">
                      Default member: Bem
                    </div>
                  )}
                </div>

                {!isAddingMember ? (
                  <button
                    onClick={() => setIsAddingMember(true)}
                    className="w-full text-left px-2.5 py-1.5 text-indigo-600 dark:text-indigo-400 hover:underline font-medium border-t border-slate-100 dark:border-slate-700/80 mt-1 pt-1.5"
                  >
                    + Register Additional Logger
                  </button>
                ) : (
                  <form onSubmit={handleCreateMember} className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-700 space-y-1">
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="e.g. Deaconess Ruth"
                      autoFocus
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddingMember(false)}
                        className="px-2 py-0.5 text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2 py-0.5 bg-indigo-600 text-white rounded font-medium"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Controls: Notifications, Sync, Auth & Theme */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* PWA Install Button */}
            <PWAInstallButton teamCode={teamData.teamCode} />

            {/* Real-time Notifications Bell */}
            <NotificationCenter />

            {/* Firestore Cloud Sync Status Indicator */}
            <button
              onClick={() => syncWithCloud()}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                syncStatus === 'synced'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
                  : syncStatus === 'syncing'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60'
              }`}
              title={`Firestore Real-time Sync: ${syncStatus.toUpperCase()}`}
            >
              {syncStatus === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
              ) : syncStatus === 'synced' ? (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
              <span className="text-[11px] font-bold tracking-tight hidden sm:inline">
                {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'synced' ? 'Live Firestore' : 'Offline'}
              </span>
            </button>

            {/* User Auth Profile / Login */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title={`${currentUser.email} (${role})`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 text-xs space-y-2">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.displayName || 'Authorized Member'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {currentUser.email}
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          role === 'admin'
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                            : role === 'encoder'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {role}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left py-1.5 px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl flex items-center gap-2 font-medium transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Dark Mode Switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Light / Dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Single Shared Firestore Workspace
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              All transactions, offering counts, and comments are stored securely in Firestore and synchronized instantly across authorized devices.
            </p>

            <div className="my-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">Workspace Code</div>
                <div className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                  {teamData.teamCode}
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white flex items-center gap-1.5 hover:bg-indigo-500 transition-colors shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="w-full py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
