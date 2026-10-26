// Turns whatever is stored (or arrives from the server) into the current WontState shape. Plain
// module so the browser store and the sync route share it.
import type { WontState } from "./habits";
import { emptyState } from "./seed";

export const CURRENT_VERSION = 1;

/**
 * Migration hook: turns whatever is stored into the current shape. Bump CURRENT_VERSION and add a
 * step here when the shape changes; anything unreadable becomes a fresh state.
 */
export function migrate(raw: unknown): WontState {
  if (!raw || typeof raw !== "object") return emptyState();
  const s = raw as Partial<WontState> & { version?: number };
  // Future steps go here, e.g. if (s.version === 1) s = fromV1(s);
  // shortcut: an unknown version starts fresh instead of keeping the old data aside; add a
  // backup copy before the first real migration ships.
  if (s.version !== CURRENT_VERSION) return emptyState();
  return {
    version: 1,
    habits: Array.isArray(s.habits) ? s.habits : [],
    logs: s.logs && typeof s.logs === "object" ? s.logs : {},
    comebacksSeen: s.comebacksSeen && typeof s.comebacksSeen === "object" ? s.comebacksSeen : {},
    introSeen: !!s.introSeen,
  };
}
