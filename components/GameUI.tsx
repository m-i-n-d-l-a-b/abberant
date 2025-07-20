/**
 * GameUI Component
 * 
 * Displays the main game interface elements including score, lives, level, and sound toggle.
 * Extracted from the main Game component for better modularity.
 */

import React from 'react'

// Import CSS Modules
import styles from '../styles/common.module.css'
import uiStyles from '../styles/ui.module.css'

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
  return (
    <>
      {/* Game UI */}
      <div id="ui" className={uiStyles.gameUi}>
        <div className={uiStyles.uiItem}>
          <span className={uiStyles.uiLabel}>Lives</span>
          <span id="lives" className={uiStyles.uiValue}>{lives}</span>
        </div>
        <div className={uiStyles.uiItem}>
          <span className={uiStyles.uiLabel}>Score</span>
          <span id="score" className={uiStyles.uiValue}>{score}</span>
        </div>
        <div className={uiStyles.uiItem}>
          <span className={uiStyles.uiLabel}>Level</span>
          <span id="level" className={uiStyles.uiValue}>{level}</span>
        </div>
        <div className={uiStyles.uiItem}>
          <span className={uiStyles.uiLabel}>Combo</span>
          <span id="combo" className={uiStyles.uiValue}>{combo}</span>
        </div>
      </div>

      {/* Sound Toggle */}
      <button 
        id="soundToggle" 
        onClick={onSoundToggle}
        className={`${uiStyles.soundToggle} ${soundEnabled ? uiStyles.soundOn : uiStyles.soundOff}`}
      >
        {soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF'}
      </button>
    </>
  )
} 