/**
 * GameOverScreen Component
 * 
 * Displays the game over screen with final score and restart functionality.
 * Extracted from the main Game component for better modularity.
 */

import React from 'react'

/**
 * Props interface for GameOverScreen component
 */
export interface GameOverScreenProps {
  /** Final score to display */
  finalScore: number
  /** Callback function for restarting the game */
  onRestart: () => void
  /** Whether the game over screen is visible */
  visible?: boolean
  /** Optional CSS class name for styling */
  className?: string
}

/**
 * GameOverScreen Component
 * 
 * Renders the game over screen with cyberpunk styling and animations.
 */
export default function GameOverScreen({
  finalScore,
  onRestart,
  visible = true,
  className = ''
}: GameOverScreenProps) {
  if (!visible) {
    return null
  }

  return (
    <div id="gameOverScreen" className={`menu-screen game-over-screen ${className}`}>
      <div className="menu-background"></div>
      <div className="menu-content">
        <div className="title-container">
          <h2 className="game-title">GAME OVER</h2>
          <div className="title-glow"></div>
        </div>
        
        <div className="score-display">
          <div className="final-score">
            <span className="score-label">FINAL SCORE</span>
            <span id="finalScore" data-testid="finalScore" className="score-value">{finalScore}</span>
          </div>
        </div>
        
        <div className="menu-buttons">
          <button 
            className="menu-button primary-button"
            onClick={onRestart}
            aria-label="Play again"
          >
            <span className="button-text">PLAY AGAIN</span>
            <div className="button-glow"></div>
          </button>
        </div>
      </div>

      <style jsx>{`
        .game-over-screen {
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

        .score-display {
          margin-bottom: 40px;
        }

        .final-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .score-label {
          font-size: 16px;
          color: #00ffff;
        }

        .score-value {
          font-size: 36px;
          color: #ffffff;
          text-shadow: 0 0 20px #ffffff;
        }

        .menu-buttons {
          margin-bottom: 40px;
        }

        .menu-button {
          background: rgba(0, 0, 0, 0.8);
          border: 2px solid #00ffff;
          color: #00ffff;
          padding: 15px 30px;
          font-family: 'Courier New', monospace;
          font-size: 18px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          margin: 10px;
        }

        .menu-button:hover {
          background: rgba(0, 255, 255, 0.2);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }

        .menu-button:focus {
          outline: none;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }

        .button-text {
          position: relative;
          z-index: 2;
        }

        .button-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }

        .menu-button:hover .button-glow {
          left: 100%;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .game-title {
            font-size: 36px;
          }

          .score-value {
            font-size: 28px;
          }

          .menu-button {
            padding: 12px 24px;
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .game-title {
            font-size: 28px;
            letter-spacing: 2px;
          }

          .score-value {
            font-size: 24px;
          }

          .score-label {
            font-size: 14px;
          }

          .menu-button {
            padding: 10px 20px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
} 