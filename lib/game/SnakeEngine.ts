/**
 * Snake Engine
 *
 * The Snake game mode. A grid simulation rather than a physics one, but it
 * runs on the same subsystems as the side-scroller: ArcadeAudio for the
 * chiptune loop and effects, InputManager for keyboard, touch and gamepad,
 * the starfield for the backdrop, and EffectsDirector plus EffectsRenderer for
 * the post-processing pass that gives both modes their look.
 *
 * Snake has no levels. The board is laid out when a run starts and again only
 * when the snake dies. What a level would have driven - speed, and which
 * visual effects run - rides on the snake's own length instead, so difficulty
 * follows the thing the player is already watching and falls back on its own
 * when they lose a life.
 *
 * It exposes the same public state and lifecycle methods as GameEngine, so
 * useGame can drive either one without knowing which is which.
 */

import { ArcadeAudio } from './ArcadeAudio'
import { EffectsDirector } from './EffectsDirector'
import { EffectsRenderer } from './EffectsRenderer'
import { InputManager } from './InputManager'
import { SnakeRenderer } from './SnakeRenderer'
import { createStarfield } from './Starfield'
import { GameEngineCallbacks } from './GameEngine'
import { TONE, tone } from './palette'
import {
  BackgroundStar,
  Camera,
  DataBleedEffect,
  Effects,
  GridCell,
  GridDirection,
  Particle
} from '../../types/game'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FPS,
  INITIAL_LIVES,
  INITIAL_SCORE,
  SNAKE_BACKGROUND_DRIFT,
  SNAKE_BASE_STEP_MS,
  SNAKE_CANVAS_EFFECTS_BY_TIER,
  SNAKE_CANVAS_EFFECT_MAX_CONCURRENT,
  SNAKE_CELL_SIZE,
  SNAKE_COLS,
  SNAKE_COMBO_BONUS,
  SNAKE_CRASH_BLEED_DURATION,
  SNAKE_CRASH_DEBRIS_PARTICLES,
  SNAKE_CRASH_FREEZE_FRAMES,
  SNAKE_CRASH_PARTICLES,
  SNAKE_EAT_CORE_PARTICLES,
  SNAKE_EAT_CORE_SPEED_MAX,
  SNAKE_EAT_CORE_SPEED_MIN,
  SNAKE_EAT_FLASH_DURATION,
  SNAKE_EAT_FLASH_SIZE,
  SNAKE_EAT_RING_PARTICLES,
  SNAKE_EAT_RING_SPEED,
  SNAKE_FOOD_SCORE,
  SNAKE_GROWTH_PER_FOOD,
  SNAKE_MIN_STEP_MS,
  SNAKE_ROWS,
  SNAKE_SEGMENTS_PER_TIER,
  SNAKE_STAR_COUNT,
  SNAKE_START_LENGTH,
  SNAKE_STEP_MS_PER_SEGMENT,
  SNAKE_TURN_BUFFER
} from '../../constants/game'

/** One burst of particles: how many, how fast, how big, and how spread. */
interface ParticleBurst {
  color: string
  count: number
  speedMin: number
  speedMax: number
  sizeMin: number
  sizeMax: number
  /** Evenly spaced angles instead of random ones - a shockwave, not debris. */
  ring?: boolean
}

/** Options for tests: a seeded RNG, and a loop that does not start itself. */
export interface SnakeEngineOptions {
  random?: () => number
  autoStart?: boolean
}

/** Longest single frame the simulation will catch up on, in ms. */
const MAX_FRAME_DELTA_MS = 250

/**
 * Ceiling on live particles, so a long streak cannot grow the array forever.
 *
 * Sized so a full eat explosion still lands intact on top of whatever is left
 * of the one before it - clipping the tail of a blast is more noticeable than
 * carrying a few dozen extra particles for half a second.
 */
const MAX_PARTICLES = 360

/** Life a particle spawns with. EffectsRenderer fades alpha as life/100. */
const PARTICLE_LIFE = 100

/**
 * Life lost per frame. EffectsRenderer reads life/100 as alpha, so life cannot
 * start above 100 - a longer-dwelling explosion has to come from a slower
 * decay rather than a bigger number.
 */
const PARTICLE_LIFE_DECAY = 1.9

/** How fast a crash smear fades, in EffectsRenderer duration units per frame. */
const DATA_BLEED_DECAY = 25

/** Radius of the smear left where the snake crashed. */
const DATA_BLEED_SIZE = 90

export class SnakeEngine {
  // Canvas
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number

  // Game state, named to match GameEngine so useGame can read either engine.
  gameState: string = 'start'
  lives: number = INITIAL_LIVES
  score: number = INITIAL_SCORE
  combo: number = 0
  bestCombo: number = 0
  paused: boolean = false
  animationFrameId: number | null = null
  frameCount: number = 0
  lastTime: number = 0
  fps: number = FPS

  // Board
  snake: GridCell[] = []
  direction: GridDirection = { x: 1, y: 0 }
  food: GridCell = { x: 0, y: 0 }
  /** Segments still owed from food already eaten. */
  pendingGrowth: number = 0
  /** Frames left of the post-crash freeze. */
  crashFreeze: number = 0

  // Visuals
  /** Canvas effects currently running, chosen by difficulty tier. */
  activeEffects: string[] = []
  effects: Effects
  camera: Camera = { x: 0, y: 0, targetX: 0, targetY: 0, smoothing: 1, zoom: 1 }
  particles: Particle[] = []
  dataBleedEffects: DataBleedEffect[] = []
  backgroundStars: BackgroundStar[] = []
  backgroundScroll: number = 0

  private callbacks: GameEngineCallbacks
  private random: () => number
  private audio: ArcadeAudio = new ArcadeAudio(() => this.paused)
  private inputManager: InputManager
  private effectsDirector: EffectsDirector
  private effectsRenderer: EffectsRenderer
  private boardRenderer: SnakeRenderer

  /** Turns waiting to be applied, one per step. */
  private turnQueue: GridDirection[] = []
  /** Milliseconds banked toward the next step. */
  private stepAccumulator: number = 0
  /** The tier the current effect selection was made for. */
  private appliedTier: number = 0

  // Audio accessors, mirroring GameEngine's field names.
  get audioCtx(): AudioContext | null { return this.audio.audioCtx }
  get soundEnabled(): boolean { return this.audio.soundEnabled }
  set soundEnabled(value: boolean) { this.audio.setSoundEnabled(value) }
  get audioInitialized(): boolean { return this.audio.audioInitialized }
  get bgmTimeoutId(): ReturnType<typeof setTimeout> | null { return this.audio.bgmTimeoutId }

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: GameEngineCallbacks = {},
    options: SnakeEngineOptions = {}
  ) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.width = CANVAS_WIDTH
    this.height = CANVAS_HEIGHT
    this.callbacks = callbacks
    this.random = options.random ?? Math.random

    this.effectsDirector = new EffectsDirector()
    this.effectsRenderer = new EffectsRenderer(this.width, this.height)
    this.boardRenderer = new SnakeRenderer(this.width, this.height)

    this.inputManager = new InputManager({
      onStartGame: () => this.startGame(),
      onDirection: (x, y) => this.queueTurn({ x, y }),
      onJump: () => {},
      onDash: () => {},
      onPause: () => this.togglePause(),
      onRestart: () => this.restart(),
      onToggleCollisionDebug: () => {},
      onValidateCollisionSystem: () => {},
      onAudioContextResume: () => this.audio.init(),
      onSoundToggle: () => {
        this.soundEnabled = !this.soundEnabled
      }
    })

    this.effects = createNeutralEffects()

    this.init()

    if (options.autoStart !== false) {
      this.gameLoop()
    }
  }

  init(): void {
    this.gameState = 'start'
    this.lives = INITIAL_LIVES
    this.score = INITIAL_SCORE
    this.combo = 0
    this.bestCombo = 0
    this.paused = false
    this.frameCount = 0
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : 0

    this.audio.reset()
    this.inputManager.setGameState(this.gameState)
    this.backgroundStars = createStarfield(
      SNAKE_STAR_COUNT,
      this.width,
      this.height,
      this.random
    )

    this.resetBoard()
  }

  // ---------------------------------------------------------------- lifecycle

  startGame(): void {
    if (this.gameState === 'playing') return
    const previous = this.gameState
    this.gameState = 'playing'
    this.inputManager.setGameState(this.gameState)
    this.resetBoard()
    this.audio.startBGM()
    this.callbacks.onStateChange?.(previous, 'playing')
  }

  restart(): void {
    const previous = this.gameState
    this.lives = INITIAL_LIVES
    this.score = INITIAL_SCORE
    this.combo = 0
    this.paused = false
    this.gameState = 'playing'
    this.inputManager.setGameState(this.gameState)
    this.resetBoard()
    this.audio.startBGM()
    this.callbacks.onStateChange?.(previous, 'playing')
    this.callbacks.onScoreChanged?.(this.score)
    this.callbacks.onLivesChanged?.(this.lives)
  }

  togglePause(): void {
    if (this.gameState !== 'playing') return
    this.paused = !this.paused
    if (this.paused) {
      this.audio.stopBGM()
    } else {
      this.audio.startBGM()
    }
    this.callbacks.onPauseToggle?.(this.paused)
  }

  cleanup(): void {
    this.inputManager.cleanup()
    this.audio.stopBGM()
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Lay the board out from scratch.
   *
   * The only two things that call this are the start of a run and the death of
   * a snake. Nothing during play rebuilds the board.
   */
  resetBoard(): void {
    this.crashFreeze = 0
    this.stepAccumulator = 0
    this.particles = []
    this.dataBleedEffects = []
    this.resetSnake()
    this.spawnFood()
    this.applyTier(this.difficultyTier)
  }

  private gameOver(): void {
    const previous = this.gameState
    this.gameState = 'gameover'
    this.inputManager.setGameState(this.gameState)
    this.audio.stopBGM()
    this.callbacks.onStateChange?.(previous, 'gameover')
    this.callbacks.onGameOver?.(this.score)
  }

  // ------------------------------------------------------------------- board

  /** Snake spawn point: left of centre, facing right. */
  private get spawnCell(): GridCell {
    return { x: Math.floor(SNAKE_COLS / 4), y: Math.floor(SNAKE_ROWS / 2) }
  }

  private resetSnake(): void {
    const spawn = this.spawnCell
    this.snake = []
    for (let i = 0; i < SNAKE_START_LENGTH; i++) {
      this.snake.push({ x: wrap(spawn.x - i, SNAKE_COLS), y: spawn.y })
    }
    this.direction = { x: 1, y: 0 }
    this.turnQueue = []
    this.pendingGrowth = 0
  }

  /** Place food on a cell the snake does not occupy. */
  private spawnFood(): void {
    const free: GridCell[] = []
    for (let x = 0; x < SNAKE_COLS; x++) {
      for (let y = 0; y < SNAKE_ROWS; y++) {
        const cell = { x, y }
        if (this.snake.some((s) => sameCell(s, cell))) continue
        free.push(cell)
      }
    }

    // A completely full board leaves nowhere to put it, so the old position
    // stands. Unreachable in practice on 2304 cells, but there is no better
    // answer than leaving it where it is.
    if (free.length === 0) return

    this.food = free[Math.floor(this.random() * free.length)]
  }

  // -------------------------------------------------------------- difficulty

  /**
   * How far into the run the snake is, expressed in tiers.
   *
   * Counts pending growth so a tier lands on the bite that earned it rather
   * than a step or two later. Starts at 1 and falls back to 1 on a death,
   * because a death shortens the snake.
   */
  get difficultyTier(): number {
    const length = this.snake.length + this.pendingGrowth
    return 1 + Math.floor((length - SNAKE_START_LENGTH) / SNAKE_SEGMENTS_PER_TIER)
  }

  /** Milliseconds between steps, shortening with every segment gained. */
  stepIntervalMs(): number {
    const gained = this.snake.length + this.pendingGrowth - SNAKE_START_LENGTH
    return Math.max(
      SNAKE_MIN_STEP_MS,
      SNAKE_BASE_STEP_MS - gained * SNAKE_STEP_MS_PER_SEGMENT
    )
  }

  /**
   * Pick the canvas transform and post-processing set for a tier.
   *
   * Snake runs at most one transform: on a grid, stacking a flip on a mirror
   * makes the board unreadable rather than interestingly strange.
   */
  private applyTier(tier: number): void {
    this.appliedTier = tier

    const pool = [...poolForSnakeTier(tier)]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1))
      const swap = pool[i]
      pool[i] = pool[j]
      pool[j] = swap
    }

    this.activeEffects = pool.slice(0, SNAKE_CANVAS_EFFECT_MAX_CONCURRENT)
    this.effectsDirector.selectForLevel(tier)
  }

  /** Re-pick effects if the snake has crossed into a new tier. */
  private syncTier(): void {
    const tier = this.difficultyTier
    if (tier !== this.appliedTier) this.applyTier(tier)
  }

  // -------------------------------------------------------------- simulation

  /**
   * Queue a turn.
   *
   * Rejects anything that repeats or reverses the last direction already
   * committed or queued: a reversal would drive the head straight into the
   * neck, which reads as an input bug rather than a mistake.
   */
  queueTurn(direction: GridDirection): void {
    if (this.gameState !== 'playing' || this.paused) return
    if (direction.x === 0 && direction.y === 0) return
    if (this.turnQueue.length >= SNAKE_TURN_BUFFER) return

    const last = this.turnQueue.length
      ? this.turnQueue[this.turnQueue.length - 1]
      : this.direction

    if (direction.x === last.x && direction.y === last.y) return
    if (direction.x === -last.x && direction.y === -last.y) return

    this.turnQueue.push({ x: direction.x, y: direction.y })
  }

  /**
   * Fold held touch and gamepad directions into the turn queue.
   *
   * Keyboard turns arrive edge-triggered through onDirection; this covers the
   * held-state inputs, and duplicates are dropped by queueTurn.
   */
  private readInput(): void {
    const input = this.inputManager.getPlayerInput()
    if (input.up) this.queueTurn({ x: 0, y: -1 })
    else if (input.down) this.queueTurn({ x: 0, y: 1 })
    else if (input.left) this.queueTurn({ x: -1, y: 0 })
    else if (input.right) this.queueTurn({ x: 1, y: 0 })
  }

  /**
   * Advance the snake one cell.
   *
   * Edges wrap. The only thing that can kill the snake is the snake, which is
   * the whole game: the board never gets harder, the player just gets longer.
   */
  step(): void {
    const queued = this.turnQueue.shift()
    if (queued) this.direction = queued

    const head = this.snake[0]
    const target = {
      x: wrap(head.x + this.direction.x, SNAKE_COLS),
      y: wrap(head.y + this.direction.y, SNAKE_ROWS)
    }

    // The tail cell empties on this same step unless growth is pending, so
    // moving into it is legal - the classic "chasing your own tail" case.
    const tailFrees = this.pendingGrowth === 0
    const lastIndex = this.snake.length - 1
    const hitsSelf = this.snake.some(
      (segment, i) => sameCell(segment, target) && !(tailFrees && i === lastIndex)
    )

    if (hitsSelf) {
      this.crash()
      return
    }

    this.snake.unshift(target)
    if (this.pendingGrowth > 0) {
      this.pendingGrowth--
    } else {
      this.snake.pop()
    }

    if (sameCell(target, this.food)) this.eatFood()
  }

  private eatFood(): void {
    this.pendingGrowth += SNAKE_GROWTH_PER_FOOD
    this.combo++
    if (this.combo > this.bestCombo) this.bestCombo = this.combo
    this.score += SNAKE_FOOD_SCORE + (this.combo - 1) * SNAKE_COMBO_BONUS

    this.audio.playSound('collect')
    this.explodeFood()
    this.spawnFood()
    this.syncTier()

    this.callbacks.onScoreChanged?.(this.score)
    this.callbacks.onComboChanged?.(this.combo)
  }

  private crash(): void {
    const head = this.snake[0]

    this.audio.playSound('hit')
    this.spawnBurst(head, {
      color: tone(TONE.PLAYER),
      count: SNAKE_CRASH_PARTICLES,
      speedMin: 1,
      speedMax: 7,
      sizeMin: 2,
      sizeMax: 4
    })
    this.spawnBurst(head, {
      color: tone(TONE.TRAIL),
      count: SNAKE_CRASH_DEBRIS_PARTICLES,
      speedMin: 1,
      speedMax: 4,
      sizeMin: 2,
      sizeMax: 3
    })
    const smear: DataBleedEffect = {
      x: head.x * SNAKE_CELL_SIZE,
      y: head.y * SNAKE_CELL_SIZE,
      duration: SNAKE_CRASH_BLEED_DURATION,
      size: DATA_BLEED_SIZE
    }

    this.combo = 0
    this.lives--
    this.callbacks.onComboChanged?.(0)
    this.callbacks.onLivesChanged?.(this.lives)

    if (this.lives <= 0) {
      this.dataBleedEffects.push(smear)
      this.gameOver()
      return
    }

    // A death is the one thing that rebuilds the board, so the smear and the
    // burst are re-added after the reset that would otherwise clear them.
    const burst = this.particles
    this.resetBoard()
    this.particles = burst
    this.dataBleedEffects.push(smear)
    this.crashFreeze = SNAKE_CRASH_FREEZE_FRAMES
  }

  // ----------------------------------------------------------------- effects

  /**
   * Throw a burst of particles out of a grid cell.
   *
   * A ring burst spaces its angles evenly, which reads as a shockwave; a
   * scattered one randomises them, which reads as debris.
   */
  private spawnBurst(cell: GridCell, burst: ParticleBurst): void {
    const cx = cell.x * SNAKE_CELL_SIZE + SNAKE_CELL_SIZE / 2
    const cy = cell.y * SNAKE_CELL_SIZE + SNAKE_CELL_SIZE / 2
    const spread = burst.speedMax - burst.speedMin

    for (let i = 0; i < burst.count; i++) {
      if (this.particles.length >= MAX_PARTICLES) return

      const angle = burst.ring
        ? (i / burst.count) * Math.PI * 2
        : this.random() * Math.PI * 2
      const speed = burst.speedMin + this.random() * spread

      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: PARTICLE_LIFE,
        color: burst.color,
        size: burst.sizeMin + this.random() * (burst.sizeMax - burst.sizeMin)
      })
    }
  }

  /**
   * The explosion that goes off where the food was.
   *
   * A shockwave ring, a scattered core behind it, and a glitch flash at the
   * centre - the eat is the one thing the player is aiming for every few
   * seconds, so it is worth more than a puff of dust.
   */
  private explodeFood(): void {
    const color = tone(TONE.PICKUP)

    this.spawnBurst(this.food, {
      color,
      count: SNAKE_EAT_RING_PARTICLES,
      speedMin: SNAKE_EAT_RING_SPEED,
      speedMax: SNAKE_EAT_RING_SPEED,
      sizeMin: 2,
      sizeMax: 3,
      ring: true
    })

    this.spawnBurst(this.food, {
      color,
      count: SNAKE_EAT_CORE_PARTICLES,
      speedMin: SNAKE_EAT_CORE_SPEED_MIN,
      speedMax: SNAKE_EAT_CORE_SPEED_MAX,
      sizeMin: 2,
      sizeMax: 5
    })

    this.dataBleedEffects.push({
      x: this.food.x * SNAKE_CELL_SIZE,
      y: this.food.y * SNAKE_CELL_SIZE,
      duration: SNAKE_EAT_FLASH_DURATION,
      size: SNAKE_EAT_FLASH_SIZE
    })
  }

  private updateParticles(): void {
    if (this.particles.length === 0) return

    const alive: Particle[] = []
    for (const particle of this.particles) {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vx *= 0.94
      particle.vy *= 0.94
      particle.life -= PARTICLE_LIFE_DECAY
      if (particle.life > 0) alive.push(particle)
    }
    this.particles = alive
  }

  private updateDataBleed(): void {
    if (this.dataBleedEffects.length === 0) return
    this.dataBleedEffects = this.dataBleedEffects.filter((effect) => {
      effect.duration -= DATA_BLEED_DECAY
      return effect.duration > 0
    })
  }

  private hasEffect(name: string): boolean {
    return this.activeEffects.includes(name)
  }

  // ------------------------------------------------------------------- frame

  /**
   * Advance the simulation.
   *
   * `delta` is clamped so a backgrounded tab does not come back and run a
   * hundred steps at once.
   */
  update(delta: number, now: number): void {
    if (this.paused) return

    this.frameCount++
    this.backgroundScroll += SNAKE_BACKGROUND_DRIFT
    this.audio.updateBGMEffects()
    this.updateParticles()
    this.updateDataBleed()

    if (this.gameState !== 'playing') return

    if (this.crashFreeze > 0) {
      this.crashFreeze--
      return
    }

    this.readInput()

    this.stepAccumulator += Math.min(delta, MAX_FRAME_DELTA_MS)
    const interval = this.stepIntervalMs()
    while (this.stepAccumulator >= interval) {
      this.stepAccumulator -= interval
      this.step()
      // A crash rebuilds the board mid-catch-up; stop rather than stepping the
      // fresh snake with the old frame's leftover time.
      if (this.gameState !== 'playing' || this.crashFreeze > 0) {
        this.stepAccumulator = 0
        break
      }
    }

    this.updateUI()
  }

  render(now: number): void {
    const ctx = this.ctx
    ctx.save()

    if (this.hasEffect('upsideDown')) {
      ctx.translate(0, this.height)
      ctx.scale(1, -1)
    }
    if (this.hasEffect('mirrored')) {
      ctx.translate(this.width, 0)
      ctx.scale(-1, 1)
    }
    if (this.hasEffect('invert')) {
      // On a monochrome board this is the whole other polarity: black marks on
      // a white page.
      ctx.filter = 'invert(1)'
    }

    this.boardRenderer.render(ctx, {
      snake: this.snake,
      food: this.food,
      stars: this.backgroundStars,
      scrollX: this.backgroundScroll,
      now,
      wobble: this.hasEffect('wobble'),
      crashFreeze: this.crashFreeze
    })

    ctx.restore()

    this.applyPostProcessing(now)
  }

  /**
   * Drive and apply this frame's post-processing - the same pass the
   * side-scroller runs, over the finished board.
   */
  private applyPostProcessing(now: number): void {
    this.effectsDirector.update(this.effects, now)
    this.effectsRenderer.setEffects(this.dataBleedEffects, this.particles)
    this.effectsRenderer.render({
      ctx: this.ctx,
      width: this.width,
      height: this.height,
      camera: this.camera,
      effects: this.effects,
      frameCount: this.frameCount,
      deltaTime: 1 / this.fps,
      now
    })
  }

  /**
   * Push the counters into the shared HUD nodes.
   *
   * GameEngine writes the same ids, so the HUD updates on the frame rather
   * than waiting on React's polling interval. The level node is absent in this
   * mode, and getElementById simply returns null for it.
   */
  updateUI(): void {
    const nodes: Array<[string, number]> = [
      ['lives', this.lives],
      ['score', this.score],
      ['combo', this.combo]
    ]
    for (const [id, value] of nodes) {
      const node = document.getElementById(id)
      if (node) node.textContent = value.toString()
    }
  }

  gameLoop(): void {
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop())
    const now = performance.now()
    const delta = now - this.lastTime
    this.lastTime = now
    this.update(delta, now)
    this.render(now)
  }
}

/** Wrap a coordinate into [0, size). */
function wrap(value: number, size: number): number {
  return ((value % size) + size) % size
}

function sameCell(a: GridCell, b: GridCell): boolean {
  return a.x === b.x && a.y === b.y
}

/** The canvas transforms a difficulty tier may draw from. */
export function poolForSnakeTier(tier: number): readonly string[] {
  if (tier <= 1) return SNAKE_CANVAS_EFFECTS_BY_TIER.TIER_1
  if (tier <= 3) return SNAKE_CANVAS_EFFECTS_BY_TIER.TIER_2_3
  return SNAKE_CANVAS_EFFECTS_BY_TIER.TIER_4_PLUS
}

/** An Effects object with every factor at its no-op value. */
function createNeutralEffects(): Effects {
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
    dreamFactor: 0,
    dreamWaveFactor: 0,
    dataBleedEffects: [],
    particles: []
  }
}
