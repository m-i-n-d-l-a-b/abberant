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
  soundEnabled,
  onSoundToggle,
  className = ''
}: GameUIProps) {
  return (
    <>
      {/* Game UI */}
      <div id="ui" className={`game-ui ${className}`}>
        <div className="ui-item">
          <span className="ui-label">LIVES</span>
          <span id="lives" data-testid="lives" className="ui-value">{lives}</span>
        </div>
        <div className="ui-item">
          <span className="ui-label">SCORE</span>
          <span id="score" data-testid="score" className="ui-value">{score}</span>
        </div>
        <div className="ui-item">
          <span className="ui-label">LEVEL</span>
          <span id="level" data-testid="level" className="ui-value">{level}</span>
        </div>
      </div>

      {/* Sound Toggle */}
      <button 
        id="soundToggle" 
        className="sound-toggle"
        onClick={onSoundToggle}
        aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
      >
        {soundEnabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF'}
      </button>

      <style jsx>{`
        /* Game UI */
        .game-ui {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          gap: 30px;
          z-index: 10;
        }

        .ui-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .ui-label {
          font-size: 12px;
          color: #00ffff;
          text-shadow: 0 0 10px #00ffff;
          font-weight: bold;
          letter-spacing: 2px;
        }

        .ui-value {
          font-size: 24px;
          color: #ffffff;
          text-shadow: 0 0 15px #ffffff;
          font-weight: bold;
        }

        /* Sound Toggle */
        .sound-toggle {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          border: 2px solid #00ffff;
          color: #00ffff;
          padding: 10px 15px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          cursor: pointer;
          z-index: 10;
          transition: all 0.3s ease;
        }

        .sound-toggle:hover {
          background: rgba(0, 255, 255, 0.2);
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
        }

        .sound-toggle:focus {
          outline: none;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .game-ui {
            top: 10px;
            left: 10px;
            gap: 20px;
          }

          .ui-label {
            font-size: 10px;
          }

          .ui-value {
            font-size: 20px;
          }

          .sound-toggle {
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .game-ui {
            flex-direction: column;
            gap: 10px;
          }

          .ui-item {
            flex-direction: row;
            gap: 10px;
          }

          .ui-label {
            font-size: 9px;
          }

          .ui-value {
            font-size: 18px;
          }
        }
      `}</style>
    </>
  )
} 