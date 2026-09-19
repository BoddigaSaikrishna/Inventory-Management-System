import { useState, useEffect, useCallback, useRef } from "react";
import {
  getPendingOfflineCount,
  drainOfflineQueue,
  OfflineQueueEntry,
} from "@/lib/offlineQueue";
import type { ParsedVoiceIntent } from "@/types/inventory";

interface OnlineStatusResult {
  isOnline: boolean;
  wasOffline: boolean;       // true for a brief window after reconnecting
  pendingCount: number;      // number of queued offline actions
  isSyncing: boolean;        // currently replaying offline queue
}

type SyncHandler = (entries: OfflineQueueEntry[]) => void;

/**
 * Hook that tracks online / offline status and handles auto-sync
 * when the connection is restored.
 *
 * @param onSync — callback to replay queued actions after reconnect
 */
export function useOnlineStatus(onSync?: SyncHandler): OnlineStatusResult {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(() => getPendingOfflineCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const onSyncRef = useRef(onSync);

  // Keep callback ref fresh without triggering effect re-runs
  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  // Refresh pending count from localStorage
  const refreshCount = useCallback(() => {
    setPendingCount(getPendingOfflineCount());
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setWasOffline(true);

      const pending = getPendingOfflineCount();
      setPendingCount(pending);

      if (pending > 0 && onSyncRef.current) {
        setIsSyncing(true);
        // Small delay so the "Reconnecting..." UI is visible briefly
        await new Promise((r) => setTimeout(r, 600));
        const drained = drainOfflineQueue();
        onSyncRef.current(drained);
        setPendingCount(0);
        setIsSyncing(false);
      }

      // Clear "wasOffline" flash after 4 seconds
      setTimeout(() => setWasOffline(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Also poll every 10s to keep pendingCount fresh
    const interval = setInterval(refreshCount, 10_000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [refreshCount]);

  return { isOnline, wasOffline, pendingCount, isSyncing };
}
