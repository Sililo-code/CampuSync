import { useNetworkStatus } from '@/lib/network';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div 
      className="bg-destructive/95 backdrop-blur-sm text-destructive-foreground py-2.5 px-4 text-center text-xs font-bold flex items-center justify-center gap-2 w-full z-50 shadow-md animate-in slide-in-from-top duration-300 border-b border-destructive-foreground/10"
      id="offline-banner"
    >
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse text-white" />
      <span className="tracking-wide">
        Connection lost. Working in read-only mode — all database updates and session creations are disabled until you reconnect.
      </span>
    </div>
  );
}
