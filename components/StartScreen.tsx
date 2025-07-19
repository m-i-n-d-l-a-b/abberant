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
    <div id="startScreen" className={`${menuStyles.menuScreen} ${menuStyles.startScreen} ${className}`}>
      <div className={menuStyles.menuBackground}></div>
      <div className={menuStyles.menuContent}>
        <div className={menuStyles.titleContainer}>
          <h1 className={menuStyles.gameTitle}>ABBERANT</h1>
          <div className={menuStyles.titleGlow}></div>
        </div>
        
        <div className={menuStyles.menuButtons}>
          <button 
            id="startButton" 
            className={`${menuStyles.menuButton} ${menuStyles.primaryButton}`}
            onClick={onStartGame}
            aria-label="Start the game"
          >
            <span className={menuStyles.buttonText}>START GAME</span>
            <div className={menuStyles.buttonGlow}></div>
          </button>
        </div>
        
        <div className={menuStyles.controlsInfo}>
          <div className={menuStyles.controlsSection}>
            <h3>CONTROLS</h3>
            <div className={menuStyles.controlGrid}>
              <div className={menuStyles.controlItem}>
                <span className={menuStyles.key}>WASD</span>
                <span className={menuStyles.action}>Move</span>
              </div>
              <div className={menuStyles.controlItem}>
                <span className={menuStyles.key}>SPACE</span>
                <span className={menuStyles.action}>Jump</span>
              </div>
              <div className={menuStyles.controlItem}>
                <span className={menuStyles.key}>SHIFT</span>
                <span className={menuStyles.action}>Dash</span>
              </div>
              <div className={menuStyles.controlItem}>
                <span className={menuStyles.key}>P</span>
                <span className={menuStyles.action}>Pause</span>
              </div>
              <div className={menuStyles.controlItem}>
                <span className={menuStyles.key}>R</span>
                <span className={menuStyles.action}>Reset</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 