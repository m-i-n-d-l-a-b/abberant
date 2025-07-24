import { RenderingOptimizer, RenderBatch, OptimizedTransform } from '../lib/game/RenderingOptimizer'

// Mock canvas context for testing
class MockCanvasRenderingContext2D {
  save = jest.fn()
  restore = jest.fn()
  translate = jest.fn()
  rotate = jest.fn()
  scale = jest.fn()
  fillRect = jest.fn()
  fillText = jest.fn()
  drawImage = jest.fn()
  beginPath = jest.fn()
  arc = jest.fn()
  fill = jest.fn()
  moveTo = jest.fn()
  lineTo = jest.fn()
  closePath = jest.fn()
  clearRect = jest.fn()
  
  fillStyle = '#000000'
  globalAlpha = 1
  globalCompositeOperation = 'source-over'
  imageSmoothingEnabled = true
  imageSmoothingQuality = 'low'
  font = '16px Arial'
  shadowOffsetX = 0
  shadowOffsetY = 0
  shadowBlur = 0
  shadowColor = 'rgba(0, 0, 0, 0)'
}

describe('RenderingOptimizer', () => {
  let ctx: MockCanvasRenderingContext2D
  let optimizer: RenderingOptimizer

  beforeEach(() => {
    ctx = new MockCanvasRenderingContext2D() as any
    optimizer = new RenderingOptimizer(ctx as any)
  })

  describe('Constructor and Initialization', () => {
    test('should initialize with canvas context', () => {
      expect(optimizer).toBeDefined()
      const stats = optimizer.getStats()
      expect(stats.stateChanges).toBe(0)
      expect(stats.drawCalls).toBe(0)
      expect(stats.batchCount).toBe(0)
    })
  })

  describe('Batch Management', () => {
    test('should begin and end batches correctly', () => {
      optimizer.beginBatch('test-batch')
      optimizer.drawRect(10, 10, 50, 50, '#ff0000')
      optimizer.endBatch()
      
      const stats = optimizer.getStats()
      expect(stats.batchCount).toBe(1)
      expect(stats.totalBatchedItems).toBe(0) // Batch was flushed
    })

    test('should handle multiple batches', () => {
      optimizer.beginBatch('batch1')
      optimizer.drawRect(10, 10, 50, 50, '#ff0000')
      optimizer.endBatch()
      
      optimizer.beginBatch('batch2')
      optimizer.drawRect(20, 20, 50, 50, '#00ff00')
      optimizer.endBatch()
      
      const stats = optimizer.getStats()
      expect(stats.batchCount).toBe(2)
    })

    test('should flush all batches', () => {
      optimizer.beginBatch('batch1')
      optimizer.drawRect(10, 10, 50, 50, '#ff0000')
      
      optimizer.beginBatch('batch2')
      optimizer.drawRect(20, 20, 50, 50, '#00ff00')
      
      optimizer.flushAllBatches()
      
      const stats = optimizer.getStats()
      expect(stats.batchCount).toBe(2)
    })
  })

  describe('Drawing Operations', () => {
    test('should draw rectangles correctly', () => {
      optimizer.beginBatch('rects')
      optimizer.drawRect(10, 20, 50, 30, '#ff0000', 0.8)
      optimizer.endBatch()
      
      expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 50, 30)
    })

    test('should draw circles correctly', () => {
      optimizer.beginBatch('circles')
      optimizer.drawCircle(100, 100, 25, '#00ff00', 0.9)
      optimizer.endBatch()
      
      expect(ctx.beginPath).toHaveBeenCalled()
      expect(ctx.arc).toHaveBeenCalledWith(100, 100, 25, 0, Math.PI * 2)
      expect(ctx.fill).toHaveBeenCalled()
    })

    test('should draw text correctly', () => {
      optimizer.beginBatch('text')
      optimizer.drawText('Hello World', 50, 50, '#ffffff', '20px Arial', 1.0)
      optimizer.endBatch()
      
      expect(ctx.fillText).toHaveBeenCalledWith('Hello World', 50, 50)
    })

    test('should draw images correctly', () => {
      const mockImage = {} as HTMLImageElement
      optimizer.beginBatch('images')
      optimizer.drawImage(mockImage, 10, 10, 100, 100, 0.8)
      optimizer.endBatch()
      
      expect(ctx.drawImage).toHaveBeenCalledWith(mockImage, 10, 10, 100, 100)
    })

    test('should draw paths correctly', () => {
      const path = new Path2D()
      optimizer.beginBatch('paths')
      optimizer.drawPath(path, 0, 0, '#ff0000', 1.0)
      optimizer.endBatch()
      
      expect(ctx.fill).toHaveBeenCalledWith(path)
    })
  })

  describe('Transform Management', () => {
    test('should set transform correctly', () => {
      optimizer.setTransform({
        x: 100,
        y: 200,
        rotation: Math.PI / 4,
        scaleX: 2,
        scaleY: 1.5,
        alpha: 0.8
      })
      
      optimizer.beginBatch('test')
      optimizer.drawRect(0, 0, 10, 10, '#ff0000')
      optimizer.endBatch()
      
      expect(ctx.translate).toHaveBeenCalledWith(100, 200)
      expect(ctx.rotate).toHaveBeenCalledWith(Math.PI / 4)
      expect(ctx.scale).toHaveBeenCalledWith(2, 1.5)
    })

    test('should push and pop transforms', () => {
      optimizer.setTransform({ x: 100, y: 100 })
      optimizer.pushTransform()
      optimizer.setTransform({ x: 200, y: 200 })
      optimizer.popTransform()
      
      optimizer.beginBatch('test')
      optimizer.drawRect(0, 0, 10, 10, '#ff0000')
      optimizer.endBatch()
      
      // Should use the original transform (100, 100)
      expect(ctx.translate).toHaveBeenCalledWith(100, 100)
    })
  })

  describe('Canvas Properties', () => {
    test('should set canvas properties efficiently', () => {
      optimizer.setCanvasProperties({
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'high',
        globalCompositeOperation: 'multiply',
        globalAlpha: 0.5
      })
      
      expect(ctx.imageSmoothingEnabled).toBe(false)
      expect(ctx.imageSmoothingQuality).toBe('high')
      expect(ctx.globalCompositeOperation).toBe('multiply')
      expect(ctx.globalAlpha).toBe(0.5)
    })
  })

  describe('Batch Grouping', () => {
    test('should group similar items together', () => {
      optimizer.beginBatch('grouped')
      
      // Same color and alpha - should be grouped
      optimizer.drawRect(10, 10, 50, 50, '#ff0000', 1.0)
      optimizer.drawRect(20, 20, 50, 50, '#ff0000', 1.0)
      optimizer.drawRect(30, 30, 50, 50, '#ff0000', 1.0)
      
      // Different color - should be separate group
      optimizer.drawRect(40, 40, 50, 50, '#00ff00', 1.0)
      
      optimizer.endBatch()
      
      const stats = optimizer.getStats()
      expect(stats.stateChanges).toBeGreaterThan(0)
    })
  })

  describe('Matrix Transformations', () => {
    test('should transform matrix correctly', () => {
      const matrix = new DOMMatrix()
      const transformed = optimizer.transformMatrix(matrix, 100, 200, Math.PI / 4, 2, 1.5)
      
      expect(transformed).toBeDefined()
      expect(transformed).not.toBe(matrix) // Should be a new matrix
    })
  })

  describe('Batch Operations', () => {
    test('should batch multiple operations', () => {
      const operations = [
        { x: 10, y: 10, color: '#ff0000' },
        { x: 20, y: 20, color: '#00ff00' },
        { x: 30, y: 30, color: '#0000ff' }
      ]
      
      optimizer.batchOperations(operations, (op, ctx) => {
        ctx.fillStyle = op.color
        ctx.fillRect(op.x, op.y, 10, 10)
      })
      
      const stats = optimizer.getStats()
      expect(stats.drawCalls).toBe(3)
    })

    test('should group operations by key', () => {
      const operations = [
        { x: 10, y: 10, color: '#ff0000', type: 'rect' },
        { x: 20, y: 20, color: '#ff0000', type: 'rect' },
        { x: 30, y: 30, color: '#00ff00', type: 'circle' }
      ]
      
      optimizer.batchOperations(operations, (op, ctx) => {
        ctx.fillStyle = op.color
        if (op.type === 'rect') {
          ctx.fillRect(op.x, op.y, 10, 10)
        } else {
          ctx.beginPath()
          ctx.arc(op.x, op.y, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      }, (op) => `${op.color}-${op.type}`)
      
      const stats = optimizer.getStats()
      expect(stats.drawCalls).toBe(3)
    })
  })

  describe('Path Creation', () => {
    test('should create optimized path', () => {
      const vertices = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ]
      
      const path = optimizer.createOptimizedPath(vertices)
      expect(path).toBeInstanceOf(Path2D)
    })

    test('should handle empty vertices', () => {
      const path = optimizer.createOptimizedPath([])
      expect(path).toBeInstanceOf(Path2D)
    })
  })

  describe('Offscreen Canvas', () => {
    test('should create offscreen canvas', () => {
      const { canvas, ctx: offscreenCtx } = optimizer.createOffscreenCanvas(100, 100)
      
      expect(canvas).toBeInstanceOf(HTMLCanvasElement)
      expect(canvas.width).toBe(100)
      expect(canvas.height).toBe(100)
      expect(offscreenCtx).toBeDefined()
    })

    test('should draw offscreen canvas', () => {
      const { canvas } = optimizer.createOffscreenCanvas(50, 50)
      
      optimizer.drawOffscreenCanvas(canvas, 10, 20, 0.8)
      
      expect(ctx.drawImage).toHaveBeenCalledWith(canvas, 10, 20)
      expect(ctx.globalAlpha).toBe(0.8)
    })
  })

  describe('Statistics', () => {
    test('should track state changes', () => {
      optimizer.beginBatch('test')
      optimizer.drawRect(10, 10, 50, 50, '#ff0000')
      optimizer.drawRect(20, 20, 50, 50, '#00ff00') // Different color = new state
      optimizer.endBatch()
      
      const stats = optimizer.getStats()
      expect(stats.stateChanges).toBeGreaterThan(0)
    })

    test('should track draw calls', () => {
      optimizer.beginBatch('test')
      optimizer.drawRect(10, 10, 50, 50, '#ff0000')
      optimizer.drawCircle(100, 100, 25, '#00ff00')
      optimizer.endBatch()
      
      const stats = optimizer.getStats()
      expect(stats.drawCalls).toBe(2)
    })

    test('should calculate average batch size', () => {
      optimizer.beginBatch('batch1')
      optimizer.drawRect(10, 10, 50, 50, '#ff0000')
      optimizer.drawRect(20, 20, 50, 50, '#ff0000')
      optimizer.endBatch()
      
      optimizer.beginBatch('batch2')
      optimizer.drawRect(30, 30, 50, 50, '#00ff00')
      optimizer.endBatch()
      
      const stats = optimizer.getStats()
      expect(stats.averageBatchSize).toBe(1.5) // (2 + 1) / 2
    })

    test('should reset statistics', () => {
      optimizer.beginBatch('test')
      optimizer.drawRect(10, 10, 50, 50, '#ff0000')
      optimizer.endBatch()
      
      optimizer.resetStats()
      
      const stats = optimizer.getStats()
      expect(stats.stateChanges).toBe(0)
      expect(stats.drawCalls).toBe(0)
      expect(stats.batchCount).toBe(0)
    })
  })

  describe('Performance Optimizations', () => {
    test('should minimize state changes for similar items', () => {
      optimizer.beginBatch('optimized')
      
      // All same color - should use minimal state changes
      for (let i = 0; i < 10; i++) {
        optimizer.drawRect(i * 10, i * 10, 50, 50, '#ff0000', 1.0)
      }
      
      optimizer.endBatch()
      
      const stats = optimizer.getStats()
      expect(stats.stateChanges).toBeLessThan(10) // Should be grouped
    })

    test('should handle large batches efficiently', () => {
      optimizer.beginBatch('large')
      
      // Create many items with different properties
      for (let i = 0; i < 100; i++) {
        const color = `hsl(${i * 3.6}, 70%, 50%)`
        optimizer.drawRect(i * 5, i * 5, 10, 10, color, 0.8 + (i % 10) * 0.02)
      }
      
      optimizer.endBatch()
      
      const stats = optimizer.getStats()
      expect(stats.batchCount).toBe(1)
      expect(stats.drawCalls).toBe(100)
    })
  })

  describe('Error Handling', () => {
    test('should handle empty batches gracefully', () => {
      optimizer.beginBatch('empty')
      optimizer.endBatch()
      
      const stats = optimizer.getStats()
      expect(stats.batchCount).toBe(1)
      expect(stats.drawCalls).toBe(0)
    })

    test('should handle invalid transforms', () => {
      optimizer.setTransform({
        x: NaN,
        y: Infinity,
        rotation: NaN,
        scaleX: -1,
        scaleY: 0
      })
      
      optimizer.beginBatch('test')
      optimizer.drawRect(0, 0, 10, 10, '#ff0000')
      optimizer.endBatch()
      
      // Should not throw errors
      expect(() => optimizer.getStats()).not.toThrow()
    })
  })
}) 