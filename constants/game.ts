/**
 * Game Constants
 * 
 * This module contains all magic numbers and configuration values used throughout the game.
 * Extracted from the monolithic Game.tsx file for better modularity and maintainability.
 */

// Canvas and Display Constants
export const CANVAS_WIDTH = 1024
export const CANVAS_HEIGHT = 576
export const FPS = 60

// Game State Constants
export const INITIAL_LIVES = 3
export const INITIAL_LEVEL = 1
export const INITIAL_SCORE = 0
export const LEVEL_TARGET = 1800
export const LEVEL_START_INVINCIBILITY = 2

// Player Constants
export const PLAYER_START_X = 100
export const PLAYER_START_Y = 400
export const PLAYER_WIDTH = 20
export const PLAYER_HEIGHT = 20
export const PLAYER_SPEED = 6
export const PLAYER_JUMP_POWER = 16
export const PLAYER_DASH_POWER = 15
export const PLAYER_DASH_COOLDOWN = 60
export const PLAYER_INVULNERABLE_TIME = 30
/** The player is the brightest mark on the page. See lib/game/palette.ts. */
export const PLAYER_COLOR = "#f5f5f5"
export const PLAYER_FRICTION = 0.8
export const PLAYER_GRAVITY = 0.8

// Camera Constants
export const CAMERA_SMOOTHING = 0.1
export const CAMERA_ZOOM_MIN = 1
export const CAMERA_ZOOM_MAX = 2.5

// Level Generation Constants
export const BASE_LEVEL_WIDTH = 3000
export const LEVEL_WIDTH_INCREMENT = 500
export const BASE_PLATFORM_COUNT = 15
export const PLATFORM_COUNT_INCREMENT = 3
export const BASE_ENEMY_COUNT = 8
export const ENEMY_COUNT_INCREMENT = 2
export const BASE_COLLECTIBLE_COUNT = 8
export const COLLECTIBLE_COUNT_INCREMENT = 1

// Platform Constants
export const PLATFORM_MIN_WIDTH = 80
export const PLATFORM_WIDTH_VARIATION = 120
export const PLATFORM_BASE_Y = 200
export const PLATFORM_Y_VARIATION = 100
export const PLATFORM_X_VARIATION = 50

// Enemy Constants
export const ENEMY_WIDTH = 15
export const ENEMY_HEIGHT = 15
export const ENEMY_SPEED_MIN = 0.8
export const ENEMY_SPEED_VARIATION = 0.8
export const ENEMY_MOVE_RANGE_MIN = 60
export const ENEMY_MOVE_RANGE_VARIATION = 40
export const ENEMY_STOMP_ZONE_HEIGHT = 8
export const ENEMY_SCORE_VALUE = 250

// Collectible Constants
export const COLLECTIBLE_WIDTH = 12
export const COLLECTIBLE_HEIGHT = 12
export const COLLECTIBLE_VALUE = 100

// Endless World Constants
//
// The side-scroller has no levels. The world is generated in fixed-width
// chunks as the player advances and pruned behind them, so the number of live
// entities stays flat no matter how far a run goes.

/** Width of one world chunk. One screen, so a chunk is a screen of geometry. */
export const CHUNK_WIDTH = 1024

/** Chunks generated past the one the player is in. */
export const CHUNKS_AHEAD = 2

/**
 * Chunks kept behind the player before pruning.
 *
 * Chunks regenerate identically from their index, so walking back past this
 * window costs a regeneration rather than an empty void.
 */
export const CHUNKS_BEHIND = 1

// Contents of one chunk.
export const CHUNK_PLATFORM_COUNT = 6
export const CHUNK_ENEMY_COUNT = 2
export const CHUNK_COLLECTIBLE_COUNT = 3

/**
 * The band platforms are laid out in.
 *
 * Height follows a slow sine of world x plus bounded jitter, so the terrain is
 * continuous across a chunk seam without either chunk knowing about the other,
 * and every gap stays inside a jump.
 */
export const PLATFORM_BAND_CENTER = 360
export const PLATFORM_BAND_AMPLITUDE = 120
export const PLATFORM_BAND_JITTER = 60
export const PLATFORM_BAND_WAVELENGTH = 1400
export const PLATFORM_BAND_MIN_Y = 150
export const PLATFORM_BAND_MAX_Y = 500

/** How often the active effects are re-rolled, in milliseconds. */
export const EFFECT_ROLL_INTERVAL_MS = 30000

/**
 * World distance per effect-intensity tier.
 *
 * Stands in for the level number that used to drive how hard the effects hit.
 */
export const EFFECT_TIER_DISTANCE = 4000

/** Distance a run must reach to unlock the Effects Lab. */
export const EFFECTS_LAB_UNLOCK_DISTANCE = 120000

/** Frames of invulnerability granted on respawn. */
export const RESPAWN_INVULNERABLE_FRAMES = 180

// Background Constants
export const STAR_COUNT = 100
export const DREAM_PARTICLES_COUNT = 25
export const DREAM_WAVES_COUNT = 3
export const DREAM_LAYERS_COUNT = 4

// Background Star Type Probabilities
export const STAR_TYPE_PROBABILITIES = {
  SPARKLES: 0.35,    // Small dream sparkles
  ORBS: 0.30,        // Medium dream orbs  
  WISPS: 0.20,       // Large dream wisps
  PORTALS: 0.15      // Rare dream portals
} as const

// Background Star Properties by Type
export const STAR_PROPERTIES = {
  SPARKLES: {
    SIZE_MIN: 0.5,
    SIZE_MAX: 2.5,
    HUE_MIN: 200,
    HUE_MAX: 320,
    PARALLAX_MIN: 0.1,
    PARALLAX_MAX: 0.5,
    PULSE_SPEED_MIN: 0.008,
    PULSE_SPEED_MAX: 0.028,
    TWINKLE_SPEED_MIN: 0.003,
    TWINKLE_SPEED_MAX: 0.013,
    BRIGHTNESS_MIN: 0.6,
    BRIGHTNESS_MAX: 1.0,
    GLOW_RADIUS_MIN: 1.0,
    GLOW_RADIUS_MAX: 3.0
  },
  ORBS: {
    SIZE_MIN: 1.5,
    SIZE_MAX: 4.5,
    HUE_MIN: 180,
    HUE_MAX: 280,
    PARALLAX_MIN: 0.05,
    PARALLAX_MAX: 0.35,
    PULSE_SPEED_MIN: 0.005,
    PULSE_SPEED_MAX: 0.017,
    TWINKLE_SPEED_MIN: 0.002,
    TWINKLE_SPEED_MAX: 0.008,
    BRIGHTNESS_MIN: 0.5,
    BRIGHTNESS_MAX: 1.0,
    GLOW_RADIUS_MIN: 2.0,
    GLOW_RADIUS_MAX: 5.0
  },
  WISPS: {
    SIZE_MIN: 2.5,
    SIZE_MAX: 6.5,
    HUE_MIN: 160,
    HUE_MAX: 240,
    PARALLAX_MIN: 0.03,
    PARALLAX_MAX: 0.28,
    PULSE_SPEED_MIN: 0.003,
    PULSE_SPEED_MAX: 0.011,
    TWINKLE_SPEED_MIN: 0.001,
    TWINKLE_SPEED_MAX: 0.005,
    BRIGHTNESS_MIN: 0.7,
    BRIGHTNESS_MAX: 1.0,
    GLOW_RADIUS_MIN: 2.5,
    GLOW_RADIUS_MAX: 6.5
  },
  PORTALS: {
    SIZE_MIN: 3.5,
    SIZE_MAX: 8.5,
    HUE_MIN: 140,
    HUE_MAX: 200,
    PARALLAX_MIN: 0.02,
    PARALLAX_MAX: 0.22,
    PULSE_SPEED_MIN: 0.002,
    PULSE_SPEED_MAX: 0.007,
    TWINKLE_SPEED_MIN: 0.0005,
    TWINKLE_SPEED_MAX: 0.0025,
    BRIGHTNESS_MIN: 0.8,
    BRIGHTNESS_MAX: 1.0,
    GLOW_RADIUS_MIN: 3.0,
    GLOW_RADIUS_MAX: 8.0
  }
} as const

// Transition Constants
export const TRANSITION_DURATION = 30
export const TRANSITION_ZOOM_IN_DURATION = 30
export const TRANSITION_ZOOM_OUT_DURATION = 30
export const LEVEL_COMPLETION_SCORE_MULTIPLIER = 1000


// Post-Processing Effects Constants
//
// These drive EffectsDirector, which writes the factors EffectsRenderer reads.
// Kept as a single tuning table rather than loose constants so a value cannot
// sit here unread while the code uses a different one.

/** Highest number of post-processing effects allowed to run at once. */
export const POST_EFFECT_MAX_CONCURRENT = 2

/**
 * Per-effect intensity and oscillation speed.
 *
 * `intensity` is the 0-1 factor EffectsRenderer scales its own coefficients by
 * (pulse swings either side of 1 instead). `speed` multiplies elapsed ms.
 */
export const POST_EFFECT_TUNING = {
  colorShift: { intensity: 0.6, speed: 0.0011 },
  pulse: { intensity: 0.08, speed: 0.0032 },
  blur: { intensity: 0.5, speed: 0.0007 },
  noise: { intensity: 0.35, speed: 0.0021 },
  rgbShift: { intensity: 0.7, speed: 0.0015 },
  wave: { intensity: 0.5, speed: 0.0009 },
  zoom: { intensity: 0.4, speed: 0.0006 },
  rotation: { intensity: 0.3, speed: 0.0005 },
  pixelBleed: { intensity: 0.4, speed: 0.0013 }
} as const

/**
 * Which effects each level tier may auto-select.
 *
 * Deliberately limited to the composite-blend effects, whose per-frame cost is
 * a couple of full-canvas fills. The remaining three in POST_EFFECT_TUNING —
 * noise, wave and pixelBleed — read and rewrite every pixel every frame
 * (wave alone is a ~590k-iteration loop plus a getImageData/putImageData pair
 * at 1024x576) and their frame cost has not been measured. They stay reachable
 * through EffectsDirector.setActiveEffects, but nothing turns them on
 * automatically until someone profiles them on real hardware.
 */
export const POST_EFFECTS_BY_LEVEL = {
  LEVEL_1: ['colorShift'],
  LEVEL_2_3: ['colorShift', 'pulse'],
  LEVEL_4_6: ['colorShift', 'pulse', 'blur'],
  LEVEL_7_10: ['colorShift', 'pulse', 'blur', 'rgbShift'],
  LEVEL_11_PLUS: ['colorShift', 'pulse', 'blur', 'rgbShift', 'zoom', 'rotation']
} as const


// Snake Mode Constants
//
// Snake runs on the same 1024x576 canvas as the side-scroller, quantised to a
// square grid. Every board dimension is derived from the cell size so the grid
// and the canvas can never disagree.
//
// There is no level in Snake. The board is built once when a run starts and
// again only when the snake dies; difficulty rides on the snake's own length,
// which is the one thing a snake player is already watching.

/** Side of one grid cell in pixels. Divides both canvas dimensions exactly. */
export const SNAKE_CELL_SIZE = 16

export const SNAKE_COLS = CANVAS_WIDTH / SNAKE_CELL_SIZE
export const SNAKE_ROWS = CANVAS_HEIGHT / SNAKE_CELL_SIZE

/** Segments the snake starts each life with. */
export const SNAKE_START_LENGTH = 5

/** Segments added per food eaten. */
export const SNAKE_GROWTH_PER_FOOD = 2

// Movement pacing. The snake advances one cell per step, and the gap between
// steps shrinks with every segment it gains, down to a floor.
export const SNAKE_BASE_STEP_MS = 130
export const SNAKE_STEP_MS_PER_SEGMENT = 1.5
export const SNAKE_MIN_STEP_MS = 55

/**
 * Turns buffered while a step is pending.
 *
 * Without a buffer a quick double turn (up then right inside one step) loses
 * the second input. Two is enough to chain a corner without letting a player
 * queue a whole path.
 */
export const SNAKE_TURN_BUFFER = 2

// Scoring
export const SNAKE_FOOD_SCORE = 100
/** Added per unbroken food in the current streak, on top of the base score. */
export const SNAKE_COMBO_BONUS = 25

/**
 * Segments between difficulty tiers.
 *
 * Stands in for the level a side-scroller would use: it drives which visual
 * effects run, and it falls back to one when the snake dies and shortens.
 */
export const SNAKE_SEGMENTS_PER_TIER = 6

/** Frames the board is frozen after a crash, before the snake respawns. */
export const SNAKE_CRASH_FREEZE_FRAMES = 45

/**
 * The explosion thrown when the snake eats.
 *
 * Two passes, because one random scatter of the same particle count reads as a
 * puff rather than a blast: an evenly spaced ring that carries outward as a
 * shockwave, and a scattered core whose wide speed range keeps the debris from
 * all arriving at the same radius at the same moment.
 */
export const SNAKE_EAT_RING_PARTICLES = 16
export const SNAKE_EAT_RING_SPEED = 6
export const SNAKE_EAT_CORE_PARTICLES = 24
export const SNAKE_EAT_CORE_SPEED_MIN = 1
export const SNAKE_EAT_CORE_SPEED_MAX = 9

/** The bright glitch flash left at the moment of the bite. */
export const SNAKE_EAT_FLASH_DURATION = 380
export const SNAKE_EAT_FLASH_SIZE = 46

/** Particles thrown by a crash, and the debris that follows them out. */
export const SNAKE_CRASH_PARTICLES = 26
export const SNAKE_CRASH_DEBRIS_PARTICLES = 12

/** Duration a crash's data-bleed smear starts with, in EffectsRenderer units. */
export const SNAKE_CRASH_BLEED_DURATION = 900

export const SNAKE_STAR_COUNT = 140

/** Pixels the starfield drifts per frame, giving the static board some motion. */
export const SNAKE_BACKGROUND_DRIFT = 0.35

/**
 * Canvas-transform effects Snake may run, by difficulty tier.
 *
 * These distort what the player sees without touching the controls, so they
 * stay fair on a grid. A short snake runs clean; the disorienting flips are
 * held back until the player has the board figured out.
 */
export const SNAKE_CANVAS_EFFECTS_BY_TIER = {
  TIER_1: [],
  TIER_2_3: ['wobble'],
  TIER_4_PLUS: ['wobble', 'invert', 'mirrored', 'upsideDown']
} as const

/** Snake runs at most one canvas transform at a time. */
export const SNAKE_CANVAS_EFFECT_MAX_CONCURRENT = 1

/** Wobble amplitude in pixels and its oscillation speed per ms. */
export const SNAKE_WOBBLE_AMPLITUDE = 4
export const SNAKE_WOBBLE_SPEED = 0.003
