import { useEffect, useRef, useState } from "react";
import { DEFAULT_RATES } from "../constants/loop";
import { IFRAME_API_URL, PLAYER_STATE } from "../constants/youtube";
import type { YTNamespace, YTPlayer } from "../types/youtube";

let apiReady: Promise<YTNamespace> | undefined;

function loadApi() {
  apiReady ??= new Promise<YTNamespace>((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    const script = document.createElement("script");
    script.src = IFRAME_API_URL;
    document.head.append(script);
  });
  return apiReady;
}

export function usePlayer(videoId: string, start: number, rate: number) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<YTPlayer | null>(null);
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [error, setError] = useState<number | null>(null);
  const latest = useRef({ videoId, start, rate });
  latest.current = { videoId, start, rate };
  const loadedId = useRef(videoId);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let created: YTPlayer | undefined;
    loadApi().then((YT) => {
      if (cancelled) return;
      const el = document.createElement("div");
      host.append(el);
      created = new YT.Player(el, {
        width: "100%",
        height: "100%",
        videoId: latest.current.videoId,
        playerVars: { playsinline: 1, start: Math.floor(latest.current.start) },
        events: {
          onReady: (e) => {
            setRates(e.target.getAvailablePlaybackRates());
            setPlayer(e.target);
          },
          // Loading a video resets the rate to 1, so re-apply it once playback starts
          onStateChange: (e) => {
            if (e.data === PLAYER_STATE.PLAYING)
              e.target.setPlaybackRate(latest.current.rate);
          },
          onError: (e) => setError(e.data),
        },
      });
    });
    return () => {
      cancelled = true;
      created?.destroy();
      host.replaceChildren();
      setPlayer(null);
    };
  }, []);

  useEffect(() => {
    if (!player || loadedId.current === videoId) return;
    loadedId.current = videoId;
    setError(null);
    player.loadVideoById({ videoId, startSeconds: latest.current.start });
  }, [player, videoId]);

  useEffect(() => {
    player?.setPlaybackRate(rate);
  }, [player, rate]);

  return { hostRef, player, rates, error };
}
