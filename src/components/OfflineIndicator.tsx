import { WifiOff } from 'lucide-react';

interface Props {
  isOnline: boolean;
}

export function OfflineIndicator({ isOnline }: Props) {
  if (isOnline) return null;

  return (
    <div className="bg-amber-500/90 backdrop-blur-md text-slate-950 px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 shadow-sm animate-pulse sticky top-0 z-50">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Offline mode active &middot; You can still record offerings and expenses; changes will sync once reconnected.</span>
    </div>
  );
}
