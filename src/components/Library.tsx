import { useState } from "react";
import {
  applyCategoryFilter,
  categoryCounts,
  isCategoryFilter,
  uncategorizedLoops,
} from "../lib/categories";
import { filterLoops } from "../lib/filterLoops";
import { formatTime } from "../lib/time";
import type { CategoryFilter, SavedLoop } from "../types/library";

export interface LibraryProps {
  loops: SavedLoop[];
  activeId: string | null;
  filter: CategoryFilter;
  onFilter: (filter: CategoryFilter) => void;
  onSelect: (loop: SavedLoop) => void;
  onRename: (loop: SavedLoop) => void;
  onRemove: (id: string) => void;
}

const SHOWN_CATEGORIES = 3;

export default function Library({
  loops,
  activeId,
  filter,
  onFilter,
  onSelect,
  onRename,
  onRemove,
}: LibraryProps) {
  const [query, setQuery] = useState("");
  const counts = categoryCounts(loops);
  const uncategorized = uncategorizedLoops(loops).length;
  const visible = filterLoops(applyCategoryFilter(loops, filter), query);
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
      {counts.length > 0 && (
        <ul className="chips" aria-label="Filter by category">
          <li>
            <button
              type="button"
              className="chip"
              aria-pressed={!filter}
              onClick={() => onFilter(null)}
            >
              All {loops.length}
            </button>
          </li>
          {counts.map(({ name, count: size }) => (
            <li key={name}>
              <button
                type="button"
                className="chip"
                aria-pressed={isCategoryFilter(filter, name)}
                onClick={() => onFilter({ type: "category", name })}
              >
                {name} {size}
              </button>
            </li>
          ))}
          {uncategorized > 0 && (
            <li>
              <button
                type="button"
                className="chip"
                aria-pressed={filter?.type === "uncategorized"}
                onClick={() => onFilter({ type: "uncategorized" })}
              >
                Uncategorized {uncategorized}
              </button>
            </li>
          )}
        </ul>
      )}
      {loops.length > 0 && visible.length === 0 && (
        <p className="hint">No saved loops match.</p>
      )}
      {visible.length > 0 && (
        <ul className="rows">
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
                {loop.categories.length > 0 && (
                  <span className="tags">
                    {loop.categories.slice(0, SHOWN_CATEGORIES).map((name) => (
                      <span key={name} className="tag">
                        {name}
                      </span>
                    ))}
                    {loop.categories.length > SHOWN_CATEGORIES && (
                      <span className="tag">
                        +{loop.categories.length - SHOWN_CATEGORIES}
                      </span>
                    )}
                  </span>
                )}
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
