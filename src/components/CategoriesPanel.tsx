import type { ReactNode } from "react";
import { CATEGORIES_OPEN_KEY } from "../constants/categories";
import {
  categoryCounts,
  isCategoryFilter,
  resolveRename,
  uncategorizedLoops,
} from "../lib/categories";
import type { CategoryFilter, SavedLoop } from "../types/library";
import CollapsiblePanel from "./CollapsiblePanel";

interface Props {
  loops: SavedLoop[];
  filter: CategoryFilter;
  onFilter: (filter: CategoryFilter) => void;
  onRename: (from: string, to: string) => void;
  onRemove: (name: string) => void;
}

const loopCount = (n: number) => `${n} ${n === 1 ? "loop" : "loops"}`;

function Row({
  title,
  count,
  active,
  onClick,
  children,
}: {
  title: string;
  count: number;
  active: boolean;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <li className={active ? "active" : ""}>
      <button
        type="button"
        className="item"
        aria-pressed={active}
        onClick={onClick}
      >
        <span className="title">{title}</span>
        <span className="meta">{loopCount(count)}</span>
      </button>
      {children}
    </li>
  );
}

// Click a category to narrow the saved loops to it; click it again to clear
export default function CategoriesPanel({
  loops,
  filter,
  onFilter,
  onRename,
  onRemove,
}: Props) {
  const counts = categoryCounts(loops);
  const uncategorized = uncategorizedLoops(loops).length;
  const pick = (next: CategoryFilter, active: boolean) =>
    onFilter(active ? null : next);

  function rename(name: string) {
    const input = window.prompt("Rename category", name);
    const next =
      input === null
        ? null
        : resolveRename(
            name,
            input,
            counts.map((c) => c.name),
          );
    if (!next) return;
    onRename(name, next);
    // Keep the filter on the category if it was the one selected
    if (isCategoryFilter(filter, name))
      onFilter({ type: "category", name: next });
  }

  function remove(name: string, count: number) {
    const message = `Delete the category "${name}"? It will be removed from ${loopCount(count)}. The loops themselves stay.`;
    if (window.confirm(message)) onRemove(name);
  }

  return (
    <CollapsiblePanel
      title="Browse categories"
      storageKey={CATEGORIES_OPEN_KEY}
      className="categories"
    >
      {counts.length === 0 && (
        <p className="hint">
          No categories yet. Add one under a video's controls.
        </p>
      )}
      {counts.length > 0 && (
        <ul className="rows">
          {counts.map(({ name, count }) => {
            const active = isCategoryFilter(filter, name);
            return (
              <Row
                key={name}
                title={name}
                count={count}
                active={active}
                onClick={() => pick({ type: "category", name }, active)}
              >
                <button
                  type="button"
                  aria-label={`Rename ${name}`}
                  onClick={() => rename(name)}
                >
                  ✎
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${name}`}
                  onClick={() => remove(name, count)}
                >
                  ✕
                </button>
              </Row>
            );
          })}
          {uncategorized > 0 && (
            <Row
              title="Uncategorized"
              count={uncategorized}
              active={filter?.type === "uncategorized"}
              onClick={() =>
                pick(
                  { type: "uncategorized" },
                  filter?.type === "uncategorized",
                )
              }
            />
          )}
        </ul>
      )}
    </CollapsiblePanel>
  );
}
