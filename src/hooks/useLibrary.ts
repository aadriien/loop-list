import { useEffect, useState } from "react";
import { loadLibrary, saveLibrary } from "../lib/libraryStorage";
import type { SavedLoop } from "../types/library";

export function useLibrary() {
  const [loops, setLoops] = useState(loadLibrary);

  useEffect(() => saveLibrary(loops), [loops]);

  const add = (loop: Omit<SavedLoop, "id">) =>
    setLoops((all) => [{ ...loop, id: crypto.randomUUID() }, ...all]);
  const remove = (id: string) =>
    setLoops((all) => all.filter((loop) => loop.id !== id));

  return { loops, add, remove };
}
