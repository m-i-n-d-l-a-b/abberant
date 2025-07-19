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
    <div id="pauseScreen" className={`${menuStyles.menuScreen} ${menuStyles.pauseScreen} ${className}`}>
      <div className={menuStyles.menuBackground}></div>
      <div className={menuStyles.menuContent}>
        <div className={menuStyles.titleContainer}>
          <h2 className={`${menuStyles.gameTitle} ${menuStyles.pauseTitle}`}>PAUSED</h2>
          <div className={menuStyles.titleGlow}></div>
        </div>
        
        <div className={menuStyles.pauseMessage}>
          <p>Press <span className={menuStyles.keyHighlight}>P</span> to continue</p>
        </div>
      </div>

    </div>
  )
} 