export interface LoopState {
  videoId: string;
  start: number;
  end: number | null;
  rate: number;
  loop: boolean;
}

export interface ParsedVideo {
  id: string;
  start?: number;
}
