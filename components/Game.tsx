'use client'

import { useRef, useState } from 'react'
import MobileControls from './MobileControls'
import GameUI from './GameUI'
import StartScreen from './StartScreen'
import GameOverScreen from './GameOverScreen'
import PauseScreen from './PauseScreen'
import EffectsLab from './EffectsLab'
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
  const { gameState, gameHandlers, gameRef } = useGame(canvasRef)
  const [isEffectsLabOpen, setIsEffectsLabOpen] = useState(false)

  const handleOpenEffectsLab = () => {
    setIsEffectsLabOpen(true)
  }

  const handleCloseEffectsLab = () => {
    setIsEffectsLabOpen(false)
  }

  const handleApplyEffects = (effects: any) => {
    if (gameRef.current) {
      // Save current settings to activeCustomEffects
      gameRef.current.activeCustomEffects = JSON.parse(JSON.stringify(effects))
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeCustomEffects', JSON.stringify(effects))
      }
    }
  }

  const handleResetToDefault = () => {
    if (gameRef.current) {
      gameRef.current.resetEffectsLabToLevelDefault?.()
    }
  }

  const handleClearAllEffects = () => {
    if (gameRef.current) {
      // Clear all custom effects
      gameRef.current.activeCustomEffects = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('activeCustomEffects')
      }
    }
  }

  return (
    <div id="gameContainer" style={{
      position: 'relative',
      width: '800px',
      height: '600px',
      margin: '0 auto',
      fontFamily: 'Courier New, monospace',
      overflow: 'hidden',
      background: '#000011'
    }}>
      <canvas 
        ref={canvasRef} 
        id="gameCanvas" 
        width="800" 
        height="600" 
        style={{
          display: 'block',
          border: '2px solid #00ffff',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
          background: 'linear-gradient(to bottom, #000033, #000011)'
        }}
      ></canvas>

      {/* Game UI - only show when playing */}
      {gameState.gameScreen === GameScreen.PLAYING && (
        <GameUI
          lives={gameState.lives}
          score={gameState.score}
          level={gameState.level}
          combo={gameState.combo}
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
        bestCombo={gameState.bestCombo}
        onRestart={gameHandlers.handleRestart}
        visible={gameState.gameScreen === GameScreen.GAME_OVER}
      />

      {/* Pause Screen */}
      <PauseScreen
        onResume={gameHandlers.handleResume}
        visible={gameState.gameScreen === GameScreen.PAUSED}
        onOpenEffectsLab={handleOpenEffectsLab}
      />

      {/* Effects Lab */}
      <EffectsLab
        isOpen={isEffectsLabOpen}
        onClose={handleCloseEffectsLab}
        onApplyEffects={handleApplyEffects}
        onResetToDefault={handleResetToDefault}
        onClearAllEffects={handleClearAllEffects}
        gameRef={gameRef}
      />

      {/* Mobile Controls - only show when playing */}
      {gameState.gameScreen === GameScreen.PLAYING && <MobileControls />}
    </div>
  )
}