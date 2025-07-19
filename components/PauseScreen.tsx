/**
 * PauseScreen Component
 * 
 * Displays the game pause screen with resume functionality and controls reminder.
 * Extracted from the main Game component for better modularity.
 */

import React from 'react'

// Import CSS files
import '../styles/common.css'
import '../styles/menu.css'

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
}

/**
 * PauseScreen Component
 * 
 * Renders the game pause screen with cyberpunk styling and animations.
 */
export default function PauseScreen({
  onResume,
  visible = true,
  className = ''
}: PauseScreenProps) {
  if (!visible) {
    return null
  }

  return (
    <div id="pauseScreen" className={`menu-screen pause-screen ${className}`}>
      <div className="menu-background"></div>
      <div className="menu-content">
        <div className="title-container">
          <h2 className="game-title pause-title">PAUSED</h2>
          <div className="title-glow"></div>
        </div>
        
        <div className="pause-message">
          <p>Press <span className="key-highlight">P</span> to continue</p>
        </div>
      </div>

    </div>
  )
} 