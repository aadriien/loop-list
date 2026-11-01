import { formatTime } from "../lib/time";
import type { SavedLoop } from "../types/library";

interface Props {
  loops: SavedLoop[];
  onSelect: (loop: SavedLoop) => void;
  onRemove: (id: string) => void;
}

export default function Library({ loops, onSelect, onRemove }: Props) {
  return (
    <aside className="library">
      <h2>Saved loops</h2>
      {loops.length === 0 ? (
        <p className="hint">Nothing saved yet. Use Save loop on a video.</p>
      ) : (
        <ul>
          {loops.map((loop) => (
            <li key={loop.id}>
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
