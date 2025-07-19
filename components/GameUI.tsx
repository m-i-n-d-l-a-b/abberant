/**
 * GameUI Component
 * 
 * Displays the main game interface elements including score, lives, level, and sound toggle.
 * Extracted from the main Game component for better modularity.
 */

import React from 'react'

// Import CSS files
import '../styles/common.css'
import '../styles/ui.css'

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
      <div id="ui" className={`game-ui ${className}`}>
        <div className="ui-item">
          <span className="ui-label">LIVES</span>
          <span id="lives" data-testid="lives" className="ui-value">{lives}</span>
        </div>
        <div className="ui-item">
          <span className="ui-label">SCORE</span>
          <span id="score" data-testid="score" className="ui-value">{score}</span>
        </div>
        <div className="ui-item">
          <span className="ui-label">LEVEL</span>
          <span id="level" data-testid="level" className="ui-value">{level}</span>
        </div>
      </div>

      {/* Sound Toggle */}
      <button 
        id="soundToggle" 
        className={`sound-toggle ${soundEnabled ? 'sound-on' : 'sound-off'}`}
        onClick={onSoundToggle}
        aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
      >
        {soundEnabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF'}
      </button>
    </>
  )
} 