import { useState } from 'react';
import { Download, Sparkles, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { InstallInfographicModal } from './InstallInfographicModal';

interface Props {
  teamCode: string;
}

export function PWAInstallButton({ teamCode }: Props) {
  const { canPrompt, isStandalone, promptInstall } = usePWAInstall();
  const [showInfographic, setShowInfographic] = useState(false);

  const handleClick = async () => {
    if (canPrompt && !isStandalone) {
      const outcome = await promptInstall();
      if (outcome === 'manual' || outcome === 'dismissed') {
        setShowInfographic(true);
      }
    } else {
      setShowInfographic(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all shadow-xs active:scale-95 ${
          !isStandalone
            ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-indigo-500/20'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
        }`}
        title="View Install Infographic & Share App"
      >
        {!isStandalone ? (
          <>
            <Download className="w-3.5 h-3.5 animate-bounce shrink-0" />
            <span className="hidden sm:inline">Install App</span>
            <span className="sm:hidden">Install</span>
            {canPrompt && (
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-300"></span>
              </span>
            )}
          </>
        ) : (
          <>
            <Smartphone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="hidden sm:inline">Installed &middot; Share</span>
            <span className="sm:hidden">Share</span>
          </>
        )}
      </button>

      <InstallInfographicModal
        isOpen={showInfographic}
        onClose={() => setShowInfographic(false)}
        teamCode={teamCode}
      />
    </>
  );
}
