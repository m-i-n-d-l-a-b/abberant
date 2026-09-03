/**
 * Effects Renderer
 * 
 * This module handles all effects rendering logic including:
 * - Data bleed effects rendering
 * - Particle effects rendering
 * - Glitch effects rendering
 * - Post-processing effects
 * - Visual distortion effects
 * - Screen overlay effects
 */

import { DataBleedEffect, Particle, Effects, Camera } from '../../types/game'

/** Blur radius in pixels at a factor of 1. */
const BLUR_MAX_RADIUS_PX = 8

export interface EffectsRenderContext {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  camera: Camera
  effects: Effects
  frameCount: number
  deltaTime: number
  now: number
}

export interface EffectsLayer {
  name: string
  priority: number
  visible: boolean
  render: (context: EffectsRenderContext) => void
}

export class EffectsRenderer {
  private width: number
  private height: number
  private layers: Map<string, EffectsLayer>
  private dataBleedEffects: DataBleedEffect[]
  private particles: Particle[]
  private blurScratch: HTMLCanvasElement | null = null

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.layers = new Map()
    this.dataBleedEffects = []
    this.particles = []

    this.initializeLayers()
  }

  /**
   * Initialize effects layers
   */
  private initializeLayers(): void {
    // Data bleed effects layer (furthest back)
    this.addLayer('dataBleed', 0, true, (context) => {
      this.renderDataBleedEffects(context)
    })

    // Particle effects layer
    this.addLayer('particles', 1, true, (context) => {
      this.renderParticleEffects(context)
    })

    // Glitch effects layer
    this.addLayer('glitch', 2, true, (context) => {
      this.renderGlitchEffects(context)
    })

    // Post-processing effects layer (closest to camera)
    this.addLayer('postProcessing', 3, true, (context) => {
      this.renderPostProcessingEffects(context)
    })
  }

  /**
   * Add an effects layer
   */
  addLayer(name: string, priority: number, visible: boolean, render: (context: EffectsRenderContext) => void): void {
    this.layers.set(name, {
      name,
      priority,
      visible,
      render
    })
  }

  /**
   * Remove an effects layer
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
   * Set effects for rendering
   */
  setEffects(dataBleedEffects: DataBleedEffect[], particles: Particle[]): void {
    this.dataBleedEffects = [...dataBleedEffects]
    this.particles = [...particles]
  }

  /**
   * Render all effects layers
   */
  render(context: EffectsRenderContext): void {
    // Render layers in priority order (furthest to closest)
    const sortedLayers = Array.from(this.layers.values())
      .filter(layer => layer.visible)
      .sort((a, b) => a.priority - b.priority)

    for (const layer of sortedLayers) {
      layer.render(context)
    }
  }

  /**
   * Render data bleed effects layer
   */
  private renderDataBleedEffects(context: EffectsRenderContext): void {
    const { ctx, camera } = context

    for (const effect of this.dataBleedEffects) {
      const x = effect.x - camera.x
      const y = effect.y - camera.y

      // Skip effects outside viewport
      if (x < -effect.size || x > this.width + effect.size || 
          y < -effect.size || y > this.height + effect.size) {
        continue
      }

      this.renderDataBleedEffect(ctx, effect, x, y, context)
    }
  }

  /**
   * Render a single data bleed effect
   */
  private renderDataBleedEffect(ctx: CanvasRenderingContext2D, effect: DataBleedEffect, x: number, y: number, context: EffectsRenderContext): void {
    ctx.save()

    // Calculate effect intensity based on duration
    const intensity = Math.min(1.0, effect.duration / 1000) // Normalize to 0-1
    const alpha = intensity * 0.8

    // Create radial gradient for data bleed effect
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, effect.size)
    gradient.addColorStop(0, `rgba(255, 0, 255, ${alpha})`)
    gradient.addColorStop(0.5, `rgba(255, 0, 255, ${alpha * 0.5})`)
    gradient.addColorStop(1, 'transparent')

    ctx.fillStyle = gradient
    ctx.fillRect(x - effect.size, y - effect.size, effect.size * 2, effect.size * 2)

    // Add circular data bleed effect for testing compatibility
    ctx.beginPath()
    ctx.arc(x, y, effect.size * 0.5, 0, Math.PI * 2)
    ctx.stroke()

    // Add glitch lines
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`
    ctx.lineWidth = 1

    for (let i = 0; i < 5; i++) {
      const startX = x + (Math.random() - 0.5) * effect.size
      const startY = y + (Math.random() - 0.5) * effect.size
      const endX = startX + (Math.random() - 0.5) * effect.size * 0.5
      const endY = startY + (Math.random() - 0.5) * effect.size * 0.5

      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
      ctx.stroke()
    }

    ctx.restore()
  }

  /**
   * Render particle effects layer
   */
  private renderParticleEffects(context: EffectsRenderContext): void {
    const { ctx, camera } = context

    for (const particle of this.particles) {
      const x = particle.x - camera.x
      const y = particle.y - camera.y

      // Skip particles outside viewport
      if (x < -particle.size || x > this.width + particle.size || 
          y < -particle.size || y > this.height + particle.size) {
        continue
      }

      this.renderParticle(ctx, particle, x, y, context)
    }
  }

  /**
   * Render a single particle
   */
  private renderParticle(ctx: CanvasRenderingContext2D, particle: Particle, x: number, y: number, context: EffectsRenderContext): void {
    ctx.save()

    // Calculate particle alpha based on life
    const alpha = particle.life / 100 // Assuming max life is 100
    ctx.globalAlpha = alpha

    // Set particle color
    ctx.fillStyle = particle.color

    // Draw particle with glow effect
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, particle.size * 2)
    glowGradient.addColorStop(0, `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`)
    glowGradient.addColorStop(1, 'transparent')

    ctx.fillStyle = glowGradient
    ctx.fillRect(x - particle.size * 2, y - particle.size * 2, particle.size * 4, particle.size * 4)

    // Draw main particle
    ctx.fillStyle = particle.color
    ctx.beginPath()
    ctx.arc(x, y, particle.size, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  /**
   * Render glitch effects layer
   */
  private renderGlitchEffects(context: EffectsRenderContext): void {
    const { ctx, effects } = context

    // Apply glitch offset effect
    if (effects.glitchOffset && (effects.glitchOffset.x !== 0 || effects.glitchOffset.y !== 0)) {
      ctx.save()
      
      // Create glitch displacement
      const glitchX = Math.sin(context.now * 0.01) * effects.glitchOffset.x
      const glitchY = Math.cos(context.now * 0.01) * effects.glitchOffset.y
      
      ctx.translate(glitchX, glitchY)
      
      // Draw glitch lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1
      
      for (let i = 0; i < 10; i++) {
        const y = Math.random() * this.height
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(this.width, y)
        ctx.stroke()
      }
      
      ctx.restore()
    }
  }

  /**
   * Render post-processing effects layer
   */
  private renderPostProcessingEffects(context: EffectsRenderContext): void {
    const { ctx, effects } = context

    // Apply melting effect
    if (effects.meltingFactor > 0) {
      this.applyMeltingEffect(ctx, effects.meltingFactor, context)
    }

    // Apply color shift effect
    if (effects.colorShift > 0) {
      this.applyColorShiftEffect(ctx, effects.colorShift, context)
    }

    // Apply pulse effect
    if (effects.pulseFactor !== 1) {
      this.applyPulseEffect(ctx, effects.pulseFactor, context)
    }

    // Apply blur effect
    if (effects.blurFactor > 0) {
      this.applyBlurEffect(ctx, effects.blurFactor, context)
    }

    // Apply noise effect
    if (effects.noiseFactor > 0) {
      this.applyNoiseEffect(ctx, effects.noiseFactor, context)
    }

    // Apply RGB shift effect
    if (effects.rgbShiftFactor > 0) {
      this.applyRGBShiftEffect(ctx, effects.rgbShiftFactor, context)
    }

    // Apply wave effect
    if (effects.waveFactor > 0) {
      this.applyWaveEffect(ctx, effects.waveFactor, context)
    }

    // Apply zoom effect
    if (effects.zoomFactor > 0) {
      this.applyZoomEffect(ctx, effects.zoomFactor, context)
    }

    // Apply rotation effect
    if (effects.rotationFactor > 0) {
      this.applyRotationEffect(ctx, effects.rotationFactor, context)
    }

    // Apply pixel bleed effect
    if (effects.pixelBleedFactor > 0) {
      this.applyPixelBleedEffect(ctx, effects.pixelBleedFactor, context)
    }
  }

  /**
   * Apply melting effect
   */
  private applyMeltingEffect(ctx: CanvasRenderingContext2D, factor: number, context: EffectsRenderContext): void {
    // Create melting distortion
    const imageData = ctx.getImageData(0, 0, this.width, this.height)
    const data = imageData.data

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const offset = Math.sin(context.now * 0.01 + x * 0.1) * factor * 5
        const newY = Math.floor(y + offset)
        
        if (newY >= 0 && newY < this.height) {
          const srcIndex = (y * this.width + x) * 4
          const dstIndex = (newY * this.width + x) * 4
          
          data[dstIndex] = data[srcIndex] // R
          data[dstIndex + 1] = data[srcIndex + 1] // G
          data[dstIndex + 2] = data[srcIndex + 2] // B
          data[dstIndex + 3] = data[srcIndex + 3] // A
        }
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * Apply color shift effect
   */
  private applyColorShiftEffect(ctx: CanvasRenderingContext2D, factor: number, context: EffectsRenderContext): void {
    // Create color shift overlay
    ctx.globalCompositeOperation = 'screen'
    ctx.globalAlpha = factor * 0.3
    
    const shift = Math.sin(context.now * 0.01) * factor * 10
    
    // Red channel
    ctx.fillStyle = `rgba(255, 0, 0, ${factor * 0.2})`
    ctx.fillRect(shift, 0, this.width, this.height)
    
    // Blue channel
    ctx.fillStyle = `rgba(0, 0, 255, ${factor * 0.2})`
    ctx.fillRect(-shift, 0, this.width, this.height)
    
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1.0
  }

  /**
   * Apply pulse effect
   */
  private applyPulseEffect(ctx: CanvasRenderingContext2D, factor: number, context: EffectsRenderContext): void {
    // Create pulsing vignette
    const pulse = Math.sin(context.now * 0.005) * 0.2 + 0.8
    const intensity = (factor - 1) * pulse
    
    if (intensity > 0) {
      const gradient = ctx.createRadialGradient(
        this.width / 2, this.height / 2, 0,
        this.width / 2, this.height / 2, Math.max(this.width, this.height) / 2
      )
      gradient.addColorStop(0, 'transparent')
      gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.5})`)
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, this.width, this.height)
    }
  }

  /**
   * Apply blur effect
   */
  private applyBlurEffect(ctx: CanvasRenderingContext2D, factor: number, context: EffectsRenderContext): void {
    // Uses the compositor's own blur rather than a hand-rolled box blur.
    //
    // The previous implementation read back the whole frame and averaged a 3x3
    // kernel per pixel — roughly 5.3M operations plus a getImageData /
    // putImageData pair every frame at 1024x576. Because its pass count was
    // `factor * 2`, it only engaged at the top of the oscillation, which showed
    // up as an intermittent stutter rather than a constant low framerate.
    const radius = factor * BLUR_MAX_RADIUS_PX

    // Below a subpixel radius there is nothing to see, and skipping avoids a
    // pointless full-canvas copy.
    if (radius < 0.5) {
      return
    }

    // Measured at 1024x576: the old pixel loop cost 45.5ms/frame, a full-res
    // compositor blur 7.0ms, and this half-res round trip 1.1ms — 7% of a
    // 16.7ms budget. Cost turned out to be flat in radius and dominated by the
    // full-canvas copy, so shrinking the canvas is what actually pays.
    const scratch = this.getBlurScratch()
    const scratchCtx = scratch && scratch.getContext('2d')

    ctx.save()
    // 'copy' replaces the frame with the blurred version; the default
    // source-over would lay a soft copy over the sharp one and read as bloom.
    ctx.globalCompositeOperation = 'copy'

    if (scratchCtx) {
      scratchCtx.globalCompositeOperation = 'copy'
      scratchCtx.filter = 'none'
      scratchCtx.drawImage(ctx.canvas, 0, 0, scratch!.width, scratch!.height)

      // Halved because the upscale doubles the apparent radius again
      ctx.filter = `blur(${radius / 2}px)`
      ctx.drawImage(scratch!, 0, 0, this.width, this.height)
    } else {
      // No scratch surface available — blur at full resolution rather than
      // dropping the effect.
      ctx.filter = `blur(${radius}px)`
      ctx.drawImage(ctx.canvas, 0, 0)
    }

    ctx.restore()
  }

  /**
   * Half-resolution scratch surface used by the blur pass, created once and
   * resized only when the canvas dimensions change.
   */
  private getBlurScratch(): HTMLCanvasElement | null {
    if (typeof document === 'undefined') {
      return null
    }

    const width = Math.max(1, this.width >> 1)
    const height = Math.max(1, this.height >> 1)

    try {
      if (!this.blurScratch) {
        this.blurScratch = document.createElement('canvas')
      }
      if (this.blurScratch.width !== width || this.blurScratch.height !== height) {
        this.blurScratch.width = width
        this.blurScratch.height = height
      }
      return this.blurScratch
    } catch {
      return null
    }
  }

  /**
   * Apply noise effect
   */
  private applyNoiseEffect(ctx: CanvasRenderingContext2D, factor: number, context: EffectsRenderContext): void {
    // Create noise overlay
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = factor * 0.3
    
    for (let y = 0; y < this.height; y += 2) {
      for (let x = 0; x < this.width; x += 2) {
        const noise = Math.random() * 255
        ctx.fillStyle = `rgba(${noise}, ${noise}, ${noise}, 0.1)`
        ctx.fillRect(x, y, 2, 2)
      }
    }
    
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1.0
  }

  /**
   * Apply RGB shift effect
   */
  private applyRGBShiftEffect(ctx: CanvasRenderingContext2D, factor: number, context: EffectsRenderContext): void {
    // Create RGB channel separation
    const shift = factor * 5
    
    ctx.globalCompositeOperation = 'screen'
    ctx.globalAlpha = factor * 0.2
    
    // Red channel
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
    ctx.fillRect(shift, 0, this.width, this.height)
    
    // Green channel
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'
    ctx.fillRect(0, 0, this.width, this.height)
    
    // Blue channel
    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)'
    ctx.fillRect(-shift, 0, this.width, this.height)
    
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1.0
  }

  /**
   * Apply wave effect
   */
  private applyWaveEffect(ctx: CanvasRenderingContext2D, factor: number, context: EffectsRenderContext): void {
    // Create wave distortion
    const imageData = ctx.getImageData(0, 0, this.width, this.height)
    const data = imageData.data

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const wave = Math.sin(y * 0.02 + context.now * 0.01) * factor * 10
        const newX = Math.floor(x + wave)
        
        if (newX >= 0 && newX < this.width) {
          const srcIndex = (y * this.width + x) * 4
          const dstIndex = (y * this.width + newX) * 4
          
          data[dstIndex] = data[srcIndex] // R
          data[dstIndex + 1] = data[srcIndex + 1] // G
          data[dstIndex + 2] = data[srcIndex + 2] // B
          data[dstIndex + 3] = data[srcIndex + 3] // A
        }
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * Apply zoom effect
   */
  private applyZoomEffect(ctx: CanvasRenderingContext2D, factor: number, context: EffectsRenderContext): void {
    // Create zoom distortion
    const zoom = 1 + factor * 0.2
    const centerX = this.width / 2
    const centerY = this.height / 2
    
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.scale(zoom, zoom)
    ctx.translate(-centerX, -centerY)
    
    // Draw a copy of the current canvas
    ctx.drawImage(ctx.canvas, 0, 0)
    
    ctx.restore()
  }

  /**
   * Apply rotation effect
   */
  private applyRotationEffect(ctx: CanvasRenderingContext2D, factor: number, context: EffectsRenderContext): void {
    // Create rotation distortion
    const rotation = factor * 0.1
    const centerX = this.width / 2
    const centerY = this.height / 2
    
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(rotation)
    ctx.translate(-centerX, -centerY)
    
    // Draw a copy of the current canvas
    ctx.drawImage(ctx.canvas, 0, 0)
    
    ctx.restore()
  }

  /**
   * Apply pixel bleed effect
   */
  private applyPixelBleedEffect(ctx: CanvasRenderingContext2D, factor: number, context: EffectsRenderContext): void {
    // Create pixel bleeding effect
    const bleedSize = Math.floor(factor * 3)
    
    if (bleedSize > 0) {
      const imageData = ctx.getImageData(0, 0, this.width, this.height)
      const data = imageData.data
      
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const index = (y * this.width + x) * 4
          
          // Bleed pixels to the right
          for (let i = 1; i <= bleedSize; i++) {
            if (x + i < this.width) {
              const bleedIndex = (y * this.width + (x + i)) * 4
              data[bleedIndex] = data[index] // R
              data[bleedIndex + 1] = data[index + 1] // G
              data[bleedIndex + 2] = data[index + 2] // B
              data[bleedIndex + 3] = Math.max(data[bleedIndex + 3], data[index + 3] * (1 - i / bleedSize)) // A
            }
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0)
    }
  }

  /**
   * Get effects layer names
   */
  getLayerNames(): string[] {
    return Array.from(this.layers.keys())
  }

  /**
   * Get effects layer info
   */
  getLayerInfo(): Array<{ name: string; priority: number; visible: boolean }> {
    return Array.from(this.layers.values()).map(layer => ({
      name: layer.name,
      priority: layer.priority,
      visible: layer.visible
    }))
  }

  /**
   * Get effects counts
   */
  getEffectsCounts(): {
    dataBleedEffects: number
    particles: number
  } {
    return {
      dataBleedEffects: this.dataBleedEffects.length,
      particles: this.particles.length
    }
  }

  /**
   * Get effects render stats for debugging
   */
  getRenderStats(): {
    layerCount: number
    visibleLayers: number
    dataBleedEffects: number
    particles: number
  } {
    const visibleLayers = Array.from(this.layers.values()).filter(layer => layer.visible).length
    const counts = this.getEffectsCounts()

    return {
      layerCount: this.layers.size,
      visibleLayers,
      ...counts
    }
  }

  /**
   * Get effects render summary for debugging
   */
  getRenderSummary(): string {
    const stats = this.getRenderStats()
    return `Effects: ${stats.visibleLayers}/${stats.layerCount} layers, Data Bleed: ${stats.dataBleedEffects}, Particles: ${stats.particles}`
  }
} 