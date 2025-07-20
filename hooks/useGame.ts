/**
 * useGame Hook
 * 
 * Custom hook that manages game state, engine initialization, and event handling.
 * Extracted from the Game component for better separation of concerns.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { GameEngine } from '../lib/game/GameEngine'

/**
 * Game state enum for managing different game screens
 */
export enum GameScreen {
  START = 'start',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'gameOver'
}

/**
 * Game state interface returned by the hook
 */
export interface GameState {
  gameScreen: GameScreen
  lives: number
  score: number
  level: number
  soundEnabled: boolean
  finalScore: number
  combo: number
  bestCombo: number
}

/**
 * Game event handlers interface
 */
export interface GameHandlers {
  handleStartGame: () => void
  handleRestart: () => void
  handleResume: () => void
  handleSoundToggle: () => void
}

/**
 * useGame Hook
 * 
 * Manages game state, engine initialization, and provides event handlers.
 * 
 * @param canvasRef - Reference to the game canvas element
 * @returns Object containing game state and event handlers
 */
export function useGame(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const gameRef = useRef<GameEngine | null>(null)
  
  // Game state management
  const [gameScreen, setGameScreen] = useState<GameScreen>(GameScreen.START)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [finalScore, setFinalScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)

  // Initialize game engine
  useEffect(() => {
    if (!canvasRef.current) return

    gameRef.current = new GameEngine(canvasRef.current)

    // Set up game state update listeners
    const updateGameState = () => {
      if (gameRef.current) {
        setLives(gameRef.current.lives)
        setScore(gameRef.current.score)
        setLevel(gameRef.current.currentLevel)
        setSoundEnabled(gameRef.current.soundEnabled)
        setCombo(gameRef.current.combo)
        setBestCombo(gameRef.current.bestCombo)
        
        // Update game screen based on game state
        if (gameRef.current.gameState === 'gameover') {
          setGameScreen(GameScreen.GAME_OVER)
          setFinalScore(gameRef.current.score)
        } else if (gameRef.current.paused && gameRef.current.gameState === 'playing') {
          setGameScreen(GameScreen.PAUSED)
        } else if (gameRef.current.gameState === 'playing') {
          setGameScreen(GameScreen.PLAYING)
        } else if (gameRef.current.gameState === 'start') {
          setGameScreen(GameScreen.START)
        }
      }
    }

    // Set up periodic state updates
    const stateUpdateInterval = setInterval(updateGameState, 100)

    // Cleanup function
    return () => {
      clearInterval(stateUpdateInterval)
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
  }, [canvasRef])



  // Event handlers
  const handleStartGame = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.startGame()
      setGameScreen(GameScreen.PLAYING)
    }
  }, [])

  const handleRestart = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.restart()
      setGameScreen(GameScreen.PLAYING)
      setLives(3)
      setScore(0)
      setLevel(1)
      setFinalScore(0)
    }
  }, [])

  const handleResume = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.togglePause()
      setGameScreen(GameScreen.PLAYING)
    }
  }, [])

  const handleSoundToggle = useCallback(() => {
    if (gameRef.current) {
      const newState = !soundEnabled
      gameRef.current.soundEnabled = newState
      setSoundEnabled(newState)
    }
  }, [soundEnabled])

  // Return game state and handlers
  const gameState: GameState = {
    gameScreen,
    lives,
    score,
    level,
    soundEnabled,
    finalScore,
    combo,
    bestCombo
  }

  const gameHandlers: GameHandlers = {
    handleStartGame,
    handleRestart,
    handleResume,
    handleSoundToggle
  }

  return {
    gameState,
    gameHandlers,
    gameRef
  }
} 