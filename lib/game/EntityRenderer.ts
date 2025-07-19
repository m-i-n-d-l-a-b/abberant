/**
 * Entity Renderer
 * 
 * This module handles all entity rendering logic including:
 * - Player rendering with trail effects
 * - Enemy rendering with different types
 * - Platform rendering with various types
 * - Collectible rendering
 * - Entity state visualization
 * - Animation and visual effects
 */

import { Player, Enemy, Platform, Collectible, Camera, Effects } from '../../types/game'
import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  COLLECTIBLE_WIDTH,
  COLLECTIBLE_HEIGHT
} from '../../constants/game'

export interface EntityRenderContext {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  camera: Camera
  effects: Effects
  frameCount: number
  deltaTime: number
  now: number
}

export interface EntityLayer {
  name: string
  priority: number
  visible: boolean
  render: (context: EntityRenderContext) => void
}

export class EntityRenderer {
  private width: number
  private height: number
  private layers: Map<string, EntityLayer>
  private player: Player | null
  private enemies: Enemy[]
  private platforms: Platform[]
  private collectibles: Collectible[]

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.layers = new Map()
    this.player = null
    this.enemies = []
    this.platforms = []
    this.collectibles = []

    this.initializeLayers()
  }

  /**
   * Initialize entity layers
   */
  private initializeLayers(): void {
    // Platforms layer (furthest back)
    this.addLayer('platforms', 0, true, (context) => {
      this.renderPlatforms(context)
    })

    // Collectibles layer
    this.addLayer('collectibles', 1, true, (context) => {
      this.renderCollectibles(context)
    })

    // Enemies layer
    this.addLayer('enemies', 2, true, (context) => {
      this.renderEnemies(context)
    })

    // Player layer (closest to camera)
    this.addLayer('player', 3, true, (context) => {
      this.renderPlayer(context)
    })
  }

  /**
   * Add an entity layer
   */
  addLayer(name: string, priority: number, visible: boolean, render: (context: EntityRenderContext) => void): void {
    this.layers.set(name, {
      name,
      priority,
      visible,
      render
    })
  }

  /**
   * Remove an entity layer
   */
  removeLayer(name: string): boolean {
    return this.layers.delete(name)
  }

  /**
   * Set layer visibility
   */
  setLayerVisibility(name: string, visible: boolean): void {
    const layer = this.layers.get(name)
    if (layer) {
      layer.visible = visible
    }
  }

  /**
   * Set entities for rendering
   */
  setEntities(player: Player | null, enemies: Enemy[], platforms: Platform[], collectibles: Collectible[]): void {
    this.player = player
    this.enemies = [...enemies]
    this.platforms = [...platforms]
    this.collectibles = [...collectibles]
  }

  /**
   * Render all entity layers
   */
  render(context: EntityRenderContext): void {
    // Render layers in priority order (furthest to closest)
    const sortedLayers = Array.from(this.layers.values())
      .filter(layer => layer.visible)
      .sort((a, b) => a.priority - b.priority)

    for (const layer of sortedLayers) {
      layer.render(context)
    }
  }

  /**
   * Render platforms layer
   */
  private renderPlatforms(context: EntityRenderContext): void {
    const { ctx, camera } = context

    for (const platform of this.platforms) {
      const x = platform.x - camera.x
      const y = platform.y - camera.y

      // Skip platforms outside viewport
      if (x < -platform.width || x > this.width + platform.width || 
          y < -platform.height || y > this.height + platform.height) {
        continue
      }

      // Apply platform-specific effects
      this.renderPlatform(ctx, platform, x, y, context)
    }
  }

  /**
   * Render a single platform
   */
  private renderPlatform(ctx: CanvasRenderingContext2D, platform: Platform, x: number, y: number, context: EntityRenderContext): void {
    ctx.save()

    // Apply distortion effect
    if (platform.distortionOffset > 0) {
      const distortion = Math.sin(context.now * 0.01 + platform.distortionOffset) * 2
      ctx.translate(x + distortion, y)
    } else {
      ctx.translate(x, y)
    }

    // Set platform color
    ctx.fillStyle = platform.color

    // Render based on platform type
    switch (platform.type) {
      case 'normal':
        this.renderNormalPlatform(ctx, platform)
        break
      case 'moving':
        this.renderMovingPlatform(ctx, platform, context)
        break
      case 'breakable':
        this.renderBreakablePlatform(ctx, platform, context)
        break
      case 'liquid':
        this.renderLiquidPlatform(ctx, platform, context)
        break
      case 'bouncy':
        this.renderBouncyPlatform(ctx, platform, context)
        break
      case 'start':
        this.renderStartPlatform(ctx, platform)
        break
      case 'end':
        this.renderEndPlatform(ctx, platform)
        break
      default:
        this.renderNormalPlatform(ctx, platform)
    }

    ctx.restore()
  }

  /**
   * Render normal platform
   */
  private renderNormalPlatform(ctx: CanvasRenderingContext2D, platform: Platform): void {
    ctx.fillRect(0, 0, platform.width, platform.height)
  }

  /**
   * Render moving platform
   */
  private renderMovingPlatform(ctx: CanvasRenderingContext2D, platform: Platform, context: EntityRenderContext): void {
    // Add pulsing effect for moving platforms
    const pulse = Math.sin(context.now * 0.005) * 0.2 + 0.8
    ctx.globalAlpha = pulse
    
    ctx.fillRect(0, 0, platform.width, platform.height)
    
    // Add movement indicator
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(2, 2, platform.width - 4, platform.height - 4)
    
    ctx.globalAlpha = 1.0
  }

  /**
   * Render breakable platform
   */
  private renderBreakablePlatform(ctx: CanvasRenderingContext2D, platform: Platform, context: EntityRenderContext): void {
    // Add crack effect
    const crackIntensity = Math.sin(context.now * 0.01) * 0.3 + 0.7
    ctx.globalAlpha = crackIntensity
    
    ctx.fillRect(0, 0, platform.width, platform.height)
    
    // Add crack lines
    ctx.strokeStyle = '#ff0000'
    ctx.lineWidth = 1
    for (let i = 0; i < 3; i++) {
      const startX = Math.random() * platform.width
      const startY = Math.random() * platform.height
      const endX = startX + (Math.random() - 0.5) * 20
      const endY = startY + (Math.random() - 0.5) * 20
      
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
      ctx.stroke()
    }
    
    ctx.globalAlpha = 1.0
  }

  /**
   * Render liquid platform
   */
  private renderLiquidPlatform(ctx: CanvasRenderingContext2D, platform: Platform, context: EntityRenderContext): void {
    // Render base platform
    ctx.fillRect(0, 0, platform.width, platform.height)
    
    // Render liquid pixels
    if (platform.liquidPixels.length > 0) {
      ctx.globalAlpha = 0.7
      for (const pixel of platform.liquidPixels) {
        const pixelX = pixel.x + Math.sin(context.now * 0.01 + pixel.velX) * 2
        const pixelY = pixel.y + Math.cos(context.now * 0.01 + pixel.velY) * 2
        
        ctx.fillStyle = `rgba(0, 150, 255, ${pixel.opacity})`
        ctx.fillRect(pixelX, pixelY, pixel.size, pixel.size)
      }
      ctx.globalAlpha = 1.0
    }
  }

  /**
   * Render bouncy platform
   */
  private renderBouncyPlatform(ctx: CanvasRenderingContext2D, platform: Platform, context: EntityRenderContext): void {
    // Add bounce effect
    const bounce = Math.sin(context.now * 0.01) * 3
    ctx.translate(0, bounce)
    
    ctx.fillRect(0, 0, platform.width, platform.height)
    
    // Add bounce indicator
    ctx.strokeStyle = '#ff00ff'
    ctx.lineWidth = 2
    ctx.strokeRect(2, 2, platform.width - 4, platform.height - 4)
  }

  /**
   * Render start platform
   */
  private renderStartPlatform(ctx: CanvasRenderingContext2D, platform: Platform): void {
    ctx.fillRect(0, 0, platform.width, platform.height)
    
    // Add start indicator
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('START', platform.width / 2, platform.height / 2 + 4)
  }

  /**
   * Render end platform
   */
  private renderEndPlatform(ctx: CanvasRenderingContext2D, platform: Platform): void {
    ctx.fillRect(0, 0, platform.width, platform.height)
    
    // Add end indicator
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('END', platform.width / 2, platform.height / 2 + 4)
  }

  /**
   * Render collectibles layer
   */
  private renderCollectibles(context: EntityRenderContext): void {
    const { ctx, camera } = context

    for (const collectible of this.collectibles) {
      if (collectible.collected) continue

      const x = collectible.x - camera.x
      const y = collectible.y - camera.y

      // Skip collectibles outside viewport
      if (x < -collectible.width || x > this.width + collectible.width || 
          y < -collectible.height || y > this.height + collectible.height) {
        continue
      }

      this.renderCollectible(ctx, collectible, x, y, context)
    }
  }

  /**
   * Render a single collectible
   */
  private renderCollectible(ctx: CanvasRenderingContext2D, collectible: Collectible, x: number, y: number, context: EntityRenderContext): void {
    ctx.save()

    // Add floating animation
    const float = Math.sin(context.now * 0.005) * 3
    ctx.translate(x, y + float)

    // Add rotation effect
    const rotation = context.now * 0.002
    ctx.rotate(rotation)

    // Set collectible color
    ctx.fillStyle = collectible.color

    // Draw collectible (diamond shape)
    ctx.beginPath()
    ctx.moveTo(collectible.width / 2, 0)
    ctx.lineTo(collectible.width, collectible.height / 2)
    ctx.lineTo(collectible.width / 2, collectible.height)
    ctx.lineTo(0, collectible.height / 2)
    ctx.closePath()
    ctx.fill()

    // Add glow effect
    const glowGradient = ctx.createRadialGradient(
      collectible.width / 2, collectible.height / 2, 0,
      collectible.width / 2, collectible.height / 2, collectible.width
    )
    glowGradient.addColorStop(0, `${collectible.color}80`)
    glowGradient.addColorStop(1, 'transparent')

    ctx.fillStyle = glowGradient
    ctx.fill()

    // Add value indicator
    ctx.fillStyle = '#ffffff'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(collectible.value.toString(), collectible.width / 2, collectible.height / 2 + 3)

    ctx.restore()
  }

  /**
   * Render enemies layer
   */
  private renderEnemies(context: EntityRenderContext): void {
    const { ctx, camera } = context

    for (const enemy of this.enemies) {
      const x = enemy.x - camera.x
      const y = enemy.y - camera.y

      // Skip enemies outside viewport
      if (x < -enemy.width || x > this.width + enemy.width || 
          y < -enemy.height || y > this.height + enemy.height) {
        continue
      }

      this.renderEnemy(ctx, enemy, x, y, context)
    }
  }

  /**
   * Render a single enemy
   */
  private renderEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, x: number, y: number, context: EntityRenderContext): void {
    ctx.save()
    ctx.translate(x, y)

    // Set enemy color based on movement type
    let color = '#ff0000'
    switch (enemy.movementType) {
      case 'horizontal':
        color = '#ff4444'
        break
      case 'vertical':
        color = '#ff6666'
        break
      default:
        color = '#ff0000'
    }

    ctx.fillStyle = color

    // Add movement effect
    const movement = Math.sin(context.now * 0.01 + enemy.x * 0.1) * 2
    ctx.translate(movement, 0)

    // Draw enemy body
    ctx.fillRect(0, 0, enemy.width, enemy.height)

    // Add enemy features based on movement type
    switch (enemy.movementType) {
      case 'horizontal':
        this.renderHorizontalEnemy(ctx, enemy)
        break
      case 'vertical':
        this.renderVerticalEnemy(ctx, enemy)
        break
    }

    // Add stomp zone indicator
    if (enemy.stompZoneActive) {
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 1
      ctx.strokeRect(0, -5, enemy.width, 5)
    }

    ctx.restore()
  }

  /**
   * Render horizontal enemy
   */
  private renderHorizontalEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    // Add direction indicator
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(enemy.velX > 0 ? enemy.width - 4 : 0, 2, 4, 4)
  }

  /**
   * Render vertical enemy
   */
  private renderVerticalEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    // Add vertical movement indicator
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(2, enemy.velY > 0 ? enemy.height - 4 : 0, 4, 4)
  }



  /**
   * Render player layer
   */
  private renderPlayer(context: EntityRenderContext): void {
    if (!this.player) return

    const { ctx, camera } = context
    const x = this.player.x - camera.x
    const y = this.player.y - camera.y

    // Skip if player is outside viewport
    if (x < -this.player.width || x > this.width + this.player.width || 
        y < -this.player.height || y > this.height + this.player.height) {
      return
    }

    this.renderPlayerEntity(ctx, this.player, x, y, context)
  }

  /**
   * Render player entity
   */
  private renderPlayerEntity(ctx: CanvasRenderingContext2D, player: Player, x: number, y: number, context: EntityRenderContext): void {
    ctx.save()
    ctx.translate(x, y)

    // Apply invincibility effect
    if (player.invulnerable > 0) {
      const flash = Math.sin(context.now * 0.02) > 0
      if (!flash) {
        ctx.globalAlpha = 0.5
      }
    }

    // Set player color
    ctx.fillStyle = player.color

    // Draw player body
    ctx.fillRect(0, 0, player.width, player.height)

    // Add player features
    this.renderPlayerFeatures(ctx, player, context)

    // Render trail effect
    if (player.trail.length > 0) {
      this.renderPlayerTrail(ctx, player, context)
    }

    ctx.restore()
  }

  /**
   * Render player features
   */
  private renderPlayerFeatures(ctx: CanvasRenderingContext2D, player: Player, context: EntityRenderContext): void {
    // Add direction indicator based on velocity
    ctx.fillStyle = '#ffffff'
    if (player.velX > 0) {
      ctx.fillRect(player.width - 4, 2, 4, 4)
    } else if (player.velX < 0) {
      ctx.fillRect(0, 2, 4, 4)
    }

    // Add dash indicator based on dash cooldown
    if (player.dashCooldown > 0) {
      ctx.strokeStyle = '#ffff00'
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, player.width - 2, player.height - 2)
    }

    // Add jump indicator based on grounded state
    if (!player.grounded) {
      ctx.fillStyle = '#00ffff'
      ctx.fillRect(player.width / 2 - 2, 0, 4, 4)
    }
  }

  /**
   * Render player trail
   */
  private renderPlayerTrail(ctx: CanvasRenderingContext2D, player: Player, context: EntityRenderContext): void {
    for (let i = 0; i < player.trail.length; i++) {
      const trailPoint = player.trail[i]
      const alpha = (i / player.trail.length) * 0.5
      
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = player.color
      ctx.fillRect(trailPoint.x, trailPoint.y, player.width, player.height)
      ctx.restore()
    }
  }

  /**
   * Get entity layer names
   */
  getLayerNames(): string[] {
    return Array.from(this.layers.keys())
  }

  /**
   * Get entity layer info
   */
  getLayerInfo(): Array<{ name: string; priority: number; visible: boolean }> {
    return Array.from(this.layers.values()).map(layer => ({
      name: layer.name,
      priority: layer.priority,
      visible: layer.visible
    }))
  }

  /**
   * Get entity counts
   */
  getEntityCounts(): {
    player: number
    enemies: number
    platforms: number
    collectibles: number
    activeCollectibles: number
  } {
    return {
      player: this.player ? 1 : 0,
      enemies: this.enemies.length,
      platforms: this.platforms.length,
      collectibles: this.collectibles.length,
      activeCollectibles: this.collectibles.filter(c => !c.collected).length
    }
  }

  /**
   * Get entity render stats for debugging
   */
  getRenderStats(): {
    layerCount: number
    visibleLayers: number
    player: number
    enemies: number
    platforms: number
    collectibles: number
    activeCollectibles: number
  } {
    const visibleLayers = Array.from(this.layers.values()).filter(layer => layer.visible).length
    const counts = this.getEntityCounts()

    return {
      layerCount: this.layers.size,
      visibleLayers,
      ...counts
    }
  }

  /**
   * Get entity render summary for debugging
   */
  getRenderSummary(): string {
    const stats = this.getRenderStats()
    return `Entities: ${stats.visibleLayers}/${stats.layerCount} layers, Player: ${stats.player}, Enemies: ${stats.enemies}, Platforms: ${stats.platforms}, Collectibles: ${stats.activeCollectibles}/${stats.collectibles}`
  }
} 