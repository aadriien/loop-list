import type { SavedLoop } from "../types/library";

// Case-insensitive substring match on the saved name; a blank query matches everything
export function filterLoops(loops: SavedLoop[], query: string) {
  const needle = query.trim().toLowerCase();
  return needle
    ? loops.filter((loop) => loop.title.toLowerCase().includes(needle))
    : loops;
}
