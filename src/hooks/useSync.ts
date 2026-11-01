import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { SYNC_DEBOUNCE_MS } from "../constants/sync";
import { mergeLoops, sameLoops } from "../lib/mergeLoops";
import { ApiError, fetchLoops, pushLoop } from "../lib/pocketbase";
import type { SavedLoop } from "../types/library";
import type { SyncStatus } from "../types/sync";

export function useSync(
  token: string | null,
  loops: SavedLoop[],
  setLoops: Dispatch<SetStateAction<SavedLoop[]>>,
  onAuthError: () => void,
) {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [visits, setVisits] = useState(0);

  // Coming back to the tab pulls changes made on other devices
  useEffect(() => {
    const onVisible = () =>
      document.visibilityState === "visible" && setVisits((n) => n + 1);
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: loops and visits only trigger a sync
  useEffect(() => {
    if (!token) return;
    const id = setTimeout(async () => {
      setStatus("syncing");
      try {
        const remote = await fetchLoops(token);
        const remoteIds = new Set(remote.map((loop) => loop.id));
        const { toPush } = mergeLoops(loops, remote);
        await Promise.all(
          toPush.map((loop) => pushLoop(token, loop, remoteIds.has(loop.id))),
        );
        // Re-merge into the latest state in case something changed mid-sync
        setLoops((current) => {
          const { merged } = mergeLoops(current, remote);
          return sameLoops(current, merged) ? current : merged;
        });
        setStatus("synced");
      } catch (e) {
        if (e instanceof ApiError && [401, 403].includes(e.status))
          onAuthError();
        setStatus("error");
      }
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [token, loops, visits, setLoops, onAuthError]);

  return status;
}
