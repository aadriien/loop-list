import { useState } from "react";
import CategoryBar from "./components/CategoryBar";
import Discover from "./components/Discover";
import Library from "./components/Library";
import Looper from "./components/Looper";
import SyncPanel from "./components/SyncPanel";
import ThemePicker from "./components/ThemePicker";
import VideoInput from "./components/VideoInput";
import { DEFAULT_STATE } from "./constants/loop";
import { useAuth } from "./hooks/useAuth";
import { useLibrary } from "./hooks/useLibrary";
import { useSync } from "./hooks/useSync";
import { useTheme } from "./hooks/useTheme";
import { useUrlState } from "./hooks/useUrlState";
import { allCategories } from "./lib/categories";
import { clearRecent } from "./lib/recentSearches";
import { clearSearchCache } from "./lib/searchCache";
import type { SavedLoop } from "./types/library";
import type { LoopState } from "./types/loop";

export default function App() {
  const [state, setState] = useUrlState();
  const [theme, setTheme] = useTheme();
  const { loops, all, setAll, add, update: updateLoop, remove } = useLibrary();
  const [loadKey, setLoadKey] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Categories picked for a loop that hasn't been saved yet; attached on Save loop
  const [pending, setPending] = useState<string[]>([]);
  const { token, canSearch, signIn, signOut, dropSession } = useAuth(() => {
    setAll([]);
    setActiveId(null);
    setPending([]);
    clearSearchCache();
    clearRecent();
  });
  const syncStatus = useSync(token, all, setAll, dropSession);

  const activeLoop = loops.find((loop) => loop.id === activeId);
  const categories = activeLoop?.categories ?? pending;
  const setCategories = (next: string[]) =>
    activeLoop
      ? updateLoop(activeLoop.id, { categories: next })
      : setPending(next);

  const update = (patch: Partial<LoopState>) =>
    setState((s) => ({ ...s, ...patch }));
  const load = (patch: Partial<LoopState>, id: string | null = null) => {
    setState({ ...DEFAULT_STATE, ...patch });
    setLoadKey((k) => k + 1);
    setActiveId(id);
    setPending([]);
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
        key={state.videoId}
        videoId={state.videoId}
        onLoad={({ id, start }) => load({ videoId: id, start: start ?? 0 })}
      />
      <div className="workspace">
        <div className="stage">
          {state.videoId ? (
            <>
              <Looper
                state={state}
                loadKey={loadKey}
                onChange={update}
                onSave={(title) => {
                  setActiveId(
                    add({
                      videoId: state.videoId,
                      title: title || state.videoId,
                      categories: pending,
                      start: state.start,
                      end: state.end,
                      rate: state.rate,
                    }),
                  );
                  setPending([]);
                }}
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
              <CategoryBar
                selected={categories}
                known={allCategories(loops)}
                onChange={setCategories}
              />
            </>
          ) : (
            <p className="hint">Paste a YouTube link to start looping.</p>
          )}
        </div>
        <div className="side">
          {token && canSearch && (
            <Discover
              token={token}
              onOpen={(videoId) => {
                load({ videoId });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
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
          <SyncPanel
            signedIn={token !== null}
            status={syncStatus}
            onSignIn={signIn}
            onSignOut={signOut}
          />
        </div>
      </div>
    </main>
  );
}
