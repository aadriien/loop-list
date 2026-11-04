import { RECENT_SEARCHES_KEY, RECENT_SEARCHES_MAX } from "../constants/search";

// Newest first, no repeats (ignoring case), capped
export function addRecent(
  list: string[],
  q: string,
  max = RECENT_SEARCHES_MAX,
) {
  const query = q.trim();
  const rest = list.filter(
    (item) => item.toLowerCase() !== query.toLowerCase(),
  );
  return [query, ...rest].slice(0, max);
}

export function loadRecent(): string[] {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]",
    );
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function saveRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
  } catch {
    // storage full or blocked: recent searches just won't be remembered
  }
}

export function clearRecent() {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // storage blocked: nothing to clear
  }
}
