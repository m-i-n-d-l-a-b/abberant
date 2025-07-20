/**
 * PauseScreen Component
 * 
 * Displays the game pause screen with resume functionality and controls reminder.
 * Extracted from the main Game component for better modularity.
 */

import React from 'react'

// Import CSS Modules
import styles from '../styles/common.module.css'
import menuStyles from '../styles/menu.module.css'

/**
 * Props interface for PauseScreen component
 */
export interface PauseScreenProps {
  /** Callback function for resuming the game */
  onResume: () => void
  /** Whether the pause screen is visible */
  visible?: boolean
  /** Optional CSS class name for styling */
  className?: string
  /** Callback function for opening the Effects Lab */
  onOpenEffectsLab?: () => void
}

/**
 * PauseScreen Component
 * 
 * Renders the game pause screen with cyberpunk styling and animations.
 */
export default function PauseScreen({
  onResume,
  visible = true,
  className = '',
  onOpenEffectsLab
}: PauseScreenProps) {
  if (!visible) {
    return null
  }

  return (
    <div id="pauseScreen" style={{
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
      <h2 style={{
        fontSize: '36px',
        marginBottom: '20px',
        textShadow: '0 0 20px #00ffff'
      }}>Paused</h2>
      <p style={{ fontSize: '18px', marginBottom: '30px' }}>Press P to continue</p>
      {onOpenEffectsLab && (
        <button 
          id="effectsLabButton" 
          onClick={onOpenEffectsLab}
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid #00ffff',
            color: '#00ffff',
            padding: '15px 30px',
            fontFamily: 'Courier New, monospace',
            fontSize: '18px',
            cursor: 'pointer',
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
          Effects Lab
        </button>
      )}
    </div>
  )
} 