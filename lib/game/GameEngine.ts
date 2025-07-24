/**
 * Game Engine
 * 
 * Main game engine class that orchestrates all game systems.
 * Integrates the working game logic from PolishedTrippySideScroller
 * with the modular architecture.
 */

import { GameStateManager } from './GameStateManager'
import { PlayerManager } from './PlayerManager'
import { EnemyManager } from './EnemyManager'
import { CollisionSystem } from './CollisionSystem'
import { AudioManager } from './AudioManager'
import { InputManager } from './InputManager'
import { Renderer } from './Renderer'
import { LevelGenerator } from './LevelGenerator'
import { ObjectPool } from './ObjectPool'
import { saveToStorage, getFromStorage } from '../utils/storage'
import {
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
  PLAYER_START_X,
  PLAYER_START_Y,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_JUMP_POWER,
  PLAYER_COLOR,
  CAMERA_SMOOTHING,
  CAMERA_ZOOM_MIN
} from '../../constants/game'

export interface GameEngineCallbacks {
  onStateChange?: (oldState: string, newState: string) => void
  onLevelComplete?: (level: number, score: number) => void
  onGameOver?: (finalScore: number) => void
  onPauseToggle?: (paused: boolean) => void
  onLivesChanged?: (lives: number) => void
  onScoreChanged?: (score: number) => void
  onComboChanged?: (combo: number) => void
}

export class GameEngine {
  // Canvas and rendering
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number

  // Game state
  gameState!: string
  currentLevel!: number
  lives!: number
  score!: number
  combo!: number
  bestCombo!: number
  paused!: boolean
  isReversed!: boolean
  levelProgress!: number
  levelTarget!: number
  transitionTimer!: number
  levelEffects!: string[]
  frameCount!: number
  lastTime!: number
  fps!: number

  // Game entities
  player!: Player
  camera!: Camera
  // Legacy keys property removed - now handled by modular InputManager
  // Legacy input properties removed - now handled by modular InputManager
  effects!: Effects
  platforms!: Platform[]
  enemies!: Enemy[]
  collectibles!: Collectible[]
  backgroundStars!: BackgroundStar[]
  dataBleedEffects!: DataBleedEffect[]
  particles!: Particle[]

  // Audio
  audioCtx!: AudioContext | null
  soundEnabled!: boolean
  audioInitialized!: boolean
  bgmTimeoutId!: NodeJS.Timeout | null
  bgmTempo!: number
  bgmPitchMod!: number
  delayNode!: DelayNode | null
  feedbackGain!: GainNode | null
  masterGain!: GainNode | null

  // Input
  // Legacy gamepad properties removed - now handled by modular InputManager
  inputSetupDone!: boolean
  animationFrameId!: number | null

  // Camera and transitions
  cameraZoom!: number
  transitionPhase!: 'none' | 'zoomIn' | 'transition' | 'zoomOut'
  transitionProgress!: number
  levelStartInvincibility!: number

  // Effects Lab
  isEffectsLabUnlocked!: boolean
  activeCustomEffects!: any
  effectsLabSettings!: {
    wobble: { enabled: boolean; amplitude: number; frequency: number; speed: number }
    upsideDown: { enabled: boolean }
    invert: { enabled: boolean }
    mirrored: { enabled: boolean }
    melting: { enabled: boolean; intensity: number; speed: number }
    dataBleed: { enabled: boolean; intensity: number; duration: number }
  }
  effectsLabPresets!: Array<{ name: string; settings: any }>
  selectedPresetName!: string

  // Development mode
  private readonly DEV_MODE = false

  private callbacks: GameEngineCallbacks

  // Managers
  private gameStateManager: GameStateManager
  private playerManager!: PlayerManager
  private enemyManager!: EnemyManager
  private collisionSystem: CollisionSystem
  private audioManager: AudioManager
  private inputManager: InputManager
  private renderer: Renderer
  private levelGenerator: LevelGenerator
  private objectPool: ObjectPool<any>

  // Event handlers
  // Legacy input handlers removed - now handled by modular InputManager

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.width = CANVAS_WIDTH
    this.height = CANVAS_HEIGHT
    this.callbacks = callbacks

    // Initialize managers
    this.gameStateManager = new GameStateManager(callbacks)
    this.collisionSystem = new CollisionSystem({
      x: 0,
      y: 0,
      width: this.width * 10, // Large world bounds
      height: this.height * 10
    })
    this.audioManager = new AudioManager()
    this.inputManager = new InputManager({
      onStartGame: () => this.startGame(),
      onJump: () => this.jump(),
      onDash: () => this.dash(),
      onPause: () => this.togglePause(),
      onRestart: () => this.restart(),
      onToggleCollisionDebug: () => this.collisionSystem.setDebugMode(!this.collisionSystem['debugMode']),
      onValidateCollisionSystem: () => console.log(this.collisionSystem.validateSystemState()),
      onAudioContextResume: () => this.initAudioContext(),
      onSoundToggle: () => {
        this.soundEnabled = !this.soundEnabled
        if (this.soundEnabled) {
          this.startBGM()
        } else {
          this.stopBGM()
        }
      }
    })
    this.renderer = new Renderer(canvas, {
      width: this.width,
      height: this.height,
      fps: FPS,
      enableOptimization: true
    })
    this.levelGenerator = new LevelGenerator(this.width, this.height)
    this.objectPool = new ObjectPool({
      initialSize: 10,
      maxSize: 100,
      createFn: () => ({ reset: () => {} })
    })

    // Initialize game state
    this.init()
    
    // Start the game loop immediately
    this.gameLoop()
  }

  init(): void {
    // Initialize game state
    this.gameState = "start"
    this.currentLevel = INITIAL_LEVEL
    this.lives = INITIAL_LIVES
    this.score = INITIAL_SCORE
    this.combo = 0
    this.bestCombo = 0
    this.paused = false
    this.isReversed = false
    this.cameraZoom = CAMERA_ZOOM_MIN
    this.transitionPhase = 'none'
    this.transitionProgress = 0
    this.levelStartInvincibility = 0

    // Initialize Effects Lab state
    this.isEffectsLabUnlocked = this.DEV_MODE || getFromStorage('effectsLabUnlocked') || false
    this.activeCustomEffects = getFromStorage('activeCustomEffects') || null

    // Initialize Effects Lab settings
    this.effectsLabSettings = {
      wobble: { enabled: false, amplitude: 5, frequency: 0.05, speed: 0.002 },
      upsideDown: { enabled: false },
      invert: { enabled: false },
      mirrored: { enabled: false },
      melting: { enabled: false, intensity: 1, speed: 0.01 },
      dataBleed: { enabled: false, intensity: 1, duration: 20 }
    }

    this.effectsLabPresets = getFromStorage('effectsLabPresets') || []
    this.selectedPresetName = ''

    // Initialize game entities
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
      respawning: false
    }

    this.camera = { x: 0, y: 0, targetX: 0, targetY: 0, smoothing: CAMERA_SMOOTHING, zoom: CAMERA_ZOOM_MIN }
    // Legacy input properties removed - now handled by modular InputManager

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
      dataBleedEffects: [],
      particles: [],
      dreamFactor: 0, // Added dreamFactor
      dreamWaveFactor: 0 // Added dreamWaveFactor
    }

    this.levelProgress = 0
    this.levelTarget = LEVEL_TARGET
    this.platforms = []
    this.enemies = []
    this.collectibles = []
    this.backgroundStars = []
    this.dataBleedEffects = []
    this.particles = []

    this.frameCount = 0
    this.lastTime = performance.now()
    this.fps = FPS

    // Initialize managers with current state
    this.playerManager = new PlayerManager(this.player, this.collisionSystem, this.camera, this.width, this.height)
    this.enemyManager = new EnemyManager(this.collisionSystem, this.width, this.height)

    // Setup input using modular InputManager
    if (!this.inputSetupDone) {
      this.inputManager.setGameState(this.gameState)
      this.inputManager.setAudioInitialized(this.audioInitialized)
      this.inputSetupDone = true
    }

    // Initialize audio
    this.setupAudio()

    // Generate initial level
    this.generateLevel()
  }

  setupAudio(): void {
    this.audioCtx = null
    this.soundEnabled = true
    this.audioInitialized = false
    this.bgmTimeoutId = null
    this.bgmTempo = 500
    this.bgmPitchMod = 1.0
    this.delayNode = null
    this.feedbackGain = null
    this.masterGain = null
  }

  initAudioContext(): void {
    if (this.audioInitialized) return
    if (!this.audioCtx) {
      this.audioCtx = new ((window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext)()
    }
    if (this.audioCtx.state === "suspended") this.audioCtx.resume()
    this.masterGain = this.audioCtx.createGain()
    this.delayNode = this.audioCtx.createDelay(1.0)
    this.feedbackGain = this.audioCtx.createGain()
    this.delayNode.delayTime.value = 0.25
    this.feedbackGain.gain.value = 0.4
    this.masterGain.connect(this.delayNode)
    this.masterGain.connect(this.audioCtx.destination)
    this.delayNode.connect(this.audioCtx.destination)
    this.delayNode.connect(this.feedbackGain)
    this.feedbackGain.connect(this.delayNode)
    this.audioInitialized = true
    this.startBGM()
  }

  playSound(type: string): void {
    if (!this.soundEnabled || !this.audioCtx) return
    const now = this.audioCtx.currentTime
    const gainNode = this.audioCtx.createGain()
    gainNode.connect(this.audioCtx.destination)
    const oscillator = this.audioCtx.createOscillator()
    oscillator.connect(gainNode)
    
    switch (type) {
      case "jump":
        gainNode.gain.setValueAtTime(0.2, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
        oscillator.frequency.setValueAtTime(440, now)
        oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.2)
        break
      case "dash":
        gainNode.gain.setValueAtTime(0.3, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
        oscillator.type = "sawtooth"
        oscillator.frequency.setValueAtTime(100, now)
        oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.4)
        break
      case "collect":
        gainNode.gain.setValueAtTime(0.2, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
        oscillator.frequency.setValueAtTime(880, now)
        oscillator.frequency.exponentialRampToValueAtTime(1760, now + 0.15)
        break
      case "stomp":
        gainNode.gain.setValueAtTime(0.4, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
        oscillator.type = "square"
        oscillator.frequency.setValueAtTime(400, now)
        oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.3)
        break
      case "hit":
        gainNode.gain.setValueAtTime(0.5, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
        oscillator.type = "sawtooth"
        oscillator.frequency.setValueAtTime(200, now)
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.5)
        break
    }
    oscillator.start(now)
    oscillator.stop(now + 1)
  }

  scheduleNextNote(): void {
    if (!this.soundEnabled || !this.audioCtx || this.paused) return
    const now = this.audioCtx.currentTime
    const notes = [220.0, 261.63, 329.63, 392.0]
    const note = notes[Math.floor(Math.random() * notes.length)]
    const gainNode = this.audioCtx.createGain()
    gainNode.connect(this.masterGain!)
    gainNode.gain.setValueAtTime(0.08, now)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    const oscillator = this.audioCtx.createOscillator()
    oscillator.connect(gainNode)
    oscillator.type = "square"
    oscillator.frequency.setValueAtTime(note * this.bgmPitchMod, now)
    oscillator.start(now)
    oscillator.stop(now + 0.5)
    this.bgmTimeoutId = setTimeout(() => this.scheduleNextNote(), this.bgmTempo)
  }

  startBGM(): void {
    this.stopBGM()
    if (this.soundEnabled && this.audioInitialized && !this.paused) {
      this.scheduleNextNote()
    }
  }

  stopBGM(): void {
    if (this.bgmTimeoutId) {
      clearTimeout(this.bgmTimeoutId)
      this.bgmTimeoutId = null
    }
  }

  // Legacy input setup removed - now handled by modular InputManager

  // Legacy mobile controls removed - now handled by modular InputManager

  // Legacy gamepad support removed - now handled by modular InputManager

  // Legacy sound toggle setup removed - now handled by modular InputManager

  updateGamepadInput(): void {
    // Gamepad input is now handled by the modular InputManager
    // This method is kept for compatibility but delegates to InputManager
    if (this.inputManager) {
      // The InputManager handles gamepad input internally
      // No additional processing needed here
    }
  }

  generateLevel(): void {
    this.platforms = []
    this.enemies = []
    this.collectibles = []
    this.assignLevelEffects()

    const levelWidth = 2000 + this.currentLevel * 500
    this.levelTarget = levelWidth
    this.generateBackground()

    // Always use normal spawn position, regardless of mirrored effect
    this.player.x = 100
    this.player.y = 400

    const platformCount = 15 + this.currentLevel * 3
    
    // Always add platform at left side
    this.platforms.push({
      x: 0,
      y: 550,
      width: 200,
      height: 50,
      color: "#ff00ff",
      type: "normal",
      liquidPixels: [],
      distortionOffset: 0
    })
    
    for (let i = 1; i < platformCount; i++) {
      const x = (i * levelWidth) / platformCount + Math.random() * 100 - 50
      const y = 200 + Math.sin(i * 0.5) * 150 + Math.random() * 100
      const width = 80 + Math.random() * 120
      this.platforms.push({
        x,
        y,
        width,
        height: 20,
        color: `hsl(${(i * 30) % 360}, 70%, 50%)`,
        type: "normal",
        liquidPixels: [],
        distortionOffset: 0
      })
    }
    
    for (let i = 0; i < 5 + this.currentLevel; i++) {
      const platform = this.platforms[Math.floor(Math.random() * this.platforms.length)]
      this.enemies.push({
        x: platform.x + Math.random() * platform.width,
        y: platform.y - 15,
        width: 15,
        height: 15,
        velX: Math.random() < 0.5 ? 1 : -1,
        velY: 0,
        speed: 1 + Math.random(),
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        movementType: 'horizontal',
        startY: platform.y - 15,
        moveRange: 60,
        stompZoneActive: false
      })
    }
    
    for (let i = 0; i < 8 + this.currentLevel; i++) {
      const platform = this.platforms[Math.floor(Math.random() * this.platforms.length)]
      const color = Math.random() < 0.5 ? "#000" : "#fff"
      this.collectibles.push({
        x: platform.x + Math.random() * platform.width,
        y: platform.y - 30,
        width: 12,
        height: 12,
        color,
        collected: false,
        value: 100
      })
    }
  }

  generateBackground(): void {
    this.backgroundStars = []
    const starCount = 200
    const levelWidth = 2000 + this.currentLevel * 500
    for (let i = 0; i < starCount; i++) {
      this.backgroundStars.push({
        x: Math.random() * levelWidth,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.5,
        parallax: Math.random() * 0.5 + 0.1,
        hue: Math.random() * 60 + 180,
        pulseSpeed: 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        shape: 'circle',
        brightness: 1,
        glowRadius: 2
      })
    }
    
    // Update the background renderer with the new stars
    this.renderer.setBackgroundStars(this.backgroundStars)
  }

  assignLevelEffects(): void {
    const canvasEffectPool = ["wobble", "upsideDown", "invert", "mirrored", "melting", "dataBleed"]
    this.levelEffects = []
    // Remove isReversed logic entirely for mirrored effect

    // Filter out disorienting effects for level 1
    let availableEffects = [...canvasEffectPool]
    if (this.currentLevel === 1) {
      availableEffects = availableEffects.filter(effect => 
        effect !== "upsideDown" && effect !== "mirrored"
      )
    }

    // Shuffle the effect pool
    for (let i = availableEffects.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[availableEffects[i], availableEffects[j]] = [availableEffects[j], availableEffects[i]]
    }
    
    // Determine number of effects (1 or 2)
    const effectCount = Math.random() > 0.6 ? 2 : 1

    // Add random canvas effects
    for (let i = 0; i < effectCount && i < availableEffects.length; i++) {
      this.levelEffects.push(availableEffects[i])
    }
    // No isReversed logic here
  }

  startGame(): void {
    this.gameState = "playing"
    this.inputManager.setGameState(this.gameState)
    
    // Use callbacks instead of direct DOM manipulation
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange("start", "playing")
    }
    
    this.resetLevel()
    this.startBGM()
  }

  restart(): void {
    this.gameState = "playing"
    this.inputManager.setGameState(this.gameState)
    
    // Use callbacks instead of direct DOM manipulation
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange("gameover", "playing")
    }
    
    this.resetLevel()
    this.startBGM()
    if (this.animationFrameId == null) {
      this.gameLoop()
    }
  }

  nextLevel(): void {
    if (this.gameState === "transition") {
      console.warn("Preventing infinite transition loop")
      return
    }
    
    this.gameState = "transition"
    this.transitionPhase = 'zoomIn'
    this.transitionProgress = 0
    this.stopBGM()
    
    // Check if player has reached level 101 to unlock Effects Lab
    if (this.currentLevel >= 101) {
      saveToStorage('effectsLabUnlocked', true)
    }
  }

  resetEffectsLabToLevelDefault(): void {
    Object.keys(this.effectsLabSettings).forEach(key => {
      const effectKey = key as keyof typeof this.effectsLabSettings
      if (this.effectsLabSettings[effectKey] && typeof this.effectsLabSettings[effectKey] === 'object' && 'enabled' in this.effectsLabSettings[effectKey]) {
        (this.effectsLabSettings[effectKey] as any).enabled = this.levelEffects.includes(key)
      }
    })
  }

  saveEffectsLabPreset(presetName: string): void {
    const settingsCopy = JSON.parse(JSON.stringify(this.effectsLabSettings))
    const existingIndex = this.effectsLabPresets.findIndex(preset => preset.name === presetName)
    
    if (existingIndex >= 0) {
      this.effectsLabPresets[existingIndex].settings = settingsCopy
    } else {
      this.effectsLabPresets.push({
        name: presetName,
        settings: settingsCopy
      })
    }
    
    saveToStorage('effectsLabPresets', this.effectsLabPresets)
  }

  loadEffectsLabPreset(presetName: string): void {
    const preset = this.effectsLabPresets.find(p => p.name === presetName)
    if (preset) {
      this.effectsLabSettings = JSON.parse(JSON.stringify(preset.settings))
      this.selectedPresetName = presetName
    }
  }

  deleteEffectsLabPreset(presetName: string): void {
    this.effectsLabPresets = this.effectsLabPresets.filter(preset => preset.name !== presetName)
    saveToStorage('effectsLabPresets', this.effectsLabPresets)
    
    if (this.selectedPresetName === presetName) {
      this.selectedPresetName = ''
    }
  }

  update(): void {
    if (this.paused) return
    switch (this.gameState) {
      case "start":
        this.updateGamepadInput()
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

  updateGame(): void {
    this.updateBGMEffects()
    this.updateGamepadInput()
    if (this.player.dashCooldown > 0) this.player.dashCooldown--
    if (this.player.invulnerable > 0) this.player.invulnerable--
    if (this.levelStartInvincibility > 0) this.levelStartInvincibility--
    this.handleInput()
    this.updatePlayer()
    this.updateEnemies()
    this.updateEffects()
    this.updateDataBleed()
    this.updateCamera()
    this.checkCollisions()
    this.updateUI()

    // Always use normal progress calculation
    this.levelProgress = (this.player.x / this.levelTarget) * 100
    if (this.levelProgress >= 100) {
      this.nextLevel()
    }
  }

  updateBGMEffects(): void {
    if (!this.soundEnabled || this.paused) return
    const time = Date.now() / 2000
    const modulation = Math.sin(time)
    this.bgmTempo = 500 + modulation * 200
    this.bgmPitchMod = 1.0 + Math.sin(time * 4) * 0.05
  }

  updateTransition(): void {
    if (this.transitionPhase === 'zoomIn') {
      this.transitionProgress++
      const t = Math.min(1, this.transitionProgress / 60)
      this.cameraZoom = 1 + 1.5 * t
      if (t >= 1) {
        this.currentLevel++
        this.score += 1000 * this.currentLevel
        this.resetLevel(false)
        this.transitionPhase = 'transition'
        this.transitionProgress = 0
      }
    } else if (this.transitionPhase === 'transition') {
      this.transitionProgress++
      if (this.transitionProgress >= 60) {
        this.transitionPhase = 'zoomOut'
        this.transitionProgress = 0
      }
    } else if (this.transitionPhase === 'zoomOut') {
      this.transitionProgress++
      const t = Math.min(1, this.transitionProgress / 30)
      this.cameraZoom = 2.5 - 1.5 * t
      if (t >= 1) {
        this.cameraZoom = 1
        this.transitionPhase = 'none'
        this.gameState = 'playing'
        this.startBGM()
        this.camera.x = this.player.x - this.width / 3
        this.camera.y = 0
      }
    }
  }

  handleInput(): void {
    // Use modular InputManager to get current input state
    const input = this.inputManager.getPlayerInput()
    if (input.left) {
      this.player.velX = -this.player.speed;
    } else if (input.right) {
      this.player.velX = this.player.speed;
    } else {
      this.player.velX *= 0.8;
    }
    // Invert (reverse controls)
    if (this.levelEffects.includes("invert")) this.player.velX *= -1;
    // Remove mirrored/isReversed logic from controls
  }

  jump(): void {
    if (this.paused || this.gameState !== "playing") return
    const jumpDirection = -1
    if (this.player.grounded) {
      this.player.velY = jumpDirection * this.player.jumpPower
      this.player.grounded = false
      this.player.doubleJump = true
      this.playSound("jump")
    } else if (this.player.doubleJump) {
      this.player.velY = jumpDirection * this.player.jumpPower * 0.8
      this.player.doubleJump = false
      this.playSound("jump")
    }
  }

  dash(): void {
    if (this.paused || this.player.dashCooldown !== 0 || this.gameState !== "playing") return
    this.playSound("dash")
    const dashPower = 15
    const input = this.inputManager.getPlayerInput()
    let direction = input.left ? -1 : 1
    this.player.velX = direction * dashPower
    this.player.dashCooldown = 60
  }

  updatePlayer(): void {
    const gravity = 0.8
    this.player.velY += gravity
    this.player.x += this.player.velX
    this.player.y += this.player.velY
    this.player.trail.push({ x: this.player.x, y: this.player.y })
    if (this.player.trail.length > 10) this.player.trail.shift()
    if (this.player.x < 0) this.player.x = 0
    if (this.player.x > this.levelTarget) this.player.x = this.levelTarget
    if (this.player.y > this.height + 100) this.respawn()
  }

  updateEnemies(): void {
    this.enemies.forEach((enemy) => {
      enemy.x += enemy.velX * enemy.speed
      const onPlatform = this.platforms.find(
        (p) =>
          enemy.x >= p.x &&
          enemy.x <= p.x + p.width &&
          enemy.y >= p.y - enemy.height &&
          enemy.y <= p.y
      )
      if (
        onPlatform &&
        (enemy.x <= onPlatform.x ||
          enemy.x + enemy.width >= onPlatform.x + onPlatform.width)
      )
        enemy.velX *= -1
    })
  }

  updateEffects(): void {
    const isCanvasEffectEnabled = (effectName: string) => {
      if (this.activeCustomEffects) {
        const effect = this.activeCustomEffects[effectName as keyof typeof this.activeCustomEffects]
        return effect && typeof effect === 'object' && 'enabled' in effect && (effect as any).enabled
      } else {
        return this.levelEffects.includes(effectName)
      }
    }

    // Update dream effects based on level effects
    // Dream effects are active when certain level effects are present
    const hasDreamEffects = isCanvasEffectEnabled("melting") || 
                           isCanvasEffectEnabled("dataBleed") || 
                           isCanvasEffectEnabled("wobble")
    
    this.effects.dreamFactor = hasDreamEffects ? 1.0 : 0.0
    this.effects.dreamWaveFactor = hasDreamEffects ? 0.8 : 0.0
  }

  updateDataBleed(): void {
    this.dataBleedEffects = this.dataBleedEffects.filter((effect) => {
      effect.duration--
      return effect.duration > 0
    })
  }

  updateCamera(): void {
    this.camera.targetX = this.player.x - this.width / 3
    this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothing
    this.camera.x = Math.max(0, Math.min(this.camera.x, this.levelTarget - this.width))
  }

  checkCollisions(): void {
    this.player.grounded = false
    this.platforms.forEach((p) => {
      if (
        this.player.x < p.x + p.width &&
        this.player.x + this.player.width > p.x &&
        this.player.y + this.player.height > p.y &&
        this.player.y < p.y
      ) {
        if (this.player.velY >= 0) {
          this.player.y = p.y - this.player.height
          this.player.velY = 0
          this.player.grounded = true
          this.player.doubleJump = false  // Reset double jump when grounded
          this.combo = 0
        }
      }
    })
    
    this.enemies.forEach((enemy, index) => {
      if (
        this.player.x < enemy.x + enemy.width &&
        this.player.x + this.player.width > enemy.x &&
        this.player.y < enemy.y + enemy.height &&
        this.player.y + this.player.height > enemy.y
      ) {
        if (this.player.invulnerable > 0 || this.levelStartInvincibility > 0) return
        const isStomping = (this.player.velY > 0 && this.player.y + this.player.height < enemy.y + enemy.height)
        if (isStomping) {
          this.triggerDataBleed(enemy.x, enemy.y)
          this.enemies.splice(index, 1)
          this.score += 250
          this.combo++
          if (this.combo > this.bestCombo) this.bestCombo = this.combo
          const jumpDirection = -1
          this.player.velY = jumpDirection * this.player.jumpPower * 0.6
          this.playSound("stomp")
        } else {
          this.respawn()
        }
      }
    })
    
    this.collectibles.forEach((c) => {
      if (
        !c.collected &&
        this.player.x < c.x + c.width &&
        this.player.x + this.player.width > c.x &&
        this.player.y < c.y + c.height &&
        this.player.y + this.player.height > c.y
      ) {
        c.collected = true
        this.score += c.value
        this.playSound("collect")
      }
    })
  }

  triggerDataBleed(x: number, y: number): void {
    const duration = this.combo >= 5 ? 60 : 20
    this.dataBleedEffects.push({
      x: x,
      y: y,
      duration: duration,
      size: Math.random() * 80 + 50,
    })
  }

  respawn(): void {
    this.lives--
    this.combo = 0
    this.playSound("hit")
    if (this.lives <= 0) {
      this.gameState = "gameover"
      this.inputManager.setGameState(this.gameState)
      
      // Use callbacks instead of direct DOM manipulation
      if (this.callbacks.onGameOver) {
        this.callbacks.onGameOver(this.score)
      }
      if (this.callbacks.onStateChange) {
        this.callbacks.onStateChange("playing", "gameover")
      }
      
      this.stopBGM()
    } else {
      // Always respawn player at normal position
      this.player.x = 100
      this.player.y = 400
      this.player.velX = 0
      this.player.velY = 0
      this.player.grounded = false
      this.player.doubleJump = false  // Reset double jump on respawn
      this.player.invulnerable = 180
    }
  }

  resetLevel(fullReset = true): void {
    if (fullReset) {
      this.score = 0
      this.lives = 3
      this.combo = 0
      this.currentLevel = 1
      if (!this.activeCustomEffects?.mirrored?.enabled) {
        this.isReversed = false
      }
    }
    // Always reset player velocity and Y position on any level reset
    this.player.velX = 0
    this.player.velY = 0
    this.player.y = 400
    this.generateLevel()
    this.levelStartInvincibility = 120
  }

  togglePause(): void {
    if (this.gameState !== "playing" && !this.paused) return
    this.paused = !this.paused
    this.inputManager.setGameState(this.paused ? "paused" : "playing")
    
    // Use callbacks instead of direct DOM manipulation
    if (this.callbacks.onPauseToggle) {
      this.callbacks.onPauseToggle(this.paused)
    }
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.gameState, this.paused ? "paused" : "playing")
    }
    
    if (this.paused) {
      this.stopBGM()
    } else {
      this.startBGM()
    }
  }

  render(): void {
    if (this.gameState === "transition") {
      this.renderTransition()
      return
    }

    const isCanvasEffectEnabled = (effectName: string) => {
      if (this.activeCustomEffects) {
        const effect = this.activeCustomEffects[effectName as keyof typeof this.activeCustomEffects]
        return effect && typeof effect === 'object' && 'enabled' in effect && (effect as any).enabled
      } else {
        return this.levelEffects.includes(effectName)
      }
    }

    // Apply canvas effects before rendering
    this.ctx.save()

    if (isCanvasEffectEnabled("upsideDown")) {
      this.ctx.translate(0, this.height)
      this.ctx.scale(1, -1)
    }
    
    if (isCanvasEffectEnabled("mirrored")) {
      this.ctx.translate(this.width, 0)
      this.ctx.scale(-1, 1)
    }
    
    if (isCanvasEffectEnabled("invert")) {
      this.ctx.filter = "invert(1) hue-rotate(180deg)"
    }

    // Use the original rendering approach for compatibility
    this.renderToContext(this.ctx)
    
    this.ctx.restore()
  }

  /**
   * Render using the new modular renderer system
   */
  renderWithModularRenderer(): void {
    // Update renderer state with current game state
    this.renderer.updateState({
      player: this.player,
      enemies: this.enemies,
      platforms: this.platforms,
      collectibles: this.collectibles,
      camera: this.camera,
      effects: this.effects,
      ui: {
        score: this.score,
        lives: this.lives,
        level: this.currentLevel,
        soundEnabled: this.soundEnabled
      },
      frameCount: this.frameCount,
      lastTime: this.lastTime,
      deltaTime: (performance.now() - this.lastTime) / 1000,
      fps: this.fps
    })

    // Update background stars in the renderer
    this.renderer.setBackgroundStars(this.backgroundStars)

    // Render the game using the modular renderer
    this.renderer.render()
  }

  renderToContext(ctx: CanvasRenderingContext2D): void {
    this.renderBackgroundToContext(ctx)
    this.renderDataBleedToContext(ctx)

    ctx.translate(-this.camera.x, -this.camera.y)

    const now = Date.now()
    
    const isCanvasEffectEnabled = (effectName: string) => {
      if (this.activeCustomEffects) {
        const effect = this.activeCustomEffects[effectName as keyof typeof this.activeCustomEffects]
        return effect && typeof effect === 'object' && 'enabled' in effect && (effect as any).enabled
      } else {
        return this.levelEffects.includes(effectName)
      }
    }
    
    const wobbleActive = isCanvasEffectEnabled("wobble")
    const meltingActive = isCanvasEffectEnabled("melting")
    
    const wobbleSettings = this.activeCustomEffects?.wobble || { amplitude: 5, frequency: 0.05, speed: 0.002 }
    const wobbleAmplitude = wobbleSettings.amplitude || 5
    const wobbleFrequency = wobbleSettings.frequency || 0.05
    const wobbleSpeed = wobbleSettings.speed || 0.002
    
    const meltingSettings = this.activeCustomEffects?.melting || { intensity: 1, speed: 0.01 }
    const meltingIntensity = meltingSettings.intensity || 1
    const meltingSpeed = meltingSettings.speed || 0.01

    // Draw platforms
    this.platforms.forEach((p) => {
      let yOffset = 0
      let width = p.width
      let height = p.height
      
      if (wobbleActive) {
        yOffset = Math.sin(p.x * wobbleFrequency + now * wobbleSpeed) * wobbleAmplitude
      }
      
      if (meltingActive) {
        const meltOffset = Math.sin(p.x * 0.02 + now * meltingSpeed) * meltingIntensity * 2
        yOffset += meltOffset
        height += Math.abs(meltOffset) * 0.5
        width += Math.abs(meltOffset) * 0.3
      }
      
      ctx.fillStyle = p.color
      ctx.fillRect(p.x, p.y + yOffset, width, height)
    })

    // Draw enemies
    const drawWithEffects = (obj: any) => {
      let yOffset = 0
      let xOffset = 0
      let width = obj.width
      let height = obj.height
      
      if (wobbleActive) {
        yOffset = Math.sin(obj.x * wobbleFrequency + now * wobbleSpeed) * wobbleAmplitude
      }
      
      if (meltingActive) {
        const meltOffset = Math.sin(obj.x * 0.02 + now * meltingSpeed) * meltingIntensity * 2
        yOffset += meltOffset
        height += Math.abs(meltOffset) * 0.5
        width += Math.abs(meltOffset) * 0.3
      }
      
      ctx.fillRect(obj.x + xOffset, obj.y + yOffset, width, height)
    }

    this.enemies.forEach((e) => {
      ctx.fillStyle = e.color
      drawWithEffects(e)
    })
    
    // Draw collectibles
    this.collectibles.forEach((c) => {
      if (!c.collected) {
        ctx.fillStyle = c.color
        const cx = c.x + c.width / 2
        const cy = c.y + c.height / 2
        const size = c.width
        ctx.beginPath()
        ctx.moveTo(cx, cy - size / 2)
        ctx.lineTo(cx - size / 2, cy + size / 2)
        ctx.lineTo(cx + size / 2, cy + size / 2)
        ctx.closePath()
        ctx.fill()
      }
    })

    // Draw player trail
    this.player.trail.forEach((point: { x: number; y: number }, index: number) => {
      ctx.fillStyle = `rgba(0, 255, 255, ${index * 0.05})`
      let yOffset = 0
      let width = this.player.width
      let height = this.player.height
      
      if (wobbleActive) {
        yOffset = Math.sin(point.x * wobbleFrequency + now * wobbleSpeed) * wobbleAmplitude
      }
      
      if (meltingActive) {
        const meltOffset = Math.sin(point.x * 0.02 + now * meltingSpeed) * meltingIntensity * 2
        yOffset += meltOffset
        height += Math.abs(meltOffset) * 0.5
        width += Math.abs(meltOffset) * 0.3
      }
      
      ctx.fillRect(point.x, point.y + yOffset, width, height)
    })

    // Draw player
    ctx.fillStyle = (this.player.invulnerable > 0 || this.levelStartInvincibility > 0) && Math.floor(now / 100) % 2 === 0
      ? "white"
      : this.player.color
    drawWithEffects(this.player)
  }

  renderBackgroundToContext(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, this.width, this.height)
    
    const camX = this.camera.x
    this.backgroundStars.forEach((star) => {
      const drawX = (star.x - camX * star.parallax) % this.width
      const wrappedX = drawX < 0 ? drawX + this.width : drawX
      ctx.fillStyle = `hsl(${star.hue}, 80%, 70%)`
      ctx.fillRect(wrappedX, star.y, star.size, star.size)
    })
  }

  renderDataBleedToContext(ctx: CanvasRenderingContext2D): void {
    if (this.dataBleedEffects.length === 0) return
    this.dataBleedEffects.forEach((effect) => {
      const screenX = effect.x - this.camera.x
      const screenY = effect.y - this.camera.y
      if (
        screenX > -effect.size &&
        screenX < this.width &&
        screenY > -effect.size &&
        screenY < this.height
      ) {
        const sx = Math.random() * (this.width - effect.size)
        const sy = Math.random() * (this.height - effect.size)
        const opacity = effect.duration / (this.combo >= 5 ? 60 : 20)
        ctx.save()
        ctx.globalAlpha = opacity * 0.8
        ctx.drawImage(
          this.canvas,
          sx,
          sy,
          effect.size,
          effect.size,
          screenX,
          screenY,
          effect.size,
          effect.size
        )
        ctx.restore()
      }
    })
  }

  renderTransition(): void {
    let zoom = this.cameraZoom
    let rotation = 0
    
    const isEffectEnabled = (effectName: string) => {
      if (this.activeCustomEffects) {
        const effect = this.activeCustomEffects[effectName as keyof typeof this.activeCustomEffects]
        return effect && typeof effect === 'object' && 'enabled' in effect && (effect as any).enabled
      } else {
        return this.levelEffects.includes(effectName)
      }
    }
    
    if (this.transitionPhase === 'zoomIn') {
      const t = Math.min(1, this.transitionProgress / 60)
      zoom = 1 + 1.5 * t
    } else if (this.transitionPhase === 'transition') {
      zoom = 2.5
      const t = Math.min(1, this.transitionProgress / 60)
      rotation = t * Math.PI * 2
    } else if (this.transitionPhase === 'zoomOut') {
      const t = Math.min(1, this.transitionProgress / 30)
      zoom = 2.5 - 1.5 * t
    }
    
    this.ctx.save()
    
    this.ctx.translate(this.width / 2, this.height / 2)
    this.ctx.scale(zoom, zoom)
    this.ctx.rotate(rotation)
    
    if (isEffectEnabled("mirrored")) {
      this.ctx.scale(-1, 1)
    }
    
    this.ctx.translate(-this.player.x - this.player.width / 2, -this.player.y - this.player.height / 2)
    
    this.renderToContext(this.ctx)
    
    this.ctx.restore()
  }

  updateUI(): void {
    const lives = document.getElementById("lives")
    const score = document.getElementById("score")
    const level = document.getElementById("level")
    const combo = document.getElementById("combo")
    
    if (lives) lives.textContent = this.lives.toString()
    if (score) score.textContent = this.score.toString()
    if (level) level.textContent = this.currentLevel.toString()
    if (combo) combo.textContent = this.combo.toString()
  }

  gameLoop(): void {
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop())
    this.update()
    this.render()
  }

  cleanup(): void {
    // Clean up modular InputManager
    if (this.inputManager) {
      this.inputManager.cleanup()
    }
    
    this.stopBGM()
  }
} 