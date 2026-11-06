import React, { useState, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  Users, 
  Cloud, 
  Download, 
  Upload, 
  RotateCcw, 
  CreditCard, 
  Tag as TagIcon, 
  Plus, 
  Trash2, 
  Share2, 
  Check, 
  Copy,
  FolderTree,
  Smartphone,
  Sparkles,
  Globe,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { InstallInfographicModal } from './InstallInfographicModal';
import { useAuth } from '../context/AuthContext';
import firebaseConfig from '../../firebase-applet-config.json';

export default function SettingsView() {
  const { 
    teamData, 
    workspaceMembers,
    updateMemberRole,
    joinTeamCode, 
    addMember, 
    addCategory, 
    addAccount, 
    addTag,
    resetToSampleData 
  } = useFinance();

  const { currentUser, isWorkspaceAdmin } = useAuth();

  const [teamCodeInput, setTeamCodeInput] = useState(teamData.teamCode);
  const [copied, setCopied] = useState(false);
  const [memberInput, setMemberInput] = useState('');
  const [accountInput, setAccountInput] = useState('');
  const [inflowCatInput, setInflowCatInput] = useState('');
  const [outflowCatInput, setOutflowCatInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [firebaseDomainCopied, setFirebaseDomainCopied] = useState(false);

  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(teamData.teamCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCodeInput.trim()) return;
    await joinTeamCode(teamCodeInput.trim());
  };

  const handleDownloadBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(teamData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `BCC_Reload_Backup_${teamData.teamCode}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.teamCode && parsed.transactions) {
          localStorage.setItem('bcc_reload_finance_team_data', JSON.stringify(parsed));
          window.location.reload();
        } else {
          alert('Invalid backup file format');
        }
      } catch (err) {
        alert('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-28 max-w-4xl mx-auto px-4 pt-4">
      {/* Top Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Team & System Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage team sync, authorized members, accounts, categories, and cloud backups
        </p>
      </div>

      {/* PWA Mobile App & Authorized Member Setup Infographic Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border border-indigo-500/30 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                PWA Mobile App & Installation Guide
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-semibold">
                  Infographic
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Easy step-by-step instructions for Android, iPhone Safari, and Desktop members
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowInstallModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Infographic</span>
          </button>
        </div>

        <div className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between gap-3">
          <span>
            Authorized members (like <strong>Bem</strong>) can install this app directly on their home screen for fullscreen offline access and camera receipt scans.
          </span>
          <button
            onClick={() => setShowInstallModal(true)}
            className="text-emerald-400 hover:underline font-semibold shrink-0 text-xs"
          >
            View Steps &rarr;
          </button>
        </div>
      </div>

      {/* Cloud Sync & Team Code Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Real-Time Cloud Synchronization
          </h2>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Any device connected with this Team Code automatically reads and updates the same ministry financial database in real time.
        </p>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Active Sync Code</div>
            <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tracking-wider">
              {teamData.teamCode}
            </div>
            <div className="text-[11px] text-slate-500">Team: {teamData.teamName}</div>
          </div>

          <button
            onClick={handleCopyCode}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all self-start sm:self-center"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Code Copied' : 'Share Sync Code'}
          </button>
        </div>

        {/* Switch / Connect Team Form */}
        <form onSubmit={handleJoin} className="flex gap-2 pt-1">
          <input
            type="text"
            value={teamCodeInput}
            onChange={(e) => setTeamCodeInput(e.target.value)}
            placeholder="Enter Team Code to Connect..."
            className="flex-1 px-3 py-2 text-xs uppercase font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 active:scale-95 transition-all"
          >
            Connect Team
          </button>
        </form>
      </div>

      {/* Firebase Console & Domain Allowlist Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Firebase Auth & Domain Setup
                <span className="px-2 py-0.5 text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-full font-bold">
                  {firebaseConfig.projectId || 'tokyo-vault-q0z9n'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fix for "auth/unauthorized-domain" on mobile phones & external browsers
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            Current App Domain (Copy & paste into Firebase Console):
          </div>
          <div className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <code className="font-mono text-xs text-indigo-600 dark:text-indigo-400 truncate select-all">
              {typeof window !== 'undefined' ? window.location.hostname : ''}
            </code>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard.writeText(window.location.hostname);
                  setFirebaseDomainCopied(true);
                  setTimeout(() => setFirebaseDomainCopied(false), 2000);
                }
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 shadow-xs transition shrink-0"
            >
              {firebaseDomainCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{firebaseDomainCopied ? 'Copied' : 'Copy Domain'}</span>
            </button>
          </div>

          <div className="pt-2 text-[11px] space-y-1 text-slate-500 dark:text-slate-400">
            <div className="font-semibold text-slate-700 dark:text-slate-300">Quick 2-step setup in Firebase:</div>
            <div>
              1. <strong>Authorize Domain:</strong> Click button below &rarr; Scroll to <em>Authorized domains</em> &rarr; Click <em>Add domain</em> &rarr; Paste your domain and save.
            </div>
            <div>
              2. <strong>Enable Email/Password (Optional):</strong> Go to <em>Sign-in method</em> &rarr; Click <em>Email/Password</em> &rarr; Toggle <em>Enable</em> &rarr; Save.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={`https://console.firebase.google.com/project/${firebaseConfig.projectId || 'tokyo-vault-q0z9n'}/authentication/settings`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <span>Open Authorized Domains Settings</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={`https://console.firebase.google.com/project/${firebaseConfig.projectId || 'tokyo-vault-q0z9n'}/authentication/providers`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <span>Open Sign-in Providers</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Cloud Backups & Data Export */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-emerald-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Secure Data Backup & Disaster Recovery
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Export full snapshots of transactions, offering breakdowns, and budgets for offline archiving or disaster recovery.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={handleDownloadBackup}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Encrypted JSON Snapshot</span>
          </button>

          <input
            type="file"
            ref={backupInputRef}
            accept=".json"
            onChange={handleRestoreBackup}
            className="hidden"
          />
          <button
            onClick={() => backupInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>Restore from File Backup</span>
          </button>
        </div>
      </div>

      {/* Real-time Workspace Members & Roles */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Workspace Members & Role Permissions
              </h2>
              <p className="text-[11px] text-slate-400">
                Single shared workspace (bcc-reload) synchronized via Firestore in real time
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            {workspaceMembers.length} active members
          </span>
        </div>

        <div className="space-y-2 pt-1">
          {workspaceMembers.length > 0 ? (
            workspaceMembers.map((m) => {
              const isMe = currentUser?.uid === m.uid;
              return (
                <div
                  key={m.uid}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {(m.displayName || m.email || 'M').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                        <span>{m.displayName || 'Authorized Member'}</span>
                        {isMe && (
                          <span className="text-[10px] text-indigo-500 font-semibold">(You)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate font-mono">
                        {m.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isWorkspaceAdmin && !isMe ? (
                      <select
                        value={m.role}
                        onChange={(e) => updateMemberRole(m.uid, e.target.value as 'admin' | 'encoder' | 'viewer')}
                        className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        <option value="admin">Admin (Full Control)</option>
                        <option value="encoder">Encoder (Can Log & Edit)</option>
                        <option value="viewer">Viewer (Read-only)</option>
                      </select>
                    ) : (
                      <span className={`px-2.5 py-1 text-[11px] uppercase font-bold rounded-lg ${
                        m.role === 'admin'
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          : m.role === 'encoder'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {m.role}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
              Default authorized member: <strong>Bem</strong>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <input
            type="text"
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            placeholder="Add member name..."
            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={() => {
              if (memberInput.trim()) {
                addMember(memberInput.trim());
                setMemberInput('');
              }
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
          >
            Add Member
          </button>
        </div>
      </div>

      {/* Accounts Management */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Payment & Storage Accounts
            </h2>
          </div>
          <span className="text-xs text-slate-400">{teamData.accounts.length} accounts</span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {teamData.accounts.map((acc) => (
            <span
              key={acc}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium"
            >
              {acc}
            </span>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <input
            type="text"
            value={accountInput}
            onChange={(e) => setAccountInput(e.target.value)}
            placeholder="Add account (e.g. Maya, BPI Savings, Petty Cash)..."
            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={() => {
              if (accountInput.trim()) {
                addAccount(accountInput.trim());
                setAccountInput('');
              }
            }}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
          >
            Add Account
          </button>
        </div>
      </div>

      {/* Categories & Tags Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inflow Categories */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
          <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Inflow Categories
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {teamData.categoriesInflow.map((cat) => (
              <span key={cat} className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                {cat}
              </span>
            ))}
          </div>
          <div className="flex gap-1.5 pt-1">
            <input
              type="text"
              value={inflowCatInput}
              onChange={(e) => setInflowCatInput(e.target.value)}
              placeholder="New inflow category"
              className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <button
              onClick={() => {
                if (inflowCatInput.trim()) {
                  addCategory('inflow', inflowCatInput.trim());
                  setInflowCatInput('');
                }
              }}
              className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg"
            >
              Add
            </button>
          </div>
        </div>

        {/* Outflow Categories */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
          <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Outflow Categories
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {teamData.categoriesOutflow.map((cat) => (
              <span key={cat} className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {cat}
              </span>
            ))}
          </div>
          <div className="flex gap-1.5 pt-1">
            <input
              type="text"
              value={outflowCatInput}
              onChange={(e) => setOutflowCatInput(e.target.value)}
              placeholder="New outflow category"
              className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <button
              onClick={() => {
                if (outflowCatInput.trim()) {
                  addCategory('outflow', outflowCatInput.trim());
                  setOutflowCatInput('');
                }
              }}
              className="px-2.5 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Reset to BCC: Reload Defaults */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Reset to BCC: Reload Defaults
          </div>
          <div className="text-[11px] text-slate-500">
            Clears transaction records and resets authorized member to Bem with clean accounts (Cash, E-Wallet, Bank Account).
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm('Reset to initial BCC: Reload clean state?')) {
              resetToSampleData();
            }
          }}
          className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Data
        </button>
      </div>

      <InstallInfographicModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        teamCode={teamData.teamCode}
      />
    </div>
  );
}
