/**
 * GameUI Component
 *
 * Displays the main game interface elements including score, lives, level,
 * combo, and the sound toggle. Extracted from the main Game component for
 * better modularity.
 */

import React from 'react'

import styles from '../styles/ui.module.css'

/**
 * Props interface for GameUI component
 */
export interface GameUIProps {
  /** Current player lives */
  lives: number
  /** Current game score */
  score: number
  /** Current level */
  level: number
  /** Current combo */
  combo: number
  /** Whether sound is enabled */
  soundEnabled: boolean
  /** Callback function for toggling sound */
  onSoundToggle: () => void
  /** Optional CSS class name for styling */
  className?: string
}

/**
 * GameUI Component
 *
 * Renders the main game interface elements with cyberpunk styling.
 *
 * Each stat keeps its element id (`lives`, `score`, `level`, `combo`) because
 * GameEngine.updateUI() addresses these nodes directly via getElementById.
 */
export default function GameUI({
  lives,
  score,
  level,
  combo,
  soundEnabled,
  onSoundToggle,
  className = ''
}: GameUIProps) {
  const stats = [
    { id: 'lives', label: 'LIVES', value: lives },
    { id: 'score', label: 'SCORE', value: score },
    { id: 'level', label: 'LEVEL', value: level },
    { id: 'combo', label: 'COMBO', value: combo }
  ]

  return (
    <>
      {/* Game UI */}
      <div id="ui" className={`${styles.gameUi} game-ui ${className}`.trim()}>
        {stats.map(({ id, label, value }) => (
          <div key={id} className={`${styles.uiItem} ui-item`}>
            <span className={`${styles.uiLabel} ui-label`}>{label}</span>
            <span
              id={id}
              data-testid={id}
              className={`${styles.uiValue} ui-value`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Sound Toggle */}
      <button
        id="soundToggle"
        type="button"
        className={`${styles.soundToggle} sound-toggle ${
          soundEnabled ? styles.soundOn : styles.soundOff
        }`}
        aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
        aria-pressed={soundEnabled}
        onClick={onSoundToggle}
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
    </>
  )
}
