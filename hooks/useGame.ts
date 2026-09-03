/**
 * useGame Hook
 *
 * Custom hook that manages game state, engine initialization, and event handling.
 * Extracted from the Game component for better separation of concerns.
 *
 * The hook is mode-agnostic: it drives whatever createEngine returns through
 * the ArcadeEngine interface, so switching between the side-scroller and Snake
 * is a matter of tearing one engine down and building the other.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { ArcadeEngine, createEngine, GameMode } from '../lib/game/ArcadeEngine'

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

/** How often React re-reads the engine's counters, in ms. */
const STATE_POLL_INTERVAL_MS = 100

/**
 * useGame Hook
 *
 * Manages game state, engine initialization, and provides event handlers.
 *
 * @param canvasRef - Reference to the game canvas element
 * @param mode - Which game mode to run
 * @returns Object containing game state and event handlers
 */
export function useGame(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  mode: GameMode = 'abberant'
) {
  const gameRef = useRef<ArcadeEngine | null>(null)

  // Game state management
  const [gameScreen, setGameScreen] = useState<GameScreen>(GameScreen.START)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [finalScore, setFinalScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)

  // Initialize game engine. Re-runs on a mode change, replacing the engine.
  useEffect(() => {
    if (!canvasRef.current) {
      return
    }

    setGameScreen(GameScreen.START)

    gameRef.current = createEngine(mode, canvasRef.current, {
      onStateChange: (oldState, newState) => {
        if (newState === 'gameover') {
          setGameScreen(GameScreen.GAME_OVER)
        } else if (newState === 'playing') {
          setGameScreen(GameScreen.PLAYING)
        }
      },
      onGameOver: (score) => {
        setFinalScore(score)
        setGameScreen(GameScreen.GAME_OVER)
      },
      onPauseToggle: (paused) => {
        setGameScreen(paused ? GameScreen.PAUSED : GameScreen.PLAYING)
      }
    })

    // Set up game state update listeners
    const updateGameState = () => {
      const engine = gameRef.current
      if (!engine) return

      setLives(engine.lives)
      setScore(engine.score)
      setSoundEnabled(engine.soundEnabled)
      setCombo(engine.combo)
      setBestCombo(engine.bestCombo)

      // Update game screen based on game state
      if (engine.gameState === 'gameover') {
        setGameScreen(GameScreen.GAME_OVER)
        setFinalScore(engine.score)
      } else if (engine.paused && engine.gameState === 'playing') {
        setGameScreen(GameScreen.PAUSED)
      } else if (engine.gameState === 'playing') {
        setGameScreen(GameScreen.PLAYING)
      } else if (engine.gameState === 'start') {
        setGameScreen(GameScreen.START)
      }
    }

    // Set up periodic state updates
    const stateUpdateInterval = setInterval(updateGameState, STATE_POLL_INTERVAL_MS)

    // Cleanup function
    return () => {
      clearInterval(stateUpdateInterval)
      const engine = gameRef.current
      if (engine) {
        // Clean up animation frame
        if (engine.animationFrameId) {
          cancelAnimationFrame(engine.animationFrameId)
        }
        // Clean up BGM timeout
        if (engine.bgmTimeoutId) {
          clearTimeout(engine.bgmTimeoutId)
        }
        // Clean up event listeners
        engine.cleanup()
        gameRef.current = null
      }
    }
  }, [canvasRef, mode])

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
