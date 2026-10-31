export interface YTPlayer {
  playVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getAvailablePlaybackRates(): number[];
  setPlaybackRate(rate: number): void;
  loadVideoById(options: { videoId: string; startSeconds?: number }): void;
  destroy(): void;
}

export interface YTEvent {
  target: YTPlayer;
  data: number;
}

export interface YTNamespace {
  Player: new (
    el: HTMLElement,
    options: {
      width: string;
      height: string;
      videoId: string;
      playerVars: { playsinline: 1; start: number };
      events: {
        onReady: (e: YTEvent) => void;
        onStateChange: (e: YTEvent) => void;
        onError: (e: YTEvent) => void;
      };
    },
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}
