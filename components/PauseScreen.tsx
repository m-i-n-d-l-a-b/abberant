/**
 * PauseScreen Component
 *
 * Displays the game pause screen with resume functionality and a controls
 * reminder. Extracted from the main Game component for better modularity.
 */

import React from 'react'

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
 *
 * Kebab-case class names sit alongside the hashed CSS Module classes as stable
 * selector hooks, matching the convention in GameOverScreen.
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
    <div
      id="pauseScreen"
      className={`${menuStyles.pauseScreen} pause-screen ${className}`.trim()}
    >
      <div className={`${menuStyles.menuScreen} menu-screen`}>
        <div className={`${menuStyles.menuBackground} menu-background`} />

        <div className={`${menuStyles.menuContent} menu-content`}>
          <div className={`${menuStyles.titleContainer} title-container`}>
            <h2 className={`${menuStyles.pauseTitle} title-glow`}>PAUSED</h2>
          </div>

          <p className={`${menuStyles.pauseMessage} pause-message`}>
            Press <span className="key-highlight">P</span> to continue
          </p>

          <div className={`${menuStyles.menuButtons} menu-buttons`}>
            <button
              id="resumeButton"
              type="button"
              className={`${menuStyles.menuButton} menu-button`}
              aria-label="Resume the game"
              onClick={onResume}
            >
              <span className="button-text">RESUME</span>
            </button>

            {onOpenEffectsLab && (
              <button
                id="effectsLabButton"
                type="button"
                className={`${menuStyles.effectsLabButton} menu-button`}
                aria-label="Open the Effects Lab"
                onClick={onOpenEffectsLab}
              >
                <span className="button-text">EFFECTS LAB</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
