import { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Apple, 
  Monitor, 
  Copy, 
  Check, 
  Share2, 
  Sparkles, 
  ShieldCheck, 
  Wifi, 
  Zap, 
  Camera, 
  ExternalLink,
  Info
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teamCode: string;
}

export function InstallInfographicModal({ isOpen, onClose, teamCode }: Props) {
  const { canPrompt, isStandalone, isIOS, isAndroid, promptInstall } = usePWAInstall();
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android' | 'desktop'>(
    isIOS ? 'ios' : isAndroid ? 'android' : 'desktop'
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedGuide, setCopiedGuide] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(teamCode || 'BCC-RELOAD');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BCC: Reload · Shared Finance & Offering Tracker',
          text: `Access BCC: Reload Ministry Finance App. Team Code: ${teamCode || 'BCC-RELOAD'}. Install on your home screen for quick access:`,
          url: currentUrl,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyGuide = () => {
    const guideText = `📱 *BCC: Reload - Ministry Finance App*
🔗 Link: ${currentUrl}
🔑 Team Code: *${teamCode || 'BCC-RELOAD'}*
👤 Authorized Default Member: Bem

📲 *How to Install on Phone:*
• *iPhone (Safari)*: Open link in Safari ➔ Tap Share button [↑] ➔ Select "Add to Home Screen" ➔ Tap "Add"
• *Android (Chrome)*: Open link in Chrome ➔ Tap "Install App" or menu [⋮] ➔ "Add to Home Screen" / "Install App"
• *Desktop*: Click the install icon in the address bar

⚡ Features: Offline support, Offering denomination counter, receipt photo scanner, and real-time ministry sync!`;

    navigator.clipboard.writeText(guideText);
    setCopiedGuide(true);
    setTimeout(() => setCopiedGuide(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 px-6 py-6 text-white border-b border-indigo-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
                <img src="/icon.svg" alt="BCC Reload" className="w-full h-full rounded-2xl object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold tracking-tight">Access & Install App</h3>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                    PWA Ready
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  How to setup BCC: Reload on mobile & desktop for authorized members
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Install Bar if Native Prompt is Available */}
          {canPrompt && !isStandalone && (
            <div className="mt-4 p-3 bg-indigo-500/20 border border-indigo-400/40 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-200">
                  Ready to install directly with one tap!
                </span>
              </div>
              <button
                onClick={async () => {
                  await promptInstall();
                  onClose();
                }}
                className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition shrink-0 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Install Now
              </button>
            </div>
          )}

          {isStandalone && (
            <div className="mt-4 p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Great news! You are currently running BCC: Reload as an installed standalone app.</span>
            </div>
          )}
        </div>

        {/* Share & Credentials Card */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Authorized Member Credentials & Link
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* App URL Box */}
            <div className="bg-white dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Application Link</span>
              <div className="flex items-center justify-between gap-2 mt-1">
                <code className="text-xs text-indigo-600 dark:text-indigo-400 font-mono truncate font-semibold">
                  {currentUrl}
                </code>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handleCopyLink}
                    title="Copy URL"
                    className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 transition"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={handleNativeShare}
                      title="Share link"
                      className="p-1.5 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg text-indigo-600 dark:text-indigo-400 transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Team Code & Authorized Member Box */}
            <div className="bg-white dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Team Sync Code</span>
                <span className="text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                  Member: Bem
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <code className="text-xs font-mono font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                  {teamCode || 'BCC-RELOAD'}
                </code>
                <button
                  onClick={handleCopyCode}
                  title="Copy Team Code"
                  className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 transition shrink-0"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={handleCopyGuide}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
            >
              {copiedGuide ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Instructions Copied for Messenger/Chat!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Instructions to share with team</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step-by-Step Installation Infographic by Platform */}
        <div className="p-6">
          {/* Platform Selector Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
            <button
              onClick={() => setActivePlatform('android')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                activePlatform === 'android'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Android (Chrome)</span>
              {isAndroid && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
            </button>

            <button
              onClick={() => setActivePlatform('ios')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                activePlatform === 'ios'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Apple className="w-4 h-4" />
              <span>iPhone (Safari)</span>
              {isIOS && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>}
            </button>

            <button
              onClick={() => setActivePlatform('desktop')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                activePlatform === 'desktop'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Desktop / PC / Mac</span>
            </button>
          </div>

          {/* Infographic Steps Content */}
          <div className="space-y-4">
            {activePlatform === 'android' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Step 1 */}
                <div className="relative p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm mb-3">
                    1
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                    Open in Chrome
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Open the link inside <strong className="text-slate-700 dark:text-slate-300">Google Chrome</strong> on your Android phone.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm mb-3">
                    2
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                    Tap Install or ⋮ Menu
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Click the <strong className="text-slate-700 dark:text-slate-300">"Install App"</strong> button at the top, or tap the three vertical dots (⋮).
                  </p>
                </div>

                {/* Step 3 */}
                <div className="relative p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm mb-3">
                    3
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                    Add to Home Screen
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Tap <strong className="text-slate-700 dark:text-slate-300">"Install app"</strong>. The BCC: Reload icon will be added to your home screen!
                  </p>
                </div>
              </div>
            )}

            {activePlatform === 'ios' && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400">
                  <ExternalLink className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Important for iPhone users:</strong> You must open this page in <strong>Apple Safari</strong>. Other iOS browsers like Chrome or in-app Messenger browsers do not support adding PWAs directly.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Step 1 */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm mb-3">
                      1
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                      Tap Share [↑]
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      At the bottom bar of Safari, tap the <strong>Share button</strong> (square box with an arrow pointing up).
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm mb-3">
                      2
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                      "Add to Home Screen"
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong> (indicated by a [+] icon).
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm mb-3">
                      3
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                      Tap "Add"
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Tap <strong>"Add"</strong> in the top right corner. BCC Reload will launch as a native fullscreen app without Safari address bars!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activePlatform === 'desktop' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-center text-sm mb-3">
                    1
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                    Open in Modern Browser
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Open the link in Google Chrome, Microsoft Edge, or Brave on your PC or Mac.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-center text-sm mb-3">
                    2
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                    Click Address Bar Icon
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Look for the <strong>Install icon</strong> (computer monitor with download arrow or [+] icon) on the far right of the address bar.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-center text-sm mb-3">
                    3
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                    Launch Standalone Window
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Click <strong>Install</strong>. BCC: Reload will open in its own clean window, dockable to your taskbar or Mac Dock!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Benefits of Installing Badge Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-3">
              Why Install BCC: Reload?
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Fast 1-Tap Access</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Offline Resilience</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Instant Receipts</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Cloud Sync & Backup</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Need help? Contact the ministry finance administrator.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold text-xs rounded-xl transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
