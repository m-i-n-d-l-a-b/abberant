/**
 * EnemyManager Test Suite
 * 
 * Tests for the enemy management system that handles enemy spawning, movement, and AI behavior.
 */

import { EnemyManager, EnemySpawnConfig, EnemyUpdateResult } from './EnemyManager'
import { Enemy, Platform } from '../../types/game'
import { CollisionSystem } from './CollisionSystem'
import {
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  ENEMY_SPEED_MIN,
  ENEMY_SPEED_VARIATION,
  ENEMY_MOVE_RANGE_MIN,
  ENEMY_MOVE_RANGE_VARIATION,
  ENEMY_STOMP_ZONE_HEIGHT,
  ENEMY_SCORE_VALUE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '../../constants/game'

describe('EnemyManager', () => {
  let enemyManager: EnemyManager
  let mockEnemy: Enemy
  let mockPlatforms: Platform[]
  let mockCollisionSystem: CollisionSystem

  beforeEach(() => {
    // Create a mock collision system
    mockCollisionSystem = {
      checkCollisions: jest.fn(),
      addEntity: jest.fn(),
      removeEntity: jest.fn(),
      update: jest.fn(),
      getCollisions: jest.fn(),
      clear: jest.fn(),
      checkPlayerPlatformCollisions: jest.fn().mockReturnValue({
        grounded: true,
        platforms: [{ bounds: { y: 300 } }]
      }),
      checkPlayerEnemyCollisions: jest.fn(),
      checkPlayerCollectibleCollisions: jest.fn(),
    } as any

    // Create a fresh enemy instance for each test
    mockEnemy = {
      x: 200,
      y: 300,
      width: ENEMY_WIDTH,
      height: ENEMY_HEIGHT,
      velX: ENEMY_SPEED_MIN,
      velY: 0,
      speed: ENEMY_SPEED_MIN,
      color: '#ff0000',
      movementType: 'horizontal',
      startY: 300,
      moveRange: ENEMY_MOVE_RANGE_MIN,
      stompZoneActive: false,
    }

    mockPlatforms = [
      { x: 100, y: 350, width: 200, height: 20 },
      { x: 400, y: 250, width: 150, height: 20 },
    ]

    enemyManager = new EnemyManager(mockCollisionSystem, CANVAS_WIDTH, CANVAS_HEIGHT)
  })

  describe('Initialization', () => {
    test('should initialize with empty enemy list', () => {
      const enemies = enemyManager.getEnemies()
      expect(enemies).toEqual([])
    })

    test('should set enemies', () => {
      enemyManager.setEnemies([mockEnemy])
      const enemies = enemyManager.getEnemies()
      expect(enemies).toHaveLength(1)
      expect(enemies[0]).toEqual(mockEnemy)
    })
  })

  describe('Enemy Generation', () => {
    test('should generate enemies for level', () => {
      const spawnConfig: EnemySpawnConfig = {
        level: 1,
        levelWidth: 1000,
        platforms: mockPlatforms,
        playerX: 100,
      }

      const enemies = enemyManager.generateEnemies(spawnConfig)
      
      expect(enemies.length).toBeGreaterThan(0)
      expect(enemies[0].width).toBe(ENEMY_WIDTH)
      expect(enemies[0].height).toBe(ENEMY_HEIGHT)
      expect(enemies[0].color).toBeDefined()
      expect(enemies[0].movementType).toBeDefined()
    })

    test('should generate more enemies for higher levels', () => {
      const config1: EnemySpawnConfig = {
        level: 1,
        levelWidth: 1000,
        platforms: mockPlatforms,
        playerX: 100,
      }

      const config2: EnemySpawnConfig = {
        level: 3,
        levelWidth: 1000,
        platforms: mockPlatforms,
        playerX: 100,
      }

      const enemies1 = enemyManager.generateEnemies(config1)
      enemyManager.clearEnemies()
      const enemies2 = enemyManager.generateEnemies(config2)
      
      expect(enemies2.length).toBeGreaterThan(enemies1.length)
    })

    test('should not spawn enemies on unsuitable platforms', () => {
      const smallPlatforms = [
        { x: 100, y: 350, width: 10, height: 20 }, // Too small
      ]

      const spawnConfig: EnemySpawnConfig = {
        level: 1,
        levelWidth: 1000,
        platforms: smallPlatforms,
        playerX: 100,
      }

      const enemies = enemyManager.generateEnemies(spawnConfig)
      
      expect(enemies.length).toBe(0)
    })
  })

  describe('Enemy Updates', () => {
    test('should update enemy movement', () => {
      enemyManager.setEnemies([mockEnemy])
      
      const result = enemyManager.updateEnemies()
      
      expect(result.enemies).toHaveLength(1)
      expect(result.enemies[0].x).toBeDefined()
      expect(result.enemies[0].y).toBeDefined()
    })

    test('should update enemy physics', () => {
      const enemy = { ...mockEnemy, velY: 0 }
      enemyManager.setEnemies([enemy])
      
      const result = enemyManager.updateEnemies()
      
      expect(result.enemies[0].velY).toBeDefined()
    })

    test('should update stomp zone', () => {
      const enemy = { ...mockEnemy, stompZoneActive: false }
      enemyManager.setEnemies([enemy])
      
      const result = enemyManager.updateEnemies()
      
      expect(result.enemies[0].stompZoneActive).toBeDefined()
    })

    test('should remove enemies that fall off screen', () => {
      const enemy = { ...mockEnemy, y: CANVAS_HEIGHT + 200 } // Further off screen
      enemyManager.addEnemy(enemy) // Use addEnemy to create movement pattern
      
      // Mock collision system to not ground the enemy so it falls
      mockCollisionSystem.checkPlayerPlatformCollisions.mockReturnValue({
        grounded: false,
        platforms: []
      })
      
      const result = enemyManager.updateEnemies()
      
      expect(result.enemies).toHaveLength(0)
    })
  })

  describe('Enemy AI Behavior', () => {
    test('should handle horizontal movement', () => {
      const enemy = { ...mockEnemy, movementType: 'horizontal' }
      enemyManager.setEnemies([enemy])
      
      const result = enemyManager.updateEnemies()
      
      expect(result.enemies[0].velX).toBeDefined()
    })

    test('should handle vertical movement', () => {
      const enemy = { ...mockEnemy, movementType: 'vertical' }
      enemyManager.setEnemies([enemy])
      
      const result = enemyManager.updateEnemies()
      
      expect(result.enemies[0].velY).toBeDefined()
    })

    test('should maintain movement speed', () => {
      const enemy = { ...mockEnemy, speed: 2 }
      enemyManager.setEnemies([enemy])
      
      const result = enemyManager.updateEnemies()
      
      expect(result.enemies[0].speed).toBe(2)
    })
  })

  describe('Enemy Removal', () => {
    test('should remove enemy by ID', () => {
      const enemy1 = { ...mockEnemy, x: 200, y: 300 }
      const enemy2 = { ...mockEnemy, x: 300, y: 300 }
      enemyManager.setEnemies([enemy1, enemy2])
      expect(enemyManager.getEnemies()).toHaveLength(2)
      
      const removed = enemyManager.removeEnemy('200-300')
      expect(removed).toBe(true)
      expect(enemyManager.getEnemies()).toHaveLength(1)
    })

    test('should handle removing non-existent enemy', () => {
      enemyManager.setEnemies([mockEnemy])
      expect(enemyManager.getEnemies()).toHaveLength(1)
      
      const removed = enemyManager.removeEnemy('non-existent-id')
      expect(removed).toBe(false)
      expect(enemyManager.getEnemies()).toHaveLength(1) // Should remain unchanged
    })

    test('should clear all enemies', () => {
      const enemy2 = { ...mockEnemy, x: 300 }
      const enemy3 = { ...mockEnemy, x: 400 }
      
      enemyManager.setEnemies([mockEnemy, enemy2, enemy3])
      expect(enemyManager.getEnemies()).toHaveLength(3)
      
      enemyManager.clearEnemies()
      expect(enemyManager.getEnemies()).toHaveLength(0)
    })
  })

  describe('Collision Detection', () => {
    test('should get stompable enemies', () => {
      const enemy = { ...mockEnemy, x: 200, y: 300, velX: 1, velY: 0 }
      enemyManager.addEnemy(enemy) // Use addEnemy to create movement pattern
      
      // Update to set stomp zone active
      enemyManager.updateEnemies()
      
      // Get the updated enemy position
      const updatedEnemies = enemyManager.getEnemies()
      const updatedEnemy = updatedEnemies[0]
      
      const stompableEnemies = enemyManager.getStompableEnemies(updatedEnemy.x, 260, 32, 32)
      
      expect(stompableEnemies).toHaveLength(1)
      expect(stompableEnemies[0]).toEqual(updatedEnemy)
    })

    test('should get damaging enemies', () => {
      const enemy = { ...mockEnemy, x: 200, y: 300 }
      enemyManager.setEnemies([enemy])
      
      const damagingEnemies = enemyManager.getDamagingEnemies(200, 300, 32, 32)
      
      expect(damagingEnemies).toHaveLength(1)
      expect(damagingEnemies[0]).toEqual(enemy)
    })

    test('should get enemies in range', () => {
      const enemy = { ...mockEnemy, x: 200, y: 300 }
      enemyManager.setEnemies([enemy])
      
      const enemiesInRange = enemyManager.getEnemiesInRange(200, 300, 100)
      
      expect(enemiesInRange).toHaveLength(1)
      expect(enemiesInRange[0]).toEqual(enemy)
    })

    test('should not detect enemies outside range', () => {
      const enemy = { ...mockEnemy, x: 500, y: 500 }
      enemyManager.setEnemies([enemy])
      
      const enemiesInRange = enemyManager.getEnemiesInRange(200, 300, 100)
      
      expect(enemiesInRange).toHaveLength(0)
    })
  })

  describe('Stomp Zone Detection', () => {
    test('should detect stomp zone correctly', () => {
      const enemy = { ...mockEnemy, x: 200, y: 300, velX: 1, velY: 0 }
      enemyManager.addEnemy(enemy) // Use addEnemy to create movement pattern
      
      // Update to set stomp zone active
      enemyManager.updateEnemies()
      
      // Get the updated enemy position
      const updatedEnemies = enemyManager.getEnemies()
      const updatedEnemy = updatedEnemies[0]
      
      // Player position above enemy (stomp zone)
      const playerY = updatedEnemy.y - ENEMY_STOMP_ZONE_HEIGHT - 20
      const playerX = updatedEnemy.x
      
      const stompableEnemies = enemyManager.getStompableEnemies(playerX, playerY, 32, 32)
      
      expect(stompableEnemies).toHaveLength(1)
    })

    test('should not detect stomp when player is too high', () => {
      const enemy = { ...mockEnemy, x: 200, y: 300 }
      enemyManager.setEnemies([enemy])
      
      // Player position too high above enemy
      const playerY = enemy.y - ENEMY_STOMP_ZONE_HEIGHT - 50
      const playerX = enemy.x
      
      const stompableEnemies = enemyManager.getStompableEnemies(playerX, playerY, 32, 32)
      
      expect(stompableEnemies).toHaveLength(0)
    })
  })

  describe('Reset Functionality', () => {
    test('should clear all enemies', () => {
      const enemy2 = { ...mockEnemy, x: 300 }
      enemyManager.setEnemies([mockEnemy, enemy2])
      expect(enemyManager.getEnemies()).toHaveLength(2)
      
      enemyManager.clearEnemies()
      expect(enemyManager.getEnemies()).toHaveLength(0)
    })

    test('should reset to initial state', () => {
      enemyManager.setEnemies([mockEnemy])
      enemyManager.clearEnemies()
      
      const enemies = enemyManager.getEnemies()
      expect(enemies).toEqual([])
    })
  })

  describe('Edge Cases', () => {
    test('should handle enemies with zero dimensions', () => {
      const enemy = { ...mockEnemy, width: 0, height: 0 }
      enemyManager.setEnemies([enemy])
      
      const result = enemyManager.updateEnemies()
      
      // Should handle zero dimensions gracefully
      expect(result.enemies).toHaveLength(1)
    })

    test('should handle enemies with negative positions', () => {
      const enemy = { ...mockEnemy, x: -100, y: -100 }
      enemyManager.setEnemies([enemy])
      
      const result = enemyManager.updateEnemies()
      
      // Should handle negative positions
      expect(result.enemies[0].x).toBe(-100)
      expect(result.enemies[0].y).toBe(-100)
    })

    test('should handle enemies with extreme velocities', () => {
      const enemy = { ...mockEnemy, velX: 1000, velY: -1000 }
      enemyManager.addEnemy(enemy) // Use addEnemy to create movement pattern
      
      const result = enemyManager.updateEnemies()
      
      // Movement pattern overrides initial velocity, but gravity still applies
      expect(result.enemies[0].velX).toBe(0.8) // Movement pattern speed
      expect(result.enemies[0].velY).toBe(0) // Grounded due to collision detection
    })

    test('should handle empty enemy list', () => {
      const result = enemyManager.updateEnemies()
      
      expect(result.enemies).toEqual([])
      expect(result.defeatedEnemies).toEqual([])
      expect(result.particles).toEqual([])
    })
  })

  describe('Performance', () => {
    test('should handle many enemies efficiently', () => {
      const enemies: Enemy[] = []
      for (let i = 0; i < 100; i++) {
        enemies.push({
          ...mockEnemy,
          x: i * 10,
          y: 300,
        })
      }
      
      enemyManager.setEnemies(enemies)
      
      const startTime = performance.now()
      const result = enemyManager.updateEnemies()
      const endTime = performance.now()
      
      const totalTime = endTime - startTime
      
      // Should update 100 enemies quickly (less than 10ms)
      expect(totalTime).toBeLessThan(10)
      expect(result.enemies).toHaveLength(100)
    })

    test('should maintain consistent performance with varying enemy counts', () => {
      const enemyCounts = [10, 50, 100]
      
      for (const count of enemyCounts) {
        const enemies: Enemy[] = []
        for (let i = 0; i < count; i++) {
          enemies.push({
            ...mockEnemy,
            x: i * 10,
            y: 300,
          })
        }
        
        enemyManager.setEnemies(enemies)
        
        const startTime = performance.now()
        enemyManager.updateEnemies()
        const endTime = performance.now()
        
        const totalTime = endTime - startTime
        
        // Performance should scale reasonably
        expect(totalTime).toBeLessThan(count * 0.1) // Less than 0.1ms per enemy
      }
    })
  })

  describe('Utility Methods', () => {
    test('should get enemy count', () => {
      const enemy2 = { ...mockEnemy, x: 300 }
      enemyManager.setEnemies([mockEnemy, enemy2])
      
      expect(enemyManager.getEnemyCount()).toBe(2)
    })

    test('should get enemy stats', () => {
      const horizontalEnemy = { ...mockEnemy, movementType: 'horizontal' }
      const verticalEnemy = { ...mockEnemy, x: 300, movementType: 'vertical' }
      enemyManager.setEnemies([horizontalEnemy, verticalEnemy])
      
      const stats = enemyManager.getEnemyStats()
      
      expect(stats.totalEnemies).toBe(2)
      expect(stats.horizontalEnemies).toBe(1)
      expect(stats.verticalEnemies).toBe(1)
      expect(stats.activeStompZones).toBe(0)
    })

    test('should add enemy', () => {
      const newEnemy = { ...mockEnemy, x: 400 }
      enemyManager.addEnemy(newEnemy)
      
      expect(enemyManager.getEnemyCount()).toBe(1)
      expect(enemyManager.getEnemies()[0]).toEqual(newEnemy)
    })

    test('should defeat enemy and generate particles', () => {
      const enemy = { ...mockEnemy, x: 200, y: 300 }
      enemyManager.setEnemies([enemy])
      
      const particles = enemyManager.defeatEnemy(enemy)
      
      expect(particles.length).toBeGreaterThan(0)
      expect(particles[0]).toHaveProperty('x')
      expect(particles[0]).toHaveProperty('y')
      expect(particles[0]).toHaveProperty('color')
    })
  })
}) 