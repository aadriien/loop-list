import Looper from "./components/Looper";
import ThemePicker from "./components/ThemePicker";
import VideoInput from "./components/VideoInput";
import { DEFAULT_STATE } from "./constants/loop";
import { useTheme } from "./hooks/useTheme";
import { useUrlState } from "./hooks/useUrlState";
import type { LoopState } from "./types/loop";

export default function App() {
  const [state, setState] = useUrlState();
  const [theme, setTheme] = useTheme();
  const update = (patch: Partial<LoopState>) =>
    setState((s) => ({ ...s, ...patch }));

  return (
    <main>
      <header>
        <h1>loop-list</h1>
        <ThemePicker theme={theme} onChange={setTheme} />
      </header>
      <VideoInput
        onLoad={({ id, start }) =>
          setState({ ...DEFAULT_STATE, videoId: id, start: start ?? 0 })
        }
      />
      {state.videoId && <Looper state={state} onChange={update} />}
    </main>
  );
}
