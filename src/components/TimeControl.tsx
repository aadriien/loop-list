import { NUDGES } from "../constants/loop";
import { formatTime, parseTime, roundTime } from "../lib/time";

interface Props {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  now: () => number;
}

const display = (value: number | null) =>
  value === null ? "" : formatTime(value);

export default function TimeControl({ label, value, onChange, now }: Props) {
  return (
    <div className="row">
      <label>
        {label}
        <input
          className="time"
          key={value}
          defaultValue={display(value)}
          placeholder="end of video"
          onBlur={(e) => {
            const text = e.target.value.trim();
            const next = text === "" ? null : (parseTime(text) ?? value);
            onChange(next);
            e.target.value = display(next);
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      </label>
      <button type="button" onClick={() => onChange(roundTime(now()))}>
        Now
      </button>
      {NUDGES.map((n) => (
        <button
          key={n}
          type="button"
          disabled={value === null}
          onClick={() => onChange(Math.max(0, roundTime((value ?? 0) + n)))}
        >
          {n > 0 ? `+${n}` : n}
        </button>
      ))}
    </div>
  );
}
