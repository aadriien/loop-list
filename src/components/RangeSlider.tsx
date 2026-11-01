import type { CSSProperties } from "react";
import { roundTime } from "../lib/time";
import type { LoopState } from "../types/loop";

const STEP = 0.1;

interface Props {
  duration: number;
  start: number;
  end: number | null;
  time: number;
  onChange: (patch: Partial<LoopState>) => void;
  onSeek: (time: number) => void;
}

export default function RangeSlider({
  duration,
  start,
  end,
  time,
  onChange,
  onSeek,
}: Props) {
  if (!duration) return null;
  const stop = end ?? duration;
  const pct = (t: number) => (t / duration) * 100;
  const vars = { "--lo": pct(start), "--hi": pct(stop) } as CSSProperties;

  return (
    <div className="range" style={vars}>
      <div className="range-track" />
      <div className="range-fill" />
      <input
        className="seek"
        type="range"
        aria-label="Seek"
        min={0}
        max={duration}
        step="any"
        value={time}
        onChange={(e) => onSeek(e.target.valueAsNumber)}
      />
      <input
        type="range"
        aria-label="Start"
        min={0}
        max={duration}
        step={STEP}
        value={start}
        onChange={(e) =>
          onChange({
            start: roundTime(Math.min(e.target.valueAsNumber, stop - STEP)),
          })
        }
      />
      <input
        type="range"
        aria-label="End"
        min={0}
        max={duration}
        step={STEP}
        value={stop}
        onChange={(e) => {
          const next = roundTime(
            Math.max(e.target.valueAsNumber, start + STEP),
          );
          onChange({ end: next >= duration ? null : next });
        }}
      />
    </div>
  );
}
