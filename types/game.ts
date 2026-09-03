/**
 * Game Type Definitions
 * 
 * This module contains all type definitions and interfaces used throughout the game.
 * Extracted from the monolithic Game.tsx file for better modularity and maintainability.
 */

export interface GameState {
  gameState: string
  currentLevel: number
  lives: number
  score: number
  paused: boolean
}

export interface Player {
  x: number
  y: number
  width: number
  height: number
  velX: number
  velY: number
  speed: number
  jumpPower: number
  grounded: boolean
  doubleJump: boolean
  dashCooldown: number
  invulnerable: number
  color: string
  trail: Array<{ x: number; y: number }>
  respawning: boolean
}

export interface Platform {
  x: number
  y: number
  width: number
  height: number
  color: string
  type: string
  liquidPixels: Array<{ x: number; y: number; velX: number; velY: number; opacity: number; size: number }>
  distortionOffset: number
}

export interface Enemy {
  x: number
  y: number
  width: number
  height: number
  velX: number
  velY: number
  speed: number
  color: string
  movementType: 'horizontal' | 'vertical'
  startY: number
  moveRange: number
  stompZoneActive: boolean
}

export interface Collectible {
  x: number
  y: number
  width: number
  height: number
  color: string
  collected: boolean
  value: number
}

export interface BackgroundStar {
  x: number
  y: number
  size: number
  parallax: number
  hue: number
  pulseSpeed: number
  pulsePhase: number
  twinkleSpeed: number
  twinklePhase: number
  shape: 'circle' | 'diamond' | 'triangle'
  brightness: number
  glowRadius: number
}

export interface DataBleedEffect {
  x: number
  y: number
  duration: number
  size: number
}

export interface Effects {
  glitchOffset: { x: number; y: number }
  meltingFactor: number
  colorShift: number
  pulseFactor: number
  blurFactor: number
  noiseFactor: number
  rgbShiftFactor: number
  waveFactor: number
  zoomFactor: number
  rotationFactor: number
  pixelBleedFactor: number
  // Dream effect properties
  dreamFactor: number
  dreamWaveFactor: number
  dataBleedEffects?: DataBleedEffect[]
  particles?: Particle[]
}

export interface Camera {
  x: number
  y: number
  targetX: number
  targetY: number
  smoothing: number
  zoom: number
  targetZoom?: number
}

export interface Keys {
  [key: string]: boolean
}

export interface TouchInput {
  left: boolean
  right: boolean
  jump: boolean
  dash: boolean
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}
