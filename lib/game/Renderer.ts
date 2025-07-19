/**
 * Renderer
 * 
 * This module handles all rendering logic including:
 * - Main render loop and canvas management
 * - Camera management and viewport calculations
 * - Canvas context management and optimization
 * - Render state management
 * - Coordinate transformations
 * - Render batching and optimization
 */


import { Camera, Player, Platform, Enemy, Collectible, BackgroundStar, Effects, Particle, DataBleedEffect } from '../../types/game'
import { RenderingOptimizer } from './RenderingOptimizer'
import { BackgroundRenderer, BackgroundRenderContext } from './BackgroundRenderer'
import { EntityRenderer, EntityRenderContext } from './EntityRenderer'
import { EffectsRenderer, EffectsRenderContext } from './EffectsRenderer'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  FPS
} from '../../constants/game'

export interface RenderConfig {
  width: number
  height: number
  fps: number
  enableOptimization: boolean
}

export interface RenderState {
  camera: Camera
  effects: Effects
  frameCount: number
  lastTime: number
  deltaTime: number
  fps: number
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  camera: Camera
  effects: Effects
  frameCount: number
  deltaTime: number
}

export interface RenderLayer {
  name: string
  priority: number
  visible: boolean
  render: (context: RenderContext) => void
}

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: RenderConfig
  private state: RenderState
  private optimizer: RenderingOptimizer
  private backgroundRenderer: BackgroundRenderer
  private entityRenderer: EntityRenderer
  private effectsRenderer: EffectsRenderer
  private layers: Map<string, RenderLayer>
  private isRendering: boolean
  private animationFrameId: number | null

  constructor(canvas: HTMLCanvasElement, config: RenderConfig) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.config = config
    this.optimizer = new RenderingOptimizer(this.ctx)
    this.backgroundRenderer = new BackgroundRenderer(this.config.width, this.config.height)
    this.entityRenderer = new EntityRenderer(this.config.width, this.config.height)
    this.effectsRenderer = new EffectsRenderer(this.config.width, this.config.height)
    this.layers = new Map()
    this.isRendering = false
    this.animationFrameId = null

    // Initialize render state
    this.state = {
      camera: { x: 0, y: 0, targetX: 0, targetY: 0, smoothing: 0.1 },
      effects: {
        glitchOffset: { x: 0, y: 0 },
        meltingFactor: 0,
        colorShift: 0,
        pulseFactor: 1,
        blurFactor: 0,
        noiseFactor: 0,
        rgbShiftFactor: 0,
        waveFactor: 0,
        zoomFactor: 0,
        rotationFactor: 0,
        pixelBleedFactor: 0,
      },
      frameCount: 0,
      lastTime: performance.now(),
      deltaTime: 0,
      fps: FPS
    }

    this.initializeLayers()
  }

  /**
   * Initialize render layers
   */
  private initializeLayers(): void {
    // Background layer (lowest priority)
    this.addLayer('background', 0, true, (context) => {
      this.renderBackground(context)
    })

    // Background effects layer
    this.addLayer('backgroundEffects', 1, true, (context) => {
      this.renderBackgroundEffects(context)
    })

    // Game world layer
    this.addLayer('gameWorld', 2, true, (context) => {
      this.renderGameWorld(context)
    })

    // Particles layer
    this.addLayer('particles', 3, true, (context) => {
      this.renderParticles(context)
    })

    // Effects layer (post-processing)
    this.addLayer('effects', 4, true, (context) => {
      this.renderEffects(context)
    })

    // UI layer (highest priority)
    this.addLayer('ui', 5, true, (context) => {
      this.renderUI(context)
    })
  }

  /**
   * Add a render layer
   */
  addLayer(name: string, priority: number, visible: boolean, render: (context: RenderContext) => void): void {
    this.layers.set(name, {
      name,
      priority,
      visible,
      render
    })
  }

  /**
   * Remove a render layer
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
   * Update render state
   */
  updateState(camera: Camera, effects: Effects, frameCount: number): void {
    const currentTime = performance.now()
    this.state.deltaTime = (currentTime - this.state.lastTime) / 1000
    this.state.lastTime = currentTime

    this.state.camera = { ...camera }
    this.state.effects = { ...effects }
    this.state.frameCount = frameCount
  }

  /**
   * Start rendering
   */
  start(): void {
    if (this.isRendering) return

    this.isRendering = true
    this.renderLoop()
  }

  /**
   * Stop rendering
   */
  stop(): void {
    this.isRendering = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Main render loop
   */
  private renderLoop(): void {
    if (!this.isRendering) return

    this.render()
    this.animationFrameId = requestAnimationFrame(() => this.renderLoop())
  }

  /**
   * Main render method
   */
  render(): void {
    // Clear canvas
    this.clearCanvas()

    // Create render context
    const context: RenderContext = {
      ctx: this.ctx,
      width: this.config.width,
      height: this.config.height,
      camera: this.state.camera,
      effects: this.state.effects,
      frameCount: this.state.frameCount,
      deltaTime: this.state.deltaTime
    }

    // Apply camera transform
    this.applyCameraTransform(context)

    // Render layers in priority order
    const sortedLayers = Array.from(this.layers.values())
      .filter(layer => layer.visible)
      .sort((a, b) => a.priority - b.priority)

    for (const layer of sortedLayers) {
      layer.render(context)
    }

    // Apply post-processing effects
    this.applyPostProcessing(context)
  }

  /**
   * Clear the canvas
   */
  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.config.width, this.config.height)
  }

  /**
   * Apply camera transformation
   */
  private applyCameraTransform(context: RenderContext): void {
    this.ctx.save()
    this.ctx.translate(-context.camera.x, -context.camera.y)
  }

  /**
   * Apply post-processing effects
   */
  private applyPostProcessing(context: RenderContext): void {
    this.ctx.restore()

    // Apply visual effects
    if (context.effects.meltingFactor > 0) {
      this.applyMeltingEffect(context)
    }

    if (context.effects.colorShift > 0) {
      this.applyColorShiftEffect(context)
    }

    if (context.effects.blurFactor > 0) {
      this.applyBlurEffect(context)
    }

    if (context.effects.noiseFactor > 0) {
      this.applyNoiseEffect(context)
    }

    if (context.effects.rgbShiftFactor > 0) {
      this.applyRGBShiftEffect(context)
    }

    if (context.effects.waveFactor > 0) {
      this.applyWaveEffect(context)
    }

    if (context.effects.zoomFactor > 0) {
      this.applyZoomEffect(context)
    }

    if (context.effects.rotationFactor > 0) {
      this.applyRotationEffect(context)
    }

    if (context.effects.pixelBleedFactor > 0) {
      this.applyPixelBleedEffect(context)
    }
  }

  /**
   * Render background layer
   */
  private renderBackground(context: RenderContext): void {
    // Render solid background
    this.ctx.fillStyle = '#000011'
    this.ctx.fillRect(0, 0, this.config.width, this.config.height)

    // Render gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.height)
    gradient.addColorStop(0, '#000033')
    gradient.addColorStop(1, '#000011')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.config.width, this.config.height)
  }

  /**
   * Render background effects layer
   */
  private renderBackgroundEffects(context: RenderContext): void {
    // Create background render context
    const backgroundContext: BackgroundRenderContext = {
      ctx: context.ctx,
      width: context.width,
      height: context.height,
      camera: context.camera,
      effects: context.effects,
      frameCount: context.frameCount,
      deltaTime: context.deltaTime,
      now: performance.now()
    }

    // Render background using background renderer
    this.backgroundRenderer.render(backgroundContext)
  }

  /**
   * Render game world layer
   */
  private renderGameWorld(context: RenderContext): void {
    // Create entity render context
    const entityContext: EntityRenderContext = {
      ctx: context.ctx,
      width: context.width,
      height: context.height,
      camera: context.camera,
      effects: context.effects,
      frameCount: context.frameCount,
      deltaTime: context.deltaTime,
      now: performance.now()
    }

    // Render entities using entity renderer
    this.entityRenderer.render(entityContext)
  }

  /**
   * Render particles layer
   */
  private renderParticles(context: RenderContext): void {
    // This will be implemented with particle effects from the EffectsRenderer in Phase 4 Task 4.4
  }

  /**
   * Render UI layer
   */
  private renderUI(context: RenderContext): void {
    // UI rendering is handled by React components, not canvas
  }

  /**
   * Render effects using EffectsRenderer
   */
  private renderEffects(context: RenderContext): void {
    // Create effects render context
    const effectsContext: EffectsRenderContext = {
      ctx: context.ctx,
      width: context.width,
      height: context.height,
      camera: context.camera,
      effects: context.effects,
      frameCount: context.frameCount,
      deltaTime: context.deltaTime,
      now: performance.now()
    }

    // Render effects
    this.effectsRenderer.render(effectsContext)
  }

  /**
   * Apply melting effect
   */
  private applyMeltingEffect(context: RenderContext): void {
    // TODO: Implement melting effect
    console.log('Melting effect applied')
  }

  /**
   * Apply color shift effect
   */
  private applyColorShiftEffect(context: RenderContext): void {
    // TODO: Implement color shift effect
    console.log('Color shift effect applied')
  }

  /**
   * Apply blur effect
   */
  private applyBlurEffect(context: RenderContext): void {
    // TODO: Implement blur effect
    console.log('Blur effect applied')
  }

  /**
   * Apply noise effect
   */
  private applyNoiseEffect(context: RenderContext): void {
    // TODO: Implement noise effect
    console.log('Noise effect applied')
  }

  /**
   * Apply RGB shift effect
   */
  private applyRGBShiftEffect(context: RenderContext): void {
    // TODO: Implement RGB shift effect
    console.log('RGB shift effect applied')
  }

  /**
   * Apply wave effect
   */
  private applyWaveEffect(context: RenderContext): void {
    // TODO: Implement wave effect
    console.log('Wave effect applied')
  }

  /**
   * Apply zoom effect
   */
  private applyZoomEffect(context: RenderContext): void {
    // TODO: Implement zoom effect
    console.log('Zoom effect applied')
  }

  /**
   * Apply rotation effect
   */
  private applyRotationEffect(context: RenderContext): void {
    // TODO: Implement rotation effect
    console.log('Rotation effect applied')
  }

  /**
   * Apply pixel bleed effect
   */
  private applyPixelBleedEffect(context: RenderContext): void {
    // TODO: Implement pixel bleed effect
    console.log('Pixel bleed effect applied')
  }

  /**
   * Get canvas context
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx
  }

  /**
   * Get canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  /**
   * Get render state
   */
  getState(): RenderState {
    return { ...this.state }
  }

  /**
   * Get render config
   */
  getConfig(): RenderConfig {
    return { ...this.config }
  }

  /**
   * Set render config
   */
  setConfig(config: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Check if rendering is active
   */
  isActive(): boolean {
    return this.isRendering
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.state.fps
  }

  /**
   * Get frame count
   */
  getFrameCount(): number {
    return this.state.frameCount
  }

  /**
   * Get delta time
   */
  getDeltaTime(): number {
    return this.state.deltaTime
  }

  /**
   * Get rendering optimizer
   */
  getOptimizer(): RenderingOptimizer {
    return this.optimizer
  }

  /**
   * Get render layer names
   */
  getLayerNames(): string[] {
    return Array.from(this.layers.keys())
  }

  /**
   * Get render layer info
   */
  getLayerInfo(): Array<{ name: string; priority: number; visible: boolean }> {
    return Array.from(this.layers.values()).map(layer => ({
      name: layer.name,
      priority: layer.priority,
      visible: layer.visible
    }))
  }

  /**
   * Get render stats for debugging
   */
  getRenderStats(): {
    isActive: boolean
    frameCount: number
    fps: number
    deltaTime: number
    layerCount: number
    visibleLayers: number
  } {
    const visibleLayers = Array.from(this.layers.values()).filter(layer => layer.visible).length

    return {
      isActive: this.isRendering,
      frameCount: this.state.frameCount,
      fps: this.state.fps,
      deltaTime: this.state.deltaTime,
      layerCount: this.layers.size,
      visibleLayers
    }
  }

  /**
   * Set background stars
   */
  setBackgroundStars(stars: BackgroundStar[]): void {
    this.backgroundRenderer.setBackgroundStars(stars)
  }

  /**
   * Get background renderer
   */
  getBackgroundRenderer(): BackgroundRenderer {
    return this.backgroundRenderer
  }

  /**
   * Set entities for rendering
   */
  setEntities(player: Player | null, enemies: Enemy[], platforms: Platform[], collectibles: Collectible[]): void {
    this.entityRenderer.setEntities(player, enemies, platforms, collectibles)
  }

  /**
   * Set effects for rendering
   */
  setEffects(dataBleedEffects: DataBleedEffect[], particles: Particle[]): void {
    this.effectsRenderer.setEffects(dataBleedEffects, particles)
  }

  /**
   * Get entity renderer
   */
  getEntityRenderer(): EntityRenderer {
    return this.entityRenderer
  }

  /**
   * Get effects renderer
   */
  getEffectsRenderer(): EffectsRenderer {
    return this.effectsRenderer
  }

  /**
   * Get render summary for debugging
   */
  getRenderSummary(): string {
    const stats = this.getRenderStats()
    const backgroundStats = this.backgroundRenderer.getRenderStats()
    const entityStats = this.entityRenderer.getRenderStats()
    return `Renderer: ${stats.isActive ? 'Active' : 'Inactive'}, FPS: ${stats.fps.toFixed(1)}, Layers: ${stats.visibleLayers}/${stats.layerCount}, Frame: ${stats.frameCount} | ${backgroundStats.visibleLayers}/${backgroundStats.layerCount} bg layers | ${entityStats.visibleLayers}/${entityStats.layerCount} entity layers`
  }
} 