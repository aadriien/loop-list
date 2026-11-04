import { CATEGORIES_OPEN_KEY } from "../constants/categories";
import {
  categoryCounts,
  isCategoryFilter,
  uncategorizedLoops,
} from "../lib/categories";
import type { CategoryFilter, SavedLoop } from "../types/library";
import CollapsiblePanel from "./CollapsiblePanel";

interface Props {
  loops: SavedLoop[];
  filter: CategoryFilter;
  onFilter: (filter: CategoryFilter) => void;
}

const loopCount = (n: number) => `${n} ${n === 1 ? "loop" : "loops"}`;

function Row({
  title,
  count,
  active,
  onClick,
}: {
  title: string;
  count: number;
  active: boolean;
  onClick: () => void;
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
    </li>
  );
}

// Click a category to narrow the saved loops to it; click it again to clear
export default function CategoriesPanel({ loops, filter, onFilter }: Props) {
  const counts = categoryCounts(loops);
  const uncategorized = uncategorizedLoops(loops).length;
  const pick = (next: CategoryFilter, active: boolean) =>
    onFilter(active ? null : next);

  return (
    <CollapsiblePanel
      title="Categories"
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
              />
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
