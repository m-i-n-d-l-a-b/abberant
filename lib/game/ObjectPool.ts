/**
 * Generic Object Pool for efficient object reuse
 * Reduces garbage collection overhead by reusing objects instead of creating new ones
 */

export interface Poolable {
  reset?(): void // Optional reset method for objects that need cleanup
}

export interface ObjectPoolConfig<T> {
  initialSize?: number
  maxSize?: number
  createFn: () => T
  resetFn?: (obj: T) => void
  validateFn?: (obj: T) => boolean
}

export class ObjectPool<T extends Poolable> {
  private pool: T[] = []
  private activeObjects: Set<T> = new Set()
  private createFn: () => T
  private resetFn?: (obj: T) => void
  private validateFn?: (obj: T) => boolean
  private maxSize: number
  private totalCreated: number = 0
  private totalReused: number = 0

  constructor(config: ObjectPoolConfig<T>) {
    this.createFn = config.createFn
    this.resetFn = config.resetFn
    this.validateFn = config.validateFn
    this.maxSize = config.maxSize || 1000

    // Pre-populate pool with initial objects
    const initialSize = config.initialSize || 10
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn())
    }
  }

  /**
   * Get an object from the pool or create a new one
   */
  acquire(): T {
    let obj: T

    if (this.pool.length > 0) {
      obj = this.pool.pop()!
      this.totalReused++
    } else {
      obj = this.createFn()
      this.totalCreated++
    }

    this.activeObjects.add(obj)
    return obj
  }

  /**
   * Return an object to the pool for reuse
   */
  release(obj: T): boolean {
    if (!this.activeObjects.has(obj)) {
      console.warn('Attempted to release an object that is not active in the pool')
      return false
    }

    // Validate object before returning to pool
    if (this.validateFn && !this.validateFn(obj)) {
      this.activeObjects.delete(obj)
      return false
    }

    // Reset object state
    if (this.resetFn) {
      this.resetFn(obj)
    } else if (obj.reset) {
      obj.reset()
    }

    // Return to pool if not at max size
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj)
      this.activeObjects.delete(obj)
      return true
    } else {
      // Pool is full, discard the object
      this.activeObjects.delete(obj)
      return false
    }
  }

  /**
   * Release multiple objects at once
   */
  releaseMultiple(objects: T[]): number {
    let releasedCount = 0
    for (const obj of objects) {
      if (this.release(obj)) {
        releasedCount++
      }
    }
    return releasedCount
  }

  /**
   * Clear all objects from the pool
   */
  clear(): void {
    this.pool.length = 0
    this.activeObjects.clear()
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    poolSize: number
    activeCount: number
    totalCreated: number
    totalReused: number
    maxSize: number
    utilizationRate: number
  } {
    const totalUsed = this.totalCreated + this.totalReused
    const utilizationRate = totalUsed > 0 ? (this.totalReused / totalUsed) * 100 : 0

    return {
      poolSize: this.pool.length,
      activeCount: this.activeObjects.size,
      totalCreated: this.totalCreated,
      totalReused: this.totalReused,
      maxSize: this.maxSize,
      utilizationRate
    }
  }

  /**
   * Get all active objects (useful for debugging)
   */
  getActiveObjects(): T[] {
    return Array.from(this.activeObjects)
  }

  /**
   * Check if an object is currently active
   */
  isActive(obj: T): boolean {
    return this.activeObjects.has(obj)
  }

  /**
   * Resize the pool (can only shrink, not grow)
   */
  resize(newMaxSize: number): void {
    if (newMaxSize < this.maxSize) {
      this.maxSize = newMaxSize
      // Remove excess objects from pool
      while (this.pool.length > this.maxSize) {
        this.pool.pop()
      }
    }
  }

  /**
   * Warm up the pool by creating additional objects
   */
  warmUp(count: number): void {
    const targetSize = Math.min(this.pool.length + count, this.maxSize)
    while (this.pool.length < targetSize) {
      this.pool.push(this.createFn())
    }
  }
}

/**
 * Specialized particle object for particle effects
 */
export interface Particle extends Poolable {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  alpha: number
  scale: number
  color: string
  active: boolean
}

/**
 * Particle Pool implementation
 */
export class ParticlePool extends ObjectPool<Particle> {
  constructor(initialSize: number = 50, maxSize: number = 500) {
    super({
      initialSize,
      maxSize,
      createFn: () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0,
        alpha: 1,
        scale: 1,
        color: '#ffffff',
        active: false,
        reset() {
          this.x = 0
          this.y = 0
          this.vx = 0
          this.vy = 0
          this.life = 0
          this.maxLife = 0
          this.alpha = 1
          this.scale = 1
          this.color = '#ffffff'
          this.active = false
        }
      })
    })
  }

  /**
   * Create a particle with specific properties
   */
  createParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    color: string = '#ffffff',
    scale: number = 1
  ): Particle {
    const particle = this.acquire()
    particle.x = x
    particle.y = y
    particle.vx = vx
    particle.vy = vy
    particle.life = life
    particle.maxLife = life
    particle.color = color
    particle.scale = scale
    particle.alpha = 1
    particle.active = true
    return particle
  }

  /**
   * Update all active particles
   */
  updateParticles(deltaTime: number): void {
    const activeParticles = this.getActiveObjects()
    
    for (const particle of activeParticles) {
      if (!particle.active) continue

      // Update position
      particle.x += particle.vx * deltaTime
      particle.y += particle.vy * deltaTime

      // Update life
      particle.life -= deltaTime

      // Update alpha based on remaining life
      particle.alpha = particle.life / particle.maxLife

      // Deactivate if life is up
      if (particle.life <= 0) {
        particle.active = false
        this.release(particle)
      }
    }
  }
}

/**
 * Audio node wrapper for pooling
 */
export interface AudioNodeWrapper extends Poolable {
  node: AudioNode | null
  source: AudioBufferSourceNode | null
  gainNode: GainNode | null
  startTime: number
  duration: number
  active: boolean
}

/**
 * Audio Node Pool implementation
 */
export class AudioNodePool extends ObjectPool<AudioNodeWrapper> {
  private audioContext: AudioContext

  constructor(audioContext: AudioContext, initialSize: number = 10, maxSize: number = 50) {
    super({
      initialSize,
      maxSize,
      createFn: () => ({
        node: null,
        source: null,
        gainNode: null,
        startTime: 0,
        duration: 0,
        active: false,
        reset() {
          this.node = null
          this.source = null
          this.gainNode = null
          this.startTime = 0
          this.duration = 0
          this.active = false
        }
      })
    })
    this.audioContext = audioContext
  }

  /**
   * Create an audio node wrapper
   */
  createAudioNode(): AudioNodeWrapper {
    const wrapper = this.acquire()
    wrapper.active = true
    return wrapper
  }

  /**
   * Play audio with the pooled node
   */
  playAudio(
    buffer: AudioBuffer,
    volume: number = 1,
    loop: boolean = false
  ): AudioNodeWrapper | null {
    const wrapper = this.createAudioNode()
    
    try {
      wrapper.source = this.audioContext.createBufferSource()
      wrapper.gainNode = this.audioContext.createGain()
      
      wrapper.source.buffer = buffer
      wrapper.source.loop = loop
      wrapper.gainNode.gain.value = volume
      
      wrapper.source.connect(wrapper.gainNode)
      wrapper.gainNode.connect(this.audioContext.destination)
      
      wrapper.startTime = this.audioContext.currentTime
      wrapper.duration = buffer.duration
      
      wrapper.source.start()
      
      // Set up cleanup when audio ends
      if (!loop) {
        wrapper.source.onended = () => {
          wrapper.active = false
          this.release(wrapper)
        }
      }
      
      return wrapper
    } catch (error) {
      console.error('Error playing audio:', error)
      this.release(wrapper)
      return null
    }
  }

  /**
   * Stop and release an audio node
   */
  stopAudio(wrapper: AudioNodeWrapper): void {
    if (wrapper.source) {
      try {
        wrapper.source.stop()
      } catch (error) {
        // Audio might already be stopped
      }
    }
    wrapper.active = false
    this.release(wrapper)
  }

  /**
   * Stop all active audio nodes
   */
  stopAllAudio(): void {
    const activeNodes = this.getActiveObjects()
    for (const wrapper of activeNodes) {
      this.stopAudio(wrapper)
    }
  }
} 