import { WifiOff, Wifi, RefreshCw, CloudOff, Clock } from "lucide-react";

interface OfflineStatusBarProps {
  isOnline: boolean;
  wasOffline: boolean;
  isSyncing: boolean;
  pendingCount: number;
}

const OfflineStatusBar = ({
  isOnline,
  wasOffline,
  isSyncing,
  pendingCount,
}: OfflineStatusBarProps) => {
  // Nothing to show when fully online, no pending, and no recent reconnect
  if (isOnline && !wasOffline && !isSyncing && pendingCount === 0) {
    return null;
  }

  // Syncing state after reconnect
  if (isSyncing) {
    return (
      <div className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-950 to-indigo-950 border-b border-blue-500/30 flex items-center justify-center gap-3">
        <RefreshCw className="h-4 w-4 text-blue-400 animate-spin shrink-0" />
        <span className="text-sm font-semibold text-blue-200">
          Syncing {pendingCount} pending action{pendingCount !== 1 ? "s" : ""}...
        </span>
      </div>
    );
  }

  // Reconnected confirmation flash
  if (isOnline && wasOffline) {
    return (
      <div className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-950 to-teal-950 border-b border-emerald-500/30 flex items-center justify-center gap-3 animate-fade-in">
        <Wifi className="h-4 w-4 text-emerald-400 shrink-0" />
        <span className="text-sm font-semibold text-emerald-300">
          ✅ Back Online! All data is up to date.
        </span>
      </div>
    );
  }

  // Offline mode banner
  if (!isOnline) {
    return (
      <div className="w-full px-4 py-3 bg-gradient-to-r from-red-950/90 to-rose-950/90 border-b border-red-500/40 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30 shrink-0">
            <WifiOff className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-200 leading-none">
              You are offline
            </p>
            <p className="text-xs text-red-300/70 mt-0.5">
              नेटवर्क नहीं है • నెట్‌వర్క్ లేదు • Internet connection unavailable
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-full font-bold">
              <Clock className="h-3.5 w-3.5" />
              {pendingCount} action{pendingCount !== 1 ? "s" : ""} pending sync
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-slate-800/60 border border-border/50 text-slate-400 px-3 py-1.5 rounded-full">
            <CloudOff className="h-3.5 w-3.5 text-emerald-500/80" />
            <span>
              <strong className="text-emerald-400">Inventory data is safe</strong> — stored locally
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Online but has stale pending (shouldn't normally show, edge case)
  if (isOnline && pendingCount > 0) {
    return (
      <div className="w-full px-4 py-2 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-center gap-2 text-xs">
        <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <span className="text-amber-300 font-semibold">
          {pendingCount} action{pendingCount !== 1 ? "s" : ""} queued from offline session — awaiting sync
        </span>
      </div>
    );
  }

  return null;
};

export default OfflineStatusBar;
