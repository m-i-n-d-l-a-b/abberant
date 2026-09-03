/**
 * StartScreen Component
 *
 * Displays the game start screen with title, mode picker, start button, and
 * controls information. Extracted from the main Game component for better
 * modularity.
 */

import React from 'react'

import { GameMode } from '../lib/game/ArcadeEngine'

import menuStyles from '../styles/menu.module.css'

/**
 * Props interface for StartScreen component
 */
export interface StartScreenProps {
  /** Callback function for starting the game */
  onStartGame: () => void
  /** Whether the start screen is visible */
  visible?: boolean
  /** Optional CSS class name for styling */
  className?: string
  /** Currently selected game mode */
  mode?: GameMode
  /** Callback for switching game mode. Omit to hide the mode picker. */
  onModeChange?: (mode: GameMode) => void
}

/** Keyboard mappings shown in the controls panel, per mode. */
const CONTROL_MAPPINGS: Record<
  GameMode,
  ReadonlyArray<{ key: string; action: string }>
> = {
  abberant: [
    { key: 'WASD', action: 'Move' },
    { key: 'SPACE', action: 'Jump' },
    { key: 'SHIFT', action: 'Dash' },
    { key: 'P', action: 'Pause' },
    { key: 'R', action: 'Reset' }
  ],
  snake: [
    { key: 'WASD / ARROWS', action: 'Turn' },
    { key: 'P', action: 'Pause' },
    { key: 'R', action: 'Reset' }
  ]
}

/** Mode picker entries. */
const MODE_OPTIONS: ReadonlyArray<{
  id: GameMode
  label: string
  tagline: string
}> = [
  { id: 'abberant', label: 'SIDE-SCROLLER', tagline: 'Run, jump, dash' },
  { id: 'snake', label: 'SNAKE', tagline: 'Grow, turn, survive' }
]

/**
 * StartScreen Component
 *
 * Renders the game start screen with cyberpunk styling and animations.
 *
 * The start button keeps id `startButton` so existing selectors continue to
 * resolve it.
 */
export default function StartScreen({
  onStartGame,
  visible = true,
  className = '',
  mode = 'abberant',
  onModeChange
}: StartScreenProps) {
  if (!visible) {
    return null
  }

  return (
    <div
      id="startScreen"
      className={`${menuStyles.menuScreen} ${menuStyles.startScreen} ${className}`.trim()}
    >
      <div className={menuStyles.menuBackground} />

      <div className={menuStyles.menuContent}>
        <div className={menuStyles.titleContainer}>
          <span className={menuStyles.titleGlow} aria-hidden="true" />
          <h1 className={menuStyles.gameTitle}>ABBERANT</h1>
        </div>

        {/* Mode picker. Plain class names, styled in globals.css alongside the
            other #startScreen rules, which outrank CSS Module classes here. */}
        {onModeChange && (
          <div className="mode-picker" role="group" aria-label="Game mode">
            {MODE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="mode-option"
                aria-pressed={option.id === mode}
                onClick={() => onModeChange(option.id)}
              >
                <span className="mode-label">{option.label}</span>
                <span className="mode-tagline">{option.tagline}</span>
              </button>
            ))}
          </div>
        )}

        <div className={menuStyles.menuButtons}>
          <button
            id="startButton"
            type="button"
            className={menuStyles.menuButton}
            aria-label="Start the game"
            onClick={onStartGame}
          >
            <span className={menuStyles.buttonText}>START GAME</span>
            <span className={menuStyles.buttonGlow} aria-hidden="true" />
          </button>
        </div>

        <div className={menuStyles.controlsInfo}>
          <section className={menuStyles.controlsSection}>
            <h3>CONTROLS</h3>
            <div className={menuStyles.controlGrid}>
              {CONTROL_MAPPINGS[mode].map(({ key, action }) => (
                <div key={key} className={menuStyles.controlItem}>
                  <span className={menuStyles.key}>{key}</span>
                  <span className={menuStyles.action}>{action}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
