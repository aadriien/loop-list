# loop-list

Personal looptube.io clone (YouTube A-B looper) that will grow into a saved-loop library.

Read [docs/design.md](docs/design.md) before changing anything. It holds the stage plan, stack decisions, directory layout, and decision log; update it when decisions change.

## Rules
- **NEVER run git write actions** (add, commit, push, merge, rebase, reset, checkout/switch, stash, tag, etc.), even if a task seems to call for it. The human handles all git. Read-only git (status, diff, log) is fine. Propose edits only; the human reviews every change in the editor before approving.
- Minimum code. Reuse what exists in `src/lib`, `src/hooks`, `src/components`, `src/constants` before writing anything new. No speculative abstractions, dead code, or placeholder files.
- Shared types go in `src/types`, helpers in `src/lib`, magic values in `src/constants`, styles in `src/styles`. No grab-bag `utils` files.
- Write code via the editor file tools only (no shell heredocs). Declare every dependency in `package.json` so `make setup` reproduces the environment; don't install packages ad hoc.
- Comments only where behavior is non-obvious.
- Very few dependencies; justify any new one in the design doc's decision log.
- Run `make check` before calling a change done.
