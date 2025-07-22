/**
 * GameUI Component
 * 
 * Displays the main game interface elements including score, lives, level, and sound toggle.
 * Extracted from the main Game component for better modularity.
 */

import React from 'react'

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
      <div id="ui">
        <div>Lives: <span id="lives">{lives}</span></div>
        <div>Score: <span id="score">{score}</span></div>
        <div>Level: <span id="level">{level}</span></div>
        <div>Combo: <span id="combo">{combo}</span></div>
      </div>

      {/* Sound Toggle */}
      <button 
        id="soundToggle" 
        onClick={onSoundToggle}
      >
        {soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF'}
      </button>
    </>
  )
} 