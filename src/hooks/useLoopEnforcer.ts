import { useEffect } from "react";
import { PLAYER_STATE, POLL_MS } from "../constants/youtube";
import type { LoopState } from "../types/loop";
import type { YTPlayer } from "../types/youtube";

export function useLoopEnforcer(
  player: YTPlayer | null,
  { start, end, loop }: LoopState,
) {
  useEffect(() => {
    if (!player || !loop) return;
    const id = setInterval(() => {
      const state = player.getPlayerState();
      if (state === PLAYER_STATE.ENDED) {
        player.seekTo(start, true);
        player.playVideo();
        return;
      }
      if (state !== PLAYER_STATE.PLAYING) return;
      // duration is 0 for live streams, so only loop when there is a real end
      const stop = end ?? player.getDuration();
      if (stop > start && player.getCurrentTime() >= stop)
        player.seekTo(start, true);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [player, loop, start, end]);
}
