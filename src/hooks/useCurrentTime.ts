import { useEffect, useState } from "react";
import { POLL_MS } from "../constants/youtube";
import type { YTPlayer } from "../types/youtube";

export function useCurrentTime(player: YTPlayer | null) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!player) return;
    const id = setInterval(() => setTime(player.getCurrentTime()), POLL_MS);
    return () => clearInterval(id);
  }, [player]);

  return time;
}
