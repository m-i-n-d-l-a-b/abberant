# Branch Review: `main` @ 081ed52

**Reviewed**: 2026-09-02
**Branch**: `main` (level with `origin/main`, 0 ahead / 0 behind, clean tree)
**Scope**: full branch contents — no diff base exists, so the whole source tree was reviewed
**Decision**: BLOCK

## Summary

`main` does not build, does not type-check, and its test suite cannot execute a single test.
Separately, roughly 70% of production source is constructed-but-never-invoked dead code: the
"modularization" refactor built a parallel engine, renderer, and audio stack alongside the
original inline implementation in `GameEngine.ts`, and never switched over.

## Validation Results

| Check | Result | Detail |
|---|---|---|
| Type check | Fail | 184 errors (`tsc --noEmit`) |
| Lint | Fail | 1 error blocks `next build` |
| Tests | Fail | 19/19 suites error; 0 tests execute |
| Build | Fail | Blocked at lint, then again at type-check |

Build failure verified twice: `next build` stops at ESLint; with lint temporarily bypassed it
stops at `Type error: Cannot find namespace 'THREE'` in `components/VFXCanvasTest.tsx:5`.
The temporary config change was reverted; the tree is clean.

## Findings

### CRITICAL

**C1 — Test suite cannot run. Zero tests execute.**
`jest.setup.js:8`
Commit 081ed52 rewrote this file from `require('@testing-library/jest-dom')` to
`import '@testing-library/jest-dom'`. The file is plain `.js`, and `jest.config.js` transforms
only `^.+\.tsx?$`, so every suite dies on `SyntaxError: Cannot use import statement outside a
module`. Restoring only the previous version of this one file returns the suite to 247 tests
(211 pass / 36 fail, stable across three runs). Fix: revert to `require()`, add a `.js`
transform, or rename to `jest.setup.ts`.

**C2 — `next build` fails. Branch is not deployable.**
`components/VFXCanvas.tsx:31` — unescaped apostrophe trips `react/no-unescaped-entities`.
`components/VFXCanvasTest.tsx:5` and `lib/vfx/utils.ts:49` — `THREE` namespace used without
`import * as THREE from 'three'`.
Both stages must pass; fixing only the lint error exposes the type error.

**C3 — Start button fires `startGame()` twice per click.**
`lib/game/InputManager.ts:334-337` + `components/StartScreen.tsx:40-41`
`InputManager`'s constructor attaches a native `click` listener to `#startButton`. `StartScreen`
renders that same button with React `onClick`. Both paths reach `GameEngine.startGame()`
(`GameEngine.ts:170` and `hooks/useGame.ts:149`), which is not idempotent — it runs `resetLevel()`
and `startBGM()` unconditionally (`GameEngine.ts:569-580`). Every game start regenerates the level
and starts BGM twice. Verified: initial `gameScreen` is `START` (`useGame.ts:57`), so the button is
in the DOM when the engine is constructed. Fix: delete `setupStartButton()`; let React own it.

**C4 — Mobile touch controls are never wired up.**
`lib/game/InputManager.ts:211` + `components/Game.tsx:122`
`setupMobileControls()` runs `document.querySelectorAll(".mobile-button")` once, in the
`InputManager` constructor. `MobileControls` renders only when `gameScreen === PLAYING`, so at
construction time (START screen) the query returns an empty list and no touch handlers are ever
attached. There is no re-setup path. Mobile input is entirely non-functional.
The same timing issue makes `setupSoundToggle()` a no-op — harmless, but it means C3's duplicate
wiring exists only for the start button.

**C5 — `AudioContext` is never closed.**
`lib/game/GameEngine.ts:325` creates it; `cleanup()` (`:1270-1277`) calls only
`inputManager.cleanup()` and `stopBGM()`. Every unmount leaves a live context. Browsers cap
concurrent contexts (~6 in Chromium); Fast Refresh during development remounts this repeatedly,
after which all audio silently dies. Fix: close the context in `cleanup()`.

### HIGH

**H1 — 70% of production source is dead code (8,175 of 11,602 lines).**
Constructed in `GameEngine`'s constructor, never invoked anywhere:

| Subsystem | Lines | Status |
|---|---|---|
| `PlayerManager`, `EnemyManager`, `GameStateManager`, `LevelGenerator`, `ObjectPool` | 2,311 | Zero call sites |
| `CollisionSystem` | 553 | Only two debug hotkeys |
| `Renderer`, `EntityRenderer`, `EffectsRenderer`, `BackgroundRenderer`, `RenderingOptimizer` | 3,532 | Sole driver `renderWithModularRenderer()` (`GameEngine.ts:1017`) is never called |
| `AudioManager`, `AudioManagerWrapper` | 1,475 | Constructed at `GameEngine.ts:168`, never referenced again |
| `VFXCanvas`, `VFXControls`, `VFXCanvasTest`, `lib/vfx/utils` | 304 | Imported by nothing but their own tests |

The live game runs entirely through `GameEngine.ts`'s inline `render()`/`renderToContext()`/
`updateGame()` and a raw `audioCtx`. Consequences: the passing tests for these modules give false
confidence, the `c`/`v` collision-debug hotkeys inspect a permanently empty quadtree, and any bug
fixed in a manager has no effect on the shipped game. Decide per subsystem: wire it in or delete it.

**H2 — Engine writes directly to DOM nodes React owns.**
`GameEngine.updateUI()` (`:1252-1261`) sets `textContent` on `#lives`/`#score`/`#level`/`#combo`
every frame via `getElementById`. `GameUI.tsx:48-51` renders those same ids from React state,
polled separately every 100ms (`useGame.ts:123`). Two writers, one set of text nodes. React skips
DOM writes when its own state is unchanged, unaware the engine already overwrote the node.
`GameUI`'s props are effectively decorative. Fix: drive display values through the
`onLivesChanged`/`onScoreChanged`/`onComboChanged` callbacks already declared at
`GameEngine.ts:56-58` but never wired, and delete both `updateUI()` and the polling interval.

**H3 — `forEach` + `splice` on the same array skips an enemy per removal.**
`lib/game/GameEngine.ts:860-882`. When an enemy is stomped and spliced out, `forEach` does not
revisit the shifted index, so the next enemy is skipped for that frame's collision check.
Fix: iterate backwards. Note `EnemyManager.updateEnemies()` already does this correctly — in dead code.

**H4 — `AudioManager` constructor leaks an uncancellable interval.**
`lib/game/AudioManager.ts:993-997` — the `setInterval` handle is discarded and never cleared. The
closure holds a strong `this`, so every `GameEngine` construction permanently leaks an
`AudioManager` plus a 30-second timer, even though the instance is otherwise unused.

**H5 — Mobile controls are inaccessible.**
`components/MobileControls.tsx:20-33` — all controls are `div` elements with `data-action`, no
`role`, no `tabIndex`, no `aria-label`. Glyphs carry no text alternative. Unreachable by keyboard,
invisible to screen readers. Fix: use real buttons with React handlers, which also resolves C4.

**H6 — No dialog semantics or focus management on overlays.**
`components/GameOverScreen.tsx:43-66`, `components/PauseScreen.tsx:39-55` — no
`role="dialog"`/`aria-modal`, no focus moved to the primary button on mount.

### MEDIUM

**M1** — `getFromStorage` returns `defaultValue || null`, so falsy defaults (`false`, `0`, `''`)
collapse to `null`. `lib/utils/storage.ts:31,35`.

**M2** — `hexToRgba` throws on malformed input and returns `rgba(NaN,NaN,NaN,1)` for non-hex
6-character strings; called from render paths. `lib/utils/storage.ts:52-56`.

**M3** — Latent infinite render loop in `EffectsLab`. `components/EffectsLab.tsx:77-82` sets state
the effect also depends on. Inert only because `getCanvasEffectSettings` does not exist on
`GameEngine` (verified: the call site is its only occurrence in the repo). Implementing that method
so it returns a fresh object turns this into a hang.

**M4** — Constants disconnected from runtime. `LEVEL_START_INVINCIBILITY = 2` vs hardcoded `120`
(`GameEngine.ts:953`); `PLAYER_INVULNERABLE_TIME = 30` vs `180` (`:934`); `PLAYER_GRAVITY` vs
`const gravity = 0.8` (`:778`). Tuning `constants/game.ts` has no effect.

**M5** — Shallow spread then nested mutation throughout `EffectsLab.tsx` (lines 170-375);
`newSettings.wobble` aliases the previous object.

**M6** — Missing `'use client'` on `VFXCanvas.tsx`, `VFXControls.tsx`, `VFXCanvasTest.tsx`.
Harmless today only because nothing imports them.

**M7** — No security headers. `next.config.js` uses `output: 'export'`, so Next's `headers()` is
unavailable and no `_headers`/`vercel.json` exists. Add CSP, `X-Content-Type-Options`, and
`frame-ancestors` at the host layer.

**M8** — 15 npm advisories (1 critical, 12 high). All devDependencies; none reach the client
bundle. `npm audit fix` reports a fix available for all.

**M9** — Latent bugs in dead code, to fix before any revival:
- `CollisionSystem.ts:166` — quadtree `query()` filters against the node's own bounds, not the
  query rectangle, making the check tautological.
- `EnemyManager.ts:175,187` — movement patterns keyed by `${enemy.x}-${enemy.y}`, which changes
  the moment the enemy moves; the lookup misses forever after frame one.
- `AudioManager.ts:761-778` — `evictLowestPriorityEntry` starts at `Infinity` and tests
  `priority > lowestPriority`, so it evicts nothing; `cacheEffect`'s `while` loop (`:737-744`)
  therefore spins forever once the cache fills.
- `Renderer.ts:296-371` vs `EffectsRenderer.ts:274-326` — post-processing applied twice, once
  inside the camera transform and once outside.

### LOW

- Roughly 40 `console.log` calls in production paths (`hooks/useGame.ts`,
  `components/Game.tsx:29-31`, `lib/game/AudioManager.ts`).
- Dead CSS: `styles/{common,game,menu,mobile,ui}.css` have zero references; `ui.module.css` is
  unreferenced. Real styling lives in `app/globals.css` via id/class selectors. `MobileControls.tsx`
  imports two CSS modules and uses neither.
- Root `index.html` is a pre-Next.js leftover, unused by the App Router.
- `jest.config.js` omits `hooks/` from `roots` and `collectCoverageFrom`, so `useGame.ts` has no
  coverage; no `coverageThreshold` is set despite the 80% project standard.
- `app/globals.css:1` imports Google Fonts at runtime while `layout.tsx` also uses `next/font`.
- One flaky test between runs (37 vs 36 failures on the restored baseline).

## Pre-existing test failures (once C1 is fixed)

36 of 247 fail. The bulk are the `StartScreen`, `PauseScreen`, `GameUI`, and `GameOverScreen`
suites asserting on "styled-jsx styles" and CSS-Module class names that the CSS-Modules migration
changed without updating the tests. Five suites fail to load outright.

## Recommended order

1. C1 — revert `jest.setup.js` to restore the safety net.
2. C2 — unblock the build.
3. C3, C4 — fix input wiring; both are user-facing and mobile is fully broken.
4. C5, H4 — audio and timer leaks.
5. H1 — decide per subsystem: wire in or delete. Largest lever on future maintenance.
6. H2, H3, then the accessibility items.
