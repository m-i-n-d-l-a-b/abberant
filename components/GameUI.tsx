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
      <div id="ui" style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: '#00ffff',
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        textShadow: '0 0 10px #00ffff',
        zIndex: 10
      }}>
        <div>Lives: <span id="lives">{lives}</span></div>
        <div>Score: <span id="score">{score}</span></div>
        <div>Level: <span id="level">{level}</span></div>
        <div>Combo: <span id="combo">{combo}</span></div>
      </div>

      {/* Sound Toggle */}
      <button 
        id="soundToggle" 
        onClick={onSoundToggle}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #00ffff',
          color: '#00ffff',
          padding: '10px 20px',
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 255, 255, 0.2)'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF'}
      </button>
    </>
  )
} 