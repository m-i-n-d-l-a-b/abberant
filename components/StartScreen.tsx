/**
 * StartScreen Component
 * 
 * Displays the game start screen with title, start button, and controls information.
 * Extracted from the main Game component for better modularity.
 */

import React from 'react'

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
}

/**
 * StartScreen Component
 * 
 * Renders the game start screen with cyberpunk styling and animations.
 */
export default function StartScreen({
  onStartGame,
  visible = true,
  className = ''
}: StartScreenProps) {
  if (!visible) {
    return null
  }

  return (
    <div id="startScreen">
      <h1>Abberant</h1>
      <button 
        id="startButton" 
        onClick={onStartGame}
      >
        Start Game
      </button>
      <div id="controls">
        WASD/Arrow Keys: Move | Space: Jump | Shift: Dash | P: Pause | R: Reset
      </div>
    </div>
  )
} 