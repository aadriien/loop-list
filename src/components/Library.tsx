import { useState } from "react";
import { filterLoops } from "../lib/filterLoops";
import { formatTime } from "../lib/time";
import type { SavedLoop } from "../types/library";

interface Props {
  loops: SavedLoop[];
  activeId: string | null;
  onSelect: (loop: SavedLoop) => void;
  onRename: (loop: SavedLoop) => void;
  onRemove: (id: string) => void;
}

export default function Library({
  loops,
  activeId,
  onSelect,
  onRename,
  onRemove,
}: Props) {
  const [query, setQuery] = useState("");
  const visible = filterLoops(loops, query);
  const count =
    visible.length === loops.length
      ? `${loops.length}`
      : `${visible.length} of ${loops.length}`;

  return (
    <aside className="library">
      <h2>Saved loops{loops.length > 0 && ` (${count})`}</h2>
      {loops.length === 0 && (
        <p className="hint">Nothing saved yet. Use Save loop on a video.</p>
      )}
      {loops.length > 0 && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search saved loops"
          aria-label="Search saved loops"
        />
      )}
      {loops.length > 0 && visible.length === 0 && (
        <p className="hint">No saved loops match your search.</p>
      )}
      {visible.length > 0 && (
        <ul>
          {visible.map((loop) => (
            <li key={loop.id} className={loop.id === activeId ? "active" : ""}>
              <button
                type="button"
                className="item"
                onClick={() => onSelect(loop)}
              >
                <span className="title">{loop.title}</span>
                <span className="meta">
                  {formatTime(loop.start)} –{" "}
                  {loop.end === null ? "end" : formatTime(loop.end)} ·{" "}
                  {loop.rate}×
                </span>
              </button>
              <button
                type="button"
                aria-label={`Rename ${loop.title}`}
                onClick={() => onRename(loop)}
              >
                ✎
              </button>
              <button
                type="button"
                aria-label={`Delete ${loop.title}`}
                onClick={() => onRemove(loop.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
