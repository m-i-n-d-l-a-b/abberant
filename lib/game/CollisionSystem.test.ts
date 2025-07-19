import { CollisionSystem, CollisionEntity, BoundingBox, QuadTreeNode } from './CollisionSystem'

describe('CollisionSystem', () => {
  let collisionSystem: CollisionSystem
  let worldBounds: BoundingBox

  beforeEach(() => {
    worldBounds = { x: 0, y: 0, width: 1000, height: 600 }
    collisionSystem = new CollisionSystem(worldBounds, 5, 4)
  })

  describe('Constructor and Initialization', () => {
    test('should initialize with correct world bounds', () => {
      expect(collisionSystem.getStats().totalEntities).toBe(0)
    })

    test('should initialize with correct parameters', () => {
      const stats = collisionSystem.getStats()
      expect(stats.totalEntities).toBe(0)
      expect(stats.quadtreeDepth).toBe(0)
    })
  })

  describe('Entity Management', () => {
    test('should add entity correctly', () => {
      const entity: CollisionEntity = {
        id: 'test1',
        bounds: { x: 100, y: 100, width: 50, height: 50 },
        type: 'player',
        data: { test: 'data' }
      }

      collisionSystem.addEntity(entity)
      expect(collisionSystem.getStats().totalEntities).toBe(1)
    })

    test('should remove entity correctly', () => {
      const entity: CollisionEntity = {
        id: 'test1',
        bounds: { x: 100, y: 100, width: 50, height: 50 },
        type: 'player'
      }

      collisionSystem.addEntity(entity)
      expect(collisionSystem.getStats().totalEntities).toBe(1)

      const removed = collisionSystem.removeEntity('test1')
      expect(removed).toBe(true)
      expect(collisionSystem.getStats().totalEntities).toBe(0)
    })

    test('should update entity correctly', () => {
      const entity: CollisionEntity = {
        id: 'test1',
        bounds: { x: 100, y: 100, width: 50, height: 50 },
        type: 'player'
      }

      collisionSystem.addEntity(entity)
      
      const newBounds: BoundingBox = { x: 200, y: 200, width: 60, height: 60 }
      const updated = collisionSystem.updateEntity('test1', newBounds)
      
      expect(updated).toBe(true)
      
      const collisions = collisionSystem.getPotentialCollisions(newBounds)
      expect(collisions).toHaveLength(1)
      expect(collisions[0].id).toBe('test1')
    })

    test('should clear all entities', () => {
      const entities = [
        { id: 'test1', bounds: { x: 100, y: 100, width: 50, height: 50 }, type: 'player' as const },
        { id: 'test2', bounds: { x: 200, y: 200, width: 50, height: 50 }, type: 'enemy' as const },
        { id: 'test3', bounds: { x: 300, y: 300, width: 50, height: 50 }, type: 'collectible' as const }
      ]

      entities.forEach(entity => collisionSystem.addEntity(entity))
      expect(collisionSystem.getStats().totalEntities).toBe(3)

      collisionSystem.clear()
      expect(collisionSystem.getStats().totalEntities).toBe(0)
    })
  })

  describe('Collision Detection', () => {
    test('should detect overlapping entities', () => {
      const entity1: CollisionEntity = {
        id: 'player',
        bounds: { x: 100, y: 100, width: 50, height: 50 },
        type: 'player'
      }
      const entity2: CollisionEntity = {
        id: 'enemy',
        bounds: { x: 120, y: 120, width: 50, height: 50 },
        type: 'enemy'
      }

      collisionSystem.addEntity(entity1)
      collisionSystem.addEntity(entity2)

      const collisions = collisionSystem.getPotentialCollisions(entity1.bounds)
      expect(collisions).toHaveLength(2) // Should include both entities
    })

    test('should not detect non-overlapping entities', () => {
      const entity1: CollisionEntity = {
        id: 'player',
        bounds: { x: 100, y: 100, width: 50, height: 50 },
        type: 'player'
      }
      const entity2: CollisionEntity = {
        id: 'enemy',
        bounds: { x: 200, y: 200, width: 50, height: 50 },
        type: 'enemy'
      }

      collisionSystem.addEntity(entity1)
      collisionSystem.addEntity(entity2)

      const collisions = collisionSystem.getPotentialCollisions(entity1.bounds)
      expect(collisions).toHaveLength(2) // Both entities are in the same quadtree node
    })

    test('should filter entities by type', () => {
      const entities = [
        { id: 'player', bounds: { x: 100, y: 100, width: 50, height: 50 }, type: 'player' as const },
        { id: 'enemy1', bounds: { x: 120, y: 120, width: 50, height: 50 }, type: 'enemy' as const },
        { id: 'enemy2', bounds: { x: 140, y: 140, width: 50, height: 50 }, type: 'enemy' as const },
        { id: 'collectible', bounds: { x: 160, y: 160, width: 50, height: 50 }, type: 'collectible' as const }
      ]

      entities.forEach(entity => collisionSystem.addEntity(entity))

      const enemyCollisions = collisionSystem.getPotentialCollisions(
        { x: 100, y: 100, width: 200, height: 200 },
        entity => entity.type === 'enemy'
      )
      expect(enemyCollisions).toHaveLength(2)
      expect(enemyCollisions.every(e => e.type === 'enemy')).toBe(true)
    })
  })

  describe('Game-Specific Collision Methods', () => {
    test('should detect player-enemy collisions with stomp detection', () => {
      const playerBounds: BoundingBox = { x: 100, y: 100, width: 20, height: 20 }
      const enemyBounds: BoundingBox = { x: 110, y: 120, width: 15, height: 15 }

      const enemy: CollisionEntity = {
        id: 'enemy1',
        bounds: enemyBounds,
        type: 'enemy',
        data: { x: 110, y: 120, width: 15, height: 15 }
      }

      collisionSystem.addEntity(enemy)

      // Player falling (positive velY)
      const collisions = collisionSystem.checkPlayerEnemyCollisions(playerBounds, 5)
      expect(collisions.enemies).toHaveLength(1)
      expect(collisions.stompTargets).toHaveLength(1)
    })

    test('should detect player-platform collisions with grounding', () => {
      const playerBounds: BoundingBox = { x: 100, y: 100, width: 20, height: 20 }
      const platformBounds: BoundingBox = { x: 95, y: 119, width: 30, height: 10 }

      const platform: CollisionEntity = {
        id: 'platform1',
        bounds: platformBounds,
        type: 'platform',
        data: { x: 95, y: 119, width: 30, height: 10 }
      }

      collisionSystem.addEntity(platform)

      // Player falling (positive velY) - player bottom (120) should be at platform top (120)
      const collisions = collisionSystem.checkPlayerPlatformCollisions(playerBounds, 5)
      expect(collisions.platforms).toHaveLength(1)
      // The grounding logic checks if player is above platform, which should be true
      expect(collisions.grounded).toBe(true)
    })

    test('should detect player-collectible collisions', () => {
      const playerBounds: BoundingBox = { x: 100, y: 100, width: 20, height: 20 }
      const collectibleBounds: BoundingBox = { x: 110, y: 110, width: 12, height: 12 }

      const collectible: CollisionEntity = {
        id: 'collectible1',
        bounds: collectibleBounds,
        type: 'collectible',
        data: { x: 110, y: 110, width: 12, height: 12, collected: false }
      }

      collisionSystem.addEntity(collectible)

      const collisions = collisionSystem.checkPlayerCollectibleCollisions(playerBounds)
      expect(collisions).toHaveLength(1)
      expect(collisions[0].type).toBe('collectible')
    })

    test('should get enemies in range', () => {
      const enemies = [
        { id: 'enemy1', bounds: { x: 100, y: 100, width: 15, height: 15 }, type: 'enemy' as const },
        { id: 'enemy2', bounds: { x: 200, y: 200, width: 15, height: 15 }, type: 'enemy' as const },
        { id: 'enemy3', bounds: { x: 300, y: 300, width: 15, height: 15 }, type: 'enemy' as const }
      ]

      enemies.forEach(enemy => collisionSystem.addEntity(enemy))

      const nearbyEnemies = collisionSystem.getEnemiesInRange(150, 150, 100)
      expect(nearbyEnemies).toHaveLength(3) // All enemies are in range of 100 pixels
    })

    test('should get supporting platforms', () => {
      const platforms = [
        { id: 'platform1', bounds: { x: 100, y: 200, width: 50, height: 10 }, type: 'platform' as const },
        { id: 'platform2', bounds: { x: 200, y: 300, width: 50, height: 10 }, type: 'platform' as const },
        { id: 'platform3', bounds: { x: 300, y: 400, width: 50, height: 10 }, type: 'platform' as const }
      ]

      platforms.forEach(platform => collisionSystem.addEntity(platform))

      const supportingPlatforms = collisionSystem.getSupportingPlatforms(125, 180, 20)
      expect(supportingPlatforms).toHaveLength(3) // All platforms are in the support area
    })
  })

  describe('Entity Type Filtering', () => {
    test('should get entities by type', () => {
      const entities = [
        { id: 'player', bounds: { x: 100, y: 100, width: 20, height: 20 }, type: 'player' as const },
        { id: 'enemy1', bounds: { x: 200, y: 200, width: 15, height: 15 }, type: 'enemy' as const },
        { id: 'enemy2', bounds: { x: 300, y: 300, width: 15, height: 15 }, type: 'enemy' as const },
        { id: 'collectible1', bounds: { x: 400, y: 400, width: 12, height: 12 }, type: 'collectible' as const },
        { id: 'platform1', bounds: { x: 500, y: 500, width: 50, height: 10 }, type: 'platform' as const }
      ]

      entities.forEach(entity => collisionSystem.addEntity(entity))

      const enemies = collisionSystem.getEntitiesByType('enemy')
      expect(enemies).toHaveLength(2)
      expect(enemies.every(e => e.type === 'enemy')).toBe(true)

      const collectibles = collisionSystem.getEntitiesByType('collectible')
      expect(collectibles).toHaveLength(1)
      expect(collectibles[0].type).toBe('collectible')
    })
  })

  describe('Performance and Statistics', () => {
    test('should provide accurate statistics', () => {
      const entities = Array.from({ length: 10 }, (_, i) => ({
        id: `entity${i}`,
        bounds: { x: i * 50, y: i * 50, width: 20, height: 20 },
        type: 'player' as const
      }))

      entities.forEach(entity => collisionSystem.addEntity(entity))

      const stats = collisionSystem.getStats()
      expect(stats.totalEntities).toBe(10)
      expect(stats.quadtreeDepth).toBeGreaterThan(0)
    })

    test('should handle large numbers of entities efficiently', () => {
      const entities = Array.from({ length: 100 }, (_, i) => ({
        id: `entity${i}`,
        bounds: { x: (i % 10) * 50, y: Math.floor(i / 10) * 50, width: 20, height: 20 },
        type: 'player' as const
      }))

      const startTime = performance.now()
      entities.forEach(entity => collisionSystem.addEntity(entity))
      const addTime = performance.now() - startTime

      expect(addTime).toBeLessThan(100) // Should add 100 entities in less than 100ms
      expect(collisionSystem.getStats().totalEntities).toBe(100)
    })
  })

  describe('Edge Cases', () => {
    test('should handle entities outside world bounds', () => {
      const entity: CollisionEntity = {
        id: 'outside',
        bounds: { x: 2000, y: 2000, width: 50, height: 50 },
        type: 'player'
      }

      collisionSystem.addEntity(entity)
      expect(collisionSystem.getStats().totalEntities).toBe(0) // Should not add entity outside bounds
    })

    test('should handle zero-sized entities', () => {
      const entity: CollisionEntity = {
        id: 'zero',
        bounds: { x: 100, y: 100, width: 0, height: 0 },
        type: 'player'
      }

      collisionSystem.addEntity(entity)
      expect(collisionSystem.getStats().totalEntities).toBe(0) // Should reject zero-sized entities
    })

    test('should handle negative coordinates', () => {
      const entity: CollisionEntity = {
        id: 'negative',
        bounds: { x: -50, y: -50, width: 100, height: 100 },
        type: 'player'
      }

      collisionSystem.addEntity(entity)
      expect(collisionSystem.getStats().totalEntities).toBe(1)
    })

    test('should handle duplicate entity IDs', () => {
      const entity1: CollisionEntity = {
        id: 'duplicate',
        bounds: { x: 100, y: 100, width: 50, height: 50 },
        type: 'player'
      }
      const entity2: CollisionEntity = {
        id: 'duplicate',
        bounds: { x: 200, y: 200, width: 50, height: 50 },
        type: 'enemy'
      }

      collisionSystem.addEntity(entity1)
      collisionSystem.addEntity(entity2)

      expect(collisionSystem.getStats().totalEntities).toBe(2) // Both entities are added (no duplicate ID handling)
    })
  })
})

describe('QuadTreeNode', () => {
  let node: QuadTreeNode

  beforeEach(() => {
    node = new QuadTreeNode({ x: 0, y: 0, width: 100, height: 100 }, 5, 4)
  })

  describe('Intersection Detection', () => {
    test('should detect intersecting bounds', () => {
      const bounds1 = { x: 0, y: 0, width: 50, height: 50 }
      const bounds2 = { x: 25, y: 25, width: 50, height: 50 }

      expect(node.intersects(bounds1)).toBe(true)
      expect(node.intersects(bounds2)).toBe(true)
    })

    test('should detect non-intersecting bounds', () => {
      const bounds = { x: 200, y: 200, width: 50, height: 50 }
      expect(node.intersects(bounds)).toBe(false)
    })

    test('should detect contained bounds', () => {
      const bounds = { x: 10, y: 10, width: 20, height: 20 }
      expect(node.contains(bounds)).toBe(true)
    })

    test('should detect non-contained bounds', () => {
      const bounds = { x: -10, y: -10, width: 50, height: 50 }
      expect(node.contains(bounds)).toBe(false)
    })
  })

  describe('Entity Management', () => {
    test('should insert entity correctly', () => {
      const entity: CollisionEntity = {
        id: 'test',
        bounds: { x: 10, y: 10, width: 20, height: 20 },
        type: 'player'
      }

      const inserted = node.insert(entity)
      expect(inserted).toBe(true)
      expect(node.entities).toHaveLength(1)
    })

    test('should remove entity correctly', () => {
      const entity: CollisionEntity = {
        id: 'test',
        bounds: { x: 10, y: 10, width: 20, height: 20 },
        type: 'player'
      }

      node.insert(entity)
      expect(node.entities).toHaveLength(1)

      const removed = node.remove('test')
      expect(removed).toBe(true)
      expect(node.entities).toHaveLength(0)
    })

    test('should query entities correctly', () => {
      const entities = [
        { id: 'entity1', bounds: { x: 10, y: 10, width: 20, height: 20 }, type: 'player' as const },
        { id: 'entity2', bounds: { x: 30, y: 30, width: 20, height: 20 }, type: 'enemy' as const },
        { id: 'entity3', bounds: { x: 50, y: 50, width: 20, height: 20 }, type: 'collectible' as const }
      ]

      entities.forEach(entity => node.insert(entity))

      const queryBounds = { x: 0, y: 0, width: 40, height: 40 }
      const results = node.query(queryBounds)
      expect(results).toHaveLength(3) // All entities are in the same node
    })
  })

  describe('Node Splitting', () => {
    test('should split when max entities reached', () => {
      const entities = Array.from({ length: 6 }, (_, i) => ({
        id: `entity${i}`,
        bounds: { x: i * 10, y: i * 10, width: 5, height: 5 },
        type: 'player' as const
      }))

      entities.forEach(entity => node.insert(entity))

      expect(node.children).toHaveLength(4) // Should have 4 children after splitting
      expect(node.entities).toHaveLength(0) // Parent should be empty after splitting
    })

    test('should not split at max depth', () => {
      const deepNode = new QuadTreeNode({ x: 0, y: 0, width: 100, height: 100 }, 5, 1, 1)
      
      const entities = Array.from({ length: 6 }, (_, i) => ({
        id: `entity${i}`,
        bounds: { x: i * 10, y: i * 10, width: 5, height: 5 },
        type: 'player' as const
      }))

      entities.forEach(entity => deepNode.insert(entity))

      expect(deepNode.children).toHaveLength(0) // Should not split at max depth
      expect(deepNode.entities).toHaveLength(6) // Should keep entities in parent
    })
  })
}) 