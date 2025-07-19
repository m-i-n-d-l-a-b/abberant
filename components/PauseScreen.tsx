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
          <h2 className="game-title">PAUSED</h2>
          <div className="title-glow"></div>
        </div>
        
        <div className="pause-message">
          <p>Press <span className="key-highlight">P</span> to continue</p>
        </div>
      </div>

      <style jsx>{`
        .pause-screen {
          display: flex;
        }

        /* Menu Screens */
        .menu-screen {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          justify-content: center;
          align-items: center;
          z-index: 20;
        }

        .menu-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
        }

        .menu-content {
          position: relative;
          text-align: center;
          color: #ffffff;
          z-index: 21;
        }

        .title-container {
          margin-bottom: 40px;
          position: relative;
        }

        .game-title {
          font-size: 48px;
          color: #00ffff;
          text-shadow: 0 0 30px #00ffff;
          margin: 0;
          font-weight: bold;
          letter-spacing: 4px;
        }

        .title-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(0, 255, 255, 0.3) 0%, transparent 70%);
          animation: pulse 2s ease-in-out infinite alternate;
        }

        @keyframes pulse {
          0% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }

        .pause-message {
          font-size: 18px;
          color: #ffffff;
        }

        .key-highlight {
          color: #00ffff;
          font-weight: bold;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .game-title {
            font-size: 36px;
          }

          .pause-message {
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .game-title {
            font-size: 28px;
            letter-spacing: 2px;
          }

          .pause-message {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
} 