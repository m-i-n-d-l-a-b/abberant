/**
 * GameOverScreen Component
 * 
 * Displays the game over screen with final score and restart functionality.
 * Extracted from the main Game component for better modularity.
 */

import React from 'react'

// Import CSS files
import '../styles/common.css'
import '../styles/menu.css'

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
    <div id="gameOverScreen" className={`menu-screen game-over-screen ${className}`}>
      <div className="menu-background"></div>
      <div className="menu-content">
        <div className="title-container">
          <h2 className="game-title game-over-title">GAME OVER</h2>
          <div className="title-glow"></div>
        </div>
        
        <div className="score-display">
          <div className="final-score">
            <span className="score-label">FINAL SCORE</span>
            <span id="finalScore" data-testid="finalScore" className="score-value">{finalScore}</span>
          </div>
        </div>
        
        <div className="menu-buttons">
          <button 
            className="menu-button primary-button"
            onClick={onRestart}
            aria-label="Play again"
          >
            <span className="button-text">PLAY AGAIN</span>
            <div className="button-glow"></div>
          </button>
        </div>
      </div>


    </div>
  )
} 