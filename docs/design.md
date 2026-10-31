# loop-list: Design Doc

Status: **draft / pre-implementation** (nothing is built yet). Last updated 2026-10-31.

This doc is written so a fresh Claude session can pick it up cold. Read sections 1-3 and 6 before writing code. Keep this doc current when decisions change (see section 11, Decision log).

## 1. Summary

A personal, browser-based clone of [looptube.io](https://looptube.io): paste a YouTube URL or ID, play it in the page, and control start/stop points, playback speed, and repeat.

Later, grow it into a personal library (favorites, tags, history, playlists) that plays everything in a single tab, usable from laptop and iPhone with no native app.

### Why not just use looptube.io
- It injects the video **duration** into the URL, and sometimes gets it wrong (seconds miscounted).
- One tab per song. We want one tab, many songs.
- Playback stops when the tab is closed or the iPhone locks. (Long-term goal; **out of scope for MVP**, see section 7.)

### Owner preferences (constraints on all decisions)
- **Keep it simple.** No clever features until the basics work.
- **Very few library imports.** Only where strictly necessary. Prefer the platform (DOM, `URLSearchParams`, `fetch`, `localStorage`).
- **Website only**, works on desktop and iPhone Safari. No app store, no native wrapper.
- User has **no YouTube Premium**, uses an **iPhone**, usually has **one loop per song**.
- Backend, when it comes, should be tiny. Options on the table: Supabase (or similar), or the owner's Linux cluster with community-based auth ("keep the lights on" scale).

## 2. Stages at a glance

| Stage | Scope | Backend? |
|---|---|---|
| **0. Spike** | Verify iframe API behavior on the owner's iPhone (autoplay, playsinline, speed, seek) | No |
| **1. MVP** | looptube.io clone. No storage, no organization, no export. | No |
| **2. Local library** | Save loops, favorites, tags, recent history in the browser | No (localStorage/IndexedDB) |
| **3. Sync** | Same library across laptop and phone | Yes, tiny |
| **4. Playlists / queue** | Play a set of saved loops back to back in one tab | Same as 3 |
| **5. Background audio** | Keep playing when the phone locks | Maybe |

Only stage 1 is being planned in detail. Later stages are sketched so stage 1 doesn't paint us into a corner.

## 3. MVP (stage 1) requirements

Must have:
1. **Input**: text box accepting a YouTube URL or bare video ID. Parse these forms (see 5.1): `watch?v=`, `youtu.be/`, `shorts/`, `embed/`, `live/`, `m.youtube.com`, `music.youtube.com`, bare 11-char ID, plus a `t=`/`start=` param on the pasted URL as an initial start time.
2. **Player**: embedded YouTube player in the page, play/pause.
3. **Start and end controls**: set loop range by (a) typing a time, (b) "set to current time" buttons, (c) nudge buttons (±0.1s / ±1s), (d) a range slider with two handles over the video timeline.
4. **Loop toggle**: when on, playback returns to `start` on reaching `end`. When off, play through normally (still honoring `start`).
5. **Playback speed**: choose from the rates the player reports as available.
6. **Shareable URL state**: `?v=<id>&s=<start>&e=<end>&r=<rate>` (see 5.2). Reloading or sharing the URL restores the setup. **Duration is never stored in the URL.**
7. **Mobile-usable**: works in iPhone Safari at phone width, big touch targets.
8. **Keyboard shortcuts** on desktop (space = play/pause, a few for set-start/set-end/nudge).

Explicitly **not** in MVP: accounts, saving, lists, tags, history, export/import, audio-only mode, background playback, waveform, pitch shifting, theming.

### Acceptance checks for MVP
- Pasting each URL form from 3.1 loads the right video.
- Setting start 10.0 / end 20.5 loops seamlessly within roughly a quarter second.
- Loading a URL with `s`/`e`/`r` params restores state; changing controls updates the URL (via `history.replaceState`, no new history entry per tweak).
- If `e` is missing, the loop end is the video's duration, read from the player at runtime.
- Works on desktop Chrome/Safari and iPhone Safari.

## 4. Tech choices

### Recommendation
- **Language:** TypeScript. Types pay off once the data model arrives in stage 2, and it is cheap to start with.
- **Build tool:** [Vite](https://vite.dev) as a **dev dependency only** (dev server, bundling, TS transpile). Zero runtime dependencies shipped.
- **UI:** plain DOM / small hand-written modules. **No framework** for MVP. A small number of components is easy to write imperatively. Revisit only if stage 2 UI becomes painful.
- **Styling:** one hand-written CSS file with custom properties. No CSS framework.
- **Player:** the official [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference), loaded by script tag from `https://www.youtube.com/iframe_api`. This is an unavoidable external dependency.
- **Tests:** keep tiny. Pure functions (URL parsing, time formatting/parsing, state<->URL serialization) get unit tests via Node's built-in `node:test` runner. No Jest/Vitest. Player behavior is checked manually (it needs a real browser and YouTube).
- **Lint/format:** optional; if added, a single tool (e.g. Prettier or Biome). Not required for MVP.

Resulting `package.json`: dev deps `vite`, `typescript`. That's it.

### Alternatives considered
| Option | Pro | Con |
|---|---|---|
| **TS + Vite, no framework** (chosen) | Types, fast dev loop, tiny output, 2 dev deps | Needs a build step |
| Plain JS ES modules, **no build at all** | Zero tooling; open `index.html` from any static server | No types; JSDoc + `tsc --noEmit` can recover most of it. Reasonable fallback if Vite feels like too much |
| Svelte/Preact/React | Nicer for list-heavy UI later | Violates "few imports" for MVP; defer |
| Tailwind etc. | Faster styling | Extra dependency and build config for little value |

Note: the YouTube iframe **will not work from a `file://` page** (YouTube returns error 153 when the embed has no valid HTTP referrer). Always serve over `http(s)`, including `localhost` during dev.

### Hosting
Static files only for stages 1-2: any static host (Cloudflare Pages, Netlify, GitHub Pages) or the owner's Linux cluster. HTTPS is required for PWA features and recommended generally.

## 5. Design details (MVP)

### 5.1 Video ID parsing
Write a pure function `parseVideoInput(text): { id: string; start?: number } | null`.
- A bare ID matches `/^[A-Za-z0-9_-]{11}$/`.
- Otherwise try `new URL(text)` and extract the ID from `?v=`, or the path for `youtu.be/<id>`, `/shorts/<id>`, `/embed/<id>`, `/live/<id>`.
- Accept a `t` or `start` param as seconds or `1h2m3s` style.
- Return `null` on failure and show an inline error. Don't throw.

### 5.2 State and URL
Single source of truth, one object:

```ts
interface LoopState {
  videoId: string;
  start: number;      // seconds, float, >= 0
  end: number | null; // seconds; null = end of video (resolved at runtime)
  rate: number;       // playback rate, default 1
  loop: boolean;      // default true
}
```
- URL encoding: `?v=ID&s=12.5&e=48&r=0.75`; omit defaults (`s=0`, `e` null, `r=1`). `loop=0` only when disabled.
- **Never persist or derive anything from the video duration.** Read it from `player.getDuration()` when needed (it returns 0 until metadata loads, and for live streams; handle that).
- Clamp and validate on load: `start >= 0`, `end > start`, `rate` snapped to the player's available rates.
- Use `history.replaceState` for updates; debounce slider drags.

### 5.3 Loop enforcement
The IFrame API's built-in `loop` param only loops the whole video (or a playlist), so it cannot loop an A-B range. Do this ourselves:
- While playing, poll `player.getCurrentTime()` on a short interval (~100ms with `setInterval`, or `requestAnimationFrame` when the tab is visible; compare, then pick whichever is smoother in testing).
- If `currentTime >= end` and `loop` is on, `seekTo(start, true)`.
- Also handle `onStateChange === ENDED` (no end set, video finished): `seekTo(start)` then `playVideo()` if looping.
- Expect a small audible gap on the seek. That's acceptable for the MVP. Can be improved with a lead time (seek slightly before `end` based on measured latency).
- Polling is throttled or suspended in background tabs and when the iPhone is locked, so loops can drift or stop there. Known limitation (section 7).

### 5.4 Playback rate gotchas
- Use `player.getAvailablePlaybackRates()` to build the speed picker rather than hard-coding. Usually 0.25 to 2 in 0.25 steps, so arbitrary values like 0.85x are not possible with the embed.
- **Loading or cueing a new video resets the rate to 1.** Re-apply `setPlaybackRate` after each load/cue (e.g. in `onReady` / on first `PLAYING` state).
- Pitch is preserved by the browser.

### 5.5 iPhone / Safari gotchas to verify in the spike (stage 0)
- Autoplay generally requires a user gesture; expose an explicit play button and handle the `onAutoplayBlocked` event.
- Pass `playsinline: 1` in `playerVars` so iOS doesn't force fullscreen.
- Confirm `seekTo`, `setPlaybackRate`, and the polling loop all work while the video plays inline.
- Confirm what happens on screen lock and on switching apps (informational only, section 7).

### 5.6 Suggested file layout
```
loop-list/
  docs/design.md          (this file)
  index.html
  src/
    main.ts               bootstrap, wiring
    player.ts             thin wrapper over the IFrame API (load, play, seek, rate, duration)
    loop.ts               loop enforcement (the polling logic)
    state.ts              LoopState, URL <-> state serialization
    parse.ts              parseVideoInput, time parse/format
    ui.ts                 DOM controls
    style.css
  test/
    parse.test.ts
    state.test.ts
  package.json            dev deps: vite, typescript
```
Keep `player.ts` as the only module that touches the `YT` global, so replacing the player later (e.g. an `<audio>` element, section 7) is a one-file change.

## 6. Current concerns x tradeoffs

| Concern | Detail | Current stance |
|---|---|---|
| YouTube ToS / embed rules | Official iframe API is the compliant route. Do not strip ads, hide the player, or extract streams in the public build. | Use the iframe. Visible player. |
| Some videos block embedding | Owners can disable embeds; the API raises errors 101/150 (and 153 for referrer problems). | Show a clear error message with a link to open on YouTube. |
| Speed granularity | Embed exposes fixed rates only. | Accept for MVP. |
| Loop precision | Polling plus seek gives ~100-250ms accuracy and a tiny gap. | Accept for MVP; revisit with `<audio>` option if it bothers the owner. |
| Duration bugs (looptube pain point) | Caused by storing duration in the URL. | Never store it. Read from player. |
| API availability / drift | The IFrame API has a public revision history and changes occasionally. | Keep the API surface used small and isolated in `player.ts`. |
| No-framework UI | Fine for MVP; may get unwieldy for library UI. | Revisit at stage 2 with a concrete pain point, not preemptively. |

## 7. Background playback (stage 5, not MVP)

Owner goal: audio keeps playing when the iPhone locks or the tab/app is closed, like Apple Music. Not needed now; recorded here so MVP code doesn't block it.

Background: iOS Safari generally pauses embedded YouTube iframes when the page is backgrounded or the screen locks, and JS timers (our loop polling) are suspended too, so even if audio survived, loop enforcement would not. Without YouTube Premium, there's no sanctioned workaround for the iframe.

Options, to evaluate later:
| Option | Notes |
|---|---|
| A. Iframe + Media Session API + installed PWA | ToS-clean, gives lock-screen metadata/controls. Likely still pauses on lock. Cheap to try. |
| B. Backend extracts audio and plays through an `<audio>` element | Would give true background play, exact loop control (can use Web Audio / `currentTime`), arbitrary speed. **Violates YouTube ToS, fragile (breaks when YouTube changes), needs a server.** Owner has not decided on this; ask before building. |
| C. Native wrapper (Capacitor, etc.) | Best background behavior but conflicts with "no app setup". |

Recommended order: run Stage 0 spike, then try A, then reassess.

## 8. Later stages (sketch, subject to change)

### Stage 2: Local library (no backend)
Data model; keep **video** separate from **loop** (owner mostly has one loop per song, but allow several per video):
```ts
interface Video { id: string; title: string; thumbnailUrl: string }   // title/thumb via YouTube oEmbed (no API key)
interface Loop {
  id: string; videoId: string; label?: string;
  start: number; end: number | null; rate: number;
  favorite: boolean; tags: string[];
  lastPlayedAt?: number; playCount: number;
}
```
- Storage: IndexedDB or `localStorage` JSON behind a small `Storage` interface so stage 3 can swap implementations.
- Features: save current setup as a loop, favorites, tags, "recently played", search by title/tag.
- Organization: favorite flag + tags. Skip nested folders.

### Stage 3: Sync
Candidate backends (choose when we get here):
| Option | Pro | Con |
|---|---|---|
| Supabase | Auth + Postgres + row-level security out of the box, little code | External service, a dependency to maintain |
| Owner's Linux cluster + community auth + tiny API (SQLite/Postgres) | Self-hosted, "keeps the lights on" | More ops and code to write |
| Export/import JSON | No backend at all | Manual |
Single user, so a data model that is one list of loops owned by one user is enough. Keep the `Storage` interface so the UI never knows which backend is in use.

### Stage 4: Playlists / queue
Ordered list of saved loops; "next/prev"; swapping the active loop without reloading the page (still one player instance).

## 9. Prior art (researched 2026-10-31)

Looper tools found; none were deeply evaluated. Check before borrowing ideas, and treat lookalike domains with care.
- **LoopTube.xyz / looptube.io**: minimal, the reference for this project.
- **YouTube On Loop**: A/B points, speed, loop playlists.
- **LoopingTube**, **YouXube**, **Endless Video**: similar looper websites.
- **tubeRepeater**: A-B segment repeater aimed at language learners.
- **LoopIt (Firefox extension)**: A-B loop, speed, saved sections, shortcuts.
- **Looper for YouTube**, **Enhancer for YouTube**: browser extensions.

Ideas worth stealing later: saved sections per video, loop playlists, keyboard shortcut set. Anything fancier (waveforms, pitch shift) is out of scope until asked.

## 10. Open questions
1. Is an unofficial audio-extraction backend acceptable for personal use if the PWA approach can't background on iPhone? (Stage 5; undecided.)
2. Final choice between TS+Vite and no-build plain JS (leaning TS+Vite; owner to confirm).
3. Where to host: static host vs. the owner's cluster.
4. Hosting domain/name, if any. (Repo is `loop-list`.)

## 11. Decision log
| Date | Decision |
|---|---|
| 2026-10-31 | MVP is a pure frontend looptube.io clone: no storage, no organization, no export. |
| 2026-10-31 | Background/locked-screen playback deferred beyond MVP. |
| 2026-10-31 | Never store video duration in URL or state; read it from the player. |
| 2026-10-31 | Prefer minimal dependencies; proposed TS + Vite (dev-only), no UI framework. |
| 2026-10-31 | Backend (Supabase vs. owner's cluster) deferred until after local library. |
