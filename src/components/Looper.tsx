import { useLoopEnforcer } from "../hooks/useLoopEnforcer";
import { usePlayer } from "../hooks/usePlayer";
import type { LoopState } from "../types/loop";
import TimeControl from "./TimeControl";

interface Props {
  state: LoopState;
  onChange: (patch: Partial<LoopState>) => void;
}

export default function Looper({ state, onChange }: Props) {
  const { hostRef, player, rates, error } = usePlayer(
    state.videoId,
    state.start,
    state.rate,
  );
  useLoopEnforcer(player, state);
  const now = () => player?.getCurrentTime() ?? 0;

  return (
    <>
      <div className="player" ref={hostRef} />
      {error !== null && (
        <p className="error">
          This video can't be played here.{" "}
          <a href={`https://www.youtube.com/watch?v=${state.videoId}`}>
            Open on YouTube
          </a>
        </p>
      )}
      <TimeControl
        label="Start"
        value={state.start}
        onChange={(start) => onChange({ start: start ?? 0 })}
        now={now}
      />
      <TimeControl
        label="End"
        value={state.end}
        onChange={(end) => onChange({ end })}
        now={now}
      />
      <div className="row">
        <label>
          Speed
          <select
            value={state.rate}
            onChange={(e) => onChange({ rate: Number(e.target.value) })}
          >
            {rates.map((r) => (
              <option key={r} value={r}>
                {r}×
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.loop}
            onChange={(e) => onChange({ loop: e.target.checked })}
          />
          Loop
        </label>
      </div>
    </>
  );
}
