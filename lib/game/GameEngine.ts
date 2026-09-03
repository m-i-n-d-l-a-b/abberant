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
import { EffectsRenderer } from './EffectsRenderer'
import { EffectsDirector } from './EffectsDirector'
import { LevelGenerator } from './LevelGenerator'
import { ObjectPool } from './ObjectPool'
import { ArcadeAudio } from './ArcadeAudio'
import { createStarfield, renderStarfield } from './Starfield'
import { WorldStreamer } from './WorldStreamer'
import { TONE, tone } from './palette'
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
  INITIAL_SCORE,
  PLAYER_START_X,
  PLAYER_START_Y,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_JUMP_POWER,
  PLAYER_COLOR,
  CAMERA_SMOOTHING,
  CAMERA_ZOOM_MIN,
  EFFECTS_LAB_UNLOCK_DISTANCE,
  EFFECT_ROLL_INTERVAL_MS,
  EFFECT_TIER_DISTANCE,
  ENEMY_SCORE_VALUE,
  RESPAWN_INVULNERABLE_FRAMES
} from '../../constants/game'

/**
 * Backdrop density and span.
 *
 * Deliberately not the shared STAR_COUNT / BASE_LEVEL_WIDTH constants: those
 * describe LevelGenerator's world, and this engine has always drawn a denser
 * field over a narrower strip.
 */
const BACKDROP_STAR_COUNT = 200
const BACKDROP_BASE_WIDTH = 2000
const BACKDROP_WIDTH_PER_LEVEL = 500

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
  lives!: number
  score!: number
  combo!: number
  bestCombo!: number
  paused!: boolean
  isReversed!: boolean
  /** Furthest world x reached this run. Drives effect intensity. */
  furthestX!: number
  /** Canvas effects currently running. Re-rolled on a timer, not per level. */
  activeEffects!: string[]
  /** Timestamp of the last effect roll, in ms. */
  lastEffectRollAt!: number
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
  //
  // The graph itself lives in ArcadeAudio so SnakeEngine can share it. These
  // accessors keep GameEngine's original field names working for callers.
  private audio: ArcadeAudio = new ArcadeAudio(() => this.paused)

  get audioCtx(): AudioContext | null { return this.audio.audioCtx }
  get soundEnabled(): boolean { return this.audio.soundEnabled }
  set soundEnabled(value: boolean) { this.audio.setSoundEnabled(value) }
  get audioInitialized(): boolean { return this.audio.audioInitialized }
  get bgmTimeoutId(): ReturnType<typeof setTimeout> | null { return this.audio.bgmTimeoutId }
  get bgmTempo(): number { return this.audio.bgmTempo }
  get bgmPitchMod(): number { return this.audio.bgmPitchMod }
  get delayNode(): DelayNode | null { return this.audio.delayNode }
  get feedbackGain(): GainNode | null { return this.audio.feedbackGain }
  get masterGain(): GainNode | null { return this.audio.masterGain }

  // Input
  // Legacy gamepad properties removed - now handled by modular InputManager
  inputSetupDone!: boolean
  animationFrameId!: number | null

  // Camera
  cameraZoom!: number
  /** Frames of grace after a run starts or the player respawns. */
  levelStartInvincibility!: number
  /** Last spot the player stood on solid ground, for respawns. */
  lastSafeX!: number
  lastSafeY!: number

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
  private effectsRenderer: EffectsRenderer
  private effectsDirector: EffectsDirector
  private levelGenerator: LevelGenerator
  private objectPool: ObjectPool<any>
  private world: WorldStreamer

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
      }
    })
    this.renderer = new Renderer(canvas, {
      width: this.width,
      height: this.height,
      fps: FPS,
      enableOptimization: true
    })
    // Post-processing runs as a pass over the finished frame, so it only needs
    // canvas dimensions. Its own dataBleed layer is switched off because
    // renderDataBleedToContext already draws those.
    this.effectsRenderer = new EffectsRenderer(this.width, this.height)
    this.effectsRenderer.setLayerVisibility('dataBleed', false)
    this.effectsDirector = new EffectsDirector()
    this.levelGenerator = new LevelGenerator(this.width, this.height)
    this.world = new WorldStreamer()
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
    this.lives = INITIAL_LIVES
    this.score = INITIAL_SCORE
    this.combo = 0
    this.bestCombo = 0
    this.paused = false
    this.isReversed = false
    this.cameraZoom = CAMERA_ZOOM_MIN
    this.levelStartInvincibility = 0
    this.furthestX = 0
    this.lastEffectRollAt = 0
    this.lastSafeX = PLAYER_START_X
    this.lastSafeY = PLAYER_START_Y

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

    // Lay out the opening stretch of world
    this.resetWorld()
  }

  setupAudio(): void {
    this.audio.reset()
  }

  initAudioContext(): void {
    this.audio.init()
  }

  playSound(type: string): void {
    this.audio.playSound(type)
  }

  scheduleNextNote(): void {
    this.audio.scheduleNextNote()
  }

  startBGM(): void {
    this.audio.startBGM()
  }

  stopBGM(): void {
    this.audio.stopBGM()
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

  /**
   * Start a fresh world and put the player at its opening ledge.
   *
   * Replaces the old generateLevel: nothing is built up front beyond the first
   * window of chunks, and nothing scales with a level number.
   */
  resetWorld(): void {
    this.world.reset()
    this.player.x = PLAYER_START_X
    this.player.y = PLAYER_START_Y
    this.furthestX = PLAYER_START_X
    this.lastSafeX = PLAYER_START_X
    this.lastSafeY = PLAYER_START_Y

    this.world.update(this.player.x)
    this.syncWorld()

    this.generateBackground()
    this.rollEffects(performance.now())
  }

  /** Point the engine's entity arrays at the streamer's current window. */
  private syncWorld(): void {
    this.platforms = this.world.platforms
    this.enemies = this.world.enemies
    this.collectibles = this.world.collectibles
  }

  generateBackground(): void {
    this.backgroundStars = createStarfield(
      BACKDROP_STAR_COUNT,
      BACKDROP_BASE_WIDTH,
      this.height
    )

    // Update the background renderer with the new stars
    this.renderer.setBackgroundStars(this.backgroundStars)
  }

  /**
   * How hard the effects should hit, from how far this run has come.
   *
   * The level number used to carry this. Distance is the continuous stand-in:
   * it only ever goes up, and it is the thing the player is actually doing.
   */
  get effectTier(): number {
    return 1 + Math.floor(this.furthestX / EFFECT_TIER_DISTANCE)
  }

  /**
   * Re-roll which effects are running.
   *
   * Called on a timer rather than at a level boundary, so a run keeps changing
   * character without ever stopping.
   */
  rollEffects(now: number): void {
    this.lastEffectRollAt = now

    const canvasEffectPool = ["wobble", "upsideDown", "invert", "mirrored", "melting", "dataBleed"]
    let available = [...canvasEffectPool]

    // The first stretch of a run stays readable: the two effects that turn the
    // screen over are held back until the player has some distance behind them.
    if (this.effectTier <= 1) {
      available = available.filter(
        (effect) => effect !== "upsideDown" && effect !== "mirrored"
      )
    }

    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const swap = available[i]
      available[i] = available[j]
      available[j] = swap
    }

    const effectCount = Math.random() > 0.6 ? 2 : 1
    this.activeEffects = available.slice(0, effectCount)

    // Post-processing is picked separately: it stacks on top of the canvas
    // effects rather than competing with them for the same slots.
    this.effectsDirector.selectForLevel(this.effectTier)
  }

  startGame(): void {
    this.gameState = "playing"
    this.inputManager.setGameState(this.gameState)
    
    // Use callbacks instead of direct DOM manipulation
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange("start", "playing")
    }
    
    this.resetRun()
    this.startBGM()
  }

  restart(): void {
    this.gameState = "playing"
    this.inputManager.setGameState(this.gameState)
    
    // Use callbacks instead of direct DOM manipulation
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange("gameover", "playing")
    }
    
    this.resetRun()
    this.startBGM()
    if (this.animationFrameId == null) {
      this.gameLoop()
    }
  }

  /**
   * Unlock the Effects Lab once a run has come far enough.
   *
   * The gate used to be a level number; distance is its continuous equivalent.
   */
  private checkEffectsLabUnlock(): void {
    if (this.isEffectsLabUnlocked) return
    if (this.furthestX < EFFECTS_LAB_UNLOCK_DISTANCE) return
    this.isEffectsLabUnlocked = true
    saveToStorage('effectsLabUnlocked', true)
  }

  resetEffectsLabToLevelDefault(): void {
    Object.keys(this.effectsLabSettings).forEach(key => {
      const effectKey = key as keyof typeof this.effectsLabSettings
      if (this.effectsLabSettings[effectKey] && typeof this.effectsLabSettings[effectKey] === 'object' && 'enabled' in this.effectsLabSettings[effectKey]) {
        (this.effectsLabSettings[effectKey] as any).enabled = this.activeEffects.includes(key)
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
      case "gameover":
        break
    }
  }

  updateGame(): void {
    const now = performance.now()

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

    // Endless world: extend it ahead of the player, drop what is far behind.
    this.furthestX = Math.max(this.furthestX, this.player.x)
    this.world.update(this.player.x)
    this.syncWorld()

    if (now - this.lastEffectRollAt >= EFFECT_ROLL_INTERVAL_MS) {
      this.rollEffects(now)
    }

    this.checkEffectsLabUnlock()
  }

  updateBGMEffects(): void {
    this.audio.updateBGMEffects()
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
    // `invert` used to reverse the controls as well as the picture. On a
    // monochrome canvas it is the polarity switch - black marks on a white page
    // instead of the reverse - and a look the player is meant to be able to
    // read, not a trick. Reversing movement on top of that pinned them against
    // the left wall for as long as the effect was up.
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
    if (this.player.y > this.height + 100) this.respawn()
  }

  updateEnemies(): void {
    // A snapshot: stomping removes the enemy from the live list, and splicing
    // the array being iterated would skip whichever enemy followed it.
    const enemies = [...this.enemies]
    enemies.forEach((enemy) => {
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
        return this.activeEffects.includes(effectName)
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
    this.camera.x = Math.max(0, this.camera.x)
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
          // Remember this footing, so a fall costs progress rather than the run.
          this.lastSafeX = this.player.x
          this.lastSafeY = this.player.y
        }
      }
    })
    
    this.enemies.forEach((enemy) => {
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
          this.world.removeEnemy(enemy)
          this.score += ENEMY_SCORE_VALUE
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
        this.world.consumeCollectible(c)
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
      // Back to the last ground the player stood on. Sending them to the world
      // origin would undo a whole run's travel, which an endless world makes
      // far more punishing than a level did.
      this.player.x = this.lastSafeX
      this.player.y = this.lastSafeY
      this.player.velX = 0
      this.player.velY = 0
      this.player.grounded = false
      this.player.doubleJump = false  // Reset double jump on respawn
      this.player.invulnerable = RESPAWN_INVULNERABLE_FRAMES

      // The window has to follow them back, or they land in unbuilt world.
      this.world.update(this.player.x)
      this.syncWorld()
    }
  }

  /**
   * Start the run over.
   *
   * There is no partial reset any more - without levels, the only thing that
   * restarts is the whole run.
   */
  resetRun(): void {
    this.score = 0
    this.lives = INITIAL_LIVES
    this.combo = 0
    if (!this.activeCustomEffects?.mirrored?.enabled) {
      this.isReversed = false
    }

    this.player.velX = 0
    this.player.velY = 0
    this.resetWorld()
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
    const isCanvasEffectEnabled = (effectName: string) => {
      if (this.activeCustomEffects) {
        const effect = this.activeCustomEffects[effectName as keyof typeof this.activeCustomEffects]
        return effect && typeof effect === 'object' && 'enabled' in effect && (effect as any).enabled
      } else {
        return this.activeEffects.includes(effectName)
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

    // Post-processing runs after restore so it works on the finished frame in
    // normal coordinates, unaffected by the transforms above.
    this.applyPostProcessing()
  }

  /**
   * Drive this frame's post-processing factors and apply them.
   *
   * EffectsDirector writes the factors; EffectsRenderer reads them and skips
   * anything still at neutral, so an empty active set costs one no-op pass.
   */
  private applyPostProcessing(): void {
    const now = performance.now()

    this.effectsDirector.update(this.effects, now)

    this.effectsRenderer.render({
      ctx: this.ctx,
      width: this.width,
      height: this.height,
      camera: this.camera,
      effects: this.effects,
      frameCount: this.frameCount,
      deltaTime: (now - this.lastTime) / 1000,
      now
    })
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
        return this.activeEffects.includes(effectName)
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
      ctx.fillStyle = tone(TONE.PLAYER, index * 0.05)
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
    // The invulnerability flash needs a value the player's own does not reach,
    // so it drops to terrain grey rather than brightening past white.
    ctx.fillStyle = (this.player.invulnerable > 0 || this.levelStartInvincibility > 0) && Math.floor(now / 100) % 2 === 0
      ? tone(TONE.TERRAIN)
      : this.player.color
    drawWithEffects(this.player)
  }

  renderBackgroundToContext(ctx: CanvasRenderingContext2D): void {
    renderStarfield(ctx, this.backgroundStars, this.camera.x, this.width, this.height)
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

  updateUI(): void {
    const lives = document.getElementById("lives")
    const score = document.getElementById("score")
    const combo = document.getElementById("combo")

    if (lives) lives.textContent = this.lives.toString()
    if (score) score.textContent = this.score.toString()
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