/**
 * Game Constants
 * 
 * This module contains all magic numbers and configuration values used throughout the game.
 * Extracted from the monolithic Game.tsx file for better modularity and maintainability.
 */

// Canvas and Display Constants
export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600
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
export const PLAYER_COLOR = "#00ffff"
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
