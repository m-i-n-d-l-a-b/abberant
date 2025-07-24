/**
 * CollisionSystem - Spatial partitioning system using quadtree for efficient collision detection
 * Replaces O(n²) brute force collision detection with O(log n) spatial queries
 */

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface CollisionEntity {
  id: string
  bounds: BoundingBox
  type: 'player' | 'enemy' | 'collectible' | 'platform'
  data?: any // Additional entity data
}

export class QuadTreeNode {
  bounds: BoundingBox
  entities: CollisionEntity[]
  children: QuadTreeNode[]
  maxEntities: number
  maxDepth: number
  depth: number

  constructor(bounds: BoundingBox, maxEntities: number = 10, maxDepth: number = 8, depth: number = 0) {
    this.bounds = bounds
    this.entities = []
    this.children = []
    this.maxEntities = maxEntities
    this.maxDepth = maxDepth
    this.depth = depth
  }

  /**
   * Check if a bounding box intersects with this node's bounds
   */
  intersects(bounds: BoundingBox): boolean {
    return !(
      bounds.x > this.bounds.x + this.bounds.width ||
      bounds.x + bounds.width < this.bounds.x ||
      bounds.y > this.bounds.y + this.bounds.height ||
      bounds.y + bounds.height < this.bounds.y
    )
  }

  /**
   * Check if a bounding box is completely contained within this node
   */
  contains(bounds: BoundingBox): boolean {
    return (
      bounds.x >= this.bounds.x &&
      bounds.x + bounds.width <= this.bounds.x + this.bounds.width &&
      bounds.y >= this.bounds.y &&
      bounds.y + bounds.height <= this.bounds.y + this.bounds.height
    )
  }

  /**
   * Split the node into four children
   */
  split(): void {
    const halfWidth = this.bounds.width / 2
    const halfHeight = this.bounds.height / 2
    const midX = this.bounds.x + halfWidth
    const midY = this.bounds.y + halfHeight

    this.children = [
      new QuadTreeNode(
        { x: this.bounds.x, y: this.bounds.y, width: halfWidth, height: halfHeight },
        this.maxEntities,
        this.maxDepth,
        this.depth + 1
      ),
      new QuadTreeNode(
        { x: midX, y: this.bounds.y, width: halfWidth, height: halfHeight },
        this.maxEntities,
        this.maxDepth,
        this.depth + 1
      ),
      new QuadTreeNode(
        { x: this.bounds.x, y: midY, width: halfWidth, height: halfHeight },
        this.maxEntities,
        this.maxDepth,
        this.depth + 1
      ),
      new QuadTreeNode(
        { x: midX, y: midY, width: halfWidth, height: halfHeight },
        this.maxEntities,
        this.maxDepth,
        this.depth + 1
      )
    ]
  }

  /**
   * Insert an entity into the quadtree
   */
  insert(entity: CollisionEntity): boolean {
    if (!this.intersects(entity.bounds)) {
      return false
    }

    if (this.children.length === 0) {
      if (this.entities.length < this.maxEntities || this.depth >= this.maxDepth) {
        this.entities.push(entity)
        return true
      } else {
        this.split()
        // Redistribute existing entities
        const oldEntities = [...this.entities]
        this.entities = []
        for (const oldEntity of oldEntities) {
          this.insert(oldEntity)
        }
      }
    }

    // Insert into appropriate child
    for (const child of this.children) {
      if (child.insert(entity)) {
        return true
      }
    }

    // If entity doesn't fit in any child, keep it in this node
    this.entities.push(entity)
    return true
  }

  /**
   * Remove an entity from the quadtree
   */
  remove(entityId: string): boolean {
    // Check this node's entities
    const index = this.entities.findIndex(e => e.id === entityId)
    if (index !== -1) {
      this.entities.splice(index, 1)
      return true
    }

    // Check children
    for (const child of this.children) {
      if (child.remove(entityId)) {
        return true
      }
    }

    return false
  }

  /**
   * Query for entities that intersect with the given bounds
   */
  query(bounds: BoundingBox, filter?: (entity: CollisionEntity) => boolean): CollisionEntity[] {
    const result: CollisionEntity[] = []

    if (!this.intersects(bounds)) {
      return result
    }

    // Check entities in this node
    for (const entity of this.entities) {
      if (this.intersects(entity.bounds) && (!filter || filter(entity))) {
        result.push(entity)
      }
    }

    // Check children
    for (const child of this.children) {
      result.push(...child.query(bounds, filter))
    }

    return result
  }

  /**
   * Clear all entities from the quadtree
   */
  clear(): void {
    this.entities = []
    for (const child of this.children) {
      child.clear()
    }
    this.children = []
  }

  /**
   * Get all entities in the quadtree
   */
  getAllEntities(): CollisionEntity[] {
    const result = [...this.entities]
    for (const child of this.children) {
      result.push(...child.getAllEntities())
    }
    return result
  }
}

export class CollisionSystem {
  private quadtree: QuadTreeNode
  private entityMap: Map<string, CollisionEntity>
  private worldBounds: BoundingBox
  private debugMode: boolean = false

  constructor(worldBounds: BoundingBox, maxEntities: number = 10, maxDepth: number = 8) {
    this.quadtree = new QuadTreeNode(worldBounds, maxEntities, maxDepth)
    this.entityMap = new Map()
    this.worldBounds = worldBounds
  }

  /**
   * Enable or disable debug mode for collision logging
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }

  /**
   * Add an entity to the collision system with validation
   */
  addEntity(entity: CollisionEntity): void {


    // Validate entity bounds
    if (entity.bounds.width <= 0 || entity.bounds.height <= 0) {
      console.warn(`Invalid entity bounds for ${entity.id}:`, entity.bounds)
      return
    }

    this.entityMap.set(entity.id, entity)
    const success = this.quadtree.insert(entity)
    
    if (this.debugMode && !success) {
      console.warn(`Failed to insert entity ${entity.id} into quadtree`)
    }
  }

  /**
   * Remove an entity from the collision system
   */
  removeEntity(entityId: string): boolean {
    const removed = this.quadtree.remove(entityId)
    if (removed) {
      this.entityMap.delete(entityId)
    }
    return removed
  }

  /**
   * Update an entity's position/bounds with validation
   */
  updateEntity(entityId: string, newBounds: BoundingBox): boolean {
    const entity = this.entityMap.get(entityId)
    if (!entity) {
      if (this.debugMode) {
        console.warn(`Attempted to update non-existent entity: ${entityId}`)
      }
      return false
    }

    // Validate new bounds
    if (newBounds.width <= 0 || newBounds.height <= 0) {
      console.warn(`Invalid bounds for entity ${entityId}:`, newBounds)
      return false
    }



    // Remove and re-insert with new bounds
    const removed = this.quadtree.remove(entityId)
    if (!removed && this.debugMode) {
      console.warn(`Failed to remove entity ${entityId} from quadtree for update`)
    }

    entity.bounds = newBounds
    const inserted = this.quadtree.insert(entity)
    
    if (this.debugMode && !inserted) {
      console.warn(`Failed to re-insert entity ${entityId} into quadtree after update`)
    }

    return inserted
  }

  /**
   * Get all entities that could collide with the given bounds
   */
  getPotentialCollisions(bounds: BoundingBox, filter?: (entity: CollisionEntity) => boolean): CollisionEntity[] {
    return this.quadtree.query(bounds, filter)
  }

  /**
   * Check for collisions between a specific entity and others
   */
  checkEntityCollisions(entityId: string, filter?: (entity: CollisionEntity) => boolean): CollisionEntity[] {
    const entity = this.entityMap.get(entityId)
    if (!entity) {
      return []
    }

    const potentialCollisions = this.quadtree.query(entity.bounds, filter)
    return potentialCollisions.filter(other => other.id !== entityId)
  }

  /**
   * Get all entities of a specific type
   */
  getEntitiesByType(type: CollisionEntity['type']): CollisionEntity[] {
    return this.quadtree.getAllEntities().filter(entity => entity.type === type)
  }

  /**
   * Check for player-enemy collisions with stomp detection and enhanced debugging
   */
  checkPlayerEnemyCollisions(playerBounds: BoundingBox, playerVelY: number): {
    enemies: CollisionEntity[]
    stompTargets: CollisionEntity[]
  } {
    const potentialEnemies = this.quadtree.query(playerBounds, entity => entity.type === 'enemy')
    const enemies: CollisionEntity[] = []
    const stompTargets: CollisionEntity[] = []

    for (const enemy of potentialEnemies) {
      // Check for actual collision
      if (this.boundsIntersect(playerBounds, enemy.bounds)) {
        enemies.push(enemy)
      }

      // Check for stomp zone (player falling and above enemy)
      if (playerVelY > 0) { // Player is falling
        const stompZoneHeight = 8
        const playerBottom = playerBounds.y + playerBounds.height
        const enemyTop = enemy.bounds.y
        const enemyBottom = enemy.bounds.y + enemy.bounds.height

        const isInStompZone = (
          playerBottom >= enemyTop - stompZoneHeight &&
          playerBottom <= enemyBottom + stompZoneHeight &&
          playerBounds.y < enemyTop + enemy.bounds.height * 0.7
        )

        if (isInStompZone) {
          stompTargets.push(enemy)
        }
      }
    }

    return { enemies, stompTargets }
  }

  /**
   * Check for player-platform collisions (grounding detection) with enhanced debugging
   */
  checkPlayerPlatformCollisions(playerBounds: BoundingBox, playerVelY: number): {
    platforms: CollisionEntity[]
    grounded: boolean
  } {
    const potentialPlatforms = this.quadtree.query(playerBounds, entity => entity.type === 'platform')
    const platforms: CollisionEntity[] = []
    let grounded = false

    for (const platform of potentialPlatforms) {
      if (this.boundsIntersect(playerBounds, platform.bounds)) {
        platforms.push(platform)
        
        // Check if player is grounded (on top of platform)
        if (playerVelY >= 0 && 
            playerBounds.y + playerBounds.height >= platform.bounds.y &&
            playerBounds.y + playerBounds.height <= platform.bounds.y + 5 && // Small tolerance
            playerBounds.x + playerBounds.width > platform.bounds.x &&
            playerBounds.x < platform.bounds.x + platform.bounds.width) {
          grounded = true
        }
      }
    }

    return { platforms, grounded }
  }

  /**
   * Check for player-collectible collisions
   */
  checkPlayerCollectibleCollisions(playerBounds: BoundingBox): CollisionEntity[] {
    return this.quadtree.query(playerBounds, entity => entity.type === 'collectible')
  }

  /**
   * Get enemies within a specific range of a position
   */
  getEnemiesInRange(centerX: number, centerY: number, range: number): CollisionEntity[] {
    const bounds: BoundingBox = {
      x: centerX - range,
      y: centerY - range,
      width: range * 2,
      height: range * 2
    }
    return this.quadtree.query(bounds, entity => entity.type === 'enemy')
  }

  /**
   * Get platforms that could support an entity at a given position
   */
  getSupportingPlatforms(x: number, y: number, width: number): CollisionEntity[] {
    const bounds: BoundingBox = {
      x: x - width * 0.5,
      y: y,
      width: width * 2,
      height: 50 // Check area below the entity
    }
    return this.quadtree.query(bounds, entity => entity.type === 'platform')
  }

  /**
   * Check if two bounding boxes intersect
   */
  private boundsIntersect(a: BoundingBox, b: BoundingBox): boolean {
    return !(
      a.x > b.x + b.width ||
      a.x + a.width < b.x ||
      a.y > b.y + b.height ||
      a.y + a.height < b.y
    )
  }

  /**
   * Clear all entities from the collision system
   */
  clear(): void {
    this.quadtree.clear()
    this.entityMap.clear()
  }

  /**
   * Get statistics about the collision system
   */
  getStats(): {
    totalEntities: number
    quadtreeDepth: number
    averageEntitiesPerNode: number
  } {
    const allEntities = this.quadtree.getAllEntities()
    const avgData = this.getAverageEntitiesPerNode(this.quadtree)
    const avg = avgData.totalNodes > 0 ? avgData.totalEntities / avgData.totalNodes : 0
    return {
      totalEntities: allEntities.length,
      quadtreeDepth: this.getMaxDepth(this.quadtree),
      averageEntitiesPerNode: avg
    }
  }

  private getMaxDepth(node: QuadTreeNode): number {
    if (node.children.length === 0) {
      return node.depth
    }
    return Math.max(...node.children.map(child => this.getMaxDepth(child)))
  }

  private getAverageEntitiesPerNode(node: QuadTreeNode): { totalEntities: number; totalNodes: number } {
    let totalEntities = node.entities.length
    let totalNodes = 1

    for (const child of node.children) {
      const childStats = this.getAverageEntitiesPerNode(child)
      totalEntities += childStats.totalEntities
      totalNodes += childStats.totalNodes
    }

    return { totalEntities, totalNodes }
  }

  /**
   * Validate collision system state and detect inconsistencies
   */
  validateSystemState(): {
    isValid: boolean
    issues: string[]
    entityCount: number
    quadtreeEntityCount: number
    mapEntityCount: number
  } {
    const issues: string[] = []
    const mapEntities = Array.from(this.entityMap.values())
    const quadtreeEntities = this.quadtree.getAllEntities()
    
    const mapEntityCount = mapEntities.length
    const quadtreeEntityCount = quadtreeEntities.length

    // Check for entity count mismatch
    if (mapEntityCount !== quadtreeEntityCount) {
      issues.push(`Entity count mismatch: map has ${mapEntityCount}, quadtree has ${quadtreeEntityCount}`)
    }

    // Check for entities in map but not in quadtree
    for (const mapEntity of mapEntities) {
      const foundInQuadtree = quadtreeEntities.find(qe => qe.id === mapEntity.id)
      if (!foundInQuadtree) {
        issues.push(`Entity ${mapEntity.id} in map but not in quadtree`)
      }
    }

    // Check for entities in quadtree but not in map
    for (const quadtreeEntity of quadtreeEntities) {
      if (!this.entityMap.has(quadtreeEntity.id)) {
        issues.push(`Entity ${quadtreeEntity.id} in quadtree but not in map`)
      }
    }

    // Check for invalid bounds
    for (const entity of mapEntities) {
      if (entity.bounds.width <= 0 || entity.bounds.height <= 0) {
        issues.push(`Entity ${entity.id} has invalid bounds: ${entity.bounds.width}x${entity.bounds.height}`)
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      entityCount: mapEntityCount,
      quadtreeEntityCount,
      mapEntityCount
    }
  }

  /**
   * Get detailed information about all entities in the system
   */
  getEntityInfo(): Array<{
    id: string
    type: string
    bounds: BoundingBox
    inMap: boolean
    inQuadtree: boolean
  }> {
    const mapEntities = Array.from(this.entityMap.values())
    const quadtreeEntities = this.quadtree.getAllEntities()
    const allIds = new Set([...mapEntities.map(e => e.id), ...quadtreeEntities.map(e => e.id)])
    
    return Array.from(allIds).map(id => {
      const mapEntity = this.entityMap.get(id)
      const quadtreeEntity = quadtreeEntities.find(e => e.id === id)
      
      return {
        id,
        type: mapEntity?.type || quadtreeEntity?.type || 'unknown',
        bounds: mapEntity?.bounds || quadtreeEntity?.bounds || { x: 0, y: 0, width: 0, height: 0 },
        inMap: !!mapEntity,
        inQuadtree: !!quadtreeEntity
      }
    })
  }
} 