import { useEffect, useState } from "react";
import { loadLibrary, saveLibrary } from "../lib/libraryStorage";
import type { SavedLoop } from "../types/library";

export function useLibrary() {
  const [loops, setLoops] = useState(loadLibrary);

  useEffect(() => saveLibrary(loops), [loops]);

  const add = (loop: Omit<SavedLoop, "id">) => {
    const id = crypto.randomUUID();
    setLoops((all) => [{ ...loop, id }, ...all]);
    return id;
  };
  const update = (id: string, patch: Partial<Omit<SavedLoop, "id">>) =>
    setLoops((all) =>
      all.map((loop) => (loop.id === id ? { ...loop, ...patch } : loop)),
    );
  const remove = (id: string) =>
    setLoops((all) => all.filter((loop) => loop.id !== id));

  return { loops, add, update, remove };
}
