'use client'

import { useRef, useState } from 'react'
import MobileControls from './MobileControls'
import GameUI from './GameUI'
import StartScreen from './StartScreen'
import GameOverScreen from './GameOverScreen'
import PauseScreen from './PauseScreen'
import EffectsLab from './EffectsLab'
import { useGame, GameScreen } from '../hooks/useGame'
import { GameMode } from '../lib/game/ArcadeEngine'
import { GameEngine } from '../lib/game/GameEngine'

/**
 * Main Game Component
 *
 * Orchestrates the game engine and UI components, managing the overall game flow.
 * Refactored to use modular components and custom hooks for better maintainability.
 *
 * Mode is owned here rather than in the hook, because it is only switchable
 * from the start screen and switching it rebuilds the engine.
 */
export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<GameMode>('abberant')
  const { gameState, gameHandlers, gameRef } = useGame(canvasRef, mode)
  const [isEffectsLabOpen, setIsEffectsLabOpen] = useState(false)

  // The Effects Lab drives the side-scroller's canvas effects directly, so it
  // is only offered in that mode. The instanceof narrowing below happens in the
  // handlers rather than during render, where reading a ref is not safe.
  const isPlatformer = mode === 'abberant'

  const platformerEngine = (): GameEngine | null =>
    gameRef.current instanceof GameEngine ? gameRef.current : null

  const handleOpenEffectsLab = () => {
    setIsEffectsLabOpen(true)
  }

  const handleCloseEffectsLab = () => {
    setIsEffectsLabOpen(false)
  }

  const handleApplyEffects = (effects: any) => {
    const engine = platformerEngine()
    if (!engine) return
    // Save current settings to activeCustomEffects
    engine.activeCustomEffects = JSON.parse(JSON.stringify(effects))
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeCustomEffects', JSON.stringify(effects))
    }
  }

  const handleResetToDefault = () => {
    platformerEngine()?.resetEffectsLabToLevelDefault?.()
  }

  const handleClearAllEffects = () => {
    const engine = platformerEngine()
    if (!engine) return
    // Clear all custom effects
    engine.activeCustomEffects = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('activeCustomEffects')
    }
  }

  return (
    <div id="gameContainer">
      <canvas
        ref={canvasRef}
        id="gameCanvas"
        width="1024"
        height="576"
      ></canvas>

      {/* Game UI - only show when playing */}
      {gameState.gameScreen === GameScreen.PLAYING && (
        <GameUI
          lives={gameState.lives}
          score={gameState.score}
          combo={gameState.combo}
          soundEnabled={gameState.soundEnabled}
          onSoundToggle={gameHandlers.handleSoundToggle}
        />
      )}

      {/* Start Screen */}
      <StartScreen
        onStartGame={gameHandlers.handleStartGame}
        visible={gameState.gameScreen === GameScreen.START}
        mode={mode}
        onModeChange={setMode}
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
        onOpenEffectsLab={isPlatformer ? handleOpenEffectsLab : undefined}
      />

      {/* Effects Lab */}
      {isPlatformer && (
        <EffectsLab
          isOpen={isEffectsLabOpen}
          onClose={handleCloseEffectsLab}
          onApplyEffects={handleApplyEffects}
          onResetToDefault={handleResetToDefault}
          onClearAllEffects={handleClearAllEffects}
          gameRef={gameRef}
        />
      )}

      {/* Mobile Controls - only show when playing */}
      {gameState.gameScreen === GameScreen.PLAYING && (
        <MobileControls mode={mode} />
      )}
    </div>
  )
}
