import type { LoopState } from "../types/loop";

export const DEFAULT_STATE: LoopState = {
  videoId: "",
  start: 0,
  end: null,
  rate: 1,
  loop: true,
};

export const DEFAULT_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export const NUDGES = [-1, -0.1, 0.1, 1];
