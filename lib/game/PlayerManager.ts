/**
 * Player Manager
 * 
 * This module handles all player-specific logic including:
 * - Player movement and physics
 * - Jump and dash mechanics
 * - Player state updates
 * - Trail effects
 * - Collision detection for player
 * - Player animation and rendering logic
 */

import { Player, Platform, Enemy, Collectible, Camera } from '../../types/game'
import { CollisionSystem, CollisionEntity } from './CollisionSystem'
import {
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
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from '../../constants/game'

export interface PlayerInput {
  left: boolean
  right: boolean
  jump: boolean
  dash: boolean
}

export interface PlayerCollisionResult {
  grounded: boolean
  onPlatform: Platform | null
  enemiesHit: Enemy[]
  collectiblesCollected: Collectible[]
  shouldRespawn: boolean
}

export interface PlayerUpdateResult {
  player: Player
  collisionResult: PlayerCollisionResult
  particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }>
}

export class PlayerManager {
  private player: Player
  private collisionSystem: CollisionSystem
  private camera: Camera
  private width: number
  private height: number

  constructor(
    player: Player,
    collisionSystem: CollisionSystem,
    camera: Camera,
    width: number,
    height: number
  ) {
    this.player = { ...player }
    this.collisionSystem = collisionSystem
    this.camera = camera
    this.width = width
    this.height = height
  }

  /**
   * Get current player state
   */
  getPlayer(): Player {
    return { ...this.player }
  }

  /**
   * Set player state
   */
  setPlayer(player: Player): void {
    this.player = { ...player }
  }

  /**
   * Reset player to initial state
   */
  resetPlayer(): void {
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
  }

  /**
   * Update player based on input and game state
   */
  updatePlayer(input: PlayerInput, deltaTime: number = 1): PlayerUpdateResult {
    const particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }> = []

    // Handle input
    this.handleInput(input)

    // Update physics
    this.updatePhysics(deltaTime)

    // Update trail effects
    this.updateTrail()

    // Check collisions
    const collisionResult = this.checkCollisions()

    // Update invulnerability
    if (this.player.invulnerable > 0) {
      this.player.invulnerable--
    }

    // Update dash cooldown
    if (this.player.dashCooldown > 0) {
      this.player.dashCooldown--
    }

    // Generate particles for effects
    if (this.player.respawning) {
      particles.push(...this.generateRespawnParticles())
    }

    return {
      player: { ...this.player },
      collisionResult,
      particles
    }
  }

  /**
   * Handle player input
   */
  private handleInput(input: PlayerInput): void {
    // Horizontal movement
    if (input.left) {
      this.player.velX = -this.player.speed
    } else if (input.right) {
      this.player.velX = this.player.speed
    } else {
      this.player.velX *= PLAYER_FRICTION
    }

    // Jump
    if (input.jump) {
      this.jump()
    }

    // Dash
    if (input.dash) {
      const direction = input.left ? -1 : input.right ? 1 : this.player.velX >= 0 ? 1 : -1
      this.dash(direction)
    }
  }

  /**
   * Update player physics
   */
  private updatePhysics(deltaTime: number): void {
    // Apply gravity
    if (!this.player.grounded) {
      this.player.velY += PLAYER_GRAVITY * deltaTime
    }

    // Update position
    this.player.x += this.player.velX * deltaTime
    this.player.y += this.player.velY * deltaTime

    // Screen boundaries
    if (this.player.x < 0) {
      this.player.x = 0
      this.player.velX = 0
    }
    if (this.player.x + this.player.width > this.width) {
      this.player.x = this.width - this.player.width
      this.player.velX = 0
    }

    // Ground collision
    if (this.player.y + this.player.height > this.height) {
      this.player.y = this.height - this.player.height
      this.player.velY = 0
      this.player.grounded = true
      this.player.doubleJump = false
    }
  }

  /**
   * Handle jump mechanics
   */
  private jump(): void {
    if (this.player.grounded) {
      this.player.velY = -this.player.jumpPower
      this.player.grounded = false
      this.player.doubleJump = true
    } else if (this.player.doubleJump) {
      this.player.velY = -this.player.jumpPower * 0.8
      this.player.doubleJump = false
    }
  }

  /**
   * Handle dash mechanics
   */
  private dash(direction: number): void {
    if (this.player.dashCooldown <= 0 && direction !== 0) {
      this.player.velX = direction * PLAYER_DASH_POWER
      this.player.dashCooldown = PLAYER_DASH_COOLDOWN
    }
  }

  /**
   * Update trail effects
   */
  private updateTrail(): void {
    // Add current position to trail
    this.player.trail.push({ x: this.player.x, y: this.player.y })

    // Limit trail length
    if (this.player.trail.length > 10) {
      this.player.trail.shift()
    }
  }

  /**
   * Check collisions with game entities
   */
  private checkCollisions(): PlayerCollisionResult {
    const result: PlayerCollisionResult = {
      grounded: false,
      onPlatform: null,
      enemiesHit: [],
      collectiblesCollected: [],
      shouldRespawn: false
    }

    const playerBounds = {
      x: this.player.x,
      y: this.player.y,
      width: this.player.width,
      height: this.player.height
    }

    // Check platform collisions
    const platformResult = this.collisionSystem.checkPlayerPlatformCollisions(playerBounds, this.player.velY)
    if (platformResult.grounded) {
      this.player.grounded = true
      this.player.doubleJump = false
      result.grounded = true
      if (platformResult.platforms.length > 0) {
        result.onPlatform = platformResult.platforms[0].data as Platform
      }
    }

    // Check enemy collisions (if not invulnerable)
    if (this.player.invulnerable <= 0) {
      const enemyResult = this.collisionSystem.checkPlayerEnemyCollisions(playerBounds, this.player.velY)
      
      // Handle stomp targets
      for (const enemyEntity of enemyResult.stompTargets) {
        const enemy = enemyEntity.data as Enemy
        result.enemiesHit.push(enemy)
        this.player.velY = -this.player.jumpPower * 0.5
      }
      
      // Handle enemy hits
      if (enemyResult.enemies.length > 0) {
        result.shouldRespawn = true
      }
    }

    // Check collectible collisions
    const collectibleEntities = this.collisionSystem.checkPlayerCollectibleCollisions(playerBounds)
    for (const collectibleEntity of collectibleEntities) {
      const collectible = collectibleEntity.data as Collectible
      if (!collectible.collected) {
        result.collectiblesCollected.push(collectible)
      }
    }

    return result
  }

  /**
   * Generate respawn particles
   */
  private generateRespawnParticles(): Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }> {
    const particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }> = []
    
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: this.player.x + Math.random() * this.player.width,
        y: this.player.y + Math.random() * this.player.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: this.player.color,
        size: Math.random() * 3 + 1,
        life: 30
      })
    }
    
    return particles
  }

  /**
   * Set player position
   */
  setPosition(x: number, y: number): void {
    this.player.x = x
    this.player.y = y
  }

  /**
   * Set player velocity
   */
  setVelocity(velX: number, velY: number): void {
    this.player.velX = velX
    this.player.velY = velY
  }

  /**
   * Make player invulnerable
   */
  makeInvulnerable(duration: number = PLAYER_INVULNERABLE_TIME): void {
    this.player.invulnerable = duration
  }

  /**
   * Set respawning state
   */
  setRespawning(respawning: boolean): void {
    this.player.respawning = respawning
  }

  /**
   * Get player bounds for collision detection
   */
  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.player.x,
      y: this.player.y,
      width: this.player.width,
      height: this.player.height
    }
  }

  /**
   * Check if player is on ground
   */
  isGrounded(): boolean {
    return this.player.grounded
  }

  /**
   * Check if player can jump
   */
  canJump(): boolean {
    return this.player.grounded || this.player.doubleJump
  }

  /**
   * Check if player can dash
   */
  canDash(): boolean {
    return this.player.dashCooldown <= 0
  }

  /**
   * Check if player is invulnerable
   */
  isInvulnerable(): boolean {
    return this.player.invulnerable > 0
  }

  /**
   * Get player trail for rendering
   */
  getTrail(): Array<{ x: number; y: number }> {
    return [...this.player.trail]
  }

  /**
   * Clear player trail
   */
  clearTrail(): void {
    this.player.trail = []
  }

  /**
   * Update camera to follow player
   */
  updateCamera(): Camera {
    const targetX = this.player.x - this.width / 3
    const targetY = 0

    this.camera.targetX = targetX
    this.camera.targetY = targetY

    // Smooth camera movement
    this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothing
    this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.smoothing

    return { ...this.camera }
  }

  /**
   * Get player state summary for debugging
   */
  getStateSummary(): string {
    return `Player: x=${this.player.x.toFixed(1)}, y=${this.player.y.toFixed(1)}, velX=${this.player.velX.toFixed(1)}, velY=${this.player.velY.toFixed(1)}, grounded=${this.player.grounded}, invulnerable=${this.player.invulnerable}`
  }
} 