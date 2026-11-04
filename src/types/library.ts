export interface SavedLoop {
  id: string;
  videoId: string;
  title: string;
  start: number;
  end: number | null;
  rate: number;
  categories: string[];
  updatedAt: number;
  deleted?: boolean;
}

// What the saved list is narrowed to: nothing, one category, or loops with no category
export type CategoryFilter =
  | { type: "category"; name: string }
  | { type: "uncategorized" }
  | null;
