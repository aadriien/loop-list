export function roundTime(seconds: number) {
  return Math.round(seconds * 10) / 10;
}

export function formatTime(seconds: number) {
  const t = roundTime(seconds);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = (t % 60).toFixed(1).padStart(4, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

// Whole seconds, rounded down so a readout never runs ahead of the video
export function formatClock(seconds: number) {
  const t = Math.floor(seconds);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = String(t % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export const tenthsDigit = (seconds: number) => Math.floor(seconds * 10) % 10;

export function parseTime(text: string) {
  const t = text.trim();
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
  if (/^\d+(:\d+){1,2}(\.\d+)?$/.test(t)) {
    return t.split(":").reduce((total, part) => total * 60 + Number(part), 0);
  }
  const hms = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?$/);
  if (hms && t) {
    return (
      Number(hms[1] ?? 0) * 3600 +
      Number(hms[2] ?? 0) * 60 +
      Number(hms[3] ?? 0)
    );
  }
  return null;
}
