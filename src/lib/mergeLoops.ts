import type { SavedLoop } from "../types/library";

// Newest edit wins per loop. toPush is what the server is missing or has older.
export function mergeLoops(local: SavedLoop[], remote: SavedLoop[]) {
  const remoteById = new Map(remote.map((loop) => [loop.id, loop]));
  const merged = new Map(remoteById);
  const toPush: SavedLoop[] = [];

  for (const loop of local) {
    const theirs = remoteById.get(loop.id);
    if (!theirs || loop.updatedAt > theirs.updatedAt) {
      merged.set(loop.id, loop);
      toPush.push(loop);
    }
  }

  return {
    merged: [...merged.values()].sort((a, b) => b.updatedAt - a.updatedAt),
    toPush,
  };
}

export const sameLoops = (a: SavedLoop[], b: SavedLoop[]) =>
  a.length === b.length &&
  a.every((loop, i) => loop.id === b[i].id && loop.updatedAt === b[i].updatedAt);
