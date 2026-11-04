import { useCallback, useEffect, useState } from "react";
import { loadSession, saveSession } from "../lib/authStorage";
import {
  ApiError,
  signIn as apiSignIn,
  refreshSession,
} from "../lib/pocketbase";

// onSessionChange discards the cached library so one account's loops never leak into another's
export function useAuth(onSessionChange: () => void) {
  const [session, setSession] = useState(loadSession);

  useEffect(() => saveSession(session), [session]);

  // Extends the session on each visit (and refreshes canSearch); only a real rejection
  // signs you out, not being offline
  useEffect(() => {
    const saved = loadSession();
    if (!saved) return;
    refreshSession(saved.token).then(setSession, (e) => {
      if (e instanceof ApiError && e.status < 500) setSession(null);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    const next = await apiSignIn(email, password);
    onSessionChange();
    setSession(next);
  };
  const signOut = () => {
    onSessionChange();
    setSession(null);
  };
  // An expired session keeps the cache so unsynced edits survive; the next sign-in resets it
  const dropSession = useCallback(() => setSession(null), []);

  return {
    token: session?.token ?? null,
    canSearch: session?.canSearch ?? false,
    signIn,
    signOut,
    dropSession,
  };
}
