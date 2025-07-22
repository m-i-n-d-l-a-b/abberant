/**
 * GameOverScreen Component
 * 
 * Displays the game over screen with final score and restart functionality.
 * Extracted from the main Game component for better modularity.
 */

import React from 'react'

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
    <div id="gameOverScreen">
      <h2>Game Over!</h2>
      <p>Final Score: <span id="finalScore">{finalScore}</span></p>
      <p>Best Combo: <span id="bestCombo">{bestCombo}</span></p>
      <button onClick={onRestart}>
        Play Again
      </button>
    </div>
  )
} 