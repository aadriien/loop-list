import { SKIP_SECONDS } from "../constants/loop";
import { formatTime } from "../lib/time";

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
      <span className="time">
        {formatTime(time)} / {duration ? formatTime(duration) : "--"}
      </span>
    </div>
  );
}
