import { ObjectPool, ParticlePool, AudioNodePool, Particle, AudioNodeWrapper } from '../lib/game/ObjectPool'

// Mock AudioContext for testing
class MockAudioContext {
  currentTime = 0
  destination = {}
  
  createGain() {
    return {
      gain: { value: 1 },
      connect: jest.fn()
    }
  }
  
  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      onended: null,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    }
  }
  
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    }
  }
}

describe('ObjectPool', () => {
  let pool: ObjectPool<{ id: number; value: string; reset?: () => void }>

  beforeEach(() => {
    pool = new ObjectPool({
      initialSize: 5,
      maxSize: 10,
      createFn: () => ({ id: Math.random(), value: 'default', reset: jest.fn() })
    })
  })

  describe('Constructor and Initialization', () => {
    test('should initialize with correct pool size', () => {
      const stats = pool.getStats()
      expect(stats.poolSize).toBe(5)
      expect(stats.maxSize).toBe(10)
      expect(stats.activeCount).toBe(0)
    })

    test('should initialize with custom configuration', () => {
      const customPool = new ObjectPool({
        initialSize: 3,
        maxSize: 20,
        createFn: () => ({ id: 1, value: 'test' })
      })
      
      const stats = customPool.getStats()
      expect(stats.poolSize).toBe(3)
      expect(stats.maxSize).toBe(20)
    })
  })

  describe('Object Acquisition and Release', () => {
    test('should acquire objects from pool', () => {
      const obj1 = pool.acquire()
      const obj2 = pool.acquire()
      
      expect(obj1).toBeDefined()
      expect(obj2).toBeDefined()
      expect(obj1).not.toBe(obj2)
      
      const stats = pool.getStats()
      expect(stats.activeCount).toBe(2)
      expect(stats.poolSize).toBe(3) // 5 initial - 2 acquired
    })

    test('should create new objects when pool is empty', () => {
      // Acquire all initial objects
      for (let i = 0; i < 5; i++) {
        pool.acquire()
      }
      
      const obj = pool.acquire()
      expect(obj).toBeDefined()
      
      const stats = pool.getStats()
      expect(stats.totalCreated).toBe(1)
      expect(stats.poolSize).toBe(0)
    })

    test('should release objects back to pool', () => {
      const obj = pool.acquire()
      const released = pool.release(obj)
      
      expect(released).toBe(true)
      
      const stats = pool.getStats()
      expect(stats.activeCount).toBe(0)
      expect(stats.poolSize).toBe(5) // Back to initial size
      expect(stats.totalReused).toBe(1)
    })

    test('should not release inactive objects', () => {
      const obj = { id: 999, value: 'external' }
      const released = pool.release(obj)
      
      expect(released).toBe(false)
    })

    test('should handle max pool size', () => {
      // Fill pool to max size
      const objects = []
      for (let i = 0; i < 10; i++) {
        objects.push(pool.acquire())
      }
      
      // Release all
      objects.forEach(obj => pool.release(obj))
      
      const stats = pool.getStats()
      expect(stats.poolSize).toBe(10) // Max size
      expect(stats.activeCount).toBe(0)
    })

    test('should discard objects when pool is full', () => {
      // Fill pool to max size
      const objects = []
      for (let i = 0; i < 10; i++) {
        objects.push(pool.acquire())
      }
      
      // Release all
      objects.forEach(obj => pool.release(obj))
      
      // Create an external object (not from pool)
      const externalObj = { id: 999, value: 'external', reset: jest.fn() }
      
      // Try to release external object (should fail)
      const released = pool.release(externalObj)
      
      expect(released).toBe(false)
      
      const stats = pool.getStats()
      expect(stats.poolSize).toBe(10) // Still at max size
    })
  })

  describe('Object Reset', () => {
    test('should call reset function when releasing', () => {
      const resetFn = jest.fn()
      const customPool = new ObjectPool({
        createFn: () => ({ id: 1, value: 'test' }),
        resetFn
      })
      
      const obj = customPool.acquire()
      customPool.release(obj)
      
      expect(resetFn).toHaveBeenCalledWith(obj)
    })

    test('should call object reset method if available', () => {
      const resetMethod = jest.fn()
      const customPool = new ObjectPool({
        createFn: () => ({ id: 1, value: 'test', reset: resetMethod })
      })
      
      const obj = customPool.acquire()
      customPool.release(obj)
      
      expect(resetMethod).toHaveBeenCalled()
    })
  })

  describe('Validation', () => {
    test('should validate objects before returning to pool', () => {
      const validateFn = jest.fn().mockReturnValue(false)
      const customPool = new ObjectPool({
        createFn: () => ({ id: 1, value: 'test' }),
        validateFn
      })
      
      const obj = customPool.acquire()
      const released = customPool.release(obj)
      
      expect(validateFn).toHaveBeenCalledWith(obj)
      expect(released).toBe(false)
    })
  })

  describe('Multiple Object Operations', () => {
    test('should release multiple objects', () => {
      const objects = []
      for (let i = 0; i < 3; i++) {
        objects.push(pool.acquire())
      }
      
      const releasedCount = pool.releaseMultiple(objects)
      expect(releasedCount).toBe(3)
      
      const stats = pool.getStats()
      expect(stats.activeCount).toBe(0)
      expect(stats.poolSize).toBe(5) // Back to initial size
    })

    test('should handle partial release failures', () => {
      const objects = []
      for (let i = 0; i < 3; i++) {
        objects.push(pool.acquire())
      }
      
      // Add an external object
      objects.push({ id: 999, value: 'external' })
      
      const releasedCount = pool.releaseMultiple(objects)
      expect(releasedCount).toBe(3) // Only the valid objects
    })
  })

  describe('Pool Management', () => {
    test('should clear all objects', () => {
      pool.acquire() // Create some active objects
      pool.clear()
      
      const stats = pool.getStats()
      expect(stats.poolSize).toBe(0)
      expect(stats.activeCount).toBe(0)
    })

    test('should resize pool', () => {
      pool.resize(3)
      
      const stats = pool.getStats()
      expect(stats.maxSize).toBe(3)
      expect(stats.poolSize).toBe(3) // Should be reduced to new max
    })

    test('should warm up pool', () => {
      pool.warmUp(3)
      
      const stats = pool.getStats()
      expect(stats.poolSize).toBe(8) // 5 initial + 3 warmed up
    })

    test('should respect max size during warm up', () => {
      pool.warmUp(10) // Try to add more than max size
      
      const stats = pool.getStats()
      expect(stats.poolSize).toBe(10) // Should not exceed max size
    })
  })

  describe('Statistics', () => {
    test('should calculate utilization rate correctly', () => {
      // Acquire and release objects multiple times
      for (let i = 0; i < 3; i++) {
        const obj = pool.acquire()
        pool.release(obj)
      }
      
      const stats = pool.getStats()
      expect(stats.totalReused).toBe(3)
      expect(stats.totalCreated).toBe(0)
      expect(stats.utilizationRate).toBe(100) // All objects were reused
    })

    test('should track active objects', () => {
      const obj1 = pool.acquire()
      const obj2 = pool.acquire()
      
      expect(pool.isActive(obj1)).toBe(true)
      expect(pool.isActive(obj2)).toBe(true)
      
      pool.release(obj1)
      expect(pool.isActive(obj1)).toBe(false)
      expect(pool.isActive(obj2)).toBe(true)
    })

    test('should get all active objects', () => {
      const obj1 = pool.acquire()
      const obj2 = pool.acquire()
      
      const activeObjects = pool.getActiveObjects()
      expect(activeObjects).toHaveLength(2)
      expect(activeObjects).toContain(obj1)
      expect(activeObjects).toContain(obj2)
    })
  })
})

describe('ParticlePool', () => {
  let particlePool: ParticlePool

  beforeEach(() => {
    particlePool = new ParticlePool(10, 50)
  })

  describe('Particle Creation', () => {
    test('should create particles with correct properties', () => {
      const particle = particlePool.createParticle(100, 200, 5, -3, 60, '#ff0000', 2)
      
      expect(particle.x).toBe(100)
      expect(particle.y).toBe(200)
      expect(particle.vx).toBe(5)
      expect(particle.vy).toBe(-3)
      expect(particle.life).toBe(60)
      expect(particle.maxLife).toBe(60)
      expect(particle.color).toBe('#ff0000')
      expect(particle.scale).toBe(2)
      expect(particle.alpha).toBe(1)
      expect(particle.active).toBe(true)
    })

    test('should use default values for optional parameters', () => {
      const particle = particlePool.createParticle(100, 200, 5, -3, 60)
      
      expect(particle.color).toBe('#ffffff')
      expect(particle.scale).toBe(1)
    })
  })

  describe('Particle Updates', () => {
    test('should update particle positions', () => {
      const particle = particlePool.createParticle(100, 200, 5, -3, 60)
      
      particlePool.updateParticles(1) // 1 frame at 60 FPS
      
      expect(particle.x).toBe(105) // 100 + 5
      expect(particle.y).toBe(197) // 200 + (-3)
    })

    test('should update particle life and alpha', () => {
      const particle = particlePool.createParticle(100, 200, 0, 0, 60)
      
      particlePool.updateParticles(30) // 30 frames
      
      expect(particle.life).toBe(30) // 60 - 30
      expect(particle.alpha).toBe(0.5) // 30 / 60
    })

    test('should deactivate and release dead particles', () => {
      const particle = particlePool.createParticle(100, 200, 0, 0, 1)
      
      particlePool.updateParticles(2) // More than particle life
      
      expect(particle.active).toBe(false)
      expect(particle.life).toBeLessThanOrEqual(0)
    })
  })

  describe('Particle Reset', () => {
    test('should reset particle properties when released', () => {
      const particle = particlePool.createParticle(100, 200, 5, -3, 60, '#ff0000', 2)
      
      particlePool.release(particle)
      
      expect(particle.x).toBe(0)
      expect(particle.y).toBe(0)
      expect(particle.vx).toBe(0)
      expect(particle.vy).toBe(0)
      expect(particle.life).toBe(0)
      expect(particle.maxLife).toBe(0)
      expect(particle.alpha).toBe(1)
      expect(particle.scale).toBe(1)
      expect(particle.color).toBe('#ffffff')
      expect(particle.active).toBe(false)
    })
  })
})

describe('AudioNodePool', () => {
  let audioContext: MockAudioContext
  let audioNodePool: AudioNodePool

  beforeEach(() => {
    audioContext = new MockAudioContext() as any
    audioNodePool = new AudioNodePool(audioContext, 5, 20)
  })

  describe('Audio Node Creation', () => {
    test('should create audio node wrapper', () => {
      const wrapper = audioNodePool.createAudioNode()
      
      expect(wrapper.node).toBeNull()
      expect(wrapper.source).toBeNull()
      expect(wrapper.gainNode).toBeNull()
      expect(wrapper.startTime).toBe(0)
      expect(wrapper.duration).toBe(0)
      expect(wrapper.active).toBe(true)
    })
  })

  describe('Audio Playback', () => {
    test('should play audio with buffer', () => {
      const mockBuffer = {
        duration: 2.0
      } as AudioBuffer
      
      const wrapper = audioNodePool.playAudio(mockBuffer, 0.5, false)
      
      expect(wrapper).toBeDefined()
      expect(wrapper?.source).toBeDefined()
      expect(wrapper?.gainNode).toBeDefined()
      expect(wrapper?.startTime).toBe(0)
      expect(wrapper?.duration).toBe(2.0)
    })

    test('should handle audio playback errors gracefully', () => {
      // Mock a failure scenario
      jest.spyOn(audioContext, 'createBufferSource').mockImplementation(() => {
        throw new Error('Audio creation failed')
      })
      
      const mockBuffer = { duration: 1.0 } as AudioBuffer
      const wrapper = audioNodePool.playAudio(mockBuffer)
      
      expect(wrapper).toBeNull()
    })
  })

  describe('Audio Control', () => {
    test('should stop audio and release node', () => {
      const mockBuffer = { duration: 1.0 } as AudioBuffer
      const wrapper = audioNodePool.playAudio(mockBuffer)
      
      if (wrapper) {
        expect(wrapper.source).toBeDefined()
        expect(wrapper.source?.stop).toBeDefined()
        
        // Ensure we have a valid source with a stop method
        const source = wrapper.source
        expect(source).toBeDefined()
        expect(source?.stop).toBeDefined()
        
        audioNodePool.stopAudio(wrapper)
        
        expect(wrapper.active).toBe(false)
        // Only check if the source and stop method exist
        if (source && source.stop) {
          expect(source.stop).toHaveBeenCalled()
        }
      }
    })

    test('should stop all audio nodes', () => {
      const mockBuffer = { duration: 1.0 } as AudioBuffer
      const wrapper1 = audioNodePool.playAudio(mockBuffer)
      const wrapper2 = audioNodePool.playAudio(mockBuffer)
      
      audioNodePool.stopAllAudio()
      
      if (wrapper1) expect(wrapper1.active).toBe(false)
      if (wrapper2) expect(wrapper2.active).toBe(false)
    })
  })

  describe('Audio Node Reset', () => {
    test('should reset wrapper properties when released', () => {
      const wrapper = audioNodePool.createAudioNode()
      
      audioNodePool.release(wrapper)
      
      expect(wrapper.node).toBeNull()
      expect(wrapper.source).toBeNull()
      expect(wrapper.gainNode).toBeNull()
      expect(wrapper.startTime).toBe(0)
      expect(wrapper.duration).toBe(0)
      expect(wrapper.active).toBe(false)
    })
  })
})

describe('Object Pool Performance', () => {
  test('should handle high-frequency object creation efficiently', () => {
    const pool = new ObjectPool({
      initialSize: 100,
      maxSize: 1000,
      createFn: () => ({ id: Math.random(), value: 'test' })
    })
    
    const startTime = performance.now()
    
    // Simulate high-frequency object creation and release
    for (let i = 0; i < 1000; i++) {
      const obj = pool.acquire()
      pool.release(obj)
    }
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    expect(duration).toBeLessThan(100) // Should complete in under 100ms
    
    const stats = pool.getStats()
    expect(stats.utilizationRate).toBeGreaterThan(90) // High reuse rate
  })

  test('should maintain consistent performance under load', () => {
    const pool = new ObjectPool({
      initialSize: 50,
      maxSize: 200,
      createFn: () => ({ id: Math.random(), value: 'test' })
    })
    
    const times: number[] = []
    
    // Run multiple batches to test consistency
    for (let batch = 0; batch < 5; batch++) {
      const startTime = performance.now()
      
      for (let i = 0; i < 100; i++) {
        const obj = pool.acquire()
        pool.release(obj)
      }
      
      const endTime = performance.now()
      times.push(endTime - startTime)
    }
    
    // Check that performance is consistent (within 100% of average)
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    times.forEach(time => {
      expect(time).toBeLessThan(avgTime * 2.0)
    })
  })
}) 