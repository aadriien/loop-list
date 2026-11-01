import { useCallback, useEffect, useState } from "react";
import { loadToken, saveToken } from "../lib/authStorage";
import { ApiError, signIn as apiSignIn, refreshToken } from "../lib/pocketbase";

export function useAuth() {
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

  const signIn = async (email: string, password: string) =>
    setToken(await apiSignIn(email, password));
  const signOut = useCallback(() => setToken(null), []);

  return { token, signIn, signOut };
}
