import { useState } from "react";
import Library from "./components/Library";
import Looper from "./components/Looper";
import ThemePicker from "./components/ThemePicker";
import VideoInput from "./components/VideoInput";
import { DEFAULT_STATE } from "./constants/loop";
import { useLibrary } from "./hooks/useLibrary";
import { useTheme } from "./hooks/useTheme";
import { useUrlState } from "./hooks/useUrlState";
import type { LoopState } from "./types/loop";

export default function App() {
  const [state, setState] = useUrlState();
  const [theme, setTheme] = useTheme();
  const { loops, add, remove } = useLibrary();
  const [loadKey, setLoadKey] = useState(0);

  const update = (patch: Partial<LoopState>) =>
    setState((s) => ({ ...s, ...patch }));
  const load = (patch: Partial<LoopState>) => {
    setState({ ...DEFAULT_STATE, ...patch });
    setLoadKey((k) => k + 1);
  };

  return (
    <main>
      <header>
        <h1>loop-list</h1>
        <ThemePicker theme={theme} onChange={setTheme} />
      </header>
      <VideoInput
        onLoad={({ id, start }) => load({ videoId: id, start: start ?? 0 })}
      />
      <div className="workspace">
        <div className="stage">
          {state.videoId ? (
            <Looper
              state={state}
              loadKey={loadKey}
              onChange={update}
              onSave={(title) =>
                add({
                  videoId: state.videoId,
                  title: title || state.videoId,
                  start: state.start,
                  end: state.end,
                  rate: state.rate,
                })
              }
            />
          ) : (
            <p className="hint">Paste a YouTube link to start looping.</p>
          )}
        </div>
        <Library
          loops={loops}
          onSelect={({ videoId, start, end, rate }) =>
            load({ videoId, start, end, rate })
          }
          onRemove={remove}
        />
      </div>
    </main>
  );
}
