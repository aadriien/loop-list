import { AUTH_STORAGE_KEY } from "../constants/sync";
import type { Session } from "../types/auth";

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    // Sessions saved before search existed are a bare token string
    if (!raw.startsWith("{"))
      return { token: raw, canSearch: false, isOwner: false };
    const session = JSON.parse(raw);
    return typeof session.token === "string" ? session : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null) {
  try {
    if (session)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // storage blocked: you'll just have to sign in again next visit
  }
}
