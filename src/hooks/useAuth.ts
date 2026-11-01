import { useCallback, useEffect, useState } from "react";
import { loadToken, saveToken } from "../lib/authStorage";
import { ApiError, signIn as apiSignIn, refreshToken } from "../lib/pocketbase";

// onSessionChange discards the cached library so one account's loops never leak into another's
export function useAuth(onSessionChange: () => void) {
  const [token, setToken] = useState(loadToken);

  useEffect(() => saveToken(token), [token]);

  // Extends the session on each visit; only a real rejection signs you out, not being offline
  useEffect(() => {
    const saved = loadToken();
    if (!saved) return;
    refreshToken(saved).then(setToken, (e) => {
      if (e instanceof ApiError && e.status < 500) setToken(null);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    const next = await apiSignIn(email, password);
    onSessionChange();
    setToken(next);
  };
  const signOut = () => {
    onSessionChange();
    setToken(null);
  };
  // An expired session keeps the cache so unsynced edits survive; the next sign-in resets it
  const dropSession = useCallback(() => setToken(null), []);

  return { token, signIn, signOut, dropSession };
}
