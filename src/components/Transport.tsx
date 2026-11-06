import { SKIP_SECONDS } from "../constants/loop";
import { formatClock, tenthsDigit } from "../lib/time";

interface Props {
  playing: boolean;
  time: number;
  duration: number;
  onToggle: () => void;
  onSkip: (seconds: number) => void;
}

const PLAY_ICON = "M8 5v14l11-7z";
const PAUSE_ICON = "M6 5h4v14H6zM14 5h4v14h-4z";

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
      <button
        type="button"
        className="play"
        aria-label={playing ? "Pause" : "Play"}
        onClick={onToggle}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d={playing ? PAUSE_ICON : PLAY_ICON} />
        </svg>
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
