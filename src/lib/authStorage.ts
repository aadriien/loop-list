import { AUTH_STORAGE_KEY } from "../constants/sync";

export function loadToken() {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string | null) {
  try {
    if (token) localStorage.setItem(AUTH_STORAGE_KEY, token);
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // storage blocked: you'll just have to sign in again next visit
  }
}
