/**
 * Game Engine
 * 
 * This module contains the core game engine class extracted from the monolithic Game.tsx file.
 * It handles all game logic, rendering, input, audio, and state management.
 */

import { CollisionSystem, CollisionEntity, BoundingBox } from './CollisionSystem'
import { ParticlePool, AudioNodePool, Particle as PooledParticle } from './ObjectPool'
import { RenderingOptimizer } from './RenderingOptimizer'
import { AudioManager } from './AudioManager'
import { GameStateManager, GameStateType, GameStateCallbacks } from './GameStateManager'
import { PlayerManager, PlayerInput, PlayerUpdateResult } from './PlayerManager'
import { EnemyManager, EnemySpawnConfig, EnemyUpdateResult } from './EnemyManager'
import { LevelGenerator, LevelConfig, LevelData } from './LevelGenerator'
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
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  FPS,
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
  PLAYER_DASH_POWER,
  PLAYER_DASH_COOLDOWN,
  PLAYER_INVULNERABLE_TIME,
  PLAYER_COLOR,
  PLAYER_FRICTION,
  PLAYER_GRAVITY,
  CAMERA_SMOOTHING,
  CAMERA_ZOOM_MIN,
  CAMERA_ZOOM_MAX,
  CAMERA_ZOOM_TRANSITION_DURATION,
  BASE_LEVEL_WIDTH,
  LEVEL_WIDTH_INCREMENT,
  BASE_PLATFORM_COUNT,
  PLATFORM_COUNT_INCREMENT,
  BASE_ENEMY_COUNT,
  ENEMY_COUNT_INCREMENT,
  BASE_COLLECTIBLE_COUNT,
  COLLECTIBLE_COUNT_INCREMENT,
  PLATFORM_MIN_WIDTH,
  PLATFORM_WIDTH_VARIATION,
  PLATFORM_BASE_Y,
  PLATFORM_Y_VARIATION,
  PLATFORM_X_VARIATION,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  ENEMY_SPEED_MIN,
  ENEMY_SPEED_VARIATION,
  ENEMY_MOVE_RANGE_MIN,
  ENEMY_MOVE_RANGE_VARIATION,
  ENEMY_STOMP_ZONE_HEIGHT,
  ENEMY_SCORE_VALUE,
  COLLECTIBLE_WIDTH,
  COLLECTIBLE_HEIGHT,
  COLLECTIBLE_VALUE,
  STAR_COUNT,
  DREAM_PARTICLES_COUNT,
  DREAM_WAVES_COUNT,
  DREAM_LAYERS_COUNT,
  STAR_TYPE_PROBABILITIES,
  STAR_PROPERTIES,
  BGM_TEMPO,
  BGM_PITCH_MOD,
  BGM_TEMPO_VARIATION,
  BGM_PITCH_VARIATION,
  EFFECTS_UPDATE_INTERVAL,
  EFFECTS_MAJOR_UPDATE_INTERVAL,
  DATA_BLEED_DURATION,
  DATA_BLEED_SIZE_MIN,
  DATA_BLEED_SIZE_VARIATION,
  PARTICLE_EXPLOSION_COUNT,
  PARTICLE_VELOCITY_MIN,
  PARTICLE_VELOCITY_MAX,
  PARTICLE_SIZE_MIN,
  PARTICLE_SIZE_MAX,
  DREAM_LAYER_ALPHA_BASE,
  DREAM_LAYER_ALPHA_DECREMENT,
  DREAM_LAYER_SCALE_BASE,
  DREAM_LAYER_SCALE_INCREMENT,
  DREAM_WAVE_AMPLITUDE_BASE,
  DREAM_WAVE_AMPLITUDE_VARIATION,
  DREAM_WAVE_FREQUENCY_BASE,
  DREAM_WAVE_FREQUENCY_INCREMENT,
  DREAM_WAVE_ALPHA,
  LEVEL_EFFECTS,
  TRANSITION_DURATION,
  TRANSITION_ZOOM_IN_DURATION,
  TRANSITION_ZOOM_OUT_DURATION,
  LEVEL_COMPLETION_SCORE_MULTIPLIER,
  COLLISION_WORLD_BUFFER,
  COLLISION_GRID_SIZE,
  COLLISION_MAX_ENTITIES,
  PARTICLE_POOL_SIZE,
  PARTICLE_POOL_MAX,
  AUDIO_NODE_POOL_SIZE,
  AUDIO_NODE_POOL_MAX,
  MOBILE_BUTTON_SIZE,
  MOBILE_BUTTON_MARGIN,
  SOUND_TOGGLE_SIZE,
  SOUND_TOGGLE_MARGIN
} from '../../constants/game'

export class GameEngine {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number

  player!: Player
  camera!: Camera
  keys!: Keys
  touchInput!: TouchInput
  effects!: Effects
  platforms!: Platform[]
  enemies!: Enemy[]
  collectibles!: Collectible[]
  backgroundStars!: BackgroundStar[]
  dataBleedEffects!: DataBleedEffect[]
  frameCount!: number
  lastTime!: number
  fps!: number
  audioCtx!: AudioContext | null
  soundEnabled!: boolean
  audioInitialized!: boolean
  bgmTimeoutId!: NodeJS.Timeout | null
  bgmTempo!: number
  bgmPitchMod!: number
  delayNode!: DelayNode | null
  feedbackGain!: GainNode | null
  masterGain!: GainNode | null
  inputSetupDone!: boolean
  animationFrameId!: number | null
  startButtonHandler!: () => void
  keydownHandler!: (e: KeyboardEvent) => void
  keyupHandler!: (e: KeyboardEvent) => void
  mobileHandlers!: Array<{ button: Element; handleStart: (e: Event) => void; handleEnd: (e: Event) => void }>
  soundToggleHandler!: () => void
  particles!: Particle[]; // Canvas-based particles
  collisionSystem!: CollisionSystem; // Spatial partitioning collision system
  particlePool!: ParticlePool; // Object pool for particles
  audioNodePool!: AudioNodePool; // Object pool for audio nodes
  renderingOptimizer!: RenderingOptimizer; // Optimized rendering system
  audioManager!: AudioManager; // Optimized audio management system
  stateManager!: GameStateManager; // Game state management system
  playerManager!: PlayerManager; // Player management system
  enemyManager!: EnemyManager; // Enemy management system
  levelGenerator!: LevelGenerator; // Level generation system

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.width = CANVAS_WIDTH
    this.height = CANVAS_HEIGHT
    this.setupAudio()
    this.init()
  }

  init() {
    // Initialize state manager with callbacks
    const stateCallbacks: GameStateCallbacks = {
      onStateChange: (oldState, newState) => {
        console.log(`Game state changed: ${oldState} -> ${newState}`)
      },
      onLevelComplete: (level, score) => {
        console.log(`Level ${level} completed! Score: ${score}`)
      },
      onGameOver: (finalScore) => {
        console.log(`Game Over! Final Score: ${finalScore}`)
        this.showGameOverScreen()
      },
      onPauseToggle: (paused) => {
        console.log(`Game ${paused ? 'paused' : 'resumed'}`)
        this.showPauseScreen(paused)
      },
      onLivesChanged: (lives) => {
        console.log(`Lives changed: ${lives}`)
        this.updateLivesDisplay(lives)
      },
      onScoreChanged: (score) => {
        console.log(`Score changed: ${score}`)
        this.updateScoreDisplay(score)
      }
    }

    this.stateManager = new GameStateManager(stateCallbacks)
    this.stateManager.init()

    // Initialize game entities using state manager
    this.player = this.stateManager.getPlayerInitialState()
    this.camera = this.stateManager.getCameraInitialState()
    this.effects = this.stateManager.getEffectsInitialState()
    
    this.keys = {}
    this.touchInput = {
      left: false,
      right: false,
      jump: false,
      dash: false,
    }

    if (!this.inputSetupDone) {
      this.setupInput()
      this.setupMobileControls()
      this.setupSoundToggle()
      this.inputSetupDone = true
    }

    this.particles = []
    this.platforms = []
    this.enemies = []
    this.collectibles = []
    this.backgroundStars = []
    this.dataBleedEffects = []

    this.frameCount = 0
    this.lastTime = performance.now()
    this.fps = FPS

    // Initialize collision system with world bounds
    const worldBounds: BoundingBox = {
      x: -COLLISION_WORLD_BUFFER, // Allow some buffer for entities that might be slightly off-screen
      y: -COLLISION_WORLD_BUFFER,
      width: BASE_LEVEL_WIDTH + this.stateManager.getCurrentLevel() * LEVEL_WIDTH_INCREMENT + COLLISION_WORLD_BUFFER * 2, // Level width + buffer
      height: this.height + COLLISION_WORLD_BUFFER * 2 // Height + buffer
    }
    this.collisionSystem = new CollisionSystem(worldBounds, COLLISION_GRID_SIZE, COLLISION_MAX_ENTITIES)

    // Initialize object pools
    this.particlePool = new ParticlePool(PARTICLE_POOL_SIZE, PARTICLE_POOL_MAX)
    if (this.audioCtx) {
      this.audioNodePool = new AudioNodePool(this.audioCtx, AUDIO_NODE_POOL_SIZE, AUDIO_NODE_POOL_MAX)
    }

    // Initialize rendering optimizer
    this.renderingOptimizer = new RenderingOptimizer(this.ctx)

    // Initialize audio manager
    this.audioManager = new AudioManager()

    // Initialize player manager
    this.playerManager = new PlayerManager(
      this.player,
      this.collisionSystem,
      this.camera,
      this.width,
      this.height
    )

    // Initialize enemy manager
    this.enemyManager = new EnemyManager(
      this.collisionSystem,
      this.width,
      this.height
    )

    // Initialize level generator
    this.levelGenerator = new LevelGenerator(this.width, this.height)

    this.showStartScreen()
    this.generateLevel()
    // Populate collision system with initial level entities
    this.populateCollisionSystem()

    if (!this.animationFrameId) {
      this.gameLoop()
    }
  }

  showStartScreen() {
    const startScreen = document.getElementById("startScreen")
    const gameOverScreen = document.getElementById("gameOverScreen")
    const pauseScreen = document.getElementById("pauseScreen")
    
    if (startScreen) startScreen.style.display = "flex"
    if (gameOverScreen) gameOverScreen.style.display = "none"
    if (pauseScreen) pauseScreen.style.display = "none"
  }

  startGame() {
    if (this.stateManager.startGame()) {
      const startScreen = document.getElementById("startScreen")
      if (startScreen) startScreen.style.display = "none"
      this.initAudioContext()
    }
  }

  restart() {
    this.stateManager.restart()
    this.init()
  }

  setupAudio() {
    this.audioCtx = null
    this.soundEnabled = true
    this.audioInitialized = false
    this.bgmTimeoutId = null
    this.bgmTempo = BGM_TEMPO
    this.bgmPitchMod = BGM_PITCH_MOD
    this.delayNode = null
    this.feedbackGain = null
    this.masterGain = null
  }

  initAudioContext() {
    if (this.audioInitialized) return
    
    // Initialize audio manager context
    const success = this.audioManager.initAudioContext()
    if (success) {
      this.audioCtx = this.audioManager['audioContext'] // Access private property for compatibility
      this.audioInitialized = true
      this.startBGM()
    }
  }

  playSound(type: string) {
    if (!this.soundEnabled || !this.audioInitialized) {
      console.log('Audio not ready, skipping sound:', type)
      return
    }
    
    // Ensure audio context is running before playing sounds
    if (!this.audioManager.ensureAudioContextRunning()) {
      console.warn('Audio context not ready, cannot play sound:', type)
      return
    }
    
    console.log('Playing sound:', type, 'Audio context state:', this.audioManager.getAudioContextState())
    this.audioManager.playSound(type, 1.0)
  }

  startBGM() {
    console.log('Game: Starting BGM, audio context state:', this.audioManager.getAudioContextState())
    if (this.soundEnabled && this.audioInitialized && !this.paused) {
      // Ensure audio context is running before starting BGM
      if (this.audioManager.ensureAudioContextRunning()) {
        this.audioManager.startBGM()
      } else {
        console.warn('Cannot start BGM: audio context not ready')
      }
    } else {
      console.log('BGM start conditions not met:', {
        soundEnabled: this.soundEnabled,
        audioInitialized: this.audioInitialized,
        paused: this.paused
      })
    }
  }

  stopBGM() {
    console.log('Game: Stopping BGM')
    this.audioManager.stopBGM()
  }

  setupInput() {
    const startButton = document.getElementById("startButton")
    if (startButton) {
      this.startButtonHandler = () => this.startGame()
      startButton.addEventListener("click", this.startButtonHandler)
    }
    
    this.keydownHandler = (e: KeyboardEvent) => {
      // Ensure audio context is resumed on any user interaction
      if (!this.audioInitialized) {
        this.initAudioContext()
      } else {
        this.audioManager.ensureAudioContextRunning()
      }

      if (this.gameState === "start" && e.key === "Enter") {
        this.startGame()
        return
      }
      this.keys[e.key.toLowerCase()] = true
      if (
        e.key === " " ||
        e.key === "ArrowUp" ||
        e.key.toLowerCase() === "w"
      ) {
        this.jump()
        e.preventDefault()
      }
      if (e.key.toLowerCase() === "shift") {
        this.dash()
        e.preventDefault()
      }
      if (e.key.toLowerCase() === "p") {
        this.togglePause()
        e.preventDefault()
      }
      if (e.key.toLowerCase() === "r") {
        this.restart()
      }
      if (e.key.toLowerCase() === "c") {
        // Toggle collision system debug mode
        const currentDebugMode = this.collisionSystem['debugMode']
        this.collisionSystem.setDebugMode(!currentDebugMode)
        console.log(`Collision debug mode: ${!currentDebugMode ? 'enabled' : 'disabled'}`)
        e.preventDefault()
      }
      if (e.key.toLowerCase() === "v") {
        // Validate collision system state
        const validation = this.collisionSystem.validateSystemState()
        console.log('Collision system validation:', validation)
        if (!validation.isValid) {
          console.warn('Issues found:', validation.issues)
        }
        e.preventDefault()
      }
    }
    
    this.keyupHandler = (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = false
    }
    
    document.addEventListener("keydown", this.keydownHandler)
    document.addEventListener("keyup", this.keyupHandler)
  }

  setupMobileControls() {
    this.mobileHandlers = []
    const mobileButtons = document.querySelectorAll(".mobile-button")
    mobileButtons.forEach((button) => {
      const action = button.getAttribute("data-action")
      const handleStart = (e: Event) => {
        e.preventDefault()
        this.handleMobileInput(action!, true)
      }
      const handleEnd = (e: Event) => {
        e.preventDefault()
        this.handleMobileInput(action!, false)
      }
      button.addEventListener("touchstart", handleStart)
      button.addEventListener("touchend", handleEnd)
      this.mobileHandlers.push({ button, handleStart, handleEnd })
    })
  }

  handleMobileInput(action: string, pressed: boolean) {
    // Ensure audio context is resumed on any user interaction
    if (!this.audioInitialized) {
      this.initAudioContext()
    } else {
      this.audioManager.ensureAudioContextRunning()
    }

    if (this.gameState === "start") {
      this.startGame()
      return
    }
    if (this.gameState !== "playing") return
    switch (action) {
      case "left":
        this.touchInput.left = pressed
        break
      case "right":
        this.touchInput.right = pressed
        break
      case "jump":
        if (pressed) this.jump()
        break
      case "dash":
        if (pressed) this.dash()
        break
      case "pause":
        if (pressed) this.togglePause()
        break
    }
  }

  setupSoundToggle() {
    const soundToggle = document.getElementById("soundToggle")
    if (soundToggle) {
      this.soundToggleHandler = () => {
        if (this.gameState === "start") this.startGame()
        if (!this.audioInitialized) this.initAudioContext()
        this.soundEnabled = !this.soundEnabled
        this.audioManager.setSoundEnabled(this.soundEnabled)
        soundToggle.textContent = this.soundEnabled
          ? "🔊 Sound: ON"
          : "🔇 Sound: OFF"
        if (this.soundEnabled) {
          this.startBGM()
        } else {
          this.stopBGM()
        }
      }
      soundToggle.addEventListener("click", this.soundToggleHandler)
    }
  }

  // Placeholder methods that will be implemented in subsequent phases
  generateLevel() {
    const levelConfig: LevelConfig = {
      level: this.stateManager.getCurrentLevel(),
      playerX: this.player.x,
      playerY: this.player.y,
      difficulty: this.stateManager.getCurrentLevel() / 10
    }
    
    // Generate complete level using level generator
    const levelData = this.levelGenerator.generateLevel(levelConfig)
    
    // Update game state with level data
    this.platforms = levelData.platforms
    this.collectibles = levelData.collectibles
    this.backgroundStars = levelData.backgroundStars
    this.stateManager.setLevelTarget(levelData.levelWidth)
    
    // Generate enemies using enemy manager
    const spawnConfig: EnemySpawnConfig = {
      level: this.stateManager.getCurrentLevel(),
      levelWidth: levelData.levelWidth,
      platforms: this.platforms,
      playerX: this.player.x
    }
    
    this.enemies = this.enemyManager.generateEnemies(spawnConfig)
    
    // Assign level effects
    this.assignLevelEffects()
    
    console.log(`Generated level ${levelConfig.level}: ${levelData.platforms.length} platforms, ${levelData.collectibles.length} collectibles, ${levelData.backgroundStars.length} stars`)
  }

  populateCollisionSystem() {
    // Clear existing entities
    this.collisionSystem.clear()
    
    // Add platforms to collision system
    for (const platform of this.platforms) {
      this.collisionSystem.addEntity({
        id: `platform-${platform.x}-${platform.y}`,
        type: 'platform',
        bounds: {
          x: platform.x,
          y: platform.y,
          width: platform.width,
          height: platform.height
        },
        data: platform
      })
    }
    
    // Add enemies to collision system
    for (const enemy of this.enemies) {
      this.collisionSystem.addEntity({
        id: `enemy-${enemy.x}-${enemy.y}`,
        type: 'enemy',
        bounds: {
          x: enemy.x,
          y: enemy.y,
          width: enemy.width,
          height: enemy.height
        },
        data: enemy
      })
    }
    
    // Add collectibles to collision system
    for (const collectible of this.collectibles) {
      if (!collectible.collected) {
        this.collisionSystem.addEntity({
          id: `collectible-${collectible.x}-${collectible.y}`,
          type: 'collectible',
          bounds: {
            x: collectible.x,
            y: collectible.y,
            width: collectible.width,
            height: collectible.height
          },
          data: collectible
        })
      }
    }
    
    console.log(`Populated collision system: ${this.platforms.length} platforms, ${this.enemies.length} enemies, ${this.collectibles.filter(c => !c.collected).length} collectibles`)
  }

  assignLevelEffects() {
    const level = this.stateManager.getCurrentLevel()
    let effects: string[] = []
    
    // Assign effects based on level
    if (level >= 1 && level <= 3) {
      effects = ['melting', 'colorShift']
    } else if (level >= 4 && level <= 6) {
      effects = ['melting', 'colorShift', 'pulse']
    } else if (level >= 7 && level <= 10) {
      effects = ['melting', 'colorShift', 'pulse', 'blur']
    } else if (level >= 11) {
      effects = ['melting', 'colorShift', 'pulse', 'blur', 'noise', 'rgbShift', 'wave', 'zoom', 'rotation', 'pixelBleed']
    }
    
    this.stateManager.setLevelEffects(effects)
    console.log(`Assigned level effects for level ${level}: ${effects.join(', ')}`)
  }

  nextLevel() {
    this.stateManager.completeLevel()
  }

  update() {
    if (this.stateManager.isPaused()) return
    
    switch (this.stateManager.getGameState()) {
      case "start":
        break
      case "playing":
        this.updateGame()
        break
      case "transition":
        this.updateTransition()
        break
      case "gameover":
        break
    }
  }

  updateTransition() {
    this.stateManager.updateTransition()
  }

  updateGame() {
    // Update level start invincibility
    this.stateManager.updateLevelStartInvincibility()
    
    // Update level progress
    this.stateManager.updateLevelProgress(this.player.x, this.stateManager.isReversed())
    
    // Update UI displays
    this.updateLevelDisplay(this.stateManager.getCurrentLevel())
    
    // Handle input and update player
    this.handleInput()
    
    // Update enemies
    this.updateEnemies()
    
    // TODO: Implement effects updates in Phase 4
    // TODO: Implement remaining game logic in Phase 3
    console.log('updateGame called - remaining logic to be implemented in Phase 3')
  }

  handleInput() {
    const input: PlayerInput = {
      left: this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft'] || this.touchInput.left,
      right: this.keys['d'] || this.keys['D'] || this.keys['ArrowRight'] || this.touchInput.right,
      jump: this.keys['w'] || this.keys['W'] || this.keys['ArrowUp'] || this.keys[' '] || this.touchInput.jump,
      dash: this.keys['Shift'] || this.touchInput.dash
    }

    // Update player using player manager
    const updateResult = this.playerManager.updatePlayer(input)
    
    // Update player state
    this.player = updateResult.player
    
    // Handle collision results
    this.handlePlayerCollisions(updateResult.collisionResult)
    
    // Add particles from player effects
    this.particles.push(...updateResult.particles)
    
    // Update camera
    this.camera = this.playerManager.updateCamera()
  }

  jump() {
    // Handled by PlayerManager
    console.log('jump called - handled by PlayerManager')
  }

  dash() {
    // Handled by PlayerManager
    console.log('dash called - handled by PlayerManager')
  }

  updatePlayer() {
    // Handled by PlayerManager in handleInput method
    console.log('updatePlayer called - handled by PlayerManager')
  }

  updateEnemies() {
    const updateResult = this.enemyManager.updateEnemies()
    
    // Update enemies list
    this.enemies = updateResult.enemies
    
    // Add particles from enemy effects
    this.particles.push(...updateResult.particles)
    
    // Handle defeated enemies
    for (const defeatedEnemy of updateResult.defeatedEnemies) {
      this.stateManager.addScore(ENEMY_SCORE_VALUE)
      // TODO: Add defeat sound effect in Phase 6
    }
  }

  updateEffects() {
    // TODO: Implement in Phase 4
    console.log('updateEffects called - to be implemented in Phase 4')
  }

  updateDataBleed() {
    // TODO: Implement in Phase 4
    console.log('updateDataBleed called - to be implemented in Phase 4')
  }

  updateCamera() {
    // TODO: Implement in Phase 4
    console.log('updateCamera called - to be implemented in Phase 4')
  }

  checkCollisions() {
    // TODO: Implement in Phase 3
    console.log('checkCollisions called - to be implemented in Phase 3')
  }

  triggerDataBleed(x: number, y: number) {
    // TODO: Implement in Phase 4
    console.log('triggerDataBleed called - to be implemented in Phase 4')
  }

  respawn() {
    if (this.stateManager.loseLife()) {
      // Reset player using player manager
      this.playerManager.resetPlayer()
      this.playerManager.makeInvulnerable()
      this.playerManager.setRespawning(true)
      
      // Update player state
      this.player = this.playerManager.getPlayer()
      
      // Reset camera
      this.camera = this.playerManager.updateCamera()
    }
  }

  resetLevel(fullReset = true) {
    this.stateManager.resetLevel(fullReset)
  }

  togglePause() {
    this.stateManager.togglePause()
  }

  renderBackground() {
    // TODO: Implement in Phase 4
    console.log('renderBackground called - to be implemented in Phase 4')
  }

  renderBackgroundLayer(parallaxOffset = 0, tint: string | null = null) {
    // TODO: Implement in Phase 4
    console.log('renderBackgroundLayer called - to be implemented in Phase 4')
  }

  renderDreamEffects() {
    // TODO: Implement in Phase 4
    console.log('renderDreamEffects called - to be implemented in Phase 4')
  }

  renderFloatingDreamParticles(now: number, camX: number) {
    // TODO: Implement in Phase 4
    console.log('renderFloatingDreamParticles called - to be implemented in Phase 4')
  }

  renderDreamWaves(now: number, camX: number) {
    // TODO: Implement in Phase 4
    console.log('renderDreamWaves called - to be implemented in Phase 4')
  }

  render() {
    // TODO: Implement in Phase 4
    console.log('render called - to be implemented in Phase 4')
  }

  renderOptimized() {
    // TODO: Implement in Phase 4
    console.log('renderOptimized called - to be implemented in Phase 4')
  }

  renderBackgroundOptimized() {
    // TODO: Implement in Phase 4
    console.log('renderBackgroundOptimized called - to be implemented in Phase 4')
  }

  renderDataBleedOptimized() {
    // TODO: Implement in Phase 4
    console.log('renderDataBleedOptimized called - to be implemented in Phase 4')
  }

  renderParticlesOptimized() {
    // TODO: Implement in Phase 4
    console.log('renderParticlesOptimized called - to be implemented in Phase 4')
  }

  renderNoise() {
    // TODO: Implement in Phase 4
    console.log('renderNoise called - to be implemented in Phase 4')
  }

  renderPixelBleed() {
    // TODO: Implement in Phase 4
    console.log('renderPixelBleed called - to be implemented in Phase 4')
  }

  renderOverlays() {
    // TODO: Implement in Phase 4
    console.log('renderOverlays called - to be implemented in Phase 4')
  }

  renderScanlines() {
    // TODO: Implement in Phase 4
    console.log('renderScanlines called - to be implemented in Phase 4')
  }

  renderDataBleed() {
    // TODO: Implement in Phase 4
    console.log('renderDataBleed called - to be implemented in Phase 4')
  }

  renderTransition() {
    // TODO: Implement in Phase 4
    console.log('renderTransition called - to be implemented in Phase 4')
  }

  updateUI() {
    // TODO: Implement in Phase 7
    console.log('updateUI called - to be implemented in Phase 7')
  }

  gameLoop() {
    // TODO: Implement in Phase 2
    console.log('gameLoop called - to be implemented in Phase 2')
  }

  cleanup() {
    // TODO: Implement in Phase 2
    console.log('cleanup called - to be implemented in Phase 2')
  }

  createParticleExplosion(x: number, y: number, color: string, count: number = 20) {
    // TODO: Implement in Phase 4
    console.log('createParticleExplosion called - to be implemented in Phase 4')
  }

  updateParticles() {
    // TODO: Implement in Phase 4
    console.log('updateParticles called - to be implemented in Phase 4')
  }

  renderParticles() {
    // TODO: Implement in Phase 4
    console.log('renderParticles called - to be implemented in Phase 4')
  }

  getAudioStats() {
    // TODO: Implement in Phase 6
    console.log('getAudioStats called - to be implemented in Phase 6')
  }

  // UI update methods for state manager callbacks
  private showGameOverScreen() {
    const gameOverScreen = document.getElementById("gameOverScreen")
    const finalScore = document.getElementById("finalScore")
    if (gameOverScreen) gameOverScreen.style.display = "flex"
    if (finalScore) finalScore.textContent = this.stateManager.getScore().toString()
  }

  private showPauseScreen(paused: boolean) {
    const pauseScreen = document.getElementById("pauseScreen")
    if (pauseScreen) {
      pauseScreen.style.display = paused ? "flex" : "none"
    }
  }

  private updateLivesDisplay(lives: number) {
    const livesElement = document.getElementById("lives")
    if (livesElement) livesElement.textContent = lives.toString()
  }

  private updateScoreDisplay(score: number) {
    const scoreElement = document.getElementById("score")
    if (scoreElement) scoreElement.textContent = score.toString()
  }

  private updateLevelDisplay(level: number) {
    const levelElement = document.getElementById("level")
    if (levelElement) levelElement.textContent = level.toString()
  }

  /**
   * Handle player collision results
   */
  private handlePlayerCollisions(collisionResult: any): void {
    // Handle collectibles
    if (collisionResult.collectiblesCollected.length > 0) {
      for (const collectible of collisionResult.collectiblesCollected) {
        collectible.collected = true
        this.stateManager.addScore(collectible.value)
        // TODO: Add collection sound effect in Phase 6
      }
    }

    // Handle enemy stomps
    if (collisionResult.enemiesHit.length > 0) {
      for (const enemy of collisionResult.enemiesHit) {
        // Defeat enemy using enemy manager
        const defeatParticles = this.enemyManager.defeatEnemy(enemy)
        this.particles.push(...defeatParticles)
        this.stateManager.addScore(ENEMY_SCORE_VALUE)
        // TODO: Add stomp sound effect in Phase 6
      }
    }

    // Handle player damage
    if (collisionResult.shouldRespawn) {
      this.respawn()
    }
  }

  // Getter methods for state manager properties (for compatibility)
  get gameState(): string {
    return this.stateManager.getGameState()
  }

  get currentLevel(): number {
    return this.stateManager.getCurrentLevel()
  }

  get lives(): number {
    return this.stateManager.getLives()
  }

  get score(): number {
    return this.stateManager.getScore()
  }

  get paused(): boolean {
    return this.stateManager.isPaused()
  }

  get isReversed(): boolean {
    return this.stateManager.isReversed()
  }

  get levelProgress(): number {
    return this.stateManager.getLevelProgress()
  }

  get levelTarget(): number {
    return this.stateManager.getLevelTarget()
  }

  get cameraZoom(): number {
    return this.stateManager.getCameraZoom()
  }

  get transitionPhase(): 'none' | 'zoomIn' | 'transition' | 'zoomOut' {
    return this.stateManager.getTransitionPhase()
  }

  get transitionProgress(): number {
    return this.stateManager.getTransitionProgress()
  }

  get levelStartInvincibility(): number {
    return this.stateManager.getLevelStartInvincibility()
  }

  get levelEffects(): string[] {
    return this.stateManager.getLevelEffects()
  }

  get transitionTimer(): number {
    return this.stateManager.getState().transitionTimer
  }
} 