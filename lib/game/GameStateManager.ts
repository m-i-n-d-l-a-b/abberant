/**
 * Game State Manager
 * 
 * This module handles all game state management including:
 * - Game state transitions (start, playing, transition, gameover)
 * - Level progression and completion
 * - Score and lives management
 * - Pause/resume functionality
 * - State validation and error handling
 */

import {
  GameState,
  Player,
  Platform,
  Enemy,
  Collectible,
  BackgroundStar,
  DataBleedEffect,
  Effects,
  Camera,
  Keys,
  TouchInput,
  Particle
} from '../../types/game'
import {
  INITIAL_LIVES,
  INITIAL_LEVEL,
  INITIAL_SCORE,
  LEVEL_TARGET,
  LEVEL_START_INVINCIBILITY,
  PLAYER_START_X,
  PLAYER_START_Y,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_JUMP_POWER,
  PLAYER_COLOR,
  CAMERA_SMOOTHING,
  CAMERA_ZOOM_MIN,
  LEVEL_COMPLETION_SCORE_MULTIPLIER,
  TRANSITION_DURATION,
  TRANSITION_ZOOM_IN_DURATION,
  TRANSITION_ZOOM_OUT_DURATION
} from '../../constants/game'

export type GameStateType = 'start' | 'playing' | 'transition' | 'gameover'

export interface GameStateData {
  gameState: GameStateType
  currentLevel: number
  lives: number
  score: number
  paused: boolean
  isReversed: boolean
  levelProgress: number
  levelTarget: number
  transitionTimer: number
  levelEffects: string[]
  cameraZoom: number
  transitionPhase: 'none' | 'zoomIn' | 'transition' | 'zoomOut'
  transitionProgress: number
  levelStartInvincibility: number
}

export interface GameStateCallbacks {
  onStateChange?: (oldState: GameStateType, newState: GameStateType) => void
  onLevelComplete?: (level: number, score: number) => void
  onGameOver?: (finalScore: number) => void
  onPauseToggle?: (paused: boolean) => void
  onLivesChanged?: (lives: number) => void
  onScoreChanged?: (score: number) => void
}

export class GameStateManager {
  private state: GameStateData
  private callbacks: GameStateCallbacks
  private previousState: GameStateType

  constructor(callbacks: GameStateCallbacks = {}) {
    this.callbacks = callbacks
    this.state = this.getInitialState()
    this.previousState = this.state.gameState
  }

  /**
   * Get the initial game state
   */
  private getInitialState(): GameStateData {
    return {
      gameState: 'start',
      currentLevel: INITIAL_LEVEL,
      lives: INITIAL_LIVES,
      score: INITIAL_SCORE,
      paused: false,
      isReversed: false,
      levelProgress: 0,
      levelTarget: LEVEL_TARGET,
      transitionTimer: 0,
      levelEffects: [],
      cameraZoom: CAMERA_ZOOM_MIN,
      transitionPhase: 'none',
      transitionProgress: 0,
      levelStartInvincibility: LEVEL_START_INVINCIBILITY
    }
  }

  /**
   * Initialize the game state
   */
  init(): void {
    this.state = this.getInitialState()
    this.previousState = this.state.gameState
  }

  /**
   * Get current state data
   */
  getState(): GameStateData {
    return { ...this.state }
  }

  /**
   * Get specific state properties
   */
  getGameState(): GameStateType {
    return this.state.gameState
  }

  getCurrentLevel(): number {
    return this.state.currentLevel
  }

  getLives(): number {
    return this.state.lives
  }

  getScore(): number {
    return this.state.score
  }

  isPaused(): boolean {
    return this.state.paused
  }

  isReversed(): boolean {
    return this.state.isReversed
  }

  getLevelProgress(): number {
    return this.state.levelProgress
  }

  getLevelTarget(): number {
    return this.state.levelTarget
  }

  getCameraZoom(): number {
    return this.state.cameraZoom
  }

  getTransitionPhase(): 'none' | 'zoomIn' | 'transition' | 'zoomOut' {
    return this.state.transitionPhase
  }

  getTransitionProgress(): number {
    return this.state.transitionProgress
  }

  getLevelStartInvincibility(): number {
    return this.state.levelStartInvincibility
  }

  getLevelEffects(): string[] {
    return [...this.state.levelEffects]
  }

  /**
   * Start the game
   */
  startGame(): boolean {
    if (this.state.gameState !== 'start') {
      return false
    }

    const oldState = this.state.gameState
    this.state.gameState = 'playing'
    this.state.paused = false
    this.previousState = oldState

    this.callbacks.onStateChange?.(oldState, this.state.gameState)
    return true
  }

  /**
   * Toggle pause state
   */
  togglePause(): boolean {
    if (this.state.gameState !== 'playing') {
      return false
    }

    this.state.paused = !this.state.paused
    this.callbacks.onPauseToggle?.(this.state.paused)
    return true
  }

  /**
   * Set pause state
   */
  setPaused(paused: boolean): void {
    if (this.state.gameState === 'playing') {
      this.state.paused = paused
      this.callbacks.onPauseToggle?.(this.state.paused)
    }
  }

  /**
   * Update level progress
   */
  updateLevelProgress(playerX: number, isReversed: boolean): void {
    if (this.state.gameState !== 'playing') {
      return
    }

    if (isReversed) {
      this.state.levelProgress = ((this.state.levelTarget - playerX) / this.state.levelTarget) * 100
    } else {
      this.state.levelProgress = (playerX / this.state.levelTarget) * 100
    }

    // Check for level completion
    if (this.state.levelProgress >= 100 && this.state.gameState === 'playing') {
      this.completeLevel()
    }
  }

  /**
   * Complete current level and start transition
   */
  completeLevel(): void {
    if (this.state.gameState !== 'playing') {
      return
    }

    const oldState = this.state.gameState
    this.state.gameState = 'transition'
    this.state.transitionPhase = 'zoomIn'
    this.state.transitionProgress = 0
    this.state.transitionTimer = 0

    // Add level completion bonus
    const levelBonus = this.state.currentLevel * LEVEL_COMPLETION_SCORE_MULTIPLIER
    this.addScore(levelBonus)

    this.callbacks.onStateChange?.(oldState, this.state.gameState)
    this.callbacks.onLevelComplete?.(this.state.currentLevel, this.state.score)
  }

  /**
   * Update transition state
   */
  updateTransition(): void {
    if (this.state.gameState !== 'transition') {
      return
    }

    this.state.transitionTimer++

    if (this.state.transitionPhase === 'zoomIn') {
      this.state.transitionProgress++
      const t = Math.min(1, this.state.transitionProgress / TRANSITION_ZOOM_IN_DURATION)
      this.state.cameraZoom = 1 + 1.5 * t // zoom from 1 to 2.5

      if (t >= 1) {
        // Load new level after zoom in completes
        this.state.currentLevel++
        this.state.transitionPhase = 'transition'
        this.state.transitionProgress = 0
        this.state.cameraZoom = 2.5
      }
    } else if (this.state.transitionPhase === 'transition') {
      this.state.transitionProgress++
      if (this.state.transitionProgress >= TRANSITION_DURATION) {
        this.state.transitionPhase = 'zoomOut'
        this.state.transitionProgress = 0
      }
    } else if (this.state.transitionPhase === 'zoomOut') {
      this.state.transitionProgress++
      const t = Math.min(1, this.state.transitionProgress / TRANSITION_ZOOM_OUT_DURATION)
      this.state.cameraZoom = 2.5 - 1.5 * t // zoom from 2.5 to 1

      if (t >= 1) {
        this.state.cameraZoom = 1
        this.state.transitionPhase = 'none'
        this.state.gameState = 'playing'
        this.state.levelProgress = 0
        this.state.levelStartInvincibility = LEVEL_START_INVINCIBILITY

        this.callbacks.onStateChange?.('transition', this.state.gameState)
      }
    }
  }

  /**
   * Add score
   */
  addScore(points: number): void {
    const oldScore = this.state.score
    this.state.score += points
    this.callbacks.onScoreChanged?.(this.state.score)
  }

  /**
   * Lose a life
   */
  loseLife(): boolean {
    if (this.state.lives <= 0) {
      return false
    }

    const oldLives = this.state.lives
    this.state.lives--
    this.callbacks.onLivesChanged?.(this.state.lives)

    if (this.state.lives <= 0) {
      this.gameOver()
    }

    return true
  }

  /**
   * Game over
   */
  gameOver(): void {
    const oldState = this.state.gameState
    this.state.gameState = 'gameover'
    this.state.paused = false

    this.callbacks.onStateChange?.(oldState, this.state.gameState)
    this.callbacks.onGameOver?.(this.state.score)
  }

  /**
   * Restart the game
   */
  restart(): void {
    const oldState = this.state.gameState
    this.init()
    this.callbacks.onStateChange?.(oldState, this.state.gameState)
  }

  /**
   * Reset level (for respawn)
   */
  resetLevel(fullReset: boolean = false): void {
    if (fullReset) {
      this.state.score = INITIAL_SCORE
      this.state.lives = INITIAL_LIVES
      this.state.currentLevel = INITIAL_LEVEL
      this.state.isReversed = false
    }

    this.state.levelProgress = 0
    this.state.levelStartInvincibility = LEVEL_START_INVINCIBILITY
  }

  /**
   * Set level effects
   */
  setLevelEffects(effects: string[]): void {
    this.state.levelEffects = [...effects]
  }

  /**
   * Set reversed state
   */
  setReversed(reversed: boolean): void {
    this.state.isReversed = reversed
  }

  /**
   * Update level start invincibility
   */
  updateLevelStartInvincibility(): void {
    if (this.state.levelStartInvincibility > 0) {
      this.state.levelStartInvincibility--
    }
  }

  /**
   * Set level target
   */
  setLevelTarget(target: number): void {
    this.state.levelTarget = target
  }

  /**
   * Get player initial state
   */
  getPlayerInitialState(): Player {
    return {
      x: PLAYER_START_X,
      y: PLAYER_START_Y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      velX: 0,
      velY: 0,
      speed: PLAYER_SPEED,
      jumpPower: PLAYER_JUMP_POWER,
      grounded: false,
      doubleJump: false,
      dashCooldown: 0,
      invulnerable: 0,
      color: PLAYER_COLOR,
      trail: [],
      respawning: false,
    }
  }

  /**
   * Get camera initial state
   */
  getCameraInitialState(): Camera {
    return {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      smoothing: CAMERA_SMOOTHING
    }
  }

  /**
   * Get effects initial state
   */
  getEffectsInitialState(): Effects {
    return {
      glitchOffset: { x: 0, y: 0 },
      meltingFactor: 0,
      colorShift: 0,
      pulseFactor: 1,
      blurFactor: 0,
      noiseFactor: 0,
      rgbShiftFactor: 0,
      waveFactor: 0,
      zoomFactor: 0,
      rotationFactor: 0,
      pixelBleedFactor: 0,
    }
  }

  /**
   * Validate state consistency
   */
  validateState(): { isValid: boolean; issues: string[] } {
    const issues: string[] = []

    // Check for invalid state combinations
    if (this.state.gameState === 'playing' && this.state.paused) {
      // This is actually valid - playing can be paused
    }

    if (this.state.lives < 0) {
      issues.push('Lives cannot be negative')
    }

    if (this.state.score < 0) {
      issues.push('Score cannot be negative')
    }

    if (this.state.currentLevel < 1) {
      issues.push('Current level must be at least 1')
    }

    if (this.state.levelProgress < 0 || this.state.levelProgress > 100) {
      issues.push('Level progress must be between 0 and 100')
    }

    if (this.state.cameraZoom < 0) {
      issues.push('Camera zoom cannot be negative')
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }

  /**
   * Get state summary for debugging
   */
  getStateSummary(): string {
    return `Game: ${this.state.gameState}, Level: ${this.state.currentLevel}, Lives: ${this.state.lives}, Score: ${this.state.score}, Paused: ${this.state.paused}, Progress: ${this.state.levelProgress.toFixed(1)}%`
  }
} 