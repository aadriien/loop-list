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
| `make run` | Starts `make backend` and `make frontend` together (Ctrl-C stops both) |
| `make backend` | Local PocketBase for development: downloads the binary into `.pb/` on first use, applies `pb_migrations/` and `pb_hooks/`, keeps data in `.pb/data`, serves on 127.0.0.1:8090. Dashboard at `/_/`; the throwaway dev admin login comes from a gitignored `.env` (copy `.env.example`; `make run` stops with a message if it is missing) |
| `make frontend` | Vite dev server; `/api` is proxied to the local PocketBase (see `vite.config.ts`) |
| `make pb-reset` | Delete the local PocketBase data (`.pb/data`); recreate the dev user afterwards |
| `make build` | Production build to `dist/` |
| `make preview` | Serve the production build locally |
| `make test` | Vitest, single run |
| `make lint` | Biome check (no writes) |
| `make format` | Biome format + safe fixes (writes) |
| `make check` | typecheck + lint + test (what CI runs) |
| `make deploy` | `make check` then `make build`, then prints a reminder to push `main`. Contains no git commands: the human pushes, and the GitHub Actions workflow publishes to Pages |
| `make clean` | Remove `dist/` and caches (keep `node_modules`); `make nuke` also removes `node_modules` and `.pb/` |

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
- Themes so far: `tech` (default), `haunted` (picture-frame player, cobweb, candle glow), `vhs` (chunky TV bezel and scanlines on the player, starry blue; vibe only, no logos or characters), `fairytale` (storybook night sky with castle silhouette, gold frame), `cozy` (warm lamp glow, corduroy, string lights, wooden frame), `neon` (cyberpunk skyline with neon glow), `space` (starfield, planet and ring, cockpit-window frame; generic space opera, no franchise marks), `jungle` (hanging fronds, sunlight, rope-stitched wooden frame), and `airy` (a minimal colors-only stand-in). All use system fonts; web fonts are an open decision. OS light/dark inheritance comes after the first themes. Static decoration only; respect `prefers-reduced-motion` if animation is ever added.

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
| Embeds blocked per hostname | Rights holders (e.g. music publishers) can allow or block embedding by domain via YouTube Content Manager ([help page](https://support.google.com/youtube/answer/6301625)). Seen 2026-11: one video ("blocked it from display on this website") failed on the first custom hostname but played on `localhost`, `github.io`, Disco's default URL, and a different hostname on the same custom domain. It was not headers, referrer, COOP, or embed code (the `Referer` was correct, looptube uses the same plain `YT.Player` call). | If an embed is blocked on the deployed site but plays on `youtube.com`, try another hostname before debugging code. No code fix exists. |
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

**First slice (built):** save the current loop, list saved loops, click to load, delete. Stored in `localStorage` (`loop-list-library`) via `lib/libraryStorage.ts` and `hooks/useLibrary.ts`; those two files are the seam to replace when sync arrives. Layout is a responsive side panel (`components/Library.tsx`): a right-hand column from 900px up, stacked below the player on phones. No drawer, which keeps it one page and leaves room for favorites, tags, filters and a play queue. `SavedLoop` is denormalized for now (title stored on the loop; no separate `Video` record). Editing: selecting a loop makes it the active one (highlighted); **Update loop** overwrites its range and speed, **Save loop** still creates a new entry, and ✎ renames via `window.prompt` for now (inline editing is a later polish). Favorites, tags, recents and duplicate handling are not built.
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

**Built (first slice):** self-hosted PocketBase on a Disco instance (Raspberry Pi), one container serving the app, the API and the admin UI (`/_/`) at one origin; data in SQLite on the `pb-data` volume. Schema lives in `pb_migrations/` (new files for changes, never edit applied ones; don't change the schema by clicking in the production dashboard). Registration is closed; accounts are created by hand in the admin UI (no in-app create-account flow, by choice). Client: local-first (`localStorage` stays the working copy); `hooks/useSync.ts` pulls, merges (newest `updatedAt` wins per loop, deletions are `deleted` tombstones; see `lib/mergeLoops.ts`) and pushes, on changes (debounced) and when the tab becomes visible. Email/password sign-in via `hooks/useAuth.ts`. **Ownership:** every loop has an owner (`user` relation, `pb_migrations/2_loops_owner.js`). API rules limit list/view/update/delete to the owner and forbid reassigning it, and `pb_hooks/loops.pb.js` stamps the signed-in user on create so a client can't spoof it. The client never sees the `user` field. The migration assigns existing loops to the account only when exactly one account exists (otherwise assign by hand, or they stay invisible). **Accounts are locked down:** the `users` update and delete rules are closed (`pb_migrations/3_users_search_access.js`), so a user cannot edit or delete their own account through the API; email, password and the `canSearch` flag are changed by the admin in the dashboard. **Local cache:** signing in, or pressing Sign out, clears the local library cache and the active loop, and sync repopulates from the server, so one account's loops never leak into another's (`hooks/useAuth.ts`). An expired session keeps the cache (`dropSession`) so unsynced edits survive, and the next sign-in clears it. Consequence: loops saved while signed out are discarded at sign-in. Not built: community OAuth, sync indicator polish, conflict UI, more than 500 loops (single page fetch), backups (see below).
| Option | Pro | Con |
|---|---|---|
| Supabase | Auth + Postgres + RLS, little code | External service |
| Owner's Linux cluster + community auth + tiny API | Self-hosted, keep-the-lights-on | More ops and code |
| Export/import JSON | No backend | Manual |

Single user: one list of loops per user. UI never knows which backend is in use.

#### Local development
`make run` runs a local PocketBase beside the Vite dev server, so sync and sign-in work on localhost without touching the live Pi. It uses the repo's own migrations and hook, so a new migration can be tried locally before deploying. One-time setup: open `http://127.0.0.1:8090/_/`, sign in as the dev admin, and add a dev user (any throwaway email and password) to the `users` collection; then sign in once from the Sync box on the dev site. The token is kept in that origin's `localStorage`. Local and live accounts are independent. To use search locally, also tick `canSearch` on the dev user (it is off by default for accounts created after migration 3, and `make pb-reset` loses it) and put your own `YT_API_KEY` in `.env`.

#### Backups (to revisit on a regular cadence)
The database is a SQLite file on the `pb-data` volume on the Raspberry Pi (presumably an SD card). The volume survives redeploys, but not a dead disk, a deleted project/volume, or an admin wiping the shared instance. Device `localStorage` copies are a partial safety net, not a backup. Not set up yet; ideas, none verified:
- **Off-box copies are the point.** A backup kept only on the same volume does not protect against losing the volume.
- **PocketBase's own backup feature** (dashboard, Settings, Backups) produces a consistent zip of `pb_data`; I believe it can run on a schedule and store locally or in S3-compatible storage. Prefer it over copying the live SQLite file.
- **Disco cron service.** Disco's docs say scheduled tasks are configured as a cron service in `disco.json` (see its docs for instructions), with a `schedule` in standard cron syntax and hours in UTC, e.g. `0 21 * * *` runs daily at 21:00 UTC. A daily or weekly job could trigger a PocketBase backup or export a zipped copy and ship it somewhere else (email, a bucket, another machine). How a cron service reaches the volume is unconfirmed.
- **Cheapest fallback:** periodically download a backup by hand from the dashboard.
- Open questions: where copies go, retention, and a restore drill (a backup you have never restored is untested).

### Discover (video search)
**Built so far (backend only):** `pb_hooks/search.pb.js` adds `GET /api/yt/search?q=...&pageToken=...`, which calls the YouTube Data API v3 `search.list` with `type=video`, `videoEmbeddable=true` and `videoSyndicated=true`, and returns `{ items: [{ videoId, title, channel }], nextPageToken }` (titles HTML-decoded; thumbnails can be derived from the video id). It requires a signed-in user whose `canSearch` checkbox is ticked (a field on the `users` collection, migration `3_users_search_access.js`; managed in the admin UI, off by default for new accounts), reads the key from the `YT_API_KEY` environment variable (gitignored `.env` locally, passed to PocketBase by the Makefile; a Disco environment variable in production), and maps failures to 429 (daily quota), 502 (upstream) and 500 (key missing). The IFrame Player API cannot search (Google removed its search playlist option in 2020), so the Data API is the only supported route. Quota is small (the docs describe roughly 100 searches per day; check the Cloud console), so search only on submit, cache, and show a clear message when it runs out. The key should be restricted to the YouTube Data API v3 only; HTTP-referrer restrictions would break server-side calls.
**UI (built, basics only):** `components/Discover.tsx` is a collapsible panel at the top of the side column (open state remembered in `localStorage`), shown only when the signed-in account has `canSearch` (the client learns this from the sign-in and token-refresh responses and stores `{ token, canSearch }` as the session; `lib/authStorage.ts` upgrades older bare-token sessions). It has a search box and a scrollable results list (thumbnail built from the video id, title, channel) with a Load more button. Clicking a result loads it straight into the main player (`load({ videoId })`, then scrolls to the top on small screens), where Save loop, range and speed work as usual. There is no second player and no per-result Save.
**Not built:** duration, view count and published date on results (YouTube's search call does not return duration or views; it would need a second `videos.list` lookup in the route), a per-user daily cap, and a music-only filter. The route asks for 50 results per call (the API maximum; the cost is per call). **Results cache (built):** `lib/searchCache.ts` keeps up to 20 recent result pages in `localStorage` (key is the trimmed, lowercased query plus page token; entries expire after 24 hours; errors are never cached), so repeating a search spends no quota; it stores `{ videoId, title, channel }` per result and the thumbnail is rebuilt from the id. It is cleared whenever the session changes (sign-in or Sign out). **Recent searches (built):** `lib/recentSearches.ts` keeps the last 10 distinct successful queries (newest first, repeats ignored regardless of case) in `localStorage` and the panel shows them as quick-pick chips under the search box; clicking one fills the box and searches (free if the results are still cached). Also cleared when the session changes.

### Categories (organizing saved loops)
**Decision:** categories are plain labels on loops (many per loop; a loop can be in several), not ordered playlists, and not separate tables. Each `SavedLoop` has `categories: string[]`, stored in a JSON field on the `loops` collection (`pb_migrations/4_loops_categories.js`, capped at 4096 bytes). Because they live on the loop, they sync through the existing newest-edit-wins merge, and two devices adding different loops to the same category both survive. A category exists only while some loop has it (no empty categories); creating one means typing a new name when assigning it to a loop. Renaming or deleting a category rewrites every loop that has it (each gets a new `updatedAt`); deleting only removes the label, never loops. Names are trimmed and compared case-insensitively (first spelling wins) with a length limit.
**Built so far:** the field, the type, sync, and defaults (`lib/libraryStorage.ts` and `lib/pocketbase.ts` turn missing or null into `[]`). Saved name search (`lib/filterLoops.ts`, a substring match on the title) already exists in the Library panel. **Assigning (built):** categories are edited in the main video view, not in the narrow Saved loops panel (an in-row editor there felt cramped). `components/CategoryBar.tsx` sits under the player controls: the loop's categories as removable chips, and an "Add a category" field where typing suggests existing categories and a new name creates one. For a loop that is already saved, changes apply immediately (and sync); for an unsaved loop the picks are held in `App` and attached when you press Save loop. To categorize a saved loop, select it in the list and edit it in the main view. Names are cleaned by `lib/categories.ts` (trimmed, inner spaces collapsed, case-insensitive match that reuses an existing spelling, 30 characters, 20 categories per loop; limits in `constants/categories.ts`). Library rows only display a loop's categories (up to three chips plus `+n`).
**Planned, in order:** single-select filter chips above the list (All plus each category) that combine with name search; then rename and delete for a category (each its own step). Favorites (a star) come later and are separate from categories.

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
| 2026-11-01 | Next after MVP: local library (save/list in localStorage), then a tiny backend for cross-device sync; favorites/tags/recents, theme and PWA polish come after. Library UI is a responsive side panel. |
| 2026-11-01 | Backend is self-hosted PocketBase on a Disco instance, serving app + API from one container; local-first sync with last-write-wins per loop; email/password auth first, community OAuth later. |
| 2026-11-01 | Accounts are added manually in the PocketBase admin UI; no in-app sign-up. Loops are per-user (owner relation, stamped server-side). Sign-in and sign-out clear the local cache and repopulate from the server. |
| 2026-11-01 | Backups are not set up yet; revisit regularly as a complement to the Pi (candidate: Disco cron service plus PocketBase backups shipped off-box). |
| 2026-11-04 | Video search goes through a server-side route (key never in the browser) gated by a `canSearch` flag on `users`; user accounts cannot edit or delete themselves via the API. A per-user daily cap is undecided. |
| 2026-11-05 | Saved loops are organized with categories stored as a JSON list on each loop (no category tables, no ordered playlists or sequential playback); filtering is single-select chips plus name search. |
| 2026-10-31 | Themes are CSS-only token skins switched via `data-theme`, stored in localStorage (section 4.7). |
