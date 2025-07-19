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
  gameState!: string
  currentLevel!: number
  lives!: number
  score!: number
  paused!: boolean
  isReversed!: boolean

  player!: Player
  camera!: Camera
  keys!: Keys
  touchInput!: TouchInput
  effects!: Effects
  levelProgress!: number
  levelTarget!: number
  platforms!: Platform[]
  enemies!: Enemy[]
  collectibles!: Collectible[]
  backgroundStars!: BackgroundStar[]
  dataBleedEffects!: DataBleedEffect[]
  transitionTimer!: number
  levelEffects!: string[]
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
  cameraZoom!: number;
  transitionPhase!: 'none' | 'zoomIn' | 'transition' | 'zoomOut';
  transitionProgress!: number;
  levelStartInvincibility!: number;
  particles!: Particle[]; // Canvas-based particles
  collisionSystem!: CollisionSystem; // Spatial partitioning collision system
  particlePool!: ParticlePool; // Object pool for particles
  audioNodePool!: AudioNodePool; // Object pool for audio nodes
  renderingOptimizer!: RenderingOptimizer; // Optimized rendering system
  audioManager!: AudioManager; // Optimized audio management system

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.width = CANVAS_WIDTH
    this.height = CANVAS_HEIGHT
    this.setupAudio()
    this.init()
  }

  init() {
    this.gameState = "start"
    this.currentLevel = INITIAL_LEVEL
    this.lives = INITIAL_LIVES
    this.score = INITIAL_SCORE
    this.paused = false
    this.isReversed = false
    this.cameraZoom = CAMERA_ZOOM_MIN
    this.transitionPhase = 'none'
    this.transitionProgress = 0
    this.levelStartInvincibility = LEVEL_START_INVINCIBILITY
    this.particles = []

    this.player = {
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
    this.camera = { x: 0, y: 0, targetX: 0, targetY: 0, smoothing: CAMERA_SMOOTHING }
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

    this.effects = {
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
    this.levelProgress = 0
    this.levelTarget = LEVEL_TARGET

    this.platforms = []
    this.enemies = []
    this.collectibles = []
    this.backgroundStars = []

    this.dataBleedEffects = []
    this.transitionTimer = 0
    this.levelEffects = []

    this.frameCount = 0
    this.lastTime = performance.now()
    this.fps = FPS

    // Initialize collision system with world bounds
    const worldBounds: BoundingBox = {
      x: -COLLISION_WORLD_BUFFER, // Allow some buffer for entities that might be slightly off-screen
      y: -COLLISION_WORLD_BUFFER,
      width: BASE_LEVEL_WIDTH + this.currentLevel * LEVEL_WIDTH_INCREMENT + COLLISION_WORLD_BUFFER * 2, // Level width + buffer
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
    if (this.gameState !== "start") return
    this.gameState = "playing"
    const startScreen = document.getElementById("startScreen")
    if (startScreen) startScreen.style.display = "none"
    this.initAudioContext()
  }

  restart() {
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
    // TODO: Implement in Phase 3
    console.log('generateLevel called - to be implemented in Phase 3')
  }

  populateCollisionSystem() {
    // TODO: Implement in Phase 3
    console.log('populateCollisionSystem called - to be implemented in Phase 3')
  }

  assignLevelEffects() {
    // TODO: Implement in Phase 3
    console.log('assignLevelEffects called - to be implemented in Phase 3')
  }

  nextLevel() {
    // TODO: Implement in Phase 2
    console.log('nextLevel called - to be implemented in Phase 2')
  }

  update() {
    // TODO: Implement in Phase 2
    console.log('update called - to be implemented in Phase 2')
  }

  updateTransition() {
    // TODO: Implement in Phase 2
    console.log('updateTransition called - to be implemented in Phase 2')
  }

  updateGame() {
    // TODO: Implement in Phase 2
    console.log('updateGame called - to be implemented in Phase 2')
  }

  handleInput() {
    // TODO: Implement in Phase 2
    console.log('handleInput called - to be implemented in Phase 2')
  }

  jump() {
    // TODO: Implement in Phase 3
    console.log('jump called - to be implemented in Phase 3')
  }

  dash() {
    // TODO: Implement in Phase 3
    console.log('dash called - to be implemented in Phase 3')
  }

  updatePlayer() {
    // TODO: Implement in Phase 3
    console.log('updatePlayer called - to be implemented in Phase 3')
  }

  updateEnemies() {
    // TODO: Implement in Phase 3
    console.log('updateEnemies called - to be implemented in Phase 3')
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
    // TODO: Implement in Phase 2
    console.log('respawn called - to be implemented in Phase 2')
  }

  resetLevel(fullReset = true) {
    // TODO: Implement in Phase 2
    console.log('resetLevel called - to be implemented in Phase 2')
  }

  togglePause() {
    // TODO: Implement in Phase 2
    console.log('togglePause called - to be implemented in Phase 2')
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
} 