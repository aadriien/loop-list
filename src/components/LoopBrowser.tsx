import { useState } from "react";
import { resolveFilter } from "../lib/categories";
import type { CategoryFilter } from "../types/library";
import CategoriesPanel from "./CategoriesPanel";
import Library, { type LibraryProps } from "./Library";

type Props = Omit<LibraryProps, "filter" | "onFilter"> & {
  onRenameCategory: (from: string, to: string) => void;
};

// Owns the category filter shared by the Categories panel and the saved list, so the app
// above only passes in the loops and what to do with them
export default function LoopBrowser({ onRenameCategory, ...library }: Props) {
  const [filter, setFilter] = useState<CategoryFilter>(null);
  const current = resolveFilter(filter, library.loops);
  // A filter whose category has disappeared is dropped for good, not just hidden
  if (filter && !current) setFilter(null);

  return (
    <>
      <CategoriesPanel
        loops={library.loops}
        filter={current}
        onFilter={setFilter}
        onRename={onRenameCategory}
      />
      <Library {...library} filter={current} onFilter={setFilter} />
    </>
  );
}
