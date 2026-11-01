import { useEffect, useState } from "react";
import { URL_SYNC_MS } from "../constants/loop";
import { stateFromSearch, stateToSearch } from "../lib/urlState";

export function useUrlState() {
  const [state, setState] = useState(() =>
    stateFromSearch(window.location.search),
  );

  // Debounced: Safari throttles replaceState, and slider drags fire constantly
  useEffect(() => {
    const id = setTimeout(() => {
      const search = stateToSearch(state);
      window.history.replaceState(
        null,
        "",
        search ? `?${search}` : window.location.pathname,
      );
    }, URL_SYNC_MS);
    return () => clearTimeout(id);
  }, [state]);

  return [state, setState] as const;
}
