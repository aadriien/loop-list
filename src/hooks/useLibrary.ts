import { useEffect, useMemo, useState } from "react";
import { newId } from "../lib/ids";
import { loadLibrary, saveLibrary } from "../lib/libraryStorage";
import type { SavedLoop } from "../types/library";

type LoopFields = Omit<SavedLoop, "id" | "updatedAt" | "deleted">;

// `all` includes deleted loops (tombstones) so deletions can sync to other devices
export function useLibrary() {
  const [all, setAll] = useState(loadLibrary);

  useEffect(() => saveLibrary(all), [all]);

  const add = (loop: LoopFields) => {
    const id = newId();
    setAll((loops) => [{ ...loop, id, updatedAt: Date.now() }, ...loops]);
    return id;
  };
  const update = (id: string, patch: Partial<LoopFields>) =>
    setAll((loops) =>
      loops.map((loop) =>
        loop.id === id ? { ...loop, ...patch, updatedAt: Date.now() } : loop,
      ),
    );
  const remove = (id: string) =>
    setAll((loops) =>
      loops.map((loop) =>
        loop.id === id
          ? { ...loop, deleted: true, updatedAt: Date.now() }
          : loop,
      ),
    );
  const loops = useMemo(() => all.filter((loop) => !loop.deleted), [all]);

  return { loops, all, setAll, add, update, remove };
}
