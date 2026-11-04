import { useState } from "react";
import { resolveFilter } from "../lib/categories";
import type { CategoryFilter } from "../types/library";
import CategoriesPanel from "./CategoriesPanel";
import Library, { type LibraryProps } from "./Library";

// Owns the category filter shared by the Categories panel and the saved list, so the app
// above only passes in the loops and what to do with them
export default function LoopBrowser(
  props: Omit<LibraryProps, "filter" | "onFilter">,
) {
  const [filter, setFilter] = useState<CategoryFilter>(null);
  const current = resolveFilter(filter, props.loops);
  // A filter whose category has disappeared is dropped for good, not just hidden
  if (filter && !current) setFilter(null);

  return (
    <>
      <CategoriesPanel
        loops={props.loops}
        filter={current}
        onFilter={setFilter}
      />
      <Library {...props} filter={current} onFilter={setFilter} />
    </>
  );
}
