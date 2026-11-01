import { useState } from "react";
import Library from "./components/Library";
import Looper from "./components/Looper";
import ThemePicker from "./components/ThemePicker";
import VideoInput from "./components/VideoInput";
import { DEFAULT_STATE } from "./constants/loop";
import { useLibrary } from "./hooks/useLibrary";
import { useTheme } from "./hooks/useTheme";
import { useUrlState } from "./hooks/useUrlState";
import type { SavedLoop } from "./types/library";
import type { LoopState } from "./types/loop";

export default function App() {
  const [state, setState] = useUrlState();
  const [theme, setTheme] = useTheme();
  const { loops, add, update: updateLoop, remove } = useLibrary();
  const [loadKey, setLoadKey] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  const update = (patch: Partial<LoopState>) =>
    setState((s) => ({ ...s, ...patch }));
  const load = (patch: Partial<LoopState>, id: string | null = null) => {
    setState({ ...DEFAULT_STATE, ...patch });
    setLoadKey((k) => k + 1);
    setActiveId(id);
  };
  const rename = (loop: SavedLoop) => {
    const title = window.prompt("Rename loop", loop.title)?.trim();
    if (title) updateLoop(loop.id, { title });
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
                setActiveId(
                  add({
                    videoId: state.videoId,
                    title: title || state.videoId,
                    start: state.start,
                    end: state.end,
                    rate: state.rate,
                  }),
                )
              }
              onUpdate={
                activeId
                  ? () =>
                      updateLoop(activeId, {
                        start: state.start,
                        end: state.end,
                        rate: state.rate,
                      })
                  : undefined
              }
            />
          ) : (
            <p className="hint">Paste a YouTube link to start looping.</p>
          )}
        </div>
        <Library
          loops={loops}
          activeId={activeId}
          onSelect={({ id, videoId, start, end, rate }) =>
            load({ videoId, start, end, rate }, id)
          }
          onRename={rename}
          onRemove={(id) => {
            remove(id);
            if (id === activeId) setActiveId(null);
          }}
        />
      </div>
    </main>
  );
}
