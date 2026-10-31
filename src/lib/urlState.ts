import { DEFAULT_STATE } from "../constants/loop";
import type { LoopState } from "../types/loop";
import { parseVideoInput } from "./parseVideoInput";

function num(value: string | null) {
  const n = Number.parseFloat(value ?? "");
  return Number.isFinite(n) ? n : undefined;
}

export function stateFromSearch(search: string): LoopState {
  const params = new URLSearchParams(search);
  const start = Math.max(0, num(params.get("s")) ?? DEFAULT_STATE.start);
  const end = num(params.get("e"));
  const rate = num(params.get("r"));
  return {
    videoId:
      parseVideoInput(params.get("v") ?? "")?.id ?? DEFAULT_STATE.videoId,
    start,
    end: end !== undefined && end > start ? end : DEFAULT_STATE.end,
    rate: rate !== undefined && rate > 0 ? rate : DEFAULT_STATE.rate,
    loop: params.get("loop") !== "0",
  };
}

export function stateToSearch(state: LoopState) {
  const params = new URLSearchParams();
  if (state.videoId) params.set("v", state.videoId);
  if (state.start !== DEFAULT_STATE.start) params.set("s", String(state.start));
  if (state.end !== DEFAULT_STATE.end) params.set("e", String(state.end));
  if (state.rate !== DEFAULT_STATE.rate) params.set("r", String(state.rate));
  if (!state.loop) params.set("loop", "0");
  return params.toString();
}
