import { useEffect, useState } from "react";
import { stateFromSearch, stateToSearch } from "../lib/urlState";

export function useUrlState() {
  const [state, setState] = useState(() =>
    stateFromSearch(window.location.search),
  );

  useEffect(() => {
    const search = stateToSearch(state);
    window.history.replaceState(
      null,
      "",
      search ? `?${search}` : window.location.pathname,
    );
  }, [state]);

  return [state, setState] as const;
}
