/**
 * GameOverScreen Component
 * 
 * Displays the game over screen with final score and restart functionality.
 * Extracted from the main Game component for better modularity.
 */

import React from 'react'

// Import CSS Modules
import styles from '../styles/common.module.css'
import menuStyles from '../styles/menu.module.css'

/**
 * Props interface for GameOverScreen component
 */
export interface GameOverScreenProps {
  /** Final score to display */
  finalScore: number
  /** Best combo to display */
  bestCombo: number
  /** Callback function for restarting the game */
  onRestart: () => void
  /** Whether the game over screen is visible */
  visible?: boolean
  /** Optional CSS class name for styling */
  className?: string
}

/**
 * GameOverScreen Component
 * 
 * Renders the game over screen with cyberpunk styling and animations.
 */
export default function GameOverScreen({
  finalScore,
  bestCombo,
  onRestart,
  visible = true,
  className = ''
}: GameOverScreenProps) {
  if (!visible) {
    return null
  }

  return (
    <div id="gameOverScreen" className={menuStyles.gameOverScreen}>
      <h2 className={menuStyles.gameOverTitle}>Game Over!</h2>
      <p className={menuStyles.finalScore}>
        Final Score: <span id="finalScore">{finalScore}</span>
      </p>
      <p className={menuStyles.bestCombo}>
        Best Combo: <span id="bestCombo">{bestCombo}</span>
      </p>
      <button 
        onClick={onRestart}
        className={menuStyles.restartButton}
      >
        Play Again
      </button>
    </div>
  )
} 