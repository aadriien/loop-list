import { SKIP_SECONDS } from "../constants/loop";
import { formatClock, tenthsDigit } from "../lib/time";

interface Props {
  playing: boolean;
  time: number;
  duration: number;
  onToggle: () => void;
  onSkip: (seconds: number) => void;
}

export default function Transport({
  playing,
  time,
  duration,
  onToggle,
  onSkip,
}: Props) {
  const total = duration ? formatClock(duration) : "-:--";

  return (
    <div className="transport">
      <button type="button" onClick={() => onSkip(-SKIP_SECONDS)}>
        -{SKIP_SECONDS}s
      </button>
      <button type="button" onClick={onToggle}>
        {playing ? "Pause" : "Play"}
      </button>
      <button type="button" onClick={() => onSkip(SKIP_SECONDS)}>
        +{SKIP_SECONDS}s
      </button>
      {/* Tenths show only while paused, but their space is always reserved */}
      <span className="readout">
        <span className="clock" style={{ minWidth: `${total.length}ch` }}>
          {formatClock(time)}
        </span>
        <span className={playing ? "tenths off" : "tenths"}>
          .{tenthsDigit(time)}
        </span>{" "}
        / {total}
      </span>
    </div>
  );
}
