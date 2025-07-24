/**
 * GameOverScreen Component
 * 
 * Displays the game over screen with final score and restart functionality.
 * Extracted from the main Game component for better modularity.
 */

import React from 'react'
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
    <div className={`${menuStyles.gameOverScreen} game-over-screen ${className}`}>
      <div className="menu-screen">
        <div className="menu-background" />
        <div className="menu-content">
          <div className="title-container">
            <h2 className={`${menuStyles.gameOverTitle} title-glow`}>GAME OVER</h2>
          </div>
          <div className="score-display">
            <p className="score-label">FINAL SCORE</p>
            <p className="final-score">
              <span data-testid="finalScore" id="finalScore" className="score-value">{finalScore}</span>
            </p>
          </div>
          <div className="menu-buttons">
            <button className={`${menuStyles.restartButton} menu-button`} onClick={onRestart}>
              <span className="button-text">PLAY AGAIN</span>
              <span className="button-glow" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}