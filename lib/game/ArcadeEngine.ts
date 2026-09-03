/**
 * Arcade Engine
 *
 * The contract every game mode satisfies, and the factory that builds one.
 *
 * GameEngine and SnakeEngine share their audio, input, starfield and
 * post-processing, but not their simulation. This is the seam between them:
 * useGame drives whatever it is handed through this interface, and never needs
 * to know which mode is running.
 */

import { GameEngine, GameEngineCallbacks } from './GameEngine'
import { SnakeEngine } from './SnakeEngine'

/** Playable modes, keyed by the id stored in UI state. */
export type GameMode = 'abberant' | 'snake'

export const GAME_MODES: GameMode[] = ['abberant', 'snake']

/** Display name for a mode, for menus and labels. */
export const GAME_MODE_LABELS: Record<GameMode, string> = {
  abberant: 'SIDE-SCROLLER',
  snake: 'SNAKE'
}

/**
 * State and lifecycle a mode must expose.
 *
 * Deliberately the minimum useGame reads or calls. Anything mode-specific -
 * the Effects Lab, say - stays off this interface and is reached by narrowing
 * to the concrete class.
 */
export interface ArcadeEngine {
  gameState: string
  lives: number
  score: number
  combo: number
  bestCombo: number
  paused: boolean
  soundEnabled: boolean
  animationFrameId: number | null
  readonly bgmTimeoutId: ReturnType<typeof setTimeout> | null

  startGame(): void
  restart(): void
  togglePause(): void
  cleanup(): void
}

/**
 * Build the engine for a mode.
 *
 * Both engines start their own render loop on construction.
 */
export function createEngine(
  mode: GameMode,
  canvas: HTMLCanvasElement,
  callbacks: GameEngineCallbacks = {}
): ArcadeEngine {
  return mode === 'snake'
    ? new SnakeEngine(canvas, callbacks)
    : new GameEngine(canvas, callbacks)
}
