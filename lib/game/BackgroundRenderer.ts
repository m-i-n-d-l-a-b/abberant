/**
 * Background Renderer
 * 
 * This module handles all background rendering logic including:
 * - Dream effects rendering
 * - Parallax backgrounds
 * - Star field rendering
 * - Chromatic effects
 * - Background layer management
 * - Parallax calculations
 */

import { BackgroundStar, Camera, Effects } from '../../types/game'
import {
  DREAM_PARTICLES_COUNT,
  DREAM_WAVES_COUNT,
  DREAM_LAYERS_COUNT,
  STAR_TYPE_PROBABILITIES,
  STAR_PROPERTIES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from '../../constants/game'

export interface BackgroundRenderContext {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  camera: Camera
  effects: Effects
  frameCount: number
  deltaTime: number
  now: number
}

export interface DreamParticle {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  hue: number
  phase: number
}

export interface DreamWave {
  x: number
  y: number
  amplitude: number
  frequency: number
  speed: number
  opacity: number
  hue: number
  phase: number
}

export interface BackgroundLayer {
  name: string
  parallaxFactor: number
  visible: boolean
  render: (context: BackgroundRenderContext) => void
}

export class BackgroundRenderer {
  private width: number
  private height: number
  private layers: Map<string, BackgroundLayer>
  private dreamParticles: DreamParticle[]
  private dreamWaves: DreamWave[]
  private backgroundStars: BackgroundStar[]

  constructor(width: number = CANVAS_WIDTH, height: number = CANVAS_HEIGHT) {
    this.width = width
    this.height = height
    this.layers = new Map()
    this.dreamParticles = []
    this.dreamWaves = []
    this.backgroundStars = []

    this.initializeLayers()
    this.generateDreamParticles()
    this.generateDreamWaves()
  }

  /**
   * Initialize background layers
   */
  private initializeLayers(): void {
    // Deep space layer (furthest back)
    this.addLayer('deepSpace', 0.1, true, (context) => {
      this.renderDeepSpace(context)
    })

    // Star field layer
    this.addLayer('starField', 0.3, true, (context) => {
      this.renderStarField(context)
    })

    // Dream particles layer
    this.addLayer('dreamParticles', 0.5, true, (context) => {
      this.renderDreamParticles(context)
    })

    // Dream waves layer
    this.addLayer('dreamWaves', 0.7, true, (context) => {
      this.renderDreamWaves(context)
    })

    // Chromatic aberration layer
    this.addLayer('chromaticAberration', 1.0, true, (context) => {
      this.renderChromaticAberration(context)
    })
  }

  /**
   * Add a background layer
   */
  addLayer(name: string, parallaxFactor: number, visible: boolean, render: (context: BackgroundRenderContext) => void): void {
    this.layers.set(name, {
      name,
      parallaxFactor,
      visible,
      render
    })
  }

  /**
   * Remove a background layer
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
   * Set background stars
   */
  setBackgroundStars(stars: BackgroundStar[]): void {
    this.backgroundStars = [...stars]
  }

  /**
   * Update dream particles
   */
  updateDreamParticles(deltaTime: number): void {
    for (const particle of this.dreamParticles) {
      particle.y -= particle.speed * deltaTime
      particle.phase += deltaTime * 2

      // Wrap particles around screen
      if (particle.y < -particle.size) {
        particle.y = this.height + particle.size
        particle.x = Math.random() * this.width
      }
    }
  }

  /**
   * Update dream waves
   */
  updateDreamWaves(deltaTime: number): void {
    for (const wave of this.dreamWaves) {
      wave.x += wave.speed * deltaTime
      wave.phase += deltaTime * 3

      // Wrap waves around screen
      if (wave.x > this.width + 100) {
        wave.x = -100
        wave.y = Math.random() * this.height
      }
    }
  }

  /**
   * Generate dream particles
   */
  private generateDreamParticles(): void {
    this.dreamParticles = []
    for (let i = 0; i < DREAM_PARTICLES_COUNT; i++) {
      this.dreamParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 2 + Math.random() * 4,
        speed: 20 + Math.random() * 40,
        opacity: 0.3 + Math.random() * 0.7,
        hue: 180 + Math.random() * 60, // Cyan to blue range
        phase: Math.random() * Math.PI * 2
      })
    }
  }

  /**
   * Generate dream waves
   */
  private generateDreamWaves(): void {
    this.dreamWaves = []
    for (let i = 0; i < DREAM_WAVES_COUNT; i++) {
      this.dreamWaves.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        amplitude: 20 + Math.random() * 30,
        frequency: 0.02 + Math.random() * 0.03,
        speed: 30 + Math.random() * 50,
        opacity: 0.2 + Math.random() * 0.4,
        hue: 200 + Math.random() * 40, // Blue to purple range
        phase: Math.random() * Math.PI * 2
      })
    }
  }

  /**
   * Render all background layers
   */
  render(context: BackgroundRenderContext): void {
    // Update dream effects
    this.updateDreamParticles(context.deltaTime)
    this.updateDreamWaves(context.deltaTime)

    // Render layers in parallax order (furthest to closest)
    const sortedLayers = Array.from(this.layers.values())
      .filter(layer => layer.visible)
      .sort((a, b) => a.parallaxFactor - b.parallaxFactor)

    for (const layer of sortedLayers) {
      layer.render(context)
    }
  }

  /**
   * Render deep space layer
   */
  private renderDeepSpace(context: BackgroundRenderContext): void {
    const { ctx, camera } = context
    const parallaxX = camera.x * 0.1

    // Create deep space gradient
    const gradient = ctx.createRadialGradient(
      this.width / 2 + parallaxX, this.height / 2, 0,
      this.width / 2 + parallaxX, this.height / 2, this.width
    )
    gradient.addColorStop(0, '#000011')
    gradient.addColorStop(0.5, '#000033')
    gradient.addColorStop(1, '#000011')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, this.width, this.height)

    // Add subtle nebula-like effects
    ctx.globalAlpha = 0.1
    for (let i = 0; i < 3; i++) {
      const x = (Math.sin(context.now * 0.001 + i) * 100) + this.width / 2 + parallaxX
      const y = (Math.cos(context.now * 0.0015 + i) * 50) + this.height / 2
      const radius = 100 + Math.sin(context.now * 0.002 + i) * 50

      const nebulaGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      nebulaGradient.addColorStop(0, `hsla(${200 + i * 30}, 70%, 50%, 0.3)`)
      nebulaGradient.addColorStop(1, 'transparent')

      ctx.fillStyle = nebulaGradient
      ctx.fillRect(0, 0, this.width, this.height)
    }
    ctx.globalAlpha = 1.0
  }

  /**
   * Render star field layer
   */
  private renderStarField(context: BackgroundRenderContext): void {
    const { ctx, camera } = context
    const parallaxX = camera.x * 0.3

    for (const star of this.backgroundStars) {
      const x = star.x - parallaxX * star.parallax
      const y = star.y

      // Skip stars outside viewport
      if (x < -star.size || x > this.width + star.size || y < -star.size || y > this.height + star.size) {
        continue
      }

      // Calculate star brightness with twinkling
      const twinkle = Math.sin(context.now * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7
      const pulse = Math.sin(context.now * star.pulseSpeed + star.pulsePhase) * 0.2 + 0.8
      const brightness = star.brightness * twinkle * pulse

      // Set star color
      const hue = star.hue
      const saturation = 80
      const lightness = Math.floor(brightness * 100)
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`

      // Draw star based on shape
      ctx.save()
      ctx.translate(x, y)
      ctx.globalAlpha = brightness

      switch (star.shape) {
        case 'circle':
          ctx.beginPath()
          ctx.arc(0, 0, star.size, 0, Math.PI * 2)
          ctx.fill()
          break

        case 'diamond':
          ctx.beginPath()
          ctx.moveTo(0, -star.size)
          ctx.lineTo(star.size, 0)
          ctx.lineTo(0, star.size)
          ctx.lineTo(-star.size, 0)
          ctx.closePath()
          ctx.fill()
          break

        case 'triangle':
          ctx.beginPath()
          ctx.moveTo(0, -star.size)
          ctx.lineTo(star.size * 0.866, star.size * 0.5)
          ctx.lineTo(-star.size * 0.866, star.size * 0.5)
          ctx.closePath()
          ctx.fill()
          break
      }

      // Add glow effect
      if (star.glowRadius > 0) {
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, star.glowRadius)
        glowGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${brightness * 0.5})`)
        glowGradient.addColorStop(1, 'transparent')

        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(0, 0, star.glowRadius, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    }
  }

  /**
   * Render dream particles layer
   */
  private renderDreamParticles(context: BackgroundRenderContext): void {
    const { ctx, camera } = context
    const parallaxX = camera.x * 0.5

    for (const particle of this.dreamParticles) {
      const x = particle.x - parallaxX
      const y = particle.y

      // Skip particles outside viewport
      if (x < -particle.size || x > this.width + particle.size || y < -particle.size || y > this.height + particle.size) {
        continue
      }

      // Calculate particle opacity with pulsing
      const pulse = Math.sin(context.now * 0.003 + particle.phase) * 0.3 + 0.7
      const opacity = particle.opacity * pulse

      // Set particle color
      ctx.fillStyle = `hsla(${particle.hue}, 80%, 60%, ${opacity})`

      // Draw particle with glow
      ctx.save()
      ctx.globalAlpha = opacity

      // Main particle
      ctx.beginPath()
      ctx.arc(x, y, particle.size, 0, Math.PI * 2)
      ctx.fill()

      // Glow effect
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, particle.size * 3)
      glowGradient.addColorStop(0, `hsla(${particle.hue}, 80%, 60%, ${opacity * 0.3})`)
      glowGradient.addColorStop(1, 'transparent')

      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(x, y, particle.size * 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }
  }

  /**
   * Render dream waves layer
   */
  private renderDreamWaves(context: BackgroundRenderContext): void {
    const { ctx, camera } = context
    const parallaxX = camera.x * 0.7

    for (const wave of this.dreamWaves) {
      const x = wave.x - parallaxX
      const y = wave.y

      // Skip waves outside viewport
      if (x < -100 || x > this.width + 100 || y < -50 || y > this.height + 50) {
        continue
      }

      // Calculate wave opacity with pulsing
      const pulse = Math.sin(context.now * 0.002 + wave.phase) * 0.2 + 0.8
      const opacity = wave.opacity * pulse

      // Set wave color
      ctx.strokeStyle = `hsla(${wave.hue}, 80%, 60%, ${opacity})`
      ctx.lineWidth = 2

      // Draw wave
      ctx.save()
      ctx.globalAlpha = opacity

      ctx.beginPath()
      for (let i = 0; i < this.width + 200; i += 5) {
        const waveX = x + i
        const waveY = y + Math.sin(i * wave.frequency + context.now * 0.001 + wave.phase) * wave.amplitude
        if (i === 0) {
          ctx.moveTo(waveX, waveY)
        } else {
          ctx.lineTo(waveX, waveY)
        }
      }
      ctx.stroke()

      ctx.restore()
    }
  }

  /**
   * Render chromatic aberration layer
   */
  private renderChromaticAberration(context: BackgroundRenderContext): void {
    const { ctx, effects } = context

    // Apply chromatic aberration effect based on level effects
    if (effects.rgbShiftFactor > 0) {
      // This is a placeholder - actual chromatic aberration would be implemented
      // as a post-processing effect in the main renderer
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = effects.rgbShiftFactor * 0.1
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(0, 0, this.width, this.height)
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1.0
    }
  }

  /**
   * Get background layer names
   */
  getLayerNames(): string[] {
    return Array.from(this.layers.keys())
  }

  /**
   * Get background layer info
   */
  getLayerInfo(): Array<{ name: string; parallaxFactor: number; visible: boolean }> {
    return Array.from(this.layers.values()).map(layer => ({
      name: layer.name,
      parallaxFactor: layer.parallaxFactor,
      visible: layer.visible
    }))
  }

  /**
   * Get dream particle count
   */
  getDreamParticleCount(): number {
    return this.dreamParticles.length
  }

  /**
   * Get dream wave count
   */
  getDreamWaveCount(): number {
    return this.dreamWaves.length
  }

  /**
   * Get background star count
   */
  getBackgroundStarCount(): number {
    return this.backgroundStars.length
  }

  /**
   * Get background render stats for debugging
   */
  getRenderStats(): {
    layerCount: number
    visibleLayers: number
    dreamParticleCount: number
    dreamWaveCount: number
    backgroundStarCount: number
  } {
    const visibleLayers = Array.from(this.layers.values()).filter(layer => layer.visible).length

    return {
      layerCount: this.layers.size,
      visibleLayers,
      dreamParticleCount: this.dreamParticles.length,
      dreamWaveCount: this.dreamWaves.length,
      backgroundStarCount: this.backgroundStars.length
    }
  }

  /**
   * Get background render summary for debugging
   */
  getRenderSummary(): string {
    const stats = this.getRenderStats()
    return `Background: ${stats.visibleLayers}/${stats.layerCount} layers, ${stats.dreamParticleCount} particles, ${stats.dreamWaveCount} waves, ${stats.backgroundStarCount} stars`
  }
} 