'use client'

import { useRef } from 'react'
import MobileControls from './MobileControls'
import GameUI from './GameUI'
import StartScreen from './StartScreen'
import GameOverScreen from './GameOverScreen'
import PauseScreen from './PauseScreen'
import { useGame, GameScreen } from '../hooks/useGame'

// Import CSS Modules
import styles from '../styles/common.module.css'
import gameStyles from '../styles/game.module.css'

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
    <div id="gameContainer" className={gameStyles.gameContainer}>
      <canvas ref={canvasRef} id="gameCanvas" width="800" height="600" className={gameStyles.gameCanvas}></canvas>

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
    </div>
  )
}