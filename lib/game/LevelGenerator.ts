/**
 * Level Generator
 * 
 * This module handles all level generation logic including:
 * - Platform generation and placement
 * - Level layout and progression
 * - Background generation
 * - Collectible placement
 * - Level difficulty scaling
 * - Level width and complexity management
 */

import { Platform, Collectible, BackgroundStar, Enemy } from '../../types/game'
import {
  BASE_LEVEL_WIDTH,
  LEVEL_WIDTH_INCREMENT,
  BASE_PLATFORM_COUNT,
  PLATFORM_COUNT_INCREMENT,
  BASE_COLLECTIBLE_COUNT,
  COLLECTIBLE_COUNT_INCREMENT,
  PLATFORM_MIN_WIDTH,
  PLATFORM_WIDTH_VARIATION,
  PLATFORM_BASE_Y,
  PLATFORM_Y_VARIATION,
  PLATFORM_X_VARIATION,
  COLLECTIBLE_WIDTH,
  COLLECTIBLE_HEIGHT,
  COLLECTIBLE_VALUE,
  STAR_COUNT,
  DREAM_PARTICLES_COUNT,
  DREAM_WAVES_COUNT,
  DREAM_LAYERS_COUNT,
  STAR_TYPE_PROBABILITIES,
  STAR_PROPERTIES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from '../../constants/game'

export interface LevelConfig {
  level: number
  playerX: number
  playerY: number
  difficulty: number
}

export interface LevelData {
  platforms: Platform[]
  collectibles: Collectible[]
  backgroundStars: BackgroundStar[]
  levelWidth: number
  levelHeight: number
  difficulty: number
}

export interface PlatformGenerationParams {
  level: number
  levelWidth: number
  playerStartX: number
  playerStartY: number
  difficulty: number
}

export interface CollectibleGenerationParams {
  level: number
  platforms: Platform[]
  playerStartX: number
  difficulty: number
}

export interface BackgroundGenerationParams {
  level: number
  levelWidth: number
  levelHeight: number
}

export class LevelGenerator {
  private width: number
  private height: number

  constructor(width: number = CANVAS_WIDTH, height: number = CANVAS_HEIGHT) {
    this.width = width
    this.height = height
  }

  /**
   * Generate a complete level
   */
  generateLevel(config: LevelConfig): LevelData {
    const levelWidth = BASE_LEVEL_WIDTH + (config.level - 1) * LEVEL_WIDTH_INCREMENT
    const difficulty = this.calculateDifficulty(config.level)

    // Generate platforms
    const platformParams: PlatformGenerationParams = {
      level: config.level,
      levelWidth,
      playerStartX: config.playerX,
      playerStartY: config.playerY,
      difficulty
    }
    const platforms = this.generatePlatforms(platformParams)

    // Generate collectibles
    const collectibleParams: CollectibleGenerationParams = {
      level: config.level,
      platforms,
      playerStartX: config.playerX,
      difficulty
    }
    const collectibles = this.generateCollectibles(collectibleParams)

    // Generate background
    const backgroundParams: BackgroundGenerationParams = {
      level: config.level,
      levelWidth,
      levelHeight: this.height
    }
    const backgroundStars = this.generateBackground(backgroundParams)

    return {
      platforms,
      collectibles,
      backgroundStars,
      levelWidth,
      levelHeight: this.height,
      difficulty
    }
  }

  /**
   * Calculate difficulty based on level
   */
  private calculateDifficulty(level: number): number {
    return Math.min(level / 10, 1.0) // Difficulty scales from 0 to 1 over 10 levels
  }

  /**
   * Generate platforms for the level
   */
  private generatePlatforms(params: PlatformGenerationParams): Platform[] {
    const platforms: Platform[] = []
    const platformCount = BASE_PLATFORM_COUNT + (params.level - 1) * PLATFORM_COUNT_INCREMENT

    // Add starting platform for player
    const startPlatform: Platform = {
      x: params.playerStartX - 50,
      y: params.playerStartY + 50,
      width: 100,
      height: 20,
      color: '#00ffff',
      type: 'start',
      liquidPixels: [],
      distortionOffset: 0
    }
    platforms.push(startPlatform)

    // Generate main platforms
    for (let i = 0; i < platformCount; i++) {
      const platform = this.createPlatform(params, i, platformCount)
      if (platform) {
        platforms.push(platform)
      }
    }

    // Add end platform
    const endPlatform: Platform = {
      x: params.levelWidth - 100,
      y: this.height - 100,
      width: 100,
      height: 20,
      color: '#00ff00',
      type: 'end',
      liquidPixels: [],
      distortionOffset: 0
    }
    platforms.push(endPlatform)

    return platforms
  }

  /**
   * Create a single platform
   */
  private createPlatform(params: PlatformGenerationParams, index: number, totalCount: number): Platform | null {
    // Calculate platform position based on level progression
    const progress = index / (totalCount - 1)
    const baseX = params.playerStartX + 200 + progress * (params.levelWidth - params.playerStartX - 400)
    
    // Add variation to X position
    const xVariation = (Math.random() - 0.5) * PLATFORM_X_VARIATION
    const x = Math.max(0, Math.min(params.levelWidth - PLATFORM_MIN_WIDTH, baseX + xVariation))

    // Calculate Y position with variation
    const baseY = PLATFORM_BASE_Y + (Math.random() - 0.5) * PLATFORM_Y_VARIATION
    const y = Math.max(100, Math.min(this.height - 100, baseY))

    // Calculate width with variation
    const width = PLATFORM_MIN_WIDTH + Math.random() * PLATFORM_WIDTH_VARIATION

    // Determine platform type based on level and position
    const platformType = this.determinePlatformType(params.level, progress, params.difficulty)

    // Generate liquid pixels for certain platform types
    const liquidPixels = platformType === 'liquid' ? this.generateLiquidPixels(width, 20) : []

    const platform: Platform = {
      x,
      y,
      width,
      height: 20,
      color: this.getPlatformColor(platformType, params.level),
      type: platformType,
      liquidPixels,
      distortionOffset: Math.random() * 10
    }

    return platform
  }

  /**
   * Determine platform type based on level and position
   */
  private determinePlatformType(level: number, progress: number, difficulty: number): string {
    const types = ['normal', 'moving', 'breakable', 'liquid', 'bouncy']
    const weights = [0.6, 0.1, 0.1, 0.1, 0.1]

    // Adjust weights based on level and difficulty
    if (level > 5) {
      weights[1] += 0.1 // More moving platforms
      weights[0] -= 0.1
    }
    if (level > 10) {
      weights[2] += 0.1 // More breakable platforms
      weights[0] -= 0.1
    }
    if (difficulty > 0.7) {
      weights[3] += 0.1 // More liquid platforms
      weights[0] -= 0.1
    }

    // Normalize weights
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    const normalizedWeights = weights.map(weight => weight / totalWeight)

    // Select type based on weights
    const random = Math.random()
    let cumulativeWeight = 0
    for (let i = 0; i < types.length; i++) {
      cumulativeWeight += normalizedWeights[i]
      if (random <= cumulativeWeight) {
        return types[i]
      }
    }

    return 'normal'
  }

  /**
   * Get platform color based on type and level
   */
  private getPlatformColor(type: string, level: number): string {
    const colors = {
      normal: '#00ffff',
      moving: '#0088ff',
      breakable: '#ff8800',
      liquid: '#0088ff',
      bouncy: '#ff00ff',
      start: '#00ffff',
      end: '#00ff00'
    }

    const baseColor = colors[type as keyof typeof colors] || colors.normal
    
    // Add level-based color variation
    if (level > 5) {
      return this.adjustColorBrightness(baseColor, 1.2)
    }
    if (level > 10) {
      return this.adjustColorBrightness(baseColor, 1.4)
    }

    return baseColor
  }

  /**
   * Adjust color brightness
   */
  private adjustColorBrightness(color: string, factor: number): string {
    if (!color.startsWith('#') || color.length !== 7) return color
    const r = Math.min(255, Math.max(0, Math.floor(parseInt(color.slice(1, 3), 16) * factor)))
    const g = Math.min(255, Math.max(0, Math.floor(parseInt(color.slice(3, 5), 16) * factor)))
    const b = Math.min(255, Math.max(0, Math.floor(parseInt(color.slice(5, 7), 16) * factor)))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  /**
   * Generate liquid pixels for liquid platforms
   */
  private generateLiquidPixels(width: number, height: number): Array<{ x: number; y: number; velX: number; velY: number; opacity: number; size: number }> {
    const pixels = []
    const pixelCount = Math.floor((width * height) / 100)

    for (let i = 0; i < pixelCount; i++) {
      pixels.push({
        x: Math.random() * width,
        y: Math.random() * height,
        velX: (Math.random() - 0.5) * 2,
        velY: (Math.random() - 0.5) * 2,
        opacity: 0.3 + Math.random() * 0.7,
        size: 1 + Math.random() * 2
      })
    }

    return pixels
  }

  /**
   * Generate collectibles for the level
   */
  private generateCollectibles(params: CollectibleGenerationParams): Collectible[] {
    const collectibles: Collectible[] = []
    const collectibleCount = BASE_COLLECTIBLE_COUNT + (params.level - 1) * COLLECTIBLE_COUNT_INCREMENT

    for (let i = 0; i < collectibleCount; i++) {
      const collectible = this.createCollectible(params, i, collectibleCount)
      if (collectible) {
        collectibles.push(collectible)
      }
    }

    return collectibles
  }

  /**
   * Create a single collectible
   */
  private createCollectible(params: CollectibleGenerationParams, index: number, totalCount: number): Collectible | null {
    // Find a suitable platform for the collectible
    const suitablePlatforms = params.platforms.filter(platform => 
      platform.x > params.playerStartX + 300 && // Don't place too close to player
      platform.width > COLLECTIBLE_WIDTH * 3 && // Platform must be wide enough
      platform.type !== 'liquid' // Don't place on liquid platforms
    )

    if (suitablePlatforms.length === 0) {
      return null
    }

    const platform = suitablePlatforms[Math.floor(Math.random() * suitablePlatforms.length)]
    const progress = index / (totalCount - 1)

    // Place collectible on platform with some variation
    const x = platform.x + 20 + Math.random() * (platform.width - 40)
    const y = platform.y - COLLECTIBLE_HEIGHT - 5

    // Determine collectible value based on level and position
    const value = this.calculateCollectibleValue(params.level, progress)

    const collectible: Collectible = {
      x,
      y,
      width: COLLECTIBLE_WIDTH,
      height: COLLECTIBLE_HEIGHT,
      color: this.getCollectibleColor(value),
      collected: false,
      value
    }

    return collectible
  }

  /**
   * Calculate collectible value based on level and position
   */
  private calculateCollectibleValue(level: number, progress: number): number {
    const baseValue = COLLECTIBLE_VALUE
    const levelMultiplier = 1 + (level - 1) * 0.1
    const progressMultiplier = 1 + progress * 0.5

    return Math.floor(baseValue * levelMultiplier * progressMultiplier)
  }

  /**
   * Get collectible color based on value
   */
  private getCollectibleColor(value: number): string {
    if (value >= 200) return '#ffff00' // Gold
    if (value >= 150) return '#ffaa00' // Orange
    if (value >= 100) return '#ff8800' // Red-orange
    return '#ff4444' // Red
  }

  /**
   * Generate background stars and effects
   */
  private generateBackground(params: BackgroundGenerationParams): BackgroundStar[] {
    const stars: BackgroundStar[] = []

    // Generate stars
    for (let i = 0; i < STAR_COUNT; i++) {
      const star = this.createStar(params)
      stars.push(star)
    }

    return stars
  }

  /**
   * Create a single background star
   */
  private createStar(params: BackgroundGenerationParams): BackgroundStar {
    // Determine star type based on probabilities
    const random = Math.random()
    let cumulativeProb = 0
    let starType: keyof typeof STAR_TYPE_PROBABILITIES = 'SPARKLES'

    for (const [type, probability] of Object.entries(STAR_TYPE_PROBABILITIES)) {
      cumulativeProb += probability
      if (random <= cumulativeProb) {
        starType = type as keyof typeof STAR_TYPE_PROBABILITIES
        break
      }
    }

    const properties = STAR_PROPERTIES[starType]
    const size = properties.SIZE_MIN + Math.random() * (properties.SIZE_MAX - properties.SIZE_MIN)
    const hue = properties.HUE_MIN + Math.random() * (properties.HUE_MAX - properties.HUE_MIN)
    const parallax = properties.PARALLAX_MIN + Math.random() * (properties.PARALLAX_MAX - properties.PARALLAX_MIN)
    const pulseSpeed = properties.PULSE_SPEED_MIN + Math.random() * (properties.PULSE_SPEED_MAX - properties.PULSE_SPEED_MIN)
    const twinkleSpeed = properties.TWINKLE_SPEED_MIN + Math.random() * (properties.TWINKLE_SPEED_MAX - properties.TWINKLE_SPEED_MIN)
    const brightness = properties.BRIGHTNESS_MIN + Math.random() * (properties.BRIGHTNESS_MAX - properties.BRIGHTNESS_MIN)
    const glowRadius = properties.GLOW_RADIUS_MIN + Math.random() * (properties.GLOW_RADIUS_MAX - properties.GLOW_RADIUS_MIN)

    const shapes: Array<'circle' | 'diamond' | 'triangle'> = ['circle', 'diamond', 'triangle']
    const shape = shapes[Math.floor(Math.random() * shapes.length)]

    const star: BackgroundStar = {
      x: Math.random() * params.levelWidth,
      y: Math.random() * params.levelHeight,
      size,
      parallax,
      hue,
      pulseSpeed,
      pulsePhase: Math.random() * Math.PI * 2,
      twinkleSpeed,
      twinklePhase: Math.random() * Math.PI * 2,
      shape,
      brightness,
      glowRadius
    }

    return star
  }

  /**
   * Get level width for a given level
   */
  getLevelWidth(level: number): number {
    return BASE_LEVEL_WIDTH + (level - 1) * LEVEL_WIDTH_INCREMENT
  }

  /**
   * Get level height
   */
  getLevelHeight(): number {
    return this.height
  }

  /**
   * Get platform count for a given level
   */
  getPlatformCount(level: number): number {
    return BASE_PLATFORM_COUNT + (level - 1) * PLATFORM_COUNT_INCREMENT
  }

  /**
   * Get collectible count for a given level
   */
  getCollectibleCount(level: number): number {
    return BASE_COLLECTIBLE_COUNT + (level - 1) * COLLECTIBLE_COUNT_INCREMENT
  }

  /**
   * Get level stats for debugging
   */
  getLevelStats(level: number): {
    level: number
    width: number
    height: number
    platformCount: number
    collectibleCount: number
    difficulty: number
  } {
    return {
      level,
      width: this.getLevelWidth(level),
      height: this.getLevelHeight(),
      platformCount: this.getPlatformCount(level),
      collectibleCount: this.getCollectibleCount(level),
      difficulty: this.calculateDifficulty(level)
    }
  }

  /**
   * Get level summary for debugging
   */
  getLevelSummary(level: number): string {
    const stats = this.getLevelStats(level)
    return `Level ${stats.level}: ${stats.width}x${stats.height}, Platforms: ${stats.platformCount}, Collectibles: ${stats.collectibleCount}, Difficulty: ${stats.difficulty.toFixed(2)}`
  }
} 