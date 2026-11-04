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
