# loop-list: Design Doc

Status: **draft / pre-implementation** (nothing is built yet). Last updated 2026-10-31.

Written so a fresh Claude session can pick it up cold. Read sections 1-4 and 6 before writing code. Keep this doc current when decisions change (section 11).

## 1. Summary

A personal, browser-based clone of [looptube.io](https://looptube.io): paste a YouTube URL or ID, play it in the page, and control start/stop points, playback speed, and repeat.

Later, grow it into a personal library (favorites, tags, history, playlists) that plays everything in a single tab, usable from laptop and iPhone with no native app.

### Why not just use looptube.io
- It injects the video **duration** into the URL, and sometimes gets it wrong.
- One tab per song. We want one tab, many songs.
- Playback stops when the tab is closed or the iPhone locks. (Long-term; **out of scope for MVP**, section 7.)

### Owner preferences (constraints on all decisions)
- **Keep it simple. No code bloat.** Fewest lines that do the job. This is the top priority.
- **Few dependencies.** Only where strictly necessary; prefer the platform (DOM, `URLSearchParams`, `fetch`).
- **Clean organization** (section 4.3). Reuse existing code before writing new code.
- **Human-friendly code.** AI writes it, a human must be able to read and change it easily.
- **Claude never takes git write actions** (add/commit/push/etc.). The human does all git and reviews every proposed change in the editor before approving. No Makefile target or script may run git write commands.
- **Website only**, PWA-installable, works on desktop and iPhone Safari.
- User has **no YouTube Premium**, uses an **iPhone**, usually has **one loop per song**.
- Hosting: **GitHub Pages** (static). Backend later, tiny: Supabase or similar, or the owner's Linux cluster with community auth.
- MVP is tested as a **local desktop build**. No iPhone testing needed until later stages.

## 2. Stages at a glance

| Stage | Scope | Backend? |
|---|---|---|
| **1. MVP** | looptube.io clone. No storage, no organization, no export. | No |
| **1.5. PWA + deploy** | Manifest/icons, GitHub Pages deploy, iPhone sanity check | No |
| **2. Local library** | Save loops, favorites, tags, recent history in the browser | No (localStorage/IndexedDB) |
| **3. Sync** | Same library across laptop and phone | Yes, tiny |
| **4. Playlists / queue** | Play saved loops back to back in one tab | Same as 3 |
| **5. Background audio** | Keep playing when the phone locks | Maybe |

Only stages 1 and 1.5 are planned in detail.

## 3. MVP (stage 1) requirements

Must have:
1. **Input**: text box accepting a YouTube URL or bare video ID. Parse `watch?v=`, `youtu.be/`, `shorts/`, `embed/`, `live/`, `m.` and `music.youtube.com`, bare 11-char ID, plus a `t=`/`start=` param as an initial start time.
2. **Player**: embedded YouTube player, play/pause.
3. **Start and end controls**: (a) type a time, (b) "set to current time" buttons, (c) nudge buttons (±0.1s / ±1s), (d) a two-handle range slider over the timeline.
4. **Loop toggle**: on = return to `start` at `end`. Off = play through (still honoring `start`).
5. **Playback speed**: choose from the rates the player reports.
6. **Shareable URL state**: `?v=<id>&s=<start>&e=<end>&r=<rate>` (5.2). **Duration is never stored in the URL.**
7. **Responsive**: usable at phone width with big touch targets (not tested on device yet).
8. **Keyboard shortcuts** on desktop (space = play/pause, a few for set-start/set-end/nudge).

Explicitly **not** in MVP: accounts, saving, lists, tags, history, export/import, audio-only mode, background playback, waveform, pitch shifting, theming.

### Acceptance checks
- Every URL form in item 1 loads the right video.
- Start 10.0 / end 20.5 loops within roughly a quarter second.
- Loading a URL with `s`/`e`/`r` restores state; changing controls updates the URL via `history.replaceState` (no history entry per tweak).
- If `e` is missing, loop end is the video's duration, read from the player at runtime.
- Works on desktop Chrome and Safari.

## 4. Tech choices

### 4.1 Stack (recommendation)
- **Language:** TypeScript (strict).
- **UI:** **React** (function components + hooks). Rationale below.
- **Build/dev server:** Vite (+ `@vitejs/plugin-react`).
- **Styling:** plain CSS files with custom properties, in `src/styles/`. No CSS-in-JS, no Tailwind.
- **State:** `useState`/`useReducer` + one `LoopState` object. No state library. No router (state lives in the query string).
- **Lint + format:** **Biome** (one dev dependency does both, replaces ESLint + Prettier).
- **Tests:** **Vitest** (dev dep, shares Vite config) for pure functions only: URL parsing, time parse/format, state<->URL. No component tests for MVP; player behavior is checked by hand.
- **Player:** official [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference), loaded via script tag. Unavoidable external dependency.
- **Task runner:** Makefile (4.4).

Dependency budget: runtime `react`, `react-dom`. Dev `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@biomejs/biome`, `vitest`. Adding anything else needs a stated reason in the decision log.

### 4.2 Framework choice: React vs Svelte vs no framework
| Option | Pro | Con |
|---|---|---|
| **React** (chosen) | Owner knows it; most familiar to future humans and to Claude; easy to review | More boilerplate than Svelte; wrapping an imperative player needs `useRef`/`useEffect` care |
| Svelte | Least code per feature; scoped styles in the same file; built-in stores | Owner less familiar; same-file styles conflict with "styles in one place" preference |
| Preact | React API at ~3KB | Extra compat considerations; marginal gain here |
| No framework | Zero runtime deps | Imperative DOM code grows messy once library UI arrives (stage 2+) |

Why React over Svelte: owner familiarity and reviewability outweigh Svelte's brevity, and the bundle size is irrelevant here. The "no bloat" risk with React is managed by conventions (4.5), small components, and custom hooks, not by framework choice. If the owner later prefers Svelte, `lib/` and `types/` are framework-agnostic and carry over.

### 4.3 Directory layout (organize by kind; one place for each thing)
```
loop-list/
  Makefile
  CLAUDE.md                   pointer to this doc + code conventions
  biome.json
  index.html
  vite.config.ts              base: '/loop-list/' for GitHub Pages
  public/                     manifest.webmanifest, icons
  docs/design.md
  .github/workflows/deploy.yml
  src/
    main.tsx                  entry
    App.tsx                   composes components, owns LoopState
    components/               one file per component (PlayerView, TimeInput, RangeSlider, SpeedPicker, ...)
    hooks/                    usePlayer, useLoopEnforcer, useUrlState, useHotkeys
    lib/                      pure utils: parseVideoInput, time format/parse, state<->URL, clamp
    types/                    all shared types and interfaces (LoopState, YT typings)
    constants/                defaults, rate list fallback, key bindings
    styles/                   global.css, tokens.css, per-area css
  test/                       *.test.ts mirroring src/lib
```
Rules: a type used in more than one file lives in `types/`; a helper used in more than one file lives in `lib/`; magic values live in `constants/`. No `utils.ts` grab-bag files; name files for what they do.

### 4.4 Makefile targets
| Target | Does |
|---|---|
| `make setup` | `npm install` (all deps are declared in `package.json`; commit the generated `package-lock.json` so CI's `npm ci` works) |
| `make run` | Vite dev server |
| `make build` | Production build to `dist/` |
| `make preview` | Serve the production build locally |
| `make test` | Vitest, single run |
| `make lint` | Biome check (no writes) |
| `make format` | Biome format + safe fixes (writes) |
| `make check` | typecheck + lint + test (what CI runs) |
| `make deploy` | `make check` then `make build`, then prints a reminder to push `main`. Contains no git commands: the human pushes, and the GitHub Actions workflow publishes to Pages |
| `make clean` | Remove `dist/` and caches (keep `node_modules`); `make nuke` also removes `node_modules` |

Keep the Makefile thin: each target is one or two lines calling `npm run <script>` or the tool directly. `.PHONY` everything.

### 4.5 Code conventions (non-negotiable)
These exist to prevent AI-generated bloat. Future sessions: follow them, and push back on requests that violate them.
- **Minimum code.** Before adding anything, check `lib/`, `hooks/`, `components/`, `constants/` for something reusable. Extend or generalize an existing piece rather than writing a near-duplicate.
- **No speculative generality.** Don't build for stage 3 inside stage 1. Leave seams (the `player.ts` isolation, the `Storage` interface when stage 2 arrives), not scaffolding.
- **Comments only when they explain non-obvious behavior** (e.g. why a rate is re-applied after load). No comments restating the code, no header banners, no docstrings on trivial functions.
- **Small files, one job.** If a component or hook passes ~100 lines, ask whether it is doing two things.
- **No dead code, no commented-out code, no unused exports, no placeholder files.**
- **No defensive code for impossible states.** Validate at the boundary (user input, URL params, player events); trust internal types.
- **Prefer the platform** over a package (`URLSearchParams`, `Intl`, `structuredClone`, CSS).
- **Readable by humans:** plain names, straightforward control flow, no clever type gymnastics.
- Run `make check` before considering any change done.

### 4.6 Hosting and PWA
- **GitHub Pages** via a GitHub Actions workflow (build on push to `main`, publish `dist/`). Chosen over a `gh-pages` npm package to avoid a dependency. Project pages serve under `/loop-list/`, so Vite `base` must match and asset/manifest paths must be relative to it.
- **PWA (stage 1.5):** a `manifest.webmanifest` (name, icons, `display: standalone`, theme color) is enough to make it installable on iPhone via Add to Home Screen. Skip a service worker until there is a reason (offline shell is pointless when playback needs network anyway). If added later, hand-write a minimal one rather than pulling in `vite-plugin-pwa`.
- The YouTube embed **does not work from `file://`** (error 153, missing referrer). Always use `make run` / `make preview`, never open `dist/index.html` directly.

### 4.7 Themes
- Themes are **CSS-only skins**. Each sets the tokens from `styles/tokens.css` under `:root[data-theme="<id>"]` and may add light decoration (gradients, pseudo-elements, inline SVG, a frame around the player). `tokens.css` is the default `tech` theme. Layout lives in `global.css` and must never be theme-specific. Components use only semantic classes and tokens.
- **Adding a theme:** (1) `src/styles/themes/<id>.css`, (2) add the id to `ThemeId` in `types/theme.ts`, (3) add an entry to `constants/themes.ts`. Theme CSS is auto-imported by `import.meta.glob` in `main.tsx`.
- The choice is stored in `localStorage` (`loop-list-theme`). A small inline script in `index.html` applies it before first paint; `hooks/useTheme` owns changes after that.
- Planned themes: tech (default), haunted mansion, retro VHS (chunky TV frame; vibe only, no logos or characters), cozy, airy. `airy` currently exists as a minimal colors-only stand-in. OS light/dark inheritance comes after the first themes. Static decoration only; respect `prefers-reduced-motion` if animation is ever added.

## 5. Design details (MVP)

### 5.1 Video ID parsing
Pure function `parseVideoInput(text): { id: string; start?: number } | null` in `lib/`.
- Bare ID: `/^[A-Za-z0-9_-]{11}$/`.
- Otherwise `new URL(text)`; take `?v=`, or the path for `youtu.be/<id>`, `/shorts/<id>`, `/embed/<id>`, `/live/<id>`.
- `t`/`start` param as seconds or `1h2m3s`.
- Return `null` on failure; show an inline error. Don't throw.

### 5.2 State and URL
```ts
interface LoopState {
  videoId: string;
  start: number;      // seconds, float, >= 0
  end: number | null; // null = end of video, resolved at runtime
  rate: number;       // default 1
  loop: boolean;      // default true
}
```
- URL: `?v=ID&s=12.5&e=48&r=0.75`. Omit defaults; `loop=0` only when off.
- **Never persist or derive anything from duration.** Use `player.getDuration()` when needed (it is 0 until metadata loads and for live streams).
- Clamp on load: `start >= 0`, `end > start`, `rate` snapped to available rates.
- `history.replaceState` for updates; debounce slider drags.

### 5.3 Loop enforcement
The API's `loop` param can't loop an A-B range, so `hooks/useLoopEnforcer`:
- While playing, poll `getCurrentTime()` (~100ms `setInterval`; try `requestAnimationFrame` if smoother).
- If `currentTime >= end` and looping, `seekTo(start, true)`.
- On state `ENDED` with no end set and looping: `seekTo(start)`, `playVideo()`.
- A tiny gap on seek is acceptable; improve later with a lead time if it bothers the owner.
- Polling is throttled in background tabs and suspended on a locked phone (section 7).

### 5.4 Playback rate gotchas
- Build the picker from `getAvailablePlaybackRates()` (usually 0.25-2 in 0.25 steps; no 0.85x).
- **Loading/cueing a video resets rate to 1**: re-apply after load. This is the kind of thing worth a one-line comment.

### 5.5 Player isolation
`hooks/usePlayer` (plus a small typing file in `types/`) is the only code that touches the `YT` global. Everything else talks to its returned controls. Swapping the player later (e.g. an `<audio>` element) should be a one-hook change.

### 5.6 iPhone notes (deferred to stage 1.5)
Pass `playsinline: 1`; autoplay needs a user gesture (handle `onAutoplayBlocked`); check seek/rate/polling while inline. Not needed for desktop MVP testing.

## 6. Concerns x tradeoffs

| Concern | Detail | Stance |
|---|---|---|
| YouTube ToS / embed rules | Official iframe is the compliant route. No ad-stripping or hiding the player. | Visible iframe player. |
| Embedding disabled on some videos | API errors 101/150; 153 for referrer problems. | Clear error message + "open on YouTube" link. |
| Speed granularity | Fixed rates only. | Accept for MVP. |
| Loop precision | Polling + seek: ~100-250ms accuracy, small gap. | Accept; revisit with `<audio>` if needed. |
| Duration bugs (looptube pain point) | Caused by storing duration in the URL. | Never store it. |
| IFrame API drift | Occasional changes (public revision log). | Keep surface small, isolated in `usePlayer`. |
| React ceremony around an imperative player | `useRef`/`useEffect` easy to get subtly wrong (double init in StrictMode, stale closures). | Confine to `usePlayer`/`useLoopEnforcer`; test by hand. |
| AI code bloat | Biggest long-term risk to this repo. | Conventions in 4.5, small-file rule, reuse-first, `make check` gate. |

## 7. Background playback (stage 5, not MVP)

Goal: audio keeps playing when the iPhone locks or the app closes, like Apple Music. Not now; recorded so MVP doesn't block it.

iOS Safari generally pauses embedded YouTube iframes when backgrounded or locked, and suspends JS timers (our loop polling), so even surviving audio wouldn't loop correctly. Without Premium there is no sanctioned workaround. To be verified on device later; not confirmed here.

| Option | Notes |
|---|---|
| A. Iframe + Media Session API + installed PWA | ToS-clean, lock-screen metadata/controls. Likely still pauses on lock. Cheap to try. |
| B. Backend extracts audio, play via `<audio>` | True background play, exact loop control, arbitrary speed. **Violates YouTube ToS, fragile, needs a server.** Owner undecided; ask before building. |
| C. Native wrapper (Capacitor) | Best background behavior; conflicts with "no app setup". |

Order: try A, then reassess.

## 8. Later stages (sketch)

### Stage 2: Local library
Keep **video** separate from **loop** (usually one loop per song, but allow several):
```ts
interface Video { id: string; title: string; thumbnailUrl: string }  // via YouTube oEmbed, no API key
interface Loop {
  id: string; videoId: string; label?: string;
  start: number; end: number | null; rate: number;
  favorite: boolean; tags: string[];
  lastPlayedAt?: number; playCount: number;
}
```
- Storage behind a small `Storage` interface (IndexedDB or `localStorage` JSON) so stage 3 swaps implementations.
- Features: save current setup, favorites, tags, recent, search. Organization = favorite flag + tags; no nested folders.

### Stage 3: Sync
| Option | Pro | Con |
|---|---|---|
| Supabase | Auth + Postgres + RLS, little code | External service |
| Owner's Linux cluster + community auth + tiny API | Self-hosted, keep-the-lights-on | More ops and code |
| Export/import JSON | No backend | Manual |

Single user: one list of loops per user. UI never knows which backend is in use.

### Stage 4: Playlists / queue
Ordered list of saved loops; next/prev; swap the active loop without reloading the page (one player instance).

## 9. Prior art (researched 2026-10-31, lightly)
LoopTube.xyz / looptube.io (minimal reference), YouTube On Loop (A/B, speed, loop playlists), LoopingTube, YouXube, Endless Video, tubeRepeater (language-learning A-B repeater), LoopIt (Firefox extension with saved sections and shortcuts), Looper for YouTube / Enhancer for YouTube (extensions). Many lookalike domains exist; verify before visiting. Ideas worth borrowing later: saved sections per video, loop playlists, shortcut set. Waveforms and pitch shift are out of scope unless asked.

## 10. Open questions
1. Is an unofficial audio-extraction backend acceptable for personal use if the PWA can't background on iPhone? (Stage 5.)
2. Confirm React (vs Svelte) and Biome/Vitest.
3. Sync backend: Supabase vs the owner's cluster. (Stage 3.)

## 11. Decision log
| Date | Decision |
|---|---|
| 2026-10-31 | MVP is a pure frontend looptube.io clone: no storage, organization, or export. |
| 2026-10-31 | Background/locked-screen playback deferred beyond MVP; no iPhone testing needed for MVP. |
| 2026-10-31 | Never store video duration in URL or state. |
| 2026-10-31 | Stack: TypeScript + React + Vite, plain CSS, Biome, Vitest. Runtime deps: react, react-dom only. |
| 2026-10-31 | Organize by kind (components/hooks/lib/types/constants/styles); minimal-code conventions in 4.5. |
| 2026-10-31 | Claude never runs git write actions; human handles all git and reviews all changes. Makefile contains no git commands. |
| 2026-10-31 | Makefile is the entry point for setup/run/build/test/lint/deploy/clean. |
| 2026-10-31 | Hosting on GitHub Pages via Actions; PWA via manifest only, no service worker yet. |
| 2026-10-31 | Backend (Supabase vs owner's cluster) deferred until after local library. |
| 2026-10-31 | Themes are CSS-only token skins switched via `data-theme`, stored in localStorage (section 4.7). |
