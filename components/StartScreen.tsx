/**
 * StartScreen Component
 * 
 * Displays the game start screen with title, start button, and controls information.
 * Extracted from the main Game component for better modularity.
 */

import React from 'react'

// Import CSS files
import '../styles/common.css'
import '../styles/menu.css'

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
    <div id="startScreen" className={`menu-screen start-screen ${className}`}>
      <div className="menu-background"></div>
      <div className="menu-content">
        <div className="title-container">
          <h1 className="game-title">ABBERANT</h1>
          <div className="title-glow"></div>
        </div>
        
        <div className="menu-buttons">
          <button 
            id="startButton" 
            className="menu-button primary-button"
            onClick={onStartGame}
            aria-label="Start the game"
          >
            <span className="button-text">START GAME</span>
            <div className="button-glow"></div>
          </button>
        </div>
        
        <div className="controls-info">
          <div className="controls-section">
            <h3>CONTROLS</h3>
            <div className="control-grid">
              <div className="control-item">
                <span className="key">WASD</span>
                <span className="action">Move</span>
              </div>
              <div className="control-item">
                <span className="key">SPACE</span>
                <span className="action">Jump</span>
              </div>
              <div className="control-item">
                <span className="key">SHIFT</span>
                <span className="action">Dash</span>
              </div>
              <div className="control-item">
                <span className="key">P</span>
                <span className="action">Pause</span>
              </div>
              <div className="control-item">
                <span className="key">R</span>
                <span className="action">Reset</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 