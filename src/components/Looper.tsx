import { useCurrentTime } from "../hooks/useCurrentTime";
import { useLoopEnforcer } from "../hooks/useLoopEnforcer";
import { usePlayer } from "../hooks/usePlayer";
import type { LoopState } from "../types/loop";
import RangeSlider from "./RangeSlider";
import TimeControl from "./TimeControl";
import Transport from "./Transport";

interface Props {
  state: LoopState;
  onChange: (patch: Partial<LoopState>) => void;
}

export default function Looper({ state, onChange }: Props) {
  const { hostRef, player, rates, error, playing, duration } = usePlayer(
    state.videoId,
    state.start,
    state.rate,
  );
  useLoopEnforcer(player, state);
  const time = useCurrentTime(player);
  const now = () => player?.getCurrentTime() ?? 0;

  return (
    <>
      <div className="player" ref={hostRef} />
      {error !== null && (
        <p className="error">
          This video can't be played here (error {error}).{" "}
          <a href={`https://www.youtube.com/watch?v=${state.videoId}`}>
            Open on YouTube
          </a>
        </p>
      )}
      <RangeSlider
        duration={duration}
        start={state.start}
        end={state.end}
        time={time}
        onChange={onChange}
        onSeek={(t) => player?.seekTo(t, true)}
      />
      <div className="times">
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
      </div>
      <div className="controls">
        <Transport
          playing={playing}
          time={time}
          duration={duration}
          onToggle={() =>
            playing ? player?.pauseVideo() : player?.playVideo()
          }
          onSkip={(s) => player?.seekTo(Math.max(0, now() + s), true)}
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
      </div>
    </>
  );
}
