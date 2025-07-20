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

/**
 * Game engine class interface for type safety
 */
export interface GameEngine {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  gameState: string
  currentLevel: number
  lives: number
  score: number
  paused: boolean
  isReversed: boolean
  player: Player
  camera: Camera
  keys: Keys
  touchInput: TouchInput
  effects: Effects
  levelProgress: number
  levelTarget: number
  platforms: Platform[]
  enemies: Enemy[]
  collectibles: Collectible[]
  backgroundStars: BackgroundStar[]
  dataBleedEffects: DataBleedEffect[]
  transitionTimer: number
  levelEffects: string[]
  frameCount: number
  lastTime: number
  fps: number
  audioCtx: AudioContext | null
  soundEnabled: boolean
  audioInitialized: boolean
  bgmTimeoutId: NodeJS.Timeout | null
  bgmTempo: number
  bgmPitchMod: number
  delayNode: DelayNode | null
  feedbackGain: GainNode | null
  masterGain: GainNode | null
  inputSetupDone: boolean
  animationFrameId: number | null
  cameraZoom: number
  transitionPhase: 'none' | 'zoomIn' | 'transition' | 'zoomOut'
  transitionProgress: number
  levelStartInvincibility: number
  particles: Particle[]
} 