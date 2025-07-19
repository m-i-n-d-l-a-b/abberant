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
  onRestart,
  visible = true,
  className = ''
}: GameOverScreenProps) {
  if (!visible) {
    return null
  }

  return (
    <div id="gameOverScreen" className={`${menuStyles.menuScreen} ${menuStyles.gameOverScreen} ${className}`}>
      <div className={menuStyles.menuBackground}></div>
      <div className={menuStyles.menuContent}>
        <div className={menuStyles.titleContainer}>
          <h2 className={`${menuStyles.gameTitle} ${menuStyles.gameOverTitle}`}>GAME OVER</h2>
          <div className={menuStyles.titleGlow}></div>
        </div>
        
        <div className={menuStyles.scoreDisplay}>
          <div className={menuStyles.finalScore}>
            <span className={menuStyles.scoreLabel}>FINAL SCORE</span>
            <span id="finalScore" data-testid="finalScore" className={menuStyles.scoreValue}>{finalScore}</span>
          </div>
        </div>
        
        <div className={menuStyles.menuButtons}>
          <button 
            className={`${menuStyles.menuButton} ${menuStyles.primaryButton}`}
            onClick={onRestart}
            aria-label="Play again"
          >
            <span className={menuStyles.buttonText}>PLAY AGAIN</span>
            <div className={menuStyles.buttonGlow}></div>
          </button>
        </div>
      </div>


    </div>
  )
} 