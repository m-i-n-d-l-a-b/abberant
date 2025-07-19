/**
 * Enemy Manager
 * 
 * This module handles all enemy-specific logic including:
 * - Enemy movement patterns and AI behavior
 * - Enemy state updates and physics
 * - Stomp zone detection and collision handling
 * - Enemy spawning and lifecycle management
 * - Enemy rendering and animation logic
 */

import { Enemy, Platform, Player } from '../../types/game'
import { CollisionSystem, CollisionEntity } from './CollisionSystem'
import {
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  ENEMY_SPEED_MIN,
  ENEMY_SPEED_VARIATION,
  ENEMY_MOVE_RANGE_MIN,
  ENEMY_MOVE_RANGE_VARIATION,
  ENEMY_STOMP_ZONE_HEIGHT,
  ENEMY_SCORE_VALUE,
  BASE_ENEMY_COUNT,
  ENEMY_COUNT_INCREMENT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from '../../constants/game'

export interface EnemySpawnConfig {
  level: number
  levelWidth: number
  platforms: Platform[]
  playerX: number
}

export interface EnemyUpdateResult {
  enemies: Enemy[]
  defeatedEnemies: Enemy[]
  particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }>
}

export interface EnemyMovementPattern {
  type: 'horizontal' | 'vertical' | 'patrol' | 'chase'
  startX: number
  startY: number
  moveRange: number
  speed: number
  direction: number
  phase: number
}

export class EnemyManager {
  private enemies: Enemy[]
  private collisionSystem: CollisionSystem
  private width: number
  private height: number
  private movementPatterns: Map<string, EnemyMovementPattern>

  constructor(collisionSystem: CollisionSystem, width: number, height: number) {
    this.enemies = []
    this.collisionSystem = collisionSystem
    this.width = width
    this.height = height
    this.movementPatterns = new Map()
  }

  /**
   * Get all enemies
   */
  getEnemies(): Enemy[] {
    return [...this.enemies]
  }

  /**
   * Set enemies
   */
  setEnemies(enemies: Enemy[]): void {
    this.enemies = [...enemies]
  }

  /**
   * Clear all enemies
   */
  clearEnemies(): void {
    this.enemies = []
    this.movementPatterns.clear()
  }

  /**
   * Generate enemies for a level
   */
  generateEnemies(config: EnemySpawnConfig): Enemy[] {
    const enemyCount = BASE_ENEMY_COUNT + (config.level - 1) * ENEMY_COUNT_INCREMENT
    const enemies: Enemy[] = []

    for (let i = 0; i < enemyCount; i++) {
      const enemy = this.createEnemy(config)
      if (enemy) {
        enemies.push(enemy)
        this.initializeMovementPattern(enemy)
      }
    }

    this.enemies = enemies
    return enemies
  }

  /**
   * Create a single enemy
   */
  private createEnemy(config: EnemySpawnConfig): Enemy | null {
    // Find a suitable platform for the enemy
    const suitablePlatforms = config.platforms.filter(platform => 
      platform.x > config.playerX + 200 && // Don't spawn too close to player
      platform.x < config.levelWidth - 100 && // Don't spawn at level end
      platform.width > ENEMY_WIDTH * 2 // Platform must be wide enough
    )

    if (suitablePlatforms.length === 0) {
      return null
    }

    const platform = suitablePlatforms[Math.floor(Math.random() * suitablePlatforms.length)]
    const movementType = Math.random() > 0.5 ? 'horizontal' : 'vertical'
    
    const speed = ENEMY_SPEED_MIN + Math.random() * ENEMY_SPEED_VARIATION
    const moveRange = ENEMY_MOVE_RANGE_MIN + Math.random() * ENEMY_MOVE_RANGE_VARIATION

    const enemy: Enemy = {
      x: platform.x + Math.random() * (platform.width - ENEMY_WIDTH),
      y: platform.y - ENEMY_HEIGHT,
      width: ENEMY_WIDTH,
      height: ENEMY_HEIGHT,
      velX: 0,
      velY: 0,
      speed: speed,
      color: this.getEnemyColor(config.level),
      movementType: movementType,
      startY: platform.y - ENEMY_HEIGHT,
      moveRange: moveRange,
      stompZoneActive: false
    }

    return enemy
  }

  /**
   * Get enemy color based on level
   */
  private getEnemyColor(level: number): string {
    const colors = [
      '#ff4444', // Red
      '#ff8844', // Orange
      '#ffaa44', // Yellow
      '#ff6644', // Red-orange
      '#ff2244'  // Dark red
    ]
    return colors[Math.min(level - 1, colors.length - 1)]
  }

  /**
   * Initialize movement pattern for an enemy
   */
  private initializeMovementPattern(enemy: Enemy): void {
    const pattern: EnemyMovementPattern = {
      type: enemy.movementType,
      startX: enemy.x,
      startY: enemy.y,
      moveRange: enemy.moveRange,
      speed: enemy.speed,
      direction: 1,
      phase: 0
    }
    
    this.movementPatterns.set(`${enemy.x}-${enemy.y}`, pattern)
  }

  /**
   * Update all enemies
   */
  updateEnemies(deltaTime: number = 1): EnemyUpdateResult {
    const defeatedEnemies: Enemy[] = []
    const particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }> = []

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i]
      const pattern = this.movementPatterns.get(`${enemy.x}-${enemy.y}`)
      
      if (pattern) {
        this.updateEnemyMovement(enemy, pattern, deltaTime)
        this.updateEnemyPhysics(enemy, deltaTime)
        this.updateStompZone(enemy)
        
        // Check if enemy should be removed (fell off screen)
        if (this.shouldRemoveEnemy(enemy)) {
          this.enemies.splice(i, 1)
          this.movementPatterns.delete(`${enemy.x}-${enemy.y}`)
        }
      }
    }

    return {
      enemies: [...this.enemies],
      defeatedEnemies,
      particles
    }
  }

  /**
   * Update enemy movement based on pattern
   */
  private updateEnemyMovement(enemy: Enemy, pattern: EnemyMovementPattern, deltaTime: number): void {
    switch (pattern.type) {
      case 'horizontal':
        this.updateHorizontalMovement(enemy, pattern, deltaTime)
        break
      case 'vertical':
        this.updateVerticalMovement(enemy, pattern, deltaTime)
        break
      case 'patrol':
        this.updatePatrolMovement(enemy, pattern, deltaTime)
        break
      case 'chase':
        this.updateChaseMovement(enemy, pattern, deltaTime)
        break
    }
  }

  /**
   * Update horizontal movement pattern
   */
  private updateHorizontalMovement(enemy: Enemy, pattern: EnemyMovementPattern, deltaTime: number): void {
    const targetX = pattern.startX + pattern.direction * pattern.moveRange
    
    if (Math.abs(enemy.x - targetX) < 5) {
      pattern.direction *= -1
    }
    
    enemy.velX = pattern.direction * pattern.speed * deltaTime
  }

  /**
   * Update vertical movement pattern
   */
  private updateVerticalMovement(enemy: Enemy, pattern: EnemyMovementPattern, deltaTime: number): void {
    const targetY = pattern.startY + pattern.direction * pattern.moveRange
    
    if (Math.abs(enemy.y - targetY) < 5) {
      pattern.direction *= -1
    }
    
    enemy.velY = pattern.direction * pattern.speed * deltaTime
  }

  /**
   * Update patrol movement pattern (platform-based)
   */
  private updatePatrolMovement(enemy: Enemy, pattern: EnemyMovementPattern, deltaTime: number): void {
    // Similar to horizontal but with platform boundary checking
    this.updateHorizontalMovement(enemy, pattern, deltaTime)
  }

  /**
   * Update chase movement pattern (towards player)
   */
  private updateChaseMovement(enemy: Enemy, pattern: EnemyMovementPattern, deltaTime: number): void {
    // TODO: Implement player chasing logic
    this.updateHorizontalMovement(enemy, pattern, deltaTime)
  }

  /**
   * Update enemy physics
   */
  private updateEnemyPhysics(enemy: Enemy, deltaTime: number): void {
    // Apply gravity
    enemy.velY += 0.5 * deltaTime

    // Update position
    enemy.x += enemy.velX * deltaTime
    enemy.y += enemy.velY * deltaTime

    // Check platform collisions
    this.checkPlatformCollisions(enemy)
  }

  /**
   * Check platform collisions for enemy
   */
  private checkPlatformCollisions(enemy: Enemy): void {
    const enemyBounds = {
      x: enemy.x,
      y: enemy.y,
      width: enemy.width,
      height: enemy.height
    }

    const platformResult = this.collisionSystem.checkPlayerPlatformCollisions(enemyBounds, enemy.velY)
    
    if (platformResult.grounded) {
      enemy.y = platformResult.platforms[0].bounds.y - enemy.height
      enemy.velY = 0
    }
  }

  /**
   * Update stomp zone for enemy
   */
  private updateStompZone(enemy: Enemy): void {
    // Stomp zone is active when enemy is moving and on ground
    enemy.stompZoneActive = Math.abs(enemy.velX) > 0.1 && enemy.velY === 0
  }

  /**
   * Check if enemy should be removed
   */
  private shouldRemoveEnemy(enemy: Enemy): boolean {
    return enemy.y > this.height + 100 || enemy.x < -100 || enemy.x > this.width + 100
  }

  /**
   * Defeat an enemy (stomped by player)
   */
  defeatEnemy(enemy: Enemy): Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }> {
    const particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }> = []
    
    // Generate defeat particles
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: enemy.x + Math.random() * enemy.width,
        y: enemy.y + Math.random() * enemy.height,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: enemy.color,
        size: Math.random() * 3 + 1,
        life: 45
      })
    }

    // Remove enemy from list
    const index = this.enemies.indexOf(enemy)
    if (index !== -1) {
      this.enemies.splice(index, 1)
      this.movementPatterns.delete(`${enemy.x}-${enemy.y}`)
    }

    return particles
  }

  /**
   * Get enemies in range of a position
   */
  getEnemiesInRange(x: number, y: number, range: number): Enemy[] {
    return this.enemies.filter(enemy => {
      const distance = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2)
      return distance <= range
    })
  }

  /**
   * Get enemies that can be stomped by player
   */
  getStompableEnemies(playerX: number, playerY: number, playerWidth: number, playerHeight: number): Enemy[] {
    return this.enemies.filter(enemy => {
      // Check if player is above enemy
      const playerBottom = playerY + playerHeight
      const enemyTop = enemy.y
      const playerCenterX = playerX + playerWidth / 2
      const enemyCenterX = enemy.x + enemy.width / 2
      
      return playerBottom <= enemyTop + ENEMY_STOMP_ZONE_HEIGHT &&
             Math.abs(playerCenterX - enemyCenterX) < (playerWidth + enemy.width) / 2 &&
             enemy.stompZoneActive
    })
  }

  /**
   * Get enemies that can damage the player
   */
  getDamagingEnemies(playerX: number, playerY: number, playerWidth: number, playerHeight: number): Enemy[] {
    return this.enemies.filter(enemy => {
      // Check for collision with player
      return playerX < enemy.x + enemy.width &&
             playerX + playerWidth > enemy.x &&
             playerY < enemy.y + enemy.height &&
             playerY + playerHeight > enemy.y
    })
  }

  /**
   * Add enemy to the system
   */
  addEnemy(enemy: Enemy): void {
    this.enemies.push(enemy)
    this.initializeMovementPattern(enemy)
  }

  /**
   * Remove enemy by ID
   */
  removeEnemy(enemyId: string): boolean {
    const index = this.enemies.findIndex(enemy => `${enemy.x}-${enemy.y}` === enemyId)
    if (index !== -1) {
      const enemy = this.enemies[index]
      this.enemies.splice(index, 1)
      this.movementPatterns.delete(`${enemy.x}-${enemy.y}`)
      return true
    }
    return false
  }

  /**
   * Get enemy count
   */
  getEnemyCount(): number {
    return this.enemies.length
  }

  /**
   * Get enemy stats for debugging
   */
  getEnemyStats(): {
    totalEnemies: number
    horizontalEnemies: number
    verticalEnemies: number
    activeStompZones: number
  } {
    const horizontalEnemies = this.enemies.filter(e => e.movementType === 'horizontal').length
    const verticalEnemies = this.enemies.filter(e => e.movementType === 'vertical').length
    const activeStompZones = this.enemies.filter(e => e.stompZoneActive).length

    return {
      totalEnemies: this.enemies.length,
      horizontalEnemies,
      verticalEnemies,
      activeStompZones
    }
  }

  /**
   * Get enemy state summary for debugging
   */
  getStateSummary(): string {
    const stats = this.getEnemyStats()
    return `Enemies: ${stats.totalEnemies} (H:${stats.horizontalEnemies}, V:${stats.verticalEnemies}, Stomp:${stats.activeStompZones})`
  }
} 