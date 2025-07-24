/**
 * Renderer Test Suite
 * 
 * Tests for the rendering system that handles all game visual output.
 */

import { Renderer, RenderConfig, RenderState } from '../lib/game/Renderer'
import { Player, Enemy, Platform, Collectible, Camera, Effects } from '../types/game'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CAMERA_SMOOTHING,
  CAMERA_ZOOM_MIN,
  CAMERA_ZOOM_MAX,
} from '../constants/game'

// Mock canvas context
const mockCanvasContext = {
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  setTransform: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  measureText: jest.fn(() => ({ width: 10 })),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  globalAlpha: 1,
  fillStyle: '#000000',
  strokeStyle: '#000000',
  lineWidth: 1,
  font: '12px Arial',
  textAlign: 'left',
  textBaseline: 'top',
} as unknown as CanvasRenderingContext2D

// Mock canvas
const mockCanvas = {
  getContext: jest.fn(() => mockCanvasContext),
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
} as unknown as HTMLCanvasElement

describe('Renderer', () => {
  let renderer: Renderer
  let mockPlayer: Player
  let mockEnemies: Enemy[]
  let mockPlatforms: Platform[]
  let mockCollectibles: Collectible[]
  let mockCamera: Camera
  let mockEffects: Effects

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Create mock game objects
    mockPlayer = {
      x: 100,
      y: 300,
      width: 32,
      height: 32,
      vx: 0,
      vy: 0,
      onGround: false,
      canJump: true,
      canDash: true,
      dashCooldown: 0,
      invulnerable: false,
      invulnerableTimer: 0,
      trail: [],
      color: '#00ffff',
    }

    mockEnemies = [
      {
        id: 'enemy-1',
        x: 200,
        y: 300,
        width: 24,
        height: 24,
        vx: 1,
        vy: 0,
        startX: 200,
        moveRange: 100,
        direction: 1,
        onGround: true,
        color: '#ff0000',
      },
    ]

    mockPlatforms = [
      {
        x: 100,
        y: 350,
        width: 200,
        height: 20,
        color: '#00ff00',
      },
    ]

    mockCollectibles = [
      {
        id: 'collectible-1',
        x: 300,
        y: 250,
        width: 16,
        height: 16,
        collected: false,
        color: '#ffff00',
        value: 100,
      },
    ]

    mockCamera = {
      x: 0,
      y: 0,
      zoom: 1,
      targetZoom: 1,
      zoomSpeed: 0.1,
    }

    mockEffects = {
      dreamParticles: [],
      dreamWaves: [],
      dreamLayers: [],
      dataBleedEffects: [],
      particles: [],
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
    }

    // Create renderer instance
    const renderConfig = {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      fps: 60,
      enableOptimization: true,
    }
    renderer = new Renderer(mockCanvas, renderConfig)
  })

  describe('Initialization', () => {
    test('should initialize with canvas', () => {
      expect(renderer.canvas).toBe(mockCanvas)
      expect(renderer.ctx).toBe(mockCanvasContext)
      expect(renderer.width).toBe(CANVAS_WIDTH)
      expect(renderer.height).toBe(CANVAS_HEIGHT)
    })

    test('should initialize with default config', () => {
      const config = renderer.getConfig()
      expect(config).toBeDefined()
      expect(config.enableOptimizations).toBe(true)
      expect(config.maxFPS).toBe(60)
    })

    test('should set custom config', () => {
      const customConfig: RenderConfig = {
        enableOptimizations: false,
        maxFPS: 30,
        enableShadows: true,
        enableParticles: false,
      }

      renderer.setConfig(customConfig)
      const config = renderer.getConfig()
      
      expect(config.enableOptimizations).toBe(false)
      expect(config.maxFPS).toBe(30)
      expect(config.enableShadows).toBe(true)
      expect(config.enableParticles).toBe(false)
    })
  })

  describe('Camera Management', () => {
    test('should update camera position', () => {
      const newCamera = { ...mockCamera, x: 100, y: 50 }
      renderer.updateCamera(newCamera)
      
      const camera = renderer.getCamera()
      expect(camera.x).toBe(100)
      expect(camera.y).toBe(50)
    })

    test('should apply camera smoothing', () => {
      const targetCamera = { ...mockCamera, x: 200, y: 100 }
      renderer.updateCamera(targetCamera)
      
      // Update multiple times to see smoothing
      for (let i = 0; i < 10; i++) {
        renderer.updateCamera(targetCamera)
      }
      
      const camera = renderer.getCamera()
      expect(camera.x).toBeCloseTo(200, 1)
      expect(camera.y).toBeCloseTo(100, 1)
    })

    test('should handle camera zoom', () => {
      const zoomedCamera = { ...mockCamera, zoom: 2, targetZoom: 2 }
      renderer.updateCamera(zoomedCamera)
      
      const camera = renderer.getCamera()
      expect(camera.zoom).toBe(2)
    })

    test('should clamp camera zoom', () => {
      const overZoomedCamera = { ...mockCamera, zoom: 5, targetZoom: 5 }
      renderer.updateCamera(overZoomedCamera)
      
      const camera = renderer.getCamera()
      expect(camera.zoom).toBeLessThanOrEqual(CAMERA_ZOOM_MAX)
    })
  })

  describe('Rendering Functions', () => {
    test('should render background', () => {
      renderer.renderBackgroundLayer()
      
      expect(mockCanvasContext.clearRect).toHaveBeenCalled()
      expect(mockCanvasContext.fillRect).toHaveBeenCalled()
    })

    test('should render player', () => {
      renderer.renderPlayer(mockPlayer)
      
      expect(mockCanvasContext.save).toHaveBeenCalled()
      expect(mockCanvasContext.translate).toHaveBeenCalled()
      expect(mockCanvasContext.fillRect).toHaveBeenCalled()
      expect(mockCanvasContext.restore).toHaveBeenCalled()
    })

    test('should render player trail', () => {
      const playerWithTrail = {
        ...mockPlayer,
        trail: [
          { x: 100, y: 300 },
          { x: 95, y: 295 },
          { x: 90, y: 290 },
        ],
      }

      renderer.renderPlayer(playerWithTrail)
      
      // Should render trail points
      expect(mockCanvasContext.beginPath).toHaveBeenCalled()
      expect(mockCanvasContext.arc).toHaveBeenCalled()
    })

    test('should render enemies', () => {
      renderer.renderEnemies(mockEnemies)
      
      expect(mockCanvasContext.save).toHaveBeenCalled()
      expect(mockCanvasContext.translate).toHaveBeenCalled()
      expect(mockCanvasContext.fillRect).toHaveBeenCalled()
      expect(mockCanvasContext.restore).toHaveBeenCalled()
    })

    test('should render platforms', () => {
      renderer.renderPlatforms(mockPlatforms)
      
      expect(mockCanvasContext.save).toHaveBeenCalled()
      expect(mockCanvasContext.translate).toHaveBeenCalled()
      expect(mockCanvasContext.fillRect).toHaveBeenCalled()
      expect(mockCanvasContext.restore).toHaveBeenCalled()
    })

    test('should render collectibles', () => {
      renderer.renderCollectibles(mockCollectibles)
      
      expect(mockCanvasContext.save).toHaveBeenCalled()
      expect(mockCanvasContext.translate).toHaveBeenCalled()
      expect(mockCanvasContext.fillRect).toHaveBeenCalled()
      expect(mockCanvasContext.restore).toHaveBeenCalled()
    })

    test('should render effects', () => {
      renderer.renderEffects(mockEffects)
      
      expect(mockCanvasContext.save).toHaveBeenCalled()
      expect(mockCanvasContext.restore).toHaveBeenCalled()
    })

    test('should render UI elements', () => {
      const uiData = {
        score: 1000,
        lives: 3,
        level: 2,
        soundEnabled: true,
      }

      renderer.renderUI(uiData)
      
      expect(mockCanvasContext.fillText).toHaveBeenCalled()
      expect(mockCanvasContext.strokeText).toHaveBeenCalled()
    })
  })

  describe('Main Render Function', () => {
    test('should perform complete render cycle', () => {
      const renderState: RenderState = {
        player: mockPlayer,
        enemies: mockEnemies,
        platforms: mockPlatforms,
        collectibles: mockCollectibles,
        camera: mockCamera,
        effects: mockEffects,
        ui: {
          score: 1000,
          lives: 3,
          level: 2,
          soundEnabled: true,
        },
      }

      renderer.render(renderState)
      
      // Should call all rendering functions
      expect(mockCanvasContext.clearRect).toHaveBeenCalled()
      expect(mockCanvasContext.save).toHaveBeenCalled()
      expect(mockCanvasContext.translate).toHaveBeenCalled()
      expect(mockCanvasContext.fillRect).toHaveBeenCalled()
      expect(mockCanvasContext.restore).toHaveBeenCalled()
    })

    test('should handle empty render state', () => {
      const emptyState: RenderState = {
        player: mockPlayer,
        enemies: [],
        platforms: [],
        collectibles: [],
        camera: mockCamera,
        effects: mockEffects,
        ui: {
          score: 0,
          lives: 3,
          level: 1,
          soundEnabled: true,
        },
      }

      renderer.render(emptyState)
      
      // Should still render successfully
      expect(mockCanvasContext.clearRect).toHaveBeenCalled()
      expect(mockCanvasContext.save).toHaveBeenCalled()
    })
  })

  describe('Optimized Rendering', () => {
    test('should use optimized rendering when enabled', () => {
      const config: RenderConfig = {
        enableOptimizations: true,
        maxFPS: 60,
        enableShadows: false,
        enableParticles: false,
      }

      renderer.setConfig(config)
      
      const renderState: RenderState = {
        player: mockPlayer,
        enemies: mockEnemies,
        platforms: mockPlatforms,
        collectibles: mockCollectibles,
        camera: mockCamera,
        effects: mockEffects,
        ui: {
          score: 1000,
          lives: 3,
          level: 2,
          soundEnabled: true,
        },
      }

      renderer.renderOptimized(renderState)
      
      // Should use optimized rendering path
      expect(mockCanvasContext.clearRect).toHaveBeenCalled()
      expect(mockCanvasContext.save).toHaveBeenCalled()
    })

    test('should batch similar rendering operations', () => {
      const manyEnemies = Array(10).fill(null).map((_, i) => ({
        ...mockEnemies[0],
        id: `enemy-${i}`,
        x: 200 + i * 50,
      }))

      const renderState: RenderState = {
        player: mockPlayer,
        enemies: manyEnemies,
        platforms: mockPlatforms,
        collectibles: mockCollectibles,
        camera: mockCamera,
        effects: mockEffects,
        ui: {
          score: 1000,
          lives: 3,
          level: 2,
          soundEnabled: true,
        },
      }

      renderer.renderOptimized(renderState)
      
      // Should batch enemy rendering
      expect(mockCanvasContext.save).toHaveBeenCalled()
      expect(mockCanvasContext.fillRect).toHaveBeenCalled()
    })
  })

  describe('Special Effects', () => {
    test('should render invulnerability effect', () => {
      const invulnerablePlayer = { ...mockPlayer, invulnerable: true }
      
      renderer.renderPlayer(invulnerablePlayer)
      
      // Should render invulnerability effect
      expect(mockCanvasContext.globalAlpha).toBeLessThan(1)
    })

    test('should render particle effects', () => {
      const effectsWithParticles = {
        ...mockEffects,
        particles: [
          { x: 100, y: 200, vx: 1, vy: -1, life: 10, color: '#ffffff' },
        ],
      }

      renderer.renderEffects(effectsWithParticles)
      
      expect(mockCanvasContext.beginPath).toHaveBeenCalled()
      expect(mockCanvasContext.arc).toHaveBeenCalled()
    })

    test('should render data bleed effects', () => {
      const effectsWithDataBleed = {
        ...mockEffects,
        dataBleedEffects: [
          { x: 100, y: 200, size: 20, life: 10, color: '#ff00ff' },
        ],
      }

      renderer.renderEffects(effectsWithDataBleed)
      
      expect(mockCanvasContext.beginPath).toHaveBeenCalled()
      expect(mockCanvasContext.arc).toHaveBeenCalled()
    })
  })

  describe('Coordinate Transformations', () => {
    test('should transform world coordinates to screen coordinates', () => {
      const worldPos = { x: 100, y: 200 }
      const screenPos = renderer.worldToScreen(worldPos)
      
      expect(screenPos.x).toBeDefined()
      expect(screenPos.y).toBeDefined()
    })

    test('should transform screen coordinates to world coordinates', () => {
      const screenPos = { x: 400, y: 300 }
      const worldPos = renderer.screenToWorld(screenPos)
      
      expect(worldPos.x).toBeDefined()
      expect(worldPos.y).toBeDefined()
    })

    test('should handle camera offset in transformations', () => {
      const camera = { ...mockCamera, x: 100, y: 50 }
      renderer.updateCamera(camera)
      
      const worldPos = { x: 200, y: 250 }
      const screenPos = renderer.worldToScreen(worldPos)
      
      // Should account for camera offset
      expect(screenPos.x).toBe(100) // 200 - 100
      expect(screenPos.y).toBe(200) // 250 - 50
    })
  })

  describe('Performance Monitoring', () => {
    test('should track render performance', () => {
      const renderState: RenderState = {
        player: mockPlayer,
        enemies: mockEnemies,
        platforms: mockPlatforms,
        collectibles: mockCollectibles,
        camera: mockCamera,
        effects: mockEffects,
        ui: {
          score: 1000,
          lives: 3,
          level: 2,
          soundEnabled: true,
        },
      }

      // Perform multiple renders
      for (let i = 0; i < 10; i++) {
        renderer.render(renderState)
      }

      const stats = renderer.getStats()
      
      expect(stats.renderCount).toBe(10)
      expect(stats.averageRenderTime).toBeGreaterThan(0)
      expect(stats.fps).toBeGreaterThan(0)
    })

    test('should reset performance stats', () => {
      const renderState: RenderState = {
        player: mockPlayer,
        enemies: mockEnemies,
        platforms: mockPlatforms,
        collectibles: mockCollectibles,
        camera: mockCamera,
        effects: mockEffects,
        ui: {
          score: 1000,
          lives: 3,
          level: 2,
          soundEnabled: true,
        },
      }

      renderer.render(renderState)
      renderer.resetStats()
      
      const stats = renderer.getStats()
      expect(stats.renderCount).toBe(0)
      expect(stats.averageRenderTime).toBe(0)
    })
  })

  describe('Error Handling', () => {
    test('should handle missing canvas context', () => {
      const invalidCanvas = {
        getContext: jest.fn(() => null),
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      } as unknown as HTMLCanvasElement

      expect(() => new Renderer(invalidCanvas)).toThrow()
    })

    test('should handle invalid render state', () => {
      const invalidState = {
        player: null,
        enemies: null,
        platforms: null,
        collectibles: null,
        camera: null,
        effects: null,
        ui: null,
      } as unknown as RenderState

      expect(() => renderer.render(invalidState)).toThrow()
    })

    test('should handle rendering with invalid coordinates', () => {
      const invalidPlayer = { ...mockPlayer, x: NaN, y: Infinity }
      
      expect(() => renderer.renderPlayer(invalidPlayer)).not.toThrow()
    })
  })

  describe('Cleanup', () => {
    test('should cleanup resources', () => {
      renderer.cleanup()
      
      // Should clear any cached resources
      expect(renderer.getStats().renderCount).toBe(0)
    })
  })
}) 