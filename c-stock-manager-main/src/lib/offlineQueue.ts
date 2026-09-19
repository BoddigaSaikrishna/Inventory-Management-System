// Offline Action Queue — stores pending inventory actions in localStorage
// so they can be replayed when the user comes back online.

import type { ParsedVoiceIntent } from "@/types/inventory";

const OFFLINE_QUEUE_KEY = "voicestock_offline_queue";

export interface OfflineQueueEntry {
  id: string;
  timestamp: string;
  intent: ParsedVoiceIntent;
}

/**
 * Load the current queue from localStorage
 */
export function getOfflineQueue(): OfflineQueueEntry[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Add a new action to the offline queue
 */
export function enqueueOfflineAction(intent: ParsedVoiceIntent): OfflineQueueEntry {
  const queue = getOfflineQueue();
  const entry: OfflineQueueEntry = {
    id: "oq_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
    timestamp: new Date().toISOString(),
    intent,
  };
  queue.push(entry);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  return entry;
}

/**
 * Get count of pending offline actions
 */
export function getPendingOfflineCount(): number {
  return getOfflineQueue().length;
}

/**
 * Drain all queued entries (returns them and clears the queue)
 */
export function drainOfflineQueue(): OfflineQueueEntry[] {
  const queue = getOfflineQueue();
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  return queue;
}

/**
 * Remove a single entry from the queue by ID
 */
export function removeFromOfflineQueue(id: string): void {
  const queue = getOfflineQueue().filter((e) => e.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Clear all pending offline actions (used after successful sync)
 */
export function clearOfflineQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}
