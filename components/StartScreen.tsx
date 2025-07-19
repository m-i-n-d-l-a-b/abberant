/**
 * StartScreen Component
 * 
 * Displays the game start screen with title, start button, and controls information.
 * Extracted from the main Game component for better modularity.
 */

import React from 'react'

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

      <style jsx>{`
        .start-screen {
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

        .controls-info {
          margin-top: 30px;
        }

        .controls-section h3 {
          color: #00ffff;
          margin-bottom: 20px;
          font-size: 20px;
        }

        .control-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          max-width: 300px;
          margin: 0 auto;
        }

        .control-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid #00ffff;
        }

        .key {
          background: #00ffff;
          color: #000;
          padding: 5px 10px;
          font-weight: bold;
          font-size: 12px;
        }

        .action {
          color: #ffffff;
          font-size: 14px;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .game-title {
            font-size: 36px;
          }

          .menu-button {
            padding: 12px 24px;
            font-size: 16px;
          }

          .control-grid {
            grid-template-columns: 1fr;
            max-width: 250px;
          }
        }

        @media (max-width: 480px) {
          .game-title {
            font-size: 28px;
            letter-spacing: 2px;
          }

          .menu-button {
            padding: 10px 20px;
            font-size: 14px;
          }

          .controls-section h3 {
            font-size: 16px;
          }

          .control-item {
            padding: 8px;
          }

          .key {
            font-size: 10px;
            padding: 4px 8px;
          }

          .action {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  )
} 