export const MESSENGER_UNREAD_KEY = "halo_messenger_unread_count";
export const MESSENGER_UNREAD_EVENT = "halo_messenger_unread_updated";

function sanitizeCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

export function readMessengerUnreadCount(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.localStorage.getItem(MESSENGER_UNREAD_KEY);
  const parsed = Number(raw);
  return sanitizeCount(parsed);
}

export function writeMessengerUnreadCount(count: number): void {
  if (typeof window === "undefined") {
    return;
  }

  const nextCount = sanitizeCount(count);
  window.localStorage.setItem(MESSENGER_UNREAD_KEY, String(nextCount));
  window.dispatchEvent(new CustomEvent(MESSENGER_UNREAD_EVENT, { detail: { count: nextCount } }));
}
