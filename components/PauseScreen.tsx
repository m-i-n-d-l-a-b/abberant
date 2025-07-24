/**
 * PauseScreen Component
 * 
 * Displays the game pause screen with resume functionality and controls reminder.
 * Extracted from the main Game component for better modularity.
 */

import React from 'react'

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
    <div id="pauseScreen" className={className}>
      <h2>Paused</h2>
      <p>Press P to continue</p>
      <button id="resumeButton" onClick={onResume}>
        Resume
      </button>
      {onOpenEffectsLab && (
        <button 
          id="effectsLabButton" 
          onClick={onOpenEffectsLab}
        >
          Effects Lab
        </button>
      )}
    </div>
  )
} 