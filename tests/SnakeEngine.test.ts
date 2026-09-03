/**
 * SnakeEngine Test Suite
 *
 * Covers the grid simulation: stepping, wrapping, turning, eating, crashing
 * and the length-driven difficulty that stands in for levels. Rendering is
 * exercised separately; these tests construct the engine with autoStart
 * disabled and drive update/step by hand.
 */

import { SnakeEngine, poolForSnakeTier } from '../lib/game/SnakeEngine'
import {
  SNAKE_BASE_STEP_MS,
  SNAKE_CANVAS_EFFECT_MAX_CONCURRENT,
  SNAKE_COLS,
  SNAKE_COMBO_BONUS,
  SNAKE_CRASH_FREEZE_FRAMES,
  SNAKE_EAT_CORE_PARTICLES,
  SNAKE_EAT_FLASH_DURATION,
  SNAKE_EAT_RING_PARTICLES,
  SNAKE_EAT_RING_SPEED,
  SNAKE_FOOD_SCORE,
  SNAKE_GROWTH_PER_FOOD,
  SNAKE_MIN_STEP_MS,
  SNAKE_ROWS,
  SNAKE_SEGMENTS_PER_TIER,
  SNAKE_START_LENGTH,
  SNAKE_STEP_MS_PER_SEGMENT,
  SNAKE_TURN_BUFFER
} from '../constants/game'

/** A small deterministic generator, so board layouts are reproducible. */
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function createMockCanvas(): HTMLCanvasElement {
  const ctx = {
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    strokeRect: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: jest.fn(),
    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() }))
  }

  return {
    getContext: jest.fn(() => ctx),
    width: 1024,
    height: 576
  } as unknown as HTMLCanvasElement
}

describe('SnakeEngine', () => {
  let engine: SnakeEngine

  const createEngine = (seed = 42, callbacks = {}) =>
    new SnakeEngine(createMockCanvas(), callbacks, {
      random: seededRandom(seed),
      autoStart: false
    })

  /** Put the food directly in front of the head and step onto it. */
  const eatOnce = (target: SnakeEngine = engine) => {
    const head = target.snake[0]
    target.food = {
      x: (head.x + target.direction.x + SNAKE_COLS) % SNAKE_COLS,
      y: (head.y + target.direction.y + SNAKE_ROWS) % SNAKE_ROWS
    }
    target.step()
  }

  beforeEach(() => {
    engine = createEngine()
  })

  afterEach(() => {
    engine.cleanup()
  })

  describe('Initialization', () => {
    test('starts on the start screen with full lives', () => {
      expect(engine.gameState).toBe('start')
      expect(engine.lives).toBe(3)
      expect(engine.score).toBe(0)
      expect(engine.combo).toBe(0)
      expect(engine.paused).toBe(false)
    })

    test('spawns a snake of the starting length facing right', () => {
      expect(engine.snake).toHaveLength(SNAKE_START_LENGTH)
      expect(engine.direction).toEqual({ x: 1, y: 0 })
    })

    test('lays the body out behind the head', () => {
      const [head, second] = engine.snake
      expect(second.y).toBe(head.y)
      expect(second.x).toBe(head.x - 1)
    })

    test('places food on a cell the snake does not occupy', () => {
      const onSnake = engine.snake.some(
        (s) => s.x === engine.food.x && s.y === engine.food.y
      )
      expect(onSnake).toBe(false)
      expect(engine.food.x).toBeGreaterThanOrEqual(0)
      expect(engine.food.x).toBeLessThan(SNAKE_COLS)
      expect(engine.food.y).toBeLessThan(SNAKE_ROWS)
    })
  })

  describe('No levels', () => {
    test('never announces a level completion', () => {
      const onLevelComplete = jest.fn()
      const watched = createEngine(19, { onLevelComplete })
      watched.startGame()

      for (let i = 0; i < 20; i++) eatOnce(watched)

      expect(onLevelComplete).not.toHaveBeenCalled()
      watched.cleanup()
    })

    test('does not rebuild the board while the snake is alive', () => {
      engine.startGame()
      const lengthBefore = engine.snake.length

      for (let i = 0; i < 15; i++) eatOnce()

      // Growth is uninterrupted: nothing reset the snake back to its start.
      expect(engine.snake.length + engine.pendingGrowth).toBe(
        lengthBefore + 15 * SNAKE_GROWTH_PER_FOOD
      )
    })

    test('rebuilds the board when the snake dies', () => {
      engine.startGame()
      for (let i = 0; i < 4; i++) eatOnce()
      expect(engine.snake.length + engine.pendingGrowth).toBeGreaterThan(
        SNAKE_START_LENGTH
      )

      killOnce(engine)

      expect(engine.snake).toHaveLength(SNAKE_START_LENGTH)
      expect(engine.pendingGrowth).toBe(0)
    })
  })

  describe('Stepping', () => {
    beforeEach(() => {
      engine.startGame()
      // Park the food out of the way so steps do not accidentally score.
      engine.food = { x: SNAKE_COLS - 1, y: 0 }
    })

    test('advances the head one cell in the current direction', () => {
      const before = { ...engine.snake[0] }
      engine.step()
      expect(engine.snake[0]).toEqual({ x: before.x + 1, y: before.y })
    })

    test('keeps its length when it is not growing', () => {
      const length = engine.snake.length
      engine.step()
      expect(engine.snake).toHaveLength(length)
    })

    test('wraps around the right edge', () => {
      engine.snake = [{ x: SNAKE_COLS - 1, y: 10 }]
      engine.direction = { x: 1, y: 0 }
      engine.step()
      expect(engine.snake[0]).toEqual({ x: 0, y: 10 })
    })

    test('wraps around the top edge', () => {
      engine.snake = [{ x: 4, y: 0 }]
      engine.direction = { x: 0, y: -1 }
      engine.step()
      expect(engine.snake[0]).toEqual({ x: 4, y: SNAKE_ROWS - 1 })
    })

    test('may move into the cell its tail is vacating', () => {
      engine.snake = [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 6, y: 6 },
        { x: 6, y: 5 }
      ]
      engine.direction = { x: 1, y: 0 }
      engine.pendingGrowth = 0

      engine.step()

      expect(engine.lives).toBe(3)
      expect(engine.snake[0]).toEqual({ x: 6, y: 5 })
    })

    test('crashes into the tail cell when growth keeps it occupied', () => {
      engine.snake = [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 6, y: 6 },
        { x: 6, y: 5 }
      ]
      engine.direction = { x: 1, y: 0 }
      engine.pendingGrowth = 1

      engine.step()

      expect(engine.lives).toBe(2)
    })
  })

  describe('Turning', () => {
    beforeEach(() => {
      engine.startGame()
    })

    test('queues a perpendicular turn', () => {
      engine.queueTurn({ x: 0, y: -1 })
      engine.step()
      expect(engine.direction).toEqual({ x: 0, y: -1 })
    })

    test('rejects a reversal into its own neck', () => {
      engine.queueTurn({ x: -1, y: 0 })
      engine.step()
      expect(engine.direction).toEqual({ x: 1, y: 0 })
    })

    test('rejects a repeat of the current direction', () => {
      engine.queueTurn({ x: 1, y: 0 })
      engine.queueTurn({ x: 0, y: 1 })
      engine.step()
      expect(engine.direction).toEqual({ x: 0, y: 1 })
    })

    test('buffers a second turn so a corner can be chained', () => {
      engine.queueTurn({ x: 0, y: -1 })
      engine.queueTurn({ x: -1, y: 0 })

      engine.step()
      expect(engine.direction).toEqual({ x: 0, y: -1 })

      engine.step()
      expect(engine.direction).toEqual({ x: -1, y: 0 })
    })

    test('drops turns past the buffer limit', () => {
      for (let i = 0; i < SNAKE_TURN_BUFFER + 3; i++) {
        engine.queueTurn(i % 2 === 0 ? { x: 0, y: -1 } : { x: -1, y: 0 })
      }

      // Only the buffered turns are applied; the rest never reach the queue.
      engine.step()
      engine.step()
      engine.step()
      expect(engine.direction).toEqual({ x: -1, y: 0 })
    })

    test('ignores turns before the game starts', () => {
      const idle = createEngine()
      idle.queueTurn({ x: 0, y: 1 })
      idle.step()
      expect(idle.direction).toEqual({ x: 1, y: 0 })
      idle.cleanup()
    })

    test('ignores turns while paused', () => {
      engine.togglePause()
      engine.queueTurn({ x: 0, y: 1 })
      engine.paused = false
      engine.step()
      expect(engine.direction).toEqual({ x: 1, y: 0 })
    })
  })

  describe('Eating', () => {
    beforeEach(() => {
      engine.startGame()
    })

    test('scores the base value for the first food', () => {
      eatOnce()
      expect(engine.score).toBe(SNAKE_FOOD_SCORE)
      expect(engine.combo).toBe(1)
    })

    test('adds a combo bonus for each unbroken food after the first', () => {
      eatOnce()
      eatOnce()
      expect(engine.score).toBe(SNAKE_FOOD_SCORE * 2 + SNAKE_COMBO_BONUS)
      expect(engine.combo).toBe(2)
    })

    test('grows over the following steps', () => {
      const before = engine.snake.length
      eatOnce()
      engine.food = { x: SNAKE_COLS - 1, y: SNAKE_ROWS - 1 }

      for (let i = 0; i < SNAKE_GROWTH_PER_FOOD; i++) engine.step()

      expect(engine.snake.length).toBe(before + SNAKE_GROWTH_PER_FOOD)
    })

    test('tracks the best combo across a life', () => {
      eatOnce()
      eatOnce()
      expect(engine.bestCombo).toBe(2)
    })

    test('moves the food off the eaten cell', () => {
      const eaten = { ...engine.snake[0] }
      eatOnce()
      const head = engine.snake[0]
      expect(engine.food).not.toEqual({ x: head.x, y: head.y })
      expect(eaten).not.toEqual(engine.food)
    })
  })

  describe('Eat explosion', () => {
    beforeEach(() => {
      engine.startGame()
      engine.particles = []
      engine.dataBleedEffects = []
    })

    test('throws a ring and a core on every bite', () => {
      eatOnce()
      expect(engine.particles).toHaveLength(
        SNAKE_EAT_RING_PARTICLES + SNAKE_EAT_CORE_PARTICLES
      )
    })

    test('spaces the shockwave ring evenly around the bite', () => {
      eatOnce()

      const ring = engine.particles.slice(0, SNAKE_EAT_RING_PARTICLES)
      const angles = ring
        .map((p) => Math.atan2(p.vy, p.vx))
        .map((a) => (a + Math.PI * 2) % (Math.PI * 2))
        .sort((a, b) => a - b)

      const step = (Math.PI * 2) / SNAKE_EAT_RING_PARTICLES
      for (let i = 1; i < angles.length; i++) {
        expect(angles[i] - angles[i - 1]).toBeCloseTo(step, 5)
      }
    })

    test('carries the ring outward at a single speed', () => {
      eatOnce()

      const ring = engine.particles.slice(0, SNAKE_EAT_RING_PARTICLES)
      for (const particle of ring) {
        const speed = Math.hypot(particle.vx, particle.vy)
        expect(speed).toBeCloseTo(SNAKE_EAT_RING_SPEED, 5)
      }
    })

    test('scatters the core across a range of speeds', () => {
      eatOnce()

      const core = engine.particles.slice(SNAKE_EAT_RING_PARTICLES)
      const speeds = core.map((p) => Math.hypot(p.vx, p.vy))
      expect(Math.max(...speeds) - Math.min(...speeds)).toBeGreaterThan(2)
    })

    test('throws the debris further than a crash burst does', () => {
      eatOnce()
      const eatReach = Math.max(
        ...engine.particles.map((p) => Math.hypot(p.vx, p.vy))
      )

      engine.particles = []
      killOnce(engine)
      const crashReach = Math.max(
        ...engine.particles.map((p) => Math.hypot(p.vx, p.vy))
      )

      expect(eatReach).toBeGreaterThan(crashReach)
    })

    test('leaves a flash at the bite', () => {
      eatOnce()
      expect(engine.dataBleedEffects).toHaveLength(1)
      expect(engine.dataBleedEffects[0].duration).toBe(SNAKE_EAT_FLASH_DURATION)
    })

    test('centres the explosion on the food, not on where it respawned', () => {
      const head = engine.snake[0]
      const eaten = {
        x: (head.x + engine.direction.x + SNAKE_COLS) % SNAKE_COLS,
        y: head.y
      }
      engine.food = eaten
      engine.step()

      const smear = engine.dataBleedEffects[0]
      expect(smear.x).toBe(eaten.x * 16)
      expect(smear.y).toBe(eaten.y * 16)
    })

    test('stays inside the particle ceiling over a long streak', () => {
      for (let i = 0; i < 40; i++) eatOnce()
      expect(engine.particles.length).toBeLessThanOrEqual(360)
    })

    test('fades the explosion out', () => {
      eatOnce()
      const before = engine.particles.length

      for (let i = 0; i < 80; i++) engine.update(16, i * 16)

      expect(engine.particles.length).toBeLessThan(before)
    })
  })

  describe('Difficulty from length', () => {
    beforeEach(() => {
      engine.startGame()
    })

    test('starts at tier one', () => {
      expect(engine.difficultyTier).toBe(1)
    })

    test('rises as the snake gains segments', () => {
      const foodPerTier = SNAKE_SEGMENTS_PER_TIER / SNAKE_GROWTH_PER_FOOD
      for (let i = 0; i < foodPerTier; i++) eatOnce()
      expect(engine.difficultyTier).toBe(2)
    })

    test('falls back to one when the snake dies', () => {
      for (let i = 0; i < 8; i++) eatOnce()
      expect(engine.difficultyTier).toBeGreaterThan(1)

      killOnce(engine)

      expect(engine.difficultyTier).toBe(1)
    })

    test('speeds up with every segment, down to a floor', () => {
      expect(engine.stepIntervalMs()).toBe(SNAKE_BASE_STEP_MS)

      eatOnce()
      expect(engine.stepIntervalMs()).toBe(
        SNAKE_BASE_STEP_MS - SNAKE_GROWTH_PER_FOOD * SNAKE_STEP_MS_PER_SEGMENT
      )

      engine.pendingGrowth = 5000
      expect(engine.stepIntervalMs()).toBe(SNAKE_MIN_STEP_MS)
    })

    test('runs the shortest snake clean', () => {
      expect(poolForSnakeTier(1)).toHaveLength(0)
      expect(engine.activeEffects).toHaveLength(0)
    })

    test('holds the disorienting flips back until later tiers', () => {
      expect(poolForSnakeTier(2)).toEqual(['wobble'])
      expect(poolForSnakeTier(3)).toEqual(['wobble'])
      expect(poolForSnakeTier(4)).toContain('mirrored')
      expect(poolForSnakeTier(4)).toContain('upsideDown')
    })

    test('runs at most one canvas transform at a time', () => {
      for (let i = 0; i < 40; i++) {
        eatOnce()
        expect(engine.activeEffects.length).toBeLessThanOrEqual(
          SNAKE_CANVAS_EFFECT_MAX_CONCURRENT
        )
      }
    })

    test('turns an effect on once the snake is long enough', () => {
      const foodPerTier = SNAKE_SEGMENTS_PER_TIER / SNAKE_GROWTH_PER_FOOD
      for (let i = 0; i < foodPerTier; i++) eatOnce()
      expect(engine.activeEffects).toEqual(['wobble'])
    })

    test('clears effects again after a death', () => {
      for (let i = 0; i < 8; i++) eatOnce()
      expect(engine.activeEffects.length).toBeGreaterThan(0)

      killOnce(engine)

      expect(engine.activeEffects).toHaveLength(0)
    })
  })

  describe('Crashing', () => {
    beforeEach(() => {
      engine.startGame()
    })

    test('costs a life and clears the combo', () => {
      engine.combo = 4
      killOnce(engine)
      expect(engine.lives).toBe(2)
      expect(engine.combo).toBe(0)
    })

    test('respawns the snake at its starting length', () => {
      killOnce(engine)
      expect(engine.snake).toHaveLength(SNAKE_START_LENGTH)
      expect(engine.direction).toEqual({ x: 1, y: 0 })
      expect(engine.pendingGrowth).toBe(0)
    })

    test('keeps the score across a life', () => {
      eatOnce()
      const scored = engine.score
      killOnce(engine)
      expect(engine.score).toBe(scored)
    })

    test('freezes the board before the snake moves again', () => {
      killOnce(engine)
      expect(engine.crashFreeze).toBe(SNAKE_CRASH_FREEZE_FRAMES)

      const head = { ...engine.snake[0] }
      engine.update(SNAKE_BASE_STEP_MS * 4, 0)
      expect(engine.snake[0]).toEqual(head)
    })

    test('leaves a data bleed smear where it died', () => {
      killOnce(engine)
      expect(engine.dataBleedEffects).toHaveLength(1)
    })

    test('throws a particle burst that survives the board reset', () => {
      killOnce(engine)
      expect(engine.particles.length).toBeGreaterThan(0)
    })

    test('moves food that the respawned body would bury', () => {
      // Park the food where the snake will respawn.
      engine.food = { x: Math.floor(SNAKE_COLS / 4), y: Math.floor(SNAKE_ROWS / 2) }

      killOnce(engine)

      const buried = engine.snake.some(
        (s) => s.x === engine.food.x && s.y === engine.food.y
      )
      expect(buried).toBe(false)
    })

    test('ends the game when the last life is spent', () => {
      const onGameOver = jest.fn()
      const doomed = createEngine(3, { onGameOver })
      doomed.startGame()
      doomed.lives = 1

      killOnce(doomed)

      expect(doomed.gameState).toBe('gameover')
      expect(onGameOver).toHaveBeenCalledWith(doomed.score)
      doomed.cleanup()
    })

    test('crashes into its own body on a tight loop', () => {
      engine.food = { x: SNAKE_COLS - 1, y: SNAKE_ROWS - 1 }
      engine.queueTurn({ x: 0, y: -1 })
      engine.step()
      engine.queueTurn({ x: -1, y: 0 })
      engine.step()
      engine.queueTurn({ x: 0, y: 1 })
      engine.step()

      expect(engine.lives).toBe(2)
    })
  })

  describe('Frame updates', () => {
    beforeEach(() => {
      engine.startGame()
      engine.food = { x: SNAKE_COLS - 1, y: SNAKE_ROWS - 1 }
    })

    test('steps once per elapsed interval', () => {
      const start = { ...engine.snake[0] }
      const travelled = () =>
        (engine.snake[0].x - start.x + SNAKE_COLS) % SNAKE_COLS

      engine.update(SNAKE_BASE_STEP_MS, 0)
      expect(travelled()).toBe(1)

      engine.update(SNAKE_BASE_STEP_MS, 0)
      engine.update(SNAKE_BASE_STEP_MS, 0)
      expect(travelled()).toBe(3)
    })

    test('banks a partial interval instead of dropping it', () => {
      const start = { ...engine.snake[0] }
      engine.update(SNAKE_BASE_STEP_MS * 0.6, 0)
      expect(engine.snake[0]).toEqual(start)

      engine.update(SNAKE_BASE_STEP_MS * 0.6, 0)
      expect(engine.snake[0].x).toBe((start.x + 1) % SNAKE_COLS)
    })

    test('clamps a long stall rather than catching up all at once', () => {
      const start = { ...engine.snake[0] }
      engine.update(60_000, 0)
      const travelled =
        (engine.snake[0].x - start.x + SNAKE_COLS) % SNAKE_COLS
      expect(travelled).toBeLessThanOrEqual(
        Math.ceil(250 / SNAKE_BASE_STEP_MS)
      )
    })

    test('does nothing while paused', () => {
      engine.togglePause()
      const start = { ...engine.snake[0] }
      engine.update(SNAKE_BASE_STEP_MS * 5, 0)
      expect(engine.snake[0]).toEqual(start)
    })

    test('does not step on the start screen', () => {
      const idle = createEngine()
      const start = { ...idle.snake[0] }
      idle.update(SNAKE_BASE_STEP_MS * 5, 0)
      expect(idle.snake[0]).toEqual(start)
      idle.cleanup()
    })
  })

  describe('Lifecycle', () => {
    test('startGame moves into play and is idempotent', () => {
      const onStateChange = jest.fn()
      const fresh = createEngine(11, { onStateChange })

      fresh.startGame()
      fresh.startGame()

      expect(fresh.gameState).toBe('playing')
      expect(onStateChange).toHaveBeenCalledTimes(1)
      fresh.cleanup()
    })

    test('restart clears the run', () => {
      engine.startGame()
      engine.score = 5000
      engine.lives = 1

      engine.restart()

      expect(engine.score).toBe(0)
      expect(engine.lives).toBe(3)
      expect(engine.snake).toHaveLength(SNAKE_START_LENGTH)
      expect(engine.gameState).toBe('playing')
    })

    test('togglePause reports the new state', () => {
      const onPauseToggle = jest.fn()
      const pausable = createEngine(5, { onPauseToggle })
      pausable.startGame()

      pausable.togglePause()
      expect(pausable.paused).toBe(true)
      expect(onPauseToggle).toHaveBeenCalledWith(true)

      pausable.togglePause()
      expect(pausable.paused).toBe(false)
      pausable.cleanup()
    })

    test('togglePause does nothing outside play', () => {
      engine.togglePause()
      expect(engine.paused).toBe(false)
    })

    test('cleanup stops the loop', () => {
      const running = new SnakeEngine(createMockCanvas(), {}, {
        random: seededRandom(9)
      })
      expect(running.animationFrameId).not.toBeNull()

      running.cleanup()
      expect(running.animationFrameId).toBeNull()
    })
  })
})

/**
 * Drive the snake into its own neck.
 *
 * The snake is the only hazard on the board now, so a death has to be staged
 * rather than arranged with an obstacle: double the body back on itself and
 * step into it.
 */
function killOnce(target: SnakeEngine): void {
  target.snake = [
    { x: 5, y: 5 },
    { x: 5, y: 6 },
    { x: 6, y: 6 },
    { x: 6, y: 5 }
  ]
  target.direction = { x: 1, y: 0 }
  target.pendingGrowth = 1
  target.step()
}
