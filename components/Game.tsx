'use client'

import { useEffect, useRef } from 'react'
import { GameEngine } from '../lib/game/GameEngine'

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameEngine | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    gameRef.current = new GameEngine(canvasRef.current)

    // Cleanup function
    return () => {
      if (gameRef.current) {
        // Clean up animation frame
        if (gameRef.current.animationFrameId) {
          cancelAnimationFrame(gameRef.current.animationFrameId)
        }
        // Clean up BGM timeout
        if (gameRef.current.bgmTimeoutId) {
          clearTimeout(gameRef.current.bgmTimeoutId)
        }
        // Clean up event listeners
        gameRef.current.cleanup()
      }
    }
  }, [])

  return (
    <div id="gameContainer">
      <canvas ref={canvasRef} id="gameCanvas" width="800" height="600"></canvas>

      {/* Game UI */}
      <div id="ui">
        <div className="ui-item">
          <span className="ui-label">LIVES</span>
          <span id="lives" className="ui-value">3</span>
        </div>
        <div className="ui-item">
          <span className="ui-label">SCORE</span>
          <span id="score" className="ui-value">0</span>
        </div>
        <div className="ui-item">
          <span className="ui-label">LEVEL</span>
          <span id="level" className="ui-value">1</span>
        </div>
      </div>

      <button id="soundToggle" className="sound-toggle">🔊 SOUND: ON</button>

      {/* Start Screen */}
      <div id="startScreen" className="menu-screen">
        <div className="menu-background"></div>
        <div className="menu-content">
          <div className="title-container">
            <h1 className="game-title">ABBERANT</h1>
            <div className="title-glow"></div>
          </div>
          
          <div className="menu-buttons">
            <button id="startButton" className="menu-button primary-button">
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

      {/* Game Over Screen */}
      <div id="gameOverScreen" className="menu-screen">
        <div className="menu-background"></div>
        <div className="menu-content">
          <div className="title-container">
            <h2 className="game-title">GAME OVER</h2>
            <div className="title-glow"></div>
          </div>
          
          <div className="score-display">
            <div className="final-score">
              <span className="score-label">FINAL SCORE</span>
              <span id="finalScore" className="score-value">0</span>
            </div>
          </div>
          
          <div className="menu-buttons">
            <button onClick={() => gameRef.current?.restart()} className="menu-button primary-button">
              <span className="button-text">PLAY AGAIN</span>
              <div className="button-glow"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Pause Screen */}
      <div id="pauseScreen" className="menu-screen">
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
      </div>

      {/* Mobile Controls */}
      <div id="mobileControls" className="mobile-controls">
        <div className="dpad">
          <div className="dpad-center"></div>
          <div className="mobile-button dpad-up" data-action="up">↑</div>
          <div className="mobile-button dpad-down" data-action="down">↓</div>
          <div className="mobile-button dpad-left" data-action="left">←</div>
          <div className="mobile-button dpad-right" data-action="right">→</div>
        </div>

        <div className="action-buttons">
          <div className="mobile-button jump-button" data-action="jump">JUMP</div>
          <div className="mobile-button dash-button" data-action="dash">DASH</div>
          <div className="mobile-button pause-button" data-action="pause">⏸</div>
        </div>
      </div>

      <style jsx>{`
        #gameContainer {
          position: relative;
          width: 800px;
          height: 600px;
          margin: 0 auto;
          font-family: 'Courier New', monospace;
          overflow: hidden;
        }

        #gameCanvas {
          display: block;
          border: 2px solid #00ffff;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }

        /* Game UI */
        #ui {
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

        /* Menu Screens */
        .menu-screen {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: none;
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

        .pause-message {
          font-size: 18px;
          color: #ffffff;
        }

        .key-highlight {
          color: #00ffff;
          font-weight: bold;
        }

        /* Mobile Controls */
        .mobile-controls {
          position: absolute;
          bottom: 20px;
          left: 20px;
          display: none;
          z-index: 15;
        }

        .dpad {
          position: relative;
          width: 120px;
          height: 120px;
          margin-bottom: 20px;
        }

        .dpad-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: rgba(0, 255, 255, 0.3);
          border: 2px solid #00ffff;
        }

        .mobile-button {
          position: absolute;
          width: 40px;
          height: 40px;
          background: rgba(0, 0, 0, 0.8);
          border: 2px solid #00ffff;
          color: #00ffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
        }

        .mobile-button:active {
          background: rgba(0, 255, 255, 0.3);
        }

        .dpad-up { top: 0; left: 50%; transform: translateX(-50%); }
        .dpad-down { bottom: 0; left: 50%; transform: translateX(-50%); }
        .dpad-left { left: 0; top: 50%; transform: translateY(-50%); }
        .dpad-right { right: 0; top: 50%; transform: translateY(-50%); }

        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .jump-button, .dash-button, .pause-button {
          position: static;
          width: 60px;
          height: 40px;
          font-size: 12px;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          #gameContainer {
            width: 100%;
            height: 100vh;
          }

          #gameCanvas {
            width: 100%;
            height: 100%;
          }

          .mobile-controls {
            display: block;
          }
        }
      `}</style>
    </div>
  )
}