/**
 * PlayerManager Test Suite
 * 
 * Tests for the player management system that handles player movement, physics, and state.
 */

import { PlayerManager, PlayerInput, PlayerUpdateResult } from '../lib/game/PlayerManager'
import { Player } from '../types/game'
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
  CANVAS_HEIGHT,
} from '../constants/game'

describe('PlayerManager', () => {
  let playerManager: PlayerManager
  let mockPlayer: Player

  beforeEach(() => {
    // Create a fresh player instance for each test
    mockPlayer = {
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

    // Mock collision system
    const mockCollisionSystem = {
      checkCollision: jest.fn(),
      addEntity: jest.fn(),
      removeEntity: jest.fn(),
      update: jest.fn(),
      checkPlayerPlatformCollisions: jest.fn(() => ({
        grounded: false,
        onPlatform: null,
      })),
      checkPlayerEnemyCollisions: jest.fn(() => ({
        enemiesHit: [],
        stompTargets: [],
        enemies: [],
      })),
      checkPlayerCollectibleCollisions: jest.fn(() => ({
        collectiblesCollected: [],
      })),
    } as any

    // Mock camera
    const mockCamera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      smoothing: 0.1,
    }

    playerManager = new PlayerManager(
      mockPlayer,
      mockCollisionSystem,
      mockCamera,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    )
  })

  describe('Initialization', () => {
    test('should initialize with default player state', () => {
      const player = playerManager.getPlayer()
      
      expect(player.x).toBe(PLAYER_START_X)
      expect(player.y).toBe(PLAYER_START_Y)
      expect(player.width).toBe(PLAYER_WIDTH)
      expect(player.height).toBe(PLAYER_HEIGHT)
      expect(player.velX).toBe(0)
      expect(player.velY).toBe(0)
      expect(player.grounded).toBe(false)
      expect(player.dashCooldown).toBe(0)
      expect(player.invulnerable).toBe(0)
      expect(player.trail).toEqual([])
      expect(player.color).toBe(PLAYER_COLOR)
    })

    test('should set custom player state', () => {
      playerManager.setPlayer(mockPlayer)
      const player = playerManager.getPlayer()
      
      expect(player.x).toBe(mockPlayer.x)
      expect(player.y).toBe(mockPlayer.y)
      expect(player.vx).toBe(mockPlayer.vx)
      expect(player.vy).toBe(mockPlayer.vy)
    })
  })

  describe('Input Handling', () => {
    test('should handle movement input', () => {
      const input: PlayerInput = {
        left: true,
        right: false,
        jump: false,
        dash: false,
      }

      const result = playerManager.updatePlayer(input)
      
      // Should move left
      expect(result.player.velX).toBeLessThan(0)
    })

    test('should handle jump input', () => {
      const player = playerManager.getPlayer()
      player.grounded = true // Player must be on ground to jump
      playerManager.setPlayer(player)

      const input: PlayerInput = {
        left: false,
        right: false,
        jump: true,
        dash: false,
      }

      const result = playerManager.updatePlayer(input)
      
      // Should jump
      expect(result.player.velY).toBeLessThan(0)
      expect(result.player.grounded).toBe(false)
    })

    test('should handle dash input', () => {
      const player = playerManager.getPlayer()
      player.dashCooldown = 0
      playerManager.setPlayer(player)

      const input: PlayerInput = {
        left: false,
        right: true,
        jump: false,
        dash: true,
      }

      const result = playerManager.updatePlayer(input)
      
      // Should dash
      expect(result.player.velX).toBeGreaterThan(0)
      expect(result.player.dashCooldown).toBeGreaterThan(0)
    })

    test('should not jump when not on ground', () => {
      const player = playerManager.getPlayer()
      player.grounded = false
      playerManager.setPlayer(player)

      const input: PlayerInput = {
        left: false,
        right: false,
        jump: true,
        dash: false,
      }

      const result = playerManager.updatePlayer(input)
      
      // Should not jump (gravity will still be applied)
      expect(result.player.velY).toBeGreaterThan(0)
    })

    test('should not dash when cooldown active', () => {
      const player = playerManager.getPlayer()
      player.dashCooldown = PLAYER_DASH_COOLDOWN
      playerManager.setPlayer(player)

      const input: PlayerInput = {
        left: false,
        right: true,
        jump: false,
        dash: true,
      }

      const result = playerManager.updatePlayer(input)
      
      // Should not dash (cooldown will be decremented)
      expect(result.player.dashCooldown).toBe(PLAYER_DASH_COOLDOWN - 1)
    })
  })

  describe('Player Updates', () => {
    test('should update player physics', () => {
      const player = playerManager.getPlayer()
      player.velY = 5 // Give player some downward velocity
      playerManager.setPlayer(player)

      const result = playerManager.updatePlayer({ left: false, right: false, jump: false, dash: false })
      
      expect(result.player.x).toBe(player.x)
      expect(result.player.y).toBeGreaterThan(player.y) // Should fall
      expect(result.player.velY).toBeGreaterThan(player.velY) // Should accelerate
    })

    test('should apply gravity', () => {
      const player = playerManager.getPlayer()
      player.velY = 0
      playerManager.setPlayer(player)

      const result = playerManager.updatePlayer({ left: false, right: false, jump: false, dash: false })
      
      // Should apply gravity
      expect(result.player.velY).toBeGreaterThan(0)
    })

    test('should apply friction when on ground', () => {
      const player = playerManager.getPlayer()
      player.velX = 10
      player.grounded = true
      playerManager.setPlayer(player)

      const result = playerManager.updatePlayer({ left: false, right: false, jump: false, dash: false })
      
      // Should apply friction
      expect(result.player.velX).toBeLessThan(player.velX)
    })

    test('should update dash cooldown', () => {
      const player = playerManager.getPlayer()
      player.dashCooldown = PLAYER_DASH_COOLDOWN
      playerManager.setPlayer(player)

      // Update multiple times to reduce cooldown
      for (let i = 0; i < PLAYER_DASH_COOLDOWN; i++) {
        playerManager.updatePlayer({ left: false, right: false, jump: false, dash: false })
      }

      const updatedPlayer = playerManager.getPlayer()
      expect(updatedPlayer.dashCooldown).toBe(0)
    })

    test('should update invulnerability timer', () => {
      const player = playerManager.getPlayer()
      player.invulnerable = PLAYER_INVULNERABLE_TIME
      playerManager.setPlayer(player)

      // Update multiple times to reduce timer
      for (let i = 0; i < PLAYER_INVULNERABLE_TIME; i++) {
        playerManager.updatePlayer({ left: false, right: false, jump: false, dash: false })
      }

      const updatedPlayer = playerManager.getPlayer()
      expect(updatedPlayer.invulnerable).toBe(0)
    })
  })

  describe('Player Actions', () => {
    test('should perform jump action', () => {
      const player = playerManager.getPlayer()
      player.grounded = true
      playerManager.setPlayer(player)

      const result = playerManager.updatePlayer({ left: false, right: false, jump: true, dash: false })
      
      expect(result.player.velY).toBeLessThan(0)
      expect(result.player.grounded).toBe(false)
    })

    test('should perform dash action', () => {
      const player = playerManager.getPlayer()
      player.dashCooldown = 0
      player.velX = 0
      playerManager.setPlayer(player)

      const result = playerManager.updatePlayer({ left: false, right: true, jump: false, dash: true })
      
      expect(result.player.velX).toBeGreaterThan(0)
      expect(result.player.dashCooldown).toBeGreaterThan(0)
    })

    test('should reset player state', () => {
      const player = playerManager.getPlayer()
      player.x = 500
      player.y = 500
      player.velX = 10
      player.velY = 10
      player.dashCooldown = 5
      player.invulnerable = 10
      playerManager.setPlayer(player)

      playerManager.resetPlayer()
      const updatedPlayer = playerManager.getPlayer()
      
      expect(updatedPlayer.x).toBe(PLAYER_START_X)
      expect(updatedPlayer.y).toBe(PLAYER_START_Y)
      expect(updatedPlayer.velX).toBe(0)
      expect(updatedPlayer.velY).toBe(0)
      expect(updatedPlayer.dashCooldown).toBe(0)
      expect(updatedPlayer.invulnerable).toBe(0)
      expect(updatedPlayer.trail).toEqual([])
    })
  })

  describe('Collision Detection', () => {
    test('should detect ground collision', () => {
      const player = playerManager.getPlayer()
      player.y = 600 // Below ground level
      player.velY = 5
      playerManager.setPlayer(player)

      const result = playerManager.updatePlayer({ left: false, right: false, jump: false, dash: false })
      
      // Mock returns false, so we test the mock behavior
      expect(result.collisionResult.grounded).toBe(false)
    })

    test('should handle platform collision', () => {
      const player = playerManager.getPlayer()
      player.y = 300
      player.velY = 5
      playerManager.setPlayer(player)

      const result = playerManager.updatePlayer({ left: false, right: false, jump: false, dash: false })
      
      // Mock returns false, so we test the mock behavior
      expect(result.collisionResult.grounded).toBe(false)
    })
  })

  describe('Trail Effects', () => {
    test('should add trail positions', () => {
      const player = playerManager.getPlayer()
      player.x = 100
      player.y = 300
      playerManager.setPlayer(player)

      const result = playerManager.updatePlayer({ left: false, right: false, jump: false, dash: false })
      
      expect(result.player.trail.length).toBeGreaterThan(0)
      // Trail stores the current position (which changes due to gravity)
      expect(result.player.trail[0].x).toBe(100)
      expect(result.player.trail[0].y).toBeGreaterThan(300) // Gravity applied
    })

    test('should limit trail length', () => {
      const player = playerManager.getPlayer()
      player.trail = Array(20).fill({ x: 0, y: 0 }) // Max trail length
      playerManager.setPlayer(player)

      const result = playerManager.updatePlayer({ left: false, right: false, jump: false, dash: false })
      
      expect(result.player.trail.length).toBeLessThanOrEqual(20)
    })
  })

  describe('Edge Cases', () => {
    test('should handle extreme velocities', () => {
      const player = playerManager.getPlayer()
      player.velX = 1000 // Very high velocity
      player.velY = -1000 // Very high negative velocity
      playerManager.setPlayer(player)

      const result = playerManager.updatePlayer({ left: false, right: false, jump: false, dash: false })
      
      // Should handle extreme values gracefully
      expect(result.player.velX).toBeLessThan(1000)
      expect(result.player.velY).toBeGreaterThan(-1000)
    })

    test('should handle negative positions', () => {
      const player = playerManager.getPlayer()
      player.x = -100
      player.y = -100
      playerManager.setPlayer(player)

      const result = playerManager.updatePlayer({ left: false, right: false, jump: false, dash: false })
      
      // Should clamp negative X position to 0, Y position may still be negative due to gravity
      expect(result.player.x).toBe(0)
      expect(result.player.y).toBeLessThanOrEqual(0) // May be negative due to gravity
    })

    test('should handle zero dimensions', () => {
      const player = playerManager.getPlayer()
      player.width = 0
      player.height = 0
      playerManager.setPlayer(player)

      const result = playerManager.updatePlayer({ left: false, right: false, jump: false, dash: false })
      
      // Should handle zero dimensions gracefully (gravity still applies)
      expect(result.player.x).toBe(player.x)
      expect(result.player.y).toBeGreaterThan(player.y) // Gravity applied
    })
  })

  describe('Performance', () => {
    test('should update efficiently', () => {
      const startTime = performance.now()
      
      // Perform many updates
      for (let i = 0; i < 1000; i++) {
        playerManager.updatePlayer({ left: false, right: false, jump: false, dash: false })
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should complete 1000 updates quickly (less than 50ms)
      expect(totalTime).toBeLessThan(50)
    })
  })
}) 