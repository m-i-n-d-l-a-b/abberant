'use client'

import { useRef } from 'react'
import MobileControls from './MobileControls'
import GameUI from './GameUI'
import StartScreen from './StartScreen'
import GameOverScreen from './GameOverScreen'
import PauseScreen from './PauseScreen'
import { useGame, GameScreen } from '../hooks/useGame'

/**
 * Main Game Component
 * 
 * Orchestrates the game engine and UI components, managing the overall game flow.
 * Refactored to use modular components and custom hooks for better maintainability.
 */
export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { gameState, gameHandlers } = useGame(canvasRef)

  return (
    <div id="gameContainer">
      <canvas ref={canvasRef} id="gameCanvas" width="800" height="600"></canvas>

      {/* Game UI - only show when playing */}
      {gameState.gameScreen === GameScreen.PLAYING && (
        <GameUI
          lives={gameState.lives}
          score={gameState.score}
          level={gameState.level}
          soundEnabled={gameState.soundEnabled}
          onSoundToggle={gameHandlers.handleSoundToggle}
        />
      )}

      {/* Start Screen */}
      <StartScreen
        onStartGame={gameHandlers.handleStartGame}
        visible={gameState.gameScreen === GameScreen.START}
      />

      {/* Game Over Screen */}
      <GameOverScreen
        finalScore={gameState.finalScore}
        onRestart={gameHandlers.handleRestart}
        visible={gameState.gameScreen === GameScreen.GAME_OVER}
      />

      {/* Pause Screen */}
      <PauseScreen
        onResume={gameHandlers.handleResume}
        visible={gameState.gameScreen === GameScreen.PAUSED}
      />

      {/* Mobile Controls - only show when playing */}
      {gameState.gameScreen === GameScreen.PLAYING && <MobileControls />}

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
        }
      `}</style>
    </div>
  )
}