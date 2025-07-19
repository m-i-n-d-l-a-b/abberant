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
  soundEnabled,
  onSoundToggle,
  className = ''
}: GameUIProps) {
  return (
    <>
      {/* Game UI */}
      <div id="ui" className={`${uiStyles.gameUi} ${className}`}>
        <div className={uiStyles.uiItem}>
          <span className={uiStyles.uiLabel}>LIVES</span>
          <span id="lives" data-testid="lives" className={uiStyles.uiValue}>{lives}</span>
        </div>
        <div className={uiStyles.uiItem}>
          <span className={uiStyles.uiLabel}>SCORE</span>
          <span id="score" data-testid="score" className={uiStyles.uiValue}>{score}</span>
        </div>
        <div className={uiStyles.uiItem}>
          <span className={uiStyles.uiLabel}>LEVEL</span>
          <span id="level" data-testid="level" className={uiStyles.uiValue}>{level}</span>
        </div>
      </div>

      {/* Sound Toggle */}
      <button 
        id="soundToggle" 
        className={`${uiStyles.soundToggle} ${soundEnabled ? uiStyles.soundOn : uiStyles.soundOff}`}
        onClick={onSoundToggle}
        aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
      >
        {soundEnabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF'}
      </button>
    </>
  )
} 