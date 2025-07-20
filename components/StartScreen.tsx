/**
 * StartScreen Component
 * 
 * Displays the game start screen with title, start button, and controls information.
 * Extracted from the main Game component for better modularity.
 */

import React from 'react'

// Import CSS Modules
import styles from '../styles/common.module.css'
import menuStyles from '../styles/menu.module.css'

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
    <div id="startScreen" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: '#00ffff',
      fontFamily: 'Courier New, monospace',
      zIndex: 20
    }}>
      <h1 style={{
        fontSize: '48px',
        marginBottom: '40px',
        textShadow: '0 0 30px #00ffff',
        letterSpacing: '4px'
      }}>Abberant</h1>
      <button 
        id="startButton" 
        onClick={onStartGame}
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #00ffff',
          color: '#00ffff',
          padding: '15px 30px',
          fontFamily: 'Courier New, monospace',
          fontSize: '18px',
          cursor: 'pointer',
          marginBottom: '30px',
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
        Start Game
      </button>
      <div id="controls" style={{
        fontSize: '14px',
        textAlign: 'center',
        opacity: 0.8,
        lineHeight: '1.5'
      }}>
        WASD/Arrow Keys: Move | Space: Jump | Shift: Dash | P: Pause | R: Reset
      </div>
    </div>
  )
} 